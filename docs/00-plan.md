# Kế Hoạch Dự Án: HCM Alert Map (Ocean Flood)

**Người phụ trách:** Senior Project Manager  
**Dựa trên:** `docs/RULES.md`, `docs/00-brief.md`  
**Ngày lập:** 2026-10-12  

---

## 1. Rà Soát Brief & Giả Định Dự Án

Qua rà soát `docs/00-brief.md`, các điểm còn thiếu sót hoặc tiềm ẩn mâu thuẫn được xử lý bằng các giả định hợp lý sau:

| Điểm rà soát | Vấn đề trong Brief | Giả định giải quyết (Assumptions) |
| :--- | :--- | :--- |
| **Nguồn dữ liệu thời gian thực** | Chưa xác định được API ngập lụt/triều cường mở chính thức của cơ quan nhà nước tại TP.HCM. | Giả định ban đầu: Dùng dữ liệu lịch triều cường cố định (theo trạm Phú An / Nhà Bè) kết hợp mô hình hóa điểm ngập tĩnh lịch sử. Nguồn realtime sẽ để **GIS Technical Consultant** khảo sát ở Phase 1. |
| **Phạm vi 4 quận** | 4 quận (Bình Thạnh, Q7, Q8, Thủ Đức) có diện tích rất rộng, dễ loãng nguồn lực nếu cào toàn bộ dữ liệu. | Giới hạn MVP vào **5–10 tuyến đường "điểm đen" ngập nặng tiêu biểu** của mỗi quận thay vì số hóa toàn bộ hệ thống thoát nước của quận. |
| **Báo cáo từ người dùng (Crowdsourcing)** | Có thể bị spam hoặc báo cáo giả gây hoang mang, tốn công kiểm duyệt. | Trong MVP, nếu triển khai báo cáo người dùng thì chỉ gắn nhãn "Chưa kiểm chứng" và cần ít nhất 3 báo cáo trùng tọa độ mới kích hoạt cảnh báo, hoặc hoãn tính năng này sang phase sau nếu nguồn tự động đủ tốt. |
| **Hạ tầng 0 đồng** | Dữ liệu GIS và bản đồ số có thể phát sinh chi phí tile server nếu traffic tăng đột biến. | Sử dụng vector tiles miễn phí (OpenStreetMap / MapLibre) kết hợp hosting tĩnh (Vercel / Cloudflare Pages) và database Supabase / Neon / Render tier miễn phí. |

---

## 2. Đề Xuất Cắt MVP Nhỏ Nhất Có Giá Trị (Thin Slice MVP)

Để đảm bảo hoàn thành trong **2 – 3 tuần** cho 1 người phát triển cùng AI Agent, MVP được cô đọng như sau:

* **Bản đồ nền:** Nhẹ, tải nhanh (< 3s trên di động), hiển thị ranh giới TP.HCM và focus vào 4 quận trọng điểm.
* **Lớp dữ liệu 1 (Triều cường):** Hiển thị đỉnh triều trong ngày (giờ bắt đầu dâng, giờ đạt đỉnh, giờ rút) dựa trên dữ liệu trạm thủy văn Phú An & Nhà Bè.
* **Lớp dữ liệu 2 (Ngập lụt):** Hiển thị các điểm ngập lịch sử tương ứng với mức triều/mưa (gồm: Tên đường, mức ngập dự kiến theo cm hoặc mức cảnh báo Xanh/Vàng/Đỏ, thời gian cập nhật, nguồn tin cậy).
* **Loại bỏ khỏi MVP:** Không làm tài khoản đăng nhập phức tạp, không làm định tuyến dẫn đường, không làm thông báo đẩy native app (dùng web thông thường trước).

---

## 3. Lộ Trình Triển Khai Chi Tiết (Project Phases)

Ước lượng thời gian được tính toán cho **1 người lập trình viên (vibe coding) với sự hỗ trợ của các chuyên gia AI Agent**.

### Phase 0: Khởi Động & Thiết Lập Quy Trình (Kickoff & Governance)
* **Mục tiêu:** Thống nhất kế hoạch, quy ước Git, phân rã trách nhiệm điều phối giữa các agent.
* **Đầu ra:** `docs/00-plan.md`, `docs/00-git-workflow.md`, `docs/00-orchestration.md`.
* **Ước lượng:** 1 ngày làm việc.
* **Điều kiện qua cửa (GATE 0):** Chủ dự án duyệt kế hoạch thực hiện và quy trình Git.

### Phase 1: Khảo Sát & Xác Định Yêu Cầu (Discovery)
* **Mục tiêu:** Điều tra nguồn dữ liệu GIS khả thi tại TP.HCM, đánh giá rủi ro pháp lý, nghiên cứu thị trường, làm rõ yêu cầu không gian và ban hành PRD.
* **Đầu ra:**
  - `docs/01-data-sources.md` (GIS Technical Consultant)
  - `docs/01-legal.md` (Legal Compliance Checker)
  - `docs/01-market.md` (Trend Researcher)
  - `docs/01-interview-guide.md` & `docs/01-insights.md` (UX Researcher & Synthesizer)
  - `docs/01-spatial-requirements.md` (GIS Analyst)
  - `docs/02-prd.md` (Product Manager)
* **Ước lượng:** 3 – 4 ngày làm việc.
* **Điều kiện qua cửa (GATE 1):** Duyệt PRD. Bắt buộc xác minh ít nhất 1 nguồn dữ liệu ngập/triều có thể lấy được hợp pháp và ổn định.

### Phase 2: Thiết Kế Kiến Trúc & Kỹ Thuật (Architecture & Backlog)
* **Mục tiêu:** Thiết kế toàn bộ kiến trúc phần mềm, quy trình dữ liệu không gian, đặc tả API, schema CSDL và lập danh sách công việc (Backlog).
* **Đầu ra:**
  - `docs/03-architecture.md` (Software Architect)
  - `docs/03-workflows.md` (Workflow Architect)
  - `docs/03-data-pipeline.md` (GIS Spatial Data Engineer)
  - `docs/03-api.md` (Backend Architect)
  - `docs/03-db-tuning.md` (Database Optimizer)
  - `docs/03-threat-model.md` & `docs/03-privacy.md` (Security & Privacy)
  - `docs/04-backlog.md` (Senior PM & Sprint Prioritizer)
* **Ước lượng:** 3 – 4 ngày làm việc.
* **Điều kiện qua cửa (GATE 2):** Duyệt kiến trúc và backlog; đảm bảo stack công nghệ phù hợp với năng lực 1 người bảo trì.

### Phase 3: Thiết Kế Trải Nghiệm & Bản Đồ Học (Design & Cartography)
* **Mục tiêu:** Xây dựng hệ thống thiết kế giao diện (UI tokens) và quy tắc bản đồ học cảnh báo (Cartography) tối ưu cho màn hình điện thoại ngoài nắng mưa.
* **Đầu ra:**
  - `docs/05-design-spec.md` (UX Architect & UI Designer)
  - `docs/05-cartography.md` (GIS Cartography Designer)
  - `docs/05-walkthrough.md` (Persona Walkthrough Specialist)
* **Ước lượng:** 2 ngày làm việc.
* **Điều kiện qua cửa (GATE 3):** Duyệt bảng màu cảnh báo, phân tầng thị giác bản đồ và luồng giao diện mobile.

### Phase 4: Lập Trình Theo Sprint (Build & Development)
* **Mục tiêu:** Xây dựng ứng dụng hoàn chỉnh qua các Sprint tuần tự.
  - **Sprint 1 (Walking Skeleton):** Dựng khung sườn bản đồ nền + 1 lớp dữ liệu chạy thông suốt từ CSDL/API ra giao diện (`docs/06-sprint-1.md`).
  - **Sprint 2 (Core Features):** Nạp dữ liệu thật ngập lụt + triều cường, bộ lọc 4 quận, chi tiết cảnh báo (`docs/06-sprint-2.md`).
  - **Sprint 3 (Polish & Edge cases):** Tối ưu PWA, ngoại tuyến cơ bản, cảnh báo dữ liệu cũ (`docs/06-sprint-3.md`).
* **Ước lượng:** 6 – 8 ngày làm việc.
* **Điều kiện qua cửa (GATE 4):** Ứng dụng chạy mượt mà trên môi trường local/staging, đạt tiêu chí tải dưới 3 giây trên 4G.

### Phase 5: Kiểm Thử & Đảm Bảo Chất Lượng (QA & Audit)
* **Mục tiêu:** Rà soát toàn diện về chức năng, hiệu năng di động, kiểm thử hiển thị bản đồ và kiểm toán bảo mật.
* **Đầu ra:** `docs/07-qa-report.md`.
* **Ước lượng:** 2 ngày làm việc.
* **Điều kiện qua cửa (GATE 5):** Không còn lỗi blocker/critical; cảnh báo hiển thị đầy đủ nguồn và mức độ tin cậy.

### Phase 6: Triển Khai & Vận Hành (Launch & Runbook)
* **Mục tiêu:** Đưa ứng dụng lên môi trường Production miễn phí, cấu hình tên miền (nếu có), thiết lập tài liệu giám sát và xử lý sự cố.
* **Đầu ra:** `docs/08-launch.md`, `docs/08-runbook.md`.
* **Ước lượng:** 1 – 2 ngày làm việc.
* **Điều kiện qua cửa (GATE 6):** Ứng dụng hoạt động trực tuyến công khai và sẵn sàng phục vụ người dân.

---

## 4. Quyết Định Đã Chốt
1. Dự án chính thức mang tên mã: **HCM Alert Map (Ocean Flood)**.
2. Mô hình phát triển: **1 Lập trình viên + Đội ngũ AI Agent chuyên môn hóa**.
3. Phạm vi thử nghiệm: 4 quận trọng điểm (Bình Thạnh, Q7, Q8, TP. Thủ Đức).
4. Hai lớp thông tin nòng cốt: **Ngập lụt** và **Triều cường**.

---

## 5. Câu Hỏi Mở Cho Chủ Dự Án
1. Bạn có sẵn tài liệu/danh sách các tuyến đường hay ngập mà bạn thường gặp ở 4 quận này không, hay để đội GIS tự tổng hợp từ dữ liệu công khai?
2. Bạn có yêu cầu bắt buộc về ngôn ngữ Backend không (Node.js/TypeScript hay Python)?

---

## 6. Chuyển Giao / Rủi Ro
* **Rủi ro phụ thuộc dữ liệu:** Đây là rủi ro cao nhất của dự án. Nếu các API nhà nước không mở, bắt buộc phải có phương án fallback (mô hình hóa dựa trên lịch triều + trạm đo mực nước tĩnh + báo cáo cộng đồng).
* **Chuyển giao:** Bàn giao tài liệu này cho **Git Workflow Master** để tiến hành thiết kế quy trình Git trong Task 0.2.
