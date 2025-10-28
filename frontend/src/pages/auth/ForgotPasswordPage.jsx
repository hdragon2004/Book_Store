import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/apiService';

const ForgotPasswordPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    otpCode: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

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

  const startCountdown = () => {
    setCountdown(60);
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

  const handleSendOTP = async () => {
    if (!formData.email) {
      setErrors({ email: 'Email là bắt buộc' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Email không hợp lệ' });
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.forgotPassword(formData.email);
      const result = response.data;

      if (result.success) {
        // Lưu thông tin user để hiển thị trong modal
        setUserInfo({
          email: formData.email,
          name: result.data?.user?.name || 'User'
        });
        setShowOTPModal(true);
        startCountdown();
      } else {
        setErrors({ general: result.message || 'Email không tồn tại trong hệ thống' });
      }
    } catch (error) {
      setErrors({ general: 'Có lỗi xảy ra, vui lòng thử lại' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otpCode || formData.otpCode.length !== 6) {
      setErrors({ otpCode: 'Mã OTP phải có 6 chữ số' });
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.verifyResetOTP(formData.email, formData.otpCode);
      const result = response.data;

      if (result.success) {
        setShowOTPModal(false);
        setOtpVerified(true);
        // Giữ lại mã OTP để sử dụng cho reset password
        // setFormData(prev => ({ ...prev, otpCode: '' }));
      } else {
        setErrors({ otpCode: result.message || 'Mã OTP không đúng' });
      }
    } catch (error) {
      setErrors({ general: 'Có lỗi xảy ra, vui lòng thử lại' });
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = () => {
    const newErrors = {};

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

  const handleResetPassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await authAPI.resetPassword(formData.email, formData.otpCode, formData.password);
      const result = response.data;

      if (result.success) {
        // Redirect to login page with success message
        navigate('/login', { 
          state: { 
            message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.' 
          } 
        });
      } else {
        setErrors({ general: result.message || 'Đặt lại mật khẩu thất bại' });
      }
    } catch (error) {
      setErrors({ general: 'Có lỗi xảy ra, vui lòng thử lại' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    
    try {
      const response = await authAPI.forgotPassword(formData.email);
      const result = response.data;

      if (result.success) {
        startCountdown();
        setErrors({});
      } else {
        setErrors({ general: result.message || 'Gửi lại mã OTP thất bại' });
      }
    } catch (error) {
      setErrors({ general: 'Có lỗi xảy ra, vui lòng thử lại' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Quên mật khẩu
          </h2>
          <p className="text-lg text-gray-600">
            Nhập email để nhận mã OTP
          </p>
        </div>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-8 shadow-lg border border-gray-100 sm:rounded-2xl sm:px-12">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8">
              {errors.general}
            </div>
          )}

          {/* Email Input Form - chỉ hiện khi chưa xác thực OTP */}
          {!otpVerified && (
            <div className="space-y-8">
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
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </button>
            </div>
          </div>
          )}

          {/* Form đặt lại mật khẩu - chỉ hiện sau khi xác thực OTP thành công */}
          {otpVerified && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Xác thực thành công!</h3>
                <p className="text-lg text-gray-600">Bây giờ bạn có thể đặt lại mật khẩu mới</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-lg font-semibold text-gray-900 mb-3">
                  Mật khẩu mới
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
                    placeholder="Nhập mật khẩu mới"
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
                  Xác nhận mật khẩu mới
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
                    placeholder="Nhập lại mật khẩu mới"
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
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                </button>
              </div>
            </div>
          )}

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
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Xác thực OTP</h3>
              <p className="text-sm text-gray-500 mb-6">
                Nhập mã 6 chữ số đã gửi đến <strong>{userInfo?.email}</strong>
              </p>
            </div>

            {errors.otpCode && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
                {errors.otpCode}
              </div>
            )}

            <div className="mb-6">
              <div className="flex justify-center space-x-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={formData.otpCode[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      
                      // Handle paste (6 digits at once)
                      if (value.length === 6) {
                        setFormData(prev => ({ ...prev, otpCode: value }));
                        // Focus last input
                        const lastInput = document.getElementById(`otp-5`);
                        if (lastInput) lastInput.focus();
                        return;
                      }
                      
                      if (value) {
                        const newCode = formData.otpCode.split('');
                        newCode[index] = value;
                        setFormData(prev => ({ ...prev, otpCode: newCode.join('') }));
                        
                        // Auto focus next input
                        if (index < 5) {
                          const nextInput = document.getElementById(`otp-${index + 1}`);
                          if (nextInput) nextInput.focus();
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace') {
                        if (formData.otpCode[index]) {
                          // Clear current input
                          const newCode = formData.otpCode.split('');
                          newCode[index] = '';
                          setFormData(prev => ({ ...prev, otpCode: newCode.join('') }));
                        } else if (index > 0) {
                          // Move to previous input and clear it
                          const prevInput = document.getElementById(`otp-${index - 1}`);
                          if (prevInput) {
                            const newCode = formData.otpCode.split('');
                            newCode[index - 1] = '';
                            setFormData(prev => ({ ...prev, otpCode: newCode.join('') }));
                            prevInput.focus();
                          }
                        }
                      }
                    }}
                    id={`otp-${index}`}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowOTPModal(false);
                  setFormData(prev => ({ ...prev, otpCode: '' }));
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={loading || formData.otpCode.length !== 6}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
              </button>
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Không nhận được mã?{' '}
                {countdown > 0 ? (
                  <span className="text-gray-400">Gửi lại sau {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-blue-600 hover:text-blue-500 font-medium"
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

export default ForgotPasswordPage;
