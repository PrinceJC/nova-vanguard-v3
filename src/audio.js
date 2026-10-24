"use strict";
// ============================================================ synthesized audio (starts only after a user gesture)
const SFX_GAP = { shoot: 0.07, eshot: 0.09, tick: 0.08, hit: 0.05, clink: 0.06, bosshit: 0.06, pop: 0.03, bshot: 0.08 };
const Sound = {
  ctx: null, master: null, mus: null, sfx: null, noise: null, last: {}, set: null, seq: null,
  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
    this.mus = this.ctx.createGain(); this.mus.connect(this.master);
    this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
    const len = this.ctx.sampleRate; const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    if (this.set) this.apply(this.set);
  },
  apply(s) {
    this.set = s; if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.mus.gain.setTargetAtTime(s.musicMute ? 0 : s.music * 0.32, t, 0.05);
    this.sfx.gain.setTargetAtTime(s.sfxMute ? 0 : s.sfx * 0.55, t, 0.02);
  },
  tone(f0, f1, dur, type = "square", vol = 0.3, when = 0, dest) {
    const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.02);
  },
  burst(dur, vol, freq = 1200, when = 0, dest, q = 0.7) {
    const c = this.ctx, t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(80, t + dur); f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },
  play(n) {
    if (!this.ctx || this.ctx.state !== "running") return;
    const now = this.ctx.currentTime;
    if (SFX_GAP[n] && this.last[n] && now - this.last[n] < SFX_GAP[n]) return;
    this.last[n] = now;
    switch (n) {
      case "shoot": this.tone(1300, 700, 0.06, "square", 0.05); break;
      case "eshot": this.tone(500, 300, 0.08, "triangle", 0.06); break;
      case "bshot": this.tone(420, 180, 0.14, "sawtooth", 0.08); break;
      case "tick": this.tone(700, 500, 0.04, "triangle", 0.04); break;
      case "hit": this.tone(260, 160, 0.05, "square", 0.05); break;
      case "bosshit": this.tone(200, 120, 0.05, "square", 0.05); break;
      case "clink": this.tone(1800, 1500, 0.04, "triangle", 0.05); break;
      case "pop": this.burst(0.25, 0.3, 2400); this.tone(300, 60, 0.2, "square", 0.08); break;
      case "explode": this.burst(0.6, 0.5, 1800); this.tone(140, 40, 0.5, "sawtooth", 0.15); break;
      case "bossdie": for (let i = 0; i < 6; i++) { this.burst(0.7, 0.45, 2000, i * 0.35); this.tone(160 - i * 15, 40, 0.6, "sawtooth", 0.12, i * 0.35); } break;
      case "hurt": this.tone(600, 120, 0.3, "sawtooth", 0.18); this.burst(0.2, 0.2, 900); break;
      case "shieldbreak": this.tone(1200, 300, 0.25, "triangle", 0.15); break;
      case "pickup": this.tone(880, 880, 0.06, "square", 0.08); this.tone(1320, 1320, 0.08, "square", 0.08, 0.06); break;
      case "powerup": [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, f, 0.09, "square", 0.08, i * 0.06)); break;
      case "special": this.tone(1600, 120, 0.5, "sawtooth", 0.16); this.burst(0.7, 0.4, 5000); this.tone(80, 40, 0.6, "sine", 0.3); break;
      case "warning": for (let i = 0; i < 3; i++) { this.tone(440, 440, 0.25, "square", 0.1, i * 0.6); this.tone(330, 330, 0.25, "square", 0.1, i * 0.6 + 0.3); } break;
      case "phase": this.tone(120, 600, 0.8, "sawtooth", 0.14); this.burst(0.8, 0.3, 1500); break;
      case "charge": this.tone(300, 1200, 0.45, "triangle", 0.08); break;
      case "thunder": this.burst(0.5, 0.4, 3000); break;
      case "dash": this.burst(0.25, 0.2, 3000); this.tone(900, 300, 0.2, "sawtooth", 0.06); break;
      case "warp": this.tone(1500, 200, 0.5, "sine", 0.12); break;
      case "launch": this.burst(0.3, 0.25, 1500); break;
      case "wind": this.burst(0.9, 0.2, 700, 0, undefined, 3); break;
      case "open": this.tone(200, 400, 0.3, "triangle", 0.1); break;
      case "click": this.tone(900, 900, 0.03, "square", 0.05); break;
      case "heal": [523, 784, 1046].forEach((f, i) => this.tone(f, f, 0.12, "triangle", 0.1, i * 0.07)); break;
      case "clear": [523, 659, 784, 1046].forEach((f, i) => this.tone(f, f, 0.18, "square", 0.08, i * 0.12)); break;
    }
  },
  // ---------------------------------------------------------- music: tiny step sequencer
  music(cfg, boss) {
    this.stopMusic(); if (!this.ctx) return;
    const root = cfg.root, minor = cfg.minor || boss, bpm = cfg.bpm * (boss ? 1.1 : 1);
    const scale = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    const prog = minor ? [0, 5, 3, 4] : [0, 3, 4, 5];
    const r = srand(root * 97 + (boss ? 5 : 0));
    const lead = Array.from({ length: 32 }, () => (r() < 0.55 ? Math.floor(r() * 7) : -1));
    const step = 60 / bpm / 2; let i = 0, next = this.ctx.currentTime + 0.1;
    const mf = (deg, oct) => 440 * Math.pow(2, (root + scale[((deg % 7) + 7) % 7] + 12 * (oct + Math.floor(deg / 7)) - 69) / 12);
    const note = (f, dur, type, vol, t) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + dur + 0.02);
    };
    const tick = () => {
      while (next < this.ctx.currentTime + 0.15) {
        const bar = Math.floor(i / 16) % 4, s = i % 16, ch = prog[bar];
        if (s % 4 === 0) note(mf(ch, -2), step * 3.5, "triangle", 0.5, next);
        if (s % 2 === 0) note(mf(ch + [0, 2, 4, 2][(s / 2) % 4], 0), step * 0.9, "square", 0.08, next);
        const L = lead[i % 32]; if (L >= 0 && s % 2 === 0) note(mf(ch + L, 1), step * 1.6, boss ? "sawtooth" : "triangle", boss ? 0.07 : 0.1, next);
        if (s % 8 === 0 || (boss && s % 8 === 6)) { const t = next; const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(this.mus); o.start(t); o.stop(t + 0.2); }
        if (s % 4 === 2) this.burst(0.05, 0.12, 8000, next - this.ctx.currentTime, this.mus);
        if (s % 8 === 4) this.burst(0.12, 0.2, 2500, next - this.ctx.currentTime, this.mus);
        next += step; i++;
      }
    };
    this.seq = setInterval(tick, 40); tick();
  },
  stopMusic() { if (this.seq) clearInterval(this.seq); this.seq = null; },
  duck(on) { if (this.ctx) this.master.gain.setTargetAtTime(on ? 0.25 : 1, this.ctx.currentTime, 0.08); },
};
