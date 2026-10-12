# Đánh Giá Tuân Thủ Pháp Lý (Legal Compliance)

**Người phụ trách:** Legal Compliance Checker
**Dựa trên:** `docs/RULES.md`, `docs/00-brief.md`, `docs/01-data-sources.md`
**Ngày lập:** 2026-10-12
**Cập nhật:** 2026-10-12 (bổ sung quyết định tự lực, báo cáo cộng đồng, routing)

---

## 1. Kiểm tra Điều Khoản Sử Dụng Các Nguồn Dữ Liệu

### Nguồn dữ liệu SỬ DỤNG trong MVP

| Nguồn dữ liệu | Giấy phép | Yêu cầu pháp lý | Trạng thái |
|---|---|---|---|
| **Open-Meteo Weather API** | ODbL — cho phép sử dụng, sao chép, phân phối | Ghi attribution: "Dữ liệu thời tiết: Open-Meteo.com (ODbL)" | ✅ Hợp pháp |
| **OpenStreetMap (OSM)** | ODbL — bắt buộc attribution | Hiển thị "© OpenStreetMap contributors" trên bản đồ | ✅ Hợp pháp |
| **OSRM / Valhalla** (routing, dùng dữ liệu OSM) | BSD / MIT — mã nguồn mở | Ghi attribution OSM cho dữ liệu nền | ✅ Hợp pháp |
| **Đài KTTV Nam Bộ** (bản tin triều) | Bản tin công cộng | Ghi nguồn: "Đài Khí tượng Thủy văn khu vực Nam Bộ" | ✅ Hợp pháp (thông tin công cộng) |
| **Sở Xây dựng TP.HCM** (điểm đen ngập) | Dữ liệu hành chính công bố | Ghi nguồn: "Sở Xây dựng TP.HCM" | ✅ Hợp pháp |
| **Cổng dữ liệu mở TP.HCM** (tọa độ camera) | CC-BY hoặc không ràng buộc (cần kiểm tra từng dataset) | Ghi nguồn + link URL gốc | ✅ Hợp pháp (cần xác nhận từng dataset) |
| **NASA SRTM / Copernicus GLO-30** (DEM) | Open Data | Không ràng buộc thương mại | ✅ Hợp pháp |
| **GADM Vietnam** (ranh giới hành chính) | CC-BY / phi thương mại | Ghi nguồn | ✅ Hợp pháp |

### Nguồn dữ liệu KHÔNG SỬ DỤNG trong MVP

| Nguồn | Lý do không sử dụng |
|---|---|
| **UDI Maps** | Không có API công khai, crawl là vi phạm SHTT. Không liên hệ hợp tác trong giai đoạn MVP. |
| **nuoclen.com** | Không có API mở. Không liên hệ tác giả trong giai đoạn MVP. |
| **Vrain (vrain.vn)** | Chưa xác minh API, rủi ro vi phạm Điều khoản Dịch vụ. |
| **FEDS (thongtinthoatnuoc.tphcm.gov.vn)** | Hệ thống nội bộ, cần tài khoản cấp phép. |
| **Cổng giao thông TP.HCM** (stream camera) | Không có API mở, crawl stream là vi phạm. Chỉ dùng **tọa độ camera** từ dữ liệu mở. |

---

## 2. Yêu Cầu Pháp Lý Khi Công Bố Cảnh Báo Ngập

### 2.1 Disclaimer bắt buộc
Hiển thị tại footer hoặc splash screen:
> "Thông tin cảnh báo ngập được xây dựng dựa trên dữ liệu dự báo thời tiết, lịch triều cường và phản ánh cộng đồng. Đây là công cụ hỗ trợ tham khảo — không thay thế thông tin chính thức từ cơ quan chức năng. Người dùng tự chịu trách nhiệm khi quyết định di chuyển dựa trên thông tin này."

### 2.2 Ngôn ngữ cảnh báo song song
Mỗi cảnh báo phải hiển thị **2 dòng**:
- **Dòng khoa học:** Dữ liệu cụ thể (mm/h, mực nước, trạm đo, thời gian)
- **Dòng đời thường:** Diễn giải dễ hiểu cho người dân

Yêu cầu pháp lý bổ sung cho ngôn ngữ đời thường:
- **Không được dùng từ tuyệt đối**: "an toàn", "chắc chắn không ngập", "yên tâm 100%"
- **Phải dùng từ xác suất**: "có khả năng", "gần như chắc chắn", "nguy cơ thấp/cao"
- **Phải kèm thời gian**: mọi cảnh báo phải ghi rõ thời điểm dự báo và thời điểm cập nhật

### 2.3 Attribution (ghi công) bắt buộc trên giao diện
- Bản đồ: "© OpenStreetMap contributors"
- Thời tiết: "Dữ liệu thời tiết: Open-Meteo.com"
- Triều: "Dự báo triều: Đài KTTV khu vực Nam Bộ"
- Điểm ngập lịch sử: "Nguồn: Sở Xây dựng TP.HCM"
- Routing: "Lộ trình: OSRM / OpenStreetMap"

---

## 3. Pháp Lý Cho Tính Năng Báo Cáo Cộng Đồng

### 3.1 Dữ liệu thu thập từ người dùng khi báo cáo
| Dữ liệu | Mục đích | Lưu trữ | Xóa sau |
|---|---|---|---|
| **Ảnh chụp** | Bằng chứng ngập | Server (nén) | 30 ngày |
| **Tọa độ GPS** | Xác định vị trí ngập | Dạng không định danh | 90 ngày |
| **EXIF ảnh** | Kiểm tra thời gian chụp | Chỉ đọc, không lưu | Xử lý xong xóa ngay |
| **Device fingerprint** | Chống spam / tài khoản ảo | Hash, không định danh | 90 ngày |
| **Điểm uy tín** | Đánh giá độ tin cậy | Gắn với device hash | Vĩnh viễn (ẩn danh) |

### 3.2 Tuân thủ NĐ-CP 13/2023 (Bảo vệ dữ liệu cá nhân)
- **Consent (Đồng ý):** Khi lần đầu sử dụng tính năng báo cáo hoặc bật GPS, hiển thị modal yêu cầu đồng ý với mô tả mục đích rõ ràng.
- **Minimization (Thu thập tối thiểu):** Chỉ thu GPS khi người dùng chủ động báo cáo hoặc bật tính năng lộ trình cá nhân. Không tracking liên tục.
- **Anonymization (Ẩn danh):** GPS lưu dạng hash + timestamp, không gắn với danh tính cá nhân.
- **Right to withdraw (Quyền rút lại):** Người dùng có thể tắt GPS bất kỳ lúc nào, xóa lộ trình đã lưu.
- **Data retention (Thời hạn lưu):** GPS và ảnh tự động xóa sau 90 ngày và 30 ngày tương ứng.
- **Privacy policy:** Đặt link "Chính sách bảo mật" trong footer và trong modal consent.

### 3.3 Kiểm soát chống báo cáo sai — Yêu cầu pháp lý & kỹ thuật
| Biện pháp | Chi tiết |
|---|---|
| GPS proximity check | Thiết bị phải cách vị trí báo cáo ≤ 500 m |
| EXIF timestamp check | Thời gian chụp ảnh phải ≤ 10 phút so với thời gian báo cáo |
| Camera capture fallback | Nếu ảnh không có EXIF → bắt buộc chụp trực tiếp qua camera trong app |
| Cross-verification | Cần ≥ 3 người xác nhận trước khi chuyển "Đã xác minh" |
| Rate limiting | Tối đa 5 báo cáo / giờ / thiết bị |
| Reputation scoring | Điểm uy tín tăng khi báo đúng, giảm khi báo sai |
| Auto-expiry (TTL) | Hạ cấp tự động sau 90 phút không có xác nhận mới |

---

## 4. Pháp Lý Cho Tính Năng Gợi Ý Lộ Trình

- **Disclaimer routing:** "Lộ trình gợi ý dựa trên dữ liệu OpenStreetMap và dự báo ngập — chỉ mang tính tham khảo. Vui lòng quan sát thực tế khi di chuyển."
- **Không thu thập lộ trình di chuyển thực tế** — chỉ lưu lộ trình người dùng **chủ động thiết lập** (đường đi làm).
- **Lộ trình cá nhân** lưu cục bộ trên thiết bị (localStorage), chỉ gửi lên server khi cần tính toán push notification.

---

## 5. Quyết Định Đã Chốt

1. **Tự lực hoàn toàn** — không hợp tác / liên hệ bên ngoài trong giai đoạn MVP.
2. **Tất cả nguồn dữ liệu MVP đều hợp pháp** — Open-Meteo (ODbL), OSM (ODbL), KTTV (công khai), Sở XD (hành chính), DEM (Open Data).
3. **Không crawl** UDI Maps, nuoclen, Vrain, stream camera TTGT.
4. **Cảnh báo song song 2 ngôn ngữ** — khoa học + đời thường, không dùng từ tuyệt đối.
5. **Báo cáo cộng đồng** kiểm soát chặt: ảnh + GPS + EXIF + xác nhận chéo + điểm uy tín.
6. **Thu thập GPS** tuân thủ NĐ-CP 13/2023: consent, ẩn danh, xóa sau 90 ngày.
7. **Routing** dùng OSRM/Valhalla (mã nguồn mở, dữ liệu OSM) — miễn phí, hợp pháp.
8. **Disclaimer** bắt buộc: không thay thế thông tin chính thức, chỉ tham khảo.

## 6. Câu Hỏi Mở Cho Chủ Dự Án

1. Với tính năng lưu "đường đi làm" và push notification — bạn muốn dùng Web Push API (miễn phí, PWA) hay cần giải pháp khác?
2. Ảnh báo cáo ngập nên hiển thị công khai trên bản đồ (mọi người xem được) hay chỉ dùng nội bộ để xác minh?
3. Khi hệ thống gợi ý lộ trình thay thế, có muốn hiển thị kèm thời gian di chuyển ước tính không?

## 7. Chuyển Giao / Rủi Ro

- **Rủi ro disclaimer không đủ mạnh:** Nếu cảnh báo sai dẫn đến tai nạn, disclaimer là tuyến phòng thủ pháp lý duy nhất. Cần luật sư rà soát trước khi launch chính thức (sau MVP).
- **Rủi ro EXIF bị stripped:** Một số app nhắn tin (Zalo, Messenger) xóa EXIF khi chia sẻ ảnh. Giải pháp: bắt chụp trực tiếp qua camera trong app khi EXIF không có.
- **Rủi ro GPS spoofing:** Người dùng có thể fake GPS. Biện pháp: kết hợp IP geolocation + device fingerprint + cross-verification để giảm thiểu.
- **Bàn giao:** Chuyển giao tài liệu pháp lý cho **Software Architect (Phase 2)** để thiết kế hệ thống tuân thủ các yêu cầu trên.
