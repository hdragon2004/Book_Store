import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../services/apiService';
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
  const [scrollPositions, setScrollPositions] = useState({});

  // Helper functions for category titles and subtitles
  const getCategoryTitle = (categoryName) => {
    const titles = {
      'Fiction': 'Để học Tiếng Anh tốt hơn',
      'Non-Fiction': 'Cần đọc gì để nuôi dưỡng sự sáng tạo?',
      'Technology': 'Nâng cao kỹ năng lập trình',
      'Business': 'Phát triển tư duy kinh doanh',
      'Education': 'Học tập hiệu quả hơn'
    };
    return titles[categoryName] || categoryName;
  };

  const getCategorySubtitle = (categoryName) => {
    const subtitles = {
      'Fiction': 'Tổng hợp sách dạy viết, đọc, học tiếng Anh',
      'Non-Fiction': 'Khám phá những cuốn sách truyền cảm hứng sáng tạo',
      'Technology': 'Sách công nghệ từ cơ bản đến nâng cao',
      'Business': 'Sách kinh doanh và phát triển bản thân',
      'Education': 'Sách giáo dục và phương pháp học tập'
    };
    return subtitles[categoryName] || categoryName;
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🏠 HomePage: Starting to fetch data...');
        setLoading(true);
        
        // Refresh user data (favorites, cart) khi vào trang chủ
        await refreshData();
        
        // Tạm thời tắt cache để test
        // const cachedData = localStorage.getItem('homepage_data');
        // const cacheTime = localStorage.getItem('homepage_cache_time');
        // const now = Date.now();
        // const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

        // if (cachedData && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
        //   // Sử dụng cache
        //   const { allBooks, categories, booksByCategory } = JSON.parse(cachedData);
        //   setAllBooks(allBooks);
        //   setCategories(categories);
        //   setBooksByCategory(booksByCategory);
        //   setLoading(false);
        //   return;
        // }

        // Gọi API 1 lần để lấy tất cả books và categories
        console.log('🏠 HomePage: Calling APIs...');
        
        // Test kết nối trước
        try {
          const testResponse = await fetch('http://localhost:5000/api/health');
          console.log('🏠 HomePage: Health check response:', testResponse.status);
        } catch (testError) {
          console.error('🏠 HomePage: Health check failed:', testError);
        }
        
        const [allBooksResponse, categoriesResponse] = await Promise.all([
          bookAPI.getBooks(), // Bỏ limit, lấy hết
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
            .slice(0, 8); // Chỉ lấy 8 cuốn mới nhất cho display
        });
        
        setBooksByCategory(booksByCategoryData);

        // Cache data
        const dataToCache = {
          allBooks,
          categories: categoriesData,
          booksByCategory: booksByCategoryData
        };
        localStorage.setItem('homepage_data', JSON.stringify(dataToCache));
        localStorage.setItem('homepage_cache_time', Date.now().toString());
      } catch (err) {
        console.error('🏠 HomePage: Error fetching data:', err);
        console.error('🏠 HomePage: Error details:', err.response?.data || err.message);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        // Set empty data để không bị màn hình trắng
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

  // Handle scroll for each category - move 5 books at a time
  const handleScroll = (containerId, direction) => {
    const container = document.getElementById(`scroll-container-${containerId}`);
    if (!container) return;

    // Calculate scroll amount for 5 books (book width + gap)
    const bookWidth = 224; // 14rem = 224px
    const gap = 16; // 1rem = 16px
    const scrollAmount = (bookWidth + gap) * 5; // Move 5 books at once
    
    const currentScroll = scrollPositions[containerId] || 0;
    const maxScroll = container.scrollWidth - container.clientWidth;
    
    let newScroll;
    if (direction === 'left') {
      newScroll = Math.max(0, currentScroll - scrollAmount);
    } else {
      // For right scroll, if we can't move exactly 5 books, move to the end
      const remainingScroll = maxScroll - currentScroll;
      if (remainingScroll < scrollAmount) {
        newScroll = maxScroll; // Move to the end
      } else {
        newScroll = currentScroll + scrollAmount;
      }
    }

    container.scrollTo({
      left: newScroll,
      behavior: 'smooth'
    });

    setScrollPositions(prev => ({
      ...prev,
      [containerId]: newScroll
    }));
  };

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
      {/* Hero Section - Modern Design */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-orange-50"></div>
        <div className="relative max-w-7xl mx-auto px-8 lg:px-12 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Khám phá thế giới
              <span className="text-amber-600 block">sách</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Tìm kiếm và mua sách yêu thích của bạn với trải nghiệm mua sắm tuyệt vời
            </p>
            <Link 
              to="/books" 
              className="inline-flex items-center bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Khám phá ngay
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Books Section */}
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Sách nổi bật
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Những cuốn sách được yêu thích nhất, được lựa chọn cẩn thận cho bạn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {allBooks.slice(0, 10).map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            to="/books" 
            className="inline-flex items-center bg-amber-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Xem tất cả sách
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Categories Section */}
      {categories.map((category, index) => {
        const books = booksByCategory[category._id] || [];
        if (books.length === 0) return null;

        return (
          <div key={category._id} className={`py-20 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-8 lg:px-12">
              <div className="mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  {getCategoryTitle(category.name)}
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl">
                  {getCategorySubtitle(category.name)}
                </p>
              </div>

              <div className="relative">
                {/* Scroll buttons */}
                <button
                  onClick={() => handleScroll(category._id, 'left')}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-all duration-300 hover:shadow-xl"
                  aria-label="Scroll left"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleScroll(category._id, 'right')}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-all duration-300 hover:shadow-xl"
                  aria-label="Scroll right"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Books container */}
                <div 
                  id={`scroll-container-${category._id}`}
                  className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  {books.map((book) => (
                    <div key={book._id} className="flex-shrink-0 w-56">
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HomePage;