import axios from 'axios';

// Tạo instance axios với cấu hình mặc định
const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 giây
});

// Request interceptor - tự động thêm token vào header nếu có
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔍 Axios request:', config.method?.toUpperCase(), config.url);
    console.log('🔍 Axios token:', token ? 'exists' : 'null');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔍 Axios: Authorization header set');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - xử lý lỗi chung
axiosClient.interceptors.response.use(
  (response) => {
    console.log('🔍 Axios response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('🔍 Axios error:', error.response?.status, error.config?.url);
    
    // Xử lý lỗi 401 (Unauthorized) - tự động logout
    if (error.response?.status === 401) {
      console.log('🔍 Axios: 401 Unauthorized, clearing auth data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Xử lý lỗi 403 (Forbidden)
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data);
    }
    
    // Xử lý lỗi 500 (Server Error)
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient; 