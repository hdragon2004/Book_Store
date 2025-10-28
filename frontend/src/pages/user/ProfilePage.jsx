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
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
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
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước file không được vượt quá 5MB');
        return;
      }
      
      setAvatarFile(file);
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
      const formData = new FormData();
      formData.append('avatar', avatarFile);
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
      // Loại bỏ email khỏi dữ liệu gửi lên server vì email không thể thay đổi
      const { email, ...updateData } = formData;
      const response = await userAPI.updateProfile(updateData);
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
        email: profile.email || '', // Giữ nguyên email
        phone: profile.phone || '',
        address: profile.address || '',
        fullName: profile.fullName || ''
      });
    }
    setIsEditing(false);
  };

  // Handle change password
  const handleChangePassword = () => {
    alert('Chức năng đổi mật khẩu sẽ được triển khai sớm');
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.')) {
      alert('Chức năng xóa tài khoản sẽ được triển khai sớm');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <p className="text-xl text-gray-700 mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-amber-600 text-white px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          <p className="text-gray-600 mt-2">Quản lý thông tin và cài đặt tài khoản của bạn</p>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Avatar Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-8 sticky top-8">
              {/* Avatar Display */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto mb-6 ring-4 ring-amber-100">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : profile?.avatar ? (
                      <img 
                        src={profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:5000${profile.avatar}`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-gray-400">
                          {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <div className="space-y-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                      className="hidden" 
                      id="avatar-upload" 
                    />
                    <label 
                      htmlFor="avatar-upload" 
                      className="block w-full bg-amber-600 text-white px-4 py-2.5 rounded-xl hover:bg-amber-700 transition-colors cursor-pointer text-center font-medium"
                    >
                      {uploadingAvatar ? 'Đang tải...' : 'Thay đổi ảnh'}
                    </label>
                    
                    {avatarFile && (
                      <button 
                        onClick={handleAvatarUpload} 
                        disabled={uploadingAvatar}
                        className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-xl hover:bg-black/80 transition-colors disabled:opacity-50 font-medium"
                      >
                        {uploadingAvatar ? 'Đang tải...' : 'Cập nhật'}
                      </button>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="mt-6">
                  <h2 className="text-2xl font-bold text-gray-900">{profile?.name || 'Chưa có tên'}</h2>
                  <p className="text-gray-600 mt-1">{profile?.email}</p>
                  <div className="mt-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      profile?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {profile?.isActive ? 'Tài khoản hoạt động' : 'Tài khoản bị khóa'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Information */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h3>
                  <div className="flex space-x-3">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={handleChangePassword}
                          className="bg-amber-600 text-white px-6 py-2.5 rounded-xl hover:bg-amber-700 transition-colors font-medium"
                        >
                          Đổi mật khẩu
                        </button>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-amber-600 text-white px-6 py-2.5 rounded-xl hover:bg-amber-700 transition-colors font-medium"
                        >
                          Chỉnh sửa
                        </button>
                      </>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={handleCancel}
                          className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={loading}
                          className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                        >
                          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Tên hiển thị *</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                        disabled={!isEditing} 
                        required 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-lg" 
                      />
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Họ và tên đầy đủ</label>
                      <input 
                        type="text" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleInputChange} 
                        disabled={!isEditing} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-lg" 
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        disabled={true}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-100 cursor-not-allowed text-lg text-gray-500" 
                      />
                      <p className="text-sm text-gray-500 mt-1">Email không thể thay đổi sau khi đăng ký</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Số điện thoại</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        disabled={!isEditing} 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-lg" 
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Địa chỉ</label>
                    <textarea 
                      name="address" 
                      value={formData.address} 
                      onChange={handleInputChange} 
                      disabled={!isEditing} 
                      rows={4} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-lg" 
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
