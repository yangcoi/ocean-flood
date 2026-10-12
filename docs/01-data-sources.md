# Báo Cáo Khảo Sát Nguồn Dữ Liệu & Khuyến Nghị Stack GIS TP.HCM

**Người phụ trách:** GIS Technical Consultant (`gis-technical-consultant`)  
**Dựa trên:** `docs/RULES.md`, `docs/00-brief.md`, `docs/00-plan.md`  
**Ngày lập:** 2026-10-12  
**Cập nhật:** 2026-10-12 (Bổ sung chiến lược tự lực, ngôn ngữ cảnh báo song song, routing tránh ngập, tọa độ camera & kiểm soát báo cáo cộng đồng)

---

## 1. Điều Tra & Đánh Giá Nguồn Dữ Liệu Theo Từng Lớp

Nguyên tắc bất di bất dịch của tư vấn GIS: **Không tô hồng dữ liệu** và **Tự lực 100% trong giai đoạn MVP** (không phụ thuộc xin phép hay hợp tác bên ngoài). Dưới đây là kết quả rà soát thực tế tại TP.HCM:

### Bảng tổng hợp nguồn dữ liệu

| Lớp dữ liệu | Tên nguồn & Đơn vị chủ quản | Cách truy cập | Định dạng | Tần suất cập nhật | Giấy phép / Pháp lý | Độ tin cậy | Chi phí | Quyết định cho MVP |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ngập lụt (Dự báo chủ động 1–3h)** | **Mô hình kết hợp của Ocean Flood**: Mưa dự báo (`Open-Meteo`) + Đỉnh triều (`Đài KTTV`) + Điểm đen lịch sử + Độ cao `DEM` | Tự tính toán trên Backend / Edge | JSON / GeoJSON | Cập nhật mỗi 30–60 phút | Hợp pháp 100% (dựa trên nguồn mở & công cộng) | Khá – Cao (cảnh báo sớm trước khi ngập xảy ra) | 0đ | **[SỬ DỤNG CHÍNH — DNA CỦA SẢN PHẨM]** |
| **Ngập lụt (Thời gian thực từ cộng đồng)** | **Hệ thống Crowdsource tự xây của Ocean Flood** (Có kiểm chứng ảnh EXIF + GPS ≤ 500m + Check chéo ≥ 3 người + Điểm uy tín) | Người dùng gửi trực tiếp trên Web PWA | JSON / GeoJSON + Ảnh nén | Thời gian thực (Real-time) | Dữ liệu do chính dự án sở hữu (tuân thủ NĐ 13/2023) | Cao (nhờ cơ chế chống spam đa lớp) | 0đ | **[SỬ DỤNG CHÍNH]** |
| **Ngập lụt (Lịch sử & Điểm đen)** | **Danh mục 18–35 điểm ngập thường xuyên** — Sở Xây dựng TP.HCM công bố hàng năm | Báo cáo PDF / Cổng dữ liệu mở TP.HCM (`opendata.hochiminhcity.gov.vn`) | PDF / Bảng Excel / Báo chí $\rightarrow$ Số hóa sang GeoJSON | Cập nhật định kỳ 6–12 tháng | Dữ liệu công bố báo chí & hành chính | Cao về danh sách tuyến đường | 0đ | **[SỬ DỤNG LÀM NỀN TẢNG ĐIỂM ĐEN & TIMELINE NGẬP]** |
| **Triều cường (Quan trắc & Dự báo)** | **Đài Khí tượng Thủy văn khu vực Nam Bộ** (Trạm Phú An & Nhà Bè) + Mô hình thiên văn | Bản tin công cộng (`kttv-nb.gov.vn` / `nchmf.gov.vn`) + Tính toán chu kỳ triều | HTML / Văn bản $\rightarrow$ JSON | Ngày 2 lần (đỉnh triều sáng/chiều) | Bản tin công cộng (Ghi rõ nguồn trích dẫn) | Rất cao | 0đ | **[SỬ DỤNG CHÍNH]** |
| **Mưa (Dự báo & Thời tiết mở)** | **Open-Meteo Weather API** (`open-meteo.com`) | REST API miễn phí (không cần API Key) | JSON (Precipitation, Rain rate) | 1 giờ / lần | ODbL (Ghi công nguồn) | Khá – Cao | 0đ (Free tier 10.000 call/ngày) | **[SỬ DỤNG CHÍNH]** |
| **Lộ trình & Điều hướng tránh ngập** | **OSRM / Valhalla** chạy trên dữ liệu đường **OpenStreetMap (OSM)** | REST API / Self-host hoặc Public instance + Thuật toán cắt tránh polygon ngập | GeoJSON LineString | Theo thời gian thực khi người dùng tìm đường | ODbL / BSD (Hợp pháp 100%) | Cao | 0đ | **[SỬ DỤNG CHÍNH CHO GỢI Ý LỘ TRÌNH THAY THẾ]** |
| **Camera giao thông (Vị trí)** | **Danh mục tọa độ Camera TTGT TP.HCM** (Cổng dữ liệu mở TP.HCM) | File tĩnh GeoJSON (Chỉ lấy tọa độ, **không** lấy stream video lậu) | GeoJSON Point | Cố định | Dữ liệu mở (Chỉ hiển thị vị trí & hướng dẫn mở app TTGT) | Rất cao | 0đ | **[SỬ DỤNG ĐỂ HIỂN THỊ TỌA ĐỘ CAMERA]** |
| **Bản đồ nền & Ranh giới** | **OpenStreetMap (OSM)** + **GADM Vietnam** | Vector Tiles / GeoJSON | PBF / GeoJSON | Liên tục | ODbL / CC-BY | Cao | 0đ | **[SỬ DỤNG CHÍNH]** |
| **Độ cao địa hình (DEM)** | **NASA SRTM 30m** hoặc **Copernicus GLO-30** | OpenTopography / Earthdata | GeoTIFF | Cố định | Open Data | Đủ dùng phân tích vùng trũng | 0đ | **[SỬ DỤNG PHỤ TRỢ]** |
| **Các nguồn bên thứ ba đóng** | **UDI Maps**, **nuoclen.com**, **FEDS (`thongtinthoatnuoc`)**, **Vrain**, **Stream video TTGT** | Không có API mở công khai | Đóng | - | Độc quyền / Cấm scrape | - | Rủi ro chặn IP & pháp lý | **[LOẠI BỎ TRONG MVP — KHÔNG HỢP TÁC / KHÔNG CRAWL LẬU]** |

---

## 2. Điểm Khác Biệt Cốt Lõi (DNA) Về Dữ Liệu Của Ocean Flood

Thay vì sao chép mô hình thụ động ("ngập rồi mới báo") của UDI Maps hay nuoclen.com, kiến trúc dữ liệu của Ocean Flood được thiết kế xoay quanh **tính chủ động và ngôn ngữ kép**:

1. **Dự báo ngập trước 1–3 tiếng (Proactive Forecasting):**
   - Kết hợp dữ liệu mưa dự báo (`mm/h`) + đỉnh triều (`m`) + hệ số trũng của từng tuyến đường lịch sử để tính ra **Xác suất ngập (%)** và **Độ sâu ước tính (cm)** trước khi cơn mưa/đỉnh triều ập đến.
2. **Ngôn ngữ cảnh báo kép (Khoa học + Đời thường):**
   - Hệ thống tự động biên dịch chỉ số kỹ thuật sang lời khuyên thực tế cho người đi xe máy/ô tô:
     - *Dòng khoa học:* `"Dự báo mưa 45mm/h + Đỉnh triều 1.65m (Trạm Phú An) lúc 17:30 — Xác suất ngập 78%, sâu ~30cm"`
     - *Dòng đời thường:* `"⚠️ Chiều nay mưa to trùng lúc nước sông dâng cao. Đường Nguyễn Xí khả năng cao ngập ngang ống pô xe máy từ 17h–19h, dễ chết máy!"`
3. **Gợi ý lộ trình thay thế tránh ngập (Flood-Aware Routing):**
   - Khi một đoạn đường có xác suất ngập cao hoặc đã có báo cáo ngập xác thực, đoạn đường đó được gán trọng số phạt (penalty/avoid polygon) trên đồ thị đường bộ OSM để gợi ý tuyến đường vòng an toàn hơn cho người dùng.

---

## 3. So Sánh Kiến Trúc Stack GIS: Open-Source (FOSS4G) vs Esri

| Tiêu chí | Phương án A: Open Source (FOSS4G) | Phương án B: Esri Ecosystem (ArcGIS Online) |
| :--- | :--- | :--- |
| **Thành phần cốt lõi** | **MapLibre GL JS** + **PostGIS / SpatiaLite** + **OSM Tiles** + **OSRM / Valhalla (Routing)** | **ArcGIS Maps SDK for JS** + **ArcGIS Online Network Analyst** |
| **Chi phí bản quyền** | **0 VNĐ vĩnh viễn**. | Tốn phí Credits rất lớn, đặc biệt khi tính toán Routing tránh vùng ngập cho nhiều người dùng. |
| **Khả năng tùy biến thuật toán** | Dễ dàng can thiệp vào trọng số đường đi (custom weights) để né điểm ngập và xây dựng hệ thống chấm điểm uy tín cộng đồng. | Phụ thuộc vào dịch vụ đóng của Esri. |
| **Hiệu năng di động 4G** | **Siêu nhẹ**, tải dưới 2 giây. | Nặng, khó tối ưu PWA. |

### 🏆 KHUYẾN NGHỊ CỦA CHUYÊN GIA:
> **Chọn 100% Phương án A (Open Source — FOSS4G):**
> * **Bản đồ Frontend:** `MapLibre GL JS` (hỗ trợ hiển thị Vector Tiles, polygon vùng ngập, tuyến đường gợi ý mượt mà trên di động).
> * **Cơ sở dữ liệu & Backend:** `PostGIS` (Supabase/Neon free tier) để lưu trữ điểm ngập, báo cáo cộng đồng, lịch sử uy tín thiết bị.
> * **Routing Engine:** Kết hợp `OSRM` / `Valhalla` hoặc thuật toán tìm đường trên đồ thị OSM của 4 quận MVP có gắn trọng số né các đoạn đường đang/sắp ngập.

---

## 4. Top 5 Rủi Ro Dữ Liệu Lớn Nhất & Chiến Lược Giảm Thiểu

### Rủi ro 1: Báo cáo giả mạo / Báo cáo rác từ người dùng (Spam & Fake Reports)
* **Chiến lược giảm thiểu 5 lớp (Strict Verification):**
  1. **Bắt buộc hình ảnh thực tế & Kiểm tra EXIF:** Phải chụp ảnh trực tiếp trên web app hoặc ảnh có thời gian chụp (EXIF timestamp) lệch không quá **10 phút** so với thời điểm gửi.
  2. **Kiểm tra khoảng cách GPS (Geofencing):** Tọa độ GPS thực của thiết bị phải nằm trong bán kính **$\le 500\text{m}$** so với điểm báo ngập (không cho phép ngồi ở nhà chấm báo ngập ở quận khác).
  3. **Kiểm chứng chéo (Cross-validation):** Báo cáo mới chỉ hiện trạng thái *"Chưa xác minh (1 người báo)"*. Khi có **$\ge 3$ người** (khác device fingerprint) cùng xác nhận trong bán kính gần hoặc trùng khớp với điều kiện mưa/triều đang cao $\rightarrow$ nâng lên *"Đã xác minh"*.
  4. **Hệ thống Điểm uy tín (Reputation Score):** Thiết bị báo đúng nhiều lần (được người khác xác nhận) sẽ có trọng số uy tín cao hơn; thiết bị báo sai/bị gắn cờ spam sẽ bị khóa quyền báo cáo hoặc giảm trọng số.
  5. **Rate Limit:** Giới hạn tối đa 5 báo cáo/giờ trên mỗi Device Fingerprint.

### Rủi ro 2: Dữ liệu bị "chết" hoặc quá cũ (Stale Data)
* **Chiến lược giảm thiểu:** Mọi điểm ngập đều có **TTL (Time-To-Live) = 90 phút**. Nếu sau 90 phút không có mưa tiếp diễn và không có người dùng nào bấm *"Vẫn còn ngập"*, hoặc có từ 2 người bấm *"Đã rút nước"*, hệ thống tự động hạ mức cảnh báo và làm mờ dần trên bản đồ.

### Rủi ro 3: Gợi ý lộ trình thay thế dẫn vào hẻm cụt hoặc đường quá nhỏ
* **Chiến lược giảm thiểu:** Khi tính toán lộ trình thay thế trên dữ liệu OSM, chỉ cho phép điều hướng qua các tuyến đường chính/đường xe máy đi thông thoáng (`primary`, `secondary`, `tertiary`, `residential` có chiều rộng đảm bảo), loại bỏ các hẻm siêu nhỏ (`service`, `footway`, `alley` hẹp) để tránh dẫn người dùng vào hẻm cụt ngập nặng hơn.

### Rủi ro 4: Lệch hệ tọa độ (CRS)
* **Chiến lược giảm thiểu:** Chuẩn hóa toàn bộ dữ liệu đầu vào về **WGS84 (EPSG:4326)** trước khi nạp vào CSDL.

### Rủi ro 5: Quá tải truy cập giờ cao điểm mưa ngập
* **Chiến lược giảm thiểu:** Sử dụng **CDN Caching (Cloudflare/Vercel)** cho các bản tin dự báo và danh sách điểm ngập chung (cache 30–60 giây), giảm tải tối đa cho Database.

---

## 5. Quyết Định Đã Chốt
1. **Tự lực 100% ở giai đoạn MVP:** Không xin phép, không phụ thuộc và không crawl lậu từ UDI Maps, nuoclen.com, Vrain hay stream video TTGT.
2. **Định vị khác biệt của sản phẩm:** Kết hợp **Dự báo sớm (1–3h)** + **Ngôn ngữ kép (Khoa học & Đời thường)** + **Gợi ý lộ trình tránh ngập** + **Cảnh báo theo lộ trình cá nhân**.
3. **Kiểm soát chặt báo cáo cộng đồng:** Bắt buộc Ảnh chụp + Khớp thời gian EXIF + Khớp vị trí GPS ($\le 500\text{m}$) + Kiểm tra chéo ($\ge 3$ người) + Điểm uy tín.
4. **Camera giao thông:** Chỉ hiển thị tọa độ các camera trên bản đồ để người dùng đối chiếu vị trí và mở ứng dụng chính thức xem khi cần.

---

## 6. Câu Hỏi Mở Cho Chủ Dự Án
1. Khi người dùng báo cáo ngập kèm ảnh, bạn có muốn cho phép họ chọn nhanh mức độ ngập bằng hình ảnh trực quan (ví dụ: *"Ngập mắt cá chân / bánh xe (~15cm)"*, *"Ngập ống pô xe máy (~30cm)"*, *"Ngập yên xe / chết máy (>50cm)"*) để vừa dễ chọn vừa khớp với ngôn ngữ đời thường không?
2. Với tính năng gợi ý lộ trình thay thế, ở bản MVP chúng ta sẽ ưu tiên tối ưu cho **Người đi xe máy** trước hay làm song song cho cả **Xe máy & Ô tô** (vì ngưỡng ngập chết máy của 2 phương tiện khác nhau)?

---

## 7. Chuyển Giao / Rủi Ro
* **Bàn giao:** Chuyển giao toàn bộ thông số nguồn dữ liệu, thuật toán dự báo sớm, quy tắc kiểm duyệt báo cáo cộng đồng và yêu cầu routing cho **Phase 2 (Product Manager & UX/Software Architect)** để thiết kế PRD và kiến trúc hệ thống chi tiết.
