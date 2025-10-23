# BookStore Frontend

Frontend cho ứng dụng BookStore được xây dựng với React, Vite, và Tailwind CSS.

## 🚀 Tính năng

- **Trang chủ**: Giao diện đẹp với hero section, features, và sách nổi bật
- **Đăng nhập/Đăng ký**: Form validation đầy đủ với React hooks
- **Authentication**: Quản lý trạng thái đăng nhập với Context API
- **Responsive**: Thiết kế responsive với Tailwind CSS
- **Modern UI**: Giao diện hiện đại với Tailwind CSS

## 🛠️ Công nghệ sử dụng

- **React 19** - UI Framework
- **Vite** - Build tool
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication

## 📦 Cài đặt

1. **Cài đặt dependencies:**
```bash
npm install
# hoặc
yarn install
```

2. **Chạy development server:**
```bash
npm run dev
# hoặc
yarn dev
```

3. **Build cho production:**
```bash
npm run build
# hoặc
yarn build
```

## 🔧 Cấu hình

### Environment Variables

Tạo file `.env` trong thư mục `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME=BookStore
```

### API Backend

Đảm bảo backend đang chạy trên `http://localhost:5000` với các endpoints:

- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/register` - Đăng ký
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại

## 📁 Cấu trúc thư mục

```
frontend/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React Context (AuthContext)
│   ├── layouts/            # Layout components (MainLayout)
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   └── HomePage.jsx
│   ├── routes/             # Routing configuration
│   │   └── AppRoutes.jsx
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main App component
│   └── main.jsx            # Entry point
├── public/                 # Static assets
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎨 UI Components

### Pages

- **HomePage**: Trang chủ với hero section, features, và sách nổi bật
- **LoginPage**: Trang đăng nhập với form validation
- **RegisterPage**: Trang đăng ký với form validation

### Layouts

- **MainLayout**: Layout chính với header, footer, và navigation

### Context

- **AuthContext**: Quản lý trạng thái authentication

## 🔐 Authentication

### Features

- **Login/Register**: Form validation với React hooks
- **Token Management**: Lưu trữ JWT token trong localStorage
- **User State**: Quản lý trạng thái user với Context API
- **Protected Routes**: Bảo vệ routes cần authentication
- **Role-based Access**: Phân quyền dựa trên role (user/admin)

### Usage

```jsx
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, login, logout, isAdmin } = useAuth();
  
  // Use authentication state
  return (
    <div>
      {user ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
};
```

## 🎯 API Integration

### Authentication Endpoints

```javascript
// Login
const { login } = useAuth();
const result = await login(email, password);

// Register
const { register } = useAuth();
const result = await register({ name, fullName, email, password });

// Logout
const { logout } = useAuth();
logout();
```

## 🚀 Development

### Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build cho production
- `npm run preview` - Preview build
- `npm run lint` - Chạy ESLint

### Hot Reload

Vite cung cấp hot reload nhanh chóng cho development.

## 📱 Responsive Design

- **Mobile First**: Thiết kế mobile-first với Tailwind CSS
- **Breakpoints**: 
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

## 🎨 Styling

### Tailwind CSS

- **Utility Classes**: Sử dụng utility classes của Tailwind
- **Custom Components**: Tạo components tái sử dụng
- **Responsive**: Mobile-first responsive design

### Color Scheme

- **Primary**: Blue (blue-600)
- **Secondary**: Gray (gray-600)
- **Success**: Green (green-600)
- **Error**: Red (red-600)
- **Warning**: Yellow (yellow-600)

## 🔧 Troubleshooting

### Common Issues

1. **CORS Error**: Đảm bảo backend đã cấu hình CORS
2. **API Connection**: Kiểm tra backend đang chạy trên port 5000
3. **Build Errors**: Chạy `npm install` để cài đặt dependencies

### Debug

```bash
# Check dependencies
npm list

# Clear cache
npm run dev -- --force

# Check build
npm run build
```

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📞 Support

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.