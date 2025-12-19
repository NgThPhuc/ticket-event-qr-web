# Check-in QR API Documentation

Tài liệu API cho module Check-in QR. Frontend có thể sử dụng tài liệu này để tích hợp chức năng check-in vé sự kiện.

**Base URL:** `http://localhost:3000` (development) hoặc URL production

---

## Authentication

Tất cả endpoints đều yêu cầu **JWT Bearer Token** trong header:

```
Authorization: Bearer <access_token>
```

**Roles được phép:** `CHECKIN_STAFF`, `EVENT_MANAGER`, `ORGANIZER_ADMIN`, `PLATFORM_ADMIN`

---

## Endpoints

### 1. Quét mã QR Check-in

Quét mã QR trên vé để check-in khách tham gia.

```
POST /check-in/scan
```

#### Request Headers
| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer `<token>` | ✅ |
| Content-Type | application/json | ✅ |

#### Request Body
```json
{
  "qr_payload": "string",    // Nội dung quét được từ QR code (bắt buộc)
  "gate": "string",          // Tên cổng check-in, vd: "A1", "Main Gate" (tùy chọn)
  "device_id": "string"      // ID thiết bị quét (tùy chọn)
}
```

#### Responses

**✅ 200 OK - Check-in thành công**
```json
{
  "valid": true,
  "ticket": {
    "id": "uuid",
    "ticket_serial": "TICKET-001",
    "attendee_name": "Nguyễn Văn A",
    "ticket_type_name": "VIP",
    "checkin_status": "CHECKED_IN",
    "checked_in_at": "2025-12-20T10:30:00.000Z"
  },
  "message": "Welcome 🎉"
}
```

**❌ 200 OK - Vé không hợp lệ**

| Reason | Message | Mô tả |
|--------|---------|-------|
| `NOT_FOUND` | Không tìm thấy vé với QR code này | QR không tồn tại trong hệ thống |
| `EVENT_NOT_PUBLISHED` | Sự kiện chưa được công bố | Event chưa publish |
| `REVOKED` | Vé đã bị thu hồi | Vé bị hủy bởi organizer |
| `REFUNDED` | Vé đã được hoàn tiền | Vé đã refund |
| `ALREADY_USED` | Vé đã được sử dụng để vào cửa | Vé đã check-in trước đó |

```json
{
  "valid": false,
  "reason": "ALREADY_USED",
  "message": "Vé đã được sử dụng để vào cửa",
  "ticket": {
    "id": "uuid",
    "ticket_serial": "TICKET-001",
    "attendee_name": "Nguyễn Văn A",
    "ticket_type_name": "VIP",
    "checked_in_at": "2025-12-20T09:00:00.000Z"
  }
}
```

**❌ 401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**❌ 403 Forbidden**
```json
{
  "statusCode": 403,
  "message": "Bạn không có quyền check-in vé của sự kiện này"
}
```

---

### 2. Lấy thống kê Check-in

Lấy thống kê realtime về số lượng check-in của một sự kiện.

```
GET /check-in/events/{eventId}/stats
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | UUID | ✅ | ID của sự kiện |

#### Response

**✅ 200 OK**
```json
{
  "total_issued": 500,        // Tổng số vé đã phát hành
  "checked_in": 320,          // Số vé đã check-in
  "not_checked_in": 160,      // Số vé chưa check-in (còn active)
  "revoked_count": 10,        // Số vé bị thu hồi
  "refunded_count": 10,       // Số vé đã hoàn tiền
  "last_check_in_at": "2025-12-20T10:45:00.000Z"  // Thời điểm check-in gần nhất
}
```

---

### 3. Lấy lịch sử Check-in

Lấy danh sách các lượt check-in của một sự kiện (có phân trang và filter).

```
GET /check-in/events/{eventId}/history
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| eventId | UUID | ✅ | ID của sự kiện |

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Trang hiện tại |
| limit | number | 20 | Số record mỗi trang (tối đa 100) |
| gate | string | - | Lọc theo cổng check-in |
| from_date | ISO8601 | - | Lọc từ ngày (vd: 2025-12-20) |
| to_date | ISO8601 | - | Lọc đến ngày |
| search | string | - | Tìm theo tên hoặc ticket_serial |
| sort_by | enum | checked_in_at | Sắp xếp theo: `checked_in_at`, `attendee_name`, `ticket_serial` |
| sort_order | enum | desc | Thứ tự: `asc` hoặc `desc` |

#### Response

**✅ 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticket_serial": "TICKET-001",
      "attendee_name": "Nguyễn Văn A",
      "attendee_email": "a@example.com",
      "ticket_type": "VIP",
      "checked_in_at": "2025-12-20T10:30:00.000Z",
      "checked_in_gate": "A1",
      "checked_in_by": "Staff Nguyễn",
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
    "available_gates": ["A1", "A2", "Main Gate"]
  }
}
```

---

## Flow tích hợp cho Frontend

### 1. Màn hình Scanner

```
┌─────────────────────────────────────┐
│         CHECK-IN SCANNER            │
├─────────────────────────────────────┤
│                                     │
│    ┌───────────────────────────┐    │
│    │                           │    │
│    │      [QR Camera View]     │    │
│    │                           │    │
│    └───────────────────────────┘    │
│                                     │
│    Gate: [ Dropdown chọn cổng ]     │
│                                     │
├─────────────────────────────────────┤
│  ✅ 320 / 500 đã check-in          │
│  🕐 Last: 10:45 AM                  │
└─────────────────────────────────────┘
```

### 2. Xử lý kết quả scan

```javascript
async function handleScan(qrPayload) {
  try {
    const response = await fetch('/check-in/scan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        qr_payload: qrPayload,
        gate: selectedGate,
        device_id: deviceId
      })
    });
    
    const result = await response.json();
    
    if (result.valid) {
      // ✅ Hiển thị thông báo thành công
      showSuccess(result.ticket.attendee_name, result.ticket.ticket_type_name);
      playSuccessSound();
    } else {
      // ❌ Hiển thị lỗi tương ứng với reason
      showError(result.reason, result.message);
      playErrorSound();
    }
    
    // Refresh stats
    refreshStats();
    
  } catch (error) {
    showError('NETWORK_ERROR', 'Không thể kết nối server');
  }
}
```

### 3. UI feedback theo reason

| Reason | Màu | Icon | Action |
|--------|-----|------|--------|
| ✅ valid | 🟢 Green | ✓ | Welcome message + âm thanh thành công |
| NOT_FOUND | 🔴 Red | ✗ | "QR không hợp lệ" |
| ALREADY_USED | 🟡 Yellow | ⚠️ | Hiển thị thông tin lần check-in trước |
| REVOKED | 🔴 Red | ✗ | "Vé đã bị thu hồi" |
| REFUNDED | 🔴 Red | ✗ | "Vé đã hoàn tiền" |
| EVENT_NOT_PUBLISHED | 🟡 Yellow | ⚠️ | "Sự kiện chưa mở cửa" |

---

## Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Request thành công (check `valid` field) |
| 401 | Token không hợp lệ hoặc hết hạn |
| 403 | Không có quyền check-in event này |
| 404 | Event không tồn tại |
| 500 | Server error |

---

## Notes

1. **QR Payload**: Nội dung QR code là một chuỗi unique, không phải ticket ID
2. **Rate limiting**: Không có giới hạn số lần scan
3. **Offline**: API yêu cầu kết nối internet, không hỗ trợ offline mode
4. **Multiple devices**: Có thể scan cùng lúc từ nhiều thiết bị khác nhau
