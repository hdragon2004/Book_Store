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
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    if (user) {
      fetchLibrary();
    } else {
      setBooks([]);
      setError(null);
    }
  }, [user, filter]);

  useEffect(() => {
    const handleFocus = () => {
      if (user && books.length === 0 && !loading) {
        fetchLibrary();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, books.length, loading]);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filter !== 'all') params.bookType = filter;
      if (searchQuery) params.q = searchQuery;
      const response = await libraryAPI.getMyLibrary(params);
      if (response.data && response.data.data && response.data.data.books) {
        setBooks(response.data.data.books);
      } else {
        setBooks([]);
      }
    } catch (error) {
      console.error('Error fetching library:', error);
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
      const response = await downloadAPI.createDownloadLink(bookId);
      const streamUrl = response.data.data.streamUrl;
      const fullUrl = streamUrl.startsWith('http') ? streamUrl : `http://localhost:5000${streamUrl}`;
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
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Vui lòng đăng nhập</h2>
            <p className="text-gray-500 mb-6">Bạn cần đăng nhập để xem thư viện</p>
            <Link to="/login" className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors">Đăng nhập</Link>
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
            <p className="text-gray-600">Đang tải thư viện...</p>
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
            <button onClick={fetchLibrary} className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors">Thử lại</button>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thư viện của tôi</h1>
            <p className="text-gray-500">{books.length} sách trong thư viện</p>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-6 mb-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Filter */}
              <div className="flex space-x-2">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Tất cả</button>
                <button onClick={() => setFilter('ebook')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'ebook' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>📖 Sách điện tử</button>
                <button onClick={() => setFilter('audiobook')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'audiobook' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>🎧 Sách nói</button>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 w-full">
                <div className="flex">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm kiếm trong thư viện..." className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent" />
                  <button type="submit" className="px-6 py-2 bg-amber-600 text-white rounded-r-lg hover:bg-amber-700 transition-colors">Tìm kiếm</button>
                </div>
              </form>
            </div>
          </div>

          {/* Books Grid */}
          {books.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {books.map((userBook) => (
                <div key={userBook._id} className="bg-white">
                  {/* Book Image */}
                  <div className="aspect-[3/4] bg-gray-200">
                    {userBook.bookId?.imageUrl ? (
                      <img src={userBook.bookId.imageUrl.startsWith('http') ? userBook.bookId.imageUrl : `http://localhost:5000${userBook.bookId.imageUrl}`} alt={userBook.bookId?.title || 'Book'} className="w-full h-full object-cover" />
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
                  <div className="py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">{getBookTypeText(userBook.bookType)}</span>
                      <span className="text-xs text-gray-500">{userBook.downloadCount}/3 lần tải</span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{userBook.bookId?.title || 'Không có tên sách'}</h3>
                    <p className="text-sm text-gray-600 mb-3">{userBook.bookId?.author || 'Không có tác giả'}</p>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button onClick={() => handleStream(userBook.bookId._id)} className="flex-1 bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">{userBook.bookType === 'audiobook' ? 'Nghe ngay' : 'Đọc ngay'}</button>
                      <button onClick={() => setSelectedBookId(userBook.bookId._id)} className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-black/80 transition-colors">📱 Offline</button>
                      <button onClick={() => handleDownload(userBook.bookId._id)} disabled={userBook.downloadCount >= 3} className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Tải xuống</button>
                    </div>

                    {userBook.downloadCount >= 3 && (
                      <p className="text-xs text-red-500 mt-2 text-center">Đã đạt giới hạn tải (3 lần)</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-300 text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{filter === 'all' ? 'Thư viện trống' : `Không có ${filter === 'ebook' ? 'sách điện tử' : 'sách nói'}`}</h3>
              <p className="text-gray-600 mb-6">{filter === 'all' ? 'Bạn chưa mua sách nào. Hãy khám phá và mua sách để thêm vào thư viện!' : `Bạn chưa mua ${filter === 'ebook' ? 'sách điện tử' : 'sách nói'} nào.`}</p>
              <Link to="/" className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors">Khám phá sách</Link>
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
