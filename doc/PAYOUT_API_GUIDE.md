# Payout API Integration Guide

Tài liệu hướng dẫn tích hợp API Payout và Auto-Complete Events cho Frontend.

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [API Endpoints](#2-api-endpoints)
3. [Data Types](#3-data-types)
4. [Flow tích hợp](#4-flow-tích-hợp)
5. [UI Components gợi ý](#5-ui-components-gợi-ý)

---

## 1. Tổng quan hệ thống

### 1.1. Auto-Complete Events
- Sự kiện tự động chuyển sang `COMPLETED` sau khi kết thúc **2 giờ**
- Frontend không cần xử lý gì, chỉ cần hiển thị status mới

### 1.2. Manual Payout Flow
```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  Organizer   │       │    Admin     │       │  Mock Bank   │
│  Dashboard   │       │   Dashboard  │       │    (API)     │
└──────┬───────┘       └──────┬───────┘       └──────┬───────┘
       │                      │                      │
       │ 1. Xem số dư         │                      │
       │ GET /balance         │                      │
       │<─────────────────────│                      │
       │                      │                      │
       │ 2. Tạo yêu cầu       │                      │
       │ POST /request        │                      │
       │─────────────────────>│                      │
       │                      │                      │
       │                      │ 3. Xem danh sách     │
       │                      │ GET /payouts         │
       │                      │<─────────────────────│
       │                      │                      │
       │                      │ 4. Xử lý thanh toán  │
       │                      │ POST /:id/process    │
       │                      │─────────────────────>│
       │                      │     (2s delay)       │
       │                      │<─────────────────────│
       │                      │                      │
       │ 5. Xem lịch sử       │                      │
       │ GET /organizations/:id│                     │
       │<─────────────────────│                      │
       │                      │                      │
```

---

## 2. API Endpoints

### 2.1. Organizer Endpoints

#### GET `/payouts/organizations/:organizationId/balance`
Lấy số dư của organization.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Tổ chức ABC",
  "total_revenue": 10000000,
  "available_balance": 5000000,
  "pending_balance": 3000000,
  "total_paid_out": 2000000,
  "payout_enabled": true,
  "has_bank_info": true
}
```

| Field | Type | Mô tả |
|-------|------|-------|
| `total_revenue` | number | Tổng doanh thu từ trước đến nay |
| `available_balance` | number | Số tiền có thể rút ngay |
| `pending_balance` | number | Số tiền đang chờ (event chưa kết thúc + 3 ngày) |
| `total_paid_out` | number | Tổng số tiền đã rút |
| `payout_enabled` | boolean | Tính năng rút tiền có được bật không |
| `has_bank_info` | boolean | Đã cập nhật thông tin ngân hàng chưa |

---

#### POST `/payouts/organizations/:organizationId/request`
Tạo yêu cầu rút tiền.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 500000  // Optional - nếu không truyền sẽ rút hết available_balance
}
```

**Response (201):**
```json
{
  "id": "payout-uuid",
  "amount": 500000,
  "bank_account": "1234567890",
  "bank_name": "Vietcombank",
  "account_holder": "NGUYEN VAN A",
  "status": "PENDING",
  "organization": {
    "id": "org-uuid",
    "name": "Tổ chức ABC"
  },
  "created_at": "2025-12-28T09:00:00.000Z"
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | `Vui lòng cập nhật thông tin ngân hàng trước khi yêu cầu rút tiền` |
| 400 | `Tính năng rút tiền chưa được kích hoạt cho tổ chức này` |
| 400 | `Số tiền rút phải lớn hơn 0` |
| 400 | `Số dư khả dụng không đủ. Hiện có: X VNĐ` |
| 400 | `Đã có yêu cầu rút tiền đang chờ xử lý. Vui lòng đợi admin duyệt.` |

---

#### GET `/payouts/organizations/:organizationId`
Lấy lịch sử payout của organization.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": "payout-uuid",
    "amount": 500000,
    "bank_account": "1234567890",
    "bank_name": "Vietcombank",
    "account_holder": "NGUYEN VAN A",
    "status": "COMPLETED",
    "transaction_code": "MOCK_VNP_1735376400000_1234",
    "note": null,
    "processor": {
      "id": "admin-uuid",
      "full_name": "Admin",
      "email": "admin@example.com"
    },
    "processed_at": "2025-12-28T10:00:00.000Z",
    "created_at": "2025-12-28T09:00:00.000Z"
  }
]
```

---

### 2.2. Admin Endpoints (PLATFORM_ADMIN only)

#### GET `/payouts`
Lấy danh sách tất cả payouts.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `status` | string | - | Filter by status: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `page` | number | 1 | Trang hiện tại |
| `limit` | number | 20 | Số items mỗi trang |

**Response (200):**
```json
{
  "data": [
    {
      "id": "payout-uuid",
      "amount": 500000,
      "bank_account": "1234567890",
      "bank_name": "Vietcombank",
      "account_holder": "NGUYEN VAN A",
      "status": "PENDING",
      "transaction_code": null,
      "note": null,
      "organization": {
        "id": "org-uuid",
        "name": "Tổ chức ABC",
        "slug": "to-chuc-abc"
      },
      "processor": null,
      "processed_at": null,
      "created_at": "2025-12-28T09:00:00.000Z"
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

---

#### GET `/payouts/:id`
Lấy chi tiết một payout.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "payout-uuid",
  "amount": 500000,
  "bank_account": "1234567890",
  "bank_name": "Vietcombank",
  "account_holder": "NGUYEN VAN A",
  "status": "PENDING",
  "transaction_code": null,
  "note": null,
  "organization": {
    "id": "org-uuid",
    "name": "Tổ chức ABC",
    "slug": "to-chuc-abc",
    "available_balance": 4500000,
    "pending_balance": 3000000,
    "total_paid_out": 2000000
  },
  "processor": null,
  "processed_at": null,
  "created_at": "2025-12-28T09:00:00.000Z",
  "updated_at": "2025-12-28T09:00:00.000Z"
}
```

---

#### POST `/payouts/:id/process`
Admin xử lý thanh toán (bấm nút "Thanh toán ngay").

> ⚠️ **Lưu ý:** API này có delay ~2 giây do gọi Mock Bank. Hiển thị loading spinner.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Thanh toán thành công!",
  "payout_id": "payout-uuid",
  "transaction_code": "MOCK_VNP_1735376400000_1234",
  "amount": 500000,
  "processed_at": "2025-12-28T10:00:00.000Z"
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | `Yêu cầu này đã được thanh toán` |
| 400 | `Yêu cầu này đang được xử lý` |
| 400 | `Yêu cầu này đã thất bại. Vui lòng tạo yêu cầu mới.` |
| 400 | `Số dư không đủ. Hiện có: X VNĐ` |
| 400 | `Lỗi ngân hàng: ...` (1% chance) |

---

#### POST `/payouts/mature-shares`
Trigger mature revenue shares thủ công (dev/testing).

**Response (200):**
```json
{
  "matured": 5
}
```

---

## 3. Data Types

### 3.1. PayoutStatus Enum
```typescript
enum PayoutStatus {
  PENDING = 'PENDING',       // Chờ admin xử lý
  PROCESSING = 'PROCESSING', // Đang gọi ngân hàng
  COMPLETED = 'COMPLETED',   // Thành công
  FAILED = 'FAILED'          // Thất bại
}
```

### 3.2. Status Badge Colors
```typescript
const statusColors = {
  PENDING: 'yellow',    // ⏳ Chờ xử lý
  PROCESSING: 'blue',   // 🔄 Đang xử lý
  COMPLETED: 'green',   // ✅ Thành công
  FAILED: 'red'         // ❌ Thất bại
};
```

### 3.3. Vietnamese Labels
```typescript
const statusLabels = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Thành công',
  FAILED: 'Thất bại'
};
```

---

## 4. Flow tích hợp

### 4.1. Organizer Dashboard

#### Màn hình Số dư (Balance)
1. Call `GET /payouts/organizations/:orgId/balance`
2. Hiển thị các số liệu:
   - **Số dư khả dụng**: `available_balance` (nổi bật, có thể rút)
   - **Đang chờ**: `pending_balance` (event chưa kết thúc + 3 ngày)
   - **Đã rút**: `total_paid_out`
3. Nút "Rút tiền" → disabled nếu `!payout_enabled || !has_bank_info || available_balance <= 0`

#### Màn hình Yêu cầu rút tiền
1. Input số tiền (max = `available_balance`)
2. Submit → Call `POST /payouts/organizations/:orgId/request`
3. Success → Hiển thị thông báo + redirect về lịch sử

#### Màn hình Lịch sử rút tiền
1. Call `GET /payouts/organizations/:orgId`
2. Hiển thị table với columns: Ngày, Số tiền, Ngân hàng, Trạng thái, Mã GD

---

### 4.2. Admin Dashboard

#### Màn hình Danh sách Payouts
1. Call `GET /payouts?status=PENDING` (mặc định filter PENDING)
2. Tabs filter: Tất cả | Chờ xử lý | Đang xử lý | Thành công | Thất bại
3. Table với columns: Tổ chức, Số tiền, Ngân hàng, Trạng thái, Ngày tạo, Actions

#### Màn hình Chi tiết Payout
1. Call `GET /payouts/:id`
2. Hiển thị thông tin chi tiết
3. Nút "Thanh toán ngay" (chỉ hiện khi status = PENDING)

#### Xử lý thanh toán
```typescript
const handleProcess = async (payoutId: string) => {
  setLoading(true);
  try {
    const result = await api.post(`/payouts/${payoutId}/process`);
    toast.success('Thanh toán thành công!');
    // Refresh data
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 5. UI Components gợi ý

### 5.1. BalanceCard (Organizer)
```jsx
<Card>
  <CardHeader>
    <Title>Số dư tài khoản</Title>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      <StatBox label="Khả dụng" value={formatVND(available_balance)} color="green" />
      <StatBox label="Đang chờ" value={formatVND(pending_balance)} color="yellow" />
      <StatBox label="Đã rút" value={formatVND(total_paid_out)} />
    </div>
    <Button onClick={handleWithdraw} disabled={!canWithdraw}>
      Rút tiền
    </Button>
  </CardContent>
</Card>
```

### 5.2. PayoutStatusBadge
```jsx
const PayoutStatusBadge = ({ status }) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800'
  };
  
  const labels = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang xử lý',
    COMPLETED: 'Thành công',
    FAILED: 'Thất bại'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-sm ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};
```

### 5.3. ProcessPayoutButton (Admin)
```jsx
const ProcessPayoutButton = ({ payoutId, status, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  if (status !== 'PENDING') return null;
  
  const handleProcess = async () => {
    if (!confirm('Xác nhận thanh toán?')) return;
    
    setLoading(true);
    try {
      await api.post(`/payouts/${payoutId}/process`);
      toast.success('Thanh toán thành công!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button onClick={handleProcess} loading={loading}>
      {loading ? 'Đang xử lý...' : 'Thanh toán ngay'}
    </Button>
  );
};
```

---

## 6. Helper Functions

```typescript
// Format tiền VNĐ
const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// Format date
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Mask bank account
const maskBankAccount = (account: string): string => {
  if (account.length <= 4) return account;
  return '*'.repeat(account.length - 4) + account.slice(-4);
};
```

---

## 7. Error Handling

Tất cả errors trả về format:
```json
{
  "statusCode": 400,
  "message": "Error message in Vietnamese",
  "error": "Bad Request"
}
```

Hiển thị `response.data.message` cho user.
