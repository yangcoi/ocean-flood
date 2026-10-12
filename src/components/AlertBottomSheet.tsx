'use client';

import React, { useState } from 'react';
import {
  X,
  Navigation,
  ThumbsUp,
  CheckCircle2,
  ExternalLink,
  Video,
  CloudRain,
  Waves,
  Camera,
  Clock,
  AlertTriangle,
  Mountain,
  ShieldCheck,
} from 'lucide-react';
import type { HotspotForecastProperties } from '@/lib/forecast-engine';
import type { CrowdReportClusterRecord } from '@/lib/verification-engine';
import type { VehicleType } from '@/lib/routing-engine';
import type { ActiveCameraTarget } from '@/components/SecurityCameraModal';

export interface AlertBottomSheetProps {
  selectedHotspot: HotspotForecastProperties | null;
  selectedCrowdReport: CrowdReportClusterRecord | null;
  vehicleType: VehicleType;
  deviceHash: string;
  onClose: () => void;
  onRefreshAlerts: () => void;
  onOpenRouteToAvoid: (hotspot: HotspotForecastProperties) => void;
  onOpenCameraReport: (hotspotId?: string) => void;
  onOpenSecurityCamera: (camera: ActiveCameraTarget) => void;
}

/**
 * Tạo hình minh họa trực quan hiện trường ngập & thước đo mực nước so với xe
 * giúp người dùng hình dung ngay mức ngập ngoài đời thực kèm ảnh/camera.
 */
function FloodVisualSceneCard({
  depthCm,
  streetName,
  vehicleType,
  isVerified,
  confirmCount,
  onTakePhoto,
}: {
  depthCm: number;
  streetName: string;
  vehicleType: VehicleType;
  isVerified: boolean;
  confirmCount: number;
  onTakePhoto: () => void;
}) {
  // Tính tỷ lệ mực nước hiển thị (tối đa 60cm = 100%)
  const waterHeightPct = Math.min(88, Math.max(18, Math.round((depthCm / 60) * 100)));

  const dangerPartText =
    vehicleType === 'car'
      ? depthCm >= 40
        ? 'Quá đèn pha / Nắp capo Ô tô'
        : depthCm >= 25
        ? 'Chạm gầm xe Sedan (Rủi ro thủy kích)'
        : 'Dưới gầm xe (Đi chậm đều ga)'
      : depthCm >= 45
      ? 'Ngập lút yên xe máy'
      : depthCm >= 25
      ? 'Ngập qua ống pô / Sàn để chân xe ga'
      : 'Ngập nửa bánh xe (~15cm)';

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 text-white shadow-sm">
      {/* Khung cảnh đường phố & Mực nước dâng trực quan */}
      <div className="relative h-36 w-full flex flex-col justify-between p-3 overflow-hidden">
        {/* Hiệu ứng hạt mưa */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(105deg, transparent, transparent 10px, rgba(147,197,253,0.35) 10px, rgba(147,197,253,0.35) 12px)',
          }}
        />

        {/* Hàng huy hiệu trên cùng: Trạng thái ảnh thực tế + Nút chụp ảnh ngay tại điểm này */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold flex items-center gap-1 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isVerified
                ? `Ảnh & Báo cáo xác thực (${confirmCount} người)`
                : 'Mô phỏng mực nước thực tế'}
            </span>
          </div>

          <button
            type="button"
            onClick={onTakePhoto}
            className="px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shadow-md active:scale-95 transition"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📸 Chụp ảnh tại đây</span>
          </button>
        </div>

        {/* Thước đo cột nước bên phải (cm) */}
        <div className="absolute right-2.5 top-10 bottom-2 w-9 rounded-lg bg-black/45 backdrop-blur-sm border border-white/15 flex flex-col justify-between py-1 px-1 text-[9px] font-mono text-slate-300 z-10">
          <span>50cm</span>
          <span className="text-amber-300 font-bold">30cm</span>
          <span>15cm</span>
          <span>0cm</span>
        </div>

        {/* Lớp sóng nước ngập dâng theo đúng độ sâu cm */}
        <div
          className="absolute inset-x-0 bottom-0 transition-all duration-500 flex flex-col justify-end"
          style={{
            height: `${waterHeightPct}%`,
            background:
              depthCm >= 40
                ? 'linear-gradient(180deg, rgba(220,38,38,0.78) 0%, rgba(153,27,27,0.95) 100%)'
                : depthCm >= 25
                ? 'linear-gradient(180deg, rgba(249,115,22,0.78) 0%, rgba(194,65,12,0.95) 100%)'
                : 'linear-gradient(180deg, rgba(37,99,235,0.75) 0%, rgba(29,78,216,0.95) 100%)',
            borderTop: '2px solid rgba(255,255,255,0.75)',
          }}
        />

        {/* Thông tin trực quan dưới đáy khung hình */}
        <div className="relative z-10 pr-11">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black tracking-tight drop-shadow">
              🌊 Ngập ~{depthCm}cm
            </span>
            <span className="text-xs font-bold text-amber-200 drop-shadow">
              • {dangerPartText}
            </span>
          </div>
          <p className="text-[11px] text-white/90 truncate font-medium">
            📍 Khu vực: {streetName}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Thẻ Chi Tiết Vùng Ngập chuẩn Google Maps Place Sheet (Đầy đủ hình ảnh vùng ngập, thước đo mực nước,
 * Camera TTGT, thông tin khoa học + đời thường, và nút Chụp ảnh báo ngập ngay tại chỗ).
 */
export default function AlertBottomSheet({
  selectedHotspot,
  selectedCrowdReport,
  vehicleType,
  deviceHash,
  onClose,
  onRefreshAlerts,
  onOpenRouteToAvoid,
  onOpenCameraReport,
  onOpenSecurityCamera,
}: AlertBottomSheetProps) {
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  if (!selectedHotspot && !selectedCrowdReport) return null;

  const handleQuickVote = async (action: 'confirm_active' | 'report_receded') => {
    if (!selectedHotspot) return;
    setIsVoting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quick_action: action,
          target_hotspot_id: selectedHotspot.hotspot_id,
          device_hash: deviceHash,
        }),
      });
      const data = await res.json();
      setFeedbackMsg(data.message || 'Cảm ơn bạn đã cập nhật thực tế!');
      onRefreshAlerts();
    } catch {
      setFeedbackMsg('Đã ghi nhận phản hồi của bạn.');
    } finally {
      setIsVoting(false);
    }
  };

  // Nếu người dùng bấm vào một báo cáo cộng đồng độc lập
  if (selectedCrowdReport && !selectedHotspot) {
    return (
      <section className="absolute inset-x-2.5 bottom-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
              📸 Báo cáo người dân ({selectedCrowdReport.confirm_count} người xác nhận)
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
              {selectedCrowdReport.street_name}
            </h2>
            <p className="text-xs text-slate-500">
              Độ sâu ghi nhận: ~{selectedCrowdReport.estimated_depth_cm}cm • Quận{' '}
              {selectedCrowdReport.district}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <FloodVisualSceneCard
          depthCm={selectedCrowdReport.estimated_depth_cm}
          streetName={selectedCrowdReport.street_name}
          vehicleType={vehicleType}
          isVerified={selectedCrowdReport.verification_status === 'VERIFIED'}
          confirmCount={selectedCrowdReport.confirm_count}
          onTakePhoto={() => onOpenCameraReport(undefined)}
        />

        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
          {vehicleType === 'car'
            ? selectedCrowdReport.plain_car_advice
            : selectedCrowdReport.plain_motorbike_advice}
        </p>
      </section>
    );
  }

  const h = selectedHotspot!;
  const isVerified = h.verification_status === 'VERIFIED' || h.confirm_count >= 3;

  let badgeClass = 'bg-emerald-600 text-white';
  if (h.severity_level === 3) badgeClass = 'bg-red-600 text-white';
  else if (h.severity_level === 2) badgeClass = 'bg-orange-500 text-white';
  else if (h.severity_level === 1) badgeClass = 'bg-amber-500 text-slate-950';

  return (
    <section
      aria-label={`Thông tin vùng ngập ${h.street_name}`}
      className="absolute inset-x-2.5 bottom-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-slate-700 p-4 space-y-3 max-h-[82dvh] overflow-y-auto"
    >
      {/* Thanh nắm kéo kiểu Google Maps */}
      <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto -mt-1" />

      {/* 1. TIÊU ĐỀ VÙNG NGẬP + HUY HIỆU ĐỘ SÂU + NÚT ĐÓNG */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${badgeClass}`}>
              {h.severity_label} • ~{h.estimated_depth_cm}cm
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#1A73E8] dark:text-blue-300 text-[11px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isVerified
                ? `Đã xác minh (${h.confirm_count} người báo)`
                : 'Dự báo sớm 1–3h'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
            {h.street_name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quận {h.district} • Điểm đen mã {h.code} • Ngập lịch sử tối đa {h.max_historical_depth_cm}cm
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng thẻ"
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. HÌNH ẢNH HIỆN TRƯỜNG VÙNG NGẬP & THƯỚC ĐO MỰC NƯỚC + NÚT CHỤP ẢNH TẠI ĐÂY */}
      <FloodVisualSceneCard
        depthCm={h.estimated_depth_cm}
        streetName={h.street_name}
        vehicleType={vehicleType}
        isVerified={isVerified}
        confirmCount={h.confirm_count}
        onTakePhoto={() => onOpenCameraReport(h.hotspot_id)}
      />

      {/* 3. THÔNG TIN KHOA HỌC & LỜI KHUYÊN ĐỜI THƯỜNG (NGÔN NGỮ KÉP) */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
        {/* 4 Ô số liệu Khoa học rõ ràng */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
              <CloudRain className="w-3 h-3 text-[#1A73E8]" />
              <span>Lượng mưa</span>
            </div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
              {h.rain_current_mm_h} mm/h
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
              <Waves className="w-3 h-3 text-indigo-600" />
              <span>Đỉnh triều</span>
            </div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
              +{h.tide_level_m.toFixed(2)}m
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
              <Mountain className="w-3 h-3 text-emerald-600" />
              <span>Cao độ nền</span>
            </div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
              {h.elevation_m.toFixed(1)}m
            </div>
          </div>

          <div className="p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-0.5">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Nguy cơ</span>
            </div>
            <div className="text-xs font-extrabold text-red-600 dark:text-red-400 mt-0.5">
              {h.flood_probability_pct}%
            </div>
          </div>
        </div>

        {/* Lời khuyên Đời thường theo loại xe */}
        <div className="p-2.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
          <div className="text-[11px] font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wide mb-0.5">
            {vehicleType === 'car'
              ? '🚗 Khuyến cáo cho Ô tô / Sedan:'
              : '🏍️ Khuyến cáo cho Xe máy / Tay ga:'}
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
            {vehicleType === 'car' ? h.plain_car_advice : h.plain_motorbike_advice}
          </p>
        </div>

        {/* Khung giờ hay ngập & Lộ trình đường vòng gợi ý (Hiển thị trực tiếp không bị ẩn) */}
        <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pt-0.5">
          <div className="flex items-start gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#1A73E8] shrink-0 mt-0.5" />
            <span>
              <strong>Khung giờ thường ngập:</strong> {h.typical_timeline}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Đường vòng né ngập:</strong>{' '}
              {vehicleType === 'car' ? h.detour_routes.car : h.detour_routes.motorcycle}
            </span>
          </div>
        </div>
      </div>

      {/* 4. CAMERA AN NINH / GIAO THÔNG GẦN NHẤT (ẤN VÀO TRỎ THẲNG TỚI ĐÚNG ĐỊA ĐIỂM NÚT GIAO) */}
      {h.nearby_camera && (
        <div className="p-3 rounded-2xl bg-slate-900 text-white space-y-2 shadow-sm border border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-600/25 border border-red-500/40 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded bg-red-600 text-[9px] font-extrabold uppercase">
                    ● LIVE CAM ({h.nearby_camera.id})
                  </span>
                  <span className="text-xs font-bold truncate">{h.nearby_camera.name}</span>
                </div>
                <p className="text-[11px] text-slate-300 font-mono truncate">
                  📍 Tọa độ: {h.nearby_camera.coordinates[1].toFixed(4)}°N,{' '}
                  {h.nearby_camera.coordinates[0].toFixed(4)}°E (Cách {h.nearby_camera.distance_to_hotspot_m}m)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onOpenSecurityCamera({
                  id: h.nearby_camera!.id,
                  name: h.nearby_camera!.name,
                  coordinates: h.nearby_camera!.coordinates,
                  distance_to_hotspot_m: h.nearby_camera!.distance_to_hotspot_m,
                  ttgt_reference_note: h.nearby_camera!.ttgt_reference_note,
                  street_name: h.street_name,
                  estimated_depth_cm: h.estimated_depth_cm,
                })
              }
              className="py-2 px-3 rounded-xl bg-[#1A73E8] hover:bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Mở Cam tại Nút giao</span>
            </button>

            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${h.nearby_camera.coordinates[1]},${h.nearby_camera.coordinates[0]}&heading=20&pitch=0&fov=80`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-[#0F9D58] hover:bg-[#0B8043] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
            >
              <span>👀 Góc nhìn 360° tại chỗ</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* 5. CỤM NÚT HÀNH ĐỘNG CHÍNH: CHỈ ĐƯỜNG NÉ ĐIỂM NÀY + CHỤP ẢNH CẬP NHẬT + XÁC NHẬN */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpenRouteToAvoid(h)}
          className="py-3 px-3 rounded-2xl bg-[#1A73E8] hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 transition active:scale-95"
        >
          <Navigation className="w-4 h-4 fill-white" />
          <span>Chỉ đường né điểm này</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenCameraReport(h.hotspot_id)}
          className="py-3 px-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/25 transition active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span>📸 Chụp ảnh báo ngập</span>
        </button>
      </div>

      {/* Hàng nút xác nhận nhanh cộng đồng (+1 Đúng đang ngập / Nước đã rút) */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          disabled={isVoting}
          onClick={() => handleQuickVote('confirm_active')}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition"
        >
          <ThumbsUp className="w-3.5 h-3.5 text-[#1A73E8]" />
          <span>Xác nhận đang ngập (+1)</span>
        </button>

        <button
          type="button"
          disabled={isVoting}
          onClick={() => handleQuickVote('report_receded')}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Báo nước đã rút hết</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center bg-emerald-50 dark:bg-emerald-950/40 py-1.5 rounded-xl">
          {feedbackMsg}
        </div>
      )}
    </section>
  );
}
