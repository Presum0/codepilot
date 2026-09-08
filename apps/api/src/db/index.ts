import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database persistence will fail if invoked.");
}

export const pool = new Pool({
  connectionString,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
