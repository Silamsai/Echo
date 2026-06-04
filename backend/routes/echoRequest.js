const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const {
  sendEchoRequest,
  acceptEchoRequest,
  declineEchoRequest,
  getPendingRequests,
  getSentRequests,
} = require('../controllers/echoRequestController');

router.post('/send', verifyToken, sendEchoRequest);
router.post('/accept', verifyToken, acceptEchoRequest);
router.post('/decline', verifyToken, declineEchoRequest);
router.get('/pending', verifyToken, getPendingRequests);
router.get('/sent', verifyToken, getSentRequests);

module.exports = router;
