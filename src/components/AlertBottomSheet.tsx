'use client';

import React, { useState } from 'react';
import {
  X,
  Navigation,
  ThumbsUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Video,
  CloudRain,
  Waves,
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

/**
 * Thẻ thông tin điểm ngập gọn gàng kiểu Google Maps Place Sheet:
 * - Mặc định chỉ hiện những thông tin quan trọng nhất (Tên đường, Mức ngập cm, Lời khuyên cho Xe máy/Ô tô, và Nút Tìm đường vòng)
 * - Chi tiết biểu đồ 6h & Camera TTGT được thu gọn vào nút "Xem thêm chi tiết" để không gây rối mắt.
 */
export default function AlertBottomSheet({
  selectedHotspot,
  selectedCrowdReport,
  vehicleType,
  deviceHash,
  onClose,
  onRefreshAlerts,
  onOpenRouteToAvoid,
}: AlertBottomSheetProps) {
  const [showMoreDetails, setShowMoreDetails] = useState(false);
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
      setFeedbackMsg(data.message || 'Cảm ơn bạn đã cập nhật!');
      onRefreshAlerts();
    } catch {
      setFeedbackMsg('Đã ghi nhận phản hồi của bạn.');
    } finally {
      setIsVoting(false);
    }
  };

  if (selectedCrowdReport && !selectedHotspot) {
    return (
      <section className="absolute inset-x-2.5 bottom-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
              Báo cáo từ người dân ({selectedCrowdReport.confirm_count} người xác nhận)
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
              {selectedCrowdReport.street_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300">
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
      aria-label={`Thông tin điểm ngập ${h.street_name}`}
      className="absolute inset-x-2.5 bottom-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_-8px_35px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-700 p-4 space-y-3 max-h-[80%] overflow-y-auto"
    >
      {/* 1. Tiêu đề đường + Độ sâu cm + Nút Đóng */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${badgeClass}`}>
              Ngập ~{h.estimated_depth_cm}cm
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
              {isVerified ? `✓ Đã xác minh (${h.confirm_count} người)` : 'Dự báo sớm 1–3h'}
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">
            {h.street_name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {h.district} • Mã {h.code}
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

      {/* 2. Tóm tắt Ngôn ngữ Kép ngắn gọn trong 1 hộp sáng rõ */}
      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
        {/* Dòng 1: Số liệu Khoa học */}
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-[#1A73E8]" />
            Mưa {h.rain_current_mm_h}mm/h
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Waves className="w-3.5 h-3.5 text-indigo-600" />
            Triều {h.tide_level_m.toFixed(2)}m
          </span>
          <span>•</span>
          <span>Nguy cơ {h.flood_probability_pct}%</span>
        </div>

        {/* Dòng 2: Lời khuyên Đời thường theo loại xe đang chọn */}
        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
          {vehicleType === 'car' ? (
            <>🚗 {h.plain_car_advice}</>
          ) : (
            <>🏍️ {h.plain_motorbike_advice}</>
          )}
        </p>
      </div>

      {/* 3. Hai nút hành động chính kiểu Google Maps */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenRouteToAvoid(h)}
          className="flex-1 py-2.5 px-4 rounded-full bg-[#1A73E8] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 transition active:scale-95"
        >
          <Navigation className="w-4 h-4" />
          <span>Tìm đường né điểm này</span>
        </button>

        <button
          type="button"
          disabled={isVoting}
          onClick={() => handleQuickVote('confirm_active')}
          className="py-2.5 px-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition"
        >
          <ThumbsUp className="w-3.5 h-3.5 text-[#1A73E8]" />
          <span>Đúng (+1)</span>
        </button>

        <button
          type="button"
          disabled={isVoting}
          onClick={() => handleQuickVote('report_receded')}
          className="py-2.5 px-3 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã rút</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-center">
          {feedbackMsg}
        </div>
      )}

      {/* 4. Nút Mở rộng xem thêm chi tiết (Progressive Disclosure — Không gây rối mắt mặc định) */}
      <button
        type="button"
        onClick={() => setShowMoreDetails((prev) => !prev)}
        className="w-full pt-1 text-xs font-semibold text-[#1A73E8] dark:text-blue-400 flex items-center justify-center gap-1"
      >
        <span>
          {showMoreDetails
            ? 'Thu gọn chi tiết'
            : 'Xem thêm khung giờ hay ngập & Camera giao thông'}
        </span>
        {showMoreDetails ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {showMoreDetails && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div>
            <strong>Khung giờ hay ngập:</strong> {h.typical_timeline}
          </div>
          <div>
            <strong>Gợi ý đường vòng:</strong>{' '}
            {vehicleType === 'car' ? h.detour_routes.car : h.detour_routes.motorcycle}
          </div>
          {h.nearby_camera && (
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Video className="w-4 h-4 text-[#1A73E8] shrink-0" />
                <span className="truncate font-semibold">{h.nearby_camera.name}</span>
              </div>
              <a
                href="http://giaothong.hochiminhcity.gov.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-[#1A73E8] text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
              >
                <span>Mở Cam</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
