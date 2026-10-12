# Mô Hình Đe Dọa Bảo Mật & Bảo Vệ Quyền Riêng Tư (Threat Model & Privacy Design)

**Người phụ trách:** Security Architect & Privacy Engineer (`agency-security-architect`, `agency-privacy-engineer`)  
**Dựa trên:** `docs/01-legal.md`, `docs/03-architecture.md`, `docs/03-workflows.md`, `docs/03-api.md`  
**Ngày lập:** 2026-10-12  

---

## PHẦN A: THREAT MODEL — CHỐNG BÁO CÁO LUNG TUNG & TẤN CÔNG (`03-threat-model`)

Hệ thống phân loại mối đe dọa theo mô hình **STRIDE** tập trung vào bài toán quan trọng nhất mà Chủ dự án yêu cầu: **Không để người dùng báo cáo lung tung / giả mạo**:

| Mối đe dọa (Threat) | Kịch bản tấn công thực tế | Giải pháp kỹ thuật bắt buộc trong Ocean Flood | Mức ưu tiên |
| :--- | :--- | :--- | :--- |
| **1. Báo cáo ngập giả từ xa (Remote Spoofing)** | Kẻ xấu ngồi ở nhà hoặc quận khác bấm báo ngập hàng loạt trên đường Nguyễn Xí để trêu chọc hoặc gây hoang mang. | **Geofence cứng $\le 500\text{m}$:** Kiểm tra khoảng cách `ST_Distance(user_gps, target_gps) <= 500m` cả ở Client lẫn Server. Yêu cầu độ chính xác GPS `accuracy <= 100m`. | **P0 (Bắt buộc)** |
| **2. Dùng ảnh cũ trên mạng để báo ngập (Replay / Fake Photo)** | Tải ảnh ngập từ năm ngoái trên báo chí rồi upload lên hệ thống lúc trời đang nắng ráo. | **Kiểm tra EXIF Timestamp & Camera-Only Fallback:**<br>- Đọc `DateTimeOriginal` trong EXIF: bắt buộc chênh lệch **$\le 10\text{ phút}$** so với giờ server.<br>- Nếu trình duyệt/thiết bị xóa EXIF: Giao diện ép thuộc tính `<input type="file" accept="image/*" capture="environment">` (chỉ mở Camera sau chụp trực tiếp, khóa chọn ảnh từ thư viện cũ) và đóng dấu thời gian thực. | **P0 (Bắt buộc)** |
| **3. Một người cố tình báo sai tại chỗ (Single-Actor Poisoning)** | Một người đứng đúng trên đường khô ráo, chụp ảnh mặt đường rồi bấm "Ngập sâu >50cm" để đánh lừa hệ thống gợi ý lộ trình. | **Kiểm chứng chéo (Cross-Check $\ge 3$ người) + Đối chiếu Thủy văn:**<br>- Nếu lúc đó dự báo mưa $= 0\text{mm/h}$ và triều thấp ($< 1.30\text{m}$), báo cáo của 1 người chỉ hiện ở trạng thái *"Chưa xác minh (1 người báo)"* và **chưa kích hoạt** chặn đường Routing.<br>- Chỉ khi có **$\ge 3$ thiết bị khác nhau** trong bán kính $150\text{m}$ cùng xác nhận (hoặc 1 báo cáo kèm ảnh trùng khớp với giờ đang mưa lớn/đỉnh triều) mới chuyển thành `VERIFIED`. | **P0 (Bắt buộc)** |
| **4. Spam hàng loạt làm nghẽn DB/Storage (DoS & Storage Exhaustion)** | Bot gửi hàng nghìn ảnh dung lượng lớn làm tràn 1GB Free Storage. | - Nén ảnh phía Client sang `WebP` (kích thước tối đa $1024\text{px}$, dung lượng **$< 150\text{KB}$**).<br>- Rate limit: Tối đa **5 báo cáo / giờ / `device_hash` & IP**.<br>- Tự động xóa ảnh sau 30 ngày. | **P0 (Bắt buộc)** |
| **5. Lộ khóa quản trị / DB Secret (Information Disclosure)** | Lộ `SUPABASE_SERVICE_ROLE_KEY` trên mã nguồn Frontend. | - Lưu toàn bộ khóa bí mật trong biến môi trường server (`.env.local`, đã chặn trong `.gitignore`).<br>- Bật **Row Level Security (RLS)** trên Supabase: Client chỉ được phép `SELECT` các điểm ngập công khai; mọi lệnh `INSERT/UPDATE` phải đi qua Backend API kiểm duyệt 5 lớp. | **P0 (Bắt buộc)** |

---

## PHẦN B: THIẾT KẾ QUYỀN RIÊNG TƯ & TUÂN THỦ NĐ 13/2023 (`03-privacy`)

1. **Báo cáo ẩn danh 100% (Zero-Account Friction):**
   - Người dân **không cần đăng ký tài khoản, không cần nhập số điện thoại hay email** để xem bản đồ hay gửi báo cáo ngập.
   - Hệ thống tạo mã băm một chiều `device_hash = SHA256(device_fingerprint + salt)` để tính điểm uy tín và chống spam mà không định danh cá nhân.
2. **Làm mờ tọa độ người báo cáo (Location Fuzzing trên giao diện công khai):**
   - Trên CSDL nội bộ: Kiểm tra chính xác khoảng cách $\le 500\text{m}$.
   - Khi trả dữ liệu ra API công khai (`/api/alerts`): Chỉ trả về **tọa độ tâm điểm ngập trên mặt đường (`target_gps`)** và tên đường/địa chỉ khu vực, tuyệt đối không công khai tọa độ đứng chính xác (`user_gps`) của người gửi báo cáo.
3. **Lưu lộ trình cá nhân trên thiết bị (Local-First Route Privacy):**
   - Lộ trình quen thuộc (*"Đường đi làm mỗi ngày"*) của người dùng được lưu mặc định trong `localStorage` / `IndexedDB` ngay trên điện thoại của họ.

---

## Quyết Định Đã Chốt
1. Chốt cơ chế phòng thủ 5 lớp chống báo cáo lung tung: **Khóa bán kính GPS $\le 500\text{m}$ + Khóa thời gian ảnh chụp $\le 10\text{ phút}$ (ưu tiên chụp trực tiếp Camera) + Kiểm chứng chéo $\ge 3$ người + Đối chiếu mưa/triều + Điểm uy tín thiết bị**.
2. Đảm bảo ẩn danh, không bắt người dùng tạo tài khoản rườm rà lúc đang đi dưới mưa.

## Câu Hỏi Mở Cho Chủ Dự Án
- Không có.

## Chuyển Giao / Rủi Ro
- **Chuyển giao:** Chuyển toàn bộ đặc tả kỹ thuật sang `docs/04-backlog.md` để lập danh sách công việc theo Sprint.
