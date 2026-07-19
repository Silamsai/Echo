import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { parseFile, uploadToCloudinary } from '../middleware/upload.js';
import { getRedis } from '../config/redis.js';
import { emitToSocketOrRoom } from '../utils/socketEmit.js';

// ─── GET /message/:conversationId ────────────────────────────────────────────
export const getMessages = async (c) => {
    try {
        const conversationId = c.req.param('conversationId');
        const page = Number(c.req.query('page') || '1');
        const limit = Number(c.req.query('limit') || '50');
        const currentUser = c.get('user');

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return c.json({ message: 'Conversation not found.' }, 404);

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === currentUser._id.toString()
        );
        if (!isParticipant) return c.json({ message: 'Access denied.' }, 403);

        const messages = await Message.find({ conversation: conversationId, deleted: false })
            .populate('sender', '_id username nickname avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return c.json(messages.reverse(), 200);
    } catch (err) {
        console.error('Get messages error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /message/upload ─────────────────────────────────────────────────────
export const uploadFile = async (c) => {
    try {
        const { body, file } = await parseFile(c, 'file');
        if (!file) return c.json({ message: 'No file provided.' }, 400);

        const { conversationId, type, caption } = body;
        if (!conversationId || !type)
            return c.json({ message: 'conversationId and type are required.' }, 400);

        const currentUser = c.get('user');
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return c.json({ message: 'Conversation not found.' }, 404);

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === currentUser._id.toString()
        );
        if (!isParticipant) return c.json({ message: 'Access denied.' }, 403);

        const otherParticipantId = conversation.participants.find(
            (p) => p.toString() !== currentUser._id.toString()
        );
        if (otherParticipantId) {
            const otherUser = await User.findById(otherParticipantId).select('blockedUsers');
            const currentUserFull = await User.findById(currentUser._id).select('blockedUsers');
            if (
                otherUser?.blockedUsers?.includes(currentUser._id) ||
                currentUserFull?.blockedUsers?.includes(otherParticipantId)
            ) {
                return c.json({ message: 'Cannot upload files. You have blocked this user or they have blocked you.' }, 403);
            }
        }

        const folder = type === 'voice' ? 'echo/voice' : 'echo/images';
        const resourceType = type === 'voice' ? 'video' : 'image';

        const result = await uploadToCloudinary(file.buffer, {
            folder,
            resource_type: resourceType,
        });

        const message = await Message.create({
            conversation: conversationId,
            sender: currentUser._id,
            type,
            fileUrl: result.secure_url,
            filePublicId: result.public_id,
            content: type === 'image' ? (caption || '') : '',
        });

        await message.populate('sender', '_id username nickname avatar');

        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
        });

        const redis = getRedis();
        const otherParticipant = conversation.participants.find(
            (p) => p.toString() !== currentUser._id.toString()
        );
        if (otherParticipant) {
            const socketId = await redis.get(`user:${otherParticipant}`);
            if (socketId) {
                emitToSocketOrRoom(c, socketId, 'new-message', message);
            }
        }

        return c.json(message, 201);
    } catch (err) {
        console.error('Upload file error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── DELETE /message/:messageId ───────────────────────────────────────────────
export const deleteMessage = async (c) => {
    try {
        const messageId = c.req.param('messageId');
        const currentUser = c.get('user');

        const message = await Message.findById(messageId);
        if (!message) return c.json({ message: 'Message not found.' }, 404);
        if (message.sender.toString() !== currentUser._id.toString())
            return c.json({ message: 'Cannot delete someone else\'s message.' }, 403);

        message.deleted = true;
        message.content = '';
        await message.save();

        return c.json({ message: 'Message deleted.' }, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /message ────────────────────────────────────────────────────────────
export const sendMessage = async (c) => {
    try {
        const { conversationId, content, type = 'text' } = await c.req.json();
        const currentUser = c.get('user');

        if (!conversationId || !content?.trim())
            return c.json({ message: 'Invalid message data.' }, 400);

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return c.json({ message: 'Conversation not found.' }, 404);

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === currentUser._id.toString()
        );
        if (!isParticipant) return c.json({ message: 'Access denied.' }, 403);

        // Check block relationships for single chats
        if (!conversation.isGroup) {
            const otherParticipantId = conversation.participants.find(
                (p) => p.toString() !== currentUser._id.toString()
            );
            if (otherParticipantId) {
                const otherUser = await User.findById(otherParticipantId).select('blockedUsers');
                const currentUserFull = await User.findById(currentUser._id).select('blockedUsers');
                if (
                    otherUser?.blockedUsers?.includes(currentUser._id) ||
                    currentUserFull?.blockedUsers?.includes(otherParticipantId)
                ) {
                    return c.json({ message: 'Cannot send message. You have blocked this user or they have blocked you.' }, 403);
                }
            }
        }

        // Save message
        const message = await Message.create({
            conversation: conversationId,
            sender: currentUser._id,
            type,
            content: content.trim(),
        });

        await message.populate('sender', '_id username nickname avatar');

        // Update conversation last message timestamp
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: message._id,
            lastMessageAt: new Date(),
        });

        // Broadcast to socket room
        emitToSocketOrRoom(c, `conv_${conversationId}`, 'new-message', message);

        return c.json(message, 201);
    } catch (err) {
        console.error('Send message error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};
