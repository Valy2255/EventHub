// backend/services/BaseService.js
import * as db from '../config/db.js';

export class BaseService {
  constructor() {
    this.db = db;
  }

  async executeInTransaction(callback) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}