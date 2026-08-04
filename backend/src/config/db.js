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

const pingMongo = async () => {
    await Promise.race([
        mongoose.connection.db.admin().command({ ping: 1 }),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Mongo ping timeout')), 2500)
        ),
    ]);
};

export const connectDB = async (env) => {
    if (!env?.MONGO_URI) {
        throw new Error('MONGO_URI is not configured.');
    }

    // Cloudflare freezes isolates — TCP sockets die while mongoose still reports connected.
    if (mongoose.connection.readyState === 1) {
        try {
            await pingMongo();
            return;
        } catch (err) {
            console.log('⚠️ Stale MongoDB connection detected, reconnecting...', err.message);
            connectionPromise = null;
            try {
                await mongoose.disconnect();
            } catch {
                // ignore — connection may already be dead
            }
        }
    }

    if (mongoose.connection.readyState === 2 && connectionPromise) {
        await connectionPromise;
        try {
            await pingMongo();
            return;
        } catch {
            connectionPromise = null;
        }
    }

    if (connectionPromise) {
        await connectionPromise;
        return;
    }

    try {
        connectionPromise = mongoose.connect(env.MONGO_URI, {
            autoIndex: false,
            maxPoolSize: 1,
            minPoolSize: 0,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
            connectTimeoutMS: 5000,
            bufferCommands: false,
        });

        await connectionPromise;
        console.log('✅ MongoDB Connected successfully.');

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
