// frontend\src\routes\AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import BookPage from '../pages/book/BookPage';
import BookDetailPage from '../pages/book/BookDetailPage';
import OrderPage from '../pages/order/OrderPage';
import OrderDetailPage from '../pages/order/OrderDetailPage';
import OrdersListPage from '../pages/order/OrdersListPage';
import FavoritesPage from '../pages/user/FavoritesPage';
import ProfilePage from '../pages/user/ProfilePage';
import MyLibraryPage from '../pages/user/MyLibraryPage';
import ChatPage from '../pages/user/ChatPage';
import CartPage from '../pages/CartPage';
import QRTest from '../components/QRTest';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import DashboardPage from '../pages/admin/dashboard/DashboardPage';
import TestDashboard from '../pages/admin/dashboard/TestDashboard';
import BooksPage from '../pages/admin/books/BooksPage';
import CreateBooksPage from '../pages/admin/books/CreateBooksPage';
import UpdateBooksPage from '../pages/admin/books/UpdateBooksPage';
import ViewBookPage from '../pages/admin/books/ViewBookPage';
import CategoriesPage from '../pages/admin/categories/CategoriesPage';
import CreateCategoryPage from '../pages/admin/categories/CreateCategoryPage';
import UpdateCategoryPage from '../pages/admin/categories/UpdateCategoryPage';
import ViewCategoryPage from '../pages/admin/categories/ViewCategoryPage';
import OrdersPage from '../pages/admin/orders/OrdersPage';
import AdminOrderDetailPage from '../pages/admin/orders/AdminOrderDetailPage';
import UsersPage from '../pages/admin/users/UsersPage';
import ReportsPage from '../pages/admin/reports/ReportsPage';
import PaymentsPage from '../pages/admin/payments/PaymentsPage';
import VouchersPage from '../pages/admin/vouchers/VouchersPage';
import CreateVouchersPage from '../pages/admin/vouchers/CreateVouchersPage';
import UpdateVouchersPage from '../pages/admin/vouchers/UpdateVouchersPage';
import ViewVouchersPage from '../pages/admin/vouchers/ViewVouchersPage';
import ChatsPage from '../pages/admin/chats/ChatsPage';
import { useAuth } from '../contexts/AuthContext';

// Authentication check using AuthContext
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();


  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();


  if (loading) {
    return <div>Loading...</div>;
  }

  // Allow access to public routes even if user is logged in
  // Only redirect if user is on login/register pages and already authenticated
  const currentPath = window.location.pathname;
  if (user && (currentPath === '/login' || currentPath === '/register')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const MainLayoutRoute = ({ children }) => {
  return <MainLayout>{children}</MainLayout>;
};

// Component kết hợp UserLayout với MainLayout
const UserLayoutRoute = ({ children }) => {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
};


const AppRoutes = () => {
  
  return (
    <Routes>
      {/* Public Routes with MainLayout */}
      <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/books" element={<MainLayout><BookPage /></MainLayout>} />
      <Route path="/books/:id" element={<MainLayout><BookDetailPage /></MainLayout>} />
      <Route path="/order" element={<MainLayout><OrderPage /></MainLayout>} />
      <Route 
        path="/orders" 
        element={
          <PrivateRoute>
            <MainLayout><OrdersListPage /></MainLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/orders/:orderId" 
        element={
          <PrivateRoute>
            <MainLayout><OrderDetailPage /></MainLayout>
          </PrivateRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/favorites" 
        element={
          <PrivateRoute>
            <MainLayout><FavoritesPage /></MainLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/library" 
        element={
          <PrivateRoute>
            <MainLayout><MyLibraryPage /></MainLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/chat" 
        element={
          <PrivateRoute>
            <MainLayout><ChatPage /></MainLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/qr-test" 
        element={
          <MainLayout><QRTest /></MainLayout>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <MainLayout><ProfilePage /></MainLayout>
          </PrivateRoute>
        } 
      />
      <Route 
        path="/cart" 
        element={
          <PrivateRoute>
            <MainLayout><CartPage /></MainLayout>
          </PrivateRoute>
        } 
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/books"
        element={
          <AdminRoute>
            <AdminLayout>
              <BooksPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/books/create"
        element={
          <AdminRoute>
            <AdminLayout>
              <CreateBooksPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
        <Route
          path="/admin/books/update/:id"
          element={
            <AdminRoute>
              <AdminLayout>
                <UpdateBooksPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/books/:id"
          element={
            <AdminRoute>
              <AdminLayout>
                <ViewBookPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
      <Route
        path="/admin/categories"
        element={
          <AdminRoute>
            <AdminLayout>
              <CategoriesPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/categories/create"
        element={
          <AdminRoute>
            <AdminLayout>
              <CreateCategoryPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/categories/:id"
        element={
          <AdminRoute>
            <AdminLayout>
              <ViewCategoryPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/categories/update/:id"
        element={
          <AdminRoute>
            <AdminLayout>
              <UpdateCategoryPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminLayout>
              <OrdersPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/orders/:orderId"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminOrderDetailPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <AdminRoute>
            <AdminLayout>
              <PaymentsPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminLayout>
              <UsersPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <AdminRoute>
            <AdminLayout>
              <ReportsPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/vouchers"
        element={
          <AdminRoute>
            <AdminLayout>
              <VouchersPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/vouchers/create"
        element={
          <AdminRoute>
            <AdminLayout>
              <CreateVouchersPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/vouchers/update/:id"
        element={
          <AdminRoute>
            <AdminLayout>
              <UpdateVouchersPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/vouchers/:id"
        element={
          <AdminRoute>
            <AdminLayout>
              <ViewVouchersPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/chat"
        element={
          <AdminRoute>
            <AdminLayout>
              <ChatsPage />
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;