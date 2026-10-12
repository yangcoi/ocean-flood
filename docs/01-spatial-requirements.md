# Tổng Hợp Insight Người Dùng & Yêu Cầu Không Gian (User Insights & Spatial Requirements)

**Người phụ trách:** UX Researcher & GIS Analyst (`agency-ux-researcher`, `gis-analyst`)  
**Dựa trên:** `docs/RULES.md`, `docs/00-brief.md`, `docs/01-data-sources.md`, `docs/01-market.md`  
**Ngày lập:** 2026-10-12  

---

## PHẦN A: INSIGHT HÀNH VI NGƯỜI DÙNG TP.HCM (`01-insights`)

### 1. Bốn Nỗi Đau Lớn Nhất (Top Pain Points)
1. **"Bẫy Google Maps lúc mưa triều":** Google Maps thấy đoạn ngập sâu không có xe đi qua nên hiển thị màu xanh (thông thoáng) và dẫn người đi xe máy/ô tô lao thẳng vào rốn ngập.
2. **Không hiểu con số thủy văn:** Nghe đài báo *"Triều cường đạt 1.68m tại Phú An"* nhưng không biết đường Huỳnh Tấn Phát hay Nguyễn Xí ngập tới bánh xe hay ngập lút yên xe.
3. **Thao tác điện thoại dưới mưa cực kỳ khó khăn:** Người đi xe máy mặc áo mưa, tay ướt, mắt mờ vì mưa tạt, mạng 4G chập chờn — không thể gõ chữ dài hay đọc bảng biểu phức tạp.
4. **Mất niềm tin vì tin giả / tin cũ:** Thấy báo ngập nhưng chạy tới nơi đã rút khô từ lâu, hoặc có kẻ bấm báo ngập trêu chọc ở nơi trời nắng.

### 2. Nhu Cầu Khác Biệt Giữa Người Đi Xe Máy & Người Đi Ô Tô
| Tiêu chí | Người đi Xe máy / Shipper | Người lái Ô tô (Sedan / CUV / SUV) |
| :--- | :--- | :--- |
| **Ngưỡng nguy hiểm** | **$\ge 20\text{cm}$** (ngập nửa bánh xe, chạm ống pô xe tay ga dễ tắt máy); **$> 30\text{cm}$** (chết máy hàng loạt). | **$\ge 25-30\text{cm}$** (nguy cơ tràn nước sàn xe sedan, sóng nước từ xe ngược chiều gây thủy kích cổ hút gió); **$> 45\text{cm}$** (cấm tuyệt đối mọi xe con). |
| **Hành vi tìm đường tránh** | Có thể đi qua các tuyến đường nhánh, đường nội bộ rộng rãi (nhưng sợ hẻm cụt hoặc hẻm trũng). | Chỉ đi được đường có bề rộng làn xe đủ lớn (`primary`, `secondary`, `tertiary`), không thể rẽ vào hẻm nhỏ hoặc quay đầu gấp. |
| **Cách chọn mức ngập khi báo cáo** | Nhìn theo **Mắt cá chân / Nửa bánh xe (~15cm)** $\rightarrow$ **Ống pô xe máy (~30cm)** $\rightarrow$ **Yên xe / Chết máy (>50cm)**. | Nhìn theo **Gờ vỉa hè / Nửa bánh ô tô (~25cm)** $\rightarrow$ **Ngập gầm / Đèn pha sedan (~40cm)** $\rightarrow$ **Nổi xe (>50cm)**. |

---

## PHẦN B: YÊU CẦU PHÂN TÍCH KHÔNG GIAN GIS (`01-spatial-requirements`)

### 1. Các Đối Tượng Không Gian Cần Mô Hình Hóa (Spatial Entities)
1. **`flood_hotspots` (Tuyến/Điểm đen ngập lịch sử):**
   - Kiểu hình học: `LineString` (đoạn đường thường ngập) kèm `Polygon` vùng đệm (`buffer 30m`) để phục vụ cắt giao lộ trình (routing intersection).
   - Thuộc tính: Tên đường, Quận (Bình Thạnh, Q7, Q8, Thủ Đức), Độ cao mặt đường trung bình (`m`), Ngưỡng mưa gây ngập (`mm/h`), Ngưỡng triều gây ngập (`m`), Khung giờ hay ngập (Timeline).
2. **`crowd_reports` (Điểm báo cáo ngập từ cộng đồng):**
   - Kiểu hình học: `Point` (tọa độ GPS người báo).
   - Quy tắc gom cụm không gian (Spatial Clustering): Các báo cáo nằm trong bán kính **$150\text{m}$** trên cùng một tuyến đường trong vòng **90 phút** được gom thành 1 cụm sự kiện ngập (`flood_event`) để đếm số người xác nhận chéo (`confirm_count`).
3. **`traffic_cameras` (Tọa độ camera giao thông TTGT):**
   - Kiểu hình học: `Point`. Dùng để người dùng bấm xem vị trí camera gần điểm ngập nhất trong bán kính **$300\text{m}$**.
4. **`road_network` (Đồ thị đường bộ phục vụ Routing):**
   - Lấy từ OpenStreetMap của TP.HCM, phân loại rõ thuộc tính cho phép `motorcycle` vs `car`.

### 2. Các Câu Hỏi Không Gian Hệ Thống Phải Trả Lời Được (Spatial Queries)
1. **Kiểm tra khoảng cách báo cáo (Geofence Validation):**
   - `ST_DWithin(user_gps, report_point, 500)` $\rightarrow$ Người báo cáo có thực sự đứng trong bán kính $500\text{m}$ từ điểm báo ngập không?
2. **Gom cụm xác nhận chéo (Spatial Cross-Check):**
   - Có bao nhiêu thiết bị khác nhau (`device_hash`) đã gửi báo cáo ngập trong bán kính $150\text{m}$ quanh điểm này trong 90 phút qua? Nếu $\ge 3 \rightarrow$ `VERIFIED`.
3. **Phát hiện lộ trình cắt qua vùng ngập (Route-Flood Intersection):**
   - `ST_Intersects(route_linestring, flood_buffer_polygon)` $\rightarrow$ Lộ trình từ điểm A đến điểm B của người dùng có cắt qua đoạn đường nào đang ngập hoặc dự báo ngập $> 60\%$ trong 1–3 giờ tới không?
4. **Tìm lộ trình thay thế theo loại xe (Vehicle-Specific Flood-Avoidance Routing):**
   - Với **Xe máy**: Tránh mọi đoạn đường có mực nước ước tính $\ge 20\text{cm}$; cho phép đi đường cấp `residential` trở lên.
   - Với **Ô tô**: Tránh mọi đoạn đường có mực nước ước tính $\ge 25\text{cm}$ VÀ chỉ điều hướng trên các đường `primary`, `secondary`, `tertiary` (không dẫn ô tô vào hẻm nhỏ).

### 3. Độ Phân Giải & Hệ Quy Chiếu Tọa Độ (CRS)
- **Hệ tọa độ lưu trữ & API:** Chuẩn hóa 100% về **WGS84 (`EPSG:4326`)** (kinh độ, vĩ độ).
- **Hệ tọa độ tính khoảng cách mét trong PostGIS:** Ép kiểu sang `geography` hoặc chiếu sang `EPSG:32648` (UTM Zone 48N cho khu vực Nam Bộ) để tính mét chính xác tuyệt đối (`500m`, `150m`, `30m`).
- **Hệ tọa độ hiển thị Web Map:** **Web Mercator (`EPSG:3857`)** trên MapLibre GL JS.

---

## Quyết Định Đã Chốt
1. Áp dụng bộ nút chọn mức ngập trực quan gắn với bộ phận xe (Bánh xe ~15cm / Ống pô ~30cm / Yên xe & Gầm ô tô >50cm).
2. Hỗ trợ phân nhánh thuật toán gợi ý lộ trình cho cả **Xe máy** và **Ô tô**.
3. Sử dụng bán kính $500\text{m}$ để khóa vị trí báo cáo GPS và bán kính $150\text{m}$ để gom nhóm xác nhận chéo $\ge 3$ người.

## Câu Hỏi Mở Cho Chủ Dự Án
- Không có (Đã được chủ dự án chốt tại Gate 1).

## Chuyển Giao / Rủi Ro
- **Chuyển giao:** Đưa toàn bộ yêu cầu vào `docs/02-prd.md` và kiến trúc kỹ thuật Phase 2 (`docs/03-*.md`).
