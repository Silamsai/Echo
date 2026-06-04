const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { uploadToCloudinary } = require('../middleware/upload');
const { getRedis } = require('../config/redis');

// ─── GET /message/:conversationId ────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Access denied.' });

    const messages = await Message.find({ conversation: conversationId, deleted: false })
      .populate('sender', '_id username nickname avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json(messages.reverse());
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /message/upload ─────────────────────────────────────────────────────
const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided.' });

    const { conversationId, type } = req.body; // type: 'image' | 'voice'
    if (!conversationId || !type)
      return res.status(400).json({ message: 'conversationId and type are required.' });

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Access denied.' });

    // Check if blocked
    const otherParticipantId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    if (otherParticipantId) {
      const otherUser = await User.findById(otherParticipantId).select('blockedUsers');
      const currentUser = await User.findById(req.user._id).select('blockedUsers');
      if (
        otherUser?.blockedUsers?.includes(req.user._id) ||
        currentUser?.blockedUsers?.includes(otherParticipantId)
      ) {
        return res.status(403).json({ message: 'Cannot upload files. You have blocked this user or they have blocked you.' });
      }
    }

    const folder = type === 'voice' ? 'echo/voice' : 'echo/images';
    const resourceType = type === 'voice' ? 'video' : 'image'; // Cloudinary uses 'video' for audio

    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      resource_type: resourceType,
    });

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      type,
      fileUrl: result.secure_url,
      filePublicId: result.public_id,
      content: type === 'image' ? (req.body.caption || '') : '',
    });

    await message.populate('sender', '_id username nickname avatar');

    // Update conversation last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    // Emit to conversation participants via Socket.io
    const redis = getRedis();
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );
    if (otherParticipant) {
      const socketId = await redis.get(`user:${otherParticipant}`);
      if (socketId) {
        req.io.to(socketId).emit('new-message', message);
      }
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('Upload file error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DELETE /message/:messageId ───────────────────────────────────────────────
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    if (message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Cannot delete someone else\'s message.' });

    message.deleted = true;
    message.content = '';
    await message.save();

    res.status(200).json({ message: 'Message deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getMessages, uploadFile, deleteMessage };
