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

let connectionPromise = null;
let lastRequestTime = 0;

export const connectDB = async (env) => {
    const now = Date.now();
    const isRecentlyActive = (now - lastRequestTime) < 10000; // 10 seconds threshold
    lastRequestTime = now;

    // If we think we are connected, check if the connection is recently active
    if (mongoose.connection.readyState === 1) {
        if (isRecentlyActive) {
            // Connection is active and warm, skip any checks and reuse instantly
            return;
        } else {
            // Isolate was idle/frozen, connection might be stale. Reset and reconnect.
            console.log('⚠️ MongoDB connection idle limit exceeded. Reconnecting...');
            try {
                await mongoose.connection.close();
            } catch (e) { }
        }
    }

    // If already in the process of connecting, reuse that connection promise to prevent socket collisions
    if (connectionPromise) {
        await connectionPromise;
        return;
    }

    try {
        connectionPromise = mongoose.connect(env.MONGO_URI, {
            autoIndex: false, // Disable auto indexing in production to avoid CPU time-outs on cold starts
            maxPoolSize: 1,   // Set pool size to 1 to reduce TLS handshakes and save critical CPU cycles
            minPoolSize: 0,   // Do not keep idle connections open
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 10000,         // Timeout socket after 10s
            connectTimeoutMS: 5000,         // Timeout connection handshake after 5s
            family: 4,                      // Force IPv4 (faster DNS lookups in Cloudflare Workers)
        });

        await connectionPromise;
        console.log('✅ MongoDB Connected successfully.');

        // Only seed admin in development to save critical CPU time on worker instances
        if (env.NODE_ENV === 'development') {
            await seedAdmin();
        }
    } catch (error) {
        console.error(`❌ MongoDB Error: ${error.message}`);
        throw error;
    } finally {
        connectionPromise = null;
    }
};
