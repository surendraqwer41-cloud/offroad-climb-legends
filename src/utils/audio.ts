// Real-time audio synthesizer for Mountain Rider X using Web Audio API

class SoundSystem {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private engineThrottle: number = 0;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialize when user interacts
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.startEngineSynth();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    } else {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    return this.isMuted;
  }

  public getMuteStatus(): boolean {
    return this.isMuted;
  }

  private startEngineSynth() {
    if (!this.ctx || this.isMuted) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(300, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime); // Quiet but audible

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
    } catch (e) {
      console.error("Error creating engine synth", e);
    }
  }

  public setEngineThrottle(speedPercent: number, throttleOn: boolean) {
    this.init();
    if (!this.ctx || this.isMuted) return;

    if (this.ctx.state === 'suspended') {
      // Chrome requires gesture interaction
      return;
    }

    if (!this.engineOsc || !this.engineGain) {
      this.startEngineSynth();
    }

    const t = this.ctx.currentTime;
    
    // Smooth transition
    this.engineThrottle = this.engineThrottle * 0.85 + (throttleOn ? 0.8 : 0.1) * 0.15;
    
    const baseFreq = 50; // Jeep idling freq
    const freqRange = 180; // revving range
    const targetFreq = baseFreq + this.engineThrottle * freqRange + speedPercent * 100;

    if (this.engineOsc) {
      this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.08);
    }

    if (this.engineFilter) {
      const filterFreq = 180 + targetFreq * 2.5;
      this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.1);
    }

    if (this.engineGain) {
      const volume = this.isMuted ? 0 : 0.05 + this.engineThrottle * 0.08;
      this.engineGain.gain.setTargetAtTime(volume, t, 0.1);
    }
  }

  public playCoin() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeIfNeeded();

    const t = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.setValueAtTime(1200, t + 0.08);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.4);
    } catch (e) {}
  }

  public playFuel() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeIfNeeded();

    const t = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(800, t + 0.25);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch (e) {}
  }

  public playCrash() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeIfNeeded();

    const t = this.ctx.currentTime;
    try {
      // Low rumble crash
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 0.6);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(60, t);
      osc2.frequency.exponentialRampToValueAtTime(10, t + 0.8);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + 0.8);
      osc2.stop(t + 0.8);
    } catch (e) {}
  }

  public playUpgrade() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeIfNeeded();

    const t = this.ctx.currentTime;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.frequency.setValueAtTime(300, t);
      osc1.frequency.linearRampToValueAtTime(600, t + 0.15);
      osc1.frequency.linearRampToValueAtTime(900, t + 0.3);

      osc2.frequency.setValueAtTime(150, t);
      osc2.frequency.linearRampToValueAtTime(300, t + 0.3);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.5);
      osc2.stop(t + 0.5);
    } catch (e) {}
  }

  public playClick() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    this.resumeIfNeeded();

    const t = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.setValueAtTime(400, t + 0.05);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {}
  }

  private resumeIfNeeded() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public stopEngine() {
    if (this.engineGain) {
      try {
        this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
      } catch (e) {}
    }
  }
}

export const audio = new SoundSystem();
