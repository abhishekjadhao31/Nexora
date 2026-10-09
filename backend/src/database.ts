import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

let pool: pg.Pool | undefined;

export function getDatabase(): pg.Pool {
  pool ??= new Pool({
    connectionString: config.databaseUrl,
    connectionTimeoutMillis: 3000,
    max: 10
  });
  return pool;
}

export async function closeDatabase(): Promise<void> {
  await pool?.end();
  pool = undefined;
}
