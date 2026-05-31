import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// 1. Go to console.cloud.google.com
// 2. Create new project → Enable Google+ API
// 3. OAuth 2.0 Credentials → Create
// 4. Authorized redirect URI: http://localhost:5000/api/auth/google/callback
// 5. For production: https://yourbackend.com/api/auth/google/callback

const configurePassport = () => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret || clientID === 'your_google_client_id') {
    console.log('[PASSPORT] Google OAuth client credentials missing or in mock mode. Passport registration skipped.');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID,
    clientSecret,
    callbackURL: '/api/auth/google/callback',
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user by googleId / email
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
          // Link Google to existing account
          user.googleId = profile.id;
          user.isEmailVerified = true; // Google already verified email
          user.avatar = profile.photos?.[0]?.value || null;
          user.authProvider = 'google';
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: `GoogleOauthSecurePassword_${Math.random()}`, // Dummy password for oauth
            googleId: profile.id,
            isEmailVerified: true,
            role: 'user',
            avatar: profile.photos?.[0]?.value || null,
            authProvider: 'google',
            registrationIp: req.ip || '127.0.0.1'
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
};

export default configurePassport;
