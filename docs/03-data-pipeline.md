# Thiết Kế Data Pipeline & Cơ Sở Dữ Liệu Không Gian PostGIS (Spatial Data Pipeline)

**Người phụ trách:** GIS Spatial Data Engineer (`gis-spatial-data-engineer`) & Database Optimizer (`agency-database-optimizer`)  
**Dựa trên:** `docs/01-data-sources.md`, `docs/01-spatial-requirements.md`, `docs/03-architecture.md`  
**Ngày lập:** 2026-10-12  

---

## 1. Quy Ước Không Gian & Thời Gian Chuẩn (Spatial & Temporal Conventions)
- **Hệ quy chiếu lưu trữ (Storage CRS):** `EPSG:4326` (WGS84 — Kinh độ / Vĩ độ).
- **Kiểu dữ liệu tính khoảng cách mét:** Sử dụng kiểu `GEOGRAPHY(Geometry, 4326)` trong PostGIS để các hàm `ST_DWithin`, `ST_Distance`, `ST_Buffer` tính toán trực tiếp bằng đơn vị **mét (meters)** chính xác tại TP.HCM mà không bị méo tỷ lệ.
- **Quy ước thời gian:** Lưu trữ toàn bộ dưới dạng `TIMESTAMPTZ` (UTC trong DB), hiển thị trên giao diện và bản tin theo múi giờ Việt Nam **`Asia/Ho_Chi_Minh` (`UTC+7`)**.

---

## 2. Thiết Kế Schema PostGIS Chi Tiết (SQL DDL)

```sql
-- Kích hoạt extension không gian PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Bảng Điểm đen ngập lịch sử & Cấu hình ngưỡng thủy văn (Static + Semi-Dynamic)
CREATE TABLE flood_hotspots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    street_name TEXT NOT NULL,                  -- VD: "Nguyễn Xí (Đoạn giao Ung Văn Khiêm -> Đinh Bộ Lĩnh)"
    district TEXT NOT NULL,                     -- 'Bình Thạnh', 'Quận 7', 'Quận 8', 'Thủ Đức'
    road_geom GEOGRAPHY(LINESTRING, 4326) NOT NULL,
    avoid_polygon GEOGRAPHY(POLYGON, 4326) NOT NULL, -- Buffer 35m quanh đoạn ngập để cắt Routing
    rain_threshold_mm NUMERIC(5,1) DEFAULT 30.0,-- Ngưỡng mưa bắt đầu gây ngập (mm/h)
    tide_threshold_m NUMERIC(4,2) DEFAULT 1.55, -- Ngưỡng triều Phú An gây ngập (m)
    typical_timeline TEXT,                      -- VD: "Thường ngập 16h30 - 19h00 khi mưa to trùng triều cường"
    max_historical_depth_cm INT DEFAULT 40,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng Sự kiện ngập đang hoạt động & Dự báo 1-3h (Active & Forecasted Alerts)
CREATE TABLE flood_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotspot_id UUID REFERENCES flood_hotspots(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('FORECAST', 'CROWDSOURCE', 'COMBINED')),
    verification_status TEXT NOT NULL CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED', 'CLEARED')),
    severity_level INT NOT NULL CHECK (severity_level BETWEEN 0 AND 3), -- 0: Bình thường, 1: Nhẹ, 2: Trung bình, 3: Nặng
    estimated_depth_cm INT NOT NULL,            -- Độ sâu ước tính (cm)
    flood_probability_pct INT DEFAULT 0,        -- Xác suất ngập (0 - 100%)
    location_point GEOGRAPHY(POINT, 4326) NOT NULL,
    affected_polygon GEOGRAPHY(POLYGON, 4326) NOT NULL,
    -- Ngôn ngữ cảnh báo kép (Dual-Language Alerts)
    scientific_summary TEXT NOT NULL,           -- VD: "Mưa dự báo 45mm/h + Đỉnh triều 1.65m lúc 17h30 (Xác suất 78%)"
    plain_motorbike_advice TEXT NOT NULL,       -- VD: "⚠️ Ngập ngang ống pô xe máy (~30cm), dễ chết máy, nên đi đường vòng!"
    plain_car_advice TEXT NOT NULL,             -- VD: "⚠️ Ngập chạm gầm Sedan (~30cm), nguy cơ thủy kích khi có sóng nước!"
    confirm_count INT DEFAULT 1,                -- Số người xác nhận
    confidence_score INT DEFAULT 50,            -- Độ tin cậy (0 - 100%)
    source_attribution TEXT NOT NULL,           -- Nguồn: Open-Meteo + Đài KTTV / Cộng đồng
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL             -- Mặc định NOW() + INTERVAL '90 minutes'
);

-- 3. Bảng Báo cáo cộng đồng chi tiết (Crowd Reports — Kiểm soát 5 lớp)
CREATE TABLE crowd_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES flood_events(id) ON DELETE CASCADE,
    device_hash TEXT NOT NULL,                  -- Hash ẩn danh của thiết bị
    user_gps GEOGRAPHY(POINT, 4326) NOT NULL,   -- Vị trí thực của người báo
    target_gps GEOGRAPHY(POINT, 4326) NOT NULL, -- Vị trí điểm báo ngập
    distance_m NUMERIC(6,1) NOT NULL CHECK (distance_m <= 500.0), -- Bắt buộc <= 500m
    visual_depth_choice TEXT NOT NULL CHECK (visual_depth_choice IN ('WHEEL_15CM', 'EXHAUST_30CM', 'SEAT_50CM', 'CLEARED')),
    estimated_depth_cm INT NOT NULL,
    photo_url TEXT NOT NULL,                    -- Bắt buộc có ảnh
    exif_captured_at TIMESTAMPTZ NOT NULL,      -- Thời gian chụp phải lệch <= 10 phút
    address_text TEXT NOT NULL,                 -- Địa chỉ reverse-geocoded tự động từ GPS
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng Điểm uy tín thiết bị ẩn danh (Device Reputation)
CREATE TABLE device_reputations (
    device_hash TEXT PRIMARY KEY,
    reputation_score INT DEFAULT 10 CHECK (reputation_score BETWEEN 0 AND 100),
    accurate_reports_count INT DEFAULT 0,
    flagged_spam_count INT DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    last_report_at TIMESTAMPTZ
);

-- 5. Bảng Tọa độ Camera Giao thông TTGT (Static Reference)
CREATE TABLE traffic_cameras (
    id TEXT PRIMARY KEY,
    camera_name TEXT NOT NULL,                  -- VD: "Nút giao Hàng Xanh - Xô Viết Nghệ Tĩnh"
    district TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    ttgt_reference_note TEXT                    -- Hướng dẫn tra cứu nhanh trên app TTGT TP.HCM
);
```

---

## 3. Tối Ưu Hóa Truy Vấn & Chỉ Mục Không Gian (DB Tuning & Indexing — `03-db-tuning`)

Để đảm bảo truy vấn bản đồ và tìm đường tránh ngập luôn phản hồi **$< 50\text{ms}$**:

```sql
-- Spatial Indexes (GiST) cho mọi cột Geography
CREATE INDEX idx_hotspots_geom ON flood_hotspots USING GIST (road_geom);
CREATE INDEX idx_hotspots_poly ON flood_hotspots USING GIST (avoid_polygon);
CREATE INDEX idx_events_point ON flood_events USING GIST (location_point);
CREATE INDEX idx_events_poly ON flood_events USING GIST (affected_polygon);
CREATE INDEX idx_cameras_loc ON traffic_cameras USING GIST (location);

-- Composite Index cho truy vấn sự kiện đang còn hiệu lực (TTL)
CREATE INDEX idx_events_active_ttl ON flood_events (expires_at, verification_status, severity_level);

-- Index chống Spam Rate Limit (kiểm tra số báo cáo của 1 thiết bị trong 1 giờ qua)
CREATE INDEX idx_reports_device_time ON crowd_reports (device_hash, created_at DESC);
```

### Các Truy Vấn Không Gian Cốt Lõi (Core Spatial Queries)

1. **Kiểm tra Geofence $\le 500\text{m}$ và gom nhóm sự kiện $150\text{m}$ khi nhận báo cáo mới:**
```sql
-- Kiểm tra khoảng cách giữa GPS người dùng và điểm báo cáo có <= 500m không
SELECT ST_Distance(
    ST_SetSRID(ST_MakePoint($user_lng, $user_lat), 4326)::geography,
    ST_SetSRID(ST_MakePoint($target_lng, $target_lat), 4326)::geography
) AS distance_meters;

-- Tìm sự kiện ngập đang mở trong bán kính 150m để cộng dồn xác nhận chéo (Cross-check)
SELECT id, confirm_count, verification_status
FROM flood_events
WHERE expires_at > NOW()
  AND verification_status != 'CLEARED'
  AND ST_DWithin(
      location_point,
      ST_SetSRID(ST_MakePoint($target_lng, $target_lat), 4326)::geography,
      150.0
  )
ORDER BY created_at DESC
LIMIT 1;
```

2. **Lấy danh sách vùng ngập cần tránh (`exclude_polygons`) theo loại xe (Xe máy vs Ô tô):**
```sql
-- Nếu vehicle_type = 'motorcycle' -> lấy các vùng ngập >= 20cm
-- Nếu vehicle_type = 'car' -> lấy các vùng ngập >= 25cm
SELECT id, street_name, estimated_depth_cm, ST_AsGeoJSON(affected_polygon)::json AS polygon
FROM flood_events
WHERE expires_at > NOW()
  AND verification_status IN ('VERIFIED', 'UNVERIFIED')
  AND flood_probability_pct >= 60
  AND estimated_depth_cm >= CASE WHEN $vehicle_type = 'motorcycle' THEN 20 ELSE 25 END;
```

---

## 4. Chính Sách Dọn Dẹp Dữ Liệu Tự Động (Data Retention Cron)
- **Mỗi 15 phút:** Hạ cấp các `flood_events` đã quá hạn `expires_at` sang trạng thái `CLEARED`.
- **Mỗi 24 giờ:**
  - Xóa file ảnh trong Storage của các báo cáo cũ hơn **30 ngày** (giữ cho dung lượng Free Tier luôn dưới ngưỡng).
  - Xóa tọa độ `user_gps` trong bảng `crowd_reports` cũ hơn **90 ngày** (tuân thủ Nghị định 13/2023/NĐ-CP).

---

## 5. Quyết Định Đã Chốt
1. Sử dụng kiểu `GEOGRAPHY(..., 4326)` có gắn `GiST Index` cho toàn bộ bảng không gian.
2. Lưu trực tiếp cả 3 trường ngôn ngữ (`scientific_summary`, `plain_motorbike_advice`, `plain_car_advice`) trong bảng `flood_events` để Frontend đọc ra hiển thị tức thì không cần tính toán lại.

## 6. Câu Hỏi Mở Cho Chủ Dự Án
- Không có.

## 7. Chuyển Giao / Rủi Ro
- **Chuyển giao:** Chuyển sang `docs/03-api.md`, `docs/03-threat-model.md`, và `docs/03-privacy.md`.
