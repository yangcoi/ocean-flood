# Quy Trình Quản Lý Phiên Bản Git: HCM Alert Map (Ocean Flood)

**Người phụ trách:** Git Workflow Master  
**Dựa trên:** `docs/RULES.md`, `docs/00-plan.md`  
**Ngày lập:** 2026-10-12  

---

## 1. Chiến Lược Nhánh (Branch Strategy)

Dự án có quy mô **1 lập trình viên kết hợp cùng các AI Agent**. Để tối đa hóa tốc độ nhưng vẫn đảm bảo an toàn, hạn chế tối đa nguy cơ AI làm hỏng code gốc, áp dụng mô hình **Trunk-Based cải tiến (Agent Feature Branches)**:

```text
main (luôn ổn định, chỉ merge khi test PASS)
 ├── docs/kickoff-phase-0
 ├── discovery/gis-data-sources
 ├── feat/sprint-1-walking-skeleton
 └── fix/maplibre-tile-loading
```

### Quy tắc tạo nhánh:
* Nhánh chính: `main` (nhánh sản phẩm và tích hợp tài liệu chuẩn).
* Nhánh tài liệu (Phase 0 - 3): `docs/<tên-nhiệm-vụ>` (ví dụ: `docs/data-sources`, `docs/architecture`).
* Nhánh tính năng (Phase 4): `feat/<tên-tính-năng>` (ví dụ: `feat/skeleton-map`, `feat/tide-api`).
* Nhánh sửa lỗi: `fix/<tên-lỗi>` (ví dụ: `fix/geojson-parser`).

---

## 2. Quy Tắc Làm Việc Của AI Agent & Cơ Chế Rollback An Toàn

Khi để AI Agent can thiệp trực tiếp vào mã nguồn, rủi ro lớn nhất là AI chỉnh sửa lan man làm vỡ các module khác. Áp dụng nghiêm ngặt các quy tắc sau:

1. **Một Agent = Một Branch riêng:** Mỗi khi bắt đầu một prompt hoặc một sprint task mới, luôn rẽ nhánh mới từ `main` mới nhất:
   ```bash
   git checkout main
   git pull origin main  # nếu có remote
   git checkout -b <tên-nhánh-mới>
   ```
2. **Kỹ thuật Rollback nhanh (Phục hồi khi Agent làm hỏng):**
   * Nếu agent sinh code lỗi hoặc đi chệch hướng, **không cố chat yêu cầu AI sửa lại nhiều lần** (dễ gây nhiễu context).
   * Hủy ngay toàn bộ thay đổi chưa commit:
     ```bash
     git restore .
     git clean -fd
     ```
   * Hoặc nếu đã lỡ commit nhưng muốn quay về commit trước:
     ```bash
     git reset --hard HEAD~1
     ```
3. **Commit trước khi đổi Agent:** Trước khi chuyển giao nhiệm vụ sang agent tiếp theo, luôn commit toàn bộ trạng thái đạt chuẩn để tạo điểm checkpoint an toàn.

---

## 3. Quy Ước Commit (Conventional Commits)

Mọi commit phải tuân thủ chuẩn Conventional Commits với cấu trúc:
```text
<type>(<scope>): <mô tả ngắn gọn bằng tiếng Việt hoặc tiếng Anh>
```

### Các tiền tố hợp lệ:
* `docs`: Cập nhật tài liệu trong thư mục `docs/` (ví dụ: `docs(plan): hoàn thành kế hoạch 00-plan.md`).
* `feat`: Thêm tính năng hoặc thành phần mới (ví dụ: `feat(map): tích hợp bản đồ nền MapLibre`).
* `fix`: Sửa lỗi (ví dụ: `fix(api): sửa lỗi parse tọa độ GeoJSON`).
* `refactor`: Tái cấu trúc mã nguồn không làm thay đổi hành vi.
* `test`: Thêm hoặc sửa unit test, e2e test.
* `chore`: Cấu hình môi trường, dependencies, scripts.

---

## 4. Đặc Tả File `.gitignore` Chuẩn Cho Dự Án

Cực kỳ quan trọng để bảo vệ bí mật, tránh phình to dung lượng repo và ngăn chặn dữ liệu thô nhạy cảm:

```gitignore
# Môi trường & Khóa bí mật (Tuyệt đối không commit)
.env
.env.local
.env.*.local
*.pem
*.key

# Dependencies
node_modules/
__pycache__/
*.py[cod]
.venv/
venv/

# Build & Tạm thời
dist/
build/
.cache/
.parcel-cache/
*.log

# Dữ liệu GIS dung lượng lớn & dữ liệu thô (Raw Data)
data/raw/
data/cache/
*.mbtiles
*.pbf
*.tiff
*.tif
*.shp
*.shx
*.dbf
*.cpg

# IDE & Hệ điều hành
.DS_Store
Thumbs.db
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
```

---

## 5. Lộ Trình Triển Khai Git: Local vs Remote (Đã chốt)

* **Giai đoạn Tài liệu (Phase 0 – Phase 3):** Hoạt động **100% trên Git Local**. 
  - Mọi thao tác commit, branch, rollback đều xử lý nhanh chóng, an toàn và bảo mật offline trên máy cá nhân mà không cần remote.
* **Giai đoạn Lập trình & Triển khai (Phase 4 – Phase 6):** Khởi tạo **GitHub Remote Repository (Private)**.
  - Khi bắt đầu viết mã nguồn và chuẩn bị deploy web, dự án sẽ được push lên GitHub cá nhân để kết nối CI/CD tự động build lên các nền tảng hosting miễn phí (Vercel / Cloudflare Pages / Render).

---

## 6. Checklist Trước Khi Merge Vào Nhánh `main`

Chủ dự án chỉ merge nhánh vào `main` khi đạt đủ 5 tiêu chí:
- [ ] Code/Tài liệu bám sát đúng mục tiêu của prompt, không có thay đổi thừa ngoài phạm vi.
- [ ] Không vô tình để lọt file secret (.env, API keys) hoặc file dữ liệu lớn vào `git status`.
- [ ] Lệnh kiểm tra/test (nếu ở Phase 4) chạy thành công mà không có lỗi (zero error/warning).
- [ ] Commit message tuân thủ đúng chuẩn Conventional Commits.
- [ ] Đã kiểm tra trực quan (visual check) trên trình duyệt hoặc tài liệu.

---

## 7. Quyết Định Đã Chốt
1. Áp dụng quy trình **Trunk-Based với Agent Feature Branches**.
2. Tiêu chuẩn commit: **Conventional Commits**.
3. Cấm tuyệt đối commit các file dữ liệu GIS thô dạng nhị phân nặng (>10MB) và file chứa biến môi trường `.env`.
4. **Chiến lược Git:** Sử dụng Git Local từ Phase 0 đến Phase 3; chỉ thiết lập GitHub Remote (Private) khi bắt đầu Phase 4 (Build).

---

## 8. Câu Hỏi Mở Cho Chủ Dự Án
*(Đã giải quyết xong ở Gate 0 — Thống nhất lộ trình Git Local trước, Remote sau).*

---

## 9. Chuyển Giao / Rủi Ro
* **Rủi ro:** Khi sử dụng AI agent tự động sinh code, nếu không quản lý git chặt chẽ sẽ dễ bị commit các đoạn code rác hoặc đè mất code cũ đang hoạt động.
* **Chuyển giao:** Bàn giao quy trình này cho toàn bộ dự án từ Phase 1 trở đi.
