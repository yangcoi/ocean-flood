/**
 * =============================================================================
 * File: src/data/hcm-spatial-seed.ts
 * Dự án: Ocean Flood — Hệ thống Cảnh báo Ngập lụt Chủ động TP.HCM
 * Phụ trách: GIS Spatial Data Engineer (agency-spatial-data-engineer)
 * Hệ quy chiếu chuẩn: WGS84 (EPSG:4326) — GeoJSON [longitude, latitude]
 * Tuân thủ: docs/RULES.md, docs/01-data-sources.md, docs/01-spatial-requirements.md, docs/03-data-pipeline.md
 * =============================================================================
 */

export type HcmMvpDistrict = 'Bình Thạnh' | 'Quận 7' | 'Quận 8' | 'TP. Thủ Đức';

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat] chuẩn EPSG:4326
}

export interface GeoJsonLineString {
  type: 'LineString';
  coordinates: [number, number][]; // Array of [lng, lat] chuẩn EPSG:4326
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: [number, number][][]; // Closed ring [lng, lat][] chuẩn EPSG:4326 (Buffer ~35m)
}

export interface VehicleDetourGuide {
  /** Gợi ý lộ trình né ngập cho Xe máy (cho phép đường nhánh thông thoáng, cấm hẻm cụt/trũng) */
  motorcycle: string;
  /** Gợi ý lộ trình né ngập cho Ô tô (chỉ đi đường chính primary/secondary/tertiary đủ làn) */
  car: string;
  /** Tuyến đường vòng an toàn gợi ý dạng LineString (EPSG:4326) để vẽ trực tiếp trên MapLibre */
  safe_detour_geom: GeoJsonLineString;
}

export interface FloodHotspotSeed {
  id: string;
  code: string;
  street_name: string;
  district: HcmMvpDistrict;
  /** Tọa độ tâm điểm ngập (GeoJSON Point [lng, lat]) */
  point: GeoJsonPoint;
  /** Đoạn đường thực tế thường ngập (GeoJSON LineString [lng, lat][]) */
  road_geom: GeoJsonLineString;
  /** Vùng đệm 35m quanh đoạn ngập để cắt lộ trình / tránh ngập (GeoJSON Polygon) */
  avoid_polygon: GeoJsonPolygon;
  /** Cao độ mặt đường trung bình ước tính (m so với mực nước biển chuẩn) */
  elevation_m: number;
  /** Ngưỡng mưa bắt đầu gây ngập (mm/h) */
  rain_threshold_mm: number;
  /** Ngưỡng triều cường trạm Phú An / Nhà Bè bắt đầu gây ngập (m) */
  tide_threshold_m: number;
  /** Độ sâu ngập lịch sử lớn nhất từng ghi nhận (cm) */
  max_historical_depth_cm: number;
  /** Khung giờ và điều kiện thường xảy ra ngập (Timeline) */
  typical_timeline: string;
  /** Gợi ý đường vòng thực tế phân tách riêng cho Xe máy & Ô tô */
  detour_routes: VehicleDetourGuide;
  /** Ngôn ngữ cảnh báo kép mẫu (Khoa học + Đời thường cho Xe máy & Ô tô) */
  default_alerts: {
    scientific_summary: string;
    plain_motorbike_advice: string;
    plain_car_advice: string;
  };
  /** Mã Camera giao thông TTGT nằm trong bán kính <300m */
  nearby_camera_id: string;
  /** Nguồn dữ liệu đối chiếu công khai */
  source_attribution: string;
}

export interface TrafficCameraSeed {
  id: string;
  camera_name: string;
  district: HcmMvpDistrict;
  /** Tọa độ GeoJSON Point [lng, lat] chuẩn EPSG:4326 */
  location: GeoJsonPoint;
  /** Mã điểm đen ngập liên kết gần nhất */
  associated_hotspot_id: string;
  /** Khoảng cách thực tế tới tâm điểm ngập (mét, luôn < 300m) */
  distance_to_hotspot_m: number;
  /** Hướng dẫn người dùng đối chiếu vị trí trên ứng dụng/cổng TTGT TP.HCM (Không lấy stream lậu) */
  ttgt_reference_note: string;
}

/**
 * Helper tạo vùng đệm hình chữ nhật xấp xỉ 35m (avoid_polygon) quanh một đoạn LineString
 * Tại vĩ độ TP.HCM (~10.75°N): 1 độ vĩ tuyến ≈ 110,600m => 35m ≈ 0.00032 độ.
 */
function createBuffer35mPolygon(lineCoords: [number, number][]): GeoJsonPolygon {
  const delta = 0.00032; // ~35.4 meters tại TP.HCM
  const lngs = lineCoords.map((c) => c[0]);
  const lats = lineCoords.map((c) => c[1]);
  const minLng = Number((Math.min(...lngs) - delta).toFixed(6));
  const maxLng = Number((Math.max(...lngs) + delta).toFixed(6));
  const minLat = Number((Math.min(...lats) - delta).toFixed(6));
  const maxLat = Number((Math.max(...lats) + delta).toFixed(6));

  return {
    type: 'Polygon',
    coordinates: [
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ],
  };
}

/**
 * =============================================================================
 * 1. DANH MỤC 18 TUYẾN ĐƯỜNG ĐIỂM ĐEN NGẬP THỰC TẾ TẠI 4 QUẬN MVP (EPSG:4326)
 * - Quận Bình Thạnh: 6 tuyến
 * - Quận 7: 4 tuyến
 * - Quận 8: 4 tuyến
 * - TP. Thủ Đức: 4 tuyến
 * =============================================================================
 */
export const FLOOD_HOTSPOTS_SEED: FloodHotspotSeed[] = [
  // ===========================================================================
  // KHU VỰC 1: QUẬN BÌNH THẠNH (6 TUYẾN TRỌNG ĐIỂM)
  // ===========================================================================
  {
    id: 'hs-bt-nguyen-xi',
    code: 'HS_BT_01',
    street_name: 'Nguyễn Xí (Đoạn giao Ung Văn Khiêm – Đinh Bộ Lĩnh)',
    district: 'Bình Thạnh',
    point: {
      type: 'Point',
      coordinates: [106.7092, 10.8145],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7081, 10.8172],
        [106.7088, 10.8156],
        [106.7092, 10.8145],
        [106.7097, 10.8128],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7081, 10.8172],
      [106.7097, 10.8128],
    ]),
    elevation_m: 1.25,
    rain_threshold_mm: 30.0,
    tide_threshold_m: 1.55,
    max_historical_depth_cm: 45,
    typical_timeline:
      'Thường ngập sâu từ 16h30–19h30 khi mưa >30mm/h trùng đỉnh triều cường trạm Phú An (>1.55m); nước rút chậm sau 60–90 phút.',
    detour_routes: {
      motorcycle:
        'Rẽ sớm qua trục Phạm Văn Đồng -> Nơ Trang Long -> Phan Đăng Lưu (tránh hoàn toàn ngã tư Nguyễn Xí - Ung Văn Khiêm).',
      car:
        'Đi thẳng đại lộ Phạm Văn Đồng -> Lê Quang Định -> Bạch Đằng (đường rộng, cốt nền cao, không rẽ vào Nguyễn Xí).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7075, 10.8205],
          [106.6982, 10.8165],
          [106.6955, 10.8062],
          [106.7042, 10.8035],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Dự báo mưa 45mm/h + Đỉnh triều Phú An 1.65m — Xác suất ngập 85%, độ sâu ước tính ~35cm (Cập nhật từ mô hình Open-Meteo & Đài KTTV Nam Bộ).',
      plain_motorbike_advice:
        '⚠️ Khả năng cao ngập qua ống pô xe máy (~30–35cm) đoạn giao Ung Văn Khiêm. Xe tay ga rất dễ chết máy, nên vòng qua Phạm Văn Đồng – Nơ Trang Long!',
      plain_car_advice:
        '⚠️ Ngập chạm gầm xe Sedan (~35cm), mặt đường Nguyễn Xí nhiều ổ gà khuất tầm nhìn và sóng nước từ xe tải lớn dễ gây thủy kích!',
    },
    nearby_camera_id: 'CAM_BT_01',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Mô hình thủy văn Open-Meteo & Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-bt-ung-van-khiem',
    code: 'HS_BT_02',
    street_name: 'Ung Văn Khiêm (Đoạn từ Đài Liệt Sĩ đến Tân Cảng)',
    district: 'Bình Thạnh',
    point: {
      type: 'Point',
      coordinates: [106.7168, 10.8032],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7115, 10.8082],
        [106.7142, 10.8055],
        [106.7168, 10.8032],
        [106.7205, 10.8001],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7115, 10.8082],
      [106.7205, 10.8001],
    ]),
    elevation_m: 1.20,
    rain_threshold_mm: 28.0,
    tide_threshold_m: 1.50,
    max_historical_depth_cm: 40,
    typical_timeline:
      'Ngập thường xuyên vào hai kỳ triều cường Rằm và Mùng 1 âm lịch (16h00–19h00) hoặc khi mưa >28mm/h.',
    detour_routes: {
      motorcycle:
        'Đi theo Điện Biên Phủ -> Nguyễn Hữu Cảnh (cầu vượt) hoặc Xô Viết Nghệ Tĩnh -> Bạch Đằng, không rẽ vào Ung Văn Khiêm.',
      car:
        'Đi trục chính Điện Biên Phủ -> Cầu Sài Gòn (tránh toàn tuyến Ung Văn Khiêm giờ cao điểm triều cường).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7108, 10.8012],
          [106.7155, 10.7995],
          [106.7225, 10.7988],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Mưa dự báo 35mm/h + Triều cường sông Sài Gòn 1.62m — Xác suất ngập 82%, độ sâu ước tính ~30cm.',
      plain_motorbike_advice:
        '⚠️ Đường Ung Văn Khiêm đoạn gần Tân Cảng khả năng ngập ngang ống pô (~30cm) kèm kẹt xe kéo dài. Nên đi thẳng ra Điện Biên Phủ!',
      plain_car_advice:
        '⚠️ Nước sông dâng tràn kết hợp mưa gây ngập ~30cm. Ô tô gầm thấp nên đi trục Điện Biên Phủ để tránh kẹt cứng trong vùng ngập.',
    },
    nearby_camera_id: 'CAM_BT_02',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-bt-quoc-huong-giap-ranh',
    code: 'HS_BT_03',
    street_name: 'Khu vực chân Cầu Sài Gòn – Giáp ranh Quốc Hương / Thảo Điền',
    district: 'Bình Thạnh',
    point: {
      type: 'Point',
      coordinates: [106.7262, 10.7992],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7245, 10.7985],
        [106.7262, 10.7992],
        [106.7285, 10.8004],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7245, 10.7985],
      [106.7285, 10.8004],
    ]),
    elevation_m: 1.18,
    rain_threshold_mm: 25.0,
    tide_threshold_m: 1.50,
    max_historical_depth_cm: 50,
    typical_timeline:
      'Ngập rất nhanh khi triều cường vượt báo động 2 (>1.50m) hoặc mưa lớn dồn nước tại nút chuyển tiếp Cầu Sài Gòn – Quốc Hương (16h30–19h30).',
    detour_routes: {
      motorcycle:
        'Đi thẳng qua Cầu Sài Gòn lên trục Võ Nguyên Giáp (Xa lộ Hà Nội) -> rẽ vào Trần Não thay vì xuống đường gom Quốc Hương.',
      car:
        'Giữ làn chính Võ Nguyên Giáp -> rẽ phải vào đại lộ Mai Chí Thọ hoặc Trần Não (tuyệt đối không rẽ xuống gầm cầu Sài Gòn – Quốc Hương).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7235, 10.7985],
          [106.7315, 10.7955],
          [106.7335, 10.7915],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Triều cường Phú An 1.65m + Mưa 35mm/h — Vùng trũng giáp ranh Cầu Sài Gòn – Quốc Hương xác suất ngập 88%, sâu ~40cm.',
      plain_motorbike_advice:
        '⚠️ Đường gom chân cầu Sài Gòn hướng vào Quốc Hương dễ ngập sâu quá nửa bánh xe (~40cm). Xe máy nên đi tiếp tới đường Trần Não!',
      plain_car_advice:
        '⚠️ Cấm rẽ xuống đường gom Quốc Hương lúc triều dâng cao (~40cm). Hãy đi thẳng Võ Nguyên Giáp rồi rẽ vào Trần Não.',
    },
    nearby_camera_id: 'CAM_BT_03',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-bt-dinh-bo-linh',
    code: 'HS_BT_04',
    street_name: 'Đinh Bộ Lĩnh (Đoạn từ Bến xe Miền Đông cũ đến Chu Văn An)',
    district: 'Bình Thạnh',
    point: {
      type: 'Point',
      coordinates: [106.7098, 10.8085],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7105, 10.8122],
        [106.7098, 10.8085],
        [106.7091, 10.8048],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7105, 10.8122],
      [106.7091, 10.8048],
    ]),
    elevation_m: 1.30,
    rain_threshold_mm: 32.0,
    tide_threshold_m: 1.58,
    max_historical_depth_cm: 35,
    typical_timeline:
      'Thường ngập từ 16h30–18h45 khi mưa vũ lượng >32mm/h kết hợp nước rạch Xuyên Tâm dâng cao.',
    detour_routes: {
      motorcycle:
        'Từ Cầu Bình Triệu rẽ phải Phạm Văn Đồng -> Lê Quang Định -> Bạch Đằng để về trung tâm.',
      car:
        'Đi theo Phạm Văn Đồng -> Phan Văn Trị -> Phan Đăng Lưu (tránh trục một chiều Đinh Bộ Lĩnh đang ngập).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7125, 10.8215],
          [106.6978, 10.8142],
          [106.6962, 10.8038],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Mưa 38mm/h + Nước rạch Xuyên Tâm dâng theo triều 1.62m — Xác suất ngập 76%, độ sâu ước tính ~25–30cm.',
      plain_motorbike_advice:
        '⚠️ Đinh Bộ Lĩnh đoạn qua Chu Văn An khả năng ngập chạm ống pô (~25–30cm). Nên chuyển hướng qua Phạm Văn Đồng – Lê Quang Định.',
      plain_car_advice:
        '⚠️ Đoạn trũng Đinh Bộ Lĩnh ngập ~30cm kèm ùn tắc xe khách. Ô tô Sedan nên đi vòng qua Phạm Văn Đồng – Phan Đăng Lưu.',
    },
    nearby_camera_id: 'CAM_BT_04',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-bt-xo-viet-nghe-tinh',
    code: 'HS_BT_05',
    street_name: 'Xô Viết Nghệ Tĩnh (Đoạn Ngã tư Hàng Xanh – Cầu Kinh Thanh Đa)',
    district: 'Bình Thạnh',
    point: {
      type: 'Point',
      coordinates: [106.7128, 10.8072],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7114, 10.8035],
        [106.7128, 10.8072],
        [106.7152, 10.8118],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7114, 10.8035],
      [106.7152, 10.8118],
    ]),
    elevation_m: 1.28,
    rain_threshold_mm: 30.0,
    tide_threshold_m: 1.55,
    max_historical_depth_cm: 35,
    typical_timeline:
      'Thường ngập và ùn tắc nghiêm trọng từ 17h00–19h15 khi mưa lớn trùng triều cường dâng từ kênh Thanh Đa.',
    detour_routes: {
      motorcycle:
        'Tránh đoạn một chiều Xô Viết Nghệ Tĩnh bằng cách đi Điện Biên Phủ -> Bạch Đằng -> Đinh Bộ Lĩnh (nếu chỉ đi về Bến xe) hoặc Phạm Văn Đồng.',
      car:
        'Đi trục Điện Biên Phủ -> Võ Nguyên Giáp hoặc Bạch Đằng -> Phan Đăng Lưu -> Phạm Văn Đồng.',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7108, 10.8012],
          [106.7035, 10.8032],
          [106.6985, 10.8145],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Mưa 40mm/h + Đỉnh triều 1.63m — Xác suất ngập 78%, độ sâu ước tính ~25–30cm tại đoạn Hàng Xanh – Bến xe cũ.',
      plain_motorbike_advice:
        '⚠️ Xô Viết Nghệ Tĩnh đoạn hướng về cầu Kinh dễ ngập ~30cm và kẹt xe nhích từng mét. Không nên đi vào lúc này!',
      plain_car_advice:
        '⚠️ Ngập ~25–30cm kết hợp kẹt xe giờ tan tầm khiến xe phải ngâm nước lâu. Nên chọn trục Phạm Văn Đồng thay thế.',
    },
    nearby_camera_id: 'CAM_BT_05',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-bt-binh-quoi-thanh-da',
    code: 'HS_BT_06',
    street_name: 'Bình Quới – Thanh Đa (Đoạn qua Cư xá Thanh Đa – Bến đò Bình Quới)',
    district: 'Bình Thạnh',
    point: {
      type: 'Point',
      coordinates: [106.7265, 10.8185],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7195, 10.8142],
        [106.7265, 10.8185],
        [106.7335, 10.8225],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7195, 10.8142],
      [106.7335, 10.8225],
    ]),
    elevation_m: 1.05,
    rain_threshold_mm: 25.0,
    tide_threshold_m: 1.48,
    max_historical_depth_cm: 55,
    typical_timeline:
      'Vùng bán đảo trũng thấp sát sông Sài Gòn; ngập sâu mỗi khi triều cường đạt >1.48m (từ 05h30–07h30 sáng và 16h30–19h30 chiều) kể cả khi không mưa.',
    detour_routes: {
      motorcycle:
        'Vì bán đảo Thanh Đa chỉ có trục độc đạo qua Cầu Kinh, khuyến nghị lùi giờ di chuyển sau khi đỉnh triều rút 60 phút hoặc gửi xe ở đầu cư xá cao ráo.',
      car:
        'Ô tô Sedan không nên đi sâu vào cuối đường Bình Quới khi triều cường vượt 1.55m; tạm dừng tại khu vực đầu cầu Kinh Thanh Đa cốt nền cao hơn.',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7155, 10.8118],
          [106.7185, 10.8135],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Đỉnh triều sông Sài Gòn 1.65m (Vượt Báo động 3) — Xác suất ngập 92%, độ sâu ước tính ~40–50cm dọc tuyến Bình Quới.',
      plain_motorbike_advice:
        '🚨 Nước triều dâng cao ~40–50cm (ngập lút ống pô, gần tới yên xe). Hạn chế đi sâu vào Bình Quới đến sau 19h30 khi nước rút!',
      plain_car_advice:
        '🚨 Cảnh báo ngập sâu >40cm trên trục độc đạo Bình Quới. Xe con tuyệt đối không cố vượt qua đoạn trũng cuối bán đảo!',
    },
    nearby_camera_id: 'CAM_BT_06',
    source_attribution:
      'Bản tin triều cường Đài KTTV Nam Bộ + Khảo sát địa hình bán đảo Thanh Đa',
  },

  // ===========================================================================
  // KHU VỰC 2: QUẬN 7 (4 TUYẾN TRỌNG ĐIỂM)
  // ===========================================================================
  {
    id: 'hs-q7-huynh-tan-phat',
    code: 'HS_Q7_01',
    street_name: 'Huỳnh Tấn Phát (Đoạn từ Trần Xuân Soạn đến Cầu Phú Xuân)',
    district: 'Quận 7',
    point: {
      type: 'Point',
      coordinates: [106.7318, 10.7335],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7295, 10.7445],
        [106.7318, 10.7335],
        [106.7345, 10.7215],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7295, 10.7445],
      [106.7345, 10.7215],
    ]),
    elevation_m: 1.15,
    rain_threshold_mm: 28.0,
    tide_threshold_m: 1.50,
    max_historical_depth_cm: 50,
    typical_timeline:
      'Điểm ngập kinh điển Nam Sài Gòn: thường ngập 16h00–19h30 khi triều trạm Nhà Bè >1.50m hoặc mưa lớn >28mm/h.',
    detour_routes: {
      motorcycle:
        'Đi song song qua trục Nguyễn Văn Linh -> Nguyễn Lương Bằng (Phú Mỹ Hưng cốt nền cao) -> Phạm Hữu Lầu.',
      car:
        'Chuyển hoàn toàn sang đại lộ Nguyễn Văn Linh -> Nguyễn Lương Bằng hoặc Nguyễn Hữu Thọ (tránh xe container tạo sóng nước trên Huỳnh Tấn Phát).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7185, 10.7455],
          [106.7215, 10.7285],
          [106.7265, 10.7125],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Đỉnh triều trạm Nhà Bè 1.66m + Mưa 35mm/h — Xác suất ngập 90%, độ sâu ước tính ~35–45cm tại các đoạn trũng Huỳnh Tấn Phát.',
      plain_motorbike_advice:
        '🚨 Huỳnh Tấn Phát ngập sâu ~35–45cm kèm nhiều xe đầu kéo tạo sóng lớn dễ ngã xe. Hãy đi vòng qua Nguyễn Lương Bằng (Phú Mỹ Hưng)!',
      plain_car_advice:
        '🚨 Nguy cơ thủy kích rất cao do sóng nước từ xe container ngược chiều (~40cm). Ô tô nên đi trục Nguyễn Lương Bằng hoặc Nguyễn Hữu Thọ.',
    },
    nearby_camera_id: 'CAM_Q7_01',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Trạm thủy văn Nhà Bè (Đài KTTV Nam Bộ)',
  },
  {
    id: 'hs-q7-tran-xuan-soan',
    code: 'HS_Q7_02',
    street_name: 'Trần Xuân Soạn (Đoạn ven kênh Tẻ từ Cầu Tân Thuận 2 đến Cầu Rạch Ông)',
    district: 'Quận 7',
    point: {
      type: 'Point',
      coordinates: [106.7115, 10.7518],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7215, 10.7532],
        [106.7115, 10.7518],
        [106.7012, 10.7495],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7215, 10.7532],
      [106.7012, 10.7495],
    ]),
    elevation_m: 1.08,
    rain_threshold_mm: 25.0,
    tide_threshold_m: 1.45,
    max_historical_depth_cm: 55,
    typical_timeline:
      'Ngập sâu ngay cả khi trời nắng nếu triều cường kênh Tẻ vượt 1.45m (05h00–07h30 sáng và 16h00–19h30 chiều).',
    detour_routes: {
      motorcycle:
        'Đi theo đường Nguyễn Thị Thập (đoạn cao phía Him Lam) hoặc đại lộ Nguyễn Văn Linh -> Nguyễn Hữu Thọ để qua Cầu Kênh Tẻ.',
      car:
        'Đi đại lộ Nguyễn Văn Linh -> Nguyễn Hữu Thọ -> Cầu Kênh Tẻ hoặc Cầu Nguyễn Văn Cừ (không đi dọc bờ kênh Trần Xuân Soạn).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7215, 10.7395],
          [106.7025, 10.7398],
          [106.7015, 10.7525],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Triều cường kênh Tẻ đạt 1.65m (Vượt Báo động 3) — Xác suất ngập 95%, độ sâu ước tính ~40–50cm.',
      plain_motorbike_advice:
        '🚨 Nước kênh Tẻ tràn bờ gây ngập sâu ~45cm dọc Trần Xuân Soạn. Tuyệt đối tránh đi tuyến này, hãy vòng ra Nguyễn Văn Linh!',
      plain_car_advice:
        '🚨 Mép đường sát bờ kênh bị nước che khuất và ngập sâu >40cm. Ô tô bắt buộc đi hướng Nguyễn Văn Linh – Nguyễn Hữu Thọ.',
    },
    nearby_camera_id: 'CAM_Q7_02',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-q7-nguyen-thi-thap',
    code: 'HS_Q7_03',
    street_name: 'Nguyễn Thị Thập (Đoạn giao Huỳnh Tấn Phát – Chợ Tân Mỹ)',
    district: 'Quận 7',
    point: {
      type: 'Point',
      coordinates: [106.7248, 10.7385],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7195, 10.7388],
        [106.7248, 10.7385],
        [106.7298, 10.7382],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7195, 10.7388],
      [106.7298, 10.7382],
    ]),
    elevation_m: 1.28,
    rain_threshold_mm: 32.0,
    tide_threshold_m: 1.56,
    max_historical_depth_cm: 35,
    typical_timeline:
      'Thường ngập cục bộ 16h30–18h45 khi mưa to (>32mm/h) trùng giờ tan tầm và triều cường làm cống thoát chậm.',
    detour_routes: {
      motorcycle:
        'Đi song song qua đại lộ Nguyễn Văn Linh hoặc đường Lý Phục Man -> Lâm Văn Bền.',
      car:
        'Đi thẳng đại lộ Nguyễn Văn Linh (6 làn xe, cốt nền cao, không rẽ vào đoạn Nguyễn Thị Thập gần Huỳnh Tấn Phát).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7155, 10.7295],
          [106.7285, 10.7292],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Mưa 40mm/h + Triều cường 1.60m — Xác suất ngập 75%, độ sâu ước tính ~25–30cm đoạn gần Huỳnh Tấn Phát.',
      plain_motorbike_advice:
        '⚠️ Đoạn cuối Nguyễn Thị Thập giao Huỳnh Tấn Phát dễ ngập ngang ống pô (~25–30cm). Nên đi thẳng Nguyễn Văn Linh cho an toàn!',
      plain_car_advice:
        '⚠️ Đường hẹp, đông xe máy chết máy và ngập ~30cm. Ô tô nên di chuyển trên đại lộ Nguyễn Văn Linh.',
    },
    nearby_camera_id: 'CAM_Q7_03',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-q7-le-van-luong',
    code: 'HS_Q7_04',
    street_name: 'Lê Văn Lương (Đoạn phường Tân Phong – Giáp ranh Nhà Bè)',
    district: 'Quận 7',
    point: {
      type: 'Point',
      coordinates: [106.7018, 10.7265],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7022, 10.7345],
        [106.7018, 10.7265],
        [106.7012, 10.7185],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7022, 10.7345],
      [106.7012, 10.7185],
    ]),
    elevation_m: 1.12,
    rain_threshold_mm: 28.0,
    tide_threshold_m: 1.48,
    max_historical_depth_cm: 45,
    typical_timeline:
      'Thường ngập sâu từ 16h00–19h30 vào các đợt triều cường (>1.48m) kết hợp mưa chiều.',
    detour_routes: {
      motorcycle:
        'Đi song song theo trục Nguyễn Hữu Thọ (đường rộng, cao ráo hơn Lê Văn Lương).',
      car:
        'Bắt buộc đi trục chính Nguyễn Hữu Thọ thay cho đường Lê Văn Lương nhỏ hẹp và ngập sâu.',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7068, 10.7355],
          [106.7065, 10.7255],
          [106.7062, 10.7165],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Đỉnh triều Nhà Bè 1.64m + Mưa 32mm/h — Xác suất ngập 86%, độ sâu ước tính ~35–40cm trên tuyến Lê Văn Lương.',
      plain_motorbike_advice:
        '⚠️ Đường Lê Văn Lương ngập sâu ~35–40cm và mặt đường hẹp. Xe máy nên chuyển sang đi đường Nguyễn Hữu Thọ kế bên!',
      plain_car_advice:
        '⚠️ Ngập sâu ~40cm và không có chỗ quay đầu cho ô tô. Hãy đi hoàn toàn trên trục Nguyễn Hữu Thọ.',
    },
    nearby_camera_id: 'CAM_Q7_04',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },

  // ===========================================================================
  // KHU VỰC 3: QUẬN 8 (4 TUYẾN TRỌNG ĐIỂM)
  // ===========================================================================
  {
    id: 'hs-q8-me-coc',
    code: 'HS_Q8_01',
    street_name: 'Mễ Cốc (Đoạn dọc kênh Lò Gốm – Phường 15, Quận 8)',
    district: 'Quận 8',
    point: {
      type: 'Point',
      coordinates: [106.6325, 10.7218],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.6365, 10.7245],
        [106.6325, 10.7218],
        [106.6285, 10.7192],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.6365, 10.7245],
      [106.6285, 10.7192],
    ]),
    elevation_m: 1.05,
    rain_threshold_mm: 25.0,
    tide_threshold_m: 1.45,
    max_historical_depth_cm: 50,
    typical_timeline:
      'Rốn ngập triều cường Quận 8: thường ngập 05h30–07h30 và 16h00–19h30 khi mực nước kênh Tàu Hủ – Lò Gốm vượt 1.45m.',
    detour_routes: {
      motorcycle:
        'Đi qua Cầu Chà Và -> Võ Văn Kiệt -> rẽ cầu Lò Gốm hoặc đi trục Phạm Thế Hiển -> Tạ Quang Bửu.',
      car:
        'Đi đại lộ Võ Văn Kiệt -> An Dương Vương (tuyệt đối không đi vào đường ven kênh Mễ Cốc khi triều cường).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.6385, 10.7315],
          [106.6265, 10.7275],
          [106.6235, 10.7195],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Đỉnh triều kênh Tàu Hủ – Lò Gốm 1.65m — Xác suất ngập 92%, độ sâu ước tính ~40–45cm tại Mễ Cốc.',
      plain_motorbike_advice:
        '🚨 Đường Mễ Cốc ngập sâu ~40–45cm do nước kênh dâng cao. Xe máy rất dễ tắt máy, hãy đi vòng qua đại lộ Võ Văn Kiệt!',
      plain_car_advice:
        '🚨 Cấm ô tô gầm thấp đi vào Mễ Cốc lúc đỉnh triều (~45cm). Hãy lưu thông trên trục Võ Văn Kiệt – An Dương Vương.',
    },
    nearby_camera_id: 'CAM_Q8_01',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-q8-ben-phu-dinh',
    code: 'HS_Q8_02',
    street_name: 'Bến Phú Định (Đoạn giao Hồ Học Lãm – Phường 16, Quận 8)',
    district: 'Quận 8',
    point: {
      type: 'Point',
      coordinates: [106.6185, 10.7155],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.6225, 10.7175],
        [106.6185, 10.7155],
        [106.6145, 10.7135],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.6225, 10.7175],
      [106.6145, 10.7135],
    ]),
    elevation_m: 1.08,
    rain_threshold_mm: 25.0,
    tide_threshold_m: 1.48,
    max_historical_depth_cm: 50,
    typical_timeline:
      'Ngập sâu từ 16h00–19h30 khi triều cường sông Chợ Đệm – Bến Lức dâng cao kết hợp mưa chiều.',
    detour_routes: {
      motorcycle:
        'Đi theo đại lộ Võ Văn Kiệt -> rẽ An Dương Vương (đoạn đã nâng cấp cao ráo) thay vì đi sát Bến Phú Định.',
      car:
        'Lưu thông trên đại lộ Võ Văn Kiệt -> Quốc lộ 1A (tránh nút giao trũng Bến Phú Định – Hồ Học Lãm).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.6245, 10.7255],
          [106.6125, 10.7215],
          [106.6095, 10.7155],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Triều cường 1.64m + Mưa 35mm/h — Xác suất ngập 88%, độ sâu ước tính ~35–45cm tại Bến Phú Định.',
      plain_motorbike_advice:
        '🚨 Khu vực Bến Phú Định – Hồ Học Lãm ngập sâu ~40cm. Xe máy nên đi thẳng Võ Văn Kiệt rồi rẽ An Dương Vương!',
      plain_car_advice:
        '🚨 Ngập sâu ~40cm kèm mặt đường xấu. Ô tô nên đi trên trục chính Võ Văn Kiệt.',
    },
    nearby_camera_id: 'CAM_Q8_02',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-q8-quoc-lo-50',
    code: 'HS_Q8_03',
    street_name: 'Quốc lộ 50 (Đoạn từ Bến xe Quận 8 đến giáp ranh Bình Chánh)',
    district: 'Quận 8',
    point: {
      type: 'Point',
      coordinates: [106.6545, 10.7245],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.6562, 10.7312],
        [106.6545, 10.7245],
        [106.6528, 10.7175],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.6562, 10.7312],
      [106.6528, 10.7175],
    ]),
    elevation_m: 1.25,
    rain_threshold_mm: 32.0,
    tide_threshold_m: 1.55,
    max_historical_depth_cm: 35,
    typical_timeline:
      'Thường ngập từ 16h30–19h00 khi mưa lớn (>32mm/h) trùng giờ cao điểm chiều và triều cường làm thoát nước chậm.',
    detour_routes: {
      motorcycle:
        'Rẽ qua trục Tạ Quang Bửu -> Phạm Hùng -> Nguyễn Văn Linh để tránh đoạn trũng Quốc lộ 50 gần Bến xe Quận 8.',
      car:
        'Đi theo trục Phạm Hùng -> đại lộ Nguyễn Văn Linh -> rẽ lại Quốc lộ 50 phía nam (đoạn đã mở rộng cao ráo).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.6635, 10.7335],
          [106.6665, 10.7215],
          [106.6545, 10.7155],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Mưa 42mm/h + Triều cường 1.60m — Xác suất ngập 76%, độ sâu ước tính ~25–30cm trên Quốc lộ 50.',
      plain_motorbike_advice:
        '⚠️ Quốc lộ 50 đoạn qua Bến xe Quận 8 ngập ~25–30cm và đông xe tải lớn. Nên vòng qua đường Tạ Quang Bửu – Phạm Hùng!',
      plain_car_advice:
        '⚠️ Ngập ~30cm kèm ùn tắc tại nút giao Bến xe Quận 8. Ô tô nên đi hướng Phạm Hùng – Nguyễn Văn Linh.',
    },
    nearby_camera_id: 'CAM_Q8_03',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-q8-vo-van-kiet-lo-gom',
    code: 'HS_Q8_04',
    street_name: 'Võ Văn Kiệt (Đoạn đường gom dưới chân Cầu Lò Gốm – Hồ Học Lãm)',
    district: 'Quận 8',
    point: {
      type: 'Point',
      coordinates: [106.6215, 10.7258],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.6265, 10.7285],
        [106.6215, 10.7258],
        [106.6165, 10.7232],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.6265, 10.7285],
      [106.6165, 10.7232],
    ]),
    elevation_m: 1.22,
    rain_threshold_mm: 30.0,
    tide_threshold_m: 1.55,
    max_historical_depth_cm: 40,
    typical_timeline:
      'Ngập cục bộ tại làn hỗn hợp/đường gom chân Cầu Lò Gốm – giao Hồ Học Lãm từ 16h30–19h00 khi mưa to trùng đỉnh triều.',
    detour_routes: {
      motorcycle:
        'Đi thẳng lên nhịp chính Cầu Lò Gốm (tránh chui xuống đường gom gầm cầu) hoặc rẽ sớm qua Hậu Giang -> Kinh Dương Vương.',
      car:
        'Giữ làn ô tô chính trên mặt Cầu Lò Gốm, không chuyển vào làn hỗn hợp/đường gom tại nút giao Hồ Học Lãm.',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.6285, 10.7355],
          [106.6185, 10.7325],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Mưa 40mm/h + Đỉnh triều 1.62m — Xác suất ngập 80%, độ sâu ước tính ~30–35cm tại đường gom Cầu Lò Gốm.',
      plain_motorbike_advice:
        '⚠️ Đường gom dưới chân Cầu Lò Gốm ngập ngang ống pô (~30–35cm). Xe máy hãy đi thẳng qua mặt cầu chính hoặc vòng qua Kinh Dương Vương!',
      plain_car_advice:
        '⚠️ Làn hỗn hợp và nút giao Hồ Học Lãm ngập ~35cm. Ô tô giữ làn giữa trên cầu chính Võ Văn Kiệt.',
    },
    nearby_camera_id: 'CAM_Q8_04',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },

  // ===========================================================================
  // KHU VỰC 4: TP. THỦ ĐỨC (4 TUYẾN TRỌNG ĐIỂM)
  // ===========================================================================
  {
    id: 'hs-td-quoc-huong',
    code: 'HS_TD_01',
    street_name: 'Quốc Hương (Đoạn từ Xuân Thủy đến Nguyễn Văn Hưởng – Phường Thảo Điền)',
    district: 'TP. Thủ Đức',
    point: {
      type: 'Point',
      coordinates: [106.7335, 10.8058],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7305, 10.8022],
        [106.7335, 10.8058],
        [106.7362, 10.8095],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7305, 10.8022],
      [106.7362, 10.8095],
    ]),
    elevation_m: 1.15,
    rain_threshold_mm: 25.0,
    tide_threshold_m: 1.50,
    max_historical_depth_cm: 55,
    typical_timeline:
      'Túi ngập nổi tiếng tại Thảo Điền: ngập sâu từ 16h30–19h30 khi mưa >25mm/h kết hợp triều cường sông Sài Gòn (>1.50m) làm nước không thoát kịp.',
    detour_routes: {
      motorcycle:
        'Ra/vào Thảo Điền theo trục Trần Não -> Lương Định Của hoặc đi đường Nguyễn Văn Hưởng (đoạn bờ sông cao hơn) -> Cầu Ông Hóa.',
      car:
        'Không đi vào Quốc Hương khi mưa lớn; di chuyển qua trục Võ Nguyên Giáp -> Trần Não -> Mai Chí Thọ.',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7315, 10.7955],
          [106.7385, 10.7995],
          [106.7425, 10.8045],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Mưa dự báo 45mm/h + Đỉnh triều sông Sài Gòn 1.65m — Xác suất ngập 90%, độ sâu ước tính ~40–50cm tại rốn trũng Quốc Hương.',
      plain_motorbike_advice:
        '🚨 Đường Quốc Hương (Thảo Điền) khả năng ngập sâu ~40–50cm (ngập quá ống pô, dễ chết máy hàng loạt). Hãy đi hướng Trần Não!',
      plain_car_advice:
        '🚨 Nguy cơ thủy kích rất cao trên đường Quốc Hương (~45cm). Ô tô Sedan/CUV tuyệt đối không đi vào, hãy chuyển sang trục Trần Não.',
    },
    nearby_camera_id: 'CAM_TD_01',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-td-thao-dien',
    code: 'HS_TD_02',
    street_name: 'Đường Thảo Điền – Xuân Thủy (Đoạn giao Quốc Hương – Nguyễn Văn Hưởng)',
    district: 'TP. Thủ Đức',
    point: {
      type: 'Point',
      coordinates: [106.7382, 10.8042],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7348, 10.8035],
        [106.7382, 10.8042],
        [106.7418, 10.8052],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7348, 10.8035],
      [106.7418, 10.8052],
    ]),
    elevation_m: 1.20,
    rain_threshold_mm: 28.0,
    tide_threshold_m: 1.52,
    max_historical_depth_cm: 45,
    typical_timeline:
      'Thường ngập đồng thời với đường Quốc Hương từ 16h30–19h15 khi mưa lớn trùng đỉnh triều cường sông Sài Gòn.',
    detour_routes: {
      motorcycle:
        'Đi ra đường Song Hành Võ Nguyên Giáp ở nút giao An Phú hoặc đi hướng Trần Não.',
      car:
        'Đi theo trục Song Hành Võ Nguyên Giáp -> nút giao An Phú -> Mai Chí Thọ.',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7365, 10.8005],
          [106.7445, 10.8015],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Mưa 40mm/h + Triều cường 1.63m — Xác suất ngập 84%, độ sâu ước tính ~30–40cm tại cụm đường Thảo Điền.',
      plain_motorbike_advice:
        '⚠️ Khu vực đường Thảo Điền ngập ~30–35cm. Xe máy nên đi sớm ra trục Song Hành Võ Nguyên Giáp!',
      plain_car_advice:
        '⚠️ Đường nội khu Thảo Điền ngập ~35cm và dễ ùn ứ. Ô tô nên ra thẳng trục Võ Nguyên Giáp.',
    },
    nearby_camera_id: 'CAM_TD_02',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Đài KTTV Nam Bộ',
  },
  {
    id: 'hs-td-to-ngoc-van',
    code: 'HS_TD_03',
    street_name: 'Tô Ngọc Vân (Đoạn qua Đường sắt Bắc Nam – Chợ Tam Hà, Phường Linh Đông)',
    district: 'TP. Thủ Đức',
    point: {
      type: 'Point',
      coordinates: [106.7515, 10.8585],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7535, 10.8535],
        [106.7515, 10.8585],
        [106.7495, 10.8635],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7535, 10.8535],
      [106.7495, 10.8635],
    ]),
    elevation_m: 3.20,
    rain_threshold_mm: 30.0,
    tide_threshold_m: 1.60,
    max_historical_depth_cm: 50,
    typical_timeline:
      'Ngập do mưa lớn dồn từ địa hình dốc xuống lòng chảo Tô Ngọc Vân (ngay sau khi mưa >30mm/h kéo dài 20–30 phút), nước chảy xiết.',
    detour_routes: {
      motorcycle:
        'Đi vòng qua đại lộ Phạm Văn Đồng -> Kha Vạn Cân -> Linh Đông hoặc Quốc lộ 1A (tránh lòng chảo Tô Ngọc Vân nước chảy xiết).',
      car:
        'Đi trục chính Phạm Văn Đồng -> Quốc lộ 1K hoặc Quốc lộ 1A (tuyệt đối không đi vào đường Tô Ngọc Vân hẹp khi đang mưa lớn).',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7425, 10.8485],
          [106.7415, 10.8585],
          [106.7455, 10.8665],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Mưa cường độ lớn 48mm/h — Nước dồn lòng chảo Tô Ngọc Vân gây ngập xác suất 88%, sâu ~35–45cm kèm dòng chảy mạnh.',
      plain_motorbike_advice:
        '🚨 Tô Ngọc Vân đoạn đường sắt – chợ Tam Hà ngập sâu ~40cm và nước chảy rất xiết dễ cuốn ngã xe. Hãy vòng ra Phạm Văn Đồng!',
      plain_car_advice:
        '🚨 Đường Tô Ngọc Vân nhỏ hẹp, ngập ~40cm và dòng nước chảy mạnh. Ô tô bắt buộc đi vòng qua đại lộ Phạm Văn Đồng.',
    },
    nearby_camera_id: 'CAM_TD_03',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Mô hình mưa Open-Meteo',
  },
  {
    id: 'hs-td-vo-van-ngan',
    code: 'HS_TD_04',
    street_name: 'Võ Văn Ngân – Chợ Thủ Đức (Đoạn dốc Võ Văn Ngân giao Kha Vạn Cân)',
    district: 'TP. Thủ Đức',
    point: {
      type: 'Point',
      coordinates: [106.7568, 10.8505],
    },
    road_geom: {
      type: 'LineString',
      coordinates: [
        [106.7625, 10.8502],
        [106.7568, 10.8505],
        [106.7525, 10.8508],
      ],
    },
    avoid_polygon: createBuffer35mPolygon([
      [106.7625, 10.8502],
      [106.7525, 10.8508],
    ]),
    elevation_m: 2.80,
    rain_threshold_mm: 35.0,
    tide_threshold_m: 1.58,
    max_historical_depth_cm: 45,
    typical_timeline:
      'Ngập rất nhanh tại bùng binh Chợ Thủ Đức và đoạn cuối dốc Võ Văn Ngân khi mưa to (>35mm/h); nước đổ dốc tạo dòng chảy xiết nguy hiểm cho xe máy.',
    detour_routes: {
      motorcycle:
        'Từ Ngã tư Thủ Đức đi thẳng Lê Văn Việt hoặc rẽ Đặng Văn Bi -> Phạm Văn Đồng (tránh đổ dốc Võ Văn Ngân xuống Chợ Thủ Đức lúc mưa to).',
      car:
        'Đi theo trục Võ Nguyên Giáp (Xa lộ Hà Nội) -> Đặng Văn Bi -> Phạm Văn Đồng, không đi qua bùng binh Chợ Thủ Đức.',
      safe_detour_geom: {
        type: 'LineString',
        coordinates: [
          [106.7685, 10.8485],
          [106.7615, 10.8415],
          [106.7515, 10.8425],
        ],
      },
    },
    default_alerts: {
      scientific_summary:
        'Mưa lớn 50mm/h tại lưu vực Thủ Đức — Dòng chảy mặt đổ dốc Võ Văn Ngân gây ngập Chợ Thủ Đức xác suất 86%, sâu ~35–40cm.',
      plain_motorbike_advice:
        '🚨 Dốc Võ Văn Ngân và vòng xoay Chợ Thủ Đức nước chảy rất xiết và ngập ~35–40cm! Tuyệt đối không chạy xe máy qua dốc lúc mưa to, hãy rẽ qua Đặng Văn Bi – Phạm Văn Đồng!',
      plain_car_advice:
        '🚨 Vòng xoay Chợ Thủ Đức ngập sâu ~40cm kèm nước đổ dốc mạnh. Ô tô nên đi hướng Đặng Văn Bi – Phạm Văn Đồng.',
    },
    nearby_camera_id: 'CAM_TD_04',
    source_attribution:
      'Danh mục điểm ngập Sở Xây dựng TP.HCM + Mô hình mưa Open-Meteo',
  },
];

/**
 * =============================================================================
 * 2. DANH MỤC TỌA ĐỘ CAMERA GIAO THÔNG TTGT TP.HCM (`traffic_cameras`)
 * - Nằm trong bán kính <300m quanh các nút giao điểm đen ngập ở 4 quận MVP.
 * - Tuân thủ nghiêm ngặt docs/RULES.md & docs/01-data-sources.md:
 *   CHỈ cung cấp tọa độ tĩnh (GeoJSON Point EPSG:4326), mã camera và hướng dẫn
 *   đối chiếu trên cổng/ứng dụng chính thức TTGT TP.HCM. KHÔNG lấy stream lậu.
 * =============================================================================
 */
export const TRAFFIC_CAMERAS_SEED: TrafficCameraSeed[] = [
  // Quận Bình Thạnh
  {
    id: 'CAM_BT_01',
    camera_name: 'Camera TTGT: Nút giao Nguyễn Xí – Ung Văn Khiêm',
    district: 'Bình Thạnh',
    location: {
      type: 'Point',
      coordinates: [106.7095, 10.8142],
    },
    associated_hotspot_id: 'hs-bt-nguyen-xi',
    distance_to_hotspot_m: 47,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" hoặc cổng giao thông chính thức -> Tìm từ khóa "Nguyễn Xí - Ung Văn Khiêm" (Quận Bình Thạnh) để xem hình ảnh giao thông thực tế.',
  },
  {
    id: 'CAM_BT_02',
    camera_name: 'Camera TTGT: Ung Văn Khiêm – Nguyễn Gia Trí (D2)',
    district: 'Bình Thạnh',
    location: {
      type: 'Point',
      coordinates: [106.7162, 10.8036],
    },
    associated_hotspot_id: 'hs-bt-ung-van-khiem',
    distance_to_hotspot_m: 79,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Chọn khu vực Bình Thạnh -> Camera nút giao "Ung Văn Khiêm - Nguyễn Gia Trí" để quan sát mực nước và mật độ xe.',
  },
  {
    id: 'CAM_BT_03',
    camera_name: 'Camera TTGT: Chân Cầu Sài Gòn – Đường gom Quốc Hương',
    district: 'Bình Thạnh',
    location: {
      type: 'Point',
      coordinates: [106.7255, 10.7988],
    },
    associated_hotspot_id: 'hs-bt-quoc-huong-giap-ranh',
    distance_to_hotspot_m: 88,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Cầu Sài Gòn" để đối chiếu tình trạng phương tiện tại nhánh rẽ đường gom.',
  },
  {
    id: 'CAM_BT_04',
    camera_name: 'Camera TTGT: Đinh Bộ Lĩnh – Bạch Đằng / Chu Văn An',
    district: 'Bình Thạnh',
    location: {
      type: 'Point',
      coordinates: [106.7094, 10.8078],
    },
    associated_hotspot_id: 'hs-bt-dinh-bo-linh',
    distance_to_hotspot_m: 89,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Đinh Bộ Lĩnh - Chu Văn An" hoặc "Đinh Bộ Lĩnh - Bạch Đằng" (Bình Thạnh).',
  },
  {
    id: 'CAM_BT_05',
    camera_name: 'Camera TTGT: Vòng xoay Hàng Xanh – Xô Viết Nghệ Tĩnh',
    district: 'Bình Thạnh',
    location: {
      type: 'Point',
      coordinates: [106.7121, 10.8065],
    },
    associated_hotspot_id: 'hs-bt-xo-viet-nghe-tinh',
    distance_to_hotspot_m: 109,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Nút giao Hàng Xanh" hoặc "Xô Viết Nghệ Tĩnh" để kiểm tra ùn tắc và ngập.',
  },
  {
    id: 'CAM_BT_06',
    camera_name: 'Camera TTGT: Đầu Cầu Kinh Thanh Đa – Bình Quới',
    district: 'Bình Thạnh',
    location: {
      type: 'Point',
      coordinates: [106.7248, 10.8175],
    },
    associated_hotspot_id: 'hs-bt-binh-quoi-thanh-da',
    distance_to_hotspot_m: 216,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Cầu Kinh Thanh Đa" hoặc "Bình Quới" để quan sát cửa ngõ vào bán đảo Thanh Đa.',
  },

  // Quận 7
  {
    id: 'CAM_Q7_01',
    camera_name: 'Camera TTGT: Huỳnh Tấn Phát – Nguyễn Thị Thập / Cầu Phú Mỹ',
    district: 'Quận 7',
    location: {
      type: 'Point',
      coordinates: [106.7312, 10.7342],
    },
    associated_hotspot_id: 'hs-q7-huynh-tan-phat',
    distance_to_hotspot_m: 102,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Chọn khu vực Quận 7 -> Tìm "Huỳnh Tấn Phát" để kiểm tra ngập triều cường.',
  },
  {
    id: 'CAM_Q7_02',
    camera_name: 'Camera TTGT: Trần Xuân Soạn – Dưới dạ Cầu Kênh Tẻ',
    district: 'Quận 7',
    location: {
      type: 'Point',
      coordinates: [106.7105, 10.7515],
    },
    associated_hotspot_id: 'hs-q7-tran-xuan-soan',
    distance_to_hotspot_m: 114,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Cầu Kênh Tẻ" hoặc "Trần Xuân Soạn" (Quận 7) để đối chiếu mực nước kênh Tẻ.',
  },
  {
    id: 'CAM_Q7_03',
    camera_name: 'Camera TTGT: Nút giao Nguyễn Thị Thập – Nguyễn Văn Linh',
    district: 'Quận 7',
    location: {
      type: 'Point',
      coordinates: [106.7235, 10.7378],
    },
    associated_hotspot_id: 'hs-q7-nguyen-thi-thap',
    distance_to_hotspot_m: 162,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Nguyễn Thị Thập" (Quận 7) để xem tình hình lưu thông thực tế.',
  },
  {
    id: 'CAM_Q7_04',
    camera_name: 'Camera TTGT: Nút giao Lê Văn Lương – Nguyễn Văn Linh',
    district: 'Quận 7',
    location: {
      type: 'Point',
      coordinates: [106.7021, 10.7278],
    },
    associated_hotspot_id: 'hs-q7-le-van-luong',
    distance_to_hotspot_m: 148,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Lê Văn Lương - Nguyễn Văn Linh" (Quận 7).',
  },

  // Quận 8
  {
    id: 'CAM_Q8_01',
    camera_name: 'Camera TTGT: Khu vực Cầu Lò Gốm – Đường dẫn Mễ Cốc',
    district: 'Quận 8',
    location: {
      type: 'Point',
      coordinates: [106.6338, 10.7228],
    },
    associated_hotspot_id: 'hs-q8-me-coc',
    distance_to_hotspot_m: 180,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Chọn khu vực Quận 8 -> Tìm "Cầu Lò Gốm" để quan sát khu vực lân cận Mễ Cốc.',
  },
  {
    id: 'CAM_Q8_02',
    camera_name: 'Camera TTGT: Nút giao Hồ Học Lãm – Bến Phú Định',
    district: 'Quận 8',
    location: {
      type: 'Point',
      coordinates: [106.6192, 10.7165],
    },
    associated_hotspot_id: 'hs-q8-ben-phu-dinh',
    distance_to_hotspot_m: 135,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Hồ Học Lãm" (Quận 8) để đối chiếu tình hình ngập nước.',
  },
  {
    id: 'CAM_Q8_03',
    camera_name: 'Camera TTGT: Quốc lộ 50 – Nút giao Bến xe Quận 8 / Nguyễn Văn Linh',
    district: 'Quận 8',
    location: {
      type: 'Point',
      coordinates: [106.6552, 10.7255],
    },
    associated_hotspot_id: 'hs-q8-quoc-lo-50',
    distance_to_hotspot_m: 135,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Quốc lộ 50" (Quận 8) để kiểm tra lưu lượng xe và ngập cục bộ.',
  },
  {
    id: 'CAM_Q8_04',
    camera_name: 'Camera TTGT: Đại lộ Võ Văn Kiệt – Chân Cầu Lò Gốm',
    district: 'Quận 8',
    location: {
      type: 'Point',
      coordinates: [106.6222, 10.7262],
    },
    associated_hotspot_id: 'hs-q8-vo-van-kiet-lo-gom',
    distance_to_hotspot_m: 88,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Võ Văn Kiệt - Cầu Lò Gốm" hoặc "Võ Văn Kiệt - Hồ Học Lãm".',
  },

  // TP. Thủ Đức
  {
    id: 'CAM_TD_01',
    camera_name: 'Camera TTGT: Đường Song Hành Võ Nguyên Giáp – Lối vào Quốc Hương',
    district: 'TP. Thủ Đức',
    location: {
      type: 'Point',
      coordinates: [106.7325, 10.8045],
    },
    associated_hotspot_id: 'hs-td-quoc-huong',
    distance_to_hotspot_m: 180,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Chọn khu vực TP. Thủ Đức -> Tìm "Quốc Hương" hoặc "Cầu Sài Gòn - Thảo Điền".',
  },
  {
    id: 'CAM_TD_02',
    camera_name: 'Camera TTGT: Nút giao Thảo Điền – Xa lộ Hà Nội (Võ Nguyên Giáp)',
    district: 'TP. Thủ Đức',
    location: {
      type: 'Point',
      coordinates: [106.7392, 10.8032],
    },
    associated_hotspot_id: 'hs-td-thao-dien',
    distance_to_hotspot_m: 156,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Xa lộ Hà Nội - Thảo Điền" (TP. Thủ Đức).',
  },
  {
    id: 'CAM_TD_03',
    camera_name: 'Camera TTGT: Nút giao Tô Ngọc Vân – Phạm Văn Đồng',
    district: 'TP. Thủ Đức',
    location: {
      type: 'Point',
      coordinates: [106.7525, 10.8572],
    },
    associated_hotspot_id: 'hs-td-to-ngoc-van',
    distance_to_hotspot_m: 181,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Tô Ngọc Vân - Phạm Văn Đồng" hoặc "Tô Ngọc Vân" (TP. Thủ Đức).',
  },
  {
    id: 'CAM_TD_04',
    camera_name: 'Camera TTGT: Vòng xoay Chợ Thủ Đức – Võ Văn Ngân / Kha Vạn Cân',
    district: 'TP. Thủ Đức',
    location: {
      type: 'Point',
      coordinates: [106.7562, 10.8508],
    },
    associated_hotspot_id: 'hs-td-vo-van-ngan',
    distance_to_hotspot_m: 74,
    ttgt_reference_note:
      'Mở ứng dụng "TTGT TP.HCM" -> Tìm "Võ Văn Ngân - Kha Vạn Cân" (Chợ Thủ Đức) để quan sát dòng nước chảy qua vòng xoay.',
  },
];

/**
 * =============================================================================
 * 3. CÁC HÀM TIỆN ÍCH KHÔNG GIAN (SPATIAL HELPERS CHO EDGE / BACKEND / FRONTEND)
 * =============================================================================
 */

/**
 * Tính khoảng cách mặt cầu Haversine (đơn vị: mét) giữa 2 tọa độ EPSG:4326
 * Dùng để kiểm tra nhanh Geofence <= 500m và gom nhóm Cross-check <= 150m
 */
export function calculateDistanceMeters(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number
): number {
  const R = 6371000; // Bán kính Trái Đất (m)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Kiểm tra Geofence 500m cho báo cáo cộng đồng
 */
export function validateGeofence500m(
  userLng: number,
  userLat: number,
  targetLng: number,
  targetLat: number
): { is_within_500m: boolean; distance_m: number } {
  const distance_m = calculateDistanceMeters(userLng, userLat, targetLng, targetLat);
  return {
    is_within_500m: distance_m <= 500.0,
    distance_m,
  };
}

/**
 * Tìm Camera TTGT gần nhất trong bán kính <= 300m từ một tọa độ (lng, lat)
 */
export function findNearbyCameraWithin300m(
  lng: number,
  lat: number
): (TrafficCameraSeed & { calculated_distance_m: number }) | null {
  let nearest: (TrafficCameraSeed & { calculated_distance_m: number }) | null = null;

  for (const cam of TRAFFIC_CAMERAS_SEED) {
    const [camLng, camLat] = cam.location.coordinates;
    const dist = calculateDistanceMeters(lng, lat, camLng, camLat);
    if (dist <= 300.0) {
      if (!nearest || dist < nearest.calculated_distance_m) {
        nearest = { ...cam, calculated_distance_m: dist };
      }
    }
  }

  return nearest;
}

/**
 * Tìm điểm đen ngập lịch sử gần nhất trong bán kính (mặc định 300m)
 */
export function findNearestHotspot(
  lng: number,
  lat: number,
  maxRadiusMeters = 300
): (FloodHotspotSeed & { distance_m: number }) | null {
  let best: (FloodHotspotSeed & { distance_m: number }) | null = null;
  for (const hs of FLOOD_HOTSPOTS_SEED) {
    const [hsLng, hsLat] = hs.point.coordinates;
    const dist = calculateDistanceMeters(lng, lat, hsLng, hsLat);
    if (dist <= maxRadiusMeters && (!best || dist < best.distance_m)) {
      best = { ...hs, distance_m: dist };
    }
  }
  return best;
}

/**
 * Tâm bản đồ và Bounding Box cho 4 Quận MVP tại TP.HCM (EPSG:4326)
 */
export const HCM_MVP_DISTRICTS_META: Record<
  HcmMvpDistrict | 'ALL',
  {
    label: string;
    center: [number, number]; // [lng, lat]
    zoom: number;
    bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  }
> = {
  ALL: {
    label: 'Toàn bộ 4 Quận MVP (TP.HCM)',
    center: [106.7092, 10.7855],
    zoom: 11.8,
    bbox: [106.605, 10.705, 106.785, 10.875],
  },
  'Bình Thạnh': {
    label: 'Quận Bình Thạnh',
    center: [106.7128, 10.8095],
    zoom: 13.6,
    bbox: [106.688, 10.788, 106.742, 10.832],
  },
  'Quận 7': {
    label: 'Quận 7',
    center: [106.7218, 10.7365],
    zoom: 13.4,
    bbox: [106.692, 10.708, 106.752, 10.762],
  },
  'Quận 8': {
    label: 'Quận 8',
    center: [106.6365, 10.7245],
    zoom: 13.3,
    bbox: [106.605, 10.705, 106.678, 10.755],
  },
  'TP. Thủ Đức': {
    label: 'TP. Thủ Đức',
    center: [106.7455, 10.8285],
    zoom: 12.6,
    bbox: [106.715, 10.785, 106.785, 10.875],
  },
};

/**
 * =============================================================================
 * TỔNG KẾT THEO QUY TẮC DỰ ÁN (docs/RULES.md)
 * =============================================================================
 * 1. Quyết định đã chốt:
 *    - Xây dựng đầy đủ 18 điểm đen ngập thực tế tại 4 quận MVP (Bình Thạnh: 6, Quận 7: 4,
 *      Quận 8: 4, TP. Thủ Đức: 4) chuẩn hệ tọa độ WGS84 (EPSG:4326).
 *    - Mỗi điểm đen có đầy đủ Point, LineString, Polygon buffer 35m (avoid_polygon),
 *      ngưỡng mưa (mm/h), ngưỡng triều (m), độ sâu lịch sử (cm), timeline ngập,
 *      ngôn ngữ cảnh báo kép và gợi ý đường vòng thực tế riêng cho Xe máy & Ô tô.
 *    - Đi kèm 18 tọa độ Camera giao thông TTGT TP.HCM trong bán kính <300m (chỉ lấy tọa độ
 *      và hướng dẫn đối chiếu hợp pháp, tuyệt đối không lấy stream video lậu).
 * 2. Câu hỏi mở cho chủ dự án:
 *    - Không có.
 * 3. Chuyển giao / Rủi ro:
 *    - Chuyển giao `FLOOD_HOTSPOTS_SEED`, `TRAFFIC_CAMERAS_SEED` và các hàm kiểm tra khoảng cách
 *      cho Backend API (`/api/alerts`, `/api/reports`, `/api/route-plan`) và bản đồ MapLibre GL JS.
 */
