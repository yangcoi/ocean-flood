/**
 * =============================================================================
 * File: src/app/api/route-plan/route.ts
 * Dự án: Ocean Flood — Hệ thống Cảnh báo Ngập lụt Chủ động TP.HCM
 * Phụ trách: Backend Architect (agency-backend-architect)
 * Endpoint: POST /api/route-plan
 * Mô tả:
 *   Tìm lộ trình tránh ngập chuyên biệt cho Xe máy (`motorcycle`, ngưỡng >= 20cm)
 *   và Ô tô (`car`, ngưỡng >= 25cm, chỉ đi trục đường lớn đủ làn, cấm vào hẻm nhỏ).
 *   Trả về cả lộ trình ngắn nhất bị ngập (`direct_flooded_route`) lẫn lộ trình
 *   thay thế ít rủi ro ngập (`recommended_safe_route`) kèm danh sách cảnh báo kép.
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  computeFloodAwareRoutePlan,
  type VehicleType,
} from '@/lib/routing-engine';
import type { ForecastScenario } from '@/lib/forecast-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const originLat = Number(body?.origin?.lat);
    const originLng = Number(body?.origin?.lng);
    const destLat = Number(body?.destination?.lat);
    const destLng = Number(body?.destination?.lng);

    if (
      !Number.isFinite(originLat) ||
      !Number.isFinite(originLng) ||
      !Number.isFinite(destLat) ||
      !Number.isFinite(destLng)
    ) {
      return NextResponse.json(
        {
          error: 'INVALID_WAYPOINTS',
          message:
            'Tọa độ Điểm đi (origin) và Điểm đến (destination) phải là số thực hợp lệ chuẩn WGS84 (lat, lng).',
        },
        { status: 422 }
      );
    }

    const vehicleType: VehicleType =
      body?.vehicle_type === 'car' ? 'car' : 'motorcycle';

    const SCENARIO_ALIASES: Record<string, ForecastScenario> = {
      live: 'live',
      peak_tide_rain: 'peak_tide_rain',
      heavy_rain_only: 'heavy_rain_only',
      local_heavy_rain: 'heavy_rain_only',
      dry_safe: 'dry_safe',
      dry_sunny: 'dry_safe',
    };
    const rawScenario = String(body?.scenario || 'peak_tide_rain').trim().toLowerCase();
    const scenario: ForecastScenario = SCENARIO_ALIASES[rawScenario] || 'peak_tide_rain';

    const result = await computeFloodAwareRoutePlan({
      origin: {
        lat: originLat,
        lng: originLng,
        label: body?.origin?.label ? String(body.origin.label) : undefined,
      },
      destination: {
        lat: destLat,
        lng: destLng,
        label: body?.destination?.label
          ? String(body.destination.label)
          : undefined,
      },
      vehicle_type: vehicleType,
      departure_time: body?.departure_time
        ? String(body.departure_time)
        : 'now',
      scenario,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Route planning error';
    return NextResponse.json(
      {
        error: 'ROUTE_PLANNING_FAILED',
        message:
          'Không thể tính toán lộ trình tránh ngập lúc này. Vui lòng kiểm tra lại điểm đi và điểm đến.',
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
 *    - Endpoint `POST /api/route-plan` kiểm tra tính hợp lệ của tọa độ đầu/cuối,
 *      phân nhánh chính sách điều hướng theo `vehicle_type` (`motorcycle` vs `car`)
 *      và trả về song song 2 lộ trình (`direct_flooded_route` & `recommended_safe_route`)
 *      để vẽ trực tiếp lên bản đồ MapLibre GL JS.
 * 2. Câu hỏi mở cho chủ dự án:
 *    - Không có.
 * 3. Chuyển giao / Rủi ro:
 *    - Sẵn sàng tích hợp với thanh `RoutePlanner` trên giao diện người dùng.
 */
