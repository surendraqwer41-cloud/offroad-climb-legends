export type VehicleId = 'jeep' | 'bike' | 'monster_truck' | 'tractor' | 'sports_car' | 'atv';

export interface VehicleConfig {
  id: VehicleId;
  name: string;
  description: string;
  basePrice: number;
  unlockedByDefault: boolean;
  mass: number;
  basePower: number;       // Max speed & acceleration multiplier
  baseSuspension: number;  // Suspension stiffness & absorption
  baseTraction: number;    // Grip on different steep slopes
  baseFuelTank: number;    // How long a full tank can last
  wheelOffsets: { front: number; rear: number };
  wheelSizes: { front: number; rear: number };
  bodyWidth: number;
  bodyHeight: number;
  bodyYOffset: number; // visual adjustment
  color: string;
  accentColor: string;
  emoji: string;
}

export type TrackId = 'countryside' | 'desert' | 'forest' | 'snow_tracks' | 'moon';

export interface TrackConfig {
  id: TrackId;
  name: string;
  description: string;
  basePrice: number;
  unlockedByDefault: boolean;
  gravity: number; // 2D y acceleration
  fuelTankRate: number; // Fuel reduction speed
  skyColorDay: string;
  skyColorNight: string;
  groundColor: string;
  groundLineColor: string;
  bumpiness: number;
  steepness: number;
  backgroundElements: 'clouds' | 'cactus' | 'trees' | 'snowmen' | 'craters';
}

export interface UpgradeLevels {
  engine: number;      // max 10
  suspension: number;  // max 10
  tires: number;       // max 10
  fuelTank: number;    // max 10
}

export interface UserStats {
  coins: number;
  unlockedVehicles: VehicleId[];
  unlockedTracks: TrackId[];
  upgrades: Record<VehicleId, UpgradeLevels>;
  highscores: Record<TrackId, number>; // travel distance in meters
  completedAchievements: string[];
  lastDailyRewardClaimed: string | null; // ISO Date string
  accumulatedTotalCoins: number;
  totalFlips: number;
  totalDistancePlay: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardValue: number;
  type: 'distance' | 'coins' | 'flips' | 'upgrades' | 'tracks';
  targetValue: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'exhaust' | 'terrain_dust' | 'coin_spark' | 'explosion';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}
