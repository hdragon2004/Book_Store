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

// Sample data
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

// Generate books for each category (10 books per category)
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
      imageUrl: `https://via.placeholder.com/300x400?text=${categoryName}+${bookIndex}`,
      isbn: `978-${String(bookIndex).padStart(10, '0')}`,
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

// Generate all books (10 per category = 50 total)
const sampleBooks = [
  ...generateBooksForCategory('Fiction', 0),
  ...generateBooksForCategory('Non-Fiction', 1),
  ...generateBooksForCategory('Technology', 2),
  ...generateBooksForCategory('Business', 3),
  ...generateBooksForCategory('Education', 4)
]

const sampleOrders = [
  {
    totalPrice: 125000,
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
    totalPrice: 150000,
    paymentMethod: 'paypal',
    status: 'delivered',
    shippingAddress: {
      name: 'Lê Văn C',
      phone: '0369258147',
      address: '789 Đường DEF',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 3',
      ward: 'Phường Võ Thị Sáu'
    }
  },
  {
    totalPrice: 300000,
    paymentMethod: 'cod',
    status: 'confirmed',
    shippingAddress: {
      name: 'Phạm Thị D',
      phone: '0147258369',
      address: '321 Đường GHI',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 4',
      ward: 'Phường 14'
    }
  },
  {
    totalPrice: 180000,
    paymentMethod: 'credit_card',
    status: 'cancelled',
    shippingAddress: {
      name: 'Hoàng Văn E',
      phone: '0527419630',
      address: '654 Đường JKL',
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 5',
      ward: 'Phường 8'
    }
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
    console.log('🧹 Cleared existing data')
    
    // Wait a bit to ensure deletion is complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create roles first
    const adminRole = await Role.create({
      name: 'admin',
      description: 'Administrator role'
    })
    const userRole = await Role.create({
      name: 'user',
      description: 'Regular user role'
    })
    console.log('👥 Created roles:', adminRole.name, userRole.name)

    // Create admin user with plain password (let pre-save middleware handle hashing)
    const adminUser = new User({
      name: 'Admin',
      email: 'admin@bookstore.com',
      password: 'admin123', // Plain password
      roleId: adminRole._id,
      phone: '0123456789',
      address: 'Admin Address'
    })
    
    // Let pre-save middleware handle password hashing
    await adminUser.save()
    console.log('👑 Created admin user:', adminUser.email)

    // Create regular user with plain password (let pre-save middleware handle hashing)
    const regularUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'user123', // Plain password
      roleId: userRole._id,
      phone: '0987654321',
      address: 'User Address'
    })
    
    // Let pre-save middleware handle password hashing
    await regularUser.save()
    console.log('👤 Created regular user:', regularUser.email)
    
    // Verify user was created correctly
    const verifyUser = await User.findOne({ email: 'test@example.com' }).select('+password')
    console.log('🔍 Verify user password hash:', verifyUser.password.substring(0, 20) + '...')
    const verifyCompare = await bcrypt.compare('user123', verifyUser.password)
    console.log('🔍 Verify password compare:', verifyCompare)

    // Create categories
    const categories = await Category.insertMany(sampleCategories)
    console.log('📚 Created categories:', categories.length)

    // Create books with categories (10 books per category)
    const books = []
    for (let i = 0; i < sampleBooks.length; i++) {
      // Calculate which category this book belongs to (10 books per category)
      const categoryIndex = Math.floor(i / 10)
      const book = await Book.create({
        ...sampleBooks[i],
        categoryId: categories[categoryIndex]._id
      })
      books.push(book)
    }
    console.log('📖 Created books:', books.length)
    
    // Log books per category
    for (let i = 0; i < categories.length; i++) {
      const categoryBooks = books.filter(book => book.categoryId.toString() === categories[i]._id.toString())
      console.log(`📚 ${categories[i].name}: ${categoryBooks.length} books`)
    }

    // Create orders for regular user
    const orders = []
    for (let i = 0; i < sampleOrders.length; i++) {
      const order = await Order.create({
        ...sampleOrders[i],
        userId: regularUser._id
      })
      orders.push(order)
    }
    console.log('🛒 Created orders:', orders.length)

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

    // Create favorites for regular user
    const favorites = []
    for (let i = 0; i < Math.min(3, books.length); i++) {
      const favorite = await Favorite.create({
        userId: regularUser._id,
        bookId: books[i]._id,
        isFavourite: true
      })
      favorites.push(favorite)
    }
    console.log('❤️ Created favorites:', favorites.length)

    // Log digital books info
    const digitalBooks = books.filter(book => book.isDigital())
    const physicalBooks = books.filter(book => book.isPhysical())
    console.log(`📱 Digital books: ${digitalBooks.length}`)
    console.log(`📚 Physical books: ${physicalBooks.length}`)

    console.log('✅ Database seeding completed successfully!')
    console.log('\n📋 Summary:')
    console.log(`👑 Admin user: admin@bookstore.com / admin123`)
    console.log(`👤 Regular user: test@example.com / user123`)
    console.log(`📚 Categories: ${categories.length}`)
    console.log(`📖 Books: ${books.length}`)
    console.log(`🛒 Orders: ${orders.length}`)
    console.log(`📦 Order items: ${orderItems.length}`)
    console.log(`❤️ Favorites: ${favorites.length}`)

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
