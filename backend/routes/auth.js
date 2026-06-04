const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, verifyOTP, resendOTP, login, googleCallback, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/verifyToken');

// Local auth
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);

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
