# 🎨 FRONTEND PAYMENT MODULE REQUIREMENTS

**Ngày:** 09/12/2025  
**Mục đích:** Hoàn thiện Payment Flow cho khách hàng  
**Backend Status:** ✅ Đã hoàn thành API

---

## 📋 TỔNG QUAN

Backend đã hoàn thành phần xử lý thanh toán VNPAY. Frontend cần làm **3 trang** để xử lý kết quả thanh toán từ VNPAY.

### Flow Tổng Quát

```
Customer chọn vé và checkout
    ↓
Frontend: POST /orders (tạo order)
    ↓
Frontend: POST /orders/{id}/payment/initiate
    ↓
Backend trả về: { paymentUrl: "https://sandbox.vnpayment.vn/..." }
    ↓
Frontend: Redirect customer đến VNPAY
    ↓
Customer thanh toán tại VNPAY
    ↓
VNPAY redirect về: GET /payment/vnpay/return?vnp_ResponseCode=...
    ↓
Backend xử lý và redirect đến Frontend:
    ├─ Success: /payment/success?order_number=...
    ├─ Failure: /payment/failure?code=...
    └─ Error:   /payment/error?reason=...
    ↓
Frontend hiển thị kết quả cho customer
```

---

## 🎯 NHIỆM VỤ CẦN LÀM

### ✅ Checklist

- [ ] **Page 1:** Payment Success Page (`/payment/success`)
- [ ] **Page 2:** Payment Failure Page (`/payment/failure`)
- [ ] **Page 3:** Payment Error Page (`/payment/error`)
- [ ] **Optional:** Loading/Processing page khi đang chờ VNPAY redirect
- [ ] **Test:** Test với sandbox VNPAY

---

## 📄 PAGE 1: PAYMENT SUCCESS

### Route
```
/payment/success
```

### Query Parameters

| Param | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `order_number` | string | ✅ | Mã đơn hàng | `ORD-20231209-ABC123` |
| `amount` | string | ❌ | Số tiền (VND * 100) | `50000000` (= 500,000 VND) |
| `transaction_no` | string | ❌ | Mã giao dịch VNPAY | `14080693` |

### UI Requirements

#### 1. Header Section
```
✅ [Icon thành công - màu xanh lá]

Thanh toán thành công!
Đơn hàng #ORD-20231209-ABC123

Số tiền đã thanh toán: 500,000 VND
Mã giao dịch: 14080693
```

#### 2. Information Section
```
📧 Email xác nhận đã được gửi đến: customer@example.com
🎫 Vé của bạn đã sẵn sàng!
```

#### 3. Call-to-Action Buttons
```
[Xem vé của tôi] (Primary button → /my-tickets)
[Xem chi tiết đơn hàng] (Secondary button → /orders/{order_number})
[Về trang chủ] (Tertiary button → /)
```

#### 4. Additional Info
```
💡 Lưu ý:
- Vé điện tử đã được gửi đến email của bạn
- Vui lòng kiểm tra cả hộp thư spam
- Mã QR trên vé sẽ được dùng để check-in tại sự kiện
```

### Example Code (React/Next.js)

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order_number');
  const amount = searchParams.get('amount');
  const transactionNo = searchParams.get('transaction_no');

  // Convert VNPAY amount (VND * 100) to display format
  const displayAmount = amount 
    ? (parseInt(amount) / 100).toLocaleString('vi-VN')
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-20 h-20 text-green-500" />
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold text-center mb-2">
          Thanh toán thành công!
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Đơn hàng #{orderNumber}
        </p>

        {/* Transaction Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
          {displayAmount && (
            <div className="flex justify-between">
              <span className="text-gray-600">Số tiền:</span>
              <span className="font-semibold">{displayAmount} VND</span>
            </div>
          )}
          {transactionNo && (
            <div className="flex justify-between">
              <span className="text-gray-600">Mã giao dịch:</span>
              <span className="font-mono text-sm">{transactionNo}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            📧 Email xác nhận và vé điện tử đã được gửi đến hộp thư của bạn.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            className="w-full" 
            onClick={() => window.location.href = '/my-tickets'}
          >
            🎫 Xem vé của tôi
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = `/orders/${orderNumber}`}
          >
            📋 Xem chi tiết đơn hàng
          </Button>
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => window.location.href = '/'}
          >
            🏠 Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📄 PAGE 2: PAYMENT FAILURE

### Route
```
/payment/failure
```

### Query Parameters

| Param | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `code` | string | ✅ | VNPAY response code | `07`, `24`, `51` |
| `message` | string | ❌ | Error message (optional) | Custom message |

### VNPAY Response Codes

| Code | Ý nghĩa | Hành động đề xuất |
|------|---------|-------------------|
| `07` | Trừ tiền thành công nhưng giao dịch nghi vấn | Liên hệ CSKH để kiểm tra |
| `09` | Thẻ chưa đăng ký dịch vụ Internet Banking | Thử lại với thẻ khác |
| `10` | Thẻ/Tài khoản không đúng | Kiểm tra lại thông tin |
| `11` | Thẻ hết hạn | Sử dụng thẻ khác |
| `12` | Thẻ bị khóa | Liên hệ ngân hàng |
| `13` | OTP không chính xác | Thử lại |
| `24` | Giao dịch bị hủy | Khách hàng đã hủy |
| `51` | Tài khoản không đủ số dư | Nạp tiền và thử lại |
| `65` | Vượt quá số lần nhập OTP | Thử lại sau 24h |
| `75` | Ngân hàng đang bảo trì | Thử lại sau |
| `79` | Vượt quá số lần thanh toán trong ngày | Thử lại vào ngày mai |
| `99` | Lỗi không xác định | Liên hệ CSKH |

### UI Requirements

#### 1. Header Section
```
❌ [Icon thất bại - màu đỏ]

Thanh toán không thành công

Mã lỗi: {code}
Lý do: {errorMessage}
```

#### 2. Action Recommendations (dựa vào code)

```tsx
const getErrorInfo = (code: string) => {
  const errorMap = {
    '07': {
      title: 'Giao dịch nghi vấn',
      message: 'Tiền đã bị trừ nhưng giao dịch chưa được xác nhận.',
      action: 'contact_support',
      icon: '⚠️'
    },
    '09': {
      title: 'Thẻ chưa đăng ký dịch vụ',
      message: 'Thẻ của bạn chưa đăng ký Internet Banking.',
      action: 'retry',
      icon: '💳'
    },
    '10': {
      title: 'Thông tin thẻ không đúng',
      message: 'Vui lòng kiểm tra lại thông tin thẻ.',
      action: 'retry',
      icon: '🔢'
    },
    '11': {
      title: 'Thẻ hết hạn',
      message: 'Thẻ của bạn đã hết hạn sử dụng.',
      action: 'use_another_card',
      icon: '📅'
    },
    '12': {
      title: 'Thẻ bị khóa',
      message: 'Vui lòng liên hệ ngân hàng để mở khóa.',
      action: 'contact_bank',
      icon: '🔒'
    },
    '24': {
      title: 'Giao dịch bị hủy',
      message: 'Bạn đã hủy giao dịch.',
      action: 'retry',
      icon: '🚫'
    },
    '51': {
      title: 'Số dư không đủ',
      message: 'Tài khoản của bạn không đủ số dư.',
      action: 'retry',
      icon: '💰'
    },
    '65': {
      title: 'Vượt quá số lần nhập OTP',
      message: 'Bạn đã nhập sai OTP quá nhiều lần.',
      action: 'try_later',
      icon: '🔑'
    },
    '75': {
      title: 'Ngân hàng đang bảo trì',
      message: 'Hệ thống ngân hàng đang bảo trì.',
      action: 'try_later',
      icon: '🔧'
    },
    '79': {
      title: 'Vượt quá giới hạn thanh toán',
      message: 'Bạn đã vượt quá số lần thanh toán trong ngày.',
      action: 'try_tomorrow',
      icon: '⏰'
    },
    'default': {
      title: 'Lỗi không xác định',
      message: 'Đã có lỗi xảy ra trong quá trình thanh toán.',
      action: 'contact_support',
      icon: '❌'
    }
  };

  return errorMap[code] || errorMap['default'];
};
```

#### 3. Call-to-Action Buttons

```
[Thử lại] (Primary button → Back to checkout/event page)
[Liên hệ hỗ trợ] (Secondary button → /support or live chat)
[Về trang chủ] (Tertiary button → /)
```

### Example Code

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw, MessageCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const getErrorInfo = (code: string) => {
  // ... (implementation from above)
};

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '99';
  const errorInfo = getErrorInfo(code);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <XCircle className="w-20 h-20 text-red-500" />
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold text-center mb-2 text-red-600">
          Thanh toán không thành công
        </h1>
        
        {/* Error Details */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">{errorInfo.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 mb-1">
                {errorInfo.title}
              </h3>
              <p className="text-sm text-red-700">
                {errorInfo.message}
              </p>
              <p className="text-xs text-red-600 mt-2">
                Mã lỗi: {code}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">
            💡 Gợi ý:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Kiểm tra lại thông tin thẻ</li>
            <li>Đảm bảo tài khoản có đủ số dư</li>
            <li>Thử với phương thức thanh toán khác</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            className="w-full" 
            onClick={() => window.history.back()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/support'}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Liên hệ hỗ trợ
          </Button>
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => window.location.href = '/'}
          >
            <Home className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📄 PAGE 3: PAYMENT ERROR

### Route
```
/payment/error
```

### Query Parameters

| Param | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `reason` | string | ✅ | Error reason | `invalid_signature`, `timeout` |

### Error Reasons

| Reason | Meaning | Action |
|--------|---------|--------|
| `invalid_signature` | VNPAY secure hash không hợp lệ | Liên hệ support |
| `timeout` | Request timeout | Thử lại |
| `order_not_found` | Không tìm thấy đơn hàng | Kiểm tra lại |
| `unknown` | Lỗi không xác định | Liên hệ support |

### UI Requirements

```
⚠️ [Icon cảnh báo - màu vàng]

Có lỗi xảy ra

Chúng tôi không thể xử lý thanh toán của bạn.
Vui lòng liên hệ bộ phận hỗ trợ.

Mã tham chiếu: {timestamp}-{reason}
```

### Example Code

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { AlertTriangle, MessageCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'unknown';
  const referenceCode = `${Date.now()}-${reason}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <AlertTriangle className="w-20 h-20 text-yellow-500" />
        </div>

        {/* Header */}
        <h1 className="text-2xl font-bold text-center mb-2">
          Có lỗi xảy ra
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Chúng tôi không thể xử lý thanh toán của bạn
        </p>

        {/* Error Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 mb-3">
            Đã xảy ra lỗi kỹ thuật trong quá trình xử lý. 
            Vui lòng liên hệ bộ phận hỗ trợ với mã tham chiếu dưới đây:
          </p>
          <div className="bg-white rounded p-2 font-mono text-xs text-center">
            {referenceCode}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 mb-2">
            📞 Hỗ trợ khách hàng
          </h4>
          <p className="text-sm text-blue-700">
            Email: support@example.com<br />
            Hotline: 1900-xxxx<br />
            Giờ làm việc: 8:00 - 22:00 hàng ngày
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button 
            className="w-full"
            onClick={() => window.location.href = '/support'}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Liên hệ hỗ trợ
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/'}
          >
            <Home className="w-4 h-4 mr-2" />
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔗 API ENDPOINTS CẦN DÙNG

### 1. Tạo Order
```http
POST /orders
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "event_id": "uuid",
  "items": [
    {
      "ticket_type_id": "uuid",
      "quantity": 2,
      "attendees": [
        {
          "name": "Nguyen Van A",
          "email": "a@example.com",
          "phone": "0123456789"
        },
        {
          "name": "Tran Thi B",
          "email": "b@example.com",
          "phone": "0987654321"
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "id": "order-uuid",
  "order_number": "ORD-20231209-ABC123",
  "total_amount": "500000.00",
  "status": "PENDING",
  "payment_status": "UNPAID",
  "items": [...],
  "created_at": "2023-12-09T10:00:00Z"
}
```

### 2. Khởi tạo thanh toán
```http
POST /orders/{order_id}/payment/initiate
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "payment_method": "VNPAY",
  "return_url": "http://localhost:5173/payment/callback"
}
```

**Response:**
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=50000000&..."
}
```

**Flow:**
```tsx
// Step 1: Create order
const orderResponse = await createOrder(eventId, items);
const orderId = orderResponse.id;

// Step 2: Initiate payment
const paymentResponse = await initiatePayment(orderId, 'VNPAY');

// Step 3: Redirect to VNPAY
window.location.href = paymentResponse.paymentUrl;

// Step 4: VNPAY will redirect back to your return_url
// Then backend will redirect to /payment/success or /payment/failure
```

### 3. Lấy thông tin Order (sau khi thanh toán thành công)
```http
GET /orders/{order_number}
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "id": "uuid",
  "order_number": "ORD-20231209-ABC123",
  "event": {
    "id": "uuid",
    "title": "Concert ABC",
    "start_at": "2024-01-15T19:00:00Z"
  },
  "total_amount": "500000.00",
  "status": "CONFIRMED",
  "payment_status": "PAID",
  "payment_method": "VNPAY",
  "paid_at": "2023-12-09T10:15:00Z",
  "tickets": [
    {
      "id": "ticket-uuid",
      "ticket_serial": "TCKT-123456",
      "attendee_name": "Nguyen Van A",
      "attendee_email": "a@example.com",
      "qr_payload": "encrypted-qr-data",
      "status": "ACTIVE"
    }
  ]
}
```

### 4. Lấy danh sách vé của user
```http
GET /tickets/my-tickets
Authorization: Bearer {jwt_token}
```

---

## 🎨 UI/UX BEST PRACTICES

### 1. Loading State
Khi redirect về từ VNPAY, có thể có delay 1-2s. Hiển thị loading:

```tsx
// Optional: Payment Processing Page
export default function PaymentProcessingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">
          Đang xử lý thanh toán...
        </h2>
        <p className="text-gray-600">
          Vui lòng không đóng trang này
        </p>
      </div>
    </div>
  );
}
```

### 2. Responsive Design
- Đảm bảo 3 trang hoạt động tốt trên mobile
- Success page nên có nút share/download vé
- Failure page nên dễ dàng retry

### 3. Analytics Tracking
```tsx
// Track payment results
useEffect(() => {
  if (orderNumber) {
    // Track success
    analytics.track('payment_success', {
      order_number: orderNumber,
      amount: displayAmount,
      transaction_no: transactionNo
    });
  }
}, [orderNumber]);
```

### 4. SEO
```tsx
// Add metadata
export const metadata = {
  title: 'Thanh toán thành công | Your App',
  robots: 'noindex, nofollow' // Don't index payment result pages
};
```

---

## 🧪 TESTING GUIDE

### Test Cases

#### 1. Success Flow
```
1. Tạo order mới
2. Click thanh toán
3. Tại VNPAY sandbox, chọn thanh toán thành công
4. Verify: Redirect về /payment/success
5. Verify: Hiển thị đúng order_number
6. Click "Xem vé" → Verify: Navigate đến /my-tickets
```

#### 2. Failure Flow
```
1. Tạo order mới
2. Click thanh toán
3. Tại VNPAY sandbox, chọn "Không đủ số dư" (code 51)
4. Verify: Redirect về /payment/failure?code=51
5. Verify: Hiển thị đúng error message
6. Click "Thử lại" → Verify: Navigate back to checkout
```

#### 3. Error Flow
```
1. Manually navigate to /payment/error?reason=invalid_signature
2. Verify: Hiển thị error page
3. Verify: Reference code được generate
4. Click "Liên hệ hỗ trợ" → Verify: Navigate to support page
```

### VNPAY Sandbox Test Cards

| Bank | Card Number | Expiry | CVV | OTP | Result |
|------|-------------|--------|-----|-----|--------|
| NCB | 9704198526191432198 | 07/15 | 123 | 123456 | ✅ Success |
| (Same card) | (same) | (same) | (same) | (wrong) | ❌ Wrong OTP |
| NCB | 9704198526191432199 | 07/15 | 123 | N/A | ❌ Insufficient balance |

**Sandbox URL:** https://sandbox.vnpayment.vn/tryitnow/Home/CreateOrder

---

## 📦 DELIVERABLES

### Frontend cần giao:

1. ✅ **3 Pages hoạt động**
   - `/payment/success` - Fully functional
   - `/payment/failure` - Fully functional
   - `/payment/error` - Fully functional

2. ✅ **Responsive Design**
   - Desktop, tablet, mobile
   - Screenshots cho mỗi device

3. ✅ **Error Handling**
   - Handle missing query params
   - Handle invalid order_number
   - Handle network errors

4. ✅ **Navigation Flow**
   - Buttons navigate đúng routes
   - Back button behavior hợp lý

5. ✅ **Testing Evidence**
   - Video demo success flow
   - Video demo failure flow
   - Screenshots của các error codes

---

## 🚀 DEPLOYMENT CHECKLIST

### Environment Variables

```env
# Frontend .env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_FRONTEND_URL=https://yourdomain.com

# Backend .env
FRONTEND_URL=https://yourdomain.com
VNPAY_TMN_CODE=your_tmn_code
VNPAY_SECRET_KEY=your_secret_key
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

### Pre-deployment

- [ ] Test với VNPAY sandbox
- [ ] Test responsive design
- [ ] Test error handling
- [ ] Setup analytics tracking
- [ ] Add SEO meta tags
- [ ] Configure CORS cho return URLs

### Post-deployment

- [ ] Test production VNPAY (if available)
- [ ] Monitor error rates
- [ ] Check analytics data
- [ ] Verify email notifications work
- [ ] Test from real devices

---

## 📞 SUPPORT

### Nếu gặp vấn đề:

1. **Backend API không hoạt động:**
   - Check API URL trong `.env`
   - Check network tab trong browser
   - Liên hệ backend team

2. **VNPAY redirect không về đúng:**
   - Check `return_url` trong request
   - Check `FRONTEND_URL` trong backend `.env`
   - Check VNPAY merchant config

3. **Order không tìm thấy:**
   - Check `order_number` format
   - Check database có record không
   - Check JWT token còn valid không

### Contact Backend Team:

```
Slack: #backend-team
Email: backend@example.com
```

---

## 📚 ADDITIONAL RESOURCES

- [VNPAY API Documentation](https://sandbox.vnpayment.vn/apis/)
- [Backend API Documentation](./API_DOCUMENTATION.md)
- [Payment Flow Diagram](./PAYMENT_FLOW.md)
- [Figma Design](https://figma.com/...)

---

**Estimated Time:** 1-2 days  
**Priority:** 🔴 HIGH (Blocking Payout Module)  
**Dependencies:** None (Backend đã ready)

---

✅ **Sau khi hoàn thành, chúng ta sẽ bắt đầu Payout Module!**
