'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Navigation,
  ArrowUpDown,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Route,
  Sparkles,
  MapPin,
} from 'lucide-react';
import type { HcmMvpDistrict } from '@/data/hcm-spatial-seed';
import type { ForecastScenario } from '@/lib/forecast-engine';
import type {
  VehicleType,
  RouteWaypointInput,
  RoutePlanResponseOutput,
} from '@/lib/routing-engine';

export interface SavedCommutePreset {
  id: string;
  label: string;
  district: HcmMvpDistrict;
  origin: RouteWaypointInput;
  destination: RouteWaypointInput;
  vehicle_type: VehicleType;
}

export const POPULAR_HCM_COMMUTE_PRESETS: SavedCommutePreset[] = [
  {
    id: 'preset-bt-nguyen-xi',
    label: 'Bình Thạnh: Phạm Văn Đồng ➔ Hàng Xanh (Né Nguyễn Xí & Đinh Bộ Lĩnh)',
    district: 'Bình Thạnh',
    origin: {
      lat: 10.8205,
      lng: 106.7075,
      label: 'Cầu Bình Lợi / Phạm Văn Đồng (Bình Thạnh)',
    },
    destination: {
      lat: 10.8012,
      lng: 106.7108,
      label: 'Vòng xoay Hàng Xanh – Điện Biên Phủ (Bình Thạnh)',
    },
    vehicle_type: 'motorcycle',
  },
  {
    id: 'preset-q7-huynh-tan-phat',
    label: 'Quận 7: Cầu Tân Thuận ➔ Phú Xuân (Né rốn ngập Huỳnh Tấn Phát)',
    district: 'Quận 7',
    origin: {
      lat: 10.7455,
      lng: 106.7295,
      label: 'Đầu đường Huỳnh Tấn Phát – Tân Thuận (Quận 7)',
    },
    destination: {
      lat: 10.7205,
      lng: 106.7345,
      label: 'Khu vực Phú Mỹ / Cầu Phú Xuân (Quận 7)',
    },
    vehicle_type: 'motorcycle',
  },
  {
    id: 'preset-td-thao-dien',
    label: 'Thủ Đức ➔ Quận 1: Thảo Điền ➔ Cầu Sài Gòn (Né túi ngập Quốc Hương)',
    district: 'TP. Thủ Đức',
    origin: {
      lat: 10.8095,
      lng: 106.7362,
      label: 'Khu biệt thự Thảo Điền – Nguyễn Văn Hưởng (TP. Thủ Đức)',
    },
    destination: {
      lat: 10.7985,
      lng: 106.7235,
      label: 'Chân Cầu Sài Gòn – Điện Biên Phủ (Hướng về Quận 1)',
    },
    vehicle_type: 'car',
  },
  {
    id: 'preset-q8-me-coc',
    label: 'Quận 8: Cầu Chà Và ➔ Phú Định (Né triều cường kênh Mễ Cốc)',
    district: 'Quận 8',
    origin: {
      lat: 10.7248,
      lng: 106.6368,
      label: 'Đầu đường Bến Mễ Cốc – Phường 15 (Quận 8)',
    },
    destination: {
      lat: 10.7188,
      lng: 106.6275,
      label: 'Cầu Lò Gốm – Đại lộ Võ Văn Kiệt (Quận 8)',
    },
    vehicle_type: 'motorcycle',
  },
  {
    id: 'preset-td-vo-van-ngan',
    label: 'Thủ Đức: Ngã tư Thủ Đức ➔ Phạm Văn Đồng (Né dốc chảy xiết Võ Văn Ngân)',
    district: 'TP. Thủ Đức',
    origin: {
      lat: 10.8502,
      lng: 106.7635,
      label: 'Ngã tư Thủ Đức – Đầu dốc Võ Văn Ngân (TP. Thủ Đức)',
    },
    destination: {
      lat: 10.8512,
      lng: 106.7515,
      label: 'Kha Vạn Cân – Đại lộ Phạm Văn Đồng (TP. Thủ Đức)',
    },
    vehicle_type: 'motorcycle',
  },
  {
    id: 'preset-bt-thanh-da',
    label: 'Bình Thạnh: Cư xá Thanh Đa ➔ Bình Quới (Kiểm tra bán đảo độc đạo)',
    district: 'Bình Thạnh',
    origin: {
      lat: 10.8135,
      lng: 106.7185,
      label: 'Cầu Kinh Thanh Đa (Bình Thạnh)',
    },
    destination: {
      lat: 10.8225,
      lng: 106.7335,
      label: 'Bến đò Bình Quới – Thanh Đa (Bình Thạnh)',
    },
    vehicle_type: 'motorcycle',
  },
];

export const SAVED_COMMUTE_STORAGE_KEY = 'ocean_flood_saved_commutes';

export interface RoutePlannerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleType: VehicleType;
  onChangeVehicle: (type: VehicleType) => void;
  scenario: ForecastScenario;
  selectedDistrict: HcmMvpDistrict | 'ALL';
  onSelectDistrict: (district: HcmMvpDistrict | 'ALL') => void;
  activeRoutePlan: RoutePlanResponseOutput | null;
  onRoutePlanComputed: (
    plan: RoutePlanResponseOutput,
    origin: RouteWaypointInput,
    destination: RouteWaypointInput
  ) => void;
  onClearRoutePlan: () => void;
  initialOrigin?: RouteWaypointInput | null;
  initialDestination?: RouteWaypointInput | null;
}

export default function RoutePlannerDrawer({
  isOpen,
  onClose,
  vehicleType,
  onChangeVehicle,
  scenario,
  selectedDistrict,
  onSelectDistrict,
  activeRoutePlan,
  onRoutePlanComputed,
  onClearRoutePlan,
  initialOrigin,
  initialDestination,
}: RoutePlannerDrawerProps) {
  const [originLabel, setOriginLabel] = useState(
    POPULAR_HCM_COMMUTE_PRESETS[0].origin.label || ''
  );
  const [originLat, setOriginLat] = useState(POPULAR_HCM_COMMUTE_PRESETS[0].origin.lat);
  const [originLng, setOriginLng] = useState(POPULAR_HCM_COMMUTE_PRESETS[0].origin.lng);

  const [destLabel, setDestLabel] = useState(
    POPULAR_HCM_COMMUTE_PRESETS[0].destination.label || ''
  );
  const [destLat, setDestLat] = useState(POPULAR_HCM_COMMUTE_PRESETS[0].destination.lat);
  const [destLng, setDestLng] = useState(POPULAR_HCM_COMMUTE_PRESETS[0].destination.lng);

  const [isCalculating, setIsCalculating] = useState(false);
  const [savedCommute, setSavedCommute] = useState<SavedCommutePreset | null>(null);
  const [saveSuccessBanner, setSaveSuccessBanner] = useState(false);
  const [showCustomCoords, setShowCustomCoords] = useState(false);

  // Đọc lộ trình đã lưu từ localStorage khi mở
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_COMMUTE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedCommutePreset;
        if (parsed?.origin?.lat && parsed?.destination?.lat) {
          setSavedCommute(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [isOpen]);

  // Nếu người dùng bấm "Tìm đường né đoạn này" từ AlertBottomSheet
  useEffect(() => {
    if (initialOrigin && initialDestination) {
      setOriginLabel(initialOrigin.label || 'Điểm xuất phát');
      setOriginLat(initialOrigin.lat);
      setOriginLng(initialOrigin.lng);
      setDestLabel(initialDestination.label || 'Điểm đến');
      setDestLat(initialDestination.lat);
      setDestLng(initialDestination.lng);
      triggerRouteCalculation(initialOrigin, initialDestination, vehicleType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrigin, initialDestination]);

  // Tự động tính lại lộ trình khi đổi loại xe (Xe máy <-> Ô tô) hoặc kịch bản nếu đang có lộ trình
  useEffect(() => {
    if (activeRoutePlan) {
      triggerRouteCalculation(
        { lat: originLat, lng: originLng, label: originLabel },
        { lat: destLat, lng: destLng, label: destLabel },
        vehicleType
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType, scenario]);

  const triggerRouteCalculation = async (
    orig: RouteWaypointInput,
    dest: RouteWaypointInput,
    vType: VehicleType
  ) => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/route-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: orig,
          destination: dest,
          vehicle_type: vType,
          scenario,
        }),
      });
      if (res.ok) {
        const plan = (await res.json()) as RoutePlanResponseOutput;
        onRoutePlanComputed(plan, orig, dest);
      }
    } catch {
      // ignore network error
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSelectPreset = (preset: SavedCommutePreset) => {
    setOriginLabel(preset.origin.label || '');
    setOriginLat(preset.origin.lat);
    setOriginLng(preset.origin.lng);
    setDestLabel(preset.destination.label || '');
    setDestLat(preset.destination.lat);
    setDestLng(preset.destination.lng);
    onSelectDistrict(preset.district);
    triggerRouteCalculation(preset.origin, preset.destination, vehicleType);
  };

  const handleSwapWaypoints = () => {
    const tempLabel = originLabel;
    const tempLat = originLat;
    const tempLng = originLng;
    const newOrig = { lat: destLat, lng: destLng, label: destLabel };
    const newDest = { lat: tempLat, lng: tempLng, label: tempLabel };

    setOriginLabel(newOrig.label);
    setOriginLat(newOrig.lat);
    setOriginLng(newOrig.lng);
    setDestLabel(newDest.label);
    setDestLat(newDest.lat);
    setDestLng(newDest.lng);

    triggerRouteCalculation(newOrig, newDest, vehicleType);
  };

  const handleSaveDailyCommute = () => {
    const toSave: SavedCommutePreset = {
      id: 'user-daily-commute',
      label: `${originLabel.split('(')[0].trim()} ➔ ${destLabel.split('(')[0].trim()}`,
      district: selectedDistrict === 'ALL' ? 'Bình Thạnh' : selectedDistrict,
      origin: { lat: originLat, lng: originLng, label: originLabel },
      destination: { lat: destLat, lng: destLng, label: destLabel },
      vehicle_type: vehicleType,
    };
    try {
      localStorage.setItem(SAVED_COMMUTE_STORAGE_KEY, JSON.stringify(toSave));
      setSavedCommute(toSave);
      setSaveSuccessBanner(true);
      setTimeout(() => setSaveSuccessBanner(false), 3500);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const isCarMode = vehicleType === 'car';

  return (
    <section
      aria-label="Ngăn tìm lộ trình tránh ngập cho Xe máy và Ô tô"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl libre-glass rounded-t-sheet border-t border-x border-slate-900/15 dark:border-white/20 shadow-2xl max-h-[86dvh] flex flex-col"
      style={{
        fontSize: isCarMode ? '112%' : '100%',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-2.5 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
              Tìm Lộ Trình Tránh Ngập Chủ Động
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              So sánh trực quan đường ngắn nhất bị ngập vs lộ trình thay thế ít rủi ro
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bảng tìm đường"
          className="wet-touch-target rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body cuộn */}
      <div className="px-4 py-3 overflow-y-auto space-y-3">
        {/* 4 Chip Quận lớn ngay trong vùng ngón cái (Walkthrough F1.1) */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
            Chuyển nhanh Quận trọng điểm (Vùng ngón cái):
          </span>
          <div className="grid grid-cols-4 gap-2">
            {(['Bình Thạnh', 'Quận 7', 'Quận 8', 'TP. Thủ Đức'] as HcmMvpDistrict[]).map(
              (dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => onSelectDistrict(dist)}
                  className={`min-h-[44px] px-2 py-1.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 ${
                    selectedDistrict === dist
                      ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{dist.replace('TP. ', '')}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Chọn nhanh các cặp Điểm đi -> Điểm đến phổ biến tại 4 quận */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Chọn nhanh Lộ trình thực tế tại 4 Quận (1 chạm):
            </span>
            <button
              type="button"
              onClick={() => setShowCustomCoords((prev) => !prev)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 underline"
            >
              {showCustomCoords ? 'Ẩn tọa độ' : 'Nhập tọa độ WGS84'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {POPULAR_HCM_COMMUTE_PRESETS.map((preset) => {
              const isSelected =
                Math.abs(originLat - preset.origin.lat) < 0.001 &&
                Math.abs(destLat - preset.destination.lat) < 0.001;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`min-h-[48px] p-2.5 rounded-xl border text-left text-xs font-semibold transition flex items-start gap-2 ${
                    isSelected
                      ? 'bg-blue-500/15 border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500/40'
                      : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Navigation className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nút mở nhanh Lộ trình đi làm đã lưu trong localStorage (nếu có) */}
        {savedCommute && (
          <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-extrabold text-amber-900 dark:text-amber-300 block">
                ⭐ Lộ trình đi làm hằng ngày đã lưu trên máy:
              </span>
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                {savedCommute.label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectPreset(savedCommute)}
              className="wet-touch-target px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shrink-0 shadow"
            >
              Mở lại 1 chạm
            </button>
          </div>
        )}

        {/* Khối Điểm đi -> Điểm đến hiện tại */}
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-sm" aria-hidden="true">
                  🟢
                </span>
                <input
                  type="text"
                  aria-label="Điểm đi"
                  value={originLabel}
                  onChange={(e) => setOriginLabel(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-sm" aria-hidden="true">
                  🔴
                </span>
                <input
                  type="text"
                  aria-label="Điểm đến"
                  value={destLabel}
                  onChange={(e) => setDestLabel(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Nút Đảo chiều Điểm đi <-> Điểm đến (48x48px) */}
            <button
              type="button"
              onClick={handleSwapWaypoints}
              title="Đảo chiều Điểm đi và Điểm đến"
              aria-label="Đảo chiều Điểm đi và Điểm đến"
              className="wet-touch-target rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* Tùy chọn nhập tọa độ WGS84 trực tiếp */}
          {showCustomCoords && (
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs metric-mono">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-slate-500 block">Tọa độ Điểm đi (Lat, Lng)</span>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.0005"
                    value={originLat}
                    onChange={(e) => setOriginLat(Number(e.target.value))}
                    className="w-1/2 px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-800"
                  />
                  <input
                    type="number"
                    step="0.0005"
                    value={originLng}
                    onChange={(e) => setOriginLng(Number(e.target.value))}
                    className="w-1/2 px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-bold text-slate-500 block">Tọa độ Điểm đến (Lat, Lng)</span>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.0005"
                    value={destLat}
                    onChange={(e) => setDestLat(Number(e.target.value))}
                    className="w-1/2 px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-800"
                  />
                  <input
                    type="number"
                    step="0.0005"
                    value={destLng}
                    onChange={(e) => setDestLng(Number(e.target.value))}
                    className="w-1/2 px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Công tắc chọn phương tiện đồng bộ + Nút Lưu Lộ trình đi làm hằng ngày */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="grid grid-cols-2 gap-2 flex-1 min-w-[230px]">
              <button
                type="button"
                onClick={() => onChangeVehicle('motorcycle')}
                className={`wet-touch-target px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border transition ${
                  vehicleType === 'motorcycle'
                    ? 'bg-[#0284C7] text-white border-sky-300 shadow'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                <span>🏍️ Xe máy (Né ≥20cm)</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeVehicle('car')}
                className={`wet-touch-target px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border transition ${
                  vehicleType === 'car'
                    ? 'bg-[#2563EB] text-white border-blue-300 shadow'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                <span>🚗 Ô tô (Né ≥25cm)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                triggerRouteCalculation(
                  { lat: originLat, lng: originLng, label: originLabel },
                  { lat: destLat, lng: destLng, label: destLabel },
                  vehicleType
                )
              }
              disabled={isCalculating}
              className="wet-touch-target px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow flex items-center gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              <span>{isCalculating ? 'Đang tính...' : 'Tìm lộ trình'}</span>
            </button>
          </div>

          {/* Cam kết Không dẫn vào hẻm nhỏ cho chế độ Ô tô (Walkthrough F2.3) */}
          {isCarMode && (
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/40 text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>🛡️ Chỉ đi đường trục lớn (Đã khóa hẻm nhỏ &lt; 2 làn xe để tránh kẹt cứng)</span>
            </div>
          )}

          {/* Nút Lưu làm Lộ trình đi làm hằng ngày vào localStorage */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDailyCommute}
              className="wet-touch-target flex-1 px-3 py-2 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition"
            >
              {saveSuccessBanner ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-500" />
                  <span>Đã lưu vào &ldquo;Lộ trình đi làm hằng ngày&rdquo; trên máy!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>⭐ Lưu làm &ldquo;Lộ trình đi làm hằng ngày&rdquo; (Mở lại 1 chạm)</span>
                </>
              )}
            </button>

            {activeRoutePlan && (
              <button
                type="button"
                onClick={onClearRoutePlan}
                className="wet-touch-target px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Xóa tuyến
              </button>
            )}
          </div>
        </div>

        {/* KẾT QUẢ SO SÁNH TRỰC QUAN 2 LỘ TRÌNH TRÊN BẢN ĐỒ */}
        {activeRoutePlan && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>So sánh 2 Lộ trình (Đang vẽ song song trên bản đồ)</span>
              <span className="metric-mono text-blue-600 dark:text-blue-400">
                Ngưỡng {vehicleType === 'car' ? 'Ô tô ≥25cm' : 'Xe máy ≥20cm'}
              </span>
            </div>

            {/* THẺ 1: LỘ TRÌNH THAY THẾ ÍT RỦI RO NGẬP (NÉT LIỀN XANH #0284C7 / #2563EB) */}
            <div
              className={`p-3.5 rounded-2xl border-2 shadow-md space-y-1.5 ${
                activeRoutePlan.extreme_isolation_warning
                  ? 'border-amber-500 bg-amber-500/15'
                  : vehicleType === 'car'
                    ? 'border-[#2563EB] bg-blue-500/15'
                    : 'border-[#0284C7] bg-sky-500/15'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {activeRoutePlan.extreme_isolation_warning
                      ? 'CẢNH BÁO BÁN ĐẢO ĐỘC ĐẠO'
                      : 'KHUYẾN NGHỊ: LỘ TRÌNH THAY THẾ ÍT RỦI RO NGẬP'}
                  </span>
                </span>

                <span className="metric-mono text-xs sm:text-sm font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {activeRoutePlan.routes.recommended_safe_route.duration_min} phút
                    {activeRoutePlan.routes.recommended_safe_route.extra_time_min > 0
                      ? ` (+${activeRoutePlan.routes.recommended_safe_route.extra_time_min} phút)`
                      : ''}{' '}
                    • {activeRoutePlan.routes.recommended_safe_route.distance_km} km
                  </span>
                </span>
              </div>

              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                {activeRoutePlan.routes.recommended_safe_route.summary_text}
              </p>

              <div className="text-xs text-slate-700 dark:text-slate-300 flex flex-wrap items-center gap-2 pt-0.5">
                <span className="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 font-semibold border border-slate-300/60 dark:border-slate-700">
                  ━━━ Vẽ nét liền màu {vehicleType === 'car' ? 'Xanh Chàm (#2563EB)' : 'Xanh Điện Tử (#0284C7)'}
                </span>
                <span>• {activeRoutePlan.routes.recommended_safe_route.road_class_policy}</span>
              </div>
            </div>

            {/* THẺ 2: ĐƯỜNG NGẮN NHẤT BỊ NGẬP (NÉT ĐỨT ĐỎ-XÁM) */}
            {activeRoutePlan.flood_detected_on_direct_route && (
              <div className="p-3.5 rounded-2xl border-2 border-dashed border-[#EF4444] bg-red-500/10 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#EF4444] text-white flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ĐƯỜNG NGẮN NHẤT (CẮT QUA VÙNG NGẬP NGUY HIỂM)</span>
                  </span>

                  <span className="metric-mono text-xs font-bold text-red-800 dark:text-red-300">
                    {activeRoutePlan.routes.direct_flooded_route.duration_min} phút •{' '}
                    {activeRoutePlan.routes.direct_flooded_route.distance_km} km (Rủi ro chết máy cao)
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-red-950 dark:text-red-200 leading-snug">
                  {activeRoutePlan.routes.direct_flooded_route.summary_text}
                </p>

                {/* Danh sách điểm ngập cắt qua trên tuyến ngắn nhất */}
                {activeRoutePlan.intersected_alerts.map((alert) => (
                  <div
                    key={alert.hotspot_id}
                    className="p-2 rounded-xl bg-white/85 dark:bg-slate-900/85 border border-red-500/30 text-xs space-y-0.5"
                  >
                    <div className="font-bold text-red-700 dark:text-red-300 flex items-center justify-between">
                      <span>⛔ {alert.street_name}</span>
                      <span className="metric-mono">
                        ~{alert.estimated_depth_cm}cm (Xác suất {alert.flood_probability_pct}%)
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">{alert.plain_advice}</p>
                  </div>
                ))}

                <div className="text-[11px] font-semibold text-red-700 dark:text-red-300">
                  ╍╍╍ Đang vẽ bằng nét đứt Đỏ-Xám trên bản đồ để bạn đối chiếu vị trí ngập cần tránh.
                </div>
              </div>
            )}

            {/* Tuyên bố độ tin cậy & miễn trừ trách nhiệm chuẩn Rule 7 */}
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              ℹ️ <strong>Độ tin cậy & Nguồn (Rule 7):</strong> {activeRoutePlan.confidence_note} •{' '}
              <strong>Nguồn:</strong> {activeRoutePlan.source_attribution}.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
