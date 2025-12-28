# 🧪 Hướng Dẫn Test Payout API - Chi Tiết Từng Bước

## 📌 Yêu Cầu Trước Khi Test

### Tài khoản cần có:
| Vai trò | Email mẫu | Mục đích |
|---------|-----------|----------|
| PLATFORM_ADMIN | admin@example.com | Xử lý thanh toán, mature shares |
| ORGANIZER_ADMIN | organizer@example.com | Yêu cầu rút tiền, xem số dư |

### Dữ liệu cần có:
- Tổ chức đã có thông tin ngân hàng (bank_name, bank_account_number, bank_account_name)
- Tổ chức đã được bật payout_enabled = true
- Có ít nhất 1 event đã COMPLETED với doanh thu từ bán vé

---

## 🔄 LUỒNG TEST CHI TIẾT

---

## BƯỚC 1: Chuẩn Bị Dữ Liệu (Backend/Database)

### 1.1. Kiểm tra tổ chức có thông tin ngân hàng

Vào database hoặc API để đảm bảo tổ chức có:
```json
{
  "bank_name": "Vietcombank",
  "bank_account_number": "1234567890",
  "bank_account_name": "NGUYEN VAN A",
  "payout_enabled": true
}
```

### 1.2. Đảm bảo có event đã COMPLETED với RevenueShare

Cần có record trong bảng `revenue_share` với:
- `status`: "PENDING" hoặc "MATURE"
- `organization_id`: ID của tổ chức test
- `amount`: > 0

---

## BƯỚC 2: Admin Mature Revenue Shares

> **Mục đích**: Chuyển revenue từ PENDING → MATURE (sau đó available_balance tăng)

### Thao tác:

1. **Mở browser** → `http://localhost:5173`

2. **Đăng nhập với PLATFORM_ADMIN**
   - Email: `admin@example.com`
   - Password: `password`
   - Bấm "Đăng nhập"

3. **Vào trang quản lý Payouts**
   - Nhìn Sidebar bên trái
   - Tìm menu **"Thanh toán"** (biểu tượng tiền)
   - Click vào đó
   - URL sẽ là: `http://localhost:5173/admin/payouts`

4. **Bấm nút "Mature Shares"**
   - Ở góc trên phải, cạnh nút "Làm mới"
   - Click nút **"Mature Shares"**

5. **Kết quả mong đợi**:
   - Alert/Dialog hiển thị: "Đã mature X revenue shares"
   - X là số lượng revenue shares được mature

6. **Đăng xuất**
   - Click avatar góc dưới sidebar
   - Chọn "Đăng xuất"

---

## BƯỚC 3: Organizer Xem Số Dư

### Thao tác:

1. **Đăng nhập với ORGANIZER_ADMIN**
   - Email: `organizer@example.com`
   - Password: `password`
   - Bấm "Đăng nhập"

2. **Vào danh sách tổ chức**
   - Sidebar → **"Tổ chức"**
   - URL: `http://localhost:5173/organizations`

3. **Click vào tổ chức của bạn**
   - Tìm card tổ chức
   - Click vào tên hoặc nút "Chi tiết"
   - URL: `http://localhost:5173/organizations/{id}`

4. **Cuộn xuống phần "Số dư & Rút tiền"**
   - Nằm trong Card thông tin tổ chức
   - Có icon ví tiền và tiêu đề "Số dư & Rút tiền"

5. **Kiểm tra 3 ô số liệu**:

   | Ô | Màu sắc | Ý nghĩa | Giá trị mong đợi |
   |---|---------|---------|------------------|
   | Khả dụng | Xanh lá | Tiền có thể rút | > 0 (nếu đã mature) |
   | Đang chờ | Vàng | Tiền chờ mature | Có thể = 0 hoặc > 0 |
   | Đã rút | Xanh dương | Tổng đã rút | 0 (lần đầu) |

6. **Kiểm tra các cảnh báo (nếu có)**:
   - ⚠️ "Tính năng rút tiền chưa được kích hoạt" → payout_enabled = false
   - ⚠️ "Vui lòng cập nhật thông tin ngân hàng" → thiếu bank info

7. **Kiểm tra nút "Yêu cầu rút tiền"**:
   - Nếu `available_balance > 0` VÀ `payout_enabled = true` VÀ `has_bank_info = true` → Nút enabled
   - Ngược lại → Nút disabled (màu xám)

---

## BƯỚC 4: Organizer Yêu Cầu Rút Tiền

### Thao tác:

1. **Đang ở trang chi tiết tổ chức** (từ bước 3)

2. **Click nút "Yêu cầu rút tiền"**
   - Nút màu xanh, có icon tiền
   - Nằm ở cuối section "Số dư & Rút tiền"

3. **Dialog "Yêu cầu rút tiền" mở ra**:
   ```
   ┌─────────────────────────────────────┐
   │       Yêu cầu rút tiền              │
   ├─────────────────────────────────────┤
   │ Số dư khả dụng: 1.000.000 ₫        │
   │ Để trống để rút toàn bộ số dư.     │
   │                                     │
   │ Số tiền muốn rút (VNĐ):            │
   │ ┌─────────────────────────────────┐ │
   │ │ Để trống để rút hết             │ │
   │ └─────────────────────────────────┘ │
   │                                     │
   │ Yêu cầu sẽ được admin xử lý.       │
   │                                     │
   │        [Hủy]    [Gửi yêu cầu]      │
   └─────────────────────────────────────┘
   ```

4. **Test Case A: Rút một phần**
   - Nhập số tiền: `500000`
   - Click **"Gửi yêu cầu"**

5. **Test Case B: Rút hết (để trống)**
   - Không nhập gì
   - Click **"Gửi yêu cầu"**

6. **Kết quả mong đợi**:
   - Dialog đóng lại
   - Thông báo xanh: **"Yêu cầu rút tiền đã được gửi thành công!"**
   - Số **"Khả dụng"** giảm đi tương ứng
   - Nếu rút hết → Khả dụng = 0

7. **Nếu lỗi xảy ra**:
   - Thông báo đỏ với message từ API
   - Ví dụ: "You already have a pending payout request"

---

## BƯỚC 5: Organizer Xem Lịch Sử Rút Tiền

### Thao tác:

1. **Từ trang chi tiết tổ chức**

2. **Click nút "Lịch sử"**
   - Nằm ở góc phải của section "Số dư & Rút tiền"
   - Có icon đồng hồ

3. **Trang Lịch Sử Rút Tiền mở ra**:
   - URL: `http://localhost:5173/organizations/{id}/payouts`

4. **Kiểm tra 3 card thống kê**:
   | Card | Ý nghĩa | Giá trị mong đợi |
   |------|---------|------------------|
   | Tổng đã rút | Tiền đã chuyển thành công | 0 (lần đầu) |
   | Tổng yêu cầu | Số lượng requests | 1 |
   | Đang chờ xử lý | Requests pending | 1 |

5. **Kiểm tra bảng danh sách**:
   | Cột | Giá trị mong đợi |
   |-----|------------------|
   | Ngày tạo | Ngày hôm nay, giờ vừa tạo |
   | Số tiền | 500.000 ₫ (hoặc số đã nhập) |
   | Ngân hàng | Vietcombank (từ bank_name) |
   | Trạng thái | Badge vàng "Chờ xử lý" |
   | Mã GD | - (trống, chưa xử lý) |
   | Ngày xử lý | - (trống) |

6. **Đăng xuất**

---

## BƯỚC 6: Admin Xem Danh Sách Payouts

### Thao tác:

1. **Đăng nhập với PLATFORM_ADMIN**

2. **Vào trang Quản lý Payouts**
   - Sidebar → **"Thanh toán"**
   - URL: `http://localhost:5173/admin/payouts`

3. **Kiểm tra giao diện**:
   ```
   ┌──────────────────────────────────────────────────────────┐
   │ Quản Lý Payouts                    [Mature] [Làm mới]   │
   │ Xử lý các yêu cầu rút tiền từ tổ chức                   │
   ├──────────────────────────────────────────────────────────┤
   │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
   │ │ Chờ XL  │ │ Đang XL │ │ T.Công  │ │ T.Bại   │         │
   │ │    1    │ │    0    │ │    0    │ │    0    │         │
   │ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
   ├──────────────────────────────────────────────────────────┤
   │ [Tất cả] [Chờ xử lý] [Đang xử lý] [Thành công] [Thất bại]│
   ├──────────────────────────────────────────────────────────┤
   │ Tổ chức | Số tiền | Ngân hàng | Trạng thái | ... | Action│
   │─────────────────────────────────────────────────────────│
   │ Org ABC | 500.000₫| VCB ****90| Chờ xử lý  | ... | [TT] │
   └──────────────────────────────────────────────────────────┘
   ```

4. **Click các tab filter**:
   - **"Tất cả"** → Hiển thị tất cả payouts
   - **"Chờ xử lý"** → Chỉ PENDING (default)
   - **"Đang xử lý"** → Chỉ PROCESSING
   - **"Thành công"** → Chỉ COMPLETED
   - **"Thất bại"** → Chỉ FAILED

5. **Kiểm tra thông tin trong bảng**:
   | Cột | Giá trị |
   |-----|---------|
   | Tổ chức | Tên org + Chủ TK ngân hàng |
   | Số tiền | Định dạng VNĐ (500.000 ₫) |
   | Ngân hàng | Tên bank + Số TK ẩn (****1234) |
   | Trạng thái | Badge màu theo status |
   | Ngày tạo | DD/MM/YYYY HH:mm |
   | Mã GD | - (nếu chưa xử lý) |
   | Thao tác | Nút "Thanh toán" (nếu PENDING) |

---

## BƯỚC 7: Admin Xử Lý Thanh Toán

### Thao tác:

1. **Đang ở trang /admin/payouts**

2. **Click tab "Chờ xử lý"** (nếu chưa ở đó)

3. **Tìm yêu cầu cần xử lý**

4. **Click nút "Thanh toán"**
   - Nút xanh, có icon check
   - Nằm ở cột cuối cùng

5. **Dialog xác nhận xuất hiện**:
   ```
   ┌────────────────────────────────────┐
   │ Xác nhận thanh toán cho yêu cầu   │
   │ này?                               │
   │                                    │
   │           [Hủy]  [Xác nhận]        │
   └────────────────────────────────────┘
   ```

6. **Click "Xác nhận" (hoặc OK)**

7. **Quan sát nút loading**:
   ```
   ┌────────────────────────┐
   │ ◌ Đang xử lý...        │  ← Spinner quay ~2 giây
   └────────────────────────┘
   ```

8. **Sau khi xử lý xong (~2 giây)**:
   - Bảng tự động refresh
   - Yêu cầu đó:
     - Trạng thái: **"Thành công"** (badge xanh lá)
     - Mã GD: `TXN_1735388400_abc123` (mã giao dịch)
     - Nút "Thanh toán" biến mất

---

## BƯỚC 8: Organizer Kiểm Tra Kết Quả

### Thao tác:

1. **Đăng nhập với ORGANIZER_ADMIN**

2. **Vào trang Lịch Sử Rút Tiền**
   - `/organizations/{id}/payouts`

3. **Kiểm tra bảng**:
   | Cột | Giá trị mới |
   |-----|-------------|
   | Trạng thái | Badge xanh **"Thành công"** |
   | Mã GD | `TXN_xxx` |
   | Ngày xử lý | Ngày hôm nay, vừa xử lý |

4. **Kiểm tra card thống kê**:
   | Card | Giá trị mới |
   |------|-------------|
   | Tổng đã rút | 500.000 ₫ (số tiền vừa rút) |
   | Đang chờ xử lý | 0 |

5. **Quay lại trang chi tiết tổ chức**
   - Click nút "←" hoặc vào `/organizations/{id}`

6. **Kiểm tra section "Số dư & Rút tiền"**:
   | Ô | Giá trị mới |
   |---|-------------|
   | Đã rút | 500.000 ₫ (tăng lên) |
   | Khả dụng | Giảm xuống |

---

## ❌ TEST CASES LỖI

### Test 1: Rút tiền khi số dư = 0

**Điều kiện**: available_balance = 0

**Thao tác**: Vào trang chi tiết tổ chức

**Kết quả mong đợi**: 
- Nút "Yêu cầu rút tiền" bị **disabled** (màu xám)
- Không thể click

---

### Test 2: Rút tiền khi chưa có bank info

**Điều kiện**: Tổ chức chưa có thông tin ngân hàng

**Thao tác**: Vào trang chi tiết tổ chức

**Kết quả mong đợi**: 
- Hiển thị cảnh báo vàng: ⚠️ "Vui lòng cập nhật thông tin ngân hàng"
- Nút "Yêu cầu rút tiền" bị **disabled**

---

### Test 3: Rút tiền khi payout chưa được bật

**Điều kiện**: payout_enabled = false

**Thao tác**: Vào trang chi tiết tổ chức

**Kết quả mong đợi**: 
- Hiển thị cảnh báo vàng: ⚠️ "Tính năng rút tiền chưa được kích hoạt"
- Nút "Yêu cầu rút tiền" bị **disabled**

---

### Test 4: Nhập số tiền > available_balance

**Thao tác**: 
1. Mở dialog "Yêu cầu rút tiền"
2. Nhập số tiền lớn hơn số dư khả dụng (VD: 10.000.000 khi chỉ có 500.000)
3. Bấm "Gửi yêu cầu"

**Kết quả mong đợi**: 
- Thông báo đỏ (error)
- Message: "Insufficient available balance" hoặc tương tự

---

### Test 5: Tạo yêu cầu khi đã có pending request

**Điều kiện**: Đã có 1 yêu cầu đang PENDING

**Thao tác**: Thử tạo thêm yêu cầu mới

**Kết quả mong đợi**: 
- Thông báo đỏ (error)
- Message: "You already have a pending payout request"

---

## ✅ CHECKLIST TEST HOÀN THÀNH

- [ ] Admin mature shares thành công
- [ ] Organizer xem số dư đúng
- [ ] Organizer yêu cầu rút tiền thành công
- [ ] Organizer xem lịch sử rút tiền
- [ ] Admin xem danh sách payouts
- [ ] Admin filter theo status hoạt động
- [ ] Admin xử lý thanh toán thành công (có loading ~2s)
- [ ] Sau khi xử lý: status chuyển COMPLETED, có mã GD
- [ ] Organizer thấy kết quả đã cập nhật
- [ ] Test case lỗi: rút khi số dư = 0
- [ ] Test case lỗi: rút khi chưa có bank info
- [ ] Test case lỗi: rút số tiền > available
- [ ] Test case lỗi: tạo duplicate pending request
