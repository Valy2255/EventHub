// backend/tests/config/config.test.js
import { jest } from '@jest/globals';

describe('config.js', () => {
  // keep a copy of process.env so we can restore it
  const OLD = process.env;

  beforeEach(() => {
    jest.resetModules();           // clear the import cache
    // start “fresh” with NODE_ENV=test so dotenv and console.log are skipped
    process.env = { ...OLD, NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = OLD;
  });

  it('reads all env vars and applies overrides', async () => {
    Object.assign(process.env, {
      PORT: '4000',
      DB_USER: 'u',     DB_HOST: 'h',      DB_NAME: 'd',
      DB_PASSWORD: 'p', DB_PORT: '1234',
      JWT_SECRET: 's',  JWT_EXPIRES_IN: '1h',
      CLIENT_URL: 'https://app',
      EMAIL_HOST: 'smtp',
      EMAIL_PORT: '2526',
      EMAIL_SECURE: 'true',
      EMAIL_USER: 'me',
      EMAIL_PASS: 'pw',
      EMAIL_FROM_NAME: 'App'
    });

    const { default: config } = await import('../../config/config.js');

    expect(config.port).toBe('4000');
    expect(config.db).toMatchObject({
      user: 'u', host: 'h', database: 'd', password: 'p', port: '1234'
    });
    expect(config.jwt).toEqual({ secret: 's', expiresIn: '1h' });
    expect(config.cors).toEqual({ origin: 'https://app', credentials: true });
    expect(config.email).toMatchObject({
      host: 'smtp',
      port: 2526,
      secure: true,
      user: 'me',
      pass: 'pw',
      fromName: 'App'
    });
  });

  it('falls back to defaults when email env vars are missing', async () => {
    delete process.env.EMAIL_HOST;
    delete process.env.EMAIL_PORT;
    delete process.env.EMAIL_SECURE;
    delete process.env.EMAIL_FROM_NAME;

    const { default: config } = await import('../../config/config.js');

    expect(config.email.host).toBe('smtp.gmail.com');
    expect(typeof config.email.port).toBe('number');
    expect(config.email.secure).toBe(false);
    expect(config.email.fromName).toBe('EventHub');
  });
});
