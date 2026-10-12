# Project Brief: HCM Alert Map (Ocean Flood)

## Ý tưởng
Bản đồ web cảnh báo theo thời gian gần thực về ngập lụt và triều cường tại TP.HCM (mở rộng thêm kẹt xe trong tương lai).

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

## Ràng buộc
- **Nhân lực:** 1 người, vibe coding có sự đồng hành và hỗ trợ từ AI Agent trong Antigravity
- **Ngân sách:** 0 đồng (sử dụng 100% dịch vụ miễn phí, open-source, free-tier hosting/database)
- **Thời gian hoàn thành MVP:** 2 – 3 tuần
- **Nền tảng:** Web ứng dụng (Mobile-first, PWA), tối ưu trải nghiệm mượt mà trên smartphone
- **Ngôn ngữ giao diện:** Tiếng Việt (có khả năng mở rộng i18n sang tiếng Anh)
- **Kỹ năng & Định hướng công nghệ:** Ưu tiên kiến trúc đơn giản, hiện đại, nhẹ, dễ bảo trì cho 1 người (MapLibre / Leaflet, PostGIS / SQLite-SpatiaLite, Node.js / Python nhẹ, hosting Vercel / Cloudflare / Render free tier)

## Nguồn dữ liệu đã biết
- [CHƯA XÁC MINH]: Cần chuyên gia GIS Technical Consultant điều tra chi tiết các nguồn dữ liệu từ Đài Khí tượng Thủy văn, dữ liệu thoát nước đô thị TP.HCM, trạm quan trắc triều hoặc dữ liệu báo cáo cộng đồng.

## Tiêu chí thành công MVP
- Người dùng mở bản đồ web dưới 3 giây trên kết nối mạng di động 4G
- Hiển thị trực quan các điểm/tuyến đường có nguy cơ ngập hoặc đang ngập trong phạm vi 4 quận MVP
- Mỗi điểm cảnh báo hiển thị rõ ràng: Mức độ ngập (độ sâu/màu sắc), thời điểm cập nhật mới nhất, nguồn gốc dữ liệu và độ tin cậy
- Có cơ chế cơ bản để người dùng gửi phản ánh/báo cáo điểm ngập (nếu qua được duyệt PRD)

## Ngoài phạm vi (Out of Scope cho MVP)
- Ứng dụng native iOS/Android (tập trung Web PWA trước)
- Mô hình Machine Learning dự báo thủy văn phức tạp
- Tính năng điều hướng / tìm đường đi thay thế (Navigation/Routing)
