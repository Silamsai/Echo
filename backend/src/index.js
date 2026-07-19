import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initCloudinary } from './config/cloudinary.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import echoRequestRoutes from './routes/echoRequest.js';
import conversationRoutes from './routes/conversation.js';
import messageRoutes from './routes/message.js';
import adminRoutes from './routes/admin.js';
import livekitRoutes from './routes/livekit.js';
import configRoutes from './routes/config.js';
import workspaceRoutes from './routes/workspace.js';

const app = new Hono();

// ─── DB/Redis Connection (cached across requests) ─────────────────────────────
let dbConnected = false;

app.use('*', async (c, next) => {
    // Merge process.env for Node.js local context compatibility
    const env = { ...process.env, ...c.env };
    c.env = env;

    // Lazily connect MongoDB + Redis + Cloudinary once per Worker instance
    if (!dbConnected) {
        await connectDB(env);
        connectRedis(env);
        initCloudinary(env);
        dbConnected = true;
    }
    // Attach env to context for controllers
    c.set('env', env);
    await next();
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use('*', async (c, next) => {
    const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
    const corsMiddleware = cors({
        origin: frontendUrl,
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
    });
    return corsMiddleware(c, next);
});

// ─── Logger ───────────────────────────────────────────────────────────────────
app.use('*', logger());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route('/auth', authRoutes);
app.route('/user', userRoutes);
app.route('/echo', echoRequestRoutes);
app.route('/conversation', conversationRoutes);
app.route('/message', messageRoutes);
app.route('/admin', adminRoutes);
app.route('/livekit', livekitRoutes);
app.route('/config', configRoutes);
app.route('/workspace', workspaceRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (c) =>
    c.json({ status: 'ok', app: 'ECHO Backend (Cloudflare Workers)', timestamp: new Date() })
);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ message: 'Route not found.' }, 404));

// ─── Global error handler ─────────────────────────────────────────────────────
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({ message: err.message || 'Internal server error.' }, 500);
});

export default app;
