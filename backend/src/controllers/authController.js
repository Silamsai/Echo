import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import PasswordReset from '../models/PasswordReset.js';
import generateToken from '../utils/generateToken.js';
import { sendOTPEmail, sendResetEmail } from '../utils/sendOTP.js';
import AppConfig from '../models/AppConfig.js';

// ─── POST /auth/register ──────────────────────────────────────────────────────
export const register = async (c) => {
    try {
        const { username, email, password } = await c.req.json();
        if (!username || !email || !password)
            return c.json({ message: 'All fields are required.' }, 400);

        if (username.length < 3 || username.length > 30)
            return c.json({ message: 'Username must be 3-30 characters.' }, 400);

        if (password.length < 6)
            return c.json({ message: 'Password must be at least 6 characters.' }, 400);

        const emailLower = email.toLowerCase().trim();
        const usernameLower = username.toLowerCase().trim();

        const existingEmail = await User.findOne({ email: emailLower });
        if (existingEmail) return c.json({ message: 'Email already registered.' }, 409);

        const existingUsername = await User.findOne({ username: { $regex: new RegExp(`^${usernameLower}$`, 'i') } });
        if (existingUsername) return c.json({ message: 'Username already taken.' }, 409);

        const passwordHash = await bcrypt.hash(password, 10);

        let config = await AppConfig.findOne({ key: 'main_config' });
        if (!config) {
            config = await AppConfig.create({ key: 'main_config' });
        }

        if (config.features?.otpVerification === false) {
            const user = await User.create({
                username: usernameLower,
                email: emailLower,
                passwordHash,
                provider: 'local',
                isVerified: true,
            });

            const token = generateToken(user, c.env);
            return c.json({
                message: 'Registration successful! ✅',
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    isAdmin: user.isAdmin,
                },
            }, 201);
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        await OTP.deleteMany({ email: emailLower });
        await OTP.create({
            email: emailLower,
            otp,
            pendingData: { username: usernameLower, passwordHash },
        });

        // Fire-and-forget email (best effort in Workers)
        sendOTPEmail(emailLower, otp, username, c.env).catch(err => {
            console.error('Failed to send registration OTP email:', err);
        });

        return c.json({ message: 'OTP sent to your email. Please verify to complete registration.' }, 200);
    } catch (err) {
        console.error('Register error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────
export const verifyOTP = async (c) => {
    try {
        const { email, otp } = await c.req.json();
        if (!email || !otp)
            return c.json({ message: 'Email and OTP are required.' }, 400);

        const emailLower = email.toLowerCase().trim();
        const otpRecord = await OTP.findOne({ email: emailLower });

        if (!otpRecord) return c.json({ message: 'OTP expired or not found. Please register again.' }, 400);
        if (otpRecord.otp !== otp.toString().trim())
            return c.json({ message: 'Incorrect OTP. Please try again.' }, 400);

        const user = await User.create({
            username: otpRecord.pendingData.username,
            email: emailLower,
            passwordHash: otpRecord.pendingData.passwordHash,
            provider: 'local',
            isVerified: true,
        });

        await OTP.deleteMany({ email: emailLower });

        const token = generateToken(user, c.env);
        return c.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin,
            },
        }, 201);
    } catch (err) {
        console.error('Verify OTP error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /auth/resend-otp ────────────────────────────────────────────────────
export const resendOTP = async (c) => {
    try {
        const { email } = await c.req.json();
        if (!email) return c.json({ message: 'Email is required.' }, 400);

        const emailLower = email.toLowerCase().trim();
        const otpRecord = await OTP.findOne({ email: emailLower });
        if (!otpRecord) return c.json({ message: 'No pending registration found for this email.' }, 400);

        const otp = crypto.randomInt(100000, 999999).toString();
        otpRecord.otp = otp;
        otpRecord.createdAt = new Date();
        await otpRecord.save();

        sendOTPEmail(emailLower, otp, otpRecord.pendingData.username, c.env).catch(err => {
            console.error('Failed to resend OTP email:', err);
        });
        return c.json({ message: 'New OTP sent to your email.' }, 200);
    } catch (err) {
        console.error('Resend OTP error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────
export const login = async (c) => {
    try {
        const { email, password } = await c.req.json();
        if (!email || !password)
            return c.json({ message: 'Email and password are required.' }, 400);

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return c.json({ message: 'Invalid email or password.' }, 401);
        if (user.isBanned) return c.json({ message: 'This account has been banned.' }, 403);
        if (!user.isVerified) return c.json({ message: 'Please verify your email first.' }, 401);
        if (user.provider === 'google')
            return c.json({ message: 'This account uses Google login.' }, 400);

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return c.json({ message: 'Invalid email or password.' }, 401);

        const token = generateToken(user, c.env);
        return c.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                isAdmin: user.isAdmin,
                bio: user.bio,
            },
        }, 200);
    } catch (err) {
        console.error('Login error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── GET /auth/google — Manual OAuth2 Redirect ───────────────────────────────
export const googleRedirect = (c) => {
    const clientId = c.env.GOOGLE_CLIENT_ID;
    const callbackUrl = c.env.GOOGLE_CALLBACK_URL || `${new URL(c.req.url).origin}/auth/google/callback`;

    if (!clientId) {
        return c.json({ message: 'Google login not configured.' }, 500);
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: 'openid profile email',
        access_type: 'offline',
        prompt: 'consent',
    });

    return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

// ─── GET /auth/google/callback ────────────────────────────────────────────────
export const googleCallback = async (c) => {
    const frontendUrl = (c.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

    try {
        const code = c.req.query('code');
        if (!code) {
            return c.redirect(`${frontendUrl}/login?error=google_failed`);
        }

        const callbackUrl = c.env.GOOGLE_CALLBACK_URL || `${new URL(c.req.url).origin}/auth/google/callback`;

        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: c.env.GOOGLE_CLIENT_ID,
                client_secret: c.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: callbackUrl,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error('Google token exchange failed:', tokenData);
            return c.redirect(`${frontendUrl}/login?error=google_failed`);
        }

        // Fetch user profile
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileRes.json();

        // Find or create user
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
            user = await User.findOne({ email: profile.email.toLowerCase() });
            if (user) {
                user.googleId = profile.id;
                user.provider = 'google';
                await user.save();
            } else {
                const baseUsername = (profile.name || 'user').replace(/\s+/g, '').toLowerCase();
                let username = baseUsername;
                let counter = 1;
                while (await User.findOne({ username })) {
                    username = `${baseUsername}${counter++}`;
                }
                user = await User.create({
                    googleId: profile.id,
                    username,
                    email: profile.email.toLowerCase(),
                    avatar: profile.picture || '',
                    provider: 'google',
                    isVerified: true,
                });
            }
        }

        const token = generateToken(user, c.env);
        console.log(`✅ Google OAuth success → redirecting to ${frontendUrl}/google-success`);
        return c.redirect(`${frontendUrl}/google-success?token=${token}`);
    } catch (err) {
        console.error('Google callback error:', err);
        return c.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
};

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
export const getMe = async (c) => {
    try {
        const user = await User.findById(c.get('user')._id).select('-passwordHash');
        return c.json(user, 200);
    } catch (err) {
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /auth/forgot-password ──────────────────────────────────────────────
export const forgotPassword = async (c) => {
    try {
        const { email } = await c.req.json();
        if (!email) return c.json({ message: 'Email is required.' }, 400);

        const emailLower = email.toLowerCase().trim();
        const user = await User.findOne({ email: emailLower });
        if (!user) return c.json({ message: 'User not found.' }, 404);

        if (user.provider === 'google') {
            return c.json({ message: 'This account was registered using Google Sign-In.' }, 400);
        }

        const code = crypto.randomInt(100000, 999999).toString();
        await PasswordReset.deleteMany({ email: emailLower });
        await PasswordReset.create({ email: emailLower, code });

        sendResetEmail(emailLower, code, user.username, c.env).catch(err => {
            console.error('Failed to send reset email:', err);
        });

        return c.json({ message: 'Password reset code sent to your email.' }, 200);
    } catch (err) {
        console.error('Forgot password error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};

// ─── POST /auth/reset-password ────────────────────────────────────────────────
export const resetPassword = async (c) => {
    try {
        const { email, code, password } = await c.req.json();
        if (!email || !code || !password) {
            return c.json({ message: 'All fields (email, code, password) are required.' }, 400);
        }

        if (password.length < 6) {
            return c.json({ message: 'Password must be at least 6 characters.' }, 400);
        }

        const emailLower = email.toLowerCase().trim();
        const resetRecord = await PasswordReset.findOne({ email: emailLower });
        if (!resetRecord) {
            return c.json({ message: 'Reset code expired or not found. Please try again.' }, 400);
        }

        if (resetRecord.code !== code.toString().trim()) {
            return c.json({ message: 'Incorrect verification code. Please check your email.' }, 400);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.findOne({ email: emailLower });
        if (!user) return c.json({ message: 'User not found.' }, 404);

        user.passwordHash = passwordHash;
        await user.save();
        await PasswordReset.deleteMany({ email: emailLower });

        return c.json({ message: 'Password reset successfully! You can now log in.' }, 200);
    } catch (err) {
        console.error('Reset password error:', err);
        return c.json({ message: 'Server error.' }, 500);
    }
};
