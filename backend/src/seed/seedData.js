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
import Ticket from '~/models/ticketModel'
import TicketMessage from '~/models/ticketMessageModel'
import Message from '~/models/messageModel'

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
    
    books.push({
      title: `${categoryName} Book ${bookIndex}`,
      author: `Author ${bookIndex}`,
      price: Math.floor(Math.random() * 100000) + 20000, // 20k-120k
      stock: isDigital ? 0 : Math.floor(Math.random() * 100) + 10,
      description: `A comprehensive ${categoryName.toLowerCase()} book covering essential topics and advanced concepts. Perfect for beginners and professionals alike.`,
      imageUrl: '', // No placeholder images
      isbn: `978${String(bookIndex).padStart(10, '0').slice(0, 10)}`, // Valid ISBN format
      publisher: publishers[i % publishers.length],
      publicationDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      language: languages[i % languages.length],
      pages: isDigital ? 0 : Math.floor(Math.random() * 500) + 200,
      format: format,
      dimensions: isDigital ? '' : `${Math.floor(Math.random() * 5) + 15} x ${Math.floor(Math.random() * 5) + 20} cm`,
      weight: isDigital ? 0 : Math.floor(Math.random() * 500) + 200,
      fileUrl: isDigital ? `https://example.com/book-${bookIndex}.${format === 'ebook' ? 'pdf' : 'mp3'}` : '',
      viewCount: Math.floor(Math.random() * 1000)
    })
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
    email: 'admin@bookstore.com',
    password: 'admin123',
    phone: '0123456789',
    address: '123 Admin Street, Ho Chi Minh City'
  },
  {
    name: 'Regular User',
    email: 'user@bookstore.com',
    password: 'user123',
    phone: '0987654321',
    address: '456 User Avenue, Ho Chi Minh City'
  }
]

const sampleOrders = [
  {
    totalPrice: 125000,
    discountAmount: 0,
    paymentMethod: 'cod',
    status: 'pending',
    shippingAddress: {
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      address: '123 Đường ABC',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé'
    }
  },
  {
    totalPrice: 200000,
    discountAmount: 10000,
    paymentMethod: 'credit_card',
    status: 'shipped',
    shippingAddress: {
      name: 'Trần Thị B',
      phone: '0987654321',
      address: '456 Đường XYZ',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 2',
      ward: 'Phường Thủ Thiêm'
    }
  },
  {
    totalPrice: 350000,
    discountAmount: 25000,
    paymentMethod: 'bank_transfer',
    status: 'delivered',
    shippingAddress: {
      name: 'Lê Văn C',
      phone: '0369852147',
      address: '789 Đường DEF',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 3',
      ward: 'Phường Võ Thị Sáu'
    }
  },
  {
    totalPrice: 180000,
    discountAmount: 0,
    paymentMethod: 'credit_card',
    status: 'confirmed',
    shippingAddress: {
      name: 'Phạm Thị D',
      phone: '0912345678',
      address: '321 Đường GHI',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 7',
      ward: 'Phường Tân Phú'
    }
  },
  {
    totalPrice: 95000,
    discountAmount: 5000,
    paymentMethod: 'cod',
    status: 'cancelled',
    shippingAddress: {
      name: 'Hoàng Văn E',
      phone: '0987654321',
      address: '654 Đường JKL',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 10',
      ward: 'Phường 15'
    }
  },
  {
    totalPrice: 420000,
    discountAmount: 30000,
    paymentMethod: 'paypal',
    status: 'digital_delivered',
    shippingAddress: {
      name: 'Võ Thị F',
      phone: '0123456789',
      address: '987 Đường MNO',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận Bình Thạnh',
      ward: 'Phường 25'
    }
  },
  {
    totalPrice: 275000,
    discountAmount: 15000,
    paymentMethod: 'bank_transfer',
    status: 'pending',
    shippingAddress: {
      name: 'Đặng Văn G',
      phone: '0369852147',
      address: '147 Đường PQR',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận Tân Bình',
      ward: 'Phường 4'
    }
  },
  {
    totalPrice: 165000,
    discountAmount: 0,
    paymentMethod: 'credit_card',
    status: 'shipped',
    shippingAddress: {
      name: 'Bùi Thị H',
      phone: '0912345678',
      address: '258 Đường STU',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận Phú Nhuận',
      ward: 'Phường 2'
    }
  },
  {
    totalPrice: 320000,
    discountAmount: 20000,
    paymentMethod: 'bank_transfer',
    status: 'confirmed',
    shippingAddress: {
      name: 'Nguyễn Thị I',
      phone: '0987654321',
      address: '369 Đường VWX',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 12',
      ward: 'Phường 6'
    }
  },
  {
    totalPrice: 75000,
    discountAmount: 0,
    paymentMethod: 'cod',
    status: 'pending',
    shippingAddress: {
      name: 'Trần Văn J',
      phone: '0123456789',
      address: '741 Đường YZA',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 11',
      ward: 'Phường 3'
    }
  },
  {
    totalPrice: 480000,
    discountAmount: 40000,
    paymentMethod: 'credit_card',
    status: 'delivered',
    shippingAddress: {
      name: 'Lê Thị K',
      phone: '0369852147',
      address: '852 Đường BCD',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 5',
      ward: 'Phường 8'
    }
  },
  {
    totalPrice: 195000,
    discountAmount: 5000,
    paymentMethod: 'paypal',
    status: 'cancelled',
    shippingAddress: {
      name: 'Phạm Văn L',
      phone: '0912345678',
      address: '963 Đường EFG',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 6',
      ward: 'Phường 1'
    }
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

const sampleTickets = [
  {
    ticketNumber: 'TKT-001',
    subject: 'Vấn đề với đơn hàng #12345',
    description: 'Tôi không nhận được đơn hàng đã đặt từ 3 ngày trước',
    priority: 'high',
    status: 'open',
    category: 'order_issue'
  },
  {
    ticketNumber: 'TKT-002',
    subject: 'Yêu cầu hoàn tiền',
    description: 'Tôi muốn hoàn tiền cho sản phẩm bị lỗi',
    priority: 'medium',
    status: 'in_progress',
    category: 'return_refund'
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
    await Ticket.deleteMany({})
    await TicketMessage.deleteMany({})
    await Message.deleteMany({})
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
        userId: users[1]._id // Regular user
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

    // Create tickets
    const tickets = []
    for (let i = 0; i < sampleTickets.length; i++) {
      const ticket = await Ticket.create({
        ...sampleTickets[i],
        userId: users[1]._id // Regular user
      })
      tickets.push(ticket)
    }
    console.log('🎫 Created tickets:', tickets.length)




    console.log('✅ Database seeding completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`👑 Admin user: admin@bookstore.com / admin123`)
    console.log(`👤 Regular user: user@bookstore.com / user123`)
    console.log(`📚 Categories: ${categories.length}`)
    console.log(`📖 Books: ${books.length}`)
    console.log(`🛒 Orders: ${orders.length}`)
    console.log(`📦 Order items: ${orderItems.length}`)
    console.log(`❤️ Favorites: ${favorites.length}`)
    console.log(`🎫 Vouchers: ${vouchers.length}`)
    console.log(`🎫 Voucher usages: ${voucherUsages.length}`)
    console.log(`🎫 Tickets: ${tickets.length}`)
    
    console.log('\n🛒 Order Details:')
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderCode} - ${order.status} - ${order.totalPrice.toLocaleString('vi-VN')} ₫ - ${order.shippingAddress.name}`)
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