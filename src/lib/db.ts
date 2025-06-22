import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { loginCodes, prizes } from './schema';

const sqlite = new Database('sqlite.db');   // same path you used in drizzle.config.ts
export const db = drizzle(sqlite);

export { loginCodes, prizes };