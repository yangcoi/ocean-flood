'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Navigation,
  Camera,
  Bookmark,
  WifiOff,
  MapPin,
  X,
  Bike,
  CarFront,
} from 'lucide-react';
import TopStatusBar from '@/components/TopStatusBar';
import VehicleToggle from '@/components/VehicleToggle';
import MapCanvas from '@/components/MapCanvas';
import AlertBottomSheet from '@/components/AlertBottomSheet';
import RoutePlannerDrawer, {
  SAVED_COMMUTE_STORAGE_KEY,
  POPULAR_HCM_COMMUTE_PRESETS,
  type SavedCommutePreset,
  type LiveTrackState,
} from '@/components/RoutePlannerDrawer';
import CrowdReportModal from '@/components/CrowdReportModal';
import SecurityCameraModal, {
  type ActiveCameraTarget,
} from '@/components/SecurityCameraModal';

import {
  calculateDistanceMeters,
  type HcmMvpDistrict,
  type TrafficCameraSeed,
} from '@/data/hcm-spatial-seed';
import type {
  ForecastScenario,
  AlertGeoJsonFeature,
  HotspotForecastProperties,
  TideStationStatus,
  DistrictRainForecast,
} from '@/lib/forecast-engine';
import type { CrowdReportClusterRecord } from '@/lib/verification-engine';
import type {
  VehicleType,
  RoutePlanResponseOutput,
  RouteWaypointInput,
} from '@/lib/routing-engine';

const GPS_CONSENT_STORAGE_KEY = 'ocean_flood_nd13_gps_consent';
const DEVICE_HASH_STORAGE_KEY = 'ocean_flood_device_hash';

export default function OceanFloodHomePage() {
  // 1. MẶC ĐỊNH CHẾ ĐỘ BẢN ĐỒ SÁNG (LIGHT MODE) GIỐNG GOOGLE MAPS
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [scenario, setScenario] = useState<ForecastScenario>('live');
  const [selectedDistrict, setSelectedDistrict] = useState<HcmMvpDistrict | 'ALL'>('ALL');

  // 2. Dữ liệu Không gian từ API GET /api/alerts
  const [features, setFeatures] = useState<AlertGeoJsonFeature[]>([]);
  const [crowdReports, setCrowdReports] = useState<CrowdReportClusterRecord[]>([]);
  const [cameras, setCameras] = useState<TrafficCameraSeed[]>([]);
  const [tidePhuAn, setTidePhuAn] = useState<TideStationStatus | null>(null);
  const [tideNhaBe, setTideNhaBe] = useState<TideStationStatus | null>(null);
  const [districtRainfall, setDistrictRainfall] = useState<Record<
    HcmMvpDistrict,
    DistrictRainForecast
  > | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [weatherSourceLabel, setWeatherSourceLabel] = useState<string>(
    'Open-Meteo API + Đài KTTV Nam Bộ'
  );
  const [isFallbackWeather, setIsFallbackWeather] = useState<boolean>(false);
  const [highRiskCount, setHighRiskCount] = useState<number>(0);
  const [verifiedCount, setVerifiedCount] = useState<number>(0);
  const [forecastOnlyCount, setForecastOnlyCount] = useState<number>(0);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // 3. Trạng thái chọn Điểm ngập / Báo cáo / Chỉ đường / Live Track / Báo ngập 5 lớp
  const [selectedHotspot, setSelectedHotspot] =
    useState<HotspotForecastProperties | null>(null);
  const [selectedCrowdReport, setSelectedCrowdReport] =
    useState<CrowdReportClusterRecord | null>(null);

  const [isRouteDrawerOpen, setIsRouteDrawerOpen] = useState<boolean>(false);
  const [activeRoutePlan, setActiveRoutePlan] =
    useState<RoutePlanResponseOutput | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<RouteWaypointInput | null>(null);
  const [routeDestination, setRouteDestination] =
    useState<RouteWaypointInput | null>(null);
  const [liveTrackState, setLiveTrackState] = useState<LiveTrackState>({
    isActive: false,
    currentCoord: null,
    bearingDeg: 0,
    progressPct: 0,
    followCamera: false,
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportTargetHotspotId, setReportTargetHotspotId] = useState<string | null>(null);
  const [activeSecurityCamera, setActiveSecurityCamera] =
    useState<ActiveCameraTarget | null>(null);
  const [focusCoordinates, setFocusCoordinates] = useState<[number, number] | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [showFloodStrip, setShowFloodStrip] = useState<boolean>(false);

  // 4. Trạng thái GPS & Khung hiển thị
  const [showGpsConsentModal, setShowGpsConsentModal] = useState<boolean>(false);
  const [hasGpsConsent, setHasGpsConsent] = useState<boolean>(false);
  const [userGpsLocation, setUserGpsLocation] = useState<[number, number] | null>(null);
  const [deviceHash, setDeviceHash] = useState<string>('anon_hcm_commuter_01');
  const [savedDailyCommute, setSavedDailyCommute] =
    useState<SavedCommutePreset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isMobileViewportFrame, setIsMobileViewportFrame] = useState<boolean>(true);
  const [showMobileQrModal, setShowMobileQrModal] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    try {
      let storedHash = localStorage.getItem(DEVICE_HASH_STORAGE_KEY);
      if (!storedHash) {
        storedHash = `sha256_hcm_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
        localStorage.setItem(DEVICE_HASH_STORAGE_KEY, storedHash);
      }
      setDeviceHash(storedHash);

      const consent = localStorage.getItem(GPS_CONSENT_STORAGE_KEY);
      if (consent === 'granted') {
        setHasGpsConsent(true);
      }

      const rawCommute = localStorage.getItem(SAVED_COMMUTE_STORAGE_KEY);
      if (rawCommute) {
        setSavedDailyCommute(JSON.parse(rawCommute));
      }
    } catch {
      // ignore
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchAlertsData = useCallback(async () => {
    setIsLoadingAlerts(true);
    try {
      const params = new URLSearchParams({
        scenario,
        district: selectedDistrict,
      });
      const res = await fetch(`/api/alerts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();

      setFeatures(data.features || []);
      setCrowdReports(data.crowd_reports || []);
      setCameras(data.cameras || []);

      if (data.metadata) {
        setUpdatedAt(data.metadata.updated_at);
        setWeatherSourceLabel(data.metadata.weather_source_label);
        setIsFallbackWeather(Boolean(data.metadata.is_fallback_weather));
        setTidePhuAn(data.metadata.tide_station_phu_an || null);
        setTideNhaBe(data.metadata.tide_station_nha_be || null);
        setDistrictRainfall(data.metadata.district_rainfall || null);
        setHighRiskCount(data.metadata.summary_counts?.high_risk_hotspots ?? 0);
        setVerifiedCount(data.metadata.summary_counts?.verified_hotspots ?? 0);
        setForecastOnlyCount(data.metadata.summary_counts?.forecast_only_hotspots ?? 0);
      }

      setSelectedHotspot((prev) => {
        if (!prev) return null;
        const updated = (data.features || []).find(
          (f: AlertGeoJsonFeature) => f.properties.hotspot_id === prev.hotspot_id
        );
        return updated ? updated.properties : prev;
      });
    } catch {
      setIsOffline(true);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [scenario, selectedDistrict]);

  useEffect(() => {
    fetchAlertsData();
  }, [fetchAlertsData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleLocateUserClick = () => {
    setHasGpsConsent(true);
    try {
      localStorage.setItem(GPS_CONSENT_STORAGE_KEY, 'granted');
    } catch {
      // ignore
    }
    triggerBrowserGeolocation();
  };

  const triggerBrowserGeolocation = () => {
    // Hiển thị tức thì vị trí GPS trên bản đồ để không phải chờ đợi, sau đó tinh chỉnh bằng cảm biến GPS thực tế của trình duyệt
    if (!userGpsLocation) {
      const immediateCoords: [number, number] = [106.7114, 10.8035];
      setUserGpsLocation(immediateCoords);
      setFocusCoordinates([...immediateCoords]);
    }
    showToast('📍 Đang định vị GPS vị trí của bạn...');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserGpsLocation(coords);
          setFocusCoordinates([...coords]);
          showToast('📍 Đã định vị chính xác GPS hiện tại của bạn!');
        },
        () => {
          const fallbackCoords: [number, number] = [106.7114, 10.8035];
          setUserGpsLocation(fallbackCoords);
          setFocusCoordinates([...fallbackCoords]);
          showToast('📍 Đã bật định vị GPS (Tâm điểm: Ngã tư Hàng Xanh, Bình Thạnh).');
        },
        { enableHighAccuracy: true, timeout: 3500, maximumAge: 10000 }
      );
    } else {
      const fallbackCoords: [number, number] = [106.7114, 10.8035];
      setUserGpsLocation(fallbackCoords);
      setFocusCoordinates([...fallbackCoords]);
      showToast('📍 Đã bật định vị GPS của bạn.');
    }
  };

  const handleAcceptGpsConsent = () => {
    setShowGpsConsentModal(false);
    handleLocateUserClick();
  };

  const handleOpenRouteToAvoidHotspot = (hotspot: HotspotForecastProperties) => {
    setSelectedHotspot(null);
    setSelectedCrowdReport(null);

    const roadCoords = hotspot.road_geom?.coordinates || [];
    const streetBase = hotspot.street_name.split('(')[0].trim();

    if (roadCoords.length >= 2) {
      const pStart = roadCoords[0];
      const pNext = roadCoords[1];
      const pLast = roadCoords[roadCoords.length - 1];
      const pPrev = roadCoords[roadCoords.length - 2];

      // Tính vector hướng tiếp cận trước điểm ngập ~350m
      const deltaStartLng = pStart[0] - pNext[0];
      const deltaStartLat = pStart[1] - pNext[1];
      const magStart = Math.sqrt(deltaStartLng * deltaStartLng + deltaStartLat * deltaStartLat) || 0.001;
      const stepStart = 0.0035; // ~380m
      const originLng = Number((pStart[0] + (deltaStartLng / magStart) * stepStart).toFixed(6));
      const originLat = Number((pStart[1] + (deltaStartLat / magStart) * stepStart).toFixed(6));

      // Tính vector hướng thoát sau điểm ngập ~350m
      const deltaEndLng = pLast[0] - pPrev[0];
      const deltaEndLat = pLast[1] - pPrev[1];
      const magEnd = Math.sqrt(deltaEndLng * deltaEndLng + deltaEndLat * deltaEndLat) || 0.001;
      const stepEnd = 0.0035; // ~380m
      const destLng = Number((pLast[0] + (deltaEndLng / magEnd) * stepEnd).toFixed(6));
      const destLat = Number((pLast[1] + (deltaEndLat / magEnd) * stepEnd).toFixed(6));

      // Nếu người dùng đã bật GPS và đang ở gần (< 4km), dùng vị trí GPS làm điểm xuất phát
      const useGpsOrigin =
        userGpsLocation &&
        calculateDistanceMeters(userGpsLocation[0], userGpsLocation[1], pStart[0], pStart[1]) <= 4000;

      const dynamicOrigin: RouteWaypointInput = useGpsOrigin
        ? {
            lng: userGpsLocation![0],
            lat: userGpsLocation![1],
            label: 'Vị trí GPS của bạn',
          }
        : {
            lng: originLng,
            lat: originLat,
            label: `Hướng tiếp cận ${streetBase}`,
          };

      const dynamicDest: RouteWaypointInput = {
        lng: destLng,
        lat: destLat,
        label: `Hướng thoát qua ${streetBase}`,
      };

      setRouteOrigin(dynamicOrigin);
      setRouteDestination(dynamicDest);
      setIsRouteDrawerOpen(true);
      return;
    }

    const matchingPreset =
      POPULAR_HCM_COMMUTE_PRESETS.find((p) => p.district === hotspot.district) ||
      POPULAR_HCM_COMMUTE_PRESETS[0];

    setRouteOrigin(matchingPreset.origin);
    setRouteDestination(matchingPreset.destination);
    setIsRouteDrawerOpen(true);
  };

  const handleQuickSavedCommuteClick = () => {
    let targetPreset = savedDailyCommute;
    if (!targetPreset) {
      try {
        const raw = localStorage.getItem(SAVED_COMMUTE_STORAGE_KEY);
        if (raw) targetPreset = JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    const presetToRun = targetPreset || POPULAR_HCM_COMMUTE_PRESETS[0];
    setSelectedHotspot(null);
    setSelectedCrowdReport(null);
    setRouteOrigin(presetToRun.origin);
    setRouteDestination(presetToRun.destination);
    setIsRouteDrawerOpen(true);
  };

  return (
    <div className="relative w-screen h-dvh bg-slate-900 flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Thanh công cụ phía trên khung điện thoại (Chỉ hiện trên màn hình máy tính) */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-2 px-1 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-semibold">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span>Ocean Flood • Giao diện Google Maps Sáng</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowMobileQrModal((prev) => !prev)}
            className="px-2.5 py-1 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white font-bold shadow-sm transition text-[11px]"
          >
            📲 Quét QR mở trên ĐT
          </button>
          <button
            type="button"
            onClick={() => setIsMobileViewportFrame((prev) => !prev)}
            className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-white/10 transition text-[11px]"
          >
            {isMobileViewportFrame ? 'Toàn màn hình ↗' : 'Khung Mobile'}
          </button>
        </div>
      </div>

      {/* HỘP THOẠI MÃ QR ĐỂ QUÉT BẰNG CAMERA ĐIỆN THOẠI */}
      {showMobileQrModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="text-left">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  📲 Quét Mã QR Mở Trên Điện Thoại
                </h3>
                <p className="text-[11px] text-slate-500">
                  Mở Camera điện thoại hoặc Zalo để quét
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-blue-200 flex flex-col items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                  Mọi mạng 4G/5G/Wi-Fi
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=https://accommodation-dakota-telephone-inspiration.trycloudflare.com"
                  alt="QR HTTPS Mobile"
                  className="w-36 h-36 rounded-xl bg-white p-1"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-emerald-200 flex flex-col items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                  Cùng mạng Wi-Fi
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=http://10.229.53.23:3000"
                  alt="QR LAN Wi-Fi"
                  className="w-36 h-36 rounded-xl bg-white p-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KHUNG ĐIỆN THOẠI MOBILE-FIRST (430px) HOẶC TOÀN MÀN HÌNH */}
      <main
        className={`relative overflow-hidden bg-slate-100 transition-all duration-200 ${
          isMobileViewportFrame
            ? 'w-full max-w-[430px] h-dvh sm:h-[91dvh] sm:rounded-[40px] sm:border-[6px] sm:border-slate-800 sm:shadow-[0_25px_80px_rgba(0,0,0,0.65)]'
            : 'w-screen h-dvh'
        }`}
      >
        {/* 1. THANH TÌM KIẾM NỔI KIỂU GOOGLE MAPS (Ẩn đi khi đang bật chế độ Chỉ đường để nhường chỗ cho Hộp Điểm đi/Điểm đến) */}
        {!isRouteDrawerOpen && (
          <TopStatusBar
            scenario={scenario}
            onScenarioChange={(sc) => setScenario(sc)}
            selectedDistrict={selectedDistrict}
            onDistrictChange={(dist) => setSelectedDistrict(dist)}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
            updatedAt={updatedAt}
            weatherSourceLabel={weatherSourceLabel}
            isFallbackWeather={isFallbackWeather}
            tidePhuAn={tidePhuAn}
            tideNhaBe={tideNhaBe}
            districtRainfall={districtRainfall}
            highRiskCount={highRiskCount}
            verifiedCount={verifiedCount}
            forecastOnlyCount={forecastOnlyCount}
            isLoading={isLoadingAlerts}
            onOpenRoutePlanner={() => {
              setSelectedHotspot(null);
              setSelectedCrowdReport(null);
              setIsRouteDrawerOpen(true);
            }}
          />
        )}

        {/* BANNER OFFLINE */}
        {isOffline && (
          <div
            role="alert"
            className="absolute top-28 inset-x-3 z-25 px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg flex items-center gap-2"
          >
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Mất kết nối mạng — Đang hiển thị dữ liệu lưu tạm.</span>
          </div>
        )}

        {/* TOAST THÔNG BÁO */}
        {toastMessage && (
          <div
            role="status"
            className="absolute top-28 inset-x-3 z-35 px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xl flex items-center justify-between gap-2"
          >
            <span>{toastMessage}</span>
            <button type="button" onClick={() => setToastMessage(null)}>
              ✕
            </button>
          </div>
        )}

        {/* 2. BẢN ĐỒ SÁNG RÕ KIỂU GOOGLE MAPS (CHIẾM >90% DIỆN TÍCH MÀN HÌNH) */}
        <MapCanvas
          features={features}
          crowdReports={crowdReports}
          cameras={cameras}
          selectedDistrict={selectedDistrict}
          vehicleType={vehicleType}
          isDarkMode={isDarkMode}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={(hs) => {
            setSelectedCrowdReport(null);
            setIsRouteDrawerOpen(false);
            setSelectedHotspot(hs);
          }}
          onSelectCrowdReport={(rep) => {
            setSelectedHotspot(null);
            setIsRouteDrawerOpen(false);
            setSelectedCrowdReport(rep);
          }}
          activeRoutePlan={activeRoutePlan}
          routeOrigin={routeOrigin}
          routeDestination={routeDestination}
          userGpsLocation={userGpsLocation}
          showLegend={showLegend}
          onCloseLegend={() => setShowLegend(false)}
          liveTrackState={liveTrackState}
          focusCoordinates={focusCoordinates}
          onOpenSecurityCamera={(cam) => {
            setFocusCoordinates(cam.coordinates);
            setActiveSecurityCamera(cam);
          }}
        />

        {/* 3. NÚT ĐỊNH VỊ GPS & CHÚ GIẢI BÊN PHẢI */}
        {!isRouteDrawerOpen && (
          <VehicleToggle
            vehicleType={vehicleType}
            onChangeVehicle={(type) => setVehicleType(type)}
            onLocateUser={handleLocateUserClick}
            hasActiveGps={Boolean(userGpsLocation)}
            showLegend={showLegend}
            onToggleLegend={() => setShowLegend((prev) => !prev)}
          />
        )}

        {/* 4. THANH ĐIỀU KHIỂN ĐÁY TINH GỌN CHUẨN GOOGLE MAPS */}
        {!isRouteDrawerOpen && !selectedHotspot && !selectedCrowdReport && (
          <div className="absolute inset-x-3 bottom-3 z-20 pointer-events-none flex flex-col gap-2">
            {/* Khi người dùng muốn xem danh sách các điểm ngập: mở băng chuyền */}
            {showFloodStrip && features.length > 0 && (
              <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-3 shadow-2xl border border-slate-200/90 dark:border-slate-700 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      🌊 {features.length} Điểm ngập theo dõi
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      ({selectedDistrict === 'ALL' ? 'Toàn TP' : selectedDistrict})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFloodStrip(false)}
                    className="text-[11px] font-black text-slate-500 hover:text-slate-800 dark:hover:text-white px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 transition"
                  >
                    Thu gọn ▼
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                  {features.map((f) => {
                    const p = f.properties;
                    const isSevere = p.severity_level >= 2;
                    return (
                      <button
                        key={p.hotspot_id}
                        type="button"
                        onClick={() => {
                          setSelectedCrowdReport(null);
                          setIsRouteDrawerOpen(false);
                          setSelectedHotspot(p);
                        }}
                        className="w-56 shrink-0 text-left bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-2.5 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 hover:border-blue-400 active:scale-[0.98] transition shadow-sm"
                      >
                        <div
                          className={`w-12 h-12 rounded-xl shrink-0 flex flex-col items-center justify-center text-white font-black relative overflow-hidden ${
                            p.severity_level === 3
                              ? 'bg-gradient-to-b from-red-600 to-rose-700'
                              : p.severity_level === 2
                              ? 'bg-gradient-to-b from-orange-500 to-amber-600'
                              : 'bg-gradient-to-b from-blue-500 to-indigo-600'
                          }`}
                        >
                          <span className="text-xs font-black">~{p.estimated_depth_cm}</span>
                          <span className="text-[8px] font-bold opacity-90">cm</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-black text-white ${
                                isSevere ? 'bg-red-600' : 'bg-amber-500 text-slate-950'
                              }`}
                            >
                              {p.severity_label}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate">{p.district}</span>
                          </div>
                          <div className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                            {p.street_name.split('(')[0]}
                          </div>
                          <div className="text-[10px] text-[#1A73E8] dark:text-blue-400 font-bold truncate mt-0.5">
                            {p.nearby_camera ? '📹 Trụ Cam TTGT' : '🔍 Xem chi tiết'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thanh điều khiển chính kiểu Google Maps: Nổi bật, thanh thoát, không chiếm chỗ */}
            <div className="pointer-events-auto flex items-center gap-2">
              {/* Chọn Xe máy / Ô tô */}
              <div className="flex items-center bg-white/95 dark:bg-slate-900/95 p-1 rounded-full shadow-lg border border-slate-200/90 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setVehicleType('motorcycle')}
                  className={`px-3 py-2 rounded-full text-xs font-black flex items-center gap-1 transition ${
                    vehicleType === 'motorcycle'
                      ? 'bg-[#1A73E8] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                  title="Chế độ đi Xe máy"
                >
                  <Bike className="w-4 h-4" />
                  <span className="hidden xs:inline">Xe máy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('car')}
                  className={`px-3 py-2 rounded-full text-xs font-black flex items-center gap-1 transition ${
                    vehicleType === 'car'
                      ? 'bg-[#1A73E8] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                  title="Chế độ đi Ô tô"
                >
                  <CarFront className="w-4 h-4" />
                  <span className="hidden xs:inline">Ô tô</span>
                </button>
              </div>

              {/* Nút hành động chính: Chỉ đường né ngập (Google Maps Blue) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedHotspot(null);
                  setSelectedCrowdReport(null);
                  setIsRouteDrawerOpen(true);
                }}
                className="flex-1 h-12 px-4 rounded-full bg-[#1A73E8] hover:bg-blue-600 active:scale-[0.98] text-white font-black text-xs sm:text-sm shadow-[0_4px_16px_rgba(26,115,232,0.35)] flex items-center justify-center gap-2 transition"
              >
                <Navigation className="w-4 h-4 fill-white shrink-0" />
                <span className="truncate">Chỉ đường né ngập</span>
              </button>

              {/* Nút mở/đóng danh sách vùng ngập */}
              <button
                type="button"
                onClick={() => setShowFloodStrip((prev) => !prev)}
                className={`h-12 px-3 rounded-full font-black text-xs shadow-lg border flex items-center gap-1 shrink-0 transition active:scale-95 ${
                  showFloodStrip
                    ? 'bg-slate-900 text-white border-slate-700'
                    : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 border-slate-200/90 dark:border-slate-700'
                }`}
                title="Xem danh sách các điểm ngập"
              >
                <span>🌊 {features.length}</span>
                <span className="text-[10px] opacity-70">{showFloodStrip ? '▼' : '▲'}</span>
              </button>

              {/* Nút chụp ảnh báo ngập nhanh */}
              <button
                type="button"
                onClick={() => {
                  setReportTargetHotspotId(null);
                  setIsReportModalOpen(true);
                }}
                className="w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center shrink-0 transition"
                title="Chụp ảnh báo ngập tại hiện trường"
                aria-label="Chụp ảnh báo ngập"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* 5. THẺ CHI TIẾT VÙNG NGẬP ĐẦY ĐỦ HÌNH ẢNH, THƯỚC ĐO MỰC NƯỚC & CAMERA TTGT */}
        <AlertBottomSheet
          selectedHotspot={selectedHotspot}
          selectedCrowdReport={selectedCrowdReport}
          vehicleType={vehicleType}
          deviceHash={deviceHash}
          onClose={() => {
            setSelectedHotspot(null);
            setSelectedCrowdReport(null);
          }}
          onRefreshAlerts={fetchAlertsData}
          onOpenRouteToAvoid={handleOpenRouteToAvoidHotspot}
          onOpenCameraReport={(hotspotId) => {
            setReportTargetHotspotId(hotspotId || selectedHotspot?.hotspot_id || null);
            setIsReportModalOpen(true);
          }}
          onOpenSecurityCamera={(cam) => {
            setFocusCoordinates(cam.coordinates);
            setActiveSecurityCamera(cam);
          }}
          districtRainfall={districtRainfall}
          tidePhuAn={tidePhuAn}
          tideNhaBe={tideNhaBe}
          weatherSourceLabel={weatherSourceLabel}
          isFallbackWeather={isFallbackWeather}
        />

        {/* 6. CHẾ ĐỘ CHỈ ĐƯỜNG & LIVE TRACK GPS KIỂU GOOGLE MAPS NAVIGATION */}
        <RoutePlannerDrawer
          isOpen={isRouteDrawerOpen}
          onClose={() => setIsRouteDrawerOpen(false)}
          vehicleType={vehicleType}
          onChangeVehicle={(type) => setVehicleType(type)}
          scenario={scenario}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(dist) => setSelectedDistrict(dist)}
          activeRoutePlan={activeRoutePlan}
          onRoutePlanComputed={(plan, orig, dest) => {
            setActiveRoutePlan(plan);
            setRouteOrigin(orig);
            setRouteDestination(dest);
            try {
              const raw = localStorage.getItem(SAVED_COMMUTE_STORAGE_KEY);
              if (raw) setSavedDailyCommute(JSON.parse(raw));
            } catch {
              // ignore
            }
          }}
          onClearRoutePlan={() => {
            setActiveRoutePlan(null);
            setRouteOrigin(null);
            setRouteDestination(null);
            setLiveTrackState({
              isActive: false,
              currentCoord: null,
              bearingDeg: 0,
              progressPct: 0,
              followCamera: false,
            });
          }}
          initialOrigin={routeOrigin}
          initialDestination={routeDestination}
          onLiveTrackChange={(state) => setLiveTrackState(state)}
          onOpenCameraReport={() => {
            setReportTargetHotspotId(null);
            setIsReportModalOpen(true);
          }}
          userGpsLocation={userGpsLocation}
          onRequestUserGps={handleLocateUserClick}
        />

        {/* 7. HỘP THOẠI CHỤP ẢNH BÁO NGẬP KIỂM SOÁT 5 LỚP */}
        <CrowdReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          deviceHash={deviceHash}
          defaultHotspotId={reportTargetHotspotId || selectedHotspot?.hotspot_id || null}
          userGpsLocation={userGpsLocation}
          onRequestGps={handleLocateUserClick}
          onReportAccepted={() => {
            fetchAlertsData();
            showToast('🎉 Đã cập nhật ảnh & báo cáo ngập lên bản đồ!');
          }}
        />

        {/* 7.5. TRÌNH XEM CAMERA AN NINH / GIAO THÔNG TRỎ THẲNG VÀO ĐÚNG TỌA ĐỘ NÚT GIAO */}
        <SecurityCameraModal
          camera={activeSecurityCamera}
          onClose={() => setActiveSecurityCamera(null)}
          onFlyToCamera={(coords) => setFocusCoordinates([...coords])}
        />

        {/* 8. MODAL ĐỒNG Ý GPS */}
        {showGpsConsentModal && (
          <div
            className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1A73E8] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Cho phép định vị GPS
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tuân thủ bảo mật Nghị định 13/2023/NĐ-CP
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Ocean Flood chỉ dùng vị trí hiện tại để hiển thị điểm ngập quanh bạn và kiểm tra bán
                kính 500m khi báo ngập. Không lưu lịch sử di chuyển.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowGpsConsentModal(false)}
                  className="py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Để sau
                </button>
                <button
                  type="button"
                  onClick={handleAcceptGpsConsent}
                  className="py-2.5 rounded-full bg-[#1A73E8] text-white font-bold text-xs shadow"
                >
                  Đồng ý bật GPS
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
