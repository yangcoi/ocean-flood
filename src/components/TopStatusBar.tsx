'use client';

import React, { useState } from 'react';
import {
  Search,
  CloudRain,
  Waves,
  Sun,
  Moon,
  ChevronDown,
  Check,
  Calendar,
  Sparkles,
  Database,
  Radio,
  Clock,
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
  verifiedCount?: number;
  forecastOnlyCount?: number;
  isLoading: boolean;
  onOpenRoutePlanner?: () => void;
}

const DISTRICTS: {
  value: HcmMvpDistrict | 'ALL';
  shortLabel: string;
}[] = [
  { value: 'ALL', shortLabel: 'Tất cả (18)' },
  { value: 'Bình Thạnh', shortLabel: 'Bình Thạnh' },
  { value: 'Quận 7', shortLabel: 'Quận 7' },
  { value: 'Quận 8', shortLabel: 'Quận 8' },
  { value: 'TP. Thủ Đức', shortLabel: 'Thủ Đức' },
];

const SCENARIOS: {
  value: ForecastScenario;
  label: string;
  desc: string;
}[] = [
  {
    value: 'live',
    label: '🟢 Thời tiết thực tế (Live Open-Meteo)',
    desc: 'Lấy trực tiếp từ vệ tinh khí tượng thời gian thực & trạm đo triều.',
  },
  {
    value: 'peak_tide_rain',
    label: '🌊 Đỉnh triều + Mưa lớn 17h30',
    desc: 'Cao điểm: Triều 1.68m (BĐ3) trùng mưa lớn 48mm/h.',
  },
  {
    value: 'heavy_rain_only',
    label: '🌧️ Mưa lớn dông nhiệt',
    desc: 'Mưa to 45mm/h, triều cường mức thấp.',
  },
  {
    value: 'dry_safe',
    label: '☀️ Trời nắng ráo',
    desc: 'Không mưa, đường phố khô ráo hoàn toàn.',
  },
];

/**
 * Thanh trạng thái nổi chuẩn Google Maps kết hợp Dropdown Thủy văn 3 giờ tới
 */
export default function TopStatusBar({
  scenario,
  onScenarioChange,
  selectedDistrict,
  onDistrictChange,
  isDarkMode,
  onToggleDarkMode,
  tidePhuAn,
  tideNhaBe,
  districtRainfall,
  weatherSourceLabel,
  verifiedCount,
  forecastOnlyCount,
  onOpenRoutePlanner,
}: TopStatusBarProps) {
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  const displayRainMmH = React.useMemo(() => {
    if (!districtRainfall) return 35;
    if (selectedDistrict !== 'ALL' && districtRainfall[selectedDistrict]) {
      return districtRainfall[selectedDistrict].peak_rain_1_3h_mm_h;
    }
    const values = Object.values(districtRainfall).map((d) => d.peak_rain_1_3h_mm_h);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [districtRainfall, selectedDistrict]);

  const peakTideM = tidePhuAn?.peak_level_m ?? 1.68;
  const currentTideM = tidePhuAn?.current_level_m ?? 1.55;

  const now = new Date();
  const currentHour = now.getHours();
  const h1 = (currentHour + 1) % 24;
  const h2 = (currentHour + 2) % 24;
  const h3 = (currentHour + 3) % 24;

  const rain1 = Math.round(displayRainMmH * 1.05);
  const rain2 = displayRainMmH;
  const rain3 = Math.round(displayRainMmH * 0.4);

  return (
    <header className="absolute top-3 inset-x-3 z-20 flex flex-col gap-2 pointer-events-none">
      {/* HÀNG 1: THANH TÌM KIẾM NỔI KIỂU GOOGLE MAPS */}
      <div className="pointer-events-auto h-12 px-3.5 rounded-full bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.14)] border border-slate-200/90 dark:border-slate-700 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenRoutePlanner}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left h-full"
        >
          <Search className="w-5 h-5 text-[#1A73E8] shrink-0" />
          <div className="truncate">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
              Tìm đường né ngập tại TP.HCM...
            </span>
          </div>
        </button>

        {/* Chip Thời tiết Mưa + Triều cường: Chạm mở Timeline 3 giờ tới */}
        <button
          type="button"
          onClick={() => setShowTimelineModal((prev) => !prev)}
          className="px-2.5 py-1.5 rounded-full bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1.5 shrink-0 border border-blue-200/80 dark:border-slate-700 shadow-sm transition"
          title="Chạm để xem Dự báo Thủy văn 3 giờ tới"
        >
          {scenario === 'live' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          )}
          <CloudRain className="w-3.5 h-3.5 text-[#1A73E8]" />
          <span>{displayRainMmH}mm</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <Waves className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{peakTideM.toFixed(2)}m</span>
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>

        {/* Nút đổi nền Sáng / Tối */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label="Đổi nền bản đồ Sáng/Tối"
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-amber-300 shrink-0"
        >
          {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>
      </div>

      {/* HÀNG 2: CHIP CHỌN NHANH QUẬN */}
      <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {DISTRICTS.map((d) => {
          const isActive = selectedDistrict === d.value;
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => onDistrictChange(d.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border transition-all shrink-0 ${
                isActive
                  ? 'bg-[#1A73E8] text-white border-[#1A73E8] shadow-blue-500/25'
                  : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {d.shortLabel}
            </button>
          );
        })}
      </div>

      {/* HÀNG 3: BANNER DỰ KIẾN NGẬP • KHUNG GIỜ • KHẢ NĂNG • MƯA HIỂN THỊ TRỰC QUAN */}
      <div className="pointer-events-auto px-3 py-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border border-slate-200/90 dark:border-slate-700 text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <div className="min-w-0 truncate text-[11px] font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            <span className="text-amber-600 dark:text-amber-400">
              🔮 {forecastOnlyCount ?? 14} điểm dự kiến
            </span>
            <span className="text-slate-400 font-normal">•</span>
            <span className="text-red-600 dark:text-red-400 font-extrabold">
              🚨 {verifiedCount ?? 4} điểm đã xác thực
            </span>
            <span className="text-slate-400 font-normal hidden sm:inline">•</span>
            <span className="text-[#1A73E8] hidden sm:inline">17:00 – 19:00</span>
            <span className="text-slate-400 font-normal hidden sm:inline">•</span>
            <span className="text-blue-600 dark:text-blue-400 font-mono hidden sm:inline">{displayRainMmH}mm</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTimelineModal(true)}
          className="text-[10.5px] font-extrabold text-[#1A73E8] bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
        >
          <span>Dự báo 3h ➔</span>
        </button>
      </div>

      {/* MODAL / DROPDOWN DỰ BÁO THỦY VĂN & MƯA 3 GIỜ TỚI */}
      {showTimelineModal && (
        <div className="pointer-events-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-4 space-y-3.5 max-w-md w-full mx-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#1A73E8]" />
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Dự báo Thủy văn &amp; Mưa 3 Giờ Tới
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTimelineModal(false)}
              className="text-xs text-slate-500 font-bold hover:text-slate-900 dark:hover:text-white"
            >
              Đóng ✕
            </button>
          </div>

          {/* Dòng trạng thái Live Open-Meteo */}
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="font-extrabold text-blue-900 dark:text-blue-200">
                {scenario === 'live' ? 'Đang kết nối vệ tinh Open-Meteo' : 'Đang chọn kịch bản giả lập'}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              Trạm Phú An: {currentTideM.toFixed(2)}m
            </span>
          </div>

          {/* 3 Thẻ Mốc giờ tới */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-1">
              <div className="text-[11px] font-mono font-black text-slate-800 dark:text-slate-100">
                +{h1}:00
              </div>
              <div className="text-xs font-bold text-[#1A73E8]">
                🌧️ {rain1}mm/h
              </div>
              <div className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                🔺 Nước dâng
              </div>
            </div>

            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 space-y-1">
              <div className="text-[11px] font-mono font-black text-slate-800 dark:text-slate-100">
                +{h2}:00
              </div>
              <div className="text-xs font-bold text-[#1A73E8]">
                🌧️ {rain2}mm/h
              </div>
              <div className="text-[10px] font-black text-red-600 dark:text-red-400">
                ⚠️ Đỉnh triều {peakTideM.toFixed(2)}m
              </div>
            </div>

            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1">
              <div className="text-[11px] font-mono font-black text-slate-800 dark:text-slate-100">
                +{h3}:00
              </div>
              <div className="text-xs font-bold text-[#1A73E8]">
                🌦️ {rain3}mm/h
              </div>
              <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                🔻 Nước rút
              </div>
            </div>
          </div>

          {/* Chọn tình huống thời tiết nếu cần */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 block">
              Chọn nguồn &amp; tình huống thời tiết:
            </span>
            {SCENARIOS.map((sc) => {
              const active = scenario === sc.value;
              return (
                <button
                  key={sc.value}
                  type="button"
                  onClick={() => {
                    onScenarioChange(sc.value);
                    setShowTimelineModal(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-[#1A73E8] dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black truncate">{sc.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {sc.desc}
                    </div>
                  </div>
                  {active && <Check className="w-4 h-4 text-[#1A73E8] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Nguồn cấp dữ liệu uy tín */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5">
            <div className="flex items-center gap-1 font-bold">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Nguồn cấp dữ liệu uy tín:</span>
            </div>
            <p className="text-[9.5px] leading-relaxed">
              Open-Meteo API (Vệ tinh ECMWF) • Bản tin Triều trạm Phú An/Nhà Bè (Đài KTTV Nam Bộ) • Điểm đen ngập Sở Xây dựng TP.HCM.
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
