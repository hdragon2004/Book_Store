import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBookStatus } from '../contexts/BookStatusContext';
import { favoriteAPI, cartAPI } from '../services/apiService';

const BookModal = ({ book, isOpen, onClose }) => {
  const { user } = useAuth();
  const { isFavorite, isInCart, getCartQuantity, updateFavorite, updateCartItem, refreshData } = useBookStatus();
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !book) return null;

  const bookIsFavorite = isFavorite(book._id);
  const bookIsInCart = isInCart(book._id);
  const bookCartQuantity = getCartQuantity(book._id);

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào yêu thích');
      return;
    }

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  // Tạo array ảnh (có thể mở rộng sau)
  const images = book.imageUrl ? [book.imageUrl] : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white w-[80vw] max-w-[900px] aspect-[3/2] overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Column - Images */}
          <div className="lg:w-1/2 p-6 flex items-center justify-center h-full">
            <div className="relative w-full p-4">
              {images.length > 0 ? (
                <div className="aspect-[2/3] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={images[currentImageIndex].startsWith('http') 
                      ? images[currentImageIndex] 
                      : `http://localhost:5000${images[currentImageIndex]}`}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[2/3] bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-lg">No Image</span>
                  </div>
                </div>
              )}

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => prev > 0 ? prev - 1 : images.length - 1)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => prev < images.length - 1 ? prev + 1 : 0)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Dots indicator */}
              {images.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:w-1/2 p-6 flex flex-col justify-between h-full">
            {/* Phần trên - Thông tin cơ bản sách */}
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{book.title}</h2>
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
                  disabled={loading}
                  className="w-1/2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  <span>{loading ? 'Đang thêm...' : 'THÊM GIỎ HÀNG'}</span>
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

      </div>
    </div>
  );
};

export default BookModal;
