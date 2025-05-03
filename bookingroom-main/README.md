# Hệ Thống Đặt Phòng Học Tập HCMUT

Hệ thống quản lý và đặt phòng học tập trực tuyến cho sinh viên Đại học Bách Khoa TP.HCM.

## Tính Năng

### Cho Sinh Viên
- Đăng ký tài khoản
- Đăng nhập vào hệ thống
- Xem danh sách phòng học
- Đặt phòng học theo thời gian
- Xem lịch sử đặt phòng
- Đánh giá phòng học
- Nhận thông báo về trạng thái đặt phòng

### Cho Quản Trị Viên
- Đăng ký tài khoản quản trị viên (yêu cầu mã xác thực)
- Đăng nhập vào hệ thống
- Quản lý thông tin người dùng
- Quản lý danh sách phòng học
- Xem thống kê sử dụng phòng
- Quản lý đơn đặt phòng
- Gửi thông báo đến người dùng

## Công Nghệ Sử Dụng

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication
- Bcrypt Password Hashing

### Frontend
- React.js
- Material-UI
- React Router
- Axios
- Redux (nếu cần)

## Cài Đặt và Chạy

### Yêu Cầu Hệ Thống
- Node.js (v14 trở lên)
- MongoDB
- npm hoặc yarn

### Cài Đặt Backend
```bash
cd backend
npm install
```

### Cài Đặt Frontend
```bash
cd frontend
npm install
```

### Cấu Hình Môi Trường
1. Tạo file `.env` trong thư mục backend:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hcmut_study_space
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

2. Tạo file `.env` trong thư mục frontend:
```
REACT_APP_API_URL=http://localhost:5000
```

### Chạy Ứng Dụng
1. Khởi động MongoDB
2. Chạy backend:
```bash
cd backend
npm start
```
3. Chạy frontend:
```bash
cd frontend
npm start
```

## API Endpoints

### Authentication
- POST `/auth/register` - Đăng ký tài khoản sinh viên
- POST `/auth/register-admin` - Đăng ký tài khoản quản trị viên (yêu cầu mã xác thực)
- POST `/auth/login` - Đăng nhập
- POST `/auth/logout` - Đăng xuất
- POST `/auth/refresh` - Làm mới token
- GET `/auth/profile` - Xem thông tin người dùng
- PUT `/auth/update` - Cập nhật thông tin người dùng

### Quản Lý Phòng
- GET `/spaces` - Lấy danh sách phòng
- GET `/spaces/:id` - Lấy thông tin chi tiết phòng
- POST `/spaces` - Tạo phòng mới (admin)
- PUT `/spaces/:id` - Cập nhật thông tin phòng (admin)
- DELETE `/spaces/:id` - Xóa phòng (admin)

### Đặt Phòng
- POST `/bookings` - Tạo đơn đặt phòng
- GET `/bookings` - Xem danh sách đơn đặt phòng
- GET `/bookings/:id` - Xem chi tiết đơn đặt phòng
- PUT `/bookings/:id` - Cập nhật trạng thái đơn đặt phòng (admin)
- DELETE `/bookings/:id` - Hủy đơn đặt phòng

### Quản Lý Người Dùng
- GET `/users` - Lấy danh sách người dùng (admin)
- GET `/users/:id` - Lấy thông tin chi tiết người dùng
- PUT `/users/:id` - Cập nhật thông tin người dùng (admin)
- DELETE `/users/:id` - Xóa người dùng (admin)

## Bảo Mật
- Mật khẩu được mã hóa bằng bcrypt
- JWT token cho xác thực
- Refresh token để làm mới access token
- Kiểm tra quyền truy cập cho các endpoint admin
- Mã xác thực đặc biệt cho đăng ký quản trị viên

## Đóng Góp
1. Fork repository
2. Tạo branch mới (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## Giấy Phép