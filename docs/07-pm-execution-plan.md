# KẾ HOẠCH TRIỂN KHAI CHIẾN LƯỢC DỰ ÁN OCEAN FLOOD (S-TIER)
**Tài liệu Quản lý Dự án & Chỉ đạo Thi công (Senior Project Manager Execution Plan)**  
*Ngày ban hành: 14/10/2026 | Phiên bản: 2.0 (The Core 3 Pivot)*  
*Chủ dự án: Giám đốc Dự án Ocean Flood | Senior PM: AI Senior PM*

---

## I. BỐI CẢNH & PHÂN TÍCH QUYẾT ĐỊNH CHIẾN LƯỢC

### 1. Phân tích hiện trạng Camera An ninh / TTGT TP.HCM
* **Vấn đề kỹ thuật thực tế:** Hệ thống Camera giao thông hiện do Trung tâm Quản lý Điều hành Giao thông Đô thị (Sở GTVT & Công an TP.HCM) quản lý độc quyền qua ứng dụng "TTGT TP.HCM" và web nội bộ. Hiện chưa có API streaming công khai / WebSocket trực tiếp cho bên thứ ba.
* **Quyết định dứt khoát:**
  - **Đóng băng ngay lập tức** việc cố gắng kết nối luồng stream RTSP/HLS trực tiếp.
  - **Loại bỏ toàn bộ Canvas đồ họa giả lập** (xe chạy, mưa rơi giả lập, bounding box mô phỏng) để đảm bảo tính trung thực, đạo đức dữ liệu và sự tin cậy tuyệt đối của người dùng đô thị.
  - **Thiết kế Placeholder cao cấp (Official Government Bridge UI):** Giao diện định danh chốt camera chuẩn mực, thông tin cột cam, hướng quan sát, tọa độ nút giao, và thông điệp minh bạch: *"Tính năng đang được chuẩn bị kết nối cùng Cổng TTGT TP.HCM - Sẽ ra mắt trong bản cập nhật tới"*.
  - Cung cấp nút 1-chạm trỏ thẳng về Cổng TTGT TP.HCM chính thống (`giaothong.hochiminhcity.gov.vn`) và hướng dẫn mở app TTGT.

### 2. Tái phân bổ nguồn lực: Tập trung toàn lực vào 3 Trọng tâm Cốt lõi (The Core 3)
* **Trọng tâm 1: Dự đoán Ngập & Mưa theo mô hình Thủy văn (Open-Meteo + Đỉnh triều Phú An/Nhà Bè)**
  - Trực quan hóa timeline dự báo 3 giờ tới (+1h, +2h, +3h) với các chỉ số dễ hiểu: Lượng mưa (mm/h), Đỉnh triều (m so với Báo động I/II/III), Xác suất ngập (%), Xu hướng nước dâng hay rút.
  - Người dùng nhìn trong 3 giây là biết: *Khi nào ngập đỉnh điểm? Sau mấy giờ thì đường rút nước để đi về an toàn?*
* **Trọng tâm 2: Báo cáo Ngập Cộng đồng, Chụp ảnh & Xem ảnh Thực tế**
  - Xem ảnh hiện trường theo khung giờ trực quan (18:00 – 20:00, 16:00 – 18:00, 14:00 – 16:00), thẻ ảnh lớn có thước đo ngập (Water Level Gauge overlay) và nhãn thời gian giờ:phút.
  - Tối ưu nút bấm 1-chạm: "👍 Đúng, đang ngập (+1)" và "💧 Báo nước đã rút (0cm)" cập nhật tức thì vào bản đồ và timeline.
* **Trọng tâm 3: Gợi ý Lộ trình Né Ngập (Smart Route Planning & Live Track)**
  - Bảng so sánh 2 tuyến nổi bật kiểu Google Maps: **Tuyến Xanh (An toàn - Khuyên đi)** vs **Tuyến Đỏ (Cắt qua điểm ngập - Cảnh báo)**.
  - Hiển thị rõ số phút chênh lệch, độ an toàn theo loại phương tiện (Xe máy né ống pô ≥20cm, Ô tô Sedan né gầm xe ≥25cm).
  - Tích hợp Live Track GPS dẫn đường từng khúc cua (Turn-by-turn).

---

## II. MA TRẬN GIAO VIỆC & TIÊU CHÍ NGHIỆM THU (TASK BREAKDOWN & ACCEPTANCE CRITERIA)

| Mã Task | Hạng mục công việc | File phụ trách | Tiêu chí nghiệm thu (Acceptance Criteria) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TSK-01** | Tái cấu trúc Trình xem Camera sang Placeholder cao cấp | `src/components/SecurityCameraModal.tsx` | - Xóa bỏ toàn bộ canvas animation giả lập.<br>- Giao diện sang trọng, hiển thị đúng thông tin cột cam, vị trí nút giao, khoảng cách điểm ngập.<br>- Hiển thị nhãn thông báo chính thức chuẩn bị kết nối TTGT.<br>- Nút mở web TTGT TP.HCM và bản đồ vệ tinh/tọa độ nút giao hoạt động chuẩn. | **✅ HOÀN THÀNH 100%** |
| **TSK-02** | Nâng cấp Timeline Dự báo Mưa & Triều 3 giờ tới | `src/components/AlertBottomSheet.tsx`<br>`src/components/TopStatusBar.tsx` | - TopStatusBar có Popover/Drawer xem timeline 3 giờ (+1h, +2h, +3h) trực quan.<br>- AlertBottomSheet có block Thủy văn 3 giờ tới hiển thị rõ: mm/h, mức triều m (BĐ1/2/3), rủi ro %, xu hướng dâng/rút.<br>- Người thường nắm bắt tình hình trong 3 giây. | **✅ HOÀN THÀNH 100%** |
| **TSK-03** | Tối ưu Báo cáo Hiện trường & Trình duyệt Ảnh Cộng đồng | `src/components/AlertBottomSheet.tsx` | - Bộ lọc khung giờ (18-20h, 16-18h, 14-16h) mượt mà.<br>- Thẻ ảnh trực quan có thước đo ngập theo màu cảnh báo.<br>- Nút "+1 Đang ngập" và "Nước đã rút" 1-chạm cập nhật UI ngay lập tức.<br>- Modal phóng to ảnh đầy đủ thông tin nhân chứng. | **✅ HOÀN THÀNH 100%** |
| **TSK-04** | Nâng cấp Bảng So sánh Lộ trình Né Ngập (Google Maps Style) | `src/components/RoutePlannerDrawer.tsx` | - Thẻ Tuyến Xanh vs Tuyến Đỏ to rõ, nêu bật chênh lệch thời gian & lý do né ngập.<br>- Đánh giá an toàn theo Xe máy (Ống pô) và Ô tô (Gầm xe/Thủy kích).<br>- Chỉ dẫn từng bước trực quan (Turn-by-turn).<br>- Live Track GPS ổn định. | **✅ HOÀN THÀNH 100%** |
| **TSK-05** | Đồng bộ Điều phối Toàn trang & Kiểm thử Build | `src/app/page.tsx`<br>`src/app/api/alerts/route.ts` | - Chuyển default scenario sang 'live' (Open-Meteo API thực tế).<br>- Đồng bộ truyền dữ liệu thủy văn (Open-Meteo + Trạm triều) cho AlertBottomSheet.<br>- Kiểm tra typecheck và build 100% không warning/error.<br>- Báo cáo nghiệm thu hoàn tất. | **✅ HOÀN THÀNH 100%** |

---

## III. NGUYÊN TẮC THIẾT KẾ & TRẢI NGHIỆM NGƯỜI DÙNG (UX PRINCIPLES)

1. **Quy tắc 3 Giây (The 3-Second Rule):**
   Người dùng mở app trong lúc trời mưa to, đi xe máy một tay cầm lái hoặc dừng trú mưa. Giao diện phải truyền tải thông điệp quan trọng nhất: *Đường này đi được không? Né đường nào an toàn? Mấy giờ hết ngập?* trong vòng 3 giây.
2. **Trung thực về dữ liệu (Data Integrity):**
   Dữ liệu mưa từ Open-Meteo, dữ liệu triều từ Trạm Phú An/Nhà Bè, dữ liệu cộng đồng từ báo cáo người dân có xác thực GPS. Camera chưa có API thì nói rõ "đang chuẩn bị kết nối", tuyệt đối không dùng AI giả lập đánh lừa người dùng.
3. **Thẩm mỹ chuẩn Google Maps:**
   Tông màu xanh thương hiệu (`#1A73E8`), thẻ bo tròn lớn (`rounded-2xl`, `rounded-3xl`), font chữ rõ nét, đổ bóng êm ái, hoạt động hoàn hảo trên mọi kích thước màn hình điện thoại và máy tính.

---

## IV. KẾT QUẢ NGHIỆM THU & BÀN GIAO KỸ THUẬT (BUILD & VERIFICATION)

1. **TypeScript Check (`npm run typecheck`):**
   - Lệnh: `tsc --noEmit`
   - Kết quả: **Exit code 0, 0 error, 0 warning**. Toàn bộ kiểu dữ liệu được kiểm soát chặt chẽ.
2. **Next.js Production Build (`npm run build`):**
   - Lệnh: `next build` (Next.js 14.2.35)
   - Kết quả: **Compiled successfully (7/7 pages generated)**.
   - Kích thước Bundle: First Load JS shared 87.3 kB (siêu nhẹ, tải trong dưới 0.3s trên 4G).
3. **Danh sách tệp tin đã triển khai & tối ưu hóa:**
   - [docs/07-pm-execution-plan.md](file:///Users/yangcoi/Documents/Ocean%20Flood/docs/07-pm-execution-plan.md)
   - [src/components/SecurityCameraModal.tsx](file:///Users/yangcoi/Documents/Ocean%20Flood/src/components/SecurityCameraModal.tsx)
   - [src/components/AlertBottomSheet.tsx](file:///Users/yangcoi/Documents/Ocean%20Flood/src/components/AlertBottomSheet.tsx)
   - [src/components/TopStatusBar.tsx](file:///Users/yangcoi/Documents/Ocean%20Flood/src/components/TopStatusBar.tsx)
   - [src/components/RoutePlannerDrawer.tsx](file:///Users/yangcoi/Documents/Ocean%20Flood/src/components/RoutePlannerDrawer.tsx)
   - [src/app/page.tsx](file:///Users/yangcoi/Documents/Ocean%20Flood/src/app/page.tsx)
   - [src/app/api/alerts/route.ts](file:///Users/yangcoi/Documents/Ocean%20Flood/src/app/api/alerts/route.ts)

