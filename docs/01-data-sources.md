# Báo Cáo Khảo Sát Nguồn Dữ Liệu & Khuyến Nghị Stack GIS TP.HCM

**Người phụ trách:** GIS Technical Consultant (`gis-technical-consultant`)  
**Dựa trên:** `docs/RULES.md`, `docs/00-brief.md`, `docs/00-plan.md`  
**Ngày lập:** 2026-10-12  

---

## 1. Điều Tra & Đánh Giá Nguồn Dữ Liệu Theo Từng Lớp

Nguyên tắc bất di bất dịch của tư vấn GIS: **Không tô hồng dữ liệu**. Một hệ thống GIS cảnh báo sẽ sụp đổ nếu dữ liệu đầu vào là rác hoặc bị cắt nguồn đột ngột. Dưới đây là kết quả rà soát thực tế tại TP.HCM:

### Bảng tổng hợp nguồn dữ liệu

| Lớp dữ liệu | Tên nguồn & Đơn vị chủ quản | Cách truy cập | Định dạng | Tần suất cập nhật | Giấy phép / Pháp lý | Độ tin cậy | Chi phí | Tình trạng kiểm chứng |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ngập lụt (Thời gian thực)** | **UDI Maps** — Công ty TNHH MTV Thoát nước Đô thị TP.HCM (UDC) | App nội bộ / App Store / Google Play. **Không có REST API công khai**. Chỉ có thể Reverse-engineer endpoint mobile app hoặc hợp tác văn bản. | JSON / GeoJSON nội bộ | Theo sự kiện mưa/ngập | Độc quyền của UDC. Cấm khai thác lại khi chưa xin phép. | Cao (có cảm biến & nhân viên đo tại chỗ) | 0đ nếu crawl lậu (rủi ro bị chặn); Thỏa thuận nếu xin hợp tác | **[ĐÃ XÁC MINH KHÔNG CÓ PUBLIC API]** |
| **Ngập lụt (Lịch sử & Điểm đen)** | **Danh mục 18-35 điểm ngập thường xuyên** — Sở Xây dựng TP.HCM công bố hàng năm | Báo cáo PDF / Cổng dữ liệu mở TP.HCM (`opendata.hochiminhcity.gov.vn`) | PDF / Bảng Excel / Báo chí | Cập nhật định kỳ 6-12 tháng | Dữ liệu công bố báo chí & hành chính | Cao về danh sách tuyến đường, thấp về thời gian thực | 0đ | **[ĐÃ XÁC MINH CÓ THỂ SỐ HÓA THÀNH FILE TĨNH]** |
| **Triều cường (Quan trắc & Dự báo)** | **Đài Khí tượng Thủy văn khu vực Nam Bộ** (Trạm Phú An & Nhà Bè) | Website `kttv-nb.gov.vn` hoặc Cổng Tổng cục KTTV `nchmf.gov.vn` | Bảng tin HTML / Báo cáo văn bản | Ngày 2 lần (dự báo đỉnh triều sáng/chiều) | Bản tin công cộng (Cần ghi rõ trích dẫn nguồn) | Rất cao | 0đ | **[XÁC MINH: CÓ THỂ CRAWL BẢN TIN ĐỈNH TRIỀU HOẶC DÙNG MÔ HÌNH THIÊN VĂN]** |
| **Mưa (Quan trắc tự động)** | **Hệ thống Vrain** (`vrain.vn`) / Trạm mưa tự động của Đài KTTV | Web scraping / Cổng quan trắc địa phương | HTML / JSON | 10 – 30 phút/lần khi có mưa | Thuộc đơn vị đo đạc KTTV | Cao | 0đ (nếu crawl trang công khai) | **[CHƯA XÁC MINH API CHÍNH THỨC]**: Cần kiểm tra endpoint ngầm trên web vrain.vn. |
| **Mưa (Dự báo & Thời tiết mở)** | **Open-Meteo Weather API** (`open-meteo.com`) | REST API miễn phí (không cần API Key) | JSON (Precipitation, Rain rate) | 1 giờ / lần (Dự báo độ phân giải cao) | Open Database License (ODbL) / Non-commercial & Free tier thương mại nhỏ | Trung bình - Khá (dữ liệu mô hình vệ tinh GFS/ECMWF) | 0đ (Free tier 10.000 call/ngày) | **[ĐÃ XÁC MINH SẴN SÀNG TÍCH HỢP]** |
| **Kẹt xe (Giao thông)** | **Cổng thông tin giao thông TP.HCM** (`giaothong.hochiminhcity.gov.vn` / app TTGT) | Web / Mobile app. **Không cung cấp API mở cho bên thứ ba**. | HTML / Stream camera RTSP/HLS | Thời gian thực (Camera & cảnh báo vận tốc) | Thuộc Sở GTVT TP.HCM | Rất cao | 0đ nếu scrape; Cực kỳ dễ bị chặn IP | **[ĐÃ XÁC MINH KHÔNG CÓ PUBLIC API]** |
| **Bản đồ nền (Đường sá)** | **OpenStreetMap (OSM)** qua Geofabrik / Overpass API | Tải file `.osm.pbf` hoặc gọi qua Overpass | GeoJSON / PBF / Vector Tiles | Cập nhật liên tục từ cộng đồng | ODbL (Bắt buộc ghi công: © OpenStreetMap contributors) | Cao tại trung tâm TP.HCM | 0đ | **[ĐÃ XÁC MINH DÙNG ĐƯỢC 100%]** |
| **Ranh giới hành chính** | **GADM Vietnam** / OSM Administrative Boundaries | Tải trực tiếp file ranh giới Quận/Huyện/Phường | GeoJSON / Shapefile / Geopackage | Cố định theo niên giám | Phi thương mại / CC-BY | Rất cao | 0đ | **[ĐÃ XÁC MINH CÓ THỂ TẢI VÀ NẠP CỐ ĐỊNH]** |
| **Độ cao địa hình (DEM)** | **NASA SRTM 30m** hoặc **Copernicus GLO-30** | Tải qua OpenTopography hoặc Earthdata | GeoTIFF (Raster) | Cố định | Open Data | Đủ dùng để phân tích vùng trũng tự nhiên (sai số 1-3m) | 0đ | **[ĐÃ XÁC MINH TẢI MIỄN PHÍ ĐƯỢC]** |

---

## 2. So Sánh Kiến Trúc Stack GIS: Open-Source (FOSS4G) vs Esri

Là một chuyên gia tư vấn trung lập, tôi đưa ra bảng so sánh sòng phẳng giữa hệ sinh thái mã nguồn mở và hệ sinh thái thương mại của Esri cho bài toán này:

| Tiêu chí | Phương án A: Open Source (FOSS4G) | Phương án B: Esri Ecosystem (ArcGIS Online) |
| :--- | :--- | :--- |
| **Thành phần cốt lõi** | **MapLibre GL JS** (Bản đồ web) + **PostGIS / SQLite-SpatiaLite** (CSDL không gian) + **OpenStreetMap Tiles** (Nền) | **ArcGIS Maps SDK for JavaScript** + **ArcGIS Online Hosted Feature Services** |
| **Chi phí bản quyền** | **0 VNĐ vĩnh viễn**. Hoàn toàn tự do sử dụng. | Miễn phí trial hoặc Developer tier rất hạn hẹp; nhanh chóng phát sinh chi phí Credits ($$$) khi có lưu lượng truy cập cao hoặc lưu trữ feature. |
| **Khả năng làm chủ & Tùy biến** | Toàn quyền kiểm soát mã nguồn, không bị khóa vào nhà cung cấp (No Vendor Lock-in). Dễ dàng deploy lên Vercel/Cloudflare. | Bị phụ thuộc chặt chẽ vào hạ tầng và tài khoản của Esri. |
| **Mức độ phức tạp cho 1 người** | Cần hiểu cơ bản về GeoJSON, hệ tọa độ (EPSG:4326 vs EPSG:3857) và styling map. Nhưng thư viện MapLibre/Leaflet cực nhẹ và có AI hỗ trợ viết code rất nhanh. | Giao diện đồ họa cấu hình sẵn nhưng viết code mở rộng khá cồng kềnh, khó tối ưu PWA siêu nhẹ. |
| **Hiệu năng trên thiết bị di động 4G** | **Cực kỳ nhẹ (Vector/GeoJSON nén gzip chỉ vài chục KB)**, load < 2 giây. | Bundle JS của ArcGIS SDK khá nặng (thường > 500KB - 1MB), tải chậm trên mạng 3G/4G chập chờn. |

### 🏆 KHUYẾN NGHỊ CỦA CHUYÊN GIA:
> **Chọn 100% Phương án A (Open Source — FOSS4G):**
> * **Bản đồ Frontend:** `MapLibre GL JS` (hiệu năng đồ họa WebGL đỉnh cao, mượt mà trên điện thoại) hoặc `Leaflet` (siêu nhẹ, đơn giản nhất).
> * **Cơ sở dữ liệu:** `PostGIS` (trên free tier của Supabase hoặc Neon) HOẶC thậm chí file tĩnh `GeoJSON` nén trên Cloudflare CDN cho giai đoạn đầu của MVP (chi phí hạ tầng = 0đ, chịu tải hàng trăm nghìn lượt truy cập không sập).
> * **Bản đồ nền:** Vector tile miễn phí từ `Carto Positron / OSM` hoặc `Protomaps`.

---

## 3. Top 5 Rủi Ro Dữ Liệu Lớn Nhất & Chiến Lược Giảm Thiểu

### Rủi ro 1: Không có API ngập thời gian thực chính thức (RỦI RO TỬ HUYỆT)
* **Thực trạng:** Cả UDI Maps và Sở Xây dựng đều không mở API cho bên ngoài. Nếu cố gắng cào dữ liệu (scrape) từ mobile app của họ, hệ thống có thể bị chặn IP hoặc đối mặt với rủi ro pháp lý.
* **Chiến lược giảm thiểu (Tiered Fallback Strategy):**
  - **Tier 1 (Mô hình hóa Điểm ngập tĩnh - Đã kiểm chứng):** Số hóa danh sách ~30 tuyến đường thường xuyên ngập nước tại 4 quận (Bình Thạnh: Nguyễn Xí, Ung Văn Khiêm, Quốc Hương; Q7: Huỳnh Tấn Phát, Trần Xuân Soạn...).
  - **Tier 2 (Kích hoạt theo Thủy văn):** Kết hợp trạm đo mưa Open-Meteo và lịch triều cường. *Quy tắc:* Nếu [Mưa > 30mm/h] HOẶC [Mực nước triều trạm Phú An/Nhà Bè $\ge$ 1.60m (Báo động 3)] $\rightarrow$ Tự động bật cảnh báo ĐỎ trên các tuyến đường điểm đen tương ứng.
  - **Tier 3 (Báo cáo cộng đồng có kiểm duyệt):** Cho phép người dân bấm xác nhận "Đường này đang ngập" ngay tại chỗ để bổ sung độ tươi cho dữ liệu.

### Rủi ro 2: Dữ liệu bị "chết" hoặc quá cũ (Stale Data)
* **Thực trạng:** Mưa đã tạnh và nước đã rút nhưng bản đồ vẫn báo ngập, khiến người dân mất lòng tin và xóa app.
* **Chiến lược giảm thiểu:** Bắt buộc mọi điểm ngập phải có thuộc tính **TTL (Time-To-Live)**. Nếu sau 90 phút không có dữ liệu mưa tiếp diễn hoặc không có xác nhận mới từ người dùng, hệ thống tự động hạ mức cảnh báo từ Đỏ $\rightarrow$ Vàng $\rightarrow$ Bình thường và hiển thị nhãn: *"Cập nhật cách đây X phút"*.

### Rủi ro 3: Lệch hệ tọa độ (Coordinate Reference System - CRS)
* **Thực trạng:** Dữ liệu hành chính Việt Nam thường lưu ở hệ VN-2000 (kinh tuyến trục 105°45' TP.HCM), trong khi bản đồ web quốc tế chạy WGS84 (EPSG:4326) hoặc Web Mercator (EPSG:3857). Chuyển đổi sai sẽ làm điểm ngập rơi xuống sông hoặc lệch 200–500m.
* **Chiến lược giảm thiểu:** Chuẩn hóa toàn bộ dữ liệu đầu vào về **WGS84 (EPSG:4326)** ngay tại khâu ETL trước khi lưu vào CSDL.

### Rủi ro 4: Báo cáo giả mạo từ người dùng (Vandalism / Spam)
* **Thực trạng:** Ai đó cố tình bấm báo ngập hàng loạt ở một khu vực khô ráo để câu view hoặc gây hoang mang.
* **Chiến lược giảm thiểu:** 
  - Giới hạn tần suất theo thiết bị (Device Fingerprint / Rate Limit).
  - Bắt buộc kiểm tra Geolocation (chỉ cho báo cáo nếu khoảng cách GPS của thiết bị cách điểm báo cáo < 500m).
  - Điểm báo cáo của người dùng phải hiển thị huy hiệu *"Chưa kiểm chứng"* cho đến khi có ít nhất 3 người khác cùng xác nhận.

### Rủi ro 5: Vượt ngưỡng băng thông / Chi phí ẩn khi người truy cập tăng vọt lúc bão
* **Thực trạng:** Khi triều cường kết hợp mưa bão, hàng chục nghìn người cùng mở web trong 15 phút, database bị nghẽn (connection pool limit) hoặc tốn tiền egress.
* **Chiến lược giảm thiểu:** Sử dụng kiến trúc **Static Cache / CDN Caching**. Dữ liệu GeoJSON toàn bộ điểm ngập của 4 quận được build sẵn và lưu đệm trên Cloudflare CDN với thời gian cache 60 giây. 100.000 người truy cập chỉ gọi vào CDN, database gốc chỉ chịu 1 request/phút!

---

## 4. Quyết Định Đã Chốt
1. **Stack GIS được lựa chọn:** **FOSS4G (MapLibre GL JS + PostGIS + OpenStreetMap)**. Loại bỏ hoàn toàn phương án Esri để bảo toàn ngân sách 0đ và hiệu năng di động.
2. **Chiến lược nguồn ngập MVP:** Tạm thời **không phụ thuộc vào reverse-engineer UDI Maps** để tránh rủi ro pháp lý/bị chặn. Áp dụng chiến lược kết hợp: **Dữ liệu điểm đen lịch sử + Kích hoạt theo điều kiện Mưa/Triều cường + Xác thực cộng đồng**.
3. **Chuẩn tọa độ bắt buộc:** **EPSG:4326 (WGS84)** cho dữ liệu lưu trữ và **EPSG:3857** cho hiển thị bản đồ.

---

## 5. Câu Hỏi Mở Cho Chủ Dự Án
1. Bạn có muốn nhóm nghiên cứu tích hợp thêm lớp "Camera giao thông công cộng" (xem ảnh chụp tĩnh từ các giao lộ lúc mưa) vào giai đoạn mở rộng không?
2. Bạn có người quen hoặc nhóm cộng đồng nào ở 4 quận trên (Bình Thạnh, Q7, Q8, Thủ Đức) sẵn sàng tham gia thử nghiệm làm người báo cáo điểm ngập ban đầu không?

---

## 6. Chuyển Giao / Rủi Ro
* **Bàn giao:** Chuyển giao bảng khảo sát này cho **Legal Compliance Checker (Task 1.2)** để đánh giá kỹ về điều khoản bản quyền OpenStreetMap, disclaimer trách nhiệm dân sự khi cảnh báo thiên tai và quy định dữ liệu vị trí người dùng tại Việt Nam.
