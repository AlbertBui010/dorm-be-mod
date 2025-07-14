# Hệ thống quản lý ký túc xá - BackendKTX

## Tổng quan

Backend API cho hệ thống quản lý ký túc xá sử dụng Node.js, Express.js, PostgreSQL và Sequelize ORM.

## Cấu trúc dự án

```
backend/
├── config/
│   └── database.js          # Cấu hình database
├── src/
│   ├── config/
│   │   └── database.js      # Kết nối database
│   ├── controllers/         # Controllers xử lý request
│   │   ├── authController.js
│   │   ├── sinhVienController.js
│   │   └── phongController.js
│   ├── middleware/          # Middleware
│   │   ├── auth.js          # Xác thực và phân quyền
│   │   ├── error.js         # Xử lý lỗi
│   │   └── validation.js    # Xử lý validation
│   ├── models/              # Sequelize models
│   │   ├── index.js         # Export tất cả models và associations
│   │   ├── NhanVien.js
│   │   ├── SinhVien.js
│   │   ├── Phong.js
│   │   ├── Giuong.js
│   │   ├── DangKy.js
│   │   ├── LichSuOPhong.js
│   │   ├── DonGiaDienNuoc.js
│   │   ├── ChiSoDienNuoc.js
│   │   ├── ChiTietDienNuoc.js
│   │   ├── ThanhToan.js
│   │   ├── YeuCauChuyenPhong.js
│   │
│   ├── routes/              # API routes
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   ├── sinhVienRoutes.js
│   │   └── phongRoutes.js
│   ├── services/            # Business logic
│   │   ├── authService.js
│   │   ├── sinhVienService.js
│   │   └── phongService.js
│   ├── utils/               # Utilities
│   │   ├── auth.js          # JWT, bcrypt helpers
│   │   └── response.js      # Response helpers
│   ├── validators/          # Request validation
│   │   ├── authValidator.js
│   │   └── sinhVienValidator.js
│   └── server.js            # Entry point
├── docs/
│   └── db.sql              # Database schema
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Công nghệ sử dụng

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Request validation
- **helmet** - Security headers
- **cors** - Cross-Origin Resource Sharing
- **morgan** - HTTP request logger
- **compression** - Response compression
- **express-rate-limit** - Rate limiting

## Cài đặt và chạy

### 1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Cấu hình environment variables

```bash
cp .env.example .env
# Chỉnh sửa file .env với thông tin database và các cấu hình khác
```

### 3. Tạo database

```bash
createdb kytucxa_db
```

### 4. Chạy SQL script để tạo bảng

```bash
psql -d kytucxa_db -f docs/db.sql
```

### 5. Chạy server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin profile
- `POST /api/auth/change-password` - Đổi mật khẩu
- `POST /api/auth/logout` - Đăng xuất

### Sinh viên

- `GET /api/sinh-vien` - Lấy danh sách sinh viên
- `GET /api/sinh-vien/:id` - Lấy thông tin sinh viên
- `POST /api/sinh-vien` - Tạo sinh viên mới (Admin/QuanLy)
- `PUT /api/sinh-vien/:id` - Cập nhật sinh viên (Admin/QuanLy)
- `DELETE /api/sinh-vien/:id` - Xóa sinh viên (Admin)

### Phòng

- `GET /api/phong` - Lấy danh sách phòng
- `GET /api/phong/available` - Lấy danh sách phòng trống
- `GET /api/phong/:id` - Lấy thông tin phòng
- `POST /api/phong` - Tạo phòng mới (Admin/QuanLy)
- `PUT /api/phong/:id` - Cập nhật phòng (Admin/QuanLy)
- `DELETE /api/phong/:id` - Xóa phòng (Admin)

## Phân quyền

- **Admin**: Toàn quyền
- **QuanLy**: Quản lý sinh viên, phòng, đăng ký
- **NhanVien**: Xem thông tin, cập nhật cơ bản

## Models và Relationships

### Core Models

1. **NhanVien** - Nhân viên hệ thống
2. **SinhVien** - Sinh viên
3. **Phong** - Phòng ở
4. **Giuong** - Giường trong phòng

### Relationship Models

5. **DangKy** - Đăng ký phòng
6. **LichSuOPhong** - Lịch sử ở phòng

### Utility & Service Models

7. **DonGiaDienNuoc** - Đơn giá điện nước
8. **ChiSoDienNuoc** - Chỉ số điện nước theo phòng
9. **ChiTietDienNuoc** - Chi tiết tiền điện nước từng sinh viên
10. **ThanhToan** - Thanh toán
11. **YeuCauChuyenPhong** - Yêu cầu chuyển phòng

## Security Features

- JWT authentication
- Password hashing với bcrypt
- Rate limiting
- CORS protection
- Security headers với Helmet
- Input validation và sanitization
- SQL injection protection (Sequelize ORM)

## Error Handling

- Centralized error handling middleware
- Structured error responses
- Validation error formatting
- Database constraint error handling

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": {...}
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...]
}
```

### Pagination Response

```json
{
  "success": true,
  "message": "Success message",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "itemsPerPage": 10
  }
}
```

## Development

### Thêm Model mới

1. Tạo file model trong `src/models/`
2. Định nghĩa associations trong `src/models/index.js`
3. Tạo service trong `src/services/`
4. Tạo controller trong `src/controllers/`
5. Tạo routes trong `src/routes/`
6. Thêm validation nếu cần

### Testing

```bash
npm test
```

## Production Deployment

1. Set NODE_ENV=production
2. Configure production database
3. Set secure JWT secret
4. Configure email service
5. Set up SSL/HTTPS
6. Configure reverse proxy (nginx)
7. Set up process manager (PM2)

## Contributing

1. Fork the project
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request
