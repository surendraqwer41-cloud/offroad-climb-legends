import React, { useRef, useEffect, useState } from 'react';
import { VehicleId, TrackId, Particle, FloatingText, UserStats } from '../types';
import { VEHICLES, TRACKS, getUpgradeValue } from '../utils/gameData';
import { audio } from '../utils/audio';
import { 
  X, 
  RotateCcw, 
  Award, 
  Check, 
  AlertTriangle,
  Zap,
  Flame,
  ArrowLeft,
  Fuel,
  Coins
} from 'lucide-react';

interface GameCanvasProps {
  vehicleId: VehicleId;
  trackId: TrackId;
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onExit: () => void;
}

export default function GameCanvas({ vehicleId, trackId, stats, onUpdateStats, onExit }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const vehicle = VEHICLES.find(v => v.id === vehicleId) || VEHICLES[0];
  const track = TRACKS.find(t => t.id === trackId) || TRACKS[0];

  // Upgrades
  const upgradeLevels = stats.upgrades[vehicleId] || { engine: 1, suspension: 1, tires: 1, fuelTank: 1 };
  const enginePower = vehicle.basePower * getUpgradeValue('engine', upgradeLevels.engine);
  const suspensionStiffness = vehicle.baseSuspension * getUpgradeValue('suspension', upgradeLevels.suspension);
  const tireTraction = vehicle.baseTraction * getUpgradeValue('tires', upgradeLevels.tires);
  const fuelTankCapacity = vehicle.baseFuelTank * getUpgradeValue('fuelTank', upgradeLevels.fuelTank);

  // In-game dynamic scores
  const [currentCoins, setCurrentCoins] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [fuelLevel, setFuelLevel] = useState(100); // percentage
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<'crash' | 'fuel'>('crash');
  
  // Custom states for achievements feedback
  const [highestAirTime, setHighestAirTime] = useState(0);
  const [flipMeter, setFlipMeter] = useState(0);

  // Controller inputs
  const keysRef = useRef<Record<string, boolean>>({});
  const touchThrottleRef = useRef<boolean>(false);
  const touchBrakeRef = useRef<boolean>(false);

  // Physics states stored in Ref to prevent rendering stutters
  const stateRef = useRef({
    // Chassis
    carX: 100,
    carY: 300,
    vx: 0,
    vy: 0,
    angle: 0, // vehicle chassis angle in radians
    angularVelocity: 0,

    // Suspended Wheels relative offsets
    backWheelX: 0,
    backWheelY: 0,
    backWheelVy: 0,
    frontWheelX: 0,
    frontWheelY: 0,
    frontWheelVy: 0,

    // Grounding states
    backGrounded: false,
    frontGrounded: false,

    // Camera tracker
    cameraX: 100,
    cameraY: 300,

    // In-game collections generated arrays
    coinsList: [] as { x: number; y: number; collected: boolean; value: number }[],
    fuelsList: [] as { x: number; y: number; collected: boolean }[],

    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],

    // Flips state calculators
    prevCumulativeRotation: 0,
    cumulativeRotation: 0,
    isInAir: false,
    airTimeCounter: 0, // frame ticks spent in air

    fuelValue: 100, // 0 - 100
    distanceTravelled: 0,
    coinsScore: 0,
    trackLength: 0,

    dayCycle: 0, // ticks for day night
    weatherTimer: 0,
    weatherType: 'clear' as 'clear' | 'dust_storm' | 'snow_flurry' | 'rain_droplets',
    weatherIntensity: 0
  });

  // Track generator formulas
  function getTrackHeight(x: number): number {
    if (x < 150) return 350; // spawn safety flatline zone

    const scale = 0.005;
    let h = 0;

    let amp1 = 80;
    let amp2 = 30;
    let amp3 = 10;
    let freq1 = scale;
    let freq2 = scale * 2.3;
    let freq3 = scale * 5.7;

    if (track.id === 'desert') {
      amp1 = 110;
      amp2 = 50;
      amp3 = 12;
      freq1 = scale * 0.8;
      freq2 = scale * 1.8;
    } else if (track.id === 'forest') {
      amp1 = 100;
      amp2 = 55;
      amp3 = 20;
      freq1 = scale * 1.35;
      freq2 = scale * 2.8;
    } else if (track.id === 'snow_tracks') {
      amp1 = 140;
      amp2 = 60;
      amp3 = 15;
      freq1 = scale * 0.95;
      freq2 = scale * 2.1;
    } else if (track.id === 'moon') {
      amp1 = 200; // gigantic craters
      amp2 = 35;
      amp3 = 5;
      freq1 = scale * 0.5;
      freq2 = scale * 1.3;
    }

    h += Math.sin(x * freq1) * amp1 * track.steepness * 4.5;
    h += Math.cos(x * freq2) * amp2 * track.bumpiness * 0.15;
    h += Math.sin(x * freq3) * amp3 * 0.5;

    // Additional secondary rolling slopes for length
    if (x > 1000) {
      h += Math.sin(x * 0.00015) * 150;
    }

    return 550 - h;
  }

  // Generate Coins & Fuel along track dynamically depending on terrain curve
  const prepareCollectiblesOnStart = () => {
    const listC = [];
    const listF = [];
    
    // Generate up to 10,000 meters
    for (let currentX = 400; currentX < 12000; currentX += 130) {
      // Add cluster of coins
      const canSpawn = Math.sin(currentX * 0.04) > -0.2;
      if (canSpawn) {
        const heightY = getTrackHeight(currentX) - 35; // Hover code
        listC.push({
          x: currentX,
          y: heightY,
          collected: false,
          value: 100 // 100 coins each
        });
      }
    }

    // Place high octane fuel cans every 450 - 650 meters
    for (let fX = 600; fX < 12000; fX += 580) {
      const heightY = getTrackHeight(fX) - 30;
      listF.push({
        x: fX,
        y: heightY,
        collected: false
      });
    }

    stateRef.current.coinsList = listC;
    stateRef.current.fuelsList = listF;
  };

  // Trigger floating retro texts 
  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    const id = Math.random().toString();
    stateRef.current.floatingTexts.push({
      id,
      x,
      y,
      text,
      color,
      life: 0,
      maxLife: 45
    });
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    prepareCollectiblesOnStart();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animFrame: number;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = Math.max(containerRef.current.clientHeight, 400);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial positioning setup
    const initialY = getTrackHeight(100) - 40;
    stateRef.current.carX = 100;
    stateRef.current.carY = initialY;
    stateRef.current.cameraX = 100;
    stateRef.current.cameraY = initialY;
    stateRef.current.vx = 0;
    stateRef.current.vy = 0;
    stateRef.current.angle = 0;
    stateRef.current.angularVelocity = 0;
    stateRef.current.fuelValue = 100;
    stateRef.current.particles = [];
    stateRef.current.floatingTexts = [];
    stateRef.current.airTimeCounter = 0;
    stateRef.current.cumulativeRotation = 0;
    stateRef.current.prevCumulativeRotation = 0;

    // Core Animation Frame Loop
    const updatePhysicsLoop = () => {
      if (isGameOver || isPaused) return;

      const keys = keysRef.current;
      const state = stateRef.current;

      // Fuel burn mechanics
      let currentFuelRate = track.fuelTankRate * (0.8 / fuelTankCapacity);
      // Extra burn when throttling
      const isThrottling = keys['arrowright'] || keys['d'] || keys['keyd'] || touchThrottleRef.current;
      const isBraking = keys['arrowleft'] || keys['a'] || keys['keya'] || touchBrakeRef.current;

      if (isThrottling) currentFuelRate *= 1.45;
      state.fuelValue = Math.max(0, state.fuelValue - currentFuelRate);
      setFuelLevel(state.fuelValue);

      // Sound update relative to RPM throttle percent 
      const currentSpeedCoeff = Math.abs(state.vx) / 10;
      audio.setEngineThrottle(currentSpeedCoeff, isThrottling);

      // Check Out of Fuel crash condition
      if (state.fuelValue <= 0) {
        triggerGameOver('fuel');
        return;
      }

      // Gravities factor
      const selectedGravity = track.gravity;
      state.vy += selectedGravity;

      // Compute wheels position offsets from angle
      const cosA = Math.cos(state.angle);
      const sinA = Math.sin(state.angle);

      const offsetRearX = vehicle.wheelOffsets.rear;
      const offsetFrontX = vehicle.wheelOffsets.front;
      const wheelYAdjust = -5; // relative offset to sink down visually

      // Wheels world coordinate positions
      const backX = state.carX + offsetRearX * cosA - wheelYAdjust * sinA;
      const backY = state.carY + offsetRearX * sinA + wheelYAdjust * cosA;

      const frontX = state.carX + offsetFrontX * cosA - wheelYAdjust * sinA;
      const frontY = state.carY + offsetFrontX * sinA + wheelYAdjust * cosA;

      // Look up target ground terrain profiles underneath specific wheels
      const gBackY = getTrackHeight(backX);
      const gFrontY = getTrackHeight(frontX);

      // Check contact
      const backContact = backY >= gBackY;
      const frontContact = frontY >= gFrontY;

      state.backGrounded = backContact;
      state.frontGrounded = frontContact;

      // Handle ground reactions & suspension springs stiffness values
      let forceYSum = 0;
      let rotationalTorque = 0;

      const springStrengths = 0.08 * suspensionStiffness;
      const springDamping = 0.5 * Math.sqrt(springStrengths);

      if (backContact) {
        const penetration = backY - gBackY;
        const springForce = penetration * springStrengths - state.backWheelVy * springDamping;
        
        // Pushes the rear of the car upwards
        forceYSum -= springForce;
        rotationalTorque -= springForce * offsetRearX * 0.035;

        // Reset wheel vertical velocity relative
        state.backWheelVy = -springForce * 0.5;

        // Apply forward traction torque
        if (isThrottling) {
          const drivePower = 0.35 * enginePower * tireTraction;
          state.vx += drivePower * cosA;
          state.vy += drivePower * sinA;
          state.angularVelocity -= 0.001; // recoil nose down-slip

          // Spawn dirty sand exhaust dust
          if (Math.random() < 0.35) {
            state.particles.push({
              x: backX,
              y: backY,
              vx: -state.vx * 0.4 + (Math.random() - 0.5) * 2,
              vy: -2 - Math.random() * 2,
              color: track.id === 'snow_tracks' ? '#e2e8f0' : track.id === 'desert' ? '#f59e0b' : '#a1a1aa',
              size: 2 + Math.random() * 4,
              life: 0,
              maxLife: 30,
              type: 'terrain_dust'
            });
          }
        }
        if (isBraking) {
          state.vx *= 0.94; // high drag friction
        }
      } else {
        state.backWheelVy += selectedGravity;
      }

      if (frontContact) {
        const penetration = frontY - gFrontY;
        const springForce = penetration * springStrengths - state.frontWheelVy * springDamping;

        forceYSum -= springForce;
        rotationalTorque -= springForce * offsetFrontX * 0.035;

        state.frontWheelVy = -springForce * 0.5;

        if (isBraking) {
          // Braking transfers focus load to nose, lowering sliding speed
          state.vx *= 0.94;
        }
      } else {
        state.frontWheelVy += selectedGravity;
      }

      // Air time flip triggers checks
      const bothInAir = !backContact && !frontContact;
      if (bothInAir) {
        state.isInAir = true;
        state.airTimeCounter++;

        // Calculate continuous loops completed
        state.cumulativeRotation += state.angularVelocity;

        // Key controls in air allows vehicle tilt pitch control!
        if (isThrottling) {
          // accelerator tilts cockpit clockwise (lean forward)
          state.angularVelocity += 0.0055 * (track.gravity / 0.22);
        }
        if (isBraking) {
          // brake tilts cockpit counter-clockwise (lean backward)
          state.angularVelocity -= 0.0055 * (track.gravity / 0.22);
        }
      } else {
        // Just landed! Check if high airtime was active
        if (state.isInAir) {
          const airSeconds = state.airTimeCounter / 60;
          if (airSeconds > 1.2) {
            const coinBonus = Math.round(airSeconds * 400);
            addFloatingText(state.carX, state.carY - 30, `BIG AIRTIME! +${coinBonus} 🪙`, '#fbbf24');
            state.coinsScore += coinBonus;
            setCurrentCoins(state.coinsScore);
            audio.playCoin();
          }

          // Evaluate flip achievements
          const deltaRotation = state.cumulativeRotation - state.prevCumulativeRotation;
          const fullRotations = Math.floor(Math.abs(deltaRotation) / (Math.PI * 2));
          if (fullRotations >= 1) {
            const isBackflip = deltaRotation < 0;
            const payoff = fullRotations * 1000;
            addFloatingText(
              state.carX, 
              state.carY - 50, 
              `${fullRotations > 1 ? `${fullRotations}x ` : ''}${isBackflip ? 'BACKFLIP' : 'FRONTFLIP'} BONUS! +${payoff} 🪙`, 
              '#10b981'
            );
            
            // Record statistic to profile updates
            state.coinsScore += payoff;
            setCurrentCoins(state.coinsScore);
            stats.totalFlips += fullRotations;
            audio.playUpgrade();
          }

          // reset tracker values
          state.isInAir = false;
          state.airTimeCounter = 0;
          state.prevCumulativeRotation = state.cumulativeRotation;
        }
      }

      // Apply physical chassis forces
      state.vy += forceYSum * 0.005;
      
      // Aerodynamic damping drags
      state.vx *= 0.992;
      state.vy *= 0.99;
      state.angularVelocity *= 0.95; // Rotational friction keep it stable

      // apply rotation torque
      state.angularVelocity += rotationalTorque * 0.015;
      state.angle += state.angularVelocity;

      // Speed limits capping
      const maxSp = 18 * enginePower;
      state.vx = Math.max(-4, Math.min(state.vx, maxSp));

      // Translate actual state offsets
      state.carX += state.vx;
      state.carY += state.vy;

      // Handle terrain snap safety collision
      const centerGroundY = getTrackHeight(state.carX);
      if (state.carY > centerGroundY - 8) {
        state.carY = centerGroundY - 8;
        state.vy = 0;
      }

      // Distance progress meters
      const convertedDistance = Math.max(0, (state.carX - 100) / 20);
      state.distanceTravelled = convertedDistance;
      setCurrentDistance(convertedDistance);
      setCurrentSpeed(state.vx * 8);

      // Check driver direct CRASH collision!
      // If the body incline is upside-down or too high and ground hits head
      const headX = state.carX + Math.sin(state.angle) * 16;
      const headY = state.carY - Math.cos(state.angle) * 16;
      const gHeadY = getTrackHeight(headX);

      if (headY >= gHeadY) {
        triggerGameOver('crash');
        return;
      }

      // Check Collectibles collision (Coins/Fuel)
      const catchRadius = 38;
      
      // Coins check
      state.coinsList.forEach(c => {
        if (!c.collected && Math.abs(state.carX - c.x) < catchRadius && Math.abs(state.carY - c.y) < catchRadius) {
          c.collected = true;
          state.coinsScore += c.value;
          setCurrentCoins(state.coinsScore);
          audio.playCoin();
          
          // emit cool pickup spark particles
          for (let p = 0; p < 6; p++) {
            state.particles.push({
              x: c.x,
              y: c.y,
              vx: (Math.random() - 0.5) * 4,
              vy: -2 - Math.random() * 3,
              color: '#f59e0b',
              size: 2 + Math.random() * 3,
              life: 0,
              maxLife: 20,
              type: 'coin_spark'
            });
          }
          addFloatingText(c.x, c.y - 15, `+${c.value}`, '#fbbf24');
        }
      });

      // Gas Fuel cans check
      state.fuelsList.forEach(f => {
        if (!f.collected && Math.abs(state.carX - f.x) < catchRadius && Math.abs(state.carY - f.y) < catchRadius) {
          f.collected = true;
          state.fuelValue = Math.min(100, state.fuelValue + 50); // Restore 50% fuel
          setFuelLevel(state.fuelValue);
          audio.playFuel();

          // Green splash sparks
          for (let p = 0; p < 8; p++) {
            state.particles.push({
              x: f.x,
              y: f.y,
              vx: (Math.random() - 0.5) * 5,
              vy: -3 - Math.random() * 3,
              color: '#22c55e',
              size: 3 + Math.random() * 3,
              life: 0,
              maxLife: 25,
              type: 'coin_spark'
            });
          }
          addFloatingText(f.x, f.y - 15, "GAS REFILL!", '#22c55e');
        }
      });

      // Exhaust particle updates
      if (Math.random() < 0.15) {
        // emit exhaust puff behind chassis
        const exhaustPuffX = state.carX - 35 * Math.cos(state.angle);
        const exhaustPuffY = state.carY - 10 - 35 * Math.sin(state.angle);
        state.particles.push({
          x: exhaustPuffX,
          y: exhaustPuffY,
          vx: -state.vx * 0.3 - 1,
          vy: -0.5 - Math.random() * 0.5,
          color: 'rgba(200, 200, 200, 0.4)',
          size: 3 + Math.random() * 4,
          life: 0,
          maxLife: 40,
          type: 'exhaust'
        });
      }

      // Update particle ages & lifespan removal
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        return p.life < p.maxLife;
      });

      // FloatingTexts decay updates
      state.floatingTexts = state.floatingTexts.filter(ft => {
        ft.y -= 0.8; // Float up
        ft.life++;
        return ft.life < ft.maxLife;
      });

      // Update camera smooth movement tracking
      // Interpolate camera viewport target offset
      const targetCamX = state.carX - canvas.width * 0.28;
      const targetCamY = state.carY - canvas.height * 0.62;

      state.cameraX = state.cameraX * 0.88 + targetCamX * 0.12;
      state.cameraY = state.cameraY * 0.88 + targetCamY * 0.12;

      // Limit camera panning to ground offsets
      state.cameraX = Math.max(0, state.cameraX);

      // Rendering elements step!
      drawCanvasAssets(ctx, canvas);

      animFrame = requestAnimationFrame(updatePhysicsLoop);
    };

    const drawCanvasAssets = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const state = stateRef.current;
      const camX = state.cameraX;
      const camY = state.cameraY;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Skybox backgrounds
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGradient.addColorStop(0, track.id === 'moon' ? '#020617' : '#7dd3fc');
      skyGradient.addColorStop(1, track.id === 'moon' ? '#0f172a' : '#e0f2fe');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw starry universe if Moon track!
      if (track.id === 'moon') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 40; i++) {
          const starX = (i * 123456) % canvas.width;
          const starY = (i * 987654) % (canvas.height - 150);
          ctx.fillRect(starX, starY, 1.5, 1.5);
        }
      }

      ctx.save();
      // Translate elements by the camera position offset!
      ctx.translate(-camX, -camY);

      // Draw distant parallax background hills
      ctx.fillStyle = track.id === 'desert' ? '#dfa414' : track.id === 'moon' ? '#334155' : '#166534';
      ctx.beginPath();
      ctx.moveTo(state.carX - 600, canvas.height + 400);
      for (let px = state.carX - 600; px < state.carX + 1200; px += 20) {
        // half amplitude distant rolling hills
        const distY = getTrackHeight(px) + 60;
        ctx.lineTo(px, distY);
      }
      ctx.lineTo(state.carX + 1200, canvas.height + 400);
      ctx.closePath();
      ctx.fill();

      // Draw procedural structures (Cactus/trees background widgets)
      if (track.backgroundElements === 'cactus') {
        ctx.fillStyle = '#15803d';
        ctx.font = '24px sans-serif';
        for (let ix = Math.floor(camX / 300) * 300; ix < camX + canvas.width + 100; ix += 300) {
          const th = getTrackHeight(ix);
          ctx.fillText('🌵', ix, th - 5);
        }
      } else if (track.backgroundElements === 'trees') {
        ctx.fillStyle = '#065f46';
        ctx.font = '28px sans-serif';
        for (let ix = Math.floor(camX / 250) * 250; ix < camX + canvas.width + 100; ix += 250) {
          const th = getTrackHeight(ix);
          ctx.fillText('🌲', ix, th - 10);
        }
      } else if (track.backgroundElements === 'snowmen') {
        ctx.font = '24px sans-serif';
        for (let ix = Math.floor(camX / 400) * 400; ix < camX + canvas.width + 100; ix += 400) {
          const th = getTrackHeight(ix);
          ctx.fillText('☃️', ix, th - 5);
        }
      } else if (track.backgroundElements === 'craters') {
        ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
        for (let ix = Math.floor(camX / 200) * 200; ix < camX + canvas.width + 100; ix += 200) {
          const th = getTrackHeight(ix);
          ctx.beginPath();
          ctx.arc(ix + 20, th + 5, 25, 0, Math.PI);
          ctx.fill();
        }
      }

      // DRAW TERRAIN GROUND PATH
      ctx.fillStyle = track.groundColor;
      ctx.strokeStyle = track.groundLineColor;
      ctx.lineWidth = 4;

      ctx.beginPath();
      // start margin relative to camera viewport
      const renderStartX = Math.max(0, camX - 100);
      const renderEndX = camX + canvas.width + 100;

      ctx.moveTo(renderStartX, canvas.height + 500);
      for (let tx = renderStartX; tx <= renderEndX; tx += 8) {
        const ty = getTrackHeight(tx);
        ctx.lineTo(tx, ty);
      }
      ctx.lineTo(renderEndX, canvas.height + 500);
      ctx.closePath();
      ctx.fill();

      // Draw the top ground crust grass/snow line vector
      ctx.beginPath();
      for (let tx = renderStartX; tx <= renderEndX; tx += 8) {
        const ty = getTrackHeight(tx);
        if (tx === renderStartX) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // DRAW COINS COLLECTIBLES
      state.coinsList.forEach(c => {
        if (!c.collected && c.x >= renderStartX && c.x <= renderEndX) {
          // Glow background yellow
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner gold star/letter detail
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', c.x, c.y);
        }
      });

      // DRAW GAS CANISTERS
      state.fuelsList.forEach(f => {
        if (!f.collected && f.x >= renderStartX && f.x <= renderEndX) {
          // Fuel Canister visual shape
          ctx.fillStyle = '#ef4444'; // Red fuel can
          ctx.strokeStyle = '#b91c1c';
          ctx.lineWidth = 2;
          ctx.fillRect(f.x - 10, f.y - 12, 20, 24);
          ctx.strokeRect(f.x - 10, f.y - 12, 20, 24);
          
          // CAP
          ctx.fillStyle = '#facc15';
          ctx.fillRect(f.x - 6, f.y - 16, 6, 4);

          // Canister label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('GAS', f.x, f.y + 3);
        }
      });

      // DRAW VECHICLE CHASSIS BODY
      ctx.save();
      // Move pivot core to vehicle coordinates
      ctx.translate(state.carX, state.carY);
      ctx.rotate(state.angle);

      // Chassis shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(-vehicle.bodyWidth / 2 - 2, vehicle.bodyYOffset + vehicle.bodyHeight - 2, vehicle.bodyWidth + 4, 6);

      // Base Body polygon drawing
      ctx.fillStyle = vehicle.color;
      ctx.beginPath();
      ctx.roundRect(-vehicle.bodyWidth / 2, vehicle.bodyYOffset, vehicle.bodyWidth, vehicle.bodyHeight, 6);
      ctx.fill();

      // Cockpit windows/caps
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      ctx.roundRect(-4, vehicle.bodyYOffset - 12, 28, 14, 4);
      ctx.fill();

      // Pilot head helmet!
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      // Center helmet
      ctx.arc(8, vehicle.bodyYOffset - 18, 7, 0, Math.PI * 2);
      ctx.fill();
      // Helmet visor
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(9, vehicle.bodyYOffset - 22, 6, 5);

      // Decorative accent stripe line
      ctx.strokeStyle = vehicle.accentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-vehicle.bodyWidth / 2 + 10, vehicle.bodyYOffset + vehicle.bodyHeight / 2);
      ctx.lineTo(vehicle.bodyWidth / 2 - 12, vehicle.bodyYOffset + vehicle.bodyHeight / 2);
      ctx.stroke();

      // Draw Emoji sticker detail on doors!
      ctx.font = '16px sans-serif';
      ctx.fillText(vehicle.emoji, -16, vehicle.bodyYOffset + 18);

      // Front bumper
      ctx.fillStyle = '#374151';
      ctx.fillRect(vehicle.bodyWidth / 2 - 3, vehicle.bodyYOffset + vehicle.bodyHeight / 2, 4, 8);

      ctx.restore();

      // DRAW ACTIVE SUSPENDED WHEELS
      const cosA = Math.cos(state.angle);
      const sinA = Math.sin(state.angle);
      const offsetRearX = vehicle.wheelOffsets.rear;
      const offsetFrontX = vehicle.wheelOffsets.front;
      const wheelYAdjust = -5;

      const backX = state.carX + offsetRearX * cosA - wheelYAdjust * sinA;
      const backY = state.carY + offsetRearX * sinA + wheelYAdjust * cosA;
      const frontX = state.carX + offsetFrontX * cosA - wheelYAdjust * sinA;
      const frontY = state.carY + offsetFrontX * sinA + wheelYAdjust * cosA;

      // Back Wheel
      const backAngleOffset = state.carX * 0.05; // rotational roll
      ctx.save();
      ctx.translate(backX, backY);
      ctx.rotate(backAngleOffset);
      drawWheelGraphic(ctx, vehicle.wheelSizes.rear, vehicle.accentColor);
      ctx.restore();

      // Front Wheel
      const frontAngleOffset = state.carX * 0.05;
      ctx.save();
      ctx.translate(frontX, frontY);
      ctx.rotate(frontAngleOffset);
      drawWheelGraphic(ctx, vehicle.wheelSizes.front, vehicle.accentColor);
      ctx.restore();

      // DRAW DUST EXHAUST PARTICLES
      state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife), 0, Math.PI * 2);
        ctx.fill();
      });

      // DRAW FLOATING NOTIFICATIONS
      state.floatingTexts.forEach(ft => {
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 12px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        
        ctx.save();
        // apply slight scaling bounce on new texts
        const scale = 1.0 + Math.sin(ft.life * 0.1) * 0.15;
        ctx.translate(ft.x, ft.y);
        ctx.scale(scale, scale);
        ctx.fillText(ft.text, 0, 0);
        ctx.restore();
      });

      ctx.restore(); // Restore camera layout
    };

    const drawWheelGraphic = (ctx: CanvasRenderingContext2D, size: number, hubColor: string) => {
      // Outer tire rubber
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner hub cap steel
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = hubColor;
      ctx.fill();
      ctx.stroke();

      // Wheel spokes lines detail so rotation is clear!
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      for (let s = 0; s < 4; s++) {
        const rad = (s * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rad) * size, Math.sin(rad) * size);
        ctx.stroke();
      }
    };

    animFrame = requestAnimationFrame(updatePhysicsLoop);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isGameOver, isPaused]);

  // Handle crash game termination
  const triggerGameOver = (reason: 'crash' | 'fuel') => {
    setIsGameOver(true);
    setGameOverReason(reason);
    audio.stopEngine();
    
    if (reason === 'crash') {
      audio.playCrash();
    }
    
    // Auto sync game records immediately to save progression
    saveProgressToWallet(reason);
  };

  const saveProgressToWallet = (reason: 'crash' | 'fuel') => {
    audio.playUpgrade();
    const finalEarnedCoins = stateRef.current.coinsScore;
    const finalDistance = stateRef.current.distanceTravelled;

    const updatedCoins = stats.coins + finalEarnedCoins;
    const previousHighscore = stats.highscores[trackId] || 0;
    const newHighscore = Math.max(previousHighscore, finalDistance);

    const updatedStats: UserStats = {
      ...stats,
      coins: updatedCoins,
      accumulatedTotalCoins: stats.accumulatedTotalCoins + finalEarnedCoins,
      totalDistancePlay: stats.totalDistancePlay + finalDistance,
      highscores: {
        ...stats.highscores,
        [trackId]: newHighscore
      }
    };

    onUpdateStats(updatedStats);
  };

  const currentHighscore = Math.max(stats.highscores[trackId] || 0, currentDistance);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-slate-950 flex flex-col font-mono text-slate-200 select-none overflow-hidden">
      
      {/* Top Hud Bar */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10 pointers-events-none">
        {/* Distance meters */}
        <div className="bg-slate-900/90 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-3">
          <div>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Distance</span>
            <span className="text-lg font-black text-white font-mono">{currentDistance.toFixed(0)}m</span>
          </div>
          <div className="h-6 w-[1.5px] bg-slate-800"></div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Record</span>
            <span className="text-xs font-bold text-amber-500 font-mono">{(stats.highscores[trackId] || 0).toFixed(0)}m</span>
          </div>
        </div>

        {/* HUD Gauges */}
        <div className="flex gap-2">
          {/* Dashboard HUD - Speedometer & Fuel */}
          <div className="bg-slate-900/90 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4">
            {/* FUEL GAUGE */}
            <div className="flex items-center gap-1.5">
              <Fuel className={`w-5 h-5 ${fuelLevel < 25 ? 'text-red-500 animate-bounce' : 'text-amber-500'}`} />
              <div className="w-16 h-3 bg-slate-850 rounded-full overflow-hidden border border-slate-700 relative">
                <div 
                  className={`h-full ${fuelLevel < 25 ? 'bg-red-500' : 'bg-emerald-500'} transition-all`} 
                  style={{ width: `${fuelLevel}%` }}
                ></div>
                {fuelLevel < 25 && (
                  <span className="absolute inset-0 text-[8px] font-black text-center text-white top-[-1px] animate-pulse">LOW</span>
                )}
              </div>
            </div>

            {/* COIN HUD COUNTER */}
            <div className="flex items-center gap-1.5 bg-slate-950/70 py-1 px-3 rounded-full border border-slate-800">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-black text-yellow-300 font-mono">+{currentCoins}</span>
            </div>
          </div>

          <button
            id="pause_driving"
            onClick={() => { audio.playClick(); setIsPaused(p => !p); }}
            className="bg-slate-900/95 border border-slate-800 hover:bg-slate-850 p-2.5 rounded-2xl text-slate-300 pointer-events-auto"
          >
            {isPaused ? "▶️" : "⏸️"}
          </button>
        </div>
      </div>

      {/* CORE CANVAS ELEMENT */}
      <canvas 
        ref={canvasRef} 
        className="w-full flex-1 touch-none"
      />

      {/* ON SCREEN MOBILES CONTROLS OVERLAY PEDALS */}
      <div className="absolute bottom-6 inset-x-6 flex justify-between items-end gap-16 z-10 pointer-events-none">
        
        {/* Left Hand: Brake Pedal */}
        <button
          id="mobile_brake_pedal"
          onMouseDown={() => { touchBrakeRef.current = true; }}
          onMouseUp={() => { touchBrakeRef.current = false; }}
          onTouchStart={(e) => { e.preventDefault(); touchBrakeRef.current = true; }}
          onTouchEnd={() => { touchBrakeRef.current = false; }}
          className="w-24 h-24 bg-slate-900/85 hover:bg-slate-800/90 active:scale-95 text-slate-100 rounded-3xl border-2 border-red-500/40 shadow-2xl flex flex-col items-center justify-center gap-1 pointer-events-auto select-none"
        >
          <span className="text-2xl">🛑</span>
          <span className="text-[10px] font-black tracking-widest text-red-400">BRAKE / ↺</span>
        </button>

        {/* Right Hand: Accelerator Gas Pedal */}
        <button
          id="mobile_gas_pedal"
          onMouseDown={() => { touchThrottleRef.current = true; }}
          onMouseUp={() => { touchThrottleRef.current = false; }}
          onTouchStart={(e) => { e.preventDefault(); touchThrottleRef.current = true; }}
          onTouchEnd={() => { touchThrottleRef.current = false; }}
          className="w-24 h-24 bg-slate-900/85 hover:bg-slate-800/90 active:scale-95 text-slate-100 rounded-3xl border-2 border-emerald-500/40 shadow-2xl flex flex-col items-center justify-center gap-1 pointer-events-auto select-none"
        >
          <span className="text-2xl">⚡</span>
          <span className="text-[10px] font-black tracking-widest text-emerald-400">GAS / ↻</span>
        </button>

      </div>

      {/* KEYBOARD HELP LEGEND FOOTER ON COCKPIT WALL */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none text-[9px] text-slate-500 font-sans tracking-wide uppercase">
        Keyboard: [D/Space/→] Throttle, [A/←] Brake/Reverse
      </div>

      {/* GAME OVER CARD MODAL */}
      {isGameOver && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500 max-w-sm w-full rounded-3xl p-6 text-center shadow-2xl animate-scaleUp">
            
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              {gameOverReason === 'crash' ? (
                <AlertTriangle className="w-8 h-8 text-red-500" />
              ) : (
                <Fuel className="w-8 h-8 text-amber-500 animate-pulse" />
              )}
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-wider font-sans">
              {gameOverReason === 'crash' ? "DRIVER CRASHED!" : "OUT OF GAS!"}
            </h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              {gameOverReason === 'crash' 
                ? "Keep your vehicle balanced in mid-air using Gas & Brake keys!" 
                : "Upgrade your fuel tank in the garage or search closer for gas cans!"
              }
            </p>

            {/* Run summary stats */}
            <div className="bg-slate-950/80 rounded-2xl p-4 mb-6 border border-slate-850 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Distance Travelled:</span>
                <span className="font-bold text-slate-100 font-mono">{currentDistance.toFixed(0)} meters</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Coins Collected:</span>
                <span className="font-bold text-yellow-400 font-mono flex items-center gap-1">
                  +{currentCoins} 🪙
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Map Highscore:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {currentHighscore.toFixed(0)} meters {currentDistance >= currentHighscore ? '🏆' : ''}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                id="replay_game_session"
                onClick={() => {
                  audio.playClick();
                  setIsGameOver(false);
                  prepareCollectiblesOnStart();
                  // Reset physical elements
                  const initialY = getTrackHeight(100) - 40;
                  stateRef.current.carX = 100;
                  stateRef.current.carY = initialY;
                  stateRef.current.cameraX = 100;
                  stateRef.current.cameraY = initialY;
                  stateRef.current.vx = 0;
                  stateRef.current.vy = 0;
                  stateRef.current.angle = 0;
                  stateRef.current.angularVelocity = 0;
                  stateRef.current.fuelValue = 100;
                  stateRef.current.coinsScore = 0;
                  stateRef.current.distanceTravelled = 0;
                  setCurrentCoins(0);
                  setCurrentDistance(0);
                  setFuelLevel(100);
                }}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-xl text-xs tracking-widest uppercase transition flex items-center justify-center gap-2 shadow"
              >
                <RotateCcw className="w-4 h-4" /> Try Run Again
              </button>

              <button
                id="return_to_garage_action"
                onClick={() => {
                  audio.playClick();
                  audio.stopEngine();
                  onExit();
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-extrabold py-3 rounded-xl text-xs tracking-widest uppercase transition"
              >
                Return to Garage Menu
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PAUSE SCREEN OVERLAY */}
      {isPaused && (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-xs w-full rounded-3xl p-6 text-center shadow-2xl">
            <h3 className="text-xl font-bold text-white uppercase tracking-wide block mb-3">RACE PAUSED</h3>
            <p className="text-xs text-slate-400 mb-6">Take a breath, pilot! Balance those wheels.</p>

            <div className="space-y-3">
              <button
                id="resume_race_btn"
                onClick={() => { audio.playClick(); setIsPaused(false); }}
                className="w-full bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-extrabold py-3.5 rounded-xl text-xs tracking-widest uppercase transition"
              >
                Continue Run
              </button>
              <button
                id="quit_active_run_btn"
                onClick={() => {
                  audio.playClick();
                  audio.stopEngine();
                  onExit();
                }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-sans font-bold py-2.5 rounded-xl text-xs uppercase"
              >
                Exit to Garage
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
