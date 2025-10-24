import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBookStatus } from '../contexts/BookStatusContext';
import { favoriteAPI, cartAPI } from '../services/apiService';

const BookCard = ({ book }) => {
  const { user } = useAuth();
  const { isFavorite, isInCart, getCartQuantity, updateFavorite, updateCartItem } = useBookStatus();
  const [loading, setLoading] = useState(false);

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

    if (book.stock <= 0) {
      alert('Sách đã hết hàng');
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
      alert('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-500">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-500">☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-gray-300">☆</span>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200">
      <Link to={`/books/${book._id}`}>
        <div className="h-48 bg-gray-200 flex items-center justify-center">
          {book.imageUrl ? (
            <img 
              src={book.imageUrl} 
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-500 text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm">No Image</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/books/${book._id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {book.title}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-2">{book.author}</p>
        
        <div className="mb-2">
          <div className="mb-1">
            <span className="text-sm text-gray-500">
              {book.format} • {book.language}
            </span>
          </div>
          <div>
            <span className="text-blue-600 font-bold text-lg">${book.price}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs mb-3">
          <div className="flex items-center">
            {book.stock > 0 ? (
              <span className="text-green-600 font-medium">
                ✓ Còn hàng ({book.stock})
              </span>
            ) : (
              <span className="text-red-600 font-medium">✗ Hết hàng</span>
            )}
          </div>
          
          {book.totalReviews > 0 && (
            <span className="text-gray-500">
              {book.totalReviews} đánh giá
            </span>
          )}
        </div>
        
        {/* Add to Cart Button and Favorite Icon */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAddToCart}
            disabled={loading || book.stock <= 0}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              book.stock <= 0 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : bookIsInCart
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Đang xử lý...' : 
             book.stock <= 0 ? 'Hết hàng' :
             bookIsInCart ? `Trong giỏ (${bookCartQuantity})` : 
             'Thêm vào giỏ hàng'}
          </button>
          <button 
            onClick={handleToggleFavorite}
            disabled={loading}
            className={`p-2 transition-colors ${
              bookIsFavorite 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <svg 
              className="w-5 h-5" 
              fill={bookIsFavorite ? "currentColor" : "none"} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default BookCard;
