import { Hono } from 'hono';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    searchUsers, getUserProfile, updateProfile,
    getConnections, blockUser, unblockUser,
    muteConversation, unmuteConversation,
    pinConversation, unpinConversation,
    muteWorkspace, unmuteWorkspace,
    pinWorkspace, unpinWorkspace
} from '../controllers/userController.js';

const user = new Hono();

user.get('/search', verifyToken, searchUsers);
user.get('/connections', verifyToken, getConnections);
user.get('/:userId', verifyToken, getUserProfile);
user.put('/profile', verifyToken, updateProfile);

// Privacy controls
user.put('/block/:userId', verifyToken, blockUser);
user.put('/unblock/:userId', verifyToken, unblockUser);
user.put('/mute/:conversationId', verifyToken, muteConversation);
user.put('/unmute/:conversationId', verifyToken, unmuteConversation);
user.put('/pin/:conversationId', verifyToken, pinConversation);
user.put('/unpin/:conversationId', verifyToken, unpinConversation);

// Workspace controls
user.put('/mute-workspace/:workspaceId', verifyToken, muteWorkspace);
user.put('/unmute-workspace/:workspaceId', verifyToken, unmuteWorkspace);
user.put('/pin-workspace/:workspaceId', verifyToken, pinWorkspace);
user.put('/unpin-workspace/:workspaceId', verifyToken, unpinWorkspace);

export default user;
