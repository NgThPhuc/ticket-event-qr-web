# Payout Module (Frontend Integration Guide)

Tài liệu này mô tả cách frontend tích hợp luồng trả tiền cho tổ chức (payout) sau khi bán vé. Backend hiện đang mô phỏng payout nội bộ, không gọi cổng thanh toán; tiền được hạch toán qua các trường balance và revenue_share.

## Tổng quan luồng
1) Khi đơn hàng thanh toán thành công, backend tạo `RevenueShare`:
   - `status = PENDING`
   - `available_at = event.end_at + 3 ngày`
   - Cộng vào `Organization.pending_balance`.
2) Sau khi đủ điều kiện (available_at <= now), payout cycle sẽ:
   - PENDING -> AVAILABLE, chuyển `pending_balance` -> `available_balance`.
   - AVAILABLE -> PAID_OUT, trừ `available_balance`, cộng `total_paid_out`.
3) Payout cycle hiện kích hoạt thủ công qua API (PLATFORM_ADMIN). Có thể triển khai cron sau.

## Điều kiện để tổ chức nhận payout
- `organization.payout_enabled = true`.
- Tổ chức phải có đủ thông tin ngân hàng:
  - `bank_account_number`
  - `bank_account_name`
  - `bank_name`
- Nếu thiếu hoặc payout_enabled = false, share sẽ bị “skipped” trong chu kỳ payout.

## API liên quan (backend)
### 1. Bật/tắt payout cho organization
- **Endpoint**: `POST /payouts/organizations/:organizationId/status`
- **Auth**: Bearer JWT, role `PLATFORM_ADMIN`
- **Body**:
```json
{ "payout_enabled": true }
```
- **Lưu ý**: Endpoint này **chỉ** bật/tắt `payout_enabled`, **không** trả lỗi 409 nếu thiếu thông tin ngân hàng. Khuyến nghị chỉ bật khi tổ chức đã đủ `bank_account_number`, `bank_account_name`, `bank_name`. Nếu thiếu, khi chạy payout (`POST /payouts/run`), các share của tổ chức đó sẽ bị đưa vào danh sách `skipped` với lý do "Payout disabled hoặc thiếu thông tin ngân hàng".

### 2. Chạy payout cycle thủ công
- **Endpoint**: `POST /payouts/run`
- **Auth**: Bearer JWT, role `PLATFORM_ADMIN`
- **Kết quả**:
```json
{
  "matured": <số share chuyển PENDING -> AVAILABLE>,
  "paid_out": <số share trả tiền>,
  "skipped": [
    { "shareId": "...", "organizationId": "...", "reason": "Payout disabled hoặc thiếu thông tin ngân hàng" }
  ]
}
```

## Thông tin trường dữ liệu chính
- Organization:
  - `payout_enabled: boolean`
  - `bank_account_number: string`
  - `bank_account_name: string`
  - `bank_name: string`
  - Balances: `pending_balance`, `available_balance`, `total_paid_out`, `total_revenue`
- RevenueShare:
  - `status: PENDING | AVAILABLE | PAID_OUT | CANCELLED`
  - `available_at`: thời điểm bắt đầu có thể trả
  - `net_amount`: số tiền trả cho organizer (sau commission)

## Gợi ý UI/UX cho frontend
### 1. Trang thông tin tổ chức (Organizer)
- Form cập nhật thông tin ngân hàng (3 trường) và cho biết trạng thái payout:
  - Nếu thiếu bank info hoặc payout chưa bật: hiển thị cảnh báo “Chưa đủ thông tin để nhận tiền”.
  - Nếu đã bật payout: hiển thị “Đang bật payout”.

### 2. Trang dành cho Platform Admin
- Bảng/tabs cho payout:
  - Danh sách revenue shares (PENDING/AVAILABLE/PAID_OUT).
  - Hiển thị số dư: pending_balance, available_balance, total_paid_out.
  - Nút “Chạy payout” (gọi `POST /payouts/run`) — có thể chỉ cần trong môi trường admin.
  - Nút bật/tắt payout cho từng organization (gọi `POST /payouts/organizations/:id/status`).
  - Danh sách “skipped” sau mỗi lần chạy, để biết tổ chức nào thiếu thông tin.

### 3. Trạng thái và thông báo
- PENDING: đang chờ tới available_at.
- AVAILABLE: đủ điều kiện trả (sẽ trả ở bước payout).
- PAID_OUT: đã trả.
- Nếu bị skipped: hiển thị lý do (thiếu bank info hoặc payout disabled).

## Cách tính thời gian
- available_at = `event.end_at + 3 ngày`.
- Payout cycle nên chạy ít nhất mỗi ngày (hoặc mỗi giờ nếu có cron). Hiện tại gọi thủ công qua API.

## Commission / tỷ lệ chia
- Platform giữ `platform_commission` (%), mặc định 5%.
- `net_amount` = `gross_amount - commission_amount`.
- Payout trả `net_amount` cho organizer.

## Xử lý lỗi/thiếu sót
- Nếu tổ chức thiếu bank info khi bật payout: backend trả lỗi 409 với thông báo yêu cầu đủ 3 trường.
- Khi chạy payout, nếu thiếu bank info hoặc payout_disabled: share bị skip, trả danh sách skipped trong response.

## Kịch bản tích hợp tối thiểu
1) Organizer cập nhật bank info (3 trường).  
2) Platform admin bật payout cho organization.  
3) Platform admin (hoặc cron sau này) gọi `POST /payouts/run`.  
4) Frontend hiển thị kết quả (matured, paid_out, skipped) và cập nhật số dư/ trạng thái.

