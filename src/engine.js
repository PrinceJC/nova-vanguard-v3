"use strict";
// ============================================================ constants & helpers
const W = 960, H = 540, TAU = Math.PI * 2;
const MAX_EBUL = 420, MAX_PBUL = 160;
const SPECIAL_CD = 14, PLAYER_HP = 3, INV_TIME = 1.0, PLAYER_SPEED = 300, BLAST_CHARGE = 0.45, BLAST_SPEED = 1700, BLAST_MAX = 1150;
const CAMPAIGN_HP_CAP = 2, ENEMY_SCALE = 2.1, ELITE_SCALE = 1.5, FIRE_INT = EndlessRules.FIRE_INT, MAX_TIER_BONUS = EndlessRules.MAX_TIER_BONUS;
// player art: 140 x 92 px (≈15% of playfield width incl. weapon, ≈17% of height); hitbox stays a 6 px core
const PLAYER_ART_W = 150, PLAYER_ART_K = 150 / 104, PLAYER_HITBOX = 6;
const MUZZLE_DX = (MUZZLES.cannon[0] - SPRITE_ANCHOR[0]) * PLAYER_ART_K, MUZZLE_DY = (MUZZLES.cannon[1] - SPRITE_ANCHOR[1]) * PLAYER_ART_K;
// projectile origin for an avatar's weapon (firearm muzzle or bow release point), relative to the hitbox centre
function muzzleFor(id) { const a = AVATAR_BY_ID[id] || AVATARS[0], m = MUZZLES[a.cat]; return [(m[0] - SPRITE_ANCHOR[0]) * PLAYER_ART_K, (m[1] - SPRITE_ANCHOR[1]) * PLAYER_ART_K]; }
// tier 1: one shot; tier 2: centre + two angled; tier 3: three symmetrical pairs
const SHOT_PATTERNS = [null, [0], [0, -0.1, 0.1], [-0.05, 0.05, -0.14, 0.14, -0.24, 0.24]];
const QUALITY_PARTS = [120, 240, 360], QUALITY_MULT = [0.4, 0.75, 1];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const d2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
const r3 = (x) => Math.round(x * 1000) / 1000;

// ============================================================ enemy data
const ENEMIES = {
  scout_drone:   { size: 32, r: 12, hp: 2, speed: 90,  move: "straight", fire: { kind: "single", every: 2.8, speed: 140 }, score: 100 },
  wing_bot:      { size: 40, r: 12, hp: 2, speed: 115, move: "wave", amp: 40, freq: 2.2, score: 100 },
  shield_pod:    { size: 48, r: 16, hp: 3, shield: 6, speed: 70, move: "straight", fire: { kind: "aimed", every: 3.2, speed: 140 }, score: 200 },
  crystal_bat:   { size: 40, r: 13, hp: 2, speed: 130, move: "wave", amp: 110, freq: 1.5, score: 120 },
  shard_spinner: { size: 40, r: 14, hp: 4, move: "stopfire", hold: 2.6, fire: { kind: "ring", n: 6, speed: 120 }, spin: true, score: 200 },
  gem_crawler:   { size: 40, r: 13, hp: 3, speed: 70, move: "edge", fire: { kind: "aimed", every: 2.6, speed: 140 }, score: 150 },
  spore_floater: { size: 40, r: 13, hp: 3, speed: 55, move: "float", fire: { kind: "slow", every: 3.0, speed: 85 }, score: 150 },
  thorn_wasp:    { size: 40, r: 11, hp: 2, move: "dash", tele: 0.85, dash: 520, score: 150 },
  vine_sentry:   { size: 48, r: 16, hp: 5, move: "turret", fire: { kind: "aimed", every: 2.4, speed: 150 }, score: 200 },
  frost_drone:   { size: 40, r: 13, hp: 3, speed: 85,  move: "straight", fire: { kind: "paired", every: 2.5, speed: 165 }, score: 150 },
  ice_wisp:      { size: 32, r: 10, hp: 1, speed: 40,  move: "driftaccel", score: 100 },
  glacier_guard: { size: 56, r: 18, hp: 6, shield: 8, speed: 45, move: "straight", fire: { kind: "spread3", every: 3.4, speed: 125 }, score: 300 },
  sand_skimmer:  { size: 40, r: 12, hp: 2, speed: 170, move: "wave", amp: 25, freq: 3, fire: { kind: "single", every: 2.2, speed: 190 }, score: 120 },
  furnace_bot:   { size: 48, r: 16, hp: 6, move: "stopfire", hold: 2.8, fire: { kind: "fan5", speed: 135 }, score: 250 },
  drill_drone:   { size: 44, r: 14, hp: 3, move: "dash", tele: 0.9, dash: 450, score: 150 },
  aqua_drone:    { size: 36, r: 12, hp: 2, speed: 100, move: "wave", amp: 60, freq: 1.3, fire: { kind: "aimed", every: 2.8, speed: 145 }, score: 120 },
  electric_jelly:{ size: 40, r: 13, hp: 4, speed: 45,  move: "float", fire: { kind: "ring", n: 8, every: 3.6, speed: 95 }, score: 200 },
  torpedo_bot:   { size: 48, r: 13, hp: 3, move: "dash", tele: 1.0, dash: 480, score: 150 },
  spark_bird:    { size: 40, r: 12, hp: 2, speed: 185, move: "wave", amp: 70, freq: 2.1, score: 120 },
  storm_drone:   { size: 40, r: 14, hp: 4, speed: 70,  move: "float", fire: { kind: "burst3", every: 3.2, speed: 170 }, score: 200 },
  lightning_sentry: { size: 48, r: 16, hp: 5, move: "turret", fire: { kind: "aimed2", every: 2.6, speed: 160 }, score: 200 },
  orbit_drone:   { size: 40, r: 13, hp: 3, speed: 90,  move: "wave", amp: 50, freq: 1.6, fire: { kind: "paired", every: 2.8, speed: 155 }, score: 150 },
  gravity_mine:  { size: 40, r: 14, hp: 3, speed: 45,  move: "float", pull: true, score: 150 },
  ancient_guardian: { size: 52, r: 18, hp: 8, speed: 40, move: "straight", fire: { kind: "ring", n: 10, every: 3.8, speed: 105 }, score: 300 },
  void_scout:    { size: 40, r: 12, hp: 3, speed: 150, move: "straight", fire: { kind: "burst3", every: 2.4, speed: 190 }, score: 150 },
  rift_jumper:   { size: 40, r: 13, hp: 3, move: "teleport", fire: { kind: "aimed", speed: 175 }, score: 200 },
  eclipse_knight:{ size: 56, r: 18, hp: 6, shield: 8, speed: 55, move: "straight", fire: { kind: "spread3", every: 3.0, speed: 155 }, score: 300 },
  // Endless families: standard mite, armored bulwarks (5/10/15/20 hits), fast darts that telegraph a rush
  mite:          { size: 30, r: 11, hp: 1, speed: 105, move: "wave", amp: 30, freq: 2.2, score: 80 },
  bulwark1:      { size: 46, r: 18, hp: 5, speed: 50, move: "straight", armored: 1, score: 300 },
  bulwark2:      { size: 50, r: 19, hp: 10, speed: 46, move: "straight", armored: 2, score: 600 },
  bulwark3:      { size: 54, r: 20, hp: 15, speed: 42, move: "straight", armored: 3, score: 950 },
  bulwark4:      { size: 58, r: 21, hp: 20, speed: 38, move: "straight", armored: 4, score: 1400 },
  dart:          { size: 44, r: 12, hp: 2, move: "rush", tele: 0.9, score: 220, wide: true },
};
const BULLET_POWERUPS = { comet: { name: "Comet rounds", speed: 1.6, big: 0, color: "#ffb8f0" }, nova: { name: "Nova stars", speed: 1.1, big: 9, color: "#ffe27a" }, prism: { name: "Prism shards", speed: 1.35, big: 4, color: "#9ffcff" } };
const POWERUP_TIME = EndlessRules.POWERUP_TIME;

// ============================================================ game creation
function createGame(opts) {
  const endless = opts.mode === "endless";
  const L = endless ? null : getLevel(opts.level);
  const g = {
    mode: endless ? "endless" : "campaign", level: endless ? 0 : L.n, L, lv: endless ? { pal: WORLDS[0].pal, bg: WORLDS[0].bg, name: "Endless", music: WORLDS[9].music, world: WORLDS[0] } : L,
    t: 0, state: endless ? "endless" : "intro", stateT: 0, avatar: opts.avatar || "lumi", muzzle: muzzleFor(opts.avatar || "lumi"), quality: opts.quality ?? 2,
    player: { x: 150, y: H / 2, hp: PLAYER_HP, tier: endless ? 1 : clamp(opts.tier | 0, 1, 3), inv: 0, shield: 0, shieldMax: 6, fireCd: 0, specialCd: 0, charge: 0, pullX: 0, pullY: 0, pushX: 0, firing: false, dead: false, muzzle: 0, recoil: 0, tilt: 0, hurtT: 0, healT: 0, upT: 0, deadT: 0, bullet: null, blasts: EndlessRules.BLAST_START },
    enemies: [], pbul: [], ebul: [], pickups: [], parts: [], hz: [], queue: [], obs: [], texts: [], blast: null,
    boss: null, bossesSpawned: 0, waves: endless ? [] : buildCampaignWaves(L.n), waveIdx: 0, waveT: 1.2, sinceLast: 0,
    score: 0, kills: 0, hitsTaken: 0, events: [], shake: 0, flash: 0, scroll: 0, hpSpawns: 0,
    diff: endless ? 1 : 1 + Math.min(0.35, (L.n - 1) * 0.0035), fireDiff: endless ? 1 : 1 + (L.n - 1) * 0.005, god: !!opts.god, bossTime: 0,
  };
  if (endless) {
    g.seed = opts.seed >>> 0; g.sched = EndlessRules.createSchedule(g.seed); g.dropState = EndlessRules.newDropState();
    g.rec = { v: EndlessRules.VERSION, kills: [], picks: [], hits: [], blasts: [], end: 0 };
    g.spawnMap = new Map(); g.upDone = {}; g.milestone = 0; g.elites = 0; g.theme = 0;
  }
  return g;
}
const ev = (g, type, data) => g.events.push({ type, ...data });
function floatText(g, x, y, s, color, size = 17) { if (g.texts.length < 24) g.texts.push({ x, y, s, color, size, life: size > 17 ? 1.5 : 1.1, max: size > 17 ? 1.5 : 1.1 }); }

// ============================================================ spawning
function queueGroup(g, type, count, pattern, base) {
  if (type.startsWith("obs:")) { for (let i = 0; i < count; i++) g.queue.push({ at: g.t + base + i * 2.2, obs: type.slice(4) }); return; }
  const def = ENEMIES[type];
  if (def.move === "edge" || def.move === "turret") { for (let i = 0; i < count; i++) g.queue.push({ at: g.t + base + i * 1.3, type, y: i % 2 === 0 ? "bottom" : "top" }); return; }
  if (pattern === "column" || def.move === "dash" || def.move === "rush" || def.move === "stopfire" || def.move === "teleport") {
    const span = Math.min(90 * (count - 1), H - 160), cy = rand(80 + span / 2, H - 80 - span / 2);
    for (let i = 0; i < count; i++) g.queue.push({ at: g.t + base + (pattern === "column" ? 0 : i * 0.45), type, y: count === 1 ? rand(90, H - 90) : cy - span / 2 + (span / (count - 1)) * i });
  } else if (pattern === "v") {
    const cy = rand(150, H - 150), half = (count - 1) / 2;
    for (let i = 0; i < count; i++) g.queue.push({ at: g.t + base + Math.abs(i - half) * 0.35, type, y: cy + (i - half) * 50 });
  } else if (pattern === "single") g.queue.push({ at: g.t + base, type, y: rand(90, H - 90) });
  else { const y = rand(80, H - 80); for (let i = 0; i < count; i++) g.queue.push({ at: g.t + base + i * 0.55, type, y }); }
}

// Score tier: basic 1 (5 pts) · tougher 2 (10) · larger 3 (15) · armored bulwarks 3–6 · elites +2 tiers.
function enemyTier(def) { if (def.armored) return def.armored + 2; if (def.move === "rush") return 2; return def.hp <= 2 ? 1 : def.hp <= 4 ? 2 : 3; }
// Campaign hits: basic enemies 1→5 with each minute of active play in the level (cap 5); other tiers scale from their base hits.
function campaignHits(g, def, elite) {
  const tier = enemyTier(def), m = EndlessRules.minuteMult(g.t);
  if (tier === 1 && !elite) return Math.min(5, m);
  const base = def.armored ? def.hp : tier === 2 ? 2 : 4, levelF = 1 + Math.floor((g.level - 1) / 20) * 0.25;
  const cap = def.move === "rush" && !elite ? 10 : 15;   // fast enemies max 10 hits; big/armored/elite max 15
  return Math.min(cap, Math.ceil(base * (elite ? 2 : 1) * m * levelF - 1e-9));
}
const ENEMY_CAP = [50, 50, 50];   // at most 50 enemies on screen, the same on every device so ranked runs stay fair
function spawnEnemy(g, type, y, x, o = {}) {
  const def = ENEMIES[type], elite = !!o.elite;
  const campHp = g.mode === "campaign" && o.hp === undefined ? campaignHits(g, def, elite) : null;
  const base = Math.min(def.size * ENEMY_SCALE, def.armored ? 92 + def.armored * 8 : 105), k = base / def.size, size = base * (elite ? ELITE_SCALE : 1), er = def.r * k * (elite ? ELITE_SCALE : 1);
  const e = { type, def, size, r: er, x: x ?? W + size / 2 + 10, y: 0, y0: 0, hp: o.hp ?? campHp ?? def.hp, shield: o.shield ?? (def.shield || 0) * (g.mode === "campaign" ? 1 + Math.min(0.6, g.level * 0.006) : 1) * (elite ? 1.5 : 1),
    t: 0, st: "in", stT: 0, fireT: def.fire && def.fire.every ? rand(0.6, 1.4) : 0, flash: 0, flip: false, entered: false, burst: 0, burstT: 0, rot: 0, jumps: 0, kb: 0, sid: o.sid || 0, elite, score: o.score ?? 5 * (enemyTier(def) + (elite ? 2 : 0)) };
  e.maxShield = e.shield; e.maxHp = e.hp; e.spd = g.mode === "endless" ? EndlessRules.speedAt(g.t) : 1;
  if (y === "top" || y === "bottom") { e.flip = y === "top"; e.y = y === "top" ? size / 2 + 2 : H - size / 2 - 2; }
  else { const amp = def.amp || 12; e.y = clamp(y, amp + size * 0.5 + 8, H - amp - size * 0.5 - 8); }
  e.y0 = e.y; e.stopX = rand(600, 840);
  g.enemies.push(e);
  return e;
}

function spawnObstacle(g, kind) {
  const lv = g.level, y = rand(90, H - 90);
  if (kind === "rock") g.obs.push({ kind, x: W + 50, y, r: rand(22, 32), hp: 6 + lv * 0.06, max: 6 + lv * 0.06, vx: -rand(60, 85), vy: rand(-12, 12), rot: 0, spin: rand(-1, 1), flash: 0 });
  else if (kind === "gate") g.obs.push({ kind, x: W + 30, y: H / 2, vx: -62, t: rand(0, 1), cycle: [1.6, 0.9, 1.0], phase: "off" });
  else if (kind === "well") g.obs.push({ kind, x: W + 40, y, r: 150, hp: 10, max: 10, vx: -45, t: 0, flash: 0 });
}

// ============================================================ bullets & particles
function shoot(g, x, y, ang, speed, o = {}) {
  if (g.ebul.length >= MAX_EBUL) return null;
  const b = { x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: o.r || 5, c: o.c || "o", life: o.life || 12, big: !!o.big, needle: !!o.needle, rock: !!o.rock, hp: o.hp || 0, homing: o.homing || 0, ang, torpedo: !!o.torpedo };
  if (b.big) b.r = o.r || 8;
  g.ebul.push(b);
  return b;
}
const aim = (g, x, y) => Math.atan2(g.player.y - y, g.player.x - x);
function fan(g, x, y, center, n, spreadDeg, speed, o = {}) {
  const sp = (spreadDeg * Math.PI) / 180, gap = o.gap ? Math.floor(rand(1, n - 1)) : -1;
  for (let i = 0; i < n; i++) { if (i === gap) continue; shoot(g, x, y, n === 1 ? center : center - sp / 2 + (sp / (n - 1)) * i, speed, o); }
}
function ring(g, x, y, n, speed, off = 0, o = {}) {
  const gapAt = o.gap ? Math.floor(Math.random() * n) : -1;
  for (let i = 0; i < n; i++) { if (gapAt >= 0 && (i === gapAt || i === (gapAt + 1) % n)) continue; shoot(g, x, y, off + (TAU / n) * i, speed, o); }
}
function particle(g, x, y, color, n = 6, spd = 120, life = 0.5, size = 3, kind) {
  const cap = QUALITY_PARTS[g.quality], m = QUALITY_MULT[g.quality];
  n = Math.max(1, Math.round(n * m));
  for (let i = 0; i < n && g.parts.length < cap; i++) {
    const a = Math.random() * TAU, s = spd * rand(0.3, 1);
    g.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color, size: size * rand(0.6, 1.3), kind, rot: Math.random() * TAU, vr: rand(-8, 8) });
  }
}
function explosion(g, x, y, scale = 1, debris) {
  particle(g, x, y, "#ffb347", 10 * scale, 170 * scale, 0.6, 4 * scale);
  particle(g, x, y, "#ff3fb4", 6 * scale, 120 * scale, 0.5, 3 * scale);
  particle(g, x, y, "#fff2c4", 4 * scale, 80 * scale, 0.3, 5 * scale);
  if (debris) particle(g, x, y, debris, 6 * scale, 200 * scale, 0.8, 3.5 * scale, "shard");
  if (g.parts.length < QUALITY_PARTS[g.quality]) g.parts.push({ ring: true, x, y, life: 0.35, max: 0.35, size: 34 * scale, color: "#ffd9a0" });
  if (g.quality > 0 && g.parts.length < QUALITY_PARTS[g.quality]) g.parts.push({ flashp: true, x, y, life: 0.1, max: 0.1, size: 16 * scale });
}
function hazard(g, h) { h.t = 0; g.hz.push(h); return h; }

// ============================================================ enemy behaviour
function enemyFire(g, e) {
  if (g.mode === "endless") return;   // Endless: enemies are dangerous only by contact
  const f = e.def.fire, sp = f.speed * g.diff;
  const mx = e.x - e.size * 0.42 * (e.def.move === "turret" || e.def.move === "edge" ? 0.8 : 1), my = e.y;
  if (e.x > W - 24 || e.x < 70) return;
  e.muzzle = 0.1;
  switch (f.kind) {
    case "single": shoot(g, mx, my, Math.PI, sp); break;
    case "aimed": shoot(g, mx, my, aim(g, mx, my), sp); break;
    case "aimed2": { const a = aim(g, mx, my); shoot(g, mx, my, a - 0.09, sp); shoot(g, mx, my, a + 0.09, sp); break; }
    case "paired": shoot(g, mx, my - 9, Math.PI, sp, { needle: true }); shoot(g, mx, my + 9, Math.PI, sp, { needle: true }); break;
    case "spread3": fan(g, mx, my, aim(g, mx, my), 3, 34, sp); break;
    case "fan5": fan(g, mx, my, Math.PI, 5, 70, sp); break;
    case "ring": ring(g, e.x, e.y, f.n, sp, Math.random() * TAU, { c: "m" }); break;
    case "burst3": e.burst = 3; e.burstT = 0; break;
    case "slow": shoot(g, mx, my, aim(g, mx, my), sp, { big: true, c: "m" }); break;
  }
  ev(g, "sfx", { name: "eshot" });
}

function updateEnemy(g, e, dt) {
  const d = e.def, p = g.player;
  e.t += dt; e.stT += dt; if (e.flash > 0) e.flash -= dt; if (e.dmgT > 0) e.dmgT -= dt; if (e.muzzle > 0) e.muzzle -= dt;
  if (e.kb > 0) { e.x += e.kb * dt; e.kb = Math.max(0, e.kb - 600 * dt); }
  const odt = dt; dt *= e.spd || 1;   // smooth, cumulative speed-up in Endless (1× in Campaign)
  switch (d.move) {
    case "straight": e.x -= d.speed * dt; break;
    case "wave": e.x -= d.speed * dt; e.y = e.y0 + d.amp * Math.sin(e.t * d.freq); break;
    case "float": e.x -= d.speed * dt; e.y = e.y0 + 12 * Math.sin(e.t * 1.6); break;
    case "edge": e.x -= d.speed * dt; break;
    case "turret": e.x -= 62 * dt; break;
    case "driftaccel":
      if (e.st === "in") { e.x -= d.speed * dt; e.y += clamp(p.y - e.y, -30, 30) * dt; if (e.t > 1.6 && e.x < W - 40) { e.st = "go"; e.vx = -d.speed; } }
      else { e.vx = Math.max(e.vx - 340 * dt, -380); e.x += e.vx * dt; }
      break;
    case "stopfire":
      if (e.st === "in") { e.x -= 170 * dt; if (e.x <= e.stopX) { e.st = "hold"; e.stT = 0; e.fired = 0; } }
      else if (e.st === "hold") {
        e.charging = (e.stT % 1.4) > 0.6;
        if (e.stT > 0.9 + e.fired * 1.4 && e.fired < 2) { enemyFire(g, e); e.fired++; }
        if (e.stT > d.hold + 0.6) { e.st = "out"; e.charging = false; }
      } else { e.x -= 160 * dt; e.y += (e.y < H / 2 ? -40 : 40) * dt; }
      if (d.spin) e.rot += dt * (e.charging ? 1 : 4);
      break;
    case "dash":
      if (e.st === "in") { e.x -= 200 * dt; if (e.x <= e.stopX) { e.st = "tele"; e.stT = 0; } }
      else if (e.st === "tele") { if (e.stT > d.tele) { e.st = "dash"; ev(g, "sfx", { name: "dash" }); } }
      else e.x -= d.dash * dt;
      break;
    case "rush": {   // enter, lock onto the player's position with a visible cue, then dash in a straight line
      if (e.st === "in") { e.x -= 230 * odt; if (e.x <= W - 80) { e.st = "tele"; e.stT = 0; e.tx = p.x; e.ty = p.y; } }
      else if (e.st === "tele") { if (e.stT > d.tele) { const a = Math.atan2(e.ty - e.y, e.tx - e.x), v = Math.min(780, 520 * (e.spd || 1)); e.vx = Math.cos(a) * v; e.vy = Math.sin(a) * v; e.rot = a + Math.PI; e.st = "dash"; ev(g, "sfx", { name: "dash" }); } }
      else { e.x += e.vx * odt; e.y += e.vy * odt; }
      break;
    }
    case "teleport":
      if (e.st === "in") { e.x -= 150 * dt; if (e.x <= e.stopX) { e.st = "wait"; e.stT = 0; } }
      else if (e.st === "wait") {
        if (e.stT > 1.0) {
          if (e.jumps >= 3) { e.st = "out"; break; }
          let tx, ty, tries = 0;
          do { tx = rand(480, 880); ty = rand(60, H - 60); tries++; } while (d2(tx, ty, p.x, p.y) < 170 * 170 && tries < 20);
          e.mark = { x: tx, y: ty }; e.st = "mark"; e.stT = 0;
          hazard(g, { type: "marker", x: tx, y: ty, r: 22, tele: 0.75, act: 0 });
        }
      } else if (e.st === "mark") {
        if (e.stT > 0.75) { particle(g, e.x, e.y, "#ff3fb4", 8, 90, 0.4); e.x = e.mark.x; e.y = e.mark.y; e.jumps++; e.st = "wait"; e.stT = 0; enemyFire(g, e); }
      } else e.x -= 220 * dt;
      break;
  }
  dt = odt;
  if (!e.entered && e.x < W - 20) e.entered = true;
  if (d.fire && d.fire.every && d.move !== "stopfire" && d.move !== "teleport") {
    e.fireT -= dt;
    if (e.fireT <= 0) { e.fireT = (d.fire.every / g.fireDiff) * (e.elite ? 0.8 : 1); enemyFire(g, e); }
  }
  if (e.burst > 0 && g.mode !== "endless") { e.burstT -= dt; if (e.burstT <= 0) { e.burst--; e.burstT = 0.13; const mx = e.x - e.size * 0.4; if (e.x < W - 24) shoot(g, mx, e.y, aim(g, mx, e.y), d.fire.speed * g.diff, { c: "m" }); } }
  if (d.pull && e.x < W) {
    const dd = Math.sqrt(d2(e.x, e.y, p.x, p.y));
    if (dd < 160 && dd > 1) { p.pullX += ((e.x - p.x) / dd) * 55; p.pullY += ((e.y - p.y) / dd) * 55; }
  }
}

function updateObstacles(g, dt) {
  const p = g.player;
  for (const o of g.obs) {
    o.x += o.vx * dt; if (o.flash > 0) o.flash -= dt;
    if (o.kind === "rock") { o.y = clamp(o.y + o.vy * dt, 40, H - 40); o.rot += o.spin * dt; }
    else if (o.kind === "gate") {
      o.t += dt; const [off, warn, on] = o.cycle, ph = o.t % (off + warn + on);
      o.phase = ph < off ? "off" : ph < off + warn ? "warn" : "on";
      if (o.phase === "on" && !o.zapped && o.x < W) { o.zapped = true; ev(g, "sfx", { name: "thunder" }); }
      if (o.phase !== "on") o.zapped = false;
    } else if (o.kind === "well") {
      o.t += dt; const dd = Math.sqrt(d2(o.x, o.y, p.x, p.y));
      if (dd < o.r && dd > 1 && o.x < W) { p.pullX += ((o.x - p.x) / dd) * 60; p.pullY += ((o.y - p.y) / dd) * 60; }
    }
  }
  g.obs = g.obs.filter((o) => !o.dead && o.x > -80);
}

// ============================================================ player
function playerFire(g) {
  const p = g.player, mx = p.x + g.muzzle[0], my = p.y + g.muzzle[1], pu = p.bullet && BULLET_POWERUPS[p.bullet.kind], sp = 820 * (pu ? pu.speed : 1);
  // damage per bullet: stage bonus (×1 → ×5 at 20 min of active play) × 2 while a bullet power-up is active
  const dmg = EndlessRules.damageMult(g.t) * (pu ? powerupMultFor(g) : 1);
  for (const a of SHOT_PATTERNS[p.tier]) if (g.pbul.length < MAX_PBUL) g.pbul.push({ x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg, age: 0, kind: pu ? p.bullet.kind : null, big: pu ? pu.big : 0 });
  p.muzzle = 0.06; p.recoil = 2.5;
  ev(g, "sfx", { name: "shoot" });
}

// power-up damage: rises with play time (both modes) and with Campaign world difficulty (worlds 4–6 ×3, 7–9 ×4, 10 ×5)
function powerupMultFor(g) { return EndlessRules.powerupMult(g.t, g.mode === "campaign" ? Math.floor((g.L.w - 1) / 3) : 0); }
// The special blast uses stored charges (start 1, max 3). Each Blast pickup adds one; there is no automatic recharge.
function special(g) {
  const p = g.player;
  if (p.blasts < 1 || p.dead || p.charge > 0 || g.blast) return false;
  p.blasts--; p.charge = BLAST_CHARGE;
  if (g.mode === "endless") g.rec.blasts.push(r3(g.t));   // recorded when the charge is spent (ranked validation tracks charges)
  ev(g, "sfx", { name: "charge" });
  return true;
}
function releaseBlast(g) {
  const p = g.player;
  g.blast = { x: p.x + g.muzzle[0] - 10, y: p.y + g.muzzle[1], r: 0, hitE: new Set(), hitO: new Set(), bossHit: false, partsHit: new Set() };
  g.shake = Math.max(g.shake, 0.35); g.flash = Math.max(g.flash, 0.18);
  ev(g, "sfx", { name: "special" });
}
function updateBlast(g, dt) {
  const B = g.blast; if (!B) return;
  B.r += BLAST_SPEED * dt;
  const r2 = B.r * B.r;
  let cleared = 0;
  g.ebul = g.ebul.filter((b) => { if (b.rock || d2(b.x, b.y, B.x, B.y) > r2) return true; cleared++; if (g.quality > 0 && cleared % 3 === 0) particle(g, b.x, b.y, "#a8fbff", 1, 40, 0.3, 2); return false; });
  if (cleared && g.mode === "campaign") g.score += cleared * 5;
  for (const e of g.enemies) if (!B.hitE.has(e) && e.x < W + 10 && e.t >= 0.2 && d2(e.x, e.y, B.x, B.y) <= r2) { B.hitE.add(e); e.kb = 260; impact(g, { x: e.x - e.r * 0.6, y: e.y }); particle(g, e.x, e.y, "#a8fbff", 6, 160, 0.35, 2.5); damageEnemy(g, e, 10, true, 1); }
  for (const o of g.obs) if (!B.hitO.has(o) && o.hp && d2(o.x, o.y, B.x, B.y) <= r2) { B.hitO.add(o); damageObstacle(g, o, 10); }
  const b = g.boss;
  if (b && !b.entering && !b.dying) {
    for (const pt of b.parts) if (pt.alive && !B.partsHit.has(pt) && d2(pt.x, pt.y, B.x, B.y) <= r2) { B.partsHit.add(pt); damagePart(g, pt, 14); }
    if (!B.bossHit && b.body.length && d2(b.body[0].x, b.body[0].y, B.x, B.y) <= (B.r + b.body[0].r) ** 2) { B.bossHit = true; damageBoss(g, null, 14, true); }
  }
  if (B.r > BLAST_MAX) g.blast = null;
}

function hurtPlayer(g) {
  const p = g.player;
  if (p.inv > 0 || p.dead || g.state === "complete" || g.god) return;
  if (p.shield > 0) { p.shield = 0; p.inv = 0.6; ev(g, "sfx", { name: "shieldbreak" }); particle(g, p.x, p.y, "#9ff7c4", 14, 170, 0.5); floatText(g, p.x, p.y - 40, "Shield broke", "#9ff7c4"); return; }
  p.hp--; p.inv = INV_TIME; p.hurtT = 0.35; g.hitsTaken++; g.shake = Math.max(g.shake, 0.3);
  if (g.mode === "endless") g.rec.hits.push(r3(g.t));
  g.ebul = g.ebul.filter((b) => d2(b.x, b.y, p.x, p.y) > 80 * 80);
  particle(g, p.x, p.y, "#ff9ad5", 10, 150, 0.5);
  ev(g, "sfx", { name: "hurt" });
  if (p.hp <= 0) {
    p.dead = true; p.deadT = 0; explosion(g, p.x, p.y, 1.4); g.state = "dead"; g.stateT = 0; ev(g, "sfx", { name: "explode" });
    if (g.mode === "endless") { g.rec.end = r3(g.t); ev(g, "endlessOver", {}); }
  }
}

// ============================================================ damage & drops
function dropPickup(g, x, y, kind, pid) {
  if (g.mode === "campaign" && kind === "hp") { if (g.hpSpawns >= CAMPAIGN_HP_CAP) kind = "score"; else g.hpSpawns++; }
  g.pickups.push({ x, y, kind, t: 0, vy: rand(-20, 20), pid });
}
function damageEnemy(g, e, dmg, ignoreShield, cause = 0) {
  if (e.dead) return;
  if (e.shield > 0 && !ignoreShield) {
    e.shield -= dmg; e.flash = 0.05; particle(g, e.x - e.size * 0.4, e.y, "#d6f2ff", 2, 80, 0.25, 2);
    if (e.shield <= 0) { particle(g, e.x - e.size * 0.4, e.y, "#d6f2ff", 12, 150, 0.5, 3, "shard"); ev(g, "sfx", { name: "shieldbreak" }); }
    ev(g, "sfx", { name: "clink" });
    return;
  }
  e.hp -= dmg; e.flash = 0.08; e.kb = Math.max(e.kb, e.def.armored ? 12 : 40);
  if (e.hp > 0) { if (e.def.armored) { e.dmgT = 0.25; particle(g, e.x - e.r * 0.7, e.y, ARMOR_TIERS[e.def.armored].metal[0], 2, 110, 0.25, 2, "shard"); ev(g, "sfx", { name: "clink" }); } else ev(g, "sfx", { name: "hit" }); return; }
  e.dead = true; g.kills++;
  explosion(g, e.x, e.y, Math.min(1.6, e.size / 80), e.elite ? "#ffd34f" : "#9aa4c0");
  ev(g, "sfx", { name: "pop" });
  if (g.mode === "endless") {
    const t = r3(g.t), s = g.spawnMap.get(e.sid);
    g.rec.kills.push([t, e.sid, cause]);
    g.score += s.score; if (s.elite) g.elites++;
    if (g.enemies.length < 40 || s.score >= 15) floatText(g, e.x, e.y - 18, "+" + s.score, s.score >= 15 ? "#ffd34f" : "#ffe9b0", s.score >= 15 ? 17 : 14);
    const kind = EndlessRules.dropFor(g.seed, s);
    if (kind) g.pickups.push({ x: e.x, y: e.y, kind, t: 0, vy: rand(-20, 20), pid: "d" + e.sid });
    return;
  }
  g.score += e.score;
  if (g.enemies.length < 40 || e.score >= 15) floatText(g, e.x, e.y - 18, "+" + e.score, e.score >= 15 ? "#ffd34f" : "#ffe9b0", e.score >= 15 ? 17 : 14);
  if (e.elite) { dropPickup(g, e.x, e.y, "up"); return; }
  if (Math.random() < 0.04) dropPickup(g, e.x, e.y, pick(["comet", "nova", "prism"]));
}
function damageObstacle(g, o, dmg) {
  o.hp -= dmg; o.flash = 0.06;
  if (o.hp <= 0 && !o.dead) { o.dead = true; explosion(g, o.x, o.y, o.kind === "well" ? 1.4 : 1, "#9aa4c0"); g.score += 80; ev(g, "sfx", { name: "pop" }); }
}
function damagePart(g, pt, dmg) {
  pt.hp -= dmg; pt.flash = 0.08;
  if (pt.hp <= 0 && pt.alive) { pt.alive = false; pt.respawn = pt.respawnTime || 0; explosion(g, pt.x, pt.y, 1.2, "#9aa4c0"); g.score += 500; g.shake = Math.max(g.shake, 0.15); ev(g, "sfx", { name: "explode" }); }
}
function damageBoss(g, hit, dmg, raw) {
  const b = g.boss;
  if (!b || b.entering || b.dying || b.trans > 0) return;
  const mult = raw ? 1 : hit.mult;
  b.hp -= dmg * mult; b.flash = 0.05;
  if (mult < 0.6 && !raw) { b.clink = 0.1; ev(g, "sfx", { name: "clink" }); } else ev(g, "sfx", { name: "bosshit" });
  if (b.hp <= 0) {
    b.hp = 0; b.dying = true; b.dieT = 0; g.ebul = []; g.hz = [];
    g.score += 3000 + 120 * g.level;
    ev(g, "sfx", { name: "bossdie" }); ev(g, "bossDefeated", {});
  }
}

// ============================================================ main update
function updateGame(g, dt, input) {
  dt = Math.min(dt, 0.05);
  g.t += dt; g.stateT += dt;
  g.scroll += dt * (g.state === "boss" ? 40 : 70);
  if (g.shake > 0) g.shake -= dt;
  if (g.flash > 0) g.flash -= dt;
  const p = g.player;

  if (g.mode === "campaign") updateCampaignFlow(g, dt); else updateEndlessFlow(g, dt);
  const dm = EndlessRules.damageMult(g.t);   // announce each damage step (5 / 10 / 15 / 20 min)
  if (dm !== (g.dmgStage || 1)) { g.dmgStage = dm; if (!p.dead) { p.upT = 0.9; floatText(g, W / 2, 190, `Damage ×${dm}!`, "#ffd34f", 30); floatText(g, W / 2, 222, `Power-ups ×${powerupMultFor(g)} · Blast every ${EndlessRules.blastInterval(g.t)}s`, "#ffe9b0", 18); ev(g, "sfx", { name: "powerup" }); } }
  if (g.state === "dead") { p.deadT += dt; if (g.stateT > 1.8 && !g.overSent) { g.overSent = true; if (g.mode === "campaign") ev(g, "gameOver", {}); } }

  if (g.queue.length) for (let i = g.queue.length - 1; i >= 0; i--) {
    const q = g.queue[i];
    if (q.at <= g.t && !q.obs && g.enemies.length >= ENEMY_CAP[0]) continue;   // Campaign: wait for room (max 50 on screen)
    if (q.at <= g.t) { if (q.obs) spawnObstacle(g, q.obs); else spawnEnemy(g, q.type, q.y, undefined, { elite: q.elite }); g.queue.splice(i, 1); }
  }

  if (!p.dead) {
    let mx = 0, my = 0;
    if (input.joyX || input.joyY) { mx = input.joyX; my = input.joyY; }
    else { mx = (input.right ? 1 : 0) - (input.left ? 1 : 0); my = (input.down ? 1 : 0) - (input.up ? 1 : 0); const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; } }
    p.x += (mx * PLAYER_SPEED + p.pullX + p.pushX) * dt;
    p.y += (my * PLAYER_SPEED + p.pullY) * dt;
    p.x = clamp(p.x, 50, W - 104); p.y = clamp(p.y, 66, H - 40);
    p.pullX = 0; p.pullY = 0; p.pushX *= Math.pow(0.1, dt); if (Math.abs(p.pushX) < 2) p.pushX = 0;
    p.tilt += (my * 0.12 - p.tilt) * Math.min(1, dt * 10);
    if (p.inv > 0) p.inv -= dt;
    if (p.shield > 0) p.shield -= dt;
    if (p.bullet) { p.bullet.t -= dt; if (p.bullet.t <= 0) { p.bullet = null; floatText(g, p.x + 30, p.y - 50, "Power-up ended", "#c9bde8"); } }
    if (p.specialCd > 0) p.specialCd -= dt;
    for (const k of ["muzzle", "hurtT", "healT", "upT"]) if (p[k] > 0) p[k] -= dt;
    p.recoil *= Math.pow(0.0005, dt);
    if (p.charge > 0) { p.charge -= dt; if (p.charge <= 0) { p.charge = 0; releaseBlast(g); } }
    p.fireCd -= dt;
    p.firing = (input.fire || input.autofire) && g.state !== "complete" && p.charge <= 0;
    if (p.firing && p.fireCd <= 0) { p.fireCd = FIRE_INT; playerFire(g); }
    if (input.specialPressed) special(g);
  }
  input.specialPressed = false;
  updateBlast(g, dt);

  for (const b of g.pbul) { b.x += b.vx * dt; b.y += b.vy * dt; b.age += dt; }
  g.pbul = g.pbul.filter((b) => !b.dead && b.x < W + 20 && b.y > -20 && b.y < H + 20);
  for (const b of g.ebul) {
    if (b.homing) {
      const want = Math.atan2(p.y - b.y, p.x - b.x); let da = want - b.ang;
      while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      b.ang += clamp(da, -b.homing * dt, b.homing * dt);
      const s = Math.hypot(b.vx, b.vy); b.vx = Math.cos(b.ang) * s; b.vy = Math.sin(b.ang) * s;
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
  }
  g.ebul = g.ebul.filter((b) => !b.dead && b.life > 0 && b.x > -40 && b.x < W + 60 && b.y > -60 && b.y < H + 60);

  for (const e of g.enemies) updateEnemy(g, e, dt);
  g.enemies = g.enemies.filter((e) => !e.dead && e.x > -90 && e.x < W + 200 && e.y > -90 && e.y < H + 90);
  updateObstacles(g, dt);
  if (g.boss) updateBoss(g, dt);
  updateHazards(g, dt);

  for (const k of g.pickups) {
    k.t += dt; k.x -= 55 * dt; k.y += k.vy * dt; k.vy *= Math.pow(0.3, dt);
    if (!p.dead) {
      const dd = d2(k.x, k.y, p.x, p.y);
      if (dd < 90 * 90) { const l = Math.sqrt(dd) || 1; k.x += ((p.x - k.x) / l) * 220 * dt; k.y += ((p.y - k.y) / l) * 220 * dt; }
      if (dd < 26 * 26) { collect(g, k); k.dead = true; }
    }
  }
  g.pickups = g.pickups.filter((k) => !k.dead && k.x > -30);
  for (const q of g.parts) { q.life -= dt; if (!q.ring && !q.flashp) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.96; q.vy *= 0.96; if (q.kind === "shard") { q.vy += 160 * dt; q.rot += q.vr * dt; } } }
  g.parts = g.parts.filter((q) => q.life > 0);
  for (const t of g.texts) { t.life -= dt; t.y -= 34 * dt; }
  g.texts = g.texts.filter((t) => t.life > 0);
  collide(g);
}

function updateTimedPickups(g) {
  if (g.state === "dead" || g.state === "complete" || g.state === "warning") return;
  g.tp = g.tp || { sh: 0, bl: 0 };
  const S = EndlessRules, T = g.tp;
  while (30 + T.sh * S.SHIELD_EVERY <= g.t) { const k = T.sh++; g.pickups.push({ x: W + 20, y: 40 + (0.25 + (k % 3) * 0.25) * (H - 80), kind: "shield", t: 0, vy: 0, pid: g.mode === "endless" ? "sh" + k : undefined }); }
  if (T.nextBl === undefined) T.nextBl = S.BLAST_FIRST;
  while (T.nextBl <= g.t) { const k = T.bl++; T.nextBl += S.blastInterval(T.nextBl); g.pickups.push({ x: W + 20, y: 40 + (0.3 + (k % 4) * 0.13) * (H - 80), kind: "blast", t: 0, vy: 0, pid: g.mode === "endless" ? "bl" + k : undefined }); }
}
function updateCampaignFlow(g, dt) {
  const p = g.player;
  if (g.state === "waves" || g.state === "boss") updateTimedPickups(g);
  if (g.state === "intro" && g.stateT > 2.6) { g.state = "waves"; g.stateT = 0; }
  if (g.state === "waves") {
    g.waveT -= dt; g.sinceLast += dt;
    const done = g.waveIdx >= g.waves.length, fieldClear = g.enemies.length === 0 && g.queue.length === 0;
    if (!done && (g.waveT <= 0 || (fieldClear && g.sinceLast > 2.5))) {
      const w = g.waves[g.waveIdx++];
      const qStart = g.queue.length;
      w.groups.forEach((gr, i) => queueGroup(g, gr[0], gr[1], gr[2], i * 1.6));
      if (w.elite) { const c = g.queue.slice(qStart).filter((q) => !q.obs && typeof q.y === "number"); if (c.length) c[Math.floor(c.length / 2)].elite = true; }
      g.waveT = w.dur; g.sinceLast = 0;
    }
    if (done && ((fieldClear && g.sinceLast > 1.5) || g.sinceLast > 12)) { g.state = "warning"; g.stateT = 0; ev(g, "sfx", { name: "warning" }); ev(g, "warning", {}); }
  }
  if (g.state === "warning" && g.stateT > 3 && !g.boss) {
    g.state = "boss"; g.stateT = 0; g.boss = makeBoss(g); g.bossesSpawned++; g.obs = []; g.queue = [];
    ev(g, "bossStart", { name: g.boss.def.name });
  }
  if (g.state === "boss" && g.boss && g.boss.dying && g.boss.dieT > 2.6) { g.state = "complete"; g.stateT = 0; g.ebul = []; ev(g, "levelComplete", {}); }
}

function updateEndlessFlow(g, dt) {
  if (g.state !== "endless") return;
  updateTimedPickups(g);
  const cap = ENEMY_CAP[g.quality ?? 2];
  for (const s of g.sched.take(g.t)) {
    g.spawnMap.set(s.id, s);
    if (g.enemies.length >= cap) continue;   // screen full: skip this spawn (never spawns on the player; keeps phones smooth)
    const y = typeof s.y === "number" ? 40 + s.y * (H - 80) : s.y;
    spawnEnemy(g, s.type, y, undefined, { hp: s.hp, shield: s.shield, sid: s.id, elite: s.elite, score: s.score });
  }
  for (const u of EndlessRules.UPGRADES) if (!g.upDone[u.id] && g.t >= u.t) { g.upDone[u.id] = true; g.pickups.push({ x: W + 20, y: 40 + u.y * (H - 80), kind: "up", t: 0, vy: 0, pid: u.id }); }
  const nextWave = Math.floor(g.t / EndlessRules.WAVE_EVERY) + 1;
  if (nextWave * EndlessRules.WAVE_EVERY - g.t <= 2 && g.warned !== nextWave) { g.warned = nextWave; ev(g, "sfx", { name: "warning" }); }
  const m = Math.floor(g.t / 60);
  if (m > g.milestone) { g.milestone = m; const pts = 250 * m; g.score += pts; floatText(g, W / 2, 110, `${m} min survived  +${pts}`, "#ffe08a"); ev(g, "sfx", { name: "clear" }); }
  const th = Math.floor(g.t / 120) % WORLDS.length;
  if (th !== g.theme) { g.theme = th; g.lv = { ...g.lv, pal: WORLDS[th].pal, bg: WORLDS[th].bg, world: WORLDS[th] }; }
  g.diff = 1 + Math.min(g.t / 600, 1) * 0.25; g.fireDiff = 1 + Math.min(g.t / 600, 1) * 0.3;
}

function collect(g, k) {
  const p = g.player;
  if (g.mode === "endless" && k.pid) g.rec.picks.push([r3(g.t), k.pid]);
  const pts = g.mode === "endless" ? EndlessRules.PICK_POINTS : { score: 250, big: 1000, hp: 50, shield: 0, up: 0 };
  if (k.kind === "hp") { const full = p.hp >= PLAYER_HP; p.hp = Math.min(PLAYER_HP, p.hp + 1); p.healT = 0.6; floatText(g, p.x, p.y - 40, full ? "Health full" : "+1 health", "#6fe04a"); }
  else if (k.kind === "shield") { p.shield = p.shieldMax; floatText(g, p.x, p.y - 40, "Shield 6s", "#9ff7c4"); }
  else if (k.kind === "blast") { const max = EndlessRules.BLAST_MAX; if (p.blasts < max) { p.blasts++; p.upT = 0.5; floatText(g, p.x + 40, p.y - 60, `Blast +1  (${p.blasts}/${max})`, "#7ff3ff", 22); } else floatText(g, p.x + 40, p.y - 60, `Blasts full (${max}/${max})`, "#7ff3ff", 18); }
  else if (BULLET_POWERUPS[k.kind]) { const pu = BULLET_POWERUPS[k.kind]; p.bullet = { kind: k.kind, t: POWERUP_TIME }; p.upT = 0.6; floatText(g, p.x + 40, p.y - 60, `${pu.name}! ×${powerupMultFor(g)} damage ${POWERUP_TIME}s`, pu.color, 22); }
  else if (k.kind === "up") {
    p.upT = 0.9;
    if (p.tier < 3) { p.tier++; floatText(g, p.x + 40, p.y - 60, "Weapon Upgraded!", "#ffd34f", 26); floatText(g, p.x + 40, p.y - 34, `${EndlessRules.TIER_SHOTS[p.tier]} shots`, "#ffe08a"); }
    else { g.score += MAX_TIER_BONUS; floatText(g, p.x + 40, p.y - 60, `Max power! +${MAX_TIER_BONUS}`, "#ffd34f", 24); }
  }
  else floatText(g, k.x, k.y - 16, "+" + (pts[k.kind] || 0), "#ffe08a");
  g.score += pts[k.kind] || 0;
  particle(g, k.x, k.y, BULLET_POWERUPS[k.kind] ? BULLET_POWERUPS[k.kind].color : k.kind === "blast" ? "#7ff3ff" : k.kind === "shield" ? "#6fe04a" : "#ffd34f", 10, 110, 0.45);
  if (g.parts.length < QUALITY_PARTS[g.quality]) g.parts.push({ ring: true, x: k.x, y: k.y, life: 0.3, max: 0.3, size: 26, color: k.kind === "hp" || k.kind === "shield" ? "#6fe04a" : "#ffd34f" });
  ev(g, "sfx", { name: k.kind === "up" ? "powerup" : k.kind === "hp" ? "heal" : "pickup" });
}

function collide(g) {
  const p = g.player;
  for (const s of g.pbul) {
    for (const e of g.enemies) {
      if (e.dead || e.x > W + 10 || e.t < 0.2) continue;
      const rr = e.r + 6 + (s.big || 0);
      if (d2(s.x, s.y, e.x, e.y) < rr * rr) { s.dead = true; impact(g, s); damageEnemy(g, e, s.dmg, false, 0); break; }
    }
    if (s.dead) continue;
    for (const o of g.obs) if (o.hp && !o.dead && d2(s.x, s.y, o.x, o.y) < (o.kind === "well" ? 18 : o.r + 3) ** 2) { s.dead = true; impact(g, s); damageObstacle(g, o, s.dmg); break; }
    if (s.dead) continue;
    for (const b of g.ebul) if (b.hp > 0 && d2(s.x, s.y, b.x, b.y) < (b.r + 4) * (b.r + 4)) { s.dead = true; b.hp--; if (b.hp <= 0) { b.dead = true; explosion(g, b.x, b.y, 0.5); g.score += 50; } break; }
    if (s.dead || !g.boss || g.boss.entering || g.boss.dying) continue;
    for (const pt of g.boss.parts) if (pt.alive && d2(s.x, s.y, pt.x, pt.y) < (pt.r + 4) * (pt.r + 4)) { s.dead = true; impact(g, s); damagePart(g, pt, s.dmg); break; }
    if (s.dead) continue;
    for (const h of g.boss.hits) if (d2(s.x, s.y, h.x, h.y) < (h.r + 4) * (h.r + 4)) { s.dead = true; damageBoss(g, h, s.dmg); impact(g, s, h.mult < 0.6); break; }
  }
  if (p.dead) return;
  const PR = PLAYER_HITBOX;
  for (const b of g.ebul) if (d2(b.x, b.y, p.x, p.y) < (b.r + PR) * (b.r + PR)) { b.dead = true; hurtPlayer(g); }
  for (const e of g.enemies) {
    if (!e.entered || e.dead) continue;
    const rr = e.r * 0.75 + PR;
    if (d2(e.x, e.y, p.x, p.y) < rr * rr) { hurtPlayer(g); if (e.def.pull && g.mode === "campaign") damageEnemy(g, e, 99, true, 2); }
  }
  for (const o of g.obs) {
    if (o.kind === "rock" && d2(o.x, o.y, p.x, p.y) < (o.r * 0.85 + PR) ** 2) hurtPlayer(g);
    else if (o.kind === "gate") { if (Math.abs(p.x - o.x) < 14 && (p.y < 44 || p.y > H - 44 || o.phase === "on")) hurtPlayer(g); }
    else if (o.kind === "well" && d2(o.x, o.y, p.x, p.y) < 18 * 18) hurtPlayer(g);
  }
  if (g.boss && !g.boss.entering && !g.boss.dying) {
    for (const h of g.boss.body) if (d2(h.x, h.y, p.x, p.y) < (h.r * 0.8 + PR) ** 2) { hurtPlayer(g); break; }
    for (const pt of g.boss.parts) if (pt.alive && d2(pt.x, pt.y, p.x, p.y) < (pt.r * 0.7 + PR) ** 2) { hurtPlayer(g); break; }
  }
}
function impact(g, s, armor) {
  if (g.parts.length >= QUALITY_PARTS[g.quality]) return;
  g.parts.push({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.14, max: 0.14, color: armor ? "#e8ecf7" : "#a8fbff", size: armor ? 5 : 7, kind: "spark" });
  if (g.quality > 1) particle(g, s.x, s.y, armor ? "#e8ecf7" : "#5ef2f2", 2, 90, 0.2, 1.6);
}

function updateHazards(g, dt) {
  const p = g.player;
  for (const h of g.hz) {
    h.t += dt;
    const act = h.t >= h.tele && h.t < h.tele + (h.act || 0);
    if (h.onStart && h.t >= h.tele && !h.started) { h.started = true; h.onStart(g, h); }
    h.active = act;
    if (h.follow && h.t < h.tele) h.follow(h);
    if (!act || p.dead) continue;
    switch (h.type) {
      case "laser": { const dx = Math.cos(h.ang), dy = Math.sin(h.ang), px = p.x - h.x, py = p.y - h.y; if (px * dx + py * dy > 0 && Math.abs(px * dy - py * dx) < h.w / 2 + 3) hurtPlayer(g); break; }
      case "hbeam": if (Math.abs(p.y - h.y) < h.h / 2) hurtPlayer(g); break;
      case "vstrike": if (h.kind !== "debris" && Math.abs(p.x - h.x) < h.w / 2) hurtPlayer(g); break;
      case "zone": { const dd = Math.sqrt(d2(h.x, h.y, p.x, p.y)); if (dd < h.r && dd > 1) { p.pullX += ((h.x - p.x) / dd) * h.force; p.pullY += ((h.y - p.y) / dd) * h.force; } if (dd < 16) hurtPlayer(g); break; }
    }
  }
  g.hz = g.hz.filter((h) => h.t < h.tele + (h.act || 0) + 0.05);
}
