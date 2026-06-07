import { VehicleConfig, TrackConfig, Achievement } from '../types';

export const VEHICLES: VehicleConfig[] = [
  {
    id: 'jeep',
    name: 'Hill Climber Jeep 4x4',
    description: 'The standard multi-terrain workhorse. Balanced and reliable.',
    basePrice: 0,
    unlockedByDefault: true,
    mass: 1200,
    basePower: 1.0,
    baseSuspension: 1.0,
    baseTraction: 1.0,
    baseFuelTank: 1.0,
    wheelOffsets: { front: 32, rear: -32 },
    wheelSizes: { front: 16, rear: 16 },
    bodyWidth: 80,
    bodyHeight: 28,
    bodyYOffset: -12,
    color: '#15803d', // Green
    accentColor: '#facc15', // Yellow
    emoji: '🛻',
  },
  {
    id: 'bike',
    name: 'Super Motocross Bike',
    description: 'Ultra light and nimble. Performs insane flips but crashes easily.',
    basePrice: 12000,
    unlockedByDefault: false,
    mass: 220,
    basePower: 1.4,
    baseSuspension: 1.2,
    baseTraction: 0.9,
    baseFuelTank: 0.8,
    wheelOffsets: { front: 24, rear: -24 },
    wheelSizes: { front: 14, rear: 14 },
    bodyWidth: 54,
    bodyHeight: 22,
    bodyYOffset: -15,
    color: '#dc2626', // Red
    accentColor: '#ffffff', // White
    emoji: '🏍️',
  },
  {
    id: 'monster_truck',
    name: 'Beast Monster Truck',
    description: 'Giant wheels. Crushes hills, absorbs jumps easily, high fuel consumption.',
    basePrice: 28000,
    unlockedByDefault: false,
    mass: 2500,
    basePower: 1.6,
    baseSuspension: 1.7,
    baseTraction: 1.4,
    baseFuelTank: 0.95,
    wheelOffsets: { front: 34, rear: -34 },
    wheelSizes: { front: 26, rear: 26 },
    bodyWidth: 88,
    bodyHeight: 34,
    bodyYOffset: -22,
    color: '#7c3aed', // Purple
    accentColor: '#22c55e', // Neon Green
    emoji: '👹',
  },
  {
    id: 'tractor',
    name: 'Retro Farm Tractor',
    description: 'Massive torque and rear wheels. Heavy and stable, moderate speed.',
    basePrice: 18000,
    unlockedByDefault: false,
    mass: 1800,
    basePower: 0.85,
    baseSuspension: 0.9,
    baseTraction: 1.5,
    baseFuelTank: 1.3,
    wheelOffsets: { front: 30, rear: -26 },
    wheelSizes: { front: 12, rear: 22 }, // Front smaller, rear huge!
    bodyWidth: 76,
    bodyHeight: 32,
    bodyYOffset: -16,
    color: '#ea580c', // Orange
    accentColor: '#1e293b', // Slate
    emoji: '🚜',
  },
  {
    id: 'sports_car',
    name: 'Apex Speedster Coupe',
    description: 'Lower ground clearance. Massive power, fast. Difficult on rough terrains.',
    basePrice: 42000,
    unlockedByDefault: false,
    mass: 950,
    basePower: 2.1,
    baseSuspension: 0.7,
    baseTraction: 1.25,
    baseFuelTank: 0.9,
    wheelOffsets: { front: 34, rear: -34 },
    wheelSizes: { front: 14, rear: 14 },
    bodyWidth: 82,
    bodyHeight: 20,
    bodyYOffset: -8,
    color: '#0284c7', // Blue
    accentColor: '#f97316', // Orange
    emoji: '🏎️',
  },
  {
    id: 'atv',
    name: 'Quad Bike ATV 4x4',
    description: 'Responsive suspension. Highly active steering and great grab.',
    basePrice: 8500,
    unlockedByDefault: false,
    mass: 400,
    basePower: 1.15,
    baseSuspension: 1.1,
    baseTraction: 1.2,
    baseFuelTank: 0.85,
    wheelOffsets: { front: 24, rear: -24 },
    wheelSizes: { front: 15, rear: 15 },
    bodyWidth: 60,
    bodyHeight: 24,
    bodyYOffset: -12,
    color: '#eab308', // Yellow
    accentColor: '#000000', // Black
    emoji: '🛹',
  }
];

export const TRACKS: TrackConfig[] = [
  {
    id: 'countryside',
    name: 'Sunny Countryside Hills',
    description: 'Rolling green pastures with moderate hills. Ideal for beginners.',
    basePrice: 0,
    unlockedByDefault: true,
    gravity: 0.22,
    fuelTankRate: 0.16, // Fuel decrease rate per frame/second
    skyColorDay: 'linear-gradient(to bottom, #7dd3fc, #bae6fd)', // sky blue
    skyColorNight: 'linear-gradient(to bottom, #0f172a, #1e1b4b)', // midnight blue
    groundColor: '#22c55e', // Green grass
    groundLineColor: '#15803d',
    bumpiness: 12,
    steepness: 0.14,
    backgroundElements: 'clouds',
  },
  {
    id: 'desert',
    name: 'Dune Rider Desert',
    description: 'Tough, sliding dry sand dunes. Low grip and challenging heights.',
    basePrice: 8000,
    unlockedByDefault: false,
    gravity: 0.22,
    fuelTankRate: 0.18,
    skyColorDay: 'linear-gradient(to bottom, #ffedd5, #fdedd5)', // Warm tan / sand
    skyColorNight: 'linear-gradient(to bottom, #111827, #371a1a)', // Purple horizon sunset dusty
    groundColor: '#eab308', // Sandy yellow
    groundLineColor: '#ca8a04',
    bumpiness: 24,
    steepness: 0.24,
    backgroundElements: 'cactus',
  },
  {
    id: 'forest',
    name: 'Whispering Pine Woodlands',
    description: 'Steep valleys, root bumps, moist terrain, high gravity.',
    basePrice: 15000,
    unlockedByDefault: false,
    gravity: 0.24,
    fuelTankRate: 0.20,
    skyColorDay: 'linear-gradient(to bottom, #a7f3d0, #ecfdf5)',
    skyColorNight: 'linear-gradient(to bottom, #022c22, #064e3b)',
    groundColor: '#047857', // Forest green
    groundLineColor: '#064e3b',
    bumpiness: 18,
    steepness: 0.28,
    backgroundElements: 'trees',
  },
  {
    id: 'snow_tracks',
    name: 'Frostbite Frozen Slopes',
    description: 'Slippery snow ice bridges, sub-zero challenges and huge cliffs.',
    basePrice: 22000,
    unlockedByDefault: false,
    gravity: 0.21,
    fuelTankRate: 0.22,
    skyColorDay: 'linear-gradient(to bottom, #e2e8f0, #f1f5f9)', // Winter white
    skyColorNight: 'linear-gradient(to bottom, #030712, #111827)',
    groundColor: '#f8fafc', // Snowy white
    groundLineColor: '#cbd5e1',
    bumpiness: 20,
    steepness: 0.32,
    backgroundElements: 'snowmen',
  },
  {
    id: 'moon',
    name: 'Exotic Lunar Gravity',
    description: 'Extremely low gravity and steep volcanic craters. Epic high air time!',
    basePrice: 35000,
    unlockedByDefault: false,
    gravity: 0.06, // Super low gravity!
    fuelTankRate: 0.15,
    skyColorDay: 'linear-gradient(to bottom, #020617, #0f172a)', // Stars / black
    skyColorNight: 'linear-gradient(to bottom, #000000, #090d16)',
    groundColor: '#64748b', // Moon dust gray
    groundLineColor: '#475569',
    bumpiness: 32,
    steepness: 0.42,
    backgroundElements: 'craters',
  }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'dist_100',
    title: 'Beginner Rider',
    description: 'Drive 100 meters on any map.',
    rewardValue: 500,
    type: 'distance',
    targetValue: 100
  },
  {
    id: 'dist_500',
    title: 'Hill Conqueror',
    description: 'Drive 500 meters on any map.',
    rewardValue: 2000,
    type: 'distance',
    targetValue: 500
  },
  {
    id: 'dist_2000',
    title: 'X-Race Master',
    description: 'Travel a massive 2,000 meters.',
    rewardValue: 8000,
    type: 'distance',
    targetValue: 2000
  },
  {
    id: 'coins_5000',
    title: 'Coin Collector',
    description: 'Collect 2,000 coins in total.',
    rewardValue: 1200,
    type: 'coins',
    targetValue: 2000
  },
  {
    id: 'coins_20000',
    title: 'Gold Tycoon',
    description: 'Collect 10,000 total accumulated coins.',
    rewardValue: 4000,
    type: 'coins',
    targetValue: 10000
  },
  {
    id: 'flips_5',
    title: 'Acrobat Rookie',
    description: 'Do a total of 5 backflips/frontflips.',
    rewardValue: 1500,
    type: 'flips',
    targetValue: 5
  },
  {
    id: 'flips_25',
    title: 'Gravity Defier',
    description: 'Do a total of 25 insane air-flips.',
    rewardValue: 5000,
    type: 'flips',
    targetValue: 25
  },
  {
    id: 'upgrade_max',
    title: 'Full Throttle',
    description: 'Upgrade any vehicle component to Level 10.',
    rewardValue: 2500,
    type: 'upgrades',
    targetValue: 10
  }
];

// Calculate cost dynamically based on level
export function getUpgradeCost(component: 'engine' | 'suspension' | 'tires' | 'fuelTank', currentLevel: number): number {
  if (currentLevel >= 10) return 0;
  // Level 1 -> 2 is 1000 coins. Level 9 -> 10 is ~15000 coins.
  const baseCosts = {
    engine: 800,
    suspension: 600,
    tires: 700,
    fuelTank: 500,
  };
  const multiplier = Math.pow(1.45, currentLevel - 1);
  return Math.round(baseCosts[component] * multiplier / 100) * 100;
}

// Calculate the upgraded multiplier value
export function getUpgradeValue(component: 'engine' | 'suspension' | 'tires' | 'fuelTank', level: number): number {
  switch (component) {
    case 'engine':
      // 1.0 to 1.9 power
      return 1.0 + (level - 1) * 0.1;
    case 'suspension':
      // 1.0 to 2.35 damping / rebound capability
      return 1.0 + (level - 1) * 0.15;
    case 'tires':
      // 1.0 to 1.9 friction / torque transfer
      return 1.0 + (level - 1) * 0.1;
    case 'fuelTank':
      // 1.0 to 2.35 volume multiplier (lowering fuel burn rate)
      return 1.0 + (level - 1) * 0.15;
    default:
      return 1.0;
  }
}
