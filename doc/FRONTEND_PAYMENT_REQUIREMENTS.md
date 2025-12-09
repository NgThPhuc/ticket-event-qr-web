# 📋 Frontend Payment Module - Requirements từ Backend

**Ngày tạo:** 2025-12-08  
**Frontend Team**

---

## 🎯 Mục đích

Frontend đã hoàn thành UI/UX cho payment flow. Document này liệt kê những gì Frontend cần từ Backend để hoàn thiện và test module payment.

---

## ✅ Frontend đã hoàn thành

### 1. **UI/UX Components:**
- ✅ Order Success page với payment button
- ✅ Payment Return page (callback handling)
- ✅ Payment status polling (mỗi 2 giây)
- ✅ Order Detail page với tickets + QR codes
- ✅ Order tracking page (public)
- ✅ Error handling và loading states

### 2. **API Integration (Frontend ready):**
- ✅ `initiatePayment(orderId, returnUrl, cancelUrl)`
- ✅ `checkPaymentStatus(orderId)`
- ✅ State management cho payment flow
- ✅ Timezone handling (UTC ↔ Local)

### 3. **Payment Flow:**
```
✅ User đặt vé → Order created (UNPAID)
✅ Click "Pay Now" → Call initiate payment
✅ Redirect to VNPAY
⏳ VNPAY callback → Backend xử lý
⏳ Frontend poll status
⏳ Show tickets when PAID
```

---

## 🔴 Frontend đang cần từ Backend

### 1. **API Documentation chi tiết**

Cần tài liệu đầy đủ cho các endpoints:

#### **A. Initiate Payment API**

```
POST /orders/:orderId/payment/initiate
```

**Frontend cần biết:**
- ✅ Request body format chính xác?
  - `payment_method` có bắt buộc không?
  - `return_url` format như thế nào? (có accept localhost không?)
  - `cancel_url` có bắt buộc không? có thể null không?
  
- ✅ Response format?
  ```json
  {
    "payment_url": "...",  // URL để redirect
    "transaction_id": "...",  // Để tracking
    "expires_at": "..."  // Bao lâu hết hạn?
  }
  ```

- ✅ Error cases?
  - Order không tồn tại → status code? message?
  - Order đã paid → status code? message?
  - Invalid URL format → message cụ thể?

- ✅ Validation rules?
  - URL format nào được accept?
  - Localhost có OK không? (cho development)
  - Query params trong URL có được không?

**Hiện tại gặp vấn đề:**
```json
{
  "message": ["Return URL không hợp lệ", "Cancel URL không hợp lệ"],
  "statusCode": 400
}
```
→ Cần biết chính xác URL format nào hợp lệ?

---

#### **B. Check Payment Status API**

```
GET /orders/:orderId/payment/status
```

**Frontend cần biết:**
- ✅ Response structure đầy đủ?
  ```json
  {
    "payment_status": "PAID | UNPAID | PENDING | FAILED",
    "transaction_id": "...",
    "paid_at": "ISO datetime",
    // Còn fields gì nữa?
  }
  ```

- ✅ Polling frequency?
  - Frontend đang poll mỗi 2 giây
  - Backend có rate limit không?
  - Timeout bao lâu nên dừng poll?

---

#### **C. Get Tickets API** (sau khi paid)

```
GET /orders/:orderId/tickets
```

**Frontend cần biết:**
- ✅ Response format?
  ```json
  [
    {
      "id": "...",
      "qr_code": "...",  // String để generate QR
      "attendee_name": "...",
      "attendee_email": "...",
      "status": "VALID | USED | CANCELLED"
      // Fields nào khác?
    }
  ]
  ```

- ✅ QR code format?
  - QR code là string gì? (UUID? Custom format?)
  - Dùng để scan ở đâu?

---

### 2. **Business Logic Documentation**

#### **A. Payment Status Flow**

Frontend cần hiểu rõ flow:

```
Order created → payment_status = ?
↓
Initiate payment → payment_status = ?
↓
User on VNPAY → payment_status = ?
↓
VNPAY callback → payment_status = ?
↓
Payment success → payment_status = PAID
```

**Câu hỏi:**
- ✅ Có status `PROCESSING` hay `PENDING` không?
- ✅ Khi nào tickets được generate? (Ngay sau VNPAY callback? Hay có delay?)
- ✅ Nếu VNPAY callback chậm, user poll status thì thấy gì?

---

#### **B. Error Scenarios**

Frontend cần biết xử lý như thế nào khi:

1. **User close VNPAY window** (không hoàn thành thanh toán)
   - Order status vẫn là gì?
   - User có thể retry không?
   - Có timeout không?

2. **Payment failed trên VNPAY**
   - Backend trả về status gì?
   - Message hiển thị gì?
   - User có thể retry ngay không?

3. **VNPAY callback bị delay**
   - Frontend poll 30 giây không thấy PAID
   - Hiển thị gì cho user?
   - Có API nào để force check không?

4. **User paid rồi nhưng close browser trước khi redirect về**
   - Làm sao user access tickets?
   - Có email confirmation không?

---

### 3. **Environment Configuration**

#### **Development Environment:**

**Frontend cần biết:**
- ✅ Backend URL? (http://localhost:3000 hay khác?)
- ✅ VNPAY đang dùng Sandbox hay Production?
- ✅ Return URL nào được accept?
  ```
  http://localhost:5173/payment/return?order_id=xxx  ← OK?
  http://127.0.0.1:5173/payment/return?order_id=xxx  ← OK?
  ```

#### **Production Environment:**

- ✅ Domain nào được whitelist cho return_url?
- ✅ CORS settings?

---

### 4. **Testing Support**

**Frontend cần:**

#### **A. Test Data:**
- ✅ Sample order IDs để test
- ✅ Test accounts
- ✅ VNPAY sandbox credentials

#### **B. Mock Responses:**
- ✅ Sample success response
- ✅ Sample error responses
- ✅ Sample payment_status states

#### **C. Debug Tools:**
- ✅ Có API để force update payment status không? (cho testing)
- ✅ Có API để reset order về UNPAID không?
- ✅ Có logs để debug không?

---

## 📝 Yêu cầu Documentation Format

Backend team vui lòng cung cấp documentation theo format:

### **Mỗi API endpoint bao gồm:**

```markdown
## API Name

### Endpoint
`METHOD /path/:param`

### Authentication
Required/Optional

### Request
- Headers: {...}
- Body: {...}
- Query Params: {...}

### Response Success (200 OK)
```json
{...}
```

### Response Errors
- 400: {...}
- 401: {...}
- 404: {...}

### Business Logic
- Step 1
- Step 2
- Edge cases

### Examples
- cURL example
- Success case
- Error case
```

---

## 🔗 Endpoints cần documentation

### **Priority 1 (CRITICAL - blocking development):**
1. ✅ `POST /orders/:orderId/payment/initiate`
2. ✅ `GET /orders/:orderId/payment/status`
3. ✅ `GET /orders/:orderId` (with tickets)

### **Priority 2 (Important):**
4. ✅ `GET /orders/:orderId/tickets`
5. ✅ Error codes & messages list
6. ✅ Payment status enum values

### **Priority 3 (Nice to have):**
7. ✅ Webhook/IPN callback format (nếu frontend cần biết)
8. ✅ Retry payment mechanism
9. ✅ Refund flow (future)

---

## 📞 Questions & Clarifications

**Frontend team cần làm rõ:**

### **1. URL Validation:**
```javascript
// Những URL nào hợp lệ?
"http://localhost:5173/payment/return?order_id=xxx"  // ✅ OK?
"https://yourdomain.com/payment/return"  // ✅ OK?
"http://192.168.1.100:5173/payment/return"  // ❓
```

### **2. Cancel URL:**
```javascript
// cancel_url có bắt buộc không?
{
  "return_url": "...",
  "cancel_url": null  // ❓ Có OK không?
}
// Hoặc có thể không gửi field cancel_url?
{
  "return_url": "..."
  // không có cancel_url
}
```

### **3. Payment Timeout:**
```javascript
// Bao lâu thì transaction hết hạn?
expires_at: "2025-12-08T10:00:00.000Z"  // 15 phút?
// Sau khi hết hạn, order status = ?
```

### **4. Ticket Generation:**
```javascript
// Khi nào tickets được tạo?
- Ngay sau VNPAY callback? ✅
- Sau vài giây? ❓
- Async job? ❓

// QR code format?
"TICKET-{uuid}"  // ❓
"{uuid}"  // ❓
"EVT-{eventId}-TKT-{ticketId}"  // ❓
```

---

## 🎯 Deliverables mong muốn từ Backend

### **Document:**
1. ✅ API Documentation (như format trên)
2. ✅ Postman collection (nếu có)
3. ✅ Error codes & messages reference
4. ✅ Business logic flow diagrams

### **Support:**
1. ✅ Test environment URL
2. ✅ Sample API calls (cURL/Postman)
3. ✅ Test accounts/data
4. ✅ Slack channel để hỏi nhanh

---

## ⏰ Timeline

**Frontend status:**
- ✅ UI/UX: 100% complete
- ⏳ Integration: 70% complete (blocked by validation issues)
- ⏳ Testing: 0% (waiting for stable APIs)

**Cần từ Backend:**
- 🔴 **ASAP:** Fix validation issues + basic documentation
- 🟡 **This week:** Complete API documentation
- 🟢 **Next week:** Testing support + edge cases

---

## 📧 Contact

**Frontend Team:**
- Lead: [Name]
- Email: frontend@example.com
- Slack: @frontend-team

**Ready to integrate ngay khi nhận được documentation!** 🚀

---

## 📎 Appendix

### Current Frontend Implementation:

**File structure:**
```
src/
├── api/
│   ├── payment.js          // API functions
│   └── orders.js
├── pages/
│   ├── OrderSuccess.jsx    // Payment button
│   ├── PaymentReturn.jsx   // Callback handler
│   └── OrderDetail.jsx     // Show tickets
└── components/
    ├── QRCodeDisplay.jsx   // QR code rendering
    └── TicketCard.jsx
```

**Payment flow code:** `src/pages/OrderSuccess.jsx` line 60-90

**Status polling code:** `src/pages/PaymentReturn.jsx` line 40-70

---

**Cảm ơn Backend Team! 🙏**

