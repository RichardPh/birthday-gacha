'use client';

import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import Confetti from 'react-confetti';
import { useSession } from '@/store/useSession';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useWindowSize } from '@react-hook/window-size';

interface Prize {
  id: number;
  name: string;
  imageUrl: string | null;
}

const CAPSULES = Array.from({ length: 30 }, (_, i) => `hsl(${(i * 360) / 30} 90% 60%)`);
const SPIN_DURATION = 2;
const DROP_DELAY = SPIN_DURATION - 0.25;
const KNOB_TURN = 0.45;
const RESET_DELAY = 3800;

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

function Bubble({ prize, vw, vh }: { prize: Prize; vw: number; vh: number }) {
  const controls = useAnimationControls();
  const startX = rand(0, vw - 64);
  const startY = rand(0, vh - 64);
  const wander = useCallback(() => {
    controls.start({
      x: rand(-vw * 0.45, vw * 0.45),
      y: rand(-vh * 0.45, vh * 0.45),
      rotate: [0, 360],
      transition: { duration: rand(6, 12), ease: 'easeInOut', onComplete: wander },
    });
  }, [controls, vw, vh]);

  useEffect(() => {
    wander();
  }, [wander]);

  return (
    <motion.img
      src={prize.imageUrl as string}
      alt={prize.name}
      initial={{ x: startX, y: startY, scale: rand(0.4, 0.8), opacity: 0.35 }}
      animate={controls}
      className="pointer-events-none absolute w-16 h-16 sm:w-20 sm:h-20 select-none"
    />
  );
}

export default function GachaGame() {
  const { code, remaining, chosenPrize, set } = useSession();

  const [isSpinning, setIsSpinning] = useState(false);
  const [capsuleIdx, setCapsuleIdx] = useState<number | null>(null);
  const [prize, setPrize] = useState<Prize | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bubbles, setBubbles] = useState<Prize[]>([]);

  const rotorCtrl = useAnimationControls();
  const dialCtrl = useAnimationControls();
  const [vw, vh] = useWindowSize();

  /**
   * 🔊 Audio --------------------------------------------------------------
   * The audio element is created once (on mount) and stored in a ref so we
   * can play / pause it imperatively from within the `spin` callback.
   * ----------------------------------------------------------------------
   * - Place your slot‑machine sound at `/public/sounds/slot-spin.mp3` (or
   *   update the path below to wherever you keep static assets).
   * - Keep the volume modest; users may have headphones on.
   */
  const spinSoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = new Audio('/sounds/slot-spin.mp3');
    audio.preload = 'auto';
    audio.volume = 0.6;
    spinSoundRef.current = audio;
  }, []);

  // ----------------------------------------------------------------------

  useEffect(() => {
    fetch('/api/prizes').then(r => r.json()).then((rows: Prize[]) => setBubbles(rows));
  }, []);

  useEffect(() => {
    if (chosenPrize && !confirmed) {
      setPrize(chosenPrize);
      setConfirmed(true);
      rotorCtrl.set({ rotate: 0 });
    }
  }, [chosenPrize, confirmed, rotorCtrl]);

  const spin = useCallback(async () => {
    if (isSpinning || remaining <= 0 || confirmed) return;
    setIsSpinning(true);
    setPrize(null);

    // ▶️  Play the slot‑machine sound
    if (spinSoundRef.current) {
      try {
        spinSoundRef.current.currentTime = 0;
        await spinSoundRef.current.play();
      } catch (err) {
        // Autoplay policies should not block because this is a user gesture,
        // but catch just in case (e.g., very old browsers).
        console.warn('Could not play spin sound', err);
      }
    }

    const res = await fetch('/api/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      setIsSpinning(false);
      spinSoundRef.current?.pause();
      return;
    }
    const data = await res.json();
    const serverPrize: Prize = data.prize;
    const idx = Math.floor(Math.random() * CAPSULES.length);

    rotorCtrl.start({ rotate: 720, transition: { duration: SPIN_DURATION, ease: 'easeInOut' } });
    dialCtrl
      .start({ rotate: 90, transition: { duration: KNOB_TURN, ease: 'easeOut' } })
      .then(() => dialCtrl.start({ rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }));

    setTimeout(() => setCapsuleIdx(idx), DROP_DELAY * 1000);

    setTimeout(() => {
      setPrize(serverPrize);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      set({ remaining: remaining - 1 });

      // 🔇  Fade out or pause the sound once the prize is revealed
      if (spinSoundRef.current) {
        spinSoundRef.current.pause();
      }
    }, (SPIN_DURATION + 0.1) * 1000);

    setTimeout(() => {
      setCapsuleIdx(null);
      rotorCtrl.set({ rotate: 0 });
      setIsSpinning(false);
    }, RESET_DELAY);
  }, [isSpinning, remaining, confirmed, code, set, rotorCtrl, dialCtrl]);

  const handleConfirmClick = () => setShowModal(true);

  const confirmPrize = useCallback(async () => {
    if (!prize || confirmed) return;
    const res = await fetch('/api/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, prizeId: prize.id }),
    });
    if (!res.ok) return alert('Kunne ikke lagre premien.');
    setConfirmed(true);
    setShowModal(false);
    set({ remaining: 0, chosenPrize: prize });
  }, [prize, confirmed, code, set]);

  return (
    <section className="min-h-screen overflow-hidden flex flex-col items-center justify-start bg-rose-50 relative px-2 pt-2 sm:pt-0 lg:pt-20">
      {bubbles.map(p => p.imageUrl && <Bubble key={p.id} prize={p} vw={vw} vh={vh} />)}

      {showConfetti && <Confetti width={vw} height={vh} recycle={false} numberOfPieces={320} />}

      <h2 className="text-3xl sm:text-4xl font-extrabold text-amber-900 mb-4 sm:mb-6 drop-shadow-sm">Gachapon&nbsp;Machine</h2>

      <div className="relative flex flex-col items-center">
        <div className="w-[260px] h-[280px] sm:w-[300px] sm:h-[320px] bg-amber-200 rounded-3xl border-8 border-amber-300 shadow-inner flex items-center justify-center">
          <motion.div
            className="relative flex flex-wrap justify-center items-center w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] overflow-hidden rounded-full"
            animate={rotorCtrl}
          >
            {CAPSULES.map((clr, i) => (
              <motion.div key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full m-1 shadow-lg" style={{ backgroundColor: clr, opacity: capsuleIdx === i ? 0 : 1 }} />
            ))}
          </motion.div>
        </div>

        <div className="relative mt-4 sm:mt-0 sm:absolute sm:-right-24 sm:top-24 flex flex-col items-center">
          <motion.button
            onClick={spin}
            disabled={isSpinning || remaining <= 0 || confirmed}
            animate={dialCtrl}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="cursor-pointer relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-[6px] border-blue-600 bg-white shadow-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none hover:shadow-2xl hover:ring-4 hover:ring-blue-400"
            style={{ borderColor: '#0059ff', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)' }}
          >
            <span className="absolute inset-0 rounded-full ring-4 ring-yellow-300 -z-10" />
            <span className="absolute w-12 h-4 sm:w-14 sm:h-5 rounded-full bg-slate-200 shadow-inner" />
            <span className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full shadow">{remaining}</span>
          </motion.button>
        </div>

        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-200 rounded-b-3xl border-x-4 border-b-4 border-amber-300 flex items-center justify-center mt-2 shadow-inner overflow-hidden">
          <AnimatePresence>
            {capsuleIdx !== null && (
              <motion.div
                initial={{ y: -220, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 110, damping: 16 }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-lg flex items-center justify-center bg-white overflow-hidden"
              >
                {prize?.imageUrl ? <img src={prize.imageUrl} alt={prize.name} className="w-12 h-12 sm:w-16 sm:h-16 object-contain" /> : <span className="text-2xl sm:text-3xl">🥳</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {prize && (
            <motion.div
              initial={{ y: 110, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 110, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              className="absolute top-full mt-5 sm:mt-6 left-1/2 -translate-x-1/2 px-6 py-3 min-w-[260px] sm:min-w-[320px] max-w-[90vw] rounded-xl bg-pink-200 text-pink-900 text-xl sm:text-2xl font-semibold shadow text-center whitespace-normal flex items-center gap-2 sm:gap-3 justify-center"
            >
              {prize.imageUrl && <img src={prize.imageUrl} alt={prize.name} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />}
              <span>Du fikk: {prize.name}</span>
              {!confirmed ? (
                <button onClick={handleConfirmClick} className="ml-3 sm:ml-4 px-3 sm:px-4 py-0.5 sm:py-1 bg-amber-500 hover:bg-amber-600 text-white rounded transition text-base sm:text-lg">Velg gave</button>
              ) : (
                <span className="ml-3 sm:ml-4 text-emerald-700">✔ Lagret</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && prize && (
          <>
            <motion.div className="fixed inset-0 bg-black bg-opacity-60 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 sm:p-8 space-y-6">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-900 drop-shadow-sm">Er du sikker på at du vil ha denne?</h3>
                <p className="text-sm sm:text-base text-slate-800">Du kan ikke endre på dette senere.</p>
                <div className="flex items-center gap-3 sm:gap-4">
                  <button onClick={confirmPrize} className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg">JA</button>
                  <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold text-lg">NEI</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
