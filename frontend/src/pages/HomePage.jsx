import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookAPI, categoryAPI } from '../services/apiService';
import BookCard from '../components/BookCard';

const HomePage = () => {
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
        setLoading(true);
        
        // Fetch all books first
        const allBooksResponse = await bookAPI.getBooks({ limit: 20 });
        setAllBooks(allBooksResponse.data.data?.books || []);
        
        // Fetch categories
        const categoriesResponse = await categoryAPI.getCategories();
        const categoriesData = categoriesResponse.data.data?.categories || [];
        setCategories(categoriesData);

        // Fetch books for each category
        const booksByCategoryData = {};
        for (const category of categoriesData) {
          try {
            const booksResponse = await bookAPI.getBooks({ 
              category: category._id, 
              limit: 8,
              sortBy: 'createdAt',
              sortOrder: 'desc'
            });
            booksByCategoryData[category._id] = booksResponse.data.data?.books || [];
          } catch (err) {
            console.error(`Error fetching books for category ${category.name}:`, err);
            booksByCategoryData[category._id] = [];
          }
        }
        
        setBooksByCategory(booksByCategoryData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Fixed Banner */}
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <section 
          className="relative text-white overflow-hidden rounded-lg"
          style={{
            backgroundImage: "url('/images/banner1.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            height: '400px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-20 z-10"></div>
          
          {/* Content */}
          <div className="relative z-20 flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Khám phá thế giới sách
              </h1>
              <p className="text-xl md:text-2xl mb-8">
                Tìm kiếm và mua sách yêu thích của bạn
              </p>
              <Link 
                to="/books" 
                className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Xem tất cả sách
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Featured Books Section */}
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Sách nổi bật
          </h2>
          <p className="text-gray-600 text-lg">
            Những cuốn sách được yêu thích nhất
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {allBooks.slice(0, 10).map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/books" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Xem tất cả sách
          </Link>
        </div>
      </div>

      {/* Categories Section */}
      {categories.map((category) => {
        const books = booksByCategory[category._id] || [];
        if (books.length === 0) return null;

        return (
          <div key={category._id} className="max-w-7xl mx-auto px-8 lg:px-12 py-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {getCategoryTitle(category.name)}
              </h2>
              <p className="text-gray-600 text-lg">
                {getCategorySubtitle(category.name)}
              </p>
            </div>

            <div className="relative">
              {/* Scroll buttons */}
              <button
                onClick={() => handleScroll(category._id, 'left')}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                aria-label="Scroll left"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => handleScroll(category._id, 'right')}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
                aria-label="Scroll right"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Books container */}
              <div 
                id={`scroll-container-${category._id}`}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
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
        );
      })}
    </div>
  );
};

export default HomePage;