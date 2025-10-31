import React from 'react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-orange-50 via-white to-blue-50 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">Về Chúng Tôi</h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Chào mừng bạn đến với BOOKSTORE - Thế giới sách số của bạn
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20">
        {/* Mission Section */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <img
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop"
                alt="Sách và kiến thức"
                className="w-full h-96 object-cover rounded-2xl"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Sứ Mệnh Của Chúng Tôi</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                BOOKSTORE được thành lập với sứ mệnh mang đến cho độc giả Việt Nam một thế giới sách số 
                phong phú, đa dạng và dễ tiếp cận. Chúng tôi tin rằng kiến thức không có giới hạn và mọi người 
                đều có quyền được tiếp cận với những tác phẩm văn học, sách khoa học, và tài liệu học tập chất lượng cao.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Với hàng ngàn đầu sách được số hóa chất lượng cao, chúng tôi cam kết mang đến trải nghiệm đọc 
                tuyệt vời nhất cho mọi độc giả, từ học sinh, sinh viên đến các chuyên gia.
              </p>
            </div>
          </div>
        </div>

        {/* Vision Section */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row-reverse items-center gap-12">
            <div className="flex-1">
              <img
                src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop"
                alt="Thư viện hiện đại"
                className="w-full h-96 object-cover rounded-2xl"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Tầm Nhìn</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Chúng tôi mong muốn trở thành nền tảng sách số hàng đầu tại Việt Nam, nơi mọi người có thể 
                khám phá, mua sắm và đọc những cuốn sách yêu thích một cách thuận tiện nhất.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Với công nghệ hiện đại và dịch vụ chăm sóc khách hàng tận tâm, chúng tôi cam kết mang đến trải nghiệm tốt nhất 
                cho độc giả, góp phần xây dựng một cộng đồng đọc sách văn minh và phát triển.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Giá Trị Cốt Lõi</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Những giá trị định hướng cho mọi hoạt động của chúng tôi
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-6">
                <img
                  src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop"
                  alt="Chất lượng"
                  className="w-full h-64 object-cover rounded-xl mb-4"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Chất Lượng</h3>
              <p className="text-gray-600 leading-relaxed">
                Chúng tôi chỉ cung cấp những cuốn sách chất lượng cao, được chọn lọc kỹ lưỡng và biên tập chuyên nghiệp
              </p>
            </div>
            <div className="text-center">
              <div className="mb-6">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop"
                  alt="Tận tâm"
                  className="w-full h-64 object-cover rounded-xl mb-4"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Tận Tâm</h3>
              <p className="text-gray-600 leading-relaxed">
                Đặt khách hàng làm trung tâm, luôn lắng nghe và phục vụ với tất cả tâm huyết
              </p>
            </div>
            <div className="text-center">
              <div className="mb-6">
                <img
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop"
                  alt="Đổi mới"
                  className="w-full h-64 object-cover rounded-xl mb-4"
                />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Đổi Mới</h3>
              <p className="text-gray-600 leading-relaxed">
                Không ngừng cải tiến công nghệ và dịch vụ để mang lại trải nghiệm tốt hơn mỗi ngày
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop"
                alt="Đội ngũ BOOKSTORE"
                className="w-full h-96 object-cover rounded-2xl"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Đội Ngũ Của Chúng Tôi</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                BOOKSTORE được vận hành bởi một đội ngũ trẻ trung, nhiệt huyết và giàu kinh nghiệm. 
                Chúng tôi có những chuyên gia về công nghệ, biên tập viên sách, và đội ngũ chăm sóc khách hàng 
                luôn sẵn sàng hỗ trợ bạn 24/7.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Chúng tôi tự hào về sự đa dạng và sáng tạo của đội ngũ, luôn làm việc với tinh thần 
                hợp tác và cống hiến để mang đến những giá trị tốt nhất cho cộng đồng độc giả.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-3xl overflow-hidden mb-20">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative p-12 md:p-16 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Có Câu Hỏi?</h2>
            <p className="text-xl md:text-2xl mb-8 opacity-95 max-w-2xl mx-auto">
              Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với chúng tôi!
            </p>
            <a
              href="/contact"
              className="inline-block bg-white text-orange-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all transform hover:scale-105"
            >
              Liên Hệ Ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
