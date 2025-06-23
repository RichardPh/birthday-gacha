// scripts/migrate-to-turso.ts
import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { createClient } from '@libsql/client';
import { drizzle as drizzleTurso } from 'drizzle-orm/libsql';

import { loginCodes, prizes } from '../src/lib/schema';

/* 1️⃣ local (source) */
const local = drizzleSqlite(new Database('sqlite.db'));

/* 2️⃣ Turso (target) */
const turso = drizzleTurso(
  createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN!,
  })
);

/* 3️⃣ migrate each table */
async function migrate() {
  const rows1 = local.select().from(loginCodes).all();
  const rows2 = local.select().from(prizes).all();

  await turso.insert(loginCodes).values(rows1).onConflictDoNothing().run();
  await turso.insert(prizes).values(rows2).onConflictDoNothing().run();

  console.log('Migration complete 🎉');
}

migrate().then(() => process.exit(0));