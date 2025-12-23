# Frontend Guide: Order Expiration (15 phút)

## Tổng quan

Order sẽ **tự động bị hủy sau 15 phút** nếu chưa thanh toán. Frontend cần hiển thị countdown timer để người dùng biết thời gian còn lại.

---

## 1. API Tạo Order

### Request

```http
POST /orders
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Body (Buyer-centric mode):
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "buyer": {
    "name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "phone": "0901234567"
  },
  "items": [
    {
      "ticket_type_id": "660e8400-e29b-41d4-a716-446655440001",
      "quantity": 5
    }
  ]
}
```

#### Body (Per-attendee mode):
```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "items": [
    {
      "ticket_type_id": "660e8400-e29b-41d4-a716-446655440001",
      "quantity": 2,
      "attendees": [
        { "name": "Nguyen Van A", "email": "a@example.com" },
        { "name": "Tran Thi B", "email": "b@example.com" }
      ]
    }
  ]
}
```

### Response (201 Created)

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "order_number": "ORD-1734798000000-ABC123",
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 5,
  "total_amount": 500000,
  "status": "PENDING",
  "payment_status": "UNPAID",
  "buyer_name": "Nguyen Van A",
  "buyer_email": "nguyenvana@example.com",
  "buyer_phone": "0901234567",
  "expires_at": "2025-12-21T22:54:00.000Z",
  "event": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Tech Conference 2025",
    "slug": "tech-conference-2025"
  },
  "items": [...],
  "created_at": "2025-12-21T22:39:00.000Z"
}
```

### Response Fields quan trọng:

| Field | Type | Mô tả |
|-------|------|-------|
| `expires_at` | `string (ISO 8601)` | Thời điểm order hết hạn |
| `status` | `string` | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` |
| `payment_status` | `string` | `UNPAID`, `PAID`, `FAILED`, `REFUNDED` |

---

## 2. API Xem Chi tiết Order

```http
GET /orders/{orderId}
Authorization: Bearer <access_token>
```

### Response (200 OK)

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "order_number": "ORD-1734798000000-ABC123",
  "status": "PENDING",
  "payment_status": "UNPAID",
  "expires_at": "2025-12-21T22:54:00.000Z",
  ...
}
```

---

## 3. API Initiate Payment

```http
POST /orders/{orderId}/payment/initiate
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body:
```json
{
  "payment_method": "PAYOS",
  "return_url": "https://yoursite.com/payment/success",
  "cancel_url": "https://yoursite.com/checkout"
}
```

### Response:
```json
{
  "payment_url": "https://pay.payos.vn/web/...",
  "order_id": "770e8400-e29b-41d4-a716-446655440002",
  "transaction_id": "TXN-123456"
}
```

---

## 4. Frontend Implementation

### 4.1 Lưu `expires_at` khi tạo order

```javascript
const createOrder = async (orderData) => {
  const response = await fetch(`/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  
  const order = await response.json();
  
  // Lưu expires_at để hiển thị countdown
  sessionStorage.setItem('orderExpiresAt', order.expires_at);
  sessionStorage.setItem('orderId', order.id);
  
  return order;
};
```

### 4.2 Component Countdown Timer

```jsx
import { useState, useEffect } from 'react';

const OrderCountdown = ({ expiresAt, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = Math.floor((expiry - now) / 1000);
      return diff > 0 ? diff : 0;
    };
    
    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        onExpired?.();
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <div className={`countdown ${timeLeft < 60 ? 'warning' : ''}`}>
      <span>⏰ Đơn hàng hết hạn sau: </span>
      <strong>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </strong>
    </div>
  );
};
```

### 4.3 Xử lý khi Order hết hạn

```jsx
const CheckoutPage = () => {
  const navigate = useNavigate();
  const expiresAt = sessionStorage.getItem('orderExpiresAt');
  
  const handleExpired = () => {
    // Xóa session data
    sessionStorage.removeItem('orderExpiresAt');
    sessionStorage.removeItem('orderId');
    
    // Hiển thị thông báo
    alert('Đơn hàng đã hết hạn. Vui lòng đặt lại.');
    
    // Redirect về trang event
    navigate(`/events/${eventId}`);
  };
  
  return (
    <div>
      <OrderCountdown 
        expiresAt={expiresAt} 
        onExpired={handleExpired}
      />
      
      {/* Form thanh toán */}
      <PaymentForm />
    </div>
  );
};
```

### 4.4 CSS cho Countdown

```css
.countdown {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.countdown strong {
  font-size: 18px;
  font-family: monospace;
  color: #0284c7;
}

.countdown.warning {
  background: #fef2f2;
  border-color: #ef4444;
}

.countdown.warning strong {
  color: #dc2626;
  animation: blink 1s infinite;
}

@keyframes blink {
  50% { opacity: 0.5; }
}
```

---

## 5. Error Handling

### Khi tạo order thất bại:
```javascript
try {
  const order = await createOrder(data);
} catch (error) {
  if (error.status === 400) {
    // Validation error
    alert(error.message);
  } else if (error.status === 404) {
    // Event hoặc ticket type không tồn tại
    navigate('/events');
  }
}
```

### Khi order đã expired:
API sẽ trả về lỗi nếu cố thanh toán order đã hết hạn:
```json
{
  "statusCode": 400,
  "message": "Đơn hàng đã bị hủy",
  "error": "Bad Request"
}
```

---

## 6. Checklist Implementation

- [ ] Lưu `expires_at` khi tạo order thành công
- [ ] Hiển thị countdown timer trên trang checkout
- [ ] Đổi màu warning khi còn dưới 1 phút
- [ ] Redirect về event page khi hết hạn
- [ ] Hiển thị thông báo khi order expired
- [ ] Clear session data khi thanh toán thành công hoặc hết hạn

---

## 7. Lưu ý

1. **Thời gian hết hạn là 15 phút** tính từ lúc tạo order
2. Backend sử dụng **UTC timezone** cho `expires_at`
3. Nếu user refresh trang, lấy `expires_at` từ `GET /orders/:id`
4. Order đã hết hạn có `status: "CANCELLED"`
