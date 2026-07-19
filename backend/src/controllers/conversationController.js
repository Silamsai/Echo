import Conversation from '../models/Conversation.js';
import EchoRequest from '../models/EchoRequest.js';
import { emitToSocketOrRoom } from '../utils/socketEmit.js';

// ─── GET /conversation ────────────────────────────────────────────────────────
export const getConversations = async (c) => {
    try {
        const currentUser = c.get('user');
        const conversations = await Conversation.find({
            participants: currentUser._id,
        })
            .populate('participants', '_id username nickname avatar isOnline lastSeen')
            .populate('lastMessage')
            .sort({ lastMessageAt: -1 });

        return c.json(conversations, 200);
    } catch (err) {
        console.error('Get conversations error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /conversation/:conversationId ───────────────────────────────────────
export const getConversationById = async (c) => {
    try {
        const conversationId = c.req.param('conversationId');
        const currentUser = c.get('user');
        const conversation = await Conversation.findById(conversationId)
            .populate('participants', '_id username nickname avatar isOnline lastSeen bio')
            .populate('lastMessage');

        if (!conversation) return c.json({ message: 'Conversation not found.' }, 404);

        const isParticipant = conversation.participants.some(
            (p) => p._id.toString() === currentUser._id.toString()
        );
        if (!isParticipant) return c.json({ message: 'Access denied.' }, 403);

        return c.json(conversation, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /conversation/group ──────────────────────────────────────────────────
export const createGroupConversation = async (c) => {
    try {
        const { name, participants } = await c.req.json();
        const currentUser = c.get('user');

        if (!name || name.trim().length < 3) {
            return c.json({ message: 'Group name must be at least 3 characters.' }, 400);
        }
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            return c.json({ message: 'Please select at least one contact.' }, 400);
        }

        const allParticipants = Array.from(new Set([...participants, currentUser._id.toString()]));

        const conversation = await Conversation.create({
            isGroup: true,
            name: name.trim(),
            participants: allParticipants,
            groupAdmin: currentUser._id,
        });

        await conversation.populate('participants', '_id username nickname avatar isOnline lastSeen');

        allParticipants.forEach((userId) => {
            emitToSocketOrRoom(c, `user_${userId}`, 'new-conversation', conversation);
        });

        return c.json({
            message: 'Group created successfully.',
            conversation,
        }, 201);
    } catch (err) {
        console.error('Create group conversation error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /conversation/:conversationId/member ─────────────────────────────────
export const addMemberToGroupConversation = async (c) => {
    try {
        const conversationId = c.req.param('conversationId');
        const { userId } = await c.req.json();
        const currentUser = c.get('user');

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return c.json({ message: 'Conversation not found.' }, 404);

        if (!conversation.isGroup) {
            return c.json({ message: 'Not a group conversation.' }, 400);
        }

        const isParticipant = conversation.participants.includes(currentUser._id);
        if (!isParticipant) {
            return c.json({ message: 'Access denied.' }, 403);
        }

        if (conversation.participants.includes(userId)) {
            return c.json({ message: 'User is already a member.' }, 400);
        }

        conversation.participants.push(userId);
        await conversation.save();

        const populated = await Conversation.findById(conversationId)
            .populate('participants', '_id username nickname avatar isOnline lastSeen')
            .populate('lastMessage');

        emitToSocketOrRoom(c, `user_${userId}`, 'new-conversation', populated);
        emitToSocketOrRoom(c, `conv_${conversationId}`, 'new-conversation', populated);

        return c.json({
            message: 'Member added successfully.',
            conversation: populated,
        }, 200);
    } catch (err) {
        console.error('Add member to group error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};
