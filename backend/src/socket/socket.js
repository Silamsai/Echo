import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { getRedis } from '../config/redis.js';

export const initSocket = (io, env) => {
    // ─── Auth Middleware ────────────────────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('Authentication error: No token.'));

            // Use env.JWT_SECRET (fallback to process.env.JWT_SECRET for safety)
            const secret = env?.JWT_SECRET || process.env.JWT_SECRET;
            const decoded = jwt.verify(token, secret);
            const user = await User.findById(decoded.userId).select('-passwordHash');
            if (!user || user.isBanned) return next(new Error('Authentication error: Invalid user.'));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token.'));
        }
    });

    io.on('connection', async (socket) => {
        const user = socket.user;
        const redis = getRedis();

        console.log(`🟢 Socket connected: ${user.username} (${socket.id})`);

        // ─── Online Presence ──────────────────────────────────────────────────────
        await redis.set(`user:${user._id}`, socket.id);
        await User.findByIdAndUpdate(user._id, { isOnline: true });

        // Notify all connected clients that this user is online
        socket.broadcast.emit('user-online', { userId: user._id });

        // Join personal room for direct notifications
        socket.join(`user_${user._id}`);

        // ─── Join conversation rooms the user is part of ─────────────────────────
        const conversations = await Conversation.find({ participants: user._id });
        conversations.forEach((conv) => socket.join(`conv_${conv._id}`));

        // ─── Send Message ─────────────────────────────────────────────────────────
        socket.on('send-message', async (data, callback) => {
            try {
                const { conversationId, content, type = 'text' } = data;
                if (!conversationId || !content?.trim())
                    return callback?.({ error: 'Invalid message data.' });

                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return callback?.({ error: 'Conversation not found.' });

                const isParticipant = conversation.participants.some(
                    (p) => p.toString() === user._id.toString()
                );
                if (!isParticipant) return callback?.({ error: 'Not a participant.' });

                // Check if blocked
                if (!conversation.isGroup) {
                    const otherParticipantId = conversation.participants.find(
                        (p) => p.toString() !== user._id.toString()
                    );
                    if (otherParticipantId) {
                        const otherUser = await User.findById(otherParticipantId).select('blockedUsers');
                        const currentUser = await User.findById(user._id).select('blockedUsers');
                        if (
                            otherUser?.blockedUsers?.includes(user._id) ||
                            currentUser?.blockedUsers?.includes(otherParticipantId)
                        ) {
                            return callback?.({ error: 'Cannot send message. You have blocked this user or they have blocked you.' });
                        }
                    }
                }

                // Save message
                const message = await Message.create({
                    conversation: conversationId,
                    sender: user._id,
                    type,
                    content: content.trim(),
                });

                await message.populate('sender', '_id username nickname avatar');

                // Update conversation
                await Conversation.findByIdAndUpdate(conversationId, {
                    lastMessage: message._id,
                    lastMessageAt: new Date(),
                });

                // Broadcast to conversation room
                io.to(`conv_${conversationId}`).emit('new-message', message);

                callback?.({ success: true, message });
            } catch (err) {
                console.error('send-message error:', err);
                callback?.({ error: 'Server error.' });
            }
        });

        // ─── Echo Request ─────────────────────────────────────────────────────────
        socket.on('echo-request', async (data) => {
            try {
                const { toUserId } = data;
                const receiverSocket = await redis.get(`user:${toUserId}`);
                if (receiverSocket) {
                    io.to(receiverSocket).emit('echo-request-received', {
                        fromUser: {
                            _id: user._id,
                            username: user.username,
                            avatar: user.avatar,
                        },
                    });
                }
            } catch (err) {
                console.error('echo-request socket error:', err);
            }
        });

        // ─── Echo Accept ──────────────────────────────────────────────────────────
        socket.on('echo-accept', async (data) => {
            try {
                const { requestId, senderId, conversationId } = data;
                const senderSocket = await redis.get(`user:${senderId}`);
                if (senderSocket) {
                    io.to(senderSocket).emit('echo-accepted', {
                        requestId,
                        conversationId,
                        acceptedBy: {
                            _id: user._id,
                            username: user.username,
                            avatar: user.avatar,
                        },
                    });
                }
                // Make both users join the conversation room
                if (conversationId) {
                    socket.join(`conv_${conversationId}`);
                    if (senderSocket) {
                        const senderSock = io.sockets.sockets.get(senderSocket);
                        if (senderSock) senderSock.join(`conv_${conversationId}`);
                    }
                }
            } catch (err) {
                console.error('echo-accept socket error:', err);
            }
        });

        // ─── Echo Decline ─────────────────────────────────────────────────────────
        socket.on('echo-decline', async (data) => {
            try {
                const { senderId } = data;
                const senderSocket = await redis.get(`user:${senderId}`);
                if (senderSocket) {
                    io.to(senderSocket).emit('echo-declined', {
                        declinedBy: { _id: user._id, username: user.username },
                    });
                }
            } catch (err) {
                console.error('echo-decline socket error:', err);
            }
        });

        // ─── Typing ───────────────────────────────────────────────────────────────
        socket.on('typing', async (data) => {
            try {
                const { conversationId } = data;
                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return;

                if (!conversation.isGroup) {
                    const otherParticipantId = conversation.participants.find(
                        (p) => p.toString() !== user._id.toString()
                    );
                    if (otherParticipantId) {
                        const otherUser = await User.findById(otherParticipantId).select('blockedUsers');
                        const currentUser = await User.findById(user._id).select('blockedUsers');
                        if (
                            otherUser?.blockedUsers?.includes(user._id) ||
                            currentUser?.blockedUsers?.includes(otherParticipantId)
                        ) {
                            return;
                        }
                    }
                }

                socket.to(`conv_${conversationId}`).emit('typing', {
                    userId: user._id,
                    username: user.username,
                    conversationId,
                });
            } catch (err) {
                console.error('typing socket error:', err);
            }
        });

        socket.on('stop-typing', (data) => {
            const { conversationId } = data;
            socket.to(`conv_${conversationId}`).emit('stop-typing', {
                userId: user._id,
                conversationId,
            });
        });

        // ─── Mark Seen ────────────────────────────────────────────────────────────
        socket.on('mark-seen', async (data) => {
            try {
                const { messageId } = data;
                const message = await Message.findById(messageId);
                if (!message || message.sender.toString() === user._id.toString()) return;

                message.seen = true;
                message.seenAt = new Date();
                await message.save();

                // Notify sender
                const senderSocket = await redis.get(`user:${message.sender}`);
                if (senderSocket) {
                    io.to(senderSocket).emit('message-seen', {
                        messageId,
                        seenBy: user._id,
                        seenAt: message.seenAt,
                    });
                }
            } catch (err) {
                console.error('mark-seen error:', err);
            }
        });

        // ─── Join conversation room (called after echo accept) ────────────────────
        socket.on('join-conversation', (data) => {
            const { conversationId } = data;
            if (conversationId) socket.join(`conv_${conversationId}`);
        });

        // ─── Call Signaling ───────────────────────────────────────────────────────
        socket.on('call-offer', async (data) => {
            try {
                const { toUserId, callType, roomName } = data;
                const targetSocket = await redis.get(`user:${toUserId}`);
                if (targetSocket) {
                    io.to(targetSocket).emit('call-incoming', {
                        fromUserId: user._id,
                        fromUsername: user.nickname || user.username,
                        fromAvatar: user.avatar,
                        callType,
                        roomName,
                    });
                }
            } catch (err) {
                console.error('call-offer error:', err);
            }
        });

        socket.on('call-answer', async (data) => {
            try {
                const { toUserId, roomName } = data;
                const targetSocket = await redis.get(`user:${toUserId}`);
                if (targetSocket) {
                    io.to(targetSocket).emit('call-accepted', {
                        byUserId: user._id,
                        roomName,
                    });
                }
            } catch (err) {
                console.error('call-answer error:', err);
            }
        });

        socket.on('call-reject', async (data) => {
            try {
                const { toUserId } = data;
                const targetSocket = await redis.get(`user:${toUserId}`);
                if (targetSocket) {
                    io.to(targetSocket).emit('call-rejected', { byUserId: user._id });
                }
            } catch (err) {
                console.error('call-reject error:', err);
            }
        });

        socket.on('call-end', async (data) => {
            try {
                const { toUserId } = data;
                const targetSocket = await redis.get(`user:${toUserId}`);
                if (targetSocket) {
                    io.to(targetSocket).emit('call-ended', { byUserId: user._id });
                }
            } catch (err) {
                console.error('call-end error:', err);
            }
        });

        // ─── Disconnect ───────────────────────────────────────────────────────────
        socket.on('disconnect', async () => {
            console.log(`🔴 Socket disconnected: ${user.username}`);
            await redis.del(`user:${user._id}`);

            const lastSeen = new Date();
            await User.findByIdAndUpdate(user._id, { isOnline: false, lastSeen });

            socket.broadcast.emit('user-offline', {
                userId: user._id,
                lastSeen,
            });
        });
    });
};
