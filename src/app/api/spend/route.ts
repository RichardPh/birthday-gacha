/* ------------------------------------------------------------------
 *  POST /api/spend
 *  body: { code: string }
 *
 *  • verifies the login-code exists and has credits left
 *  • refuses if a prize is already chosen
 *  • picks ONE random prize
 *  • increments spent in the same request
 *  • returns { ok:true, prize:{ id, name, imageUrl } }
 * ----------------------------------------------------------------- */

export const runtime  = 'nodejs';        // native modules allowed
export const dynamic  = 'force-dynamic'; // disable static opt-in

import { NextRequest, NextResponse } from 'next/server';
import { db, loginCodes, prizes } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  /* 1️⃣  fetch login-code row */
  const row = await db
    .select()
    .from(loginCodes)
    .where(eq(loginCodes.code, code))
    .get();

  /* guard: not found (libSQL may return {} instead of undefined) */
  if (!row || Object.keys(row).length === 0) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
  }

  /* guard: prize already locked */
  if (row.chosenPrizeId) {
    return NextResponse.json(
      { error: 'Prize already chosen' },
      { status: 403 }
    );
  }

  /* remaining credits (cast strings/null → number) */
  const credits = Number(row.credits ?? 0);
  const spent   = Number(row.spent   ?? 0);

  if (spent >= credits) {
    return NextResponse.json({ error: 'No credits left' }, { status: 403 });
  }

  /* 2️⃣  pick ONE random prize */
  const prize = await db
    .select()
    .from(prizes)
    .orderBy(sql`RANDOM()`)
    .limit(1)
    .get();

  if (!prize) {
    return NextResponse.json(
      { error: 'No prizes available' },
      { status: 500 }
    );
  }

  /* 3️⃣  atomically increment spent */
  await db
    .update(loginCodes)
    .set({ spent: sql`${loginCodes.spent} + 1` })
    .where(eq(loginCodes.code, code))
    .run();

  /* 4️⃣  return the prize */
  return NextResponse.json({ ok: true, prize });
}
