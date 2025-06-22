export const runtime = 'nodejs';      // 👈 run in Node, not Edge
export const dynamic = 'force-dynamic'; // avoid file-system caching

// src/app/api/spend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, loginCodes, prizes } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

/**
 * POST /api/spend
 * body: { code: string }
 *
 * • verifies the login-code exists and still has credits
 * • refuses if a prize is already chosen
 * • decrements credits (spent)
 * • returns a random prize row  →  { ok:true, prize:{ id,name,imageUrl } }
 */
export async function POST(req: NextRequest) {
  const { code } = await req.json();

  /* 1️⃣  fetch the login-code row */
  const row = db
    .select()
    .from(loginCodes)
    .where(eq(loginCodes.code, code))
    .get();

  if (!row) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
  }
  if (row.chosenPrizeId) {
    return NextResponse.json(
      { error: 'Prize already chosen' },
      { status: 403 }
    );
  }
  if (row.spent >= row.credits) {
    return NextResponse.json({ error: 'No credits left' }, { status: 403 });
  }

  /* 2️⃣  pick one random prize (SQLite RANDOM() is fine for casual odds) */
  const prize =
    db
      .select()
      .from(prizes)
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .get() ?? { id: 0, name: 'Mystery Gift', imageUrl: null };

  /* 3️⃣  atomically increment spent */
  db.update(loginCodes)
    .set({ spent: sql`${loginCodes.spent} + 1` })
    .where(eq(loginCodes.code, code))
    .run();

  /* 4️⃣  return the prize */
  return NextResponse.json({ ok: true, prize });
}
