import { Hono } from 'hono';
import { verifyToken } from '../middleware/verifyToken.js';
import { getMessages, uploadFile, deleteMessage } from '../controllers/messageController.js';

const message = new Hono();

message.get('/:conversationId', verifyToken, getMessages);
message.post('/upload', verifyToken, uploadFile);
message.delete('/:messageId', verifyToken, deleteMessage);

export default message;
