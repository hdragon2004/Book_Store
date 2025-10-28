import React, { useState, useEffect } from 'react';
import { bookAPI, categoryAPI } from '../../services/apiService';
import PageLayout from '../../layouts/PageLayout';
import BookCard from '../../components/BookCard';

const BookPage = () => {
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


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải sách...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-6">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-8 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="inline-flex items-center bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl"
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
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Tất cả sách</h1>
          <p className="text-xl text-gray-600">Khám phá bộ sưu tập sách đa dạng của chúng tôi</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Tìm kiếm
              </label>
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  name="search"
                  placeholder="Tên sách, tác giả..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg"
                />
                <button
                  type="submit"
                  className="bg-amber-600 text-white px-6 py-3 rounded-r-xl hover:bg-amber-700 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Danh mục
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg"
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
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                Sắp xếp
              </label>
              <select
                value={`${filters.sortOrder === 'desc' ? '-' : ''}${filters.sortBy}`}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg"
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
              <div className="text-lg text-gray-600">
                Hiển thị {books.length} sách
                {pagination.totalBooks > 0 && ` / ${pagination.totalBooks} tổng cộng`}
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        {books.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {books.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-3">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Trước
                </button>
                
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-6 py-3 border rounded-xl text-lg font-semibold transition-all duration-300 ${
                        page === pagination.currentPage
                          ? 'bg-amber-600 text-white border-amber-600'
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
                  className="px-6 py-3 border border-gray-300 rounded-xl text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-gray-500 mb-8">
              <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Không tìm thấy sách</h3>
            <p className="text-xl text-gray-600 mb-8">
              {filters.search || filters.category 
                ? 'Thử thay đổi bộ lọc để tìm thấy sách phù hợp'
                : 'Chưa có sách nào trong hệ thống'
              }
            </p>
            {(filters.search || filters.category) && (
              <button
                onClick={() => setFilters({ search: '', category: '', sortBy: 'createdAt', sortOrder: 'desc', page: 1, limit: 12 })}
                className="inline-flex items-center bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl"
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
