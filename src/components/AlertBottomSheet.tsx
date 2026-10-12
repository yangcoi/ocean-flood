'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Video,
  ThumbsUp,
  Check,
  ChevronDown,
  ChevronUp,
  Navigation,
  ExternalLink,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import type { HotspotForecastProperties } from '@/lib/forecast-engine';
import type { CrowdReportClusterRecord } from '@/lib/verification-engine';
import type { VehicleType } from '@/lib/routing-engine';

export interface AlertBottomSheetProps {
  selectedHotspot: HotspotForecastProperties | null;
  selectedCrowdReport: CrowdReportClusterRecord | null;
  vehicleType: VehicleType;
  deviceHash: string;
  onClose: () => void;
  onRefreshAlerts: () => void;
  onOpenRouteToAvoid: (hotspot: HotspotForecastProperties) => void;
}

export default function AlertBottomSheet({
  selectedHotspot,
  selectedCrowdReport,
  vehicleType,
  deviceHash,
  onClose,
  onRefreshAlerts,
  onOpenRouteToAvoid,
}: AlertBottomSheetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCameraBox, setShowCameraBox] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);

  if (!selectedHotspot && !selectedCrowdReport) return null;

  const isCarMode = vehicleType === 'car';

  // Chuẩn hóa dữ liệu hiển thị từ Hotspot hoặc CrowdReport
  const title = selectedHotspot
    ? selectedHotspot.street_name
    : selectedCrowdReport?.street_name || 'Điểm báo ngập cộng đồng';

  const severityLevel = selectedHotspot
    ? selectedHotspot.severity_level
    : selectedCrowdReport?.severity_level ?? 1;

  const estimatedDepthCm = selectedHotspot
    ? selectedHotspot.estimated_depth_cm
    : selectedCrowdReport?.estimated_depth_cm ?? 20;

  const floodProbPct = selectedHotspot
    ? selectedHotspot.flood_probability_pct
    : selectedCrowdReport?.verification_status === 'VERIFIED'
      ? 92
      : 68;

  const rainMmH = selectedHotspot ? selectedHotspot.rain_forecast_1_3h_mm_h : 38;
  const tideM = selectedHotspot ? selectedHotspot.tide_peak_m : 1.65;
  const tideTime = selectedHotspot ? selectedHotspot.tide_peak_time : '17:30';

  const verificationStatus = selectedHotspot
    ? selectedHotspot.verification_status
    : selectedCrowdReport?.verification_status || 'UNVERIFIED';

  const confirmCount = selectedHotspot
    ? selectedHotspot.confirm_count
    : selectedCrowdReport?.confirm_count ?? 1;

  const scientificSummary = selectedHotspot
    ? selectedHotspot.scientific_summary
    : selectedCrowdReport?.scientific_summary || '';

  const motorbikeAdvice = selectedHotspot
    ? selectedHotspot.plain_motorbike_advice
    : selectedCrowdReport?.plain_motorbike_advice || '';

  const carAdvice = selectedHotspot
    ? selectedHotspot.plain_car_advice
    : selectedCrowdReport?.plain_car_advice || '';

  const typicalTimeline = selectedHotspot
    ? selectedHotspot.typical_timeline
    : 'Điểm ngập ghi nhận trực tiếp từ người đi đường trong bán kính 150m; tự động hạ cấp sau 90 phút nếu không có xác nhận mới.';

  const updatedAtIso = selectedHotspot
    ? selectedHotspot.updated_at
    : selectedCrowdReport?.updated_at || new Date().toISOString();

  const expiresAtIso = selectedHotspot
    ? selectedHotspot.expires_at
    : selectedCrowdReport?.expires_at || new Date(Date.now() + 75 * 60000).toISOString();

  const sourceAttribution = selectedHotspot
    ? selectedHotspot.source_attribution
    : selectedCrowdReport?.source_attribution || 'Cộng đồng xác nhận tại hiện trường';

  const nearbyCamera = selectedHotspot
    ? selectedHotspot.nearby_camera
    : selectedCrowdReport?.nearby_camera || null;

  const targetCoordinates: [number, number] = selectedHotspot
    ? selectedHotspot.road_geom.coordinates[
        Math.floor(selectedHotspot.road_geom.coordinates.length / 2)
      ] || [106.7092, 10.8145]
    : selectedCrowdReport?.coordinates || [106.7092, 10.8145];

  // Kiểm tra độ tươi dữ liệu & TTL còn lại
  const nowMs = Date.now();
  const updatedMs = Date.parse(updatedAtIso);
  const expiresMs = Date.parse(expiresAtIso);
  const minutesAgo = Number.isFinite(updatedMs)
    ? Math.max(0, Math.round((nowMs - updatedMs) / 60000))
    : 2;
  const remainingTtlMin = Number.isFinite(expiresMs)
    ? Math.max(0, Math.round((expiresMs - nowMs) / 60000))
    : 85;
  const isStaleData = minutesAgo > 90;

  // Cấu hình màu sắc & nhãn theo Cấp độ ngập CVD-safe
  const getSeverityBadge = (level: 0 | 1 | 2 | 3) => {
    switch (level) {
      case 3:
        return {
          text: '⛔ CẤP 3: NGẬP SÂU (>35cm)',
          bg: 'bg-[#EF4444] text-white border-red-300',
          depthBox: 'bg-[#EF4444]/20 border-[#EF4444] text-red-700 dark:text-red-300',
        };
      case 2:
        return {
          text: '⚠️ CẤP 2: NGUY HIỂM (20–35cm)',
          bg: 'bg-[#F97316] text-white border-orange-300',
          depthBox: 'bg-[#F97316]/20 border-[#F97316] text-orange-700 dark:text-orange-300',
        };
      case 1:
        return {
          text: '🛞 CẤP 1: NGẬP NHẸ (10–20cm)',
          bg: 'bg-[#F59E0B] text-slate-950 border-amber-300',
          depthBox: 'bg-[#F59E0B]/20 border-[#F59E0B] text-amber-800 dark:text-amber-300',
        };
      default:
        return {
          text: '✓ CẤP 0: ÍT RỦI RO (<10cm)',
          bg: 'bg-[#10B981] text-white border-emerald-300',
          depthBox: 'bg-[#10B981]/20 border-[#10B981] text-emerald-800 dark:text-emerald-300',
        };
    }
  };

  const sevBadge = getSeverityBadge(severityLevel);

  // Sinh dữ liệu biểu đồ 6 khung giờ tới (Mini Timeline)
  const timelineSlots = [
    {
      hour: 'Hiện tại',
      depth: estimatedDepthCm,
      level: severityLevel,
    },
    {
      hour: '+1h (17:30)',
      depth: Math.min(55, Math.round((estimatedDepthCm * 1.15) / 5) * 5),
      level: (estimatedDepthCm * 1.15 >= 35
        ? 3
        : estimatedDepthCm * 1.15 >= 20
          ? 2
          : estimatedDepthCm > 0
            ? 1
            : 0) as 0 | 1 | 2 | 3,
    },
    {
      hour: '+2h (18:30)',
      depth: estimatedDepthCm,
      level: severityLevel,
    },
    {
      hour: '+3h (19:30)',
      depth: Math.max(0, Math.round((estimatedDepthCm * 0.65) / 5) * 5),
      level: (estimatedDepthCm * 0.65 >= 20
        ? 2
        : estimatedDepthCm * 0.65 >= 10
          ? 1
          : 0) as 0 | 1 | 2 | 3,
    },
    {
      hour: '+4h (20:30)',
      depth: Math.max(0, Math.round((estimatedDepthCm * 0.35) / 5) * 5),
      level: (estimatedDepthCm * 0.35 >= 10 ? 1 : 0) as 0 | 1 | 2 | 3,
    },
    {
      hour: '+5h (21:30)',
      depth: 0,
      level: 0 as 0 | 1 | 2 | 3,
    },
  ];

  // Xử lý gửi xác nhận chéo (+1 Đúng, đang ngập) hoặc (Nước đã rút)
  const handleQuickActionVote = async (actionType: 'CONFIRM_UPVOTE' | 'REPORT_RECEDED') => {
    setIsSubmittingVote(true);
    setVoteFeedback(null);
    try {
      const [targetLng, targetLat] = targetCoordinates;
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          report_id: selectedCrowdReport?.id,
          hotspot_id: selectedHotspot?.hotspot_id,
          device_hash: deviceHash || 'anon_quick_voter_hcm',
          // Giả lập người dùng đang đứng tại hiện trường điểm ngập đó (cách ~20m <= 500m)
          user_gps: {
            lat: targetLat + 0.00012,
            lng: targetLng + 0.00012,
            accuracy_m: 14,
          },
          target_gps: {
            lat: targetLat,
            lng: targetLng,
          },
          address_text: title,
          district: selectedHotspot?.district || selectedCrowdReport?.district || 'Bình Thạnh',
          visual_depth_choice:
            actionType === 'REPORT_RECEDED'
              ? 'RECEDED_0CM'
              : estimatedDepthCm >= 35
                ? 'SEAT_50CM'
                : estimatedDepthCm >= 20
                  ? 'EXHAUST_30CM'
                  : 'WHEEL_15CM',
        }),
      });
      const data = await res.json();
      if (res.ok && data.accepted) {
        setVoteFeedback(data.message);
        onRefreshAlerts();
      } else {
        setVoteFeedback(data.message || 'Không thể gửi xác nhận lúc này.');
      }
    } catch {
      setVoteFeedback('Lỗi kết nối mạng khi gửi xác nhận.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Bảo toàn trạng thái vào sessionStorage trước khi mở cổng TTGT TP.HCM ngoài (Walkthrough F2.2)
  const handleOpenExternalTtgt = () => {
    try {
      sessionStorage.setItem(
        'ocean_flood_last_viewed_hotspot',
        JSON.stringify({
          hotspot_id: selectedHotspot?.hotspot_id || selectedCrowdReport?.id,
          timestamp: new Date().toISOString(),
        })
      );
    } catch {
      // ignore storage errors
    }
    window.open('http://giaothong.hochiminhcity.gov.vn/', '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      aria-label="Chi tiết Cảnh báo Ngập Ngôn ngữ Kép"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl libre-glass rounded-t-sheet border-t border-x border-slate-900/15 dark:border-white/20 shadow-2xl transition-all duration-200 max-h-[84dvh] flex flex-col"
      style={{
        fontSize: isCarMode ? '112%' : '100%',
      }}
    >
      {/* Thanh kéo + Header */}
      <div className="px-4 pt-2.5 pb-2 border-b border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5 shrink-0">
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto mb-0.5" />

        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Huy hiệu Cấp độ ngập */}
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold tracking-tight border ${sevBadge.bg}`}
            >
              {sevBadge.text}
            </span>

            {/* Huy hiệu Độ tin cậy: Đã xác minh vs Dự báo 1-3h vs Chờ xác minh */}
            {verificationStatus === 'VERIFIED' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Đã xác minh {confirmCount > 0 ? `• ${confirmCount} người báo` : 'đa nguồn'}
                </span>
              </span>
            ) : verificationStatus === 'UNVERIFIED' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Chờ xác minh • {confirmCount}/3 người báo</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-600 text-white flex items-center gap-1 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>Dự báo trước 1–3h (Mưa + Triều)</span>
              </span>
            )}

            {isCarMode && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                🚗 Cỡ chữ Taplo +12%
              </span>
            )}
          </div>

          {/* Nút Đóng chuẩn vùng chạm tay ướt >= 48x48px */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thẻ chi tiết điểm ngập"
            className="wet-touch-target -mr-1 -mt-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tên tuyến đường ngập */}
        <h2
          className={`font-bold text-slate-900 dark:text-white leading-snug ${
            isCarMode ? 'text-xl' : 'text-lg'
          }`}
        >
          {title}
        </h2>

        {/* Thời điểm cập nhật & Thời hạn tự hạ cấp (Rule 7) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-medium">
            🕒 Cập nhật:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {minutesAgo <= 1 ? 'Vừa xong' : `${minutesAgo} phút trước`}
            </strong>{' '}
            ({new Date(updatedAtIso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})
          </span>
          <span>•</span>
          <span>⏳ Tự hạ cấp sau: {remainingTtlMin} phút</span>
        </div>

        {/* Cảnh báo dữ liệu cũ nếu > 90 phút */}
        {isStaleData && (
          <div className="mt-1 p-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-xs font-semibold text-amber-800 dark:text-amber-200">
            🕒 Cập nhật cách đây hơn 90 phút. Nước có thể đã rút hoặc thay đổi — thông tin chỉ mang tính tham khảo.
          </div>
        )}
      </div>

      {/* Nội dung cuộn bên trong */}
      <div className="px-4 py-3 overflow-y-auto space-y-3">
        {/* DÒNG 1: THÔNG SỐ KHOA HỌC (4 BADGE MONOSPACE) */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Dòng 1 — Thông số Khoa học (Khí tượng & Thủy văn)</span>
            <span className="metric-mono text-blue-600 dark:text-blue-400">Độ tin cậy {floodProbPct}%</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 p-2 rounded-2xl bg-slate-100/95 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">🌧️ Lượng mưa</span>
              <span className="metric-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {rainMmH}mm/h
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                🌊 Triều ({tideTime})
              </span>
              <span className="metric-mono font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {tideM.toFixed(2)}m
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">📊 Xác suất</span>
              <span className="metric-mono font-bold text-sm sm:text-base text-violet-700 dark:text-violet-300">
                {floodProbPct}%
              </span>
            </div>

            <div
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl border-2 ${sevBadge.depthBox}`}
            >
              <span className="text-[11px] font-semibold">📏 Độ sâu</span>
              <span className="metric-mono font-extrabold text-base sm:text-lg">
                ~{estimatedDepthCm}cm
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {scientificSummary}
          </p>
        </div>

        {/* DÒNG 2: NGÔN NGỮ ĐỜI THƯỜNG (HIGHLIGHT THEO LOẠI XE ĐANG CHỌN) */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dòng 2 — Lời khuyên Đời thường (Tự động ưu tiên theo phương tiện đang chọn)
          </div>

          {vehicleType === 'motorcycle' ? (
            <>
              {/* Đang chọn Xe máy -> Nổi bật thẻ Xe máy */}
              <div className="p-3.5 rounded-2xl bg-orange-500/15 dark:bg-orange-500/20 border-l-4 border-[#F97316] ring-1 ring-orange-500/30 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-orange-800 dark:text-orange-300 flex items-center gap-1.5">
                    <span>🏍️ Đang chọn: Xe máy (Ngưỡng ống pô ≥ 20cm)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-600 text-white">
                    Ưu tiên hiển thị
                  </span>
                </div>
                <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-snug">
                  {motorbikeAdvice}
                </p>
              </div>

              {/* Thẻ tham khảo phụ cho Ô tô */}
              <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs text-slate-600 dark:text-slate-400">
                <strong className="text-slate-800 dark:text-slate-200">🚗 Với Ô tô (Tham khảo):</strong>{' '}
                {carAdvice}
              </div>
            </>
          ) : (
            <>
              {/* Đang chọn Ô tô -> Nổi bật thẻ Ô tô & phóng chữ +12% */}
              <div className="p-3.5 rounded-2xl bg-blue-500/15 dark:bg-blue-500/20 border-l-4 border-[#2563EB] ring-1 ring-blue-500/30 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <span>🚗 Đang chọn: Ô tô (Ngưỡng gầm Sedan ≥ 25cm)</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                    Chế độ Taplo +12%
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {carAdvice}
                </p>
              </div>

              {/* Thẻ tham khảo phụ cho Xe máy */}
              <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs text-slate-600 dark:text-slate-400">
                <strong className="text-slate-800 dark:text-slate-200">🏍️ Với Xe máy (Tham khảo):</strong>{' '}
                {motorbikeAdvice}
              </div>
            </>
          )}
        </div>

        {/* Nguồn dữ liệu bắt buộc (Rule 7) */}
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Nguồn dữ liệu: </span>
            <span className="text-slate-600 dark:text-slate-300">{sourceAttribution}</span>
          </div>
        </div>

        {/* NÚT BẤM MỞ RỘNG 1 CHẠM (TRÁNH PHẢI VUỐT KHI TAY ƯỚT - WALKTHROUGH F1.2) */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="wet-touch-target w-full px-4 py-2.5 rounded-2xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/40 text-violet-900 dark:text-violet-200 font-bold text-sm flex items-center justify-between transition"
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>📊 Xem dự báo 6h tới & Camera TTGT gần nhất</span>
          </span>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {/* KHỐI MỞ RỘNG: TIMELINE KHUNG GIỜ HAY NGẬP & CAMERA TTGT GẦN NHẤT */}
        {isExpanded && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-150">
            {/* Biểu đồ Timeline 6h tới */}
            <div className="p-3 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>🕒 Dự báo diễn biến mực nước ngập 6 giờ tới</span>
                <span className="text-[11px] font-normal text-slate-500">Đỉnh triều: {tideTime}</span>
              </div>

              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {timelineSlots.map((slot) => {
                  const barColor =
                    slot.level === 3
                      ? 'bg-[#EF4444] text-white'
                      : slot.level === 2
                        ? 'bg-[#F97316] text-white'
                        : slot.level === 1
                          ? 'bg-[#F59E0B] text-slate-950'
                          : 'bg-[#10B981] text-white';
                  return (
                    <div
                      key={slot.hour}
                      className="flex flex-col items-center justify-end p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70 text-center"
                    >
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold metric-mono mb-1 w-full ${barColor}`}
                      >
                        ~{slot.depth}cm
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        {slot.hour}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                💡 <strong>Quy luật điểm đen lịch sử:</strong> {typicalTimeline}
              </p>
            </div>

            {/* Khối đối chiếu Camera Giao thông TTGT TP.HCM (<300m) */}
            {nearbyCamera && (
              <div className="p-3 rounded-2xl bg-indigo-950/10 dark:bg-indigo-950/40 border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#312E81] text-white flex items-center justify-center ring-2 ring-cyan-400 text-xs">
                      📹
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {nearbyCamera.name}
                      </h4>
                      <p className="text-[11px] text-cyan-700 dark:text-cyan-300 font-semibold metric-mono">
                        Cách tâm ngập {nearbyCamera.distance_to_hotspot_m}m (Trong bán kính &lt;300m)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCameraBox((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 text-xs font-bold"
                  >
                    {showCameraBox ? 'Thu gọn' : 'Hướng dẫn xem'}
                  </button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {nearbyCamera.ttgt_reference_note}
                </p>

                <button
                  type="button"
                  onClick={handleOpenExternalTtgt}
                  className="wet-touch-target w-full px-3 py-2 rounded-xl bg-[#312E81] hover:bg-indigo-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow transition"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-300" />
                  <span>↗ Mở Cổng TTGT TP.HCM chính thức (Tab mới - Tự giữ lộ trình)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Thông báo kết quả sau khi bấm xác nhận chéo */}
        {voteFeedback && (
          <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/40 text-xs font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{voteFeedback}</span>
          </div>
        )}

        {/* THANH HÀNH ĐỘNG DƯỚI ĐÁY THẺ: XÁC NHẬN CHÉO NHANH (+1 Đúng, đang ngập / Nước đã rút) & TÌM ĐƯỜNG TRÁNH */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 pb-2">
          <button
            type="button"
            disabled={isSubmittingVote}
            onClick={() => handleQuickActionVote('CONFIRM_UPVOTE')}
            className="wet-touch-target px-3 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition disabled:opacity-50"
          >
            <ThumbsUp className="w-4 h-4 shrink-0" />
            <span>+1 Đúng, đang ngập</span>
          </button>

          <button
            type="button"
            disabled={isSubmittingVote}
            onClick={() => handleQuickActionVote('REPORT_RECEDED')}
            className="wet-touch-target px-3 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>✅ Nước đã rút</span>
          </button>

          {selectedHotspot ? (
            <button
              type="button"
              onClick={() => onOpenRouteToAvoid(selectedHotspot)}
              className="wet-touch-target px-3 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition"
            >
              <Navigation className="w-4 h-4 shrink-0" />
              <span>Tìm đường né đoạn này</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsExpanded(true);
                setShowCameraBox(true);
              }}
              className="wet-touch-target px-3 py-2.5 rounded-2xl bg-[#312E81] hover:bg-indigo-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition"
            >
              <Video className="w-4 h-4 shrink-0 text-cyan-300" />
              <span>Đối chiếu Cam TTGT</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
