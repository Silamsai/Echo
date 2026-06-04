const express = require('express');
const router = express.Router();
const { getConfig, updateConfig, uploadLogo } = require('../controllers/configController');
const { verifyToken, verifyAdmin } = require('../middleware/verifyToken');
const { upload } = require('../middleware/upload');

// Public route to fetch configuration
router.get('/', getConfig);

// Admin-only routes to modify config or upload logo
router.put('/', verifyToken, verifyAdmin, updateConfig);
router.post('/upload-logo', verifyToken, verifyAdmin, upload.single('logo'), uploadLogo);

module.exports = router;
