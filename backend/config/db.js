const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const adminEmail = 'admin@echo.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 12);
      await User.create({
        username: 'admin',
        nickname: 'System Admin',
        email: adminEmail,
        passwordHash,
        provider: 'local',
        isVerified: true,
        isAdmin: true,
      });
      console.log('✅ Default admin user seeded: admin@echo.com / admin123');
    }
  } catch (err) {
    console.error('❌ Error seeding admin user:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await seedAdmin();
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
