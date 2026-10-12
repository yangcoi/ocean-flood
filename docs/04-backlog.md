# Kế Hoạch Sprint & Danh Mục Công Việc (Product Backlog): Ocean Flood

**Người phụ trách:** Senior Project Manager & Sprint Prioritizer (`agency-senior-project-manager`, `agency-sprint-prioritizer`)  
**Dựa trên:** Toàn bộ `docs/02-prd.md` và `docs/03-*.md`  
**Ngày lập:** 2026-10-12  

---

## 1. Lộ Trình 4 Sprint Xây Dựng MVP (Tổng thời gian: 2 – 3 tuần)

Chiến lược chia nhỏ cho 1 người + AI Agent: **Mỗi Sprint ra một mảnh ghép chạy được ngay trên màn hình**, ưu tiên cốt lõi trước.

---

### 🏃 SPRINT 1: Walking Skeleton + Dự Báo Ngập 1–3h & Ngôn Ngữ Kép (Ngày 1 – 4)
**Mục tiêu Sprint 1:** Mở bản đồ web $< 3\text{s}$, hiển thị 4 quận trọng điểm (Bình Thạnh, Q7, Q8, Thủ Đức), danh sách điểm đen ngập lịch sử, tọa độ Camera TTGT, và chạy thành công **Động cơ Dự báo ngập trước 1–3h kèm thẻ Ngôn ngữ kép (Khoa học + Đời thường cho Xe máy & Ô tô)**.

| Task ID | Tên công việc | Tiêu chí hoàn thành (Acceptance Criteria) | Phụ thuộc | Agent thực thi |
| :--- | :--- | :--- | :--- | :--- |
| **T1.1** | Khởi tạo dự án Next.js + Tailwind + MapLibre GL JS (PWA) | Chạy local mượt mà, bản đồ nền OSM hiển thị đúng vùng TP.HCM (4 quận MVP), load $< 3\text{s}$. | Gate 3 | `gis-solution-engineer` |
| **T1.2** | Thiết lập Schema PostGIS / Seed dữ liệu Điểm đen & Camera TTGT | Có đầy đủ ~30 tuyến đường điểm đen ngập của 4 quận (kèm `avoid_polygon` & `typical_timeline`) và tọa độ Camera TTGT xung quanh. | T1.1 | `gis-spatial-data-engineer` |
| **T1.3** | Xây dựng `Forecast Engine` (Mưa Open-Meteo + Triều KTTV) & Bộ dịch Ngôn ngữ kép | API `/api/alerts` lấy mưa dự báo 1–3h + đỉnh triều Phú An, tính xác suất ngập (%) và sinh tự động **Dòng khoa học + Dòng đời thường (Xe máy & Ô tô)**. | T1.2 | `agency-backend-architect` |
| **T1.4** | Hiển thị Layer Cảnh báo, Tọa độ Camera & Thẻ thông tin Ngôn ngữ kép trên Bản đồ | Bấm vào điểm ngập hiện rõ: Mức ngập, Xác suất dự báo, Dòng khoa học, Lời khuyên cho Xe máy/Ô tô, Timeline giờ hay ngập và vị trí Camera gần nhất. | T1.3 | `gis-web-gis-developer` |

---

### 🏃 SPRINT 2: Báo Cáo Cộng Đồng Kiểm Soát Chặt 5 Lớp (Ngày 5 – 8)
**Mục tiêu Sprint 2:** Người dùng tại hiện trường bấm báo ngập kèm ảnh + địa chỉ GPS, hệ thống chặn đứng báo cáo lung tung và tự động kiểm chứng chéo $\ge 3$ người.

| Task ID | Tên công việc | Tiêu chí hoàn thành (Acceptance Criteria) | Phụ thuộc | Agent thực thi |
| :--- | :--- | :--- | :--- | :--- |
| **T2.1** | Xây dựng Modal Báo Ngập Trực Quan (Chọn mức ngập theo bộ phận xe + Chụp ảnh + GPS) | Có 3 nút trực quan (*Bánh xe ~15cm / Ống pô ~30cm / Yên xe & Gầm ô tô >50cm*) + nút *"Đã rút nước"*. Bắt buộc chụp ảnh (nén WebP $< 150\text{KB}$), tự điền địa chỉ từ GPS. | T1.4 | `agency-frontend-developer` |
| **T2.2** | Xây dựng `5-Layer Verification Engine` tại API `POST /api/reports` | Kiểm tra nghiêm ngặt: (1) Rate limit $\le 5$/giờ, (2) Khoảng cách GPS $\le 500\text{m}$, (3) Thời gian ảnh EXIF/Camera $\le 10\text{ phút}$, (4) Gom cụm $150\text{m}$ đếm $\ge 3$ người xác nhận $\rightarrow$ `VERIFIED`, (5) Cộng điểm uy tín thiết bị. | T2.1 | `agency-backend-architect` |
| **T2.3** | Cơ chế TTL 90 phút & Nút xác nhận chéo nhanh ("Đúng, đang ngập" / "Đã hết ngập") | Điểm báo cáo hiện rõ huy hiệu *"Chưa xác minh (1/3)"* hoặc *"Đã xác minh"*, tự làm mờ/hạ cấp sau 90 phút nếu không có xác nhận mới. | T2.2 | `gis-web-gis-developer` |

---

### 🏃 SPRINT 3: Gợi Ý Lộ Trình Thay Thế Tránh Ngập Cho Xe Máy & Ô Tô (Ngày 9 – 13)
**Mục tiêu Sprint 3:** Nhập Điểm đi $\rightarrow$ Điểm đến, chọn **Xe máy** hoặc **Ô tô**, hệ thống phát hiện đường đi qua vùng ngập/sắp ngập và vẽ ngay **Lộ trình thay thế an toàn**.

| Task ID | Tên công việc | Tiêu chí hoàn thành (Acceptance Criteria) | Phụ thuộc | Agent thực thi |
| :--- | :--- | :--- | :--- | :--- |
| **T3.1** | Xây dựng `Flood-Aware Routing Engine` (`POST /api/route-plan`) | Tích hợp định tuyến OSM (Valhalla/OSRM) + kiểm tra giao cắt `ST_Intersects` với `avoid_polygon`. Phân nhánh ngưỡng ngập và loại đường riêng cho **Xe máy ($\ge 20\text{cm}$)** và **Ô tô ($\ge 25\text{cm}$, cấm rẽ hẻm nhỏ)**. | T1.3, T2.2 | `gis-solution-engineer` |
| **T3.2** | Giao diện Tìm đường & So sánh Lộ trình Tránh ngập trên Bản đồ | Thanh nhập Điểm đi/Điểm đến + Công tắc chọn **🏍️ Xe máy / 🚗 Ô tô**. Vẽ đường ngập (nét đứt đỏ) và đường thay thế an toàn (nét liền nổi bật) kèm thời gian chênh lệch. | T3.1 | `agency-frontend-developer` |
| **T3.3** | Tính năng Lưu "Lộ trình đi làm hàng ngày" & Cảnh báo chủ động | Lưu lộ trình cá nhân vào máy, tự động kiểm tra và bật banner cảnh báo ngay khi mở app nếu lộ trình quen thuộc sắp ngập trong 1–3h tới. | T3.2 | `agency-frontend-developer` |

---

### 🏃 SPRINT 4: Kiểm Thử Thực Chiến, Tối Ưu Hiệu Năng 4G & Ra Mắt (Ngày 14 – 16)
**Mục tiêu Sprint 4:** Đảm bảo không lỗi tọa độ, tốc độ tải $< 3\text{s}$, đầy đủ Disclaimer pháp lý và sẵn sàng chạy thực tế.

| Task ID | Tên công việc | Tiêu chí hoàn thành (Acceptance Criteria) | Phụ thuộc | Agent thực thi |
| :--- | :--- | :--- | :--- | :--- |
| **T4.1** | Kiểm thử QA Không gian & Chống gian lận báo cáo | Test toàn bộ kịch bản giả lập: báo ngập cách $> 500\text{m}$ (bị chặn), ảnh cũ $> 10\text{ phút}$ (bị chặn), 3 người xác nhận (lên Verified), tìm đường tránh ngập cho Xe máy & Ô tô. | Sprint 1–3 | `gis-qa-engineer` |
| **T4.2** | Hoàn thiện Disclaimer pháp lý, Consent GPS (NĐ 13/2023) & Deploy Production | Đầy đủ ghi nhận nguồn (Attribution), Modal đồng ý GPS, Chính sách bảo mật, Edge Caching hoạt động ổn định. | T4.1 | `agency-devops-automator` |

---

## 2. Điều Chỉnh Ưu Tiên Của Sprint Prioritizer
- **Đưa lên ưu tiên cao nhất (Sprint 1):** Bộ dự báo ngập 1–3h + Ngôn ngữ cảnh báo kép (Khoa học + Đời thường) vì đây là **DNA tạo sự khác biệt ngay từ cái nhìn đầu tiên** mà không cần chờ phải có đông người dùng vào báo cáo mới thấy giá trị.
- **Đưa vào Sprint 2 & 3:** Báo cáo cộng đồng 5 lớp và Tìm đường tránh ngập cho Xe máy/Ô tô — hoàn thiện trọn vẹn vòng lặp giá trị chủ động cho người dân TP.HCM.

---

## 3. Quyết Định Đã Chốt
1. Chia lộ trình thành **4 Sprint ngắn gọn, thực tế**, bám sát 100% yêu cầu của Chủ dự án.
2. Không có bất kỳ công việc thừa thãi nào ngoài phạm vi sản phẩm cốt lõi.

## 4. Câu Hỏi Mở Cho Chủ Dự Án (Tại GATE 2)
1. Bạn có đồng ý với lựa chọn công nghệ **Next.js (TypeScript, Tailwind) + MapLibre GL JS + Supabase PostGIS** và kế hoạch **4 Sprint** như trên không?
2. Nếu bạn duyệt **GATE 2**, chúng ta sẽ chuyển sang **Phase 3 (Thiết kế giao diện UI/UX & Bản đồ học Cartography)** rồi bắt đầu viết code ở **Phase 4**!

## 5. Chuyển Giao / Rủi Ro
- **Bàn giao:** Hồ sơ kiến trúc Phase 2 hoàn chỉnh (`02-prd.md`, `03-architecture.md`, `03-workflows.md`, `03-data-pipeline.md`, `03-api.md`, `03-threat-model.md`, `04-backlog.md`) sẵn sàng trình duyệt tại **GATE 2**.
