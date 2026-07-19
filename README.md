# 🚀 Echo - Real-Time Communication Platform

Echo is a modern full-stack communication platform built for seamless real-time interaction. It combines instant messaging, media sharing, voice notes, and WebRTC-powered audio/video calling within a sleek glassmorphic user interface.

Designed using a scalable client-server architecture, Echo leverages modern web technologies including React, Node.js, MongoDB, Socket.io, Redis, and LiveKit.

---

## ✨ Features

### 💬 Real-Time Messaging

* One-to-one private conversations
* Instant message delivery
* Typing indicators
* Read receipts (seen status)
* Online/offline user presence

### 📷 Media Sharing

* Image uploads and sharing
* Voice note recording and playback
* Cloud-based media storage via Cloudinary

### 📞 Audio & Video Calling

* WebRTC-powered communication
* LiveKit SFU integration
* Secure room token generation
* Real-time call signaling using Socket.io

### 🔐 Authentication & Security

* JWT-based authentication
* Google OAuth 2.0 login
* OTP email verification
* bcrypt password hashing
* Protected API routes

### 👤 User Management

* Profile customization
* Avatar uploads
* User search functionality
* Block and unblock users
* Mute conversations

### 🛡️ Admin Dashboard

* User management
* Ban/unban accounts
* Promote users to admin
* Message moderation
* Application configuration management

### 🎨 Branding & Configuration

* Custom application logo
* Dynamic sidebar icons
* Feature toggles
* Runtime configuration updates

---

## 🏗️ Tech Stack

### Frontend

* React 18
* Vite
* Tailwind CSS
* Vanilla CSS
* Zustand
* React Router DOM
* Socket.io Client
* LiveKit Client SDK
* Lucide React

### Backend

* Node.js
* Express.js
* Socket.io
* MongoDB
* Mongoose
* Passport.js
* JWT Authentication
* Multer

### Cloud & Infrastructure

* MongoDB Atlas
* Redis (Upstash)
* Cloudinary
* LiveKit Cloud
* Vercel
* Render

---

## 📁 Project Structure

```text
Echo/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── utils/
│   └── server.js
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        ├── hooks/
        ├── pages/
        ├── store/
        ├── utils/
        ├── App.jsx
        └── main.jsx
```

---

## 🗄️ Database Design

### User

* Authentication details
* Profile information
* Avatar storage
* Online presence
* Blocked users
* Muted conversations

### Conversation

* Chat participants
* Last message reference

### Message

* Text messages
* Image messages
* Voice notes
* Seen status

### OTP

* Registration verification
* Auto-expiring records

### AppConfig

* Branding controls
* Feature flags
* Dynamic settings

---

## 🔄 System Architecture

```text
React Frontend
      │
      ▼
Express API + Socket.io
      │
 ┌────┼────┐
 ▼    ▼    ▼
Mongo Redis Cloudinary
      │
      ▼
   LiveKit
```

---

## 📡 Core API Modules

### Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/verify-otp
GET  /auth/me
```

### Users

```http
PUT /user/profile
GET /user/search
PUT /user/block/:userId
PUT /user/unblock/:userId
```

### Conversations

```http
POST /conversation
GET /conversation
```

### Messages

```http
POST /message
GET /message/:convId
```

### LiveKit

```http
POST /livekit/token
```

### Admin

```http
GET /admin/stats
GET /admin/users
PUT /admin/user/:id/ban
DELETE /admin/message/:id
```

---

## 📞 Calling Workflow

1. User initiates call.
2. Socket.io sends call request.
3. Recipient receives incoming call event.
4. LiveKit access tokens are generated.
5. Both users join the LiveKit room.
6. Audio and video streams are exchanged through WebRTC.

---

## 🔒 Security Features

* JWT Authentication
* Google OAuth 2.0
* OTP Verification
* bcrypt Password Hashing
* Protected Routes
* Role-Based Access Control (RBAC)
* Secure Environment Variables
* Cloud Media Access Controls

---

## 🚀 Installation & Local Setup

### Clone Repository

```bash
git clone https://github.com/yourusername/echo.git
cd echo
```

### Backend Setup (Hono & Cloudflare Workers)

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create your local development environment secrets file:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
   Open `.dev.vars` and populate it with your development API keys and database strings.

3. Start the local development server (boots Hono via `@hono/node-server` and attaches `socket.io` for full real-time WebSocket capabilities locally):
   ```bash
   npm run dev
   ```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## ☁️ Cloudflare deployment

The Echo backend is fully migration-ready for serverless deployment on **Cloudflare Workers**.

### 1. Set up Production Secrets

First, configure all environment credentials securely using Cloudflare Secrets (do not hardcode these in `wrangler.jsonc`):

```bash
npx wrangler secret put MONGO_URI
npx wrangler secret put REDIS_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put CLOUDINARY_CLOUD_NAME
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put EMAIL_USER
npx wrangler secret put EMAIL_PASS
npx wrangler secret put LIVEKIT_API_KEY
npx wrangler secret put LIVEKIT_API_SECRET
npx wrangler secret put LIVEKIT_URL
```

### 2. Deploy the Worker

Deploy your serverless Hono instance directly to the global edge:

```bash
npm run deploy
```

---

## 🎯 Key Highlights

* Real-time communication platform
* WebRTC audio/video calling
* Socket.io-powered messaging
* Redis-backed online presence tracking
* Cloud-based media management
* Admin moderation dashboard
* Scalable cloud-native architecture
* Mobile-responsive glassmorphic UI

---

## 📸 Screenshots

Add screenshots here:

```text
screenshots/
├── login.png
├── chats.png
├── video-call.png
├── profile.png
└── admin-dashboard.png
```

---

## 👨‍💻 Author

**Sai Silam**

* GitHub: https://github.com/yourusername
* LinkedIn: https://linkedin.com/in/yourprofile

---

## ⭐ Support

If you found this project useful, consider giving it a star on GitHub.

```bash
⭐ Star this repository
🍴 Fork this repository
```
