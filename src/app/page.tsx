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
  // 1. MẶC ĐỊNH CHẾ ĐỘ BẢN ĐỒ SÁNG (LIGHT MODE) GIỐNG GOOGLE MAPS
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
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

  // 3. Trạng thái chọn Điểm ngập / Báo cáo / Chỉ đường / Báo ngập 5 lớp
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
          showToast('📍 Vị trí tham chiếu: Ngã tư Hàng Xanh, Bình Thạnh.');
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
                  src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=https://tape-dress-draws-closer.trycloudflare.com"
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
                  src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=http://192.168.2.209:3000"
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
        />

        {/* 3. NÚT ĐỊNH VỊ GPS & CHÚ GIẢI BÊN PHẢI */}
        {!isRouteDrawerOpen && (
          <VehicleToggle
            vehicleType={vehicleType}
            onChangeVehicle={(type) => setVehicleType(type)}
            onLocateUser={handleLocateUserClick}
            showLegend={showLegend}
            onToggleLegend={() => setShowLegend((prev) => !prev)}
          />
        )}

        {/* 4. THANH CÔNG CỤ ĐÁY TỐI GIẢN KIỂU GOOGLE MAPS (Ẩn khi đang mở Chỉ đường hoặc Thẻ chi tiết điểm ngập) */}
        {!isRouteDrawerOpen && !selectedHotspot && !selectedCrowdReport && (
          <div className="absolute inset-x-3 bottom-3 z-20 pointer-events-none flex flex-col gap-2">
            {/* Hàng pill nhỏ: Chọn nhanh Xe máy / Ô tô & Đi làm 1 chạm */}
            <div className="pointer-events-auto flex items-center justify-between gap-2">
              <div className="flex items-center bg-white/95 dark:bg-slate-900/95 p-1 rounded-full shadow-lg border border-slate-200/90 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setVehicleType('motorcycle')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition ${
                    vehicleType === 'motorcycle'
                      ? 'bg-[#1A73E8] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Xe máy</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('car')}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition ${
                    vehicleType === 'car'
                      ? 'bg-[#1A73E8] text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <CarFront className="w-3.5 h-3.5" />
                  <span>Ô tô</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleQuickSavedCommuteClick}
                className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-lg border border-slate-200/90 dark:border-slate-700 flex items-center gap-1 active:scale-95 transition"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#1A73E8]" />
                <span>Đi làm (1 chạm)</span>
              </button>
            </div>

            {/* Hàng chính: 2 Nút lớn kiểu Google Maps ("Chỉ đường né ngập" & "Báo ngập") */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedHotspot(null);
                  setSelectedCrowdReport(null);
                  setIsRouteDrawerOpen(true);
                }}
                className="flex-1 h-12 px-4 rounded-full bg-[#1A73E8] hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-[0_6px_20px_rgba(26,115,232,0.4)] flex items-center justify-center gap-2 transition"
              >
                <Navigation className="w-4 h-4 fill-white" />
                <span>Chỉ đường né ngập</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="h-12 px-4 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 active:scale-95 text-red-600 dark:text-red-400 font-bold text-sm shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 shrink-0 transition"
              >
                <Camera className="w-4 h-4" />
                <span>Báo ngập</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. THẺ CHI TIẾT ĐIỂM NGẬP GỌN GÀNG KIỂU GOOGLE MAPS */}
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

        {/* 6. CHẾ ĐỘ CHỈ ĐƯỜNG TRỰC QUAN KIỂU GOOGLE MAPS DIRECTIONS */}
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

        {/* 7. HỘP THOẠI BÁO NGẬP KIỂM SOÁT 5 LỚP */}
        <CrowdReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          deviceHash={deviceHash}
          defaultHotspotId={selectedHotspot?.hotspot_id || null}
          onReportAccepted={() => {
            fetchAlertsData();
            showToast('🎉 Đã cập nhật báo cáo ngập lên bản đồ!');
          }}
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
