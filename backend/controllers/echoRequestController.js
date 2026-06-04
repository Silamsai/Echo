const EchoRequest = require('../models/EchoRequest');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { getRedis } = require('../config/redis');

// ─── POST /echo/send ──────────────────────────────────────────────────────────
const sendEchoRequest = async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ message: 'Receiver ID is required.' });
    if (toUserId === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot send Echo request to yourself.' });

    const receiver = await User.findById(toUserId);
    if (!receiver || !receiver.isVerified || receiver.isBanned)
      return res.status(404).json({ message: 'User not found.' });

    // Check if already connected
    const existing = await EchoRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: toUserId },
        { sender: toUserId, receiver: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted')
        return res.status(409).json({ message: 'Already connected.' });
      if (existing.status === 'pending')
        return res.status(409).json({ message: 'Echo request already sent.' });
      if (existing.status === 'declined') {
        // Allow resend after decline
        existing.status = 'pending';
        existing.sender = req.user._id;
        existing.receiver = toUserId;
        await existing.save();
        // Emit socket event
        const redis = getRedis();
        const receiverSocket = await redis.get(`user:${toUserId}`);
        if (receiverSocket) {
          req.io.to(receiverSocket).emit('echo-request-received', {
            request: await existing.populate('sender', '_id username avatar'),
          });
        }
        return res.status(200).json({ message: 'Echo request sent.', request: existing });
      }
    }

    const request = await EchoRequest.create({ sender: req.user._id, receiver: toUserId });
    await request.populate('sender', '_id username avatar');

    // Real-time notification
    const redis = getRedis();
    const receiverSocket = await redis.get(`user:${toUserId}`);
    if (receiverSocket) {
      req.io.to(receiverSocket).emit('echo-request-received', { request });
    }

    res.status(201).json({ message: 'Echo request sent.', request });
  } catch (err) {
    console.error('Send echo request error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /echo/accept ────────────────────────────────────────────────────────
const acceptEchoRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await EchoRequest.findById(requestId).populate('sender receiver', '_id username avatar');

    if (!request) return res.status(404).json({ message: 'Echo request not found.' });
    if (request.receiver._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized.' });
    if (request.status !== 'pending')
      return res.status(400).json({ message: 'Request is no longer pending.' });

    request.status = 'accepted';
    await request.save();

    // Create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [request.sender._id, request.receiver._id] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [request.sender._id, request.receiver._id],
      });
    }
    await conversation.populate('participants', '_id username avatar isOnline lastSeen');

    // Notify sender
    const redis = getRedis();
    const senderSocket = await redis.get(`user:${request.sender._id}`);
    if (senderSocket) {
      req.io.to(senderSocket).emit('echo-accepted', { request, conversation });
    }

    res.status(200).json({ message: 'Echo request accepted.', conversation });
  } catch (err) {
    console.error('Accept echo error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /echo/decline ───────────────────────────────────────────────────────
const declineEchoRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await EchoRequest.findById(requestId);

    if (!request) return res.status(404).json({ message: 'Echo request not found.' });
    if (request.receiver.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized.' });

    request.status = 'declined';
    await request.save();

    res.status(200).json({ message: 'Echo request declined.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /echo/pending ────────────────────────────────────────────────────────
const getPendingRequests = async (req, res) => {
  try {
    const requests = await EchoRequest.find({
      receiver: req.user._id,
      status: 'pending',
    }).populate('sender', '_id username avatar bio');

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /echo/sent ───────────────────────────────────────────────────────────
const getSentRequests = async (req, res) => {
  try {
    const requests = await EchoRequest.find({
      sender: req.user._id,
      status: 'pending',
    }).populate('receiver', '_id username avatar');

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { sendEchoRequest, acceptEchoRequest, declineEchoRequest, getPendingRequests, getSentRequests };
