'use client';

import React, { useState } from 'react';
import {
  CloudRain,
  Waves,
  Sun,
  Moon,
  SlidersHorizontal,
  Info,
  ChevronDown,
  ShieldAlert,
  Sparkles,
  Check,
} from 'lucide-react';
import type { HcmMvpDistrict } from '@/data/hcm-spatial-seed';
import type {
  ForecastScenario,
  TideStationStatus,
  DistrictRainForecast,
} from '@/lib/forecast-engine';

export interface TopStatusBarProps {
  scenario: ForecastScenario;
  onScenarioChange: (scenario: ForecastScenario) => void;
  selectedDistrict: HcmMvpDistrict | 'ALL';
  onDistrictChange: (district: HcmMvpDistrict | 'ALL') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  updatedAt: string;
  weatherSourceLabel: string;
  isFallbackWeather: boolean;
  tidePhuAn: TideStationStatus | null;
  tideNhaBe: TideStationStatus | null;
  districtRainfall: Record<HcmMvpDistrict, DistrictRainForecast> | null;
  highRiskCount: number;
  isLoading: boolean;
}

const DISTRICTS: {
  value: HcmMvpDistrict | 'ALL';
  label: string;
  shortLabel: string;
  count: number;
}[] = [
  { value: 'ALL', label: 'Toàn bộ 4 Quận MVP', shortLabel: 'Tất cả (18)', count: 18 },
  { value: 'Bình Thạnh', label: 'Quận Bình Thạnh', shortLabel: 'Bình Thạnh', count: 6 },
  { value: 'Quận 7', label: 'Quận 7', shortLabel: 'Quận 7', count: 4 },
  { value: 'Quận 8', label: 'Quận 8', shortLabel: 'Quận 8', count: 4 },
  { value: 'TP. Thủ Đức', label: 'TP. Thủ Đức', shortLabel: 'Thủ Đức', count: 4 },
];

const SCENARIOS: {
  value: ForecastScenario;
  label: string;
  shortBadge: string;
  desc: string;
}[] = [
  {
    value: 'peak_tide_rain',
    label: 'Đỉnh triều + Mưa lớn 17h30',
    shortBadge: 'Đỉnh triều + Mưa',
    desc: 'Cao điểm: Triều Phú An 1.68m (BĐ3) trùng mưa lớn 38–48mm/h giờ tan tầm.',
  },
  {
    value: 'live',
    label: 'Thực tế Live (Open-Meteo)',
    shortBadge: 'Thực tế Live',
    desc: 'Dữ liệu thực tế từ API Open-Meteo & chu kỳ bán nhật triều Sông Sài Gòn.',
  },
  {
    value: 'heavy_rain_only',
    label: 'Mưa lớn cục bộ (Triều thấp)',
    shortBadge: 'Mưa cục bộ',
    desc: 'Mưa dông nhiệt 40–52mm/h gây ngập rốn trũng dốc, mực triều <1.40m.',
  },
  {
    value: 'dry_safe',
    label: 'Trời nắng ráo (Ít rủi ro)',
    shortBadge: 'Nắng ráo',
    desc: 'Không mưa (0–3mm/h), mực nước triều ổn định dưới mức Báo động 1.',
  },
];

export default function TopStatusBar({
  scenario,
  onScenarioChange,
  selectedDistrict,
  onDistrictChange,
  isDarkMode,
  onToggleDarkMode,
  updatedAt,
  weatherSourceLabel,
  isFallbackWeather,
  tidePhuAn,
  tideNhaBe,
  districtRainfall,
  highRiskCount,
  isLoading,
}: TopStatusBarProps) {
  const [showSourceInfo, setShowSourceInfo] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);

  const displayRainMmH = React.useMemo(() => {
    if (!districtRainfall) return 48;
    if (selectedDistrict !== 'ALL' && districtRainfall[selectedDistrict]) {
      return districtRainfall[selectedDistrict].peak_rain_1_3h_mm_h;
    }
    const values = Object.values(districtRainfall).map((d) => d.peak_rain_1_3h_mm_h);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [districtRainfall, selectedDistrict]);

  const peakTideM = tidePhuAn?.peak_level_m ?? 1.68;
  const peakTideTime = tidePhuAn?.peak_time ?? '17:30';

  const getRainSeverity = (mm: number) => {
    if (mm >= 40) {
      return {
        tag: 'Mưa rất to',
        colorClass: 'text-orange-500 dark:text-orange-400',
        pillClass:
          'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
      };
    }
    if (mm >= 20) {
      return {
        tag: 'Mưa lớn',
        colorClass: 'text-amber-500 dark:text-amber-400',
        pillClass:
          'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      };
    }
    return {
      tag: 'Mưa nhỏ / Tạnh',
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      pillClass:
        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    };
  };

  const getTideBadgeStyle = (level: number) => {
    if (level >= 1.6) {
      return {
        label: 'BĐ3',
        dotColor: 'bg-red-500',
        pillClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
      };
    }
    if (level >= 1.5) {
      return {
        label: 'BĐ2',
        dotColor: 'bg-orange-500',
        pillClass:
          'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
      };
    }
    if (level >= 1.4) {
      return {
        label: 'BĐ1',
        dotColor: 'bg-amber-500',
        pillClass:
          'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      };
    }
    return {
      label: '<BĐ1',
      dotColor: 'bg-emerald-500',
      pillClass:
        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    };
  };

  const rainMeta = getRainSeverity(displayRainMmH);
  const tideStyle = getTideBadgeStyle(peakTideM);
  const currentScenarioObj =
    SCENARIOS.find((s) => s.value === scenario) || SCENARIOS[0];

  const formattedTime = React.useMemo(() => {
    if (!updatedAt) return 'Vừa xong';
    try {
      const d = new Date(updatedAt);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Vừa xong';
    }
  }, [updatedAt]);

  return (
    <header
      className="absolute top-2.5 inset-x-2.5 z-20 flex flex-col gap-1.5 pointer-events-none"
      aria-label="Thanh trạng thái Khí tượng Thủy văn và Điều khiển Kịch bản"
    >
      {/* KHỐI CHÍNH: HUD KÍNH MỜ PHÂN CẤP THỊ GIÁC CHUẨN LIBREUIUX */}
      <div className="pointer-events-auto libre-glass rounded-[22px] border border-slate-200/80 dark:border-white/12 shadow-[0_12px_36px_rgba(0,0,0,0.35)] p-2.5 flex flex-col gap-2">
        {/* Hàng 1: Thương hiệu Ocean Flood + Bộ chọn kịch bản Pill + Thông tin nguồn + Đổi Sáng/Tối */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Waves className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
                  Ocean Flood
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-[10px] font-bold text-red-600 dark:text-red-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  {highRiskCount} điểm ngập
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Nút mở menu Kịch bản Thời tiết & Triều cường (Thay thế <select> thô) */}
            <button
              type="button"
              onClick={() => {
                setShowScenarioMenu((prev) => !prev);
                setShowSourceInfo(false);
              }}
              className="h-7 px-2.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/35 text-[11px] font-bold text-violet-700 dark:text-violet-200 flex items-center gap-1 transition active:scale-95"
              title="Chuyển kịch bản kiểm thử dự báo ngập 1–3h"
            >
              <SlidersHorizontal className="w-3 h-3 text-violet-500 dark:text-violet-300 shrink-0" />
              <span className="truncate max-w-[105px]">{currentScenarioObj.shortBadge}</span>
              <ChevronDown className="w-3 h-3 opacity-75 shrink-0" />
            </button>

            {/* Nút xem Nguồn dữ liệu & Thời gian */}
            <button
              type="button"
              onClick={() => {
                setShowSourceInfo((prev) => !prev);
                setShowScenarioMenu(false);
              }}
              aria-label="Xem thông tin nguồn dữ liệu KTTV"
              className={`h-7 w-7 rounded-xl flex items-center justify-center border transition ${
                showSourceInfo
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={`Cập nhật lúc ${formattedTime} — Chạm để xem nguồn dữ liệu`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Nút chuyển đổi giao diện Sáng / Tối */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={
                isDarkMode
                  ? 'Chuyển sang Giao diện Sáng (Ban ngày ngoài nắng)'
                  : 'Chuyển sang Giao diện Tối (Ban đêm mưa lớn)'
              }
              className="h-7 w-7 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-300 transition"
            >
              {isDarkMode ? (
                <Moon className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )}
            </button>
          </div>
        </div>

        {/* Hàng 2: 2 Thẻ Chỉ Số Khoa Học Đối Xứng (Mưa dự báo 1–3h & Đỉnh triều Phú An) — Gestalt Similarity */}
        <div className="grid grid-cols-2 gap-1.5">
          {/* Thẻ 1: Lượng mưa dự báo 1-3h */}
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/75 border border-slate-200/80 dark:border-white/8 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center shrink-0">
                <CloudRain className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                  Mưa dự báo 1–3h
                </div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white metric-mono leading-tight mt-0.5">
                  {displayRainMmH} mm/h
                </div>
              </div>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-md border text-[9.5px] font-bold shrink-0 ${rainMeta.pillClass}`}
            >
              {rainMeta.tag}
            </span>
          </div>

          {/* Thẻ 2: Đỉnh triều trạm Phú An */}
          <div className="px-2.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/75 border border-slate-200/80 dark:border-white/8 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <Waves className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                  Triều Phú An ({peakTideTime})
                </div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white metric-mono leading-tight mt-0.5">
                  +{peakTideM.toFixed(2)}m
                </div>
              </div>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-md border text-[9.5px] font-bold shrink-0 flex items-center gap-1 ${tideStyle.pillClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tideStyle.dotColor} animate-pulse`} />
              {tideStyle.label}
            </span>
          </div>
        </div>

        {/* Hàng 3: Thanh Pill Chọn Nhanh 4 Quận MVP (Cuộn ngang mượt, chuẩn Apple Maps, không dùng <select>) */}
        <div
          className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5"
          role="tablist"
          aria-label="Lọc nhanh theo Quận trọng điểm"
        >
          {DISTRICTS.map((d) => {
            const isActive = selectedDistrict === d.value;
            return (
              <button
                key={d.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onDistrictChange(d.value)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'bg-slate-100/80 dark:bg-slate-800/75 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {d.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* POPOVER CHỌN KỊCH BẢN THỜI TIẾT & TRIỀU CƯỜNG */}
      {showScenarioMenu && (
        <div className="pointer-events-auto libre-glass rounded-2xl border border-violet-500/35 shadow-2xl p-2.5 space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-extrabold text-violet-700 dark:text-violet-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Giả lập Kịch bản Dự báo Mưa &amp; Triều (1–3h)
            </span>
            <button
              type="button"
              onClick={() => setShowScenarioMenu(false)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white px-1.5"
            >
              Đóng ✕
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {SCENARIOS.map((sc) => {
              const active = scenario === sc.value;
              return (
                <button
                  key={sc.value}
                  type="button"
                  onClick={() => {
                    onScenarioChange(sc.value);
                    setShowScenarioMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl border transition flex items-start justify-between gap-2 ${
                    active
                      ? 'bg-violet-600/20 border-violet-500 text-slate-900 dark:text-white'
                      : 'bg-slate-100/60 dark:bg-slate-900/60 border-transparent hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold">{sc.label}</div>
                    <div className="text-[10.5px] opacity-80 leading-snug mt-0.5">
                      {sc.desc}
                    </div>
                  </div>
                  {active && (
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* POPOVER CHI TIẾT NGUỒN DỮ LIỆU KHÍ TƯỢNG THỦY VĂN */}
      {showSourceInfo && (
        <div
          role="region"
          aria-label="Chi tiết nguồn dữ liệu khí tượng thủy văn"
          className="pointer-events-auto libre-glass rounded-2xl border border-slate-200 dark:border-white/15 shadow-2xl p-3 text-xs space-y-1.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Nguồn Dữ Liệu Thủy Văn &amp; Thời Gian Thực</span>
            </span>
            <button
              type="button"
              onClick={() => setShowSourceInfo(false)}
              className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
            >
              Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600 dark:text-slate-300">
            <div>
              • <strong>Nguồn mưa:</strong> {weatherSourceLabel}{' '}
              {isFallbackWeather ? '(Dự phòng Offline)' : `(Cập nhật lúc ${formattedTime})`}
            </div>
            <div>
              • <strong>Trạm Phú An (Sông Sài Gòn):</strong> Hiện tại{' '}
              <span className="metric-mono font-bold">
                +{tidePhuAn?.current_level_m.toFixed(2) ?? '1.62'}m
              </span>{' '}
              • Đỉnh triều{' '}
              <span className="metric-mono font-bold text-red-500 dark:text-red-400">
                +{peakTideM.toFixed(2)}m lúc {peakTideTime}
              </span>
            </div>
            <div>
              • <strong>Trạm Nhà Bè (Kênh Đồng Điền):</strong> Đỉnh triều{' '}
              <span className="metric-mono font-bold">
                +{tideNhaBe?.peak_level_m.toFixed(2) ?? '1.70'}m lúc{' '}
                {tideNhaBe?.peak_time ?? '17:45'}
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
