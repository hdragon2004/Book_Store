import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/apiService';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    fullName: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getProfile();
        if (response.data && response.data.data) {
          const userData = response.data.data.user;
          setProfile(userData);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            fullName: userData.fullName || ''
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Không thể tải thông tin cá nhân');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    try {
      setUploadingAvatar(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      // Upload avatar
      const uploadResponse = await userAPI.uploadAvatar(formData);
      
      if (uploadResponse.data && uploadResponse.data.data) {
        const updatedUser = uploadResponse.data.data.user;
        setProfile(updatedUser);
        updateUser(updatedUser);
        setAvatarFile(null);
        setAvatarPreview(null);
        alert('Cập nhật avatar thành công!');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Có lỗi xảy ra khi cập nhật avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await userAPI.updateProfile(formData);
      if (response.data && response.data.data) {
        const updatedUser = response.data.data.user;
        setProfile(updatedUser);
        updateUser(updatedUser);
        setIsEditing(false);
        alert('Cập nhật thông tin thành công!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        fullName: profile.fullName || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <div className="text-red-500 text-6xl mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.26-1.292 2.561-1.292 3.928V19.588M12 9V3.75m0 0V2.25c0-.591.294-1.14.792-1.405M12 9H1.906a2.25 2.25 0 00-2.25 2.25v.896m12-1.248l-.373-1.005M12 12H3.75m2.25-4.725l-.373-1.005M12 12H9.75m3.75-4.725l-.373 1.005M7.5 8.25h-.373m0 0v-.373m0 3.75h-.373m0 0v-.373m3.75 0h-.373m0 0v-.373m3.75 0h-.373m0 0v-.373m-9 3.75H1.906a2.25 2.25 0 00-2.25 2.25v.896m12-4.477l-.373 1.005M12 12v-.373m0-4.477l-.923-2.477A2.25 2.25 0 009.75 2.25H9M12 12h4.477m-4.477 0l.373 1.005M12 12v.373m0 4.477l.923 2.477A2.25 2.25 0 0014.25 21h.026A2.25 2.25 0 0016.5 18.75v-2.25m-2.25-4.477l.373-1.005M18.75 8.25h.373m0 0v.373m0 3.75h.373m0 0v.373m-3.75 0h.373m0 0v-.373m-3.75 0h-.373m0 0v-.373" />
          </svg>
        </div>
        <p className="text-xl text-gray-700 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
              <p className="text-lg text-gray-600 mt-2">Quản lý thông tin cá nhân của bạn</p>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-amber-600 text-white px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors"
                >
                  Chỉnh sửa
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : profile?.avatar ? (
                    <img
                      src={profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:5000${profile.avatar}`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-500">
                      {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">Ảnh đại diện</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Chọn ảnh đại diện mới cho tài khoản của bạn
                </p>
                <div className="flex space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    Chọn ảnh
                  </label>
                  {avatarFile && (
                    <button
                      type="button"
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {uploadingAvatar ? 'Đang tải...' : 'Cập nhật'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Định dạng: JPG, PNG, GIF. Kích thước tối đa: 5MB
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Tên hiển thị *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Họ và tên đầy đủ
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Địa chỉ
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
              />
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Thông tin tài khoản</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-1">
                ID tài khoản
              </label>
              <p className="text-gray-900 font-mono text-sm">{profile?.id || user?.id}</p>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-1">
                Vai trò
              </label>
              <p className="text-gray-900 capitalize">{profile?.role || user?.role}</p>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-1">
                Trạng thái
              </label>
              <p className="text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {profile?.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-1">
                Xác thực email
              </label>
              <p className="text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile?.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {profile?.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hành động</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-amber-600 text-white px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors">
              Đổi mật khẩu
            </button>
            <button className="bg-yellow-600 text-white px-6 py-3 rounded-xl hover:bg-yellow-700 transition-colors">
              Xác thực email
            </button>
            <button className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors">
              Xóa tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
