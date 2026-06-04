const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const { AccessToken } = require('livekit-server-sdk');

// POST /livekit/token
// Body: { roomName, participantName }
router.post('/token', verifyToken, async (req, res) => {
  try {
    const { roomName } = req.body;
    if (!roomName) {
      return res.status(400).json({ message: 'roomName is required.' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ message: 'LiveKit not configured on server.' });
    }

    const participantIdentity = req.user._id.toString();
    const participantName = req.user.nickname || req.user.username;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: '1h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.json({
      token,
      url: process.env.LIVEKIT_URL,
      roomName,
      participantIdentity,
      participantName,
    });
  } catch (err) {
    console.error('LiveKit token error:', err);
    res.status(500).json({ message: 'Failed to generate LiveKit token.' });
  }
});

module.exports = router;
