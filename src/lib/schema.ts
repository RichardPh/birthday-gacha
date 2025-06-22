// src/lib/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const loginCodes = sqliteTable('login_codes', {
  code:          text('code').primaryKey(),
  game:          text('game').notNull(),
  credits:       integer('credits').notNull().default(3),
  spent:         integer('spent').notNull().default(0),
  chosenPrizeId: integer('chosen_prize_id'),          // NEW → nullable FK to prizes.id
});

export const prizes = sqliteTable('prizes', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull(),
  imageUrl:  text('image_url'),          // nullable → some prizes can be text-only
  weight:    integer('weight').default(1) // optional for rarity weighting
});