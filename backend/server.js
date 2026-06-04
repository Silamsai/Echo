require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('./config/passport');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
require('./config/cloudinary'); // Initialize Cloudinary

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const echoRequestRoutes = require('./routes/echoRequest');
const conversationRoutes = require('./routes/conversation');
const messageRoutes = require('./routes/message');
const adminRoutes = require('./routes/admin');
const livekitRoutes = require('./routes/livekit');
const configRoutes = require('./routes/config');
const initSocket = require('./socket/socket');

const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ──────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(passport.initialize());

// Attach io to every request so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/echo', echoRequestRoutes);
app.use('/conversation', conversationRoutes);
app.use('/message', messageRoutes);
app.use('/admin', adminRoutes);
app.use('/livekit', livekitRoutes);
app.use('/config', configRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'ECHO Backend', timestamp: new Date() }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: err.message || 'Internal server error.' });
});

// ─── Initialize Socket.io ─────────────────────────────────────────────────────
initSocket(io);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  connectRedis();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 ECHO Backend running on http://localhost:${PORT}`);
    console.log(`📡 Socket.io ready`);
    console.log(`🌍 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
  });
};

startServer();
// TRIGGER SERVER ENVIRONMENT RESTART FOR CLOUDINARY KEYS

