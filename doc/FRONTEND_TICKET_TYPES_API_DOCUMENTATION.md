# TÀI LIỆU API TICKET TYPES - CHO FRONTEND

## 📋 TỔNG QUAN

Module Ticket Types quản lý các loại vé (ticket types) cho mỗi event. Mỗi event có thể có nhiều loại vé với giá và số lượng khác nhau (VD: VIP, Standard, Early Bird, etc.).

**Base URL:** `http://localhost:3000/events/:eventId/ticket-types`

**Lưu ý quan trọng:**

- Tất cả endpoints đều bắt đầu với `/events/:eventId/ticket-types`
- `:eventId` là UUID của event mà ticket type thuộc về
- Ticket types luôn được quản lý trong context của một event cụ thể

**Authentication:** Hầu hết endpoints yêu cầu JWT token trong header:

```
Authorization: Bearer {access_token}
```

---

## 🔐 PHÂN QUYỀN

### Roles có thể sử dụng Ticket Types API:

| Role                | Quyền                                           |
| ------------------- | ----------------------------------------------- |
| **PLATFORM_ADMIN**  | Tất cả quyền                                    |
| **ORGANIZER_ADMIN** | CRUD ticket types của events trong organization |
| **EVENT_MANAGER**   | CRUD ticket types của events trong organization |
| **CHECKIN_STAFF**   | Chỉ xem (read-only)                             |
| **CUSTOMER**        | Chỉ xem ticket types đang bán (public)          |

**Permission Matrix Chi Tiết:**

| Action            | PLATFORM_ADMIN | ORGANIZER_ADMIN    | EVENT_MANAGER      | CHECKIN_STAFF | CUSTOMER       |
| ----------------- | -------------- | ------------------ | ------------------ | ------------- | -------------- |
| **Create**        | ✅ All events  | ✅ Org events only | ✅ Org events only | ❌            | ❌             |
| **Read (List)**   | ✅ All         | ✅ Org events      | ✅ Org events      | ✅ Org events | ✅ Public only |
| **Read (Detail)** | ✅ All         | ✅ Org events      | ✅ Org events      | ✅ Org events | ✅ Public only |
| **Update**        | ✅ All         | ✅ Org events      | ✅ Org events      | ❌            | ❌             |
| **Disable**       | ✅ All         | ✅ Org events      | ✅ Org events      | ❌            | ❌             |
| **Delete**        | ✅ All         | ✅ Org events      | ❌                 | ❌            | ❌             |

---

## 📡 API ENDPOINTS

### 1. Tạo Ticket Type Mới

**Endpoint:** `POST /events/:eventId/ticket-types`

**Quyền:** `ORGANIZER_ADMIN`, `EVENT_MANAGER`

**Headers:**

```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "VIP", // Required, 3-100 chars
  "description": "VIP seats in front row", // Optional, max 500 chars
  "is_free": false, // Optional, default: false
  "is_donation": false, // Optional, default: false
  "price": 500000, // Required if not free, decimal
  "currency": "VND", // Optional, default: "VND"
  "quantity_total": 100, // Required, số lượng vé
  "per_order_min": 1, // Optional, default: 1
  "per_order_max": 10, // Optional, default: 10
  "sale_start_at": "2024-01-01T00:00:00Z", // Required, ISO 8601
  "sale_end_at": "2024-12-24T23:59:59Z", // Required, ISO 8601
  "refund_policy_deadline": "2024-12-20T23:59:59Z" // Optional
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "event_id": "uuid",
  "name": "VIP",
  "description": "VIP seats in front row",
  "is_free": false,
  "is_donation": false,
  "price": "500000.00",
  "currency": "VND",
  "quantity_total": 100,
  "quantity_sold": 0,
  "quantity_available": 100,
  "per_order_min": 1,
  "per_order_max": 10,
  "sale_start_at": "2024-01-01T00:00:00.000Z",
  "sale_end_at": "2024-12-24T23:59:59.000Z",
  "refund_policy_deadline": "2024-12-20T23:59:59.000Z",
  "is_active": true,
  "is_on_sale": false,
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses:**

- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Token không hợp lệ
- `403 Forbidden`: Không có quyền
- `404 Not Found`: Event không tồn tại

**Validation Rules:**

```typescript
// Price validation
if (!is_free && !is_donation) {
  price is required and must be > 0
}

if (is_free || is_donation) {
  price must be null or 0
}

// Quantity validation
quantity_total must be > 0
per_order_min must be >= 1
per_order_max must be >= per_order_min

// Date validation
sale_start_at must be < sale_end_at
sale_end_at must be <= event.start_at (không bán vé sau khi event bắt đầu)
refund_policy_deadline must be <= event.start_at
```

---

### 2. Xem Danh Sách Ticket Types của Event

**Endpoint:** `GET /events/:eventId/ticket-types`

**Quyền:**

- Không cần authentication nếu event là PUBLIC
- Cần authentication nếu event không public

**Query Parameters:**

```http
GET /events/:eventId/ticket-types?only_on_sale_now=true&include_inactive=false
```

| Parameter          | Type    | Description                              | Default |
| ------------------ | ------- | ---------------------------------------- | ------- |
| `only_on_sale_now` | boolean | Chỉ lấy ticket types đang bán (hiện tại) | `false` |
| `include_inactive` | boolean | Bao gồm ticket types inactive            | `false` |

**Lưu ý:** Query parameter name là `only_on_sale_now` (không phải `only_on_sale`)

**Response (200 OK):**

```json
[
  {
    "id": "uuid",
    "event_id": "uuid",
    "name": "VIP",
    "description": "VIP seats in front row",
    "is_free": false,
    "is_donation": false,
    "price": "500000.00",
    "currency": "VND",
    "quantity_total": 100,
    "quantity_sold": 45,
    "quantity_available": 55,
    "per_order_min": 1,
    "per_order_max": 5,
    "sale_start_at": "2024-01-01T00:00:00.000Z",
    "sale_end_at": "2024-12-24T23:59:59.000Z",
    "refund_policy_deadline": "2024-12-20T23:59:59.000Z",
    "is_active": true,
    "is_on_sale": true,
    "is_sold_out": false,
    "percentage_sold": 45
  },
  {
    "id": "uuid-2",
    "event_id": "uuid",
    "name": "Standard",
    "description": "Regular seats",
    "is_free": false,
    "price": "200000.00",
    "currency": "VND",
    "quantity_total": 500,
    "quantity_sold": 500,
    "quantity_available": 0,
    "is_active": true,
    "is_on_sale": true,
    "is_sold_out": true,
    "percentage_sold": 100
  },
  {
    "id": "uuid-3",
    "event_id": "uuid",
    "name": "Free Entry",
    "is_free": true,
    "price": "0.00",
    "quantity_total": 1000,
    "quantity_sold": 200,
    "quantity_available": 800,
    "is_active": true,
    "is_on_sale": true,
    "is_sold_out": false
  }
]
```

**Computed Fields:**

```typescript
// Backend tự động tính toán các fields sau:
{
  "quantity_available": quantity_total - quantity_sold,
  "is_on_sale": is_active && now >= sale_start_at && now <= sale_end_at,
  "is_sold_out": quantity_available <= 0,
  "percentage_sold": (quantity_sold / quantity_total) * 100
}
```

**Lưu ý:**

- Mặc định chỉ trả về `is_active = true`
- `only_on_sale_now=true`: Chỉ lấy tickets đang trong thời gian bán VÀ available
- `include_inactive=true`: Bao gồm cả tickets đã disable (chỉ cho admin)

---

### 3. Xem Chi Tiết Ticket Type

**Endpoint:** `GET /events/:eventId/ticket-types/:id`

**Quyền:** Tất cả users (đã đăng nhập)

**Response (200 OK):**

```json
{
  "id": "uuid",
  "event_id": "uuid",
  "name": "VIP",
  "description": "VIP seats in front row with backstage access",
  "is_free": false,
  "is_donation": false,
  "price": "500000.00",
  "currency": "VND",
  "quantity_total": 100,
  "quantity_sold": 45,
  "quantity_available": 55,
  "per_order_min": 1,
  "per_order_max": 5,
  "sale_start_at": "2024-01-01T00:00:00.000Z",
  "sale_end_at": "2024-12-24T23:59:59.000Z",
  "refund_policy_deadline": "2024-12-20T23:59:59.000Z",
  "is_active": true,
  "is_on_sale": true,
  "is_sold_out": false,
  "percentage_sold": 45,
  "event": {
    "id": "uuid",
    "title": "Tech Summit 2024",
    "start_at": "2024-12-25T09:00:00.000Z",
    "venue_name": "Convention Center"
  },
  "created_by": "uuid",
  "creator": {
    "id": "uuid",
    "full_name": "Admin User",
    "email": "admin@example.com"
  },
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses:**

- `404 Not Found`: Ticket type không tồn tại

---

### 4. Cập Nhật Ticket Type

**Endpoint:** `PATCH /events/:eventId/ticket-types/:id`

**Quyền:** `ORGANIZER_ADMIN`, `EVENT_MANAGER`

**Request Body:** (tất cả fields đều optional)

```json
{
  "name": "VIP Premium",
  "description": "Updated description",
  "price": 600000,
  "quantity_total": 150,
  "per_order_max": 8,
  "sale_end_at": "2024-12-25T00:00:00Z",
  "is_active": true
}
```

**Response (200 OK):** Ticket type object đã được cập nhật

**Validation Rules:**

```typescript
// Không thể giảm quantity_total xuống dưới quantity_sold
if (quantity_total < current_quantity_sold) {
  throw Error('Cannot reduce quantity below sold amount');
}

// Không thể thay đổi is_free/is_donation sau khi đã bán
if ((is_free || is_donation) !== original && quantity_sold > 0) {
  throw Error('Cannot change pricing type after tickets are sold');
}

// Price validation
if (!is_free && !is_donation && !price) {
  throw Error('Price is required for paid tickets');
}
```

**Lưu ý:**

- Có thể tăng `quantity_total` (add more tickets)
- KHÔNG thể giảm `quantity_total` xuống dưới `quantity_sold`
- KHÔNG thể thay đổi `is_free`/`is_donation` sau khi đã có người mua
- Có thể thay đổi `price` (sẽ áp dụng cho orders mới)

---

### 5. Disable Ticket Type (Ngừng bán)

**Endpoint:** `POST /events/:eventId/ticket-types/:id/disable`

**Quyền:** `ORGANIZER_ADMIN`, `EVENT_MANAGER`

**Request Body:**

```json
{
  "reason": "Sold out early" // Optional
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "is_active": false,
  "message": "Ticket type has been disabled"
}
```

**Lưu ý:**

- Disable = ngừng bán (customers không thể mua nữa)
- Tickets đã bán vẫn valid
- Có thể enable lại sau bằng cách PATCH với `is_active: true`

---

### 6. Xóa Ticket Type

**Endpoint:** `DELETE /events/:eventId/ticket-types/:id`

**Quyền:** `ORGANIZER_ADMIN`, `EVENT_MANAGER` (theo code, không phải chỉ ORGANIZER_ADMIN)

**Response:** `204 No Content`

**Validation:**

```typescript
// Không thể xóa nếu đã có người mua
if (ticket_type.quantity_sold > 0) {
  throw Error('Cannot delete ticket type with sold tickets');
}
```

**Lưu ý:**

- Chỉnh trong code: Cả ORGANIZER_ADMIN và EVENT_MANAGER đều có quyền xóa
- KHÔNG thể xóa nếu `quantity_sold > 0`
- Nên dùng **disable** thay vì delete

---

## 💻 CODE EXAMPLES (React/TypeScript)

### TypeScript Interfaces

```typescript
// types/ticketType.ts
export interface CreateTicketTypeRequest {
  name: string;
  description?: string;
  is_free?: boolean;
  is_donation?: boolean;
  price?: number;
  currency?: string;
  quantity_total: number;
  per_order_min?: number;
  per_order_max?: number;
  sale_start_at: string;
  sale_end_at: string;
  refund_policy_deadline?: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  is_free: boolean;
  is_donation: boolean;
  price: string;
  currency: string;
  quantity_total: number;
  quantity_sold: number;
  quantity_available: number;
  per_order_min: number;
  per_order_max: number;
  sale_start_at: string;
  sale_end_at: string;
  refund_policy_deadline?: string;
  is_active: boolean;
  is_on_sale: boolean;
  is_sold_out: boolean;
  percentage_sold: number;
  created_at: string;
  updated_at: string;
}
```

### Service Layer (Axios)

```typescript
// services/ticketTypeService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const ticketTypeService = {
  // 1. Tạo ticket type mới
  async createTicketType(
    eventId: string,
    data: CreateTicketTypeRequest,
    token: string,
  ): Promise<TicketType> {
    const response = await axios.post(
      `${API_BASE_URL}/events/${eventId}/ticket-types`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  },

  // 2. Lấy danh sách ticket types
  async getTicketTypes(
    eventId: string,
    params?: {
      only_on_sale_now?: boolean;
      include_inactive?: boolean;
    },
  ): Promise<TicketType[]> {
    const response = await axios.get(
      `${API_BASE_URL}/events/${eventId}/ticket-types`,
      { params },
    );
    return response.data;
  },

  // 3. Lấy chi tiết ticket type
  async getTicketTypeById(
    eventId: string,
    id: string,
    token: string,
  ): Promise<TicketType> {
    const response = await axios.get(
      `${API_BASE_URL}/events/${eventId}/ticket-types/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  },

  // 4. Cập nhật ticket type
  async updateTicketType(
    eventId: string,
    id: string,
    data: Partial<CreateTicketTypeRequest>,
    token: string,
  ): Promise<TicketType> {
    const response = await axios.patch(
      `${API_BASE_URL}/events/${eventId}/ticket-types/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  },

  // 5. Disable ticket type
  async disableTicketType(
    eventId: string,
    id: string,
    reason?: string,
    token: string,
  ): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/events/${eventId}/ticket-types/${id}/disable`,
      { reason },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
  },

  // 6. Xóa ticket type
  async deleteTicketType(
    eventId: string,
    id: string,
    token: string,
  ): Promise<void> {
    await axios.delete(`${API_BASE_URL}/events/${eventId}/ticket-types/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
```

### React Component Example

```tsx
// components/TicketTypesManager.tsx
import React, { useState, useEffect } from 'react';
import { ticketTypeService, TicketType } from '../services/ticketTypeService';

interface Props {
  eventId: string;
  token: string;
}

const TicketTypesManager: React.FC<Props> = ({ eventId, token }) => {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTicketTypes();
  }, [eventId]);

  const loadTicketTypes = async () => {
    try {
      setLoading(true);
      const data = await ticketTypeService.getTicketTypes(eventId, {
        include_inactive: true, // Admin view, show all
      });
      setTicketTypes(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load ticket types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: CreateTicketTypeRequest) => {
    try {
      await ticketTypeService.createTicketType(eventId, formData, token);
      await loadTicketTypes();
      alert('Ticket type created successfully!');
    } catch (err: any) {
      alert(
        'Failed to create: ' + (err.response?.data?.message || err.message),
      );
    }
  };

  const handleDisable = async (id: string) => {
    if (!confirm('Disable this ticket type?')) return;

    try {
      await ticketTypeService.disableTicketType(
        eventId,
        id,
        'Manually disabled by admin',
        token,
      );
      await loadTicketTypes();
      alert('Ticket type disabled');
    } catch (err: any) {
      alert(
        'Failed to disable: ' + (err.response?.data?.message || err.message),
      );
    }
  };

  const handleDelete = async (id: string, quantitySold: number) => {
    if (quantitySold > 0) {
      alert('Cannot delete ticket type with sold tickets!');
      return;
    }

    if (!confirm('Delete this ticket type permanently?')) return;

    try {
      await ticketTypeService.deleteTicketType(eventId, id, token);
      await loadTicketTypes();
      alert('Ticket type deleted');
    } catch (err: any) {
      alert(
        'Failed to delete: ' + (err.response?.data?.message || err.message),
      );
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="ticket-types-manager">
      <h2>Ticket Types</h2>

      <button
        onClick={() => {
          /* Show create form */
        }}
      >
        + Create Ticket Type
      </button>

      <div className="ticket-types-list">
        {ticketTypes.map((tt) => (
          <div key={tt.id} className="ticket-type-card">
            <h3>{tt.name}</h3>
            <p>{tt.description}</p>

            <div className="info">
              <p className="price">
                {tt.is_free
                  ? 'FREE'
                  : `${parseInt(tt.price).toLocaleString()} ${tt.currency}`}
              </p>
              <p className="quantity">
                Sold: {tt.quantity_sold} / {tt.quantity_total} (
                {tt.percentage_sold}%)
              </p>
            </div>

            <span
              className={`status ${tt.is_on_sale ? 'on-sale' : 'off-sale'}`}
            >
              {tt.is_sold_out
                ? 'SOLD OUT'
                : tt.is_on_sale
                  ? 'ON SALE'
                  : 'NOT ON SALE'}
            </span>

            <div className="actions">
              <button
                onClick={() => {
                  /* Edit */
                }}
              >
                Edit
              </button>
              <button onClick={() => handleDisable(tt.id)}>Disable</button>
              <button
                onClick={() => handleDelete(tt.id, tt.quantity_sold)}
                disabled={tt.quantity_sold > 0}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketTypesManager;
```

---

## 🎯 USE CASES

### Use Case 1: Early Bird Pricing

Tạo 2 ticket types với giá khác nhau:

```typescript
// Early Bird - limited time, lower price
await ticketTypeService.createTicketType(
  eventId,
  {
    name: 'Early Bird',
    price: 300000,
    quantity_total: 50,
    sale_start_at: '2024-01-01T00:00:00Z',
    sale_end_at: '2024-03-31T23:59:59Z', // Ends early
  },
  token,
);

// Regular Price - starts after early bird
await ticketTypeService.createTicketType(
  eventId,
  {
    name: 'Regular Price',
    price: 500000,
    quantity_total: 450,
    sale_start_at: '2024-04-01T00:00:00Z',
    sale_end_at: '2024-12-24T23:59:59Z',
  },
  token,
);
```

### Use Case 2: VIP + Standard + Free

```typescript
// VIP - limited quantity
await ticketTypeService.createTicketType(
  eventId,
  {
    name: 'VIP',
    description: 'Front row seats + backstage pass',
    price: 1000000,
    quantity_total: 20,
    per_order_max: 2, // Max 2 VIP per person
  },
  token,
);

// Standard
await ticketTypeService.createTicketType(
  eventId,
  {
    name: 'Standard',
    price: 300000,
    quantity_total: 500,
  },
  token,
);

// Free for students
await ticketTypeService.createTicketType(
  eventId,
  {
    name: 'Free Student Pass',
    is_free: true,
    quantity_total: 100,
    per_order_max: 1, // 1 free ticket per person
  },
  token,
);
```

### Use Case 3: Charity Donation Event

```typescript
await ticketTypeService.createTicketType(
  eventId,
  {
    name: 'Support Our Cause',
    is_donation: true,
    quantity_total: 1000,
    description: 'Pay what you can to support our mission',
  },
  token,
);
```

---

## ⚠️ ERROR HANDLING

### Common Errors

| Status Code | Condition             | Message                                  | Solution                       |
| ----------- | --------------------- | ---------------------------------------- | ------------------------------ |
| `400`       | Invalid price         | "Price required for paid tickets"        | Set price or make is_free=true |
| `400`       | Quantity too low      | "Cannot reduce quantity below sold"      | Increase quantity_total        |
| `400`       | Date conflict         | "sale_end_at must be before event start" | Fix dates                      |
| `401`       | No token              | "Unauthorized"                           | Login and provide token        |
| `403`       | No permission         | "Insufficient permissions"               | Check user role                |
| `404`       | Event not found       | "Event not found"                        | Verify event ID                |
| `404`       | Ticket type not found | "Ticket type not found"                  | Verify ticket type ID          |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": [
    "price must be a positive number",
    "quantity_total must be greater than quantity_sold"
  ],
  "error": "Bad Request"
}
```

---

## 📚 TÀI LIỆU THAM KHẢO

- **Controller:** `src/ticket-types/ticket-types.controller.ts`
- **Service:** `src/ticket-types/ticket-types.service.ts`
- **DTOs:** `src/ticket-types/dto/`
- **Schema:** `prisma/schema.prisma` (TicketType model)

---

## 🔗 LIÊN KẾT VỚI CÁC API KHÁC

### Flow: Tạo Event → Ticket Types → Orders

```
1. Tạo Event (Events API)
   POST /events

2. Tạo Ticket Types (Ticket Types API)
   POST /events/:eventId/ticket-types

3. Publish Event
   POST /events/:id/publish

4. Customers xem ticket types
   GET /events/:eventId/ticket-types?only_on_sale_now=true

5. Customers tạo order (Orders API - next)
   POST /orders (hoặc /events/:eventId/orders)
```

---

**Cập nhật lần cuối:** 2025-01-22  
**Phiên bản:** 2.0  
**Status:** ✅ Verified với source code thực tế
