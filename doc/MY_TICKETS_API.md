# Tài liệu API My Tickets

## Tổng quan

Module My Tickets cho phép khách hàng (CUSTOMER) xem danh sách vé đã mua và chi tiết từng vé bao gồm mã QR để check-in.

**Base URL:** `/my-tickets`  
**Authentication:** Bắt buộc (JWT Bearer Token)  
**Role:** CUSTOMER (bất kỳ user đã đăng nhập)

---

## 1. Lấy danh sách vé của tôi

### `GET /my-tickets`

Lấy tất cả vé của user đã đăng nhập (chỉ lấy vé từ orders đã thanh toán).

### Query Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `status` | string | Lọc theo trạng thái vé: `ACTIVE`, `REVOKED`, `REFUNDED` |
| `checkin_status` | string | Lọc theo trạng thái check-in: `NOT_CHECKED_IN`, `CHECKED_IN` |
| `event_id` | string (UUID) | Lọc theo sự kiện |

### Request

```http
GET /my-tickets?status=ACTIVE&checkin_status=NOT_CHECKED_IN
Authorization: Bearer <access_token>
```

### Response

```json
{
  "data": [
    {
      "id": "uuid-ticket-1",
      "ticket_serial": "VIP-000001",
      "qr_payload": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "attendee_name": "Nguyễn Văn A",
      "attendee_email": "nguyenvana@gmail.com",
      "attendee_phone": "0901234567",
      "status": "ACTIVE",
      "checkin_status": "NOT_CHECKED_IN",
      "checked_in_at": null,
      "scan_count": 0,
      "last_scan_at": null,
      "created_at": "2025-01-01T10:00:00.000Z",
      "event": {
        "id": "uuid-event",
        "title": "Concert ABC",
        "slug": "concert-abc-2025",
        "start_at": "2025-01-15T19:00:00.000Z",
        "end_at": "2025-01-15T23:00:00.000Z",
        "venue_name": "Nhà hát Hòa Bình",
        "address_line1": "240 Đường 3/2",
        "city": "Hồ Chí Minh",
        "cover_image_url": "https://example.com/cover.jpg"
      },
      "ticket_type": {
        "id": "uuid-ticket-type",
        "name": "VIP",
        "description": "Ghế VIP hàng đầu"
      },
      "order": {
        "id": "uuid-order",
        "order_number": "ORD-1704067200-ABC123"
      }
    }
  ],
  "total": 5
}
```

---

## 2. Xem chi tiết vé

### `GET /my-tickets/:id`

Lấy thông tin chi tiết một vé, bao gồm đầy đủ thông tin để hiển thị và QR code.

### Request

```http
GET /my-tickets/uuid-ticket-1
Authorization: Bearer <access_token>
```

### Response

```json
{
  "id": "uuid-ticket-1",
  "ticket_serial": "VIP-000001",
  "qr_payload": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "attendee_name": "Nguyễn Văn A",
  "attendee_email": "nguyenvana@gmail.com",
  "attendee_phone": "0901234567",
  "status": "ACTIVE",
  "checkin_status": "NOT_CHECKED_IN",
  "checked_in_at": null,
  "checked_in_gate": null,
  "scan_count": 0,
  "last_scan_at": null,
  "created_at": "2025-01-01T10:00:00.000Z",
  "event": {
    "id": "uuid-event",
    "title": "Concert ABC",
    "slug": "concert-abc-2025",
    "start_at": "2025-01-15T19:00:00.000Z",
    "end_at": "2025-01-15T23:00:00.000Z",
    "timezone": "Asia/Ho_Chi_Minh",
    "venue_name": "Nhà hát Hòa Bình",
    "address_line1": "240 Đường 3/2",
    "address_line2": null,
    "city": "Hồ Chí Minh",
    "country": "Vietnam",
    "postal_code": "700000",
    "geo_lat": 10.7769,
    "geo_lng": 106.6992,
    "cover_image_url": "https://example.com/cover.jpg",
    "contact_email": "contact@event.com",
    "contact_phone": "0901234567",
    "website_url": "https://event.com",
    "refund_policy": "Hoàn tiền 100% trước 7 ngày",
    "organization": {
      "id": "uuid-org",
      "name": "ABC Entertainment",
      "logo_url": "https://example.com/logo.jpg",
      "contact_email": "org@abc.com",
      "contact_phone": "0281234567"
    }
  },
  "ticket_type": {
    "id": "uuid-ticket-type",
    "name": "VIP",
    "description": "Ghế VIP hàng đầu",
    "price": 500000,
    "currency": "VND"
  },
  "order": {
    "id": "uuid-order",
    "order_number": "ORD-1704067200-ABC123",
    "total_amount": 500000,
    "payment_status": "PAID",
    "paid_at": "2025-01-01T10:05:00.000Z"
  }
}
```

---

## 3. Tra cứu vé theo QR Payload

### `GET /my-tickets/qr/:qrPayload`

Lấy thông tin vé theo mã QR (dùng cho trường hợp customer muốn tra cứu).

### Request

```http
GET /my-tickets/qr/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer <access_token>
```

### Response

Trả về cấu trúc giống như API chi tiết vé ở trên.

---

## Trạng thái vé

### Ticket Status

| Giá trị | Mô tả |
|---------|-------|
| `ACTIVE` | Vé còn hiệu lực, có thể check-in |
| `REVOKED` | Vé đã bị thu hồi |
| `REFUNDED` | Vé đã được hoàn tiền |

### Check-in Status

| Giá trị | Mô tả |
|---------|-------|
| `NOT_CHECKED_IN` | Chưa check-in |
| `CHECKED_IN` | Đã check-in |

---

## Hướng dẫn tích hợp Frontend

### 1. Trang danh sách vé

```jsx
// Gọi API lấy danh sách vé
const fetchMyTickets = async () => {
  const response = await fetch('/my-tickets', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();
  return data;
};
```

### 2. Hiển thị QR Code

Sử dụng thư viện QR code (ví dụ: `qrcode.react`) để tạo QR từ `qr_payload`:

```jsx
import QRCode from 'qrcode.react';

// Trong component
<QRCode 
  value={ticket.qr_payload} 
  size={256}
  level="H" // High error correction
/>
```

### 3. Màn hình chi tiết vé

Hiển thị đầy đủ thông tin:
- Thông tin sự kiện (tên, thời gian, địa điểm)
- Thông tin vé (loại vé, giá, trạng thái)
- Thông tin người tham dự
- Mã QR (to, dễ quét)
- Trạng thái check-in

### 4. Filter vé

```jsx
// Lọc chỉ lấy vé sắp tới (chưa check-in)
const upcomingTickets = tickets.filter(
  t => t.checkin_status === 'NOT_CHECKED_IN' && t.status === 'ACTIVE'
);

// Lọc vé đã sử dụng
const usedTickets = tickets.filter(
  t => t.checkin_status === 'CHECKED_IN'
);
```

---

## Error Responses

| HTTP Code | Mô tả |
|-----------|-------|
| 401 | Unauthorized - Token không hợp lệ hoặc hết hạn |
| 403 | Forbidden - Không có quyền xem vé này (vé không thuộc user) |
| 404 | Not Found - Không tìm thấy vé |

### Ví dụ lỗi 403

```json
{
  "statusCode": 403,
  "message": "Bạn không có quyền truy cập vé này",
  "error": "Forbidden"
}
```

---

## Gợi ý UI/UX

1. **Sắp xếp vé** theo thời gian sự kiện (sắp diễn ra lên đầu)
2. **Badge trạng thái** cho vé đã check-in hoặc đã hủy
3. **QR code lớn** và dễ quét khi mở chi tiết vé
4. **Thông tin địa điểm** có link Google Maps
5. **Countdown** đến thời gian sự kiện
6. **Lưu vé offline** để có thể hiển thị khi mất mạng
