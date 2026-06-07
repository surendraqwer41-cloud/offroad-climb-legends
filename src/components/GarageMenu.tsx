import React, { useState, useEffect } from 'react';
import { UserStats, VehicleId, TrackId, VehicleConfig, TrackConfig, UpgradeLevels } from '../types';
import { VEHICLES, TRACKS, ACHIEVEMENTS, getUpgradeCost, getUpgradeValue } from '../utils/gameData';
import { audio } from '../utils/audio';
import { 
  Trophy, 
  Coins, 
  CoinsIcon as CoinBag, 
  Sparkles, 
  Tv, 
  Timer, 
  Lock, 
  Play, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Award,
  ChevronRight,
  ChevronLeft,
  Gauge,
  Sliders,
  Database,
  ArrowRight
} from 'lucide-react';

interface GarageMenuProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  onStartGame: (vehicleId: VehicleId, trackId: TrackId) => void;
}

export default function GarageMenu({ stats, onUpdateStats, onStartGame }: GarageMenuProps) {
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'tracks'>('vehicles');
  
  // Modals / Drawers states
  const [showAchievements, setShowAchievements] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showDailyClaim, setShowDailyClaim] = useState(false);
  const [isMuted, setIsMuted] = useState(audio.getMuteStatus());

  // Ad simulation
  const [adTimer, setAdTimer] = useState<number | null>(null);
  const [activeAdSlogan, setActiveAdSlogan] = useState('');

  // Daily claim countdown display
  const [dailyClaimMsg, setDailyClaimMsg] = useState('');

  const currentVehicle = VEHICLES[selectedVehicleIdx];
  const currentTrack = TRACKS[selectedTrackIdx];
  const vehicleUpgrades = stats.upgrades[currentVehicle.id] || { engine: 1, suspension: 1, tires: 1, fuelTank: 1 };

  useEffect(() => {
    // Check if daily reward can be claimed
    checkDailyRewardStatus();
  }, [stats.lastDailyRewardClaimed]);

  const checkDailyRewardStatus = () => {
    if (!stats.lastDailyRewardClaimed) {
      setDailyClaimMsg('CLAIM READY!');
      return;
    }
    const lastClaim = new Date(stats.lastDailyRewardClaimed).getTime();
    const now = Date.now();
    const diffuser = now - lastClaim;
    const hours24 = 24 * 60 * 60 * 1000;
    if (diffuser >= hours24) {
      setDailyClaimMsg('CLAIM READY!');
    } else {
      const remainingMs = hours24 - diffuser;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      setDailyClaimMsg(`Next in ${hours}h ${mins}m`);
    }
  };

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const selectNextVehicle = () => {
    audio.playClick();
    setSelectedVehicleIdx((prev) => (prev + 1) % VEHICLES.length);
  };

  const selectPrevVehicle = () => {
    audio.playClick();
    setSelectedVehicleIdx((prev) => (prev - 1 + VEHICLES.length) % VEHICLES.length);
  };

  const selectNextTrack = () => {
    audio.playClick();
    setSelectedTrackIdx((prev) => (prev + 1) % TRACKS.length);
  };

  const selectPrevTrack = () => {
    audio.playClick();
    setSelectedTrackIdx((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const unlockVehicle = (vehicle: VehicleConfig) => {
    if (stats.coins >= vehicle.basePrice) {
      const newCoins = stats.coins - vehicle.basePrice;
      const newUnlocked = [...stats.unlockedVehicles, vehicle.id];
      audio.playUpgrade();
      onUpdateStats({
        ...stats,
        coins: newCoins,
        unlockedVehicles: newUnlocked
      });
    } else {
      audio.playClick();
      alert(`Need ${vehicle.basePrice - stats.coins} more coins to unlock ${vehicle.name}!`);
    }
  };

  const unlockTrack = (track: TrackConfig) => {
    if (stats.coins >= track.basePrice) {
      const newCoins = stats.coins - track.basePrice;
      const newUnlocked = [...stats.unlockedTracks, track.id];
      audio.playUpgrade();
      onUpdateStats({
        ...stats,
        coins: newCoins,
        unlockedTracks: newUnlocked
      });
    } else {
      audio.playClick();
      alert(`Need ${track.basePrice - stats.coins} more coins to unlock this map!`);
    }
  };

  const purchaseUpgrade = (component: keyof UpgradeLevels) => {
    const currentLvl = vehicleUpgrades[component];
    if (currentLvl >= 10) return;

    const cost = getUpgradeCost(component, currentLvl);
    if (stats.coins >= cost) {
      audio.playUpgrade();
      const updatedUpgradesForCar = {
        ...vehicleUpgrades,
        [component]: currentLvl + 1
      };

      const updatedCoins = stats.coins - cost;
      
      onUpdateStats({
        ...stats,
        coins: updatedCoins,
        upgrades: {
          ...stats.upgrades,
          [currentVehicle.id]: updatedUpgradesForCar
        }
      });
    } else {
      audio.playClick();
      alert(`Insufficient coins! Need ${cost - stats.coins} more coins.`);
    }
  };

  // Simulated ad
  const playSimulatedAd = () => {
    audio.playClick();
    const slogans = [
      "Mountain Rider X Pro Edition: Out of Control!",
      "Upgrade to Monster Tires for 2.5x higher flips!",
      "Exotic Moon Gravity is best with Super Motocross Bike!",
      "Fuel Tank Level 10 handles active frozen icy bridges!",
      "Master backflips to multiply your coin rewards instantly!"
    ];
    setActiveAdSlogan(slogans[Math.floor(Math.random() * slogans.length)]);
    setAdTimer(5);
  };

  useEffect(() => {
    if (adTimer === null) return;
    if (adTimer <= 0) {
      // Reward
      const newCoins = stats.coins + 1500;
      onUpdateStats({
        ...stats,
        coins: newCoins,
        accumulatedTotalCoins: stats.accumulatedTotalCoins + 1500
      });
      setAdTimer(null);
      audio.playUpgrade();
      return;
    }
    const thread = setTimeout(() => {
      setAdTimer(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(thread);
  }, [adTimer]);

  // Daily chest claim
  const claimDailyReward = () => {
    audio.playClick();
    const lastClaim = stats.lastDailyRewardClaimed;
    const nowStamp = Date.now();
    const hours24 = 24 * 60 * 60 * 1000;

    if (lastClaim) {
      const diffuser = nowStamp - new Date(lastClaim).getTime();
      if (diffuser < hours24) {
        alert("Daily bonus chest is already claimed. Check back tomorrow!");
        return;
      }
    }

    // Award random amount 2,000 - 5,000 coins!
    const rewardAmt = Math.round((2000 + Math.random() * 3000) / 100) * 100;
    audio.playUpgrade();
    const newCoins = stats.coins + rewardAmt;
    onUpdateStats({
      ...stats,
      coins: newCoins,
      lastDailyRewardClaimed: new Date().toISOString(),
      accumulatedTotalCoins: stats.accumulatedTotalCoins + rewardAmt
    });
    alert(`💡 You obtained: +${rewardAmt} Reward Gold Coins!`);
    setShowDailyClaim(false);
  };

  // Buy simulated packages
  const buySimulatedCoins = (amount: number, priceStr: string) => {
    audio.playUpgrade();
    const newCoins = stats.coins + amount;
    onUpdateStats({
      ...stats,
      coins: newCoins,
      accumulatedTotalCoins: stats.accumulatedTotalCoins + amount
    });
    alert(`🎉 Purchase Successful! +${amount.toLocaleString()} coins have been added to your garage vault.`);
  };

  // Achievements checking
  const claimAchievementReward = (achId: string, rewardVal: number) => {
    if (stats.completedAchievements.includes(achId)) return;
    audio.playUpgrade();
    onUpdateStats({
      ...stats,
      coins: stats.coins + rewardVal,
      completedAchievements: [...stats.completedAchievements, achId]
    });
  };

  const isVehicleUnlocked = stats.unlockedVehicles.includes(currentVehicle.id);
  const isTrackUnlocked = stats.unlockedTracks.includes(currentTrack.id);

  // Stats calculate
  const currentSpeedStat = currentVehicle.basePower * getUpgradeValue('engine', vehicleUpgrades.engine);
  const currentSuspensionStat = currentVehicle.baseSuspension * getUpgradeValue('suspension', vehicleUpgrades.suspension);
  const currentTiresStat = currentVehicle.baseTraction * getUpgradeValue('tires', vehicleUpgrades.tires);
  const currentFuelStat = currentVehicle.baseFuelTank * getUpgradeValue('fuelTank', vehicleUpgrades.fuelTank);

  return (
    <div id="garage_dashboard_canvas" className="relative w-full min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Upper Navigation Header */}
      <header className="w-full bg-slate-950 border-b border-slate-850 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow">🏍️</span>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-amber-500 uppercase font-sans">Mountain Rider X</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest">REALISTIC 2D HILL PHYSICS ENGINE</p>
          </div>
        </div>

        {/* Currency & Actions row */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            id="store_balance_btn"
            onClick={() => { audio.playClick(); setShowStore(true); }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 transition px-3 py-1.5 rounded-full border border-amber-500/20 shadow-inner"
          >
            <Coins className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
            <span className="text-sm font-black font-mono text-amber-400">{stats.coins.toLocaleString()}</span>
            <span className="text-xs bg-amber-500 text-slate-950 font-extrabold px-1.5 rounded-full ml-1">+</span>
          </button>

          <button 
            id="achievements_trigger"
            onClick={() => { audio.playClick(); setShowAchievements(true); }}
            className="relative bg-slate-800 hover:bg-slate-750 p-2 rounded-full border border-slate-700 transition"
            title="Achievements"
          >
            <Trophy className="w-5 h-5 text-yellow-500" />
            {ACHIEVEMENTS.filter(ach => {
              // check if completed but not paid out
              const isEligible = 
                (ach.type === 'distance' && Object.values(stats.highscores).some(score => score >= ach.targetValue)) ||
                (ach.type === 'coins' && stats.accumulatedTotalCoins >= ach.targetValue) ||
                (ach.type === 'flips' && stats.totalFlips >= ach.targetValue) ||
                (ach.type === 'upgrades' && Object.values(stats.upgrades).some(u => Object.values(u).some(lvl => lvl >= ach.targetValue)));
              return isEligible && !stats.completedAchievements.includes(ach.id);
            }).length > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border border-slate-900 rounded-full animate-bounce"></span>
            )}
          </button>

          <button
            id="mute_synth_btn"
            onClick={handleToggleMute}
            className="bg-slate-800 hover:bg-slate-750 p-2 rounded-full border border-slate-700 transition"
            title={isMuted ? "Unmute sounds" : "Mute sounds"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Primary tab views selection */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-6 flex-1 flex flex-col">
        
        {/* Ad bar simulator */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Tv className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Free Coin Generator</p>
              <p className="text-xs text-slate-400">Watch Sponsor Video to claim <b className="text-amber-400">1,500</b> Gold instantly!</p>
            </div>
          </div>
          <button
            id="watch_adds_simulator"
            onClick={playSimulatedAd}
            className="bg-indigo-600 hover:bg-indigo-500 transition font-bold px-4 py-2 rounded-lg text-xs tracking-wider uppercase shadow-md flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Claim Free Gold
          </button>
        </div>

        {/* Dynamic selectors layout */}
        <div className="w-full flex border-b border-slate-800 mb-6">
          <button
            id="tab_vehicles_btn"
            onClick={() => { audio.playClick(); setActiveTab('vehicles'); }}
            className={`flex-1 py-3 text-center font-bold tracking-widest text-sm uppercase transition-all ${
              activeTab === 'vehicles' 
                ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Select Vehicle 🚙
          </button>
          <button
            id="tab_tracks_btn"
            onClick={() => { audio.playClick(); setActiveTab('tracks'); }}
            className={`flex-1 py-3 text-center font-bold tracking-widest text-sm uppercase transition-all ${
              activeTab === 'tracks' 
                ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-500/5' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Select Map 🏔️
          </button>
        </div>

        {activeTab === 'vehicles' ? (
          /* VEHICLE CHOOSE SLIDE */
          <div id="vehicle_carousel" className="flex-1 flex flex-col justify-between mb-8">
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 relative flex flex-col md:flex-row items-center gap-8 shadow-2xl">
              
              {/* Carousel control buttons */}
              <button 
                id="vehicle_prev_arrow"
                onClick={selectPrevVehicle}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 bg-slate-800 hover:bg-slate-700 hover:text-amber-400 transition rounded-full border border-slate-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                id="vehicle_next_arrow"
                onClick={selectNextVehicle}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-800 hover:bg-slate-700 hover:text-amber-400 transition rounded-full border border-slate-700"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Big Model Emoji Showcase */}
              <div className="w-48 h-48 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700/60 flex flex-col items-center justify-center relative shadow-inner md:ml-6 shrink-0">
                <span className="text-7xl filter drop-shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                  {currentVehicle.emoji}
                </span>

                <div className="absolute bottom-2 inset-x-2 bg-slate-950/80 rounded-lg text-center py-1 border border-slate-800">
                  <span className="text-xs font-mono text-slate-300 font-extrabold tracking-wider">{currentVehicle.name.split(' ')[0]} Frame</span>
                </div>
              </div>

              {/* Specific vehicle specs description */}
              <div className="flex-1 w-full text-center md:text-left pr-4">
                <div className="mb-2">
                  <h2 className="text-2xl font-black tracking-wide text-white">{currentVehicle.name}</h2>
                  <p className="text-xs text-amber-500 uppercase tracking-widest font-extrabold font-mono mt-1">
                    {isVehicleUnlocked ? "🟢 UNLOCKED & READY" : `🔒 LOCKED • ${currentVehicle.basePrice.toLocaleString()} COINS`}
                  </p>
                </div>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                  {currentVehicle.description}
                </p>

                {/* Bars showing multipliers */}
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 font-bold mb-1">
                      <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-red-400" /> ENGINE POWER</span>
                      <span className="font-mono text-white text-xs">{(currentSpeedStat).toFixed(1)}x</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
                      <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${Math.min(currentSpeedStat / 3.2 * 100, 100)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 font-bold mb-1">
                      <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-blue-400" /> SUSPENSION SPRING</span>
                      <span className="font-mono text-white text-xs">{(currentSuspensionStat).toFixed(1)}x</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.min(currentSuspensionStat / 3.2 * 100, 100)}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 font-bold mb-1">
                      <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-emerald-400" /> TIRE SLIP TRACTION</span>
                      <span className="font-mono text-white text-xs">{(currentTiresStat).toFixed(1)}x</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/30">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${Math.min(currentTiresStat / 3.0 * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                {!isVehicleUnlocked && (
                  <button
                    id="buy_vehicle_btn"
                    onClick={() => unlockVehicle(currentVehicle)}
                    className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-lg text-sm tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    Unlock Vehicle For <Coins className="w-4 h-4" /> {currentVehicle.basePrice.toLocaleString()}
                  </button>
                )}
              </div>
            </div>

            {/* UPGRADE CONTROL PANEL - ONLY SHOW IF UNLOCKED */}
            {isVehicleUnlocked && (
              <div id="upgrade_panel" className="mt-6 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-500" /> Custom Tuning Vault (Vehicle Level Upgrades)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ENGINE */}
                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wide">V12 Engine Block</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">Level {vehicleUpgrades.engine}/10</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < vehicleUpgrades.engine ? 'bg-red-400' : 'bg-slate-750'}`}></span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      id="upgrade_engine_btn"
                      disabled={vehicleUpgrades.engine >= 10}
                      onClick={() => purchaseUpgrade('engine')}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs min-w-20 text-center ${
                        vehicleUpgrades.engine >= 10 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-red-500 hover:bg-red-400 text-white transition'
                      }`}
                    >
                      {vehicleUpgrades.engine >= 10 ? "MAX" : `${getUpgradeCost('engine', vehicleUpgrades.engine)} 🪙`}
                    </button>
                  </div>

                  {/* SUSPENSION */}
                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-blue-400 uppercase tracking-wide">Pneumatic Shocks</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">Level {vehicleUpgrades.suspension}/10</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < vehicleUpgrades.suspension ? 'bg-blue-400' : 'bg-slate-750'}`}></span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      id="upgrade_suspension_btn"
                      disabled={vehicleUpgrades.suspension >= 10}
                      onClick={() => purchaseUpgrade('suspension')}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs min-w-20 text-center ${
                        vehicleUpgrades.suspension >= 10 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-blue-500 hover:bg-blue-400 text-white transition'
                      }`}
                    >
                      {vehicleUpgrades.suspension >= 10 ? "MAX" : `${getUpgradeCost('suspension', vehicleUpgrades.suspension)} 🪙`}
                    </button>
                  </div>

                  {/* TIRES */}
                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Sticky Drag Radial Tires</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">Level {vehicleUpgrades.tires}/10</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < vehicleUpgrades.tires ? 'bg-emerald-400' : 'bg-slate-750'}`}></span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      id="upgrade_tires_btn"
                      disabled={vehicleUpgrades.tires >= 10}
                      onClick={() => purchaseUpgrade('tires')}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs min-w-20 text-center ${
                        vehicleUpgrades.tires >= 10 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-white transition'
                      }`}
                    >
                      {vehicleUpgrades.tires >= 10 ? "MAX" : `${getUpgradeCost('tires', vehicleUpgrades.tires)} 🪙`}
                    </button>
                  </div>

                  {/* FUEL TANK */}
                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">Extended Fuel Resevoir</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">Level {vehicleUpgrades.fuelTank}/10</span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < vehicleUpgrades.fuelTank ? 'bg-amber-400' : 'bg-slate-750'}`}></span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      id="upgrade_fueltank_btn"
                      disabled={vehicleUpgrades.fuelTank >= 10}
                      onClick={() => purchaseUpgrade('fuelTank')}
                      className={`px-3 py-1.5 rounded-lg font-black text-xs min-w-20 text-center ${
                        vehicleUpgrades.fuelTank >= 10 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 transition'
                      }`}
                    >
                      {vehicleUpgrades.fuelTank >= 10 ? "MAX" : `${getUpgradeCost('fuelTank', vehicleUpgrades.fuelTank)} 🪙`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions flow to next setup */}
            <div className="mt-6 flex justify-end">
              <button
                id="continue_to_next_tab"
                onClick={() => { audio.playClick(); setActiveTab('tracks'); }}
                className="bg-slate-800 hover:bg-slate-750 text-slate-100 font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 border border-slate-700"
              >
                Go to Map Selection <ArrowRight className="w-4.5 h-4.5 text-amber-500" />
              </button>
            </div>
          </div>
        ) : (
          /* LEVEL MAP SELECT CHOOSE SLIDE */
          <div id="track_carousel" className="flex-1 flex flex-col justify-between mb-8 animate-fadeIn">
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 relative flex flex-col md:flex-row items-center gap-8 shadow-2xl">
              
              {/* Carousel controls */}
              <button 
                id="track_prev_arrow"
                onClick={selectPrevTrack}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 bg-slate-800 hover:bg-slate-700 hover:text-amber-400 transition rounded-full border border-slate-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                id="track_next_arrow"
                onClick={selectNextTrack}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-800 hover:bg-slate-700 hover:text-amber-400 transition rounded-full border border-slate-700"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Backdrop graphics preview */}
              <div 
                className="w-48 h-48 rounded-2xl border border-slate-700/60 overflow-hidden relative flex flex-col justify-end p-3 shadow-inner shrink-0"
                style={{ background: currentTrack.skyColorDay }}
              >
                {/* Visual styler curves inside placeholder */}
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute bottom-6 left-0 right-0 h-10 bg-slate-700 rounded-t-full"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-850 rounded-t-full"></div>
                </div>

                {currentTrack.id === 'countryside' && <span className="absolute top-4 left-4 text-4xl filter drop-shadow">☀️</span>}
                {currentTrack.id === 'desert' && <span className="absolute top-4 left-4 text-4xl filter drop-shadow">🏜️</span>}
                {currentTrack.id === 'forest' && <span className="absolute top-4 left-4 text-4xl filter drop-shadow">🌲</span>}
                {currentTrack.id === 'snow_tracks' && <span className="absolute top-4 left-4 text-4xl filter drop-shadow">❄️</span>}
                {currentTrack.id === 'moon' && <span className="absolute top-4 left-4 text-4xl filter drop-shadow">👽</span>}

                <div className="bg-slate-950/80 rounded-lg text-center py-1 border border-slate-800 z-10 w-full">
                  <span className="text-xs font-mono text-slate-300 uppercase tracking-widest font-black">
                    {currentTrack.id === 'moon' ? "Lunar gravity" : "Standard Earth gravity"}
                  </span>
                </div>
              </div>

              {/* Map Description */}
              <div className="flex-1 w-full text-center md:text-left pr-4">
                <div className="mb-2">
                  <h2 className="text-2xl font-black tracking-wide text-white">{currentTrack.name}</h2>
                  <p className="text-xs text-amber-500 uppercase tracking-widest font-extrabold font-mono mt-1">
                    {isTrackUnlocked ? "🟢 UNLOCKED & AVAILABLE" : `🔒 LOCKED • ${currentTrack.basePrice.toLocaleString()} COINS`}
                  </p>
                </div>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-850">
                  {currentTrack.description}
                </p>

                {/* Level properties table stats */}
                <div className="grid grid-cols-2 gap-4 text-left bg-slate-900/50 border border-slate-850 p-4 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gravity Pull</span>
                    <span className="text-sm font-bold text-slate-100 font-mono">
                      {currentTrack.gravity === 0.06 ? "0.06 (Low Gravity 🌖)" : "0.22 (Standard 🌍)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Track Steepness</span>
                    <span className="text-sm font-bold text-slate-100 font-mono">
                      {currentTrack.steepness > 0.3 ? "Extreme Hills 🧗" : "Gentle ⛰️"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fuel Drain Rate</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      {Math.round(currentTrack.fuelTankRate * 100)}% speed
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Your Record</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {(stats.highscores[currentTrack.id] || 0).toFixed(0)} meters
                    </span>
                  </div>
                </div>

                {!isTrackUnlocked && (
                  <button
                    id="buy_track_btn"
                    onClick={() => unlockTrack(currentTrack)}
                    className="mt-6 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-lg text-sm tracking-widest uppercase transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    Unlock Map For <Coins className="w-4 h-4" /> {currentTrack.basePrice.toLocaleString()}
                  </button>
                )}
              </div>
            </div>

            {/* Launch start engine trigger button! */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-center sm:text-left">
                <span className="text-xs text-slate-400">READY RIDE SPECS</span>
                <p className="text-sm font-extrabold text-amber-400 font-mono">
                  {currentVehicle.name} @ {currentTrack.name}
                </p>
              </div>

              <button
                id="launch_driving_race"
                disabled={!isVehicleUnlocked || !isTrackUnlocked}
                onClick={() => {
                  audio.playClick();
                  onStartGame(currentVehicle.id, currentTrack.id);
                }}
                className={`w-full sm:w-auto font-black px-10 py-4 rounded-xl text-base tracking-widest uppercase flex items-center justify-center gap-3 shadow-2xl transition ${
                  isVehicleUnlocked && isTrackUnlocked
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer animate-pulse'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
                style={{ animationDuration: '2.5s' }}
              >
                <Play className="w-5 h-5 fill-slate-950" />
                Start Race Run!
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QUICK FLOATING ACCESS BAR */}
      <footer className="w-full mt-auto py-5 bg-slate-950/80 border-t border-slate-850 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>🛞 Total distance: <b>{(stats.totalDistancePlay).toFixed(0)}m</b></span>
            <span>🤸 Total Flips: <b>{stats.totalFlips}</b></span>
          </div>

          <div className="flex gap-2">
            <button
              id="claim_daily_drawer_trigger"
              onClick={() => { audio.playClick(); setShowDailyClaim(true); }}
              className="bg-slate-805 hover:bg-slate-750 font-bold px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase border border-slate-700 text-amber-400 flex items-center gap-1"
            >
              🎁 Daily Reward
            </button>
            <button
              id="simulate_store_drawer_trigger"
              onClick={() => { audio.playClick(); setShowStore(true); }}
              className="bg-amber-600 hover:bg-amber-500 font-bold px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase text-white shadow-md"
            >
              🪙 Store Sandbox
            </button>
          </div>
        </div>
      </footer>

      {/* FAKE WATCHING AD SPINNER LOADER OVERLAY */}
      {adTimer !== null && (
        <div className="fixed inset-0 bg-slate-950/95 z-50 flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border-2 border-indigo-500 rounded-3xl p-8 text-center relative shadow-2xl">
            <span className="text-5xl animate-bounce mb-4 block">📼</span>
            <div className="text-xs bg-indigo-600 text-white font-extrabold px-3 py-1 rounded-full uppercase absolute top-4 right-4">
              AD SPONSOR SIMULATION
            </div>
            
            <h2 className="text-xl font-bold text-amber-400 block mb-2 uppercase tracking-wide">Sponsored Video</h2>
            <div className="p-4 bg-slate-950/60 rounded-xl my-4 text-xs text-slate-300 font-mono italic leading-relaxed">
              "{activeAdSlogan}"
            </div>

            <p className="text-xs text-slate-400">Your +1,500 coins reward will unlock in:</p>
            <div className="text-4xl font-black font-mono text-indigo-400 my-4 animate-ping" style={{ animationDuration: '2s' }}>
              {adTimer}s
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-wider">
              Simulation sponsored dry advertisement engine. No real tracking has been processed.
            </p>
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS DRAWER MODAL */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 max-w-lg w-full rounded-2xl p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Unlockable Achievements
              </h3>
              <button 
                id="close_ach_modal"
                onClick={() => { audio.playClick(); setShowAchievements(false); }}
                className="text-slate-400 hover:text-slate-100 font-bold px-3 py-1 bg-slate-800 rounded-md text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {ACHIEVEMENTS.map(ach => {
                const isClaimed = stats.completedAchievements.includes(ach.id);
                
                // Evaluate eligibility
                let currentProgVal = 0;
                let isEligible = false;

                if (ach.type === 'distance') {
                  const maxDist = Math.max(...Object.values(stats.highscores), 0);
                  currentProgVal = maxDist;
                  isEligible = maxDist >= ach.targetValue;
                } else if (ach.type === 'coins') {
                  currentProgVal = stats.accumulatedTotalCoins;
                  isEligible = stats.accumulatedTotalCoins >= ach.targetValue;
                } else if (ach.type === 'flips') {
                  currentProgVal = stats.totalFlips;
                  isEligible = stats.totalFlips >= ach.targetValue;
                } else if (ach.type === 'upgrades') {
                  const maxLvl = Math.max(...Object.values(stats.upgrades).map(u => Math.max(...Object.values(u))));
                  currentProgVal = maxLvl;
                  isEligible = maxLvl >= ach.targetValue;
                }

                return (
                  <div key={ach.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {isClaimed ? "✅" : isEligible ? "🎁" : "🔒"} {ach.title}
                      </h4>
                      <p className="text-xs text-slate-400">{ach.description}</p>
                      
                      {/* progress indicator */}
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Progress: {Math.min(currentProgVal, ach.targetValue).toFixed(0)}/{ach.targetValue}
                      </p>
                    </div>

                    <div>
                      {isClaimed ? (
                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider bg-slate-850 px-2 py-1 rounded-md">
                          Collected
                        </span>
                      ) : isEligible ? (
                        <button
                          id={`claim_ach_${ach.id}`}
                          onClick={() => claimAchievementReward(ach.id, ach.rewardValue)}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider transition"
                        >
                          Claim +{ach.rewardValue} 🪙
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold font-mono bg-slate-850 border border-slate-750 px-2.5 py-1 rounded-md block text-center">
                          +{ach.rewardValue} 🪙
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STORE CHEAT COIN PACKS BOXES */}
      {showStore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 max-w-md w-full rounded-2xl p-6 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <CoinBag className="text-yellow-500" /> Fictional Store Gold Vault
              </h3>
              <button 
                id="close_store_modal"
                onClick={() => { audio.playClick(); setShowStore(false); }}
                className="text-slate-400 hover:text-slate-100 font-bold px-3 py-1 bg-slate-800 rounded-md text-xs"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 bg-slate-950 p-2.5 rounded-lg border border-slate-850 leading-relaxed text-center font-mono">
              🧪 SANDBOX PURCHASE DEVELOPER MODE: Click to instant credit your wallet for testing all cars!
            </p>

            <div className="space-y-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    🪙 Scooter Pack (Pocket Coins)
                  </h4>
                  <p className="text-xs text-slate-400">+5,000 Coins instant vault credit</p>
                </div>
                <button
                  id="buy_coin_pack_1"
                  onClick={() => buySimulatedCoins(5000, "$0.99")}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition"
                >
                  CREDIT FREE ($0.99)
                </button>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-amber-500/20 flex items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg">
                  BEST VALUE
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    💎 Monster Tycoon Bundle (Gold Rain)
                  </h4>
                  <p className="text-xs text-slate-400">+50,000 Coins vault credit</p>
                </div>
                <button
                  id="buy_coin_pack_2"
                  onClick={() => buySimulatedCoins(50000, "$4.99")}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition shadow"
                >
                  CREDIT FREE ($4.99)
                </button>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    👑 Dev Sandbox Master Keys
                  </h4>
                  <p className="text-xs text-slate-400">+250,000 Coins vault credit</p>
                </div>
                <button
                  id="buy_coin_pack_3"
                  onClick={() => buySimulatedCoins(250000, "$19.99")}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition"
                >
                  CREDIT FREE ($19.99)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DAILY CLAIM MODAL */}
      {showDailyClaim && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 max-w-sm w-full rounded-2xl p-6 shadow-2xl text-center relative animate-scaleUp">
            <span className="text-6xl animate-pulse block mb-3">🎁</span>
            <h3 className="text-lg font-bold text-amber-500 uppercase tracking-widest">
              Daily Bonus Vault
            </h3>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Come back every 24 hours to open a fictional secret chest containing between 2,000 to 5,000 gold coins!
            </p>

            <div className="flex flex-col gap-3">
              {dailyClaimMsg === 'CLAIM READY!' ? (
                <button
                  id="claim_chest_btn"
                  onClick={claimDailyReward}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs tracking-wider uppercase transition"
                >
                  Claim Chest Now!
                </button>
              ) : (
                <div className="w-full bg-slate-950 border border-slate-800 text-slate-400 font-mono text-xs py-3 rounded-xl">
                  ⏱️ COOLING DOWN: {dailyClaimMsg}
                </div>
              )}

              <button
                id="close_daily_modal"
                onClick={() => { audio.playClick(); setShowDailyClaim(false); }}
                className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2 rounded-xl text-xs"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
