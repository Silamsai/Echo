const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const EchoRequest = require('../models/EchoRequest');
const cloudinary = require('../config/cloudinary');

// ─── GET /admin/stats ─────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalMessages, totalConversations, pendingRequests] = await Promise.all([
      User.countDocuments({ isVerified: true }),
      Message.countDocuments({ deleted: false }),
      Conversation.countDocuments(),
      EchoRequest.countDocuments({ status: 'pending' }),
    ]);

    const { getRedis } = require('../config/redis');
    const redis = getRedis();
    const onlineKeys = await redis.keys('user:*');

    res.status(200).json({
      totalUsers,
      totalMessages,
      totalConversations,
      pendingRequests,
      onlineNow: onlineKeys.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /admin/users ─────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search
      ? { $or: [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const users = await User.find(query)
      .select('-passwordHash -googleId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);
    res.status(200).json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PUT /admin/user/:userId/ban ──────────────────────────────────────────────
const banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.isAdmin) return res.status(403).json({ message: 'Cannot ban an admin.' });

    user.isBanned = !user.isBanned;
    await user.save();

    // Disconnect their socket if online
    const { getRedis } = require('../config/redis');
    const redis = getRedis();
    const socketId = await redis.get(`user:${user._id}`);
    if (socketId && user.isBanned) {
      req.io.to(socketId).emit('force-logout', { reason: 'Your account has been banned.' });
    }

    res.status(200).json({ message: user.isBanned ? 'User banned.' : 'User unbanned.', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DELETE /admin/user/:userId ───────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.isAdmin) return res.status(403).json({ message: 'Cannot delete an admin.' });

    if (user.avatarPublicId) await cloudinary.uploader.destroy(user.avatarPublicId);
    await User.findByIdAndDelete(user._id);
    await EchoRequest.deleteMany({ $or: [{ sender: user._id }, { receiver: user._id }] });

    res.status(200).json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PUT /admin/user/:userId/make-admin ───────────────────────────────────────
const makeAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isAdmin: true }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'User promoted to admin.', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /admin/messages ──────────────────────────────────────────────────────
const getAllMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find()
      .populate('sender', 'username avatar')
      .populate('conversation')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Message.countDocuments();
    res.status(200).json({ messages, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DELETE /admin/message/:messageId ────────────────────────────────────────
const adminDeleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found.' });

    if (message.filePublicId) {
      const resourceType = message.type === 'voice' ? 'video' : 'image';
      await cloudinary.uploader.destroy(message.filePublicId, { resource_type: resourceType });
    }

    await Message.findByIdAndDelete(req.params.messageId);
    res.status(200).json({ message: 'Message deleted by admin.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getStats, getAllUsers, banUser, deleteUser, makeAdmin, getAllMessages, adminDeleteMessage };
