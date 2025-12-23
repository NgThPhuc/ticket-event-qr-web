# Frontend Integration Guide: Dual-mode Checkout

## Tổng quan

Backend đã hỗ trợ **2 phương thức checkout**. Frontend cần cập nhật để cho phép người dùng chọn 1 trong 2 cách.

---

## 2 Phương thức Checkout

| Mode | Mô tả | Khi nào dùng |
|------|-------|--------------|
| **Per-attendee** | Điền thông tin từng người tham dự | Mua vé cho nhiều người khác nhau |
| **Buyer-centric** | Chỉ điền 1 lần thông tin người mua | Mua hộ, mua nhóm, checkout nhanh |

---

## API Request Format

### 1. Per-attendee Mode (Format cũ - vẫn hoạt động)

```json
POST /events/:eventId/orders
Authorization: Bearer <token>

{
  "event_id": "uuid-event",
  "items": [
    {
      "ticket_type_id": "uuid-ticket-type",
      "quantity": 3,
      "attendees": [
        {
          "name": "Nguyen Van A",
          "email": "a@example.com",
          "phone": "0901234567"
        },
        {
          "name": "Tran Thi B",
          "email": "b@example.com",
          "phone": "0901234568"
        },
        {
          "name": "Le Van C",
          "email": "c@example.com",
          "phone": "0901234569"
        }
      ]
    }
  ]
}
```

**Validation:**
- `attendees.length` phải bằng `quantity`
- Mỗi attendee cần: `name` (bắt buộc), `email` (bắt buộc), `phone` (optional)

---

### 2. Buyer-centric Mode (Format mới)

```json
POST /events/:eventId/orders
Authorization: Bearer <token>

{
  "event_id": "uuid-event",
  "buyer": {
    "name": "Nguyen Van A",
    "email": "a@example.com",
    "phone": "0901234567"
  },
  "items": [
    {
      "ticket_type_id": "uuid-ticket-type",
      "quantity": 5
    }
  ]
}
```

**Kết quả:**
- Tất cả 5 tickets sẽ có cùng thông tin từ `buyer`
- Không cần truyền `attendees`

---

## Frontend Implementation

### Step 1: Thêm Toggle Switch

```jsx
const [checkoutMode, setCheckoutMode] = useState('buyer'); // 'buyer' hoặc 'attendee'

<div className="checkout-mode-switch">
  <label>
    <input 
      type="radio" 
      value="buyer" 
      checked={checkoutMode === 'buyer'}
      onChange={(e) => setCheckoutMode(e.target.value)}
    />
    Dùng thông tin của tôi cho tất cả vé
  </label>
  <label>
    <input 
      type="radio" 
      value="attendee" 
      checked={checkoutMode === 'attendee'}
      onChange={(e) => setCheckoutMode(e.target.value)}
    />
    Nhập thông tin từng người tham dự
  </label>
</div>
```

### Step 2: Form theo Mode

```jsx
{checkoutMode === 'buyer' ? (
  // Buyer-centric: 1 form duy nhất
  <BuyerForm 
    value={buyerInfo}
    onChange={setBuyerInfo}
  />
) : (
  // Per-attendee: N forms theo quantity
  selectedItems.map((item, itemIndex) => (
    <div key={itemIndex}>
      <h3>Loại vé: {item.ticketTypeName}</h3>
      {Array.from({ length: item.quantity }).map((_, i) => (
        <AttendeeForm 
          key={i}
          index={i + 1}
          value={item.attendees[i]}
          onChange={(val) => updateAttendee(itemIndex, i, val)}
        />
      ))}
    </div>
  ))
)}
```

### Step 3: Build Request Payload

```javascript
const buildOrderPayload = () => {
  const payload = {
    event_id: eventId,
    items: selectedItems.map(item => ({
      ticket_type_id: item.ticketTypeId,
      quantity: item.quantity,
      // Chỉ thêm attendees nếu ở per-attendee mode
      ...(checkoutMode === 'attendee' && { attendees: item.attendees })
    }))
  };

  // Thêm buyer nếu ở buyer-centric mode
  if (checkoutMode === 'buyer') {
    payload.buyer = {
      name: buyerInfo.name,
      email: buyerInfo.email,
      phone: buyerInfo.phone || undefined
    };
  }

  return payload;
};
```

---

## Response Format

```json
{
  "id": "uuid-order",
  "order_number": "ORD-1234567890-ABC",
  "event_id": "uuid-event",
  "quantity": 5,
  "total_amount": 500000,
  "status": "PENDING",
  "payment_status": "UNPAID",
  "buyer_name": "Nguyen Van A",       // Chỉ có nếu dùng buyer-centric mode
  "buyer_email": "a@example.com",     // Chỉ có nếu dùng buyer-centric mode
  "buyer_phone": "0901234567",        // Chỉ có nếu dùng buyer-centric mode
  "items": [...],
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

---

## Validation Errors

| Lỗi | Nguyên nhân |
|-----|-------------|
| `Vui lòng nhập thông tin người tham dự cho từng vé, hoặc sử dụng thông tin người mua (buyer)` | Không có `buyer` và không có `attendees` |
| `Số lượng người tham dự phải bằng số lượng vé` | Per-attendee mode nhưng `attendees.length !== quantity` |

---

## UX Recommendations

1. **Default là Buyer-centric** - Giảm friction cho user
2. **Pre-fill buyer info từ user profile** - Nếu user đã login
3. **Hiển thị tổng số vé rõ ràng** - "Bạn đang mua 5 vé cho sự kiện X"
4. **Tooltip giải thích** - Hover lên toggle để hiểu sự khác biệt

---

## Câu hỏi?

Liên hệ backend team nếu cần hỗ trợ thêm.
