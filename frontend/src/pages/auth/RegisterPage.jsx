import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/apiService';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên là bắt buộc';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên phải có ít nhất 2 ký tự';
    }

    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendVerificationCode = async () => {
    if (!formData.email || !formData.name) {
      setErrors({ general: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.sendVerificationCode(formData.email, formData.name);
      const result = response.data;

      if (result.success) {
        setVerificationSent(true);
        setShowVerificationModal(true);
        setCountdown(60); // 60 seconds countdown
        startCountdown();
      } else {
        setErrors({ general: result.message || 'Gửi mã xác thực thất bại' });
      }
    } catch (error) {
      setErrors({ general: 'Có lỗi xảy ra, vui lòng thử lại' });
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({ verificationCode: 'Mã xác thực phải có 6 chữ số' });
      return;
    }

    setLoading(true);
    
    try {
      // Go directly to final registration (which includes verification)
      await handleFinalRegistration();
    } catch (error) {
      setErrors({ general: 'Có lỗi xảy ra, vui lòng thử lại' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalRegistration = async () => {
    try {
      const response = await authAPI.registerWithVerification({
        name: formData.name.trim(),
        email: formData.email,
        password: formData.password,
        verificationCode: verificationCode
      });
      const result = response.data;

      if (result.success) {
        // Show success message and redirect to login
        alert('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
        navigate('/login', { 
          state: { 
            message: 'Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.' 
          } 
        });
      } else {
        // Check if it's a verification code error
        if (result.message && result.message.includes('verification code')) {
          setErrors({ verificationCode: result.message });
        } else {
          setErrors({ general: result.message || 'Đăng ký thất bại' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Có lỗi xảy ra, vui lòng thử lại' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Send verification code instead of direct registration
    await handleSendVerificationCode();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Đăng ký tài khoản
          </h2>
          <p className="text-lg text-gray-600">
            Hoặc{' '}
            <Link 
              to="/login" 
              className="font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              đăng nhập nếu đã có tài khoản
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-8 shadow-lg border border-gray-100 sm:rounded-2xl sm:px-12">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
                {errors.general}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-lg font-semibold text-gray-900 mb-3">
                Tên
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="given-name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-4 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nhập tên của bạn"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-lg font-semibold text-gray-900 mb-3">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-4 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nhập email của bạn"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-lg font-semibold text-gray-900 mb-3">
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-4 pr-12 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mật khẩu của bạn"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-lg font-semibold text-gray-900 mb-3">
                Xác nhận mật khẩu
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-4 py-4 pr-12 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nhập lại mật khẩu"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? 'Đang gửi mã...' : 'Đăng ký'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-lg">
                <span className="px-4 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/login"
                className="w-full flex justify-center py-4 px-6 border border-gray-300 rounded-xl shadow-sm text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Xác thực Email</h3>
              <p className="text-lg text-gray-600 mb-8">
                Nhập mã 6 chữ số đã gửi đến <strong>{formData.email}</strong>
              </p>
            </div>

            {errors.verificationCode && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
                {errors.verificationCode}
              </div>
            )}

            <div className="mb-8">
              <div className="flex justify-center space-x-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={verificationCode[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      
                      // Handle paste (6 digits at once)
                      if (value.length === 6) {
                        setVerificationCode(value);
                        // Focus last input
                        const lastInput = document.getElementById(`code-5`);
                        if (lastInput) lastInput.focus();
                        return;
                      }
                      
                      if (value) {
                        const newCode = verificationCode.split('');
                        newCode[index] = value;
                        setVerificationCode(newCode.join(''));
                        
                        // Auto focus next input
                        if (index < 5) {
                          const nextInput = document.getElementById(`code-${index + 1}`);
                          if (nextInput) nextInput.focus();
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace') {
                        if (verificationCode[index]) {
                          // Clear current input
                          const newCode = verificationCode.split('');
                          newCode[index] = '';
                          setVerificationCode(newCode.join(''));
                        } else if (index > 0) {
                          // Move to previous input and clear it
                          const prevInput = document.getElementById(`code-${index - 1}`);
                          if (prevInput) {
                            const newCode = verificationCode.split('');
                            newCode[index - 1] = '';
                            setVerificationCode(newCode.join(''));
                            prevInput.focus();
                          }
                        }
                      }
                    }}
                    id={`code-${index}`}
                    className="w-14 h-14 text-center text-2xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowVerificationModal(false);
                  setVerificationCode('');
                  setVerificationSent(false);
                }}
                className="flex-1 py-4 px-6 border border-gray-300 rounded-xl shadow-sm text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? 'Đang xác thực...' : 'Xác thực Email'}
              </button>
            </div>

            <div className="text-center mt-6">
              <p className="text-lg text-gray-600">
                Không nhận được mã?{' '}
                {countdown > 0 ? (
                  <span className="text-gray-400">Gửi lại sau {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    className="text-amber-600 hover:text-amber-700 font-semibold transition-colors"
                  >
                    Gửi lại mã
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage; 