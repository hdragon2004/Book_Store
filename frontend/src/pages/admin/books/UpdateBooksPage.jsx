import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../../../services/apiService';

const UpdateBooksPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
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
    pages: '',
    format: 'paperback',
    dimensions: '',
    weight: '',
    fileUrl: '',
    isActive: true
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await categoryAPI.getCategories();
        const categoriesData = categoriesResponse?.data?.data?.categories || categoriesResponse?.data?.categories || categoriesResponse?.data || [];
        setCategories(categoriesData);

        // Fetch book data
        const bookResponse = await bookAPI.getBook(id);
        const book = bookResponse?.data?.data || bookResponse?.data;
        
        if (book) {
          setFormData({
            title: book.title || '',
            author: book.author || '',
            description: book.description || '',
            price: book.price || '',
            stock: book.stock || '',
            categoryId: book.categoryId?._id || book.categoryId || '',
            isbn: book.isbn || '',
            publisher: book.publisher || '',
            publicationDate: book.publicationDate ? new Date(book.publicationDate).toISOString().split('T')[0] : '',
            language: book.language || 'vi',
            pages: book.pages || '',
            format: book.format || 'paperback',
            dimensions: book.dimensions || '',
            weight: book.weight || '',
            fileUrl: book.fileUrl || '',
            isActive: book.isActive !== undefined ? book.isActive : true
          });
          
          if (book.imageUrl) {
            setImagePreview(book.imageUrl.startsWith('http') ? book.imageUrl : `http://localhost:5000${book.imageUrl}`);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Lỗi khi tải dữ liệu. Vui lòng thử lại.');
      }
    };

    fetchData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Tiêu đề sách là bắt buộc';
    if (!formData.author.trim()) newErrors.author = 'Tác giả là bắt buộc';
    if (!formData.description.trim()) newErrors.description = 'Mô tả là bắt buộc';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Giá sách phải lớn hơn 0';
    if (!formData.stock || formData.stock < 0) newErrors.stock = 'Số lượng tồn kho không được âm';
    if (!formData.categoryId) newErrors.categoryId = 'Danh mục là bắt buộc';
    
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
        console.log('⚠️ No new image file selected');
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
        imageUrl: imageUrl || formData.imageUrl,
        isActive: formData.isActive
      };
      
      console.log('📤 Sending book data:', bookData);
      const response = await bookAPI.updateBook(id, bookData);
      console.log('✅ Book updated:', response);
      
      // Navigate back to books list
      navigate('/admin/books');
    } catch (error) {
      console.error('Error updating book:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Lỗi khi cập nhật sách: ${error.response?.data?.message || error.message}`);
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
            {/* Left Column - Thông tin cơ bản */}
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

            {/* Middle Column - Thông tin bổ sung */}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File sách (cho ebook/audiobook)
                  </label>
                  <input
                    type="file"
                    name="fileUrl"
                    onChange={handleInputChange}
                    accept=".pdf,.epub,.mobi,.mp3,.mp4,.wav"
                    disabled={formData.format === 'paperback' || formData.format === 'hardcover'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formData.format === 'paperback' || formData.format === 'hardcover' 
                        ? 'bg-gray-100 border-gray-300 text-gray-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chỉ cần thiết cho sách điện tử và sách nói
                  </p>
                  {errors.fileUrl && (
                    <p className="text-red-500 text-sm mt-1">{errors.fileUrl}</p>
                  )}
                </div>

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
              {loading ? 'Đang cập nhật...' : 'Cập nhật sách'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateBooksPage;