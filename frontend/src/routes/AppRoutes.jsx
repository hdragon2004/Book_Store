// frontend\src\routes\AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import BookPage from '../pages/book/BookPage';
import BookDetailPage from '../pages/book/BookDetailPage';
import OrderPage from '../pages/order/OrderPage';
import FavoritesPage from '../pages/user/FavoritesPage';
import CartPage from '../pages/CartPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import MainLayout from '../layouts/MainLayout';
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

  return <MainLayout>{children}</MainLayout>;
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

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;