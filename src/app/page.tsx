'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/store/useSession';
import clsx from 'clsx';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { set } = useSession();

  /* Reset session whenever you land on / */
  useEffect(() => {
    set({ code: '', game: null, remaining: 0, chosenPrize: null });
  }, [set]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    if (!res.ok) return setError(data.error);

    set({
      code,
      game: data.game,
      remaining: data.remaining,
      chosenPrize: data.chosenPrize ?? null,
    });
    router.push(`/game/${code}`);
  }

  return (
    <main className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-200 to-fuchsia-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 w-80 rounded-2xl shadow-xl space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-indigo-900">
          Du har bursdag! Skriv inn koden din! 🎉🎂
        </h1>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Skriv inn kode"
          className={clsx(
            'w-full p-2 rounded-lg border text-slate-900 placeholder-slate-500',
            'focus:outline-none focus:ring-2',
            error ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-indigo-400'
          )}
        />

        {error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!code.trim()}
          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-40"
        >
          Slipp&nbsp;meg&nbsp;inn!
        </button>
      </form>
    </main>
  );
}
