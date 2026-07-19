import { Hono } from 'hono';
import { verifyToken } from '../middleware/verifyToken.js';
import { AccessToken } from 'livekit-server-sdk';

const livekit = new Hono();

// POST /livekit/token
livekit.post('/token', verifyToken, async (c) => {
    try {
        const { roomName } = await c.req.json();
        if (!roomName) {
            return c.json({ message: 'roomName is required.' }, 400);
        }

        const apiKey = c.env.LIVEKIT_API_KEY;
        const apiSecret = c.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            return c.json({ message: 'LiveKit not configured on server.' }, 500);
        }

        const user = c.get('user');
        const participantIdentity = user._id.toString();
        const participantName = user.nickname || user.username;

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

        return c.json({
            token,
            url: c.env.LIVEKIT_URL,
            roomName,
            participantIdentity,
            participantName,
        });
    } catch (err) {
        console.error('LiveKit token error:', err);
        return c.json({ message: 'Failed to generate LiveKit token.' }, 500);
    }
});

export default livekit;
