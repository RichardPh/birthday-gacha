// // drizzle.config.ts   (project root)
// import { defineConfig } from 'drizzle-kit';

// export default defineConfig({
//   dialect: 'sqlite',
//   schema: './src/lib/schema.ts',
//   out: './drizzle',

//   // NEW: tell Drizzle where the DB should live
//   dbCredentials: {
//     url: 'file:./sqlite.db',   // ← will be created automatically if missing
//   },
// });


// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'turso',
  schema: './src/lib/schema.ts',
  dbCredentials: {
    url:       process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
