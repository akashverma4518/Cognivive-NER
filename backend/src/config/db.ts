import { Pool, QueryResult } from 'pg';
import { ENV } from './env';

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Unexpected error on idle client:', err);
});

export const query = async (text: string, params?: any[]): Promise<QueryResult<any>> => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (ENV.NODE_ENV === 'development') {
    // console.log(`[SQL] ${text.substring(0, 80)}... (${duration}ms, ${res.rowCount} rows)`);
  }
  return res;
};
