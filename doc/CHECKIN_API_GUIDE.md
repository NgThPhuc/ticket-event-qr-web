# Check-in QR API Documentation

> **Version**: 1.0.0  
> **Last Updated**: 2025-12-27  
> **Base URL**: `/check-in`

## Tổng quan

API Check-in QR cho phép quét mã QR để check-in vé, xem thống kê và báo cáo chi tiết.

---

## Authentication

Tất cả API đều yêu cầu JWT token trong header:

```http
Authorization: Bearer <access_token>
```

---

## Phân quyền

| Role | Scan QR | Stats | History | Hourly/Gates/Staff | Logs | Export |
|------|---------|-------|---------|-------------------|------|--------|
| CHECKIN_STAFF | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| EVENT_MANAGER | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ORGANIZER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PLATFORM_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## API Endpoints

### 1. Quét QR Check-in

Quét mã QR để check-in vé vào sự kiện.

```http
POST /check-in/scan
```

#### Request Body

```json
{
  "qr_payload": "550e8400-e29b-41d4-a716-446655440000",
  "gate": "A",
  "device_id": "device-001"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| qr_payload | string | ✅ | Nội dung QR code được quét |
| gate | string | ❌ | Tên cổng check-in (A, B, C, VIP...) |
| device_id | string | ❌ | ID thiết bị quét (để tracking) |

#### Response - Thành công

```json
{
  "valid": true,
  "ticket": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "ticket_serial": "VIP-000001",
    "attendee_name": "Nguyễn Văn A",
    "ticket_type_name": "VIP",
    "checkin_status": "CHECKED_IN",
    "checked_in_at": "2025-12-27T14:30:00.000Z"
  },
  "message": "Welcome 🎉"
}
```

#### Response - Thất bại

```json
{
  "valid": false,
  "reason": "ALREADY_USED",
  "message": "Vé đã được sử dụng để vào cửa",
  "ticket": {
    "id": "...",
    "ticket_serial": "VIP-000001",
    "attendee_name": "Nguyễn Văn A",
    "ticket_type_name": "VIP",
    "checked_in_at": "2025-12-27T14:00:00.000Z"
  }
}
```

#### Các mã lỗi (reason)

| Reason | Message | Mô tả |
|--------|---------|-------|
| `SUCCESS` | Welcome 🎉 | Check-in thành công |
| `ALREADY_USED` | Vé đã được sử dụng để vào cửa | Vé đã check-in trước đó |
| `NOT_FOUND` | Không tìm thấy vé với QR code này | QR không hợp lệ |
| `REVOKED` | Vé đã bị thu hồi | Vé bị hủy bởi organizer |
| `REFUNDED` | Vé đã được hoàn tiền | Vé đã refund |
| `EVENT_NOT_ACTIVE` | Sự kiện chưa được công bố | Event chưa PUBLISHED |
| `INVALID_STATUS` | Vé không hợp lệ | Trạng thái vé không xác định |

#### UI Recommendations

- **SUCCESS**: Hiển thị màu xanh, animation thành công, thông tin attendee
- **ALREADY_USED**: Hiển thị màu cam/vàng, cảnh báo, thời điểm đã check-in
- **NOT_FOUND/REVOKED/REFUNDED**: Hiển thị màu đỏ, lỗi nghiêm trọng

---

### 2. Thống kê tổng quan

Lấy thống kê check-in của sự kiện.

```http
GET /check-in/events/{eventId}/stats
```

#### Response

```json
{
  "total_issued": 500,
  "checked_in": 320,
  "not_checked_in": 150,
  "revoked_count": 20,
  "refunded_count": 10,
  "last_check_in_at": "2025-12-27T14:30:00.000Z",
  "total_scans": 380,
  "failed_scans": 60,
  "success_rate": 84.2
}
```

| Field | Type | Description |
|-------|------|-------------|
| total_issued | number | Tổng số vé đã phát hành |
| checked_in | number | Số vé đã check-in |
| not_checked_in | number | Số vé chưa check-in (còn active) |
| revoked_count | number | Số vé đã thu hồi |
| refunded_count | number | Số vé đã hoàn tiền |
| last_check_in_at | string | Thời điểm check-in gần nhất |
| total_scans | number | Tổng số lần quét QR |
| failed_scans | number | Số lần quét thất bại |
| success_rate | number | Tỷ lệ thành công (%) |

---

### 3. Thống kê theo giờ

Xem biểu đồ check-in theo từng giờ trong ngày.

```http
GET /check-in/events/{eventId}/stats/hourly?date=2025-12-27
```

#### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| date | string | ❌ | Ngày cần xem (ISO format), mặc định là hôm nay |

#### Response

```json
{
  "date": "2025-12-27",
  "hourly_data": [
    { "hour": 8, "count": 45, "success": 42, "failed": 3 },
    { "hour": 9, "count": 120, "success": 118, "failed": 2 },
    { "hour": 10, "count": 89, "success": 87, "failed": 2 },
    { "hour": 14, "count": 234, "success": 230, "failed": 4 }
  ],
  "peak_hour": 14,
  "peak_count": 230,
  "total_scans": 488,
  "total_success": 477
}
```

| Field | Type | Description |
|-------|------|-------------|
| date | string | Ngày thống kê |
| hourly_data | array | Dữ liệu theo từng giờ |
| hourly_data[].hour | number | Giờ (0-23) |
| hourly_data[].count | number | Tổng số quét |
| hourly_data[].success | number | Số quét thành công |
| hourly_data[].failed | number | Số quét thất bại |
| peak_hour | number | Giờ cao điểm |
| peak_count | number | Số check-in cao nhất |

#### UI Recommendations

- Vẽ **Bar Chart** hoặc **Line Chart** với hourly_data
- Highlight `peak_hour` trên biểu đồ
- Có thể chọn ngày khác từ date picker

---

### 4. Thống kê theo cổng

Xem phân bổ check-in theo từng cổng.

```http
GET /check-in/events/{eventId}/stats/gates
```

#### Response

```json
{
  "gates": [
    {
      "gate": "A",
      "total": 200,
      "success": 195,
      "failed": 5,
      "percentage": 40
    },
    {
      "gate": "B",
      "total": 180,
      "success": 175,
      "failed": 5,
      "percentage": 36
    },
    {
      "gate": "VIP",
      "total": 120,
      "success": 118,
      "failed": 2,
      "percentage": 24
    }
  ],
  "total": 500
}
```

#### UI Recommendations

- Vẽ **Pie Chart** hoặc **Donut Chart** với `percentage`
- Hiển thị bảng chi tiết từng cổng
- Có thể so sánh `success` vs `failed` của từng cổng

---

### 5. Hiệu suất nhân viên

Xem thống kê số lượng quét của từng nhân viên.

```http
GET /check-in/events/{eventId}/stats/staff
```

#### Response

```json
{
  "staff": [
    {
      "staff_id": "uuid-1",
      "staff_name": "Nguyễn Văn A",
      "staff_email": "a@example.com",
      "total_scans": 250,
      "success_count": 245,
      "failed_count": 5,
      "success_rate": 98.0
    },
    {
      "staff_id": "uuid-2",
      "staff_name": "Trần Thị B",
      "staff_email": "b@example.com",
      "total_scans": 180,
      "success_count": 175,
      "failed_count": 5,
      "success_rate": 97.2
    }
  ]
}
```

#### UI Recommendations

- Hiển thị **Leaderboard** với ranking
- Có thể hiển thị avatar từ email (Gravatar)
- Highlight nhân viên có `success_rate` cao

---

### 6. Xem Scan Logs

Xem chi tiết từng lần quét (bao gồm cả thất bại).

```http
GET /check-in/events/{eventId}/logs
```

#### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | number | ❌ | Trang (mặc định: 1) |
| limit | number | ❌ | Số item/trang (mặc định: 20, max: 100) |
| result | string | ❌ | Filter theo kết quả: SUCCESS, ALREADY_USED, NOT_FOUND... |
| gate | string | ❌ | Filter theo cổng |
| staff_id | string | ❌ | Filter theo nhân viên |
| from_date | string | ❌ | Từ ngày (ISO format) |
| to_date | string | ❌ | Đến ngày (ISO format) |
| search | string | ❌ | Tìm theo qr_payload hoặc ticket_serial |

#### Response

```json
{
  "data": [
    {
      "id": "log-uuid-1",
      "qr_payload": "550e8400-e29b-41d4-a716-446655440000",
      "result": "ALREADY_USED",
      "gate": "A",
      "device_id": "device-001",
      "scanned_at": "2025-12-27T14:35:00.000Z",
      "ticket": {
        "id": "ticket-uuid",
        "ticket_serial": "VIP-000001",
        "attendee_name": "Nguyễn Văn A"
      },
      "staff": {
        "id": "staff-uuid",
        "full_name": "Trần Thị B"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 380,
    "total_pages": 19
  }
}
```

#### UI Recommendations

- Hiển thị **Table** với pagination
- Có filter dropdown cho `result`, `gate`
- Có date range picker cho `from_date`, `to_date`
- Color code theo `result`:
  - SUCCESS: 🟢 Xanh
  - ALREADY_USED: 🟡 Vàng
  - NOT_FOUND/REVOKED/REFUNDED: 🔴 Đỏ

---

### 7. Lịch sử Check-in

Xem danh sách vé đã check-in (chỉ thành công).

```http
GET /check-in/events/{eventId}/history
```

#### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | number | ❌ | Trang (mặc định: 1) |
| limit | number | ❌ | Số item/trang (mặc định: 20) |
| gate | string | ❌ | Filter theo cổng |
| from_date | string | ❌ | Từ ngày |
| to_date | string | ❌ | Đến ngày |
| search | string | ❌ | Tìm theo tên hoặc ticket_serial |
| sort_by | string | ❌ | Sắp xếp theo: checked_in_at, attendee_name, ticket_serial |
| sort_order | string | ❌ | asc hoặc desc |

#### Response

```json
{
  "data": [
    {
      "id": "ticket-uuid",
      "ticket_serial": "VIP-000001",
      "attendee_name": "Nguyễn Văn A",
      "attendee_email": "a@example.com",
      "ticket_type": "VIP",
      "checked_in_at": "2025-12-27T14:30:00.000Z",
      "checked_in_gate": "A",
      "checked_in_by": "Trần Thị B",
      "scan_count": 1
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 320,
    "total_pages": 16
  },
  "filters": {
    "available_gates": ["A", "B", "VIP"]
  }
}
```

---

### 8. Export Báo cáo

Tải xuống báo cáo check-in dạng CSV hoặc JSON.

```http
GET /check-in/events/{eventId}/export
```

#### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| format | string | ❌ | `csv` (mặc định) hoặc `json` |
| from_date | string | ❌ | Từ ngày |
| to_date | string | ❌ | Đến ngày |

#### Response - CSV

```
Content-Type: text/csv
Content-Disposition: attachment; filename="checkin-report-{eventId}-2025-12-27.csv"
```

Nội dung CSV:
```csv
"Ticket Serial","Attendee Name","Attendee Email","Attendee Phone","Ticket Type","Checked In At","Gate","Checked In By","Scan Count"
"VIP-000001","Nguyễn Văn A","a@example.com","0901234567","VIP","2025-12-27T14:30:00.000Z","A","Trần Thị B","1"
```

#### Response - JSON

```json
{
  "format": "json",
  "data": [
    {
      "ticket_serial": "VIP-000001",
      "attendee_name": "Nguyễn Văn A",
      "attendee_email": "a@example.com",
      "attendee_phone": "0901234567",
      "ticket_type": "VIP",
      "checked_in_at": "2025-12-27T14:30:00.000Z",
      "checked_in_gate": "A",
      "checked_in_by": "Trần Thị B",
      "scan_count": 1
    }
  ],
  "total": 320
}
```

#### Frontend Implementation

```javascript
// Download CSV
const downloadCSV = async (eventId) => {
  const response = await fetch(`/check-in/events/${eventId}/export?format=csv`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `checkin-report-${eventId}.csv`;
  a.click();
};
```

---

## Realtime Updates (Future)

> **Coming Soon**: WebSocket support for realtime check-in notifications

```javascript
// Planned API
const socket = io('/check-in');
socket.emit('join-event', { eventId: '...' });
socket.on('checkin', (data) => {
  // Update stats in realtime
  console.log('New check-in:', data);
});
```

---

## Error Handling

Tất cả lỗi trả về format:

```json
{
  "statusCode": 403,
  "message": "Bạn không có quyền truy cập",
  "error": "Forbidden"
}
```

| Status Code | Mô tả |
|-------------|-------|
| 400 | Bad Request - Thiếu tham số hoặc format sai |
| 401 | Unauthorized - Chưa đăng nhập |
| 403 | Forbidden - Không có quyền |
| 404 | Not Found - Event không tồn tại |
| 429 | Too Many Requests - Rate limit |

---

## Questions?

Liên hệ Backend team nếu có thắc mắc.
