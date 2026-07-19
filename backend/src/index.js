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

import mongoose from 'mongoose';

const app = new Hono();

// ─── CORS (Must be registered FIRST to intercept preflights and wrap errors) ─
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

// ─── DB/Redis Connection (verified dynamically on every request) ─────────────
app.use('*', async (c, next) => {
    // Short-circuit OPTIONS requests immediately to prevent unnecessary DB/Redis connection attempts
    if (c.req.method === 'OPTIONS') {
        return await next();
    }

    // Merge process.env for Node.js local context compatibility
    const env = { ...process.env, ...c.env };
    c.env = env;
    // Attach env to context for controllers
    c.set('env', env);

    const path = c.req.path;
    const method = c.req.method;
    // Skip heavy dependency handshakes for endpoints that do not need them
    // Skip GET /config as it leverages memory cache to avoid DB handshakes
    if (path === '/health' || path === '/livekit' || path === '/auth/google' || (path === '/config' && method === 'GET')) {
        return await next();
    }

    // Verify connections on each request (methods are optimized/cached internally)
    await connectDB(env);
    connectRedis(env);
    initCloudinary(env);

    await next();
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

app.get('/test-jwt', async (c) => {
    try {
        const jwtMod = await import('jsonwebtoken');
        const token = jwtMod.default.sign({ test: true }, c.env.JWT_SECRET || 'testsecret');
        return c.json({ ok: true, token });
    } catch (err) {
        return c.json({ error: err.message, stack: err.stack }, 500);
    }
});

app.get('/test-redis', (c) => {
    try {
        const client = connectRedis(c.env);
        return c.json({ ok: true, isConnected: !!client });
    } catch (err) {
        return c.json({ error: err.message, stack: err.stack }, 500);
    }
});

app.get('/test-db', async (c) => {
    try {
        await connectDB(c.env);
        return c.json({ ok: true, isConnected: true });
    } catch (err) {
        return c.json({ error: err.message, stack: err.stack }, 500);
    }
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.notFound((c) => c.json({ message: 'Route not found.' }, 404));

// ─── Global error handler ─────────────────────────────────────────────────────
app.onError((err, c) => {
    console.error('Unhandled error:', err);

    // Append CORS headers for error responses to avoid chrome blocking them as CORS anomalies
    const frontendUrl = c.env?.FRONTEND_URL || 'http://localhost:5173';
    c.header('Access-Control-Allow-Origin', frontendUrl);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return c.json({ message: err.message || 'Internal server error.' }, 500);
});

export default app;
