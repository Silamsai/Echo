const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const { upload } = require('../middleware/upload');
const {
  searchUsers,
  getUserProfile,
  updateProfile,
  getConnections,
  blockUser,
  unblockUser,
  muteConversation,
  unmuteConversation
} = require('../controllers/userController');

router.get('/search', verifyToken, searchUsers);
router.get('/connections', verifyToken, getConnections);
router.get('/:userId', verifyToken, getUserProfile);
router.put('/profile', verifyToken, upload.single('avatar'), updateProfile);

// Privacy controls
router.put('/block/:userId', verifyToken, blockUser);
router.put('/unblock/:userId', verifyToken, unblockUser);
router.put('/mute/:conversationId', verifyToken, muteConversation);
router.put('/unmute/:conversationId', verifyToken, unmuteConversation);

module.exports = router;
