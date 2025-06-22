// src/app/api/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db, loginCodes } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { code, prizeId } = await req.json();

  db.update(loginCodes)
    .set({ chosenPrizeId: prizeId })
    .where(eq(loginCodes.code, code))
    .run();

  return NextResponse.json({ ok: true });
}
