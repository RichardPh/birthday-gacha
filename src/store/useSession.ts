import { create } from 'zustand';

/* Re-use this throughout the app */
export interface Prize {
  id: number;
  name: string;
  imageUrl: string | null;
}

interface SessionState {
  code: string;
  game: 'gacha' | 'wheel' | null;
  remaining: number;
  chosenPrize: Prize | null;                 // ★ NEW
  set: (s: Partial<SessionState>) => void;
}

export const useSession = create<SessionState>((set) => ({
  code: '',
  game: null,
  remaining: 0,
  chosenPrize: null,                         // ★ NEW
  set: (s) => set(s),
}));
