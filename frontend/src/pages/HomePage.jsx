import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../services/apiService';
import axiosClient from '../services/axiosClient';
import { useBookStatus } from '../contexts/BookStatusContext';
import BookCard from '../components/BookCard';

const HomePage = () => {
  const { refreshData } = useBookStatus();
  const location = useLocation();
  const [booksByCategory, setBooksByCategory] = useState({});
  const [allBooks, setAllBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🏠 HomePage: Starting to fetch data...');
        setLoading(true);
        
        // Refresh user data (favorites, cart) khi vào trang chủ
        await refreshData();
        
        const [allBooksResponse, categoriesResponse] = await Promise.all([
          bookAPI.getBooks(),
          categoryAPI.getCategories()
        ]);
        console.log('🏠 HomePage: API responses received:', { allBooksResponse, categoriesResponse });

        const allBooks = allBooksResponse.data.data?.books || [];
        const categoriesData = categoriesResponse.data.data?.categories || [];
        
        setAllBooks(allBooks);
        setCategories(categoriesData);

        // Phân loại books theo category từ data đã có, chỉ hiển thị sách có stock > 0
        const booksByCategoryData = {};
        categoriesData.forEach(category => {
          booksByCategoryData[category._id] = allBooks
            .filter(book => book.categoryId?._id === category._id && book.stock > 0)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 4); // Chỉ lấy 4 cuốn mới nhất cho display
        });
        
        setBooksByCategory(booksByCategoryData);
      } catch (err) {
        console.error('🏠 HomePage: Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        setAllBooks([]);
        setCategories([]);
        setBooksByCategory({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh data when returning from cart page
  useEffect(() => {
    if (location.pathname === '/' && location.state?.fromCart) {
      refreshData();
    }
  }, [location, refreshData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[70vh] overflow-hidden">
        {/* Background Image with Blur */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")',
            filter: 'blur(2px)'
          }}
        ></div>
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Nền tảng mua sách uy tín và chất lượng
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8 opacity-90">
                dành riêng cho người đọc sách
              </p>
              <button className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                TÌM HIỂU THÊM
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl text-gray-400 mb-2">Giới thiệu chung</h2>
          <h3 className="text-4xl font-bold text-gray-800 mb-8">Comicola Ebook là gì?</h3>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            Comicola Ebook là nền tảng tải sách điện tử bản quyền hàng đầu Việt Nam, 
            chuyên cung cấp các đầu sách chất lượng cao dành riêng cho máy đọc sách. 
            Chúng tôi cam kết mang đến trải nghiệm đọc sách tuyệt vời với định dạng 
            tối ưu và nội dung phong phú.
          </p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center space-x-3 mx-auto">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span>TÌM HIỂU THÊM</span>
          </button>
        </div>
      </div>

      {/* Bestselling Books Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl text-gray-400 mb-2">Sách bán chạy nhất</h2>
            <h3 className="text-4xl font-bold text-gray-800 mb-8">Các sản phẩm bán chạy nhất</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {allBooks.slice(0, 4).map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>

          <div className="text-center">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center space-x-3 mx-auto">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span>XEM THÊM</span>
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">SÁCH BẢN QUYỀN</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Tất cả sách đều có bản quyền chính thức, đảm bảo chất lượng nội dung và hỗ trợ tác giả.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">TẢI VỀ DỄ DÀNG</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Quy trình tải về đơn giản, nhanh chóng với nhiều định dạng file phù hợp.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">ĐỊNH DẠNG FILE PHỔ BIẾN</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Hỗ trợ đa dạng định dạng: PDF, EPUB, MOBI tương thích với mọi thiết bị.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">BẢO MẬT NỘI DUNG</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Hệ thống bảo mật tiên tiến, bảo vệ quyền sở hữu trí tuệ và nội dung sách.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Business Books Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl text-gray-400 mb-2">Sách kinh doanh nổi bật</h2>
            <h3 className="text-4xl font-bold text-gray-800 mb-8">Các cuốn sách với chủ đề kinh doanh</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {allBooks.slice(4, 8).map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;