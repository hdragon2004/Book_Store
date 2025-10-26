import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../../../services/apiService';

const BooksPage = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch books and categories in parallel
        const [booksResponse, categoriesResponse] = await Promise.all([
          bookAPI.getBooks({
            search: searchTerm,
            category: filterCategory !== 'all' ? filterCategory : undefined,
            status: filterStatus !== 'all' ? filterStatus : undefined
          }),
          categoryAPI.getCategories()
        ]);
        
        console.log('📚 BooksPage API Response:', booksResponse);
        console.log('📂 CategoriesPage API Response:', categoriesResponse);
        
        setBooks(booksResponse?.data?.data?.books || booksResponse?.data?.books || booksResponse?.data || []);
        setCategories(categoriesResponse?.data?.data?.categories || categoriesResponse?.data?.categories || categoriesResponse?.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setBooks([]);
        setCategories([]);
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, searchTerm, filterCategory, filterStatus]);

  const handleBookAction = async (bookId, action) => {
    try {
      switch (action) {
        case 'view':
          navigate(`/admin/books/${bookId}`);
          break;
        case 'delete':
          if (window.confirm('Bạn có chắc chắn muốn xóa sách này?')) {
            await bookAPI.deleteBook(bookId);
            const booksResponse = await bookAPI.getBooks();
            setBooks(booksResponse?.data?.data?.books || booksResponse?.data?.books || booksResponse?.data || []);
          }
          break;
        default:
          console.log(`Action ${action} for book ${bookId}`);
      }
    } catch (error) {
      console.error(`Error ${action} book:`, error);
      alert(`Lỗi khi ${action === 'delete' ? 'xóa' : 'thực hiện'} sách. Vui lòng thử lại.`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'out_of_stock': return 'bg-yellow-100 text-yellow-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      case 'coming_soon': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Có sẵn';
      case 'out_of_stock': return 'Hết hàng';
      case 'discontinued': return 'Ngừng bán';
      case 'coming_soon': return 'Sắp ra mắt';
      default: return 'Không xác định';
    }
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-600';
    if (stock < 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  const filteredBooks = Array.isArray(books) ? books.filter(book => {
    const matchesSearch = book?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book?.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || book?.categoryId?.name === filterCategory;
    const matchesStatus = filterStatus === 'all' || book?.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  }) : [];

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = Array.isArray(filteredBooks) ? filteredBooks.slice(indexOfFirstBook, indexOfLastBook) : [];
  const totalPages = Math.ceil((Array.isArray(filteredBooks) ? filteredBooks.length : 0) / booksPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Đang tải sách...</p>
      </div>
    );
  }

  // Debug: Log current state
  console.log('📚 BooksPage - Loading:', loading, 'Books count:', books.length);
  console.log('📚 BooksPage - Books:', books);
  console.log('📚 BooksPage - FilteredBooks:', filteredBooks);
  console.log('📚 BooksPage - CurrentBooks:', currentBooks);

  try {
    return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => navigate('/admin/books/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Thêm sách mới
        </button>
      </div>
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tìm kiếm sách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả</option>
              {Array.isArray(categories) && categories.map((category) => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang bán</option>
              <option value="inactive">Ngừng bán</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterStatus('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>
      {/* Books Table with relative positioning for overlay */}
      <div className="relative">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tác giả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tồn kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(currentBooks) && currentBooks.length > 0 ? (
                currentBooks.map((book) => {
                  console.log('📖 Book data:', book?.title, 'ImageUrl:', book?.imageUrl);
                  return (
                <tr key={book?.id || book?.isbn || Math.random()} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {book?.imageUrl ? (
                          <img 
                            src={book.imageUrl.startsWith('http') ? book.imageUrl : `http://localhost:5000${book.imageUrl}`} 
                            alt={book?.title || 'Book cover'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <span className="text-gray-500 text-xs" style={{display: book?.imageUrl ? 'none' : 'block'}}>📖</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{book?.title || 'N/A'}</div>
                        <div className="text-sm text-gray-500">ISBN: {book?.isbn || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {book?.author || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {book?.categoryId?.name || book?.category || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(book?.price || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${getStockColor(book?.stock || 0)}`}>
                      {book?.stock || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(book?.status)}`}>
                      {getStatusText(book?.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBookAction(book?._id || book?.id, 'view')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => navigate(`/admin/books/update/${book?._id || book?.id}`)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleBookAction(book?._id || book?.id, 'delete')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
                );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 mb-2">Không có sách nào</p>
                      <p className="text-sm text-gray-500">Hãy thêm sách mới hoặc thử lại sau</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
      {/* Pagination */}
      {Array.isArray(filteredBooks) && filteredBooks.length > booksPerPage && (
        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{indexOfFirstBook + 1}</span> đến{' '}
              <span className="font-medium">{Math.min(indexOfLastBook, Array.isArray(filteredBooks) ? filteredBooks.length : 0)}</span> của{' '}
              <span className="font-medium">{Array.isArray(filteredBooks) ? filteredBooks.length : 0}</span> kết quả
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    currentPage === index + 1
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.error('❌ BooksPage render error:', error);
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Lỗi hiển thị trang sách
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Đã xảy ra lỗi khi hiển thị trang sách. Vui lòng thử lại.</p>
                <p className="mt-1 text-xs">Error: {error.message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default BooksPage;