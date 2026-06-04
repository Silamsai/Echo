const Conversation = require('../models/Conversation');
const EchoRequest = require('../models/EchoRequest');

// ─── GET /conversation ────────────────────────────────────────────────────────
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', '_id username nickname avatar isOnline lastSeen')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /conversation/:conversationId ───────────────────────────────────────
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate('participants', '_id username nickname avatar isOnline lastSeen bio')
      .populate('lastMessage');

    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: 'Access denied.' });

    res.status(200).json(conversation);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getConversations, getConversationById };
