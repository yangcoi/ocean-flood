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
 * Tạo MapLibre Style JSON chuẩn Desaturated Muted Basemap (docs/05-cartography.md)
 * Sử dụng Carto Light / Dark Matter giảm bão hòa màu để làm nổi bật 100% lớp ngập CVD-safe
 */
function createBasemapStyle(isDark: boolean): maplibregl.StyleSpecification {
  const tiles = isDark
    ? [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ]
    : [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ];

  return {
    version: 8,
    sources: {
      'carto-basemap': {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [
      {
        id: 'basemap-background',
        type: 'background',
        paint: {
          'background-color': isDark ? '#0B0F19' : '#E2E8F0',
        },
      },
      {
        id: 'basemap-tiles',
        type: 'raster',
        source: 'carto-basemap',
        paint: {
          'raster-opacity': isDark ? 0.92 : 0.96,
          'raster-contrast': 0.05,
        },
      },
    ],
  };
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
      // Điều chỉnh màu sắc hiển thị theo ngưỡng phương tiện nếu cần nhấn mạnh cho Ô tô (>=25cm) vs Xe máy (>=20cm)
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

  // Khởi tạo hoặc cập nhật các Source & Layer theo đúng thứ tự Z-Index (docs/05-cartography.md Mục 5)
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
            'fill-opacity': 0.16,
          },
        });
        map.addLayer({
          id: 'layer-flood-buffer-forecast-outline',
          type: 'line',
          source: 'flood-forecast-polygons',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 1.5,
            'line-dasharray': [2, 2],
            'line-opacity': 0.65,
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
            'fill-opacity': 0.25,
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
            'line-color': '#64748B',
            'line-width': 8,
            'line-opacity': 0.65,
          },
        });
        map.addLayer({
          id: 'layer-route-flooded-core',
          type: 'line',
          source: 'route-direct-flooded',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#EF4444',
            'line-width': 5,
            'line-dasharray': [2, 2],
            'line-opacity': 0.95,
          },
        });
      } else {
        (map.getSource('route-direct-flooded') as maplibregl.GeoJSONSource).setData(
          directRouteFC
        );
      }

      // 4. Tuyến đường ngập Dự báo 1-3h (Nét đứt [4, 2])
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
            'line-color': isDarkMode ? '#0F172A' : '#FFFFFF',
            'line-width': 10,
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
            'line-width': 6,
            'line-dasharray': [3, 2],
            'line-opacity': 0.9,
          },
        });
      } else {
        (map.getSource('flood-forecast-lines') as maplibregl.GeoJSONSource).setData(
          forecastLineFC
        );
      }

      // 5. Tuyến đường ngập Đã xác minh (Nét liền đặc 100% + Casing trắng)
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
            'line-width': [
              'match',
              ['get', 'severity_level'],
              3,
              14,
              2,
              12,
              9,
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
              9,
              2,
              7,
              5,
            ],
            'line-opacity': 1,
          },
        });
      } else {
        (map.getSource('flood-verified-lines') as maplibregl.GeoJSONSource).setData(
          verifiedLineFC
        );
      }

      // 6. Lộ trình thay thế ít rủi ro ngập (route-alternative: #0284C7 cho Xe máy / #2563EB cho Ô tô)
      const safeRouteColor = vehicleType === 'car' ? '#2563EB' : '#0284C7';
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
          id: 'layer-route-safe-casing',
          type: 'line',
          source: 'route-safe-alternative',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#FFFFFF',
            'line-width': vehicleType === 'car' ? 13 : 11,
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
            'line-width': vehicleType === 'car' ? 8 : 6.5,
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
            'line-width': 3,
            'line-dasharray': [1, 2],
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

  // Khởi tạo bản đồ MapLibre GL JS lần đầu
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialMeta = HCM_MVP_DISTRICTS_META[selectedDistrict] || HCM_MVP_DISTRICTS_META.ALL;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: createBasemapStyle(isDarkMode),
      center: initialMeta.center,
      zoom: initialMeta.zoom,
      minZoom: 10.2,
      maxZoom: 18.5,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-left'
    );

    map.on('load', () => {
      setIsMapLoaded(true);
      syncMapSourcesAndLayers(map);
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
          const match = features.find((f) => f.properties.hotspot_id === hsId);
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
  const syncLayersRef = useRef(syncMapSourcesAndLayers);
  syncLayersRef.current = syncMapSourcesAndLayers;

  // Đổi giao diện Sáng / Tối của Basemap CHỈ khi isDarkMode thực sự thay đổi
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;
    if (prevDarkModeRef.current === isDarkMode) return;
    prevDarkModeRef.current = isDarkMode;

    map.setStyle(createBasemapStyle(isDarkMode));
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
      duration: 900,
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
        padding: { top: 90, bottom: 290, left: 45, right: 85 },
        duration: 850,
      });
    }
  }, [activeRoutePlan, isMapLoaded]);

  // Vẽ bộ Interactive Markers (Điểm đen ngập, Báo cáo cộng đồng, Camera TTGT, Điểm Đi/Đến, Vị trí GPS)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    // Xóa markers cũ
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // 1. Render 18 tọa độ Camera Giao thông TTGT (`traffic_cameras`)
    cameras.forEach((cam) => {
      const isHighlighted = selectedHotspot?.nearby_camera?.id === cam.id;
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', cam.camera_name);
      el.className = `w-11 h-11 flex items-center justify-center focus:outline-none group`;
      el.innerHTML = `
        <span class="w-7 h-7 rounded-full bg-[#312E81] text-white text-xs flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
          isHighlighted
            ? 'ring-4 ring-[#06B6D4] scale-125 animate-pulse'
            : 'border-2 border-white/90'
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
      el.className = 'min-w-[48px] min-h-[48px] flex items-center justify-center focus:outline-none';
      el.innerHTML = `
        <div class="px-2 py-1 rounded-full shadow-xl font-bold text-[11px] flex items-center gap-1 transition-transform hover:scale-105 ${
          isVerified
            ? 'bg-blue-600 text-white border-2 border-white ring-2 ring-blue-400/60'
            : 'bg-amber-500 text-slate-950 border-2 border-dashed border-white'
        }">
          <span>${isVerified ? '✓' : '?'}</span>
          <span>📸 ${report.confirm_count} người</span>
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

    // 3. Render Badge 18 tuyến đường Điểm đen ngập (CVD-Safe: Biểu tượng + Độ sâu ~cm + Trạng thái)
    features.forEach((f) => {
      const p = f.properties;
      const isSelected = selectedHotspot?.hotspot_id === p.hotspot_id;
      const isVerified = p.verification_status === 'VERIFIED' || p.confirm_count >= 3;

      // Ngưỡng cảnh báo theo loại xe: Xe máy >=20cm, Ô tô >=25cm
      const vehicleThreshold = vehicleType === 'car' ? 25 : 20;
      const isDangerForVehicle = p.estimated_depth_cm >= vehicleThreshold;

      let bgClass = 'bg-[#10B981] text-white border-white';
      let icon = '✓';
      if (p.severity_level === 3) {
        bgClass = 'bg-[#EF4444] text-white border-white';
        icon = '⛔';
      } else if (p.severity_level === 2) {
        bgClass = 'bg-[#F97316] text-white border-white';
        icon = '⚠️';
      } else if (p.severity_level === 1) {
        bgClass = 'bg-[#F59E0B] text-slate-950 border-slate-900';
        icon = '🛞';
      }

      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', `Điểm ngập ${p.street_name}`);
      el.className =
        'min-w-[48px] min-h-[48px] flex items-center justify-center focus:outline-none group';

      el.innerHTML = `
        <div class="px-2.5 py-1 rounded-full shadow-xl font-extrabold text-xs flex items-center gap-1 transition-all group-hover:scale-110 ${bgClass} ${
          isVerified ? 'border-2 border-solid' : 'border-2 border-dashed'
        } ${isSelected ? 'ring-4 ring-blue-400 scale-115 z-30' : ''} ${
          isDangerForVehicle ? 'shadow-red-600/40' : 'opacity-90'
        }">
          <span>${icon}</span>
          <span style="font-family: monospace;">~${p.estimated_depth_cm}cm</span>
          <span class="text-[10px] px-1 rounded bg-black/25 text-white">${
            isVerified ? `✓${p.confirm_count > 0 ? p.confirm_count : ''}` : '🕒1-3h'
          }</span>
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

    // 4. Render Điểm Đi (🟢) và Điểm Đến (🔴) khi đang bật tìm lộ trình
    if (activeRoutePlan && routeOrigin && routeDestination) {
      const origEl = document.createElement('div');
      origEl.className =
        'px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold border-2 border-white shadow-xl';
      origEl.innerText = '🟢 Điểm đi';
      markersRef.current.push(
        new maplibregl.Marker({ element: origEl })
          .setLngLat([routeOrigin.lng, routeOrigin.lat])
          .addTo(map)
      );

      const destEl = document.createElement('div');
      destEl.className =
        'px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-extrabold border-2 border-white shadow-xl';
      destEl.innerText = '🔴 Điểm đến';
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
        'w-5 h-5 rounded-full bg-blue-600 border-3 border-white shadow-lg ring-4 ring-blue-500/40 animate-pulse';
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
    onSelectHotspot,
    onSelectCrowdReport,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Bản đồ toàn màn hình (>86% Viewport) */}
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
          className="absolute inset-x-2.5 bottom-28 z-30 libre-glass rounded-2xl border border-cyan-500/50 shadow-2xl p-3 space-y-2 animate-in fade-in duration-150"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#312E81] text-white flex items-center justify-center ring-2 ring-cyan-400 shrink-0">
                <Video className="w-4 h-4 text-cyan-300" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  {selectedCameraPopover.camera_name}
                </h3>
                <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 metric-mono">
                  📍 {selectedCameraPopover.district} • Cách điểm ngập{' '}
                  {selectedCameraPopover.distance_to_hotspot_m}m (&lt;300m)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCameraPopover(null)}
              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {selectedCameraPopover.ttgt_reference_note}
          </p>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Nguồn: Cổng thông tin Giao thông TP.HCM (Sở GTVT)</span>
          </div>

          <a
            href="http://giaothong.hochiminhcity.gov.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="wet-touch-target w-full px-3 py-2 rounded-xl bg-[#312E81] hover:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow"
          >
            <ExternalLink className="w-4 h-4 text-cyan-300" />
            <span>↗ Mở Cổng TTGT TP.HCM để đối chiếu trực tiếp</span>
          </a>
        </div>
      )}

      {/* Bảng Chú giải Bản đồ (Map Legend chuẩn Mục 6 docs/05-cartography.md) */}
      {showLegend && (
        <div
          role="region"
          aria-label="Chú giải ký hiệu bản đồ ngập CVD-Safe"
          className="absolute inset-x-2.5 bottom-28 z-25 libre-glass rounded-2xl border border-slate-900/15 dark:border-white/20 shadow-2xl p-3 text-xs space-y-2 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              🗺️ Chú giải Bản đồ (Chuẩn CVD-Safe)
            </span>
            <button
              type="button"
              onClick={onCloseLegend}
              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
            >
              Đóng ✕
            </button>
          </div>

          {/* 4 Cấp độ ngập */}
          <div className="space-y-1.5">
            <div className="font-bold text-slate-700 dark:text-slate-300">
              1. Cấp độ ngập &amp; Tác động theo bộ phận xe:
            </div>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#EF4444] text-white font-bold metric-mono w-20 text-center">
                  ⛔ &gt;35cm
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Cấp 3 (Ngập sâu):</strong> Quá ống pô / chạm đèn pha ô tô
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#F97316] text-white font-bold metric-mono w-20 text-center">
                  ⚠️ 20–35cm
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Cấp 2 (Nguy hiểm):</strong> Ngang ống pô / chạm gầm Sedan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#F59E0B] text-slate-950 font-bold metric-mono w-20 text-center">
                  🛞 10–20cm
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Cấp 1 (Ngập nhẹ):</strong> Xâm xấp bánh xe — Đi chậm
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#10B981] text-white font-bold metric-mono w-20 text-center">
                  ✓ &lt;10cm
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Cấp 0:</strong> Chưa ghi nhận ngập theo dữ liệu hiện tại
                </span>
              </div>
            </div>
          </div>

          {/* Phân biệt Nét liền vs Nét đứt & Lộ trình */}
          <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-2">
            <div className="font-bold text-slate-700 dark:text-slate-300">
              2. Hình thái nét vẽ &amp; Lộ trình tránh ngập:
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              • <strong>━━━ Nét liền đặc (✓):</strong> Đã xác minh thực tế (≥3 người báo / đa nguồn).
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              • <strong>┈┈┈ Nét đứt (🕒 1–3h):</strong> Dự báo nguy cơ ngập sớm từ Mưa + Triều Phú An.
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              • <strong className="text-[#0284C7]">━━━ Tuyến #0284C7 (Xe máy)</strong> /{' '}
              <strong className="text-[#2563EB]">#2563EB (Ô tô):</strong> Lộ trình thay thế ít rủi ro ngập.
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              • <strong className="text-[#EF4444]">╍╍╍ Nét đứt Đỏ-Xám:</strong> Đoạn đường ngắn nhất cắt qua vùng ngập cần tránh.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
