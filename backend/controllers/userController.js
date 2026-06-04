const User = require('../models/User');
const EchoRequest = require('../models/EchoRequest');
const cloudinary = require('../config/cloudinary');
const { uploadToCloudinary } = require('../middleware/upload');

// ─── GET /user/search?q=username ─────────────────────────────────────────────
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ message: 'Search query must be at least 2 characters.' });

    const users = await User.find({
      username: { $regex: q.trim(), $options: 'i' },
      _id: { $ne: req.user._id },
      isVerified: true,
      isBanned: false,
    })
      .select('_id username nickname avatar isOnline lastSeen bio')
      .limit(20);

    res.status(200).json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /user/:userId ────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-passwordHash -googleId');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PUT /user/profile ────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { username, bio, nickname } = req.body;
    const updates = {};

    if (username) {
      if (username.length < 3 || username.length > 30)
        return res.status(400).json({ message: 'Username must be 3-30 characters.' });

      const existing = await User.findOne({
        username: { $regex: new RegExp(`^${username.trim()}$`, 'i') },
        _id: { $ne: req.user._id },
      });
      if (existing) return res.status(409).json({ message: 'Username already taken.' });
      updates.username = username.trim().toLowerCase();
    }

    if (bio !== undefined) updates.bio = bio.substring(0, 160);
    if (nickname !== undefined) updates.nickname = nickname.trim().substring(0, 30);

    // Avatar upload
    if (req.file) {
      // Delete old avatar from Cloudinary (safely wrapped in try-catch)
      if (req.user.avatarPublicId) {
        try {
          await cloudinary.uploader.destroy(req.user.avatarPublicId);
        } catch (destroyErr) {
          console.warn('Failed to delete old avatar from Cloudinary:', destroyErr.message);
        }
      }
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'echo/avatars',
        transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
      });
      updates.avatar = result.secure_url;
      updates.avatarPublicId = result.public_id;
    }


    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
    res.status(200).json(user);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /user/connections ────────────────────────────────────────────────────
const getConnections = async (req, res) => {
  try {
    const accepted = await EchoRequest.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      status: 'accepted',
    }).populate('sender receiver', '_id username nickname avatar isOnline lastSeen bio');

    const connections = accepted.map((r) => {
      return r.sender._id.toString() === req.user._id.toString() ? r.receiver : r.sender;
    });

    res.status(200).json(connections);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PUT /user/block/:userId ──────────────────────────────────────────────────
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot block yourself.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { blockedUsers: userId } },
      { new: true }
    ).select('-passwordHash');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PUT /user/unblock/:userId ────────────────────────────────────────────────
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { blockedUsers: userId } },
      { new: true }
    ).select('-passwordHash');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PUT /user/mute/:conversationId ───────────────────────────────────────────
const muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { mutedConversations: conversationId } },
      { new: true }
    ).select('-passwordHash');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PUT /user/unmute/:conversationId ─────────────────────────────────────────
const unmuteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { mutedConversations: conversationId } },
      { new: true }
    ).select('-passwordHash');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  searchUsers,
  getUserProfile,
  updateProfile,
  getConnections,
  blockUser,
  unblockUser,
  muteConversation,
  unmuteConversation
};
