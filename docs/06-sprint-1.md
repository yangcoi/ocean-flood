# Báo Cáo Tổng Kết Xây Dựng MVP — Sprint 1 (Phase 4: Implementation): Ocean Flood

**Người phụ trách:**
- GIS Spatial Data Engineer (`agency-spatial-data-engineer`) — Task 4.1
- Backend Architect (`agency-backend-architect`) — Task 4.2
- GIS Web GIS Developer (`agency-web-gis-developer`) & Frontend Developer (`agency-frontend-developer`) — Task 4.3 & 4.4

**Dựa trên:** `docs/RULES.md`, `docs/02-prd.md`, `docs/03-architecture.md`, `docs/03-api.md`, `docs/05-design-spec.md`, `docs/05-cartography.md`, `docs/05-walkthrough.md`  
**Ngày hoàn thành:** 2026-10-12  

---

## 1. Tổng Quan Phạm Vi Đã Hiện Thực Hóa Trong Sprint 1

Toàn bộ kiến trúc dữ liệu không gian, động cơ dự báo – kiểm duyệt – tìm đường và giao diện bản đồ tương tác PWA chuẩn **LibreUIUX Global Design System** đã được xây dựng hoàn chỉnh trong `/src`:

| Phân hệ | Tập tin Mã nguồn | Nội dung Thực thi Cốt lõi | Trạng thái |
| :--- | :--- | :--- | :---: |
| **1. Dữ liệu Không gian chuẩn WGS84 (`EPSG:4326`)** | `src/data/hcm-spatial-seed.ts` | - **18 tuyến đường điểm đen ngập thực tế** tại 4 quận trọng điểm (Bình Thạnh: 6, Quận 7: 4, Quận 8: 4, TP. Thủ Đức: 4) với đầy đủ hình học `Point`, `LineString`, và vùng đệm `Polygon` 35m (`avoid_polygon`).<br>- **18 tọa độ Camera giao thông TTGT TP.HCM** (`traffic_cameras`) trong bán kính $<300\text{m}$ kèm hướng dẫn đối chiếu hợp pháp (không lấy stream lậu).<br>- Các hàm không gian Haversine: `calculateDistanceMeters`, `validateGeofence500m`, `findNearbyCameraWithin300m`, `findNearestHotspot`. | **Hoàn tất 100%** |
| **2. Động cơ Dự báo 1–3h & Ngôn ngữ Cảnh báo Kép** | `src/lib/forecast-engine.ts`<br>`src/app/api/alerts/route.ts` | - Kết nối trực tiếp **Open-Meteo API** (timeout `3.5s` + fallback nội bộ an toàn không làm trắng bản đồ) kết hợp **Mô hình điều hòa thủy triều trạm Phú An & Nhà Bè**.<br>- Hỗ trợ 4 kịch bản thực chiến: `peak_tide_rain` (Đỉnh triều 1.68m + Mưa lớn 17h30), `live` (Thực tế Live), `heavy_rain_only` (Mưa lớn cục bộ), `dry_safe` (Trời nắng ráo).<br>- Bộ sinh **Ngôn ngữ cảnh báo kép**: Dòng 1 Khoa học (`mm/h`, `m` triều, `%` xác suất, `~cm` độ sâu) + Dòng 2 Đời thường riêng cho **Xe máy** và **Ô tô** (tuân thủ nghiêm ngặt Rule 7). | **Hoàn tất 100%** |
| **3. Động cơ Kiểm duyệt Báo cáo Cộng đồng 5 Lớp** | `src/lib/verification-engine.ts`<br>`src/app/api/reports/route.ts` | - **Lớp 1:** Rate Limit $\le 5$ báo cáo/giờ/`device_hash`.<br>- **Lớp 2:** Khóa bán kính cứng **Geofence $\le 500\text{m}$** & sai số GPS $\le 150\text{m}$ (trả về `422 GEOFENCE_VIOLATION` nếu báo khống từ xa).<br>- **Lớp 3:** Kiểm tra ảnh chụp hiện trường & thời gian EXIF $\le 10$ phút.<br>- **Lớp 4:** Gom cụm không gian bán kính $150\text{m}$ và nâng lên `VERIFIED` khi có $\ge 3$ người xác nhận (hoặc khớp điểm đen đang mưa lớn/triều cao).<br>- **Lớp 5:** Cộng điểm uy tín thiết bị (`trust_score`) & áp dụng **TTL 90 phút** tự động hạ cấp + hỗ trợ nút `+1 Đúng, đang ngập` và `✅ Nước đã rút (0cm)`. | **Hoàn tất 100%** |
| **4. Động cơ Tìm Lộ trình Tránh ngập Đa phương tiện** | `src/lib/routing-engine.ts`<br>`src/app/api/route-plan/route.ts` | - Phân tách ngưỡng chịu ngập theo phương tiện: **Xe máy (`motorcycle` $\ge 20\text{cm}$)** vs **Ô tô (`car` $\ge 25\text{cm}$, khóa hẻm nhỏ, chỉ đi trục đường lớn)**.<br>- Kết hợp OSRM API với đồ thị đường vòng an toàn `safe_detour_geom`, trả về song songทั้ง `direct_flooded_route` (tuyến ngắn nhất cắt qua điểm ngập) và `recommended_safe_route` (lộ trình thay thế ít rủi ro ngập kèm số phút chênh lệch). | **Hoàn tất 100%** |
| **5. Giao diện Bản đồ WebGL & Hệ thống Component LibreUIUX** | `src/components/MapCanvas.tsx`<br>`src/components/TopStatusBar.tsx`<br>`src/components/VehicleToggle.tsx`<br>`src/components/AlertBottomSheet.tsx`<br>`src/components/RoutePlannerDrawer.tsx`<br>`src/components/CrowdReportModal.tsx`<br>`src/app/page.tsx` | - Bản đồ tương tác **MapLibre GL JS** toàn màn hình ($>86\%$ viewport), bảng màu **CVD-Safe** (`#10B981`, `#F59E0B`, `#F97316`, `#EF4444`), phân biệt nét đứt dự báo 1–3h vs nét liền đã xác minh, vẽ song song 2 lộ trình (`#EF4444` nét đứt vs `#0284C7`/`#2563EB` nét liền).<br>- Tích hợp đầy đủ 7 tinh chỉnh từ báo cáo Walkthrough (`F1.1` $\rightarrow$ `F3.3`): Vùng chạm tay ướt $\ge 48\times 48\text{px}$, phóng chữ `+12%` ở chế độ Ô tô (`F2.1`), nút mở rộng 1 chạm không cần vuốt (`F1.2`), nén ảnh Canvas `< 150KB` (`F3.1`), nút giả lập kiểm thử chặn Geofence $>3\text{km}$ ngay trên UI, lưu lộ trình đi làm vào `localStorage`, và Modal đồng ý GPS theo **Nghị định 13/2023/NĐ-CP**. | **Hoàn tất 100%** |

---

## 2. Kết Quả Kiểm Thử Kỹ Thuật (Typecheck, Production Build & Functional Verification)

1. **Kiểm tra kiểu tĩnh TypeScript (`npm run typecheck`):**
   - Kết quả: `tsc --noEmit` thành công 100% với **0 lỗi (Exit code: 0)**.
2. **Kiểm tra đóng gói Production (`npm run build`):**
   - Kết quả: `next build` biên dịch thành công toàn bộ trang tĩnh/động và 3 API Routes (`/api/alerts`, `/api/reports`, `/api/route-plan`) không có lỗi.
3. **Kiểm chứng tuân thủ Quy tắc An toàn & Pháp lý (`docs/RULES.md` Mục 7):**
   - Mọi cảnh báo trên `TopStatusBar`, `AlertBottomSheet`, `RoutePlannerDrawer` và `MapCanvas` đều hiển thị đầy đủ bộ 3: **Mức độ tin cậy (`%` xác suất / số người xác nhận) + Thời điểm cập nhật (`updated_at` & thời gian tự hạ cấp `expires_at`) + Nguồn dữ liệu (`source_attribution`)**.
   - Hoàn toàn không sử dụng từ ngữ khẳng định tuyệt đối (*"an toàn 100%"*, *"chắc chắn không ngập"*); sử dụng thuật ngữ chuẩn *"Lộ trình thay thế ít rủi ro ngập"*.

---

## Quyết Định Đã Chốt

1. **Kiến trúc Single-Canvas MapLibre GL JS kết hợp Glassmorphism (`backdrop-blur-md`):** Sử dụng nền bản đồ giảm bão hòa màu (*Desaturated Muted Basemap* sáng/tối) để làm nổi bật tuyệt đối 18 tuyến đường điểm đen ngập (`LineString` + `Polygon` buffer 35m), các điểm báo cáo cộng đồng và 2 tuyến lộ trình so sánh trực quan. *Lý do:* Giữ $>86\%$ diện tích màn hình cho bản đồ và đạt tốc độ phản hồi tức thì dưới trời mưa. *Phương án thay thế đã loại:* Giao diện chia nhiều tab danh sách rời rạc hoặc dùng Leaflet DOM chậm trên thiết bị di động.
2. **Nén ảnh hiện trường bằng HTML5 Canvas tại Client xuống `< 150KB` (`F3.1`) kèm Chế độ Kiểm thử Geofence trực tiếp:** Giúp gửi báo cáo ngập thành công trong $<1.5\text{s}$ trên mạng 4G yếu lúc mưa bão và cho phép Chủ dự án kiểm tra trực tiếp cơ chế chặn kẻ xấu báo cáo giả từ xa ($>3\text{km} > 500\text{m}$) ngay trên giao diện `CrowdReportModal`.
3. **Tự động thích ứng theo phương tiện (`Xe máy` vs `Ô tô`):** Khi chuyển sang chế độ `🚗 Ô tô`, hệ thống tự động nâng ngưỡng cảnh báo lên $\ge 25\text{cm}$, khóa các hẻm nhỏ trong thuật toán gợi ý lộ trình, đổi màu tuyến sang Xanh Chàm Đậm (`#2563EB`) và phóng to cỡ chữ trên thẻ thông tin thêm `+12%` (`F2.1`) để tài xế đọc rõ từ khoảng cách taplo.

## Câu Hỏi Mở Cho Chủ Dự Án

- Hiện tại không có câu hỏi chặn (blocking). Chủ dự án có thể trải nghiệm trực tiếp trên giao diện:
  1. Chuyển đổi 4 kịch bản thời tiết/triều cường trên thanh `TopStatusBar` (*Đỉnh triều + Mưa lớn 17h30*, *Thực tế Live*, *Mưa lớn cục bộ*, *Trời nắng ráo*).
  2. Bấm vào bất kỳ tuyến đường ngập nào để xem **Ngôn ngữ cảnh báo kép**, mở rộng **Timeline 6h & Camera TTGT**, hoặc bấm xác nhận chéo `(+1 Đúng, đang ngập)`.
  3. Mở **Tìm lộ trình tránh ngập**, lưu *"Lộ trình đi làm hằng ngày"* và mở **Báo ngập (`📸 Báo ngập`)** để thử cả 2 nút **"Đứng tại hiện trường (<500m)"** và **"Giả lập kẻ xấu ở xa (>3km)"**.

## Chuyển Giao / Rủi Ro

- **Chuyển giao sang Phase 5 (Kiểm thử chất lượng & Nghiệm thu):**
  - Toàn bộ mã nguồn Frontend & Backend MVP tại `/src` đã vượt qua `npm run typecheck` và `npm run build` 100%, sẵn sàng cho QA/Auditor kiểm tra nghiệm thu.
- **Rủi ro & Giải pháp giảm thiểu:**
  - *Rủi ro lưu trữ In-Memory của các báo cáo cộng đồng khi khởi động lại tiến trình Serverless:* Trong phạm vi MVP không chi phí hạ tầng (Rule 8), dữ liệu cụm báo cáo cộng đồng (`crowdClustersStore`) được lưu trên bộ nhớ Server/Edge kèm 2 cụm seed thực tế tại Nguyễn Xí (Bình Thạnh) và Huỳnh Tấn Phát (Quận 7). Khi nâng cấp lên môi trường Production quy mô lớn ở Sprint 2, chỉ cần trỏ adapter trong `src/lib/verification-engine.ts` sang bảng `crowd_reports` trên Supabase PostgreSQL/PostGIS như đã thiết kế trong `docs/03-architecture.md`.
