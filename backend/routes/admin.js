const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/verifyToken');
const {
  getStats,
  getAllUsers,
  banUser,
  deleteUser,
  makeAdmin,
  getAllMessages,
  adminDeleteMessage,
} = require('../controllers/adminController');

// All admin routes require JWT + admin flag
router.use(verifyToken, verifyAdmin);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/user/:userId/ban', banUser);
router.put('/user/:userId/make-admin', makeAdmin);
router.delete('/user/:userId', deleteUser);
router.get('/messages', getAllMessages);
router.delete('/message/:messageId', adminDeleteMessage);

module.exports = router;
