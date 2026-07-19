import EchoRequest from '../models/EchoRequest.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { getRedis } from '../config/redis.js';
import { emitToSocketOrRoom } from '../utils/socketEmit.js';

// ─── POST /echo/send ──────────────────────────────────────────────────────────
export const sendEchoRequest = async (c) => {
    try {
        const { toUserId } = await c.req.json();
        const currentUser = c.get('user');

        if (!toUserId) return c.json({ message: 'Receiver ID is required.' }, 400);
        if (toUserId === currentUser._id.toString())
            return c.json({ message: 'Cannot send Echo request to yourself.' }, 400);

        const receiver = await User.findById(toUserId);
        if (!receiver || !receiver.isVerified || receiver.isBanned)
            return c.json({ message: 'User not found.' }, 404);

        const existing = await EchoRequest.findOne({
            $or: [
                { sender: currentUser._id, receiver: toUserId },
                { sender: toUserId, receiver: currentUser._id },
            ],
        });

        if (existing) {
            if (existing.status === 'accepted')
                return c.json({ message: 'Already connected.' }, 409);
            if (existing.status === 'pending')
                return c.json({ message: 'Echo request already sent.' }, 409);
            if (existing.status === 'declined') {
                existing.status = 'pending';
                existing.sender = currentUser._id;
                existing.receiver = toUserId;
                await existing.save();

                const redis = getRedis();
                const receiverSocket = await redis.get(`user:${toUserId}`);
                if (receiverSocket) {
                    const populatedRequest = await existing.populate('sender', '_id username avatar');
                    emitToSocketOrRoom(c, receiverSocket, 'echo-request-received', {
                        request: populatedRequest,
                    });
                }
                return c.json({ message: 'Echo request sent.', request: existing }, 200);
            }
        }

        const request = await EchoRequest.create({ sender: currentUser._id, receiver: toUserId });
        await request.populate('sender', '_id username avatar');

        const redis = getRedis();
        const receiverSocket = await redis.get(`user:${toUserId}`);
        if (receiverSocket) {
            emitToSocketOrRoom(c, receiverSocket, 'echo-request-received', { request });
        }

        return c.json({ message: 'Echo request sent.', request }, 201);
    } catch (err) {
        console.error('Send echo request error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /echo/accept ────────────────────────────────────────────────────────
export const acceptEchoRequest = async (c) => {
    try {
        const { requestId } = await c.req.json();
        const currentUser = c.get('user');

        const request = await EchoRequest.findById(requestId).populate('sender receiver', '_id username avatar');

        if (!request) return c.json({ message: 'Echo request not found.' }, 404);
        if (request.receiver._id.toString() !== currentUser._id.toString())
            return c.json({ message: 'Not authorized.' }, 403);
        if (request.status !== 'pending')
            return c.json({ message: 'Request is no longer pending.' }, 400);

        request.status = 'accepted';
        await request.save();

        let conversation = await Conversation.findOne({
            participants: { $all: [request.sender._id, request.receiver._id] },
        });
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [request.sender._id, request.receiver._id],
            });
        }
        await conversation.populate('participants', '_id username avatar isOnline lastSeen');

        const redis = getRedis();
        const senderSocket = await redis.get(`user:${request.sender._id}`);
        if (senderSocket) {
            emitToSocketOrRoom(c, senderSocket, 'echo-accepted', { request, conversation });
        }

        return c.json({ message: 'Echo request accepted.', conversation }, 200);
    } catch (err) {
        console.error('Accept echo error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /echo/decline ───────────────────────────────────────────────────────
export const declineEchoRequest = async (c) => {
    try {
        const { requestId } = await c.req.json();
        const currentUser = c.get('user');

        const request = await EchoRequest.findById(requestId);

        if (!request) return c.json({ message: 'Echo request not found.' }, 404);
        if (request.receiver.toString() !== currentUser._id.toString())
            return c.json({ message: 'Not authorized.' }, 403);

        request.status = 'declined';
        await request.save();

        return c.json({ message: 'Echo request declined.' }, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /echo/pending ────────────────────────────────────────────────────────
export const getPendingRequests = async (c) => {
    try {
        const currentUser = c.get('user');
        const requests = await EchoRequest.find({
            receiver: currentUser._id,
            status: 'pending',
        }).populate('sender', '_id username avatar bio');

        return c.json(requests, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /echo/sent ───────────────────────────────────────────────────────────
export const getSentRequests = async (c) => {
    try {
        const currentUser = c.get('user');
        const requests = await EchoRequest.find({
            sender: currentUser._id,
            status: 'pending',
        }).populate('receiver', '_id username avatar');

        return c.json(requests, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};
