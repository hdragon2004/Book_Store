import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../../../services/apiService';

const CreateBooksPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    isbn: '',
    publisher: '',
    publicationDate: '',
    language: 'vi',
    pages: '',
    format: 'paperback',
    dimensions: '',
    weight: '',
    fileUrl: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryAPI.getCategories();
        const categoriesData = response?.data?.data?.categories || response?.data?.categories || response?.data || [];
        console.log('📂 Categories loaded:', categoriesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        fileUrl: file.name // Tạm thời lưu tên file, sau này sẽ upload và lưu URL
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề sách là bắt buộc';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Tiêu đề không được quá 200 ký tự';
    }
    
    if (!formData.author.trim()) {
      newErrors.author = 'Tác giả là bắt buộc';
    } else if (formData.author.length > 100) {
      newErrors.author = 'Tên tác giả không được quá 100 ký tự';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả là bắt buộc';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Mô tả không được quá 1000 ký tự';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Giá sách phải lớn hơn 0';
    }
    
    if (formData.stock < 0) {
      newErrors.stock = 'Số lượng tồn kho không được âm';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Vui lòng chọn danh mục';
    }
    
    if (formData.pages && formData.pages < 0) {
      newErrors.pages = 'Số trang không được âm';
    }
    
    if (formData.weight && formData.weight < 0) {
      newErrors.weight = 'Trọng lượng không được âm';
    }
    
    // Validate file requirement for digital formats
    if (['ebook', 'audiobook'].includes(formData.format) && !formData.fileUrl) {
      newErrors.fileUrl = 'File sách là bắt buộc cho sách điện tử và sách nói';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload ảnh trước nếu có
      let imageUrl = '';
      console.log('📤 Image file state:', imageFile);
      if (imageFile) {
        console.log('📤 Uploading image...', imageFile);
        try {
          const uploadResponse = await bookAPI.uploadImage(imageFile);
          console.log('📤 Upload response:', uploadResponse);
          imageUrl = uploadResponse.data.data.imageUrl;
          console.log('✅ Image uploaded:', imageUrl);
        } catch (uploadError) {
          console.error('❌ Upload error:', uploadError);
          throw uploadError;
        }
      } else {
        console.log('⚠️ No image file selected');
      }

      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        categoryId: formData.categoryId,
        isbn: formData.isbn.trim() || '',
        publisher: formData.publisher.trim() || undefined,
        publicationDate: formData.publicationDate ? new Date(formData.publicationDate) : undefined,
        language: formData.language,
        pages: formData.pages ? parseInt(formData.pages) : 0,
        format: formData.format,
        dimensions: formData.dimensions.trim() || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        fileUrl: formData.fileUrl || '',
        imageUrl: imageUrl,
        isActive: formData.isActive
      };
      
      console.log('📤 Sending book data:', bookData);
      const response = await bookAPI.createBook(bookData);
      console.log('✅ Book created:', response);
      
      // Navigate back to books list
      navigate('/admin/books');
    } catch (error) {
      console.error('Error creating book:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Lỗi khi tạo sách: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/books');
  };

  return (
    <div className="w-full">
      <div className="bg-white">
        <form onSubmit={handleSubmit} className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="space-y-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Thông tin cơ bản</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề sách <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập tiêu đề sách"
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tác giả <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.author ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập tên tác giả"
                />
                {errors.author && <p className="mt-1 text-sm text-red-500">{errors.author}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mô tả sách"
                />
                {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập giá sách"
                />
                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhà xuất bản
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập nhà xuất bản"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Thông tin bổ sung</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lượng tồn kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.stock ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nhập số lượng tồn kho"
                  />
                  {errors.stock && <p className="mt-1 text-sm text-red-500">{errors.stock}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập ISBN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngày xuất bản</label>
                  <input
                    type="date"
                    name="publicationDate"
                    value={formData.publicationDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ngôn ngữ</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Định dạng</label>
                  <select
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="paperback">Bìa mềm</option>
                    <option value="hardcover">Bìa cứng</option>
                    <option value="ebook">Sách điện tử</option>
                    <option value="audiobook">Sách nói</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số trang</label>
                  <input
                    type="number"
                    name="pages"
                    value={formData.pages}
                    onChange={handleInputChange}
                    min="1"
                    disabled={formData.format === 'ebook' || formData.format === 'audiobook'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formData.format === 'ebook' || formData.format === 'audiobook' 
                        ? 'bg-gray-100 border-gray-300 text-gray-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Nhập số trang"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kích thước (cm)</label>
                  <input
                    type="text"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    disabled={formData.format === 'ebook' || formData.format === 'audiobook'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formData.format === 'ebook' || formData.format === 'audiobook' 
                        ? 'bg-gray-100 border-gray-300 text-gray-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="VD: 20x15x3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trọng lượng (g)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    min="0"
                    step="10"
                    disabled={formData.format === 'ebook' || formData.format === 'audiobook'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formData.format === 'ebook' || formData.format === 'audiobook' 
                        ? 'bg-gray-100 border-gray-300 text-gray-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Nhập trọng lượng"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.format === 'ebook' || formData.format === 'audiobook') ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File sách (cho ebook/audiobook)
                    </label>
                    <input
                      type="file"
                      name="fileUrl"
                      onChange={handleFileChange}
                      accept=".pdf,.epub,.mobi,.mp3,.mp4,.wav"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Chỉ cần thiết cho sách điện tử và sách nói
                    </p>
                    {errors.fileUrl && (
                      <p className="text-red-500 text-sm mt-1">{errors.fileUrl}</p>
                    )}
                  </div>
                ) : (
                  <div className="opacity-50 pointer-events-none">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File sách (cho ebook/audiobook)
                    </label>
                    <input
                      type="file"
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Chỉ cần thiết cho sách điện tử và sách nói
                    </p>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Sách đang bán
                  </label>
                </div>
              </div>
            </div>

            {/* Third Column - Image Upload */}
            <div className="space-y-6 p-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Ảnh bìa sách</h3>
              
              <div>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors min-h-96">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mx-auto w-full h-96 object-cover rounded-lg shadow-sm"
                        />
                        <div className="text-sm text-gray-600">
                          <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Thay đổi ảnh</span>
                            <input
                              id="image-upload"
                              name="image-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Tải lên ảnh</span>
                            <input
                              id="image-upload"
                              name="image-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="pl-1">hoặc kéo thả</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF lên đến 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8 px-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang tạo...' : 'Tạo sách'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBooksPage;