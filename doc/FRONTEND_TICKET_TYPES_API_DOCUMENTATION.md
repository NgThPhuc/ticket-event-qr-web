# TÀI LIỆU API TICKET TYPES - CHO FRONTEND

## 📋 TỔNG QUAN

Module Ticket Types quản lý các loại vé (ticket types) cho mỗi event. Mỗi event có thể có nhiều loại vé với giá và số lượng khác nhau (VD: VIP, Standard, Early Bird, etc.).

**Base URL:** `http://localhost:3000/ticket-types` (hoặc domain production)

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

---

## � CHI TIẾT PHÂN QUYỀN & ROLES

### Ai có thể TẠO Ticket Types?

#### ✅ **Có quyền tạo:**

1. **PLATFORM_ADMIN** 🔴
   - **Quyền:** Tất cả quyền trong hệ thống
   - **Phạm vi:** Tạo ticket types cho **bất kỳ event nào**
   - **Điều kiện:** Không (super admin)
   - **Use case:** System admin, technical support

2. **ORGANIZER_ADMIN** 🟡
   - **Quyền:** Quản trị viên cao nhất của organization
   - **Phạm vi:** Chỉ tạo cho **events trong organization của mình**
   - **Điều kiện:** Phải là member với role ORGANIZER_ADMIN
   - **Use case:** Organization owner, company admin

3. **EVENT_MANAGER** 🟢
   - **Quyền:** Quản lý content và operations
   - **Phạm vi:** Chỉ tạo cho **events trong organization của mình**
   - **Điều kiện:** Phải là member với role EVENT_MANAGER
   - **Use case:** Event coordinator, content manager

#### ❌ **KHÔNG có quyền:**

4. **CHECKIN_STAFF** 🔵
   - **Lý do:** Vai trò operational, chỉ check-in tickets
   - **Có thể làm:** Xem ticket types (read-only)

5. **CUSTOMER** ⚪
   - **Lý do:** End user, chỉ mua vé
   - **Có thể làm:** Xem ticket types công khai (on sale)

---

### Permission Matrix Chi Tiết

| Action            | PLATFORM_ADMIN | ORGANIZER_ADMIN    | EVENT_MANAGER      | CHECKIN_STAFF | CUSTOMER       |
| ----------------- | -------------- | ------------------ | ------------------ | ------------- | -------------- |
| **Create**        | ✅ All events  | ✅ Org events only | ✅ Org events only | ❌            | ❌             |
| **Read (List)**   | ✅ All         | ✅ Org events      | ✅ Org events      | ✅ Org events | ✅ Public only |
| **Read (Detail)** | ✅ All         | ✅ Org events      | ✅ Org events      | ✅ Org events | ✅ Public only |
| **Update**        | ✅ All         | ✅ Org events      | ✅ Org events      | ❌            | ❌             |
| **Disable**       | ✅ All         | ✅ Org events      | ✅ Org events      | ❌            | ❌             |
| **Delete**        | ✅ All         | ✅ Org events      | ❌                 | ❌            | ❌             |

**Ghi chú:**

- ✅ = Có quyền
- ❌ = Không có quyền
- "Org events" = Events thuộc organization mà user là member

---

### Guards & Validation Flow

```typescript
// ticket-types.controller.ts
@Post('events/:eventId')
@UseGuards(JwtAuthGuard, RolesGuard, OrganizationGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.ORGANIZER_ADMIN, UserRole.EVENT_MANAGER)
async create(@Param('eventId') eventId: string, @Body() dto: CreateTicketTypeDto) {
  // Flow kiểm tra:

  // 1. JwtAuthGuard:
  //    - Kiểm tra JWT token hợp lệ
  //    - Extract user info từ token

  // 2. RolesGuard:
  //    - Kiểm tra user có 1 trong 3 roles: PLATFORM_ADMIN, ORGANIZER_ADMIN, EVENT_MANAGER
  //    - Nếu không → 403 Forbidden

  // 3. OrganizationGuard:
  //    - PLATFORM_ADMIN: Bypass (có quyền tất cả)
  //    - Others: Kiểm tra user có phải member của organization chứa event không
  //    - Nếu không → 403 Forbidden

  // 4. Nếu pass tất cả guards → Execute method
  return await this.ticketTypesService.create(eventId, dto, req.user.id);
}
```

**Error Responses:**

```json
// 401 Unauthorized - Token invalid/expired
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden - User không đủ quyền
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// 403 Forbidden - Không phải member của organization
{
  "statusCode": 403,
  "message": "You are not a member of this organization",
  "error": "Forbidden"
}
```

---

### Use Cases Thực Tế

#### **Use Case 1: Organization Owner tạo Ticket Types**

```typescript
// Bước 1: User A tạo Organization
POST /organizations
{
  "name": "Tech Events Inc",
  "slug": "tech-events-inc"
}

// Response: User A tự động trở thành:
// - Owner (organization.owner_id = user_a_id)
// - ORGANIZER_ADMIN (organization_members.role = ORGANIZER_ADMIN)

// Bước 2: User A tạo Event
POST /events
{
  "organization_id": "tech-events-inc-id",
  "title": "Tech Summit 2024",
  ...
}

// Bước 3: User A tạo Ticket Types
POST /ticket-types/events/{eventId}
{
  "name": "VIP",
  "price": 500000,
  "quantity_total": 100
}

// Result: ✅ Success
// User A là ORGANIZER_ADMIN của organization → Có quyền
```

---

#### **Use Case 2: Event Manager được mời vào Organization**

```typescript
// Bước 1: User A (ORGANIZER_ADMIN) mời User B
POST /organizations/{orgId}/members
{
  "email": "userb@example.com",
  "role": "EVENT_MANAGER"
}

// User B nhận email → Join organization với role EVENT_MANAGER

// Bước 2: User B tạo Event
POST /events
{
  "organization_id": "{orgId}",
  "title": "Product Launch",
  ...
}

// Bước 3: User B tạo Ticket Types
POST /ticket-types/events/{eventId}
{
  "name": "Standard",
  "price": 200000,
  "quantity_total": 500
}

// Result: ✅ Success
// User B là EVENT_MANAGER trong organization → Có quyền
```

---

#### **Use Case 3: CUSTOMER không có quyền**

```typescript
// User C là CUSTOMER (chưa có organization)

// User C thử tạo ticket type
POST /ticket-types/events/{eventId}
{
  "name": "Unauthorized Ticket",
  "price": 100000
}

// Result: ❌ 403 Forbidden
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// Lý do: User C không có role ORGANIZER_ADMIN hoặc EVENT_MANAGER
```

---

#### **Use Case 4: User trong Organization khác**

```typescript
// User D là ORGANIZER_ADMIN của Organization X
// Event thuộc về Organization Y

// User D thử tạo ticket type cho event của Org Y
POST /ticket-types/events/{eventIdFromOrgY}
{
  "name": "Cross-Org Ticket",
  "price": 300000
}

// Result: ❌ 403 Forbidden
{
  "statusCode": 403,
  "message": "You are not a member of this organization",
  "error": "Forbidden"
}

// Lý do: User D không phải member của Organization Y
```

---

### Cách trở thành ORGANIZER_ADMIN / EVENT_MANAGER

#### **Phương án 1: Tự tạo Organization**

```typescript
// Bất kỳ CUSTOMER nào cũng có thể tạo organization
POST /organizations
{
  "name": "My Event Company",
  "slug": "my-event-company",
  "description": "Organizing amazing events",
  "contact_email": "contact@mycompany.com"
}

// Sau khi tạo thành công:
// 1. User trở thành OWNER (organization.owner_id)
// 2. Tự động được thêm vào organization_members với role ORGANIZER_ADMIN
// 3. Có thể tạo events và ticket types cho organization này
```

**Benefits:**

- ✅ Full control (owner + admin)
- ✅ Tạo được events & ticket types
- ✅ Mời members khác vào organization
- ✅ Quản lý toàn bộ organization

---

#### **Phương án 2: Được mời vào Organization**

```typescript
// Owner hoặc ORGANIZER_ADMIN của organization mời user khác

// Step 1: Admin gửi lời mời
POST /organizations/{orgId}/members
{
  "email": "newuser@example.com",
  "role": "EVENT_MANAGER"  // hoặc "ORGANIZER_ADMIN"
}

// Step 2: User nhận email notification
// Step 3: User tự động trở thành member với role được chỉ định

// Permissions dựa trên role:
// - ORGANIZER_ADMIN: Quản lý organization, events, members
// - EVENT_MANAGER: Quản lý events, ticket types (không quản lý members)
// - CHECKIN_STAFF: Chỉ check-in tickets
// - CUSTOMER: Không có quyền gì (chỉ xem)
```

**Roles Available:**

```typescript
enum UserRole {
  PLATFORM_ADMIN, // Chỉ system admin (không thể mời)
  ORGANIZER_ADMIN, // Full control trong organization
  EVENT_MANAGER, // Quản lý events
  CHECKIN_STAFF, // Check-in only
  CUSTOMER, // No permissions
}
```

---

### Role Hierarchy & Permissions

```
PLATFORM_ADMIN (System-wide)
    │
    └─ Bypass all organization checks
    └─ Access all organizations
    └─ All permissions

ORGANIZER_ADMIN (Organization-level)
    │
    ├─ Manage organization settings
    ├─ Manage members (add, remove, change roles)
    ├─ Create/Update/Delete events
    ├─ Create/Update/Delete ticket types
    └─ View all analytics

EVENT_MANAGER (Organization-level)
    │
    ├─ Create/Update events (cannot delete)
    ├─ Create/Update/Disable ticket types (cannot delete)
    └─ View analytics

CHECKIN_STAFF (Organization-level)
    │
    ├─ View events & ticket types (read-only)
    └─ Check-in tickets

CUSTOMER (Public)
    │
    └─ View public events & ticket types
    └─ Purchase tickets
```

---

### Frontend Integration Examples

#### Check User Permissions

```typescript
// utils/permissions.ts
export const canCreateTicketType = (userRole: UserRole, organizationId?: string) => {
  // PLATFORM_ADMIN: Always can
  if (userRole === UserRole.PLATFORM_ADMIN) {
    return true;
  }

  // Must be ORGANIZER_ADMIN or EVENT_MANAGER
  if (
    userRole === UserRole.ORGANIZER_ADMIN ||
    userRole === UserRole.EVENT_MANAGER
  ) {
    // AND must be member of organization
    return !!organizationId;
  }

  return false;
};

export const canDeleteTicketType = (userRole: UserRole) => {
  // Only PLATFORM_ADMIN and ORGANIZER_ADMIN
  return (
    userRole === UserRole.PLATFORM_ADMIN ||
    userRole === UserRole.ORGANIZER_ADMIN
  );
};

// Usage in component
const CreateTicketTypeButton = ({ user, organizationId }) => {
  const canCreate = canCreateTicketType(user.platform_role, organizationId);

  if (!canCreate) {
    return null; // Don't show button
  }

  return (
    <button onClick={handleCreate}>
      + Create Ticket Type
    </button>
  );
};
```

---

### Security Best Practices

1. **Always Check Permissions Client-Side**

   ```typescript
   // Hide UI elements user can't access
   {canCreateTicketType(user.role, orgId) && (
     <CreateButton />
   )}
   ```

2. **Backend Always Validates**

   ```typescript
   // Never trust frontend
   // Backend MUST verify permissions via Guards
   @UseGuards(JwtAuthGuard, RolesGuard, OrganizationGuard)
   ```

3. **Handle Permission Errors Gracefully**

   ```typescript
   try {
     await ticketTypeService.create(...);
   } catch (error) {
     if (error.response?.status === 403) {
       alert('You do not have permission to create ticket types');
     }
   }
   ```

4. **Token Security**
   ```typescript
   // Store token securely (httpOnly cookie preferred)
   // Don't log tokens
   // Refresh tokens before expiry
   ```

---

## �📡 API ENDPOINTS

### 1. Tạo Ticket Type Mới

**Endpoint:** `POST /ticket-types/events/:eventId`

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

### 2. Xem Danh Sách Ticket Types của Event (Public)

**Endpoint:** `GET /ticket-types/events/:eventId`

**Quyền:**

- Không cần authentication nếu event là PUBLIC
- Cần authentication nếu event không public

**Query Parameters:**

```http
GET /ticket-types/events/:eventId?only_on_sale=true&include_inactive=false
```

| Parameter          | Type    | Description                   | Default |
| ------------------ | ------- | ----------------------------- | ------- |
| `only_on_sale`     | boolean | Chỉ lấy ticket types đang bán | `false` |
| `include_inactive` | boolean | Bao gồm ticket types inactive | `false` |

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
// Backend tự động tính toán
{
  "quantity_available": quantity_total - quantity_sold,
  "is_on_sale": is_active && now >= sale_start_at && now <= sale_end_at,
  "is_sold_out": quantity_available <= 0,
  "percentage_sold": (quantity_sold / quantity_total) * 100
}
```

**Lưu ý:**

- Mặc định chỉ trả về `is_active = true`
- `only_on_sale=true`: Chỉ lấy tickets đang trong thời gian bán
- `include_inactive=true`: Bao gồm cả tickets đã disable (chỉ cho admin)

---

### 3. Xem Chi Tiết Ticket Type

**Endpoint:** `GET /ticket-types/:id`

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

**Endpoint:** `PATCH /ticket-types/:id`

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

**Endpoint:** `PUT /ticket-types/:id/disable`

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
- Có thể enable lại sau

---

### 6. Xóa Ticket Type

**Endpoint:** `DELETE /ticket-types/:id`

**Quyền:** `ORGANIZER_ADMIN` only

**Response:** `204 No Content`

**Validation:**

```typescript
// Không thể xóa nếu đã có người mua
if (ticket_type.quantity_sold > 0) {
  throw Error('Cannot delete ticket type with sold tickets');
}
```

**Lưu ý:**

- Chỉ ORGANIZER_ADMIN mới có quyền xóa
- KHÔNG thể xóa nếu `quantity_sold > 0`
- Nên dùng **disable** thay vì delete

---

## 💰 PRICING MODELS

### 1. Paid Tickets (Vé trả phí)

```json
{
  "name": "VIP",
  "is_free": false,
  "is_donation": false,
  "price": 500000,
  "currency": "VND"
}
```

**Behavior:**

- User phải thanh toán để nhận vé
- Price cố định

---

### 2. Free Tickets (Vé miễn phí)

```json
{
  "name": "Free Entry",
  "is_free": true,
  "price": 0
}
```

**Behavior:**

- User không cần thanh toán
- Vẫn phải "order" (reserved seats)
- Có giới hạn `quantity_total`

---

### 3. Donation Tickets (Vé theo donation)

```json
{
  "name": "Support Ticket",
  "is_donation": true,
  "price": null // User tự nhập amount
}
```

**Behavior:**

- User nhập số tiền muốn donate
- Minimum amount có thể set (optional)
- Dùng cho charity events

**Frontend Flow:**

```typescript
// User chọn donation ticket
{
  "ticket_type_id": "uuid",
  "quantity": 1,
  "donation_amount": 100000  // User input
}
```

---

## 📊 SALE WINDOWS (Thời gian bán)

### Sale Status Logic

```typescript
const now = new Date();

// On Sale
if (
  ticket_type.is_active &&
  now >= ticket_type.sale_start_at &&
  now <= ticket_type.sale_end_at &&
  ticket_type.quantity_available > 0
) {
  status = 'ON_SALE';
}

// Coming Soon
if (now < ticket_type.sale_start_at) {
  status = 'COMING_SOON';
}

// Sale Ended
if (now > ticket_type.sale_end_at) {
  status = 'SALE_ENDED';
}

// Sold Out
if (ticket_type.quantity_available <= 0) {
  status = 'SOLD_OUT';
}

// Inactive
if (!ticket_type.is_active) {
  status = 'INACTIVE';
}
```

### Frontend Display

```jsx
// Example React component
const TicketTypeCard = ({ ticketType }) => {
  const getBadge = () => {
    if (!ticketType.is_active) return 'Inactive';
    if (ticketType.is_sold_out) return 'Sold Out';
    if (ticketType.is_on_sale) return 'On Sale';

    const now = new Date();
    if (now < new Date(ticketType.sale_start_at)) {
      return `Sale starts ${formatDate(ticketType.sale_start_at)}`;
    }
    if (now > new Date(ticketType.sale_end_at)) {
      return 'Sale Ended';
    }
  };

  return (
    <div className="ticket-card">
      <h3>{ticketType.name}</h3>
      <span className="badge">{getBadge()}</span>
      <p className="price">
        {ticketType.is_free ? 'FREE' : `${formatPrice(ticketType.price)} VNĐ`}
      </p>
      <p className="availability">
        {ticketType.quantity_available} / {ticketType.quantity_total} available
      </p>
      <button disabled={!ticketType.is_on_sale}>
        {ticketType.is_on_sale ? 'Buy Now' : 'Unavailable'}
      </button>
    </div>
  );
};
```

---

## 🔍 VALIDATION RULES

### Create Ticket Type

1. **Name:** Required, 3-100 characters, unique per event
2. **Description:** Optional, max 500 characters
3. **Price:**
   - Required if `is_free=false` and `is_donation=false`
   - Must be `>= 0`
   - Decimal with 2 decimal places
4. **Quantity:**
   - `quantity_total` required, must be `> 0`
   - `per_order_min >= 1`
   - `per_order_max >= per_order_min`
   - `per_order_max <= quantity_total`
5. **Sale Dates:**
   - `sale_start_at` required
   - `sale_end_at` required
   - `sale_start_at < sale_end_at`
   - `sale_end_at <= event.start_at`
6. **Refund Deadline:**
   - Optional
   - Must be `<= event.start_at`

### Update Ticket Type

- Tất cả fields optional
- Validation rules giống Create
- Thêm restrictions:
  - Cannot reduce `quantity_total < quantity_sold`
  - Cannot change `is_free`/`is_donation` if `quantity_sold > 0`

---

## ⚠️ ERROR HANDLING

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

### Common Errors

| Status Code | Condition        | Message                                  | Solution                       |
| ----------- | ---------------- | ---------------------------------------- | ------------------------------ |
| `400`       | Invalid price    | "Price required for paid tickets"        | Set price or make is_free=true |
| `400`       | Quantity too low | "Cannot reduce quantity below sold"      | Increase quantity_total        |
| `400`       | Date conflict    | "sale_end_at must be before event start" | Fix dates                      |
| `403`       | No permission    | "Only ORGANIZER_ADMIN can delete"        | Check user role                |
| `404`       | Not found        | "Ticket type not found"                  | Verify ticket type ID          |
| `409`       | Name conflict    | "Ticket type name already exists"        | Use different name             |

---

## 💻 CODE EXAMPLES

### React/TypeScript Example

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

// services/ticketTypeService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const ticketTypeService = {
  // Tạo ticket type mới
  async createTicketType(
    eventId: string,
    data: CreateTicketTypeRequest,
    token: string,
  ): Promise<TicketType> {
    const response = await axios.post(
      `${API_BASE_URL}/ticket-types/events/${eventId}`,
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

  // Lấy ticket types của event (public)
  async getTicketTypes(
    eventId: string,
    params?: {
      only_on_sale?: boolean;
      include_inactive?: boolean;
    },
  ): Promise<TicketType[]> {
    const response = await axios.get(
      `${API_BASE_URL}/ticket-types/events/${eventId}`,
      { params },
    );
    return response.data;
  },

  // Lấy chi tiết ticket type
  async getTicketTypeById(id: string, token: string): Promise<TicketType> {
    const response = await axios.get(`${API_BASE_URL}/ticket-types/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Cập nhật ticket type
  async updateTicketType(
    id: string,
    data: Partial<CreateTicketTypeRequest>,
    token: string,
  ): Promise<TicketType> {
    const response = await axios.patch(
      `${API_BASE_URL}/ticket-types/${id}`,
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

  // Disable ticket type
  async disableTicketType(
    id: string,
    reason?: string,
    token: string,
  ): Promise<void> {
    await axios.put(
      `${API_BASE_URL}/ticket-types/${id}/disable`,
      { reason },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
  },

  // Xóa ticket type
  async deleteTicketType(id: string, token: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/ticket-types/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
```

### Example Usage in React

```tsx
// components/TicketTypesManager.tsx
import React, { useState, useEffect } from 'react';
import { ticketTypeService } from '../services/ticketTypeService';

const TicketTypesManager = ({ eventId, token }) => {
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicketTypes();
  }, [eventId]);

  const loadTicketTypes = async () => {
    try {
      const data = await ticketTypeService.getTicketTypes(eventId, {
        include_inactive: true,
      });
      setTicketTypes(data);
    } catch (error) {
      console.error('Failed to load ticket types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    try {
      await ticketTypeService.createTicketType(eventId, formData, token);
      await loadTicketTypes(); // Reload
      alert('Ticket type created successfully!');
    } catch (error) {
      alert('Failed to create ticket type: ' + error.message);
    }
  };

  const handleDisable = async (id) => {
    if (!confirm('Disable this ticket type?')) return;

    try {
      await ticketTypeService.disableTicketType(id, 'Manually disabled', token);
      await loadTicketTypes();
      alert('Ticket type disabled');
    } catch (error) {
      alert('Failed to disable: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="ticket-types-manager">
      <h2>Ticket Types</h2>

      <button onClick={() => setShowCreateForm(true)}>
        + Create Ticket Type
      </button>

      <div className="ticket-types-list">
        {ticketTypes.map((tt) => (
          <div key={tt.id} className="ticket-type-card">
            <h3>{tt.name}</h3>
            <p>{tt.description}</p>
            <p className="price">
              {tt.is_free ? 'FREE' : `${tt.price} ${tt.currency}`}
            </p>
            <p className="quantity">
              Sold: {tt.quantity_sold} / {tt.quantity_total}(
              {tt.percentage_sold}%)
            </p>
            <span
              className={`status ${tt.is_on_sale ? 'on-sale' : 'off-sale'}`}
            >
              {tt.is_on_sale ? 'On Sale' : 'Not On Sale'}
            </span>

            <div className="actions">
              <button onClick={() => handleEdit(tt)}>Edit</button>
              <button onClick={() => handleDisable(tt.id)}>Disable</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketTypesManager;
```

### Create Ticket Type Form Example

```tsx
// components/CreateTicketTypeForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';

const CreateTicketTypeForm = ({ eventId, onSubmit, onCancel }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const isFree = watch('is_free');
  const isDonation = watch('is_donation');

  const onFormSubmit = (data) => {
    // Format dates to ISO 8601
    const formData = {
      ...data,
      price: isFree || isDonation ? 0 : parseFloat(data.price),
      quantity_total: parseInt(data.quantity_total),
      per_order_min: parseInt(data.per_order_min) || 1,
      per_order_max: parseInt(data.per_order_max) || 10,
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="create-ticket-form">
      <h3>Create Ticket Type</h3>

      <div className="form-group">
        <label>Name *</label>
        <input
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 3, message: 'Min 3 characters' },
          })}
          placeholder="VIP, Standard, Early Bird..."
        />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          {...register('description')}
          placeholder="Describe this ticket type..."
          rows={3}
        />
      </div>

      <div className="form-group checkboxes">
        <label>
          <input type="checkbox" {...register('is_free')} />
          Free Ticket
        </label>
        <label>
          <input type="checkbox" {...register('is_donation')} />
          Donation-based
        </label>
      </div>

      {!isFree && !isDonation && (
        <div className="form-group">
          <label>Price (VNĐ) *</label>
          <input
            type="number"
            {...register('price', {
              required: 'Price is required',
              min: { value: 0, message: 'Price must be >= 0' },
            })}
            placeholder="500000"
          />
          {errors.price && (
            <span className="error">{errors.price.message}</span>
          )}
        </div>
      )}

      <div className="form-group">
        <label>Total Quantity *</label>
        <input
          type="number"
          {...register('quantity_total', {
            required: 'Quantity is required',
            min: { value: 1, message: 'Must be at least 1' },
          })}
          placeholder="100"
        />
        {errors.quantity_total && (
          <span className="error">{errors.quantity_total.message}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Min per order</label>
          <input
            type="number"
            {...register('per_order_min')}
            defaultValue={1}
            min={1}
          />
        </div>
        <div className="form-group">
          <label>Max per order</label>
          <input
            type="number"
            {...register('per_order_max')}
            defaultValue={10}
            min={1}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Sale Start *</label>
          <input
            type="datetime-local"
            {...register('sale_start_at', { required: 'Required' })}
          />
        </div>
        <div className="form-group">
          <label>Sale End *</label>
          <input
            type="datetime-local"
            {...register('sale_end_at', { required: 'Required' })}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Refund Deadline (optional)</label>
        <input type="datetime-local" {...register('refund_policy_deadline')} />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit">Create Ticket Type</button>
      </div>
    </form>
  );
};

export default CreateTicketTypeForm;
```

---

## 🎯 USE CASES

### Use Case 1: Early Bird Pricing

```json
// Tạo 2 ticket types với giá khác nhau
[
  {
    "name": "Early Bird",
    "price": 300000,
    "quantity_total": 50,
    "sale_start_at": "2024-01-01T00:00:00Z",
    "sale_end_at": "2024-03-31T23:59:59Z" // Ends early
  },
  {
    "name": "Regular Price",
    "price": 500000,
    "quantity_total": 450,
    "sale_start_at": "2024-04-01T00:00:00Z",
    "sale_end_at": "2024-12-24T23:59:59Z"
  }
]
```

**Result:**

- Early buyers pay 300k (limited 50 tickets)
- After March 31, only 500k tickets available

---

### Use Case 2: VIP + Standard + Free

```json
[
  {
    "name": "VIP",
    "price": 1000000,
    "quantity_total": 20,
    "per_order_max": 2, // Max 2 VIP tickets per person
    "description": "Front row seats + backstage pass"
  },
  {
    "name": "Standard",
    "price": 300000,
    "quantity_total": 500
  },
  {
    "name": "Free Student Pass",
    "is_free": true,
    "quantity_total": 100,
    "per_order_max": 1 // Max 1 free ticket per person
  }
]
```

---

### Use Case 3: Charity Donation Event

```json
{
  "name": "Support Our Cause",
  "is_donation": true,
  "quantity_total": 1000,
  "description": "Pay what you can to support our mission"
}
```

**Frontend Flow:**

```tsx
// User inputs donation amount
<input
  type="number"
  placeholder="Enter donation amount (VNĐ)"
  min="10000"
  onChange={(e) => setDonationAmount(e.target.value)}
/>

// Submit order
{
  "ticket_type_id": "donation-ticket-id",
  "quantity": 1,
  "donation_amount": 100000  // User-specified
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

### Flow Tạo Event → Ticket Types → Orders

```
1. Tạo Event (Events API)
   POST /events
   ↓
2. Tạo Ticket Types (Ticket Types API)
   POST /ticket-types/events/:eventId
   ↓
3. Publish Event
   POST /events/:id/publish
   ↓
4. Customers xem ticket types
   GET /ticket-types/events/:eventId?only_on_sale=true
   ↓
5. Customers tạo order (Orders API - next)
   POST /orders/events/:eventId
```

---

## 📝 CHECKLIST IMPLEMENTATION

### Backend (NestJS)

- [x] TicketTypesModule exists
- [x] CRUD endpoints implemented
- [ ] Validation rules complete
- [ ] Permission guards working
- [ ] Computed fields (is_on_sale, quantity_available)
- [ ] Error handling

### Frontend (React/Next.js)

- [ ] Service layer (axios calls)
- [ ] Ticket type list component
- [ ] Create/Edit form
- [ ] Sale status badges
- [ ] Availability display
- [ ] Error handling & validation

---

**Cập nhật lần cuối:** 2025-01-22  
**Phiên bản:** 1.0  
**API Status:** ✅ Backend implemented, ⏳ Testing needed
