import { Hono } from 'hono';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';
import {
    getStats, getAllUsers, banUser, deleteUser,
    makeAdmin, getAllMessages, adminDeleteMessage,
} from '../controllers/adminController.js';

const admin = new Hono();

// All admin routes require JWT + admin flag
admin.use('*', verifyToken, verifyAdmin);

admin.get('/stats', getStats);
admin.get('/users', getAllUsers);
admin.put('/user/:userId/ban', banUser);
admin.put('/user/:userId/make-admin', makeAdmin);
admin.delete('/user/:userId', deleteUser);
admin.get('/messages', getAllMessages);
admin.delete('/message/:messageId', adminDeleteMessage);

export default admin;
