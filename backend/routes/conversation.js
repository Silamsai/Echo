const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const { getConversations, getConversationById } = require('../controllers/conversationController');

router.get('/', verifyToken, getConversations);
router.get('/:conversationId', verifyToken, getConversationById);

module.exports = router;
