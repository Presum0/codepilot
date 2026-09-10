import fs from 'node:fs';
import path from 'node:path';
import { pool } from './index.js';

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log("Running migrations...");
    await pool.query(sql);
    console.log("Migrations applied successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
