# Báo Cáo Kiểm Thử Thực Chiến Theo Chân Dung Người Dùng (Persona-Based UX Walkthrough): Ocean Flood

**Người phụ trách:** Persona Walkthrough Specialist (`agency-persona-walkthrough-specialist`)  
**Dựa trên:** `docs/RULES.md`, `docs/01-spatial-requirements.md`, `docs/05-design-spec.md`, `docs/05-cartography.md`  
**Phương pháp đánh giá:** Cognitive Walkthrough kết hợp mô hình **Fogg Behavior Model ($B = M \times A \times P$)** và **LIFT Conversion/Usability Framework** (Value Proposition, Clarity, Relevance, Distraction, Urgency, Anxiety)  
**Ngày lập:** 2026-10-12  

---

## 1. Bối Cảnh Kiểm Thử Khắc Nghiệt (Extreme Field Scenario)

Toàn bộ 3 phiên kiểm thử (Walkthrough) được đặt trong cùng một thời điểm thực tế khắc nghiệt nhất tại TP.HCM:
- **Thời gian:** **17:30 chiều** (Giờ cao điểm tan tầm trùng lúc đỉnh triều cường trạm Phú An đạt **1.68m — Báo động 3**).
- **Thời tiết:** Mưa lớn diện rộng (**42–48mm/h**), trời sập tối nhanh, gió tạt nước mưa vào mặt và màn hình điện thoại.
- **Điều kiện thiết bị & Kết nối:** Mạng 4G chập chờn do nghẽn trạm phát sóng giờ cao điểm mưa ngập (độ trễ RTT 400–800ms, thỉnh thoảng rớt gói tin), màn hình điện thoại dính hạt nước mưa (hoặc bọc trong túi nhựa chống nước của Shipper), người dùng chỉ dùng được **1 tay (ngón cái)** và vô cùng vội vã, căng thẳng.

---

## 2. Persona 1: Anh Minh (28 tuổi, Shipper / Người đi xe máy tay ga từ Bình Thạnh về Quận 7)

### 2.1 Hồ Sơ & Ngữ Cảnh Thực Tế
- **Phương tiện:** Xe tay ga Honda AirBlade (hốc hút gió và ống pô thấp $\sim 20\text{cm}$, cực kỳ dễ chết máy và vô nước nồi/nhớt hộp số nếu lội nước $>25\text{cm}$).
- **Tình huống:** Đang dừng xe mặc áo mưa dưới mái hiên đường Ung Văn Khiêm (Bình Thạnh), chuẩn bị giao đơn hàng cuối về đường Huỳnh Tấn Phát (Quận 7). Màn hình điện thoại gắn trên giá đỡ xe máy có bọc túi nilon chống nước, tay phải ướt sũng.
- **Mục tiêu:**
  1. Kiểm tra xem khu vực Nguyễn Xí / Ung Văn Khiêm (Bình Thạnh) và Huỳnh Tấn Phát (Quận 7) hiện tại và 1–2 tiếng tới ngập cỡ nào bằng ngôn ngữ dễ hiểu (không hiểu *"1.68m Phú An"* nghĩa là gì).
  2. Tìm lộ trình tránh ngập cho **Xe máy** để không bị chết máy giữa đường.

### 2.2 Hành Trình Trải Nghiệm Từng Bước (Step-by-Step Walkthrough)

| Bước & Màn hình (`05-design-spec.md`) | Độc thoại nội tâm thực tế (User Monologue đời thường) | Đánh giá chuyên gia (LIFT & Fogg Behavior Model: $B = M \times A \times P$) |
| :--- | :--- | :--- |
| **Bước 1: Mở Web App (PWA) dưới mưa (`L0` + `O1` + `O2`)**<br>Mạng 4G chập chờn (2 vạch). | *"Trời mưa xối xả kiểu này cộng thêm nước sông dâng thì Nguyễn Xí với Huỳnh Tấn Phát chắc thành sông rồi. Mở web coi thử... Ồ hên quá, nó hiện liền cái bản đồ xám tối dịu mắt (Night Rain Mode) chứ không quay mòng mòng trắng xóa. Trên đầu ghi 'Mưa 42mm/h • Phú An 1.68m (BĐ3) • 2p trước', nhìn con số 1.68m thì mình chịu chẳng biết sâu bao nhiêu, nhưng thấy cái nút '🏍️ Xe máy' bên phải đang sáng màu xanh dương là yên tâm đúng hệ xe mình rồi."* | - **Fogg (Ability - Cao):** Skeleton Loading không khóa màn hình + tải Vector Tile $<3\text{s}$ giúp giữ chân người dùng khi mạng 4G yếu.<br>- **LIFT (Clarity & Relevance):** Chế độ `Night Rain Mode` (`#0B0F19`) phát huy tác dụng xuất sắc lúc 17h30 mưa mù trời, các vệt đường màu Cam/Đỏ (`#EA580C`, `#DC2626`) có viền trắng nổi bần bật.<br>- **Điểm ma sát nhỏ:** Nút chọn nhanh `[Quận▾]` trên thanh `O1` cao `36px` hơi nhỏ đối với ngón tay đang bọc túi nilon. |
| **Bước 2: Chạm vào vệt đỏ Nguyễn Xí / Nguyễn Hữu Cảnh & xem Thẻ Cảnh Báo Ngôn Ngữ Kép (`O3`)** | *"Bấm vô vệt đỏ chỗ Nguyễn Xí coi sao... Lên cái bảng ở dưới đáy: 'CẤP 3: NGẬP SÂU • ✓ Đã xác minh • 4 người báo • Cập nhật 4 phút trước'. Hay nhất là cái khung viền cam to đùng ghi rõ cho Xe máy: **'Nước ngập quá ống pô và sàn để chân (~35cm). Nguy cơ chết máy rất cao'**. Đọc câu này là hiểu liền, khỏi cần đoán 1.68m là cái gì! Kéo nhẹ lên thấy biểu đồ 17h–18h đang đỉnh ngập 35cm, tới 19h mới rút xuống 15cm. Vậy là giờ chạy vô đó chỉ có nước dắt bộ!"* | - **LIFT (Value Proposition & Anxiety Reduction):** **Dòng 2 (Ngôn ngữ đời thường `16px-18px SemiBold`)** giải quyết trúng phóc Nỗi đau số 2 trong `01-spatial-requirements.md`. Việc quy đổi `1.68m triều + 48mm/h mưa` thành *"Ngập quá ống pô (~35cm)"* triệt tiêu hoàn toàn gánh nặng nhận thức (Cognitive Load).<br>- **Tuân thủ Rule 7:** Hiển thị đầy đủ bộ 3: Độ tin cậy (`✓ 4 người báo`), Thời gian (`4 phút trước`), Nguồn (`Cộng đồng + KTTV`). |
| **Bước 3: Chuyển nhanh về Quận 7 & Tìm lộ trình tránh ngập cho Xe máy (`O4: Route Planner`)** | *"Giờ bấm vô thanh 'Tìm lộ trình tránh ngập' ở dưới đáy để tìm đường chạy về Quận 7. Hôm qua mình có bấm lưu cái nút '🏠 Đi làm/Chạy ship hằng ngày' rồi nên giờ bấm 1 phát ăn ngay khỏi gõ chữ dưới mưa! Bản đồ vẽ ra 2 đường: Đường ngắn nhất gạch đứt màu đỏ kêu 'Cắt qua điểm ngập ~35cm', còn đường màu xanh dương điện tử kêu '+4 phút (Qua Điện Biên Phủ - Cầu Sài Gòn - Nguyễn Thị Thập), tránh được 2 điểm ngập sâu, mực nước dự kiến <10cm'. Thôi đi vòng thêm 4 phút cho lành cái xe tay ga!"* | - **Fogg (Prompt & Ability - Tối ưu):** Tính năng **1-Tap Saved Commute** (`localStorage`) loại bỏ hoàn toàn bước gõ bàn phím ảo khi màn hình ướt — đây là yếu tố quyết định giúp hành vi ($B$) xảy ra thành công.<br>- **LIFT (Distraction & Urgency):** So sánh trực quan 2 thẻ lộ trình (`SAFE_ALTERNATIVE` vs `DANGER_FLOODED`) giúp tài xế ra quyết định trong $<3$ giây mà không bị "bẫy màu xanh" của Google Maps đánh lừa. |

### 2.3 Phát Hiện Điểm Ma Sát & Đề Xuất Tinh Chỉnh (Persona 1)

| Mã | Điểm ma sát phát hiện (Friction Point) | Nguyên nhân (Tay ướt / Chữ nhỏ / Thao tác thừa) | Mức độ nghiêm trọng | Đề xuất tinh chỉnh cụ thể vào Thiết kế |
| :--- | :--- | :--- | :--- | :--- |
| **F1.1** | **Nút chọn nhanh `[Quận▾]` trên thanh `O1` khó bấm trúng qua túi chống nước.** | Trong `05-design-spec.md` (Mục 4.2.B), nút `District Quick Jump` có `min-h-[36px]`, nhỏ hơn chuẩn vùng chạm tay ướt `48x48px`, lại nằm sát mép phải trên cùng (ngoài vùng ngón cái khi cầm 1 tay). | **Trung bình (Medium)** | Tăng vùng đệm chạm vô hình (*Hit-slop*) của nút `[Quận▾]` lên **`48x48px`**, đồng thời khi mở ngăn tìm đường `O4` ở dưới đáy, hiển thị sẵn 4 chip lớn (`cao 44px`) **`[Bình Thạnh] [Quận 7] [Quận 8] [Thủ Đức]`** ngay trong vùng ngón cái. |
| **F1.2** | **Vuốt kéo Bottom Sheet `O3` từ `38%` lên `72%` dễ bị trượt khi màn hình dính nước.** | Cảm ứng điện dung khi có giọt nước thường nhận nhầm thao tác vuốt (swipe gesture) thành chạm đứt quãng, làm thẻ `O3` bị giật hoặc không mở rộng được phần Timeline 6h. | **Cao (High)** | Bổ sung một **nút bấm vật lý 1 chạm** ngay trên thẻ `O3`: **`[📊 Xem dự báo 6h tới & Cam TTGT ▾]`** (`min-h-[44px]`) để người dùng chỉ cần **chạm (tap)** thay vì bắt buộc phải vuốt kéo (drag) khi tay ướt. |
| **F1.3** | **Chữ dòng phụ nguồn dữ liệu trên thanh `O1` (`12px`) hơi khó đọc khi xe đang nổ máy rung.** | Dòng `Nguồn: KTTV Nam Bộ & Open-Meteo • Cập nhật 2p trước` đặt dưới thanh `O1` ở cỡ `12px` làm thanh `O1` bị dày và chữ nhỏ. | **Thấp (Low)** | Trên thanh `O1` chỉ giữ ngắn gọn **`🕒 2p trước • KTTV`** (`12px SemiBold`), khi người dùng chạm vào thanh `O1` mới bung Popover giải thích chi tiết nguồn trạm Phú An & lượng mưa. |

---

## 3. Persona 2: Chị Lan (36 tuổi, Lái ô tô Sedan từ Thảo Điền TP. Thủ Đức về Quận 1)

### 3.1 Hồ Sơ & Ngữ Cảnh Thực Tế
- **Phương tiện:** Ô tô Sedan gầm thấp (Mazda 3 / Honda City, khoảng sáng gầm xe chỉ $\sim 13.5 - 15\text{cm}$; cổ hút gió thấp, nếu gặp nước $\ge 25-30\text{cm}$ cộng sóng nước từ xe buýt/xe tải chạy ngược chiều là bị **thủy kích** vỡ lốc máy tốn hàng trăm triệu đồng).
- **Tình huống:** Đang nhích từng chút một ở khu vực Quốc Hương / Thảo Điền (TP. Thủ Đức) lúc 17h30 để đi qua cầu Sài Gòn về Quận 1. Điện thoại gắn trên taplo ô tô, chị Lan chỉ có vài giây liếc nhìn màn hình mỗi nhịp dừng đèn đỏ.
- **Nỗi sợ lớn nhất:**
  1. Sợ thủy kích ở các rốn ngập Quốc Hương, Nguyễn Hữu Cảnh.
  2. **Cực sợ bị ứng dụng chỉ đường dẫn rẽ vào hẻm nhỏ/hẻm cụt** dành cho xe máy — ô tô vào đó giữa trời mưa ngập là kẹt cứng không lùi ra được.
  3. Muốn tận mắt kiểm tra qua **Camera giao thông TTGT** xem nút giao phía trước nước có ngập tới gầm xe không.

### 3.2 Hành Trình Trải Nghiệm Từng Bước (Step-by-Step Walkthrough)

| Bước & Màn hình (`05-design-spec.md`) | Độc thoại nội tâm thực tế (User Monologue đời thường) | Đánh giá chuyên gia (LIFT & Fogg Behavior Model: $B = M \times A \times P$) |
| :--- | :--- | :--- |
| **Bước 1: Chuyển sang chế độ `🚗 Ô tô` trên công tắc nổi (`O2`)** | *"Mưa lớn quá, đường Quốc Hương trước mặt bắt đầu lênh láng nước rồi. Mình phải bấm chuyển cái nút bên phải sang '🚗 Ô tô' ngay. Ồ, vừa bấm một cái là mấy đoạn đường ngập nhẹ 25cm hồi nãy màu vàng bên xe máy tự động chuyển sang cảnh báo Cam nguy hiểm cho gầm Sedan luôn (`Ngưỡng >= 25cm`). Phản hồi tức thì không bị lag mạng!"* | - **Fogg (Ability & Prompt):** Công tắc nổi `O2` (`56x48px`) phản hồi tức thì ở phía Client (Zero-Latency Reactivity) giúp người lái ô tô yên tâm rằng hệ thống đang tính toán theo đúng chuẩn gầm xe Sedan của mình. |
| **Bước 2: Bấm xem điểm ngập cầu vượt Nguyễn Hữu Cảnh & Mở Camera TTGT (`O3` $\rightarrow$ `O6`)** | *"Trước khi đổ dốc cầu Sài Gòn xuống Nguyễn Hữu Cảnh hay Điện Biên Phủ, mình phải coi chắc chắn tình hình dưới đó. Chạm vô điểm ngập Nguyễn Hữu Cảnh: Thẻ cảnh báo hiện chữ to đùng cho Ô tô: **'Nước chạm gầm Sedan / mép dưới đèn pha (~35cm). Nguy cơ thủy kích cao nếu đi nhanh tạo sóng'**. Bên dưới có nút '📹 Cam TTGT (120m)', bấm thử coi... Hiện ra hộp thông tin 'Cam Cầu vượt Nguyễn Hữu Cảnh - Cách 120m' kèm nút mở xem trực tiếp từ Cổng TTGT TP.HCM. Nhìn thấy hình ảnh thật là mình tin 100%, quyết định không đi đường dưới gầm cầu!"* | - **LIFT (Anxiety Reduction - Cực cao):** Với tài xế ô tô, chi phí rủi ro thủy kích là rất lớn nên họ luôn có tâm lý hoài nghi (High Anxiety). Việc kết hợp **Huy hiệu xác nhận chéo (`✓ 4 người`) + Đường nối nét chấm tới tọa độ Camera TTGT trong bán kính 300m (`O6`)** giúp giải tỏa hoàn toàn sự nghi ngờ.<br>- **Điểm ma sát phát hiện:** Khi bấm mở liên kết ngoài sang ứng dụng/web TTGT TP.HCM, khi quay lại trình duyệt có nguy cơ mất trạng thái lộ trình đang xem nếu không lưu state. |
| **Bước 3: Tìm lộ trình tránh ngập chế độ Ô tô (`O4: Route Planner`)** | *"Bấm tìm đường từ Thảo Điền về Quận 1 ở chế độ '🚗 Ô tô'. Trên bản đồ hiện tuyến đường màu Xanh Chàm Đậm (`#2563EB`) có mũi tên kép nhìn rất rõ là đường trục lớn: Đi thẳng Xa lộ Hà Nội — Cầu Sài Gòn — Điện Biên Phủ, né hoàn toàn đường Quốc Hương và Nguyễn Hữu Cảnh. Trên thẻ ghi rõ: **'🚗 Tuyến trục lớn (Tránh điểm ngập • Đủ làn ô tô • Không dẫn vào hẻm nhỏ)'**. Câu này làm mình thở phào nhẹ nhõm vì sợ nhất là app chỉ chui vô hẻm Bình Thạnh!"* | - **LIFT (Value Proposition & Clarity):** Khác biệt cốt lõi so với đối thủ là thuật toán khóa chặt mạng lưới `primary / secondary / tertiary` cho ô tô và truyền thông rõ điều đó ngay trên giao diện (`Pill-badge: Đủ làn ô tô`).<br>- **Tuân thủ Rule 7:** Giữ đúng microcopy *"Lộ trình thay thế ít rủi ro ngập"*, kèm dòng lưu ý quan sát thực tế. |

### 3.3 Phát Hiện Điểm Ma Sát & Đề Xuất Tinh Chỉnh (Persona 2)

| Mã | Điểm ma sát phát hiện (Friction Point) | Nguyên nhân (Khoảng cách nhìn taplo / Chuyển tab / Thao tác) | Mức độ nghiêm trọng | Đề xuất tinh chỉnh cụ thể vào Thiết kế |
| :--- | :--- | :--- | :--- | :--- |
| **F2.1** | **Khoảng cách mắt tài xế ô tô tới điện thoại gắn trên taplo xa hơn người đi xe máy ($50-70\text{cm}$ so với $30\text{cm}$), làm các chỉ số ở Dòng 1 (`13px-14px`) và nhãn phụ hơi nhỏ.** | Tài xế ô tô không cầm điện thoại sát mặt mà gắn trên giá đỡ cửa gió điều hòa/taplo. Cỡ chữ `14px` của thông số khoa học hoặc nhãn tuyến đường hơi khó liếc nhanh trong 2 giây dừng đèn đỏ. | **Trung bình (Medium)** | Khi người dùng bật chế độ **`🚗 Ô tô` (`Car Mode`)**, tự động kích hoạt biến CSS **`--car-mode-scale: 1.12`** (phóng to cỡ chữ tiêu đề đường, độ sâu `~35cm` lên `28px`, và lời khuyên đời thường lên `18px Bold`) để đọc rõ từ khoảng cách taplo $60\text{cm}$. |
| **F2.2** | **Chuyển sang ứng dụng/tab ngoài khi bấm xem Camera TTGT (`O6`) dễ làm gián đoạn luồng điều hướng.** | Trong `05-design-spec.md`, Popover `O6` mở deeplink sang cổng TTGT TP.HCM. Khi tài xế bấm quay lại (Back), nếu PWA chưa lưu trạng thái tìm đường vào URL/Session thì phải nhập lại điểm đến. | **Cao (High)** | 1. Bắt buộc lưu trạng thái đang mở của `O3`/`O4` và tọa độ viewport vào `sessionStorage` / URL query params trước khi mở link Camera ngoài.<br>2. Hiển thị rõ nhãn **`↗ Mở Cổng TTGT TP.HCM (Tab mới - Tự giữ lộ trình của bạn)`** để tài xế không sợ bị mất đường đang dò. |
| **F2.3** | **Cần làm nổi bật hơn nữa cam kết "Không dẫn vào hẻm nhỏ" ngay trên thẻ chọn lộ trình Ô tô.** | Nỗi sợ bị dẫn vào hẻm cụt/hẻm nhỏ của tài xế Sedan lớn ngang nỗi sợ ngập nước, nhưng hiện tại thông tin này mới chỉ nằm ở pill phụ trên bản đồ. | **Thấp (Low)** | Trong thẻ `O4` khi chọn `🚗 Ô tô`, thêm 1 huy hiệu cố định màu Xanh Lam: **`🛡️ Chỉ đi đường trục lớn (Đã khóa hẻm nhỏ < 2 làn xe)`**. |

---

## 4. Persona 3: Chú Hùng (45 tuổi, Cư dân Quận 8 ven kênh Tàu Hủ - Mễ Cốc) & Kịch Bản Chặn Kẻ Xấu Báo Giả (Geofence 500m)

### 4.1 Hồ Sơ & Ngữ Cảnh Thực Tế
- **Nhân vật chính (Chú Hùng - 45 tuổi):** Cư dân sinh sống lâu năm tại đường Bến Mễ Cốc / Lưu Hữu Phước (Quận 8, sát kênh Tàu Hủ). Chiều 17h30 triều cường dâng tràn bờ kênh kết hợp mưa lớn làm đoạn đường trước nhà ngập gần $35\text{cm}$ (ngang ống pô, nhiều xe máy đi qua bị sụp ổ gà và chết máy).
- **Đặc điểm thao tác:** Mắt bắt đầu hơi viễn thị nhẹ (khó đọc chữ nhỏ), đứng dưới mái hiên mưa tạt, một tay cầm ô/giữ áo mưa, tay kia cầm điện thoại Android tầm trung có dính nước mưa. Chú muốn báo lên bản đồ để bà con né đoạn Mễ Cốc này ra, nhưng **rất ngại gõ phím hoặc làm thủ tục rắc rối**.
- **Nhân vật đối chứng (Kẻ xấu / Spammer cách 3km):** Một thanh niên đang ngồi quán cà phê khô ráo ở Quận 5 (cách đường Mễ Cốc **3.2km**), cố tình mở app định bấm báo ngập giả *"Quá yên xe (>45cm)"* kèm ảnh ngập cũ lưu trong máy từ tháng trước để trêu chọc.

### 4.2 Hành Trình Trải Nghiệm Từng Bước (Step-by-Step Walkthrough)

#### Phần A: Luồng Người Dân Thật Tại Hiện Trường (Chú Hùng - Quận 8)

| Bước & Màn hình (`05-design-spec.md`) | Độc thoại nội tâm thực tế (User Monologue đời thường) | Đánh giá chuyên gia (LIFT & Fogg Behavior Model: $B = M \times A \times P$) |
| :--- | :--- | :--- |
| **Bước 1: Bấm nút FAB `📸 Báo ngập` ở góc dưới bên phải (`L0` $\rightarrow$ `O5`)** | *"Nước tràn bờ kênh Mễ Cốc ngập lênh láng rồi, tội mấy đứa nhỏ đi học về không biết cứ lao vô chết máy. Mở web lên thấy ngay cái nút màu đỏ cam chà bá '📸 Báo ngập' ở góc dưới tay cái, bấm vô cái rụp! Không bắt đăng nhập tài khoản hay mật khẩu gì hết, khỏe re!"* | - **Fogg (Motivation & Prompt - Xuất sắc):** Động lực giúp cộng đồng ($M$) của người dân TP.HCM rất cao lúc mưa ngập, nhưng thường bị dập tắt nếu bắt đăng nhập. Nút FAB `56px` cam-đỏ nổi bật + cơ chế ẩn danh có kiểm soát (`device_hash`) giúp kích hoạt hành động ngay lập tức. |
| **Bước 2: Chụp ảnh trực tiếp tại chỗ & Kiểm tra Lớp 1 (GPS $\le 500\text{m}$) + Lớp 2 (EXIF $\le 10\text{p}$)** | *"Nó mở sẵn cái khung máy ảnh kêu chụp mặt đường ngập. Đưa máy lên bấm chụp cái tách! Trên góc ảnh hiện liền 2 dòng chữ xanh lá: **'✓ GPS Hợp lệ: Cách điểm ngập 15m (≤500m)'** và **'✓ Ảnh chụp trực tiếp (Vừa xong)'**. Địa chỉ ở dưới nó cũng tự điền luôn 'Đường Bến Mễ Cốc, P.15, Quận 8', tui khỏi phải đeo kính gõ từng chữ dưới mưa!"* | - **Fogg (Ability - Tối đa hóa):** Luồng **Zero-Text-Input** (0 ký tự phải gõ) kết hợp Reverse Geocoding tự động giúp người lớn tuổi (45+) thao tác dễ dàng bằng 1 tay dưới mưa.<br>- **Kiểm chứng Lớp 1 & Lớp 2:** Diễn ra hoàn toàn tự động dưới nền, biến quy trình bảo mật phức tạp thành 2 huy hiệu xanh lá trực quan tạo cảm giác tự hào, tin cậy. |
| **Bước 3: Chọn 1 trong 4 nút mức ngập trực quan (`cao >= 68px`) & Bấm Gửi (`POST /api/reports`)** | *"Giờ nó hỏi ngập cỡ nào, có 4 cái nút bự chảng vẽ hình cái bánh xe, cái ống pô, cái yên xe. Nhìn ra đường thấy nước ngập ngang ống xả chiếc Wave đang dắt bộ kia kìa, bấm vô nút màu cam **'⚠️ Ngập ống pô / chạm gầm (~30cm)'** rồi bấm nút xanh **'🚀 Gửi báo cáo ngập ngay'**. Chưa tới 1 giây sau nó báo '🎉 Đã ghi nhận báo cáo tại Bến Mễ Cốc!'. Nhìn lên bản đồ thấy hiện cục chấm thông báo của mình lên liền (đang 1/3 xác nhận), lát nữa thêm 2 người hàng xóm bấm xác nhận nữa là lên tích xanh!"* | - **LIFT (Clarity & Zero Friction):** Bộ 4 nút chọn mức ngập cao `68px`, khoảng cách `12px` gắn với bộ phận xe (`WHEEL_15CM`, `EXHAUST_30CM`, `SEAT_50CM`, `RECEDED_0CM`) là điểm sáng UX tốt nhất của hệ thống.<br>- **Kiểm chứng Lớp 3, 4, 5:** Phản hồi rõ trạng thái `UNVERIFIED (1/3)` (vòng nét đứt 50m) chờ gom cụm 150m đủ $\ge 3$ người lên `VERIFIED`, giữ đúng tính trung thực của Rule 7. |

#### Phần B: Luồng Chặn Kẻ Xấu Báo Ngập Giả Từ Xa 3km (Adversarial Walkthrough)

| Tình huống Tấn công Giả mạo | Diễn biến trên Giao diện `O5` & Phản hồi Hệ thống | Đánh giá Hiệu quả Chống Tin Giả 5 Lớp |
| :--- | :--- | :--- |
| **Kịch bản:** Kẻ xấu ngồi ở Quận 5 (cách đường Bến Mễ Cốc, Quận 8 khoảng **3.2km**), kéo bản đồ về Quận 8 rồi bấm nút `📸 Báo ngập` và định tải lên 1 bức ảnh ngập lấy trên mạng từ 2 ngày trước. | 1. **Chặn tại Lớp 1 (Geofence Validation `ST_DWithin <= 500m`):** Ngay khi mở Modal `O5`, hệ thống đối chiếu tọa độ GPS thực của thiết bị (Quận 5) với tâm điểm đang chọn báo cáo (Quận 8 — cách `3,200m > 500m`). Khung trạng thái lập tức hiện cảnh báo Đỏ: **`⛔ Không thể gửi: Vị trí GPS hiện tại của bạn cách điểm báo ngập 3.2km (Quy định bắt buộc có mặt tại hiện trường ≤500m)`**.<br>2. **Chặn tại Lớp 2 (Freshness / Live Camera `<= 10 phút`):** Nếu kẻ xấu cố chọn ảnh cũ từ thư viện (EXIF `captured_at` cách đây 48 giờ), hệ thống hiện cảnh báo: **`⚠️ Ảnh không hợp lệ: Ảnh chụp cách đây >10 phút. Vui lòng chụp trực tiếp tại hiện trường`**.<br>3. **Khóa cứng nút Submit (`Disabled CTA`):** Nút `🚀 Gửi báo cáo` bị vô hiệu hóa hoàn toàn (`opacity-50 cursor-not-allowed`) và API Backend trả về `422 Unprocessable Entity (ERR_GEOFENCE_VIOLATION)` nếu cố tình gửi request giả mạo. | - **Giải quyết triệt để Nỗi đau số 4 (`01-spatial-requirements.md`):** Chặn đứng 100% hành vi ngồi ở nhà spam báo ngập trêu chọc ở quận khác mà không làm phiền người dân thật đang đứng tại hiện trường. |

### 4.3 Phát Hiện Điểm Ma Sát & Đề Xuất Tinh Chỉnh (Persona 3)

| Mã | Điểm ma sát phát hiện (Friction Point) | Nguyên nhân (Mạng 4G yếu khi upload ảnh / Người lớn tuổi) | Mức độ nghiêm trọng | Đề xuất tinh chỉnh cụ thể vào Thiết kế |
| :--- | :--- | :--- | :--- | :--- |
| **F3.1** | **Tải ảnh chụp Camera độ phân giải gốc ($4\text{MB}-8\text{MB}$) qua mạng 4G mưa bão rất dễ bị timeout hoặc mất $>10\text{ giây}$.** | Điện thoại hiện nay chụp ảnh mặc định rất nặng. Trong điều kiện mưa to lúc 17h30, băng thông Upload 4G cực thấp, nếu gửi file gốc sẽ làm nút `Gửi báo cáo` quay vòng lâu khiến chú Hùng tưởng bị lỗi và bấm tắt. | **Nghiêm trọng (Critical)** | **Bắt buộc nén ảnh ngay trên trình duyệt (Client-side Canvas Compression) trước khi Upload:** Tự động thu nhỏ ảnh về chiều ngang tối đa `1024px`, định dạng `WebP/JPEG quality 0.75` (**dung lượng $< 150\text{KB}$**) sau khi đã trích xuất xong thông số `EXIF timestamp` ở client, giúp gửi thành công trong **$< 1.5\text{ giây}$** ngay cả trên mạng 3G/4G yếu. |
| **F3.2** | **Người dân đứng trên lề đường khô báo cáo đoạn đường ngập cách đó $30-50\text{m}$ có thể sợ định vị sai vị trí tâm ngập.** | Chú Hùng đứng trên thềm nhà cao ráo cách rốn ngập dưới lòng đường Mễ Cốc khoảng $40\text{m}$. Nếu chỉ lấy đúng tọa độ GPS chỗ chú đứng thì điểm báo có thể lệch vào trong hẻm. | **Trung bình (Medium)** | Trong Bước 3 của `O5` (*"Địa chỉ tự động"*), cho phép người dùng **kéo nhẹ ghim tâm ngập trong phạm vi bán kính cho phép $\le 500\text{m}$ quanh vị trí GPS của mình** (Snap tự động vào lòng đường chính gần nhất) để báo chính xác đoạn đường bị ngập mà không cần phải lội ra giữa dòng nước. |
| **F3.3** | **Chú thích giải thích Lớp 3–5 ở Bước 3 hơi nhiều thuật ngữ kỹ thuật (`TTL 90p`, `gom cụm 150m`).** | Với cư dân 45 tuổi như chú Hùng, cụm từ *"TTL 90p"* trong wireframe `O5` là thuật ngữ kỹ thuật khó hiểu. | **Thấp (Low)** | Đổi microcopy ở Bước 3 thành ngôn ngữ đời thường: **`🛡️ Báo cáo sẽ hiện ngay trên bản đồ, được gắn nhãn "Đã xác minh ✓" khi có đủ 3 người quanh đây cùng xác nhận và tự động ẩn sau 90 phút nếu nước rút.`** |

---

## 5. Tổng Hợp Ma Trận Đánh Giá Chuyển Đổi & Khả Dụng (LIFT & Fogg Audit Summary)

| Tiêu chí Đánh giá | Kết quả Kiểm thử trên 3 Persona | Điểm số (Thang 5) | Nhận xét Cốt lõi |
| :--- | :--- | :---: | :--- |
| **1. Value Proposition (Giá trị cốt lõi)** | Cả 3 Persona đều nhận được giá trị tức thì trong $<5\text{s}$: Ngôn ngữ đời thường theo bộ phận xe + Lộ trình né ngập theo đúng loại xe + Báo ngập không cần gõ phím. | **4.9 / 5.0** | Giải quyết trực tiếp 4 nỗi đau lớn nhất tại TP.HCM. |
| **2. Clarity (Độ rõ ràng thị giác dưới mưa)** | Bảng màu `CVD-Safe` + `Night Rain Mode` + Cỡ chữ `16px-24px` cho thông tin chính giúp đọc lướt cực nhanh. Cần tăng nhẹ cỡ chữ khi ở chế độ Ô tô (`F2.1`). | **4.6 / 5.0** | Tương phản cao, không bị nhiễu nền nhờ `Desaturated Basemap`. |
| **3. Friction & Ability (Khả năng thao tác 1 tay ướt)** | Hầu hết nút chính đã đạt `48px-68px` với `gap 12px`. Tuy nhiên cần bổ sung nút bấm mở rộng thay cho thao tác vuốt trên `O3` (`F1.2`) và nén ảnh `<150KB` (`F3.1`). | **4.5 / 5.0** | Sau khi vá 3 điểm ma sát `F1.2`, `F2.2`, `F3.1`, trải nghiệm tay ướt sẽ hoàn hảo. |
| **4. Anxiety & Trust (Độ tin cậy & Tuân thủ Rule 7)** | Hiển thị đầy đủ Độ tin cậy + Thời gian cập nhật + Nguồn + Camera TTGT đối chiếu + Chặn GPS $>500\text{m}$. Không có bất kỳ khẳng định tuyệt đối sai quy tắc nào. | **5.0 / 5.0** | Tuân thủ tuyệt đối `RULES.md` Mục 7. |

---

## Quyết Định Đã Chốt
1. **Bổ sung cơ chế Nén ảnh tại Client (`< 150KB`) trước khi gửi báo cáo (`F3.1 - Critical`):** Sau khi đọc kiểm tra `EXIF` trên thiết bị, ảnh chụp hiện trường bắt buộc được resize/compress qua HTML5 Canvas xuống `< 150KB` để đảm bảo gửi báo cáo thành công trong $< 1.5\text{s}$ ngay cả khi mạng 4G nghẽn lúc mưa to.
2. **Bổ sung Nút chạm mở rộng (`Tap-to-Expand`) trên Bottom Sheet `O3` (`F1.2 - High`):** Thêm nút bấm `min-h-[44px]` **`[📊 Xem dự báo 6h tới & Cam TTGT ▾]`** để người đi xe máy tay ướt không bắt buộc phải dùng thao tác vuốt trượt (swipe/drag) trên màn hình dính nước.
3. **Bảo toàn trạng thái (`Session State Persistence`) & Tối ưu hiển thị khoảng cách Taplo cho chế độ Ô tô (`F2.1`, `F2.2 - High/Medium`):** Tự động lưu trạng thái lộ trình vào `sessionStorage` khi tài xế bấm mở link Camera TTGT ngoài, đồng thời phóng lớn tỷ lệ chữ chính thêm `12%` khi đang ở chế độ `🚗 Ô tô`.
4. **Hỗ trợ dịch chuyển ghim điểm ngập trong bán kính hợp lệ $\le 500\text{m}$ (`F3.2 - Medium`) và Việt hóa hoàn toàn thông điệp Lớp 3–5 (`F3.3 - Low`):** Giúp người dân đứng trên vỉa hè khô ráo vẫn ghim đúng tâm ngập dưới lòng đường (tự động snap vào đoạn đường gần nhất trong vòng khóa GPS $500\text{m}$) và bỏ thuật ngữ kỹ thuật *"TTL 90p"* trên giao diện người dùng.

## Câu Hỏi Mở Cho Chủ Dự Án
- Hiện tại không có câu hỏi chặn (blocking). Toàn bộ các đề xuất tinh chỉnh từ phiên Walkthrough thực chiến với 3 Persona (`F1.1` $\rightarrow$ `F3.3`) đều nằm trong phạm vi giao diện Frontend MVP và không làm thay đổi kiến trúc cơ sở dữ liệu hay API đã chốt.

## Chuyển Giao / Rủi Ro
- **Chuyển giao cho UI Designer (`05-design-spec.md`) & Frontend Developer:**
  - Tích hợp 7 tinh chỉnh thực chiến (`F1.1` đến `F3.3`) vào quá trình hiện thực hóa giao diện, đặc biệt là hàm nén ảnh Canvas `< 150KB` trong luồng `O5: Crowd Report Modal` và nút `Tap-to-Expand` trong `O3: Alert Detail Bottom Sheet`.
- **Rủi ro & Giảm thiểu:**
  - *Rủi ro sai số GPS (`Multipath GPS Drift`) khi đứng dưới mái hiên tôn hoặc gầm cầu vượt tại TP.HCM:* Khi người dân như chú Hùng hoặc anh Minh trú mưa dưới gầm cầu vượt Nguyễn Hữu Cảnh, sai số GPS có thể nhảy lên $50\text{m}-80\text{m}$. **Giải pháp đã kiểm chứng:** Bán kính khóa Geofence $500\text{m}$ (`ST_DWithin <= 500m`) đủ rộng để dung thứ cho sai số mái hiên/gầm cầu mà vẫn chặn đứng hoàn toàn kẻ xấu ngồi ở nhà cách hàng kilomet báo giả.
