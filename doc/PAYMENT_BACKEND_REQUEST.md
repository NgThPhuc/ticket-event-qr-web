# 💳 Payment Gateway Integration - Backend API Requirements

**Ngày tạo:** 2025-12-08  
**Frontend Team** → **Backend Team**

---

## 📋 Tổng quan

Frontend đã hoàn thành UI/UX cho payment flow. Cần backend team implement/fix các API sau để hoàn thiện tính năng thanh toán qua VNPAY.

---

## 🔴 Issues hiện tại cần fix

### 1. API Initiate Payment - Validation quá strict

**Endpoint:** `POST /orders/:orderId/payment/initiate`

**Vấn đề:**
- Backend đang validate `return_url` và `cancel_url` quá strict
- Frontend nhận lỗi: `"Return URL không hợp lệ", "Cancel URL không hợp lệ"`
- Status: 400 Bad Request

**Request hiện tại từ Frontend:**
```json
{
  "payment_method": "VNPAY",
  "return_url": "http://localhost:5173/payment/return?order_id=xxx",
  "cancel_url": "http://localhost:5173/payment/return?order_id=xxx"
}
```

**Yêu cầu:**
1. ✅ Cho phép `localhost` URLs (development environment)
2. ✅ `cancel_url` có thể giống `return_url` hoặc optional
3. ✅ Validate URL format nhưng không quá strict về domain
4. ✅ Support cả HTTP (dev) và HTTPS (production)

**Validation rules đề xuất:**
```javascript
// Valid URLs (examples)
- http://localhost:5173/payment/return?order_id=xxx ✅
- http://localhost:3000/payment/return?order_id=xxx ✅
- https://yourdomain.com/payment/return?order_id=xxx ✅

// Invalid URLs
- /payment/return (relative path) ❌
- javascript:alert(1) (XSS) ❌
- ftp://example.com (wrong protocol) ❌
```

---

## 📝 API Specifications

### 1. Initiate Payment (Khởi tạo thanh toán)

**Endpoint:** `POST /orders/:orderId/payment/initiate`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "payment_method": "VNPAY",
  "return_url": "string (required)",
  "cancel_url": "string (optional, default = return_url)"
}
```

**Validation Rules:**
- `payment_method`: Required, enum ["VNPAY"]
- `return_url`: Required, valid HTTP/HTTPS URL
- `cancel_url`: Optional, valid HTTP/HTTPS URL, default = return_url nếu không có

**Response Success (200 OK):**
```json
{
  "payment_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_...",
  "transaction_id": "TXN-xxx",
  "order_id": "xxx",
  "amount": 1500000,
  "currency": "VND",
  "expires_at": "2025-12-08T10:00:00.000Z"
}
```

**Response Error (400 Bad Request):**
```json
{
  "message": ["Return URL không hợp lệ"],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Business Logic:**
1. ✅ Validate order tồn tại và thuộc về user
2. ✅ Validate order status = PENDING và payment_status = UNPAID
3. ✅ Không cho phép tạo payment nếu order đã paid
4. ✅ Tạo transaction record với status PENDING
5. ✅ Generate VNPAY payment URL với các params cần thiết
6. ✅ Return payment URL cho frontend redirect

---

### 2. Check Payment Status (Kiểm tra trạng thái thanh toán)

**Endpoint:** `GET /orders/:orderId/payment/status`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Query Parameters:** None

**Response Success (200 OK):**
```json
{
  "order_id": "xxx",
  "payment_status": "PAID", // UNPAID | PENDING | PAID | FAILED | REFUNDED
  "transaction_id": "TXN-xxx",
  "amount": 1500000,
  "currency": "VND",
  "payment_method": "VNPAY",
  "paid_at": "2025-12-08T09:30:00.000Z",
  "gateway_response": {
    "vnp_TxnRef": "xxx",
    "vnp_TransactionNo": "xxx",
    "vnp_ResponseCode": "00"
  }
}
```

**Business Logic:**
1. ✅ Validate order thuộc về user đang request
2. ✅ Return latest payment status từ database
3. ✅ Nếu có transaction, return full transaction info
4. ✅ Support polling (frontend sẽ gọi mỗi 2 giây)

---

### 3. VNPAY IPN Callback (Backend xử lý webhook)

**Endpoint:** `GET /payment/vnpay/ipn`

**Query Parameters:** (Từ VNPAY)
```
vnp_Amount=150000000
vnp_BankCode=NCB
vnp_ResponseCode=00
vnp_TxnRef=ORDER-xxx
vnp_SecureHash=xxx
... (các params khác từ VNPAY)
```

**Response Success (200 OK):**
```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

**Business Logic:**
1. ✅ Validate secure hash từ VNPAY
2. ✅ Parse vnp_TxnRef để lấy order_id
3. ✅ Update order payment_status:
   - `vnp_ResponseCode = "00"` → PAID
   - Khác → FAILED
4. ✅ Update transaction status
5. ✅ **Generate tickets** nếu payment success
6. ✅ Send email confirmation (optional)
7. ✅ Return response theo format VNPAY yêu cầu

**⚠️ Quan trọng:**
- IPN callback có thể đến TRƯỚC khi user redirect về return_url
- Phải handle idempotent (không tạo duplicate tickets nếu IPN gọi nhiều lần)
- Timeout: VNPAY đợi max 30 giây

---

## 🎫 Ticket Generation

**Trigger:** Khi payment_status chuyển sang PAID

**Logic:**
1. ✅ Lấy order với order_items (ticket types)
2. ✅ Foreach order_item:
   - Tạo `quantity` tickets
   - Mỗi ticket có unique QR code
   - Status = VALID
3. ✅ Update order status → CONFIRMED
4. ✅ Giảm `quantity_available` của ticket types

**Ticket Model (Example):**
```javascript
{
  id: "uuid",
  order_id: "uuid",
  ticket_type_id: "uuid",
  attendee_name: "Nguyen Van A",
  attendee_email: "a@example.com",
  attendee_phone: "0123456789",
  qr_code: "TICKET-xxx", // Unique code
  status: "VALID", // VALID | USED | CANCELLED
  checked_in_at: null,
  created_at: "ISO datetime"
}
```

---

## 🔄 Payment Flow (Tổng quan)

```
1. Frontend: User click "Pay Now"
   ↓
2. Frontend → Backend: POST /orders/:id/payment/initiate
   ↓
3. Backend: Tạo transaction + Generate VNPAY URL
   ↓
4. Backend → Frontend: Return payment_url
   ↓
5. Frontend: Redirect user to VNPAY
   ↓
6. User: Thanh toán trên VNPAY
   ↓
7. VNPAY → Backend: GET /payment/vnpay/ipn (callback)
   ↓
8. Backend: Validate + Update order + Generate tickets
   ↓
9. VNPAY → Frontend: Redirect to return_url
   ↓
10. Frontend: Poll GET /orders/:id/payment/status
   ↓
11. Backend: Return payment_status = PAID
   ↓
12. Frontend: Redirect to /orders/:id (show tickets)
```

---

## 🧪 Testing

### Test Cases cần support:

**1. Success Flow:**
- Order PENDING + UNPAID → Initiate payment → VNPAY success → Order PAID + Tickets generated

**2. Failed Payment:**
- VNPAY return error code → Order vẫn UNPAID → User có thể retry

**3. Timeout:**
- User không complete payment trong 15 phút → Transaction expired

**4. Duplicate IPN:**
- VNPAY gọi IPN nhiều lần → Chỉ generate tickets 1 lần

**5. Race Condition:**
- IPN callback và frontend polling đồng thời → Data consistent

### VNPAY Sandbox Test Cards:

```
Success: 9704198526191432198
Failed:  9704198526191432199
```

---

## 📊 Database Schema Requirements

### Transaction Table:
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  transaction_type VARCHAR(50) NOT NULL, -- PAYMENT, REFUND
  payment_method VARCHAR(50) NOT NULL, -- VNPAY
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  status VARCHAR(50) NOT NULL, -- PENDING, SUCCESS, FAILED, CANCELLED
  gateway_transaction_id VARCHAR(255), -- vnp_TransactionNo
  gateway_response JSONB, -- Full response từ VNPAY
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tickets Table:
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  ticket_type_id UUID REFERENCES ticket_types(id),
  attendee_name VARCHAR(255) NOT NULL,
  attendee_email VARCHAR(255) NOT NULL,
  attendee_phone VARCHAR(50),
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'VALID', -- VALID, USED, CANCELLED
  checked_in_at TIMESTAMP,
  checked_in_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX idx_tickets_order_id ON tickets(order_id);
```

---

## 🔐 Security Requirements

1. ✅ **Validate VNPAY Signature:**
   - Mọi request từ VNPAY phải validate `vnp_SecureHash`
   - Sử dụng secret key từ VNPAY

2. ✅ **Validate Order Ownership:**
   - User chỉ có thể initiate payment cho order của mình

3. ✅ **Idempotency:**
   - IPN callback có thể gọi nhiều lần → không tạo duplicate

4. ✅ **Transaction Locking:**
   - Khi generate tickets, lock order để tránh race condition

5. ✅ **URL Validation:**
   - Validate return_url và cancel_url format
   - Prevent open redirect

---

## 📞 Support & Questions

**Frontend Team Contact:**
- Email: frontend@example.com
- Slack: #frontend-team

**VNPAY Docs:**
- Sandbox: https://sandbox.vnpayment.vn/apis/docs/
- Support: support@vnpay.vn | 1900 55 55 77

**Priority:** 🔴 HIGH
**Deadline:** ASAP

---

## ✅ Checklist cho Backend Team

### Must Have (Required):
- [ ] Fix validation của return_url và cancel_url
- [ ] Implement ticket generation logic khi payment success
- [ ] Handle VNPAY IPN callback
- [ ] Validate VNPAY signature
- [ ] Update order status sau khi payment
- [ ] Prevent duplicate ticket generation

### Nice to Have (Optional):
- [ ] Email notification sau khi payment success
- [ ] Cronjob check expired transactions
- [ ] Refund API (future)
- [ ] Payment analytics/reporting

---

**Cảm ơn Backend Team! 🙏**

Frontend đã sẵn sàng integrate ngay khi APIs được fix/implement.

