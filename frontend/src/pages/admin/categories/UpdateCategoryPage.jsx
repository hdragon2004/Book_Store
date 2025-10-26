import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoryAPI } from '../../../services/apiService';

const UpdateCategoryPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await categoryAPI.getCategory(id);
        console.log('📂 Category data:', response);
        
        const categoryData = response?.data?.data || response?.data;
        setCategory(categoryData);
        setFormData({
          name: categoryData?.name || '',
          description: categoryData?.description || ''
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching category:', error);
        setErrors({ fetch: 'Không thể tải thông tin danh mục. Vui lòng thử lại.' });
        setLoading(false);
      }
    };

    if (id) {
      fetchCategory();
    }
  }, [id]);

  const handleInputChange = (e) => {
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
      newErrors.name = 'Tên danh mục là bắt buộc';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên danh mục phải có ít nhất 2 ký tự';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Tên danh mục không được vượt quá 100 ký tự';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Mô tả không được vượt quá 500 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      const response = await categoryAPI.updateCategory(id, formData);
      console.log('✅ Category updated:', response);
      
      // Show success message
      alert('Danh mục đã được cập nhật thành công!');
      
      // Navigate back to categories list
      navigate('/admin/categories');
    } catch (error) {
      console.error('Error updating category:', error);
      setErrors({ submit: 'Lỗi khi cập nhật danh mục. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/categories');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Đang tải thông tin danh mục...</p>
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Lỗi tải dữ liệu
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errors.fetch}</p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleCancel}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handleCancel}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Quay lại
        </button>
      </div>


      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Chỉnh sửa danh mục</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập tên danh mục"
              disabled={saving}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập mô tả danh mục (tùy chọn)"
              rows={4}
              disabled={saving}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {formData.description.length}/500 ký tự
            </p>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Đang cập nhật...' : 'Cập nhật danh mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateCategoryPage;
