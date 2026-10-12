'use client';

import React, { useState } from 'react';
import {
  CloudRain,
  Waves,
  MapPin,
  Sun,
  Moon,
  SlidersHorizontal,
  Info,
  Clock,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';
import type { HcmMvpDistrict } from '@/data/hcm-spatial-seed';
import type { ForecastScenario, TideStationStatus, DistrictRainForecast } from '@/lib/forecast-engine';

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

const DISTRICTS: { value: HcmMvpDistrict | 'ALL'; label: string; shortLabel: string }[] = [
  { value: 'ALL', label: 'Toàn bộ 4 Quận MVP', shortLabel: '4 Quận MVP' },
  { value: 'Bình Thạnh', label: 'Quận Bình Thạnh', shortLabel: 'Bình Thạnh' },
  { value: 'Quận 7', label: 'Quận 7', shortLabel: 'Quận 7' },
  { value: 'Quận 8', label: 'Quận 8', shortLabel: 'Quận 8' },
  { value: 'TP. Thủ Đức', label: 'TP. Thủ Đức', shortLabel: 'Thủ Đức' },
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
    shortBadge: '🌊 Đỉnh triều + Mưa 17h30',
    desc: 'Kịch bản cao điểm: Triều Phú An 1.68m (BĐ3) trùng mưa lớn 35–48mm/h giờ tan tầm.',
  },
  {
    value: 'live',
    label: 'Thực tế Live (Open-Meteo)',
    shortBadge: '🟢 Thực tế Live',
    desc: 'Gọi trực tiếp API thời tiết Open-Meteo & chu kỳ thủy triều thực tế tại TP.HCM.',
  },
  {
    value: 'heavy_rain_only',
    label: 'Mưa lớn cục bộ (Triều thấp)',
    shortBadge: '🌧️ Mưa lớn cục bộ',
    desc: 'Mưa dông nhiệt 40–52mm/h gây ngập các rốn trũng dốc (Thủ Đức, Bình Thạnh), triều <1.40m.',
  },
  {
    value: 'dry_safe',
    label: 'Trời nắng ráo (Ít rủi ro)',
    shortBadge: '☀️ Trời nắng ráo',
    desc: 'Không mưa (0–3mm/h), mực nước triều ổn định dưới Báo động 1.',
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

  // Tính lượng mưa đại diện cho quận đang chọn (hoặc cao nhất trong 4 quận)
  const displayRainMmH = React.useMemo(() => {
    if (!districtRainfall) return 38;
    if (selectedDistrict !== 'ALL' && districtRainfall[selectedDistrict]) {
      return districtRainfall[selectedDistrict].peak_rain_1_3h_mm_h;
    }
    const values = Object.values(districtRainfall).map((d) => d.peak_rain_1_3h_mm_h);
    return values.length > 0 ? Math.max(...values) : 0;
  }, [districtRainfall, selectedDistrict]);

  const peakTideM = tidePhuAn?.peak_level_m ?? 1.68;
  const peakTideTime = tidePhuAn?.peak_time ?? '17:30';

  const getTideBadgeStyle = (level: number) => {
    if (level >= 1.6) {
      return {
        label: 'BĐ3',
        dotColor: 'bg-red-500',
        badgeClass:
          'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40',
      };
    }
    if (level >= 1.5) {
      return {
        label: 'BĐ2',
        dotColor: 'bg-orange-500',
        badgeClass:
          'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40',
      };
    }
    if (level >= 1.4) {
      return {
        label: 'BĐ1',
        dotColor: 'bg-amber-500',
        badgeClass:
          'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40',
      };
    }
    return {
      label: '<BĐ1',
      dotColor: 'bg-emerald-500',
      badgeClass:
        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    };
  };

  const tideStyle = getTideBadgeStyle(peakTideM);

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
      className="fixed top-2.5 inset-x-2.5 z-20 flex flex-col gap-1.5 pointer-events-none"
      aria-label="Thanh trạng thái Khí tượng Thủy văn và Điều khiển Kịch bản"
    >
      {/* Dòng chính: Thanh trạng thái kính mờ chuẩn LibreUIUX O1 */}
      <div className="pointer-events-auto libre-glass rounded-2xl border border-slate-900/10 dark:border-white/15 shadow-lg px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Khối 1: Chỉ số Mưa & Đỉnh triều Phú An (Monospace) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
          {/* Lượng mưa */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs sm:text-sm font-semibold metric-mono ${
              displayRainMmH >= 30
                ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40'
                : displayRainMmH >= 10
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
            }`}
            title="Lượng mưa dự báo lớn nhất trong 1–3h tới"
          >
            <CloudRain className="w-4 h-4 shrink-0" />
            <span>Mưa {displayRainMmH}mm/h</span>
          </div>

          {/* Đỉnh triều Phú An */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs sm:text-sm font-semibold metric-mono ${tideStyle.badgeClass}`}
            title={`Trạm Phú An (Sông Sài Gòn) — Đỉnh triều lúc ${peakTideTime}`}
          >
            <span className={`w-2 h-2 rounded-full ${tideStyle.dotColor} animate-pulse`} />
            <Waves className="w-4 h-4 shrink-0" />
            <span>
              Phú An {peakTideM.toFixed(2)}m ({tideStyle.label})
            </span>
          </div>

          {/* Nút bấm xem chi tiết nguồn & thời gian cập nhật (Walkthrough F1.3) */}
          <button
            type="button"
            onClick={() => setShowSourceInfo((prev) => !prev)}
            className="min-h-[38px] px-2.5 py-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300/70 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition"
            title="Chạm để xem chi tiết nguồn dữ liệu KTTV & Open-Meteo"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="metric-mono">{isLoading ? 'Đang tải...' : formattedTime}</span>
            <span className="hidden md:inline text-slate-500 dark:text-slate-400">• KTTV</span>
            <Info className="w-3.5 h-3.5 opacity-75" />
          </button>
        </div>

        {/* Khối 2: Bộ chọn nhanh 4 Quận + Kịch bản Kiểm thử + Chuyển Sáng/Tối */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Chọn nhanh 4 Quận (Vùng chạm >= 48px chiều cao hit-slop chuẩn F1.1) */}
          <div className="relative flex items-center">
            <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 absolute left-2.5 pointer-events-none" />
            <select
              aria-label="Chọn nhanh Quận trọng điểm"
              value={selectedDistrict}
              onChange={(e) => onDistrictChange(e.target.value as HcmMvpDistrict | 'ALL')}
              className="wet-touch-target pl-7 pr-7 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/95 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DISTRICTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.shortLabel}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 pointer-events-none" />
          </div>

          {/* Bộ chuyển kịch bản kiểm thử thực tế */}
          <div className="relative flex items-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 absolute left-2.5 pointer-events-none" />
            <select
              aria-label="Chọn kịch bản thời tiết & triều cường kiểm thử"
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value as ForecastScenario)}
              className="wet-touch-target pl-7 pr-7 py-1.5 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/40 text-xs sm:text-sm font-bold text-violet-900 dark:text-violet-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500 max-w-[165px] sm:max-w-[220px] truncate"
            >
              {SCENARIOS.map((sc) => (
                <option
                  key={sc.value}
                  value={sc.value}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {sc.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-violet-500 absolute right-2 pointer-events-none" />
          </div>

          {/* Nút chuyển đổi giao diện Sáng (Outdoor Sunlight) / Tối (Night Rain) >= 48x48px */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={
              isDarkMode
                ? 'Chuyển sang Chế độ Ban ngày Ngoài trời nắng (Light Mode)'
                : 'Chuyển sang Chế độ Ban đêm Mưa lớn (Night Rain Dark Mode)'
            }
            title={
              isDarkMode
                ? 'Đang bật: Chế độ Ban đêm / Mưa mù trời (Chống lóa). Bấm để đổi sang Sáng.'
                : 'Đang bật: Chế độ Ngoài trời nắng (Tương phản cao). Bấm để đổi sang Tối.'
            }
            className="wet-touch-target flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-amber-300 transition shadow-sm px-2.5"
          >
            {isDarkMode ? (
              <div className="flex items-center gap-1 text-xs font-bold">
                <Moon className="w-4 h-4 text-amber-300" />
                <span className="hidden lg:inline">Đêm mưa</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden lg:inline">Nắng gắt</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Popover giải thích chi tiết Nguồn dữ liệu & Độ tin cậy khi người dùng bấm vào giờ cập nhật */}
      {showSourceInfo && (
        <div className="pointer-events-auto libre-glass rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xl p-3 text-xs space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-500" />
              Minh bạch Nguồn Dữ Liệu & Độ Tươi (Chuẩn Rule 7)
            </span>
            <button
              type="button"
              onClick={() => setShowSourceInfo(false)}
              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Đóng ✕
            </button>
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            • <strong>Nguồn khí tượng & thủy văn:</strong> {weatherSourceLabel}
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            • <strong>Trạm Phú An (Sông Sài Gòn):</strong> Hiện tại{' '}
            <span className="metric-mono font-bold">{tidePhuAn?.current_level_m ?? 1.62}m</span> |
            Đỉnh triều{' '}
            <span className="metric-mono font-bold">{tidePhuAn?.peak_level_m ?? 1.68}m</span> lúc{' '}
            <span className="metric-mono font-bold">{tidePhuAn?.peak_time ?? '17:30'}</span> (
            {tidePhuAn?.alert_stage})
          </p>
          <p className="text-slate-700 dark:text-slate-300">
            • <strong>Trạm Nhà Bè (Kênh Đồng Điền):</strong> Đỉnh triều{' '}
            <span className="metric-mono font-bold">{tideNhaBe?.peak_level_m ?? 1.7}m</span> lúc{' '}
            <span className="metric-mono font-bold">{tideNhaBe?.peak_time ?? '17:15'}</span> •{' '}
            <strong>Điểm ngập nguy hiểm (Cấp 2–3):</strong>{' '}
            <span className="metric-mono font-bold text-red-500">{highRiskCount}/18 tuyến</span>
          </p>
          {isFallbackWeather && (
            <p className="text-amber-600 dark:text-amber-400 font-semibold">
              ⚠️ Lưu ý: Đang sử dụng bản tin dự phòng nội bộ do kết nối Open-Meteo chậm.
            </p>
          )}
        </div>
      )}
    </header>
  );
}
