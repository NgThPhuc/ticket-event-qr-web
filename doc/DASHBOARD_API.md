# Tài liệu API Dashboard Analytics

## Tổng quan

Module Dashboard Analytics cung cấp các API thống kê tổng hợp cho:
- **Organizer** (ORGANIZER_ADMIN, EVENT_MANAGER): Dashboard tổ chức và sự kiện
- **Platform Admin** (PLATFORM_ADMIN): Dashboard toàn hệ thống

**Base URL:** `/dashboard`  
**Authentication:** Bắt buộc (JWT Bearer Token)

---

## 1. Organizer Dashboard

### 1.1 Organization Overview
`GET /dashboard/organizations/:organizationId/overview`

**Role:** ORGANIZER_ADMIN, EVENT_MANAGER

**Response:**
```json
{
  "organization": { "id": "...", "name": "ABC Entertainment" },
  "summary": {
    "total_events": 10,
    "published_events": 5,
    "upcoming_events": 3,
    "total_tickets_sold": 500,
    "total_revenue": 50000000,
    "pending_balance": 5000000,
    "available_balance": 45000000,
    "total_paid_out": 20000000
  },
  "recent_30_days": {
    "revenue": 10000000,
    "orders": 100
  },
  "recent_orders": [
    {
      "id": "...",
      "order_number": "ORD-1234567890-ABC",
      "total_amount": 500000,
      "paid_at": "2025-01-01T10:00:00Z",
      "event": { "id": "...", "title": "Concert ABC" }
    }
  ]
}
```

---

### 1.2 Organization Events with Stats
`GET /dashboard/organizations/:organizationId/events`

**Role:** ORGANIZER_ADMIN, EVENT_MANAGER

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "title": "Concert ABC",
      "slug": "concert-abc-2025",
      "status": "PUBLISHED",
      "start_at": "2025-01-15T19:00:00Z",
      "end_at": "2025-01-15T23:00:00Z",
      "cover_image_url": "https://...",
      "stats": {
        "tickets_sold": 100,
        "tickets_total": 200,
        "revenue": 10000000,
        "checkin_rate": 85.5
      }
    }
  ]
}
```

---

### 1.3 Organization Sales Chart
`GET /dashboard/organizations/:organizationId/sales?period=month`

**Role:** ORGANIZER_ADMIN, EVENT_MANAGER

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| period | enum | month | `day`, `week`, `month`, `year` |

**Response:**
```json
{
  "period": "month",
  "data": [
    { "date": "2025-01-01", "revenue": 1000000, "orders": 10 },
    { "date": "2025-01-02", "revenue": 1500000, "orders": 15 }
  ],
  "total_revenue": 50000000,
  "total_orders": 500
}
```

---

## 2. Event Dashboard

### 2.1 Event Overview
`GET /dashboard/events/:eventId/overview`

**Role:** ORGANIZER_ADMIN, EVENT_MANAGER

**Response:**
```json
{
  "event": {
    "id": "...",
    "title": "Concert ABC",
    "slug": "concert-abc-2025",
    "status": "PUBLISHED",
    "start_at": "2025-01-15T19:00:00Z"
  },
  "sales": {
    "total_orders": 100,
    "paid_orders": 95,
    "cancelled_orders": 5,
    "total_revenue": 10000000,
    "tickets_sold": 200,
    "tickets_total": 300
  },
  "checkin": {
    "total_checked_in": 170,
    "not_checked_in": 30,
    "checkin_rate": 85.0
  },
  "ticket_types": [
    {
      "id": "...",
      "name": "VIP",
      "price": 500000,
      "sold": 50,
      "total": 100,
      "revenue": 25000000
    }
  ]
}
```

---

### 2.2 Event Sales
`GET /dashboard/events/:eventId/sales`

**Role:** ORGANIZER_ADMIN, EVENT_MANAGER

**Response:**
```json
{
  "by_ticket_type": [
    { "name": "VIP", "sold": 50, "revenue": 25000000 },
    { "name": "Standard", "sold": 150, "revenue": 15000000 }
  ],
  "by_date": [
    { "date": "2025-01-01", "revenue": 5000000, "orders": 10 }
  ]
}
```

---

## 3. Platform Admin Dashboard

### 3.1 System Overview
`GET /dashboard/admin/overview`

**Role:** PLATFORM_ADMIN only

**Response:**
```json
{
  "users": {
    "total": 1000,
    "verified": 900,
    "new_this_month": 50
  },
  "organizations": {
    "total": 20,
    "active": 15
  },
  "events": {
    "total": 100,
    "published": 50,
    "upcoming": 30
  },
  "orders": {
    "total": 5000,
    "this_month": 500,
    "revenue_this_month": 100000000
  },
  "payouts": {
    "pending": 3,
    "total_pending_amount": 10000000
  }
}
```

---

### 3.2 Top Organizations
`GET /dashboard/admin/organizations?limit=10`

**Role:** PLATFORM_ADMIN only

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| limit | number | 10 |

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "name": "ABC Entertainment",
      "slug": "abc-entertainment",
      "total_events": 10,
      "total_revenue": 100000000,
      "total_orders": 500
    }
  ]
}
```

---

### 3.3 Top Events
`GET /dashboard/admin/events?limit=10&period=month`

**Role:** PLATFORM_ADMIN only

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| limit | number | 10 |
| period | enum | month |

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "title": "Concert ABC",
      "slug": "concert-abc-2025",
      "organization_name": "ABC Entertainment",
      "start_at": "2025-01-15T19:00:00Z",
      "tickets_sold": 500,
      "revenue": 50000000,
      "checkin_rate": 92.5
    }
  ]
}
```

---

### 3.4 Platform Sales
`GET /dashboard/admin/sales?period=month`

**Role:** PLATFORM_ADMIN only

**Query Parameters:**
| Param | Type | Default |
|-------|------|---------|
| period | enum | month |

**Response:**
```json
{
  "period": "month",
  "data": [
    { "date": "2025-01-01", "revenue": 5000000, "orders": 50, "tickets": 100 },
    { "date": "2025-01-02", "revenue": 8000000, "orders": 80, "tickets": 160 }
  ],
  "total": {
    "revenue": 100000000,
    "orders": 1000,
    "tickets": 2000,
    "platform_fee": 5000000
  }
}
```

---

## Summary

| # | Endpoint | Role |
|---|----------|------|
| 1 | `GET /dashboard/organizations/:id/overview` | ORGANIZER_ADMIN, EVENT_MANAGER |
| 2 | `GET /dashboard/organizations/:id/events` | ORGANIZER_ADMIN, EVENT_MANAGER |
| 3 | `GET /dashboard/organizations/:id/sales` | ORGANIZER_ADMIN, EVENT_MANAGER |
| 4 | `GET /dashboard/events/:id/overview` | ORGANIZER_ADMIN, EVENT_MANAGER |
| 5 | `GET /dashboard/events/:id/sales` | ORGANIZER_ADMIN, EVENT_MANAGER |
| 6 | `GET /dashboard/admin/overview` | PLATFORM_ADMIN |
| 7 | `GET /dashboard/admin/organizations` | PLATFORM_ADMIN |
| 8 | `GET /dashboard/admin/events` | PLATFORM_ADMIN |
| 9 | `GET /dashboard/admin/sales` | PLATFORM_ADMIN |
