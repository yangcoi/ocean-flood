/**
 * =============================================================================
 * File: src/app/api/reports/route.ts
 * Dự án: Ocean Flood — Hệ thống Cảnh báo Ngập lụt Chủ động TP.HCM
 * Phụ trách: Backend Architect (agency-backend-architect)
 * Endpoint: GET & POST /api/reports
 * Mô tả:
 *   - GET: Lấy danh sách các cụm báo cáo cộng đồng đang hoạt động (TTL <= 90 phút).
 *   - POST: Gửi báo cáo ngập mới từ hiện trường (bắt buộc qua 5 lớp kiểm duyệt:
 *     Rate Limit <= 5/giờ, Geofence GPS <= 500m, EXIF ảnh chụp <= 10 phút,
 *     Gom cụm bán kính 150m & Cộng điểm uy tín thiết bị) HOẶC bấm nút xác nhận
 *     nhanh (+1 Vẫn đang ngập / Báo nước đã rút RECEDED_0CM).
 * =============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveCrowdReports,
  processCrowdReportSubmission,
  type CreateCrowdReportInput,
  type VisualDepthChoice,
} from '@/lib/verification-engine';
import type { HcmMvpDistrict } from '@/data/hcm-spatial-seed';

const VALID_DEPTH_CHOICES: VisualDepthChoice[] = [
  'WHEEL_15CM',
  'EXHAUST_30CM',
  'SEAT_50CM',
  'RECEDED_0CM',
];

export async function GET() {
  const reports = getActiveCrowdReports();
  return NextResponse.json(
    {
      count: reports.length,
      updated_at: new Date().toISOString(),
      reports,
    },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const visualChoiceRaw = String(
      body?.visual_depth_choice || 'EXHAUST_30CM'
    ).toUpperCase() as VisualDepthChoice;

    const visualDepthChoice: VisualDepthChoice = VALID_DEPTH_CHOICES.includes(
      visualChoiceRaw
    )
      ? visualChoiceRaw
      : 'EXHAUST_30CM';

    const payload: CreateCrowdReportInput = {
      action: body?.action || (visualDepthChoice === 'RECEDED_0CM' ? 'REPORT_RECEDED' : 'CREATE'),
      report_id: body?.report_id ? String(body.report_id) : undefined,
      hotspot_id: body?.hotspot_id ? String(body.hotspot_id) : undefined,
      device_hash: String(body?.device_hash || ''),
      user_gps: {
        lat: Number(body?.user_gps?.lat),
        lng: Number(body?.user_gps?.lng),
        accuracy_m:
          body?.user_gps?.accuracy_m !== undefined
            ? Number(body.user_gps.accuracy_m)
            : 20,
      },
      target_gps: {
        lat: Number(body?.target_gps?.lat),
        lng: Number(body?.target_gps?.lng),
      },
      address_text: body?.address_text ? String(body.address_text) : undefined,
      district: body?.district as HcmMvpDistrict | undefined,
      visual_depth_choice: visualDepthChoice,
      exif_captured_at: body?.exif_captured_at
        ? String(body.exif_captured_at)
        : undefined,
      photo_base64_webp: body?.photo_base64_webp
        ? String(body.photo_base64_webp)
        : undefined,
      note: body?.note ? String(body.note) : undefined,
      is_active_weather_hotspot:
        typeof body?.is_active_weather_hotspot === 'boolean'
          ? body.is_active_weather_hotspot
          : true,
    };

    const outcome = processCrowdReportSubmission(payload);

    return NextResponse.json(outcome, {
      status: outcome.http_status,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Invalid JSON payload';
    return NextResponse.json(
      {
        accepted: false,
        http_status: 422,
        error_code: 'INVALID_PAYLOAD',
        message:
          'Dữ liệu gửi lên không đúng định dạng JSON. Vui lòng kiểm tra lại thông tin tọa độ GPS và ảnh chụp.',
        detail: errMsg,
        layers: [],
      },
      { status: 422 }
    );
  }
}

/**
 * =============================================================================
 * TỔNG KẾT THEO QUY TẮC DỰ ÁN (docs/RULES.md)
 * =============================================================================
 * 1. Quyết định đã chốt:
 *    - Endpoint `POST /api/reports` trả về mã trạng thái chuẩn HTTP (`201 Created`,
 *      `200 OK`, `422 Unprocessable Entity` khi vi phạm Geofence 500m / EXIF 10 phút,
 *      hoặc `429 Too Many Requests` khi vượt Rate Limit 5 báo cáo/giờ) kèm mảng
 *      `layers` giải thích chi tiết từng bước kiểm duyệt cho người dùng.
 * 2. Câu hỏi mở cho chủ dự án:
 *    - Không có.
 * 3. Chuyển giao / Rủi ro:
 *    - Sẵn sàng tích hợp với `ReportModal` trên giao diện PWA.
 */
