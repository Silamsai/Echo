const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, verifyOTP, resendOTP, login, googleCallback, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/verifyToken');

// Local auth
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Diagnostic endpoint to check env vars
router.get('/diag', (req, res) => {
  res.json({
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 15)}...` : 'Not Set',
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'Not Set (defaults to localhost)',
    FRONTEND_URL: process.env.FRONTEND_URL || 'Not Set',
    NODE_ENV: process.env.NODE_ENV || 'Not Set',
  });
});

// Google OAuth2
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
  googleCallback
);

// Protected
router.get('/me', verifyToken, getMe);

module.exports = router;
