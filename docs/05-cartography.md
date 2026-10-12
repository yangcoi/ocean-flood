# Thiết Kế Bản Đồ Học & Ký Hiệu Không Gian (GIS Cartography & Map Symbology Spec)

**Người phụ trách:** GIS Cartography Designer (`agency-cartography-designer`)  
**Dựa trên:** `docs/RULES.md`, `docs/01-spatial-requirements.md`, `docs/02-prd.md`  
**Ngày lập:** 2026-10-12  

---

## 1. Triết Lý Thiết Kế Bản Đồ Học & Quyết Định Nền Bản Đồ (Basemap Decisions)

### 1.1. Bối cảnh sử dụng thực tế (Field Conditions)
Người dùng TP.HCM xem bản đồ trong hai điều kiện ánh sáng khắc nghiệt:
- **Ngoài trời mưa lớn / ban đêm / dưới tán cây tối:** Màn hình điện thoại dính nước mưa, người lái xe máy nhìn qua lớp kính mũ bảo hiểm mờ nước. Cần độ tương phản cực cao (High Contrast), đường viền (casing) sắc nét và kích thước ký hiệu lớn.
- **Ngoài trời nắng gắt (trưa/chiều trước cơn mưa hoặc triều cường mùa khô):** Độ chói màn hình cao làm nhạt các màu pastel. Cần độ bão hòa màu (saturation) cao và viền đen/trắng tách nền rõ rệt.
- **An toàn cho người mù màu (CVD-Safe — Deuteranopia / Protanopia):** Không bao giờ chỉ dùng cặp màu Xanh lá – Đỏ đơn thuần để phân biệt mức độ nguy hiểm. Bắt buộc kết hợp **Mã hóa đa biến (Redundant Encoding)**: Màu sắc (Luminance + Hue dịch chuyển từ Xanh Lam/Ngọc $\rightarrow$ Vàng Hổ Phách $\rightarrow$ Cam Đậm $\rightarrow$ Đỏ Tím/Đỏ Thẫm) + Hình dạng/Biểu tượng (`🛞`, `⚠️`, `⛔`) + Kiểu nét (Nét liền, Nét đứt, Viền kép) + Độ dày nét (`line-width`).

### 1.2. Quyết định công nghệ Basemap & Styling Engine
| Hạng mục | Quyết định chọn | Lý do chọn | Phương án thay thế đã loại |
| :--- | :--- | :--- | :--- |
| **Map Rendering Engine** | **MapLibre GL JS** (Vector Tiles `EPSG:3857`) | Open-source 100%, hỗ trợ WebGL render 60fps, hỗ trợ `data-driven styling` (biểu thức `interpolate`, `step`, `match`), tải nhẹ $< 3\text{s}$ trên 4G. | **Leaflet** (Render DOM/Canvas chậm khi có nhiều `LineString` có viền casing phức tạp và xoay bản đồ kém mượt); **Mapbox GL JS v2+** (Thu phí theo lượt tải). |
| **Basemap Palette (Bảng màu nền)** | **Desaturated Muted Basemap** (Nền xám tro nhạt `#F1F5F9` ban ngày / Xám than `#0F172A` ban đêm, đường giao thông nền màu trung tính `#CBD5E1` / `#334155`) | Triệt tiêu nhiễu thị giác (visual clutter), nhường 100% độ nổi bật (visual hierarchy) cho lớp cảnh báo ngập và lộ trình. Tránh xung đột với màu xanh/vàng/cam/đỏ của dữ liệu ngập. | **Google Maps / OSM Standard Raster Tiles** (Có sẵn màu vàng/cam cho đường quốc lộ và màu xanh cho công viên/sông ngòi, gây nhầm lẫn nghiêm trọng với màu cảnh báo ngập Cấp 1–2). |
| **Hệ màu cảnh báo (Color Ramp)** | **CVD-Aware Sequential/Diverging Palette + Dual Casing** | Giữ chuẩn nhận diện của PRD (`#10B981`, `#F59E0B`, `#F97316`, `#EF4444`) nhưng tinh chỉnh **Outline/Casing có độ chênh lệch độ sáng (Luminance Step)** rõ rệt và gắn kèm Pattern/Icon để người mù màu Đỏ-Lục phân biệt được 100%. | **Bảng màu Cầu vồng (Rainbow/Jet)** (Không có thứ tự độ sáng tự nhiên, gây lóa mắt và mù màu không đọc được). |

---

## 2. Bảng Màu & Ký Hiệu 4 Cấp Độ Ngập (Flood Severity Symbology)

> **Lưu ý tuân thủ `RULES.md` (Mục 7):** Mọi lớp hiển thị trên bản đồ khi bấm vào (Popup/Bottom Sheet) hoặc trên Chú giải (Legend) đều phải hiển thị rõ **Mức độ tin cậy**, **Thời điểm cập nhật (`updated_at`)**, và **Nguồn dữ liệu**. Tuyệt đối không dùng từ khẳng định tuyệt đối như *"An toàn 100%"* hay *"Chắc chắn không ngập"*.

### 2.1. Ma trận màu sắc, độ dày nét & mã hóa kép (CVD-Safe & Outdoor-Readable)

| Cấp độ ngập | Độ sâu ước tính | Mã màu Fill / Core (`Hex`) | Mã màu Viền Casing (Light / Dark Mode) | Độ sáng tương đối ($L^*$) | Ký hiệu & Hình học (`LineString` + `Badge`) | Nhãn trạng thái (Không khẳng định tuyệt đối) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cấp 0: Bình thường (Chưa ghi nhận ngập)** | $0\text{cm}$ | **Xanh Ngọc Lam** `#059669` *(hoặc ẩn trên nền để giảm nhiễu, chỉ hiện khi tra cứu tuyến)* | `#ECFDF5` / `#064E3B` | $L^* \approx 56$ | Nét mảnh `3px` (chỉ bật khi người dùng chọn xem điểm đen lịch sử đang khô ráo). Badge: `✓` (Tròn) | *"Chưa ghi nhận ngập (Theo dữ liệu hiện tại)"* |
| **Cấp 1: Ngập nhẹ / Chớm ngập** | $10 - 20\text{cm}$ *(Bánh xe ~15cm)* | **Vàng Hổ Phách** `#F59E0B` | Viền tối `#78350F` (`1.5px`) giúp nổi trên nền sáng | $L^* \approx 75$ (Sáng nhất) | Nét vừa `6px` + Casing `9px`. Badge hình thoi vàng có icon `🛞` / `~15cm` | *"Dự báo / Ghi nhận ngập nhẹ (~15cm) — Đi chậm"* |
| **Cấp 2: Ngập trung bình (Nguy hiểm)** | $20 - 35\text{cm}$ *(Ống pô / Chạm gầm ~30cm)* | **Cam Đậm** `#EA580C` *(tăng độ đậm so với `#F97316` để tách biệt rõ với Vàng)* | Viền trắng `#FFFFFF` (`2px`) + Viền ngoài `#431407` | $L^* \approx 52$ (Trung bình) | Nét dày `8px` + Casing `12px`. Kèm mũi tên/sọc cảnh báo. Badge tam giác `⚠️` / `~30cm` | *"Nguy cơ ngập ngang ống pô / chạm gầm (~30cm) — Nên tránh"* |
| **Cấp 3: Ngập sâu (Tê liệt)** | $> 35 - 50\text{cm+}$ *(Lút yên / Quá đèn pha >45cm)* | **Đỏ Thẫm Ánh Tím** `#DC2626` (Core) + Tâm `#991B1B` | Viền trắng phát sáng `#FFFFFF` (`2.5px`) + Vùng đệm `#EF4444` (`opacity 0.25`) | $L^* \approx 38$ (Tối & Đậm nhất) | Nét cực dày `10px` + Casing `15px` + Họa tiết gạch chéo (`line-pattern` sọc trắng-đỏ). Badge bát giác `⛔` / `>45cm` | *"Cảnh báo ngập rất sâu (>45cm) — Khuyến cáo không đi vào"* |

### 2.2. Phân biệt trực quan: Dự báo (1–3h tới) vs. Báo cáo cộng đồng (Chưa xác minh vs. Đã xác minh)

Để người dùng phân biệt tức thì đâu là **Dự báo mô hình (tương lai 1–3h)** và đâu là **Ngập thực tế tại hiện trường (Crowd Report)** cùng mức độ tin cậy:

| Nguồn & Trạng thái | Kiểu hình học hiển thị | Kiểu nét & Độ trong suốt (`Opacity` / `Dasharray`) | Ký hiệu Tâm điểm (Point Marker / Badge) | Hiển thị Độ tin cậy & Thời gian trên UI |
| :--- | :--- | :--- | :--- | :--- |
| **1. Dự báo 1–3h tới (`FORECAST`)** *(Nguồn: Mô hình Mưa Open-Meteo + Triều KTTV + Điểm đen lịch sử)* | `LineString` dọc đoạn đường + `Polygon` vùng đệm `30m` | - **Tuyến đường:** Nét đứt dài (`line-dasharray: [4, 2]`), `line-opacity: 0.80`.<br>- **Vùng đệm 30m:** Tô sọc chéo thưa (`fill-pattern` diagonal hatch) hoặc `fill-opacity: 0.18`, viền nét chấm `[2, 2]`. | Badge hình **Đồng hồ + Đámây/Sóng triều** (`🕒 +1h..3h`), viền nét đứt, gắn nhãn xác suất (VD: `Dự báo 75% • 17:30`). | - **Nguồn:** Dự báo Khí tượng & Thủy văn<br>- **Độ tin cậy:** Trung bình – Cao (hiển thị % xác suất)<br>- **Cập nhật:** `Cập nhật X phút trước` |
| **2. Báo cáo cộng đồng — Chưa xác minh (`UNVERIFIED`, $1-2$ người báo)** *(Đã qua kiểm tra GPS $\le 500\text{m}$ & EXIF $\le 10$ phút)* | `Point` (tọa độ báo cáo) + Vòng bán kính ảnh hưởng tạm thời `50m` | - **Vòng ảnh hưởng:** Nét đứt mảnh (`dasharray: [2, 2]`), `fill-opacity: 0.15`.<br>- **Chưa tô đặc cả tuyến đường** để tránh gây hoang mang nếu chỉ là vũng nước cục bộ. | Pin hình tròn **viền nét đứt màu trắng**, nền pha độ trong suốt `85%`, có dấu hỏi nhỏ hoặc nhãn **`1/3 xác nhận`** (`?` / `Chờ xác nhận`). | - **Nguồn:** 1–2 người dân tại hiện trường (có ảnh chụp)<br>- **Độ tin cậy:** Đang chờ kiểm chứng chéo<br>- **Cập nhật:** `Vừa xong (Tự hết hạn sau 90p)` |
| **3. Báo cáo cộng đồng — Đã xác minh (`VERIFIED`, $\ge 3$ người trong $150\text{m}$ / 90 phút)** | Cụm sự kiện `flood_event` (`Polygon 150m` hoặc ghép vào `LineString` đoạn đường) | - **Tuyến đường / Cụm ngập:** **Nét liền đặc 100% (`Solid Line`)**, `line-opacity: 1.0`, có viền Casing tương phản cao.<br>- Hiệu ứng vòng sóng lan tỏa nhẹ (Pulse ring chậm `2.5s/nhịp` cho Cấp 2–3). | Pin hình khiên/tròn **viền kép nét liền dày `3px`**, gắn huy hiệu tích xanh dương/trắng **`✓ Đã xác minh (N người)`** + Icon mức ngập (`🛞`/`⚠️`/`⛔`). | - **Nguồn:** Cộng đồng xác nhận chéo ($\ge 3$ thiết bị độc lập)<br>- **Độ tin cậy:** Cao (Đã xác thực 5 lớp)<br>- **Cập nhật:** `X phút trước (Còn hiệu lực Y phút)` |

> **Quy tắc suy giảm theo thời gian (TTL Visual Decay):** Khi báo cáo cộng đồng bước sang phút thứ $60 - 90$ mà không có người mới xác nhận thêm, `opacity` của Marker và Line tự động giảm xuống `0.55` kèm nhãn `⏳ Tin báo cách đây >60p (Nước có thể đang rút)` để giải quyết nỗi đau "tin cũ chưa xóa".

---

## 3. Thiết Kế Ký Hiệu Lớp Lộ Trình (Flood-Aware Routing) & Lớp Camera TTGT

### 3.1. Lớp Lộ trình (Đoạn ngập nguy hiểm vs. Lộ trình thay thế theo loại xe)

Khi người dùng bật chế độ tìm đường từ A đến B, bản đồ hiển thị đồng thời **Lộ trình thay thế được khuyến nghị** (nằm trên cùng) và **Đoạn đường bị loại bỏ do nguy cơ ngập** (nằm dưới để giải thích lý do đi vòng):

| Thành phần lộ trình | Đối tượng áp dụng | Mã màu & Kiểu nét (`MapLibre Paint`) | Ký hiệu bổ trợ trên tuyến (Line Symbol / Callout) |
| :--- | :--- | :--- | :--- |
| **A. Đoạn lộ trình đi qua vùng ngập nguy hiểm (Bị hệ thống cảnh báo tránh)** | Xe máy ($\ge 20\text{cm}$) & Ô tô ($\ge 25\text{cm}$) | - **Màu lõi:** Đỏ Cam Cảnh Báo `#EF4444` kết hợp nền xám tối `#64748B`.<br>- **Kiểu nét:** **Nét đứt cảnh báo (`line-dasharray: [2, 2]`)**, độ dày `5px`, `opacity: 0.75`. | Đặt nhãn Callout neo trực tiếp vào đoạn đứt: `⛔ Tránh đoạn này: Ngập ~30cm (Ống pô / Gầm xe)`. |
| **B. Lộ trình thay thế cho XE MÁY (`motorcycle` mode)** | Cho phép đi qua đường chính và đường nhánh/nội bộ rộng (`residential` trở lên, ước tính $< 20\text{cm}$) | - **Màu lõi:** **Xanh Dương Điện Tử (Electric Cyan-Blue)** `#0284C7` (tương phản hoàn toàn với Vàng/Cam/Đỏ của ngập và không trùng màu Xanh lá Cấp 0).<br>- **Viền Casing:** Trắng `#FFFFFF` (`2px`) + Viền ngoài Xanh Đậm `#0369A1` (`12px` tổng).<br>- **Kiểu nét:** Nét liền (`Solid`) kết hợp mũi tên chỉ hướng (`▸`) chạy dọc tuyến cách nhau `80px`. | Pill-badge gắn trên tuyến: `🛵 Tuyến thay thế (Ít nguy cơ ngập • +4 phút)`. Nếu đi qua đường nhánh (`residential`), hiển thị chấm dẫn hướng nhỏ để dễ rẽ. |
| **C. Lộ trình thay thế cho Ô TÔ (`car` mode)** | Chỉ đi trục đường lớn (`primary`, `secondary`, `tertiary`), ước tính $< 25\text{cm}$, cấm hẻm nhỏ | - **Màu lõi:** **Xanh Chàm Đậm (Deep Indigo-Blue)** `#2563EB` với lõi sáng `#60A5FA` ở giữa (tạo hiệu ứng đường trục lớn 2 làn).<br>- **Viền Casing:** `#1E3A8A` dày (`14px` tổng).<br>- **Kiểu nét:** Nét liền bản rộng + Mũi tên kép (`⟫`) chỉ hướng. | Pill-badge gắn trên tuyến: `🚗 Tuyến trục lớn (Tránh điểm ngập • Đủ làn ô tô)`. |

### 3.2. Lớp Tọa độ Camera Giao thông (`traffic_cameras` — TTGT TP.HCM)

- **Mục đích:** Giúp người dùng đối chiếu thực tế trong bán kính $300\text{m}$ quanh điểm ngập mà không làm rối bản đồ.
- **Ký hiệu mặc định (Normal State):**
  - Hình tròn nền **Tím Than Đậm (`#312E81`)**, viền trắng `2px`, kích thước `28x28px` (vùng chạm thực tế `44x44px` chuẩn Mobile Touch Target).
  - Icon bên trong: Biểu tượng Camera (`📹`) màu trắng tinh `#FFFFFF`.
- **Ký hiệu khi nằm gần điểm ngập $\le 300\text{m}$ (Contextual Highlight State):**
  - Tự động bật viền ngoài màu **Xanh Ngọc Sáng (`#06B6D4`)** dày `3px` kèm nhãn phụ nhỏ bên dưới: `Cam TTGT (Cách 120m)`.
  - Khi người dùng bấm vào điểm ngập, vẽ một đường nối mảnh nét chấm (`#06B6D4`, `dasharray: [1, 2]`) từ tâm điểm ngập tới các Camera TTGT trong bán kính $300\text{m}$ để người dùng nhận diện ngay góc quan sát.
- **Nội dung thẻ Popup Camera:** Hiển thị Tên nút giao camera, Khoảng cách tới điểm ngập (`m`), Nguồn (*"Cổng thông tin Giao thông TP.HCM"*), và nút bấm mở nhanh liên kết xem camera thực tế.

---

## 4. Quy Tắc Hiển Thị Đa Tỷ Lệ Theo Mức Zoom (Multi-Scale Zoom Rules)

Áp dụng nguyên tắc **Tổng quát hóa bản đồ (Cartographic Generalization)** để đảm bảo hiệu năng $< 3\text{s}$ và không gây "ngộp" thông tin trên màn hình điện thoại:

| Mức Zoom | Phạm vi không gian | Lớp Điểm đen & Dự báo (`flood_hotspots`) | Lớp Báo cáo cộng đồng (`crowd_reports`) | Lớp Lộ trình (`routes`) & Camera (`traffic_cameras`) | Nhãn chữ (Labels & Typography) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Zoom 11 – 12** *(Toàn TP.HCM / Liên Quận)* | Nhìn tổng quan 4 quận trọng điểm (Bình Thạnh, Q7, Q8, Thủ Đức) | - Ẩn `Polygon` vùng đệm 30m.<br>- Chỉ hiển thị các tuyến ngập **Cấp 2 & Cấp 3** dưới dạng `LineString` giản lược (`line-width: 3px–5px`).<br>- Cấp 0 hoàn toàn ẩn; Cấp 1 hiển thị nét mảnh `2px`. | - **Gom cụm (Clustering):** Gom các điểm báo cáo gần nhau (bán kính `50px` màn hình) thành 1 vòng tròn tổng hợp hiển thị tổng số sự kiện và lấy màu của **Cấp ngập cao nhất** trong cụm (VD: `(12)` màu Đỏ Cấp 3). | - **Lộ trình:** Hiển thị toàn tuyến tổng quát (`line-width: 5px`), ẩn các mũi tên rẽ chi tiết.<br>- **Camera TTGT:** **Ẩn hoàn toàn** (tránh hàng trăm icon đè kín bản đồ). | Chỉ hiện tên Quận, sông lớn (Sài Gòn, Kênh Tẻ) và các đại lộ chính (Nguyễn Văn Linh, Phạm Văn Đồng, XL Hà Nội). |
| **Zoom 13** *(Cấp Quận / Trục đường chính)* | Chuyển tiếp từ tổng quan sang khu vực | - Hiển thị `LineString` cả 3 cấp (Cấp 1–3) với độ dày `4px–7px`.<br>- Bắt đầu hiển thị Badge mức ngập (`⚠️`, `⛔`) tại tâm các đoạn ngập Cấp 2–3 dài $> 200\text{m}$. | - Tách cụm theo từng tuyến đường (`150m` spatial cluster).<br>- Hiển thị rõ sự khác biệt giữa **Huy hiệu Đã xác minh (`✓`)** và **Chưa xác minh (`?`)**. | - **Lộ trình:** Hiển thị rõ tuyến chính, đoạn ngập nét đứt và Callout tổng quát.<br>- **Camera TTGT:** Chỉ hiển thị các Camera nằm trong bán kính **$300\text{m}$ quanh điểm đang có cảnh báo ngập Cấp 2–3**. | Hiện tên các đường trục chính (`primary`, `secondary`). |
| **Zoom 14 – 16** *(Chi tiết Đường phố / Giao lộ)* | Chế độ điều hướng & kiểm tra chi tiết trước khi đi | - Bật đầy đủ `LineString` (`6px–10px` kèm Casing) + **`Polygon` vùng đệm ngập `30m`**.<br>- Phân biệt rõ họa tiết **Dự báo (nét đứt + sọc chéo)** vs. **Thực tế (nét liền)**. | - Hiển thị từng sự kiện ngập (`flood_event`) với đầy đủ Badge: Icon bộ phận xe (`🛞`/`⚠️`/`⛔`) + Độ sâu (`~30cm`) + Số người xác nhận (`✓ 4`). | - **Lộ trình:** Hiển thị đầy đủ mũi tên chỉ hướng (`▸`/`⟫`), điểm đầu/cuối đoạn ngập.<br>- **Camera TTGT:** Hiển thị toàn bộ Camera trong khung nhìn (`28x28px`) kèm nhãn khoảng cách nếu gần điểm ngập. | Hiện đầy đủ tên đường (`tertiary`, `residential`), số lượng xác nhận và thời gian cập nhật ngắn gọn (`5p trước`). |
| **Zoom 17 – 18** *(Cấp Hẻm / Tại hiện trường)* | Người dùng đang đứng tại chỗ báo ngập hoặc tìm lối rẽ | - Hiển thị bề rộng vùng ngập theo tỷ lệ thực tế trên mặt đường.<br>- Hiển thị ranh giới vòng khóa GPS `500m` (khi mở màn hình Báo ngập) và vòng gom cụm `150m`. | - Tách riêng từng điểm `Point` báo cáo cá nhân bên trong cụm để người dùng bấm xem từng ảnh chụp thực tế tại hiện trường và thời gian chụp EXIF. | - **Lộ trình:** Phóng to chi tiết góc rẽ, hiển thị rõ cảnh báo cấm rẽ cho Ô tô ở đầu hẻm nhỏ.<br>- **Camera TTGT:** Icon lớn `34x34px` kèm hướng góc quay (nếu có dữ liệu). | Hiện tên hẻm, số nhà/địa danh mốc (Landmark) giúp người dân định vị mặt nước dễ dàng. |

---

## 5. Thứ Tự Xếp Lớp Bản Đồ (MapLibre Layer Z-Index Ordering)

Để đảm bảo các thông tin an toàn sinh mạng không bao giờ bị che khuất bởi nhãn bản đồ nền hay biểu tượng phụ, thứ tự xếp lớp từ dưới lên trên (Bottom-to-Top) trong MapLibre Style JSON được quy định nghiêm ngặt như sau:

1. `basemap-land-water`: Nền đất, sông ngòi, kênh rạch (Kênh Nhiêu Lộc, Tàu Hủ, sông Sài Gòn).
2. `basemap-roads`: Mạng lưới đường nền màu trung tính (`#CBD5E1` / `#334155`).
3. `flood-buffer-forecast-polygon`: Vùng đệm `30m` của Dự báo 1–3h (sọc chéo, `opacity 0.18`).
4. `flood-buffer-verified-polygon`: Vùng đệm `30m–150m` của Điểm ngập thực tế đã xác minh (`opacity 0.25`).
5. `route-flooded-segment`: Đoạn lộ trình đi qua vùng ngập bị cảnh báo tránh (nét đứt Đỏ-Xám).
6. `flood-lines-casing` & `flood-lines-core`: Tuyến đường ngập theo thứ tự ưu tiên **Cấp 1 (dưới) $\rightarrow$ Cấp 2 (giữa) $\rightarrow$ Cấp 3 (trên cùng)**.
7. `route-alternative-casing` & `route-alternative-core`: Lộ trình thay thế cho Xe máy (`#0284C7`) hoặc Ô tô (`#2563EB`) kèm mũi tên hướng đi.
8. `basemap-road-labels`: Tên đường giao thông (đặt **trên** lớp màu đường ngập nhưng có `text-halo-width: 2px` màu trắng/đen để đọc rõ tên đường ngay cả khi đường đang tô đỏ).
9. `traffic-camera-markers`: Biểu tượng Camera TTGT (`📹`).
10. `crowd-report-unverified-markers`: Pin báo cáo chưa xác minh (`? 1/3`).
11. `crowd-report-verified-markers` & `route-callouts`: Pin báo cáo đã xác minh (`✓`), Badge mức ngập (`🛞`/`⚠️`/`⛔`) và hộp cảnh báo lộ trình (luôn ưu tiên hiển thị cao nhất — `symbol-sort-key` cao nhất).

---

## 6. Quy Chuẩn Chú Giải Bản Đồ (Map Legend) & Thông Tin Tin Cậy

Trên giao diện bản đồ (góc dưới bên trái hoặc nút `[i] Chú giải` mở nhanh 1 chạm), bảng chú giải và mọi thẻ thông tin điểm ngập bắt buộc tuân thủ cấu trúc 4 thành phần:
1. **Ký hiệu trực quan + Mức độ đời thường:** VD: `[⛔ Đỏ Thẫm] Cấp 3 (>45cm): Ngập lút yên xe máy / Quá đèn pha ô tô — Khuyến cáo không đi vào`.
2. **Phân biệt Nguồn & Hình thái nét:**
   - `━━━` **Nét liền + Huy hiệu `✓`:** Đã xác minh thực tế ($\ge 3$ người dân báo cáo có ảnh chụp tại chỗ).
   - `╍╍╍` **Nét đứt + Icon `?`:** Mới ghi nhận ($1-2$ người báo, đang chờ xác nhận thêm).
   - `┈┈┈` **Nét đứt sọc + Icon `🕒`:** Dự báo nguy cơ ngập trong 1–3 giờ tới (theo lượng mưa & triều cường).
3. **Dòng thời gian & Độ tươi dữ liệu (Freshness):** Luôn hiển thị *"Cập nhật lúc HH:MM (X phút trước)"* và thời gian tự động hết hạn (*"Hiệu lực còn Y phút"*).
4. **Tuyên bố miễn trừ & An toàn (`RULES.md` Mục 7):** Nhãn dưới cùng của hộp gợi ý lộ trình luôn ghi rõ: *"Lộ trình gợi ý dựa trên dữ liệu khí tượng và báo cáo cộng đồng tại thời điểm tra cứu. Mực nước thực tế có thể thay đổi nhanh, vui lòng quan sát thực tế khi di chuyển."*

---

## Quyết Định Đã Chốt
1. **Bảng màu & Mã hóa đa biến (CVD-Safe):** Chốt 4 cấp độ ngập sử dụng kết hợp **Độ sáng (Luminance) + Độ dày nét (`6px` $\rightarrow$ `8px` $\rightarrow$ `10px`) + Viền Casing tương phản cao + Biểu tượng bộ phận xe (`🛞` ~15cm, `⚠️` ~30cm, `⛔` >45cm)** để người mù màu và người đi dưới trời mưa/nắng gắt đều nhận diện được trong $< 2$ giây.
2. **Phân biệt Dự báo vs. Thực tế (Chưa xác minh / Đã xác minh):**
   - **Dự báo 1–3h:** Nét đứt dài `[4, 2]`, vùng đệm sọc chéo, gắn badge `🕒 +1h..3h` và `% xác suất`.
   - **Báo cáo chưa xác minh ($1-2$ người):** Chỉ hiện Pin viền nét đứt + vòng bán kính mảnh `50m` kèm nhãn `? 1/3 xác nhận`, chưa tô đặc cả tuyến đường.
   - **Báo cáo đã xác minh ($\ge 3$ người):** Nét liền đặc 100%, viền Casing nổi bật, huy hiệu `✓ Đã xác minh (N người)`.
3. **Ký hiệu Lộ trình & Camera TTGT:** Lộ trình cắt qua vùng ngập vẽ **nét đứt Đỏ-Xám** kèm Callout cảnh báo; Lộ trình thay thế dùng tông **Xanh Dương Điện Tử (`#0284C7` cho Xe máy)** và **Xanh Chàm Đậm (`#2563EB` cho Ô tô)** để tách biệt hoàn toàn với bảng màu ngập. Camera TTGT hiển thị có ngữ cảnh (ưu tiên nổi bật trong bán kính $300\text{m}$ quanh điểm ngập).
4. **Quy tắc phân cấp theo Zoom (Zoom 11–18):** Gom cụm (Clustering) và ẩn lớp chi tiết (Polygon 30m, Camera TTGT, đường ngập nhẹ) ở Zoom 11–12; bung chi tiết từng cấp ở Zoom 13–18 để đảm bảo tốc độ tải $< 3\text{s}$ và chống nhiễu thị giác.

## Câu Hỏi Mở Cho Chủ Dự Án
- Hiện tại không có câu hỏi chặn (blocking). Đề xuất mặc định kích hoạt **Chế độ Nền Tối Tự Động (Auto Dark Mode)** khi trời mưa lớn hoặc sau 17h30 (khung giờ cao điểm triều cường chiều tối tại TP.HCM) để giảm chói mắt khi đi đường; chủ dự án có thể xác nhận giữ tính năng tự động này ở bước UI/UX tiếp theo.

## Chuyển Giao / Rủi Ro
- **Chuyển giao cho UI/UX Designer & Frontend Developer:**
  - Sử dụng đúng mã màu Hex, quy tắc Casing, biểu thức `interpolate`/`step` theo Zoom (Mục 4) và Thứ tự xếp lớp Z-Index (Mục 5) khi cấu hình `MapLibre Style Spec` và thiết kế màn hình chính.
  - Cần chuẩn bị bộ Sprite Sheet SVG nhẹ ($< 30\text{KB}$) cho các icon bản đồ: `🛞`, `⚠️`, `⛔`, `🕒`, `✓`, `?`, `📹`, `🛵`, `🚗`.
- **Rủi ro & Giảm thiểu:**
  - *Rủi ro chồng chéo nhãn (Symbol Collision) khi mưa lớn diện rộng:* Khi có hàng chục điểm báo cáo cùng lúc ở Bình Thạnh hoặc Quận 7, các Badge có thể đè lên nhau. **Giải pháp kỹ thuật bắt buộc trong MapLibre:** Cấu hình `symbol-sort-key` ưu tiên Cấp 3 $>$ Cấp 2 $>$ Cấp 1 và `VERIFIED` $>$ `FORECAST` $>$ `UNVERIFIED`, đồng thời bật `icon-allow-overlap: false` ở Zoom $\le 14$.
