# QUY TRÌNH REFUND (HOÀN TIỀN)

## Tổng quan

Khi người tổ chức hủy sự kiện, hệ thống sẽ tự động hoàn tiền 100% cho tất cả khách hàng đã mua vé của sự kiện đó.

---

## Quy trình tự động hoàn tiền khi hủy sự kiện

### Bước 1: Organizer hủy sự kiện

**API Endpoint**: `POST /events/:id/cancel`

**Headers**: `Authorization: Bearer {access_token}`

**Quyền**: ORGANIZER_ADMIN

**Request Body**:
```json
{
  "reason": "Sự kiện bị hủy do thời tiết xấu"
}
```

**Quy trình xử lý**:

1. **Kiểm tra quyền**:
   - User phải là ORGANIZER_ADMIN của organization sở hữu event

2. **Update event status**:
   - Set `event.status = CANCELLED`
   - Set `event.cancelled_at = now()`

3. **Tự động trigger refund**:
   - Tìm tất cả orders có `event_id = event.id` và `payment_status = PAID`
   - Với mỗi order đã thanh toán:
     - Tạo RefundRequest với `status = PENDING`
     - Tự động process refund (gọi payment gateway)
     - Update ticket status = REFUNDED
     - Update order payment_status = REFUNDED
     - Update revenue share = CANCELLED
     - Gửi email thông báo cho customer

---

## Quy trình xử lý refund

### Bước 1: Tìm tất cả orders đã thanh toán

**Logic**:
```typescript
const paidOrders = await prisma.order.findMany({
  where: {
    event_id: eventId,
    payment_status: PaymentStatus.PAID,
    status: OrderStatus.CONFIRMED
  },
  include: {
    tickets: true,
    transaction: true,
    user: true
  }
});
```

### Bước 2: Tạo RefundRequest cho mỗi order

**Logic**:
```typescript
for (const order of paidOrders) {
  // Tính toán refund amount (100% của total_amount)
  const refundAmount = order.total_amount;
  
  // Tạo refund request
  const refundRequest = await prisma.refundRequest.create({
    data: {
      order_id: order.id,
      ticket_ids: order.tickets.map(t => t.id),
      reason: `Event cancelled: ${cancelReason}`,
      refund_amount: refundAmount,
      status: RefundStatus.PENDING,
      refund_type: RefundType.AUTOMATIC, // Tự động khi event cancelled
    }
  });
}
```

### Bước 3: Process refund qua payment gateway

**Logic**:
```typescript
// Với mỗi refund request
for (const refundRequest of refundRequests) {
  const order = refundRequest.order;
  const transaction = order.transaction;
  
  // Xác định payment gateway
  if (transaction.payment_method === PaymentMethod.VNPAY) {
    // Gọi VNPAY refund API
    const result = await vnpayService.processRefund({
      transaction_id: transaction.external_transaction_id,
      amount: refundRequest.refund_amount,
      reason: refundRequest.reason
    });
  } else if (transaction.payment_method === PaymentMethod.PAYOS) {
    // Gọi PayOS refund API
    const result = await payosService.processRefund({
      order_code: transaction.external_transaction_id,
      amount: refundRequest.refund_amount,
      reason: refundRequest.reason
    });
  }
  
  // Nếu refund thành công
  if (result.success) {
    // Update refund request
    await prisma.refundRequest.update({
      where: { id: refundRequest.id },
      data: {
        status: RefundStatus.COMPLETED,
        processed_at: new Date(),
        external_refund_id: result.refund_id
      }
    });
    
    // Update tickets
    await prisma.ticket.updateMany({
      where: { id: { in: refundRequest.ticket_ids } },
      data: { status: TicketStatus.REFUNDED }
    });
    
    // Update order
    await prisma.order.update({
      where: { id: order.id },
      data: { payment_status: PaymentStatus.REFUNDED }
    });
    
    // Update revenue shares
    await prisma.revenueShare.updateMany({
      where: { order_id: order.id },
      data: { status: RevenueShareStatus.CANCELLED }
    });
    
    // Gửi email thông báo
    await mailService.sendRefundNotification(order.user, refundRequest);
  }
}
```

---

## Database Schema

### RefundRequest Model

```prisma
model RefundRequest {
  id                String        @id @default(uuid())
  order_id          String
  ticket_ids        String[]      // Danh sách ticket IDs cần refund
  reason            String        // Lý do refund
  refund_amount     Decimal       @db.Decimal(10, 2) // Số tiền hoàn lại
  
  // Refund type
  refund_type       RefundType    @default(MANUAL) // MANUAL hoặc AUTOMATIC
  
  // Status
  status            RefundStatus  @default(PENDING)
  
  // Payment gateway info
  payment_method    PaymentMethod?
  external_refund_id String?      // ID từ payment gateway
  
  // Admin processing
  admin_note        String?
  processed_by      String?       // Admin user ID
  processed_at      DateTime?
  
  // Timestamps
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt
  
  // Relations
  order             Order         @relation(fields: [order_id], references: [id])
  processor         User?         @relation(fields: [processed_by], references: [id])
  
  @@map("refund_requests")
  @@index([order_id])
  @@index([status])
}

enum RefundType {
  MANUAL      // User request refund
  AUTOMATIC   // Tự động khi event cancelled
}

enum RefundStatus {
  PENDING     // Chờ xử lý
  PROCESSING  // Đang xử lý với payment gateway
  COMPLETED   // Đã hoàn tiền thành công
  FAILED      // Hoàn tiền thất bại
  CANCELLED   // Đã hủy refund request
}
```

---

## API Endpoints

### 1. Xem danh sách refund requests (Admin)

**API Endpoint**: `GET /refunds`

**Headers**: `Authorization: Bearer {access_token}`

**Quyền**: PLATFORM_ADMIN, ORGANIZER_ADMIN

**Query Parameters**:
- `status`: Filter theo status (PENDING, PROCESSING, COMPLETED, FAILED)
- `event_id`: Filter theo event
- `page`: Số trang (default: 1)
- `limit`: Số items mỗi trang (default: 20)

**Response**:
```json
{
  "data": [
    {
      "id": "refund-uuid",
      "order_id": "order-uuid",
      "order_number": "ORD-123456",
      "ticket_ids": ["ticket-uuid-1", "ticket-uuid-2"],
      "reason": "Event cancelled: Thời tiết xấu",
      "refund_amount": 1000000,
      "refund_type": "AUTOMATIC",
      "status": "COMPLETED",
      "payment_method": "VNPAY",
      "external_refund_id": "vnpay-refund-123",
      "processed_at": "2024-12-25T10:00:00+07:00",
      "created_at": "2024-12-25T09:00:00+07:00",
      "order": {
        "id": "order-uuid",
        "order_number": "ORD-123456",
        "total_amount": 1000000,
        "user": {
          "id": "user-uuid",
          "email": "customer@example.com",
          "full_name": "Nguyễn Văn A"
        },
        "event": {
          "id": "event-uuid",
          "title": "Tech Conference 2024"
        }
      }
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

### 2. Xem chi tiết refund request

**API Endpoint**: `GET /refunds/:id`

**Headers**: `Authorization: Bearer {access_token}`

**Quyền**: PLATFORM_ADMIN, ORGANIZER_ADMIN, hoặc owner của order

**Response**:
```json
{
  "id": "refund-uuid",
  "order_id": "order-uuid",
  "order_number": "ORD-123456",
  "ticket_ids": ["ticket-uuid-1", "ticket-uuid-2"],
  "reason": "Event cancelled: Thời tiết xấu",
  "refund_amount": 1000000,
  "refund_type": "AUTOMATIC",
  "status": "COMPLETED",
  "payment_method": "VNPAY",
  "external_refund_id": "vnpay-refund-123",
  "admin_note": null,
  "processed_by": null,
  "processed_at": "2024-12-25T10:00:00+07:00",
  "created_at": "2024-12-25T09:00:00+07:00",
  "order": {
    "id": "order-uuid",
    "order_number": "ORD-123456",
    "total_amount": 1000000,
    "payment_status": "REFUNDED",
    "user": {
      "id": "user-uuid",
      "email": "customer@example.com",
      "full_name": "Nguyễn Văn A"
    },
    "event": {
      "id": "event-uuid",
      "title": "Tech Conference 2024",
      "slug": "tech-conference-2024"
    },
    "tickets": [
      {
        "id": "ticket-uuid-1",
        "ticket_serial": "VIP-000001",
        "status": "REFUNDED"
      }
    ]
  }
}
```

### 3. Xem refund requests của user

**API Endpoint**: `GET /my-refunds`

**Headers**: `Authorization: Bearer {access_token}`

**Quyền**: CUSTOMER (chỉ xem refund của chính mình)

**Query Parameters**:
- `status`: Filter theo status
- `page`: Số trang
- `limit`: Số items mỗi trang

**Response**: Tương tự `GET /refunds` nhưng chỉ trả về refund của user hiện tại

---

## Tích hợp với EventsService

### Khi cancel event

```typescript
async cancel(id: string, cancelDto: CancelEventDto) {
  // 1. Update event status
  const event = await this.prisma.event.update({
    where: { id },
    data: {
      status: EventStatus.CANCELLED,
      cancelled_at: new Date(),
    }
  });
  
  // 2. Trigger automatic refunds
  await this.refundsService.processAutomaticRefundsForEvent(
    id,
    cancelDto.reason || 'Event cancelled by organizer'
  );
  
  return event;
}
```

---

## Căn cứ để chuyển khoản hoàn tiền

### Nguyên tắc hoàn tiền

Khi hoàn tiền, hệ thống **không cần lưu thông tin tài khoản ngân hàng của khách hàng** vì:

1. **Payment Gateway tự động xử lý**: 
   - VNPAY và PayOS đã lưu thông tin phương thức thanh toán từ giao dịch ban đầu
   - Khi refund, payment gateway sẽ tự động chuyển tiền về **đúng phương thức thanh toán** mà khách hàng đã dùng

2. **Căn cứ để refund**:
   - **Transaction ID** (`transaction_id`): ID giao dịch từ payment gateway
   - **VNPAY**: Dùng `vnp_txn_ref` (VNPAY transaction reference)
   - **PayOS**: Dùng `order_code` (PayOS order code)
   - Payment gateway sẽ tự động tra cứu giao dịch ban đầu và refund về đúng tài khoản/thẻ

### Các phương thức thanh toán và cách refund

#### 1. VNPAY (Thẻ ngân hàng, Ví điện tử)

**Cách hoạt động**:
- Khi customer thanh toán qua VNPAY, VNPAY lưu thông tin:
  - Thẻ ngân hàng (nếu dùng thẻ)
  - Ví điện tử (nếu dùng ví)
  - Tài khoản ngân hàng (nếu chuyển khoản)
- Khi refund, chỉ cần gửi `vnp_txn_ref` (transaction reference từ giao dịch ban đầu)
- VNPAY tự động tra cứu và chuyển tiền về đúng tài khoản/thẻ/ví

**Code**:
```typescript
// Lấy transaction reference từ giao dịch ban đầu
const transaction = order.transactions[0];
const vnpTxnRef = transaction.vnp_txn_ref || transaction.transaction_id;

// Gọi VNPAY refund API
const refundData = {
  vnp_TxnRef: vnpTxnRef, // ← Căn cứ để VNPAY biết refund về đâu
  vnp_Amount: refundAmount * 100,
  // ... other fields
};

// VNPAY tự động refund về phương thức thanh toán ban đầu
```

#### 2. PayOS (Thẻ ngân hàng, Ví điện tử)

**Cách hoạt động**:
- Tương tự VNPAY, PayOS lưu thông tin phương thức thanh toán từ giao dịch ban đầu
- Khi refund, chỉ cần gửi `order_code` (order code từ giao dịch ban đầu)
- PayOS tự động tra cứu và chuyển tiền về đúng tài khoản/thẻ/ví

**Code**:
```typescript
// Lấy order code từ giao dịch ban đầu
const transaction = order.transactions[0];
const orderCode = parseInt(transaction.transaction_id);

// Gọi PayOS refund API
const refundData = {
  orderCode: orderCode, // ← Căn cứ để PayOS biết refund về đâu
  amount: refundAmount,
  reason: reason,
};

// PayOS tự động refund về phương thức thanh toán ban đầu
```

#### 3. BANK_TRANSFER (Chuyển khoản trực tiếp)

**Trường hợp đặc biệt**:
- Nếu payment method là `BANK_TRANSFER`, có thể cần lưu thông tin tài khoản customer
- Hiện tại hệ thống chưa có field để lưu thông tin này
- **Đề xuất**: Thêm fields vào `Order` hoặc `Transaction` model:
  ```prisma
  model Order {
    // ... existing fields
    
    // Refund account info (optional, chỉ dùng khi BANK_TRANSFER)
    refund_bank_account_number String?
    refund_bank_account_name   String?
    refund_bank_name           String?
  }
  ```

### Luồng refund chi tiết

```
┌─────────────────────────────────────────────────────────┐
│ REFUND PROCESS                                          │
└─────────────────────────────────────────────────────────┘

1. Tìm Transaction ban đầu
   ↓
   Transaction {
     transaction_id: "vnpay-123456"
     vnp_txn_ref: "ORD-20241225-ABC123"
     payment_method: "VNPAY"
     gateway_response: {
       // VNPAY đã lưu thông tin:
       // - Card number (masked)
       // - Bank name
       // - Payment method type
     }
   }
   ↓
2. Gọi Payment Gateway Refund API
   ↓
   VNPAY/PayOS nhận:
   - transaction_id hoặc order_code
   - refund_amount
   - reason
   ↓
3. Payment Gateway tra cứu giao dịch ban đầu
   ↓
   Tìm thấy:
   - Phương thức thanh toán ban đầu
   - Thông tin tài khoản/thẻ/ví
   ↓
4. Payment Gateway tự động chuyển tiền
   ↓
   Refund về:
   - Đúng thẻ ngân hàng (nếu thanh toán bằng thẻ)
   - Đúng ví điện tử (nếu thanh toán bằng ví)
   - Đúng tài khoản ngân hàng (nếu chuyển khoản)
   ↓
5. Payment Gateway trả về kết quả
   ↓
   {
     success: true,
     refund_id: "refund-789012",
     message: "Refund thành công"
   }
```

### Lưu ý quan trọng

1. **Không cần lưu thông tin tài khoản customer**:
   - Payment gateway đã có thông tin từ giao dịch ban đầu
   - Chỉ cần transaction_id/order_code để tra cứu

2. **Thời gian hoàn tiền**:
   - **Thẻ ngân hàng**: 3-5 ngày làm việc
   - **Ví điện tử**: 1-3 ngày làm việc
   - **Chuyển khoản**: 1-2 ngày làm việc

3. **Trường hợp đặc biệt**:
   - Nếu customer muốn refund về tài khoản khác → Cần manual processing
   - Nếu payment method là BANK_TRANSFER → Có thể cần lưu thông tin tài khoản refund

4. **Security**:
   - Không lưu thông tin thẻ ngân hàng đầy đủ (chỉ masked)
   - Payment gateway xử lý bảo mật thông tin tài khoản
   - Chỉ lưu transaction_id để tra cứu

---

## Tích hợp với PaymentService

### VNPAY Refund

```typescript
async processVnpayRefund(params: {
  transaction_id: string;
  amount: number;
  reason: string;
}) {
  // Lấy transaction reference từ giao dịch ban đầu
  // VNPAY sẽ tự động tra cứu và refund về đúng tài khoản/thẻ/ví
  const refundData = {
    vnp_TransactionType: '03', // Refund
    vnp_TxnRef: params.transaction_id, // ← Căn cứ để VNPAY biết refund về đâu
    vnp_Amount: params.amount * 100, // VNPAY dùng đơn vị xu
    vnp_OrderInfo: params.reason,
    vnp_CreateDate: format(new Date(), 'yyyyMMddHHmmss'),
    vnp_TransactionDate: format(new Date(), 'yyyyMMddHHmmss'),
  };
  
  // Tạo secure hash
  const secureHash = this.createVnpayHash(refundData);
  refundData.vnp_SecureHash = secureHash;
  
  // Call VNPAY API
  // VNPAY tự động tra cứu giao dịch ban đầu và refund về đúng phương thức thanh toán
  const response = await axios.post(
    'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
    refundData
  );
  
  return {
    success: response.data.vnp_ResponseCode === '00',
    refund_id: response.data.vnp_TransactionNo,
    message: response.data.vnp_ResponseMessage
  };
}
```

### PayOS Refund

```typescript
async processPayOSRefund(params: {
  order_code: number;
  amount: number;
  reason: string;
}) {
  // Gọi PayOS refund API
  const refundData = {
    orderCode: params.order_code,
    amount: params.amount,
    reason: params.reason
  };
  
  const response = await payOS.refundPayment(refundData);
  
  return {
    success: response.code === 0,
    refund_id: response.data?.refundId,
    message: response.desc
  };
}
```

---

## Email Notification

### Refund Notification Template

**Subject**: Hoàn tiền thành công - [Event Title]

**Body**:
```
Xin chào [Customer Name],

Chúng tôi xin thông báo rằng đơn hàng [Order Number] của bạn đã được hoàn tiền thành công.

Thông tin hoàn tiền:
- Số tiền hoàn lại: [Refund Amount] VNĐ
- Lý do: [Reason]
- Phương thức thanh toán: [Payment Method]
- Mã giao dịch hoàn tiền: [External Refund ID]
- Thời gian: [Processed At]

Số tiền sẽ được chuyển về tài khoản của bạn trong vòng 3-5 ngày làm việc.

Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.

Trân trọng,
[Organization Name]
```

---

## Sơ đồ luồng tổng thể

```
┌─────────────────────────────────────────────────────────┐
│ ORGANIZER HỦY SỰ KIỆN                                  │
└─────────────────────────────────────────────────────────┘

ORGANIZER_ADMIN → POST /events/:id/cancel
  Body: { reason: "..." }
  ↓
System: Update event.status = CANCELLED
  ↓
System: Tìm tất cả orders đã PAID của event
  ↓
┌─────────────────────────────────────────────────────────┐
│ TỰ ĐỘNG TẠO REFUND REQUESTS                            │
└─────────────────────────────────────────────────────────┘

For each paid order:
  ↓
System: Tạo RefundRequest
  - order_id
  - ticket_ids (tất cả tickets của order)
  - refund_amount = order.total_amount (100%)
  - reason = "Event cancelled: {reason}"
  - refund_type = AUTOMATIC
  - status = PENDING
  ↓
┌─────────────────────────────────────────────────────────┐
│ PROCESS REFUND QUA PAYMENT GATEWAY                      │
└─────────────────────────────────────────────────────────┘

System: Xác định payment_method từ transaction
  ↓
If VNPAY:
  → Gọi VNPAY refund API
  ↓
If PayOS:
  → Gọi PayOS refund API
  ↓
If success:
  ↓
System: Update RefundRequest
  - status = COMPLETED
  - external_refund_id = gateway_refund_id
  - processed_at = now()
  ↓
System: Update Tickets
  - status = REFUNDED (tất cả tickets trong order)
  ↓
System: Update Order
  - payment_status = REFUNDED
  ↓
System: Update RevenueShares
  - status = CANCELLED (tất cả revenue shares của order)
  ↓
System: Gửi email thông báo cho customer
  ↓
✅ Hoàn tất refund
```

---

## Lưu ý quan trọng

1. **100% refund**: Khi event cancelled, hoàn tiền 100% cho tất cả orders đã thanh toán

2. **Tự động**: Refund được trigger tự động khi event cancelled, không cần admin approve

3. **Payment Gateway**: 
   - VNPAY: Cần có transaction_id từ giao dịch thanh toán ban đầu
   - PayOS: Cần có order_code từ giao dịch thanh toán ban đầu

4. **Revenue Share**: 
   - Khi refund, tất cả revenue shares liên quan sẽ được set status = CANCELLED
   - Organization balance sẽ không bị ảnh hưởng (vì revenue share chưa mature)

5. **Email Notification**: 
   - Gửi email tự động cho customer khi refund completed
   - Thông báo số tiền, lý do, và thời gian hoàn tiền

6. **Error Handling**:
   - Nếu refund thất bại với payment gateway, refund request sẽ có status = FAILED
   - Admin có thể retry refund sau
   - Log tất cả errors để debug

7. **Idempotency**:
   - Nếu event đã cancelled, không tạo refund requests trùng lặp
   - Check refund requests đã tồn tại trước khi tạo mới

---

## Test Cases

### Test Case 1: Cancel event với orders đã paid

**Input**:
- Event có 3 orders đã PAID
- Tổng số tiền: 3,000,000 VNĐ

**Expected**:
- 3 refund requests được tạo
- 3 refund requests được process thành công
- 3 orders có payment_status = REFUNDED
- 9 tickets có status = REFUNDED (3 orders × 3 tickets mỗi order)
- 3 emails được gửi cho customers

### Test Case 2: Cancel event không có orders

**Input**:
- Event chưa có orders nào

**Expected**:
- Event status = CANCELLED
- Không có refund requests được tạo
- Không có errors

### Test Case 3: Refund thất bại với payment gateway

**Input**:
- Payment gateway trả về error

**Expected**:
- Refund request có status = FAILED
- Order và tickets vẫn giữ nguyên status
- Log error để admin có thể retry sau

---

## API Examples

### Example 1: Cancel event (trigger automatic refunds)

```bash
POST /events/550e8400-e29b-41d4-a716-446655440000/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Sự kiện bị hủy do thời tiết xấu"
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Tech Conference 2024",
  "status": "CANCELLED",
  "cancelled_at": "2024-12-25T09:00:00+07:00",
  "refunds_processed": 3,
  "refunds_total_amount": 3000000
}
```

### Example 2: Xem refund requests của event

```bash
GET /refunds?event_id=550e8400-e29b-41d4-a716-446655440000&status=COMPLETED
Authorization: Bearer {token}
```

**Response**: Danh sách refund requests đã completed của event

---

**Lưu ý**: Tài liệu này mô tả flow tự động refund khi event cancelled. Các flow refund khác (user request refund, admin approve/reject) sẽ được mô tả trong tài liệu riêng nếu cần.

