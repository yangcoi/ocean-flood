'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Bike,
  CarFront,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import type { HcmMvpDistrict } from '@/data/hcm-spatial-seed';
import type { ForecastScenario } from '@/lib/forecast-engine';
import type {
  VehicleType,
  RouteWaypointInput,
  RoutePlanResponseOutput,
} from '@/lib/routing-engine';

export const SAVED_COMMUTE_STORAGE_KEY = 'ocean_flood_daily_commute_v1';

export interface SavedCommutePreset {
  id: string;
  title: string;
  district: HcmMvpDistrict;
  origin: RouteWaypointInput;
  destination: RouteWaypointInput;
  saved_at?: string;
}

export const POPULAR_HCM_COMMUTE_PRESETS: SavedCommutePreset[] = [
  {
    id: 'bt_hangxanh_to_phamvandong',
    title: 'Bình Thạnh: Hàng Xanh ➔ Phạm Văn Đồng',
    district: 'Bình Thạnh',
    origin: {
      lat: 10.8015,
      lng: 106.7114,
      label: 'Ngã tư Hàng Xanh (Bình Thạnh)',
    },
    destination: {
      lat: 10.8225,
      lng: 106.7145,
      label: 'Cầu Bình Lợi / Phạm Văn Đồng',
    },
  },
  {
    id: 'q7_kcx_to_q1',
    title: 'Quận 7: KCX Tân Thuận ➔ Quận 1',
    district: 'Quận 7',
    origin: {
      lat: 10.7425,
      lng: 106.7305,
      label: 'KCX Tân Thuận (Huỳnh Tấn Phát, Q.7)',
    },
    destination: {
      lat: 10.7582,
      lng: 106.7042,
      label: 'Cầu Tân Thuận / Nguyễn Tất Thành',
    },
  },
  {
    id: 'td_thaodien_to_q1',
    title: 'Thủ Đức: Thảo Điền ➔ Cầu Sài Gòn',
    district: 'TP. Thủ Đức',
    origin: {
      lat: 10.8082,
      lng: 106.7318,
      label: 'Khu Thảo Điền / Quốc Hương (Thủ Đức)',
    },
    destination: {
      lat: 10.7992,
      lng: 106.7275,
      label: 'Cầu Sài Gòn / Võ Nguyên Giáp',
    },
  },
  {
    id: 'q8_mecoc_to_vovankiet',
    title: 'Quận 8: Bến Phú Định ➔ Võ Văn Kiệt',
    district: 'Quận 8',
    origin: {
      lat: 10.7195,
      lng: 106.6258,
      label: 'Bến Phú Định / Mễ Cốc (Quận 8)',
    },
    destination: {
      lat: 10.7312,
      lng: 106.6345,
      label: 'Đại lộ Võ Văn Kiệt (Cầu Lò Gốm)',
    },
  },
];

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

/**
 * Giao diện Chỉ Đường chuẩn Google Maps (Split Top-Box + Open Map + Compact Bottom Summary):
 * - Phần trên (Top Header): Ô Điểm đi / Điểm đến + Chuyển nhanh Xe máy / Ô tô + Chip chọn lộ trình mẫu
 * - Phần giữa (65% màn hình): Để trống hoàn toàn cho Bản đồ hiển thị trực quan đường Xanh (An toàn) và đường Đỏ (Ngập)
 * - Phần dưới (Bottom Card gọn gàng): So sánh thời gian & cảnh báo ngập chỉ trong 1 thẻ ngắn gọn
 */
export default function RoutePlannerDrawer({
  isOpen,
  onClose,
  vehicleType,
  onChangeVehicle,
  scenario,
  activeRoutePlan,
  onRoutePlanComputed,
  onClearRoutePlan,
  initialOrigin,
  initialDestination,
}: RoutePlannerDrawerProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    POPULAR_HCM_COMMUTE_PRESETS[0].id
  );
  const [origin, setOrigin] = useState<RouteWaypointInput>(
    initialOrigin || POPULAR_HCM_COMMUTE_PRESETS[0].origin
  );
  const [destination, setDestination] = useState<RouteWaypointInput>(
    initialDestination || POPULAR_HCM_COMMUTE_PRESETS[0].destination
  );
  const [isComputing, setIsComputing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialOrigin && initialDestination) {
      setOrigin(initialOrigin);
      setDestination(initialDestination);
    }
  }, [initialOrigin, initialDestination]);

  const computeRoute = useCallback(
    async (
      orig: RouteWaypointInput,
      dest: RouteWaypointInput,
      veh: VehicleType,
      scen: ForecastScenario
    ) => {
      setIsComputing(true);
      try {
        const res = await fetch('/api/route-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: orig,
            destination: dest,
            vehicle_type: veh,
            scenario: scen,
          }),
        });
        const data = await res.json();
        if (res.ok && data.routes) {
          onRoutePlanComputed(data as RoutePlanResponseOutput, orig, dest);
        }
      } finally {
        setIsComputing(false);
      }
    },
    [onRoutePlanComputed]
  );

  // Tự động tính lộ trình ngay khi mở Chỉ đường hoặc đổi Xe máy / Ô tô
  useEffect(() => {
    if (isOpen) {
      computeRoute(origin, destination, vehicleType, scenario);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, vehicleType, scenario]);

  const handleSelectPreset = (preset: SavedCommutePreset) => {
    setSelectedPresetId(preset.id);
    setOrigin(preset.origin);
    setDestination(preset.destination);
    computeRoute(preset.origin, preset.destination, vehicleType, scenario);
  };

  const handleSaveCommute = () => {
    try {
      const payload: SavedCommutePreset = {
        id: 'saved_daily',
        title: `${origin.label} ➔ ${destination.label}`,
        district: 'Bình Thạnh',
        origin,
        destination,
      };
      localStorage.setItem(SAVED_COMMUTE_STORAGE_KEY, JSON.stringify(payload));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const safeRoute = activeRoutePlan?.routes.recommended_safe_route;
  const directRoute = activeRoutePlan?.routes.direct_flooded_route;
  const avoidedList = activeRoutePlan?.intersected_alerts || [];

  return (
    <>
      {/* 1. KHUNG TRÊN ĐỈNH KIỂU GOOGLE MAPS DIRECTIONS (Điểm đi / Điểm đến + Chọn loại xe) */}
      <div className="absolute top-2.5 inset-x-2.5 z-30 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.18)] border border-slate-200 dark:border-slate-700 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => {
              onClearRoutePlan();
              onClose();
            }}
            aria-label="Đóng chỉ đường"
            className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Hộp Điểm đi & Điểm đến gọn như Google Maps */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {origin.label}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                {destination.label}
              </span>
            </div>
          </div>
        </div>

        {/* Chip chọn nhanh các tuyến đường hay đi tại 4 quận */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          {POPULAR_HCM_COMMUTE_PRESETS.map((p) => {
            const active = selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition shrink-0 ${
                  active
                    ? 'bg-blue-100 dark:bg-blue-950 text-[#1A73E8] dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {p.title}
              </button>
            );
          })}
        </div>

        {/* Tab chuyển đổi Xe máy vs Ô tô kèm thời gian dự kiến giống hệt Google Maps */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onChangeVehicle('motorcycle')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              vehicleType === 'motorcycle'
                ? 'bg-[#1A73E8] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Xe máy (Né ≥20cm)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeVehicle('car')}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              vehicleType === 'car'
                ? 'bg-[#1A73E8] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <CarFront className="w-4 h-4" />
            <span>Ô tô (Né ≥25cm)</span>
          </button>
        </div>
      </div>

      {/* 2. THẺ TÓM TẮT LỘ TRÌNH Ở ĐÁY (GỌN GÀNG, DỄ ĐỌC NHƯ GOOGLE MAPS, CHừa 65% giữa màn hình cho Bản đồ) */}
      <div className="absolute bottom-2.5 inset-x-2.5 z-30 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_-6px_30px_rgba(0,0,0,0.18)] border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5">
        {isComputing || !safeRoute || !directRoute ? (
          <div className="py-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <RefreshCw className="w-4 h-4 animate-spin text-[#1A73E8]" />
            <span>Đang tìm lộ trình tránh ngập tối ưu...</span>
          </div>
        ) : (
          <>
            {/* Dòng chính: Thời gian (Màu xanh lá/xanh dương to rõ như Google Maps) + Khoảng cách */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {safeRoute.duration_min} phút
                  </span>
                  <span className="text-sm font-bold text-slate-500">
                    ({safeRoute.distance_km} km)
                  </span>
                  {safeRoute.extra_time_min > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#1A73E8] dark:text-blue-300 text-[11px] font-bold">
                      +{safeRoute.extra_time_min} phút để né ngập
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Lộ trình an toàn nhất • Tránh được{' '}
                    <strong>{avoidedList.length} điểm đang ngập</strong>
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveCommute}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 shrink-0"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#1A73E8]" />
                <span>{savedSuccess ? 'Đã lưu!' : 'Lưu đi làm'}</span>
              </button>
            </div>

            {/* So sánh ngắn gọn với đường ngắn nhất bị ngập */}
            {activeRoutePlan.flood_detected_on_direct_route && avoidedList[0] && (
              <div className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-red-700 dark:text-red-300">
                      Đường ngắn nhất ({directRoute.duration_min}p):
                    </span>{' '}
                    <span className="text-red-600 dark:text-red-200">
                      Qua {avoidedList[0].street_name.split('(')[0]} ngập ~
                      {avoidedList[0].estimated_depth_cm}cm
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Gợi ý hướng đi vòng dễ hiểu */}
            {avoidedList[0] && (
              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                <span className="truncate">
                  <strong>Hướng đi:</strong> {avoidedList[0].vehicle_detour_instruction}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
