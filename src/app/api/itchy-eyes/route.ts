import { NextRequest, NextResponse } from 'next/server';
import { db, loginCodes, prizes } from '@/lib/db';
import { eq } from 'drizzle-orm';

/**
 * POST /api/itchy-eyes
 * Body: { code: string }
 * Locks prize “Øyemassasje” (id 999) to the given login code
 * and returns { prize }
 */
export async function POST(req: NextRequest) {
  const { code } = await req.json() as { code?: string };

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  /* 1️⃣ validate login code */
  const row = await db
    .select()
    .from(loginCodes)
    .where(eq(loginCodes.code, code))
    .get();

  if (!row) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
  }

  /* 2️⃣ already claimed? just echo the existing prize */
  if (row.chosenPrizeId) {
    const prize = await db
      .select()
      .from(prizes)
      .where(eq(prizes.id, row.chosenPrizeId))
      .get();

    return NextResponse.json({ prize });             // 200
  }

  /* 3️⃣ lock the eye-massager prize */
  const prize = await db
    .select()
    .from(prizes)
    .where(eq(prizes.name, 'Øyemassasje'))
    .get();

  if (!prize) {
    return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
  }

  await db
    .update(loginCodes)
    .set({
      chosenPrizeId: prize.id,
      spent: row.credits,        // freeze remaining credits
    })
    .where(eq(loginCodes.code, code))
    .run();

  return NextResponse.json({ prize });               // 200
}
