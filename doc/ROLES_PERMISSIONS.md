# Tài liệu Phân quyền theo Role

## Tổng quan

Hệ thống QR Event Ticket sử dụng mô hình phân quyền theo role với 5 cấp độ, được thiết kế theo hình thức kế thừa từ thấp đến cao.

```
PLATFORM_ADMIN (Quản trị viên hệ thống)
    └── ORGANIZER_ADMIN (Quản trị viên tổ chức)
            └── EVENT_MANAGER (Quản lý sự kiện)
                    └── CHECKIN_STAFF (Nhân viên check-in)
                            └── CUSTOMER (Khách hàng)
```

---

## 1. CUSTOMER (Khách hàng)

Role mặc định khi người dùng đăng ký tài khoản.

### 1.1 Xác thực (Auth)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Đăng ký tài khoản | `/auth/register` | POST |
| Xác thực OTP | `/auth/verify-otp` | POST |
| Đăng nhập | `/auth/login` | POST |
| Đăng nhập Google | `/auth/google` | GET |
| Quên mật khẩu | `/auth/forgot-password` | POST |
| Đặt lại mật khẩu | `/auth/reset-password` | POST |
| Xem profile | `/auth/profile` | GET |
| Đăng xuất | `/auth/logout` | POST |

### 1.2 Sự kiện (Events)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem danh sách sự kiện công khai | `/events/public` | GET |
| Xem chi tiết sự kiện theo slug | `/events/slug/:slug` | GET |

### 1.3 Danh mục (Categories)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem danh sách danh mục active | `/categories` | GET |
| Xem chi tiết danh mục | `/categories/:id` | GET |
| Xem danh mục theo slug | `/categories/slug/:slug` | GET |

### 1.4 Đơn hàng (Orders)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Tạo đơn hàng mua vé | `/orders` | POST |
| Xem danh sách đơn hàng của mình | `/orders` | GET |
| Xem chi tiết đơn hàng | `/orders/:id` | GET |
| Xem đơn hàng theo order_number | `/orders/order-number/:orderNumber` | GET |
| Hủy đơn hàng (chưa thanh toán) | `/orders/:id/cancel` | POST |
| Thanh toán đơn hàng | `/orders/:id/payment/initiate` | POST |
| Xem trạng thái thanh toán | `/orders/:id/payment/status` | GET |

### 1.5 Thanh toán (Payment)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Tạo payment URL (VNPAY) | `/payment/create` | POST |
| Tạo payment URL (PayOS) | `/payment/create/payos` | POST |
| Xác nhận thanh toán PayOS | `/payment/payos/confirm` | POST |

### 1.6 Vé của tôi (My Tickets)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem tất cả vé của mình | `/my-tickets` | GET |
| Xem chi tiết vé | `/my-tickets/:id` | GET |
| Tra cứu vé theo QR | `/my-tickets/qr/:qrPayload` | GET |

### 1.7 Hoàn tiền (Refunds)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem danh sách hoàn tiền của mình | `/refunds/my-refunds` | GET |
| Xem chi tiết yêu cầu hoàn tiền | `/refunds/:id` | GET |

### 1.8 Trợ lý AI

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Chat với trợ lý AI | `/ai/chat` | POST |
| Kiểm tra AI khả dụng | `/ai/status` | GET |

---

## 2. CHECKIN_STAFF (Nhân viên check-in)

> **Kế thừa:** Tất cả chức năng của CUSTOMER

Role được gán cho nhân viên check-in tại sự kiện. Chỉ được phép thao tác trong scope của organization được phân công.

### 2.1 Check-in

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Quét QR check-in | `/checkin/scan` | POST |
| Xem thống kê check-in cơ bản | `/checkin/events/:eventId/stats` | GET |
| Xem lịch sử check-in | `/checkin/events/:eventId/history` | GET |

---

## 3. EVENT_MANAGER (Quản lý sự kiện)

> **Kế thừa:** Tất cả chức năng của CHECKIN_STAFF

Role dành cho người quản lý sự kiện trong tổ chức. Có thể CRUD events và ticket types.

### 3.1 Sự kiện (Events)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem danh sách sự kiện (của org) | `/events` | GET |
| Xem chi tiết sự kiện | `/events/:id` | GET |
| Tạo sự kiện mới | `/events` | POST |
| Cập nhật sự kiện (full) | `/events/:id` | PUT |
| Cập nhật sự kiện (partial) | `/events/:id` | PATCH |
| Công bố sự kiện | `/events/:id/publish` | POST |

### 3.2 Loại vé (Ticket Types)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem danh sách loại vé | `/events/:eventId/ticket-types` | GET |
| Xem chi tiết loại vé | `/ticket-types/:id` | GET |
| Tạo loại vé | `/events/:eventId/ticket-types` | POST |
| Cập nhật loại vé | `/ticket-types/:id` | PUT |
| Vô hiệu hóa loại vé | `/ticket-types/:id/disable` | PATCH |

### 3.3 Vé (Tickets)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem danh sách vé của sự kiện | `/events/:eventId/tickets` | GET |
| Xem chi tiết vé | `/tickets/:id` | GET |
| Thu hồi vé | `/tickets/:id/revoke` | POST |
| Tạo vé test (development) | `/events/:eventId/tickets/test` | POST |

### 3.4 Đơn hàng (Orders)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem đơn hàng của sự kiện/org | `/orders` | GET |
| Xem chi tiết đơn hàng | `/orders/:id` | GET |
| Cập nhật trạng thái đơn hàng | `/orders/:id/status` | PUT |

### 3.5 Check-in Analytics

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem thống kê theo giờ | `/checkin/events/:eventId/stats/hourly` | GET |
| Xem thống kê theo cổng | `/checkin/events/:eventId/stats/gates` | GET |
| Xem hiệu suất nhân viên | `/checkin/events/:eventId/stats/staff` | GET |
| Xem scan logs | `/checkin/events/:eventId/logs` | GET |
| Xuất báo cáo check-in | `/checkin/events/:eventId/export` | GET |

### 3.6 Hoàn tiền (Refunds)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem danh sách hoàn tiền của org | `/refunds` | GET |

---

## 4. ORGANIZER_ADMIN (Quản trị viên tổ chức)

> **Kế thừa:** Tất cả chức năng của EVENT_MANAGER

Role cao nhất trong một tổ chức. Có toàn quyền quản lý tổ chức, thành viên và tài chính.

### 4.1 Tổ chức (Organizations)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Tạo tổ chức mới | `/organizations` | POST |
| Xem danh sách tổ chức của mình | `/organizations/my` | GET |
| Xem chi tiết tổ chức | `/organizations/:id` | GET |
| Cập nhật tổ chức | `/organizations/:id` | PUT |
| Xóa tổ chức | `/organizations/:id` | DELETE |

### 4.2 Thành viên (Members)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem danh sách thành viên | `/organizations/:id/members` | GET |
| Thêm thành viên mới | `/organizations/:id/members` | POST |
| Cập nhật role thành viên | `/organizations/:id/members/:memberId` | PUT |
| Xóa thành viên | `/organizations/:id/members/:memberId` | DELETE |

### 4.3 Sự kiện (Events) - Bổ sung

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xóa sự kiện | `/events/:id` | DELETE |
| Hủy sự kiện (auto refund) | `/events/:id/cancel` | POST |
| Hoàn thành sự kiện | `/events/:id/complete` | POST |

### 4.4 Loại vé (Ticket Types) - Bổ sung

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xóa loại vé | `/ticket-types/:id` | DELETE |

### 4.5 Rút tiền (Payouts)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem số dư tổ chức | `/payouts/organizations/:id/balance` | GET |
| Xem danh sách payout của tổ chức | `/payouts/organizations/:id` | GET |
| Tạo yêu cầu rút tiền | `/payouts/organizations/:id/request` | POST |
| Xem chi tiết payout | `/payouts/:id` | GET |

---

## 5. PLATFORM_ADMIN (Quản trị viên hệ thống)

> **Toàn quyền:** Có thể thực hiện TẤT CẢ chức năng trên hệ thống

Role dành cho quản trị viên nền tảng. Có quyền quản lý toàn bộ hệ thống.

### 5.1 Tổ chức (Organizations)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem tất cả tổ chức | `/organizations` | GET |
| Bật/tắt payout cho tổ chức | `/organizations/:id/payout-status` | PATCH |

### 5.2 Danh mục (Categories)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem tất cả danh mục (bao gồm inactive) | `/categories/all` | GET |
| Tạo danh mục | `/categories` | POST |
| Cập nhật danh mục | `/categories/:id` | PUT |
| Xóa danh mục | `/categories/:id` | DELETE |
| Bật/tắt danh mục | `/categories/:id/toggle` | PATCH |

### 5.3 Người dùng (Users)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem danh sách người dùng | `/users` | GET |
| Xem chi tiết người dùng | `/users/:id` | GET |
| Cập nhật người dùng | `/users/:id` | PUT |

### 5.4 Rút tiền (Payouts)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem tất cả payout requests | `/payouts` | GET |
| Xử lý thanh toán payout | `/payouts/:id/process` | POST |

### 5.5 Hoàn tiền (Refunds)

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem tất cả refund requests | `/refunds` | GET |

### 5.6 Sự kiện & Đơn hàng

| Chức năng | Endpoint | Method |
|-----------|----------|--------|
| Xem tất cả sự kiện (mọi org) | `/events` | GET |
| Xem tất cả đơn hàng | `/orders` | GET |
| Cập nhật trạng thái đơn hàng bất kỳ | `/orders/:id/status` | PUT |

---

## Ghi chú quan trọng

### Scope của Organization

- **CHECKIN_STAFF**, **EVENT_MANAGER**, **ORGANIZER_ADMIN** chỉ có quyền thao tác trong phạm vi organization mà họ là thành viên.
- Mỗi user có thể là thành viên của nhiều organization với các role khác nhau.
- Role được xác định thông qua bảng `organization_members`.

### Platform Role vs Organization Role

- `platform_role` trong bảng `users` chỉ có 2 giá trị quan trọng: `PLATFORM_ADMIN` và `CUSTOMER`.
- Các role `ORGANIZER_ADMIN`, `EVENT_MANAGER`, `CHECKIN_STAFF` được gán thông qua `organization_members.role`.

### Guard System

Hệ thống sử dụng các guards để kiểm tra quyền:

1. **JwtAuthGuard**: Xác thực JWT token
2. **RolesGuard**: Kiểm tra role của user
3. **OrganizationGuard**: Kiểm tra user thuộc organization
4. **EventGuard**: Kiểm tra user có quyền truy cập event
5. **OrderGuard**: Kiểm tra user có quyền truy cập order

### Ownership Check

- CUSTOMER chỉ xem được đơn hàng và vé của chính mình.
- ORGANIZER_ADMIN/EVENT_MANAGER chỉ xem được dữ liệu của organization mình.
- PLATFORM_ADMIN xem được tất cả dữ liệu.

---

## Ví dụ sử dụng

### Customer mua vé

```http
POST /orders
Authorization: Bearer <token>
X-Organization-Id: <không cần>

{
  "event_id": "uuid",
  "items": [
    {
      "ticket_type_id": "uuid",
      "quantity": 2,
      "attendees": [...]
    }
  ]
}
```

### Event Manager tạo sự kiện

```http
POST /events
Authorization: Bearer <token>
X-Organization-Id: <organization_id>

{
  "title": "Concert ABC",
  "start_at": "2025-01-15T19:00:00+07:00",
  ...
}
```

### Platform Admin xử lý payout

```http
POST /payouts/:payoutId/process
Authorization: Bearer <token>
```
