import { Hono } from 'hono';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';
import { getConfig, updateConfig, uploadLogo } from '../controllers/configController.js';

const config = new Hono();

// Public
config.get('/', getConfig);

// Admin-only
config.put('/', verifyToken, verifyAdmin, updateConfig);
config.post('/upload-logo', verifyToken, verifyAdmin, uploadLogo);

export default config;
