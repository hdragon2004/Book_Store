import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'

// Load environment variables
dotenv.config()

// Import models
import Role from '~/models/roleModel'
import User from '~/models/userModel'
import Category from '~/models/categoryModel'
import Book from '~/models/bookModel'
import Order from '~/models/orderModel'
import OrderItem from '~/models/orderItemModel'
import Favorite from '~/models/favoriteModel'
import Voucher from '~/models/voucherModel'
import VoucherUsage from '~/models/voucherUsageModel'
import Message from '~/models/messageModel'
import Address from '~/models/addressModel'
import Cart from '~/models/cartModel'
import UserBook from '~/models/userBookModel'
import EmailVerification from '~/models/emailVerificationModel'
import PasswordReset from '~/models/passwordResetModel'

// Connect to database
const connectDB = async () => {
  try {
    // Use MONGO_URI with authentication if available, otherwise use default
    const mongoUri = process.env.MONGO_URI || 'mongodb://admin:password123@localhost:27017/bookstore?authSource=admin'
    console.log('🔗 Connecting to MongoDB with URI:', mongoUri)
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to MongoDB for seeding')
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    process.exit(1)
  }
}

// Sample data - giữ nguyên categories và books
const sampleCategories = [
  {
    name: 'Fiction',
    description: 'Tiểu thuyết và truyện hư cấu bao gồm fantasy, khoa học viễn tưởng, lãng mạn và trinh thám'
  },
  {
    name: 'Non-Fiction',
    description: 'Sách phi hư cấu bao gồm tiểu sử, lịch sử, khoa học và tự phát triển bản thân'
  },
  {
    name: 'Technology',
    description: 'Sách công nghệ bao gồm lập trình, phát triển phần mềm và công nghệ thông tin'
  },
  {
    name: 'Business',
    description: 'Sách kinh doanh bao gồm khởi nghiệp, quản lý và tài chính'
  },
  {
    name: 'Education',
    description: 'Sách giáo dục và sách giáo khoa phục vụ học tập và mục đích học thuật'
  }
]

// Generate books for each category (10 books per category) - giữ nguyên
const generateBooksForCategory = (categoryName, categoryIndex) => {
  const books = []
  const formats = ['hardcover', 'paperback', 'ebook', 'audiobook']
  const languages = ['English', 'French', 'Spanish', 'German']
  const publishers = ['O\'Reilly Media', 'Addison-Wesley', 'Prentice Hall', 'Independently Published', 'Avery']
  
  for (let i = 0; i < 10; i++) {
    const bookIndex = categoryIndex * 10 + i + 1
    const format = formats[i % formats.length]
    const isDigital = ['ebook', 'audiobook'].includes(format)
    
    const book = {
      title: `${categoryName} Book ${bookIndex}`,
      author: `Author ${bookIndex}`,
      price: Math.floor(Math.random() * 100000) + 20000, // 20k-120k
      stock: isDigital ? 0 : Math.floor(Math.random() * 100) + 10,
      description: `A comprehensive ${categoryName.toLowerCase()} book covering essential topics and advanced concepts. Perfect for beginners and professionals alike.`,
      imageUrl: '', // No placeholder images
      isbn: `978${String(bookIndex).padStart(10, '0').slice(0, 10)}`, // Valid ISBN format
      publisher: publishers[i % publishers.length],
      publicationDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      pages: isDigital ? 0 : Math.floor(Math.random() * 500) + 200,
      format: format,
      dimensions: isDigital ? '' : `${Math.floor(Math.random() * 5) + 15} x ${Math.floor(Math.random() * 5) + 20} cm`,
      weight: isDigital ? 0 : Math.floor(Math.random() * 500) + 200,
      fileUrl: isDigital ? `https://example.com/book-${bookIndex}.${format === 'ebook' ? 'pdf' : 'mp3'}` : '',
      viewCount: Math.floor(Math.random() * 1000),
      isActive: true,
      status: 'available'
    }

    // Add digitalFile structure for digital books
    if (isDigital) {
      book.digitalFile = {
        filePath: `/storage/books/${format === 'ebook' ? 'ebooks' : 'audiobooks'}/book-${bookIndex}.${format === 'ebook' ? 'pdf' : 'mp3'}`,
        fileSize: Math.floor(Math.random() * 50000000) + 1000000, // 1MB to 50MB
        mimeType: format === 'ebook' ? 'application/pdf' : 'audio/mpeg'
      }
      
      if (format === 'audiobook') {
        book.digitalFile.duration = Math.floor(Math.random() * 7200) + 1800 // 30 minutes to 2 hours
      }
    }
    
    books.push(book)
  }
  return books
}

// Generate all books (10 per category = 50 total) - giữ nguyên
const sampleBooks = [
  ...generateBooksForCategory('Fiction', 0),
  ...generateBooksForCategory('Non-Fiction', 1),
  ...generateBooksForCategory('Technology', 2),
  ...generateBooksForCategory('Business', 3),
  ...generateBooksForCategory('Education', 4)
]

// Thêm dữ liệu mới cho các model khác
const sampleUsers = [
  {
    name: 'Admin User',
    fullName: 'Nguyễn Văn Admin',
    email: 'admin@bookstore.com',
    password: 'admin123',
    phone: '0323456789',
    address: '123 Admin Street, Ho Chi Minh City',
    isEmailVerified: true,
    status: 'active',
    isActive: true
  },
  {
    name: 'Regular User',
    fullName: 'Trần Thị User',
    email: 'user@bookstore.com',
    password: 'user123',
    phone: '0987654321',
    address: '456 User Avenue, Ho Chi Minh City',
    isEmailVerified: true,
    status: 'active',
    isActive: true
  },
  {
    name: 'Test User',
    fullName: 'Lê Văn Test',
    email: 'test@bookstore.com',
    password: 'test123',
    phone: '0369852147',
    address: '789 Test Road, Ho Chi Minh City',
    isEmailVerified: false,
    status: 'pending',
    isActive: false
  }
]

// Address seed data
const sampleAddresses = [
  {
    name: 'Nguyễn Văn Admin',
    phone: '0323456789',
    address: '123 Đường Admin',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    isDefault: true
  },
  {
    name: 'Trần Thị User',
    phone: '0987654321',
    address: '456 Đường User',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 2',
    ward: 'Phường Thủ Thiêm',
    isDefault: true
  },
  {
    name: 'Lê Văn Test',
    phone: '0369852147',
    address: '789 Đường Test',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường Võ Thị Sáu',
    isDefault: true
  },
  {
    name: 'Phạm Thị D',
    phone: '0912345678',
    address: '321 Đường GHI',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 7',
    ward: 'Phường Tân Phú',
    isDefault: false
  },
  {
    name: 'Hoàng Văn E',
    phone: '0987654321',
    address: '654 Đường JKL',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 10',
    ward: 'Phường 15',
    isDefault: false
  }
]

const sampleOrders = [
  {
    totalPrice: 125000,
    originalAmount: 125000,
    discountAmount: 0,
    paymentMethod: 'cod',
    status: 'pending',
    paymentStatus: 'pending',
    shippingAddressId: null // Will be set to first address ID
  },
  {
    totalPrice: 200000,
    originalAmount: 210000,
    discountAmount: 10000,
    paymentMethod: 'credit_card',
    status: 'shipped',
    paymentStatus: 'completed',
    transactionId: 'TXN001',
    paidAt: new Date(),
    shippingAddressId: null // Will be set to second address ID
  },
  {
    totalPrice: 350000,
    originalAmount: 375000,
    discountAmount: 25000,
    paymentMethod: 'bank_transfer',
    status: 'delivered',
    paymentStatus: 'completed',
    transactionId: 'TXN002',
    paidAt: new Date(),
    shippingAddressId: null // Will be set to third address ID
  },
  {
    totalPrice: 180000,
    originalAmount: 180000,
    discountAmount: 0,
    paymentMethod: 'credit_card',
    status: 'confirmed',
    paymentStatus: 'completed',
    transactionId: 'TXN003',
    paidAt: new Date(),
    shippingAddressId: null // Will be set to fourth address ID
  },
  {
    totalPrice: 95000,
    originalAmount: 100000,
    discountAmount: 5000,
    paymentMethod: 'cod',
    status: 'cancelled',
    paymentStatus: 'refunded',
    shippingAddressId: null // Will be set to fifth address ID
  },
  {
    totalPrice: 420000,
    originalAmount: 450000,
    discountAmount: 30000,
    paymentMethod: 'paypal',
    status: 'digital_delivered',
    paymentStatus: 'completed',
    transactionId: 'TXN004',
    paidAt: new Date(),
    shippingAddressId: null // Will be set to sixth address ID
  },
  {
    totalPrice: 275000,
    originalAmount: 290000,
    discountAmount: 15000,
    paymentMethod: 'bank_transfer',
    status: 'pending',
    paymentStatus: 'pending',
    shippingAddressId: null // Will be set to seventh address ID
  },
  {
    totalPrice: 165000,
    originalAmount: 165000,
    discountAmount: 0,
    paymentMethod: 'credit_card',
    status: 'shipped',
    paymentStatus: 'completed',
    transactionId: 'TXN005',
    paidAt: new Date(),
    shippingAddressId: null // Will be set to eighth address ID
  },
  {
    totalPrice: 320000,
    originalAmount: 340000,
    discountAmount: 20000,
    paymentMethod: 'bank_transfer',
    status: 'confirmed',
    paymentStatus: 'completed',
    transactionId: 'TXN006',
    paidAt: new Date(),
    shippingAddressId: null // Will be set to ninth address ID
  },
  {
    totalPrice: 75000,
    originalAmount: 75000,
    discountAmount: 0,
    paymentMethod: 'cod',
    status: 'pending',
    paymentStatus: 'pending',
    shippingAddressId: null // Will be set to tenth address ID
  },
  {
    totalPrice: 480000,
    originalAmount: 520000,
    discountAmount: 40000,
    paymentMethod: 'credit_card',
    status: 'delivered',
    paymentStatus: 'completed',
    transactionId: 'TXN007',
    paidAt: new Date(),
    shippingAddressId: null // Will be set to eleventh address ID
  },
  {
    totalPrice: 195000,
    originalAmount: 200000,
    discountAmount: 5000,
    paymentMethod: 'paypal',
    status: 'cancelled',
    paymentStatus: 'refunded',
    shippingAddressId: null // Will be set to twelfth address ID
  }
]

const sampleVouchers = [
  {
    code: 'WELCOME10',
    name: 'Welcome 10% Off',
    description: 'Giảm 10% cho khách hàng mới',
    type: 'percentage',
    value: 10,
    minOrderAmount: 100000,
    maxDiscountAmount: 50000,
    usageLimit: 100,
    usedCount: 0,
    validFrom: new Date(),
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true
  },
  {
    code: 'SAVE50K',
    name: 'Save 50K',
    description: 'Giảm 50,000 VND cho đơn hàng từ 200,000 VND',
    type: 'fixed_amount',
    value: 50000,
    minOrderAmount: 200000,
    maxDiscountAmount: 50000,
    usageLimit: 50,
    usedCount: 5,
    validFrom: new Date(),
    validTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    isActive: true
  }
]

// Cart seed data
const sampleCarts = [
  {
    items: [
      {
        quantity: 2,
        addedAt: new Date()
      },
      {
        quantity: 1,
        addedAt: new Date()
      }
    ]
  },
  {
    items: [
      {
        quantity: 3,
        addedAt: new Date()
      }
    ]
  }
]

// UserBook seed data for digital books
const sampleUserBooks = [
  {
    bookType: 'ebook',
    filePath: '/storage/books/ebooks/book-1.pdf',
    fileSize: 2500000,
    mimeType: 'application/pdf',
    downloadCount: 1,
    lastDownloadAt: new Date(),
    isActive: true
  },
  {
    bookType: 'audiobook',
    filePath: '/storage/books/audiobooks/book-2.mp3',
    fileSize: 15000000,
    mimeType: 'audio/mpeg',
    downloadCount: 2,
    lastDownloadAt: new Date(),
    isActive: true
  }
]

// Sample messages for chat system
const sampleMessages = [
  {
    conversationId: 'conv_001',
    content: 'Xin chào! Tôi cần hỗ trợ về đơn hàng của mình.',
    messageType: 'text',
    isRead: false
  },
  {
    conversationId: 'conv_001',
    content: 'Chào bạn! Tôi có thể giúp gì cho bạn? Vui lòng cho tôi biết mã đơn hàng.',
    messageType: 'text',
    isRead: true
  },
  {
    conversationId: 'conv_001',
    content: 'Đơn hàng của tôi có mã là #ORD001. Tôi muốn hủy đơn hàng này.',
    messageType: 'text',
    isRead: false
  },
  {
    conversationId: 'conv_001',
    content: 'Tôi đã kiểm tra đơn hàng #ORD001 của bạn. Đơn hàng đang trong quá trình xử lý. Bạn có thể hủy đơn hàng trong vòng 24h kể từ khi đặt.',
    messageType: 'text',
    isRead: true
  },
  {
    conversationId: 'conv_001',
    content: 'Cảm ơn bạn! Tôi muốn hủy đơn hàng này.',
    messageType: 'text',
    isRead: false
  },
  {
    conversationId: 'conv_001',
    content: 'Tôi đã hủy đơn hàng #ORD001 cho bạn. Tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc.',
    messageType: 'text',
    isRead: true
  },
  {
    conversationId: 'conv_002',
    content: 'Xin chào admin! Tôi có câu hỏi về sản phẩm.',
    messageType: 'text',
    isRead: false
  },
  {
    conversationId: 'conv_002',
    content: 'Chào bạn! Tôi sẵn sàng hỗ trợ bạn. Bạn muốn hỏi về sản phẩm nào?',
    messageType: 'text',
    isRead: true
  },
  {
    conversationId: 'conv_002',
    content: 'Tôi muốn hỏi về cuốn sách "JavaScript: The Good Parts". Còn hàng không?',
    messageType: 'text',
    isRead: false
  },
  {
    conversationId: 'conv_002',
    content: 'Cuốn "JavaScript: The Good Parts" hiện tại còn hàng. Giá là 150,000 VND. Bạn có muốn đặt hàng không?',
    messageType: 'text',
    isRead: true
  }
]




// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...')

    // Clear existing data
    await Role.deleteMany({})
    await User.deleteMany({})
    await Category.deleteMany({})
    await Book.deleteMany({})
    await Order.deleteMany({})
    await OrderItem.deleteMany({})
    await Favorite.deleteMany({})
    await Voucher.deleteMany({})
    await VoucherUsage.deleteMany({})
    await Message.deleteMany({})
    await Address.deleteMany({})
    await Cart.deleteMany({})
    await UserBook.deleteMany({})
    await EmailVerification.deleteMany({})
    await PasswordReset.deleteMany({})
    console.log('🧹 Cleared existing data')
    
    // Wait a bit to ensure deletion is complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create roles
    const adminRole = await Role.create({
      name: 'admin',
      description: 'Administrator role'
    })
    const userRole = await Role.create({
      name: 'user',
      description: 'Regular user role'
    })
    console.log('👥 Created roles:', adminRole.name, userRole.name)

    // Create users
    const users = []
    for (const userData of sampleUsers) {
      const user = new User({
        ...userData,
        roleId: userData.email === 'admin@bookstore.com' ? adminRole._id : userRole._id
      })
      await user.save()
      users.push(user)
    }
    console.log('👤 Created users:', users.length)

    // Create addresses for users
    const addresses = []
    for (let i = 0; i < sampleAddresses.length; i++) {
      const address = await Address.create({
        ...sampleAddresses[i],
        userId: users[i % users.length]._id
      })
      addresses.push(address)
    }
    console.log('🏠 Created addresses:', addresses.length)

    // Create categories
    const categories = await Category.insertMany(sampleCategories)
    console.log('📚 Created categories:', categories.length)

    // Create books with categories (giữ nguyên logic)
    const books = []
    for (let i = 0; i < sampleBooks.length; i++) {
      const categoryIndex = Math.floor(i / 10)
      const book = await Book.create({
        ...sampleBooks[i],
        categoryId: categories[categoryIndex]._id
      })
      books.push(book)
    }
    console.log('📖 Created books:', books.length)

    // Create orders
    const orders = []
    for (let i = 0; i < sampleOrders.length; i++) {
      const order = await Order.create({
        ...sampleOrders[i],
        userId: users[1]._id, // Regular user
        shippingAddressId: addresses[i % addresses.length]._id // Assign address ID
      })
      orders.push(order)
      console.log(`🛒 Created order ${i + 1}: ${order.orderCode} - ${order.status} - ${order.totalPrice.toLocaleString('vi-VN')} ₫`)
    }
    console.log('🛒 Total orders created:', orders.length)

    // Create order items
    const orderItems = []
    for (let i = 0; i < orders.length; i++) {
      const book = books[i % books.length]
      const quantity = Math.floor(Math.random() * 3) + 1
      const orderItem = await OrderItem.create({
        orderId: orders[i]._id,
        bookId: book._id,
        quantity: quantity,
        priceAtPurchase: book.price
      })
      orderItems.push(orderItem)
    }
    console.log('📦 Created order items:', orderItems.length)

    // Create favorites
    const favorites = []
    for (let i = 0; i < Math.min(2, books.length); i++) {
      const favorite = await Favorite.create({
        userId: users[1]._id, // Regular user
        bookId: books[i]._id,
        isFavourite: true
      })
      favorites.push(favorite)
    }
    console.log('❤️ Created favorites:', favorites.length)

    // Create vouchers
    const vouchers = []
    for (let i = 0; i < sampleVouchers.length; i++) {
      const voucher = await Voucher.create({
        ...sampleVouchers[i],
        createdBy: users[0]._id // Admin user
      })
      vouchers.push(voucher)
    }
    console.log('🎫 Created vouchers:', vouchers.length)

    // Create voucher usages
    const voucherUsages = []
    for (let i = 0; i < 2; i++) {
      const voucherUsage = await VoucherUsage.create({
        voucherId: vouchers[i]._id,
        userId: users[1]._id, // Regular user
        orderId: orders[i]._id,
        voucherCode: vouchers[i].code,
        discountAmount: vouchers[i].value,
        orderAmount: orders[i].totalPrice
      })
      voucherUsages.push(voucherUsage)
    }
    console.log('🎫 Created voucher usages:', voucherUsages.length)

    // Create carts
    const carts = []
    for (let i = 0; i < sampleCarts.length; i++) {
      const cart = await Cart.create({
        ...sampleCarts[i],
        userId: users[i % users.length]._id,
        items: sampleCarts[i].items.map((item, itemIndex) => ({
          ...item,
          bookId: books[itemIndex % books.length]._id
        }))
      })
      carts.push(cart)
    }
    console.log('🛒 Created carts:', carts.length)

    // Create user books (digital book ownership)
    const userBooks = []
    for (let i = 0; i < sampleUserBooks.length; i++) {
      const userBook = await UserBook.create({
        ...sampleUserBooks[i],
        userId: users[1]._id, // Regular user
        bookId: books[i % books.length]._id,
        orderId: orders[i % orders.length]._id
      })
      userBooks.push(userBook)
    }
    console.log('📚 Created user books:', userBooks.length)

    // Create messages
    const messages = []
    for (let i = 0; i < sampleMessages.length; i++) {
      const message = await Message.create({
        ...sampleMessages[i],
        fromId: i % 2 === 0 ? users[1]._id : users[0]._id, // Alternate between regular user and admin
        toId: i % 2 === 0 ? users[0]._id : users[1]._id
      })
      messages.push(message)
    }
    console.log('💬 Created messages:', messages.length)

    // Create email verifications
    const emailVerifications = []
    for (let i = 0; i < 3; i++) {
      const emailVerification = await EmailVerification.create({
        email: users[i].email,
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        attempts: 0,
        isUsed: i === 0 // First one is used
      })
      emailVerifications.push(emailVerification)
    }
    console.log('📧 Created email verifications:', emailVerifications.length)

    // Create password resets
    const passwordResets = []
    for (let i = 0; i < 2; i++) {
      const passwordReset = await PasswordReset.create({
        email: users[i].email,
        token: require('crypto').randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
        attempts: 0,
        isUsed: false
      })
      passwordResets.push(passwordReset)
    }
    console.log('🔐 Created password resets:', passwordResets.length)





    console.log('✅ Database seeding completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`👑 Admin user: admin@bookstore.com / admin123`)
    console.log(`👤 Regular user: user@bookstore.com / user123`)
    console.log(`👤 Test user: test@bookstore.com / test123`)
    console.log(`📚 Categories: ${categories.length}`)
    console.log(`📖 Books: ${books.length}`)
    console.log(`🏠 Addresses: ${addresses.length}`)
    console.log(`🛒 Orders: ${orders.length}`)
    console.log(`📦 Order items: ${orderItems.length}`)
    console.log(`❤️ Favorites: ${favorites.length}`)
    console.log(`🎫 Vouchers: ${vouchers.length}`)
    console.log(`🎫 Voucher usages: ${voucherUsages.length}`)
    console.log(`🛒 Carts: ${carts.length}`)
    console.log(`📚 User books: ${userBooks.length}`)
    console.log(`💬 Messages: ${messages.length}`)
    console.log(`📧 Email verifications: ${emailVerifications.length}`)
    console.log(`🔐 Password resets: ${passwordResets.length}`)
    
    console.log('\n🛒 Order Details:')
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderCode} - ${order.status} - ${order.totalPrice.toLocaleString('vi-VN')} ₫`)
    })

  } catch (error) {
    console.error('❌ Seeding error:', error.message)
    console.error(error)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
    process.exit(0)
  }
}

// Run seeding
const runSeed = async () => {
  await connectDB()
  await seedDatabase()
}

runSeed()