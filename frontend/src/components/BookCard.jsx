import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBookStatus } from '../contexts/BookStatusContext';
import { favoriteAPI, cartAPI } from '../services/apiService';
import BookModal from './BookModal';

const BookCard = ({ book, showActions = false }) => {
  const { user } = useAuth();
  const { isFavorite, isInCart, getCartQuantity, updateFavorite, updateCartItem, refreshData } = useBookStatus();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Safety check for book object
  if (!book || !book._id) {
    return (
      <div className="bg-white rounded-lg overflow-hidden p-4">
        <div className="text-center text-gray-500">
          <p>Không thể tải thông tin sách</p>
        </div>
      </div>
    );
  }

  // Chỉ hiển thị sách có stock > 0
  if (book.stock <= 0) {
    return null;
  }

  // Sử dụng cached data thay vì gọi API
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
        // Update quantity
        await cartAPI.updateCartItem(book._id, bookCartQuantity + 1);
        updateCartItem(book._id, bookCartQuantity + 1, true);
      } else {
        // Add to cart
        await cartAPI.addToCart(book._id, 1);
        updateCartItem(book._id, 1, true);
      }
      // Refresh data để đồng bộ với server
      await refreshData();
      alert('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <div className="overflow-hidden group relative">
        {/* Phần trên - Ảnh sách với nền riêng */}
        <div className="bg-gray-200 p-4 relative">
          <Link to={`/books/${book._id}`}>
            <div className="w-full aspect-[2/3] bg-gray-100 rounded-md flex items-center justify-center mx-auto" style={{maxWidth: '200px'}}>
              {book.imageUrl ? (
                <img 
                  src={book.imageUrl.startsWith('http') ? book.imageUrl : `http://localhost:5000${book.imageUrl}`} 
                  alt={book.title}
                  className="w-full h-full object-cover rounded-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'block';
                    }
                  }}
                />
              ) : (
                <div className="text-gray-500 text-center">
                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-lg">No Image</span>
                </div>
              )}
            </div>
          </Link>

        {/* Nút chức năng khi hover - Ở cuối phần trên */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          <div className="flex space-x-2">
            {/* Nút xem chi tiết */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowModal(true);
              }}
              className="w-10 h-10 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
              title="Xem chi tiết"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>

            {/* Nút yêu thích */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                handleToggleFavorite();
              }}
              className={`w-10 h-10 bg-white border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm ${bookIsFavorite ? 'border-red-300' : ''}`}
              title={bookIsFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
            >
              <svg 
                className={`w-5 h-5 transition-colors ${bookIsFavorite ? 'text-red-500' : 'text-gray-600'}`} 
                fill={bookIsFavorite ? 'currentColor' : 'none'} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Đường phân cách với hiệu ứng chảy */}
      {/* <div className="relative h-1 bg-gray-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-900 ease-in-out delay-75 transform -translate-x-full group-hover:translate-x-full"></div>
      </div> */}

      {/* Phần dưới - Thông tin sách với nền trùng trang */}
      <div className="p-4 space-y-2 text-center relative">
        {/* Khối thông tin sẽ ẩn khi hover để nhường chỗ cho nút */}
        <div className="transition-all duration-200 ease-out group-hover:opacity-0 group-hover:translate-y-1">
          <Link to={`/books/${book._id}`} className="block">
            <h3 className="font-bold text-lg line-clamp-2 hover:text-amber-600 transition-colors">
              {book.title}
            </h3>
          </Link>
          
          <p className="text-gray-600 text-sm">{book.author}</p>
          
          {/* Price */}
          <div className="pt-2">
            <span className="text-black font-bold text-lg">
              {book.price?.toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>

        {/* Nút ADD TO CART khi hover - Trong phần dưới */}
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out absolute top-0 left-0 right-0 flex items-center justify-center">
          <button 
            onClick={handleAddToCart}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 transition-colors shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <span className="font-medium">THÊM GIỎ HÀNG</span>
          </button>
        </div>
      </div>
    </div>

    {/* Book Modal */}
    <BookModal 
      book={book} 
      isOpen={showModal} 
      onClose={() => setShowModal(false)} 
    />
    </>
  );
};

export default BookCard;
