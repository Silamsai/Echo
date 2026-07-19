import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

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

export const connectDB = async (env) => {
    if (mongoose.connection.readyState === 1) return;
    try {
        const conn = await mongoose.connect(env.MONGO_URI, {
            autoIndex: false, // Disable auto indexing in production to avoid CPU time-outs on cold starts
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Only seed admin in development to save critical CPU time on worker instances
        if (env.NODE_ENV === 'development') {
            await seedAdmin();
        }
    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        throw error;
    }
};
