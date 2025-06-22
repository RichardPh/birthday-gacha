// src/app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, loginCodes, prizes } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  /* 1️⃣  look up the login-code row */
  const row = db.select().from(loginCodes).where(eq(loginCodes.code, code)).get();

  if (!row) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
  }

  /* 2️⃣  if a prize is already locked we just return it */
  if (row.chosenPrizeId) {
    const prize = db
      .select()
      .from(prizes)
      .where(eq(prizes.id, row.chosenPrizeId))
      .get();

    return NextResponse.json({
      game: row.game,
      remaining: 0,            // handle should be locked
      chosenPrize: prize ?? null,
    });
  }

  /* 3️⃣  otherwise check remaining credits */
  const remaining = row.credits - row.spent;
  if (remaining <= 0) {
    return NextResponse.json({ error: 'No credits left' }, { status: 403 });
  }

  /* 4️⃣  normal success response (no chosen prize yet) */
  return NextResponse.json({
    game: row.game,
    remaining,
    chosenPrize: null,
  });
}
