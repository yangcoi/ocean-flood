'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Camera,
  Bookmark,
  ShieldCheck,
  WifiOff,
  MapPin,
  X,
  AlertCircle,
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
} from '@/components/RoutePlannerDrawer';
import CrowdReportModal from '@/components/CrowdReportModal';

import type { HcmMvpDistrict, TrafficCameraSeed } from '@/data/hcm-spatial-seed';
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
  // 1. Trạng thái Giao diện (Mặc định bật Night Rain Dark Mode chống lóa lúc mưa chiều 17h30)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorcycle');
  const [scenario, setScenario] = useState<ForecastScenario>('peak_tide_rain');
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
  const [isLoadingAlerts, setIsLoadingAlerts] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // 3. Trạng thái chọn Điểm ngập / Báo cáo / Tìm đường / Báo ngập 5 lớp
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

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);

  // 4. Trạng thái Đồng ý GPS (Tuân thủ Nghị định 13/2023/NĐ-CP) & Định danh thiết bị ẩn danh
  const [showGpsConsentModal, setShowGpsConsentModal] = useState<boolean>(false);
  const [hasGpsConsent, setHasGpsConsent] = useState<boolean>(false);
  const [userGpsLocation, setUserGpsLocation] = useState<[number, number] | null>(null);
  const [deviceHash, setDeviceHash] = useState<string>('anon_hcm_commuter_01');
  const [savedDailyCommute, setSavedDailyCommute] =
    useState<SavedCommutePreset | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chế độ khung hiển thị: Mặc định chuẩn Mobile-First (430px) ngay cả khi mở trên máy tính
  const [isMobileViewportFrame, setIsMobileViewportFrame] = useState<boolean>(true);

  // Đồng bộ class .dark lên thẻ <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Khởi tạo device_hash ẩn danh, kiểm tra trạng thái mạng & đọc lộ trình lưu trong localStorage
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
      // ignore storage errors
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

  // Hàm gọi GET /api/alerts
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
    }, 4000);
  };

  const handleLocateUserClick = () => {
    if (!hasGpsConsent) {
      setShowGpsConsentModal(true);
      return;
    }
    triggerBrowserGeolocation();
  };

  const triggerBrowserGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setUserGpsLocation(coords);
          showToast('📍 Đã định vị GPS hiện tại của bạn.');
        },
        () => {
          setUserGpsLocation([106.7114, 10.8035]);
          showToast(
            '📍 Đang dùng vị trí tham chiếu tại Ngã tư Hàng Xanh, Bình Thạnh.'
          );
        },
        { enableHighAccuracy: true, timeout: 4000 }
      );
    } else {
      setUserGpsLocation([106.7114, 10.8035]);
    }
  };

  const handleAcceptGpsConsent = () => {
    setHasGpsConsent(true);
    setShowGpsConsentModal(false);
    try {
      localStorage.setItem(GPS_CONSENT_STORAGE_KEY, 'granted');
    } catch {
      // ignore
    }
    triggerBrowserGeolocation();
  };

  const handleOpenRouteToAvoidHotspot = (hotspot: HotspotForecastProperties) => {
    setSelectedHotspot(null);
    setSelectedCrowdReport(null);

    const matchingPreset =
      POPULAR_HCM_COMMUTE_PRESETS.find((p) => p.district === hotspot.district) ||
      POPULAR_HCM_COMMUTE_PRESETS[0];

    setRouteOrigin(matchingPreset.origin);
    setRouteDestination(matchingPreset.destination);
    setIsRouteDrawerOpen(true);
  };

  const handleQuickSavedCommuteClick = async () => {
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
    <div className="relative w-screen h-dvh bg-[#060911] flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Thanh công cụ phía trên khung điện thoại (Chỉ hiện trên màn hình máy tính) */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[430px] mb-2 px-1 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-semibold">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3B82F6]" />
          <span className="text-slate-200">Ocean Flood • Mobile-First PWA</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileViewportFrame((prev) => !prev)}
          className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium border border-white/10 transition text-[11px]"
        >
          {isMobileViewportFrame ? 'Mở rộng toàn màn hình ↗' : 'Thu về khung Mobile (430px)'}
        </button>
      </div>

      {/* KHUNG ĐIỆN THOẠI MOBILE-FIRST (430px) HOẶC TOÀN MÀN HÌNH */}
      <main
        className={`relative overflow-hidden bg-slate-950 transition-all duration-200 ${
          isMobileViewportFrame
            ? 'w-full max-w-[430px] h-dvh sm:h-[91dvh] sm:rounded-[40px] sm:border-[6px] sm:border-slate-800/90 sm:shadow-[0_25px_80px_rgba(0,0,0,0.85)]'
            : 'w-screen h-dvh'
        }`}
      >
        {/* 1. THANH HUD TRẠNG THÁI MƯA, ĐỈNH TRIỀU PHÚ AN & PILL CHỌN QUẬN (O1) */}
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
          isLoading={isLoadingAlerts}
        />

        {/* BANNER CẢNH BÁO OFFLINE (NẾU MẤT MẠNG - CHUẨN RULE 7) */}
        {isOffline && (
          <div
            role="alert"
            className="absolute top-36 inset-x-3 z-25 mx-auto max-w-xl px-3 py-2 rounded-2xl bg-amber-500 text-slate-950 font-bold text-[11px] shadow-xl flex items-center gap-2"
          >
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Đang mất kết nối mạng — Hiển thị dữ liệu lưu tạm gần nhất, vui lòng quan sát thực tế.
            </span>
          </div>
        )}

        {/* TOAST PHẢN HỒI NHANH */}
        {toastMessage && (
          <div
            role="status"
            className="absolute top-36 inset-x-3 z-35 mx-auto max-w-md px-3.5 py-2 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl border border-emerald-400/50 flex items-center justify-between gap-2 animate-in fade-in duration-150"
          >
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. BẢN ĐỒ VECTOR GL MAPLIBRE TOÀN MÀN HÌNH (>86% VIEWPORT - L0) */}
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
        />

        {/* 3. CỤM NÚT ĐỊNH VỊ GPS & CHÚ GIẢI BẢN ĐỒ BÊN PHẢI (O2) */}
        <VehicleToggle
          vehicleType={vehicleType}
          onChangeVehicle={(type) => setVehicleType(type)}
          onLocateUser={handleLocateUserClick}
          showLegend={showLegend}
          onToggleLegend={() => setShowLegend((prev) => !prev)}
        />

        {/* 4. BOTTOM COMMAND DOCK ĐỒNG NHẤT CHUẨN LIBREUIUX (VÙNG NGÓN CÁI THUMB ZONE) */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-20 pointer-events-none">
          <div className="pointer-events-auto libre-glass rounded-[26px] border border-slate-200/80 dark:border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.55)] p-2.5 flex flex-col gap-2">
            {/* Hàng trên của Dock: Segmented Vehicle Switcher (Xe máy vs Ô tô) + Nút 1 chạm Đi làm */}
            <div className="flex items-center justify-between gap-1.5">
              {/* Segmented Pill: Xe máy (>=20cm) vs Ô tô (>=25cm) */}
              <div
                className="flex items-center bg-slate-200/80 dark:bg-slate-900/90 p-0.5 rounded-xl border border-slate-300/60 dark:border-white/10"
                role="group"
                aria-label="Chọn chế độ phương tiện để lọc ngưỡng ngập"
              >
                <button
                  type="button"
                  onClick={() => setVehicleType('motorcycle')}
                  aria-pressed={vehicleType === 'motorcycle'}
                  className={`px-2.5 py-1 rounded-[10px] text-[11px] font-bold flex items-center gap-1 transition-all ${
                    vehicleType === 'motorcycle'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5 shrink-0" />
                  <span>Xe máy</span>
                  <span className="text-[9.5px] opacity-85 metric-mono">≥20cm</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleType('car')}
                  aria-pressed={vehicleType === 'car'}
                  className={`px-2.5 py-1 rounded-[10px] text-[11px] font-bold flex items-center gap-1 transition-all ${
                    vehicleType === 'car'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CarFront className="w-3.5 h-3.5 shrink-0" />
                  <span>Ô tô</span>
                  <span className="text-[9.5px] opacity-85 metric-mono">≥25cm</span>
                </button>
              </div>

              {/* Nút 1 chạm: Lộ trình đi làm hằng ngày */}
              <button
                type="button"
                onClick={handleQuickSavedCommuteClick}
                title="Mở nhanh Lộ trình đi làm hằng ngày bằng 1 chạm"
                className="px-2.5 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-700 dark:text-violet-200 font-bold text-[11px] border border-violet-500/35 flex items-center gap-1 shrink-0 transition active:scale-95"
              >
                <Bookmark className="w-3 h-3 shrink-0 text-violet-500 dark:text-violet-300" />
                <span>Đi làm (1 chạm)</span>
              </button>
            </div>

            {/* Hàng chính của Dock: Thanh Tìm Lộ Trình Tránh Ngập + Nút CTA Báo Ngập Hiện Trường */}
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedHotspot(null);
                  setSelectedCrowdReport(null);
                  setIsRouteDrawerOpen(true);
                }}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-2xl bg-slate-100/90 dark:bg-slate-900/90 hover:bg-slate-200/80 dark:hover:bg-slate-800/90 border border-slate-200/90 dark:border-white/10 flex items-center gap-2.5 text-left transition group active:scale-[0.99]"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30 group-hover:scale-105 transition">
                  <Search className="w-4 h-4" />
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    Tìm đường né ngập ({vehicleType === 'car' ? 'Ô tô' : 'Xe máy'})
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {activeRoutePlan
                      ? `Đang bật: +${activeRoutePlan.routes.recommended_safe_route.extra_time_min} phút né ngập • Chạm để xem`
                      : 'So sánh đường ngập vs lộ trình an toàn'}
                  </div>
                </div>
              </button>

              {/* Nút CTA Khẩn cấp: Báo ngập (1 icon duy nhất, phân cấp thị giác rõ ràng) */}
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-500 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 border border-white/25 flex flex-col items-center justify-center gap-1 shrink-0 transition"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>Báo ngập</span>
              </button>
            </div>

            {/* Dòng chú thích pháp lý & bảo mật GPS tối giản (Rule 7 & NĐ 13/2023/NĐ-CP) */}
            <div className="flex items-center justify-between gap-2 pt-0.5 px-1 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-white/8">
              <span className="flex items-center gap-1 truncate">
                <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">
                  Dự báo 1–3h &amp; lộ trình mang tính tham khảo hỗ trợ quyết định.
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowGpsConsentModal(true)}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 shrink-0"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>NĐ13/GPS</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. THẺ CHI TIẾT ĐIỂM NGẬP NGÔN NGỮ KÉP (O3) */}
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
        />

        {/* 6. NGĂN TÌM LỘ TRÌNH TRÁNH NGẬP CHO XE MÁY & Ô TÔ (O4) */}
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
          }}
          initialOrigin={routeOrigin}
          initialDestination={routeDestination}
        />

        {/* 7. HỘP THOẠI BÁO NGẬP KIỂM SOÁT CHẶT 5 LỚP (O5) */}
        <CrowdReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          deviceHash={deviceHash}
          defaultHotspotId={selectedHotspot?.hotspot_id || null}
          onReportAccepted={() => {
            fetchAlertsData();
            showToast(
              '🎉 Đã ghi nhận báo cáo hiện trường! Dữ liệu điểm ngập đã được cập nhật lên bản đồ.'
            );
          }}
        />

        {/* 8. MODAL ĐỒNG Ý QUYỀN VỊ TRÍ GPS & BẢO VỆ DỮ LIỆU CÁ NHÂN (TUÂN THỦ NGHỊ ĐỊNH 13/2023/NĐ-CP) */}
        {showGpsConsentModal && (
          <div
            className="absolute inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3"
            role="dialog"
            aria-modal="true"
            aria-label="Thông báo bảo vệ dữ liệu vị trí cá nhân theo Nghị định 13/2023/NĐ-CP"
          >
            <div className="w-full max-w-md libre-glass rounded-3xl border border-slate-200 dark:border-white/20 shadow-2xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                      Quyền Định vị GPS &amp; Bảo vệ Dữ liệu Cá nhân
                    </h3>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      Tuân thủ Nghị định 13/2023/NĐ-CP
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGpsConsentModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                <p>
                  <strong>Ocean Flood</strong> chỉ sử dụng tọa độ GPS của bạn cho 2 mục đích duy nhất:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Hiển thị điểm ngập xung quanh bạn và gợi ý lộ trình tránh ngập cho Xe máy / Ô tô.
                  </li>
                  <li>
                    Kiểm tra bán kính hiện trường <strong>Geofence ≤ 500m</strong> khi bạn gửi báo cáo
                    ngập cộng đồng (chống báo cáo giả từ xa).
                  </li>
                </ul>
                <p className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-900 dark:text-emerald-200 font-medium">
                  🔒 <strong>Cam kết Quyền riêng tư:</strong> Tọa độ kiểm tra khoảng cách chỉ xử lý
                  tức thời trên bộ nhớ tạm (RAM), mã thiết bị được băm một chiều (
                  <code className="metric-mono">SHA-256</code>) và hệ thống{' '}
                  <strong>tuyệt đối không lưu lịch sử di chuyển cá nhân</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowGpsConsentModal(false)}
                  className="wet-touch-target px-3 py-2 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs"
                >
                  Chỉ xem bản đồ
                </button>
                <button
                  type="button"
                  onClick={handleAcceptGpsConsent}
                  className="wet-touch-target px-3 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg"
                >
                  Đồng ý &amp; Bật GPS
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
