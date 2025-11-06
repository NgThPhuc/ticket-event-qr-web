# Ticket Event QR Web

Project React + Tailwind CSS + JavaScript chạy trên Node.js 22.20+

## Yêu cầu

- Node.js >= 22.20.0
- npm hoặc yarn

## Cài đặt

```bash
npm install
```

## Chạy development server

```bash
npm run dev
```

Project sẽ chạy tại `http://localhost:5173`

## Build production

```bash
npm run build
```

## Preview production build

```bash
npm run preview
```

## Cấu hình

Tạo file `.env` trong thư mục root:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Thay đổi URL theo địa chỉ API backend của bạn.

## Cấu trúc project

```
ticket-event-qr-web/
├── index.html              # Entry HTML
├── vite.config.js          # Cấu hình Vite
├── tailwind.config.js      # Cấu hình Tailwind CSS
├── postcss.config.js       # Cấu hình PostCSS
├── package.json            # Dependencies
└── src/
    ├── main.jsx            # Entry point React
    ├── App.jsx             # Component chính với routing
    ├── index.css           # Tailwind CSS imports
    ├── api/                # API services
    │   ├── config.js       # API configuration
    │   └── auth.js         # Authentication API
    ├── contexts/           # React Contexts
    │   └── AuthContext.jsx # Authentication context
    ├── components/         # Reusable components
    │   ├── ui/            # UI components
    │   │   ├── Input.jsx
    │   │   ├── Button.jsx
    │   │   └── Alert.jsx
    │   └── ProtectedRoute.jsx
    └── pages/              # Page components
        ├── Home.jsx
        ├── Login.jsx
        ├── Register.jsx
        ├── VerifyOTP.jsx
        ├── ForgotPassword.jsx
        ├── ResetPassword.jsx
        └── GoogleCallback.jsx
```

## Công nghệ sử dụng

- **React 18** - UI library
- **React Router DOM 6** - Routing
- **Tailwind CSS 3** - Utility-first CSS framework
- **Vite** - Build tool và dev server
- **Node.js 22.20+** - Runtime environment

## Tính năng Authentication

Project đã được tích hợp đầy đủ các tính năng authentication:

### ✅ Đã hoàn thành

1. **Đăng ký** (`/register`)
   - Form đăng ký với validation
   - Gửi OTP qua email

2. **Xác thực OTP** (`/verify-otp`)
   - Nhập mã OTP 6 số
   - Resend OTP với countdown timer

3. **Đăng nhập** (`/login`)
   - Đăng nhập bằng email/password
   - Đăng nhập bằng Google OAuth
   - Link quên mật khẩu

4. **Quên mật khẩu** (`/forgot-password`)
   - Gửi link reset password qua email

5. **Đặt lại mật khẩu** (`/reset-password`)
   - Nhập mật khẩu mới với token từ email

6. **Protected Routes**
   - Bảo vệ routes yêu cầu authentication
   - Tự động redirect đến login nếu chưa đăng nhập

7. **Google OAuth Callback** (`/auth/callback`)
   - Xử lý callback từ Google OAuth
   - Tự động lưu token và thông tin user

### 🔧 Cách sử dụng

1. **Đăng ký tài khoản mới:**
   - Truy cập `/register`
   - Điền thông tin và submit
   - Kiểm tra email để lấy mã OTP
   - Xác thực OTP tại `/verify-otp`

2. **Đăng nhập:**
   - Truy cập `/login`
   - Nhập email/password hoặc click "Đăng nhập bằng Google"

3. **Quên mật khẩu:**
   - Click "Quên mật khẩu?" ở trang login
   - Nhập email và nhận link reset password
   - Click link trong email để đặt lại mật khẩu

### 📝 API Endpoints

Tất cả API calls được định nghĩa trong `src/api/auth.js`:

- `POST /auth/register` - Đăng ký
- `POST /auth/verify-otp` - Xác thực OTP
- `POST /auth/login` - Đăng nhập
- `GET /auth/google` - Đăng nhập Google
- `POST /auth/forgot-password` - Quên mật khẩu
- `POST /auth/reset-password` - Đặt lại mật khẩu
- `GET /auth/profile` - Lấy thông tin profile
- `POST /auth/logout` - Đăng xuất

Xem chi tiết trong file `src/api/auth.js` và tài liệu API backend.

