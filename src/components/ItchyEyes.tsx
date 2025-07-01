'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/store/useSession';
import { useRouter, usePathname } from 'next/navigation';
import Confetti from 'react-confetti';

/* ---------- tweakable balances ---------- */
const SCRATCH_GAIN_PER_PX = 0.01;
const BASE_DECAY_PER_SEC  = 30;
const HAND_INTERVAL_MS:  [number, number] = [3000, 6000];
const HAND_DURATION_MS:  [number, number] = [ 600, 3000];

/* ---------- helpers ---------- */
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export default function ItchyEyes() {
  /* session / router */
  const { code, set } = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  /* gameplay state */
  const [meter, setMeter]       = useState(0);
  const [scratching, setScratch]= useState(false);
  const [blocked, setBlocked]   = useState(false);
  const [blockKey, setBlockKey] = useState(0);
  const [won, setWon]           = useState(false);
  const [sceneOpen, setSceneOpen]=useState(false);
  const [prize, setPrize]       = useState<{ imageUrl: string; name: string } | null>(null);

  /* pointer tracking */
  const lastPoint = useRef<{x:number,y:number}|null>(null);

  /* eyelid opening */
  useEffect(() => {
    const t = setTimeout(() => setSceneOpen(true), 1000);
    return () => clearTimeout(t);
  }, []);

  /* decay ticker */
  useEffect(() => {
    if (won || !sceneOpen) return;
    const id = setInterval(
      () => setMeter(m => Math.max(0, m - BASE_DECAY_PER_SEC / 10)),
      100
    );
    return () => clearInterval(id);
  }, [won, sceneOpen]);

  /* random hand blocker */
  useEffect(() => {
    if (won || !sceneOpen) return;
    let timeout: NodeJS.Timeout;

    const schedule = () => {
      timeout = setTimeout(() => {
        setBlocked(true);
        setBlockKey(k => k + 1);
        setTimeout(() => {
          setBlocked(false);
          schedule();
        }, rand(...HAND_DURATION_MS));
      }, rand(...HAND_INTERVAL_MS));
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [won, sceneOpen]);

  /* scratch handlers */
  const onPointerDown = (e: React.PointerEvent) => {
    if (blocked || won) return;
    setScratch(true);
    lastPoint.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!scratching || blocked || won) return;
    if (!lastPoint.current) {
      lastPoint.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const dx = e.clientX - lastPoint.current.x;
    const dy = e.clientY - lastPoint.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      setMeter(m => Math.min(100, m + dist * SCRATCH_GAIN_PER_PX));
      lastPoint.current = { x: e.clientX, y: e.clientY };
      if (navigator.vibrate) navigator.vibrate(5);
    }
  };

  const onPointerUp = () => {
    setScratch(false);
    lastPoint.current = null;
  };

  /* win condition */
  useEffect(() => {
    if (meter >= 100 && !won) setWon(true);
  }, [meter, won]);

  /* lock prize & keep local copy */
  useEffect(() => {
    if (!won) return;
    fetch('/api/itchy-eyes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(r => r.json())
      .then(({ prize }) => {
        set({ chosenPrize: prize, remaining: 0 });
        setPrize(prize);          // store for overlay preview
      });
  }, [won, code, set]);

  /* viewport for confetti */
  const { innerWidth: w = 800, innerHeight: h = 600 } =
    typeof window === 'undefined' ? {} : window;

  /* ---------- render ---------- */
  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-emerald-50 touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* eyelids */}
      <AnimatePresence>
        {!sceneOpen && (
          <>
            <motion.div
              className="absolute inset-x-0 top-0 h-1/2 bg-black"
              initial={{ y: 0 }}
              animate={{ y: '-100%' }}
              exit={{ y: '-100%' }}
              transition={{ duration: 1 }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 h-1/2 bg-black"
              initial={{ y: 0 }}
              animate={{ y: '100%' }}
              exit={{ y: '100%' }}
              transition={{ duration: 1 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* pollen */}
      {sceneOpen &&
        Array.from({ length: 18 }, (_, i) => (
          <motion.img
            key={i}
            src="/pollen.png"
            alt=""
            className="pointer-events-none absolute w-8 h-8 opacity-80"
            style={{ top: rand(0, h), left: rand(0, w) }}
            animate={{ y: [0, -h - 60] }}
            transition={{
              duration: rand(12, 18),
              repeat: Infinity,
              ease: 'linear',
              delay: rand(0, 6),
            }}
          />
        ))}

      {/* swelling overlay */}
      <motion.div
        className="absolute inset-0 bg-rose-400 pointer-events-none"
        style={{ mixBlendMode: 'multiply' }}
        animate={{ opacity: meter / 120 }}
      />

      {/* scratch meter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-lg">
        <div className="h-4 w-full rounded-full bg-white/70 shadow-inner">
          <motion.div
            className="h-4 rounded-full bg-rose-500"
            animate={{ width: `${meter}%` }}
            transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
          />
        </div>
      </div>

      {/* hand + banner */}
      <AnimatePresence initial={false}>
        {blocked && (
          <>
            <motion.img
              key="hand"
              src="/hand.png"
              alt=""
              className="absolute h-40 w-40 pointer-events-none"
              style={{ top: h * 0.25, left: '50%' }}
              initial={{ x: '-100vw' }}
              animate={{ x: '-50%' }}
              exit={{ x: '100vw' }}
              transition={{ type: 'spring', stiffness: 120, damping: 12 }}
            />
            <motion.div
              key={blockKey}
              className="absolute inset-x-0 top-10 mx-auto w-fit rounded-lg bg-amber-200/90 px-4 py-2 text-lg font-semibold text-amber-900 shadow-md"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              IKKE JUI MÆK!
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* confetti */}
      {won && <Confetti width={w} height={h} numberOfPieces={350} recycle={false} />}

      {/* victory overlay with prize preview */}
      <AnimatePresence>
        {won && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/80 backdrop-blur-md p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="text-3xl font-extrabold text-emerald-700 drop-shadow-sm">
              Slutt å jui mæk, jeg håper denne kan hjelpe!
            </h1>

            {prize && (
              <img
                src={prize.imageUrl}
                alt={prize.name}
                width={240}
                height={240}
                className="rounded-2xl shadow-lg"
                loading="lazy"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
