-- =============================================================================
-- Migration: 0001_ocean_flood_postgis.sql
-- Dự án: Ocean Flood — Hệ thống Cảnh báo Ngập lụt Chủ động TP.HCM
-- Phụ trách: GIS Spatial Data Engineer (agency-spatial-data-engineer)
-- Chuẩn hệ tọa độ: WGS84 (EPSG:4326) | Đơn vị tính khoảng cách: GEOGRAPHY (meters)
-- Tuân thủ: docs/RULES.md, docs/01-spatial-requirements.md, docs/03-data-pipeline.md
-- =============================================================================

-- Kích hoạt extension không gian PostGIS và pgcrypto (cho gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. CÁC BẢNG DỮ LIỆU KHÔNG GIAN CỐT LÕI (CORE SPATIAL TABLES)
-- =============================================================================

-- 1.1. Bảng Điểm đen ngập lịch sử & Cấu hình ngưỡng thủy văn (Static + Semi-Dynamic)
CREATE TABLE IF NOT EXISTS flood_hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,                           -- Mã định danh cố định (VD: 'HS_BT_NGUYEN_XI')
    street_name TEXT NOT NULL,                  -- VD: "Nguyễn Xí (Đoạn giao Ung Văn Khiêm -> Đinh Bộ Lĩnh)"
    district TEXT NOT NULL CHECK (district IN ('Bình Thạnh', 'Quận 7', 'Quận 8', 'TP. Thủ Đức', 'Thủ Đức')),
    center_point GEOGRAPHY(POINT, 4326),        -- Tâm điểm đen phục vụ hiển thị nhanh marker
    road_geom GEOGRAPHY(LINESTRING, 4326) NOT NULL,
    avoid_polygon GEOGRAPHY(POLYGON, 4326) NOT NULL, -- Buffer 35m quanh đoạn ngập để cắt Routing
    elevation_m NUMERIC(4,2) DEFAULT 1.40,      -- Cao độ mặt đường trung bình ước tính (m)
    rain_threshold_mm NUMERIC(5,1) DEFAULT 30.0,-- Ngưỡng mưa bắt đầu gây ngập (mm/h)
    tide_threshold_m NUMERIC(4,2) DEFAULT 1.55, -- Ngưỡng triều Phú An / Nhà Bè gây ngập (m)
    typical_timeline TEXT,                      -- VD: "Thường ngập 16h30 - 19h00 khi mưa to trùng triều cường"
    max_historical_depth_cm INT DEFAULT 40,
    detour_motorbike TEXT,                      -- Gợi ý đường vòng thực tế cho Xe máy
    detour_car TEXT,                            -- Gợi ý đường vòng thực tế cho Ô tô
    nearby_camera_id TEXT,                      -- Mã camera TTGT gần nhất (<300m)
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2. Bảng Sự kiện ngập đang hoạt động & Dự báo 1-3h (Active & Forecasted Alerts)
CREATE TABLE IF NOT EXISTS flood_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotspot_id UUID REFERENCES flood_hotspots(id) ON DELETE SET NULL,
    street_name TEXT,                           -- Tên đường hiển thị nhanh
    district TEXT,                              -- Quận/TP hiển thị nhanh
    event_type TEXT NOT NULL CHECK (event_type IN ('FORECAST', 'CROWDSOURCE', 'COMBINED')),
    verification_status TEXT NOT NULL CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED', 'CLEARED')),
    severity_level INT NOT NULL CHECK (severity_level BETWEEN 0 AND 3), -- 0: Bình thường, 1: Nhẹ, 2: Trung bình, 3: Nặng
    estimated_depth_cm INT NOT NULL,            -- Độ sâu ước tính (cm)
    flood_probability_pct INT DEFAULT 0 CHECK (flood_probability_pct BETWEEN 0 AND 100),
    location_point GEOGRAPHY(POINT, 4326) NOT NULL,
    affected_polygon GEOGRAPHY(POLYGON, 4326) NOT NULL,
    -- Ngôn ngữ cảnh báo kép (Dual-Language Alerts)
    scientific_summary TEXT NOT NULL,           -- VD: "Mưa dự báo 45mm/h + Đỉnh triều 1.65m lúc 17h30 (Xác suất 78%)"
    plain_motorbike_advice TEXT NOT NULL,       -- VD: "⚠️ Ngập ngang ống pô xe máy (~30cm), dễ chết máy, nên đi đường vòng!"
    plain_car_advice TEXT NOT NULL,             -- VD: "⚠️ Ngập chạm gầm Sedan (~30cm), nguy cơ thủy kích khi có sóng nước!"
    confirm_count INT DEFAULT 1,                -- Số thiết bị/người xác nhận
    confidence_score INT DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
    source_attribution TEXT NOT NULL,           -- Nguồn: Open-Meteo + Đài KTTV Nam Bộ / Cộng đồng
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 minutes')
);

-- 1.3. Bảng Báo cáo cộng đồng chi tiết (Crowd Reports — Kiểm soát 5 lớp)
CREATE TABLE IF NOT EXISTS crowd_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES flood_events(id) ON DELETE CASCADE,
    device_hash TEXT NOT NULL,                  -- Hash ẩn danh của thiết bị (SHA-256)
    user_gps GEOGRAPHY(POINT, 4326) NOT NULL,   -- Vị trí thực của người báo
    target_gps GEOGRAPHY(POINT, 4326) NOT NULL, -- Vị trí điểm báo ngập
    distance_m NUMERIC(6,1) NOT NULL CHECK (distance_m <= 500.0), -- Bắt buộc <= 500m (Geofence Validation)
    visual_depth_choice TEXT NOT NULL CHECK (visual_depth_choice IN ('WHEEL_15CM', 'EXHAUST_30CM', 'SEAT_50CM', 'CLEARED')),
    estimated_depth_cm INT NOT NULL,
    photo_url TEXT NOT NULL,                    -- Bắt buộc có ảnh tại hiện trường
    exif_captured_at TIMESTAMPTZ NOT NULL,      -- Thời gian chụp phải lệch <= 10 phút
    address_text TEXT NOT NULL,                 -- Địa chỉ reverse-geocoded tự động từ GPS
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4. Bảng Điểm uy tín thiết bị ẩn danh (Device Reputation)
CREATE TABLE IF NOT EXISTS device_reputations (
    device_hash TEXT PRIMARY KEY,
    reputation_score INT DEFAULT 10 CHECK (reputation_score BETWEEN 0 AND 100),
    accurate_reports_count INT DEFAULT 0,
    flagged_spam_count INT DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    last_report_at TIMESTAMPTZ
);

-- 1.5. Bảng Tọa độ Camera Giao thông TTGT TP.HCM (Static Reference - Không lấy stream lậu)
CREATE TABLE IF NOT EXISTS traffic_cameras (
    id TEXT PRIMARY KEY,
    camera_name TEXT NOT NULL,                  -- VD: "Nút giao Nguyễn Xí - Ung Văn Khiêm"
    district TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    associated_hotspot_code TEXT,               -- Mã điểm đen ngập liên kết (nằm trong bán kính <300m)
    distance_to_hotspot_m INT DEFAULT 80 CHECK (distance_to_hotspot_m <= 300),
    ttgt_reference_note TEXT NOT NULL           -- Hướng dẫn tra cứu nhanh trên cổng/app TTGT TP.HCM
);

-- =============================================================================
-- 2. CHỈ MỤC KHÔNG GIAN GiST & CHỈ MỤC HIỆU NĂNG (SPATIAL & COMPOSITE INDEXES)
-- =============================================================================

-- Spatial Indexes (GiST) cho mọi cột Geography
CREATE INDEX IF NOT EXISTS idx_hotspots_center ON flood_hotspots USING GIST (center_point);
CREATE INDEX IF NOT EXISTS idx_hotspots_geom ON flood_hotspots USING GIST (road_geom);
CREATE INDEX IF NOT EXISTS idx_hotspots_poly ON flood_hotspots USING GIST (avoid_polygon);
CREATE INDEX IF NOT EXISTS idx_events_point ON flood_events USING GIST (location_point);
CREATE INDEX IF NOT EXISTS idx_events_poly ON flood_events USING GIST (affected_polygon);
CREATE INDEX IF NOT EXISTS idx_reports_target_gps ON crowd_reports USING GIST (target_gps);
CREATE INDEX IF NOT EXISTS idx_cameras_loc ON traffic_cameras USING GIST (location);

-- Composite Index cho truy vấn sự kiện đang còn hiệu lực (TTL)
CREATE INDEX IF NOT EXISTS idx_events_active_ttl
    ON flood_events (expires_at, verification_status, severity_level);

-- Index chống Spam Rate Limit (kiểm tra số báo cáo của 1 thiết bị trong 1 giờ qua)
CREATE INDEX IF NOT EXISTS idx_reports_device_time
    ON crowd_reports (device_hash, created_at DESC);

-- =============================================================================
-- 3. CÁC HÀM KHÔNG GIAN POSTGIS CỐT LÕI (GEOFENCE 500M & CROSS-CHECK 150M)
-- =============================================================================

-- 3.1. Hàm kiểm tra Geofence <= 500m giữa tọa độ GPS thực của người dùng và điểm báo ngập
CREATE OR REPLACE FUNCTION fn_validate_geofence_500m(
    p_user_lng DOUBLE PRECISION,
    p_user_lat DOUBLE PRECISION,
    p_target_lng DOUBLE PRECISION,
    p_target_lat DOUBLE PRECISION
)
RETURNS TABLE (
    is_within_500m BOOLEAN,
    distance_meters NUMERIC(6,1)
)
LANGUAGE sql
IMMUTABLE
AS $$
    WITH calc AS (
        SELECT ROUND(
            ST_Distance(
                ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
                ST_SetSRID(ST_MakePoint(p_target_lng, p_target_lat), 4326)::geography
            )::numeric,
            1
        ) AS dist_m
    )
    SELECT
        (dist_m <= 500.0) AS is_within_500m,
        dist_m AS distance_meters
    FROM calc;
$$;

-- 3.2. Hàm kiểm tra chéo không gian (Spatial Cross-Check 150m trong vòng 90 phút)
-- Tìm sự kiện đang mở trong bán kính 150m và đếm số thiết bị khác nhau (device_hash)
-- Nếu >= 3 thiết bị xác nhận -> nâng trạng thái lên 'VERIFIED'
CREATE OR REPLACE FUNCTION fn_crosscheck_cluster_150m(
    p_target_lng DOUBLE PRECISION,
    p_target_lat DOUBLE PRECISION
)
RETURNS TABLE (
    matched_event_id UUID,
    unique_device_count INT,
    recommended_status TEXT,
    nearest_hotspot_id UUID
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_target_point GEOGRAPHY(POINT, 4326);
    v_event_id UUID;
    v_device_count INT;
    v_hotspot_id UUID;
BEGIN
    v_target_point := ST_SetSRID(ST_MakePoint(p_target_lng, p_target_lat), 4326)::geography;

    -- Tìm sự kiện ngập đang mở trong bán kính 150m (trong TTL)
    SELECT e.id
    INTO v_event_id
    FROM flood_events e
    WHERE e.expires_at > NOW()
      AND e.verification_status != 'CLEARED'
      AND ST_DWithin(e.location_point, v_target_point, 150.0)
    ORDER BY e.created_at DESC
    LIMIT 1;

    -- Đếm số thiết bị duy nhất (device_hash) đã gửi báo cáo hợp lệ trong bán kính 150m trong 90 phút qua
    SELECT COUNT(DISTINCT r.device_hash)::INT
    INTO v_device_count
    FROM crowd_reports r
    WHERE r.is_valid = TRUE
      AND r.visual_depth_choice != 'CLEARED'
      AND r.created_at >= (NOW() - INTERVAL '90 minutes')
      AND ST_DWithin(r.target_gps, v_target_point, 150.0);

    -- Tìm điểm đen lịch sử gần nhất (nếu nằm trong bán kính 150m từ đoạn đường)
    SELECT h.id
    INTO v_hotspot_id
    FROM flood_hotspots h
    WHERE ST_DWithin(h.road_geom, v_target_point, 150.0)
    ORDER BY ST_Distance(h.road_geom, v_target_point) ASC
    LIMIT 1;

    RETURN QUERY
    SELECT
        v_event_id AS matched_event_id,
        COALESCE(v_device_count, 0) AS unique_device_count,
        CASE
            WHEN COALESCE(v_device_count, 0) >= 3 THEN 'VERIFIED'
            ELSE 'UNVERIFIED'
        END AS recommended_status,
        v_hotspot_id AS nearest_hotspot_id;
END;
$$;

-- 3.3. Hàm lấy danh sách vùng đệm ngập cần tránh (avoid_polygon) theo phương tiện
-- Xe máy ('motorcycle'): tránh vùng ngập >= 20cm
-- Ô tô ('car'): tránh vùng ngập >= 25cm
CREATE OR REPLACE FUNCTION fn_get_avoid_polygons_by_vehicle(
    p_vehicle_type TEXT DEFAULT 'motorcycle'
)
RETURNS TABLE (
    event_id UUID,
    street_name TEXT,
    estimated_depth_cm INT,
    flood_probability_pct INT,
    verification_status TEXT,
    avoid_polygon_geojson JSON
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        e.id AS event_id,
        COALESCE(e.street_name, h.street_name, 'Điểm ngập báo cáo') AS street_name,
        e.estimated_depth_cm,
        e.flood_probability_pct,
        e.verification_status,
        ST_AsGeoJSON(e.affected_polygon)::json AS avoid_polygon_geojson
    FROM flood_events e
    LEFT JOIN flood_hotspots h ON e.hotspot_id = h.id
    WHERE e.expires_at > NOW()
      AND e.verification_status IN ('VERIFIED', 'UNVERIFIED')
      AND e.flood_probability_pct >= 60
      AND e.estimated_depth_cm >= CASE
          WHEN LOWER(p_vehicle_type) = 'motorcycle' THEN 20
          ELSE 25
      END;
$$;

-- 3.4. Hàm tìm Camera TTGT gần điểm ngập nhất trong bán kính <= 300m
CREATE OR REPLACE FUNCTION fn_find_nearby_cameras_300m(
    p_lng DOUBLE PRECISION,
    p_lat DOUBLE PRECISION
)
RETURNS TABLE (
    camera_id TEXT,
    camera_name TEXT,
    district TEXT,
    distance_m INT,
    ttgt_reference_note TEXT,
    coordinates JSON
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c.id AS camera_id,
        c.camera_name,
        c.district,
        ROUND(ST_Distance(
            c.location,
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ))::INT AS distance_m,
        c.ttgt_reference_note,
        ST_AsGeoJSON(c.location)::json->'coordinates' AS coordinates
    FROM traffic_cameras c
    WHERE ST_DWithin(
        c.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        300.0
    )
    ORDER BY distance_m ASC
    LIMIT 3;
$$;

-- 3.5. Hàm dọn dẹp dữ liệu tự động (Data Retention & TTL Cleanup theo Nghị định 13/2023/NĐ-CP)
CREATE OR REPLACE FUNCTION fn_cleanup_expired_flood_data()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Hạ cấp các flood_events đã quá hạn expires_at (90 phút) sang trạng thái CLEARED
    UPDATE flood_events
    SET verification_status = 'CLEARED',
        severity_level = 0,
        updated_at = NOW()
    WHERE expires_at <= NOW()
      AND verification_status != 'CLEARED';

    -- 2. Xóa các báo cáo cộng đồng quá 90 ngày để bảo vệ quyền riêng tư vị trí GPS (Nghị định 13/2023/NĐ-CP)
    DELETE FROM crowd_reports
    WHERE created_at < (NOW() - INTERVAL '90 days');
END;
$$;

-- =============================================================================
-- TỔNG KẾT THEO QUY TẮC DỰ ÁN (docs/RULES.md)
-- =============================================================================
-- 1. Quyết định đã chốt:
--    - Toàn bộ dữ liệu không gian lưu trữ chuẩn WGS84 (EPSG:4326) dưới kiểu GEOGRAPHY
--      để tính khoảng cách mét chính xác tuyệt đối tại TP.HCM (Geofence 500m, Cross-check 150m,
--      Buffer tránh ngập 35m, Camera TTGT <= 300m).
--    - Tích hợp đầy đủ GiST Spatial Indexes và hàm SQL kiểm chứng đa lớp ngay trong DB.
-- 2. Câu hỏi mở cho chủ dự án:
--    - Không có.
-- 3. Chuyển giao / Rủi ro:
--    - Bàn giao schema SQL và các hàm RPC (`fn_validate_geofence_500m`, `fn_crosscheck_cluster_150m`,
--      `fn_get_avoid_polygons_by_vehicle`, `fn_find_nearby_cameras_300m`) cho Backend Architect
--      và Frontend Developer tích hợp với `/src/data/hcm-spatial-seed.ts`.
