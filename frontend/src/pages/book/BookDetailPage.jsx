import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookAPI } from '../../services/apiService';
import BookCard from '../../components/BookCard';
import { useAuth } from '../../contexts/AuthContext';
import { useBookStatus } from '../../contexts/BookStatusContext';
import { favoriteAPI, cartAPI } from '../../services/apiService';
import PageLayout from '../../layouts/PageLayout';

const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, isInCart, getCartQuantity, updateFavorite, updateCartItem, refreshData } = useBookStatus();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedBooks, setRelatedBooks] = useState([]);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    const fetchBook = async () => {
      try {
        setLoading(true);
        const response = await bookAPI.getBook(id);
        const fetchedBook = response.data.data;
        setBook(fetchedBook);

        // Fetch related books by category (exclude current book)
        try {
          const categoryId = fetchedBook?.categoryId?._id || fetchedBook?.categoryId || fetchedBook?.category?._id;
          if (categoryId) {
            const relRes = await bookAPI.getBooks({ categoryId });
            const all = relRes.data?.data?.books || relRes.data?.books || relRes.data || [];
            const filtered = all.filter(b => b._id !== fetchedBook._id).slice(0, 4);
            setRelatedBooks(filtered);
          } else {
            setRelatedBooks([]);
          }
        } catch (e) {
          console.warn('Fetch related books error', e);
          setRelatedBooks([]);
        }
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

  const bookIsFavorite = book ? isFavorite(book._id) : false;
  const bookIsInCart = book ? isInCart(book._id) : false;
  const bookCartQuantity = book ? getCartQuantity(book._id) : 0;

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }

    try {
      if (bookIsFavorite) {
        await favoriteAPI.removeFromFavorites(book._id);
        updateFavorite(book._id, false);
      } else {
        await favoriteAPI.addToFavorites(book._id);
        updateFavorite(book._id, true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    try {
      if (bookIsInCart) {
        await cartAPI.updateCartItem(book._id, bookCartQuantity + 1);
        updateCartItem(book._id, bookCartQuantity + 1, true);
      } else {
        await cartAPI.addToCart(book._id, 1);
        updateCartItem(book._id, 1, true);
      }
      await refreshData();
      alert('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    }
  };

  // Tạo array ảnh (có thể mở rộng sau)
  const images = book?.imageUrl ? [book.imageUrl] : [];

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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              <li>
                <button onClick={() => navigate('/')} className="hover:text-gray-900 transition-colors">
                  Trang chủ
                </button>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-900">{book.categoryId?.name || 'Sách'}</span>
              </li>
            </ol>
          </nav>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Left Column - Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative group">
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                    {images.length > 0 ? (
                      <img
                        src={images[currentImageIndex].startsWith('http') 
                          ? images[currentImageIndex] 
                          : `http://localhost:5000${images[currentImageIndex]}`}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-gray-400 text-center">
                          <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-lg">No Image</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Zoom Icon */}
                  <div className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                {images.length > 1 && (
                  <div className="flex space-x-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentImageIndex ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image.startsWith('http') ? image : `http://localhost:5000${image}`}
                          alt={`${book.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Product Info */}
              <div className="flex flex-col justify-between h-full">
                {/* Phần trên - Thông tin cơ bản sách */}
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{book.title}</h1>
                  <div className="text-orange-500 font-bold text-xl mb-4">{book.price?.toLocaleString('vi-VN')} ₫</div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {book.description ? (
                      <div className="whitespace-pre-wrap">
                        {book.description}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        Chưa có mô tả chi tiết cho cuốn sách này.
                      </p>
                    )}
                  </div>
                </div>

                {/* Phần dưới - Button và thông tin */}
                <div className="mt-auto">
                  {/* Button ADD TO CART */}
                  <div className="mb-4 flex justify-start">
                    <button
                      onClick={handleAddToCart}
                      className="w-1/2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                      <span>THÊM GIỎ HÀNG</span>
                    </button>
                  </div>

                  {/* Đường ngăn cách */}
                  <div className="border-t border-gray-300 mb-4"></div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Thể loại:</span>
                      <span className="ml-2 text-sm text-gray-600">
                        {book.categoryId?.name || book.category?.name || book.category || 'Chưa phân loại'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Tác giả:</span>
                      <span className="ml-2 text-sm text-gray-600">{book.author || 'Chưa xác định'}</span>
                    </div>
                    {book.publisher && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Nhà xuất bản:</span>
                        <span className="ml-2 text-sm text-gray-600">{book.publisher}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>

            {/* Tabs Section */}
            <div className="border-t border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'description'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  MÔ TẢ
                </button>
                <button
                  onClick={() => setActiveTab('additional')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'additional'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  THÔNG TIN THÊM
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'description' && (
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                )}

                {activeTab === 'additional' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {book.author && (
                      <div>
                        <span className="font-medium text-gray-900">Author:</span>
                        <span className="ml-2 text-gray-700">{book.author}</span>
                      </div>
                    )}
                    {book.publisher && (
                      <div>
                        <span className="font-medium text-gray-900">Publisher:</span>
                        <span className="ml-2 text-gray-700">{book.publisher}</span>
                      </div>
                    )}
                    {book.categoryId?.name && (
                      <div>
                        <span className="font-medium text-gray-900">Category:</span>
                        <span className="ml-2 text-gray-700">{book.categoryId.name}</span>
                      </div>
                    )}
                    {book.language && (
                      <div>
                        <span className="font-medium text-gray-900">Language:</span>
                        <span className="ml-2 text-gray-700">{book.language}</span>
                      </div>
                    )}
                    {book.pages && (
                      <div>
                        <span className="font-medium text-gray-900">Pages:</span>
                        <span className="ml-2 text-gray-700">{book.pages}</span>
                      </div>
                    )}
                    {book.format && (
                      <div>
                        <span className="font-medium text-gray-900">Format:</span>
                        <span className="ml-2 text-gray-700 capitalize">{book.format}</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedBooks.length > 0 && (
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SÁCH LIÊN QUAN</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedBooks.map(rb => (
                  <BookCard key={rb._id} book={rb} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default BookDetailPage;
