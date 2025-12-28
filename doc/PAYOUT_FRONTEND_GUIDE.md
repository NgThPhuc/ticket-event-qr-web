# 💰 PAYOUT SYSTEM - HƯỚNG DẪN TÍCH HỢP FRONTEND

> **Version:** 1.0  
> **Cập nhật:** 28/12/2024  
> **Backend API Base URL:** `http://localhost:3000`

---

## 📋 MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Flow Hoạt Động](#2-flow-hoạt-động)
3. [API Endpoints](#3-api-endpoints)
4. [Data Models](#4-data-models)
5. [Các Màn Hình Cần Xây Dựng](#5-các-màn-hình-cần-xây-dựng)
6. [Xử Lý Lỗi](#6-xử-lý-lỗi)
7. [Demo Flow](#7-demo-flow)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Mô tả

Hệ thống Payout cho phép **Nhà tổ chức (Organizer)** rút tiền doanh thu từ việc bán vé sự kiện. Quy trình hoạt động theo mô hình **bán thủ công**:

1. Khách hàng mua vé → Doanh thu được ghi nhận
2. Sau event kết thúc + 3 ngày → Tiền chuyển từ "đang chờ" sang "khả dụng"
3. Organizer tạo yêu cầu rút tiền
4. Platform Admin xét duyệt và xử lý

### 1.2 Các Loại Số Dư

| Loại | Mô tả | Có thể rút? |
|------|-------|-------------|
| `total_revenue` | Tổng doanh thu (gross) | ❌ |
| `pending_balance` | Số dư đang chờ (sau khi trừ phí platform) | ❌ |
| `available_balance` | Số dư khả dụng | ✅ |
| `total_paid_out` | Tổng đã rút | - |

### 1.3 Trạng Thái Payout

```
PENDING → PROCESSING → COMPLETED
                    ↘ FAILED
```

| Status | Mô tả | Badge Color |
|--------|-------|-------------|
| `PENDING` | Đang chờ Admin duyệt | 🟡 Yellow |
| `PROCESSING` | Đang xử lý chuyển khoản | 🔵 Blue |
| `COMPLETED` | Đã hoàn thành | 🟢 Green |
| `FAILED` | Thất bại | 🔴 Red |

---

## 2. FLOW HOẠT ĐỘNG

### 2.1 Revenue Flow (Luồng Doanh Thu)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        💰 REVENUE FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   [Customer mua vé - Thanh toán thành công]                        │
│                    │                                                │
│                    ▼                                                │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │  📊 TẠO REVENUE SHARE                                   │      │
│   │  ─────────────────────────────────────────              │      │
│   │  Gross Amount:      1,000,000 VND (100%)               │      │
│   │  Platform Fee (5%):   -50,000 VND                      │      │
│   │  ─────────────────────────────────────────              │      │
│   │  Net Amount:          950,000 VND → pending_balance    │      │
│   └─────────────────────────────────────────────────────────┘      │
│                    │                                                │
│                    │ (Event kết thúc + 3 ngày)                     │
│                    ▼                                                │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │  🔄 AUTO MATURE (Scheduler 2AM hàng ngày)              │      │
│   │  ─────────────────────────────────────────              │      │
│   │  pending_balance  -= 950,000                           │      │
│   │  available_balance += 950,000                          │      │
│   └─────────────────────────────────────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Payout Flow (Luồng Rút Tiền)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        💸 PAYOUT FLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   [Organizer có available_balance > 0]                             │
│                    │                                                │
│                    ▼                                                │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │  📝 TẠO YÊU CẦU RÚT TIỀN                                │      │
│   │  POST /payouts/organizations/:orgId/request             │      │
│   │  Status: PENDING                                        │      │
│   └─────────────────────────────────────────────────────────┘      │
│                    │                                                │
│                    ▼                                                │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │  🔍 ADMIN XÉT DUYỆT                                     │      │
│   │  GET /payouts (xem danh sách)                          │      │
│   │  GET /payouts/:id (xem chi tiết)                       │      │
│   └─────────────────────────────────────────────────────────┘      │
│                    │                                                │
│                    ▼                                                │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │  💳 XỬ LÝ THANH TOÁN                                    │      │
│   │  POST /payouts/:id/process                             │      │
│   │  Status: PROCESSING → COMPLETED/FAILED                 │      │
│   └─────────────────────────────────────────────────────────┘      │
│                    │                                                │
│                    ▼                                                │
│   ┌─────────────────────────────────────────────────────────┐      │
│   │  ✅ CẬP NHẬT SỐ DƯ                                      │      │
│   │  available_balance -= amount                           │      │
│   │  total_paid_out += amount                              │      │
│   └─────────────────────────────────────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. API ENDPOINTS

### 3.1 Authentication

Tất cả API đều yêu cầu JWT token:

```http
Authorization: Bearer {access_token}
```

---

### 3.2 ORGANIZER APIs

#### 📊 Xem số dư tổ chức

```http
GET /payouts/organizations/:organizationId/balance
```

**Response:**
```json
{
  "id": "org-uuid",
  "name": "Tên tổ chức",
  "total_revenue": 1000000,
  "pending_balance": 0,
  "available_balance": 950000,
  "total_paid_out": 0,
  "payout_enabled": true,
  "has_bank_info": true
}
```

**Lưu ý:**
- `payout_enabled = false` → Chưa được Admin kích hoạt tính năng rút tiền
- `has_bank_info = false` → Chưa cập nhật thông tin ngân hàng

---

#### 💰 Tạo yêu cầu rút tiền

```http
POST /payouts/organizations/:organizationId/request
Content-Type: application/json

{
  "amount": 950000  // Optional, mặc định = rút hết available_balance
}
```

**Response (Success - 201):**
```json
{
  "id": "payout-uuid",
  "amount": 950000,
  "bank_account": "1234567890",
  "bank_name": "Vietcombank",
  "account_holder": "NGUYEN VAN A",
  "status": "PENDING",
  "organization": {
    "id": "org-uuid",
    "name": "Tên tổ chức"
  },
  "created_at": "2024-12-28T15:00:00.000Z"
}
```

**Response (Error - 400):**
```json
{
  "statusCode": 400,
  "message": "Vui lòng cập nhật thông tin ngân hàng trước khi yêu cầu rút tiền",
  "error": "Bad Request"
}
```

**Các lỗi có thể xảy ra:**

| Message | Nguyên nhân |
|---------|-------------|
| `Vui lòng cập nhật thông tin ngân hàng trước khi yêu cầu rút tiền` | Chưa có bank info |
| `Tính năng rút tiền chưa được kích hoạt cho tổ chức này` | Admin chưa enable |
| `Số tiền rút phải lớn hơn 0` | amount <= 0 |
| `Số dư khả dụng không đủ. Hiện có: xxx VNĐ` | amount > available_balance |
| `Đã có yêu cầu rút tiền đang chờ xử lý. Vui lòng đợi admin duyệt.` | Có PENDING request |

---

#### 📜 Xem lịch sử rút tiền của tổ chức

```http
GET /payouts/organizations/:organizationId
```

**Response:**
```json
[
  {
    "id": "payout-uuid-1",
    "amount": 950000,
    "bank_account": "1234567890",
    "bank_name": "Vietcombank",
    "account_holder": "NGUYEN VAN A",
    "status": "COMPLETED",
    "transaction_code": "MOCK_VNP_1703846123_4567",
    "note": null,
    "processor": {
      "id": "admin-uuid",
      "full_name": "Admin Name",
      "email": "admin@example.com"
    },
    "processed_at": "2024-12-28T16:00:00.000Z",
    "created_at": "2024-12-28T15:00:00.000Z"
  },
  {
    "id": "payout-uuid-2",
    "amount": 500000,
    "status": "PENDING",
    "processor": null,
    "processed_at": null,
    "created_at": "2024-12-28T17:00:00.000Z"
  }
]
```

---

### 3.3 PLATFORM ADMIN APIs

#### 📋 Xem tất cả yêu cầu rút tiền

```http
GET /payouts?status=PENDING&page=1&limit=20
```

**Query Params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `status` | enum | Filter: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `page` | number | Trang (mặc định: 1) |
| `limit` | number | Số record/trang (mặc định: 20) |

**Response:**
```json
{
  "data": [
    {
      "id": "payout-uuid",
      "amount": 950000,
      "bank_account": "1234567890",
      "bank_name": "Vietcombank",
      "account_holder": "NGUYEN VAN A",
      "status": "PENDING",
      "transaction_code": null,
      "note": null,
      "organization": {
        "id": "org-uuid",
        "name": "Tên tổ chức",
        "slug": "ten-to-chuc"
      },
      "processor": null,
      "processed_at": null,
      "created_at": "2024-12-28T15:00:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "total_pages": 1
  }
}
```

---

#### 🔍 Xem chi tiết yêu cầu

```http
GET /payouts/:payoutId
```

**Response:**
```json
{
  "id": "payout-uuid",
  "amount": 950000,
  "bank_account": "1234567890",
  "bank_name": "Vietcombank",
  "account_holder": "NGUYEN VAN A",
  "status": "PENDING",
  "transaction_code": null,
  "note": null,
  "organization": {
    "id": "org-uuid",
    "name": "Tên tổ chức",
    "slug": "ten-to-chuc",
    "available_balance": 950000,
    "pending_balance": 0,
    "total_paid_out": 0
  },
  "processor": null,
  "processed_at": null,
  "created_at": "2024-12-28T15:00:00.000Z",
  "updated_at": "2024-12-28T15:00:00.000Z"
}
```

---

#### 💳 Xử lý thanh toán

```http
POST /payouts/:payoutId/process
```

**Response (Success - 200):**
```json
{
  "message": "Thanh toán thành công!",
  "payout_id": "payout-uuid",
  "transaction_code": "MOCK_VNP_1703846123_4567",
  "amount": 950000,
  "processed_at": "2024-12-28T16:00:00.000Z"
}
```

**Response (Error - 400):**
```json
{
  "statusCode": 400,
  "message": "Yêu cầu này đã được thanh toán",
  "error": "Bad Request"
}
```

**Các lỗi có thể xảy ra:**

| Message | Nguyên nhân |
|---------|-------------|
| `Yêu cầu này đã được thanh toán` | status = COMPLETED |
| `Yêu cầu này đang được xử lý` | status = PROCESSING |
| `Yêu cầu này đã thất bại. Vui lòng tạo yêu cầu mới.` | status = FAILED |
| `Số dư không đủ. Hiện có: xxx VNĐ` | available_balance < amount |
| `Lỗi ngân hàng: xxx` | Bank API failed |

---

#### 🔄 Trigger Mature Shares (Dev/Testing)

```http
POST /payouts/mature-shares
```

**Response:**
```json
{
  "matured": 3
}
```

> **Lưu ý:** API này chủ yếu dùng để test. Trong production, scheduler tự động chạy lúc 2AM.

---

## 4. DATA MODELS

### 4.1 Organization (Fields liên quan Payout)

```typescript
interface OrganizationPayoutInfo {
  id: string;
  name: string;
  
  // Bank info
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_name: string | null;
  payout_enabled: boolean;          // Admin đã enable chưa
  
  // Balances
  total_revenue: number;            // Tổng doanh thu (gross)
  platform_commission: number;      // % phí platform (mặc định 5)
  pending_balance: number;          // Đang chờ
  available_balance: number;        // Khả dụng
  total_paid_out: number;           // Đã rút
}
```

### 4.2 Payout

```typescript
interface Payout {
  id: string;
  organization_id: string;
  amount: number;
  
  // Snapshot bank info (lưu lại lúc tạo request)
  bank_account: string;
  bank_name: string;
  account_holder: string;
  
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  transaction_code: string | null;  // Mã GD từ ngân hàng
  note: string | null;              // Ghi chú (thường là lỗi)
  
  processed_by: string | null;      // Admin ID
  processed_at: string | null;      // ISO datetime
  
  created_at: string;               // ISO datetime
  updated_at: string;               // ISO datetime
  
  // Relations (khi expand)
  organization?: { id: string; name: string; slug: string };
  processor?: { id: string; full_name: string; email: string };
}
```

### 4.3 Balance Response

```typescript
interface BalanceResponse {
  id: string;
  name: string;
  total_revenue: number;
  pending_balance: number;
  available_balance: number;
  total_paid_out: number;
  payout_enabled: boolean;
  has_bank_info: boolean;
}
```

---

## 5. CÁC MÀN HÌNH CẦN XÂY DỰNG

### 5.1 Organizer Side

#### 📊 Màn hình "Doanh thu & Rút tiền"

**Path:** `/organizations/:orgId/revenue` hoặc `/organizer/payouts`

**Components:**
1. **Balance Summary Card**
   ```
   ┌────────────────────────────────────────────────────┐
   │  📊 THỐNG KÊ DOANH THU                            │
   ├────────────────────────────────────────────────────┤
   │                                                    │
   │  Tổng doanh thu        1,000,000 VND              │
   │  ────────────────────────────────────              │
   │  Phí platform (5%)       -50,000 VND              │
   │  ════════════════════════════════════              │
   │                                                    │
   │  Số dư đang chờ              0 VND   ⓘ           │
   │  Số dư khả dụng        950,000 VND   🟢          │
   │  Đã rút                      0 VND                │
   │                                                    │
   │  [💰 Yêu cầu rút tiền]                            │
   │                                                    │
   └────────────────────────────────────────────────────┘
   ```

2. **Payout History Table**
   ```
   ┌──────────────────────────────────────────────────────────────────┐
   │  📜 LỊCH SỬ RÚT TIỀN                                            │
   ├──────────────────────────────────────────────────────────────────┤
   │  Số tiền      │ Trạng thái │ Mã GD          │ Ngày              │
   ├──────────────────────────────────────────────────────────────────┤
   │  950,000 VND  │ ✅ Hoàn thành │ MOCK_VNP_... │ 28/12/2024 16:00 │
   │  500,000 VND  │ ⏳ Đang chờ   │ -            │ 28/12/2024 17:00 │
   └──────────────────────────────────────────────────────────────────┘
   ```

3. **Bank Info Section** (nếu chưa có)
   ```
   ┌────────────────────────────────────────────────────┐
   │  ⚠️ Vui lòng cập nhật thông tin ngân hàng        │
   │     để có thể yêu cầu rút tiền                    │
   │                                                    │
   │  [Cập nhật ngay →]                                │
   └────────────────────────────────────────────────────┘
   ```

**Logic xử lý:**
- Nếu `has_bank_info = false` → Hiện warning, disable nút rút tiền
- Nếu `payout_enabled = false` → Hiện thông báo "Đang chờ Admin phê duyệt"
- Nếu `available_balance = 0` → Disable nút rút tiền
- Nếu đã có request PENDING → Disable nút, hiện thông báo

---

#### 💰 Modal "Tạo yêu cầu rút tiền"

```
┌────────────────────────────────────────────────────────┐
│  💰 YÊU CẦU RÚT TIỀN                              [X] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Số dư khả dụng: 950,000 VND                          │
│                                                        │
│  Số tiền muốn rút:                                    │
│  ┌────────────────────────────────────┐               │
│  │ 950,000                        VND │               │
│  └────────────────────────────────────┘               │
│  [  ] Rút toàn bộ số dư                               │
│                                                        │
│  📌 Thông tin nhận tiền:                              │
│  ─────────────────────────                            │
│  Ngân hàng:    Vietcombank                            │
│  Số tài khoản: 1234567890                             │
│  Chủ tài khoản: NGUYEN VAN A                          │
│                                                        │
│  ⓘ Yêu cầu sẽ được xử lý trong 1-3 ngày làm việc     │
│                                                        │
│  [Hủy]                    [Gửi yêu cầu]               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### 5.2 Platform Admin Side

#### 📋 Màn hình "Quản lý yêu cầu rút tiền"

**Path:** `/admin/payouts`

**Components:**

1. **Filter Bar**
   ```
   ┌──────────────────────────────────────────────────────────────────┐
   │  Trạng thái: [Tất cả ▼]  [🔍 Tìm kiếm...]         [Xuất Excel] │
   └──────────────────────────────────────────────────────────────────┘
   ```

2. **Statistics Cards**
   ```
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ ⏳ Đang chờ  │ │ 🔄 Đang xử lý│ │ ✅ Hoàn thành │ │ ❌ Thất bại  │
   │     5        │ │      1       │ │      23      │ │      2       │
   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
   ```

3. **Payout Table**
   ```
   ┌────────────────────────────────────────────────────────────────────────────┐
   │  #    │ Tổ chức     │ Số tiền      │ Trạng thái │ Ngày tạo   │ Hành động │
   ├────────────────────────────────────────────────────────────────────────────┤
   │  001  │ Event Corp  │ 950,000 VND  │ ⏳ Pending │ 28/12/24   │ [Xem][Xử lý]│
   │  002  │ Music Co    │ 1,200,000 VND│ ✅ Done    │ 27/12/24   │ [Xem]      │
   └────────────────────────────────────────────────────────────────────────────┘
   ```

---

#### 🔍 Màn hình/Modal "Chi tiết yêu cầu"

```
┌────────────────────────────────────────────────────────────────────┐
│  📄 CHI TIẾT YÊU CẦU RÚT TIỀN #001                            [X] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  TỔ CHỨC: Event Corp                                        │  │
│  │  ───────────────────────────────────────────                │  │
│  │  Số tiền yêu cầu:   950,000 VND                             │  │
│  │  Ngày tạo:          28/12/2024 15:00                        │  │
│  │  Trạng thái:        ⏳ Đang chờ xử lý                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  📌 THÔNG TIN CHUYỂN KHOẢN                                        │
│  ─────────────────────────────                                    │
│  Ngân hàng:       Vietcombank                                     │
│  Số tài khoản:    1234567890                                      │
│  Tên chủ TK:      NGUYEN VAN A                                    │
│                                                                    │
│  📊 SỐ DƯ TỔ CHỨC HIỆN TẠI                                        │
│  ─────────────────────────────                                    │
│  Khả dụng:        950,000 VND  ✅                                 │
│  Đang chờ:              0 VND                                     │
│  Đã rút:                0 VND                                     │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │         [🟢 XỬ LÝ THANH TOÁN NGAY]                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Khi bấm "Xử lý thanh toán":**
1. Hiện loading spinner (2-3 giây - giả lập bank processing)
2. Success → Hiện thông báo + mã giao dịch
3. Failed → Hiện lỗi từ API

---

## 6. XỬ LÝ LỖI

### 6.1 Error Codes

| HTTP Status | Message | Xử lý UI |
|-------------|---------|----------|
| 400 | Vui lòng cập nhật thông tin ngân hàng... | Redirect đến trang cập nhật |
| 400 | Tính năng rút tiền chưa được kích hoạt... | Thông báo liên hệ Admin |
| 400 | Số dư khả dụng không đủ... | Hiện số dư hiện tại |
| 400 | Đã có yêu cầu rút tiền đang chờ xử lý... | Hiện link đến request hiện tại |
| 400 | Yêu cầu này đã được thanh toán | Refresh data |
| 400 | Lỗi ngân hàng: xxx | Thông báo lỗi, cho retry |
| 404 | Không tìm thấy... | Redirect về list |

### 6.2 Loading States

```typescript
// Khi gọi API process payout
const [isProcessing, setIsProcessing] = useState(false);

const handleProcess = async () => {
  setIsProcessing(true);
  try {
    const result = await api.post(`/payouts/${id}/process`);
    toast.success(`Thành công! Mã GD: ${result.transaction_code}`);
    refreshData();
  } catch (error) {
    toast.error(error.response.data.message);
  } finally {
    setIsProcessing(false);
  }
};
```

---

## 7. DEMO FLOW

### 7.1 Chuẩn bị Demo

**Checklist trước demo:**
- [ ] Backend running (`npm run start:dev`)
- [ ] Frontend running
- [ ] Có tài khoản: Customer, Organizer Admin, Platform Admin
- [ ] Organizer đã có thông tin ngân hàng
- [ ] Có ít nhất 1 event với tickets

### 7.2 Các Bước Demo (10-15 phút)

#### Bước 1: Tạo doanh thu (3 phút)
```
1. Customer mua vé → Thanh toán thành công
2. Giải thích: Revenue Share được tạo tự động
   - Gross: 1,000,000 VND
   - Platform fee 5%: -50,000 VND
   - Net: 950,000 VND → pending_balance
```

#### Bước 2: Xem số dư Organizer (2 phút)
```
1. Đăng nhập Organizer Admin
2. Vào trang "Doanh thu & Rút tiền"
3. Thấy: pending_balance = 950,000, available = 0
4. Giải thích: Đang hold 3 ngày sau event
```

#### Bước 3: Trigger Mature (Demo trick) (1 phút)
```
1. Đăng nhập Platform Admin
2. Gọi API: POST /payouts/mature-shares (Swagger hoặc Postman)
3. Quay lại Organizer → available_balance = 950,000
```

#### Bước 4: Tạo yêu cầu rút tiền (2 phút)
```
1. Organizer bấm "Yêu cầu rút tiền"
2. Nhập số tiền (hoặc rút hết)
3. Xác nhận → Request PENDING
```

#### Bước 5: Admin xử lý (3 phút)
```
1. Đăng nhập Platform Admin
2. Vào "Quản lý yêu cầu rút tiền"
3. Xem chi tiết request
4. Bấm "Xử lý thanh toán"
5. Loading 2s → Thành công! Mã GD: MOCK_VNP_xxx
```

#### Bước 6: Kiểm tra kết quả (2 phút)
```
1. Quay lại Organizer
2. available_balance = 0
3. total_paid_out = 950,000
4. Lịch sử: Request #001 - COMPLETED
```

### 7.3 Giải thích cho Hội đồng

> **Về MockBankService:**  
> *"Đây là service giả lập API ngân hàng để demo. Trong production, sẽ được thay thế bằng API thực của VietinBank, Vietcombank, hoặc các cổng thanh toán như Payoo, NapasGW."*

> **Về Hold Period:**  
> *"Hệ thống giữ tiền 3 ngày sau event kết thúc để xử lý các trường hợp refund nếu có vấn đề xảy ra."*

> **Về Platform Fee:**  
> *"Platform thu 5% phí giao dịch, tương tự mô hình của Ticketbox, Eventbrite."*

---

## 📞 LIÊN HỆ

Nếu có thắc mắc về API, vui lòng liên hệ Backend team.

**Swagger UI:** `http://localhost:3000/api/docs`
