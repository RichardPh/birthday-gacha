// drizzle.config.ts   (project root)
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/schema.ts',
  out: './drizzle',

  // NEW: tell Drizzle where the DB should live
  dbCredentials: {
    url: 'file:./sqlite.db',   // ← will be created automatically if missing
  },
});
