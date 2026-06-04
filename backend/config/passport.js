const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ─── Local Strategy ──────────────────────────────────────────────────────────
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return done(null, false, { message: 'No account found with that email.' });
      if (user.provider === 'google')
        return done(null, false, { message: 'This account uses Google login.' });
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) return done(null, false, { message: 'Incorrect password.' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

// ─── Google OAuth2 Strategy ──────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            // Check if email already exists (local account)
            user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });
            if (user) {
              user.googleId = profile.id;
              user.provider = 'google';
              await user.save();
            } else {
              // Create new user from Google profile
              const baseUsername = profile.displayName.replace(/\s+/g, '').toLowerCase();
              let username = baseUsername;
              let counter = 1;
              while (await User.findOne({ username })) {
                username = `${baseUsername}${counter++}`;
              }
              user = await User.create({
                googleId: profile.id,
                username,
                email: profile.emails[0].value.toLowerCase(),
                avatar: profile.photos[0]?.value || '',
                provider: 'google',
                isVerified: true,
              });
            }
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else {
  console.warn('⚠️ Google Client ID/Secret not set. Google login will be disabled.');
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
