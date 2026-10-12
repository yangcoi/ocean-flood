# Báo Cáo Kiểm Định Giao Diện & Cổng Hoàn Thiện (Design Contract & UI Finish Gate): Ocean Flood

**Người phụ trách:** UI Finish-Gate Reviewer (`agency-ui-finish-gate-reviewer` + `libreuiux-global-design-system` + `libreuiux-design-principles` + `agency-cartography-designer` + `agency-ui-designer`)  
**Dựa trên:** `docs/RULES.md`, `docs/05-design-spec.md`, `docs/05-cartography.md`  
**Đối tượng kiểm định:** Mã nguồn giao diện thực tế tại `src/app/page.tsx`, `src/app/globals.css`, `src/components/TopStatusBar.tsx`, `src/components/MapCanvas.tsx`, `src/components/VehicleToggle.tsx`, `src/components/AlertBottomSheet.tsx`, `src/components/RoutePlannerDrawer.tsx`, `src/components/CrowdReportModal.tsx`  
**Ngày kiểm định:** 2026-10-12  

---

## 1. Lăng Kính Sản Phẩm (Product Lens)

Người dùng chính của **Ocean Flood** là người đi xe máy, tài xế công nghệ/shipper và người lái ô tô tại 4 quận trọng điểm TP.HCM (**Bình Thạnh, Quận 7, Quận 8, TP. Thủ Đức**). Họ mở ứng dụng trong điều kiện khắc nghiệt: dừng xe tấp vào lề đường dưới trời mưa lớn hoặc ngay trước giờ tan tầm đỉnh triều cường (16:30–19:00), màn hình dính nước mưa, thời gian nhìn lướt chỉ **2–3 giây** bằng một tay (*Thumb Zone*). Đối tượng thị giác đầu tiên (*First-read object*) bắt buộc phải là **Mạng lưới đoạn đường ngập kèm độ sâu ước tính (`cm`) và lời khuyên tức thì theo loại xe (`Xe máy ≥20cm` vs `Ô tô ≥25cm`)**. Mọi chi tiết thừa (như menu đa tầng, thẻ dashboard chiếm chỗ, watermark bản đồ thương mại, nhãn chồng chéo ở mức zoom nhỏ, hoặc cặp icon lặp đôi) đều làm chậm quyết định sinh tồn trên đường và bị loại bỏ tại cổng kiểm định này.

---

## 2. Hợp Đồng Thiết Kế Giao Diện (Ocean Flood Design Contract)

```markdown
# Ocean Flood (PWA Cảnh Báo Ngập & Tìm Đường Tránh Ngập TP.HCM) — Design Contract

**User + job:** Người đi xe máy / ô tô tại TP.HCM cần kiểm tra nhanh trong 3 giây xem tuyến đường sắp đi qua có ngập quá ống pô (≥20cm) hoặc chạm gầm Sedan (≥25cm) trong 1–3 giờ tới hay không, chọn lộ trình vòng ít rủi ro ngập, hoặc gửi báo cáo ngập hiện trường có ảnh chụp kiểm chứng trong ≤10 giây.
**First-read object:** Các đoạn đường ngập phát sáng (Radar Neon Glow LineString + Tactical Sonar Pin hiển thị độ sâu `~30cm`, `~42cm`) trên nền bản đồ Vector GL tối giản, kết hợp 2 thẻ chỉ số đối xứng ở đỉnh màn hình (`Mưa dự báo 1–3h` & `Đỉnh triều Phú An`).
**Primary action:** Chuyển chế độ phương tiện (`Xe máy ≥20cm` ↔ `Ô tô ≥25cm`) và bấm **"Tìm đường né ngập"** hoặc **"Báo ngập"** ngay tại Thanh điều khiển đáy đồng nhất (*Unified Bottom Command Dock*).
**Density decision:** Balanced-Compact trên khung chuẩn **Mobile-First 430px** — dành **>86% diện tích viewport** cho Bản đồ Vector GL (`L0`), gom toàn bộ điều khiển vào 2 cụm kính mờ (`TopStatusBar` ở đỉnh và `Bottom Command Dock` ở đáy).
**Hierarchy:**
  1. Cảnh báo không gian trực tiếp trên bản đồ (Đoạn đường tô màu ngập CVD-safe + Độ sâu `cm` monospace).
  2. Chỉ số Mưa 1–3h (`mm/h`) & Đỉnh triều Phú An (`+1.68m BĐ3`) trên Top HUD.
  3. Lời khuyên Ngôn ngữ Kép trong `AlertBottomSheet` (Dòng 2 Đời thường theo loại xe được đóng khung nổi bật; Dòng 1 Khoa học xếp thành lưới 4 ô `tabular-nums`).
  4. Bằng chứng tin cậy (Rule 7): Huy hiệu `Đã xác minh • N người` / `Dự báo 1–3h`, thời gian cập nhật, TTL tự hạ cấp 90 phút và nguồn KTTV/Cộng đồng.
**Interaction model:** Zero-Menu, Single-Canvas Spatial Map (`MapLibre GL JS`) kết hợp Contextual Bottom Sheets (`O3`, `O4`, `O5`) thao tác 1 chạm trong vùng ngón cái (*Wet-Finger Ergonomics ≥48px–56px*).
**Responsive priority:** Mặc định hiển thị trong **Khung Điện Thoại Chuẩn 430px (`isMobileViewportFrame = true`)** ngay cả khi mở trên máy tính để bảo toàn tỷ lệ ngón cái và chống vỡ bố cục; hỗ trợ nút chuyển đổi *"Mở rộng toàn màn hình ↗"* linh hoạt.
**References:**
  - *Apple Maps / Weather Radar (iOS 18)* → Sử dụng lớp kính mờ (`backdrop-filter: blur(18px) saturate(165%)`), thanh cuộn ngang chọn nhanh Quận bằng Pill (`no-scrollbar`) thay vì `<select>` thô.
  - *Waze Hazard Reporting* → Luồng báo cáo hiện trường **Zero-Text-Input** với 4 nút chọn mức ngập theo bộ phận xe kích thước lớn (`min-h-[68px]`).
  - *Windy / CARTO Dark Matter Tactical GIS* → Nền bản đồ trung tính độ tương phản cao, kết hợp lớp `line-blur` tạo hiệu ứng Radar Neon Glow cho đoạn đường ngập.
**Forbidden defaults:**
  - Cấm dùng thẻ `<select>` mặc định của trình duyệt trên thanh HUD chính gây cảm giác biểu mẫu cổ điển.
  - Cấm lặp 2 icon cạnh nhau trên cùng một nút/nhãn (ví dụ: vừa có Lucide SVG Icon vừa có Emoji trùng nghĩa như `<Camera />` + `📸` hoặc `<CheckCircle2 />` + `✅`).
  - Cấm hiển thị toàn bộ 18 icon Camera TTGT kèm tên dài đè lên điểm ngập ở mức zoom tổng quan (`zoom < 13.3`).
  - Cấm dùng từ ngữ khẳng định tuyệt đối vi phạm Rule 7 (*"An toàn 100%"*, *"Chắc chắn không ngập"*).
**Finish evidence:** Kiểm tra trực tiếp mã nguồn 7 components, đối chiếu khung Mobile 430px và chế độ Toàn màn hình, kiểm tra trạng thái Light/Dark Mode, và chạy `npm run typecheck` đạt `0 errors`.
```

---

## 3. Kết Quả Kiểm Định & Khắc Phục Trực Tiếp (UI Finish Gate Decision)

```markdown
# UI Finish Gate — Ocean Flood (Toàn bộ 7 Components Giao diện)

## Decision: PASS (Sau khi đã tinh chỉnh trực tiếp các chi tiết vi mô trong đợt rà soát)

## Evidence (Bằng chứng kiểm định thực tế trên mã nguồn)
- [Bản đồ Vector GL & Cartography (`src/components/MapCanvas.tsx`)] → Đã chuyển sang Vector Tile Style chính thức của CARTO (`dark-matter-gl-style` / `voyager-gl-style`) sắc nét, không có bất kỳ watermark thương mại nào. Đã áp dụng hiệu ứng **Radar Neon Glow** (`layer-flood-verified-glow`, `layer-flood-forecast-glow`) và **Tactical Sonar Pins** gọn gàng (`42cm` monospace, chỉ bung tên đường khi `zoom >= 13.3` hoặc khi đang chọn), đồng thời ẩn bớt Camera TTGT ở zoom nhỏ theo đúng nguyên lý *Scale-Appropriate Generalization*.
- [Khung Mobile-First 430px & Bottom Command Dock (`src/app/page.tsx`, `src/components/TopStatusBar.tsx`, `src/components/VehicleToggle.tsx`)] → Đã đóng khung chuẩn điện thoại `max-w-[430px]` căn giữa màn hình kèm nút chuyển đổi toàn màn hình. `TopStatusBar` sử dụng 2 thẻ chỉ số đối xứng (Mưa dự báo 1–3h & Triều Phú An) theo nguyên lý *Gestalt Similarity* và thanh Pill cuộn ngang chọn nhanh 4 Quận. `Bottom Command Dock` gom gọn công tắc `Xe máy ≥20cm | Ô tô ≥25cm`, nút `Đi làm (1 chạm)`, thanh `Tìm đường né ngập` và nút CTA `Báo ngập` (chỉ dùng 1 icon `<Camera />` duy nhất).
- [Tinh chỉnh trực tiếp `src/components/AlertBottomSheet.tsx`] → Phát hiện và đã loại bỏ triệt để 3 điểm lặp icon (`<BarChart3 />` + `📊`, `<CheckCircle2 />` + `✅`, `<ExternalLink />` + `↗`). Tái cấu trúc thanh hành động đáy thẻ từ `sm:grid-cols-3` (gây chật chữ trong khung 430px) thành bố cục phân cấp 2 tầng rõ ràng: Nút Primary CTA toàn chiều ngang (`Tìm lộ trình né đoạn ngập này`) nằm trên + Cặp 2 nút xác nhận cộng đồng (`Đúng, còn ngập (+1)` | `Nước đã rút (0cm)`) chia 2 cột đối xứng bên dưới.
- [Tinh chỉnh trực tiếp `src/components/RoutePlannerDrawer.tsx`] → Đã chuyển danh sách 6 lộ trình mẫu từ `sm:grid-cols-2` (bị bó hẹp chữ trong khung 430px) sang danh sách 1 cột tinh gọn (`grid-cols-1 gap-1.5`), thay chấm emoji `🟢`/`🔴` ở ô nhập địa điểm bằng chấm tròn CSS đồng bộ, xóa icon lặp (`<Bookmark />` + `⭐`, `<ShieldCheck />` + `🛡️`), và sắp xếp lại cụm nút `Tính lộ trình né ngập` + `Lưu đi làm` cân đối trên một hàng.
- [Tinh chỉnh trực tiếp `src/components/CrowdReportModal.tsx`] → Đã thay emoji `📸` ở Header bằng `<Camera />` đồng nhất bộ icon Lucide, loại bỏ hoàn toàn các cặp icon lặp ở chế độ kiểm thử Geofence (`<CheckCircle2 />` + `✅`, `<ShieldAlert />` + `⛔`) và nút Gửi báo cáo (`<Send />` + `🚀`/`🧪`), đồng thời tinh chỉnh lưới `2x2` cho 4 nút mức ngập (`min-h-[68px]`) vừa vặn tuyệt đối trong khung 430px.

## Keep (Các quyết định thiết kế xuất sắc cần giữ vững)
- **Khung Mobile-First 430px mặc định trên Desktop (`page.tsx`):** Giữ trọn vẹn mật độ thị giác và vùng thao tác ngón cái (*Thumb Zone*) đúng như thiết kế thực địa trên điện thoại.
- **Tactical Sonar Pins & Radar Neon Glow (`MapCanvas.tsx`):** Phân biệt tức thì điểm ngập thực tế đã xác minh (viền liền + glow đậm) với điểm dự báo 1–3h (viền nét đứt) và tự động làm nổi bật điểm vượt ngưỡng phương tiện (`≥20cm` cho Xe máy, `≥25cm` cho Ô tô).
- **Ngôn ngữ Kép Thích ứng Phương tiện (`AlertBottomSheet.tsx`):** Tự động đưa lời khuyên Đời thường của phương tiện đang chọn lên thẻ chính có viền nhấn màu Cam/Xanh dương, giữ nguyên 4 ô thông số Khoa học `tabular-nums` để người dùng đối chiếu minh bạch.
- **Kiểm chứng 5 Lớp Trực quan Không Cần Gõ Chữ (`CrowdReportModal.tsx`):** Tích hợp sẵn công tắc giả lập kiểm thử Geofence (`≤500m` hợp lệ vs `>3km` bị chặn HTTP 422) ngay trên giao diện giúp chủ dự án nghiệm thu trực tiếp bằng 1 chạm.

## PASS criteria (Đã xác nhận đạt 100%)
- [x] First-read object (Mạng lưới đường ngập + Độ sâu `cm` + Chỉ số Mưa/Triều) và Primary action (Đổi xe / Tìm đường / Báo ngập) hiển thị rõ ràng ngay trong khung nhìn đầu tiên.
- [x] Không còn bất kỳ lỗi lặp icon (Lucide + Emoji), không còn thẻ `<select>` thô trên HUD chính, và không có nhãn đè nhau trên bản đồ.
- [x] Toàn bộ thông điệp tuân thủ nghiêm ngặt `RULES.md` Mục 7 (hiển thị rõ Độ tin cậy, Thời điểm cập nhật, Thời hạn tự hạ cấp 90 phút, Nguồn dữ liệu và không khẳng định tuyệt đối "an toàn 100%").
- [x] Kiểm tra biên dịch tĩnh `npm run typecheck` (`tsc --noEmit`) đạt **0 lỗi TypeScript**.
```

---

## 4. Bảng Đối Chiếu Chi Tiết Theo Nguyên Lý LibreUIUX & Cartography

| Hạng mục Kiểm định | Tiêu chuẩn (`LibreUIUX` & `05-cartography.md`) | Hiện trạng Thực thi trong Code (`src/`) | Đánh giá |
| :--- | :--- | :--- | :--- |
| **1. Tỷ lệ Bản đồ (`Map Canvas Visibility`)** | Chiếm $>85\%$ diện tích màn hình, không dùng Hamburger Menu hay Multi-Tab. | `MapCanvas.tsx` chiếm toàn bộ khung nhìn `w-full h-full`; `TopStatusBar` và `Bottom Command Dock` dùng kính mờ `libre-glass` gọn ở 2 đầu. | **PASS** |
| **2. Chống rối chữ trên Bản đồ (`Scale-Appropriate Generalization`)** | Ẩn Camera TTGT và thu gọn nhãn ở mức zoom liên quận (`zoom < 13.3`); chỉ bung tên đường ở zoom chi tiết hoặc khi đang chọn. | `MapCanvas.tsx` kiểm tra `isDetailedZoom = currentZoom >= 13.3` để ẩn 18 icon Camera TTGT và ẩn phần tên đường phụ trên Sonar Pin khi nhìn toàn cảnh TP.HCM. | **PASS** |
| **3. Phân cấp Thị giác & Định luật Gestalt (`Hierarchy & Proximity`)** | Nhóm các phần tử cùng chức năng gần nhau (`gap-1.5`–`gap-2`), tách biệt rõ hành động chính và hành động phụ. | `TopStatusBar.tsx` chia 2 thẻ Mưa & Triều đối xứng (`grid-cols-2 gap-1.5`); `AlertBottomSheet.tsx` tách nút chính `Tìm lộ trình né đoạn ngập này` lên trên 2 nút xác nhận cộng đồng. | **PASS** |
| **4. Quy chuẩn Icon & Typography (`Anti-Redundancy & Tabular Nums`)** | Mỗi nút chỉ dùng 1 tín hiệu biểu tượng duy nhất; mọi số liệu (`mm/h`, `m`, `cm`, `%`, `KB`) bắt buộc dùng `metric-mono` (`tabular-nums`). | Đã rà soát toàn bộ 7 file component, loại bỏ mọi chỗ lặp Lucide Icon + Emoji và áp dụng class `.metric-mono` cho toàn bộ số liệu thủy văn. | **PASS** |
| **5. Công thái học Tay Ướt (`Wet-Finger Ergonomics`)** | Nút tương tác tối thiểu `44px–48px` (`.wet-touch-target`), nút CTA chính $\ge 56\text{px}$ (`.wet-cta-target`), nút chọn mức ngập $\ge 68\text{px}$. | Đã áp dụng đầy đủ trong `globals.css` và các component `AlertBottomSheet`, `RoutePlannerDrawer`, `CrowdReportModal`. | **PASS** |
| **6. Ràng buộc An toàn Thông tin (`RULES.md` Mục 7 & NĐ 13/2023/NĐ-CP)** | Hiển thị Độ tin cậy + Thời gian cập nhật + Nguồn dữ liệu; dùng thuật ngữ *"Lộ trình ít rủi ro ngập"*; có hộp thoại đồng ý quyền GPS. | Đầy đủ trên `TopStatusBar`, `AlertBottomSheet`, `RoutePlannerDrawer`, `CrowdReportModal` và Modal `NĐ13/GPS` trong `page.tsx`. | **PASS** |

---

## Quyết Định Đã Chốt
1. **Quyết định Cổng Hoàn Thiện Giao Diện (UI Finish Gate):** Chính thức cấp trạng thái **PASS** cho toàn bộ giao diện ứng dụng **Ocean Flood** sau khi đã kiểm định và tinh chỉnh trực tiếp 7 file giao diện theo chuẩn `LibreUIUX Global Design System`, `LibreUIUX Design Principles` và `Cartography Spec`.
2. **Chuẩn hóa Khung Hiển thị Mobile-First (430px) & Toàn Màn Hình:** Giữ chế độ mặc định hiển thị trong khung điện thoại `430px` sắc nét khi mở trên máy tính để đảm bảo trải nghiệm chuẩn ứng dụng di động thực địa, đồng thời cung cấp nút chuyển đổi sang chế độ Toàn màn hình 1 chạm.
3. **Loại bỏ 100% Nhiễu Thị Giác & Trùng Lặp Biểu Tượng:** Đã chuẩn hóa quy tắc *Single-Icon-Per-Control* xuyên suốt `TopStatusBar`, `Bottom Command Dock`, `AlertBottomSheet`, `RoutePlannerDrawer` và `CrowdReportModal`; tối ưu lưới hiển thị cho khung 430px không bị tràn hay bó chữ.

## Câu Hỏi Mở Cho Chủ Dự Án
- Hiện tại không còn câu hỏi chặn (blocking) nào về mặt thiết kế UI/UX và bản đồ học. Chủ dự án có thể trực tiếp trải nghiệm chuyển đổi giữa **Khung Mobile 430px** và **Toàn màn hình**, bấm thử **4 kịch bản mưa/triều**, **So sánh lộ trình né ngập Xe máy / Ô tô**, và **Kiểm thử chặn báo cáo giả ngoài bán kính 500m** ngay trên giao diện.

## Chuyển Giao / Rủi Ro
- **Chuyển giao cho QA & Release (`docs/06-testing.md` & `docs/07-walkthrough.md`):**
  - Toàn bộ 7 component giao diện tại `src/app/page.tsx` và `src/components/*.tsx` đã đồng bộ 100% với `docs/05-design-spec.md`, `docs/05-cartography.md` và vượt qua kiểm tra `npm run typecheck` với `0` lỗi.
- **Rủi ro & Giảm thiểu:**
  - *Rủi ro phụ thuộc kết nối mạng khi tải Vector Tiles lần đầu:* Bản đồ nền CARTO Vector GL cần tải style và glyph font khi khởi chạy lần đầu. Giải pháp đã tích hợp sẵn: Nếu thiết bị mất mạng (`isOffline === true`), ứng dụng tự động bật Banner cảnh báo màu Vàng Hổ Phách chuẩn Rule 7 và giữ nguyên khả năng tra cứu dữ liệu điểm ngập đã lưu đệm.
