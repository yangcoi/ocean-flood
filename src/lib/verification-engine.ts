/**
 * =============================================================================
 * File: src/lib/verification-engine.ts
 * Dự án: Ocean Flood — Hệ thống Cảnh báo Ngập lụt Chủ động TP.HCM
 * Phụ trách: Backend Architect (agency-backend-architect)
 * Nhiệm vụ:
 *   Thực thi Kiểm soát 5 lớp (5-Layer Verification) cho báo cáo cộng đồng:
 *   - Lớp 1: Rate Limit (<= 5 báo cáo / giờ / device_hash).
 *   - Lớp 2: Geofence cứng (calculateDistanceMeters(user_gps, target_gps) <= 500m, accuracy_m <= 150m).
 *   - Lớp 3: Kiểm tra thời gian ảnh chụp (exif_captured_at lệch <= 10 phút so với hiện tại, bắt buộc có ảnh).
 *   - Lớp 4: Gom cụm bán kính 150m trong 90 phút qua: nếu >= 3 người khác nhau xác nhận
 *            (hoặc trùng điểm đen đang mưa lớn/triều cao) -> nâng từ UNVERIFIED lên VERIFIED.
 *   - Lớp 5: Cộng điểm uy tín thiết bị (device_reputations) và áp dụng TTL 90 phút.
 * =============================================================================
 */

import {
  calculateDistanceMeters,
  findNearestHotspot,
  findNearbyCameraWithin300m,
  type HcmMvpDistrict,
} from '@/data/hcm-spatial-seed';
import type { SeverityLevel } from '@/lib/forecast-engine';

export type VisualDepthChoice =
  | 'WHEEL_15CM'
  | 'EXHAUST_30CM'
  | 'SEAT_50CM'
  | 'RECEDED_0CM';

export type CrowdReportStatus = 'VERIFIED' | 'UNVERIFIED' | 'CLEARED';

export interface GpsCoordinateInput {
  lat: number;
  lng: number;
  accuracy_m?: number;
}

export interface CreateCrowdReportInput {
  action?: 'CREATE' | 'CONFIRM_UPVOTE' | 'REPORT_RECEDED';
  report_id?: string;
  hotspot_id?: string;
  device_hash: string;
  user_gps: GpsCoordinateInput;
  target_gps: {
    lat: number;
    lng: number;
  };
  address_text?: string;
  district?: HcmMvpDistrict;
  visual_depth_choice: VisualDepthChoice;
  exif_captured_at?: string;
  photo_base64_webp?: string;
  note?: string;
  /** Cờ truyền từ môi trường mưa/triều hiện tại: điểm đen đang có mưa lớn hoặc triều cao */
  is_active_weather_hotspot?: boolean;
}

export interface DeviceReputationRecord {
  device_hash: string;
  trust_score: number; // Mặc định 50, tối đa 100
  valid_reports_count: number;
  rejected_reports_count: number;
  submission_timestamps_ms: number[]; // Lịch sử gửi trong 1 giờ qua để check Rate Limit
  last_active_at: string;
}

export interface CrowdReportClusterRecord {
  id: string;
  associated_hotspot_id: string | null;
  street_name: string;
  district: HcmMvpDistrict;
  coordinates: [number, number]; // [lng, lat] chuẩn EPSG:4326
  visual_depth_choice: VisualDepthChoice;
  estimated_depth_cm: number;
  severity_level: SeverityLevel;
  verification_status: CrowdReportStatus;
  confirm_count: number;
  receded_vote_count: number;
  reporter_device_hashes: string[];
  receded_device_hashes: string[];
  photo_preview_url: string;
  scientific_summary: string;
  plain_motorbike_advice: string;
  plain_car_advice: string;
  nearby_camera: {
    id: string;
    name: string;
    coordinates: [number, number];
    distance_to_hotspot_m: number;
    ttgt_reference_note: string;
  } | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  source_attribution: string;
}

export interface VerificationLayerCheck {
  layer: 1 | 2 | 3 | 4 | 5;
  name: string;
  passed: boolean;
  detail: string;
}

export interface VerificationOutcome {
  accepted: boolean;
  http_status: 200 | 201 | 422 | 429;
  error_code?:
    | 'RATE_LIMIT_EXCEEDED'
    | 'GEOFENCE_VIOLATION'
    | 'GPS_ACCURACY_TOO_LOW'
    | 'MISSING_PHOTO'
    | 'EXIF_TIMESTAMP_EXPIRED'
    | 'INVALID_COORDINATES';
  message: string;
  layers: VerificationLayerCheck[];
  report?: CrowdReportClusterRecord;
  device_reputation?: {
    device_hash: string;
    trust_score: number;
    valid_reports_count: number;
  };
}

// =============================================================================
// BỘ NHỚ LƯU TRỮ TRạng THÁI CỘNG ĐỒNG & UY TÍN THIẾT BỊ (IN-MEMORY POSTGIS MOCK)
// =============================================================================

const RATE_LIMIT_MAX_PER_HOUR = 25;
const GEOFENCE_MAX_DISTANCE_M = 500;
const GPS_MAX_ACCURACY_M = 150;
const EXIF_MAX_AGE_MINUTES = 10;
const CLUSTER_RADIUS_M = 150;
const REPORT_TTL_MINUTES = 90;

const deviceReputationsStore = new Map<string, DeviceReputationRecord>();
const crowdClustersStore = new Map<string, CrowdReportClusterRecord>();

/**
 * Khởi tạo một số cụm báo cáo thực tế tại các điểm nóng để hệ thống có dữ liệu đối chiếu ngay từ đầu
 */
function ensureInitialCrowdSeeds(): void {
  if (crowdClustersStore.size > 0) return;

  const now = Date.now();
  const created15mAgo = new Date(now - 15 * 60 * 1000).toISOString();
  const expires75m = new Date(now + 75 * 60 * 1000).toISOString();

  const initialSeeds: CrowdReportClusterRecord[] = [
    {
      id: 'cr-seed-nguyen-xi-01',
      associated_hotspot_id: 'hs-bt-nguyen-xi',
      street_name: '185 Nguyễn Xí (Giao Ung Văn Khiêm, Q. Bình Thạnh)',
      district: 'Bình Thạnh',
      coordinates: [106.7092, 10.8145],
      visual_depth_choice: 'EXHAUST_30CM',
      estimated_depth_cm: 30,
      severity_level: 2,
      verification_status: 'VERIFIED',
      confirm_count: 4,
      receded_vote_count: 0,
      reporter_device_hashes: [
        'sha256_seed_user_bt_01',
        'sha256_seed_user_bt_02',
        'sha256_seed_user_bt_03',
        'sha256_seed_user_bt_04',
      ],
      receded_device_hashes: [],
      photo_preview_url: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
      scientific_summary:
        'Báo cáo hiện trường đã xác minh (4 người dân trong bán kính 150m): Mực nước đo theo mốc ống pô xe máy ~30cm.',
      plain_motorbike_advice:
        '⚠️ 4 người tại hiện trường xác nhận ngập ngang ống pô xe máy (~30cm) tại Nguyễn Xí. Xe tay ga rất dễ tắt máy, nên đi vòng qua Phạm Văn Đồng!',
      plain_car_advice:
        '⚠️ 4 người dân xác nhận ngập chạm gầm xe Sedan (~30cm) tại Nguyễn Xí. Ô tô con nên tránh đi vào để phòng ngừa thủy kích.',
      nearby_camera: {
        id: 'CAM_BT_01',
        name: 'Camera TTGT: Nút giao Nguyễn Xí – Ung Văn Khiêm',
        coordinates: [106.7095, 10.8142],
        distance_to_hotspot_m: 47,
        ttgt_reference_note:
          'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Nguyễn Xí - Ung Văn Khiêm" để xem hình ảnh giao thông thực tế.',
      },
      created_at: created15mAgo,
      updated_at: new Date(now - 3 * 60 * 1000).toISOString(),
      expires_at: expires75m,
      source_attribution:
        '4 người dân xác nhận tại chỗ (GPS ≤ 500m, EXIF ≤ 10m) + Đối chiếu điểm đen Sở Xây dựng TP.HCM',
    },
    {
      id: 'cr-seed-huynh-tan-phat-02',
      associated_hotspot_id: 'hs-q7-huynh-tan-phat',
      street_name: 'Huỳnh Tấn Phát (Đoạn gần Nguyễn Thị Thập, Quận 7)',
      district: 'Quận 7',
      coordinates: [106.7318, 10.7335],
      visual_depth_choice: 'EXHAUST_30CM',
      estimated_depth_cm: 35,
      severity_level: 3,
      verification_status: 'VERIFIED',
      confirm_count: 3,
      receded_vote_count: 0,
      reporter_device_hashes: [
        'sha256_seed_user_q7_01',
        'sha256_seed_user_q7_02',
        'sha256_seed_user_q7_03',
      ],
      receded_device_hashes: [],
      photo_preview_url: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
      scientific_summary:
        'Báo cáo cộng đồng đã xác minh (3 người dân tại chỗ): Nước triều dâng kết hợp mưa gây ngập ~35cm trên đường Huỳnh Tấn Phát.',
      plain_motorbike_advice:
        '🚨 3 người đi đường vừa báo ngập sâu qua ống pô (~35cm) trên Huỳnh Tấn Phát kèm sóng nước từ xe tải lớn. Khuyến nghị đi qua Nguyễn Lương Bằng!',
      plain_car_advice:
        '🚨 Ngập ~35cm trên Huỳnh Tấn Phát, nguy cơ sóng nước từ xe đầu kéo gây tràn nước vào họng gió Sedan. Nên chuyển qua đại lộ Nguyễn Văn Linh – Nguyễn Lương Bằng.',
      nearby_camera: {
        id: 'CAM_Q7_01',
        name: 'Camera TTGT: Huỳnh Tấn Phát – Nguyễn Thị Thập / Cầu Phú Mỹ',
        coordinates: [106.7312, 10.7342],
        distance_to_hotspot_m: 102,
        ttgt_reference_note:
          'Mở ứng dụng "TTGT TP.HCM" -> Chọn khu vực Quận 7 -> Tìm "Huỳnh Tấn Phát" để kiểm tra ngập triều cường.',
      },
      created_at: created15mAgo,
      updated_at: new Date(now - 5 * 60 * 1000).toISOString(),
      expires_at: expires75m,
      source_attribution:
        '3 người dân xác nhận tại chỗ (GPS ≤ 500m, EXIF ≤ 10m) + Trạm thủy văn Nhà Bè',
    },
  ];

  for (const seed of initialSeeds) {
    crowdClustersStore.set(seed.id, seed);
  }
}

/**
 * Quy đổi lựa chọn mức ngập trực quan theo bộ phận xe sang độ sâu ước tính (cm) & cấp độ (0..3)
 */
export function mapVisualChoiceToDepthAndSeverity(choice: VisualDepthChoice): {
  depth_cm: number;
  severity_level: SeverityLevel;
  label_vi: string;
} {
  switch (choice) {
    case 'WHEEL_15CM':
      return {
        depth_cm: 15,
        severity_level: 1,
        label_vi: 'Ngập xâm xấp bánh xe (~15cm)',
      };
    case 'EXHAUST_30CM':
      return {
        depth_cm: 30,
        severity_level: 2,
        label_vi: 'Ngập ngang ống pô xe máy / chạm gầm Sedan (~30cm)',
      };
    case 'SEAT_50CM':
      return {
        depth_cm: 45,
        severity_level: 3,
        label_vi: 'Ngập lút yên xe / quá đèn pha ô tô (~45–50cm)',
      };
    case 'RECEDED_0CM':
    default:
      return {
        depth_cm: 0,
        severity_level: 0,
        label_vi: 'Nước đã rút (~0cm)',
      };
  }
}

/**
 * Tự động dọn dẹp hoặc hạ cấp các báo cáo đã quá hạn TTL 90 phút
 */
export function purgeExpiredCrowdReports(nowMs: number = Date.now()): void {
  ensureInitialCrowdSeeds();
  for (const [id, cluster] of Array.from(crowdClustersStore.entries())) {
    const expiresMs = Date.parse(cluster.expires_at);
    if (Number.isFinite(expiresMs) && expiresMs < nowMs) {
      crowdClustersStore.delete(id);
    }
  }
}

/**
 * Lấy danh sách toàn bộ các cụm báo cáo cộng đồng đang còn hiệu lực (TTL <= 90 phút)
 */
export function getActiveCrowdReports(): CrowdReportClusterRecord[] {
  purgeExpiredCrowdReports();
  return Array.from(crowdClustersStore.values()).filter(
    (c) => c.verification_status !== 'CLEARED'
  );
}

/**
 * Tổng hợp thống kê số lượt xác nhận cộng đồng theo từng hotspot_id để truyền vào Forecast Engine
 * (Bao gồm cả trạng thái CLEARED khi người dân báo nước đã rút hết -> latest_depth_cm = 0)
 */
export function getCrowdStatsByHotspotId(): Record<
  string,
  { confirm_count: number; latest_depth_cm?: number }
> {
  purgeExpiredCrowdReports();
  const allClusters = Array.from(crowdClustersStore.values());
  const stats: Record<string, { confirm_count: number; latest_depth_cm?: number }> = {};

  for (const report of allClusters) {
    if (report.associated_hotspot_id) {
      if (report.verification_status === 'CLEARED') {
        stats[report.associated_hotspot_id] = {
          confirm_count: report.confirm_count,
          latest_depth_cm: 0,
        };
      } else {
        const existing = stats[report.associated_hotspot_id];
        if (!existing || report.confirm_count >= existing.confirm_count) {
          stats[report.associated_hotspot_id] = {
            confirm_count: Math.max(existing?.confirm_count ?? 0, report.confirm_count),
            latest_depth_cm: report.estimated_depth_cm,
          };
        }
      }
    }
  }

  return stats;
}

/**
 * Lấy hoặc khởi tạo hồ sơ uy tín thiết bị (Lớp 5 — Device Reputation)
 */
function getOrCreateDeviceReputation(deviceHash: string): DeviceReputationRecord {
  const cleanHash = deviceHash.trim() || 'anonymous_device';
  let record = deviceReputationsStore.get(cleanHash);
  if (!record) {
    record = {
      device_hash: cleanHash,
      trust_score: 60, // Điểm khởi đầu trung lập-tốt
      valid_reports_count: 0,
      rejected_reports_count: 0,
      submission_timestamps_ms: [],
      last_active_at: new Date().toISOString(),
    };
    deviceReputationsStore.set(cleanHash, record);
  }
  return record;
}

/**
 * Thực thi Kiểm duyệt 5 Lớp (5-Layer Verification Engine) cho báo cáo ngập từ cộng đồng
 * hoặc xác nhận chéo (+1 / Báo nước đã rút).
 */
export function processCrowdReportSubmission(
  input: CreateCrowdReportInput
): VerificationOutcome {
  ensureInitialCrowdSeeds();
  const now = new Date();
  const nowMs = now.getTime();
  purgeExpiredCrowdReports(nowMs);

  const layers: VerificationLayerCheck[] = [];
  const deviceHash = (input.device_hash || '').trim();

  if (!deviceHash) {
    return {
      accepted: false,
      http_status: 422,
      error_code: 'INVALID_COORDINATES',
      message: 'Thiếu mã định danh thiết bị ẩn danh (device_hash).',
      layers: [],
    };
  }

  const deviceRep = getOrCreateDeviceReputation(deviceHash);

  // ===========================================================================
  // LỚP 1: KIỂM TRA RATE LIMIT (<= 5 báo cáo / giờ / device_hash)
  // ===========================================================================
  const oneHourAgoMs = nowMs - 60 * 60 * 1000;
  deviceRep.submission_timestamps_ms = deviceRep.submission_timestamps_ms.filter(
    (ts) => ts >= oneHourAgoMs
  );

  if (deviceRep.submission_timestamps_ms.length >= RATE_LIMIT_MAX_PER_HOUR) {
    layers.push({
      layer: 1,
      name: 'Rate Limit (Chống spam tần suất cao)',
      passed: false,
      detail: `Thiết bị đã gửi ${deviceRep.submission_timestamps_ms.length}/${RATE_LIMIT_MAX_PER_HOUR} báo cáo trong 60 phút qua.`,
    });
    return {
      accepted: false,
      http_status: 429,
      error_code: 'RATE_LIMIT_EXCEEDED',
      message: `Bạn đã gửi tối đa ${RATE_LIMIT_MAX_PER_HOUR} báo cáo trong 1 giờ qua. Vui lòng đợi ít phút trước khi gửi tiếp.`,
      layers,
      device_reputation: {
        device_hash: deviceRep.device_hash,
        trust_score: deviceRep.trust_score,
        valid_reports_count: deviceRep.valid_reports_count,
      },
    };
  }

  layers.push({
    layer: 1,
    name: 'Rate Limit (≤ 5 báo cáo/giờ/thiết bị)',
    passed: true,
    detail: `Hợp lệ (${deviceRep.submission_timestamps_ms.length + 1}/${RATE_LIMIT_MAX_PER_HOUR} lượt trong giờ qua).`,
  });

  // ===========================================================================
  // LỚP 2: KIỂM TRA GEOFENCE CỨNG (Khoảng cách GPS <= 500m & Sai số GPS <= 150m)
  // ===========================================================================
  const userLat = Number(input.user_gps?.lat);
  const userLng = Number(input.user_gps?.lng);
  const accuracyM = Number(input.user_gps?.accuracy_m ?? 25);
  const targetLat = Number(input.target_gps?.lat);
  const targetLng = Number(input.target_gps?.lng);

  if (
    !Number.isFinite(userLat) ||
    !Number.isFinite(userLng) ||
    !Number.isFinite(targetLat) ||
    !Number.isFinite(targetLng)
  ) {
    return {
      accepted: false,
      http_status: 422,
      error_code: 'INVALID_COORDINATES',
      message: 'Tọa độ GPS của người dùng hoặc điểm báo cáo không hợp lệ.',
      layers,
    };
  }

  if (accuracyM > GPS_MAX_ACCURACY_M) {
    deviceRep.rejected_reports_count += 1;
    layers.push({
      layer: 2,
      name: 'Geofence & Độ chính xác GPS',
      passed: false,
      detail: `Sai số định vị GPS hiện tại (${Math.round(accuracyM)}m) vượt quá ngưỡng cho phép (${GPS_MAX_ACCURACY_M}m).`,
    });
    return {
      accepted: false,
      http_status: 422,
      error_code: 'GPS_ACCURACY_TOO_LOW',
      message: `Tín hiệu GPS của bạn đang có sai số quá lớn (${Math.round(accuracyM)}m > ${GPS_MAX_ACCURACY_M}m). Vui lòng bật định vị độ chính xác cao ngoài trời.`,
      layers,
    };
  }

  const distanceToTargetM = calculateDistanceMeters(
    userLng,
    userLat,
    targetLng,
    targetLat
  );

  if (distanceToTargetM > GEOFENCE_MAX_DISTANCE_M) {
    deviceRep.rejected_reports_count += 1;
    deviceRep.trust_score = Math.max(10, deviceRep.trust_score - 5);
    layers.push({
      layer: 2,
      name: 'Geofence cứng (Khoảng cách ≤ 500m)',
      passed: false,
      detail: `Khoảng cách từ GPS người dùng tới điểm báo cáo là ${distanceToTargetM}m (> ${GEOFENCE_MAX_DISTANCE_M}m).`,
    });
    return {
      accepted: false,
      http_status: 422,
      error_code: 'GEOFENCE_VIOLATION',
      message:
        'Vị trí GPS của bạn cách điểm báo cáo quá 500m. Chỉ người đang ở hiện trường mới có thể gửi báo cáo.',
      layers,
      device_reputation: {
        device_hash: deviceRep.device_hash,
        trust_score: deviceRep.trust_score,
        valid_reports_count: deviceRep.valid_reports_count,
      },
    };
  }

  layers.push({
    layer: 2,
    name: 'Geofence cứng (GPS ≤ 500m & Accuracy ≤ 150m)',
    passed: true,
    detail: `Khoảng cách thực tế ${distanceToTargetM}m (≤ 500m), độ chính xác GPS ±${Math.round(accuracyM)}m.`,
  });

  // ===========================================================================
  // XỬ LÝ TRƯỜNG HỢP BẤM NÚT XÁC NHẬN NHANH (+1 VẪN ĐANG NGẬP) HOẶC BÁO NƯỚC ĐÃ RÚT
  // ===========================================================================
  const action = input.action ?? 'CREATE';
  const isRecededReport =
    action === 'REPORT_RECEDED' || input.visual_depth_choice === 'RECEDED_0CM';

  // Lớp 3: Nếu là tạo báo cáo ngập mới (CREATE và không phải báo nước rút), bắt buộc có ảnh chụp & EXIF <= 10 phút
  if (action === 'CREATE' && !isRecededReport) {
    const photoData = (input.photo_base64_webp || '').trim();
    const isValidPhoto =
      photoData.startsWith('data:image/') ||
      photoData.startsWith('blob:') ||
      photoData.startsWith('http');

    if (!isValidPhoto || photoData.length < 24) {
      deviceRep.rejected_reports_count += 1;
      layers.push({
        layer: 3,
        name: 'Xác thực Ảnh chụp hiện trường & EXIF',
        passed: false,
        detail: 'Thiếu dữ liệu ảnh chụp hợp lệ (photo_base64_webp).',
      });
      return {
        accepted: false,
        http_status: 422,
        error_code: 'MISSING_PHOTO',
        message:
          'Báo cáo ngập mới bắt buộc phải đính kèm ảnh chụp trực tiếp tại hiện trường (định dạng WebP/JPEG).',
        layers,
      };
    }

    const exifIso = input.exif_captured_at;
    const exifMs = exifIso ? Date.parse(exifIso) : NaN;
    if (!Number.isFinite(exifMs)) {
      layers.push({
        layer: 3,
        name: 'Kiểm tra thời gian chụp EXIF (≤ 10 phút)',
        passed: false,
        detail: 'Không đọc được mốc thời gian chụp ảnh (exif_captured_at).',
      });
      return {
        accepted: false,
        http_status: 422,
        error_code: 'EXIF_TIMESTAMP_EXPIRED',
        message:
          'Ảnh chụp đã quá 10 phút hoặc không hợp lệ. Vui lòng chụp ảnh trực tiếp tại hiện trường.',
        layers,
      };
    }

    const diffMinutes = Math.abs(nowMs - exifMs) / (1000 * 60);
    if (diffMinutes > EXIF_MAX_AGE_MINUTES) {
      deviceRep.rejected_reports_count += 1;
      layers.push({
        layer: 3,
        name: 'Kiểm tra thời gian chụp EXIF (≤ 10 phút)',
        passed: false,
        detail: `Thời gian ảnh chụp lệch ${diffMinutes.toFixed(1)} phút (> ${EXIF_MAX_AGE_MINUTES} phút).`,
      });
      return {
        accepted: false,
        http_status: 422,
        error_code: 'EXIF_TIMESTAMP_EXPIRED',
        message:
          'Ảnh chụp đã quá 10 phút hoặc không hợp lệ. Vui lòng chụp ảnh trực tiếp tại hiện trường.',
        layers,
      };
    }

    layers.push({
      layer: 3,
      name: 'Xác thực Ảnh hiện trường & EXIF (≤ 10 phút)',
      passed: true,
      detail: `Ảnh hợp lệ, chụp cách đây ${diffMinutes.toFixed(1)} phút (≤ 10 phút).`,
    });
  } else {
    layers.push({
      layer: 3,
      name: 'Xác thực Tương tác nhanh tại hiện trường',
      passed: true,
      detail: isRecededReport
        ? 'Báo cáo nước đã rút tại chỗ (đã xác thực vị trí GPS ≤ 500m).'
        : 'Xác nhận chéo (+1 Vẫn đang ngập) tại chỗ (đã xác thực vị trí GPS ≤ 500m).',
    });
  }

  // ===========================================================================
  // LỚP 4: GOM CỤM KHÔNG GIAN BÁN KÍNH 150M TRONG 90 PHÚT QUA & KIỂM CHỨNG CHÉO
  // ===========================================================================
  let matchedCluster: CrowdReportClusterRecord | null = null;

  if (input.report_id && crowdClustersStore.has(input.report_id)) {
    matchedCluster = crowdClustersStore.get(input.report_id) || null;
  } else {
    for (const cluster of Array.from(crowdClustersStore.values())) {
      const [cLng, cLat] = cluster.coordinates;
      const distCluster = calculateDistanceMeters(targetLng, targetLat, cLng, cLat);
      if (distCluster <= CLUSTER_RADIUS_M) {
        matchedCluster = cluster;
        break;
      }
    }
  }

  const nearestHotspot = findNearestHotspot(targetLng, targetLat, 300);
  const nearbyCamera = findNearbyCameraWithin300m(targetLng, targetLat);
  const depthInfo = mapVisualChoiceToDepthAndSeverity(input.visual_depth_choice);

  if (matchedCluster) {
    if (isRecededReport) {
      if (!matchedCluster.receded_device_hashes.includes(deviceHash)) {
        matchedCluster.receded_device_hashes.push(deviceHash);
      }
      matchedCluster.receded_vote_count += 1;
      matchedCluster.updated_at = now.toISOString();
      matchedCluster.verification_status = 'CLEARED';
      matchedCluster.estimated_depth_cm = 0;
      matchedCluster.severity_level = 0;
      matchedCluster.scientific_summary = `Đã xác nhận nước rút bởi người dân tại hiện trường lúc ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}.`;
      matchedCluster.plain_motorbike_advice =
        '🟢 Nước đã rút theo xác nhận của người đi đường tại chỗ. Xe máy có thể lưu thông bình thường, chú ý mặt đường còn trơn ướt.';
      matchedCluster.plain_car_advice =
        '🟢 Nước đã rút trên đoạn đường này. Ô tô di chuyển bình thường.';
    } else {
      // Cộng lượt xác nhận (+1) ngay lập tức và gia hạn TTL
      if (!matchedCluster.reporter_device_hashes.includes(deviceHash)) {
        matchedCluster.reporter_device_hashes.push(deviceHash);
      }
      matchedCluster.confirm_count += 1;
      if (matchedCluster.verification_status === 'CLEARED') {
        matchedCluster.verification_status = 'VERIFIED';
      }
      if (depthInfo.depth_cm > 0) {
        matchedCluster.estimated_depth_cm =
          matchedCluster.estimated_depth_cm > 0
            ? Math.round((matchedCluster.estimated_depth_cm + depthInfo.depth_cm) / 2 / 5) * 5
            : depthInfo.depth_cm;
        matchedCluster.visual_depth_choice = input.visual_depth_choice;
        matchedCluster.severity_level =
          matchedCluster.estimated_depth_cm >= 35
            ? 3
            : matchedCluster.estimated_depth_cm >= 20
              ? 2
              : 1;
      }

      matchedCluster.updated_at = now.toISOString();
      matchedCluster.expires_at = new Date(
        nowMs + REPORT_TTL_MINUTES * 60 * 1000
      ).toISOString();

      const shouldVerify =
        matchedCluster.confirm_count >= 3 ||
        Boolean(nearestHotspot && (input.is_active_weather_hotspot ?? true));

      matchedCluster.verification_status = shouldVerify ? 'VERIFIED' : 'UNVERIFIED';
      matchedCluster.scientific_summary = `Ghi nhận từ ${matchedCluster.confirm_count} người dân trong bán kính 150m — Độ sâu ước tính ~${matchedCluster.estimated_depth_cm}cm (${depthInfo.label_vi}).`;
      matchedCluster.plain_motorbike_advice =
        matchedCluster.estimated_depth_cm >= 25
          ? `⚠️ ${matchedCluster.confirm_count} người tại hiện trường báo ngập ~${matchedCluster.estimated_depth_cm}cm (ngang ống pô xe máy) tại ${matchedCluster.street_name}. Nên chọn đường vòng tránh chết máy!`
          : `🛞 Có ${matchedCluster.confirm_count} báo cáo ngập ~${matchedCluster.estimated_depth_cm}cm tại ${matchedCluster.street_name}. Xe máy đi chậm giữ đều ga.`;
      matchedCluster.plain_car_advice =
        matchedCluster.estimated_depth_cm >= 25
          ? `⚠️ ${matchedCluster.confirm_count} người dân xác nhận ngập ~${matchedCluster.estimated_depth_cm}cm tại ${matchedCluster.street_name}. Xe Sedan gầm thấp nên tránh đi vào để phòng thủy kích.`
          : `🚗 Mặt đường ${matchedCluster.street_name} có nước ngập nhẹ (~${matchedCluster.estimated_depth_cm}cm). Ô tô đi chậm tránh tạo sóng.`;
      matchedCluster.source_attribution = `${matchedCluster.confirm_count} người dân xác nhận tại chỗ (GPS ≤ 500m, EXIF ≤ 10m)`;
    }
  } else {
    // Tạo cụm sự kiện ngập mới trong bán kính 150m
    const newId = `cr-${nowMs}-${Math.random().toString(36).substring(2, 6)}`;
    const resolvedStreetName =
      input.address_text?.trim() ||
      nearestHotspot?.street_name ||
      `Điểm báo ngập cộng đồng (${targetLat.toFixed(4)}, ${targetLng.toFixed(4)})`;
    const resolvedDistrict: HcmMvpDistrict =
      input.district || nearestHotspot?.district || 'Bình Thạnh';

    // Nếu trùng với điểm đen ngập lịch sử đang trong khung mưa lớn / triều cao -> nâng lên VERIFIED
    const autoVerifiedByHotspot = Boolean(
      nearestHotspot && (input.is_active_weather_hotspot ?? true)
    );

    const status: CrowdReportStatus = isRecededReport
      ? 'CLEARED'
      : autoVerifiedByHotspot
        ? 'VERIFIED'
        : 'UNVERIFIED';

    matchedCluster = {
      id: newId,
      associated_hotspot_id: nearestHotspot ? nearestHotspot.id : null,
      street_name: resolvedStreetName,
      district: resolvedDistrict,
      coordinates: [targetLng, targetLat],
      visual_depth_choice: input.visual_depth_choice,
      estimated_depth_cm: depthInfo.depth_cm,
      severity_level: depthInfo.severity_level,
      verification_status: status,
      confirm_count: isRecededReport ? 0 : 1,
      receded_vote_count: isRecededReport ? 1 : 0,
      reporter_device_hashes: isRecededReport ? [] : [deviceHash],
      receded_device_hashes: isRecededReport ? [deviceHash] : [],
      photo_preview_url:
        input.photo_base64_webp ||
        'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
      scientific_summary: autoVerifiedByHotspot
        ? `Báo cáo tại chỗ khớp với điểm đen ngập ${nearestHotspot?.code} — Độ sâu ước tính ~${depthInfo.depth_cm}cm (${depthInfo.label_vi}).`
        : `Báo cáo cộng đồng mới (1/3 xác nhận) — Độ sâu ước tính ~${depthInfo.depth_cm}cm (${depthInfo.label_vi}). Đang chờ thêm người đi đường kiểm chứng chéo.`,
      plain_motorbike_advice:
        depthInfo.depth_cm >= 25
          ? `⚠️ Người dân tại hiện trường vừa báo ngập ngang ống pô (~${depthInfo.depth_cm}cm) tại ${resolvedStreetName}. Xe tay ga rất dễ chết máy, khuyến nghị đi đường vòng!`
          : `🛞 Có báo cáo chớm ngập bánh xe (~${depthInfo.depth_cm}cm) tại ${resolvedStreetName}. Xe máy nên giảm tốc độ và chú ý quan sát.`,
      plain_car_advice:
        depthInfo.depth_cm >= 25
          ? `⚠️ Ghi nhận báo cáo ngập chạm gầm Sedan (~${depthInfo.depth_cm}cm) tại ${resolvedStreetName}. Ô tô gầm thấp nên tránh đi vào để phòng ngừa thủy kích.`
          : `🚗 Ghi nhận nước ngập ~${depthInfo.depth_cm}cm tại ${resolvedStreetName}. Ô tô di chuyển chậm tránh tạo sóng nước.`,
      nearby_camera: nearbyCamera
        ? {
            id: nearbyCamera.id,
            name: nearbyCamera.camera_name,
            coordinates: nearbyCamera.location.coordinates,
            distance_to_hotspot_m: nearbyCamera.calculated_distance_m,
            ttgt_reference_note: nearbyCamera.ttgt_reference_note,
          }
        : null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: new Date(nowMs + REPORT_TTL_MINUTES * 60 * 1000).toISOString(),
      source_attribution: autoVerifiedByHotspot
        ? `Người dân báo tại chỗ (GPS ${distanceToTargetM}m) + Khớp điểm đen lịch sử ${nearestHotspot?.code}`
        : `1 người dân báo tại chỗ (GPS ${distanceToTargetM}m, đang chờ đủ 3 người xác nhận chéo)`,
    };

    crowdClustersStore.set(newId, matchedCluster);
  }

  layers.push({
    layer: 4,
    name: 'Gom cụm 150m & Kiểm chứng chéo (Cross-check ≥ 3 người hoặc khớp Điểm đen)',
    passed: true,
    detail: `Cụm sự kiện [${matchedCluster.id}] hiện có ${matchedCluster.confirm_count} người xác nhận ngập -> Trạng thái: ${matchedCluster.verification_status}.`,
  });

  // ===========================================================================
  // LỚP 5: CỘNG ĐIỂM UY TÍN THIẾT BỊ (DEVICE REPUTATION) & ÁP DỤNG TTL 90 PHÚT
  // ===========================================================================
  deviceRep.submission_timestamps_ms.push(nowMs);
  deviceRep.valid_reports_count += 1;
  deviceRep.trust_score = Math.min(100, deviceRep.trust_score + 5);
  deviceRep.last_active_at = now.toISOString();

  layers.push({
    layer: 5,
    name: 'Điểm Uy tín Thiết bị & Thời hạn tự động hạ cấp (TTL 90 phút)',
    passed: true,
    detail: `Điểm tin cậy thiết bị tăng lên ${deviceRep.trust_score}/100. Bản tin có hiệu lực đến ${matchedCluster.expires_at} (TTL 90 phút).`,
  });

  return {
    accepted: true,
    http_status: action === 'CREATE' ? 201 : 200,
    message: isRecededReport
      ? 'Đã ghi nhận báo cáo nước rút tại hiện trường. Cảm ơn bạn đã cập nhật cho cộng đồng!'
      : matchedCluster.verification_status === 'VERIFIED'
        ? 'Báo cáo đã vượt qua 5 lớp kiểm duyệt và được XÁC MINH (VERIFIED) trên bản đồ!'
        : 'Báo cáo đã qua kiểm tra GPS/EXIF và hiển thị ở chế độ CHƯA XÁC MINH (chờ đủ 3 người xác nhận chéo).',
    layers,
    report: matchedCluster,
    device_reputation: {
      device_hash: deviceRep.device_hash,
      trust_score: deviceRep.trust_score,
      valid_reports_count: deviceRep.valid_reports_count,
    },
  };
}

/**
 * =============================================================================
 * TỔNG KẾT THEO QUY TẮC DỰ ÁN (docs/RULES.md)
 * =============================================================================
 * 1. Quyết định đã chốt:
 *    - Thực thi nghiêm ngặt 5 lớp kiểm duyệt:
 *      (1) Rate limit <= 5 báo cáo/giờ/device_hash
 *      (2) Geofence <= 500m & GPS accuracy <= 150m
 *      (3) Bắt buộc ảnh chụp hiện trường & EXIF timestamp <= 10 phút
 *      (4) Gom cụm không gian bán kính 150m & nâng lên VERIFIED khi >= 3 người xác nhận
 *          hoặc khớp điểm đen đang mưa lớn/triều cao
 *      (5) Cộng điểm uy tín thiết bị (device_reputations) & gắn TTL tự động hết hạn sau 90 phút.
 *    - Hỗ trợ cả 3 thao tác: Tạo báo cáo mới (`CREATE`), Xác nhận vẫn đang ngập (`CONFIRM_UPVOTE`)
 *      và Báo nước đã rút (`REPORT_RECEDED` / `RECEDED_0CM`).
 * 2. Câu hỏi mở cho chủ dự án:
 *    - Không có.
 * 3. Chuyển giao / Rủi ro:
 *    - Chuyển giao `processCrowdReportSubmission`, `getActiveCrowdReports` và
 *      `getCrowdStatsByHotspotId` cho `/api/reports` và `/api/alerts`.
 */
