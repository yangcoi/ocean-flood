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
    value: 'peak_tide_rain',
    label: '🌊 Đỉnh triều + Mưa lớn 17h30',
    desc: 'Cao điểm: Triều 1.68m (BĐ3) trùng mưa lớn 48mm/h.',
  },
  {
    value: 'live',
    label: '🟢 Thời tiết thực tế (Live)',
    desc: 'Lấy lượng mưa trực tiếp từ Open-Meteo hiện tại.',
  },
  {
    value: 'heavy_rain_only',
    label: '🌧️ Mưa lớn cục bộ',
    desc: 'Mưa dông 45mm/h, triều cường thấp.',
  },
  {
    value: 'dry_safe',
    label: '☀️ Trời nắng ráo',
    desc: 'Không mưa, đường khô ráo.',
  },
];

/**
 * Thanh tìm kiếm nổi chuẩn Google Maps:
 * - Hàng 1: Pill trắng bóng đổ chứa ô "Tìm đường tránh ngập..." + Nút thời tiết gọn + Nút Sáng/Tối
 * - Hàng 2: Các chip chọn nhanh Quận và Tóm tắt Mưa/Triều nằm ngang nhẹ nhàng trên nền bản đồ
 */
export default function TopStatusBar({
  scenario,
  onScenarioChange,
  selectedDistrict,
  onDistrictChange,
  isDarkMode,
  onToggleDarkMode,
  tidePhuAn,
  districtRainfall,
  onOpenRoutePlanner,
}: TopStatusBarProps) {
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
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Tìm đường né ngập tại TP.HCM...
            </span>
          </div>
        </button>

        {/* Chip Thời tiết Mưa + Triều gọn gàng bên phải ô tìm kiếm */}
        <button
          type="button"
          onClick={() => setShowScenarioMenu((prev) => !prev)}
          className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1 shrink-0 border border-blue-200/80 dark:border-slate-700"
          title="Chạm để đổi kịch bản Mưa & Triều cường"
        >
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

      {/* HÀNG 2: CHIP CHỌN NHANH QUẬN KIỂU GOOGLE MAPS */}
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

      {/* MENU ĐỔI KỊCH BẢN MƯA & TRIỀU CƯỜNG */}
      {showScenarioMenu && (
        <div className="pointer-events-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-3 space-y-1.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              Chọn tình huống thời tiết &amp; triều cường
            </span>
            <button
              type="button"
              onClick={() => setShowScenarioMenu(false)}
              className="text-xs text-slate-500 font-semibold"
            >
              Đóng ✕
            </button>
          </div>
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
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-[#1A73E8] dark:text-blue-300 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{sc.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{sc.desc}</div>
                </div>
                {active && <Check className="w-4 h-4 text-[#1A73E8] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
