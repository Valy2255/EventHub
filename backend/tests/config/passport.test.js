// backend/tests/config/passport.test.js
import { jest } from '@jest/globals';

// Mock the 'passport' package
jest.unstable_mockModule('passport', () => ({
  default: { use: jest.fn() }
}));

// Mock the models
jest.unstable_mockModule('../../models/User.js', () => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
}));
jest.unstable_mockModule('../../models/SocialAccount.js', () => ({
  findByProviderAndProviderId: jest.fn(),
  create: jest.fn(),
}));

describe('passport.js', () => {
  const OLD_ENV = process.env;
  let warnSpy, errorSpy;

  beforeEach(() => {
    jest.resetModules(); // clear the import cache
    process.env = { ...OLD_ENV, NODE_ENV:'test' };

    // silence and spy on console.warn and console.error
    warnSpy  = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    process.env = OLD_ENV;
  });

  it('registers JWT, Google & Facebook strategies when all env vars are set', async () => {
    Object.assign(process.env, {
      JWT_SECRET: 's',
      JWT_EXPIRES_IN: '1h',
      GOOGLE_CLIENT_ID: 'g1',
      GOOGLE_CLIENT_SECRET: 'g2',
      GOOGLE_CALLBACK_URL: '/gcb',
      FACEBOOK_APP_ID: 'f1',
      FACEBOOK_APP_SECRET: 'f2',
      FACEBOOK_CALLBACK_URL: '/fcb',
    });

    await import('../../config/passport.js');
    const { default: passport } = await import('passport');

    expect(passport.use).toHaveBeenCalledTimes(3);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('warns on missing JWT_SECRET and errors on missing OAuth creds', async () => {
    // Mock passport-jwt for this test case
    jest.unstable_mockModule('passport-jwt', () => ({
      Strategy: jest.fn(function MockJwtStrategy(options, verifyCallback) {
        this.name = 'jwt';
      }),
      ExtractJwt: {
        fromAuthHeaderAsBearerToken: jest.fn(() => jest.fn()),
      },
    }));

    // Mock passport-google-oauth20 for this test case
    jest.unstable_mockModule('passport-google-oauth20', () => ({
      Strategy: jest.fn(function MockGoogleStrategy(options, verifyCallback) {
        this.name = 'google';
      })
    }));

    // Mock passport-facebook for this test case
    jest.unstable_mockModule('passport-facebook', () => ({
      Strategy: jest.fn(function MockFacebookStrategy(options, verifyCallback) {
        this.name = 'facebook';
      })
    }));

    // Remove the required envs
    delete process.env.JWT_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.FACEBOOK_APP_ID;
    delete process.env.FACEBOOK_APP_SECRET;

    // Import passport.js AFTER setting up all mocks
    await import('../../config/passport.js');
    const { default: passport } = await import('passport');

    // Assertions
    expect(passport.use).toHaveBeenCalledTimes(3); // Should still attempt to register all 3
    
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('JWT_SECRET')
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Google OAuth credentials are missing') // More specific match from passport.js
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Facebook OAuth credentials are missing') // More specific match from passport.js
    );
  });
});