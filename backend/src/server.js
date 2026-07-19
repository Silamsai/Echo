import { serve } from '@hono/node-server';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import app from './index.js';
import { initSocket } from './socket/socket.js';

// ─── Load Local Env Variables ────────────────────────────────────────────────
const env = {};
const devVarsPath = path.resolve(process.cwd(), '.dev.vars');
const envPath = path.resolve(process.cwd(), '.env');

const parseEnvFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        content.split('\n').forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const [key, ...values] = trimmed.split('=');
            const val = values.join('=').trim();
            if (key && val) {
                env[key.trim()] = val.replace(/^["']|["']$/g, ''); // strip optional quotes
            }
        });
    }
};

// Load both .env and .dev.vars (preferring .dev.vars if keys overlap)
parseEnvFile(envPath);
parseEnvFile(devVarsPath);

// Inject into process.env so secondary libraries can use them natively
Object.entries(env).forEach(([k, v]) => {
    if (!process.env[k]) {
        process.env[k] = v;
    }
});

// ─── Attach Env / Context Middleware ──────────────────────────────────────────
app.use('*', async (c, next) => {
    // Merge process.env with read env to populate c.env
    c.env = { ...c.env, ...env, ...process.env };
    c.set('io', io); // Attach socket server instance to Hono context
    await next();
});

const port = parseInt(env.PORT || process.env.PORT || '5000', 10);

// ─── Boot Node HTTP Server ────────────────────────────────────────────────────
console.log('🚀 Booting Echo Backend Local Server...');
const server = serve(
    {
        fetch: app.fetch,
        port,
    },
    (info) => {
        console.log(`📡 Hono HTTP running on http://localhost:${info.port}`);
    }
);

// ─── Initialize Socket.io ─────────────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
    },
});

// Run socket logic
initSocket(io, env);
