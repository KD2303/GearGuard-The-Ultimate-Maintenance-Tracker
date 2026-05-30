const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/user');

const handleSSO = async (provider, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : null;
    
    if (!email) {
      return done(null, false, { message: `No email associated with this ${provider} account.` });
    }

    // Check domain whitelist (Bonus requirement)
    const allowedDomains = process.env.ALLOWED_SSO_DOMAINS ? process.env.ALLOWED_SSO_DOMAINS.split(',') : [];
    if (allowedDomains.length > 0) {
      const domain = email.split('@')[1];
      if (!allowedDomains.includes(domain)) {
        return done(null, false, { message: `Domain ${domain} is not authorized for SSO.` });
      }
    }

    let user = await User.findOne({ email });

    if (user) {
      // If user exists but with a different provider (e.g., local), prevent takeover
      if (user.provider !== provider) {
        return done(null, false, { message: `Account exists with a different sign-in method. Please use your original method.` });
      }
      
      // Update providerId just in case
      if (user.providerId !== profile.id) {
        user.providerId = profile.id;
        await user.save();
      }
      return done(null, user);
    } else {
      // Create new user
      user = await User.create({
        name: profile.displayName || email.split('@')[0],
        email: email,
        provider: provider,
        providerId: profile.id,
        role: 'Technician', // Default role for SSO
        isActive: true
      });
      return done(null, user);
    }
  } catch (error) {
    return done(error, false);
  }
};

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'mock_google_id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_google_secret',
    callbackURL: '/api/v1/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    return handleSSO('google', profile, done);
  }
));

// Microsoft Strategy
passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID || 'mock_ms_id',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'mock_ms_secret',
    callbackURL: '/api/v1/auth/microsoft/callback',
    scope: ['user.read']
  },
  async (accessToken, refreshToken, profile, done) => {
    return handleSSO('microsoft', profile, done);
  }
));

// We are not using sessions, but passport requires serialization methods defined if session: true is used somewhere.
// We'll use session: false in routes, so these won't be strictly necessary, but good practice.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
