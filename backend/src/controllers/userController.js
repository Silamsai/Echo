import User from '../models/User.js';
import EchoRequest from '../models/EchoRequest.js';
import cloudinary from '../config/cloudinary.js';
import { parseFile, uploadToCloudinary } from '../middleware/upload.js';

// ─── GET /user/search?q=username ─────────────────────────────────────────────
export const searchUsers = async (c) => {
    try {
        const q = c.req.query('q');
        if (!q || q.trim().length < 2)
            return c.json({ message: 'Search query must be at least 2 characters.' }, 400);

        const user = c.get('user');
        const users = await User.find({
            username: { $regex: q.trim(), $options: 'i' },
            _id: { $ne: user._id },
            isVerified: true,
            isBanned: false,
        })
            .select('_id username nickname avatar isOnline lastSeen bio')
            .limit(20);

        return c.json(users, 200);
    } catch (err) {
        console.error('Search error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /user/:userId ────────────────────────────────────────────────────────
export const getUserProfile = async (c) => {
    try {
        const user = await User.findById(c.req.param('userId')).select('-passwordHash -googleId');
        if (!user) return c.json({ message: 'User not found.' }, 404);
        return c.json(user, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── PUT /user/profile ────────────────────────────────────────────────────────
export const updateProfile = async (c) => {
    try {
        const { body, file } = await parseFile(c, 'avatar');
        const username = body.username;
        const bio = body.bio;
        const nickname = body.nickname;
        const currentUser = c.get('user');
        const updates = {};

        if (username) {
            if (username.length < 3 || username.length > 30)
                return c.json({ message: 'Username must be 3-30 characters.' }, 400);

            const existing = await User.findOne({
                username: { $regex: new RegExp(`^${username.trim()}$`, 'i') },
                _id: { $ne: currentUser._id },
            });
            if (existing) return c.json({ message: 'Username already taken.' }, 409);
            updates.username = username.trim().toLowerCase();
        }

        if (bio !== undefined) updates.bio = bio.substring(0, 160);
        if (nickname !== undefined) updates.nickname = nickname.trim().substring(0, 30);

        // Avatar upload
        if (file) {
            if (currentUser.avatarPublicId) {
                try {
                    await cloudinary.uploader.destroy(currentUser.avatarPublicId);
                } catch (destroyErr) {
                    console.warn('Failed to delete old avatar:', destroyErr.message);
                }
            }
            const result = await uploadToCloudinary(file.buffer, {
                folder: 'echo/avatars',
                transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
            });
            updates.avatar = result.secure_url;
            updates.avatarPublicId = result.public_id;
        }

        const user = await User.findByIdAndUpdate(currentUser._id, updates, { new: true }).select('-passwordHash');
        return c.json(user, 200);
    } catch (err) {
        console.error('Update profile error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /user/connections ────────────────────────────────────────────────────
export const getConnections = async (c) => {
    try {
        const user = c.get('user');
        const accepted = await EchoRequest.find({
            $or: [{ sender: user._id }, { receiver: user._id }],
            status: 'accepted',
        }).populate('sender receiver', '_id username nickname avatar isOnline lastSeen bio');

        const connections = accepted.map((r) => {
            return r.sender._id.toString() === user._id.toString() ? r.receiver : r.sender;
        });

        return c.json(connections, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── PUT /user/block/:userId ──────────────────────────────────────────────────
export const blockUser = async (c) => {
    try {
        const userId = c.req.param('userId');
        const currentUser = c.get('user');
        if (userId === currentUser._id.toString()) {
            return c.json({ message: 'You cannot block yourself.' }, 400);
        }
        const user = await User.findByIdAndUpdate(
            currentUser._id,
            { $addToSet: { blockedUsers: userId } },
            { new: true }
        ).select('-passwordHash');
        return c.json(user, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── PUT /user/unblock/:userId ────────────────────────────────────────────────
export const unblockUser = async (c) => {
    try {
        const userId = c.req.param('userId');
        const user = await User.findByIdAndUpdate(
            c.get('user')._id,
            { $pull: { blockedUsers: userId } },
            { new: true }
        ).select('-passwordHash');
        return c.json(user, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── PUT /user/mute/:conversationId ───────────────────────────────────────────
export const muteConversation = async (c) => {
    try {
        const conversationId = c.req.param('conversationId');
        const user = await User.findByIdAndUpdate(
            c.get('user')._id,
            { $addToSet: { mutedConversations: conversationId } },
            { new: true }
        ).select('-passwordHash');
        return c.json(user, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── PUT /user/unmute/:conversationId ─────────────────────────────────────────
export const unmuteConversation = async (c) => {
    try {
        const conversationId = c.req.param('conversationId');
        const user = await User.findByIdAndUpdate(
            c.get('user')._id,
            { $pull: { mutedConversations: conversationId } },
            { new: true }
        ).select('-passwordHash');
        return c.json(user, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── PUT /user/pin/:conversationId ───────────────────────────────────────────
export const pinConversation = async (c) => {
    try {
        const conversationId = c.req.param('conversationId');
        const user = await User.findByIdAndUpdate(
            c.get('user')._id,
            { $addToSet: { pinnedConversations: conversationId } },
            { new: true }
        ).select('-passwordHash');
        return c.json(user, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── PUT /user/unpin/:conversationId ──────────────────────────────────────────
export const unpinConversation = async (c) => {
    try {
        const conversationId = c.req.param('conversationId');
        const user = await User.findByIdAndUpdate(
            c.get('user')._id,
            { $pull: { pinnedConversations: conversationId } },
            { new: true }
        ).select('-passwordHash');
        return c.json(user, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};
