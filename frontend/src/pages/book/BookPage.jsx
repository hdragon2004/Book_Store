import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../../services/apiService';
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
    limit: 18,
    stock: 'inStock' // Chỉ hiển thị sách có stock > 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    limit: 18
  });
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch books and categories
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
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
          console.log('Response structure:', {
            data: booksResponse.data,
            books: booksResponse.data?.data?.books,
            pagination: booksResponse.data?.data?.pagination
          });
          setBooks(booksResponse.data.data?.books || []);
          
          if (booksResponse.data.data?.pagination) {
            console.log('Pagination data:', booksResponse.data.data.pagination);
            setPagination(booksResponse.data.data.pagination);
          } else {
            console.log('No pagination data found');
            setPagination({
              currentPage: 1,
              totalPages: 1,
              totalBooks: booksResponse.data.data?.books?.length || 0
            });
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
    
    // Luôn giữ stock filter để chỉ hiển thị sách có stock > 0
    cleanFilters.stock = 'inStock';
    
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
    <div className="min-h-screen bg-white">
      {/* Breadcrumb - Full width */}
      <div className="w-full bg-gray-50 border-b border-gray-200 py-4">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-gray-800">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Shop</span>
          </nav>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Advanced Filter - Collapsible */}
        <div className="mb-8">
          <div className="bg-white border-b border-gray-200">
            {/* Filter Header */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full p-4 flex items-center text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg font-semibold text-orange-500">ADVANCED FILTER</span>
              <svg 
                className={`w-5 h-5 text-orange-500 transition-transform duration-300 ml-2 ${isFilterOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Filter Content - Collapsible */}
            {isFilterOpen && (
              <div className="p-6 border-t border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Search */}
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search
                    </label>
                    <form onSubmit={handleSearch} className="flex">
                      <input
                        type="text"
                        name="search"
                        placeholder="Search..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      />
                      <button
                        type="submit"
                        className="bg-orange-500 text-white px-3 py-2 rounded-r-md hover:bg-orange-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </form>
                  </div>

                  {/* Category Filter */}
                  <div className="lg:col-span-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">CATEGORY</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      <label 
                        onClick={() => handleCategoryChange('')}
                        className={`flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded ${
                          filters.category === '' ? 'bg-orange-50' : ''
                        }`}
                      >
                        <span className="text-sm text-gray-700">Tất cả danh mục</span>
                        <span className="text-xs text-gray-500">({pagination.totalBooks})</span>
                      </label>
                      {categories.map((category) => (
                        <label 
                          key={category._id} 
                          onClick={() => handleCategoryChange(category._id)}
                          className={`flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded ${
                            filters.category === category._id ? 'bg-orange-50' : ''
                          }`}
                        >
                          <span className="text-sm text-gray-700">{category.name}</span>
                          <span className="text-xs text-gray-500">({category.bookCount || 0})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Books Section - Bottom */}
          <div>
            {/* Results Info */}
            {books.length > 0 && (
              <div className="mb-6 text-sm text-gray-600">
                Hiển thị {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalBooks)} trong tổng số {pagination.totalBooks} sách
              </div>
            )}

            {/* Books Grid */}
            {books.length > 0 ? (
              <>
                <div className={`grid gap-6 mb-8 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6' 
                    : 'grid-cols-1'
                }`}>
                  {books.map((book) => (
                    <BookCard key={book._id} book={book} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-1">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange((pagination?.currentPage || 1) - 1)}
                      disabled={(pagination?.currentPage || 1) <= 1}
                      className="w-10 h-10 border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Page Numbers */}
                    {(() => {
                      const totalPages = pagination?.totalPages || 1;
                      const currentPage = pagination?.currentPage || 1;
                      const pages = [];
                      
                      // Logic để hiển thị tối đa 5 trang
                      let startPage = Math.max(1, currentPage - 2);
                      let endPage = Math.min(totalPages, startPage + 4);
                      
                      // Điều chỉnh nếu gần cuối
                      if (endPage - startPage < 4) {
                        startPage = Math.max(1, endPage - 4);
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }
                      
                      return pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 border text-sm font-medium transition-colors flex items-center justify-center ${
                            page === currentPage
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    })()}
                    
                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange((pagination?.currentPage || 1) + 1)}
                      disabled={(pagination?.currentPage || 1) >= (pagination?.totalPages || 1)}
                      className="w-10 h-10 border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sách</h3>
                <p className="text-gray-600 mb-8">
                  {filters.search || filters.category 
                    ? 'Thử thay đổi bộ lọc để tìm thấy sách phù hợp'
                    : 'Chưa có sách nào trong hệ thống'
                  }
                </p>
                {(filters.search || filters.category) && (
                  <button
                    onClick={() => setFilters({ search: '', category: '', sortBy: 'createdAt', sortOrder: 'desc', page: 1, limit: 18, stock: 'inStock' })}
                    className="inline-flex items-center bg-orange-500 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default BookPage;
