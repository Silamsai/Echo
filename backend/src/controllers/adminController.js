import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import EchoRequest from '../models/EchoRequest.js';
import cloudinary from '../config/cloudinary.js';
import { getRedis } from '../config/redis.js';
import { emitToSocketOrRoom } from '../utils/socketEmit.js';

// ─── GET /admin/stats ─────────────────────────────────────────────────────────
export const getStats = async (c) => {
    try {
        const [totalUsers, totalMessages, totalConversations, pendingRequests] = await Promise.all([
            User.countDocuments({ isVerified: true }),
            Message.countDocuments({ deleted: false }),
            Conversation.countDocuments(),
            EchoRequest.countDocuments({ status: 'pending' }),
        ]);

        const redis = getRedis();
        const onlineKeys = await redis.keys('user:*');

        return c.json({
            totalUsers,
            totalMessages,
            totalConversations,
            pendingRequests,
            onlineNow: onlineKeys.length,
        }, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /admin/users ─────────────────────────────────────────────────────────
export const getAllUsers = async (c) => {
    try {
        const page = Number(c.req.query('page') || '1');
        const limit = Number(c.req.query('limit') || '20');
        const search = c.req.query('search') || '';

        const query = search
            ? { $or: [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
            : {};

        const users = await User.find(query)
            .select('-passwordHash -googleId')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await User.countDocuments(query);
        return c.json({ users, total, page, pages: Math.ceil(total / limit) }, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── PUT /admin/user/:userId/ban ──────────────────────────────────────────────
export const banUser = async (c) => {
    try {
        const userId = c.req.param('userId');
        const user = await User.findById(userId);
        if (!user) return c.json({ message: 'User not found.' }, 404);
        if (user.isAdmin) return c.json({ message: 'Cannot ban an admin.' }, 403);

        user.isBanned = !user.isBanned;
        await user.save();

        const redis = getRedis();
        const socketId = await redis.get(`user:${user._id}`);
        if (socketId && user.isBanned) {
            emitToSocketOrRoom(c, socketId, 'force-logout', { reason: 'Your account has been banned.' });
        }

        return c.json({ message: user.isBanned ? 'User banned.' : 'User unbanned.', user }, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── DELETE /admin/user/:userId ───────────────────────────────────────────────
export const deleteUser = async (c) => {
    try {
        const userId = c.req.param('userId');
        const user = await User.findById(userId);
        if (!user) return c.json({ message: 'User not found.' }, 404);
        if (user.isAdmin) return c.json({ message: 'Cannot delete an admin.' }, 403);

        if (user.avatarPublicId) await cloudinary.uploader.destroy(user.avatarPublicId);
        await User.findByIdAndDelete(user._id);
        await EchoRequest.deleteMany({ $or: [{ sender: user._id }, { receiver: user._id }] });

        return c.json({ message: 'User deleted.' }, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── PUT /admin/user/:userId/make-admin ───────────────────────────────────────
export const makeAdmin = async (c) => {
    try {
        const userId = c.req.param('userId');
        const user = await User.findByIdAndUpdate(userId, { isAdmin: true }, { new: true }).select('-passwordHash');
        if (!user) return c.json({ message: 'User not found.' }, 404);
        return c.json({ message: 'User promoted to admin.', user }, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /admin/messages ──────────────────────────────────────────────────────
export const getAllMessages = async (c) => {
    try {
        const page = Number(c.req.query('page') || '1');
        const limit = Number(c.req.query('limit') || '50');

        const messages = await Message.find()
            .populate('sender', 'username avatar')
            .populate('conversation')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Message.countDocuments();
        return c.json({ messages, total }, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── DELETE /admin/message/:messageId ────────────────────────────────────────
export const adminDeleteMessage = async (c) => {
    try {
        const messageId = c.req.param('messageId');
        const message = await Message.findById(messageId);
        if (!message) return c.json({ message: 'Message not found.' }, 404);

        if (message.filePublicId) {
            const resourceType = message.type === 'voice' ? 'video' : 'image';
            await cloudinary.uploader.destroy(message.filePublicId, { resource_type: resourceType });
        }

        await Message.findByIdAndDelete(messageId);
        return c.json({ message: 'Message deleted by admin.' }, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};
