'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/store/useSession';
import clsx from 'clsx';

export default function LoginPage() {
  const [code, setCode]   = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { set } = useSession();

  /* Reset session whenever you land on / */
  useEffect(() => {
    set({ code: '', game: null, remaining: 0, chosenPrize: null });
  }, [set]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      set({
        code,
        game: data.game,
        remaining: data.remaining,
        chosenPrize: data.chosenPrize ?? null,
      });
      router.push(`/game/${code}`);
    } catch (err) {
      setError('Uventet nettverksfeil.');
    } finally {
      setLoading(false);
    }
  }, [code, set, router]);

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
            error
              ? 'border-red-400 focus:ring-red-300'
              : 'border-slate-300 focus:ring-indigo-400'
          )}
        />

        {error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className={clsx(
            'w-full py-2 rounded-lg font-semibold transition disabled:opacity-40 flex items-center justify-center',
            'bg-indigo-600 hover:bg-indigo-700',
            !loading && 'cursor-pointer text-white'
          )}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Laster …
            </>
          ) : (
            'Slipp meg inn!'
          )}
        </button>
      </form>
    </main>
  );
}
