// backend/config/db.js
import pg from 'pg';
import config from './config.js';

const { Pool } = pg;

const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.database,
  password: config.db.password,
  port: config.db.port,
});

export const query = (text, params) => pool.query(text, params);