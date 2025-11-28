# TÀI LIỆU API ORDERS (ĐẶT VÉ) - CHO FRONTEND

## 📋 TỔNG QUAN

Module Orders quản lý quy trình đặt vé. Đây là bước tiếp theo sau khi user chọn loại vé (Ticket Types).

**Base URL:** `http://localhost:3000`

**Authentication:**
- Đặt vé (Create Order): Yêu cầu login (`Bearer {token}`)
- Xem danh sách/chi tiết: Yêu cầu login
- Tracking Order: **Public** (Không cần login, dùng Order Number)

---

## 📡 API ENDPOINTS

### 1. Tạo Đơn Hàng (Booking)

**Endpoint:** `POST /orders`

**Quyền:** User đã đăng nhập (`CUSTOMER`)

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "event_id": "uuid-cua-event", // Required
  "payment_method": "VNPAY", // "VNPAY" | "MOMO" | "ZALOPAY" (Hiện tại ưu tiên VNPAY)
  "items": [
    {
      "ticket_type_id": "uuid-loai-ve-1",
      "quantity": 2,
      "attendees": [
        {
          "name": "Nguyễn Văn A",
          "email": "nguyenvana@example.com",
          "phone": "0987654321" // Optional
        },
        {
          "name": "Trần Thị B",
          "email": "tranthib@example.com"
        }
      ],
      "donation_amount": 50000 // Optional, chỉ dùng cho vé Donation (tính trên mỗi vé)
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-order",
  "order_number": "ORD-1706150000-ABC123456",
  "event_id": "uuid-event",
  "user_id": "uuid-user",
  "total_amount": 1000000,
  "quantity": 2,
  "status": "PENDING",
  "payment_status": "UNPAID",
  "payment_method": "VNPAY",
  "created_at": "2024-01-25T10:00:00.000Z",
  "items": [
    {
      "ticket_type_id": "uuid-loai-ve-1",
      "quantity": 2,
      "ticket_type": {
        "id": "uuid-loai-ve-1",
        "name": "VIP Ticket",
        "price": "500000"
      }
    }
  ]
}
```

**Lưu ý Frontend:**
1.  Sau khi tạo order thành công, lấy `id` hoặc `order_number`.
2.  Gọi tiếp API thanh toán (sẽ cung cấp sau) hoặc redirect sang trang thanh toán.
3.  **Validation rules bắt buộc:**
    -   `items.length > 0` - Phải có ít nhất 1 loại vé
    -   `attendees.length === quantity` - Số người tham dự phải bằng số lượng vé
    -   Nếu vé là **Donation** (`is_donation = true`): `donation_amount` là **BẮT BUỘC** và phải `> 0`
    -   Nếu vé là **Free** (`is_free = true`): Không cần `donation_amount`
    -   Nếu vé là **Paid** (không free, không donation): Backend tự tính giá

**Lưu ý đặc biệt về Vé Quyên Góp (Donation):**
-   `donation_amount` tính **trên mỗi vé**, KHÔNG phải tổng.
-   Ví dụ: `quantity = 2, donation_amount = 50000` → Tổng tiền = 100,000 VND
-   Frontend nên có placeholder/label rõ ràng: "Số tiền quyên góp cho mỗi vé"
-   Backend sẽ validate và reject nếu `donation_amount` không được cung cấp hoặc ≤ 0

**Error Responses có thể gặp:**
-   `400`: "Vé quyên góp '{name}' yêu cầu nhập số tiền quyên góp (lớn hơn 0)"
-   `400`: "Số lượng người tham dự phải bằng số lượng vé"
-   `400`: "Loại vé '{name}' chỉ còn {X} vé, không đủ cho {Y} vé yêu cầu"
-   `400`: "Loại vé '{name}' chưa bắt đầu bán" / "đã kết thúc bán"
-   `400`: "Loại vé '{name}' yêu cầu tối thiểu {min} vé mỗi đơn"
-   `400`: "Loại vé '{name}' chỉ cho phép tối đa {max} vé mỗi đơn"

---

### 2. Xem Danh Sách Đơn Hàng Của Tôi

**Endpoint:** `GET /orders`

**Quyền:** User đã đăng nhập

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số lượng/trang (default: 20)
- `status`: Filter theo status (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`)
- `payment_status`: Filter theo payment (`UNPAID`, `PAID`, `REFUNDED`)
- `event_id`: Filter theo event specific

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "order_number": "ORD-...",
      "total_amount": 500000,
      "status": "CONFIRMED",
      "payment_status": "PAID",
      "created_at": "...",
      "event": {
        "id": "uuid",
        "title": "Tech Summit 2024",
        "slug": "tech-summit-2024"
      },
      "tickets_count": 2
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 3. Xem Chi Tiết Đơn Hàng

**Endpoint:** `GET /orders/:id`

**Quyền:** User đã đăng nhập (chỉ xem được đơn của mình)

**Response (200 OK):**
```json
{
  "id": "uuid",
  "order_number": "ORD-...",
  "total_amount": 500000,
  "status": "CONFIRMED",
  "payment_status": "PAID",
  "event": {
    "title": "Tech Summit 2024",
    "venue_name": "Convention Center",
    "address_line1": "123 Street",
    "city": "Hanoi"
  },
  "tickets": [
    {
      "id": "uuid",
      "ticket_serial": "VIP-000001",
      "qr_payload": "uuid-for-qr", // Dùng để generate QR code
      "attendee_name": "Nguyen Van A",
      "ticket_type": {
        "name": "VIP"
      },
      "checkin_status": "NOT_CHECKED_IN"
    }
  ]
}
```

---

### 4. Tracking Đơn Hàng (Public)

**Endpoint:** `GET /orders/order-number/:orderNumber`

**Quyền:** Public (Không cần login)

**Use Case:** Trang "Tra cứu đơn hàng" cho khách vãng lai hoặc kiểm tra nhanh.

**Response:** Tương tự như "Xem Chi Tiết Đơn Hàng" nhưng có thể ít thông tin nhạy cảm hơn (tùy implementation).

---

### 5. Hủy Đơn Hàng

**Endpoint:** `POST /orders/:id/cancel`

**Quyền:** User đã đăng nhập (chỉ hủy được đơn của mình và chưa thanh toán)

**Response (200 OK):** Trả về thông tin order đã hủy.


---

## 💻 CODE EXAMPLES (React/Axios)

### Service Layer

```typescript
// services/orderService.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const orderService = {
  // Tạo đơn hàng
  createOrder: async (data: any, token: string) => {
    const res = await axios.post(`${API_URL}/orders`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Lấy danh sách đơn hàng
  getMyOrders: async (params: any, token: string) => {
    const res = await axios.get(`${API_URL}/orders`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Lấy chi tiết
  getOrderById: async (id: string, token: string) => {
    const res = await axios.get(`${API_URL}/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  // Tracking public
  trackOrder: async (orderNumber: string) => {
    const res = await axios.get(`${API_URL}/orders/order-number/${orderNumber}`);
    return res.data;
  },

  // Hủy đơn hàng
  cancelOrder: async (id: string, token: string) => {
    const res = await axios.post(`${API_URL}/orders/${id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  }
};
```

### Flow Đặt Vé (Frontend Logic)

1.  **Bước 1: Chọn vé** (Tại trang Event Details)
    -   User chọn số lượng cho từng loại vé.
    -   Nhấn "Đặt vé ngay".

2.  **Bước 2: Điền thông tin người tham dự** (Trang Checkout)
    -   Hiển thị form nhập tên/email cho từng vé.
    -   **Nếu có vé Donation:** Hiển thị input để nhập số tiền quyên góp (per ticket).
    -   Hiển thị tổng tiền tạm tính (bao gồm cả donation nếu có).

3.  **Bước 3: Xác nhận & Thanh toán**
    -   Gọi API `createOrder`.
    -   Nếu thành công -> Nhận `order_id`.
    -   Chuyển sang bước thanh toán (Payment).

4.  **Bước 4: Kết quả**
    -   Sau khi thanh toán, redirect về trang "My Tickets" hoặc "Order Success".
