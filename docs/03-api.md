# Đặc Tả Giao Diện Lập Trình Ứng Dụng (API Specification): Ocean Flood

**Người phụ trách:** Backend Architect (`agency-backend-architect`)  
**Dựa trên:** `docs/03-architecture.md`, `docs/03-workflows.md`, `docs/03-data-pipeline.md`  
**Ngày lập:** 2026-10-12  

---

## 1. Danh Sách Endpoints Chính (RESTful JSON / GeoJSON)

| Method | Endpoint | Mô tả chức năng | Caching / Rate Limit |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/alerts` | Lấy toàn bộ điểm đang ngập, điểm dự báo ngập 1–3h tới (kèm ngôn ngữ kép) và tọa độ camera TTGT trong vùng nhìn (`bbox`). | Edge Cache `s-maxage=30, stale-while-revalidate=60` |
| `POST` | `/api/reports` | Gửi báo cáo ngập mới từ cộng đồng (kèm ảnh, thời gian EXIF, tọa độ GPS, mức ngập trực quan) hoặc xác nhận chéo điểm ngập có sẵn. | Rate Limit: tối đa **5 req / giờ / device_hash & IP** |
| `POST` | `/api/route-plan` | Tìm lộ trình từ Điểm đi $\rightarrow$ Điểm đến cho **Xe máy (`motorcycle`)** hoặc **Ô tô (`car`)**, tự động phát hiện giao cắt vùng ngập và trả về lộ trình thay thế an toàn. | Rate Limit: **30 req / phút / IP** |
| `GET` | `/api/hotspots/:id/timeline` | Xem lịch sử & khung giờ thường ngập của một tuyến đường điểm đen cùng biểu đồ mưa/triều dự báo trong 6h tới. | Edge Cache `s-maxage=300` |

---

## 2. Chi Tiết Request / Response Mẫu

### 2.1 `GET /api/alerts?district=all`
Trả về chuẩn `GeoJSON FeatureCollection` để `MapLibre GL JS` vẽ trực tiếp lên bản đồ trong 1 lần gọi:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "updated_at": "2026-10-12T17:00:00+07:00",
    "tide_station_phu_an": {
      "current_level_m": 1.62,
      "peak_level_m": 1.68,
      "peak_time": "17:30",
      "alert_stage": "Báo động 3 (>1.60m)"
    }
  },
  "features": [
    {
      "type": "Feature",
      "id": "evt_nguyen_xi_01",
      "geometry": {
        "type": "Point",
        "coordinates": [106.7092, 10.8145]
      },
      "properties": {
        "street_name": "Nguyễn Xí (giao Ung Văn Khiêm, Q. Bình Thạnh)",
        "event_type": "COMBINED",
        "verification_status": "VERIFIED",
        "confirm_count": 4,
        "severity_level": 2,
        "estimated_depth_cm": 30,
        "flood_probability_pct": 85,
        "scientific_summary": "Mưa dự báo 45mm/h + Đỉnh triều 1.68m (Phú An) lúc 17h30 — Xác suất ngập 85%, sâu ~30cm",
        "plain_motorbike_advice": "⚠️ Ngập ngang ống pô xe máy (~30cm). Xe tay ga rất dễ chết máy, nên đi đường vòng!",
        "plain_car_advice": "⚠️ Ngập chạm gầm xe Sedan (~30cm). Nguy cơ tràn nước hoặc thủy kích nếu gặp sóng xe lớn!",
        "typical_timeline": "Thường ngập từ 16h30–19h00 vào ngày mưa lớn trùng triều cường",
        "nearby_camera": {
          "id": "CAM_BT_04",
          "name": "Camera nút giao Nguyễn Xí - Ung Văn Khiêm",
          "coordinates": [106.7095, 10.8142]
        },
        "updated_at": "2026-10-12T16:58:00+07:00",
        "expires_at": "2026-10-12T18:28:00+07:00",
        "source_attribution": "Open-Meteo + Đài KTTV Nam Bộ + 4 người dân xác nhận tại chỗ"
      }
    }
  ]
}
```

---

### 2.2 `POST /api/reports` (Gửi báo cáo cộng đồng có kiểm soát 5 lớp)

**Request Body (`multipart/form-data` hoặc JSON kèm ảnh đã upload):**
```json
{
  "device_hash": "sha256_9f86d081884c7d659a2feaa0c55ad015",
  "user_gps": { "lat": 10.8143, "lng": 106.7091, "accuracy_m": 18 },
  "target_gps": { "lat": 10.8145, "lng": 106.7092 },
  "address_text": "185 Nguyễn Xí, Phường 26, Bình Thạnh, TP.HCM",
  "visual_depth_choice": "EXHAUST_30CM",
  "exif_captured_at": "2026-10-12T16:56:10+07:00",
  "photo_base64_webp": "data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAw..."
}
```

**Quy tắc Validation bắt buộc tại API:**
1. `distance(user_gps, target_gps) <= 500m` $\rightarrow$ Nếu sai trả mã `422 Unprocessable Entity`: *"Vị trí GPS của bạn cách điểm báo cáo quá 500m. Chỉ người đang ở hiện trường mới có thể gửi báo cáo."*
2. `abs(now - exif_captured_at) <= 10 minutes` $\rightarrow$ Nếu sai trả mã `422`: *"Ảnh chụp đã quá 10 phút hoặc không hợp lệ. Vui lòng chụp ảnh trực tiếp tại hiện trường."*
3. `photo_base64_webp` bắt buộc tồn tại và là ảnh hợp lệ.

---

### 2.3 `POST /api/route-plan` (Gợi ý lộ trình tránh ngập cho Xe máy & Ô tô)

**Request Body:**
```json
{
  "origin": { "lat": 10.8225, "lng": 106.7145, "label": "Cầu Bình Lợi, Bình Thạnh" },
  "destination": { "lat": 10.7756, "lng": 106.7019, "label": "Quận 1, TP.HCM" },
  "vehicle_type": "motorcycle",
  "departure_time": "now"
}
```

**Response Body:**
```json
{
  "vehicle_type": "motorcycle",
  "flood_detected_on_direct_route": true,
  "intersected_alerts": [
    {
      "street_name": "Nguyễn Xí (Bình Thạnh)",
      "estimated_depth_cm": 30,
      "scientific_summary": "Mưa 45mm/h + Triều 1.68m lúc 17h30 — Ngập ~30cm",
      "plain_advice": "⚠️ Tuyến đường ngắn nhất đi qua rốn ngập ngang ống pô xe máy (~30cm) tại Nguyễn Xí!"
    }
  ],
  "routes": {
    "direct_flooded_route": {
      "status": "DANGER_FLOODED",
      "distance_km": 6.2,
      "duration_min": 19,
      "geometry": { "type": "LineString", "coordinates": [[106.7145, 10.8225], [106.7092, 10.8145]] }
    },
    "recommended_safe_route": {
      "status": "SAFE_ALTERNATIVE",
      "summary_text": "Đi qua Phạm Văn Đồng -> Phan Đăng Lưu -> Đinh Tiên Hoàng (Tránh hoàn toàn điểm ngập Nguyễn Xí)",
      "distance_km": 7.4,
      "duration_min": 24,
      "extra_time_min": 5,
      "geometry": { "type": "LineString", "coordinates": [[106.7145, 10.8225], [106.6921, 10.8012]] }
    }
  }
}
```

---

## 3. Quyết Định Đã Chốt
1. Tích hợp sẵn thông tin ngôn ngữ kép và camera gần nhất vào ngay payload `/api/alerts` để giảm số lượng HTTP request trên mạng 4G.
2. Endpoint `/api/route-plan` trả về cả đường ngắn nhất bị ngập (để cảnh báo trực quan) lẫn đường vòng an toàn (để người dùng so sánh và đi theo).

## 4. Câu Hỏi Mở Cho Chủ Dự Án
- Không có.

## 5. Chuyển Giao / Rủi Ro
- **Chuyển giao:** Chuyển sang `docs/03-threat-model.md`, `docs/03-privacy.md` và `docs/04-backlog.md`.
