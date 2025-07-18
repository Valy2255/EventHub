// backend/config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import * as User from '../models/User.js';
import * as SocialAccount from '../models/SocialAccount.js';
import config from './config.js';

// Configure JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: config.jwt.secret
};

if (!config.jwt.secret || config.jwt.secret === 'your_secure_secret_key') {
  console.warn('WARNING: JWT_SECRET is not properly set. Authentication will be insecure!');
}

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload.user.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

if (!config.google.clientId || !config.google.clientSecret) {
  console.error('Google OAuth credentials are missing. Check your .env file.');
} else {
  console.log('Google OAuth credentials loaded successfully.');
}

// Configure Google Strategy
passport.use(new GoogleStrategy({
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackUrl
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let socialAccount = await SocialAccount.findByProviderAndProviderId('google', profile.id);
    
    if (socialAccount) {
      const user = await User.findById(socialAccount.user_id);
      if (user) {
        return done(null, user);
      }
    }
    
    let user = await User.findByEmail(profile.emails[0].value);
    
    if (!user) {
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: Math.random().toString(36).slice(-10)
      });
    }
    
    if (!socialAccount) {
      await SocialAccount.create({
        user_id: user.id,
        provider: 'google',
        provider_id: profile.id,
        provider_data: profile
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

if (!config.facebook.appId || !config.facebook.appSecret) {
  console.error('Facebook OAuth credentials are missing. Check your .env file.');
} else {
  console.log('Facebook OAuth credentials loaded successfully.');
}

passport.use(new FacebookStrategy({
  clientID: config.facebook.appId,
  clientSecret: config.facebook.appSecret,
  callbackURL: config.facebook.callbackUrl,
  profileFields: ['id', 'emails', 'name']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let socialAccount = await SocialAccount.findByProviderAndProviderId('facebook', profile.id);
    
    if (socialAccount) {
      const user = await User.findById(socialAccount.user_id);
      if (user) {
        return done(null, user);
      }
    }
    
    let user = null;
    
    if (profile.emails && profile.emails.length > 0) {
      user = await User.findByEmail(profile.emails[0].value);
    }
    
    if (!user) {
      const name = `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() || 'Facebook User';
      const email = profile.emails ? profile.emails[0].value : `fb_${profile.id}@example.com`;
      
      user = await User.create({
        name,
        email,
        password: Math.random().toString(36).slice(-10)
      });
    }
    
    if (!socialAccount) {
      await SocialAccount.create({
        user_id: user.id,
        provider: 'facebook',
        provider_id: profile.id,
        provider_data: profile
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

export default passport;