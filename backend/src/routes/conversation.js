import { Hono } from 'hono';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    getConversations, getConversationById,
    createGroupConversation, addMemberToGroupConversation,
} from '../controllers/conversationController.js';

const conversation = new Hono();

conversation.get('/', verifyToken, getConversations);
conversation.post('/group', verifyToken, createGroupConversation);
conversation.get('/:conversationId', verifyToken, getConversationById);
conversation.post('/:conversationId/member', verifyToken, addMemberToGroupConversation);

export default conversation;
