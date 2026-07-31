const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

// Load .env from server root
dotenv.config({ path: path.join(__dirname, '.env') });

const seedAdmin = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    // Remove deprecated options
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ Connected to MongoDB');
    
    const adminExists = await User.findOne({ email: 'admin@newssketch.com' });
    if (!adminExists) {
      console.log('🔧 Creating admin user...');
      await User.create({
        name: 'Admin',
        email: 'admin@newssketch.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();