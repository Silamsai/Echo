import { Hono } from 'hono';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    register, verifyOTP, resendOTP, login,
    googleCallback, getMe, forgotPassword, resetPassword,
    googleRedirect
} from '../controllers/authController.js';

const auth = new Hono();

// Local auth
auth.post('/register', register);
auth.post('/verify-otp', verifyOTP);
auth.post('/resend-otp', resendOTP);
auth.post('/login', login);
auth.post('/forgot-password', forgotPassword);
auth.post('/reset-password', resetPassword);

// Diagnostic endpoint
auth.get('/diag', (c) => {
    const env = c.env;
    return c.json({
        GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID ? `${env.GOOGLE_CLIENT_ID.substring(0, 15)}...` : 'Not Set',
        GOOGLE_CALLBACK_URL: env.GOOGLE_CALLBACK_URL || 'Not Set (defaults to localhost)',
        FRONTEND_URL: env.FRONTEND_URL || 'Not Set',
    });
});

// Google OAuth2 — Workers can't use Passport. Use manual redirect flow.
auth.get('/google', googleRedirect);
auth.get('/google/callback', googleCallback);

// Protected
auth.get('/me', verifyToken, getMe);

export default auth;



