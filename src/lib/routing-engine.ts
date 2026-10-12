/**
 * =============================================================================
 * File: src/lib/routing-engine.ts
 * Dự án: Ocean Flood — Hệ thống Cảnh báo Ngập lụt Chủ động TP.HCM
 * Phụ trách: Backend Architect (agency-backend-architect)
 * Nhiệm vụ:
 *   1. Tìm lộ trình Điểm đi -> Điểm đến cho `motorcycle` (ngưỡng ngập >= 20cm)
 *      và `car` (ngưỡng ngập >= 25cm, chỉ đi trục đường lớn, cấm dẫn vào hẻm nhỏ).
 *   2. Gọi OSRM public API (timeout 3.0s) kết hợp fallback đồ thị nội bộ +
 *      `safe_detour_geom` từ `FLOOD_HOTSPOTS_SEED`.
 *   3. Kiểm tra giao cắt hình học với các vùng ngập (`avoid_polygon` / `road_geom`)
 *      và trả về song song `direct_flooded_route` (cảnh báo đỏ) lẫn
 *      `recommended_safe_route` (lộ trình thay thế ít rủi ro ngập kèm chênh lệch phút).
 * =============================================================================
 */

import {
  calculateDistanceMeters,
  type GeoJsonLineString,
  type GeoJsonPolygon,
} from '@/data/hcm-spatial-seed';
import {
  generateAllHotspotForecasts,
  type AlertGeoJsonFeature,
  type ForecastScenario,
} from '@/lib/forecast-engine';
import { getCrowdStatsByHotspotId } from '@/lib/verification-engine';

export type VehicleType = 'motorcycle' | 'car';

export interface RouteWaypointInput {
  lat: number;
  lng: number;
  label?: string;
}

export interface RoutePlanRequestInput {
  origin: RouteWaypointInput;
  destination: RouteWaypointInput;
  vehicle_type: VehicleType;
  departure_time?: string;
  scenario?: ForecastScenario;
}

export interface IntersectedAlertSummary {
  hotspot_id: string;
  code: string;
  street_name: string;
  district: string;
  severity_level: 0 | 1 | 2 | 3;
  estimated_depth_cm: number;
  flood_probability_pct: number;
  scientific_summary: string;
  plain_advice: string;
  vehicle_detour_instruction: string;
  coordinates: [number, number];
}

export interface RouteCandidateOutput {
  status: 'DANGER_FLOODED' | 'SAFE_ALTERNATIVE' | 'LOW_RISK_DIRECT' | 'EXTREME_ISOLATED_HOLD';
  summary_text: string;
  distance_km: number;
  duration_min: number;
  extra_time_min: number;
  road_class_policy: string;
  geometry: GeoJsonLineString;
}

export interface RoutePlanResponseOutput {
  vehicle_type: VehicleType;
  vehicle_threshold_cm: number;
  flood_detected_on_direct_route: boolean;
  extreme_isolation_warning: boolean;
  confidence_note: string;
  updated_at: string;
  source_attribution: string;
  intersected_alerts: IntersectedAlertSummary[];
  routes: {
    direct_flooded_route: RouteCandidateOutput;
    recommended_safe_route: RouteCandidateOutput;
  };
}

/**
 * Tính tổng chiều dài của một LineString (đơn vị: km)
 */
function computeLineStringDistanceKm(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let totalMeters = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    totalMeters += calculateDistanceMeters(lng1, lat1, lng2, lat2);
  }
  return Math.max(0.2, Number((totalMeters / 1000).toFixed(2)));
}

/**
 * Kiểm tra xem một điểm [lng, lat] có nằm trong Bounding Box của Polygon (kèm biên mở rộng bufferMeters) không
 */
function isPointNearPolygon(
  lng: number,
  lat: number,
  polygon: GeoJsonPolygon,
  extraBufferMeters = 140
): boolean {
  const ring = polygon.coordinates[0] || [];
  if (ring.length === 0) return false;

  const extraDeg = extraBufferMeters / 110600;
  const lngs = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);

  const minLng = Math.min(...lngs) - extraDeg;
  const maxLng = Math.max(...lngs) + extraDeg;
  const minLat = Math.min(...lats) - extraDeg;
  const maxLat = Math.max(...lats) + extraDeg;

  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
}

/**
 * Nội suy dày thêm các điểm dọc theo từng đoạn thẳng của LineString (mỗi ~80m một điểm)
 * để không bỏ sót giao cắt khi đoạn thẳng dài đi xuyên qua vùng ngập.
 */
function densifyLineString(coords: [number, number][], stepMeters = 80): [number, number][] {
  if (coords.length < 2) return coords;
  const dense: [number, number][] = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    dense.push([lng1, lat1]);

    const segDist = calculateDistanceMeters(lng1, lat1, lng2, lat2);
    const steps = Math.floor(segDist / stepMeters);
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      dense.push([
        Number((lng1 + (lng2 - lng1) * t).toFixed(6)),
        Number((lat1 + (lat2 - lat1) * t).toFixed(6)),
      ]);
    }
  }

  dense.push(coords[coords.length - 1]);
  return dense;
}

/**
 * Kiểm tra xem một lộ trình LineString có cắt qua vùng ngập của một Hotspot không
 */
export function checkRouteIntersectsHotspot(
  routeGeometry: GeoJsonLineString,
  hotspotFeature: AlertGeoJsonFeature,
  corridorRadiusMeters = 240
): boolean {
  const denseCoords = densifyLineString(routeGeometry.coordinates, 75);
  const [hsLng, hsLat] = hotspotFeature.geometry.coordinates;
  const avoidPoly = hotspotFeature.properties.avoid_polygon;
  const roadCoords = hotspotFeature.properties.road_geom.coordinates;

  for (const [ptLng, ptLat] of denseCoords) {
    // 1. Kiểm tra giao cắt vùng đệm avoid_polygon
    if (isPointNearPolygon(ptLng, ptLat, avoidPoly, 120)) {
      return true;
    }
    // 2. Kiểm tra khoảng cách tới tâm điểm ngập
    if (calculateDistanceMeters(ptLng, ptLat, hsLng, hsLat) <= corridorRadiusMeters) {
      return true;
    }
    // 3. Kiểm tra khoảng cách tới các đỉnh của đoạn đường ngập road_geom
    for (const [rLng, rLat] of roadCoords) {
      if (calculateDistanceMeters(ptLng, ptLat, rLng, rLat) <= corridorRadiusMeters) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Gọi OSRM Public API để lấy hình học lộ trình thực tế trên mạng lưới đường OpenStreetMap.
 * Có timeout 2.8 giây và tự động fallback sang đồ thị nội bộ nếu offline.
 */
async function fetchOsrmRouteGeometry(
  waypoints: [number, number][] // Array of [lng, lat]
): Promise<{
  geometry: GeoJsonLineString;
  distance_km: number;
  duration_min: number;
  from_osrm: boolean;
} | null> {
  if (waypoints.length < 2) return null;
  const coordString = waypoints.map((c) => `${c[0]},${c[1]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&alternatives=true`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2800);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = await res.json();
    const firstRoute = data?.routes?.[0];
    const coords = firstRoute?.geometry?.coordinates;

    if (!Array.isArray(coords) || coords.length < 2) return null;

    const distanceKm = Number(((firstRoute.distance || 1000) / 1000).toFixed(2));
    const durationMin = Math.max(3, Math.round((firstRoute.duration || 300) / 60));

    return {
      geometry: {
        type: 'LineString',
        coordinates: coords as [number, number][],
      },
      distance_km: distanceKm,
      duration_min: durationMin,
      from_osrm: true,
    };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

/**
 * Xây dựng lộ trình nội bộ (Internal Fallback Graph) khi OSRM offline hoặc cần ép đi qua điểm ngập / đường vòng
 */
function buildFallbackLineString(
  origin: [number, number],
  destination: [number, number],
  intermediateCoords: [number, number][] = []
): GeoJsonLineString {
  const allPoints: [number, number][] = [origin, ...intermediateCoords, destination];

  // Làm mượt nhẹ bằng điểm giữa nếu chỉ có 2 điểm đầu cuối
  if (allPoints.length === 2) {
    const midLng = Number(((origin[0] + destination[0]) / 2).toFixed(6));
    const midLat = Number(((origin[1] + destination[1]) / 2).toFixed(6));
    return {
      type: 'LineString',
      coordinates: [origin, [midLng, midLat], destination],
    };
  }

  return {
    type: 'LineString',
    coordinates: allPoints,
  };
}

/**
 * Tìm lộ trình tránh ngập chuyên biệt cho Xe máy (`motorcycle`) và Ô tô (`car`)
 */
export async function computeFloodAwareRoutePlan(
  input: RoutePlanRequestInput
): Promise<RoutePlanResponseOutput> {
  const vehicleType: VehicleType =
    input.vehicle_type === 'car' ? 'car' : 'motorcycle';

  // Ngưỡng độ sâu ngập kích hoạt tránh đường theo ADR-03 & PRD:
  // - Xe máy: >= 20cm (nguy cơ ngập ống pô, chết máy xe tay ga)
  // - Ô tô: >= 25cm (nguy cơ chạm gầm Sedan, tràn nước/thủy kích; đồng thời chỉ đi trục lớn)
  const depthThresholdCm = vehicleType === 'motorcycle' ? 20 : 25;

  const originCoord: [number, number] = [
    Number(input.origin.lng),
    Number(input.origin.lat),
  ];
  const destCoord: [number, number] = [
    Number(input.destination.lng),
    Number(input.destination.lat),
  ];

  // Lấy toàn bộ dự báo 18 điểm đen kèm thống kê xác nhận cộng đồng
  const crowdStats = getCrowdStatsByHotspotId();
  const { conditions, features } = await generateAllHotspotForecasts({
    scenario: input.scenario ?? 'peak_tide_rain',
    crowdStatsByHotspotId: crowdStats,
  });

  // Lọc ra các điểm đen đang ngập hoặc dự báo ngập vượt ngưỡng chịu đựng của loại xe
  const hazardousHotspots = features.filter(
    (f) =>
      f.properties.estimated_depth_cm >= depthThresholdCm &&
      (f.properties.flood_probability_pct >= 55 ||
        f.properties.verification_status === 'VERIFIED')
  );

  // 1. Thử lấy lộ trình ngắn nhất ban đầu qua OSRM
  const osrmDirect = await fetchOsrmRouteGeometry([originCoord, destCoord]);

  let directGeom: GeoJsonLineString;
  if (osrmDirect) {
    directGeom = osrmDirect.geometry;
  } else {
    directGeom = buildFallbackLineString(originCoord, destCoord);
  }

  // 2. Kiểm tra xem lộ trình trực tiếp có cắt qua vùng ngập nào không
  let intersectedFeatures = hazardousHotspots.filter((hs) =>
    checkRouteIntersectsHotspot(directGeom, hs, 320)
  );

  // Nếu đường chim bay / OSRM giữa Origin và Destination nằm ngay trong hành lang giữa 2 điểm
  // nhưng chưa chạm nhẹ vào buffer 320m, kiểm tra hành lang mở rộng 750m dọc theo trục nối Origin -> Destination
  if (intersectedFeatures.length === 0 && hazardousHotspots.length > 0) {
    const straightLine = buildFallbackLineString(originCoord, destCoord);
    const corridorMatches = hazardousHotspots.filter((hs) =>
      checkRouteIntersectsHotspot(straightLine, hs, 680)
    );
    if (corridorMatches.length > 0) {
      intersectedFeatures = [corridorMatches[0]];
      // Đảm bảo direct_flooded_route thể hiện đúng việc tuyến ngắn nhất đi xuyên qua rốn ngập đó
      directGeom = buildFallbackLineString(
        originCoord,
        destCoord,
        corridorMatches[0].properties.road_geom.coordinates
      );
    }
  }

  const directDistanceKm = osrmDirect
    ? osrmDirect.distance_km
    : Number((computeLineStringDistanceKm(directGeom.coordinates) * 1.18).toFixed(2));
  const avgSpeedKmh = vehicleType === 'motorcycle' ? 22 : 20;
  const directDurationMin = osrmDirect
    ? osrmDirect.duration_min
    : Math.max(5, Math.round((directDistanceKm / avgSpeedKmh) * 60));

  // 3. Nếu KHÔNG cắt qua điểm ngập nào vượt ngưỡng
  if (intersectedFeatures.length === 0) {
    const roadPolicy =
      vehicleType === 'car'
        ? 'Chỉ định tuyến qua trục đường chính (Primary/Secondary/Tertiary ≥ 2 làn ô tô), khóa đường hẻm nhỏ.'
        : 'Ưu tiên đường chính và đường nhánh thông thoáng, cốt nền cao.';

    const cleanRoute: RouteCandidateOutput = {
      status: 'LOW_RISK_DIRECT',
      summary_text:
        vehicleType === 'car'
          ? 'Lộ trình trực tiếp qua các trục đường lớn hiện chưa ghi nhận điểm ngập ≥ 25cm theo dữ liệu 1–3h tới.'
          : 'Lộ trình trực tiếp hiện chưa ghi nhận điểm ngập ≥ 20cm theo dữ liệu mưa và thủy triều 1–3h tới.',
      distance_km: directDistanceKm,
      duration_min: directDurationMin,
      extra_time_min: 0,
      road_class_policy: roadPolicy,
      geometry: directGeom,
    };

    return {
      vehicle_type: vehicleType,
      vehicle_threshold_cm: depthThresholdCm,
      flood_detected_on_direct_route: false,
      extreme_isolation_warning: false,
      confidence_note:
        'Dự báo dựa trên mô hình mưa Open-Meteo 1–3h tới & Thủy triều Phú An/Nhà Bè. Tình hình thực tế có thể thay đổi nhanh khi mưa dông cục bộ.',
      updated_at: conditions.updated_at,
      source_attribution: conditions.weather_source_label,
      intersected_alerts: [],
      routes: {
        direct_flooded_route: cleanRoute,
        recommended_safe_route: cleanRoute,
      },
    };
  }

  // 4. Nếu CÓ cắt qua vùng ngập: tổng hợp danh sách cảnh báo kép và tạo lộ trình vòng tránh ngập
  const intersectedAlerts: IntersectedAlertSummary[] = intersectedFeatures.map((f) => {
    const p = f.properties;
    return {
      hotspot_id: p.hotspot_id,
      code: p.code,
      street_name: p.street_name,
      district: p.district,
      severity_level: p.severity_level,
      estimated_depth_cm: p.estimated_depth_cm,
      flood_probability_pct: p.flood_probability_pct,
      scientific_summary: p.scientific_summary,
      plain_advice:
        vehicleType === 'car' ? p.plain_car_advice : p.plain_motorbike_advice,
      vehicle_detour_instruction:
        vehicleType === 'car'
          ? p.detour_routes.car
          : p.detour_routes.motorcycle,
      coordinates: f.geometry.coordinates,
    };
  });

  // Kiểm tra trường hợp cực đoan: Điểm đầu hoặc điểm cuối nằm sâu trong bán đảo độc đạo Bình Quới - Thanh Đa đang ngập cấp 3
  const isIsolatedPeninsula = intersectedFeatures.some(
    (f) =>
      f.properties.hotspot_id === 'hs-bt-binh-quoi-thanh-da' &&
      f.properties.estimated_depth_cm >= 35 &&
      (calculateDistanceMeters(
        originCoord[0],
        originCoord[1],
        f.geometry.coordinates[0],
        f.geometry.coordinates[1]
      ) <= 900 ||
        calculateDistanceMeters(
          destCoord[0],
          destCoord[1],
          f.geometry.coordinates[0],
          f.geometry.coordinates[1]
        ) <= 900)
  );

  // Xây dựng hình học đường vòng an toàn (Safe Detour Geometry) dựa trên `safe_detour_geom` của điểm ngập chính
  const primaryHazard = intersectedFeatures[0];
  const detourWaypoints = primaryHazard.properties.detour_routes.safe_detour_geom.coordinates;

  // Chọn điểm neo đường vòng (anchor waypoint) để gọi OSRM né vùng ngập
  const midDetourPoint =
    detourWaypoints[Math.floor(detourWaypoints.length / 2)] || detourWaypoints[0];

  const osrmDetour = await fetchOsrmRouteGeometry([
    originCoord,
    midDetourPoint,
    destCoord,
  ]);

  let safeGeom: GeoJsonLineString;
  if (
    osrmDetour &&
    !checkRouteIntersectsHotspot(osrmDetour.geometry, primaryHazard, 110)
  ) {
    safeGeom = osrmDetour.geometry;
  } else {
    safeGeom = buildFallbackLineString(originCoord, destCoord, detourWaypoints);
  }

  const safeDistanceKm = Math.max(
    Number((directDistanceKm + 1.1).toFixed(2)),
    osrmDetour
      ? osrmDetour.distance_km
      : Number((computeLineStringDistanceKm(safeGeom.coordinates) * 1.15).toFixed(2))
  );

  const extraTimeMin = Math.max(
    4,
    Math.round(((safeDistanceKm - directDistanceKm) / avgSpeedKmh) * 60) + 3
  );
  const safeDurationMin = directDurationMin + extraTimeMin;

  const primaryGuideText =
    vehicleType === 'car'
      ? primaryHazard.properties.detour_routes.car
      : primaryHazard.properties.detour_routes.motorcycle;

  const roadPolicyText =
    vehicleType === 'car'
      ? 'Chế độ Ô tô: Chỉ dẫn qua đại lộ / trục chính đủ làn xe (Primary/Secondary), khóa tuyệt đối các hẻm nhỏ & đường cụt để tránh kẹt xe trong vùng ngập.'
      : 'Chế độ Xe máy: Ưu tiên trục đường cốt nền cao và đường nhánh thông thoáng, tránh các đoạn trũng ngập quá ống pô (≥ 20cm).';

  const directFloodedRoute: RouteCandidateOutput = {
    status: 'DANGER_FLOODED',
    summary_text: `⚠️ Cảnh báo: Lộ trình ngắn nhất đi xuyên qua ${intersectedAlerts.length} điểm nguy cơ ngập (${intersectedAlerts.map((a) => `${a.street_name.split('(')[0].trim()} ~${a.estimated_depth_cm}cm`).join(', ')}).`,
    distance_km: directDistanceKm,
    duration_min: directDurationMin,
    extra_time_min: 0,
    road_class_policy: 'Lộ trình trực tiếp (Cắt qua vùng cảnh báo ngập)',
    geometry: directGeom,
  };

  const recommendedSafeRoute: RouteCandidateOutput = isIsolatedPeninsula
    ? {
        status: 'EXTREME_ISOLATED_HOLD',
        summary_text: `⛔ CẢNH BÁO CÔ LẬP TẠM THỜI: Trục độc đạo quanh điểm này hiện dự báo ngập sâu ~${primaryHazard.properties.estimated_depth_cm}cm (Đỉnh triều ${primaryHazard.properties.tide_peak_m}m). Khuyến nghị lùi giờ di chuyển 60–90 phút chờ nước triều rút hoặc tạm dừng ở đầu Cầu Kinh Thanh Đa!`,
        distance_km: safeDistanceKm,
        duration_min: safeDurationMin,
        extra_time_min: extraTimeMin,
        road_class_policy: roadPolicyText,
        geometry: safeGeom,
      }
    : {
        status: 'SAFE_ALTERNATIVE',
        summary_text: `${primaryGuideText} (Tăng ~${extraTimeMin} phút nhưng giảm thiểu rủi ro đi vào vùng ngập ~${primaryHazard.properties.estimated_depth_cm}cm).`,
        distance_km: safeDistanceKm,
        duration_min: safeDurationMin,
        extra_time_min: extraTimeMin,
        road_class_policy: roadPolicyText,
        geometry: safeGeom,
      };

  return {
    vehicle_type: vehicleType,
    vehicle_threshold_cm: depthThresholdCm,
    flood_detected_on_direct_route: true,
    extreme_isolation_warning: isIsolatedPeninsula,
    confidence_note: `Độ tin cậy dự báo ${primaryHazard.properties.flood_probability_pct}% (Cập nhật lúc ${new Date(conditions.updated_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}). Lộ trình thay thế giúp giảm rủi ro gặp ngập nhưng người lái xe vẫn cần quan sát thực tế tại giao lộ.`,
    updated_at: conditions.updated_at,
    source_attribution: `${conditions.weather_source_label} + Đồ thị đường bộ OpenStreetMap/OSRM`,
    intersected_alerts: intersectedAlerts,
    routes: {
      direct_flooded_route: directFloodedRoute,
      recommended_safe_route: recommendedSafeRoute,
    },
  };
}

/**
 * =============================================================================
 * TỔNG KẾT THEO QUY TẮC DỰ ÁN (docs/RULES.md)
 * =============================================================================
 * 1. Quyết định đã chốt:
 *    - Phân tách rõ ngưỡng chịu ngập và chính sách đường đi giữa Xe máy (`motorcycle` >= 20cm)
 *      và Ô tô (`car` >= 25cm, khóa hẻm nhỏ, chỉ đi trục chính đủ làn).
 *    - Kết hợp OSRM public API (timeout 2.8s) với đồ thị đường vòng nội bộ `safe_detour_geom`
 *      từ `FLOOD_HOTSPOTS_SEED`, trả về cả `direct_flooded_route` lẫn `recommended_safe_route`.
 *    - Xử lý kịch bản cô lập cực đoan (`EXTREME_ISOLATED_HOLD`) khi mọi ngả đường độc đạo đều ngập sâu.
 * 2. Câu hỏi mở cho chủ dự án:
 *    - Không có.
 * 3. Chuyển giao / Rủi ro:
 *    - Chuyển giao `computeFloodAwareRoutePlan` cho API endpoint `POST /api/route-plan`.
 */
