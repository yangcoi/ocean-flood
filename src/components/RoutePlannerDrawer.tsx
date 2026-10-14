'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowUpDown,
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
  ListOrdered,
  MapPin,
  ExternalLink,
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

/**
 * Danh sách các địa điểm thực tế phổ biến tại TP.HCM để người dùng chọn Điểm đi / Điểm đến trực quan
 */
export const HCM_WAYPOINT_OPTIONS: RouteWaypointInput[] = [
  {
    lat: 10.8015,
    lng: 106.7114,
    label: 'Ngã tư Hàng Xanh / Điện Biên Phủ (Bình Thạnh)',
  },
  {
    lat: 10.8231,
    lng: 106.7082,
    label: 'Đại lộ Phạm Văn Đồng / Cầu Bình Lợi (Bình Thạnh)',
  },
  {
    lat: 10.8138,
    lng: 106.7114,
    label: 'Bến xe Miền Đông cũ / Đinh Bộ Lĩnh (Bình Thạnh)',
  },
  {
    lat: 10.7485,
    lng: 106.735,
    label: 'KCX Tân Thuận / Huỳnh Tấn Phát (Quận 7)',
  },
  {
    lat: 10.7552,
    lng: 106.7221,
    label: 'Cầu Tân Thuận 1 / Nguyễn Tất Thành (Quận 7 ➔ Q.4)',
  },
  {
    lat: 10.738,
    lng: 106.7085,
    label: 'Lotte Mart / Nguyễn Hữu Thọ (Quận 7)',
  },
  {
    lat: 10.8038,
    lng: 106.7349,
    label: 'Khu Thảo Điền / Xuân Thủy (TP. Thủ Đức)',
  },
  {
    lat: 10.799,
    lng: 106.7275,
    label: 'Cầu Sài Gòn / Võ Nguyên Giáp (TP. Thủ Đức)',
  },
  {
    lat: 10.8527,
    lng: 106.7577,
    label: 'Chợ Thủ Đức / Võ Văn Ngân (TP. Thủ Đức)',
  },
  {
    lat: 10.7194,
    lng: 106.626,
    label: 'Bến Phú Định / Mễ Cốc (Quận 8)',
  },
  {
    lat: 10.7312,
    lng: 106.6345,
    label: 'Đại lộ Võ Văn Kiệt / Cầu Lò Gốm (Quận 8)',
  },
  {
    lat: 10.7726,
    lng: 106.6986,
    label: 'Chợ Bến Thành / Lê Lợi (Trung tâm Quận 1)',
  },
];

export const POPULAR_HCM_COMMUTE_PRESETS: SavedCommutePreset[] = [
  {
    id: 'bt_hangxanh_to_phamvandong',
    title: 'Hàng Xanh ➔ Phạm Văn Đồng',
    district: 'Bình Thạnh',
    origin: HCM_WAYPOINT_OPTIONS[0],
    destination: HCM_WAYPOINT_OPTIONS[1],
  },
  {
    id: 'q7_kcx_to_q1',
    title: 'KCX Tân Thuận ➔ Cầu Tân Thuận 1',
    district: 'Quận 7',
    origin: HCM_WAYPOINT_OPTIONS[3],
    destination: HCM_WAYPOINT_OPTIONS[4],
  },
  {
    id: 'td_thaodien_to_q1',
    title: 'Thảo Điền ➔ Cầu Sài Gòn',
    district: 'TP. Thủ Đức',
    origin: HCM_WAYPOINT_OPTIONS[6],
    destination: HCM_WAYPOINT_OPTIONS[7],
  },
  {
    id: 'q8_mecoc_to_vovankiet',
    title: 'Bến Phú Định ➔ Võ Văn Kiệt',
    district: 'Quận 8',
    origin: HCM_WAYPOINT_OPTIONS[9],
    destination: HCM_WAYPOINT_OPTIONS[10],
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
  userGpsLocation?: [number, number] | null;
  onRequestUserGps?: () => void;
}

function interpolateSmoothRoutePoints(
  coords: [number, number][],
  totalSteps = 50
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
 * Giao diện Chỉ Đường & Live Track chuẩn Google Maps (Đầy đủ, Trực quan, Dễ thao tác):
 * - Chọn Điểm đi / Điểm đến từ danh sách địa điểm thực tế hoặc dùng ngay "📍 Vị trí GPS của tôi" + Nút Đổi chiều (⇅).
 * - Hiển thị song song 2 thẻ so sánh: Tuyến Xanh An Toàn (Né ngập) vs Tuyến Đỏ Ngắn Nhất (Bị ngập).
 * - Xem chi tiết từng bước rẽ (Step-by-step directions) và danh sách điểm ngập đã né.
 * - Chế độ Dẫn đường Thực chiến (Live Track GPS) di chuyển trực tiếp trên bản đồ.
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
  userGpsLocation,
  onRequestUserGps,
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
  const [showStepDetails, setShowStepDetails] = useState(false);

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

  const smoothPoints = useMemo(() => {
    if (!safeRoute?.geometry?.coordinates) return [];
    return interpolateSmoothRoutePoints(safeRoute.geometry.coordinates, 50);
  }, [safeRoute]);

  useEffect(() => {
    if (!isLiveNavigating || smoothPoints.length < 2) return;

    const intervalMs = speedMultiplier === 3 ? 450 : 1000;
    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= smoothPoints.length - 1) return 0;
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isLiveNavigating, smoothPoints, speedMultiplier]);

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

  const handleSwapOriginDest = () => {
    const newOrig = destination;
    const newDest = origin;
    setOrigin(newOrig);
    setDestination(newDest);
    computeRoute(newOrig, newDest, vehicleType, scenario);
  };

  const handleUseMyGpsAsOrigin = () => {
    if (userGpsLocation) {
      const gpsOrigin: RouteWaypointInput = {
        lng: userGpsLocation[0],
        lat: userGpsLocation[1],
        label: '📍 Vị trí GPS hiện tại của tôi',
      };
      setOrigin(gpsOrigin);
      computeRoute(gpsOrigin, destination, vehicleType, scenario);
    } else {
      onRequestUserGps?.();
      const fallbackGps: RouteWaypointInput = {
        lng: 106.7114,
        lat: 10.8025,
        label: '📍 Vị trí GPS hiện tại của tôi (Bình Thạnh)',
      };
      setOrigin(fallbackGps);
      computeRoute(fallbackGps, destination, vehicleType, scenario);
    }
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

          <div className="bg-[#0B8043] text-emerald-50 px-3.5 py-1.5 flex items-center justify-between text-[11px] font-bold">
            <span className="truncate">
              🛡️ Đang né {avoidedList.length} vùng ngập (
              {avoidedList[0]?.street_name.split('(')[0] || 'An toàn'})
            </span>
            <span className="shrink-0 ml-2 font-mono">
              Đã đi {Math.round(progressFraction * 100)}%
            </span>
          </div>
        </div>

        {/* 2. THANH ĐIỀU KHIỂN DƯỚI ĐÁY KHI ĐANG CHẠY XE */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_-8px_35px_rgba(0,0,0,0.25)] border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5">
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

            <div className="flex items-center gap-1.5">
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
  // CHẾ ĐỘ 2: BẢNG CHỈ ĐƯỜNG TRỰC QUAN KIỂU GOOGLE MAPS DIRECTIONS
  // ============================================================================
  return (
    <>
      {/* 1. KHUNG TRÊN ĐỈNH: CHỌN ĐIỂM ĐI / ĐIỂM ĐẾN + ĐỔI CHIỀU + DÙNG GPS CỦA TÔI */}
      <div className="absolute top-2.5 inset-x-2.5 z-30 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-700 p-3 space-y-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              handleStopLiveNavigation();
              onClearRoutePlan();
              onClose();
            }}
            aria-label="Đóng chỉ đường"
            className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Ô chọn Điểm đi & Điểm đến tương tác trực tiếp */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <select
                aria-label="Chọn điểm đi"
                value={origin.label}
                onChange={(e) => {
                  const found = HCM_WAYPOINT_OPTIONS.find(
                    (w) => w.label === e.target.value
                  );
                  if (found) {
                    setOrigin(found);
                    computeRoute(found, destination, vehicleType, scenario);
                  }
                }}
                className="flex-1 bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none truncate"
              >
                {!HCM_WAYPOINT_OPTIONS.some((w) => w.label === origin.label) && (
                  <option value={origin.label}>{origin.label}</option>
                )}
                {HCM_WAYPOINT_OPTIONS.map((w) => (
                  <option key={`orig-${w.label}`} value={w.label}>
                    Từ: {w.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <select
                aria-label="Chọn điểm đến"
                value={destination.label}
                onChange={(e) => {
                  const found = HCM_WAYPOINT_OPTIONS.find(
                    (w) => w.label === e.target.value
                  );
                  if (found) {
                    setDestination(found);
                    computeRoute(origin, found, vehicleType, scenario);
                  }
                }}
                className="flex-1 bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none truncate"
              >
                {!HCM_WAYPOINT_OPTIONS.some((w) => w.label === destination.label) && (
                  <option value={destination.label}>{destination.label}</option>
                )}
                {HCM_WAYPOINT_OPTIONS.map((w) => (
                  <option key={`dest-${w.label}`} value={w.label}>
                    Đến: {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nút Đổi chiều Điểm đi ⇅ Điểm đến */}
          <button
            type="button"
            onClick={handleSwapOriginDest}
            title="Đổi chiều Điểm đi và Điểm đến"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Hàng nút nhanh: "📍 Đi từ vị trí GPS của tôi" + Các lộ trình mẫu */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <button
            type="button"
            onClick={handleUseMyGpsAsOrigin}
            className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 text-[11px] font-extrabold flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <MapPin className="w-3 h-3" />
            <span>Từ GPS của tôi</span>
          </button>

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

        {/* Tab chuyển đổi Xe máy vs Ô tô */}
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

      {/* 2. THẺ DƯỚI ĐÁY: SO SÁNH TRỰC QUAN 2 TUYẾN ĐƯỜNG + CHI TIẾT CÁC BƯỚC ĐI + NÚT LIVE TRACK */}
      <div className="absolute bottom-2.5 inset-x-2.5 z-30 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_-8px_35px_rgba(0,0,0,0.22)] border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5 max-h-[48dvh] overflow-y-auto">
        {isComputing || !safeRoute || !directRoute ? (
          <div className="py-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <RefreshCw className="w-4 h-4 animate-spin text-[#1A73E8]" />
            <span>Đang phân tích các điểm ngập và tính lộ trình tối ưu...</span>
          </div>
        ) : (
          <>
            {/* Bảng so sánh trực quan 2 Tuyến đường (Tuyến Xanh An Toàn vs Tuyến Đỏ Ngập) */}
            <div className="space-y-2">
              {/* Pill tóm tắt chênh lệch thời gian & an toàn */}
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-[11px] font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>🛡️ So sánh độ an toàn:</span>
                <span>
                  {safeRoute.duration_min >= directRoute.duration_min
                    ? `Chỉ xa hơn +${Math.max(1, safeRoute.duration_min - directRoute.duration_min)} phút — Né ngập 100%`
                    : 'Tuyến xanh vừa nhanh vừa né ngập hoàn toàn'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Tuyến 1: Tuyến Xanh An Toàn (Khuyên đi) */}
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border-2 border-[#1A73E8] space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-[#1A73E8] text-white text-[10px] font-black uppercase tracking-wider">
                      ✓ TUYẾN XANH NÉ NGẬP
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-xl font-black text-[#1A73E8] dark:text-blue-400">
                      {safeRoute.duration_min} phút
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      ({safeRoute.distance_km} km)
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Né được {avoidedList.length} điểm ngập</span>
                  </p>
                  <div className="pt-1 border-t border-blue-200 dark:border-blue-900 text-[10.5px] font-semibold text-slate-700 dark:text-slate-200 leading-tight">
                    {vehicleType === 'motorcycle' ? (
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                        🛵 Ống xả an toàn (Mực nước &lt;10cm, không sợ chết máy)
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                        🚗 Gầm xe an toàn (Tránh chạm gầm Sedan &amp; thủy kích)
                      </span>
                    )}
                  </div>
                </div>

                {/* Tuyến 2: Tuyến Đỏ Ngắn Nhất (Cắt qua vùng ngập) */}
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                      ⛔ TUYẾN ĐỎ (BỊ NGẬP)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 pt-0.5">
                    <span className="text-xl font-black text-red-600 dark:text-red-400">
                      {directRoute.duration_min} phút
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      ({directRoute.distance_km} km)
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-red-700 dark:text-red-300 flex items-center gap-1 truncate">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {avoidedList[0]
                        ? `Ngập ~${avoidedList[0].estimated_depth_cm}cm`
                        : 'Có rủi ro ngập cục bộ'}
                    </span>
                  </p>
                  <div className="pt-1 border-t border-red-200 dark:border-red-900 text-[10.5px] font-semibold text-red-700 dark:text-red-300 leading-tight">
                    {vehicleType === 'motorcycle' ? (
                      <span>⚠️ Ngập ống xả: Xe tay ga rất dễ hút nước tắt máy!</span>
                    ) : (
                      <span>⛔ Cảnh báo thủy kích: Nước tràn họng hút gió ô tô!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chỉ dẫn đường vòng & Nút mở xem các bước đi chi tiết */}
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" />
                  <span>Hướng dẫn lộ trình né ngập:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowStepDetails((prev) => !prev)}
                  className="text-[11px] font-extrabold text-[#1A73E8] flex items-center gap-1"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>{showStepDetails ? 'Thu gọn bước đi' : 'Xem 3 bước rẽ'}</span>
                </button>
              </div>

              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                {avoidedList[0]?.vehicle_detour_instruction || safeRoute.summary_text}
              </p>

              {/* Danh sách từng bước đi cụ thể (Step-by-step) */}
              {showStepDetails && (
                <div className="pt-2 mt-1 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      1
                    </span>
                    <span>
                      <strong>Xuất phát:</strong> Đi từ {origin.label}.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1A73E8] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      2
                    </span>
                    <span>
                      <strong>Rẽ nhánh an toàn:</strong>{' '}
                      {avoidedList[0]?.vehicle_detour_instruction ||
                        safeRoute.road_class_policy}{' '}
                      (Tránh điểm ngập {avoidedList[0]?.street_name.split('(')[0] || ''}{' '}
                      sâu ~{avoidedList[0]?.estimated_depth_cm ?? 35}cm).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      3
                    </span>
                    <span>
                      <strong>Đến đích:</strong> {destination.label} (Tổng{' '}
                      {safeRoute.distance_km} km • ~{safeRoute.duration_min} phút).
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* HÀNG NÚT HÀNH ĐỘNG CHÍNH: BẮT ĐẦU ĐI (LIVE TRACK GPS) + LƯU LỘ TRÌNH + BÁO NGẬP */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleStartLiveNavigation}
                className="flex-1 py-3 px-4 rounded-full bg-[#0F9D58] hover:bg-[#0B8043] active:scale-[0.99] text-white font-extrabold text-sm shadow-[0_6px_20px_rgba(15,157,88,0.4)] flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Bắt đầu đi (Live Track GPS)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCommute}
                className="py-3 px-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center gap-1 shrink-0 transition"
              >
                <Bookmark className="w-4 h-4 text-[#1A73E8]" />
                <span>{savedSuccess ? 'Đã lưu!' : 'Lưu'}</span>
              </button>
            </div>

            {/* Nút mở trực tiếp lộ trình né ngập trên ứng dụng Google Maps chính chủ */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${
                avoidedList[0]?.coordinates
                  ? `&waypoints=${avoidedList[0].coordinates[1]},${avoidedList[0].coordinates[0]}`
                  : ''
              }&travelmode=${vehicleType === 'motorcycle' ? 'two-wheeler' : 'driving'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-full bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-[#1A73E8] dark:text-blue-300 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Mở dẫn đường bằng app Google Maps chính chủ ↗</span>
            </a>
          </>
        )}
      </div>
    </>
  );
}
