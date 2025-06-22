/*
 * Deluxe Animated Gachapon Machine v17 🎉
 * -----------------------------------------------------------------------------
 *  • Restores the missing tail end of the component (confirmation modal + closing
 *    tags).
 *  • Modal keeps the improved text styling from v14.
 */

'use client';

import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import Confetti from 'react-confetti';
import { useSession } from '@/store/useSession';
import { useEffect, useState, useCallback } from 'react';
import { useWindowSize } from '@react-hook/window-size';

// ---------------------------------------------------------------------------
interface Prize { id: number; name: string; imageUrl: string | null; }

const CAPSULES      = Array.from({ length: 30 }, (_, i) => `hsl(${(i * 360) / 30} 90% 60%)`);
const SPIN_DURATION = 2;
const DROP_DELAY    = SPIN_DURATION - 0.25;
const KNOB_TURN     = 0.45;
const RESET_DELAY   = 3800;

export default function GachaGame() {
  const { code, remaining, chosenPrize, set } = useSession();

  const [isSpinning, setIsSpinning]   = useState(false);
  const [capsuleIdx, setCapsuleIdx]   = useState<number | null>(null);
  const [prize, setPrize]             = useState<Prize | null>(null);
  const [confirmed, setConfirmed]     = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal]     = useState(false);

  const rotorCtrl = useAnimationControls();
  const dialCtrl  = useAnimationControls();
  const [vw, vh]  = useWindowSize();

  /* show saved prize on mount */
  useEffect(() => {
    if (chosenPrize && !confirmed) {
      setPrize(chosenPrize);
      setConfirmed(true);
      rotorCtrl.set({ rotate: 0 });
    }
  }, [chosenPrize, confirmed, rotorCtrl]);

  /* spin logic */
  const spin = useCallback(async () => {
    if (isSpinning || remaining <= 0 || confirmed) return;
    setIsSpinning(true);
    setPrize(null);

    const res = await fetch('/api/spend', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) { setIsSpinning(false); return; }
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
    }, (SPIN_DURATION + 0.1) * 1000);

    setTimeout(() => {
      setCapsuleIdx(null);
      rotorCtrl.set({ rotate: 0 });
      setIsSpinning(false);
    }, RESET_DELAY);
  }, [isSpinning, remaining, confirmed, code, set, rotorCtrl, dialCtrl]);

  /* modal confirm flow */
  const handleConfirmClick = () => setShowModal(true);

  const confirmPrize = async () => {
    if (!prize || confirmed) return;
    const res = await fetch('/api/confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, prizeId: prize.id }),
    });
    if (!res.ok) { alert('Kunne ikke lagre premien.'); return; }
    setConfirmed(true);
    setShowModal(false);
    set({ remaining: 0, chosenPrize: prize });
  };

  /* ---------------------------------------------------------------------- */
  return (
    <section className="h-screen overflow-hidden flex flex-col items-center justify-center bg-amber-50 relative">
      {showConfetti && <Confetti width={vw} height={vh} recycle={false} numberOfPieces={320} />}

      <h2 className="text-4xl font-extrabold text-amber-900 mb-8 drop-shadow-sm">Gachapon&nbsp;Machine</h2>

      {/* Machine wrapper */}
      <div className="relative flex flex-col items-center">
        {/* Drum frame */}
        <div className="w-[300px] h-[320px] bg-amber-200 rounded-3xl border-8 border-amber-300 shadow-inner flex items-center justify-center">
          {/* Spinning rotor */}
          <motion.div
            className="relative flex flex-wrap justify-center items-center w-[260px] h-[260px] overflow-hidden rounded-full"
            animate={rotorCtrl}
          >
            {CAPSULES.map((clr, i) => (
              <motion.div
                key={i}
                className="w-9 h-9 rounded-full m-1 shadow-lg"
                style={{ backgroundColor: clr, opacity: capsuleIdx === i ? 0 : 1 }}
              />
            ))}
          </motion.div>
        </div>

        {/* Rotary knob */}
        <div className="absolute -right-24 top-24 flex flex-col items-center">
          <motion.button
            onClick={spin}
            disabled={isSpinning || remaining <= 0 || confirmed}
            animate={dialCtrl}
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="cursor-pointer relative w-24 h-24 rounded-full border-[6px] border-blue-600 bg-white shadow-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none hover:shadow-2xl hover:ring-4 hover:ring-blue-400"
            style={{ borderColor: '#0059ff', boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)' }}
          >
            <span className="absolute inset-0 rounded-full ring-4 ring-yellow-300 -z-10" />
            <span className="absolute w-14 h-5 rounded-full bg-slate-200 shadow-inner" />
            <span className="absolute bottom-1 right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full shadow">
              {remaining}
            </span>
          </motion.button>
        </div>

        {/* Chute */}
        <div className="w-24 h-24 bg-amber-200 rounded-b-3xl border-x-4 border-b-4 border-amber-300 flex items-center justify-center mt-2 shadow-inner overflow-hidden">
          <AnimatePresence>
            {capsuleIdx !== null && (
              <motion.div
                initial={{ y: -220, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 110, damping: 16 }}
                className="w-20 h-20 rounded-full shadow-lg flex items-center justify-center bg-white overflow-hidden"
              >
                {prize?.imageUrl ? (
                  <img src={prize.imageUrl} alt={prize.name} className="w-16 h-16 object-contain" />
                ) : (
                  <span className="text-3xl">🥳</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Prize banner */}
        <AnimatePresence>
          {prize && (
            <motion.div
              initial={{ y: 110, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 110, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
              className="absolute top-full mt-6 left-1/2 -translate-x-1/2 px-8 py-4 min-w-[320px] rounded-xl bg-pink-200 text-pink-900 text-2xl font-semibold shadow text-center whitespace-nowrap flex items-center gap-3 justify-center"
            >
              {prize.imageUrl && <img src={prize.imageUrl} alt={prize.name} className="w-10 h-10 object-contain" />}
              <span>You got: {prize.name}</span>
              {!confirmed ? (
                <button onClick={handleConfirmClick} className="ml-4 px-4 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded transition text-lg">
                  Confirm
                </button>
              ) : (
                <span className="ml-4 text-emerald-700">✔ Saved</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {showModal && prize && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Dialog */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 space-y-6">
                <h3 className="text-3xl font-extrabold text-amber-900 drop-shadow-sm">
                  Er du sikker på at du vil ha denne?
                </h3>
                <p className="text-base text-slate-800">
                  Du kan ikke endre på dette senere.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={confirmPrize}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg"
                  >
                    JA
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 rounded-lg bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold text-lg"
                  >
                    NEI
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
