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
 * Sử dụng Vector Tile Style JSON chính thức miễn phí 100% của CARTO GL (không cần API key, không có watermark)
 * Hiển thị đầy đủ tên đường tiếng Việt, sông Sài Gòn, kênh Tàu Hủ, kênh Tẻ, cầu và ranh giới quận sắc nét ở mọi mức zoom.
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
  const [currentZoom, setCurrentZoom] = useState<number>(11.5);
  const [showAllCameras, setShowAllCameras] = useState<boolean>(false);
  const [selectedCameraPopover, setSelectedCameraPopover] =
    useState<TrafficCameraSeed | null>(null);

  // Xây dựng GeoJSON cho Polygon vùng đệm 35m và LineString của 18 tuyến điểm đen
  const buildSpatialLayersData = useCallback(() => {
    const verifiedPolygons: GeoJSON.Feature[] = [];
    const forecastPolygons: GeoJSON.Feature[] = [];
    const verifiedLines: GeoJSON.Feature[] = [];
    const forecastLines: GeoJSON.Feature[] = [];

    features.forEach((f) => {
      const p = f.properties;
      let colorHex = '#10B981';
      if (p.severity_level === 3) colorHex = '#EF4444';
      else if (p.severity_level === 2) colorHex = '#F97316';
      else if (p.severity_level === 1) colorHex = '#F59E0B';

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

  // Khởi tạo hoặc cập nhật các Source & Layer theo đúng chuẩn Cartography Designer
  const syncMapSourcesAndLayers = useCallback(
    (map: maplibregl.Map) => {
      if (!map.isStyleLoaded()) return;

      const {
        verifiedPolygonFC,
        forecastPolygonFC,
        verifiedLineFC,
        forecastLineFC,
      } = buildSpatialLayersData();

      // 1. Vùng đệm 35m Dự báo 1-3h (forecast-polygons)
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
            'fill-opacity': 0.14,
          },
        });
        map.addLayer({
          id: 'layer-flood-buffer-forecast-outline',
          type: 'line',
          source: 'flood-forecast-polygons',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 1.2,
            'line-dasharray': [2, 2],
            'line-opacity': 0.55,
          },
        });
      } else {
        (map.getSource('flood-forecast-polygons') as maplibregl.GeoJSONSource).setData(
          forecastPolygonFC
        );
      }

      // 2. Vùng đệm 35m Đã xác minh (verified-polygons)
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
            'fill-opacity': 0.22,
          },
        });
      } else {
        (map.getSource('flood-verified-polygons') as maplibregl.GeoJSONSource).setData(
          verifiedPolygonFC
        );
      }

      // 3. Tuyến đường ngắn nhất bị ngập (route-flooded-segment - Nét đứt Đỏ-Xám)
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
            'line-color': '#475569',
            'line-width': 7,
            'line-opacity': 0.7,
          },
        });
        map.addLayer({
          id: 'layer-route-flooded-core',
          type: 'line',
          source: 'route-direct-flooded',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#EF4444',
            'line-width': 4.5,
            'line-dasharray': [2, 2],
            'line-opacity': 0.95,
          },
        });
      } else {
        (map.getSource('route-direct-flooded') as maplibregl.GeoJSONSource).setData(
          directRouteFC
        );
      }

      // 4. Tuyến đường ngập Dự báo 1-3h (Hiệu ứng Glow + Nét đứt [3, 2])
      if (!map.getSource('flood-forecast-lines')) {
        map.addSource('flood-forecast-lines', {
          type: 'geojson',
          data: forecastLineFC,
        });
        map.addLayer({
          id: 'layer-flood-forecast-glow',
          type: 'line',
          source: 'flood-forecast-lines',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 14,
            'line-blur': 6,
            'line-opacity': 0.35,
          },
        });
        map.addLayer({
          id: 'layer-flood-forecast-casing',
          type: 'line',
          source: 'flood-forecast-lines',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': isDarkMode ? '#0F172A' : '#FFFFFF',
            'line-width': 8,
            'line-opacity': 0.85,
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
            'line-dasharray': [2.5, 1.5],
            'line-opacity': 0.95,
          },
        });
      } else {
        (map.getSource('flood-forecast-lines') as maplibregl.GeoJSONSource).setData(
          forecastLineFC
        );
      }

      // 5. Tuyến đường ngập Đã xác minh (Radar Neon Glow + Nét liền đặc 100%)
      if (!map.getSource('flood-verified-lines')) {
        map.addSource('flood-verified-lines', {
          type: 'geojson',
          data: verifiedLineFC,
        });
        map.addLayer({
          id: 'layer-flood-verified-glow',
          type: 'line',
          source: 'flood-verified-lines',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': [
              'match',
              ['get', 'severity_level'],
              3,
              20,
              2,
              16,
              12,
            ],
            'line-blur': 7,
            'line-opacity': 0.48,
          },
        });
        map.addLayer({
          id: 'layer-flood-verified-casing',
          type: 'line',
          source: 'flood-verified-lines',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': [
              'match',
              ['get', 'severity_level'],
              3,
              11,
              2,
              9.5,
              7.5,
            ],
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
            'line-width': [
              'match',
              ['get', 'severity_level'],
              3,
              7.5,
              2,
              6,
              4.5,
            ],
            'line-opacity': 1,
          },
        });
      } else {
        (map.getSource('flood-verified-lines') as maplibregl.GeoJSONSource).setData(
          verifiedLineFC
        );
      }

      // 6. Lộ trình thay thế ít rủi ro ngập (route-alternative: #3B82F6 / #0EA5E9)
      const safeRouteColor = vehicleType === 'car' ? '#3B82F6' : '#0EA5E9';
      const safeRouteFC: GeoJSON.FeatureCollection = activeRoutePlan
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {
                  color: safeRouteColor,
                },
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
          id: 'layer-route-safe-glow',
          type: 'line',
          source: 'route-safe-alternative',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 18,
            'line-blur': 6,
            'line-opacity': 0.45,
          },
        });
        map.addLayer({
          id: 'layer-route-safe-casing',
          type: 'line',
          source: 'route-safe-alternative',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': 10,
            'line-opacity': 0.95,
          },
        });
        map.addLayer({
          id: 'layer-route-safe-core',
          type: 'line',
          source: 'route-safe-alternative',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 6,
            'line-opacity': 1,
          },
        });
      } else {
        (map.getSource('route-safe-alternative') as maplibregl.GeoJSONSource).setData(
          safeRouteFC
        );
      }

      // 7. Đường nối nét chấm Xanh Ngọc (#06B6D4) từ điểm ngập đang chọn tới Camera TTGT gần nhất (<300m)
      const cameraLinkFC: GeoJSON.FeatureCollection =
        selectedHotspot && selectedHotspot.nearby_camera
          ? {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      selectedHotspot.road_geom.coordinates[
                        Math.floor(selectedHotspot.road_geom.coordinates.length / 2)
                      ] || selectedHotspot.nearby_camera.coordinates,
                      selectedHotspot.nearby_camera.coordinates,
                    ],
                  },
                },
              ],
            }
          : { type: 'FeatureCollection', features: [] };

      if (!map.getSource('camera-link-line')) {
        map.addSource('camera-link-line', {
          type: 'geojson',
          data: cameraLinkFC,
        });
        map.addLayer({
          id: 'layer-camera-link-line',
          type: 'line',
          source: 'camera-link-line',
          paint: {
            'line-color': '#06B6D4',
            'line-width': 2.5,
            'line-dasharray': [2, 2],
            'line-opacity': 0.95,
          },
        });
      } else {
        (map.getSource('camera-link-line') as maplibregl.GeoJSONSource).setData(
          cameraLinkFC
        );
      }
    },
    [buildSpatialLayersData, activeRoutePlan, vehicleType, isDarkMode, selectedHotspot]
  );

  const syncLayersRef = useRef(syncMapSourcesAndLayers);
  syncLayersRef.current = syncMapSourcesAndLayers;

  const featuresRef = useRef(features);
  featuresRef.current = features;

  // Khởi tạo bản đồ MapLibre GL JS lần đầu với CARTO Vector GL Style
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialMeta = HCM_MVP_DISTRICTS_META[selectedDistrict] || HCM_MVP_DISTRICTS_META.ALL;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getVectorBasemapStyleUrl(isDarkMode),
      center: initialMeta.center,
      zoom: initialMeta.zoom,
      minZoom: 10.2,
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

    // Bắt sự kiện click vào LineString của điểm ngập trên bản đồ
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

  // Đổi giao diện Sáng / Tối của Vector Basemap CHỈ khi isDarkMode thực sự thay đổi
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

  // Đồng bộ dữ liệu các lớp GeoJSON khi features, lộ trình hoặc phương tiện thay đổi
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    syncMapSourcesAndLayers(map);
  }, [features, activeRoutePlan, vehicleType, selectedHotspot, isMapLoaded, syncMapSourcesAndLayers]);

  // Tự động bay (flyTo) khi người dùng chọn nhanh Quận
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    const meta = HCM_MVP_DISTRICTS_META[selectedDistrict] || HCM_MVP_DISTRICTS_META.ALL;
    map.flyTo({
      center: meta.center,
      zoom: meta.zoom,
      duration: 850,
      essential: true,
    });
  }, [selectedDistrict, isMapLoaded]);

  // Tự động căn khung nhìn (fitBounds) khi tính xong lộ trình tránh ngập
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || !activeRoutePlan) return;
    const coords = activeRoutePlan.routes.recommended_safe_route.geometry.coordinates;
    if (coords.length >= 2) {
      const bounds = coords.reduce(
        (b, coord) => b.extend(coord as [number, number]),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds, {
        padding: { top: 135, bottom: 260, left: 40, right: 65 },
        duration: 850,
      });
    }
  }, [activeRoutePlan, isMapLoaded]);

  // Vẽ bộ Interactive Markers theo đúng quy tắc Scale-Appropriate Generalization (Cartography Designer)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const isDetailedZoom = currentZoom >= 13.3;

    // 1. Render Camera Giao thông TTGT (Chỉ hiện khi zoom >= 13.3, hoặc khi điểm ngập đang chọn liên kết tới camera đó, hoặc khi bật nút Hiện Camera)
    cameras.forEach((cam) => {
      const isHighlighted = selectedHotspot?.nearby_camera?.id === cam.id;
      if (!isDetailedZoom && !isHighlighted && !showAllCameras) return;

      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', cam.camera_name);
      el.className = 'w-9 h-9 flex items-center justify-center focus:outline-none group';
      el.innerHTML = `
        <span class="w-6 h-6 rounded-full bg-indigo-950/90 text-cyan-300 text-[11px] flex items-center justify-center shadow-lg backdrop-blur-md transition-transform group-hover:scale-115 ${
          isHighlighted
            ? 'ring-2 ring-cyan-400 scale-125 animate-pulse border border-cyan-300'
            : 'border border-indigo-400/60'
        }">
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

    // 2. Render các cụm Báo cáo cộng đồng thời gian thực (`crowd_reports`)
    crowdReports.forEach((report) => {
      const isVerified = report.verification_status === 'VERIFIED';
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `Báo cáo cộng đồng: ${report.street_name}`);
      el.className = 'min-w-[40px] min-h-[40px] flex items-center justify-center focus:outline-none';
      el.innerHTML = `
        <div class="px-2 py-0.5 rounded-full shadow-lg font-bold text-[10px] flex items-center gap-1 backdrop-blur-md transition-transform hover:scale-105 ${
          isVerified
            ? 'bg-blue-600/95 text-white border border-white/80'
            : 'bg-amber-500/95 text-slate-950 border border-dashed border-slate-900'
        }">
          <span>📸</span>
          <span>${report.confirm_count}</span>
        </div>
      `;
      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onSelectCrowdReport(report);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(report.coordinates)
        .addTo(map);
      markersRef.current.push(marker);
    });

    // 3. Render Tactical Sonar Pins cho 18 tuyến đường Điểm đen ngập (Thiết kế tinh gọn, hiện đại, không đè chữ)
    features.forEach((f) => {
      const p = f.properties;
      const isSelected = selectedHotspot?.hotspot_id === p.hotspot_id;
      const isVerified = p.verification_status === 'VERIFIED' || p.confirm_count >= 3;

      const vehicleThreshold = vehicleType === 'car' ? 25 : 20;
      const isDangerForVehicle = p.estimated_depth_cm >= vehicleThreshold;

      let pillStyle =
        'bg-emerald-950/90 text-emerald-200 border-emerald-400/70 shadow-emerald-950/50';
      let dotColor = '#10B981';

      if (p.severity_level === 3) {
        pillStyle = 'bg-red-600/95 text-white border-white/90 shadow-red-600/50';
        dotColor = '#FFFFFF';
      } else if (p.severity_level === 2) {
        pillStyle = 'bg-orange-500/95 text-white border-white/85 shadow-orange-600/40';
        dotColor = '#FFF7ED';
      } else if (p.severity_level === 1) {
        pillStyle = 'bg-amber-400/95 text-slate-950 border-slate-900/60 shadow-amber-500/30';
        dotColor = '#0F172A';
      }

      const shortStreet = p.street_name.split('(')[0].replace('Đường ', '').trim();

      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `Điểm ngập ${p.street_name}`);
      el.className =
        'min-w-[42px] min-h-[42px] flex items-center justify-center focus:outline-none group';

      el.innerHTML = `
        <div class="relative flex items-center">
          ${
            p.severity_level === 3 || isSelected
              ? `<span class="absolute -inset-1 rounded-full ${
                  p.severity_level === 3 ? 'bg-red-500/35' : 'bg-blue-500/35'
                } animate-ping pointer-events-none"></span>`
              : ''
          }
          <div class="relative px-2 py-0.5 rounded-full shadow-lg backdrop-blur-md font-extrabold text-[11px] leading-tight flex items-center gap-1 transition-all duration-150 group-hover:scale-110 ${pillStyle} ${
            isVerified ? 'border-[1.5px] border-solid' : 'border-[1.5px] border-dashed'
          } ${
            isSelected
              ? 'ring-3 ring-blue-400 scale-115 z-30'
              : isDangerForVehicle
                ? 'opacity-100'
                : 'opacity-80'
          }">
            <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:${dotColor}"></span>
            <span style="font-family: var(--font-mono), monospace;">${p.estimated_depth_cm}cm</span>
            ${
              isDetailedZoom || isSelected
                ? `<span class="max-w-[78px] truncate text-[10px] font-semibold opacity-95 pl-0.5 border-l border-current/25">${shortStreet}</span>`
                : ''
            }
          </div>
        </div>
      `;

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onSelectHotspot(p);
        map.flyTo({
          center: f.geometry.coordinates,
          zoom: Math.max(map.getZoom(), 14.2),
          duration: 650,
        });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(f.geometry.coordinates)
        .addTo(map);
      markersRef.current.push(marker);
    });

    // 4. Render Điểm Đi (A) và Điểm Đến (B) khi đang bật tìm lộ trình
    if (activeRoutePlan && routeOrigin && routeDestination) {
      const origEl = document.createElement('div');
      origEl.className =
        'px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold border-2 border-white shadow-xl';
      origEl.innerText = '🟢 Điểm đi';
      markersRef.current.push(
        new maplibregl.Marker({ element: origEl })
          .setLngLat([routeOrigin.lng, routeOrigin.lat])
          .addTo(map)
      );

      const destEl = document.createElement('div');
      destEl.className =
        'px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold border-2 border-white shadow-xl';
      destEl.innerText = '🏁 Điểm đến';
      markersRef.current.push(
        new maplibregl.Marker({ element: destEl })
          .setLngLat([routeDestination.lng, routeDestination.lat])
          .addTo(map)
      );
    }

    // 5. Render vị trí GPS hiện tại của người dùng (nếu có)
    if (userGpsLocation) {
      const gpsEl = document.createElement('div');
      gpsEl.className =
        'w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg ring-4 ring-blue-500/40 animate-pulse';
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
    showAllCameras,
    onSelectHotspot,
    onSelectCrowdReport,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Bản đồ Vector GL toàn màn hình (>86% Viewport) */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        aria-label="Bản đồ tương tác cảnh báo ngập TP.HCM MapLibre GL JS"
      />

      {/* Popover thông tin Camera Giao thông TTGT TP.HCM (O6) */}
      {selectedCameraPopover && (
        <div
          role="dialog"
          aria-label="Thông tin Camera Giao thông TTGT TP.HCM"
          className="absolute inset-x-3 bottom-36 z-30 libre-glass rounded-2xl border border-cyan-500/40 shadow-2xl p-3.5 space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-indigo-950 text-cyan-300 flex items-center justify-center ring-1 ring-cyan-400/60 shrink-0">
                <Video className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                  {selectedCameraPopover.camera_name}
                </h3>
                <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-300 metric-mono">
                  {selectedCameraPopover.district} • Cách điểm ngập{' '}
                  {selectedCameraPopover.distance_to_hotspot_m}m
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCameraPopover(null)}
              className="w-7 h-7 rounded-lg bg-slate-200/80 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {selectedCameraPopover.ttgt_reference_note}
          </p>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Nguồn: Cổng thông tin Giao thông TP.HCM (Sở GTVT)</span>
          </div>

          <a
            href="http://giaothong.hochiminhcity.gov.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="wet-touch-target w-full px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở Cổng TTGT TP.HCM đối chiếu trực tiếp</span>
          </a>
        </div>
      )}

      {/* Bảng Chú giải Bản đồ & Bật/Tắt lớp Camera (Chuẩn Cartography Designer) */}
      {showLegend && (
        <div
          role="region"
          aria-label="Chú giải ký hiệu bản đồ ngập CVD-Safe"
          className="absolute inset-x-3 bottom-36 z-25 libre-glass rounded-2xl border border-slate-200 dark:border-white/15 shadow-2xl p-3.5 text-xs space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-extrabold text-slate-900 dark:text-white text-xs">
              Chú giải Bản đồ Thủy văn (CVD-Safe)
            </span>
            <button
              type="button"
              onClick={onCloseLegend}
              className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 text-[11px]"
            >
              Đóng
            </button>
          </div>

          {/* Nút bật/tắt nhanh hiển thị toàn bộ 18 Camera TTGT ở mọi mức zoom */}
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl">
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
              📹 Hiển thị toàn bộ 18 Camera TTGT
            </span>
            <button
              type="button"
              onClick={() => setShowAllCameras((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                showAllCameras
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              {showAllCameras ? 'Đang bật' : 'Tự động theo Zoom'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EF4444] shrink-0" />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                <strong>&gt;35cm:</strong> Lút ống pô / đèn pha
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F97316] shrink-0" />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                <strong>20–35cm:</strong> Chạm gầm / pô
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#F59E0B] shrink-0" />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                <strong>10–20cm:</strong> Ngập bánh xe
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#10B981] shrink-0" />
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                <strong>&lt;10cm:</strong> Mặt đường ổn định
              </span>
            </div>
          </div>

          <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-2 text-[11px] text-slate-600 dark:text-slate-300">
            <p>
              • <strong>━━━ Nét liền:</strong> Đã xác minh thực tế (≥3 người báo) •{' '}
              <strong>┈┈┈ Nét đứt:</strong> Dự báo sớm 1–3h.
            </p>
            <p>
              • <strong className="text-sky-400">━━━ Xanh dương:</strong> Lộ trình né ngập an toàn •{' '}
              <strong className="text-red-400">╍╍╍ Đỏ đứt:</strong> Đoạn ngập cần tránh.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
