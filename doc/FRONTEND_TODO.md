# QR Event Ticket Frontend TODO (Sync với Backend)

Tài liệu tổng hợp các việc frontend cần làm để bắt kịp backend (bao gồm cập nhật từ Phase 1–3).

## 1) Bảo mật & Rate limit
- [ ] Xử lý HTTP 429 (rate limit) ở layer fetch chung:
  - File gợi ý: `src/api/config.js` (handleResponse).
  - Hiển thị thông báo thân thiện: “Bạn thao tác quá nhanh, vui lòng thử lại sau ít giây.”
  - Các form bị ảnh hưởng: register, verify-otp, login, forgot-password, reset-password.

## 2) Cấu hình CORS / Base URL
- [ ] Đảm bảo `VITE_API_BASE_URL` trỏ đúng backend mới.
- [ ] Nếu dùng nhiều domain frontend, backend cho phép `FRONTEND_URL` dạng danh sách (dấu phẩy). Kiểm tra env ở các môi trường dev/stage/prod.

## 3) Swagger (để sync schema)
- [ ] Sử dụng `/api/docs` (Bearer JWT) để kiểm tra request/response mới nhất cho:
  - Auth, Users
  - Organizations, Events, Ticket Types, Tickets
  - Orders, Payment (VNPAY, PayOS)
  - Upload (nếu dùng)

## 4) PayOS flow
- [ ] Confirm thanh toán: dùng `orderCode` thật từ PayOS return; API `POST /payment/payos/confirm` đã verify trực tiếp với PayOS, không cần payload giả.
- [ ] Return/cancel URL: đảm bảo truyền đúng `return_url`, `cancel_url` khi initiate.

## 5) Cache nhận thức (không bắt buộc đổi API)
- [ ] `GET /events/public` và `GET /events/:eventId/ticket-types` được cache 30s. UI nếu cần dữ liệu vừa cập nhật có thể thêm nút “Làm mới ngay”.

## 6) Upload ảnh (tùy chọn)
- Backend có `/upload/image` (JWT, form-data `file`, trả `{ url }`, tối đa 5MB, jpg/png/webp/gif).
- [ ] Nếu vẫn dùng Cloudinary (hiện tại): không cần đổi code.
- [ ] Nếu muốn dùng backend: thêm service gọi `POST /upload/image` và thay ImageUploader để dùng URL trả về.

## 7) Email templates
- Backend đã đổi template OTP/reset (brand, CTA, hạn dùng rõ). Frontend không cần đổi UI, chỉ lưu ý subject có tiền tố `APP_NAME`.

## 8) Khớp API mới/thay đổi (so với code hiện tại)
- [ ] Thêm/tận dụng các endpoint:
  - Swagger `/api/docs` (Bearer)
  - Upload `/upload/image` (tùy chọn)
  - PayOS confirm `/payment/payos/confirm` (đã dùng nhưng cần đảm bảo lấy orderCode thật)
- [ ] Kiểm tra lại flows Orders/Payment:
  - Initiate payment: POST `/orders/:id/payment/initiate` (đã đúng trong `src/api/payment.js`)
  - Check payment status: GET `/orders/:id/payment/status` (đã đúng)
  - Confirm PayOS: POST `/payment/payos/confirm` (đã đúng)

## 9) i18n / UI thông báo
- [ ] Thêm thông báo cụ thể cho lỗi 429 (rate limit).
- [ ] (Tuỳ chọn) Thông báo “dữ liệu có thể trễ tối đa 30s do cache” cho danh sách public events/ticket types nếu UX cần minh bạch.

## 10) Env gợi ý
- `VITE_API_BASE_URL` → URL backend
- `FRONTEND_URL` (backend dùng cho CORS/redirect, là env phía server)
- `FILE_BASE_URL` (nếu dùng upload nội bộ; nếu Cloudinary thì bỏ qua)
- `APP_NAME`, `SUPPORT_EMAIL` (chỉ ảnh hưởng email, không cần front)

---
### Mức độ ưu tiên
1. **Bắt buộc**: Xử lý 429 ở `handleResponse`; xác nhận PayOS dùng orderCode thật; kiểm tra `VITE_API_BASE_URL`.
2. **Nên làm**: Thêm nút refresh dữ liệu nếu cần bỏ qua cache; thêm thông báo rate limit thân thiện.
3. **Tuỳ chọn**: Tích hợp upload backend (nếu không dùng Cloudinary).

