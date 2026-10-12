# 🗺️ HCM Alert Map — Prompt Pack cho Antigravity

Bản đồ cảnh báo **kẹt xe / ngập / triều cường** TP.HCM, chạy bằng đội agent từ repo `agency-agents`.

## Cách dùng

1. Tạo cấu trúc thư mục trong repo dự án:
   ```
   docs/
     RULES.md            ← dán mục "RULES" bên dưới
     00-brief.md         ← dán mục "BRIEF" bên dưới, điền chỗ [BẠN ĐIỀN]
   ```
2. Mỗi prompt = **một chat mới** trong Antigravity. Dán nguyên khối prompt.
3. Agent ghi kết quả ra file trong `docs/`. Agent sau đọc file đó (đây là "bộ nhớ chung").
4. Dừng ở mỗi **GATE** để bạn duyệt. Không duyệt thì không sang phase sau.
5. Nếu agent trả lời lan man hoặc làm quá phạm vi: nhắc "Chỉ làm đúng mục Nhiệm vụ, ghi vào file đầu ra, dừng."

Bản đồ file:

| File | Do agent nào ghi | Phase |
|---|---|---|
| 00-brief.md | Bạn | 0 |
| 01-data-sources.md | GIS Technical Consultant | 1 |
| 01-legal.md | Legal Compliance Checker | 1 |
| 01-market.md | Trend Researcher | 1 |
| 01-interview-guide.md / 01-insights.md | UX Researcher / Feedback Synthesizer | 1 |
| 01-spatial-requirements.md | GIS Analyst | 1 |
| 02-prd.md | Product Manager | 1 |
| 03-architecture.md | Software Architect | 2 |
| 03-workflows.md | Workflow Architect | 2 |
| 03-data-pipeline.md | GIS Spatial Data Engineer | 2 |
| 03-api.md | Backend Architect | 2 |
| 03-db-tuning.md | Database Optimizer | 2 |
| 03-threat-model.md / 03-privacy.md | Security Architect / Privacy Engineer | 2 |
| 04-backlog.md | Senior PM + Sprint Prioritizer | 2 |
| 05-design-spec.md / 05-cartography.md | UX Architect + UI Designer / GIS Cartography Designer | 3 |
| 06-sprint-N.md | Các agent build | 4 |
| 07-qa-report.md | Nhóm QA | 5 |
| 08-launch.md / 08-runbook.md | DevOps, SRE, Incident Response | 6 |

---

## RULES (dán vào `docs/RULES.md`)

```markdown
# Quy tắc chung cho mọi agent

1. Ngôn ngữ: trả lời bằng tiếng Việt. Thuật ngữ kỹ thuật giữ tiếng Anh.
2. Chỉ làm đúng mục "Nhiệm vụ" của prompt. Không làm việc của agent khác. Thấy vấn đề ngoài phạm vi thì ghi vào mục "Chuyển giao / Rủi ro" ở cuối file.
3. KHÔNG bịa nguồn dữ liệu, URL, API, số liệu, tên văn bản pháp luật. Chưa kiểm chứng được thì ghi rõ [CHƯA XÁC MINH] kèm cách kiểm chứng.
4. Không viết code ở Phase 0-3 (trừ khi prompt yêu cầu). Chỉ viết tài liệu.
5. Cuối mỗi file đầu ra luôn có 3 mục: "Quyết định đã chốt", "Câu hỏi mở cho chủ dự án", "Chuyển giao / Rủi ro".
6. Hỏi tối đa 3 câu làm rõ trước khi bắt đầu; nếu thiếu thông tin thì nêu giả định và làm tiếp.
7. Đây là hệ thống cảnh báo liên quan an toàn người dân. Mọi nội dung hiển thị phải có mức độ tin cậy, thời điểm cập nhật, và nguồn. Không đưa ra khẳng định tuyệt đối ("an toàn", "chắc chắn không ngập").
8. Ưu tiên giải pháp đơn giản, open source, chi phí thấp. Phạm vi MVP được ưu tiên hơn tính năng đầy đủ.
9. Mọi quyết định công nghệ phải ghi lý do và phương án thay thế đã loại.
```

---

## BRIEF (dán vào `docs/00-brief.md`, điền chỗ [BẠN ĐIỀN])

```markdown
# Project Brief: HCM Alert Map

## Ý tưởng
Bản đồ web cảnh báo theo thời gian gần thực về kẹt xe, ngập lụt và triều cường tại TP.HCM.

## Vấn đề
Người đi lại ở TP.HCM (đặc biệt xe máy, tài xế, shipper) khó biết trước tuyến nào đang ngập hoặc kẹt, nhất là khi mưa lớn kết hợp triều cường.
[BẠN ĐIỀN: câu chuyện/động lực cá nhân, nếu có]

## Người dùng mục tiêu (giả định, cần kiểm chứng)
- Người đi xe máy đi làm hằng ngày
- Tài xế công nghệ / shipper
- Cư dân vùng trũng, ven sông
- [BẠN ĐIỀN: nhóm khác]

## Phạm vi địa lý ban đầu
[BẠN ĐIỀN: toàn TP hay vài quận? Gợi ý: bắt đầu 3-5 quận hay ngập]

## Ba lớp thông tin
1. Ngập lụt  2. Triều cường  3. Kẹt xe
Ưu tiên MVP: [BẠN ĐIỀN: chọn 1 lớp làm trước. Gợi ý: ngập + triều vì liên quan nhau, kẹt xe cần dữ liệu khó lấy hơn]

## Ràng buộc
- Người làm: 1 người, vibe coding bằng agent trong Antigravity
- Ngân sách: [BẠN ĐIỀN: ví dụ 0 đồng / tối đa X/tháng]
- Thời gian MVP: [BẠN ĐIỀN]
- Nền tảng: web (PWA), dùng tốt trên điện thoại
- Ngôn ngữ giao diện: tiếng Việt (có thể thêm tiếng Anh)
- Kỹ năng của tôi: [BẠN ĐIỀN: ngôn ngữ/stack đã biết. Tôi học Java, SQL, thiết kế CSDL ở trường]

## Nguồn dữ liệu đã biết
[BẠN ĐIỀN: nếu biết nguồn nào; nếu không, để trống cho GIS Technical Consultant điều tra]

## Tiêu chí thành công MVP (đề xuất, sửa nếu cần)
- Người dùng mở bản đồ và thấy được các điểm/vùng ngập hoặc nguy cơ trong khu vực MVP
- Mỗi cảnh báo có: mức độ, thời điểm cập nhật, nguồn
- Tải bản đồ dưới 3 giây trên 4G
- Có cách báo cáo điểm ngập từ người dùng (nếu PRD duyệt)

## Ngoài phạm vi (MVP)
- App native iOS/Android
- Dự báo ML phức tạp
- Điều hướng/chỉ đường
```

---

# PHASE 0: KHỞI ĐỘNG

### 0.1 Senior Project Manager

```
Kích hoạt chế độ Senior Project Manager.
Đọc docs/RULES.md và docs/00-brief.md.

Nhiệm vụ:
1. Rà brief, liệt kê chỗ còn thiếu hoặc mâu thuẫn, và đưa giả định hợp lý cho từng chỗ.
2. Viết docs/00-plan.md: các phase (Discovery, Kiến trúc, Thiết kế, Build, QA, Launch, Vận hành), mỗi phase gồm mục tiêu, đầu ra, điều kiện qua cửa (gate), ước lượng thời gian thực tế cho 1 người làm với agent hỗ trợ.
3. Đề xuất cách cắt MVP nhỏ nhất vẫn có giá trị.

Đầu ra: docs/00-plan.md. Không viết code.
```

### 0.2 Git Workflow Master

```
Kích hoạt chế độ Git Workflow Master.
Đọc docs/RULES.md và docs/00-plan.md.

Nhiệm vụ: thiết kế quy trình Git cho dự án 1 người dùng agent AI:
- Branch strategy (đơn giản, phù hợp 1 người)
- Quy ước commit (conventional commits)
- Quy tắc để mỗi agent làm việc trên branch riêng và dễ rollback khi agent làm hỏng
- .gitignore cần có (đặc biệt không commit secret, file .env, dữ liệu thô lớn)
- Checklist trước mỗi lần merge

Đầu ra: docs/00-git-workflow.md. Chưa tạo code.
```

### 0.3 Agents Orchestrator

```
Kích hoạt chế độ Agents Orchestrator.
Đọc docs/RULES.md, docs/00-brief.md, docs/00-plan.md, docs/00-git-workflow.md.

Nhiệm vụ: đóng vai điều phối. Xác nhận thứ tự chạy agent cho từng phase dựa trên pack prompt, chỉ ra phụ thuộc giữa các file docs, và chỉ ra rủi ro dừng dự án lớn nhất (dự kiến: nguồn dữ liệu). Không tự chạy việc của agent khác.

Đầu ra: docs/00-orchestration.md gồm bảng: Phase | Agent | Đọc file nào | Ghi file nào | Gate.
```

**GATE 0:** bạn đọc `00-plan.md`, sửa brief nếu cần, rồi sang Phase 1.

---

# PHASE 1: DISCOVERY

### 1.1 GIS Technical Consultant

```
Kích hoạt chế độ GIS Technical Consultant (gis-technical-consultant).
Đọc docs/RULES.md và docs/00-brief.md.

Nhiệm vụ:
1. Điều tra nguồn dữ liệu cho TP.HCM theo từng lớp: ngập, triều, mưa, kẹt xe, nền (đường, ranh giới hành chính), độ cao địa hình (DEM). Với mỗi nguồn: tên, đơn vị cung cấp, cách truy cập (API/tải file/scrape), định dạng, tần suất cập nhật, giấy phép, độ tin cậy, chi phí. Không biết chắc thì ghi [CHƯA XÁC MINH] và nói cách tự kiểm tra.
2. So sánh stack: open source (MapLibre/Leaflet + PostGIS + OSM) với Esri. Khuyến nghị 1 phương án cho dự án 1 người, 0 hoặc ít chi phí.
3. Nêu 5 rủi ro dữ liệu lớn nhất và cách giảm.

Đầu ra: docs/01-data-sources.md với bảng nguồn dữ liệu + khuyến nghị stack GIS.
```

### 1.2 Legal Compliance Checker

```
Kích hoạt chế độ Legal Compliance Checker.
Đọc docs/RULES.md, docs/00-brief.md, docs/01-data-sources.md.

Nhiệm vụ:
1. Với từng nguồn dữ liệu trong 01-data-sources.md: điều khoản sử dụng, có được dùng thương mại/công khai, có yêu cầu ghi nguồn, có giới hạn tần suất gọi.
2. Rủi ro pháp lý khi công bố cảnh báo ngập/triều cho công chúng tại Việt Nam, và disclaimer cần có.
3. Rủi ro khi thu thập báo cáo và vị trí từ người dùng (dữ liệu cá nhân theo quy định Việt Nam hiện hành).
Ghi rõ đây là rà soát sơ bộ, không thay thế luật sư; chỗ nào cần xác minh với văn bản gốc thì ghi [CHƯA XÁC MINH].

Đầu ra: docs/01-legal.md.
```

### 1.3 Trend Researcher

```
Kích hoạt chế độ Trend Researcher.
Đọc docs/RULES.md và docs/00-brief.md.

Nhiệm vụ: phân tích đối thủ và sản phẩm thay thế cho cảnh báo ngập/kẹt xe ở TP.HCM (Google Maps, Waze, các app/trang cảnh báo ngập, trang của cơ quan nhà nước, nhóm cộng đồng trên mạng xã hội). Với mỗi cái: điểm mạnh, điểm yếu, người dùng đang dùng nó làm gì. Rút ra khoảng trống mà dự án có thể chiếm. Không bịa; nếu không xác minh được một sản phẩm thì ghi rõ.

Đầu ra: docs/01-market.md.
```

### 1.4 UX Researcher

```
Kích hoạt chế độ UX Researcher.
Đọc docs/RULES.md, docs/00-brief.md, docs/01-market.md.

Nhiệm vụ: soạn bộ phỏng vấn để CHỦ DỰ ÁN đi hỏi 8-10 người thật:
- Nhóm đối tượng cần phỏng vấn và cách tìm họ
- 12-15 câu hỏi mở, tập trung vào hành vi thật (lần gần nhất gặp ngập/kẹt, họ làm gì, dùng gì, tin gì), tránh câu hỏi dẫn dắt
- Mẫu ghi chép
- Giả thuyết cần kiểm chứng và cách biết giả thuyết sai

Đầu ra: docs/01-interview-guide.md.
```

**⏸️ Dừng:** bạn đi phỏng vấn thật, ghi chú dán vào `docs/01-interview-notes.md`.

### 1.5 Feedback Synthesizer

```
Kích hoạt chế độ Feedback Synthesizer.
Đọc docs/RULES.md, docs/01-interview-guide.md, docs/01-interview-notes.md.

Nhiệm vụ: tổng hợp ghi chép phỏng vấn thành insight có thứ tự ưu tiên: nỗi đau chính, hành vi hiện tại, nguồn thông tin họ tin, điều khiến họ bỏ app. Trích dẫn ngắn từ ghi chú làm bằng chứng. Nêu giả thuyết nào bị bác bỏ.

Đầu ra: docs/01-insights.md.
```

### 1.6 GIS Analyst

```
Kích hoạt chế độ GIS Analyst (gis-analyst).
Đọc docs/RULES.md, docs/00-brief.md, docs/01-data-sources.md, docs/01-insights.md.

Nhiệm vụ: xác định yêu cầu phân tích không gian của sản phẩm:
- Đối tượng không gian cần mô hình hóa (điểm ngập, đoạn đường, vùng trũng, trạm đo, vùng ảnh hưởng)
- Câu hỏi không gian sản phẩm phải trả lời được (ví dụ: tuyến này đi qua điểm ngập nào; điểm này ngập thì ảnh hưởng đoạn nào)
- Độ phân giải không gian và thời gian cần thiết
- Hệ tọa độ đề xuất (lưu, hiển thị) và lưu ý chuyển đổi nếu dữ liệu nguồn theo hệ khác

Đầu ra: docs/01-spatial-requirements.md.
```

### 1.7 Product Manager

```
Kích hoạt chế độ Product Manager.
Đọc toàn bộ docs/01-*.md và docs/00-brief.md.

Nhiệm vụ: viết PRD:
- Vấn đề, người dùng chính, user stories
- Phạm vi MVP rõ ràng và danh sách "không làm" (MoSCoW)
- Yêu cầu chức năng và phi chức năng (hiệu năng, độ tươi của dữ liệu, khả dụng khi mưa lớn)
- Chỉ số đo thành công
- Rủi ro lớn nhất và điều kiện dừng/đổi hướng nếu nguồn dữ liệu không dùng được
- Câu hỏi mở cho chủ dự án

Đầu ra: docs/02-prd.md.
```

**GATE 1:** bạn duyệt `02-prd.md`. Bắt buộc: có ít nhất 1 lớp dữ liệu MVP với nguồn đã xác minh dùng được.

---

# PHASE 2: KIẾN TRÚC

### 2.1 Software Architect

```
Kích hoạt chế độ Software Architect.
Đọc docs/RULES.md, docs/02-prd.md, docs/01-data-sources.md, docs/01-spatial-requirements.md.

Nhiệm vụ: thiết kế kiến trúc tổng thể cho 1 người làm, chi phí thấp:
- Sơ đồ thành phần (có thể dùng Mermaid)
- Chọn stack frontend, backend, CSDL, hosting; ghi ADR cho mỗi lựa chọn (lý do + phương án loại)
- Luồng dữ liệu từ nguồn đến màn hình
- Chiến lược caching vì dữ liệu cập nhật theo chu kỳ
- Cấu trúc thư mục repo
Ràng buộc: ưu tiên stack đơn giản mà chủ dự án có thể bảo trì.

Đầu ra: docs/03-architecture.md.
```

### 2.2 Workflow Architect

```
Kích hoạt chế độ Workflow Architect.
Đọc docs/02-prd.md và docs/03-architecture.md.

Nhiệm vụ: mô tả MỌI đường đi trong hệ thống, kể cả đường lỗi:
- Thu thập dữ liệu thành công / nguồn chết / dữ liệu trễ / dữ liệu sai
- Người dùng xem bản đồ / mất mạng / GPS bị tắt
- Gửi báo cáo từ người dùng / báo cáo giả / spam
- Hết hạn cảnh báo, tự động hạ mức
Mỗi luồng: trigger, bước, trạng thái, hành vi khi lỗi.

Đầu ra: docs/03-workflows.md.
```

### 2.3 GIS Spatial Data Engineer

```
Kích hoạt chế độ GIS Spatial Data Engineer (gis-spatial-data-engineer).
Đọc docs/01-data-sources.md, docs/01-spatial-requirements.md, docs/03-architecture.md.

Nhiệm vụ: thiết kế pipeline và schema không gian:
- Schema PostGIS (bảng, kiểu geometry, SRID, cột thời gian, cột nguồn, cột độ tin cậy)
- Quy trình ETL cho từng nguồn: lấy, validate, chuẩn hóa tọa độ, làm sạch, nạp
- Quy ước thời gian: UTC+7 hay UTC, cách lưu và hiển thị
- Chính sách lưu lịch sử vs dữ liệu hiện tại, xóa dữ liệu cũ
- Cách phát hiện dữ liệu cũ/bất thường
Chưa viết code ETL, chỉ thiết kế và pseudo-code.

Đầu ra: docs/03-data-pipeline.md.
```

### 2.4 Backend Architect

```
Kích hoạt chế độ Backend Architect.
Đọc docs/03-architecture.md, docs/03-workflows.md, docs/03-data-pipeline.md.

Nhiệm vụ: thiết kế API:
- Danh sách endpoint (GET dữ liệu theo bbox/zoom, GET chi tiết điểm, POST báo cáo...), request/response mẫu (OpenAPI dạng rút gọn)
- Định dạng dữ liệu trả về cho bản đồ (GeoJSON / vector tiles) và lý do
- Phân trang, giới hạn tần suất, caching headers
- Xác thực cho phần cần xác thực (nếu có)

Đầu ra: docs/03-api.md.
```

### 2.5 Database Optimizer

```
Kích hoạt chế độ Database Optimizer.
Đọc docs/03-data-pipeline.md và docs/03-api.md.

Nhiệm vụ: rà schema PostGIS và các truy vấn chính: index không gian (GiST), index thời gian, partition cho time-series nếu cần, câu truy vấn mẫu cho "lấy điểm trong khung nhìn bản đồ", kế hoạch xử lý khi dữ liệu lớn dần. Đề xuất chỉnh schema nếu cần.

Đầu ra: docs/03-db-tuning.md.
```

### 2.6 Security Architect

```
Kích hoạt chế độ Security Architect.
Đọc docs/03-architecture.md, docs/03-workflows.md, docs/03-api.md.

Nhiệm vụ: threat model (STRIDE hoặc tương đương) cho hệ thống: báo cáo giả để gây hoảng loạn, spam, lạm dụng API, lộ secret, tấn công nguồn dữ liệu (poisoning), DoS lúc mưa bão. Đề xuất biện pháp giảm thiểu theo mức ưu tiên và phù hợp với dự án 1 người.

Đầu ra: docs/03-threat-model.md.
```

### 2.7 Privacy Engineer

```
Kích hoạt chế độ Privacy Engineer.
Đọc docs/01-legal.md, docs/03-workflows.md, docs/03-api.md.

Nhiệm vụ: thiết kế quyền riêng tư: dữ liệu cá nhân nào hệ thống thu (vị trí, IP, tài khoản), tối thiểu hóa, làm mờ vị trí báo cáo, thời gian lưu, quyền xóa, nội dung thông báo đồng ý. Đề xuất cách vận hành báo cáo ẩn danh nếu được.

Đầu ra: docs/03-privacy.md.
```

### 2.8 Senior PM + Sprint Prioritizer

```
Kích hoạt chế độ Senior Project Manager.
Đọc toàn bộ docs/02-*.md và docs/03-*.md.

Nhiệm vụ:
1. Chuyển PRD + kiến trúc thành backlog task cụ thể, mỗi task có: ID, mô tả, tiêu chí hoàn thành, phụ thuộc, agent phụ trách (theo bảng agent đã chốt), ước lượng.
2. Chia thành sprint (mỗi sprint 3-5 ngày làm việc), sprint đầu là "walking skeleton": bản đồ nền + 1 lớp dữ liệu đi hết luồng từ nguồn đến màn hình.
Đầu ra: docs/04-backlog.md.
```

```
Kích hoạt chế độ Sprint Prioritizer.
Đọc docs/04-backlog.md và docs/02-prd.md.

Nhiệm vụ: rà thứ tự ưu tiên backlog theo giá trị người dùng, rủi ro và phụ thuộc. Cắt/dời task không cần cho MVP. Ghi các thay đổi vào cuối docs/04-backlog.md mục "Điều chỉnh ưu tiên".
```

**GATE 2:** bạn duyệt kiến trúc + backlog. Kiểm tra: stack có đúng thứ bạn bảo trì được không.

---

# PHASE 3: THIẾT KẾ

### 3.1 UX Architect

```
Kích hoạt chế độ UX Architect.
Đọc docs/02-prd.md, docs/01-insights.md, docs/03-api.md.

Nhiệm vụ: thiết kế cấu trúc trải nghiệm: danh sách màn hình, luồng điều hướng, trạng thái (đang tải, lỗi, offline, dữ liệu cũ), thiết kế mobile-first, design tokens (màu, spacing, typography) để developer dùng nhất quán.

Đầu ra: docs/05-design-spec.md (phần cấu trúc + tokens).
```

### 3.2 GIS Cartography Designer

```
Kích hoạt chế độ GIS Cartography Designer (gis-cartography-designer).
Đọc docs/01-spatial-requirements.md và docs/05-design-spec.md.

Nhiệm vụ: thiết kế bản đồ:
- Bảng màu và ký hiệu cho mức độ nguy hiểm (ngập/triều/kẹt), an toàn cho người mù màu, đọc được ngoài nắng trên điện thoại
- Quy tắc hiển thị theo mức zoom (lớp nào hiện ở zoom nào)
- Phân tầng thị giác, nền bản đồ nhẹ để cảnh báo nổi bật
- Chú giải, nhãn tiếng Việt, hiển thị "thời điểm cập nhật" và "mức tin cậy"

Đầu ra: docs/05-cartography.md.
```

### 3.3 UI Designer

```
Kích hoạt chế độ UI Designer.
Đọc docs/05-design-spec.md và docs/05-cartography.md.

Nhiệm vụ: đặc tả giao diện từng màn hình (layout, component, trạng thái, khoảng cách) đủ cụ thể để frontend developer dựng không phải đoán. Bản đồ chiếm gần toàn màn hình trên mobile.

Ghi bổ sung vào docs/05-design-spec.md.
```

### 3.4 Persona Walkthrough Specialist

```
Kích hoạt chế độ Persona Walkthrough Specialist.
Đọc docs/01-insights.md và docs/05-design-spec.md.

Nhiệm vụ: đóng vai 3 persona (từ insight) đi qua giao diện đã đặc tả trong tình huống thực: đang mưa, 4G chập chờn, một tay cầm điện thoại, vội. Chỉ ra chỗ vướng, chữ khó đọc, thao tác thừa. Ghi mức độ nghiêm trọng.

Đầu ra: docs/05-walkthrough.md.
```

**GATE 3:** bạn duyệt thiết kế. Có thể sửa spec trước khi build vì sau này sửa tốn kém hơn.

---

# PHASE 4: BUILD (lặp theo sprint)

> Mỗi sprint: đọc `04-backlog.md`, chọn task, chạy các agent theo thứ tự, ghi kết quả vào `docs/06-sprint-N.md`. Mỗi agent làm trên branch riêng theo `00-git-workflow.md`.

### 4.0 GIS Solution Engineer (sprint 1: walking skeleton)

```
Kích hoạt chế độ GIS Solution Engineer (gis-solution-engineer).
Đọc docs/RULES.md, docs/03-architecture.md, docs/04-backlog.md (sprint 1), docs/05-cartography.md.

Nhiệm vụ: dựng prototype walking skeleton: repo chạy được, bản đồ nền TP.HCM, 1 lớp dữ liệu (giả nếu chưa có nguồn thật) đi từ CSDL qua API ra bản đồ. Mục tiêu chứng minh luồng end-to-end chạy, chưa cần đẹp.
Ràng buộc: bám đúng stack trong 03-architecture.md. Không thêm tính năng ngoài sprint 1. Không hardcode secret; dùng .env.
Cuối cùng: README cách chạy local, và ghi docs/06-sprint-1.md (đã làm gì, chưa làm gì, vấn đề).
```

### 4.1 GIS Spatial Data Engineer (nạp dữ liệu thật)

```
Kích hoạt chế độ GIS Spatial Data Engineer (gis-spatial-data-engineer).
Đọc docs/03-data-pipeline.md và task dữ liệu của sprint hiện tại trong docs/04-backlog.md.

Nhiệm vụ: hiện thực pipeline ETL cho nguồn dữ liệu trong task: lấy, validate, chuẩn hóa tọa độ theo quy ước đã chốt, làm sạch, nạp PostGIS. Có xử lý lỗi (nguồn chết, dữ liệu rỗng, trễ), log rõ ràng, chạy lại an toàn (idempotent). Có test cho phần chuẩn hóa/validate.
Ghi kết quả vào docs/06-sprint-N.md. Không đụng frontend.
```

### 4.2 Backend Architect (hiện thực API)

```
Kích hoạt chế độ Backend Architect.
Đọc docs/03-api.md, docs/03-db-tuning.md và task API của sprint hiện tại.

Nhiệm vụ: hiện thực các endpoint theo đặc tả, có validate input, giới hạn tần suất, header caching, xử lý lỗi nhất quán. Có test cho từng endpoint. Không đụng frontend.
Ghi kết quả vào docs/06-sprint-N.md.
```

### 4.3 GIS Web GIS Developer

```
Kích hoạt chế độ GIS Web GIS Developer (gis-web-gis-developer).
Đọc docs/05-cartography.md, docs/03-api.md và task bản đồ của sprint hiện tại.

Nhiệm vụ: hiện thực bản đồ web: render lớp cảnh báo theo cartography spec (màu, ký hiệu, quy tắc zoom), popup chi tiết (mức độ, thời điểm cập nhật, nguồn, độ tin cậy), tải dữ liệu theo khung nhìn, hiệu năng tốt với nhiều điểm. Xử lý trạng thái lỗi/offline/dữ liệu cũ.
Không làm phần UI ngoài bản đồ (panel, form) — để Frontend Developer. Ghi kết quả vào docs/06-sprint-N.md.
```

### 4.4 Frontend Developer

```
Kích hoạt chế độ Frontend Developer.
Đọc docs/05-design-spec.md và task UI của sprint hiện tại.

Nhiệm vụ: dựng phần UI ngoài bản đồ theo spec: thanh lớp dữ liệu, tìm kiếm địa điểm, form báo cáo (nếu có trong sprint), trạng thái tải/lỗi, responsive mobile-first, a11y cơ bản. Tích hợp với component bản đồ do GIS Web GIS Developer làm, không viết lại bản đồ.
Ghi kết quả vào docs/06-sprint-N.md.
```

### 4.5 Data Visualization Engineer (nếu sprint có biểu đồ)

```
Kích hoạt chế độ Data Visualization Engineer.
Đọc docs/05-cartography.md và task biểu đồ của sprint.

Nhiệm vụ: dựng biểu đồ (ví dụ mực triều theo thời gian, lượng mưa) trung thực về mặt thị giác: chọn đúng loại biểu đồ, trục không gây hiểu lầm, màu an toàn cho người mù màu, nhẹ cho mobile. Ghi vào docs/06-sprint-N.md.
```

### 4.6 GIS Spatial Data Scientist (mô hình rủi ro)

```
Kích hoạt chế độ GIS Spatial Data Scientist (gis-spatial-data-scientist).
Đọc docs/01-spatial-requirements.md, docs/03-data-pipeline.md và dữ liệu hiện có.

Nhiệm vụ: xây mô hình mức độ rủi ro BẢN ĐẦU dạng luật giải thích được (ví dụ ngưỡng mưa + mực triều + độ cao/vùng trũng + lịch sử ngập → cấp độ). Ghi rõ giả định, ngưỡng lấy từ đâu, độ không chắc chắn, cách hiệu chỉnh khi có thêm dữ liệu. Chỉ đề xuất ML nếu có đủ dữ liệu huấn luyện, và nói rõ cần bao nhiêu/loại nào.
Đầu ra: docs/06-risk-model.md + code mô hình có test.
```

### 4.7 AI Engineer (tùy chọn, sau MVP)

```
Kích hoạt chế độ AI Engineer.
Đọc docs/06-risk-model.md.

Nhiệm vụ: đánh giá liệu có nên nâng mô hình luật lên ML không. Nêu dữ liệu cần có, cách đánh giá, rủi ro báo sai/bỏ sót, và chi phí vận hành. Khuyến nghị làm hay chưa làm.
Đầu ra: docs/06-ai-assessment.md. Không triển khai nếu chưa được chủ dự án duyệt.
```

### 4.7b Code Reviewer (chạy sau MỖI task/PR)

```
Kích hoạt chế độ Code Reviewer.
Đọc docs/RULES.md, docs/03-architecture.md và diff của branch hiện tại (git diff main...HEAD).

Nhiệm vụ: review code theo: đúng đặc tả, bảo mật cơ bản (secret, injection, validate input), xử lý lỗi, test, dễ đọc, không phình scope. Phân loại phát hiện: Blocker / Nên sửa / Gợi ý. Không tự sửa code; liệt kê file:dòng và cách sửa.
```

### 4.8 Evidence Collector (sau mỗi sprint)

```
Kích hoạt chế độ Evidence Collector.
Đọc docs/06-sprint-N.md và docs/05-design-spec.md.

Nhiệm vụ: chạy ứng dụng, chụp màn hình các trạng thái chính (bình thường, đang tải, lỗi, dữ liệu cũ, mobile + desktop), đối chiếu với spec, liệt kê chỗ lệch kèm bằng chứng. Lưu ảnh vào docs/evidence/sprint-N/.
```

**GATE 4 (cuối mỗi sprint):** demo cho chính bạn; sprint sau chỉ bắt đầu khi Code Reviewer không còn Blocker.

---

# PHASE 5: QA & BẢO MẬT

### 5.1 GIS QA Engineer

```
Kích hoạt chế độ GIS QA Engineer (gis-qa-engineer).
Đọc docs/03-data-pipeline.md và truy cập CSDL/dữ liệu hiện có.

Nhiệm vụ: kiểm chất lượng dữ liệu không gian: CRS/SRID đúng, geometry hợp lệ, topology, điểm nằm ngoài ranh TP.HCM hoặc rơi xuống sông/biển bất hợp lý, trùng lặp, giá trị thiếu, dữ liệu quá cũ, lệch múi giờ. Viết script kiểm tra tái sử dụng được và báo cáo.
Đầu ra: docs/07-qa-data.md.
```

### 5.2 API Tester

```
Kích hoạt chế độ API Tester.
Đọc docs/03-api.md.

Nhiệm vụ: test toàn bộ endpoint: trường hợp thường, biên, input sai, input độc hại, giới hạn tần suất, hiệu năng cơ bản. Viết bộ test chạy tự động được và báo cáo.
Đầu ra: docs/07-qa-api.md.
```

### 5.3 Performance Benchmarker

```
Kích hoạt chế độ Performance Benchmarker.
Đọc docs/02-prd.md (yêu cầu phi chức năng).

Nhiệm vụ: đo hiệu năng: thời gian tải bản đồ trên mô phỏng 4G và thiết bị yếu, tốc độ render khi nhiều điểm, thời gian phản hồi API, tải khi nhiều người dùng cùng lúc (kịch bản mưa bão). So với tiêu chí PRD và đề xuất tối ưu theo mức tác động.
Đầu ra: docs/07-qa-perf.md.
```

### 5.4 Model QA Specialist

```
Kích hoạt chế độ Model QA Specialist.
Đọc docs/06-risk-model.md.

Nhiệm vụ: kiểm định mô hình rủi ro: kiểm tra logic, thử với các kịch bản biên (mưa lớn + triều cao, dữ liệu thiếu), tỷ lệ báo động giả/bỏ sót nếu có dữ liệu lịch sử, độ nhạy với ngưỡng. Nêu rõ giới hạn của mô hình và nội dung cần hiển thị cho người dùng.
Đầu ra: docs/07-qa-model.md.
```

### 5.5 AI-Generated Code Security Auditor

```
Kích hoạt chế độ AI-Generated Code Security Auditor.
Đọc docs/03-threat-model.md và quét toàn bộ repo.

Nhiệm vụ: rà bảo mật cho code do AI sinh: secret hardcode, thiếu phân quyền, injection, endpoint không kiểm soát, CORS lỏng, dependency lỗi thời/nghi ngờ, prompt-injection (nếu có dùng LLM). Với mỗi phát hiện: mức độ, vị trí, cách sửa.
Đầu ra: docs/07-qa-security.md.
```

### 5.6 Reality Checker (cổng cuối)

```
Kích hoạt chế độ Reality Checker.
Đọc docs/02-prd.md và toàn bộ docs/07-qa-*.md, docs/evidence/.

Nhiệm vụ: chứng nhận sẵn sàng phát hành dựa trên BẰNG CHỨNG, không dựa lời hứa. Đối chiếu từng tiêu chí PRD và tiêu chí thành công MVP; mục nào thiếu bằng chứng thì không cho qua. Kết luận: READY / NEEDS WORK, kèm danh sách việc phải làm.
Đầu ra: docs/07-release-decision.md.
```

**GATE 5:** chỉ ship khi Reality Checker = READY và không còn lỗi bảo mật mức cao.

---

# PHASE 6: LAUNCH

### 6.1 DevOps Automator

```
Kích hoạt chế độ DevOps Automator.
Đọc docs/03-architecture.md và docs/07-release-decision.md.

Nhiệm vụ: thiết lập CI/CD (test tự động, build, deploy), quản lý secret an toàn, môi trường staging/production, backup CSDL, lịch chạy pipeline ETL. Chi phí thấp, phù hợp 1 người vận hành.
Đầu ra: cấu hình CI/CD trong repo + docs/08-launch.md.
```

### 6.2 SRE

```
Kích hoạt chế độ SRE.
Đọc docs/08-launch.md và docs/02-prd.md.

Nhiệm vụ: định nghĩa SLO (ví dụ độ tươi dữ liệu: cảnh báo không cũ quá X phút; uptime), chỉ số cần đo, cảnh báo cho chủ dự án khi pipeline chết, và kế hoạch xử lý tải tăng đột biến khi mưa bão.
Đầu ra: docs/08-slo.md.
```

### 6.3 Incident Response Commander

```
Kích hoạt chế độ Incident Response Commander.
Đọc docs/08-slo.md và docs/03-threat-model.md.

Nhiệm vụ: viết runbook sự cố, ưu tiên các tình huống nguy hiểm nhất:
1. Hệ thống sập đúng lúc mưa bão
2. Hiển thị cảnh báo SAI (báo ngập khi không ngập, hoặc ngược lại)
3. Báo cáo giả hàng loạt
4. Nguồn dữ liệu ngừng/đổi định dạng
Mỗi tình huống: dấu hiệu, mức độ, bước xử lý, cách thông báo cho người dùng, hậu kiểm.
Đầu ra: docs/08-runbook.md.
```

### 6.4 Technical Writer

```
Kích hoạt chế độ Technical Writer.
Đọc repo và toàn bộ docs/.

Nhiệm vụ: viết README (giới thiệu, cách chạy local, cấu trúc), tài liệu cài đặt/triển khai, tài liệu API cho người dùng ngoài, và trang "Giới thiệu & giới hạn" cho người dùng cuối (nguồn dữ liệu, ý nghĩa mức độ, giới hạn độ chính xác, disclaimer đã chốt với Legal).
```

### 6.5 Legal Compliance Checker (rà lần cuối)

```
Kích hoạt chế độ Legal Compliance Checker.
Đọc docs/01-legal.md, docs/03-privacy.md và trang giao diện thật.

Nhiệm vụ: rà lần cuối trước phát hành: disclaimer có hiển thị, ghi nguồn dữ liệu đúng điều khoản, thông báo đồng ý dữ liệu cá nhân, chính sách quyền riêng tư. Liệt kê chỗ thiếu.
Đầu ra: docs/08-legal-final.md.
```

**GATE 6:** deploy staging, bạn tự dùng 3-5 ngày trước khi mở công khai.

---

# PHASE 7: VẬN HÀNH & LẶP

### 7.1 Analytics Reporter

```
Kích hoạt chế độ Analytics Reporter.
Đọc docs/02-prd.md (chỉ số thành công) và dữ liệu sử dụng.

Nhiệm vụ: thiết lập các chỉ số cần theo dõi (người dùng, vùng xem nhiều, thời điểm cao điểm, độ tươi dữ liệu, lỗi), thiết kế dashboard đơn giản, và báo cáo tuần đầu. Tôn trọng docs/03-privacy.md.
```

### 7.2 Feedback Synthesizer

```
Kích hoạt chế độ Feedback Synthesizer.
Đọc phản hồi người dùng thu được (dán vào docs/09-feedback.md).

Nhiệm vụ: tổng hợp theo chủ đề, mức độ nghiêm trọng, tần suất; chỉ ra khác biệt giữa điều người dùng nói và điều họ làm (từ analytics).
Đầu ra: docs/09-insights.md.
```

### 7.3 Sprint Prioritizer (vòng lặp)

```
Kích hoạt chế độ Sprint Prioritizer.
Đọc docs/09-insights.md, docs/08-slo.md, docs/04-backlog.md.

Nhiệm vụ: đề xuất backlog sprint tiếp theo cân bằng giữa lỗi/độ tin cậy, tính năng người dùng đòi, và mở rộng lớp dữ liệu (kẹt xe, triều cường nếu chưa có). Mỗi mục ghi giá trị, rủi ro, công sức.
```

---

## Phụ lục: prompt xử lý tình huống thường gặp

**Agent làm quá phạm vi / sửa lung tung:**
```
Kích hoạt chế độ Minimal Change Engineer.
Đọc diff hiện tại. Hoàn tác mọi thay đổi ngoài task [mô tả task]. Chỉ giữ thay đổi tối thiểu cần để hoàn thành task đó.
```

**Vào lại dự án sau vài ngày / chat mới mất ngữ cảnh:**
```
Kích hoạt chế độ Codebase Onboarding Engineer.
Chỉ đọc, không sửa. Đọc docs/ và repo, rồi tóm tắt: dự án làm gì, đang ở phase/sprint nào, cấu trúc code, cách chạy, việc dở dang. Chỉ nêu điều có trong code/tài liệu; chỗ không rõ thì nói không rõ.
```

**Dữ liệu từ nguồn đổi định dạng, pipeline chết:**
```
Kích hoạt chế độ GIS Spatial Data Engineer (gis-spatial-data-engineer).
Đọc docs/03-data-pipeline.md và log lỗi bên dưới. Tìm nguyên nhân gốc, đề xuất sửa tối thiểu, và thêm validate để lần sau phát hiện sớm. [dán log]
```
