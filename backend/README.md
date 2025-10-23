# 📚 Bookstore API

Một API RESTful cho website bán sách online được xây dựng với Node.js, Express, MongoDB và Mongoose.

## 🚀 Tính năng chính

- **Xác thực & Phân quyền**: JWT authentication với phân quyền user/admin
- **Quản lý người dùng**: Đăng ký, đăng nhập, cập nhật thông tin
- **Quản lý sách**: CRUD operations cho sách, tìm kiếm, lọc theo thể loại
- **Quản lý thể loại**: CRUD operations cho categories
- **Đặt hàng**: Tạo đơn hàng, quản lý trạng thái đơn hàng
- **Đánh giá & Bình luận**: Review sách, comment trên review
- **Upload ảnh**: Multer middleware cho upload ảnh sách
- **Rate Limiting**: Giới hạn số lượng request
- **Validation**: Joi validation cho tất cả input

## 🛠️ Công nghệ sử dụng

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File upload
- **Joi** - Data validation
- **Express Rate Limit** - Rate limiting

## 📁 Cấu trúc dự án

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                  # Kết nối MongoDB
│   │   └── corsOptions.js         # CORS configuration
│   ├── controllers/               # Logic xử lý API
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── categoryController.js
│   │   ├── bookController.js
│   │   ├── orderController.js
│   │   ├── reviewController.js
│   │   └── commentController.js
│   ├── middlewares/               # Middleware functions
│   │   ├── authMiddleware.js      # JWT authentication
│   │   ├── errorHandler.js        # Global error handler
│   │   ├── uploadMiddleware.js    # File upload
│   │   └── validationMiddleware.js # Data validation
│   ├── models/                     # Mongoose models
│   │   ├── userModel.js
│   │   ├── categoryModel.js
│   │   ├── bookModel.js
│   │   ├── orderModel.js
│   │   ├── reviewModel.js
│   │   └── commentModel.js
│   ├── routes/                     # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── bookRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── commentRoutes.js
│   │   └── v1/
│   │       └── index.js            # Route mounting
│   ├── utils/
│   │   └── constants.js
│   └── server.js                   # Entry point
├── uploads/                        # Uploaded files
├── package.json
├── env.example                     # Environment variables template
└── README.md
```

## 🚀 Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd Book_Store/backend
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình environment variables
```bash
# Copy file env.example thành .env
cp env.example .env

# Chỉnh sửa file .env với thông tin của bạn
```

### 4. Cấu hình MongoDB
- Đảm bảo MongoDB đang chạy trên máy của bạn
- Hoặc sử dụng MongoDB Atlas (cloud)
- Cập nhật `MONGO_URI` trong file `.env`

### 5. Chạy ứng dụng
```bash
# Development mode
npm run dev

# Production mode
npm run production
```

Server sẽ chạy tại: `http://localhost:5000`

## 📋 API Endpoints

### 🔐 Authentication
- `POST /api/v1/auth/register` - Đăng ký user mới
- `POST /api/v1/auth/login` - Đăng nhập
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại

### 👥 Users
- `GET /api/v1/users` - Lấy danh sách users (Admin)
- `GET /api/v1/users/:id` - Lấy thông tin user (Admin)
- `PUT /api/v1/users/:id` - Cập nhật thông tin user
- `DELETE /api/v1/users/:id` - Xóa user (Admin)
- `PUT /api/v1/users/:id/avatar` - Cập nhật avatar

### 📚 Categories
- `GET /api/v1/categories` - Lấy tất cả categories
- `GET /api/v1/categories/:id` - Lấy thông tin category
- `POST /api/v1/categories` - Tạo category mới (Admin)
- `PUT /api/v1/categories/:id` - Cập nhật category (Admin)
- `DELETE /api/v1/categories/:id` - Xóa category (Admin)

### 📖 Books
- `GET /api/v1/books` - Lấy danh sách sách (có tìm kiếm, lọc, phân trang)
- `GET /api/v1/books/:id` - Lấy thông tin sách
- `POST /api/v1/books` - Tạo sách mới (Admin)
- `PUT /api/v1/books/:id` - Cập nhật sách (Admin)
- `DELETE /api/v1/books/:id` - Xóa sách (Admin)

### 🛒 Orders
- `POST /api/v1/orders` - Tạo đơn hàng mới
- `GET /api/v1/orders/user/:userId` - Lấy đơn hàng của user
- `GET /api/v1/orders/:id` - Lấy thông tin đơn hàng + order items
- `PUT /api/v1/orders/:id/status` - Cập nhật trạng thái đơn hàng (Admin)
- `DELETE /api/v1/orders/:id` - Hủy đơn hàng
- `GET /api/v1/orders` - Lấy tất cả đơn hàng (Admin)

### 📦 Order Items
- `GET /api/v1/order-items/order/:orderId` - Lấy items của đơn hàng
- `GET /api/v1/order-items/:id` - Lấy chi tiết order item
- `PUT /api/v1/order-items/:id` - Cập nhật quantity
- `DELETE /api/v1/order-items/:id` - Xóa order item
- `GET /api/v1/order-items` - Lấy tất cả order items (Admin)

### ⭐ Reviews
- `POST /api/v1/reviews` - Tạo review mới
- `GET /api/v1/reviews/book/:id` - Lấy reviews của sách
- `PUT /api/v1/reviews/:id` - Cập nhật review
- `DELETE /api/v1/reviews/:id` - Xóa review

### 💬 Comments
- `POST /api/v1/comments` - Tạo comment mới
- `GET /api/v1/comments/review/:id` - Lấy comments của review
- `PUT /api/v1/comments/:id` - Cập nhật comment
- `DELETE /api/v1/comments/:id` - Xóa comment

## 🔧 Query Parameters

### Books API
- `search` - Tìm kiếm theo title, author, description
- `category` - Lọc theo category ID
- `minPrice`, `maxPrice` - Lọc theo khoảng giá
- `minRating` - Lọc theo rating tối thiểu
- `sort` - Sắp xếp: `price-asc`, `price-desc`, `rating`, `newest`
- `page`, `limit` - Phân trang

### Orders API
- `status` - Lọc theo trạng thái đơn hàng
- `user` - Lọc theo user ID
- `page`, `limit` - Phân trang

## 🔒 Authentication

API sử dụng JWT Bearer token. Thêm header:
```
Authorization: Bearer <your-jwt-token>
```

## 📝 Response Format

Tất cả API responses đều có format:
```json
{
  "success": true/false,
  "message": "Success/Error message",
  "data": {}, // Response data
  "pagination": {} // Nếu có phân trang
}
```

## 🚨 Error Handling

API trả về HTTP status codes chuẩn:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🧪 Testing

### Health Check
```bash
GET /api/health
```

### API Status
```bash
GET /api/v1/status
```

## 📦 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run production` - Chạy production server
- `npm run lint` - Lint code

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License

## 👨‍💻 Author

TrungQuanDev - [YouTube Channel](https://youtube.com/@trungquandev)
