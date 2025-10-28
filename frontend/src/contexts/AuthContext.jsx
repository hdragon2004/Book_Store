import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/apiService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Check if user is admin or staff
  const userRole = user?.roleId?.name || user?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff';
  const isAdminOrStaff = isAdmin || isStaff;
  
  // Debug user data (reduced logging)
  React.useEffect(() => {
    if (user) {
      console.log('🔍 AuthContext: User authenticated:', user.name, `(${userRole})`);
    }
  }, [user, userRole]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 AuthContext: Initializing auth...');
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        console.log('🔐 AuthContext: Stored token:', !!storedToken, 'Stored user:', !!storedUser);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate token by calling backend
          try {
            console.log('🔐 AuthContext: Validating token...');
            const response = await authAPI.getCurrentUser();
            console.log('🔐 AuthContext: Token validation response:', response.data);
            
            if (response.data && response.data.data) {
              const userData = response.data.data;
              
              // Backend always returns {user: {...}} format
              const finalUserData = userData.user;
              console.log('🔐 AuthContext: Token valid, setting user:', finalUserData?.name);
              setToken(storedToken);
              setUser(finalUserData);
            } else {
              throw new Error('Invalid token response');
            }
          } catch (tokenError) {
            console.warn('❌ Token validation failed:', tokenError.message);
            console.warn('❌ Token error details:', tokenError.response?.data);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } else {
          console.log('🔍 AuthContext: No stored auth data');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        // Auth initialization complete
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      console.log('🔍 AuthContext: Starting login process');
      const response = await authAPI.login(email, password);
      console.log('🔍 AuthContext: Login response:', response);
      
      if (!response.data || !response.data.data) {
        throw new Error('Invalid response format');
      }
      
      const { token: newToken, user: userData } = response.data.data;
      console.log('🔍 AuthContext: Extracted token:', newToken ? 'exists' : 'null');
      console.log('🔍 AuthContext: Extracted user:', userData);
      
      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('🔍 AuthContext: Data stored in localStorage');
      
      // Update state
      setToken(newToken);
      setUser(userData);
      console.log('🔍 AuthContext: State updated');
      
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      return { success: false, message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, user: newUser } = response.data.data;
      
      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Update state
      setToken(newToken);
      setUser(newUser);
      
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Register error:', error);
      const message = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      return { success: false, message };
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear state
    setToken(null);
    setUser(null);
  };

  // Update user function
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Get current user from API
  const getCurrentUser = async () => {
    if (!token) return null;

    try {
      const response = await authAPI.getCurrentUser();
      const userData = response.data.data;
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('Get current user error:', error);
      // Token might be invalid, logout
      logout();
      return null;
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword(email);
      const message = response.data.message || 'Email đặt lại mật khẩu đã được gửi';
      return { success: true, message };
    } catch (error) {
      console.error('Forgot password error:', error);
      const message = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      return { success: false, message };
    }
  };

  // Reset password function
  const resetPassword = async (token, password) => {
    try {
      const response = await authAPI.resetPassword(token, password);
      const message = response.data.message || 'Mật khẩu đã được đặt lại thành công';
      return { success: true, message };
    } catch (error) {
      console.error('Reset password error:', error);
      const message = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      return { success: false, message };
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    if (!token) return { success: false, message: 'Bạn cần đăng nhập để thay đổi mật khẩu' };

    try {
      const response = await authAPI.changePassword(currentPassword, newPassword);
      const message = response.data.message || 'Mật khẩu đã được thay đổi thành công';
      return { success: true, message };
    } catch (error) {
      console.error('Change password error:', error);
      const message = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      return { success: false, message };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAdmin,
    isStaff,
    isAdminOrStaff,
    userRole,
    login,
    register,
    logout,
    updateUser,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    changePassword,
  };

  // Show loading screen while initializing auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
