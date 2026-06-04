const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const { upload } = require('../middleware/upload');
const { getMessages, uploadFile, deleteMessage } = require('../controllers/messageController');

router.get('/:conversationId', verifyToken, getMessages);
router.post('/upload', verifyToken, upload.single('file'), uploadFile);
router.delete('/:messageId', verifyToken, deleteMessage);

module.exports = router;
