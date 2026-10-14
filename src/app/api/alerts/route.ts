/**
 * =============================================================================
 * File: src/app/api/alerts/route.ts
 * Dự án: Ocean Flood — Hệ thống Cảnh báo Ngập lụt Chủ động TP.HCM
 * Phụ trách: Backend Architect (agency-backend-architect)
 * Endpoint: GET /api/alerts
 * Mô tả:
 *   Trả về chuẩn GeoJSON FeatureCollection gồm 18 điểm đen ngập + dự báo 1–3h tới
 *   (kèm Ngôn ngữ cảnh báo kép cho Xe máy & Ô tô), danh sách 18 Camera TTGT,
 *   báo cáo cộng đồng đã kiểm duyệt và metadata mưa/triều trạm Phú An & Nhà Bè.
 *   Hỗ trợ query:
 *     - `?scenario=peak_tide_rain` | `live` | `heavy_rain_only` | `dry_safe`
 *     - `?district=Bình Thạnh` | `Quận 7` | `Quận 8` | `TP. Thủ Đức` | `ALL`
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  TRAFFIC_CAMERAS_SEED,
  HCM_MVP_DISTRICTS_META,
  type HcmMvpDistrict,
} from '@/data/hcm-spatial-seed';
import {
  generateAllHotspotForecasts,
  type ForecastScenario,
} from '@/lib/forecast-engine';
import {
  getActiveCrowdReports,
  getCrowdStatsByHotspotId,
} from '@/lib/verification-engine';

const SCENARIO_ALIASES: Record<string, ForecastScenario> = {
  live: 'live',
  peak_tide_rain: 'peak_tide_rain',
  heavy_rain_only: 'heavy_rain_only',
  local_heavy_rain: 'heavy_rain_only',
  dry_safe: 'dry_safe',
  dry_sunny: 'dry_safe',
};

const VALID_DISTRICTS: (HcmMvpDistrict | 'ALL')[] = [
  'ALL',
  'Bình Thạnh',
  'Quận 7',
  'Quận 8',
  'TP. Thủ Đức',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Mặc định sử dụng kịch bản `live` (Open-Meteo API thực tế + Mô hình triều cường)
    const rawScenario = (searchParams.get('scenario') || 'live').trim().toLowerCase();
    const scenario: ForecastScenario = SCENARIO_ALIASES[rawScenario] || 'live';

    const rawDistrict = (searchParams.get('district') || 'ALL').trim();
    const districtFilter: HcmMvpDistrict | 'ALL' =
      rawDistrict.toLowerCase() === 'all'
        ? 'ALL'
        : VALID_DISTRICTS.includes(rawDistrict as HcmMvpDistrict)
          ? (rawDistrict as HcmMvpDistrict)
          : 'ALL';

    const crowdStatsByHotspotId =
      scenario === 'dry_safe' ? {} : getCrowdStatsByHotspotId();
    const activeCrowdReports =
      scenario === 'dry_safe' ? [] : getActiveCrowdReports();

    const { conditions, features } = await generateAllHotspotForecasts({
      scenario,
      districtFilter,
      crowdStatsByHotspotId,
    });

    const filteredCameras =
      districtFilter === 'ALL'
        ? TRAFFIC_CAMERAS_SEED
        : TRAFFIC_CAMERAS_SEED.filter((c) => c.district === districtFilter);

    const filteredCrowdReports =
      districtFilter === 'ALL'
        ? activeCrowdReports
        : activeCrowdReports.filter((r) => r.district === districtFilter);

    const highRiskCount = features.filter((f) => f.properties.severity_level >= 2).length;
    const moderateRiskCount = features.filter((f) => f.properties.severity_level === 1).length;
    const verifiedHotspotsCount = features.filter(
      (f) => f.properties.confirm_count > 0 || f.properties.verification_status === 'VERIFIED'
    ).length;
    const forecastOnlyHotspotsCount = features.filter(
      (f) =>
        f.properties.severity_level >= 1 &&
        f.properties.confirm_count === 0 &&
        f.properties.verification_status !== 'VERIFIED'
    ).length;

    const responsePayload = {
      type: 'FeatureCollection' as const,
      metadata: {
        scenario: conditions.scenario,
        updated_at: conditions.updated_at,
        is_fallback_weather: conditions.is_fallback_weather,
        weather_source_label: conditions.weather_source_label,
        district_filter: districtFilter,
        district_meta: HCM_MVP_DISTRICTS_META[districtFilter],
        summary_counts: {
          total_hotspots: features.length,
          high_risk_hotspots: highRiskCount,
          moderate_risk_hotspots: moderateRiskCount,
          verified_hotspots: verifiedHotspotsCount,
          forecast_only_hotspots: forecastOnlyHotspotsCount,
          active_crowd_reports: filteredCrowdReports.length,
          total_cameras: filteredCameras.length,
        },
        tide_station_phu_an: conditions.tide_station_phu_an,
        tide_station_nha_be: conditions.tide_station_nha_be,
        district_rainfall: conditions.district_rainfall,
        safety_disclaimer:
          'Dữ liệu dự báo trước 1–3h mang tính chất tham khảo hỗ trợ quyết định di chuyển, được tổng hợp từ Open-Meteo, Đài KTTV Nam Bộ và báo cáo cộng đồng tại hiện trường. Người tham gia giao thông cần quan sát biển báo và tình hình thực tế.',
      },
      features,
      crowd_reports: filteredCrowdReports,
      cameras: filteredCameras,
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'INTERNAL_FORECAST_ERROR',
        message: 'Không thể tải dữ liệu cảnh báo ngập lúc này. Vui lòng thử lại sau ít giây.',
        detail: errMsg,
      },
      { status: 500 }
    );
  }
}

/**
 * =============================================================================
 * TỔNG KẾT THEO QUY TẮC DỰ ÁN (docs/RULES.md)
 * =============================================================================
 * 1. Quyết định đã chốt:
 *    - Trả về đầy đủ `FeatureCollection` chuẩn GeoJSON (EPSG:4326) cùng `metadata`
 *      mưa/triều, `crowd_reports` và `cameras` trong 1 HTTP request duy nhất để
 *      tối ưu tốc độ tải < 3s trên mạng 4G di động.
 * 2. Câu hỏi mở cho chủ dự án:
 *    - Không có.
 * 3. Chuyển giao / Rủi ro:
 *    - Sẵn sàng cho Frontend MapLibre GL JS và bộ thẻ Ngôn ngữ kép tiêu thụ.
 */
