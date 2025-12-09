# PAYMENT MODULE - CRITICAL FEATURES IMPLEMENTED

**Ngày:** 09/12/2025  
**Trạng thái:** ✅ Hoàn thành

---

## 🎯 TỔNG QUAN

Đã bổ sung 2 features critical cho Payment Module để chuẩn bị cho Payout Module:

1. ✅ **Revenue Tracking** - Tự động track doanh thu khi order PAID
2. ✅ **Return URL Handler** - Xử lý redirect từ VNPAY về frontend

---

## 📊 FEATURE 1: REVENUE TRACKING

### Database Schema Updates

**Migration:** `20251209073041_add_revenue_tracking`

#### 1. Enum mới: RevenueShareStatus

```prisma
enum RevenueShareStatus {
  PENDING      // Chờ event hoàn thành
  AVAILABLE    // Có thể rút
  PAID_OUT     // Đã trả
  CANCELLED    // Đã hủy (refund)
}
```

#### 2. Organization Model - Thêm fields

```prisma
model Organization {
  // ... existing fields
  
  // Bank account info for payouts
  bank_account_number  String?
  bank_account_name    String?
  bank_name            String?
  
  // Revenue tracking
  total_revenue        Decimal @default(0) @db.Decimal(12, 2)
  platform_commission  Decimal @default(5) @db.Decimal(5, 2)  // Percentage
  available_balance    Decimal @default(0) @db.Decimal(12, 2)
  pending_balance      Decimal @default(0) @db.Decimal(12, 2)
  total_paid_out       Decimal @default(0) @db.Decimal(12, 2)
  
  // Relations
  revenue_shares RevenueShare[]
}
```

#### 3. RevenueShare Model - Model mới

```prisma
model RevenueShare {
  id                String   @id @default(uuid())
  order_id          String   @unique
  organization_id   String
  event_id          String
  
  // Amounts
  gross_amount      Decimal  @db.Decimal(10, 2)  // Tổng tiền order
  commission_rate   Decimal  @db.Decimal(5, 2)   // % phí platform
  commission_amount Decimal  @db.Decimal(10, 2)  // Số tiền phí
  net_amount        Decimal  @db.Decimal(10, 2)  // Organizer nhận
  
  // Status
  status            RevenueShareStatus @default(PENDING)
  available_at      DateTime?  // Khi nào có thể rút
  paid_out_at       DateTime?  // Đã chuyển tiền
  
  created_at        DateTime   @default(now())
  updated_at        DateTime   @updatedAt
  
  // Relations
  order             Order
  organization      Organization
  event             Event
}
```

#### 4. Order Model - Thêm relation

```prisma
model Order {
  // ... existing fields
  revenue_share  RevenueShare?
}
```

### Code Implementation

**File:** `src/orders/orders.service.ts`

#### Method: confirmPayment() - Updated

```typescript
async confirmPayment(orderId: string, paymentMethod: string) {
  // ... existing payment confirmation logic
  
  // 🆕 CREATE REVENUE SHARE
  if (!order.revenue_share) {
    try {
      await this.createRevenueShare(order.id);
      console.log(`✅ Revenue share created for order ${order.id}`);
    } catch (error) {
      console.error('Error creating revenue share:', error);
    }
  }
  
  // ... return order with tickets
}
```

#### Method: createRevenueShare() - New

```typescript
private async createRevenueShare(orderId: string) {
  const order = await this.prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: { include: { organization: true } }
    }
  });

  const organization = order.event.organization;
  const grossAmount = order.total_amount;
  const commissionRate = organization.platform_commission; // 5%
  const commissionAmount = grossAmount.mul(commissionRate).div(100);
  const netAmount = grossAmount.sub(commissionAmount);

  // Hold period: 7 days after event ends
  const availableAt = new Date(order.event.end_at);
  availableAt.setDate(availableAt.getDate() + 7);

  await this.prisma.$transaction(async (tx) => {
    // Create revenue share
    await tx.revenueShare.create({
      data: {
        order_id: orderId,
        organization_id: organization.id,
        event_id: order.event.id,
        gross_amount: grossAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        net_amount: netAmount,
        status: 'PENDING',
        available_at: availableAt
      }
    });

    // Update organization balance
    await tx.organization.update({
      where: { id: organization.id },
      data: {
        total_revenue: { increment: grossAmount },
        pending_balance: { increment: netAmount }
      }
    });
  });
}
```

### Revenue Flow

```
Order PAID (500,000 VND)
    ↓
Create RevenueShare:
  - gross_amount: 500,000
  - commission_rate: 5%
  - commission_amount: 25,000 (platform giữ)
  - net_amount: 475,000 (organizer nhận)
  - status: PENDING
  - available_at: event.end_at + 7 days
    ↓
Update Organization:
  - total_revenue += 500,000
  - pending_balance += 475,000
    ↓
After 7 days (via cron job):
  - status: PENDING → AVAILABLE
  - pending_balance → available_balance
    ↓
Organizer có thể request payout ✅
```

---

## 🔄 FEATURE 2: RETURN URL HANDLER

### DTO Created

**File:** `src/payment/dto/vnpay-return.dto.ts`

```typescript
export class VnpayReturnDto {
  vnp_TmnCode: string;
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_PayDate: string;
  vnp_OrderInfo: string;
  vnp_TransactionNo: string;
  vnp_ResponseCode: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHashType?: string;
  vnp_SecureHash: string;
}
```

### Service Method

**File:** `src/payment/payment.service.ts`

```typescript
verifyVnpayHash(params: Record<string, string>): boolean {
  const vnpParams = { ...params };
  const secureHash = vnpParams.vnp_SecureHash;
  
  // Remove hash fields
  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  // Sort and create hash
  const sortedParams = this.sortObject(vnpParams);
  const querystring = this.serialize(sortedParams);
  const checkSum = this.createSecureHash(querystring);

  return secureHash === checkSum;
}
```

### Controller Endpoint

**File:** `src/payment/payment.controller.ts`

```typescript
@Get('vnpay/return')
async handleVnpayReturn(
  @Query() query: VnpayReturnDto,
  @Res() res: Response
) {
  // 1. Verify secure hash
  const isValid = this.paymentService.verifyVnpayHash(query as any);
  
  if (!isValid) {
    return res.redirect(
      `${FRONTEND_URL}/payment/error?reason=invalid_signature`
    );
  }

  // 2. Check response code
  const success = query.vnp_ResponseCode === '00';
  
  if (success) {
    // Redirect to success page
    return res.redirect(
      `${FRONTEND_URL}/payment/success?order_number=${query.vnp_TxnRef}&amount=${query.vnp_Amount}&transaction_no=${query.vnp_TransactionNo}`
    );
  } else {
    // Redirect to failure page
    return res.redirect(
      `${FRONTEND_URL}/payment/failure?code=${query.vnp_ResponseCode}`
    );
  }
}
```

### Return URL Flow

```
Customer thanh toán tại VNPAY
    ↓
VNPAY redirect → GET /payment/vnpay/return?vnp_ResponseCode=00&...
    ↓
Backend:
  1. Verify secure hash ✓
  2. Check response code
    ↓
    If SUCCESS (00):
      → Redirect: /payment/success?order_number=...
    ↓
    If FAILED:
      → Redirect: /payment/failure?code=...
    ↓
Frontend hiển thị kết quả cho customer
```

### Frontend Pages Needed

```typescript
// 1. Success Page
/payment/success?order_number=ORD-123&amount=50000000&transaction_no=...
- Hiển thị: ✅ Thanh toán thành công
- Button: Xem vé của tôi → /my-tickets
- Button: Xem chi tiết order → /orders/{order_number}

// 2. Failure Page
/payment/failure?code=07
- Hiển thị: ❌ Thanh toán thất bại
- Error message tương ứng với code
- Button: Thử lại → Back to event page
- Button: Liên hệ hỗ trợ

// 3. Error Page
/payment/error?reason=invalid_signature
- Hiển thị: ⚠️ Lỗi xử lý thanh toán
- Khuyến nghị liên hệ support
```

---

## 📝 VNPAY RESPONSE CODES

| Code | Ý nghĩa | Frontend Action |
|------|---------|-----------------|
| 00 | Giao dịch thành công | → Success page |
| 07 | Trừ tiền thành công, nghi vấn | → Contact support |
| 09 | Thẻ chưa đăng ký dịch vụ | → Retry với thẻ khác |
| 10 | Thẻ/Tài khoản không đúng | → Check info & retry |
| 11 | Thẻ hết hạn | → Use another card |
| 12 | Thẻ bị khóa | → Contact bank |
| 24 | Giao dịch bị hủy | → User cancelled |
| 51 | Tài khoản không đủ số dư | → Retry |
| 65 | Vượt quá số lần nhập OTP | → Try later |
| 75 | Ngân hàng đang bảo trì | → Try later |
| 79 | Vượt quá số lần thanh toán | → Try tomorrow |

---

## ✅ TESTING CHECKLIST

### Manual Testing Steps

#### Test 1: Revenue Tracking

```bash
# 1. Tạo order mới
POST /orders
{
  event_id: "...",
  items: [...]
}

# 2. Thanh toán via VNPAY
POST /orders/{id}/payment/initiate

# 3. VNPAY callback với success
POST /payment/callback/vnpay
{
  vnp_ResponseCode: "00",
  vnp_TransactionStatus: "00"
}

# 4. Verify database
SELECT * FROM revenue_shares WHERE order_id = '...';
-- Should show: status=PENDING, net_amount=...

SELECT * FROM organizations WHERE id = '...';
-- Should show: total_revenue increased, pending_balance increased
```

#### Test 2: Return URL

```bash
# 1. Simulate VNPAY return (success)
GET /payment/vnpay/return?vnp_ResponseCode=00&vnp_TxnRef=ORD-123&...

# Should redirect to:
http://localhost:5173/payment/success?order_number=ORD-123&...

# 2. Simulate VNPAY return (failure)
GET /payment/vnpay/return?vnp_ResponseCode=24&...

# Should redirect to:
http://localhost:5173/payment/failure?code=24
```

---

## 🎯 NEXT STEPS

### Immediate (Bây giờ)

- [x] Database schema ✅
- [x] Revenue tracking logic ✅
- [x] Return URL handler ✅

### Soon (Trong vài ngày)

- [ ] Frontend: Success/Failure/Error pages
- [ ] Email notification với tickets
- [ ] Cron job để release revenue (PENDING → AVAILABLE)

### Later (Sau khi test xong)

- [ ] Implement Payout Module
- [ ] Admin dashboard cho revenue management
- [ ] Analytics & reporting

---

## 📚 FILES CHANGED

### Created
- `src/payment/dto/vnpay-return.dto.ts` ✨ New
- `prisma/migrations/20251209073041_add_revenue_tracking/` ✨ New
- `PAYMENT_MODULE_UPDATES.md` ✨ New (this file)

### Modified
- `prisma/schema.prisma` 📝
  - Added: RevenueShareStatus enum
  - Updated: Organization model (revenue fields)
  - Added: RevenueShare model
  - Updated: Order, Event relations

- `src/orders/orders.service.ts` 📝
  - Updated: `confirmPayment()` method
  - Added: `createRevenueShare()` private method

- `src/payment/payment.service.ts` 📝
  - Added: `verifyVnpayHash()` public method

- `src/payment/payment.controller.ts` 📝
  - Added: `handleVnpayReturn()` endpoint (GET /payment/vnpay/return)

---

## 🔐 SECURITY NOTES

1. **Secure Hash Validation:** Return URL handler validates VNPAY secure hash
2. **Transaction Safety:** Revenue tracking uses Prisma transaction
3. **Idempotency:** confirmPayment() checks if revenue_share exists
4. **Error Handling:** All errors logged, không block payment flow

---

## 🌟 BUSINESS LOGIC

### Commission Model

```
Platform giữ: 5% (configurable per organization)
Organizer nhận: 95%

Example:
Customer mua vé: 500,000 VND
  ├─ Platform: 25,000 VND (5%)
  └─ Organizer: 475,000 VND (95%)
```

### Hold Period

```
Order PAID → Revenue PENDING (7 days)
  ↓
Event kết thúc
  ↓
+7 days
  ↓
Revenue AVAILABLE (có thể rút)
```

---

**Status:** ✅ Payment Module sẵn sàng cho Payout Module  
**Next Action:** Implement Payout Module theo `PAYOUT_MODULE_IMPLEMENTATION.md`

