// scripts/seed.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

// adjust the path if you keep scripts/ inside src/
import { loginCodes } from '../src/lib/schema';

const db = drizzle(new Database('sqlite.db'));

db.insert(loginCodes)
  .values([
    { code: 'kev-95-30', game: 'gacha', credits: 3 },
  ])
  .run();                       // ← .run() executes immediately (no Promise)

console.log('Seeded 🎉');
