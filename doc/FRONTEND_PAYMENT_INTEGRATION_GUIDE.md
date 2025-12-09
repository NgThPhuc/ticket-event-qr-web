# 🚀 Frontend Payment Integration Guide - Complete Documentation

**Ngày tạo:** 2025-12-08  
**Version:** 2.0  
**Backend Team Response to Frontend Requirements**

---

## 📌 Tổng Quan

Đây là document **đầy đủ** trả lời tất cả requirements từ Frontend Team. Mọi API đã được test và sẵn sàng để integrate.

---

## ✅ Checklist - APIs Available

- ✅ **POST** `/orders/:orderId/payment/initiate` - Tạo payment URL
- ✅ **GET** `/orders/:orderId/payment/status` - Check payment status
- ✅ **GET** `/orders/:orderId` - Get order details với tickets
- ✅ **POST** `/payment/callback/vnpay` - VNPAY IPN callback (auto)
- ✅ **GET** `/orders` - List user orders
- ✅ **POST** `/orders/:orderId/cancel` - Cancel unpaid order

---

## 🔴 Priority 1: Critical APIs

### 1. Initiate Payment API

#### **Endpoint**
```
POST /orders/:orderId/payment/initiate
```

#### **Authentication**
✅ **Required** - JWT Bearer Token

#### **Request Headers**
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### **Request Body**
```typescript
{
  "payment_method": "VNPAY",     // Required, enum: VNPAY | MOMO | ZALOPAY
  "return_url": string,          // Required, URL format
  "cancel_url": string           // Optional, URL format
}
```

#### **Validation Rules - QUAN TRỌNG! 🔥**

**1. URL Format:**
```javascript
// ✅ URLs hợp lệ (Development):
"http://localhost:5173/payment/return"
"http://localhost:5173/payment/return?order_id=xxx"
"http://127.0.0.1:5173/payment/success"

// ✅ URLs hợp lệ (Production):
"https://yourdomain.com/payment/return"
"https://yourdomain.com/payment/success?order_id=xxx"

// ❌ URLs KHÔNG hợp lệ:
"http://192.168.1.100:5173/..."  // IP local không được
"payment/return"                  // Relative URL không được
"ftp://domain.com/..."           // Chỉ accept http/https
```

**2. Domain Whitelist:**
Backend validate `return_url` domain phải nằm trong biến môi trường `FRONTEND_URL`:

```bash
# .env file
FRONTEND_URL="http://localhost:5173,http://localhost:3000,https://yourdomain.com"
```

**Lưu ý:** Nếu bạn gặp lỗi `"Return URL không hợp lệ"`, kiểm tra:
1. URL phải có protocol (`http://` hoặc `https://`)
2. Domain phải nằm trong `FRONTEND_URL` whitelist
3. Có thể có query params

**3. Cancel URL:**
- `cancel_url` là **OPTIONAL**
- Nếu không gửi: User cancel sẽ redirect về `return_url`
- Nếu gửi null: Phải gửi URL hợp lệ hoặc bỏ field

```javascript
// ✅ Hợp lệ:
{ "return_url": "...", "cancel_url": "..." }
{ "return_url": "..." }  // Không có cancel_url

// ❌ Không hợp lệ:
{ "return_url": "...", "cancel_url": null }
{ "return_url": "...", "cancel_url": "" }
```

#### **Response Success (200 OK)**
```json
{
  "payment_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...",
  "transaction_id": "uuid-here",
  "order_id": "order-uuid",
  "amount": 500000,
  "currency": "VND",
  "payment_method": "VNPAY",
  "expires_at": "2025-12-08T10:15:00.000Z"  // 15 phút từ khi tạo
}
```

#### **Usage Flow**
```javascript
// 1. Call API
const response = await initiatePayment(orderId, {
  payment_method: "VNPAY",
  return_url: `${window.location.origin}/payment/return`,
  cancel_url: `${window.location.origin}/payment/cancel`
});

// 2. Redirect user
window.location.href = response.payment_url;

// 3. User sẽ vào VNPAY, thanh toán, và redirect về return_url
```

#### **Response Errors**

| Status Code | Message | Giải thích | Frontend Action |
|-------------|---------|------------|-----------------|
| `400` | "Đơn hàng đã được thanh toán" | Order đã PAID rồi | Redirect về order detail |
| `400` | "Đơn hàng đã bị hủy" | Order CANCELLED | Show error message |
| `400` | "Invalid return_url domain..." | URL không trong whitelist | Fix URL format |
| `401` | "Unauthorized" | JWT không hợp lệ | Re-authenticate |
| `403` | "Bạn không có quyền..." | Không phải owner | Show error |
| `404` | "Không tìm thấy đơn hàng" | Order không tồn tại | Redirect home |

#### **Example cURL**
```bash
curl -X POST "http://localhost:3000/orders/ORDER_UUID/payment/initiate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "VNPAY",
    "return_url": "http://localhost:5173/payment/return",
    "cancel_url": "http://localhost:5173/payment/cancel"
  }'
```

---

### 2. Check Payment Status API

#### **Endpoint**
```
GET /orders/:orderId/payment/status
```

#### **Authentication**
✅ **Required** - JWT Bearer Token (must be order owner)

#### **Request Headers**
```http
Authorization: Bearer {jwt_token}
```

#### **Response Success (200 OK)**
```json
{
  "order_id": "order-uuid",
  "payment_status": "PAID",           // UNPAID | PAID | FAILED | REFUNDED
  "transaction_id": "transaction-uuid",
  "payment_method": "VNPAY",
  "paid_at": "2025-12-08T10:05:30.897Z",  // ISO datetime, null nếu UNPAID
  "amount": 500000,
  "gateway_response": {
    "transaction_no": "14509586",     // VNPAY transaction number
    "bank_code": "NCB",               // Bank code user dùng
    "card_type": "ATM"                // ATM | QRCODE
  }
}
```

#### **Payment Status Values**
```typescript
type PaymentStatus = 
  | "UNPAID"     // Chưa thanh toán
  | "PAID"       // Đã thanh toán thành công
  | "FAILED"     // Thanh toán thất bại
  | "REFUNDED";  // Đã hoàn tiền
```

#### **Polling Strategy - QUAN TRỌNG! ⏱️**

**Recommended:**
```javascript
// Polling every 3 seconds
const MAX_POLLS = 20;  // 20 * 3s = 60 seconds max
let pollCount = 0;

const pollPaymentStatus = async () => {
  const status = await checkPaymentStatus(orderId);
  
  if (status.payment_status === 'PAID') {
    // ✅ Success! Redirect to order detail
    router.push(`/orders/${orderId}`);
    return;
  }
  
  if (status.payment_status === 'FAILED') {
    // ❌ Failed! Show error
    showError('Thanh toán thất bại');
    return;
  }
  
  // Still UNPAID, continue polling
  pollCount++;
  if (pollCount < MAX_POLLS) {
    setTimeout(pollPaymentStatus, 3000);  // Poll sau 3 giây
  } else {
    // Timeout - Show pending message
    showPendingMessage();
  }
};
```

**Rate Limit:**
- ✅ Không có rate limit hiện tại
- ✅ Poll mỗi 2-3 giây là an toàn
- ✅ Stop poll sau 60 giây (20 lần)

#### **Response Errors**

| Status Code | Message | Frontend Action |
|-------------|---------|-----------------|
| `401` | "Unauthorized" | Re-authenticate |
| `403` | "Không có quyền..." | Show error |
| `404` | "Không tìm thấy đơn hàng" | Redirect home |

---

### 3. Get Order Detail (với Tickets)

#### **Endpoint**
```
GET /orders/:orderId
```

#### **Authentication**
✅ **Required** - JWT Bearer Token (must be order owner)

#### **Request Headers**
```http
Authorization: Bearer {jwt_token}
```

#### **Response Success (200 OK)**
```json
{
  "id": "order-uuid",
  "order_number": "ORD-1733389658000-ABC123",
  "event": {
    "id": "event-uuid",
    "title": "Concert ABC",
    "slug": "concert-abc",
    "start_at": "2025-12-25T10:00:00.000Z",
    "end_at": "2025-12-25T18:00:00.000Z",
    "venue_name": "Nhà Hát Lớn",
    "address_line1": "1 Tràng Tiền",
    "city": "Hà Nội"
  },
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "full_name": "Nguyen Van A"
  },
  "quantity": 2,
  "total_amount": 500000,
  "status": "CONFIRMED",           // PENDING | CONFIRMED | CANCELLED | COMPLETED
  "payment_status": "PAID",         // UNPAID | PAID | FAILED | REFUNDED
  "payment_method": "VNPAY",
  "paid_at": "2025-12-08T10:05:30.897Z",
  "created_at": "2025-12-08T10:00:00.000Z",
  "updated_at": "2025-12-08T10:05:30.897Z",
  "tickets": [
    {
      "id": "ticket-uuid-1",
      "ticket_serial": "VIP-000001",
      "qr_payload": "550e8400-e29b-41d4-a716-446655440001",  // ← QR code string
      "attendee_name": "Nguyen Van A",
      "attendee_email": "a@gmail.com",
      "attendee_phone": "0901234567",
      "ticket_type": {
        "id": "ticket-type-uuid",
        "name": "VIP Ticket",
        "description": "VIP seating area"
      },
      "status": "ACTIVE",              // ACTIVE | REVOKED | REFUNDED
      "checkin_status": "NOT_CHECKED_IN",  // NOT_CHECKED_IN | CHECKED_IN
      "checked_in_at": null,
      "checked_in_gate": null,
      "scan_count": 0
    },
    {
      "id": "ticket-uuid-2",
      "ticket_serial": "VIP-000002",
      "qr_payload": "550e8400-e29b-41d4-a716-446655440002",
      "attendee_name": "Nguyen Van B",
      "attendee_email": "b@gmail.com",
      "ticket_type": {
        "name": "VIP Ticket"
      },
      "status": "ACTIVE",
      "checkin_status": "NOT_CHECKED_IN"
    }
  ]
}
```

#### **QR Code Format - QUAN TRỌNG! 📱**

**QR Payload:**
- Format: `UUID` (e.g., `"550e8400-e29b-41d4-a716-446655440001"`)
- Unique cho mỗi ticket
- Dùng để scan check-in tại sự kiện

**Frontend Generate QR Code:**
```javascript
import QRCode from 'qrcode';

// Generate QR code image
const qrCodeDataURL = await QRCode.toDataURL(ticket.qr_payload, {
  width: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});

// Display
<img src={qrCodeDataURL} alt="QR Code" />
```

**Ticket Status:**
```typescript
type TicketStatus = 
  | "ACTIVE"      // Vé hợp lệ, có thể dùng
  | "REVOKED"     // Vé bị thu hồi (không dùng được)
  | "REFUNDED";   // Vé đã hoàn tiền
```

**Check-in Status:**
```typescript
type CheckinStatus = 
  | "NOT_CHECKED_IN"  // Chưa check-in
  | "CHECKED_IN";     // Đã check-in (đã vào sự kiện)
```

---

## 🟡 Priority 2: Business Logic

### Payment Status Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Order Created                                           │
│     status: PENDING                                         │
│     payment_status: UNPAID                                  │
│     tickets: [] (empty)                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Initiate Payment                                        │
│     status: PENDING                                         │
│     payment_status: UNPAID                                  │
│     transaction created (PENDING)                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. User on VNPAY (paying)                                  │
│     status: PENDING                                         │
│     payment_status: UNPAID                                  │
│     transaction: PENDING                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                    ↓
┌──────────────────────┐          ┌──────────────────────┐
│  4a. Payment Success │          │  4b. Payment Failed  │
│  status: CONFIRMED   │          │  status: PENDING     │
│  payment_status: PAID│          │  payment_status:     │
│  tickets: generated  │          │    FAILED            │
│  (with QR codes)     │          │  tickets: []         │
└──────────────────────┘          └──────────────────────┘
```

### Transaction Status

```typescript
type TransactionStatus = 
  | "PENDING"      // Đang chờ thanh toán
  | "PROCESSING"   // Đang xử lý (rare, VNPAY processing)
  | "SUCCESS"      // Thanh toán thành công
  | "FAILED"       // Thất bại
  | "CANCELLED";   // User hủy
```

### Ticket Generation Timing

**✅ Tickets được tạo NGAY SAU KHI:**
1. VNPAY gọi IPN callback
2. Backend validate signature success
3. Backend update order → PAID
4. Backend auto generate tickets (sync, trong cùng transaction)

**⏱️ Timing:**
- Tickets tạo trong ~500ms sau khi VNPAY callback
- Nếu frontend poll ngay, có thể thấy PAID nhưng tickets rỗng → Poll thêm 1 lần nữa sau 1 giây

**Recommended:**
```javascript
const checkOrderComplete = async () => {
  const order = await getOrder(orderId);
  
  if (order.payment_status === 'PAID' && order.tickets.length > 0) {
    // ✅ Complete! Show tickets
    return order;
  }
  
  if (order.payment_status === 'PAID' && order.tickets.length === 0) {
    // ⏳ Paid but tickets not ready yet, wait 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await getOrder(orderId);  // Retry once
  }
};
```

---

## 🔴 Error Scenarios & Handling

### Scenario 1: User Close VNPAY Window

**Tình huống:** User mở VNPAY, nhưng close window trước khi hoàn tất

**Backend State:**
- `order.status`: `PENDING`
- `order.payment_status`: `UNPAID`
- `transaction.status`: `PENDING`

**Frontend Action:**
```javascript
// User quay lại order page
if (order.payment_status === 'UNPAID') {
  // ✅ Cho phép retry payment
  showButton('Thanh toán lại', () => initiatePayment(orderId, ...));
}
```

**Timeout:**
- Transaction hết hạn sau **15 phút**
- Sau 15 phút, user vẫn có thể initiate payment mới

---

### Scenario 2: Payment Failed on VNPAY

**Tình huống:** User nhập sai OTP, không đủ tiền, etc.

**Backend State:**
- `order.status`: `PENDING`
- `order.payment_status`: `FAILED`
- `transaction.status`: `FAILED`

**Frontend Detect:**
```javascript
// Poll payment status
const status = await checkPaymentStatus(orderId);

if (status.payment_status === 'FAILED') {
  // ❌ Show error + retry button
  showError('Thanh toán thất bại. Vui lòng thử lại.');
  showRetryButton();
}
```

**Retry:**
✅ User có thể **RETRY NGAY LẬP TỨC**
- Call lại `initiatePayment()` để tạo transaction mới
- Không cần cancel order cũ

---

### Scenario 3: VNPAY Callback Delayed

**Tình huống:** VNPAY callback chậm (>30 giây)

**Hiện tượng:**
- User đã thanh toán xong trên VNPAY
- VNPAY redirect user về frontend
- Frontend poll status nhưng vẫn thấy `UNPAID`

**Frontend Action:**
```javascript
const MAX_POLLS = 20;  // 60 seconds total
let pollCount = 0;

const waitForPayment = async () => {
  pollCount++;
  
  const status = await checkPaymentStatus(orderId);
  
  if (status.payment_status === 'PAID') {
    return showSuccess();
  }
  
  if (pollCount >= MAX_POLLS) {
    // ⏳ Timeout - Show pending message
    showPendingMessage(
      'Thanh toán đang được xử lý. Vui lòng kiểm tra lại sau vài phút.',
      'Xem đơn hàng',
      () => router.push('/orders')
    );
    return;
  }
  
  setTimeout(waitForPayment, 3000);
};
```

**Note:** 
- Callback delay rất hiếm (~1% cases)
- Thường do network issue
- Order sẽ được update sau (có thể mất 1-5 phút)

---

### Scenario 4: User Paid but Closed Browser

**Tình huống:** User thanh toán xong nhưng đóng browser trước khi redirect về

**Solution:**

**1. Email Confirmation (Future - chưa implement)**
- ⏳ **TODO:** Backend sẽ gửi email với link đến order detail

**2. My Orders Page:**
✅ User có thể vào `/orders` để xem tất cả orders
```javascript
// GET /orders
const orders = await getMyOrders();

// Find paid orders
const paidOrders = orders.filter(o => o.payment_status === 'PAID');
```

**3. Order Tracking (by Order Number):**
✅ Public endpoint không cần login
```javascript
// GET /orders/order-number/:orderNumber
const order = await getOrderByNumber('ORD-1733389658000-ABC123');
```

---

## 🌐 Environment Configuration

### Development Setup

**Backend:**
```bash
# .env
PORT=3000
FRONTEND_URL="http://localhost:5173,http://localhost:3000"
JWT_SECRET="your-secret-key"

# VNPAY Sandbox
VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_TMN_CODE="your-tmn-code"
VNPAY_HASH_SECRET="your-hash-secret"
VNPAY_RETURN_URL="http://localhost:5173/payment/return"
VNPAY_IPN_URL="http://localhost:3000/payment/callback/vnpay"
```

**Frontend URLs được accept:**
```javascript
// ✅ Development URLs (whitelist)
"http://localhost:5173"
"http://localhost:3000"
"http://localhost:5173/payment/return"
"http://localhost:5173/payment/cancel"
```

**Test Flow:**
1. Start backend: `npm run start:dev` (port 3000)
2. Start frontend: `npm run dev` (port 5173)
3. Tạo order → Initiate payment với return_url = `http://localhost:5173/payment/return`

---

### Production Setup

**Backend .env:**
```bash
PORT=443
FRONTEND_URL="https://yourdomain.com,https://www.yourdomain.com"

# VNPAY Production
VNPAY_URL="https://vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_TMN_CODE="production-tmn-code"
VNPAY_HASH_SECRET="production-secret"
VNPAY_RETURN_URL="https://yourdomain.com/payment/return"
VNPAY_IPN_URL="https://api.yourdomain.com/payment/callback/vnpay"
```

**CORS Settings:**
```typescript
// Already configured in main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
});
```

---

## 🧪 Testing Support

### Test Data Available

**1. Test User:**
```json
{
  "email": "test@example.com",
  "password": "Test123456"
}
```

**2. Create Test Event & Tickets:**
```bash
# 1. Login to get JWT
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'

# Response: { "access_token": "..." }

# 2. Create Organization (nếu chưa có)
# 3. Create Event
# 4. Create Ticket Types
# 5. Create Order

# Hoặc dùng setup script:
npm run test:seed
```

**3. VNPAY Sandbox Test Cards:**
```
Card Number: 9704 0000 0000 0018
Card Holder: NGUYEN VAN A
Expiry: 03/07
CVV: 123
OTP: 123456
```

---

### Sample API Calls

**Complete Flow Example:**

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123456'
  })
});
const { access_token } = await loginResponse.json();

// 2. Create Order
const orderResponse = await fetch('http://localhost:3000/orders', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event_id: 'EVENT_UUID',
    items: [{
      ticket_type_id: 'TICKET_TYPE_UUID',
      quantity: 2,
      attendees: [
        { name: 'User A', email: 'a@test.com', phone: '0901111111' },
        { name: 'User B', email: 'b@test.com' }
      ]
    }]
  })
});
const order = await orderResponse.json();

// 3. Initiate Payment
const paymentResponse = await fetch(
  `http://localhost:3000/orders/${order.id}/payment/initiate`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      payment_method: 'VNPAY',
      return_url: 'http://localhost:5173/payment/return',
      cancel_url: 'http://localhost:5173/payment/cancel'
    })
  }
);
const payment = await paymentResponse.json();

// 4. Redirect
window.location.href = payment.payment_url;

// 5. After return, check status
const statusResponse = await fetch(
  `http://localhost:3000/orders/${order.id}/payment/status`,
  {
    headers: { 'Authorization': `Bearer ${access_token}` }
  }
);
const status = await statusResponse.json();

if (status.payment_status === 'PAID') {
  // 6. Get order with tickets
  const orderDetailResponse = await fetch(
    `http://localhost:3000/orders/${order.id}`,
    {
      headers: { 'Authorization': `Bearer ${access_token}` }
    }
  );
  const orderWithTickets = await orderDetailResponse.json();
  
  // Display tickets với QR codes
  orderWithTickets.tickets.forEach(ticket => {
    generateQRCode(ticket.qr_payload);
  });
}
```

---

### Mock Responses for Testing

**1. Success Case - Initiate Payment:**
```json
{
  "payment_url": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=50000000&vnp_Command=pay&...",
  "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
  "order_id": "order-uuid-here",
  "amount": 500000,
  "currency": "VND",
  "payment_method": "VNPAY",
  "expires_at": "2025-12-08T10:15:00.000Z"
}
```

**2. Success Case - Payment Status (PAID):**
```json
{
  "order_id": "order-uuid",
  "payment_status": "PAID",
  "transaction_id": "transaction-uuid",
  "payment_method": "VNPAY",
  "paid_at": "2025-12-08T10:05:30.897Z",
  "amount": 500000,
  "gateway_response": {
    "transaction_no": "14509586",
    "bank_code": "NCB",
    "card_type": "ATM"
  }
}
```

**3. Error Case - Invalid URL:**
```json
{
  "message": [
    "Return URL không hợp lệ"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

**4. Error Case - Order Already Paid:**
```json
{
  "message": "Đơn hàng đã được thanh toán",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 🐛 Debug Tools

### 1. Check Order Status (Manual)

```bash
# Get order detail
curl -X GET "http://localhost:3000/orders/ORDER_UUID" \
  -H "Authorization: Bearer JWT_TOKEN"
```

### 2. Force Update Payment Status (Development Only)

⚠️ **Chưa implement** - Nếu cần có thể thêm endpoint:

```
PUT /orders/:orderId/payment/force-update (Development only)
Body: { "payment_status": "PAID" }
```

### 3. Reset Order to UNPAID (Development Only)

⚠️ **Chưa implement** - Có thể thêm nếu cần:

```
POST /orders/:orderId/reset
```

### 4. View Logs

```bash
# Backend logs
npm run start:dev  # Watch mode với logs

# Check terminal output khi:
- Initiate payment
- VNPAY callback
- Order update
```

---

## 📋 Complete API Reference

### Enums & Types

```typescript
// Payment Method
enum PaymentMethod {
  VNPAY = 'VNPAY',
  MOMO = 'MOMO',
  ZALOPAY = 'ZALOPAY',
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

// Order Status
enum OrderStatus {
  PENDING = 'PENDING',        // Chờ thanh toán
  CONFIRMED = 'CONFIRMED',    // Đã thanh toán
  CANCELLED = 'CANCELLED',    // Đã hủy
  COMPLETED = 'COMPLETED'     // Đã hoàn thành (sau sự kiện)
}

// Payment Status
enum PaymentStatus {
  UNPAID = 'UNPAID',          // Chưa thanh toán
  PAID = 'PAID',              // Đã thanh toán
  FAILED = 'FAILED',          // Thất bại
  REFUNDED = 'REFUNDED'       // Đã hoàn tiền
}

// Transaction Status
enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// Ticket Status
enum TicketStatus {
  ACTIVE = 'ACTIVE',          // Hợp lệ
  REVOKED = 'REVOKED',        // Thu hồi
  REFUNDED = 'REFUNDED'       // Hoàn tiền
}

// Checkin Status
enum CheckinStatus {
  NOT_CHECKED_IN = 'NOT_CHECKED_IN',
  CHECKED_IN = 'CHECKED_IN'
}
```

---

## ✅ Implementation Checklist

### Frontend Team TODO:

- [ ] Update `FRONTEND_URL` in `.env` nếu cần
- [ ] Implement initiate payment flow
- [ ] Implement payment status polling (3s interval, 60s timeout)
- [ ] Handle all error scenarios
- [ ] Display tickets với QR codes
- [ ] Test complete flow end-to-end
- [ ] Handle edge cases (closed browser, delayed callback, etc.)

### Backend Team DONE:

- [x] All APIs implemented & tested
- [x] VNPAY integration complete
- [x] Transaction tracking
- [x] Automatic ticket generation
- [x] Error handling
- [x] URL validation & whitelist
- [x] Documentation complete

---

## 📞 Support & Contact

**Backend Team:**
- **Slack:** @backend-team
- **Email:** backend@example.com
- **Response Time:** < 2 hours during business hours

**Questions?**
- Slack channel: `#payment-integration`
- Tag: @backend-lead for urgent issues

---

## 🎯 Next Steps

**Immediate:**
1. ✅ Frontend implement với documentation này
2. ✅ Test trên development environment
3. ✅ Report issues nếu có

**Future Enhancements:**
- [ ] Email confirmation sau payment
- [ ] SMS notification
- [ ] More payment methods (MOMO, ZaloPay)
- [ ] Refund flow
- [ ] Partial refund

---

## 📝 Changelog

**v2.0 - 2025-12-08:**
- ✅ Complete documentation cho Frontend
- ✅ Thêm timezone handling
- ✅ Thêm `is_on_sale` field cho ticket types
- ✅ Fix URL validation issues
- ✅ Thêm error scenarios & handling

**v1.0 - 2025-12-05:**
- Initial payment gateway implementation

---

**🚀 Ready for Integration! Frontend team có thể bắt đầu integrate ngay!**

**Mọi câu hỏi vui lòng ping @backend-team trên Slack! 🙏**

