'use client';
import { useSession } from '@/store/useSession';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

const Gacha = dynamic(() => import('@/components/GachaGame'), { ssr: false });
const Wheel = dynamic(() => import('@/components/WheelGame'), { ssr: false });

export default function GameWrapper() {
  const { game } = useSession();

  if (!game) redirect('/');

  if (game === 'gacha') return <Gacha />;
  if (game === 'wheel') return <Wheel />;

  return <p className="text-center p-10">Unknown game.</p>;
}
