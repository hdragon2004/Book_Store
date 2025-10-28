import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { libraryAPI, downloadAPI } from '../../services/apiService';
import PageLayout from '../../layouts/PageLayout';
import OfflineReader from '../../components/OfflineReader';

const MyLibraryPage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, ebook, audiobook
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookId, setSelectedBookId] = useState(null);

  useEffect(() => {
    console.log('🔄 useEffect triggered:', { user: user?.email, filter });
    if (user) {
      fetchLibrary();
    } else {
      console.log('⚠️ No user found, skipping library fetch');
      // Reset states when no user
      setBooks([]);
      setError(null);
    }
  }, [user, filter]);

  // Retry mechanism when user comes back
  useEffect(() => {
    const handleFocus = () => {
      if (user && books.length === 0 && !loading) {
        console.log('🔄 Window focused, retrying library fetch...');
        fetchLibrary();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, books.length, loading]);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      
      console.log('🔍 Fetching library for user:', user?.email);
      
      const params = {};
      if (filter !== 'all') {
        params.bookType = filter;
      }
      if (searchQuery) {
        params.q = searchQuery;
      }
      
      const response = await libraryAPI.getMyLibrary(params);
      console.log('✅ Library data received:', response.data);
      setBooks(response.data.data.books);
    } catch (error) {
      console.error('❌ Error fetching library:', error);
      console.error('Error details:', error.response?.data);
      setError('Có lỗi xảy ra khi tải thư viện');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLibrary();
  };

  const handleDownload = async (bookId) => {
    try {
      const response = await downloadAPI.generateDownloadLink(bookId);
      const downloadUrl = response.data.data.downloadUrl;
      
      // Tạo link tải
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Có lỗi xảy ra khi tải file');
    }
  };

  const handleStream = async (bookId) => {
    try {
      // Tạo token tạm thời cho streaming
      const response = await downloadAPI.createDownloadLink(bookId);
      const streamUrl = response.data.data.streamUrl;
      
      // Đảm bảo URL đầy đủ với backend port
      const fullUrl = streamUrl.startsWith('http') 
        ? streamUrl 
        : `http://localhost:5000${streamUrl}`;
      
      // Mở file trong tab mới để đọc/nghe trực tuyến
      window.open(fullUrl, '_blank');
    } catch (error) {
      console.error('Error creating stream link:', error);
      alert('Có lỗi xảy ra khi mở file');
    }
  };

  const getBookTypeIcon = (bookType) => {
    switch (bookType) {
      case 'ebook':
        return '📖';
      case 'audiobook':
        return '🎧';
      default:
        return '📚';
    }
  };

  const getBookTypeText = (bookType) => {
    switch (bookType) {
      case 'ebook':
        return 'Sách điện tử';
      case 'audiobook':
        return 'Sách nói';
      default:
        return 'Sách';
    }
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h2>
            <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem thư viện</p>
            <Link 
              to="/login" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thư viện...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={fetchLibrary}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thư viện của tôi</h1>
            <p className="text-gray-600">
              {books.length} sách trong thư viện
            </p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filter */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilter('ebook')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'ebook'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📖 Sách điện tử
                </button>
                <button
                  onClick={() => setFilter('audiobook')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'audiobook'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🎧 Sách nói
                </button>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="flex">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm trong thư viện..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                  >
                    Tìm kiếm
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Books Grid */}
          {books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((userBook) => (
                <div key={userBook._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Book Image */}
                  <div className="aspect-w-3 aspect-h-4 bg-gray-200">
                    {userBook.bookId?.imageUrl ? (
                      <img
                        src={userBook.bookId.imageUrl.startsWith('http') 
                          ? userBook.bookId.imageUrl 
                          : `http://localhost:5000${userBook.bookId.imageUrl}`}
                        alt={userBook.bookId?.title || 'Book'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-gray-400 text-center">
                          <div className="text-4xl mb-2">{getBookTypeIcon(userBook.bookType)}</div>
                          <div className="text-sm">No Image</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {getBookTypeText(userBook.bookType)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {userBook.downloadCount}/3 lần tải
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {userBook.bookId?.title || 'Không có tên sách'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {userBook.bookId?.author || 'Không có tác giả'}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStream(userBook.bookId._id)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        {userBook.bookType === 'audiobook' ? 'Nghe ngay' : 'Đọc ngay'}
                      </button>
                      <button
                        onClick={() => setSelectedBookId(userBook.bookId._id)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        📱 Offline
                      </button>
                      <button
                        onClick={() => handleDownload(userBook.bookId._id)}
                        disabled={userBook.downloadCount >= 3}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Tải xuống
                      </button>
                    </div>

                    {userBook.downloadCount >= 3 && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        Đã đạt giới hạn tải (3 lần)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'Thư viện trống' : `Không có ${filter === 'ebook' ? 'sách điện tử' : 'sách nói'}`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'Bạn chưa mua sách nào. Hãy khám phá và mua sách để thêm vào thư viện!'
                  : `Bạn chưa mua ${filter === 'ebook' ? 'sách điện tử' : 'sách nói'} nào.`
                }
              </p>
              <Link
                to="/"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Khám phá sách
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Offline Reader Modal */}
      {selectedBookId && (
        <OfflineReader
          bookId={selectedBookId}
          onClose={() => setSelectedBookId(null)}
        />
      )}
    </PageLayout>
  );
};

export default MyLibraryPage;
