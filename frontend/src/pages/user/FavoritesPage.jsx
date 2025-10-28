import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { favoriteAPI } from '../../services/apiService';
import BookCard from '../../components/BookCard';
import PageLayout from '../../layouts/PageLayout';

const FavoritesPage = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await favoriteAPI.getFavorites();
      setFavorites(response.data.data.favorites || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Có lỗi xảy ra khi tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vui lòng đăng nhập</h2>
            <p className="text-gray-500 mb-6">Bạn cần đăng nhập để xem danh sách yêu thích</p>
            <Link 
              to="/login" 
              className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách yêu thích...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={fetchFavorites}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sách yêu thích</h1>
            <p className="text-gray-500">
              {favorites.length > 0 
                ? `Bạn có ${favorites.length} sách trong danh sách yêu thích`
                : 'Bạn chưa có sách nào trong danh sách yêu thích'}
            </p>
          </div>

          {/* Favorites List */}
          {favorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((favorite) => (
                <div key={favorite._id}>
                  <BookCard book={favorite.bookId} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-300 text-6xl mb-4">❤️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có sách yêu thích</h3>
              <p className="text-gray-600 mb-6">Hãy khám phá và thêm những cuốn sách bạn yêu thích</p>
              <Link 
                to="/books" 
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Khám phá sách
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default FavoritesPage;
