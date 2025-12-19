# REFUND MODULE - FRONTEND INTEGRATION GUIDE

**Ngày:** 25/12/2024  
**Version:** 1.0.0  
**Status:** ✅ Ready for Integration

---

## 📋 TỔNG QUAN

Refund Module cho phép hệ thống tự động hoàn tiền 100% cho khách hàng khi organizer hủy sự kiện. Module này được tích hợp tự động vào flow cancel event, không cần frontend trigger thủ công.

### Tính năng chính

- ✅ **Tự động refund**: Khi event bị hủy, tự động refund 100% cho tất cả orders đã thanh toán
- ✅ **Xem refund requests**: Customer và Admin có thể xem lịch sử refund
- ✅ **Email notification**: Tự động gửi email thông báo khi refund thành công
- ✅ **Multi-payment gateway**: Hỗ trợ VNPAY và PayOS

---

## 🔄 FLOW HOẠT ĐỘNG

### Flow tự động khi cancel event

```
1. Organizer hủy event
   POST /events/:id/cancel
   ↓
2. Backend tự động:
   - Tìm tất cả orders đã PAID
   - Tạo refund requests
   - Process refund qua payment gateway
   - Update tickets, orders, revenue shares
   - Gửi email notification
   ↓
3. Frontend chỉ cần:
   - Hiển thị thông báo refund đang được xử lý
   - Có thể check refund status sau
```

### Flow xem refund requests

```
Customer/Admin → GET /refunds hoặc GET /refunds/my/refunds
   ↓
Hiển thị danh sách refund requests
   ↓
Click vào item → GET /refunds/:id
   ↓
Hiển thị chi tiết refund request
```

---

## 📡 API ENDPOINTS

### Base URL
```
Production: https://api.example.com
Development: http://localhost:3000
```

### Authentication
Tất cả endpoints đều yêu cầu JWT token:
```
Authorization: Bearer {access_token}
```

---

### 1. Xem danh sách refund requests (Admin)

**Endpoint**: `GET /refunds`

**Quyền**: `PLATFORM_ADMIN`, `ORGANIZER_ADMIN`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | `string` | No | Filter theo status: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `event_id` | `uuid` | No | Filter theo event ID |
| `page` | `number` | No | Số trang (default: 1) |
| `limit` | `number` | No | Số items mỗi trang (default: 20) |

**Request Example**:
```typescript
const response = await fetch('/refunds?status=COMPLETED&page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Response Example**:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "order_id": "660e8400-e29b-41d4-a716-446655440001",
      "ticket_ids": [
        "770e8400-e29b-41d4-a716-446655440002",
        "770e8400-e29b-41d4-a716-446655440003"
      ],
      "reason": "Event cancelled: Thời tiết xấu",
      "refund_amount": "1000000.00",
      "refund_type": "AUTOMATIC",
      "status": "COMPLETED",
      "payment_method": "VNPAY",
      "external_refund_id": "vnpay-refund-123456",
      "admin_note": null,
      "processed_by": null,
      "processed_at": "2024-12-25T10:00:00.000Z",
      "created_at": "2024-12-25T09:00:00.000Z",
      "updated_at": "2024-12-25T10:00:00.000Z",
      "order": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "order_number": "ORD-20241225-ABC123",
        "total_amount": "1000000.00",
        "payment_status": "REFUNDED",
        "user": {
          "id": "880e8400-e29b-41d4-a716-446655440004",
          "email": "customer@example.com",
          "full_name": "Nguyễn Văn A"
        },
        "event": {
          "id": "990e8400-e29b-41d4-a716-446655440005",
          "title": "Tech Conference 2024",
          "slug": "tech-conference-2024"
        }
      },
      "processor": null
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "total_pages": 3
  }
}
```

**TypeScript Interface**:
```typescript
interface RefundRequest {
  id: string;
  order_id: string;
  ticket_ids: string[];
  reason: string;
  refund_amount: string; // Decimal as string
  refund_type: 'MANUAL' | 'AUTOMATIC';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  payment_method: 'VNPAY' | 'PAYOS' | null;
  external_refund_id: string | null;
  admin_note: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  order: {
    id: string;
    order_number: string;
    total_amount: string;
    payment_status: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
    user: {
      id: string;
      email: string;
      full_name: string;
    };
    event: {
      id: string;
      title: string;
      slug: string;
    };
  };
  processor: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

interface RefundsResponse {
  data: RefundRequest[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
```

---

### 2. Xem chi tiết refund request

**Endpoint**: `GET /refunds/:id`

**Quyền**: 
- `PLATFORM_ADMIN`, `ORGANIZER_ADMIN`: Xem được tất cả
- `CUSTOMER`: Chỉ xem được refund của chính mình

**Request Example**:
```typescript
const refundId = '550e8400-e29b-41d4-a716-446655440000';
const response = await fetch(`/refunds/${refundId}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Response Example**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "order_id": "660e8400-e29b-41d4-a716-446655440001",
  "ticket_ids": [
    "770e8400-e29b-41d4-a716-446655440002",
    "770e8400-e29b-41d4-a716-446655440003"
  ],
  "reason": "Event cancelled: Thời tiết xấu",
  "refund_amount": "1000000.00",
  "refund_type": "AUTOMATIC",
  "status": "COMPLETED",
  "payment_method": "VNPAY",
  "external_refund_id": "vnpay-refund-123456",
  "admin_note": null,
  "processed_by": null,
  "processed_at": "2024-12-25T10:00:00.000Z",
  "created_at": "2024-12-25T09:00:00.000Z",
  "updated_at": "2024-12-25T10:00:00.000Z",
  "order": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "order_number": "ORD-20241225-ABC123",
    "total_amount": "1000000.00",
    "payment_status": "REFUNDED",
    "user": {
      "id": "880e8400-e29b-41d4-a716-446655440004",
      "email": "customer@example.com",
      "full_name": "Nguyễn Văn A"
    },
    "event": {
      "id": "990e8400-e29b-41d4-a716-446655440005",
      "title": "Tech Conference 2024",
      "slug": "tech-conference-2024"
    },
    "tickets": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "ticket_serial": "VIP-000001",
        "status": "REFUNDED"
      },
      {
        "id": "770e8400-e29b-41d4-a716-446655440003",
        "ticket_serial": "VIP-000002",
        "status": "REFUNDED"
      }
    ]
  },
  "processor": null
}
```

---

### 3. Xem refund requests của user

**Endpoint**: `GET /refunds/my/refunds`

**Quyền**: `CUSTOMER` (chỉ xem refund của chính mình)

**Query Parameters**: Tương tự `GET /refunds`

**Request Example**:
```typescript
const response = await fetch('/refunds/my/refunds?status=COMPLETED', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Response**: Tương tự `GET /refunds`, nhưng chỉ trả về refund của user hiện tại

---

## 🎨 UI/UX RECOMMENDATIONS

### 1. Event Cancel Confirmation Dialog

Khi organizer click "Hủy sự kiện", hiển thị dialog:

```typescript
// Dialog content
{
  title: "Xác nhận hủy sự kiện",
  message: `
    Bạn có chắc chắn muốn hủy sự kiện này không?
    
    ⚠️ Lưu ý:
    - Tất cả khách hàng đã mua vé sẽ được hoàn tiền 100% tự động
    - Sự kiện sẽ không thể khôi phục sau khi hủy
    - Email thông báo sẽ được gửi tự động cho khách hàng
  `,
  confirmText: "Hủy sự kiện",
  cancelText: "Hủy",
  type: "warning"
}
```

### 2. Refund Status Badge

Hiển thị badge theo status:

```typescript
const statusConfig = {
  PENDING: {
    label: 'Chờ xử lý',
    color: 'yellow',
    icon: 'clock'
  },
  PROCESSING: {
    label: 'Đang xử lý',
    color: 'blue',
    icon: 'spinner'
  },
  COMPLETED: {
    label: 'Đã hoàn tiền',
    color: 'green',
    icon: 'check-circle'
  },
  FAILED: {
    label: 'Thất bại',
    color: 'red',
    icon: 'x-circle'
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: 'gray',
    icon: 'ban'
  }
};
```

### 3. Refund List Component

```typescript
// RefundList.tsx
interface RefundListProps {
  refunds: RefundRequest[];
  loading?: boolean;
  onRefundClick?: (refund: RefundRequest) => void;
}

// Display:
// - Refund ID
// - Order number
// - Event title
// - Refund amount
// - Status badge
// - Created date
// - Click để xem chi tiết
```

### 4. Refund Detail Component

```typescript
// RefundDetail.tsx
interface RefundDetailProps {
  refund: RefundRequest;
}

// Display:
// - Refund information card
// - Order information
// - Event information
// - Ticket list (refunded tickets)
// - Timeline (created → processing → completed)
// - Refund amount với format VND
// - External refund ID (nếu có)
```

### 5. Customer Notification

Sau khi event cancelled, hiển thị notification cho customer:

```typescript
// Notification content
{
  type: 'info',
  title: 'Sự kiện đã bị hủy',
  message: `
    Sự kiện "${eventTitle}" đã bị hủy bởi người tổ chức.
    
    💰 Hoàn tiền:
    - Số tiền: ${formatCurrency(refundAmount)} VNĐ
    - Trạng thái: Đang xử lý
    - Thời gian hoàn tiền: 3-5 ngày làm việc
    
    Tiền sẽ được chuyển về phương thức thanh toán ban đầu của bạn.
  `,
  action: {
    label: 'Xem chi tiết refund',
    onClick: () => navigate(`/refunds/${refundId}`)
  }
}
```

---

## 🔔 EVENT CANCEL FLOW

### Khi cancel event thành công

**Response từ `POST /events/:id/cancel`**:
```json
{
  "id": "event-uuid",
  "title": "Tech Conference 2024",
  "status": "CANCELLED",
  "cancelled_at": "2024-12-25T09:00:00.000Z",
  "refunds_processed": 3,  // ← Số refund requests đã được tạo
  "refunds_total_amount": 3000000  // ← Tổng số tiền refund
}
```

**Frontend cần làm**:
1. Hiển thị success message
2. Update event status trong UI
3. Hiển thị thông báo về refund (nếu có orders đã paid)
4. Có thể redirect đến refund list page

**Example**:
```typescript
const handleCancelEvent = async (eventId: string, reason: string) => {
  try {
    const response = await cancelEvent(eventId, reason);
    
    if (response.refunds_processed > 0) {
      showNotification({
        type: 'success',
        title: 'Sự kiện đã được hủy',
        message: `Đã tự động tạo ${response.refunds_processed} refund requests. Tổng số tiền: ${formatCurrency(response.refunds_total_amount)} VNĐ`
      });
    }
    
    // Update UI
    updateEventStatus(eventId, 'CANCELLED');
    
    // Redirect hoặc refresh
    navigate(`/events/${eventId}`);
  } catch (error) {
    showError(error.message);
  }
};
```

---

## 📊 REFUND STATUS TRACKING

### Polling refund status (optional)

Nếu muốn real-time update refund status:

```typescript
// Poll refund status mỗi 5 giây
const pollRefundStatus = async (refundId: string) => {
  const interval = setInterval(async () => {
    const refund = await getRefundDetail(refundId);
    
    if (refund.status === 'COMPLETED' || refund.status === 'FAILED') {
      clearInterval(interval);
      updateRefundStatus(refund);
      showNotification({
        type: refund.status === 'COMPLETED' ? 'success' : 'error',
        title: `Refund ${refund.status === 'COMPLETED' ? 'thành công' : 'thất bại'}`,
        message: refund.status === 'COMPLETED' 
          ? 'Tiền đã được hoàn về tài khoản của bạn'
          : refund.admin_note || 'Vui lòng liên hệ hỗ trợ'
      });
    }
  }, 5000);
  
  return () => clearInterval(interval);
};
```

---

## 🎯 USE CASES

### Use Case 1: Customer xem refund của mình

**Flow**:
1. Customer vào trang "My Refunds" hoặc "My Orders"
2. Click vào order đã refund
3. Xem chi tiết refund

**UI**:
```
My Refunds Page
├── Filter: All | Pending | Completed | Failed
├── Refund List
│   ├── Order: ORD-123456
│   ├── Event: Tech Conference 2024
│   ├── Amount: 1,000,000 VNĐ
│   ├── Status: ✅ Completed
│   └── Date: 25/12/2024
└── Click → Refund Detail Page
```

### Use Case 2: Admin xem refund requests

**Flow**:
1. Admin vào trang "Refunds Management"
2. Filter theo status, event
3. Xem chi tiết refund
4. Có thể export report

**UI**:
```
Refunds Management Page
├── Filters
│   ├── Status: [Dropdown]
│   ├── Event: [Search]
│   └── Date Range: [DatePicker]
├── Refund List Table
│   ├── Order Number
│   ├── Customer Name
│   ├── Event Title
│   ├── Refund Amount
│   ├── Status
│   ├── Payment Method
│   ├── Created Date
│   └── Actions: [View Detail]
└── Pagination
```

### Use Case 3: Event cancelled notification

**Flow**:
1. Customer nhận email về refund
2. Customer vào app/website
3. Thấy notification về refund
4. Click để xem chi tiết

**UI**:
```
Notification Center
├── 🔔 New Notification
│   ├── Title: "Sự kiện đã bị hủy - Hoàn tiền"
│   ├── Message: "Tech Conference 2024 đã bị hủy. Bạn sẽ được hoàn tiền 1,000,000 VNĐ"
│   └── Action: [Xem chi tiết]
```

---

## ⚠️ ERROR HANDLING

### Common Errors

#### 1. Unauthorized (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```
**Action**: Redirect to login page

#### 2. Forbidden (403)
```json
{
  "statusCode": 403,
  "message": "Bạn không có quyền xem refund request này"
}
```
**Action**: Show error message, redirect to home

#### 3. Not Found (404)
```json
{
  "statusCode": 404,
  "message": "Không tìm thấy refund request"
}
```
**Action**: Show error message, redirect to refund list

#### 4. Validation Error (400)
```json
{
  "statusCode": 400,
  "message": ["status must be a valid enum value"],
  "error": "Bad Request"
}
```
**Action**: Show validation errors

### Error Handling Example

```typescript
const handleGetRefunds = async () => {
  try {
    setLoading(true);
    const response = await getRefunds({ status: 'COMPLETED' });
    setRefunds(response.data);
  } catch (error) {
    if (error.status === 401) {
      // Unauthorized - redirect to login
      router.push('/login');
    } else if (error.status === 403) {
      // Forbidden - show error
      showError('Bạn không có quyền truy cập');
    } else if (error.status === 404) {
      // Not found
      showError('Không tìm thấy refund requests');
    } else {
      // Other errors
      showError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 🧪 TESTING GUIDE

### Test Cases

#### 1. Test xem refund list (Admin)
```typescript
// Test: Admin có thể xem tất cả refund requests
test('Admin can view all refund requests', async () => {
  const response = await getRefunds({}, adminToken);
  expect(response.status).toBe(200);
  expect(response.data.data).toBeInstanceOf(Array);
});
```

#### 2. Test xem refund của user
```typescript
// Test: User chỉ xem được refund của mình
test('User can only view own refunds', async () => {
  const response = await getMyRefunds({}, userToken);
  expect(response.status).toBe(200);
  response.data.data.forEach(refund => {
    expect(refund.order.user_id).toBe(userId);
  });
});
```

#### 3. Test filter refunds
```typescript
// Test: Filter refunds by status
test('Filter refunds by status', async () => {
  const response = await getRefunds({ status: 'COMPLETED' }, adminToken);
  expect(response.status).toBe(200);
  response.data.data.forEach(refund => {
    expect(refund.status).toBe('COMPLETED');
  });
});
```

#### 4. Test refund detail
```typescript
// Test: View refund detail
test('View refund detail', async () => {
  const refundId = 'refund-uuid';
  const response = await getRefundDetail(refundId, userToken);
  expect(response.status).toBe(200);
  expect(response.data.id).toBe(refundId);
});
```

---

## 📝 FORMATTING HELPERS

### Format Currency

```typescript
const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(numAmount);
};

// Example: formatCurrency(1000000) => "1.000.000 ₫"
```

### Format Date

```typescript
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Example: formatDate('2024-12-25T10:00:00.000Z') => "25/12/2024, 17:00"
```

### Get Status Badge Config

```typescript
const getRefundStatusConfig = (status: RefundStatus) => {
  const configs = {
    PENDING: { label: 'Chờ xử lý', color: 'yellow', icon: 'clock' },
    PROCESSING: { label: 'Đang xử lý', color: 'blue', icon: 'spinner' },
    COMPLETED: { label: 'Đã hoàn tiền', color: 'green', icon: 'check-circle' },
    FAILED: { label: 'Thất bại', color: 'red', icon: 'x-circle' },
    CANCELLED: { label: 'Đã hủy', color: 'gray', icon: 'ban' },
  };
  return configs[status];
};
```

---

## 🔗 RELATED ENDPOINTS

### Event Cancel
- `POST /events/:id/cancel` - Hủy sự kiện (tự động trigger refund)

### Orders
- `GET /orders/:id` - Xem chi tiết order (có thể có refund info)
- `GET /orders` - Xem danh sách orders (filter by payment_status=REFUNDED)

### My Tickets
- `GET /my-tickets` - Xem vé của user (filter by status=REFUNDED)

---

## 📞 SUPPORT

Nếu có thắc mắc hoặc vấn đề khi tích hợp, vui lòng liên hệ:

- **Email**: dev@example.com
- **Slack**: #frontend-support
- **Documentation**: https://docs.example.com/api/refunds

---

## 📚 ADDITIONAL RESOURCES

- [API Documentation](./README.md)
- [Refund Flow Diagram](./09_QUY_TRINH_REFUND.md)
- [Payment Gateway Integration](./PAYMENT_MODULE_UPDATES.md)

---

**Chúc bạn tích hợp thành công! 🚀**

