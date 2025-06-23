'use client';

import dynamic from 'next/dynamic';
import { use, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/store/useSession';

/* ------------------------------------------------------------------
 *  Map game-type → dynamic import
 *  – add new mini-games here
 * ----------------------------------------------------------------- */
const COMPONENTS: Record<string, ReturnType<typeof dynamic>> = {
  gacha: dynamic(() => import('@/components/GachaGame'), { ssr: false }),
  wheel: dynamic(() => import('@/components/WheelGame'), { ssr: false }),
  // quiz : dynamic(() => import('@/components/QuizGame'),  { ssr:false }),
};

type RouteParams = { code: string };

export default function GamePage({ params }: { params: Promise<RouteParams> }) {
  const router = useRouter();
  const { code: storeCode, game } = useSession();

  /* ⬇️ unwrap params promise (Next 14 requires `use`) */
  const { code: urlCode } = use(params);

  /* Decide which component to render (or undefined if unknown) */
  const GameComponent = useMemo(() => (game ? COMPONENTS[game] : undefined), [game]);

  /* ----------------------------------------------------------------
   *  Redirect rules:
   *    • no session yet                → /
   *    • URL code ≠ session code       → /
   *    • game type unknown / missing   → /
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!storeCode || storeCode !== urlCode || !GameComponent) {
      router.replace('/');
    }
  }, [storeCode, urlCode, GameComponent, router]);

  /* While the redirect (or first hydration) is happening, render nothing */
  if (!storeCode || storeCode !== urlCode || !GameComponent) return null;

  /* Otherwise render the correct mini-game */
  return <GameComponent />;
}
