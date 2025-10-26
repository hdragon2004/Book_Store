import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../../../services/apiService';

const ViewBookPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch book data
        const bookResponse = await bookAPI.getBook(id);
        const bookData = bookResponse?.data?.data || bookResponse?.data;
        setBook(bookData);
        
        // Fetch categories for display
        const categoriesResponse = await categoryAPI.getCategories();
        const categoriesData = categoriesResponse?.data?.data?.categories || categoriesResponse?.data?.categories || categoriesResponse?.data || [];
        setCategories(categoriesData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Lỗi khi tải thông tin sách. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Có sẵn';
      case 'out_of_stock': return 'Hết hàng';
      case 'discontinued': return 'Ngừng bán';
      case 'coming_soon': return 'Sắp ra mắt';
      default: return 'Không xác định';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'out_of_stock': return 'bg-yellow-100 text-yellow-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      case 'coming_soon': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatText = (format) => {
    switch (format) {
      case 'paperback': return 'Bìa mềm';
      case 'hardcover': return 'Bìa cứng';
      case 'ebook': return 'Sách điện tử';
      case 'audiobook': return 'Sách nói';
      default: return format;
    }
  };

  const getLanguageText = (language) => {
    switch (language) {
      case 'vi': return 'Tiếng Việt';
      case 'en': return 'English';
      case 'zh': return '中文';
      case 'ja': return '日本語';
      case 'ko': return '한국어';
      default: return language;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Đang tải thông tin sách...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">Không tìm thấy sách</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
          {/* Left Column - Thông tin cơ bản */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Thông tin cơ bản</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề sách</label>
              <div className="text-sm text-gray-900 font-medium">{book.title || 'N/A'}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tác giả</label>
              <div className="text-sm text-gray-900">{book.author || 'N/A'}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">{book.description || 'N/A'}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
              <div className="text-sm text-gray-900">{book.categoryId?.name || 'N/A'}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá</label>
              <div className="text-sm text-gray-900 font-semibold text-green-600">
                {formatCurrency(book.price || 0)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà xuất bản</label>
              <div className="text-sm text-gray-900">{book.publisher || 'N/A'}</div>
            </div>
          </div>

          {/* Middle Column - Thông tin bổ sung */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Thông tin bổ sung</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tồn kho</label>
                <div className="text-sm text-gray-900 font-semibold">
                  <span className={book.stock === 0 ? 'text-red-600' : book.stock < 10 ? 'text-yellow-600' : 'text-green-600'}>
                    {book.stock || 0}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                <div className="text-sm text-gray-900">{book.isbn || 'N/A'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày xuất bản</label>
                <div className="text-sm text-gray-900">
                  {book.publicationDate ? new Date(book.publicationDate).toLocaleDateString('vi-VN') : 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
                <div className="text-sm text-gray-900">{getLanguageText(book.language)}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Định dạng</label>
                <div className="text-sm text-gray-900">{getFormatText(book.format)}</div>
              </div>

              {book.format === 'paperback' || book.format === 'hardcover' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số trang</label>
                    <div className="text-sm text-gray-900">{book.pages || 'N/A'}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kích thước</label>
                    <div className="text-sm text-gray-900">{book.dimensions || 'N/A'}</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trọng lượng</label>
                    <div className="text-sm text-gray-900">{book.weight ? `${book.weight}g` : 'N/A'}</div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File sách</label>
                  <div className="text-sm text-gray-900">
                    {book.fileUrl ? (
                      <a href={book.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        Tải xuống
                      </a>
                    ) : 'N/A'}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(book.status)}`}>
                  {getStatusText(book.status)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái bán</label>
                <div className="text-sm text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    book.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {book.isActive ? 'Đang bán' : 'Ngừng bán'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lượt xem</label>
                <div className="text-sm text-gray-900">{book.viewCount || 0}</div>
              </div>
            </div>
          </div>

          {/* Right Column - Ảnh bìa sách */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Ảnh bìa sách</h3>
            
            <div className="flex justify-center">
              {book.imageUrl ? (
                <img 
                  src={book.imageUrl.startsWith('http') ? book.imageUrl : `http://localhost:5000${book.imageUrl}`}
                  alt={book.title || 'Book cover'}
                  className="w-full max-w-sm h-96 object-cover rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full max-w-sm h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Không có ảnh</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600">
                <p><strong>Ngày tạo:</strong> {new Date(book.createdAt).toLocaleDateString('vi-VN')}</p>
                <p><strong>Cập nhật lần cuối:</strong> {new Date(book.updatedAt).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 px-6 pb-6">
          <button
            onClick={() => navigate('/admin/books')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Quay lại
          </button>
          <button
            onClick={() => navigate(`/admin/books/update/${book._id}`)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewBookPage;