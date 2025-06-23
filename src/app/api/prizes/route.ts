// src/app/api/prizes/route.ts
export const runtime = 'nodejs';
import { db, prizes } from '@/lib/db';

export async function GET() {
  const rows = await db.select().from(prizes).all();
  return Response.json(rows);
}
