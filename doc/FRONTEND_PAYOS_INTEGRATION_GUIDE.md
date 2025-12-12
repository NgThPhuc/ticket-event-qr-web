# 📱 Frontend - PayOS Payment Integration Guide

> **Tài liệu tích hợp PayOS Payment Gateway cho Frontend Team**  
> Version: 1.0  
> Last Updated: 2025-12-10

---

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Payment Flow](#payment-flow)
3. [API Endpoints](#api-endpoints)
4. [Implementation Guide](#implementation-guide)
5. [Error Handling](#error-handling)
6. [Testing](#testing)
7. [Best Practices](#best-practices)

---

## 🎯 Tổng quan

### Payment Methods hiện có:
- ✅ **VNPAY** - Banking, Visa/Master (Đang có vấn đề sandbox)
- ✅ **PAYOS** - Banking, Momo, ZaloPay, QR Code (RECOMMENDED)

### PayOS Features:
- 💳 Chuyển khoản ngân hàng
- 📱 Ví Momo
- 💰 Ví ZaloPay
- 🔲 QR Code (VietQR)
- ⚡ Real-time payment confirmation

---

## 🔄 Payment Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌─────────────┐
│   Customer  │      │   Frontend   │      │   Backend   │      │    PayOS    │
└──────┬──────┘      └──────┬───────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                     │                     │
       │ 1. Select tickets  │                     │                     │
       ├───────────────────>│                     │                     │
       │                    │                     │                     │
       │ 2. Click "Thanh toán"                    │                     │
       ├───────────────────>│                     │                     │
       │                    │                     │                     │
       │                    │ 3. POST /orders     │                     │
       │                    ├────────────────────>│                     │
       │                    │<────────────────────┤                     │
       │                    │   {order_id, ...}   │                     │
       │                    │                     │                     │
       │                    │ 4. POST /orders/:id/payment/initiate      │
       │                    │    {payment_method: "PAYOS"}              │
       │                    ├────────────────────>│                     │
       │                    │                     │ 5. Create payment   │
       │                    │                     ├────────────────────>│
       │                    │                     │<────────────────────┤
       │                    │<────────────────────┤  {payment_url}      │
       │                    │  {payment_url, ...} │                     │
       │                    │                     │                     │
       │ 6. Redirect to payment_url               │                     │
       │<───────────────────┤                     │                     │
       │                    │                     │                     │
       │ 7. Chọn phương thức & thanh toán         │                     │
       ├──────────────────────────────────────────────────────────────>│
       │                    │                     │                     │
       │                    │                     │ 8. Webhook (IPN)    │
       │                    │                     │<────────────────────┤
       │                    │                     │   Update order      │
       │                    │                     │                     │
       │ 9. Redirect to return_url                │                     │
       │    ?code=00&status=PAID&orderCode=xxx    │                     │
       │<──────────────────────────────────────────────────────────────┤
       │                    │                     │                     │
       │                    │ 10. POST /payment/payos/confirm           │
       │                    │     {orderCode}     │                     │
       │                    ├────────────────────>│                     │
       │                    │<────────────────────┤                     │
       │                    │   {success: true}   │                     │
       │                    │                     │                     │
       │ 11. Show success   │                     │                     │
       │    + Tickets       │                     │                     │
       │<───────────────────┤                     │                     │
       │                    │                     │                     │
```

---

## 🔌 API Endpoints

### 1. **Tạo Order**

```http
POST /orders
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```typescript
{
  event_id: string;           // UUID của event
  customer_name: string;      // Tên khách hàng
  customer_email: string;     // Email
  customer_phone: string;     // SĐT (format: 0912345678)
  items: [
    {
      ticket_type_id: string; // UUID của ticket type
      quantity: number;       // Số lượng (min: 1)
    }
  ];
}
```

**Response (201 Created):**
```typescript
{
  id: string;                 // Order UUID
  order_number: string;       // "ORD-1702881234567-ABC123"
  total_amount: string;       // "500000.00"
  payment_status: "UNPAID";
  status: "PENDING";
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: [
    {
      id: string;
      ticket_type_id: string;
      quantity: number;
      unit_price: string;
      subtotal: string;
    }
  ];
  created_at: string;         // ISO 8601
}
```

---

### 2. **Initiate Payment (PayOS)**

```http
POST /orders/{order_id}/payment/initiate
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```typescript
{
  payment_method: "PAYOS";    // REQUIRED
  return_url: string;         // URL để PayOS redirect về (có thể có query params)
  cancel_url?: string;        // Optional: URL khi user hủy
}
```

**Example:**
```json
{
  "payment_method": "PAYOS",
  "return_url": "http://localhost:5173/payment/result",
  "cancel_url": "http://localhost:5173/payment/cancel"
}
```

**Response (200 OK):**
```typescript
{
  payment_url: string;        // "https://pay.payos.vn/web/..."
  transaction_id: string;     // "1702881234567"
  order_id: string;           // Order UUID
  amount: string;             // "500000.00"
  currency: "VND";
  payment_method: "PAYOS";
  expires_at: string;         // ISO 8601 (15 phút từ lúc tạo)
}
```

---

### 3. **Confirm Payment (từ Return URL)**

```http
POST /payment/payos/confirm
Content-Type: application/json
```

**Request Body:**
```typescript
{
  orderCode: number;          // Lấy từ return URL query params
}
```

**Example:**
```json
{
  "orderCode": 1702881234567
}
```

**Response (200 OK):**
```typescript
{
  success: boolean;
  message: string;
}
```

**Examples:**
```json
// Success
{
  "success": true,
  "message": "Xác nhận thanh toán thành công"
}

// Already confirmed
{
  "success": true,
  "message": "Đơn hàng đã được thanh toán"
}

// Error
{
  "success": false,
  "message": "Không tìm thấy giao dịch"
}
```

---

### 4. **Get Payment Status**

```http
GET /orders/{order_id}/payment/status
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```typescript
{
  order_id: string;
  payment_status: "UNPAID" | "PAID" | "REFUNDED";
  transaction_id: string | null;
  payment_method: "PAYOS" | "VNPAY" | null;
  amount: string;
  paid_at: string | null;     // ISO 8601
}
```

---

### 5. **Get Order Details**

```http
GET /orders/{order_id}
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```typescript
{
  id: string;
  order_number: string;
  total_amount: string;
  payment_status: "UNPAID" | "PAID" | "REFUNDED";
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: [...];
  event: {
    id: string;
    title: string;
    start_date: string;
    // ...
  };
  created_at: string;
  paid_at: string | null;
}
```

---

## 💻 Implementation Guide

### **Step 1: Payment Method Selection**

```tsx
// PaymentMethodSelector.tsx
import React, { useState } from 'react';

type PaymentMethod = 'VNPAY' | 'PAYOS';

export const PaymentMethodSelector = () => {
  const [method, setMethod] = useState<PaymentMethod>('PAYOS');

  return (
    <div className="payment-methods">
      <label className={method === 'PAYOS' ? 'selected' : ''}>
        <input
          type="radio"
          value="PAYOS"
          checked={method === 'PAYOS'}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        />
        <div className="method-info">
          <span className="method-name">PayOS</span>
          <span className="method-desc">
            Banking, Momo, ZaloPay, QR Code
          </span>
          <span className="badge recommended">Recommended</span>
        </div>
      </label>

      <label className={method === 'VNPAY' ? 'selected' : ''}>
        <input
          type="radio"
          value="VNPAY"
          checked={method === 'VNPAY'}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        />
        <div className="method-info">
          <span className="method-name">VNPAY</span>
          <span className="method-desc">
            Banking, Visa/MasterCard
          </span>
        </div>
      </label>
    </div>
  );
};
```

---

### **Step 2: Initiate Payment**

```typescript
// services/payment.service.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

interface InitiatePaymentRequest {
  payment_method: 'PAYOS' | 'VNPAY';
  return_url: string;
  cancel_url?: string;
}

interface InitiatePaymentResponse {
  payment_url: string;
  transaction_id: string;
  order_id: string;
  amount: string;
  currency: string;
  payment_method: string;
  expires_at: string;
}

export const initiatePayment = async (
  orderId: string,
  data: InitiatePaymentRequest,
  accessToken: string
): Promise<InitiatePaymentResponse> => {
  const response = await axios.post(
    `${API_BASE_URL}/orders/${orderId}/payment/initiate`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};
```

---

### **Step 3: Handle Payment Flow**

```typescript
// pages/CheckoutPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initiatePayment } from '../services/payment.service';
import { useAuth } from '../contexts/AuthContext';

export const CheckoutPage = ({ orderId }: { orderId: string }) => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initiate payment
      const result = await initiatePayment(
        orderId,
        {
          payment_method: 'PAYOS',
          return_url: `${window.location.origin}/payment/result`,
          cancel_url: `${window.location.origin}/payment/cancel`,
        },
        accessToken
      );

      // Redirect to PayOS payment page
      window.location.href = result.payment_url;
    } catch (err: any) {
      console.error('Payment initiation failed:', err);
      setError(
        err.response?.data?.message || 
        'Không thể khởi tạo thanh toán. Vui lòng thử lại.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Thanh toán</h1>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
      </button>
    </div>
  );
};
```

---

### **Step 4: Handle Return URL**

```typescript
// pages/PaymentResultPage.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        // Parse query params from PayOS return URL
        const code = searchParams.get('code');
        const paymentStatus = searchParams.get('status');
        const orderCode = searchParams.get('orderCode');
        const cancel = searchParams.get('cancel');

        // Check if payment was successful
        if (cancel === 'true' || paymentStatus === 'CANCELLED') {
          setStatus('error');
          setMessage('Bạn đã hủy thanh toán');
          return;
        }

        if (code !== '00' || paymentStatus !== 'PAID') {
          setStatus('error');
          setMessage('Thanh toán thất bại. Vui lòng thử lại.');
          return;
        }

        if (!orderCode) {
          setStatus('error');
          setMessage('Không tìm thấy thông tin đơn hàng');
          return;
        }

        // Confirm payment with backend
        const response = await axios.post(
          `${API_BASE_URL}/payment/payos/confirm`,
          { orderCode: parseInt(orderCode) }
        );

        if (response.data.success) {
          setStatus('success');
          setMessage('Thanh toán thành công!');
          
          // Redirect to my tickets after 2 seconds
          setTimeout(() => {
            navigate('/my-tickets');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Có lỗi xảy ra');
        }
      } catch (error: any) {
        console.error('Payment confirmation failed:', error);
        setStatus('error');
        setMessage('Không thể xác nhận thanh toán. Vui lòng liên hệ hỗ trợ.');
      }
    };

    confirmPayment();
  }, [searchParams, navigate]);

  return (
    <div className="payment-result-page">
      {status === 'loading' && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang xác nhận thanh toán...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="success">
          <div className="icon">✅</div>
          <h1>Thanh toán thành công!</h1>
          <p>{message}</p>
          <p className="redirect-info">
            Đang chuyển đến trang vé của bạn...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="error">
          <div className="icon">❌</div>
          <h1>Thanh toán thất bại</h1>
          <p>{message}</p>
          <button onClick={() => navigate('/events')} className="btn">
            Quay lại trang chủ
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## ⚠️ Error Handling

### Common Errors:

#### 1. **400 Bad Request - Return URL không hợp lệ**
```json
{
  "message": ["Return URL không hợp lệ"],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Nguyên nhân:** 
- Return URL không hợp lệ
- Domain không được phép (trong production)

**Giải pháp:**
```typescript
// ✅ ĐÚNG
return_url: "http://localhost:5173/payment/result"
return_url: "https://yourdomain.com/payment/result?order_id=xxx"

// ❌ SAI
return_url: "invalid-url"
return_url: "ftp://localhost:5173"
```

---

#### 2. **400 Bad Request - Lỗi tạo payment link**
```json
{
  "message": "Lỗi tạo payment link: HTTP 200, description: Mô tả tối đa 25 kí tự (code: 20)",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Nguyên nhân:** PayOS giới hạn description 25 ký tự (đã fix ở backend)

---

#### 3. **403 Forbidden**
```json
{
  "message": "Bạn không có quyền truy cập đơn hàng này",
  "error": "Forbidden",
  "statusCode": 403
}
```

**Nguyên nhân:** 
- Không phải owner của order
- Không có quyền truy cập

**Giải pháp:** Đảm bảo user đã login và đang truy cập order của mình

---

#### 4. **404 Not Found**
```json
{
  "message": "Không tìm thấy đơn hàng",
  "error": "Not Found",
  "statusCode": 404
}
```

**Nguyên nhân:** Order ID không tồn tại

---

### Error Handling Example:

```typescript
try {
  const result = await initiatePayment(orderId, data, accessToken);
  window.location.href = result.payment_url;
} catch (error: any) {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        setError(data.message?.[0] || 'Yêu cầu không hợp lệ');
        break;
      case 403:
        setError('Bạn không có quyền thực hiện thanh toán này');
        break;
      case 404:
        setError('Không tìm thấy đơn hàng');
        break;
      default:
        setError('Có lỗi xảy ra. Vui lòng thử lại sau');
    }
  } else {
    setError('Không thể kết nối đến server');
  }
}
```

---

## 🧪 Testing

### Test Scenarios:

#### 1. **Happy Path - Thanh toán thành công**
```
1. Create order with valid data
2. Initiate payment with PAYOS
3. Redirect to PayOS page
4. Complete payment (test account)
5. Return to frontend with status=PAID
6. Confirm payment via API
7. Check order status → PAID
8. View tickets in My Tickets
```

#### 2. **User cancels payment**
```
1. Create order
2. Initiate payment
3. Redirect to PayOS
4. Click "Hủy" button
5. Return with status=CANCELLED
6. Show error message
7. Order remains PENDING
```

#### 3. **Payment timeout**
```
1. Create order
2. Initiate payment
3. Wait > 15 minutes without paying
4. Payment link expires
5. Order remains PENDING
```

---

### Test Data:

#### Sample Order Creation:
```json
{
  "event_id": "oda35c00-3bfd-444b-98f7-2be8876f6825",
  "customer_name": "Nguyen Van A",
  "customer_email": "test@example.com",
  "customer_phone": "0912345678",
  "items": [
    {
      "ticket_type_id": "uuid-of-ticket-type",
      "quantity": 2
    }
  ]
}
```

#### PayOS Return URL Examples:
```
✅ Success:
http://localhost:5173/payment/result?code=00&id=xxx&cancel=false&status=PAID&orderCode=1765377457668

❌ Cancelled:
http://localhost:5173/payment/result?code=99&cancel=true&status=CANCELLED&orderCode=1765377457668

❌ Failed:
http://localhost:5173/payment/result?code=24&status=FAILED&orderCode=1765377457668
```

---

## ✅ Best Practices

### 1. **Security**
```typescript
// ✅ ĐÚNG: Sử dụng HTTPS trong production
const return_url = `${window.location.protocol}//${window.location.host}/payment/result`;

// ❌ SAI: Hardcode HTTP
const return_url = "http://yourdomain.com/payment/result";
```

---

### 2. **User Experience**
```typescript
// Show loading state during payment initiation
const [loading, setLoading] = useState(false);

const handlePayment = async () => {
  setLoading(true);
  try {
    // ... initiate payment
  } finally {
    setLoading(false);
  }
};

// Disable button while processing
<button disabled={loading}>
  {loading ? 'Đang xử lý...' : 'Thanh toán'}
</button>
```

---

### 3. **Error Recovery**
```typescript
// Allow retry after error
const [error, setError] = useState<string | null>(null);

return (
  <>
    {error && (
      <div className="alert alert-error">
        {error}
        <button onClick={() => setError(null)}>Thử lại</button>
      </div>
    )}
  </>
);
```

---

### 4. **Payment Expiration**
```typescript
// Show countdown timer for payment expiration
const expiresAt = new Date(paymentData.expires_at);
const [timeLeft, setTimeLeft] = useState<number>(0);

useEffect(() => {
  const interval = setInterval(() => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
  }, 1000);

  return () => clearInterval(interval);
}, [expiresAt]);

// Display: "Còn 14:35 để hoàn tất thanh toán"
```

---

### 5. **Logging & Debugging**
```typescript
// Log payment flow for debugging
console.log('[Payment] Initiating payment for order:', orderId);
console.log('[Payment] Payment URL:', paymentUrl);
console.log('[Payment] Return URL params:', {
  code: searchParams.get('code'),
  status: searchParams.get('status'),
  orderCode: searchParams.get('orderCode'),
});
```

---

## 📊 Payment Status Mapping

| PayOS Status | Backend Status | Frontend Display |
|--------------|----------------|------------------|
| `PAID` | `PAID` | ✅ Thanh toán thành công |
| `CANCELLED` | `UNPAID` | ❌ Đã hủy thanh toán |
| `PENDING` | `UNPAID` | ⏳ Đang chờ thanh toán |
| `EXPIRED` | `UNPAID` | ⌛ Hết hạn thanh toán |
| `FAILED` | `UNPAID` | ❌ Thanh toán thất bại |

---

## 🔗 Useful Links

- **Backend API:** `http://localhost:3000` (Development)
- **PayOS Dashboard:** https://my.payos.vn/
- **PayOS Docs:** https://payos.vn/docs/
- **Project README:** [../README.md](../README.md)
- **PayOS Integration Guide:** [../PAYOS_INTEGRATION_GUIDE.md](../PAYOS_INTEGRATION_GUIDE.md)

---

## 📞 Support

Nếu gặp vấn đề, liên hệ:
- **Backend Team:** Kiểm tra logs, database
- **PayOS Support:** support@payos.vn
- **Documentation:** Đọc lại guide này

---

## 📝 Change Log

### Version 1.0 (2025-12-10)
- ✅ Initial release
- ✅ PayOS integration complete
- ✅ Return URL confirmation endpoint
- ✅ Error handling
- ✅ Testing guide

---

**Happy Coding! 🚀**

