'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Bike,
  CarFront,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  Navigation,
  RefreshCw,
  Play,
  Square,
  CornerUpRight,
  ArrowUp,
  Camera,
  LocateFixed,
  FastForward,
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

export interface LiveTrackState {
  isActive: boolean;
  currentCoord: [number, number] | null;
  bearingDeg: number;
  progressPct: number;
  followCamera: boolean;
}

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
  onLiveTrackChange?: (state: LiveTrackState) => void;
  onOpenCameraReport?: () => void;
}

/**
 * Nội suy danh sách tọa độ dày và mượt dọc theo LineString để xe di chuyển Live Track như Google Maps
 */
function interpolateSmoothRoutePoints(
  coords: [number, number][],
  totalSteps = 48
): [number, number][] {
  if (!coords || coords.length === 0) return [];
  if (coords.length === 1) return [coords[0]];

  const result: [number, number][] = [];
  const segments = coords.length - 1;
  const stepsPerSeg = Math.max(4, Math.ceil(totalSteps / segments));

  for (let i = 0; i < segments; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    for (let s = 0; s < stepsPerSeg; s++) {
      const t = s / stepsPerSeg;
      result.push([lng1 + (lng2 - lng1) * t, lat1 + (lat2 - lat1) * t]);
    }
  }
  result.push(coords[coords.length - 1]);
  return result;
}

/**
 * Tính góc hướng di chuyển (Bearing độ) giữa 2 tọa độ [lng, lat]
 */
function computeBearingDeg(from: [number, number], to: [number, number]): number {
  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Giao diện Chỉ Đường & Dẫn Đường Thực Chiến (Live Track) chuẩn Google Maps:
 * 1. Chế độ Xem Lộ Trình (Preview): Khung Điểm đi/Điểm đến trên đỉnh + Bản đồ giữa + Thẻ tóm tắt dưới đáy kèm nút "Bắt đầu đi (Live Track)".
 * 2. Chế độ Dẫn Đường Thực Chiến (Live Track GPS): Thanh chỉ hướng màu Xanh lá trên đỉnh + Xe di chuyển thời gian thực trên bản đồ + Thanh HUD tốc độ/ETA dưới đáy.
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
  onLiveTrackChange,
  onOpenCameraReport,
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

  // Trạng thái Dẫn đường Live Track kiểu Google Maps
  const [isLiveNavigating, setIsLiveNavigating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 3>(1);
  const [followCamera, setFollowCamera] = useState(true);

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

  useEffect(() => {
    if (isOpen) {
      computeRoute(origin, destination, vehicleType, scenario);
    } else {
      setIsLiveNavigating(false);
      setStepIndex(0);
      onLiveTrackChange?.({
        isActive: false,
        currentCoord: null,
        bearingDeg: 0,
        progressPct: 0,
        followCamera: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, vehicleType, scenario]);

  const safeRoute = activeRoutePlan?.routes.recommended_safe_route;
  const directRoute = activeRoutePlan?.routes.direct_flooded_route;
  const avoidedList = activeRoutePlan?.intersected_alerts || [];

  // Danh sách điểm nội suy mượt trên lộ trình an toàn
  const smoothPoints = useMemo(() => {
    if (!safeRoute?.geometry?.coordinates) return [];
    return interpolateSmoothRoutePoints(safeRoute.geometry.coordinates, 50);
  }, [safeRoute]);

  // Chạy đồng hồ Live Track di chuyển dọc lộ trình
  useEffect(() => {
    if (!isLiveNavigating || smoothPoints.length < 2) return;

    const intervalMs = speedMultiplier === 3 ? 450 : 1100;
    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= smoothPoints.length - 1) {
          return 0; // Lặp lại hành trình khi tới đích để người dùng dễ kiểm tra
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isLiveNavigating, smoothPoints, speedMultiplier]);

  // Đồng bộ vị trí xe Live Track ra MapCanvas
  useEffect(() => {
    if (!isLiveNavigating || smoothPoints.length === 0) return;
    const currentCoord = smoothPoints[Math.min(stepIndex, smoothPoints.length - 1)];
    const nextCoord =
      smoothPoints[Math.min(stepIndex + 1, smoothPoints.length - 1)] || currentCoord;
    const bearingDeg = computeBearingDeg(currentCoord, nextCoord);
    const progressPct = Math.round((stepIndex / Math.max(1, smoothPoints.length - 1)) * 100);

    onLiveTrackChange?.({
      isActive: true,
      currentCoord,
      bearingDeg,
      progressPct,
      followCamera,
    });
  }, [isLiveNavigating, stepIndex, smoothPoints, followCamera, onLiveTrackChange]);

  const handleStartLiveNavigation = () => {
    setStepIndex(0);
    setFollowCamera(true);
    setIsLiveNavigating(true);
  };

  const handleStopLiveNavigation = () => {
    setIsLiveNavigating(false);
    setStepIndex(0);
    onLiveTrackChange?.({
      isActive: false,
      currentCoord: null,
      bearingDeg: 0,
      progressPct: 0,
      followCamera: false,
    });
  };

  const handleSelectPreset = (preset: SavedCommutePreset) => {
    setSelectedPresetId(preset.id);
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setIsLiveNavigating(false);
    setStepIndex(0);
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

  // Tính toán thông số thời gian thực khi đang bật Live Track
  const progressFraction =
    smoothPoints.length > 1 ? stepIndex / (smoothPoints.length - 1) : 0;
  const remainingFraction = Math.max(0, 1 - progressFraction);
  const remainingMin = safeRoute
    ? Math.max(1, Math.ceil(safeRoute.duration_min * remainingFraction))
    : 0;
  const remainingKm = safeRoute
    ? Math.max(0.1, Number((safeRoute.distance_km * remainingFraction).toFixed(1)))
    : 0;
  const nextTurnMeters = Math.max(30, Math.round((1 - (progressFraction * 3) % 1) * 350));

  // Tính giờ đến nơi dự kiến (ETA)
  const etaDate = new Date(Date.now() + remainingMin * 60000);
  const etaString = `${etaDate.getHours().toString().padStart(2, '0')}:${etaDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  // ============================================================================
  // CHẾ ĐỘ 1: ĐANG DẪN ĐƯỜNG LIVE TRACK TURN-BY-TURN KIỂU GOOGLE MAPS NAVIGATION
  // ============================================================================
  if (isLiveNavigating && safeRoute) {
    const currentInstruction =
      progressFraction < 0.35
        ? `Đi thẳng từ ${(origin.label || 'Điểm xuất phát').split('(')[0]}`
        : progressFraction < 0.78
        ? avoidedList[0]?.vehicle_detour_instruction ||
          `Đi theo tuyến xanh an toàn (${safeRoute.road_class_policy})`
        : `Sắp tới đích: ${destination.label}`;

    return (
      <>
        {/* 1. BANNER CHỈ HƯỚNG TURN-BY-TURN MÀU XANH LÁ CHUẨN GOOGLE MAPS NAVIGATION */}
        <div className="absolute top-2.5 inset-x-2.5 z-30 rounded-2xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.3)] border border-emerald-400/30">
          <div className="bg-[#0F9D58] text-white p-3.5 flex items-center gap-3">
            {/* Biểu tượng hướng rẽ lớn */}
            <div className="w-12 h-12 rounded-2xl bg-[#0B8043] flex flex-col items-center justify-center shrink-0 border border-white/20 shadow-inner">
              {progressFraction >= 0.35 && progressFraction < 0.78 ? (
                <CornerUpRight className="w-6 h-6 text-white" />
              ) : (
                <ArrowUp className="w-6 h-6 text-white" />
              )}
              <span className="text-[10px] font-black">{nextTurnMeters}m</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping" />
                  LIVE GPS TRACK
                </span>
                <span className="text-[11px] font-bold text-emerald-100">
                  {vehicleType === 'car' ? '🚗 Chế độ Ô tô' : '🏍️ Chế độ Xe máy'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold leading-snug mt-0.5 line-clamp-2">
                {currentInstruction}
              </h2>
            </div>
          </div>

          {/* Dải phụ báo né điểm ngập phía trước */}
          <div className="bg-[#0B8043] text-emerald-50 px-3.5 py-1.5 flex items-center justify-between text-[11px] font-bold">
            <span className="truncate">
              🛡️ Đang né {avoidedList.length} vùng ngập ({avoidedList[0]?.street_name.split('(')[0] || 'An toàn'})
            </span>
            <span className="shrink-0 ml-2 font-mono">
              Đã đi {Math.round(progressFraction * 100)}%
            </span>
          </div>
        </div>

        {/* 2. THANH ĐIỀU KHIỂN DƯỚI ĐÁY KHI ĐANG CHẠY XE (GOOGLE MAPS BOTTOM HUD) */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_-8px_35px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5">
          {/* Thanh kéo tiến độ lộ trình trực quan */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-600">Điểm đi</span>
            <input
              type="range"
              min={0}
              max={Math.max(1, smoothPoints.length - 1)}
              value={stepIndex}
              onChange={(e) => setStepIndex(Number(e.target.value))}
              aria-label="Tiến độ di chuyển trên lộ trình"
              className="flex-1 h-1.5 bg-slate-200 rounded-lg accent-[#0F9D58] cursor-pointer"
            />
            <span className="text-[10px] font-bold text-red-600">Đích</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#0F9D58]">
                  {remainingMin} phút
                </span>
                <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  • {remainingKm} km
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Dự kiến đến lúc <strong>{etaString}</strong> • Tốc độ ~
                {vehicleType === 'car' ? '34' : '28'} km/h
              </p>
            </div>

            {/* Cụm nút điều khiển nhanh trong lúc dẫn đường */}
            <div className="flex items-center gap-1.5">
              {/* Nút chụp báo ngập ngay trên đường đi */}
              {onOpenCameraReport && (
                <button
                  type="button"
                  onClick={onOpenCameraReport}
                  title="Chụp ảnh báo ngập trên đường"
                  className="p-2.5 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold text-xs flex items-center gap-1 transition"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}

              {/* Nút tăng tốc mô phỏng 1x / 3x */}
              <button
                type="button"
                onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 3 : 1))}
                className={`px-2.5 py-2 rounded-full text-xs font-extrabold flex items-center gap-1 border transition ${
                  speedMultiplier === 3
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>{speedMultiplier}x</span>
              </button>

              {/* Nút khóa tâm camera theo xe */}
              <button
                type="button"
                onClick={() => setFollowCamera((prev) => !prev)}
                className={`p-2.5 rounded-full border transition ${
                  followCamera
                    ? 'bg-blue-50 text-[#1A73E8] border-blue-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
                title="Bám theo vị trí xe"
              >
                <LocateFixed className="w-4 h-4" />
              </button>

              {/* Nút Kết thúc dẫn đường */}
              <button
                type="button"
                onClick={handleStopLiveNavigation}
                className="px-3.5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-md transition active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Thoát</span>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ============================================================================
  // CHẾ ĐỘ 2: XEM TRƯỚC LỘ TRÌNH & CHỌN ĐIỂM ĐI/ĐẾN KIỂU GOOGLE MAPS DIRECTIONS
  // ============================================================================
  return (
    <>
      {/* 1. KHUNG TRÊN ĐỈNH KIỂU GOOGLE MAPS DIRECTIONS (Điểm đi / Điểm đến + Chọn loại xe) */}
      <div className="absolute top-2.5 inset-x-2.5 z-30 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.18)] border border-slate-200 dark:border-slate-700 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => {
              handleStopLiveNavigation();
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

        {/* Tab chuyển đổi Xe máy vs Ô tô kèm ngưỡng ngập */}
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

      {/* 2. THẺ TÓM TẮT LỘ TRÌNH Ở ĐÁY + NÚT BẮT ĐẦU ĐI (LIVE TRACK GPS) */}
      <div className="absolute bottom-2.5 inset-x-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_-6px_30px_rgba(0,0,0,0.18)] border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5">
        {isComputing || !safeRoute || !directRoute ? (
          <div className="py-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <RefreshCw className="w-4 h-4 animate-spin text-[#1A73E8]" />
            <span>Đang tìm lộ trình tránh ngập tối ưu...</span>
          </div>
        ) : (
          <>
            {/* Dòng chính: Thời gian + Khoảng cách + Nút Lưu */}
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
                      +{safeRoute.extra_time_min}p né ngập
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Tuyến xanh an toàn • Né được{' '}
                    <strong>{avoidedList.length} vùng đang ngập</strong>
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
              <div className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-red-700 dark:text-red-300">
                    Tuyến đỏ ngắn nhất ({directRoute.duration_min}p):
                  </span>{' '}
                  <span className="text-red-600 dark:text-red-200">
                    Cắt qua {avoidedList[0].street_name.split('(')[0]} ngập ~
                    {avoidedList[0].estimated_depth_cm}cm
                  </span>
                </div>
              </div>
            )}

            {/* Gợi ý hướng đi vòng dễ hiểu */}
            {avoidedList[0] && (
              <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                <span className="truncate">
                  <strong>Lộ trình:</strong> {avoidedList[0].vehicle_detour_instruction}
                </span>
              </div>
            )}

            {/* NÚT BẮT ĐẦU DẪN ĐƯỜNG LIVE TRACK KIỂU GOOGLE MAPS */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleStartLiveNavigation}
                className="flex-1 py-3 px-4 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] active:scale-[0.99] text-white font-extrabold text-sm shadow-[0_6px_20px_rgba(15,157,88,0.4)] flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Bắt đầu đi (Live Track GPS)</span>
              </button>

              {onOpenCameraReport && (
                <button
                  type="button"
                  onClick={onOpenCameraReport}
                  className="py-3 px-3.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shrink-0 transition active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>📸 Báo ngập</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
