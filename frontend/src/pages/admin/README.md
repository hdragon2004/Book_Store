# 🎯 Hệ thống Admin Book Store

## 📋 Tổng quan
Hệ thống quản trị viên cho Book Store với đầy đủ các chức năng CRUD và quản lý.

## 🔐 Phân quyền truy cập
- **Admin**: Có quyền truy cập tất cả chức năng
- **User**: Chỉ có quyền xem và mua sách

## 🚀 Cách truy cập Admin
1. Đăng nhập với tài khoản có role "admin"
2. Click vào avatar ở góc phải màn hình
3. Chọn "Quản trị" từ dropdown menu
4. Hệ thống sẽ chuyển hướng đến `/admin/dashboard`

## 📱 Các trang Admin

### 1. Dashboard (`/admin/dashboard`)
- **Thống kê tổng quan**: Số sách, đơn hàng, người dùng, doanh thu
- **Quick Actions**: Các nút truy cập nhanh
- **Hoạt động gần đây**: Lịch sử hoạt động

### 2. Quản lý sách (`/admin/books`)
- **Xem danh sách sách**: Bảng hiển thị tất cả sách
- **Thêm sách mới**: Form thêm sách với validation
- **Sửa thông tin sách**: Cập nhật thông tin sách
- **Xóa sách**: Xóa sách khỏi hệ thống
- **Quản lý tồn kho**: Cập nhật số lượng tồn kho

### 3. Quản lý danh mục (`/admin/categories`)
- **CRUD danh mục**: Tạo, đọc, cập nhật, xóa danh mục
- **Phân loại sách**: Gán sách vào danh mục

### 4. Quản lý đơn hàng (`/admin/orders`)
- **Xem danh sách đơn hàng**: Tất cả đơn hàng trong hệ thống
- **Cập nhật trạng thái**: Thay đổi trạng thái đơn hàng
- **Chi tiết đơn hàng**: Xem thông tin chi tiết đơn hàng
- **Lọc và tìm kiếm**: Tìm đơn hàng theo tiêu chí

### 5. Quản lý người dùng (`/admin/users`)
- **Danh sách người dùng**: Tất cả tài khoản trong hệ thống
- **Phân quyền**: Thay đổi role user/admin
- **Khóa/mở tài khoản**: Quản lý trạng thái tài khoản
- **Thống kê người dùng**: Số đơn hàng, ngày tham gia

### 6. Quản lý thanh toán (`/admin/payments`)
- **Theo dõi giao dịch**: Tất cả giao dịch thanh toán
- **Tích hợp VNPay/Momo**: Quản lý thanh toán online
- **Báo cáo tài chính**: Thống kê doanh thu

### 7. Báo cáo (`/admin/reports`)
- **Báo cáo doanh thu**: Theo ngày, tháng, năm
- **Thống kê sản phẩm**: Sách bán chạy, tồn kho
- **Phân tích người dùng**: Hành vi mua hàng

### 8. Cài đặt (`/admin/settings`)
- **Cấu hình hệ thống**: Các thiết lập chung
- **Quản lý voucher**: Tạo và quản lý mã giảm giá
- **Cài đặt email**: Cấu hình gửi email

## 🎨 Giao diện
- **Responsive Design**: Tương thích mọi thiết bị
- **Modern UI**: Sử dụng Tailwind CSS
- **Sidebar Navigation**: Điều hướng dễ dàng
- **Interactive Components**: Modal, dropdown, form

## 🔧 Tính năng kỹ thuật
- **Route Protection**: Bảo vệ routes admin
- **Role-based Access**: Kiểm soát quyền truy cập
- **Real-time Updates**: Cập nhật thời gian thực
- **Search & Filter**: Tìm kiếm và lọc dữ liệu
- **Pagination**: Phân trang cho dữ liệu lớn

## 🚨 Lưu ý quan trọng
- Chỉ user có role "admin" mới truy cập được
- Tất cả thao tác đều được ghi log
- Dữ liệu được validate trước khi lưu
- Hỗ trợ undo/redo cho các thao tác quan trọng

## 📞 Hỗ trợ
Nếu gặp vấn đề, vui lòng liên hệ:
- Email: admin@bookstore.com
- Hotline: 1900-xxxx

