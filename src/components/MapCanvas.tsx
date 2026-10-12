'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { ExternalLink, Video, X, ShieldCheck } from 'lucide-react';
import {
  HCM_MVP_DISTRICTS_META,
  type HcmMvpDistrict,
  type TrafficCameraSeed,
} from '@/data/hcm-spatial-seed';
import type {
  AlertGeoJsonFeature,
  HotspotForecastProperties,
} from '@/lib/forecast-engine';
import type { CrowdReportClusterRecord } from '@/lib/verification-engine';
import type {
  VehicleType,
  RoutePlanResponseOutput,
  RouteWaypointInput,
} from '@/lib/routing-engine';

export interface MapCanvasProps {
  features: AlertGeoJsonFeature[];
  crowdReports: CrowdReportClusterRecord[];
  cameras: TrafficCameraSeed[];
  selectedDistrict: HcmMvpDistrict | 'ALL';
  vehicleType: VehicleType;
  isDarkMode: boolean;
  selectedHotspot: HotspotForecastProperties | null;
  onSelectHotspot: (hotspot: HotspotForecastProperties) => void;
  onSelectCrowdReport: (report: CrowdReportClusterRecord) => void;
  activeRoutePlan: RoutePlanResponseOutput | null;
  routeOrigin: RouteWaypointInput | null;
  routeDestination: RouteWaypointInput | null;
  userGpsLocation: [number, number] | null;
  showLegend: boolean;
  onCloseLegend: () => void;
}

/**
 * Bản đồ Vector sáng rõ kiểu Google Maps (CARTO Voyager GL cho chế độ Sáng mặc định)
 */
function getVectorBasemapStyleUrl(isDark: boolean): string {
  return isDark
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
}

export default function MapCanvas({
  features,
  crowdReports,
  cameras,
  selectedDistrict,
  vehicleType,
  isDarkMode,
  selectedHotspot,
  onSelectHotspot,
  onSelectCrowdReport,
  activeRoutePlan,
  routeOrigin,
  routeDestination,
  userGpsLocation,
  showLegend,
  onCloseLegend,
}: MapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState<number>(11.8);
  const [selectedCameraPopover, setSelectedCameraPopover] =
    useState<TrafficCameraSeed | null>(null);

  // Xây dựng GeoJSON cho các đoạn đường ngập
  const buildSpatialLayersData = useCallback(() => {
    const verifiedPolygons: GeoJSON.Feature[] = [];
    const forecastPolygons: GeoJSON.Feature[] = [];
    const verifiedLines: GeoJSON.Feature[] = [];
    const forecastLines: GeoJSON.Feature[] = [];

    features.forEach((f) => {
      const p = f.properties;
      let colorHex = '#10B981';
      if (p.severity_level === 3) colorHex = '#DC2626';
      else if (p.severity_level === 2) colorHex = '#EA580C';
      else if (p.severity_level === 1) colorHex = '#D97706';

      const isVerified = p.verification_status === 'VERIFIED' || p.confirm_count >= 3;

      const polyFeature: GeoJSON.Feature = {
        type: 'Feature',
        id: `poly-${p.hotspot_id}`,
        geometry: p.avoid_polygon,
        properties: {
          hotspot_id: p.hotspot_id,
          severity_level: p.severity_level,
          color: colorHex,
          estimated_depth_cm: p.estimated_depth_cm,
        },
      };

      const lineFeature: GeoJSON.Feature = {
        type: 'Feature',
        id: `line-${p.hotspot_id}`,
        geometry: p.road_geom,
        properties: {
          hotspot_id: p.hotspot_id,
          severity_level: p.severity_level,
          color: colorHex,
          estimated_depth_cm: p.estimated_depth_cm,
          street_name: p.street_name,
          verification_status: p.verification_status,
        },
      };

      if (isVerified) {
        verifiedPolygons.push(polyFeature);
        verifiedLines.push(lineFeature);
      } else {
        forecastPolygons.push(polyFeature);
        forecastLines.push(lineFeature);
      }
    });

    return {
      verifiedPolygonFC: {
        type: 'FeatureCollection' as const,
        features: verifiedPolygons,
      },
      forecastPolygonFC: {
        type: 'FeatureCollection' as const,
        features: forecastPolygons,
      },
      verifiedLineFC: {
        type: 'FeatureCollection' as const,
        features: verifiedLines,
      },
      forecastLineFC: {
        type: 'FeatureCollection' as const,
        features: forecastLines,
      },
    };
  }, [features]);

  // Đồng bộ các lớp bản đồ (Ưu tiên làm nổi bật Lộ trình kiểu Google Maps khi đang dẫn đường)
  const syncMapSourcesAndLayers = useCallback(
    (map: maplibregl.Map) => {
      if (!map.isStyleLoaded()) return;

      const {
        verifiedPolygonFC,
        forecastPolygonFC,
        verifiedLineFC,
        forecastLineFC,
      } = buildSpatialLayersData();

      // 1. Vùng ngập dự báo (Polygon mờ)
      if (!map.getSource('flood-forecast-polygons')) {
        map.addSource('flood-forecast-polygons', {
          type: 'geojson',
          data: forecastPolygonFC,
        });
        map.addLayer({
          id: 'layer-flood-buffer-forecast-polygon',
          type: 'fill',
          source: 'flood-forecast-polygons',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.12,
          },
        });
      } else {
        (map.getSource('flood-forecast-polygons') as maplibregl.GeoJSONSource).setData(
          forecastPolygonFC
        );
      }

      // 2. Vùng ngập xác minh (Polygon)
      if (!map.getSource('flood-verified-polygons')) {
        map.addSource('flood-verified-polygons', {
          type: 'geojson',
          data: verifiedPolygonFC,
        });
        map.addLayer({
          id: 'layer-flood-buffer-verified-polygon',
          type: 'fill',
          source: 'flood-verified-polygons',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.18,
          },
        });
      } else {
        (map.getSource('flood-verified-polygons') as maplibregl.GeoJSONSource).setData(
          verifiedPolygonFC
        );
      }

      // 3. Tuyến đường ngập dự báo (Nét đứt)
      if (!map.getSource('flood-forecast-lines')) {
        map.addSource('flood-forecast-lines', {
          type: 'geojson',
          data: forecastLineFC,
        });
        map.addLayer({
          id: 'layer-flood-forecast-casing',
          type: 'line',
          source: 'flood-forecast-lines',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 8,
            'line-opacity': 0.9,
          },
        });
        map.addLayer({
          id: 'layer-flood-forecast-core',
          type: 'line',
          source: 'flood-forecast-lines',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 5,
            'line-dasharray': [2, 1.5],
            'line-opacity': 0.95,
          },
        });
      } else {
        (map.getSource('flood-forecast-lines') as maplibregl.GeoJSONSource).setData(
          forecastLineFC
        );
      }

      // 4. Tuyến đường ngập đã xác minh (Nét liền nổi bật)
      if (!map.getSource('flood-verified-lines')) {
        map.addSource('flood-verified-lines', {
          type: 'geojson',
          data: verifiedLineFC,
        });
        map.addLayer({
          id: 'layer-flood-verified-casing',
          type: 'line',
          source: 'flood-verified-lines',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 10,
            'line-opacity': 0.95,
          },
        });
        map.addLayer({
          id: 'layer-flood-verified-core',
          type: 'line',
          source: 'flood-verified-lines',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 6,
            'line-opacity': 1,
          },
        });
      } else {
        (map.getSource('flood-verified-lines') as maplibregl.GeoJSONSource).setData(
          verifiedLineFC
        );
      }

      // 5. LỘ TRÌNH BỊ NGẬP (Đường ngắn nhất cắt qua điểm ngập — Nét đứt Đỏ cảnh báo rõ ràng)
      const directRouteFC: GeoJSON.FeatureCollection =
        activeRoutePlan && activeRoutePlan.flood_detected_on_direct_route
          ? {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: activeRoutePlan.routes.direct_flooded_route.geometry,
                },
              ],
            }
          : { type: 'FeatureCollection', features: [] };

      if (!map.getSource('route-direct-flooded')) {
        map.addSource('route-direct-flooded', {
          type: 'geojson',
          data: directRouteFC,
        });
        map.addLayer({
          id: 'layer-route-flooded-casing',
          type: 'line',
          source: 'route-direct-flooded',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 10,
            'line-opacity': 0.9,
          },
        });
        map.addLayer({
          id: 'layer-route-flooded-core',
          type: 'line',
          source: 'route-direct-flooded',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#DC2626',
            'line-width': 5.5,
            'line-dasharray': [2, 2],
            'line-opacity': 0.9,
          },
        });
      } else {
        (map.getSource('route-direct-flooded') as maplibregl.GeoJSONSource).setData(
          directRouteFC
        );
      }

      // 6. LỘ TRÌNH AN TOÀN KIỂU GOOGLE MAPS (Màu Xanh Google Maps #1A73E8 + Viền đậm #1557B0)
      const safeRouteFC: GeoJSON.FeatureCollection = activeRoutePlan
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: activeRoutePlan.routes.recommended_safe_route.geometry,
              },
            ],
          }
        : { type: 'FeatureCollection', features: [] };

      if (!map.getSource('route-safe-alternative')) {
        map.addSource('route-safe-alternative', {
          type: 'geojson',
          data: safeRouteFC,
        });
        map.addLayer({
          id: 'layer-route-safe-casing',
          type: 'line',
          source: 'route-safe-alternative',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#1557B0',
            'line-width': 12,
            'line-opacity': 0.95,
          },
        });
        map.addLayer({
          id: 'layer-route-safe-core',
          type: 'line',
          source: 'route-safe-alternative',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#1A73E8',
            'line-width': 8,
            'line-opacity': 1,
          },
        });
      } else {
        (map.getSource('route-safe-alternative') as maplibregl.GeoJSONSource).setData(
          safeRouteFC
        );
      }
    },
    [buildSpatialLayersData, activeRoutePlan]
  );

  const syncLayersRef = useRef(syncMapSourcesAndLayers);
  syncLayersRef.current = syncMapSourcesAndLayers;

  const featuresRef = useRef(features);
  featuresRef.current = features;

  // Khởi tạo bản đồ MapLibre GL JS với nền Sáng (Voyager GL)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialMeta = HCM_MVP_DISTRICTS_META[selectedDistrict] || HCM_MVP_DISTRICTS_META.ALL;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getVectorBasemapStyleUrl(isDarkMode),
      center: initialMeta.center,
      zoom: initialMeta.zoom,
      minZoom: 10.5,
      maxZoom: 18.5,
      attributionControl: false,
    });

    map.on('load', () => {
      setIsMapLoaded(true);
      setCurrentZoom(map.getZoom());
      syncLayersRef.current(map);
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    const clickableLayers = [
      'layer-flood-verified-core',
      'layer-flood-forecast-core',
      'layer-flood-buffer-verified-polygon',
      'layer-flood-buffer-forecast-polygon',
    ];

    clickableLayers.forEach((layerId) => {
      map.on('click', layerId, (e) => {
        const clickedFeature = e.features?.[0];
        const hsId = clickedFeature?.properties?.hotspot_id;
        if (hsId) {
          const match = featuresRef.current.find((f) => f.properties.hotspot_id === hsId);
          if (match) {
            onSelectHotspot(match.properties);
          }
        }
      });

      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainerRef.current);

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevDarkModeRef = useRef<boolean>(isDarkMode);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    if (prevDarkModeRef.current === isDarkMode) return;
    prevDarkModeRef.current = isDarkMode;

    map.setStyle(getVectorBasemapStyleUrl(isDarkMode));
    map.once('styledata', () => {
      syncLayersRef.current(map);
    });
  }, [isDarkMode, isMapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    syncMapSourcesAndLayers(map);
  }, [features, activeRoutePlan, vehicleType, selectedHotspot, isMapLoaded, syncMapSourcesAndLayers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || activeRoutePlan) return;
    const meta = HCM_MVP_DISTRICTS_META[selectedDistrict] || HCM_MVP_DISTRICTS_META.ALL;
    map.flyTo({
      center: meta.center,
      zoom: meta.zoom,
      duration: 800,
      essential: true,
    });
  }, [selectedDistrict, isMapLoaded, activeRoutePlan]);

  // Căn khung nhìn chuẩn Google Maps khi hiển thị lộ trình (Chừa khoảng trống cho Header trên và Thẻ tóm tắt dưới)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || !activeRoutePlan) return;

    const safeCoords = activeRoutePlan.routes.recommended_safe_route.geometry.coordinates;
    const directCoords = activeRoutePlan.routes.direct_flooded_route.geometry.coordinates;
    const allCoords = [...safeCoords, ...directCoords];

    if (allCoords.length >= 2) {
      const bounds = allCoords.reduce(
        (b, coord) => b.extend(coord as [number, number]),
        new maplibregl.LngLatBounds(allCoords[0], allCoords[0])
      );
      map.fitBounds(bounds, {
        padding: { top: 170, bottom: 235, left: 45, right: 45 },
        duration: 750,
      });
    }
  }, [activeRoutePlan, isMapLoaded]);

  // Render Markers trên bản đồ (Tối giản, rõ ràng như Google Maps)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const isDetailedZoom = currentZoom >= 13.5;

    // KHI ĐANG BẬT CHẾ ĐỘ DẪN ĐƯỜNG (GOOGLE MAPS DIRECTIONS MODE):
    // Chỉ hiển thị Điểm đi, Điểm đến, Nhãn thời gian trên tuyến đường giống Google Maps, và Điểm ngập bị cắt qua!
    if (activeRoutePlan && routeOrigin && routeDestination) {
      const safeRoute = activeRoutePlan.routes.recommended_safe_route;
      const directRoute = activeRoutePlan.routes.direct_flooded_route;

      // 1. Nhãn Callout trên Đường an toàn (Màu Xanh Google Maps #1A73E8)
      const safeMidIdx = Math.floor(safeRoute.geometry.coordinates.length / 2);
      const safeMidCoord = safeRoute.geometry.coordinates[safeMidIdx];
      if (safeMidCoord) {
        const safeLabelEl = document.createElement('div');
        safeLabelEl.className = 'pointer-events-none';
        safeLabelEl.innerHTML = `
          <div class="px-3 py-1.5 rounded-2xl bg-[#1A73E8] text-white shadow-[0_6px_20px_rgba(26,115,232,0.5)] border-2 border-white flex items-center gap-1.5 font-extrabold text-xs whitespace-nowrap">
            <span>⚡ ${safeRoute.duration_min} phút</span>
            <span class="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-bold">An toàn • Né ngập</span>
          </div>
        `;
        markersRef.current.push(
          new maplibregl.Marker({ element: safeLabelEl, anchor: 'bottom' })
            .setLngLat(safeMidCoord as [number, number])
            .addTo(map)
        );
      }

      // 2. Nhãn Callout trên Đường bị ngập (Màu Đỏ cảnh báo)
      if (activeRoutePlan.flood_detected_on_direct_route) {
        const directMidIdx = Math.floor(directRoute.geometry.coordinates.length / 2);
        const directMidCoord = directRoute.geometry.coordinates[directMidIdx];
        const firstAvoided = activeRoutePlan.intersected_alerts[0];

        if (directMidCoord) {
          const floodLabelEl = document.createElement('div');
          floodLabelEl.className = 'pointer-events-none';
          floodLabelEl.innerHTML = `
            <div class="px-2.5 py-1 rounded-xl bg-white text-red-600 shadow-lg border-2 border-red-500 flex items-center gap-1 font-extrabold text-[11px] whitespace-nowrap">
              <span>⛔ Ngập ~${firstAvoided?.estimated_depth_cm ?? 40}cm</span>
              <span class="text-[10px] text-slate-600 font-semibold">(${
                firstAvoided ? firstAvoided.street_name.split('(')[0].replace('Đường ', '').trim() : 'Nên tránh'
              })</span>
            </div>
          `;
          markersRef.current.push(
            new maplibregl.Marker({ element: floodLabelEl, anchor: 'top' })
              .setLngLat(directMidCoord as [number, number])
              .addTo(map)
          );
        }
      }

      // 3. Điểm Đi (Chấm tròn trắng viền đen kiểu Google Maps)
      const origEl = document.createElement('div');
      origEl.innerHTML = `
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-lg border-2 border-white">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>Điểm đi</span>
        </div>
      `;
      markersRef.current.push(
        new maplibregl.Marker({ element: origEl, anchor: 'center' })
          .setLngLat([routeOrigin.lng, routeOrigin.lat])
          .addTo(map)
      );

      // 4. Điểm Đến (Ghim đỏ Google Maps)
      const destEl = document.createElement('div');
      destEl.innerHTML = `
        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold shadow-lg border-2 border-white">
          <span>📍</span>
          <span>Điểm đến</span>
        </div>
      `;
      markersRef.current.push(
        new maplibregl.Marker({ element: destEl, anchor: 'bottom' })
          .setLngLat([routeDestination.lng, routeDestination.lat])
          .addTo(map)
      );

      return;
    }

    // CHẾ ĐỘ XEM BẢN ĐỒ BÌNH THƯỜNG (Tối giản, không đè chữ):
    // 1. Render các điểm ngập
    features.forEach((f) => {
      const p = f.properties;
      const isSelected = selectedHotspot?.hotspot_id === p.hotspot_id;

      let pillBg = 'bg-emerald-600 text-white';
      if (p.severity_level === 3) {
        pillBg = 'bg-red-600 text-white';
      } else if (p.severity_level === 2) {
        pillBg = 'bg-orange-500 text-white';
      } else if (p.severity_level === 1) {
        pillBg = 'bg-amber-500 text-slate-950';
      }

      const shortStreet = p.street_name.split('(')[0].replace('Đường ', '').trim();

      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `Điểm ngập ${p.street_name}`);
      el.className = 'min-w-[38px] min-h-[38px] flex items-center justify-center focus:outline-none group';

      el.innerHTML = `
        <div class="px-2 py-0.5 rounded-full shadow-md font-extrabold text-[11px] flex items-center gap-1 border-2 border-white transition-transform group-hover:scale-110 ${pillBg} ${
          isSelected ? 'ring-4 ring-blue-500 scale-125 z-30' : ''
        }">
          <span>${p.estimated_depth_cm}cm</span>
          ${
            isDetailedZoom || isSelected
              ? `<span class="max-w-[75px] truncate text-[10px] font-semibold pl-1 border-l border-white/30">${shortStreet}</span>`
              : ''
          }
        </div>
      `;

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onSelectHotspot(p);
        map.flyTo({
          center: f.geometry.coordinates,
          zoom: Math.max(map.getZoom(), 14.3),
          duration: 600,
        });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(f.geometry.coordinates)
        .addTo(map);
      markersRef.current.push(marker);
    });

    // 2. Render Camera TTGT chỉ khi phóng to hoặc khi chọn điểm ngập
    cameras.forEach((cam) => {
      const isHighlighted = selectedHotspot?.nearby_camera?.id === cam.id;
      if (!isDetailedZoom && !isHighlighted) return;

      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'w-8 h-8 flex items-center justify-center focus:outline-none';
      el.innerHTML = `
        <span class="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center shadow-md border-2 border-white">
          📹
        </span>
      `;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        setSelectedCameraPopover(cam);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(cam.location.coordinates)
        .addTo(map);
      markersRef.current.push(marker);
    });

    // 3. Vị trí GPS người dùng
    if (userGpsLocation) {
      const gpsEl = document.createElement('div');
      gpsEl.className =
        'w-4 h-4 rounded-full bg-[#1A73E8] border-2 border-white shadow-lg ring-4 ring-blue-500/35';
      markersRef.current.push(
        new maplibregl.Marker({ element: gpsEl })
          .setLngLat(userGpsLocation)
          .addTo(map)
      );
    }
  }, [
    features,
    crowdReports,
    cameras,
    selectedHotspot,
    vehicleType,
    activeRoutePlan,
    routeOrigin,
    routeDestination,
    userGpsLocation,
    isMapLoaded,
    currentZoom,
    onSelectHotspot,
    onSelectCrowdReport,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        aria-label="Bản đồ cảnh báo ngập TP.HCM"
      />

      {/* Popover Camera TTGT */}
      {selectedCameraPopover && (
        <div
          role="dialog"
          className="absolute inset-x-3 bottom-24 z-30 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-3.5 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Video className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {selectedCameraPopover.camera_name}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Cách điểm ngập {selectedCameraPopover.distance_to_hotspot_m}m
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCameraPopover(null)}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <a
            href="http://giaothong.hochiminhcity.gov.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 rounded-xl bg-[#1A73E8] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở Cổng Camera Giao Thông TP.HCM</span>
          </a>
        </div>
      )}

      {/* Bảng Chú giải gọn gàng kiểu Google Maps Layers */}
      {showLegend && (
        <div
          role="region"
          className="absolute inset-x-3 bottom-24 z-25 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-3.5 text-xs space-y-2"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="font-bold text-slate-900 dark:text-white">
              Chú giải mức độ ngập trên bản đồ
            </span>
            <button
              type="button"
              onClick={onCloseLegend}
              className="text-slate-500 hover:text-slate-800 font-semibold"
            >
              Đóng ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 shrink-0" />
              <span className="text-slate-700 dark:text-slate-200">
                <strong>&gt;35cm:</strong> Ngập sâu (Nên tránh)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-200">
                <strong>20–35cm:</strong> Ngang ống pô / gầm
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-200">
                <strong>10–20cm:</strong> Xâm xấp bánh xe
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-slate-700 dark:text-slate-200">
                <strong>&lt;10cm:</strong> Bình thường
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
