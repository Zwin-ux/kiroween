'use client';

import { HauntedGameInterface } from '@/components/ui/HauntedGameInterface';
import { useGameStore } from '@/store/gameStore';
import { useEffect } from 'react';

export default function Home() {
  const { run, initializeGame } = useGameStore();

  useEffect(() => {
    // Initialize game on first load
    if (!run.id) {
      initializeGame();
    }
  }, [run.id, initializeGame]);

  return <HauntedGameInterface />;
}