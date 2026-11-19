/* =========================================================
   星陨战线 · AUDIO
   Procedural score + SFX (no external assets)
   ========================================================= */
(function () {
  'use strict';

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.musicBus = null;
      this.sfxBus = null;
      this.reverb = null;
      this.muted = false;
      this.volume = (() => { try { const v = Number(localStorage.getItem('astral_volume')); return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.72; } catch (e) { return 0.72; } })();
      this.mood = 'menu';
      this.started = false;
      this.nextNote = 0;
      this.noteIndex = 0;
      this.lastShot = 0;
      this.droneNodes = [];
      this._bound = false;
    }

    init() {
      if (this.ctx) { this.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 5;
      comp.attack.value = 0.004;
      comp.release.value = 0.25;
      this.master.connect(comp);
      comp.connect(ctx.destination);

      this.musicBus = ctx.createGain();
      this.musicBus.gain.value = 0.34;
      this.musicBus.connect(this.master);

      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.8;
      this.sfxBus.connect(this.master);

      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this.makeImpulse(2.8, 2.4);
      this.reverb.connect(this.master);
      const wet = ctx.createGain();
      wet.gain.value = 0.4;
      this.reverb.connect(wet);
      wet.connect(this.master);

      this.noiseBuffer = this.makeNoise(1.2);

      this.buildDrone();
      this.nextNote = ctx.currentTime + 1.2;
      this.started = true;
      this.resume();
      this.setMood(this.mood);
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    }

    suspend() {
      if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
    }

    setMuted(muted) {
      this.muted = !!muted;
      if (this.master) {
        const t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.linearRampToValueAtTime(this.muted ? 0 : this.volume, t + 0.18);
      }
      try { localStorage.setItem('astral_muted', this.muted ? '1' : '0'); } catch (e) {}
      return this.muted;
    }

    setVolume(value) {
      this.volume = Math.max(0, Math.min(1, Number(value) || 0));
      if (this.master) {
        const t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.linearRampToValueAtTime(this.muted ? 0 : this.volume, t + 0.12);
      }
      try { localStorage.setItem('astral_volume', String(this.volume)); } catch (e) {}
      return this.volume;
    }

    toggleMute() {
      if (!this.ctx) this.init();
      return this.setMuted(!this.muted);
    }

    setMood(mood) {
      this.mood = mood || 'menu';
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const scale = this.mood === 'boss'
        ? [130.81, 138.59, 155.56, 174.61, 196.00, 207.65]
        : [146.83, 174.61, 196.00, 220.00, 261.63, 293.66];
      this.scale = scale;
      const target = this.mood === 'battle' ? 0.4 : this.mood === 'boss' ? 0.46 : this.mood === 'build' ? 0.3 : 0.28;
      this.musicBus.gain.cancelScheduledValues(t);
      this.musicBus.gain.linearRampToValueAtTime(this.muted ? 0 : target, t + 1.6);
    }

    buildDrone() {
      const ctx = this.ctx;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 460;
      filter.Q.value = 0.8;
      filter.connect(this.musicBus);
      const master = ctx.createGain();
      master.gain.value = 0.055;
      master.connect(filter);
      const freqs = [73.42, 110.0, 146.83, 220.0];
      const types = ['sine', 'sine', 'triangle', 'sine'];
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = types[i];
        o.frequency.value = f;
        o.detune.value = (i - 1.5) * 4;
        const g = ctx.createGain();
        g.gain.value = i === 0 ? 1 : 0.42;
        o.connect(g); g.connect(master);
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.045 + i * 0.017;
        const lg = ctx.createGain();
        lg.gain.value = 1.8 + i;
        lfo.connect(lg); lg.connect(o.detune);
        o.start(); lfo.start();
        this.droneNodes.push(o, lfo);
      });
      const lfo2 = ctx.createOscillator();
      lfo2.frequency.value = 0.07;
      const lg2 = ctx.createGain();
      lg2.gain.value = 180;
      lfo2.connect(lg2); lg2.connect(filter.frequency);
      lfo2.start();
      this.droneNodes.push(lfo2);
    }

    makeImpulse(seconds, decay) {
      const ctx = this.ctx;
      const len = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
      }
      return buf;
    }

    makeNoise(seconds) {
      const ctx = this.ctx;
      const len = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }

    update(dt) {
      if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
      const now = this.ctx.currentTime;
      const battle = this.mood === 'battle' || this.mood === 'boss';
      const interval = this.mood === 'boss' ? 1.3 : battle ? 1.85 : this.mood === 'build' ? 2.8 : 3.2;
      if (now >= this.nextNote) {
        if (Math.random() < (battle ? 0.82 : 0.62)) this.playBell(now + 0.02);
        this.nextNote = now + interval * (0.82 + Math.random() * 0.4);
        if (this.mood === 'boss' && Math.random() < 0.4) this.lowPulse(now + 0.05);
      }
    }

    playBell(when) {
      const ctx = this.ctx;
      const scale = this.scale || [146.83, 174.61, 196.0, 220, 261.63];
      const idx = (this.noteIndex + Math.floor(Math.random() * 3)) % scale.length;
      this.noteIndex = (this.noteIndex + 1) % scale.length;
      const f = scale[idx] * (Math.random() < 0.18 ? 2 : 1);
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const o2 = ctx.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = f * 2.004;
      const g = ctx.createGain();
      const g2 = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.05, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 3.4);
      g2.gain.setValueAtTime(0, when);
      g2.gain.linearRampToValueAtTime(0.018, when + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0001, when + 2.0);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) pan.pan.value = (Math.random() * 2 - 1) * 0.45;
      o.connect(g); o2.connect(g2);
      if (pan) { g.connect(pan); g2.connect(pan); pan.connect(this.musicBus); pan.connect(this.reverb); }
      else { g.connect(this.musicBus); g2.connect(this.reverb); }
      o.start(when); o2.start(when);
      o.stop(when + 3.5); o2.stop(when + 2.1);
    }

    lowPulse(when) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(58, when);
      o.frequency.exponentialRampToValueAtTime(34, when + 0.6);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.linearRampToValueAtTime(0.09, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 1.1);
      o.connect(g); g.connect(this.musicBus); g.connect(this.reverb);
      o.start(when); o.stop(when + 1.2);
    }

    /* ---------------- SFX ---------------- */
    tone(freq, dur, type, vol, slide, when, bus) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const t0 = when || ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(Math.max(20, freq), t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      const out = bus || this.sfxBus;
      g.connect(out);
      if (out === this.sfxBus) g.connect(this.reverb);
      o.start(t0); o.stop(t0 + dur + 0.03);
    }

    noise(dur, vol, freq, when, type) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const t0 = when || ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const f = ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 1400;
      f.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(this.sfxBus); g.connect(this.reverb);
      src.start(t0); src.stop(t0 + dur + 0.02);
    }

    play(name, opts) {
      if (!this.ctx || this.muted) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      opts = opts || {};
      switch (name) {
        case 'ui':
          this.tone(920, 0.09, 'sine', 0.045, 1180, now);
          this.tone(1840, 0.06, 'sine', 0.015, 1500, now + 0.01);
          break;
        case 'hover':
          this.tone(1400, 0.035, 'sine', 0.012, 1600, now);
          break;
        case 'place':
          this.tone(523.25, 0.5, 'triangle', 0.09, 523.25, now);
          this.tone(783.99, 0.55, 'sine', 0.06, 783.99, now + 0.08);
          this.tone(1046.5, 0.7, 'sine', 0.04, 1046.5, now + 0.16);
          this.noise(0.25, 0.035, 3000, now);
          break;
        case 'deny':
          this.tone(180, 0.16, 'square', 0.035, 120, now);
          this.tone(140, 0.2, 'sawtooth', 0.02, 90, now + 0.04);
          break;
        case 'shoot_archer':
          if (now - this.lastShot < 0.045) return;
          this.lastShot = now;
          this.tone(880 + Math.random() * 160, 0.12, 'triangle', 0.022, 320, now);
          this.noise(0.05, 0.018, 3200, now, 'highpass');
          break;
        case 'shoot_mage':
          if (now - this.lastShot < 0.06) return;
          this.lastShot = now;
          this.tone(420, 0.24, 'sine', 0.03, 720, now);
          this.tone(1180, 0.18, 'sine', 0.012, 1600, now + 0.03);
          break;
        case 'blade':
          if (now - this.lastShot < 0.05) return;
          this.lastShot = now;
          this.noise(0.09, 0.03, 2400, now, 'highpass');
          this.tone(560, 0.1, 'sawtooth', 0.012, 220, now);
          break;
        case 'hit':
          this.noise(0.06, 0.018, 1800 + Math.random() * 900, now);
          break;
        case 'crit':
          this.noise(0.09, 0.03, 2600, now);
          this.tone(1250, 0.12, 'sine', 0.025, 1800, now);
          break;
        case 'kill':
          this.tone(220, 0.35, 'sine', 0.03, 70, now);
          this.noise(0.24, 0.03, 900, now);
          break;
        case 'gold':
          this.tone(1320, 0.08, 'sine', 0.016, 1760, now);
          break;
        case 'coreHit':
          this.tone(80, 0.8, 'sine', 0.14, 36, now);
          this.noise(0.4, 0.08, 220, now, 'lowpass');
          this.tone(520, 0.4, 'sawtooth', 0.02, 260, now);
          break;
        case 'mergeOpen':
          [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
            this.tone(f, 1.2, 'sine', 0.035, f, now + i * 0.1);
          });
          this.noise(0.8, 0.025, 3500, now, 'highpass');
          break;
        case 'choose':
          [261.63, 329.63, 392, 523.25].forEach((f, i) => {
            this.tone(f, 1.6, 'triangle', 0.05, f, now + i * 0.035);
          });
          this.tone(1046.5, 2.2, 'sine', 0.03, 1046.5, now + 0.2);
          break;
        case 'fuse':
          this.tone(160, 1.2, 'sine', 0.08, 640, now);
          this.noise(0.9, 0.06, 1800, now);
          this.tone(1568, 1.4, 'sine', 0.03, 2093, now + 0.15);
          break;
        case 'wave':
          this.tone(110, 1.2, 'sine', 0.07, 110, now);
          this.tone(164.81, 1.3, 'triangle', 0.04, 164.81, now + 0.05);
          this.tone(329.63, 1.0, 'sine', 0.025, 329.63, now + 0.15);
          this.noise(0.6, 0.025, 500, now, 'lowpass');
          break;
        case 'boss':
          this.tone(55, 2.4, 'sine', 0.12, 36, now);
          this.tone(110, 2.0, 'sawtooth', 0.025, 82, now);
          this.noise(1.5, 0.04, 300, now, 'lowpass');
          [220, 233.08, 261.63, 311.13].forEach((f, i) => this.tone(f, 2.4, 'sine', 0.025, f, now + i * 0.18));
          break;
        case 'levelup':
          [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 1.0, 'triangle', 0.04, f, now + i * 0.06));
          break;
        case 'victory':
          [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 2.8, 'sine', 0.05, f, now + i * 0.18));
          this.noise(2.0, 0.02, 4000, now, 'highpass');
          break;
        case 'defeat':
          [196, 174.61, 146.83, 110].forEach((f, i) => this.tone(f, 3.0, 'sine', 0.06, f * 0.98, now + i * 0.35));
          this.noise(2.0, 0.03, 240, now, 'lowpass');
          break;
        case 'announce':
          this.tone(392, 0.8, 'sine', 0.03, 392, now);
          this.tone(587.33, 1.0, 'sine', 0.025, 587.33, now + 0.12);
          break;
        default:
          break;
      }
    }
  }

  window.AstralAudio = new AudioEngine();
})();
