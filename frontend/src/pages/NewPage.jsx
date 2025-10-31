import React, { useState } from 'react';

const NewPage = () => {
  const [selectedNews, setSelectedNews] = useState(null);

  const news = [
    {
      id: 1,
      title: 'Ra Mắt Sách Mới: Bộ Sưu Tập Kinh Điển 2024',
      date: '15/11/2024',
      author: 'BOOKSTORE Team',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop',
      category: 'Sách Mới',
      content: `Chúng tôi vui mừng thông báo về bộ sưu tập sách kinh điển mới nhất của năm 2024. 
      Bộ sưu tập này bao gồm những tác phẩm nổi tiếng từ các tác giả hàng đầu thế giới, 
      được dịch và biên tập kỹ lưỡng để phục vụ độc giả Việt Nam.`,
      fullContent: `Chúng tôi vui mừng thông báo về bộ sưu tập sách kinh điển mới nhất của năm 2024. 
      Bộ sưu tập này bao gồm những tác phẩm nổi tiếng từ các tác giả hàng đầu thế giới, 
      được dịch và biên tập kỹ lưỡng để phục vụ độc giả Việt Nam.

      Các tác phẩm trong bộ sưu tập bao gồm:
      - Văn học kinh điển thế giới
      - Khoa học viễn tưởng đương đại
      - Tiểu thuyết lịch sử
      - Sách self-help và phát triển bản thân
      
      Tất cả đều được số hóa chất lượng cao, dễ đọc trên mọi thiết bị. Hãy khám phá ngay hôm nay!`
    },
    {
      id: 2,
      title: 'Cập Nhật Tính Năng Đọc Sách Mới',
      date: '10/11/2024',
      author: 'BOOKSTORE Team',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop',
      category: 'Công Nghệ',
      content: `Chúng tôi đã cập nhật các tính năng đọc sách mới với nhiều cải tiến đáng kể. 
      Giờ đây bạn có thể đọc sách offline, đánh dấu trang, ghi chú và chia sẻ với bạn bè dễ dàng hơn.`,
      fullContent: `Chúng tôi đã cập nhật các tính năng đọc sách mới với nhiều cải tiến đáng kể:
      
      ✨ Tính năng mới:
      - Đọc offline: Tải sách về và đọc mọi lúc mọi nơi
      - Đánh dấu trang tự động
      - Ghi chú và highlight
      - Chia sẻ trích dẫn yêu thích
      - Đọc nhanh (speed reading)
      - Chế độ tối để bảo vệ mắt
      
      Tất cả tính năng này được tích hợp miễn phí cho tất cả thành viên!`
    },
    {
      id: 3,
      title: 'Khuyến Mãi Đặc Biệt: Giảm 50% Cho Học Sinh, Sinh Viên',
      date: '05/11/2024',
      author: 'BOOKSTORE Team',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
      category: 'Khuyến Mãi',
      content: `Nhân dịp năm học mới, BOOKSTORE dành tặng chương trình khuyến mãi đặc biệt: 
      Giảm 50% cho tất cả học sinh, sinh viên khi mua sách giáo khoa và tài liệu học tập.`,
      fullContent: `Nhân dịp năm học mới, BOOKSTORE dành tặng chương trình khuyến mãi đặc biệt: 
      Giảm 50% cho tất cả học sinh, sinh viên khi mua sách giáo khoa và tài liệu học tập.
      
      📚 Áp dụng cho:
      - Sách giáo khoa từ lớp 1 đến lớp 12
      - Giáo trình đại học
      - Tài liệu tham khảo
      - Sách ôn thi
      
      💡 Điều kiện:
      - Có thẻ học sinh/sinh viên hợp lệ
      - Đăng ký tài khoản và xác minh thông tin
      
      Chương trình áp dụng đến hết tháng 12/2024!`
    },
    {
      id: 4,
      title: 'Sự Kiện: Hội Sách Online 2024',
      date: '01/11/2024',
      author: 'BOOKSTORE Team',
      image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&h=600&fit=crop',
      category: 'Sự Kiện',
      content: `Tham gia Hội Sách Online 2024 với hàng ngàn đầu sách giảm giá lên đến 70%. 
      Cơ hội tuyệt vời để bổ sung vào tủ sách của bạn!`,
      fullContent: `Tham gia Hội Sách Online 2024 với hàng ngàn đầu sách giảm giá lên đến 70%. 
      Cơ hội tuyệt vời để bổ sung vào tủ sách của bạn!
      
      📅 Thời gian: Từ ngày 1/11 đến 30/11/2024
      🎁 Ưu đãi:
      - Giảm 70% cho các bộ sách bán chạy
      - Miễn phí vận chuyển cho đơn hàng trên 200.000đ
      - Tặng kèm ebook độc quyền
      - Rút thăm trúng thưởng iPad, Kindle
      
      Đừng bỏ lỡ cơ hội này!`
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">Tin Tức</h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Cập nhật những thông tin mới nhất về sách, khuyến mãi và sự kiện
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {news.map((item) => (
            <article
              key={item.id}
              className="group cursor-pointer"
              onClick={() => setSelectedNews(item)}
            >
              <div className="relative overflow-hidden rounded-2xl mb-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4">
                  <span className="bg-white text-orange-600 text-xs font-semibold px-4 py-2 rounded-full shadow-md">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500 gap-4">
                  <span>{item.date}</span>
                  <span>•</span>
                  <span>{item.author}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 line-clamp-3 leading-relaxed">
                  {item.content}
                </p>
                <button className="text-orange-600 font-semibold hover:text-orange-700 transition-colors flex items-center gap-2">
                  Đọc thêm
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Modal for Full News */}
        {selectedNews && (
          <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setSelectedNews(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={selectedNews.image}
                  alt={selectedNews.title}
                  className="w-full h-96 object-cover"
                />
                <button
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-2xl shadow-lg"
                >
                  ×
                </button>
              </div>
              <div className="p-8 md:p-12">
                <div className="mb-6">
                  <span className="bg-orange-100 text-orange-600 text-sm font-semibold px-4 py-2 rounded-full inline-block mb-4">
                    {selectedNews.category}
                  </span>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    {selectedNews.title}
                  </h2>
                  <div className="flex items-center text-gray-500 gap-4">
                    <span>{selectedNews.date}</span>
                    <span>•</span>
                    <span>{selectedNews.author}</span>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                    {selectedNews.fullContent}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative p-12 md:p-16 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Đăng Ký Nhận Tin</h2>
            <p className="text-xl md:text-2xl mb-8 opacity-95 max-w-2xl mx-auto">
              Nhận thông tin về sách mới, khuyến mãi và sự kiện đặc biệt
            </p>
            <div className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50 text-lg"
              />
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-lg">
                Đăng Ký
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPage;
