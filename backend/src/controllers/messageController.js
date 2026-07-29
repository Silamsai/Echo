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
        const body = await c.req.json();
        const { conversationId, content, type = 'text', pollQuestion, pollOptions } = body;
        const currentUser = c.get('user');

        if (!conversationId)
            return c.json({ message: 'Invalid message data.' }, 400);

        if (type !== 'poll' && !content?.trim())
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

        const messageData = {
            conversation: conversationId,
            sender: currentUser._id,
            type,
            content: content ? content.trim() : '',
        };

        if (type === 'poll') {
            if (!pollQuestion || !Array.isArray(pollOptions) || pollOptions.length < 2) {
                return c.json({ message: 'Poll details are invalid.' }, 400);
            }
            messageData.pollQuestion = pollQuestion.trim();
            messageData.pollOptions = pollOptions.map(opt => ({
                text: opt.trim(),
                votes: []
            }));
            messageData.content = pollQuestion.trim();
        }

        if (type === 'text' && content) {
            const urlMatch = content.match(/(https?:\/\/[^\s]+)/i);
            if (urlMatch) {
                const url = urlMatch[0];
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2500);
                    const res = await fetch(url, {
                        signal: controller.signal,
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                    });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const html = await res.text();
                        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
                        const title = titleMatch ? titleMatch[1].trim() : '';

                        const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
                        const ogTitle = ogTitleMatch ? ogTitleMatch[1] : '';

                        const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
                        const ogDesc = ogDescMatch ? ogDescMatch[1] : '';

                        const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
                        const ogImg = ogImgMatch ? ogImgMatch[1] : '';

                        messageData.linkPreview = {
                            title: ogTitle || title || url,
                            description: ogDesc || '',
                            image: ogImg || '',
                            url,
                        };
                    }
                } catch (err) {
                    console.error('Metadata scraper error:', err);
                }
            }
        }

        // Save message
        const message = await Message.create(messageData);

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

// ─── POST /message/:messageId/vote ───────────────────────────────────────────
export const votePoll = async (c) => {
    try {
        const messageId = c.req.param('messageId');
        const { optionId } = await c.req.json();
        const currentUser = c.get('user');

        const message = await Message.findById(messageId);
        if (!message || message.type !== 'poll') {
            return c.json({ message: 'Poll message not found.' }, 404);
        }

        const option = message.pollOptions.id(optionId);
        if (!option) return c.json({ message: 'Option not found.' }, 400);

        let previouslyVotedThisOption = false;
        message.pollOptions.forEach(opt => {
            const hasVote = opt.votes.some(v => v.toString() === currentUser._id.toString());
            if (opt._id.toString() === optionId && hasVote) {
                previouslyVotedThisOption = true;
            }
            opt.votes = opt.votes.filter(v => v.toString() !== currentUser._id.toString());
        });

        if (!previouslyVotedThisOption) {
            option.votes.push(currentUser._id);
        }

        await message.save();
        await message.populate('sender', '_id username nickname avatar');

        emitToSocketOrRoom(c, `conv_${message.conversation}`, 'poll-updated', message);

        return c.json(message, 200);
    } catch (err) {
        console.error('Vote poll error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};
