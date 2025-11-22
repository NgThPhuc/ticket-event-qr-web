# TÀI LIỆU API EVENTS - CHO FRONTEND

## 📋 TỔNG QUAN

Module Events cho phép quản lý sự kiện (events) trong hệ thống. Mỗi event thuộc về một organization và có thể là OFFLINE, ONLINE, hoặc HYBRID.

**Base URL:** `http://localhost:3000/events` (hoặc domain production)

**Authentication:** Tất cả endpoints đều yêu cầu JWT token trong header:
```
Authorization: Bearer {access_token}
```

---

## 🔐 PHÂN QUYỀN

### Roles có thể sử dụng Events API:

| Role | Quyền |
|------|-------|
| **PLATFORM_ADMIN** | Tất cả quyền |
| **ORGANIZER_ADMIN** | CRUD events, publish, cancel, complete, delete |
| **EVENT_MANAGER** | CRUD events, publish (KHÔNG thể cancel, complete, delete) |
| **CHECKIN_STAFF** | Chỉ xem events (read-only) |
| **CUSTOMER** | Chỉ xem events công khai (read-only) |

---

## 📡 API ENDPOINTS

### 1. Tạo Event Mới

**Endpoint:** `POST /events`

**Quyền:** `ORGANIZER_ADMIN`, `EVENT_MANAGER`

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "organization_id": "uuid-string",  // Required trong body (hoặc từ context)
  "title": "Tech Summit 2024",        // Required, 3-200 chars
  "subtitle": "Hội nghị công nghệ hàng đầu",  // Optional, max 500 chars
  "description": "Mô tả chi tiết về sự kiện...",  // Optional, max 5000 chars
  "attendance_mode": "OFFLINE",      // Required: "OFFLINE" | "ONLINE" | "HYBRID"
  "timezone": "Asia/Ho_Chi_Minh",    // Required, IANA timezone
  "start_at": "2024-12-25T09:00:00Z",  // Required, ISO 8601
  "end_at": "2024-12-25T17:00:00Z",    // Required, ISO 8601
  "is_all_day": false,               // Optional, default: false
  
  // OFFLINE/HYBRID fields (required nếu attendance_mode là OFFLINE hoặc HYBRID)
  "venue_name": "Trung tâm Hội nghị Quốc gia",  // Required cho OFFLINE/HYBRID
  "address_line1": "123 Đường ABC",            // Required cho OFFLINE/HYBRID
  "address_line2": "Tầng 5",                  // Optional
  "city": "Hà Nội",                           // Required cho OFFLINE/HYBRID
  "district": "Quận Ba Đình",                  // Optional
  "country": "Việt Nam",                       // Optional
  "postal_code": "100000",                     // Optional
  "geo_lat": 21.0285,                         // Optional, -90 to 90
  "geo_lng": 105.8542,                        // Optional, -180 to 180
  
  // ONLINE/HYBRID fields (required nếu attendance_mode là ONLINE hoặc HYBRID)
  "meeting_url": "https://zoom.us/j/123456789",  // Required cho ONLINE/HYBRID
  "stream_platform": "Zoom",                    // Optional
  
  // Optional fields
  "capacity_total": 500,                       // Optional, số nguyên > 0
  "category": "Technology",                     // Optional, max 100 chars
  "tags": ["tech", "conference", "networking"], // Optional, array of strings
  "organizer_name": "Tech Corp",                // Optional, override từ organization
  "organizer_email": "contact@techcorp.com",    // Optional
  "organizer_phone": "0123456789",              // Optional
  "website_url": "https://techsummit.com",      // Optional, valid URL
  "contact_email": "info@techsummit.com",      // Optional
  "contact_phone": "0987654321",               // Optional
  "age_restriction": "18+",                    // Optional, max 50 chars
  "refund_policy": "Hoàn tiền 100% nếu hủy trước 7 ngày",  // Optional, max 1000 chars
  "terms_url": "https://techsummit.com/terms",  // Optional, valid URL
  "privacy_url": "https://techsummit.com/privacy"  // Optional, valid URL
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "slug": "tech-summit-2024",
  "title": "Tech Summit 2024",
  "subtitle": "Hội nghị công nghệ hàng đầu",
  "description": "Mô tả chi tiết về sự kiện...",
  "attendance_mode": "OFFLINE",
  "timezone": "Asia/Ho_Chi_Minh",
  "start_at": "2024-12-25T09:00:00.000Z",
  "end_at": "2024-12-25T17:00:00.000Z",
  "is_all_day": false,
  "status": "DRAFT",
  "visibility": "PUBLIC",
  "venue_name": "Trung tâm Hội nghị Quốc gia",
  "address_line1": "123 Đường ABC",
  "city": "Hà Nội",
  "organization_id": "uuid",
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Token không hợp lệ
- `403 Forbidden`: Không có quyền
- `404 Not Found`: Organization không tồn tại

---

### 2. Xem Danh Sách Events (Public - Không cần đăng nhập)

**Endpoint:** `GET /events/public`

**Quyền:** Không cần authentication (public endpoint)

**Query Parameters:** Tương tự như `GET /events`, nhưng:
- Không có `organization_id` (chỉ lấy events công khai)
- Tự động filter: `status = PUBLISHED`, `visibility = PUBLIC`

**Example:**
```http
GET /events/public?attendance_mode=OFFLINE&q=tech&page=1&limit=20&sort=start_at:desc
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "tech-summit-2024",
      "title": "Tech Summit 2024",
      "subtitle": "Hội nghị công nghệ hàng đầu",
      "attendance_mode": "OFFLINE",
      "start_at": "2024-12-25T09:00:00.000Z",
      "end_at": "2024-12-25T17:00:00.000Z",
      "status": "PUBLISHED",
      "visibility": "PUBLIC",
      "venue_name": "Trung tâm Hội nghị Quốc gia",
      "city": "Hà Nội",
      "cover_image_url": "https://...",
      "organization": {
        "id": "uuid",
        "name": "Tech Corp",
        "slug": "tech-corp",
        "logo_url": "https://..."
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Lưu ý:**
- Endpoint này **KHÔNG cần** Authorization header
- Chỉ trả về events có `status = PUBLISHED` và `visibility = PUBLIC`
- Phù hợp cho trang chủ website, không cần đăng nhập
- Không có `organization_id` parameter (chỉ lấy events công khai từ tất cả organizations)

---

### 2.1. Xem Danh Sách Events (Private - Cần đăng nhập)

**Endpoint:** `GET /events`

**Quyền:** Tất cả users (đã đăng nhập)

**Query Parameters:**
```http
GET /events?organization_id=uuid&status=PUBLISHED&attendance_mode=OFFLINE&time_from=2024-01-01&time_to=2024-12-31&q=tech&category=Technology&page=1&limit=20&sort=start_at:desc
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `organization_id` | string | Filter theo organization | `?organization_id=uuid` |
| `status` | string | Filter theo status (comma-separated) | `?status=PUBLISHED,DRAFT` |
| `attendance_mode` | enum | `OFFLINE`, `ONLINE`, `HYBRID` | `?attendance_mode=OFFLINE` |
| `time_from` | ISO date | Filter events từ ngày | `?time_from=2024-01-01T00:00:00Z` |
| `time_to` | ISO date | Filter events đến ngày | `?time_to=2024-12-31T23:59:59Z` |
| `q` | string | Full-text search | `?q=tech summit` |
| `category` | string | Filter theo category | `?category=Technology` |
| `page` | number | Số trang (default: 1) | `?page=1` |
| `limit` | number | Số items/trang (default: 20, max: 100) | `?limit=20` |
| `sort` | string | Sort field:direction | `?sort=start_at:desc` hoặc `?sort=-start_at` |

**Sort Options:**
- `start_at:desc` hoặc `-start_at` - Sắp xếp theo thời gian bắt đầu (mới nhất trước)
- `start_at:asc` hoặc `start_at` - Sắp xếp theo thời gian bắt đầu (cũ nhất trước)
- `created_at:desc` - Sắp xếp theo ngày tạo (mới nhất trước)
- `title:asc` - Sắp xếp theo tiêu đề (A-Z)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "tech-summit-2024",
      "title": "Tech Summit 2024",
      "subtitle": "Hội nghị công nghệ hàng đầu",
      "attendance_mode": "OFFLINE",
      "start_at": "2024-12-25T09:00:00.000Z",
      "end_at": "2024-12-25T17:00:00.000Z",
      "status": "PUBLISHED",
      "venue_name": "Trung tâm Hội nghị Quốc gia",
      "city": "Hà Nội",
      "cover_image_url": "https://...",
      "organization": {
        "id": "uuid",
        "name": "Tech Corp",
        "slug": "tech-corp"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 3. Xem Chi Tiết Event (theo ID)

**Endpoint:** `GET /events/:id`

**Quyền:** Tất cả users (đã đăng nhập), nhưng chỉ xem được events của organizations mà họ là member (trừ PUBLIC events)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `expand` | string | Expand relations: `organization`, `ticket_types`, `creator` (comma-separated) |

**Example:**
```http
GET /events/uuid?expand=organization,ticket_types,creator
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "slug": "tech-summit-2024",
  "title": "Tech Summit 2024",
  "subtitle": "Hội nghị công nghệ hàng đầu",
  "description": "Mô tả chi tiết...",
  "attendance_mode": "OFFLINE",
  "timezone": "Asia/Ho_Chi_Minh",
  "start_at": "2024-12-25T09:00:00.000Z",
  "end_at": "2024-12-25T17:00:00.000Z",
  "is_all_day": false,
  "status": "PUBLISHED",
  "visibility": "PUBLIC",
  "venue_name": "Trung tâm Hội nghị Quốc gia",
  "address_line1": "123 Đường ABC",
  "address_line2": "Tầng 5",
  "city": "Hà Nội",
  "district": "Quận Ba Đình",
  "country": "Việt Nam",
  "postal_code": "100000",
  "geo_lat": 21.0285,
  "geo_lng": 105.8542,
  "capacity_total": 500,
  "category": "Technology",
  "tags": ["tech", "conference", "networking"],
  "cover_image_url": "https://...",
  "gallery": ["https://...", "https://..."],
  "organization_id": "uuid",
  "organization": {
    "id": "uuid",
    "name": "Tech Corp",
    "slug": "tech-corp",
    "logo_url": "https://..."
  },
  "created_by": "uuid",
  "creator": {
    "id": "uuid",
    "full_name": "Nguyễn Văn A",
    "email": "a@example.com"
  },
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: Event không tồn tại hoặc không có quyền xem

---

### 4. Xem Chi Tiết Event (theo Slug) - Public

**Endpoint:** `GET /events/slug/:slug`

**Quyền:** Không cần authentication (public endpoint)

**Example:**
```http
GET /events/slug/tech-summit-2024?expand=organization,ticket_types
```

**Response:** Tương tự như `GET /events/:id`

**Lưu ý:** Endpoint này chỉ trả về events có `status = PUBLISHED` và `visibility = PUBLIC`

---

### 5. Cập Nhật Event (Full Update)

**Endpoint:** `PUT /events/:id`

**Quyền:** `ORGANIZER_ADMIN`, `EVENT_MANAGER`

**Request Body:** Tương tự như Create Event, nhưng tất cả fields đều optional (trừ khi cần validate attendance_mode)

**Response (200 OK):** Event object đã được cập nhật

**Lưu ý:** PUT sẽ thay thế toàn bộ fields, nếu không gửi field nào thì field đó sẽ bị set về null/undefined

---

### 6. Cập Nhật Event (Partial Update)

**Endpoint:** `PATCH /events/:id`

**Quyền:** `ORGANIZER_ADMIN`, `EVENT_MANAGER`

**Request Body:** Chỉ gửi các fields cần cập nhật

**Example:**
```json
{
  "title": "Tech Summit 2024 - Updated",
  "description": "Mô tả mới..."
}
```

**Response (200 OK):** Event object đã được cập nhật

---

### 7. Xóa Event

**Endpoint:** `DELETE /events/:id`

**Quyền:** `ORGANIZER_ADMIN` only

**Response:** `204 No Content` (không có body)

**Lưu ý:** 
- Chỉ ORGANIZER_ADMIN mới có quyền xóa
- EVENT_MANAGER không thể xóa events

---

### 8. Publish Event

**Endpoint:** `POST /events/:id/publish`

**Quyền:** `ORGANIZER_ADMIN`, `EVENT_MANAGER`

**Headers:**
```http
Authorization: Bearer {token}
Idempotency-Key: unique-key-123  // Optional, để tránh duplicate publish
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "PUBLISHED",
  "published_at": "2024-01-15T10:00:00.000Z",
  "message": "Event đã được publish thành công"
}
```

**Lưu ý:**
- Event phải ở trạng thái `DRAFT` hoặc `SCHEDULED` mới có thể publish
- Sau khi publish, event sẽ hiển thị công khai (nếu `visibility = PUBLIC`)

---

### 9. Hủy Event

**Endpoint:** `POST /events/:id/cancel`

**Quyền:** `ORGANIZER_ADMIN` only

**Request Body:**
```json
{
  "reason": "Lý do hủy sự kiện...",  // Optional, max 1000 chars
  "notify_attendees": true            // Optional, default: false
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "cancelled_at": "2024-01-15T10:00:00.000Z",
  "message": "Event đã được hủy"
}
```

**Lưu ý:** 
- Chỉ ORGANIZER_ADMIN mới có quyền hủy
- EVENT_MANAGER không thể hủy events

---

### 10. Hoàn Thành Event

**Endpoint:** `POST /events/:id/complete`

**Quyền:** `ORGANIZER_ADMIN` only

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "message": "Event đã được đánh dấu hoàn thành"
}
```

**Lưu ý:** 
- Chỉ ORGANIZER_ADMIN mới có quyền đánh dấu hoàn thành
- EVENT_MANAGER không thể complete events

---

## 📝 DATA MODELS

### Event Status Enum

```typescript
enum EventStatus {
  DRAFT = 'DRAFT',           // Nháp
  SCHEDULED = 'SCHEDULED',   // Đã lên lịch
  PUBLISHED = 'PUBLISHED',   // Đã công bố
  POSTPONED = 'POSTPONED',   // Hoãn lại
  CANCELLED = 'CANCELLED',   // Đã hủy
  COMPLETED = 'COMPLETED'    // Đã hoàn thành
}
```

### Attendance Mode Enum

```typescript
enum AttendanceMode {
  OFFLINE = 'OFFLINE',  // Sự kiện trực tiếp
  ONLINE = 'ONLINE',    // Sự kiện trực tuyến
  HYBRID = 'HYBRID'     // Sự kiện kết hợp
}
```

### Event Visibility Enum

```typescript
enum EventVisibility {
  PUBLIC = 'PUBLIC',     // Công khai
  UNLISTED = 'UNLISTED', // Không liệt kê (có link thì xem được)
  PRIVATE = 'PRIVATE'    // Riêng tư (chỉ members)
}
```

### Event Object (Full)

```typescript
interface Event {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  attendance_mode: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  timezone: string;  // IANA timezone, e.g., "Asia/Ho_Chi_Minh"
  start_at: string;  // ISO 8601
  end_at: string;    // ISO 8601
  is_all_day: boolean;
  status: EventStatus;
  visibility: EventVisibility;
  
  // OFFLINE/HYBRID fields
  venue_name?: string;
  address_line1?: string;
  address_line2?: string;
  district?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  geo_lat?: number;
  geo_lng?: number;
  
  // ONLINE/HYBRID fields
  meeting_url?: string;
  stream_platform?: string;
  
  // Optional fields
  capacity_total?: number;
  category?: string;
  tags?: string[];
  cover_image_url?: string;
  gallery?: string[];
  
  // Organizer override
  organizer_name?: string;
  organizer_email?: string;
  organizer_phone?: string;
  
  // Contact & Policies
  contact_email?: string;
  contact_phone?: string;
  website_url?: string;
  age_restriction?: string;
  refund_policy?: string;
  terms_url?: string;
  privacy_url?: string;
  
  // Relations
  organization_id: string;
  organization?: Organization;
  created_by: string;
  creator?: User;
  updated_by?: string;
  updater?: User;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  cancelled_at?: string;
  postponed_at?: string;
}
```

---

## 🔍 VALIDATION RULES

### Create Event

1. **Title:** Required, 3-200 characters
2. **Subtitle:** Optional, max 500 characters
3. **Description:** Optional, max 5000 characters
4. **Attendance Mode:** Required, must be OFFLINE, ONLINE, or HYBRID
5. **Timezone:** Required, must be valid IANA timezone (e.g., "Asia/Ho_Chi_Minh")
6. **Start/End Time:** Required, ISO 8601 format, `end_at` must be after `start_at`
7. **OFFLINE/HYBRID:** Requires `venue_name`, `address_line1`, `city`
8. **ONLINE/HYBRID:** Requires `meeting_url`
9. **URLs:** Must be valid URLs (website_url, terms_url, privacy_url, meeting_url)
10. **Email:** Must be valid email format (organizer_email, contact_email)
11. **Phone:** Must match pattern `^[0-9\-\+\(\)\s]+$`
12. **Coordinates:** `geo_lat` (-90 to 90), `geo_lng` (-180 to 180)
13. **Capacity:** Must be integer > 0

### Update Event

- Tất cả fields đều optional
- Validation rules giống Create Event (chỉ áp dụng cho fields được gửi)

---

## ⚠️ ERROR HANDLING

### Error Response Format

```json
{
  "statusCode": 400,
  "message": ["title must be longer than or equal to 3 characters"],
  "error": "Bad Request"
}
```

### Common Error Codes

| Status Code | Description | Solution |
|-------------|-------------|----------|
| `400 Bad Request` | Validation error | Kiểm tra request body theo validation rules |
| `401 Unauthorized` | Token không hợp lệ hoặc hết hạn | Login lại để lấy token mới |
| `403 Forbidden` | Không có quyền thực hiện action | Kiểm tra role của user |
| `404 Not Found` | Event không tồn tại | Kiểm tra event ID/slug |
| `409 Conflict` | Slug đã tồn tại | Thử lại với title khác |

---

## 💻 CODE EXAMPLES

### React/TypeScript Example

```typescript
// types/event.ts
export interface CreateEventRequest {
  organization_id: string;
  title: string;
  subtitle?: string;
  description?: string;
  attendance_mode: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  timezone: string;
  start_at: string;
  end_at: string;
  is_all_day?: boolean;
  venue_name?: string;
  address_line1?: string;
  city?: string;
  meeting_url?: string;
  // ... other fields
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  // ... full event object
}

// services/eventService.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const eventService = {
  // Tạo event mới
  async createEvent(data: CreateEventRequest, token: string): Promise<Event> {
    const response = await axios.post(
      `${API_BASE_URL}/events`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  // Lấy danh sách events (public - không cần token)
  async getPublicEvents(params: {
    attendance_mode?: string;
    time_from?: string;
    time_to?: string;
    page?: number;
    limit?: number;
    sort?: string;
    q?: string;
    category?: string;
  }): Promise<{ data: Event[]; meta: any }> {
    const response = await axios.get(
      `${API_BASE_URL}/events/public`,
      { params }
    );
    return response.data;
  },

  // Lấy danh sách events (private - cần token)
  async getEvents(params: {
    organization_id?: string;
    status?: string;
    attendance_mode?: string;
    page?: number;
    limit?: number;
    sort?: string;
    q?: string;
  }, token: string): Promise<{ data: Event[]; meta: any }> {
    const response = await axios.get(
      `${API_BASE_URL}/events`,
      {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  // Lấy chi tiết event
  async getEventById(id: string, token: string, expand?: string): Promise<Event> {
    const response = await axios.get(
      `${API_BASE_URL}/events/${id}`,
      {
        params: expand ? { expand } : {},
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  // Lấy event theo slug (public)
  async getEventBySlug(slug: string, expand?: string): Promise<Event> {
    const response = await axios.get(
      `${API_BASE_URL}/events/slug/${slug}`,
      {
        params: expand ? { expand } : {},
      }
    );
    return response.data;
  },

  // Cập nhật event
  async updateEvent(
    id: string,
    data: Partial<CreateEventRequest>,
    token: string
  ): Promise<Event> {
    const response = await axios.patch(
      `${API_BASE_URL}/events/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  // Xóa event
  async deleteEvent(id: string, token: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/events/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  // Publish event
  async publishEvent(id: string, token: string, idempotencyKey?: string): Promise<Event> {
    const headers: any = {
      Authorization: `Bearer ${token}`,
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    
    const response = await axios.post(
      `${API_BASE_URL}/events/${id}/publish`,
      {},
      { headers }
    );
    return response.data;
  },

  // Hủy event
  async cancelEvent(
    id: string,
    reason?: string,
    notifyAttendees?: boolean,
    token: string
  ): Promise<Event> {
    const response = await axios.post(
      `${API_BASE_URL}/events/${id}/cancel`,
      { reason, notify_attendees: notifyAttendees },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  // Hoàn thành event
  async completeEvent(id: string, token: string): Promise<Event> {
    const response = await axios.post(
      `${API_BASE_URL}/events/${id}/complete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};
```

### React Component Example

```typescript
// components/EventForm.tsx
import React, { useState } from 'react';
import { eventService } from '../services/eventService';

interface EventFormProps {
  organizationId: string;
  token: string;
  onSuccess?: (event: Event) => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  organizationId,
  token,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    attendance_mode: 'OFFLINE' as const,
    timezone: 'Asia/Ho_Chi_Minh',
    start_at: '',
    end_at: '',
    venue_name: '',
    address_line1: '',
    city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const event = await eventService.createEvent(
        {
          organization_id: organizationId,
          ...formData,
        },
        token
      );
      onSuccess?.(event);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="text"
        placeholder="Tiêu đề sự kiện"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
        minLength={3}
        maxLength={200}
      />

      <select
        value={formData.attendance_mode}
        onChange={(e) =>
          setFormData({
            ...formData,
            attendance_mode: e.target.value as any,
          })
        }
      >
        <option value="OFFLINE">Offline</option>
        <option value="ONLINE">Online</option>
        <option value="HYBRID">Hybrid</option>
      </select>

      {formData.attendance_mode !== 'ONLINE' && (
        <>
          <input
            type="text"
            placeholder="Tên địa điểm"
            value={formData.venue_name}
            onChange={(e) =>
              setFormData({ ...formData, venue_name: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Địa chỉ"
            value={formData.address_line1}
            onChange={(e) =>
              setFormData({ ...formData, address_line1: e.target.value })
            }
            required
          />
          <input
            type="text"
            placeholder="Thành phố"
            value={formData.city}
            onChange={(e) =>
              setFormData({ ...formData, city: e.target.value })
            }
            required
          />
        </>
      )}

      {formData.attendance_mode !== 'OFFLINE' && (
        <input
          type="url"
          placeholder="Meeting URL"
          value={formData.meeting_url || ''}
          onChange={(e) =>
            setFormData({ ...formData, meeting_url: e.target.value })
          }
          required
        />
      )}

      <input
        type="datetime-local"
        value={formData.start_at}
        onChange={(e) =>
          setFormData({ ...formData, start_at: e.target.value })
        }
        required
      />

      <input
        type="datetime-local"
        value={formData.end_at}
        onChange={(e) =>
          setFormData({ ...formData, end_at: e.target.value })
        }
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Đang tạo...' : 'Tạo sự kiện'}
      </button>
    </form>
  );
};
```

---

## 🎯 USE CASES

### Use Case 1: Tạo Event Mới

```typescript
// 1. User chọn organization
const organizationId = 'uuid-organization';

// 2. Điền form tạo event
const eventData = {
  organization_id: organizationId,
  title: 'Tech Summit 2024',
  attendance_mode: 'OFFLINE',
  timezone: 'Asia/Ho_Chi_Minh',
  start_at: '2024-12-25T09:00:00Z',
  end_at: '2024-12-25T17:00:00Z',
  venue_name: 'Trung tâm Hội nghị',
  address_line1: '123 Đường ABC',
  city: 'Hà Nội',
};

// 3. Gọi API
const event = await eventService.createEvent(eventData, token);

// 4. Event được tạo với status = DRAFT
console.log(event.status); // "DRAFT"
```

### Use Case 2: Publish Event

```typescript
// 1. Event đã được tạo (status = DRAFT)
const eventId = 'uuid-event';

// 2. Publish event
const publishedEvent = await eventService.publishEvent(eventId, token);

// 3. Event status chuyển thành PUBLISHED
console.log(publishedEvent.status); // "PUBLISHED"
```

### Use Case 3: Tìm Kiếm Events (Public - Không cần đăng nhập)

```typescript
// Tìm kiếm events công khai - KHÔNG CẦN TOKEN
const results = await eventService.getPublicEvents({
  q: 'tech summit',
  attendance_mode: 'OFFLINE',
  page: 1,
  limit: 20,
  sort: 'start_at:desc',
});

console.log(results.data); // Array of events (chỉ PUBLISHED + PUBLIC)
console.log(results.meta); // Pagination info
```

### Use Case 3.1: Tìm Kiếm Events (Private - Cần đăng nhập)

```typescript
// Tìm kiếm events - CẦN TOKEN
const results = await eventService.getEvents(
  {
    organization_id: 'uuid',
    status: 'PUBLISHED',
    q: 'tech summit',
    page: 1,
    limit: 20,
    sort: 'start_at:desc',
  },
  token
);

console.log(results.data); // Array of events
console.log(results.meta); // Pagination info
```

### Use Case 4: Xem Event Public (không cần auth)

```typescript
// Lấy event theo slug (public endpoint)
const event = await eventService.getEventBySlug('tech-summit-2024', 'organization,ticket_types');

// Hiển thị thông tin event cho customer
console.log(event.title);
console.log(event.organization.name);
console.log(event.ticket_types); // Nếu expand
```

---

## 📌 LƯU Ý QUAN TRỌNG

1. **Public vs Private Endpoints:**
   - `GET /events/public` - **KHÔNG cần** authentication, chỉ lấy events `PUBLISHED` + `PUBLIC`
   - `GET /events` - **CẦN** authentication, lấy events theo quyền của user
   - Dùng `/events/public` cho trang chủ website, không cần đăng nhập

2. **Organization Context:**
   - Khi tạo event, phải gửi `organization_id` trong body
   - Hoặc đảm bảo user đã chọn organization trước đó

3. **Timezone:**
   - Luôn sử dụng IANA timezone format: `Asia/Ho_Chi_Minh`
   - Không dùng offset như `+07:00`

4. **Date Format:**
   - Luôn sử dụng ISO 8601: `2024-12-25T09:00:00Z`
   - Frontend nên convert từ local datetime picker sang ISO format

5. **Validation:**
   - OFFLINE/HYBRID events yêu cầu: `venue_name`, `address_line1`, `city`
   - ONLINE/HYBRID events yêu cầu: `meeting_url`

6. **Permissions:**
   - EVENT_MANAGER không thể: delete, cancel, complete events
   - Chỉ ORGANIZER_ADMIN mới có đầy đủ quyền

7. **Slug:**
   - Slug được tự động generate từ title
   - Nếu slug đã tồn tại, sẽ thêm số vào cuối (e.g., `tech-summit-2024-1`)

8. **Pagination:**
   - Default: `page=1`, `limit=20`
   - Max limit: 100

---

## 🔗 LIÊN KẾT

- **Ticket Types API:** Sau khi tạo event, cần tạo ticket types
- **Orders API:** Customers sẽ đặt vé qua Orders API
- **My Tickets API:** Customers xem vé của mình

---

**Version:** 1.0  
**Last Updated:** 2025-01-XX  
**Tác giả:** AI Assistant

