# Tài Liệu Đặc Tả Sản Phẩm (PRD): HCM Alert Map — Ocean Flood

**Người phụ trách:** Product Manager (`agency-product-manager`)  
**Dựa trên:** Toàn bộ `docs/00-brief.md` và `docs/01-*.md`  
**Ngày lập:** 2026-10-12  

---

## 1. Tầm Nhìn & Định Vị Sản Phẩm (Product Vision)
**Ocean Flood** là ứng dụng bản đồ web (Mobile-first PWA) **chủ động dự báo ngập lụt & triều cường trước 1–3 tiếng** và **gợi ý lộ trình tránh ngập chuyên biệt cho cả Xe máy & Ô tô** tại TP.HCM.
- **Khác biệt cốt lõi:** Chuyển từ thụ động (*"Đường ngập rồi mới biết"*) sang chủ động (*"Sắp ngập lúc 17h30, hãy đi đường thay thế này"*), kết hợp **Ngôn ngữ cảnh báo kép (Khoa học + Đời thường)** và **Báo cáo cộng đồng xác thực 5 lớp**.

---

## 2. Chân Dung Người Dùng & User Stories Trọng Tâm

### Nhóm 1: Người đi Xe máy / Tài xế công nghệ / Shipper
- **US-01 (Xem cảnh báo kép):** Là người đi xe máy, tôi muốn nhìn vào một đoạn đường trên bản đồ và đọc được ngay cả thông số khoa học (*"Mưa 45mm/h + Triều 1.65m lúc 17h30"*) lẫn mức độ ngập đời thường (*"Ngập ngang ống pô xe máy ~30cm, dễ tắt máy"*) để quyết định có đi qua hay không.
- **US-02 (Tìm đường tránh ngập cho Xe máy):** Là người đi xe máy từ Bình Thạnh về Quận 7, tôi muốn nhập điểm đi/điểm đến và chọn phương tiện **"Xe máy"** để hệ thống tự động né các đoạn đang ngập hoặc sắp ngập $\ge 20\text{cm}$ và chỉ cho tôi đường vòng thông thoáng.

### Nhóm 2: Người lái Ô tô (Sedan / SUV)
- **US-03 (Tìm đường tránh ngập an toàn cho Ô tô):** Là người lái ô tô con (sedan), tôi muốn chọn chế độ **"Ô tô"** khi tìm lộ trình để hệ thống né các điểm ngập có nguy cơ thủy kích ($\ge 25\text{cm}$) và **chỉ dẫn tôi đi qua các trục đường lớn đủ làn xe**, tuyệt đối không dẫn ô tô chui vào hẻm nhỏ hoặc đường cụt.

### Nhóm 3: Cộng đồng người dùng báo cáo tại hiện trường
- **US-04 (Báo ngập chuẩn xác, chống báo láo):** Là người đang đi trên đường gặp ngập, tôi muốn bấm nút "Báo ngập", chụp ảnh trực tiếp tại chỗ và chọn nhanh nút trực quan (*"Ngập bánh xe ~15cm"*, *"Ngập ống pô ~30cm"*, *"Ngập quá yên/gầm ô tô >50cm"*) để cảnh báo người khác mà không sợ kẻ xấu ở xa spam tin giả.
- **US-05 (Đối chiếu Camera giao thông):** Là người dùng cẩn thận, tôi muốn bấm vào biểu tượng Camera TTGT ngay gần điểm báo ngập để xem vị trí và mở nhanh ứng dụng xem thực tế giao lộ đó.

---

## 3. Phân Định Phạm Vi MVP Theo MoSCoW

| Phân loại | Danh mục tính năng |
| :--- | :--- |
| **MUST HAVE (Bắt buộc có trong MVP)** | 1. **Bản đồ 4 quận trọng điểm** (Bình Thạnh, Q7, Q8, Thủ Đức) tải $< 3\text{s}$ trên 4G.<br>2. **Dự báo ngập trước 1–3h** dựa trên thuật toán kết hợp Mưa (`Open-Meteo`) + Triều cường (`Đài KTTV`) + Điểm đen lịch sử.<br>3. **Hiển thị Ngôn ngữ kép** trên mọi thẻ cảnh báo: Dòng 1 (Khoa học) + Dòng 2 (Đời thường cho Xe máy & Ô tô).<br>4. **Gợi ý lộ trình thay thế tránh ngập (Flood-Aware Routing)** có công tắc chọn **Xe máy** vs **Ô tô**.<br>5. **Báo cáo cộng đồng kiểm soát 5 lớp**: Bắt buộc Ảnh chụp + Kiểm tra EXIF ($\le 10$ phút) + Khớp GPS ($\le 500\text{m}$) + Chọn mức ngập trực quan + Kiểm chứng chéo ($\ge 3$ người xác nhận) + Điểm uy tín & TTL 90 phút.<br>6. **Lớp tọa độ Camera TTGT** kèm hướng dẫn/deeplink đối chiếu thực tế. |
| **SHOULD HAVE (Nên có ngay trong MVP)** | 7. **Lưu lộ trình cá nhân hàng ngày** (ví dụ: Nhà $\leftrightarrow$ Công ty) vào bộ nhớ thiết bị và bật cảnh báo nhanh.<br>8. **Timeline ngập theo tuyến đường** (*"Đường Huỳnh Tấn Phát thường ngập khung 16h30–19h00 những ngày triều cường"*). |
| **COULD HAVE (Giai đoạn mở rộng)** | 9. AI Computer Vision tự động đo độ sâu ngập từ ảnh người dùng chụp.<br>10. Mở rộng ra toàn bộ 22 quận/huyện TP.HCM. |
| **WON'T HAVE (Không làm ở MVP)** | - Không hợp tác hay xin API từ bên ngoài (`UDI Maps`, `nuoclen`, `FEDS`).<br>- Không crawl lậu luồng video camera giao thông.<br>- Không xây dựng mạng xã hội bình luận tự do gây nhiễu loạn. |

---

## 4. Quy Chuẩn Mức Độ Ngập & Ngôn Ngữ Kép (Dual-Language Spec)

| Cấp độ | Mã màu | Độ sâu ước tính | Hiển thị Khoa Học (Dòng 1) | Hiển thị Đời Thường — Xe Máy (Dòng 2A) | Hiển thị Đời Thường — Ô Tô (Dòng 2B) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cấp 0: Bình thường** | Xanh lá (`#10B981`) | $0\text{cm}$ | Mưa $< 10\text{mm/h}$, Triều $< 1.40\text{m}$ | Mặt đường khô ráo, xe máy đi lại bình thường. | Ô tô di chuyển bình thường. |
| **Cấp 1: Ngập nhẹ / Chớm ngập** | Vàng (`#F59E0B`) | $10 - 20\text{cm}$ | Mưa $20\text{mm/h}$ hoặc Triều $1.50\text{m}$ — Ngập $10-20\text{cm}$ | 🛞 **Ngập xâm xấp bánh xe (~15cm)**. Đi chậm giữ đều ga, tránh đi sát lề trũng. | 🚗 **Nước ngập 1/3 bánh xe**. Sedan đi chậm tránh tạo sóng nước. |
| **Cấp 2: Ngập trung bình (Nguy hiểm)** | Cam (`#F97316`) | $20 - 35\text{cm}$ | Mưa $35\text{mm/h}$ + Triều $1.60\text{m}$ — Ngập $20-35\text{cm}$ | ⚠️ **Ngập ngang ống pô xe máy (~30cm)**. Xe tay ga rất dễ chết máy, nên đi đường vòng! | ⚠️ **Ngập chạm gầm xe Sedan (~30cm)**. Nguy cơ tràn nước/thủy kích nếu có sóng xe tải. Nên tránh! |
| **Cấp 3: Ngập sâu (Tê liệt)** | Đỏ đậm (`#EF4444`) | $> 35 - 50\text{cm+}$ | Mưa $> 50\text{mm/h}$ + Triều $\ge 1.65\text{m}$ — Ngập $> 40\text{cm}$ | ⛔ **Ngập lút yên / nửa xe (>45cm)**. Chết máy hàng loạt, **tuyệt đối không đi vào!** | ⛔ **Ngập quá đèn pha / nắp capo (>45cm)**. Nguy cơ thủy kích cực cao cho cả SUV & Sedan. **Cấm đi vào!** |

---

## 5. Yêu Cầu Phi Chức Năng (Non-Functional Requirements)
- **Hiệu năng (Performance):** Tải màn hình bản đồ đầu tiên (First Contentful Paint & Map Ready) **$< 3\text{ giây}$** trên mạng 4G di động.
- **Độ tươi dữ liệu (Data Freshness):** Dự báo mưa/triều cập nhật mỗi 30 phút; báo cáo cộng đồng hiển thị trong vòng $< 5\text{ giây}$ sau khi gửi hợp lệ; tự động hạ cấp sau **90 phút (TTL)** nếu không có xác nhận mới.
- **Chống gian lận (Anti-Abuse):** Chặn 100% báo cáo có khoảng cách GPS $> 500\text{m}$, thiếu ảnh chụp, hoặc EXIF ảnh cũ hơn 10 phút.

---

## 6. Quyết Định Đã Chốt
1. PRD đã tích hợp đầy đủ 5 tính năng cốt lõi, chế độ kép cho cả **Xe máy & Ô tô**, nút chọn mức ngập trực quan theo bộ phận xe và cơ chế kiểm duyệt 5 lớp.
2. **GATE 1 ĐÃ ĐƯỢC CHỦ DỰ ÁN PHÊ DUYỆT.**

## 7. Câu Hỏi Mở Cho Chủ Dự Án
- Đã giải quyết toàn bộ tại Gate 1.

## 8. Chuyển Giao / Rủi Ro
- **Bàn giao:** Chuyển giao cho toàn bộ các Agent của **Phase 2 (Kiến trúc hệ thống, Luồng xử lý, Data Pipeline, API, DB Tuning, Security, Privacy & Backlog)**.
