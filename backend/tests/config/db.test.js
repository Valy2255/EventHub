// backend/tests/config/db.test.js
import { jest } from '@jest/globals';

const fakeDbConfig = {
  user: 'u',
  host: 'h',
  database: 'd',
  password: 'p',
  port: 1234,
};

// 1) Mock your config module so config.db === fakeDbConfig
jest.unstable_mockModule('../../config/config.js', () => ({
  default: { db: fakeDbConfig }
}));

// 2) Create a fake pool and mock 'pg' to export it as the default
const mPool = { query: jest.fn() };
jest.unstable_mockModule('pg', () => ({
  default: { Pool: jest.fn(() => mPool) }
}));

describe('db.js', () => {
  let Pool;
  let db;

  beforeAll(async () => {
    // 3) Load the mocked modules and then your db.js
    const pg = await import('pg');
    Pool = pg.default.Pool;

    db = await import('../../config/db.js');
  });

  it('constructs pg.Pool with config.db settings', () => {
    expect(Pool).toHaveBeenCalledWith(fakeDbConfig);
  });

  it('query() delegates to the pool.query method', () => {
    db.query('SELECT 1', [1]);
    expect(mPool.query).toHaveBeenCalledWith('SELECT 1', [1]);
  });
});
