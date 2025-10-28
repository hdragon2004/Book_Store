import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookAPI } from '../../services/apiService';
import PageLayout from '../../layouts/PageLayout';

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await bookAPI.getBook(id);
        setBook(response.data.data);
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Không thể tải thông tin sách. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-500 text-xl">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-500 text-xl">☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-gray-300 text-xl">☆</span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin sách...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Thử lại
            </button>
            <button 
              onClick={() => navigate('/books')} 
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sách</h3>
          <p className="text-gray-600 mb-4">Sách bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button 
            onClick={() => navigate('/books')} 
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/books')}
            className="flex items-center text-amber-600 hover:text-amber-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại danh sách sách
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="md:flex">
            {/* Book Image */}
            <div className="md:w-1/3">
              <div className="h-96 md:h-full bg-gray-100 flex items-center justify-center">
                {book.imageUrl ? (
                  <img 
                    src={book.imageUrl.startsWith('http') ? book.imageUrl : `http://localhost:5000${book.imageUrl}`} 
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-500 text-center">
                    <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-lg">No Image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Book Details */}
            <div className="md:w-2/3 p-8">
              <div className="space-y-6">
                {/* Title and Author */}
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{book.title}</h1>
                  <p className="text-xl text-gray-600">Tác giả: {book.author}</p>
                </div>

                {/* Price and Rating */}
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold text-black">
                    {book.price?.toLocaleString('vi-VN')} ₫
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg text-gray-600">
                      {book.format} • {book.language}
                    </span>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-4">
                  {book.stock > 0 ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✓ Còn hàng ({book.stock} cuốn)
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✗ Hết hàng
                    </span>
                  )}
                  
                  {book.categoryId?.name && (
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                      {book.categoryId.name}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Mô tả</h3>
                  <p className="text-gray-700 leading-relaxed">{book.description}</p>
                </div>

                {/* Book Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {book.isbn && (
                    <div>
                      <span className="font-semibold text-gray-900">ISBN:</span>
                      <span className="ml-2 text-gray-700">{book.isbn}</span>
                    </div>
                  )}
                  
                  {book.publisher && (
                    <div>
                      <span className="font-semibold text-gray-900">Nhà xuất bản:</span>
                      <span className="ml-2 text-gray-700">{book.publisher}</span>
                    </div>
                  )}
                  
                  {book.publicationDate && (
                    <div>
                      <span className="font-semibold text-gray-900">Ngày xuất bản:</span>
                      <span className="ml-2 text-gray-700">{formatDate(book.publicationDate)}</span>
                    </div>
                  )}
                  
                  {book.language && (
                    <div>
                      <span className="font-semibold text-gray-900">Ngôn ngữ:</span>
                      <span className="ml-2 text-gray-700">{book.language}</span>
                    </div>
                  )}
                  
                  {book.pages > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">Số trang:</span>
                      <span className="ml-2 text-gray-700">{book.pages}</span>
                    </div>
                  )}
                  
                  {book.format && (
                    <div>
                      <span className="font-semibold text-gray-900">Định dạng:</span>
                      <span className="ml-2 text-gray-700 capitalize">{book.format}</span>
                    </div>
                  )}
                  
                  {book.dimensions && (
                    <div>
                      <span className="font-semibold text-gray-900">Kích thước:</span>
                      <span className="ml-2 text-gray-700">{book.dimensions}</span>
                    </div>
                  )}
                  
                  {book.weight > 0 && (
                    <div>
                      <span className="font-semibold text-gray-900">Trọng lượng:</span>
                      <span className="ml-2 text-gray-700">{book.weight}g</span>
                    </div>
                  )}
                </div>

                {/* Digital Book Info */}
                {book.format && ['ebook', 'audiobook'].includes(book.format) && book.fileUrl && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">Sách điện tử</h4>
                    <p className="text-amber-800 text-sm">
                      Sách này có sẵn ở định dạng {book.format === 'ebook' ? 'sách điện tử' : 'sách nói'}.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  {book.stock > 0 ? (
                    <button className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors">
                      Thêm vào giỏ hàng
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold cursor-not-allowed"
                    >
                      Hết hàng
                    </button>
                  )}
                  
                  <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                    Thêm vào yêu thích
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </PageLayout>
  );
};

export default BookDetailPage;
