// src/app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, loginCodes, prizes } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const runtime  = 'nodejs';
export const dynamic  = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  /* fetch at most one row */
  const row =
    await db.select().from(loginCodes).where(eq(loginCodes.code, code)).get();

  /* ---- guard: row missing OR empty object ---- */
  if (!row || Object.keys(row).length === 0) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
  }

  /* prize already chosen → lock machine */
  if (row.chosenPrizeId) {
    const prize = await db
      .select()
      .from(prizes)
      .where(eq(prizes.id, row.chosenPrizeId))
      .get();
    return NextResponse.json({
      game: row.game,
      remaining: 0,
      chosenPrize: prize ?? null,
    });
  }

  /* remaining credits (cast because Turso returns strings) */
  const credits = Number(row.credits ?? 0);
  const spent   = Number(row.spent   ?? 0);
  const remaining = credits - spent;

  if (remaining <= 0) {
    return NextResponse.json({ error: 'No credits left' }, { status: 403 });
  }

  return NextResponse.json({
    game: row.game,
    remaining,
    chosenPrize: null,
  });
}
