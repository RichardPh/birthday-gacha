import path from 'path';
import fs   from 'fs';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { loginCodes, prizes } from './schema';

/* Where the read-only database is bundled */
const BUNDLED_DB = path.join(process.cwd(), 'sqlite.db');

/* Writable location for this invocation */
const RUNTIME_DB = process.env.VERCEL ? '/tmp/sqlite.db' : BUNDLED_DB;

/* On Vercel, copy once per cold-start */
if (process.env.VERCEL && !fs.existsSync(RUNTIME_DB)) {
  fs.copyFileSync(BUNDLED_DB, RUNTIME_DB);
}

const sqlite = new Database(RUNTIME_DB, { fileMustExist: false });
export const db = drizzle(sqlite);

export { loginCodes, prizes };
