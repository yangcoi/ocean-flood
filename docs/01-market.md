# Phân Tích Thị Trường & Đối Thủ (Market & Competitor Analysis)

**Người phụ trách:** Trend Researcher (`agency-trend-researcher`)  
**Dựa trên:** `docs/RULES.md`, `docs/00-brief.md`  
**Ngày lập:** 2026-10-12  

---

## 1. Bảng So Sánh Các Sản Phẩm Hiện Có Tại TP.HCM

| Sản phẩm / Kênh | Loại hình | Điểm mạnh | Điểm yếu | Hành vi người dùng hiện tại |
| :--- | :--- | :--- | :--- | :--- |
| **UDI Maps** (Công ty Thoát nước Đô thị TP.HCM) | App chính thống (iOS/Android) | Có dữ liệu từ trạm đo và nhân viên hiện trường của UDC; thông tin triều cường chuẩn. | Giao diện cũ, trải nghiệm người dùng chậm; **thụ động** (ngập rồi mới báo); không có gợi ý lộ trình tránh ngập cho xe máy/ô tô. | Ít người dùng thường xuyên mở; chủ yếu xem khi báo đài nhắc tên. |
| **nuoclen.com** | Web app bản đồ ngập Crowdsource (mới mở rộng vào TP.HCM) | Giao diện hiện đại, nhẹ, có báo cáo cộng đồng thời gian thực, có radar mưa và TTL tự làm mờ báo cáo cũ. | Tập trung mạnh ở Hà Nội trước, mật độ báo cáo tại TP.HCM còn thưa; thiên về **báo sau khi đã ngập (reactive)**; chưa kết hợp dự báo đỉnh triều Nam Bộ + gợi ý lộ trình tránh ngập chuyên sâu cho cả xe máy & ô tô. | Người dùng trẻ, dân văn phòng vào xem nhanh điểm ngập và đóng góp báo cáo. |
| **TTGT TP.HCM** (Sở GTVT) | App & Web thông tin giao thông | Hệ thống camera giao thông dày đặc khắp thành phố (cập nhật ~11 giây/lần). | Không chuyên về dự báo ngập + triều cường; muốn biết ngập phải tự bấm từng camera để nhìn bằng mắt; không tự động gợi ý đường vòng tránh ngập. | Tài xế công nghệ, tài xế ô tô mở xem camera ở các ngã tư hay kẹt/ngập. |
| **Google Maps / Waze** | Bản đồ điều hướng toàn cầu | Chỉ đường cực chuẩn, dữ liệu kẹt xe thời gian thực theo mật độ phương tiện. | **Mù thông tin về độ sâu ngập và triều cường**: thấy đường vắng (do ngập sâu không ai dám đi) lại tưởng đường thông thoáng và chỉ người dùng chạy thẳng vào vùng ngập! | Mọi người dùng hàng ngày để tìm đường nhưng rất hay bị "bẫy" dẫn vào đường ngập lúc mưa to. |
| **Hội nhóm Facebook / Zalo / VOV Giao thông** | Cộng đồng mạng xã hội & Radio | Tốc độ truyền tin nhanh qua ảnh/video thực tế của người đi đường. | Tin tức trôi loạn xạ, không gắn lên bản đồ số, không biết chính xác đoạn nào ngập sâu bao nhiêu cm hay đã rút chưa. | Lướt xem thụ động hoặc hỏi "Đường Nguyễn Hữu Cảnh có ngập không mọi người?". |

---

## 2. Khoảng Trống Thị Trường (Market Gap) & DNA Khác Biệt Của Ocean Flood

1. **Từ Thụ Động (Reactive) sang Chủ Động (Proactive):**
   - Tất cả giải pháp hiện tại chỉ trả lời câu hỏi *"Hiện tại chỗ nào đang ngập?"*.
   - **Ocean Flood** trả lời câu hỏi quan trọng hơn: *"Trong 1–3 tiếng nữa khi tôi tan tầm (17h30), đường về nhà có ngập không và tôi nên đi đường nào?"* bằng cách kết hợp **Dự báo mưa + Chu kỳ triều cường trạm Phú An/Nhà Bè + Điểm đen lịch sử**.
2. **Ngôn Ngữ Cảnh Báo Kép (Khoa Học + Đời Thường):**
   - Cơ quan khí tượng báo *"Đỉnh triều 1.65m, mưa 45mm/h"* — người dân không hình dung được xe mình có đi qua được không.
   - **Ocean Flood** hiển thị song song cả số liệu khoa học lẫn câu dịch đời thường: *"Ngập ngang ống pô xe máy (~30cm), gầm thấp ô tô sedan có nguy cơ thủy kích"*.
3. **Điều Hướng Tránh Ngập Phân Loại Theo Phương Tiện (Xe Máy vs Ô Tô):**
   - Ngưỡng chịu ngập của xe máy (ống pô/bugi ~25-30cm) và ô tô (cổ hút gió sedan ~30-40cm, SUV ~50cm, cộng thêm rủi ro sóng nước từ xe tải) rất khác nhau, cũng như lộ trình đường hẻm/đường lớn khác nhau. Ocean Flood gợi ý lộ trình riêng cho **Xe máy** và **Ô tô**.
4. **Kiểm Soát Báo Cáo Cộng Đồng Đa Lớp (Anti-Spam):**
   - Kết hợp Ảnh chụp trực tiếp (kiểm tra EXIF) + Khoảng cách GPS $\le 500\text{m}$ + Chọn mức ngập trực quan theo bộ phận xe + Kiểm chứng chéo $\ge 3$ người.

---

## 3. Quyết Định Đã Chốt
1. Không làm bản sao của `nuoclen.com` hay `UDI Maps`.
2. Tập trung vào 4 trụ cột khác biệt: **Dự báo trước 1–3h + Ngôn ngữ kép + Gợi ý lộ trình tránh ngập cho Xe máy/Ô tô + Báo cáo cộng đồng xác thực chặt**.

## 4. Câu Hỏi Mở Cho Chủ Dự Án
- Đã giải quyết (Chủ dự án đã duyệt định hướng sản phẩm và hỗ trợ cả Xe máy & Ô tô).

## 5. Chuyển Giao / Rủi Ro
- **Chuyển giao:** Chuyển sang `docs/01-insights.md` và `docs/01-spatial-requirements.md` để cụ thể hóa hành vi người dùng và bài toán không gian.
