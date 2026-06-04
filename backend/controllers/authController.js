const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const generateToken = require('../utils/generateToken');
const { sendOTPEmail } = require('../utils/sendOTP');

// ─── POST /auth/register ──────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required.' });

    if (username.length < 3 || username.length > 30)
      return res.status(400).json({ message: 'Username must be 3-30 characters.' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const emailLower = email.toLowerCase().trim();
    const usernameLower = username.toLowerCase().trim();

    const existingEmail = await User.findOne({ email: emailLower });
    if (existingEmail) return res.status(409).json({ message: 'Email already registered.' });

    const existingUsername = await User.findOne({ username: { $regex: new RegExp(`^${usernameLower}$`, 'i') } });
    if (existingUsername) return res.status(409).json({ message: 'Username already taken.' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: emailLower });

    // Save OTP + pending registration data
    await OTP.create({
      email: emailLower,
      otp,
      pendingData: { username: usernameLower, passwordHash },
    });

    // Send OTP email
    await sendOTPEmail(emailLower, otp, username);

    res.status(200).json({ message: 'OTP sent to your email. Please verify to complete registration.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required.' });

    const emailLower = email.toLowerCase().trim();
    const otpRecord = await OTP.findOne({ email: emailLower });

    if (!otpRecord) return res.status(400).json({ message: 'OTP expired or not found. Please register again.' });
    if (otpRecord.otp !== otp.toString().trim())
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });

    // Create the user
    const user = await User.create({
      username: otpRecord.pendingData.username,
      email: emailLower,
      passwordHash: otpRecord.pendingData.passwordHash,
      provider: 'local',
      isVerified: true,
    });

    // Cleanup OTP
    await OTP.deleteMany({ email: emailLower });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /auth/resend-otp ────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const emailLower = email.toLowerCase().trim();
    const otpRecord = await OTP.findOne({ email: emailLower });
    if (!otpRecord) return res.status(400).json({ message: 'No pending registration found for this email.' });

    const otp = crypto.randomInt(100000, 999999).toString();
    otpRecord.otp = otp;
    otpRecord.createdAt = new Date();
    await otpRecord.save();

    await sendOTPEmail(emailLower, otp, otpRecord.pendingData.username);
    res.status(200).json({ message: 'New OTP sent to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    if (user.isBanned) return res.status(403).json({ message: 'This account has been banned.' });
    if (!user.isVerified) return res.status(401).json({ message: 'Please verify your email first.' });
    if (user.provider === 'google')
      return res.status(400).json({ message: 'This account uses Google login.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = generateToken(user);
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        bio: user.bio,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /auth/google/callback ────────────────────────────────────────────────
const googleCallback = (req, res) => {
  try {
    const token = generateToken(req.user);
    // Always redirect to the FRONTEND (never the backend port)
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    console.log(`✅ Google OAuth success → redirecting to ${frontendUrl}/google-success`);
    res.redirect(`${frontendUrl}/google-success?token=${token}`);
  } catch (err) {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
};

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, verifyOTP, resendOTP, login, googleCallback, getMe };
