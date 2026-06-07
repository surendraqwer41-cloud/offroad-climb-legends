import React, { useState, useEffect } from 'react';
import { UserStats, VehicleId, TrackId } from './types';
import GarageMenu from './components/GarageMenu';
import GameCanvas from './components/GameCanvas';

const STORAGE_KEY = 'mountain_rider_x_stats_v1';

const DEFAULT_STATS: UserStats = {
  coins: 2000, // Starts with plenty of capital for starter tuning!
  unlockedVehicles: ['jeep'],
  unlockedTracks: ['countryside'],
  upgrades: {
    jeep: { engine: 1, suspension: 1, tires: 1, fuelTank: 1 },
    bike: { engine: 1, suspension: 1, tires: 1, fuelTank: 1 },
    monster_truck: { engine: 1, suspension: 1, tires: 1, fuelTank: 1 },
    tractor: { engine: 1, suspension: 1, tires: 1, fuelTank: 1 },
    sports_car: { engine: 1, suspension: 1, tires: 1, fuelTank: 1 },
    atv: { engine: 1, suspension: 1, tires: 1, fuelTank: 1 }
  },
  highscores: {
    countryside: 0,
    desert: 0,
    forest: 0,
    snow_tracks: 0,
    moon: 0
  },
  completedAchievements: [],
  lastDailyRewardClaimed: null,
  accumulatedTotalCoins: 2000,
  totalFlips: 0,
  totalDistancePlay: 0
};

export default function App() {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [gameState, setGameState] = useState<{
    active: boolean;
    vehicleId: VehicleId;
    trackId: TrackId;
  }>({
    active: false,
    vehicleId: 'jeep',
    trackId: 'countryside'
  });

  // Load stats from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure upgrades fallback structurally to avoid property lookup errors on new cars
        const structuralStats = {
          ...DEFAULT_STATS,
          ...parsed,
          upgrades: {
            ...DEFAULT_STATS.upgrades,
            ...parsed.upgrades
          },
          highscores: {
            ...DEFAULT_STATS.highscores,
            ...parsed.highscores
          }
        };
        setStats(structuralStats);
      }
    } catch (e) {
      console.warn("Failed to load local stats", e);
    }
  }, []);

  // Sync profile edits back to browser disk
  const handleUpdateStats = (newStats: UserStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
    } catch (e) {
      console.warn("Failed to save state to localStorage", e);
    }
  };

  const handleStartGame = (vId: VehicleId, tId: TrackId) => {
    setGameState({
      active: true,
      vehicleId: vId,
      trackId: tId
    });
  };

  const handleExitGame = () => {
    setGameState(prev => ({
      ...prev,
      active: false
    }));
  };

  return (
    <main id="app_game_mount" className="relative w-full min-h-screen bg-slate-950 overflow-hidden">
      {gameState.active ? (
        <GameCanvas
          vehicleId={gameState.vehicleId}
          trackId={gameState.trackId}
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onExit={handleExitGame}
        />
      ) : (
        <GarageMenu
          stats={stats}
          onUpdateStats={handleUpdateStats}
          onStartGame={handleStartGame}
        />
      )}
    </main>
  );
}
