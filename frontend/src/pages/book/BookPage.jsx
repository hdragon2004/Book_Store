import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../../services/apiService';
import PageLayout from '../../layouts/PageLayout';

const BookPage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0
  });

  // Fetch books and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data with filters:', filters);
        
        // Try to fetch books first
        try {
          const cleanFilters = getCleanFilters();
          console.log('Clean filters:', cleanFilters);
          const booksResponse = await bookAPI.getBooks(cleanFilters);
          console.log('Books response:', booksResponse);
          setBooks(booksResponse.data.data?.books || []);
          
          if (booksResponse.data.data?.pagination) {
            setPagination(booksResponse.data.data.pagination);
          }
        } catch (booksErr) {
          console.error('Error fetching books:', booksErr);
          throw booksErr;
        }

        // Try to fetch categories
        try {
          const categoriesResponse = await categoryAPI.getCategories();
          console.log('Categories response:', categoriesResponse);
          setCategories(categoriesResponse.data.data?.categories || []);
        } catch (categoriesErr) {
          console.error('Error fetching categories:', categoriesErr);
          // Don't throw error for categories, just log it
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        console.error('Error details:', err.response?.data);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: e.target.search.value, page: 1 }));
  };

  const handleCategoryChange = (categoryId) => {
    setFilters(prev => ({ 
      ...prev, 
      category: categoryId || '', 
      page: 1 
    }));
  };

  // Clean filters before sending to API
  const getCleanFilters = () => {
    const cleanFilters = { ...filters };
    
    // Remove empty string parameters
    if (cleanFilters.search === '') delete cleanFilters.search;
    if (cleanFilters.category === '') delete cleanFilters.category;
    
    return cleanFilters;
  };

  const handleSortChange = (sortValue) => {
    const isDesc = sortValue.startsWith('-');
    const sortBy = isDesc ? sortValue.substring(1) : sortValue;
    const sortOrder = isDesc ? 'desc' : 'asc';
    
    setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleBookClick = (bookId) => {
    navigate(`/books/${bookId}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải sách...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tất cả sách</h1>
          <p className="text-gray-600">Khám phá bộ sưu tập sách đa dạng của chúng tôi</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  name="search"
                  placeholder="Tên sách, tác giả..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sắp xếp
              </label>
              <select
                value={`${filters.sortOrder === 'desc' ? '-' : ''}${filters.sortBy}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="-createdAt">Mới nhất</option>
                <option value="createdAt">Cũ nhất</option>
                <option value="-price">Giá cao nhất</option>
                <option value="price">Giá thấp nhất</option>
                <option value="title">Tên A-Z</option>
                <option value="-title">Tên Z-A</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Hiển thị {books.length} sách
                {pagination.totalBooks > 0 && ` / ${pagination.totalBooks} tổng cộng`}
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        {books.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {books.map((book) => (
                <button
                  key={book._id}
                  onClick={() => handleBookClick(book._id)}
                  className="w-full bg-transparent rounded-lg hover:shadow-lg transition-all duration-200 p-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {/* Book Image */}
                  <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center mb-4">
                    {book.imageUrl ? (
                      <img 
                        src={book.imageUrl.startsWith('http') ? book.imageUrl : `http://localhost:5000${book.imageUrl}`} 
                        alt={book.title}
                        className="w-full h-full object-cover rounded-md"
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

                  {/* Book Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-2 hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm">{book.author}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 font-bold text-lg">
                        ${book.price.toLocaleString()}
                      </span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500">
                          {book.format} • {book.language}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        {book.stock > 0 ? (
                          <span className="text-green-600 font-medium">
                            ✓ Còn hàng ({book.stock})
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">✗ Hết hàng</span>
                        )}
                      </div>
                      
                      {book.categoryId?.name && (
                        <span className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                          {book.categoryId.name}
                        </span>
                      )}
                    </div>

                    {book.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {book.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        page === pagination.currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sách</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.category 
                ? 'Thử thay đổi bộ lọc để tìm thấy sách phù hợp'
                : 'Chưa có sách nào trong hệ thống'
              }
            </p>
            {(filters.search || filters.category) && (
              <button
                onClick={() => setFilters({ search: '', category: '', sortBy: 'createdAt', sortOrder: 'desc', page: 1, limit: 12 })}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}
    </PageLayout>
  );
};

export default BookPage;
