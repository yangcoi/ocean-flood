# Project Brief: HCM Alert Map (Ocean Flood)

## Ý tưởng
Bản đồ web **chủ động cảnh báo và gợi ý lộ trình tránh ngập** theo thời gian gần thực về ngập lụt và triều cường tại TP.HCM.

> **DNA sản phẩm:** "Sắp ngập rồi, đi đường này thay vì đường kia" — Khác biệt cốt lõi so với các app hiện có (nuoclen, UDI Maps) chỉ **báo sau** khi đã ngập. Ocean Flood **dự báo trước** và **chủ động đề xuất giải pháp**.

## Vấn đề
Người tham gia giao thông ở TP.HCM (đặc biệt là người đi xe máy, tài xế công nghệ, shipper và cư dân vùng ven) thường xuyên rơi vào cảnh ngập úng và chết máy khi mưa lớn trùng thời điểm triều cường dâng cao, thiếu kênh thông tin nhanh chóng và trực quan trên bản đồ số để chủ động tránh tuyến đường ngập.

## Người dùng mục tiêu (giả định, cần kiểm chứng)
- Người đi xe máy đi làm, đi học hằng ngày
- Tài xế công nghệ / shipper giao hàng
- Cư dân sinh sống tại các vùng trũng thấp ven sông, kênh rạch
- Người điều khiển ô tô cần tránh các điểm ngập sâu gây thủy kích

## Phạm vi địa lý ban đầu (MVP)
Tập trung vào 4 khu vực "điểm nóng" ngập lụt và triều cường tại TP.HCM:
1. Quận Bình Thạnh (khu Thanh Đa, Ung Văn Khiêm, Nguyễn Xí...)
2. Quận 7 (Huỳnh Tấn Phát, Trần Xuân Soạn...)
3. Quận 8 (khu vực ven kênh Tàu Hủ - Bến Nghé, Mễ Cốc...)
4. TP. Thủ Đức (khu Thảo Điền, Quốc Hương, Tô Ngọc Vân, Võ Văn Ngân...)

## Ba lớp thông tin
1. **Ngập lụt** (Mưa lớn gây ngập)
2. **Triều cường** (Nước dâng theo chu kỳ triều)
3. **Kẹt xe** (Giao thông tê liệt)
- **Ưu tiên MVP:** Tập trung giải quyết dứt điểm 2 lớp **Ngập lụt + Triều cường** vì có mối liên hệ dữ liệu thủy văn tự nhiên mật thiết. Lớp kẹt xe sẽ bổ sung ở giai đoạn mở rộng.

## Nguyên tắc tự lực
- **Không hợp tác / liên hệ bên ngoài** trong giai đoạn MVP. Ra sản phẩm trước, tính tiếp sau.
- Chỉ sử dụng dữ liệu **công khai, miễn phí, hợp pháp** mà mình tự lấy được.

## 5 tính năng cốt lõi MVP

### Tính năng 1: Dự báo ngập TRƯỚC khi xảy ra (1–3 tiếng)
Kết hợp: **mưa dự báo (Open-Meteo)** + **lịch triều cường (mô hình thiên văn)** + **điểm đen lịch sử** → tính xác suất ngập trên từng tuyến đường.

**Ngôn ngữ cảnh báo song song — Khoa học + Đời thường:**

| Ngôn ngữ khoa học | Ngôn ngữ đời thường |
|---|---|
| "Mưa dự báo 45 mm/h + triều đỉnh 1.65 m (trạm Phú An) lúc 17h30" | "🌧️ Mưa to kết hợp nước triều dâng cao chiều nay" |
| "Xác suất ngập 78% — Nguyễn Xí, Bình Thạnh" | "⚠️ Đường Nguyễn Xí gần như chắc chắn sẽ ngập chiều nay" |
| "Mực nước dự kiến 20–40 cm, thời gian rút: ~90 phút" | "🏍️ Ngập ngang ống pô xe máy, nước rút khoảng 1.5 tiếng" |
| "Lượng mưa tích lũy 15 mm/h, triều 1.45 m — dưới ngưỡng cảnh báo" | "✅ Mưa nhỏ, nước triều bình thường — đi lại bình thường" |

> **Quy tắc:** Mọi thông báo đều có 2 dòng: dòng trên là dữ liệu khoa học (cho người muốn biết chi tiết), dòng dưới là diễn giải bằng tiếng Việt đời thường (cho người dân bình thường hiểu ngay).

### Tính năng 2: Báo cáo cộng đồng có kiểm soát chặt
Người dùng báo "đường đang ngập" với **kiểm soát nghiêm ngặt chống spam/báo sai**:

- **Bắt buộc kèm ảnh chụp tại chỗ** (kiểm tra EXIF: thời gian chụp phải ≤ 10 phút so với thời gian báo cáo; nếu không có EXIF thì yêu cầu chụp trực tiếp qua camera trong app)
- **Bắt buộc GPS thiết bị khớp** (bán kính ≤ 500 m so với vị trí báo cáo; không cho nhập tọa độ tay)
- **Kiểm tra chéo**: điểm báo cáo phải có **≥ 3 người khác xác nhận** mới chuyển sang trạng thái "Đã xác minh". Trước đó hiển thị nhãn "Chưa xác minh (1 người báo cáo)"
- **Rate limit**: mỗi thiết bị tối đa 5 báo cáo / giờ, device fingerprint chống tạo tài khoản ảo
- **Điểm uy tín người báo cáo**: báo đúng nhiều lần → điểm tăng → báo cáo được ưu tiên tin tưởng hơn; báo sai nhiều → hạ uy tín, cần nhiều xác nhận hơn
- **TTL (Time-To-Live)**: nếu sau 90 phút không có xác nhận mới hoặc dữ liệu mưa tiếp diễn → tự động hạ cấp Đỏ → Vàng → Bình thường

### Tính năng 3: Gợi ý lộ trình tránh ngập
- Người dùng nhập **điểm đi + điểm đến**
- Hệ thống overlay vùng ngập / nguy cơ ngập lên tuyến đường
- Nếu phát hiện tuyến đường đi qua vùng ngập → **gợi ý tuyến đường thay thế** tránh ngập
- Sử dụng dữ liệu routing từ OSM (OSRM / Valhalla — miễn phí, self-host)

### Tính năng 4: Cảnh báo chủ động theo lộ trình cá nhân
- Người dùng lưu **"đường đi làm hằng ngày"** (ví dụ: nhà ở Q7 → công ty ở Q1)
- Hệ thống tự theo dõi điều kiện thời tiết + triều → gửi push notification: *"🌧️ Lộ trình đi làm của bạn có nguy cơ ngập lúc 17h. Nên đi đường X thay vì đường Y"*

### Tính năng 5: Hiển thị tọa độ camera giao thông
- Hiển thị vị trí các camera TTGT TP.HCM trên bản đồ (dữ liệu tọa độ từ Cổng dữ liệu mở)
- Khi bấm vào → deeplink hoặc hướng dẫn mở app TTGT để xem hình ảnh thực tế
- **Không crawl stream camera** — chỉ hiển thị vị trí để người dùng tự kiểm tra

## Tính năng phụ: Timeline ngập
- Dựa trên dữ liệu lịch sử + mùa mưa + chu kỳ triều → hiển thị: *"Đường Huỳnh Tấn Phát thường ngập từ 16h–19h vào ngày triều cường"*
- Giúp người dùng lên kế hoạch di chuyển từ đầu ngày

## Nguồn dữ liệu MVP (tự lực, không hợp tác)

| Nguồn | Loại | Mục đích | Chi phí |
|---|---|---|---|
| Open-Meteo API | Dự báo mưa (REST API) | Dự báo ngập trước 1–3h | 0đ |
| Đài KTTV Nam Bộ | Dự báo triều (crawl bản tin công khai) | Dự báo ngập khi triều cao | 0đ |
| Sở Xây dựng TP.HCM | Danh sách điểm đen ngập (PDF/Excel) | Dữ liệu tĩnh điểm ngập lịch sử | 0đ |
| OpenStreetMap | Bản đồ nền + dữ liệu đường (ODbL) | Hiển thị & routing | 0đ |
| OSRM / Valhalla | Routing engine (self-host, OSM data) | Gợi ý lộ trình thay thế | 0đ |
| Cổng dữ liệu mở TP.HCM | Tọa độ camera TTGT | Hiển thị vị trí camera | 0đ |
| NASA SRTM 30m | DEM địa hình | Phân tích vùng trũng | 0đ |
| GADM / OSM boundaries | Ranh giới hành chính | Hiển thị quận/phường | 0đ |
| Cộng đồng người dùng | Báo cáo ngập (tự xây) | Dữ liệu thời gian thực | 0đ |

## Ràng buộc
- **Nhân lực:** 1 người, vibe coding có sự đồng hành và hỗ trợ từ AI Agent trong Antigravity
- **Ngân sách:** 0 đồng (sử dụng 100% dịch vụ miễn phí, open-source, free-tier hosting/database)
- **Thời gian hoàn thành MVP:** 2 – 3 tuần
- **Nền tảng:** Web ứng dụng (Mobile-first, PWA), tối ưu trải nghiệm mượt mà trên smartphone
- **Ngôn ngữ giao diện:** Tiếng Việt (có khả năng mở rộng i18n sang tiếng Anh)
- **Kỹ năng & Định hướng công nghệ:** Ưu tiên kiến trúc đơn giản, hiện đại, nhẹ, dễ bảo trì cho 1 người (MapLibre / Leaflet, PostGIS / SQLite-SpatiaLite, Node.js / Python nhẹ, hosting Vercel / Cloudflare / Render free tier)

## Tiêu chí thành công MVP
- Người dùng mở bản đồ web dưới 3 giây trên kết nối mạng di động 4G
- Hiển thị trực quan các điểm/tuyến đường có nguy cơ ngập hoặc đang ngập trong phạm vi 4 quận MVP
- Mỗi điểm cảnh báo hiển thị **2 dòng**: dữ liệu khoa học + diễn giải đời thường
- Gợi ý được lộ trình thay thế khi tuyến đường chính có nguy cơ ngập
- Hệ thống báo cáo cộng đồng hoạt động với kiểm soát chống spam hiệu quả (ảnh + GPS + xác nhận chéo)
- Có cơ chế dự báo ngập trước 1–3 tiếng dựa trên mưa + triều + lịch sử

## Ngoài phạm vi (Out of Scope cho MVP)
- Ứng dụng native iOS/Android (tập trung Web PWA trước)
- Mô hình Machine Learning dự báo thủy văn phức tạp (dùng rule-based threshold trước)
- Hợp tác / liên hệ bên ngoài (UDI Maps, nuoclen, FEDS...)
- Crawl stream camera giao thông (chỉ hiển thị tọa độ)
- Lớp kẹt xe (bổ sung giai đoạn mở rộng)
