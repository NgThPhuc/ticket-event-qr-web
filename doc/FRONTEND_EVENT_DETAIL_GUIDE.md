# TÀI LIỆU API EVENT DETAIL (CHI TIẾT SỰ KIỆN) - CHO FRONTEND

## 📋 TỔNG QUAN

Tài liệu này hướng dẫn Frontend tích hợp tính năng **Danh sách Sự kiện** và **Chi tiết Sự kiện** cho user công khai (không cần đăng nhập).

**Base URL:** `http://localhost:3000`

**Authentication:** Không cần token (Public endpoints)

---

## 📡 API ENDPOINTS

### 1. Danh sách Sự kiện (Public)

**Endpoint:** `GET /events/public`

**Quyền:** Public (Không cần đăng nhập)

**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số items/trang (default: 20, max: 100)
- `sort`: Sắp xếp (e.g., `start_at:desc`, `title:asc`)
- `q`: Tìm kiếm full-text (title, description)
- `category`: Lọc theo category
- `attendance_mode`: `OFFLINE` | `ONLINE` | `HYBRID`
- `time_from`: Lọc events từ ngày (ISO 8601)
- `time_to`: Lọc events đến ngày (ISO 8601)

**Example:**
```http
GET /events/public?page=1&limit=12&sort=start_at:desc
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
      "description": "Mô tả ngắn gọn...",
      "attendance_mode": "OFFLINE",
      "start_at": "2024-12-25T09:00:00.000Z",
      "end_at": "2024-12-25T17:00:00.000Z",
      "status": "PUBLISHED",
      "visibility": "PUBLIC",
      "venue_name": "Trung tâm Hội nghị Quốc gia",
      "address_line1": "123 Đường ABC",
      "city": "Hà Nội",
      "district": "Ba Đình",
      "category": "Technology",
      "cover_image_url": "https://example.com/cover.jpg",
      "organization": {
        "id": "org-uuid",
        "name": "Tech Corp",
        "slug": "tech-corp",
        "logo_url": "https://example.com/logo.jpg"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4
  }
}
```

**Lưu ý Frontend:**
1. Chỉ trả về events có `status = PUBLISHED` và `visibility = PUBLIC`
2. Tự động include thông tin `organization`
3. Không cần token
4. Lưu `slug` để navigate sang trang chi tiết

---

### 2. Chi tiết Sự kiện (Public)

**Endpoint:** `GET /events/slug/:slug`

**Quyền:** Public (Không cần đăng nhập)

**Path Parameters:**
- `slug`: Slug của sự kiện (VD: `tech-summit-2024`)

**Query Parameters:**
- `expand`: Expand relations (comma-separated)
  - `organization`: Thông tin organization
  - `ticket_types`: Danh sách loại vé
  - `creator`: Người tạo event

**Example:**
```http
GET /events/slug/tech-summit-2024?expand=organization,ticket_types
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "slug": "tech-summit-2024",
  "title": "Tech Summit 2024",
  "subtitle": "Hội nghị công nghệ hàng đầu Việt Nam",
  "description": "Mô tả chi tiết về sự kiện, chương trình, diễn giả...",
  "attendance_mode": "OFFLINE",
  "timezone": "Asia/Ho_Chi_Minh",
  "start_at": "2024-12-25T09:00:00.000Z",
  "end_at": "2024-12-25T17:00:00.000Z",
  "is_all_day": false,
  "status": "PUBLISHED",
  "visibility": "PUBLIC",
  
  // Thông tin địa điểm (OFFLINE/HYBRID)
  "venue_name": "Trung tâm Hội nghị Quốc gia",
  "address_line1": "123 Đường ABC",
  "address_line2": "Tầng 5, Tòa nhà XYZ",
  "city": "Hà Nội",
  "district": "Ba Đình",
  "country": "Việt Nam",
  "postal_code": "100000",
  "geo_lat": 21.0285,
  "geo_lng": 105.8542,
  
  // Thông tin online (ONLINE/HYBRID)
  "meeting_url": null,
  "stream_platform": null,
  
  // Thông tin bổ sung
  "capacity_total": 500,
  "category": "Technology",
  "tags": ["tech", "conference", "ai", "startup"],
  "cover_image_url": "https://example.com/cover.jpg",
  "gallery": [
    "https://example.com/img1.jpg",
    "https://example.com/img2.jpg"
  ],
  
  // Thông tin liên hệ
  "organizer_name": "Tech Corp",
  "organizer_email": "contact@techcorp.com",
  "organizer_phone": "0123456789",
  "contact_email": "info@techsummit.com",
  "contact_phone": "0987654321",
  "website_url": "https://techsummit.com",
  
  // Chính sách
  "age_restriction": "18+",
  "refund_policy": "Hoàn tiền 100% nếu hủy trước 7 ngày",
  "terms_url": "https://techsummit.com/terms",
  "privacy_url": "https://techsummit.com/privacy",
  
  // Relations (nếu expand)
  "organization": {
    "id": "org-uuid",
    "name": "Tech Corp",
    "slug": "tech-corp",
    "description": "Tổ chức hàng đầu về công nghệ",
    "logo_url": "https://example.com/logo.jpg",
    "website": "https://techcorp.com"
  },
  
  "ticket_types": [
    {
      "id": "ticket-uuid-1",
      "name": "VIP",
      "description": "Vé VIP với ghế ngồi hàng đầu",
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
      "is_active": true,
      "is_on_sale": true,
      "is_sold_out": false,
      "percentage_sold": 45
    },
    {
      "id": "ticket-uuid-2",
      "name": "Standard",
      "price": "200000.00",
      "quantity_available": 200,
      "is_on_sale": true
    },
    {
      "id": "ticket-uuid-3",
      "name": "Free Entry",
      "is_free": true,
      "price": "0.00",
      "quantity_available": 500,
      "is_on_sale": true
    }
  ],
  
  // Timestamps
  "created_at": "2024-01-15T10:00:00.000Z",
  "updated_at": "2024-01-15T10:00:00.000Z",
  "published_at": "2024-01-20T10:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: Event không tồn tại hoặc không phải PUBLIC

---

## 💻 CODE EXAMPLES (React/TypeScript)

### Service Layer

```typescript
// services/eventService.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const eventService = {
  // Lấy danh sách events public
  getPublicEvents: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    q?: string;
    category?: string;
    attendance_mode?: string;
    time_from?: string;
    time_to?: string;
  }) => {
    const res = await axios.get(`${API_URL}/events/public`, { params });
    return res.data;
  },

  // Lấy chi tiết event theo slug
  getEventBySlug: async (slug: string, expand?: string[]) => {
    const params = expand ? { expand: expand.join(',') } : {};
    const res = await axios.get(`${API_URL}/events/slug/${slug}`, { params });
    return res.data;
  }
};
```

### Types/Interfaces

```typescript
// types/event.ts
export interface Event {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  attendance_mode: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  timezone: string;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  status: string;
  visibility: string;
  venue_name?: string;
  address_line1?: string;
  city?: string;
  district?: string;
  category?: string;
  tags?: string[];
  cover_image_url?: string;
  organization?: Organization;
  ticket_types?: TicketType[];
  // ... other fields
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
  is_free: boolean;
  price: string;
  currency: string;
  quantity_available: number;
  is_on_sale: boolean;
  is_sold_out: boolean;
  // ... other fields
}
```

### React Component Example

```tsx
// pages/EventDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { Event } from '../types/event';

const EventDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const data = await eventService.getEventBySlug(
          slug, 
          ['organization', 'ticket_types']
        );
        setEvent(data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Không tìm thấy sự kiện');
        } else {
          setError('Có lỗi xảy ra khi tải sự kiện');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!event) return null;

  return (
    <div className="event-detail">
      {/* Cover Image */}
      {event.cover_image_url && (
        <img src={event.cover_image_url} alt={event.title} />
      )}

      {/* Event Info */}
      <h1>{event.title}</h1>
      {event.subtitle && <h2>{event.subtitle}</h2>}
      
      <div className="event-meta">
        <p>📅 {new Date(event.start_at).toLocaleDateString('vi-VN')}</p>
        <p>📍 {event.venue_name}, {event.city}</p>
        <p>🏢 {event.organization?.name}</p>
      </div>

      <div className="description">
        <p>{event.description}</p>
      </div>

      {/* Ticket Types */}
      <div className="ticket-types">
        <h3>Loại vé</h3>
        {event.ticket_types?.map(ticket => (
          <div key={ticket.id} className="ticket-card">
            <h4>{ticket.name}</h4>
            <p className="price">
              {ticket.is_free 
                ? 'MIỄN PHÍ' 
                : `${parseInt(ticket.price).toLocaleString()} VND`
              }
            </p>
            <p>Còn lại: {ticket.quantity_available} vé</p>
            <button 
              onClick={() => navigate(`/checkout/${event.id}`)}
              disabled={!ticket.is_on_sale || ticket.is_sold_out}
            >
              {ticket.is_sold_out ? 'Hết vé' : 'Đặt vé'}
            </button>
          </div>
        ))}
      </div>

      {/* Map (nếu có geo_lat, geo_lng) */}
      {event.geo_lat && event.geo_lng && (
        <div className="map">
          {/* Integrate Google Maps hoặc Leaflet */}
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
```

---

## 🎯 FLOW TÍCH HỢP

### 1. Trang Danh sách Sự kiện

**URL:** `/events`

**Flow:**
1. Component mount → Gọi `GET /events/public?page=1&limit=12`
2. Hiển thị danh sách event cards
3. User click vào 1 event → Navigate `/events/:slug`

### 2. Trang Chi tiết Sự kiện

**URL:** `/events/:slug`

**Flow:**
1. Lấy `slug` từ URL params
2. Gọi `GET /events/slug/:slug?expand=organization,ticket_types`
3. Hiển thị thông tin event đầy đủ
4. Hiển thị danh sách vé (ticket_types)
5. User chọn vé → Navigate `/checkout/:eventId`

---

## 🔍 SEARCH & FILTER

### Tìm kiếm:
```typescript
// Search by keyword
eventService.getPublicEvents({ q: 'tech conference' });
```

### Filter theo thời gian:
```typescript
// Events sắp diễn ra
eventService.getPublicEvents({
  time_from: new Date().toISOString(),
  sort: 'start_at:asc'
});

// Events trong tháng này
eventService.getPublicEvents({
  time_from: '2024-12-01T00:00:00Z',
  time_to: '2024-12-31T23:59:59Z'
});
```

### Filter theo category:
```typescript
eventService.getPublicEvents({ category: 'Technology' });
```

### Filter theo attendance_mode:
```typescript
// Chỉ events online
eventService.getPublicEvents({ attendance_mode: 'ONLINE' });
```

---

## 📌 BEST PRACTICES

1. **SEO-friendly URLs:** Dùng `/events/:slug` thay vì `/events/:id`
2. **Lazy loading images:** Optimize cover images và gallery
3. **Error handling:** Xử lý 404 khi event không tồn tại
4. **Loading states:** Hiển thị skeleton/spinner khi đang load
5. **Responsive design:** Tối ưu cho mobile
6. **Meta tags:** Set title, description từ event data cho SEO
7. **Share buttons:** Thêm nút share Facebook, Twitter, etc.

---

## 🚀 NEXT STEPS

Sau khi hoàn thành Event Detail, tiếp tục với:
1. **Booking Flow** - Tham khảo `FRONTEND_ORDERS_API_DOCUMENTATION.md`
2. **My Tickets** - Xem vé đã mua
3. **Payment Integration** - Tích hợp VNPAY
