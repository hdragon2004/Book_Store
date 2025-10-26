import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoryAPI, bookAPI } from '../../../services/apiService';

const ViewCategoryPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [books, setBooks] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryResponse, booksResponse] = await Promise.all([
          categoryAPI.getCategory(id),
          bookAPI.getBooks()
        ]);
        
        console.log('📂 Category data:', categoryResponse);
        console.log('📚 Books data:', booksResponse);
        
        const categoryData = categoryResponse?.data?.data || categoryResponse?.data;
        const booksData = booksResponse?.data?.data?.books || booksResponse?.data?.books || booksResponse?.data || [];
        
        setCategory(categoryData);
        
        // Filter books by category
        const categoryBooks = booksData.filter(book => 
          book?.categoryId?._id === id || book?.categoryId === id
        );
        setBooks(categoryBooks);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrors({ fetch: 'Không thể tải thông tin danh mục. Vui lòng thử lại.' });
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteCategory = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác.')) {
      try {
        await categoryAPI.deleteCategory(id);
        console.log('✅ Category deleted:', id);
        navigate('/admin/categories');
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Lỗi khi xóa danh mục. Vui lòng thử lại.');
      }
    }
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-600';
    if (stock < 10) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4">Đang tải thông tin danh mục...</p>
      </div>
    );
  }

  if (errors.fetch) {
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
                Lỗi tải dữ liệu
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errors.fetch}</p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/categories')}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => navigate(`/admin/categories/update/${id}`)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Chỉnh sửa
        </button>
        <button
          onClick={handleDeleteCategory}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Xóa danh mục
        </button>
        <button
          onClick={() => navigate('/admin/categories')}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Quay lại
        </button>
      </div>

      {/* Category Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin danh mục</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên danh mục</label>
                <p className="mt-1 text-sm text-gray-900">{category?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                <p className="mt-1 text-sm text-gray-900">{category?.description || 'Không có mô tả'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(category?.status || 'active')}`}>
                  {category?.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                <p className="mt-1 text-sm text-gray-900">{category?.createdAt ? formatDate(category.createdAt) : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thống kê</h2>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{books.length}</div>
                <div className="text-sm text-gray-600">Tổng số sách</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {books.filter(book => book?.stock > 0).length}
                </div>
                <div className="text-sm text-gray-600">Sách còn hàng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {books.filter(book => book?.stock === 0).length}
                </div>
                <div className="text-sm text-gray-600">Sách hết hàng</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Danh sách sách trong danh mục</h2>
        </div>
        
        {Array.isArray(books) && books.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sách
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tác giả
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {books.map((book) => (
                  <tr key={book._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-xs">📖</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{book.title}</div>
                          <div className="text-sm text-gray-500">ISBN: {book.isbn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {book.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(book.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getStockColor(book.stock)}`}>
                        {book.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        book.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {book.isActive ? 'Đang bán' : 'Ngừng bán'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">Không có sách nào</p>
            <p className="text-sm text-gray-500">Danh mục này chưa có sách nào</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewCategoryPage;
