"use strict";
// ============================================================ boss helpers
function bp(b, sx, sy) { const D = b.def.size; return { x: b.x - D / 2 + ((sx + 2) / 260) * D, y: b.y - D / 2 + ((sy + 2) / 260) * D }; }
function every(b, key, int, dt) { b.tm[key] = (b.tm[key] || 0) + dt; if (b.tm[key] >= int) { b.tm[key] -= int; return true; } return false; }
function once(b, key, t, at) { if (t >= at && !b.tm["o" + key]) { b.tm["o" + key] = 1; return true; } return false; }
const durOf = (a, b) => (typeof a.dur === "function" ? a.dur(b) : a.dur);
const ph = (b, arr) => arr[Math.min(b.phase, arr.length) - 1];

function farFromPlayer(g, minD, fx) {
  let x, y, n = 0;
  do { [x, y] = fx(); n++; } while (d2(x, y, g.player.x, g.player.y) < minD * minD && n < 25);
  return [x, y];
}
function spacedXs(count, lo, hi, minSep) {
  const xs = []; let n = 0;
  while (xs.length < count && n < 200) { const x = rand(lo, hi); if (xs.every((v) => Math.abs(v - x) >= minSep)) xs.push(x); n++; }
  return xs;
}

// ---------------------------------------------------------- shared attack factories
const A = {
  fan: (o) => ({ dur: o.dur || 2.2, tick(b, g, dt, t) {
    if (t < o.tele) b.tele = b.mz;
    (o.times || [o.tele]).forEach((tm, i) => { if (once(b, "f" + i, t, tm)) { const m = b.mz; fan(g, m.x, m.y, o.aimed ? aim(g, m.x, m.y) : Math.PI + (i % 2 ? 0.06 : -0.06), o.n, o.spread, o.speed * g.diff, { gap: true, c: o.c || "o", big: o.big }); ev(g, "sfx", { name: "bshot" }); } });
  } }),
  aimed: (o) => ({ dur: o.dur || 2.4, tick(b, g, dt, t) {
    if (t < 0.4) { b.tele = b.mz; return; }
    if (every(b, "a", o.every, dt)) { const m = b.mz2 && (b.tm.n = (b.tm.n || 0) + 1) % 2 ? b.mz2 : b.mz; fan(g, m.x, m.y, aim(g, m.x, m.y), o.n || 1, o.spread || 0, o.speed * g.diff, { big: o.big, c: o.c || "o" }); ev(g, "sfx", { name: "bshot" }); }
  } }),
  ring: (o) => ({ dur: o.dur || 2.4, tick(b, g, dt, t) {
    if (t < 0.45) { b.tele = b.core || b.mz; return; }
    if (every(b, "r", o.every, dt)) { const c = b.core || b.mz; b.tm.off = (b.tm.off || Math.random()) + 0.13; ring(g, c.x, c.y, o.n, o.speed * g.diff, b.tm.off, { gap: true, c: "m", big: o.big }); ev(g, "sfx", { name: "bshot" }); }
  } }),
  spiral: (o) => ({ dur: o.dur || 3, tick(b, g, dt, t) {
    if (t < 0.5) { b.tele = b.core || b.mz; return; }
    if (every(b, "s", o.every || 0.1, dt)) {
      const c = b.core || b.mz; b.tm.sa = (b.tm.sa || 0) + (o.turn || 0.22);
      for (let k = 0; k < o.arms; k++) shoot(g, c.x, c.y, b.tm.sa + (TAU / o.arms) * k, o.speed * g.diff, { c: "m" });
      ev(g, "sfx", { name: "tick" });
    }
  } }),
  beams: (o) => ({ dur: 2.5, start(b, g) {
    const lanes = 6, h = H / lanes; let chosen = [];
    while (chosen.length < o.n) { const l = Math.floor(Math.random() * lanes); if (!chosen.includes(l) && !chosen.some((c) => Math.abs(c - l) === 1 && o.n < 3)) chosen.push(l); }
    chosen.forEach((l) => hazard(g, { type: "hbeam", y: h * l + h / 2, h: h - 8, tele: 1.25, act: 0.7, color: o.color || "ice" }));
    ev(g, "sfx", { name: "charge" });
  }, tick(b) { b.tele = b.mz; } }),
  strikes: (o) => ({ dur: o.dur || 2.6, start(b, g) {
    const waves = o.waves || 1;
    for (let wv = 0; wv < waves; wv++) {
      const xs = spacedXs(o.n, 40, W - 230, 150);
      xs.forEach((x) => hazard(g, { type: "vstrike", x, w: 48, tele: 1.1 + wv * 1.0, act: 0.35, kind: o.kind || "lightning",
        onStart: o.kind === "debris" ? (g2, h) => { for (let i = 0; i < 3; i++) shoot(g2, h.x + rand(-10, 10), -20 - i * 70, Math.PI / 2, 270, { rock: true, big: true, r: 13, c: "o", life: 6 }); } : (g2) => { ev(g2, "sfx", { name: "thunder" }); g2.shake = Math.max(g2.shake, 0.08); } }));
    }
    ev(g, "sfx", { name: "charge" });
  }, tick(b) { b.tele = b.core || b.mz; } }),
  lasers: (o) => ({ dur: o.count * 1.35 + 1.0, start(b) { b.lock = true; }, tick(b, g, dt, t) {
    for (let i = 0; i < o.count; i++) if (once(b, "l" + i, t, i * 1.35)) {
      const m = b.mz;
      hazard(g, { type: "laser", x: m.x, y: m.y, ang: aim(g, m.x, m.y), w: 14, tele: 1.15, act: 0.45,
        follow: (h) => { h.x = b.mz.x; h.y = b.mz.y; if (h.t < 0.6) h.ang = aim(g, h.x, h.y); } });
      ev(g, "sfx", { name: "charge" });
    }
    b.tele = b.mz;
  }, end(b) { b.lock = false; } }),
  gravity: (o) => ({ dur: 4.6, start(b, g) {
    b.open = !!o.open;
    for (let i = 0; i < o.n; i++) {
      const [x, y] = farFromPlayer(g, 170, () => [rand(170, 600), rand(110, H - 110)]);
      hazard(g, { type: "zone", x, y, r: 130, force: 70, tele: 0.9, act: 3.4 });
    }
    ev(g, "sfx", { name: "charge" });
  }, tick(b, g, dt, t) {
    if (t > 1 && every(b, "g", 1.1, dt)) { const m = b.mz; shoot(g, m.x, m.y, aim(g, m.x, m.y), 130 * g.diff, { big: true, c: "m" }); }
  }, end(b) { b.open = false; } }),
  summon: (o) => ({ dur: 1.8, tick(b, g, dt, t) {
    if (t < 0.5) { b.tele = b.core || b.mz; return; }
    if (once(b, "s", t, 0.5)) for (let i = 0; i < o.n; i++) { const e = spawnEnemy(g, o.type, b.y + (i - (o.n - 1) / 2) * 70, b.x - b.def.size * 0.35); e.entered = false; e.stopX = rand(560, 760); }
  } }),
  teleport: (o) => ({ dur: 2.3, start(b, g) {
    b.lock = true;
    const [x, y] = farFromPlayer(g, 260, () => [rand(640, 840), rand(120, H - 120)]);
    b.dest = { x, y };
    hazard(g, { type: "marker", x, y, r: b.def.size * 0.32, tele: 0.9, act: 0 });
    ev(g, "sfx", { name: "warp" });
  }, tick(b, g, dt, t) {
    if (t < 0.45) b.alpha = 1 - t / 0.45;
    else if (t < 0.9) b.alpha = 0;
    else { if (once(b, "j", t, 0.9)) { b.x = b.hx = b.dest.x; b.baseY = b.dest.y; b.y = b.dest.y; b.t0 = b.t; } b.alpha = Math.min(1, (t - 0.9) / 0.3); }
    if (once(b, "fire", t, 1.3)) { const m = b.mz; fan(g, m.x, m.y, aim(g, m.x, m.y), o.n || 9, 80, 150 * g.diff, { gap: true, c: "m" }); }
  }, end(b) { b.alpha = 1; b.lock = false; } }),
  wall: (o) => ({ dur: 2.8, tick(b, g, dt, t) {
    if (t < 0.4) { b.tele = b.mz; return; }
    (o.times || [0.4, 1.5]).forEach((tm, i) => { if (once(b, "w" + i, t, tm)) { const gy = rand(110, H - 110); for (let y = 16; y < H; y += 30) if (Math.abs(y - gy) > (o.gap || 64)) shoot(g, b.x - b.def.size * 0.4, y, Math.PI, o.speed * g.diff, { c: "m" }); ev(g, "sfx", { name: "bshot" }); } });
  } }),
  stream: (o) => ({ dur: 2.7, tick(b, g, dt, t) {
    if (t < 0.5) { b.tele = b.mz; return; }
    if (every(b, "s", o.every || 0.11, dt)) { const k = (t - 0.5) / 2.1; shoot(g, b.mz.x, b.mz.y, Math.PI - 0.9 + 1.8 * k, o.speed * g.diff, { needle: true }); if (o.dual) shoot(g, b.mz.x, b.mz.y, Math.PI + 0.9 - 1.8 * k, o.speed * g.diff, { needle: true, c: "m" }); }
  } }),
  torpedo: (o) => ({ dur: 2.6, tick(b, g, dt, t) {
    if (t < 0.6) { b.tele = b.mz; return; }
    if (once(b, "t", t, 0.6)) { for (let i = 0; i < o.n; i++) { const a = aim(g, b.mz.x, b.mz.y) + (i - (o.n - 1) / 2) * 0.3; shoot(g, b.mz.x, b.mz.y, a, 120 * g.diff, { big: true, r: 9, hp: 2, homing: 1.0, life: 6, torpedo: true }); } ev(g, "sfx", { name: "launch" }); }
  } }),
  // lobbed bombs: a marked landing circle, then a burst (and a ring of slow shots). Damages only inside the circle.
  bombs: (o) => ({ dur: o.dur || 2.6, tick(b, g, dt, t) {
    if (t < 0.4) { b.tele = b.mz; return; }
    for (let i = 0; i < o.n; i++) if (once(b, "b" + i, t, 0.4 + i * (o.gap || 0.25))) {
      const p = g.player, tx = clamp(p.x + rand(-140, 140) * (i ? 1 : 0.4), 60, W - 220), ty = clamp(p.y + rand(-120, 120) * (i ? 1 : 0.4), 50, H - 50);
      hazard(g, { type: "bomb", sx: b.mz.x, sy: b.mz.y, x: tx, y: ty, r: o.r || 46, tele: 1.0, act: 0.15, style: o.style || "bomb", ring: o.ring || 0,
        onStart: (g2, h) => { explosion(g2, h.x, h.y, 1.1); if (h.ring) ring(g2, h.x, h.y, h.ring, 95 * g2.diff, Math.random(), { c: "m", gap: true }); ev(g2, "sfx", { name: "pop" }); } });
      ev(g, "sfx", { name: "launch" });
    }
  } }),
  blades: (o) => ({ dur: 2.8, tick(b, g, dt, t) {   // boomerang blades: fly out, then curve back
    if (t < 0.45) { b.tele = b.mz; return; }
    for (let i = 0; i < o.n; i++) if (once(b, "bl" + i, t, 0.45 + i * 0.35)) { const a = aim(g, b.mz.x, b.mz.y) + (i - (o.n - 1) / 2) * 0.35, sb = shoot(g, b.mz.x, b.mz.y, a, 260 * g.diff, { big: true, r: 15, c: "m", life: 6 }); if (sb) { sb.blade = true; sb.turnAt = 1.1; sb.life0 = 6; } ev(g, "sfx", { name: "dash" }); }
  } }),
  open: (o) => ({ dur: (b) => ph(b, o.durs), start(b, g) { b.open = true; ev(g, "sfx", { name: "open" }); }, tick(b, g, dt, t) {
    if (o.ring && once(b, "r", t, 0.35)) { const c = b.core; ring(g, c.x, c.y, o.ring, 95 * g.diff, Math.random(), { gap: true, c: "m", big: true }); }
  }, end(b) { b.open = false; } }),
};

// ============================================================ boss definitions
const BOSSES = {
  scrap_king: () => ({
    name: "Scrap King", size: 230, hp: 300, phases: [0.5], rest: [0.9, 0.6],
    sprite: (b) => (b.open ? "scrap_king_open" : "scrap_king"),
    pattern: [["aimed", "fan", "chest"], ["aimed2", "fan2", "chest2"]],
    move(b) { b.y = H / 2 + Math.sin(b.t * 0.6) * 110; },
    layout(b) {
      const c = bp(b, 168, 118), body = bp(b, 168, 130);
      b.core = c; b.mz = bp(b, 8, 97); b.mz2 = bp(b, 16, 176);
      b.hits = [...(b.open ? [{ x: c.x, y: c.y, r: 32, mult: 1.6 }] : []), { x: body.x, y: body.y, r: 70, mult: 0.3 }, { x: bp(b, 50, 97).x, y: bp(b, 50, 97).y, r: 22, mult: 0.3 }, { x: bp(b, 55, 176).x, y: bp(b, 55, 176).y, r: 20, mult: 0.3 }];
      b.body = [{ x: body.x, y: body.y, r: 72 }, { x: bp(b, 50, 97).x, y: bp(b, 50, 97).y, r: 20 }, { x: bp(b, 55, 176).x, y: bp(b, 55, 176).y, r: 18 }];
    },
    attacks: {
      aimed: A.aimed({ every: 0.55, speed: 150, big: true }),
      aimed2: A.aimed({ every: 0.6, n: 3, spread: 22, speed: 160 }),
      fan: A.fan({ tele: 0.6, times: [0.6, 1.5], n: 9, spread: 110, speed: 130 }),
      fan2: A.fan({ dur: 2.8, tele: 0.5, times: [0.5, 1.2, 1.9], n: 11, spread: 120, speed: 140 }),
      chest: A.open({ durs: [3.2] }),
      chest2: A.open({ durs: [3.2, 2.7], ring: 12 }),
    },
  }),

  prism_serpent: () => ({
    name: "Prism Serpent", size: 200, hp: 390, phases: [0.5], rest: [0.8, 0.55], procedural: true, hx: 720,
    pattern: [["spread", "joints", "laser"], ["spread2", "laser2", "joints2"]],
    init(b) { b.trail = []; b.segs = []; b.ang = Math.PI; },
    move(b, dt) {
      const sp = b.phase > 1 ? 1.35 : 1; b.mt = (b.mt || 0) + dt * sp;
      const tx = 660 + Math.sin(b.mt * 0.5) * 150, ty = H / 2 + Math.sin(b.mt * 0.8) * 170;
      b.x += (tx - b.x) * Math.min(1, dt * 2); b.y += (ty - b.y) * Math.min(1, dt * 2);
    },
    layout(b) {
      const last = b.trail[0];
      if (!last || d2(last.x, last.y, b.x, b.y) > 16) { b.trail.unshift({ x: b.x, y: b.y }); if (b.trail.length > 80) b.trail.pop(); }
      if (b.trail.length > 1) { const p = b.trail[Math.min(2, b.trail.length - 1)]; const a = Math.atan2(b.y - p.y, b.x - p.x); if (d2(p.x, p.y, b.x, b.y) > 4) b.ang = a; }
      b.segs = [];
      for (let i = 1; i <= 10; i++) { const p = b.trail[Math.min(i * 3, b.trail.length - 1)] || { x: b.x + i * 26, y: b.y }; const q = b.trail.length > 1 ? p : { x: b.x + i * 26, y: b.y }; b.segs.push({ x: q.x, y: q.y, r: 17 - i * 0.6 }); }
      b.mz = { x: b.x - 20, y: b.y }; b.core = b.mz;
      b.hits = [{ x: b.x, y: b.y, r: 28, mult: 1.25 }, ...b.segs.map((s) => ({ x: s.x, y: s.y, r: s.r, mult: 0.35 }))];
      b.body = [{ x: b.x, y: b.y, r: 26 }, ...b.segs.map((s) => ({ x: s.x, y: s.y, r: s.r }))];
    },
    attacks: {
      spread: A.fan({ dur: 1.9, tele: 0.5, times: [0.5, 1.1], n: 5, spread: 50, speed: 150, aimed: true, c: "m" }),
      spread2: A.fan({ dur: 2.3, tele: 0.45, times: [0.45, 1.0, 1.55], n: 7, spread: 64, speed: 160, aimed: true, c: "m" }),
      joints: { dur: 2.4, tick(b, g, dt, t) { if (t > 0.3 && every(b, "j", 0.18, dt)) { const i = 9 - ((b.tm.k = (b.tm.k || 0) + 1) - 1) % 10; const s = b.segs[i]; if (s) shoot(g, s.x, s.y, Math.PI + rand(-0.15, 0.15), 140 * g.diff, { c: "m" }); } } },
      joints2: { dur: 2.6, tick(b, g, dt, t) { if (t > 0.3 && every(b, "j", 0.22, dt)) { const i = 9 - ((b.tm.k = (b.tm.k || 0) + 1) - 1) % 10; const s = b.segs[i]; if (s) fan(g, s.x, s.y, Math.PI, 3, 50, 140 * g.diff, { c: "m" }); } } },
      laser: A.lasers({ count: 1 }),
      laser2: A.lasers({ count: 2 }),
    },
  }),

  bloomcore: () => ({
    name: "Bloomcore", size: 230, hp: 300, phases: [0.5], rest: [0.9, 0.6],
    sprite: (b) => (b.open ? "bloomcore_open" : "bloomcore"),
    pattern: [["thorns", "spores", "petals"], ["thorns2", "spores2", "petals2"]],
    move(b) { b.y = H / 2 + Math.sin(b.t * 0.5) * 60; },
    layout(b) {
      const c = bp(b, 128, 128); b.core = c; b.mz = { x: c.x - 60, y: c.y };
      b.hits = [...(b.open ? [{ x: c.x, y: c.y, r: 38, mult: 1.7 }] : []), { x: c.x, y: c.y, r: 95, mult: 0.25 }];
      b.body = [{ x: c.x, y: c.y, r: 88 }];
    },
    attacks: {
      thorns: { dur: 2.6, tick(b, g, dt, t) { if (t < 0.5) { b.tele = b.mz; return; } if (every(b, "t", 0.55, dt)) { b.tm.k = (b.tm.k || 0) + 1; fan(g, b.mz.x, b.mz.y, Math.PI + (b.tm.k % 2 ? 0.07 : -0.07), 7, 90, 165 * g.diff, { needle: true, gap: true }); ev(g, "sfx", { name: "bshot" }); } } },
      thorns2: { dur: 3, tick(b, g, dt, t) { if (t < 0.5) { b.tele = b.mz; return; } if (every(b, "t", 0.6, dt)) { b.tm.k = (b.tm.k || 0) + 1; fan(g, b.mz.x, b.mz.y, Math.PI + (b.tm.k % 2 ? 0.07 : -0.07), 8, 100, 170 * g.diff, { needle: true, gap: true }); } if (every(b, "s", 0.3, dt)) { b.tm.sa = (b.tm.sa || 0) + 0.5; ring(g, b.core.x, b.core.y, 3, 110 * g.diff, b.tm.sa, { c: "m" }); } } },
      spores: A.summon({ type: "spore_floater", n: 3 }),
      spores2: A.summon({ type: "spore_floater", n: 4 }),
      petals: A.open({ durs: [3.4], ring: 12 }),
      petals2: A.open({ durs: [3.4, 2.9], ring: 14 }),
    },
  }),

  cryo_manta: () => ({
    name: "Cryo Manta", size: 240, hp: 400, phases: [0.5], rest: [0.85, 0.6],
    sprite: (b) => (b.phase > 1 ? "cryo_manta_open" : "cryo_manta"),
    pattern: [["sweep", "beams", "snow"], ["sweep2", "beams2", "snow", "beams2"]],
    init(b) { b.parts = [66, 190].map((sy) => ({ sy, sx: 158, r: 16, hp: 40, max: 40, alive: true, spr: "manta_turret", fireT: rand(1, 2), every: 2.0, flash: 0 })); },
    onPhase(b) { b.parts.forEach((p) => (p.every = 1.5)); },
    move(b) { b.y = H / 2 + Math.sin(b.t * 0.45) * 120; },
    layout(b) {
      const c = bp(b, 120, 128); b.core = c; b.mz = bp(b, 14, 128);
      b.parts.forEach((p) => { const q = bp(b, p.sx, p.sy); p.x = q.x; p.y = q.y; });
      b.hits = [{ x: c.x, y: c.y, r: 24, mult: b.phase > 1 ? 1.6 : 1.3 }, { x: bp(b, 100, 128).x, y: c.y, r: 62, mult: 0.55 }];
      b.body = [{ x: bp(b, 100, 128).x, y: c.y, r: 55 }];
    },
    attacks: {
      sweep: { dur: 2.7, tick(b, g, dt, t) { if (t < 0.5) { b.tele = b.mz; return; } if (every(b, "s", 0.11, dt)) { const a = Math.PI - 0.9 + 1.8 * ((t - 0.5) / 2.1); shoot(g, b.mz.x, b.mz.y, a, 170 * g.diff, { needle: true }); } } },
      sweep2: { dur: 2.7, tick(b, g, dt, t) { if (t < 0.5) { b.tele = b.mz; return; } if (every(b, "s", 0.12, dt)) { const k = (t - 0.5) / 2.1; shoot(g, b.mz.x, b.mz.y, Math.PI - 0.9 + 1.8 * k, 170 * g.diff, { needle: true }); shoot(g, b.mz.x, b.mz.y, Math.PI + 0.9 - 1.8 * k, 170 * g.diff, { needle: true, c: "m" }); } } },
      beams: A.beams({ n: 2 }),
      beams2: A.beams({ n: 3 }),
      snow: A.aimed({ dur: 2.2, every: 0.6, n: 5, spread: 40, speed: 150 }),
    },
  }),

  dune_colossus: () => ({
    name: "Dune Colossus", size: 240, hp: 380, phases: [0.5], rest: [0.85, 0.6],
    sprite: (b) => (b.open ? "dune_colossus_open" : "dune_colossus"),
    pattern: [["rotary", "debris", "vents"], ["rotary2", "debris2", "vents2"]],
    move(b) { b.y = H / 2 + Math.sin(b.t * 0.4) * 90; },
    layout(b) {
      b.mz = bp(b, 18, 145); b.mz2 = bp(b, 18, 161); b.core = bp(b, 150, 130);
      const vents = [161, 191, 221].map((x) => bp(b, x, 50));
      b.hits = [...(b.open ? vents.map((v) => ({ x: v.x, y: v.y, r: 17, mult: 2.0 })) : []), { x: b.core.x, y: b.core.y, r: 85, mult: 0.35 }, { x: bp(b, 80, 152).x, y: bp(b, 80, 152).y, r: 30, mult: 0.35 }];
      b.body = [{ x: b.core.x, y: b.core.y, r: 82 }, { x: bp(b, 70, 152).x, y: bp(b, 70, 152).y, r: 30 }];
      b.vents = vents;
    },
    attacks: {
      rotary: { dur: 3, tick(b, g, dt, t) { if (t < 0.45) { b.tele = b.mz; return; } if (every(b, "r", 0.1, dt)) { const m = (b.tm.n = (b.tm.n || 0) + 1) % 2 ? b.mz : b.mz2; shoot(g, m.x, m.y, Math.PI + 0.75 * Math.sin(t * 2.3), 165 * g.diff); ev(g, "sfx", { name: "tick" }); } } },
      rotary2: { dur: 3.2, tick(b, g, dt, t) { if (t < 0.45) { b.tele = b.mz; return; } if (every(b, "r", 0.1, dt)) { shoot(g, b.mz.x, b.mz.y, Math.PI + 0.8 * Math.sin(t * 2.6), 170 * g.diff); shoot(g, b.mz2.x, b.mz2.y, Math.PI - 0.8 * Math.sin(t * 2.6), 170 * g.diff, { c: "m" }); } } },
      debris: A.strikes({ n: 4, kind: "debris" }),
      debris2: A.strikes({ n: 4, kind: "debris", waves: 2, dur: 3.4 }),
      vents: A.open({ durs: [3.3] }),
      vents2: { dur: 3, start(b, g) { b.open = true; ev(g, "sfx", { name: "open" }); }, tick(b, g, dt, t) { if (every(b, "e", 0.7, dt)) { const v = pick(b.vents); fan(g, v.x, v.y, -Math.PI / 2 - 0.9, 3, 40, 120 * g.diff, { c: "o", accel: 0 }); } }, end(b) { b.open = false; } },
    },
  }),

  abyssal_nautilus: () => ({
    name: "Abyssal Nautilus", size: 240, hp: 400, phases: [0.5], rest: [0.85, 0.6],
    sprite: (b) => (b.open ? "abyssal_nautilus_open" : "abyssal_nautilus"),
    pattern: [["spiral", "torpedo", "shell"], ["spiral2", "torpedo2", "shell2"]],
    move(b) { b.y = H / 2 + Math.sin(b.t * 0.5) * 100; b.x = b.hx + Math.sin(b.t * 0.3) * 30; },
    layout(b) {
      b.core = bp(b, 168, 124); b.mz = bp(b, 80, 126);
      b.tips = [0, 1, 2, 3, 4].map((i) => bp(b, 20 + i * 6, 100 + i * 24));
      b.hits = [...(b.open ? [{ x: b.core.x, y: b.core.y, r: 30, mult: 1.8 }] : []), { x: bp(b, 94, 126).x, y: bp(b, 94, 126).y, r: 28, mult: 0.6 }, { x: b.core.x, y: b.core.y, r: 92, mult: 0.35 }];
      b.body = [{ x: b.core.x, y: b.core.y, r: 88 }, { x: bp(b, 94, 126).x, y: bp(b, 94, 126).y, r: 30 }];
    },
    attacks: {
      spiral: A.spiral({ arms: 2, speed: 135, turn: 0.21, every: 0.1 }),
      spiral2: A.spiral({ arms: 3, speed: 140, turn: 0.19, every: 0.11, dur: 3.2 }),
      torpedo: { dur: 2.6, tick(b, g, dt, t) { if (t < 0.6) { b.tele = b.mz; b.tentacleGlow = true; return; } b.tentacleGlow = false; if (once(b, "t", t, 0.6)) { [0, 2, 4].forEach((i) => { const p = b.tips[i]; shoot(g, p.x, p.y, aim(g, p.x, p.y) + (i - 2) * 0.25, 120 * g.diff, { big: true, r: 9, hp: 2, homing: 1.0, life: 6, c: "o", torpedo: true }); }); ev(g, "sfx", { name: "launch" }); } } },
      torpedo2: { dur: 3, tick(b, g, dt, t) { if (t < 0.6) { b.tele = b.mz; b.tentacleGlow = true; return; } b.tentacleGlow = false; if (once(b, "t", t, 0.6)) { [0, 1, 3, 4].forEach((i) => { const p = b.tips[i]; shoot(g, p.x, p.y, aim(g, p.x, p.y) + (i - 2) * 0.22, 125 * g.diff, { big: true, r: 9, hp: 2, homing: 1.1, life: 6, torpedo: true }); }); ev(g, "sfx", { name: "launch" }); } if (t > 1 && every(b, "a", 0.5, dt)) shoot(g, b.mz.x, b.mz.y, aim(g, b.mz.x, b.mz.y), 150 * g.diff, { c: "m" }); } },
      shell: A.open({ durs: [3.4], ring: 14 }),
      shell2: A.open({ durs: [3.4, 2.8], ring: 16 }),
    },
  }),

  tempest_roc: () => ({
    name: "Tempest Roc", size: 240, hp: 420, phases: [0.5], rest: [0.85, 0.6],
    sprite: (b) => (b.open ? "tempest_roc_open" : "tempest_roc"),
    pattern: [["strikes", "wind", "dive"], ["strikes2", "wind", "dive2"]],
    move(b) { b.y = H / 2 + Math.sin(b.t * 0.7) * 130; b.x = b.hx + Math.cos(b.t * 0.5) * 40; },
    layout(b) {
      b.core = bp(b, 140, 130); b.mz = bp(b, 30, 128);
      b.hits = [...(b.open ? [{ x: b.core.x, y: b.core.y, r: 24, mult: 1.8 }] : []), { x: bp(b, 75, 120).x, y: bp(b, 75, 120).y, r: 24, mult: 0.8 }, { x: b.core.x, y: b.core.y, r: 62, mult: 0.5 }];
      b.body = [{ x: b.core.x, y: b.core.y, r: 58 }, { x: bp(b, 75, 120).x, y: bp(b, 75, 120).y, r: 22 }];
    },
    attacks: {
      strikes: A.strikes({ n: 3 }),
      strikes2: A.strikes({ n: 3, waves: 2, dur: 3.3 }),
      wind: { dur: 3.2, tick(b, g, dt, t) {
        if (t < 0.6) { b.tele = b.mz; return; }
        if (t < 2.4) g.player.pushX = -110;
        [0.8, 1.9].forEach((tm, i) => { if (once(b, "w" + i, t, tm)) { const gy = rand(110, H - 110); for (let y = 18; y < H; y += 32) if (Math.abs(y - gy) > 62) shoot(g, b.x - 90, y, Math.PI, 125 * g.diff, { c: "m" }); ev(g, "sfx", { name: "wind" }); } });
      } },
      dive: makeDive(1), dive2: makeDive(2),
    },
  }),

  gravemind_sentinel: () => ({
    name: "Gravemind Sentinel", size: 240, hp: 380, phases: [0.5], rest: [0.85, 0.6],
    sprite: (b) => (b.open ? "gravemind_sentinel_open" : "gravemind_sentinel"),
    pattern: [["ringburst", "triple", "gravity"], ["ringburst2", "gravity2", "triple"]],
    init(b) { b.parts = [0, 1, 2].map((i) => orbPart(i, 3, "stone_orbiter", 30, 2.4, 0)); },
    onPhase(b) { b.parts = [0, 1, 2, 3].map((i) => orbPart(i, 4, "stone_orbiter", 30, 2.0, 10)); },
    move(b) { b.y = H / 2 + Math.sin(b.t * 0.35) * 80; },
    layout(b) {
      b.core = bp(b, 128, 128); b.mz = { x: b.core.x - 30, y: b.core.y };
      orbitLayout(b, 125, b.phase > 1 ? 1.0 : 0.8);
      b.hits = [...(b.open ? [{ x: b.core.x, y: b.core.y, r: 26, mult: 1.7 }] : []), { x: b.core.x, y: b.core.y, r: 70, mult: 0.45 }];
      b.body = [{ x: b.core.x, y: b.core.y, r: 68 }];
    },
    attacks: {
      ringburst: A.ring({ n: 16, every: 0.85, speed: 110 }),
      ringburst2: A.ring({ n: 18, every: 0.75, speed: 115, dur: 2.6 }),
      triple: A.aimed({ dur: 2.1, every: 0.5, n: 3, spread: 24, speed: 170 }),
      gravity: A.gravity({ n: 1, open: true }),
      gravity2: A.gravity({ n: 2, open: true }),
    },
  }),

  eclipse_empress: () => ({
    name: "Eclipse Empress", size: 240, hp: 460, phases: [0.5], rest: [0.8, 0.55],
    sprite: () => "eclipse_empress",
    pattern: [["formation", "crown", "teleport"], ["formation", "teleport", "barrage", "crown"]],
    init(b) { b.baseY = H / 2; },
    onPhase(b) { b.parts = [0, 1, 2, 3].map((i) => orbPart(i, 4, "orbiter", 25, 2.2, 12)); },
    move(b) { b.y = b.baseY + Math.sin(b.t * 0.6) * 70; b.y = clamp(b.y, 110, H - 110); },
    layout(b) {
      b.core = bp(b, 140, 122); b.mz = bp(b, 46, 122);
      if (b.parts.length) orbitLayout(b, 112, 1.1);
      const vis = b.alpha > 0.5;
      b.hits = vis ? [{ x: b.core.x, y: b.core.y, r: b.phase > 1 ? 24 : 18, mult: b.phase > 1 ? 1.6 : 1.0 }, { x: bp(b, 140, 110).x, y: bp(b, 140, 110).y, r: 62, mult: 0.45 }] : [];
      b.body = vis ? [{ x: bp(b, 140, 120).x, y: bp(b, 140, 120).y, r: 55 }] : [];
    },
    attacks: {
      formation: { dur: 2.8, tick(b, g, dt, t) { if (t < 0.4) { b.tele = b.mz; return; } [0.4, 1.5].forEach((tm, i) => { if (once(b, "f" + i, t, tm)) { const gy = rand(110, H - 110); for (let y = 16; y < H; y += 30) if (Math.abs(y - gy) > 64) shoot(g, b.x - 100, y, Math.PI, 140 * g.diff, { c: "m" }); ev(g, "sfx", { name: "bshot" }); } }); } },
      crown: A.ring({ n: 18, every: 0.8, speed: 120, dur: 2.2 }),
      teleport: A.teleport({ n: 9 }),
      barrage: A.aimed({ dur: 2.4, every: 0.35, n: 1, speed: 200 }),
    },
  }),

  astral_devourer: () => ({
    name: "Astral Devourer", size: 280, hp: 620, phases: [0.66, 0.33], rest: [0.85, 0.65, 0.55],
    sprite: (b) => ["astral_devourer", "astral_devourer_2", "astral_devourer_3"][b.phase - 1],
    pattern: [["fan", "strikes", "ring"], ["spiral", "beams", "wisps", "teleport"], ["lasers", "gravity", "spiral3", "fan"]],
    init(b) { b.baseY = H / 2; },
    move(b) { b.y = b.baseY + Math.sin(b.t * 0.5) * 90; b.y = clamp(b.y, 130, H - 130); },
    layout(b) {
      b.core = bp(b, 140, 128); b.mz = bp(b, 36, 128);
      const vis = b.alpha > 0.5;
      b.hits = vis ? [{ x: b.core.x, y: b.core.y, r: [18, 28, 42][b.phase - 1], mult: [0.9, 1.2, 1.6][b.phase - 1] }, { x: b.core.x, y: b.core.y, r: 105, mult: 0.3 }] : [];
      b.body = vis ? [{ x: b.core.x, y: b.core.y, r: 100 }] : [];
    },
    attacks: {
      fan: A.fan({ tele: 0.6, times: [0.6, 1.4], n: 11, spread: 120, speed: 140, c: "m" }),
      strikes: A.strikes({ n: 3 }),
      ring: A.ring({ n: 16, every: 0.8, speed: 115 }),
      spiral: A.spiral({ arms: 3, speed: 135, turn: 0.2, every: 0.12 }),
      spiral3: A.spiral({ arms: 2, speed: 125, turn: 0.25, every: 0.12, dur: 2.6 }),
      beams: A.beams({ n: 2, color: "void" }),
      wisps: A.summon({ type: "ice_wisp", n: 4 }),
      teleport: A.teleport({ n: 9 }),
      lasers: A.lasers({ count: 3 }),
      gravity: A.gravity({ n: 1, open: false }),
    },
  }),
};

// ============================================================ procedural bosses (90 of the 100 levels)
function buildProcBoss(spec) {
  const S = spec.size, n = spec.n, sp = 1 + n * 0.004, minion = WORLDS[spec.w - 1].minions[0];
  const mk = (k, p2) => {
    const up = p2 ? 1 : 0;
    switch (k) {
      case "aimed": return A.aimed({ every: p2 ? 0.5 : 0.6, n: n > 30 || p2 ? 3 : 1, spread: 22, speed: 150 * sp, big: n < 30 });
      case "fan": return A.fan({ tele: 0.6, times: p2 ? [0.5, 1.2, 1.9] : [0.6, 1.4], dur: p2 ? 2.7 : 2.2, n: Math.min(13, 7 + Math.floor(n / 25) * 2 + up * 2), spread: 100 + up * 15, speed: 130 * sp });
      case "ring": return A.ring({ n: Math.min(20, 12 + Math.floor(n / 20) * 2 + up * 2), every: p2 ? 0.75 : 0.9, speed: 105 * sp });
      case "stream": return A.stream({ speed: 165 * sp, dual: p2 && n > 20 });
      case "summon": return A.summon({ type: minion, n: 2 + Math.floor(n / 40) + up });
      case "wall": return A.wall({ speed: 135 * sp, times: p2 ? [0.4, 1.2, 2.0] : [0.4, 1.5] });
      case "spiral": return A.spiral({ arms: 2 + (n > 60 || p2 ? 1 : 0), speed: 125 * sp, turn: 0.21, every: 0.12 });
      case "beams": return A.beams({ n: 2 + (n > 70 || (p2 && n > 40) ? 1 : 0) });
      case "strikes": return A.strikes({ n: 3, waves: n > 60 || p2 ? 2 : 1, dur: n > 60 || p2 ? 3.3 : 2.6 });
      case "lasers": return A.lasers({ count: 1 + (n > 55 || p2 ? 1 : 0) });
      case "torpedo": return A.torpedo({ n: 2 + Math.floor(n / 40) + up });
      case "dive": return makeDive(p2 && n > 60 ? 2 : 1);
      case "gravity": return A.gravity({ n: 1 + (n > 80 && p2 ? 1 : 0), open: spec.weak === "cycle" });
      case "teleport": return A.teleport({ n: 9 + up * 2 });
    }
  };
  const attacks = {};
  for (const k of spec.attacks) { attacks[k] = mk(k, false); attacks[k + "2"] = mk(k, true); }
  attacks.open = A.open({ durs: [3.3] }); attacks.open2 = A.open({ durs: [3.3, 2.9, 2.6], ring: 12 });
  const p1 = spec.attacks.slice(), p2 = spec.attacks.map((k) => k + "2");
  if (spec.weak === "cycle") { p1.push("open"); p2.push("open2"); }
  const L = (b, lx, ly) => ({ x: b.x + lx * S, y: b.y + ly * S });
  const muz = { 1: [0], 2: [-0.18, 0.18], 3: [-0.25, 0, 0.25] }[spec.cannons];
  return {
    name: spec.name, size: S, hp: spec.hp, phases: spec.phases, rest: [0.9, 0.65, 0.55], procedural: "mech", spec,
    pattern: [p1, p2, p2], attacks,
    init(b) {
      b.baseY = H / 2; b.muzzles = muz;
      if (spec.parts === "turrets") b.parts = [-0.42, 0.42].map((oy) => ({ ox: 0.1, oy, r: 16, hp: 28 + n * 0.3, max: 28 + n * 0.3, alive: true, spr: "manta_turret", fireT: rand(1, 2), every: 2.2, flash: 0, respawnTime: 0 }));
      if (spec.parts === "orbiters") b.parts = [0, 1, 2].map((i) => orbPart(i, 3, spec.w >= 8 ? "stone_orbiter" : "orbiter", 22 + n * 0.25, 2.4, spec.weak === "parts" ? 20 : 0));
    },
    move(b, dt, g) {
      const t = b.t * spec.speed;
      switch (spec.move) {
        case "bob": b.y = b.baseY + Math.sin(t * 0.6) * 110; break;
        case "sweep": b.y = b.baseY + Math.sin(t * 0.45) * 150; b.x = b.hx + Math.sin(t * 0.9) * 25; break;
        case "figure8": b.y = b.baseY + Math.sin(t * 0.6) * 130; b.x = b.hx + Math.sin(t * 1.2) * 50; break;
        case "drift": b.y += (clamp(g.player.y, 110, H - 110) - b.y) * Math.min(1, dt * 0.6); break;
        case "strafe": { const ph = (t / 6) % 1; b.y = b.baseY + (ph < 0.5 ? -170 + ph * 680 : 170 - (ph - 0.5) * 680); break; }
        case "orbit": b.x = b.hx + Math.cos(t * 0.5) * 60; b.y = b.baseY + Math.sin(t * 0.5) * 120; break;
      }
      b.y = clamp(b.y, S * 0.42, H - S * 0.42);
    },
    layout(b) {
      b.core = L(b, 0.06, 0); b.mz = L(b, -0.5, muz[0]); b.mz2 = muz.length > 1 ? L(b, -0.5, muz[muz.length - 1]) : null;
      for (const p of b.parts) if (p.ox !== undefined) { const q = L(b, p.ox, p.oy); p.x = q.x; p.y = q.y; }
      if (spec.parts === "orbiters") orbitLayout(b, S * 0.62, 0.9);
      const cr = S * 0.11, body = { x: b.core.x - S * 0.04, y: b.core.y, r: S * 0.4 };
      let hits;
      if (spec.weak === "core") hits = [{ x: b.core.x, y: b.core.y, r: cr, mult: 1.3 }, { ...body, mult: 0.35 }];
      else if (spec.weak === "cycle") hits = b.open ? [{ x: b.core.x, y: b.core.y, r: cr * 1.3, mult: 1.7 }, { ...body, mult: 0.3 }] : [{ ...body, mult: 0.3 }];
      else { const any = b.parts.some((p) => p.alive); b.coreShielded = any; hits = any ? [{ ...body, mult: 0.5 }] : [{ x: b.core.x, y: b.core.y, r: cr * 1.3, mult: 1.6 }, { ...body, mult: 0.4 }]; }
      b.hits = b.alpha > 0.5 ? hits : [];
      b.body = b.alpha > 0.5 ? [{ ...body, r: body.r * 0.95 }] : [];
    },
  };
}

// ============================================================ Endless bosses (6, cycling; health from the shared rules)
function endlessBossDef(kind) {
  const base = { size: 240, phases: [0.5], rest: [0.85, 0.6], sprite: () => "eb_" + kind, kind,
    move(b) { b.y = b.baseY + Math.sin(b.t * 0.55) * 110; b.y = clamp(b.y, 130, H - 130); },
    layout(b) { b.core = bp(b, 130, 128); b.mz = bp(b, 40, 128); b.hits = b.alpha > 0.5 ? [{ x: b.core.x, y: b.core.y, r: 92, mult: 1 }] : []; b.body = b.alpha > 0.5 ? [{ x: b.core.x, y: b.core.y, r: 84 }] : []; } };
  const defs = {
    octo_queen: { name: "Octo Queen", pattern: [["jelly", "ink", "sweep"], ["jelly2", "ink", "ringburst", "sweep"]], attacks: {
      jelly: A.bombs({ n: 4, style: "jelly", ring: 6 }), jelly2: A.bombs({ n: 6, style: "jelly", ring: 8, gap: 0.2, dur: 2.9 }), ink: A.spiral({ arms: 2, speed: 120, turn: 0.24 }), sweep: A.stream({ speed: 160 }), ringburst: A.ring({ n: 14, every: 0.8, speed: 110 }) } },
    blade_sovereign: { name: "Blade Sovereign", spin: true, pattern: [["blades", "fan", "spin"], ["blades2", "lasers", "spin", "fan"]], attacks: {
      blades: A.blades({ n: 3 }), blades2: A.blades({ n: 5 }), fan: A.fan({ tele: 0.5, times: [0.5, 1.2], n: 9, spread: 110, speed: 140, c: "m" }), spin: A.spiral({ arms: 4, speed: 130, turn: 0.3, every: 0.14 }), lasers: A.lasers({ count: 2 }) } },
    hive_matriarch: { name: "Hive Matriarch", pattern: [["bees", "wall", "honey"], ["bees2", "honey2", "wall"]], attacks: {
      bees: A.torpedo({ n: 3 }), bees2: A.torpedo({ n: 5 }), wall: A.wall({ speed: 130 }), honey: A.bombs({ n: 3, style: "honey", ring: 0, r: 52 }), honey2: A.bombs({ n: 5, style: "honey", ring: 6, r: 52 }) } },
    magma_titan: { name: "Magma Titan", pattern: [["meteors", "lava", "erupt"], ["meteors2", "lava2", "erupt"]], attacks: {
      meteors: A.strikes({ n: 4, kind: "debris" }), meteors2: A.strikes({ n: 4, kind: "debris", waves: 2, dur: 3.4 }), lava: A.bombs({ n: 4, style: "lava", ring: 8 }), lava2: A.bombs({ n: 6, style: "lava", ring: 10, gap: 0.2, dur: 2.9 }), erupt: A.ring({ n: 16, every: 0.7, speed: 115, big: true }) } },
    mirror_wraith: { name: "Mirror Wraith", pattern: [["teleport", "shards", "mirror"], ["teleport", "mirror2", "shards", "teleport"]], attacks: {
      teleport: A.teleport({ n: 9 }), shards: A.fan({ tele: 0.45, times: [0.45, 1.0, 1.55], dur: 2.2, n: 7, spread: 80, speed: 160, aimed: true, c: "m" }), mirror: A.lasers({ count: 2 }), mirror2: A.lasers({ count: 3 }) } },
    frost_hydra: { name: "Frost Hydra", pattern: [["beams", "tri", "frost"], ["beams2", "tri", "frost2"]], attacks: {
      beams: A.beams({ n: 2 }), beams2: A.beams({ n: 3 }), tri: A.lasers({ count: 3 }), frost: A.bombs({ n: 4, style: "frost", ring: 6 }), frost2: A.bombs({ n: 6, style: "frost", ring: 8, gap: 0.2, dur: 2.9 }) } },
  };
  return { ...base, ...defs[kind] };
}
function makeEndlessBoss(g, idx) {
  const kind = ENDLESS_BOSS_KINDS[idx % ENDLESS_BOSS_KINDS.length], def = endlessBossDef(kind), hp = EndlessRules.bossHp(idx, g.t);
  const b = { def, x: W + def.size / 2 + 60, y: H / 2, hx: W - 200, hp, max: hp, phase: 1, t: 0, atk: null, atkT: 0, rest: 1.0, idx: 0, endlessIdx: idx,
    tm: {}, trans: 0, flash: 0, clink: 0, entering: true, parts: [], hits: [], body: [], open: false, dying: false, dieT: 0, alpha: 1, lock: false, tele: null, baseY: H / 2 };
  def.layout(b, g); return b;
}

function orbPart(i, n, spr, hp, every_, respawn) {
  return { i, n, spr, r: 16, hp, max: hp, alive: true, fireT: rand(0.8, 2) + i * 0.4, every: every_, flash: 0, respawnTime: respawn, respawn: 0 };
}
function orbitLayout(b, rad, spd) {
  for (const p of b.parts) { const a = b.t * spd + (TAU / p.n) * p.i; p.x = b.core.x + Math.cos(a) * rad; p.y = b.core.y + Math.sin(a) * rad * 0.85; }
}
function makeDive(times) {
  const one = 3.3;
  return {
    dur: one * times + 0.4,
    start(b) { b.lock = true; b.dv = { k: -1 }; },
    tick(b, g, dt, t) {
      const k = Math.floor(t / one), lt = t - k * one;
      if (k >= times) { b.x += (b.hx - b.x) * Math.min(1, dt * 4); b.open = false; return; }
      if (b.dv.k !== k) { b.dv = { k, y: clamp(g.player.y, 80, H - 80), phase: "tele" }; hazard(g, { type: "band", y: b.dv.y, h: 110, tele: 1.3, act: 0 }); ev(g, "sfx", { name: "charge" }); }
      if (lt < 1.3) { b.open = true; b.y += (b.dv.y - b.y) * Math.min(1, dt * 5); b.tele = b.core; b.x += (b.hx + 30 - b.x) * Math.min(1, dt * 3); }
      else if (b.dv.phase === "tele") { b.dv.phase = "dive"; ev(g, "sfx", { name: "dash" }); b.open = false; }
      if (b.dv.phase === "dive") { b.x -= 950 * dt; b.y = b.dv.y; if (b.x < -180) { b.dv.phase = "return"; b.x = W + 200; b.y = H / 2; } }
      if (b.dv.phase === "return") b.x += (b.hx - b.x) * Math.min(1, dt * 3);
    },
    end(b) { b.lock = false; b.open = false; b.x = Math.max(b.x, b.hx - 10); },
  };
}

// ============================================================ boss runtime
function makeBoss(g) {
  const spec = g.L.boss;
  const def = spec.finale ? BOSSES[spec.finale]() : buildProcBoss(spec);
  const b = { def, x: W + def.size / 2 + 60, y: H / 2, hx: def.hx || W - 165, hp: def.hp * 1.3, max: def.hp * 1.3, phase: 1, t: 0, atk: null, atkT: 0, rest: 1.0, idx: 0,
    tm: {}, trans: 0, flash: 0, clink: 0, entering: true, parts: [], hits: [], body: [], open: false, dying: false, dieT: 0, alpha: 1, lock: false, tele: null, baseY: H / 2 };
  if (def.init) def.init(b, g);
  def.layout(b, g);
  return b;
}

function updateBoss(g, dt) {
  const b = g.boss, d = b.def;
  b.t += dt; if (b.flash > 0) b.flash -= dt; if (b.clink > 0) b.clink -= dt;
  b.tele = null;
  if (b.dying) {
    b.dieT += dt;
    if (Math.random() < dt * 14) explosion(g, b.x + rand(-d.size * 0.35, d.size * 0.35), b.y + rand(-d.size * 0.3, d.size * 0.3), rand(0.8, 1.6));
    g.shake = Math.max(g.shake, 0.12); b.hits = []; b.body = []; b.parts.forEach((p) => (p.alive = false));
    if (b.dieT > 2.2 && !b.boom) { b.boom = true; explosion(g, b.x, b.y, 3); }
    return;
  }
  if (b.entering) {
    b.x += (b.hx - b.x) * Math.min(1, dt * 1.5);
    if (d.procedural) b.y = H / 2 + Math.sin(b.t) * 40;
    if (Math.abs(b.x - b.hx) < 6) b.entering = false;
    d.layout(b, g); return;
  }
  g.bossTime += dt;
  const th = d.phases || [];
  if (b.phase - 1 < th.length && b.hp / b.max <= th[b.phase - 1]) {
    b.phase++; b.trans = 1.5;
    if (b.atk && b.atk.end) b.atk.end(b, g);
    b.atk = null; b.open = false; b.lock = false; b.alpha = 1;
    g.ebul = []; g.hz = [];
    g.flash = Math.max(g.flash, 0.3); g.shake = 0.3;
    ev(g, "sfx", { name: "phase" });
    if (d.onPhase) d.onPhase(b, g);
  }
  if (!b.lock) d.move(b, dt, g);
  if (b.trans > 0) { b.trans -= dt; d.layout(b, g); return; }
  if (!b.atk) {
    b.rest -= dt;
    if (b.rest <= 0) { const list = d.pattern[b.phase - 1]; const key = list[b.idx++ % list.length]; b.atk = d.attacks[key]; b.atkKey = key; b.atkT = 0; b.tm = {}; if (b.atk.start) b.atk.start(b, g); }
  } else {
    b.atkT += dt;
    if (b.atk.tick) b.atk.tick(b, g, dt, b.atkT);
    if (b.atk && b.atkT >= durOf(b.atk, b)) { if (b.atk.end) b.atk.end(b, g); b.atk = null; b.rest = d.rest[b.phase - 1]; b.lock = false; }
  }
  d.layout(b, g);
  for (const p of b.parts) {
    if (p.flash > 0) p.flash -= dt;
    if (!p.alive) { if (p.respawnTime > 0) { p.respawn -= dt; if (p.respawn <= 0) { p.alive = true; p.hp = p.max; particle(g, p.x, p.y, "#b48cff", 8, 80, 0.4); } } continue; }
    p.fireT -= dt;
    if (p.fireT <= 0 && p.x < W - 20) { p.fireT = p.every; shoot(g, p.x - 10, p.y, aim(g, p.x - 10, p.y), 150 * g.diff, { c: "m" }); }
  }
}
