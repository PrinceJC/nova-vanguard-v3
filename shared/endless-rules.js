/* Endless-mode rules shared by the game (browser) and the ranked-run validator (server).
   Everything here is deterministic integer/IEEE arithmetic only (no Math.sin etc.), so the
   browser and the server produce identical schedules and scores from the same seed. */
(function (root, factory) {
  const m = factory();
  if (typeof module === "object" && module.exports) module.exports = m; else root.EndlessRules = m;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const VERSION = 5;
  const PLAYER_HP = 3, INV_MIN = 0.9, BLAST_CD = 14, FIRE_INT = 0.15, BLAST_DMG = 10;
  const HEAL_CAP = 2, HEAL_WINDOW = 300, PICKUP_LIFE = 30, ENTRY_MIN = 0.15, MAX_LIFE = 45;
  const TIER_SHOTS = [0, 1, 3, 6], TIER_DPS = TIER_SHOTS.map((n) => n / FIRE_INT), MAX_TIER_BONUS = 1000;
  const UPGRADES = []; // weapon upgrades come only from defeated elites
  const PICK_POINTS = { score: 250, big: 1000, hp: 50, shield: 0, up: 0 };
  const ELITE_BONUS = 500, ELITE_HP = 2.5, ELITE_SCORE = 3;

  // type: [hp, shield, score, kind]  kind: n standard · a armored · f fast · s edge/turret
  // Armored tiers need exactly 5 / 10 / 15 / 20 bullet hits (no health scaling in Endless).
  const STATS = {
    mite: [1, 0, 80, "n"], scout_drone: [2, 0, 100, "n"], wing_bot: [2, 0, 100, "n"], crystal_bat: [2, 0, 120, "n"],
    aqua_drone: [2, 0, 120, "n"], spark_bird: [2, 0, 120, "n"], sand_skimmer: [2, 0, 120, "n"], ice_wisp: [1, 0, 100, "n"],
    bulwark1: [5, 0, 300, "a"], bulwark2: [10, 0, 600, "a"], bulwark3: [15, 0, 950, "a"], bulwark4: [20, 0, 1400, "a"],
    dart: [2, 0, 220, "f"],
  };
  // [type, first appears (s), weight] — tougher types arrive gradually
  const POOL = [
    ["mite", 0, 3], ["scout_drone", 0, 2.5], ["wing_bot", 8, 2], ["crystal_bat", 25, 1.6], ["aqua_drone", 45, 1.4], ["sand_skimmer", 70, 1.3],
    ["spark_bird", 90, 1.3], ["ice_wisp", 120, 1],
    ["bulwark1", 35, 1.3], ["dart", 55, 1.4], ["bulwark2", 100, 1.1], ["bulwark3", 180, 0.9], ["bulwark4", 270, 0.7],
  ];
  const POWERUPS = ["comet", "nova", "prism"];
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0; let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash01(seed, n) { return rng((seed ^ Math.imul(n + 1, 0x9e3779b1)) >>> 0)(); }
  const r3 = (x) => Math.round(x * 1000) / 1000;

  // Every 20 s the gap between enemy packs shrinks by 8% (cumulative), down to a floor. Plain multiplication keeps
  // browser and server bit-identical. Enemy movement speed ramps smoothly with speedAt(t).
  const STEP_SECONDS = 20, STEP_FACTOR = 0.92, GAP_START = 3.0, GAP_MIN = 0.9, WAVE_EVERY = 20, LANES = 8;
  function spawnGap(t) { const steps = Math.floor(t / STEP_SECONDS); let g = GAP_START; for (let i = 0; i < steps && g > GAP_MIN; i++) g *= STEP_FACTOR; return Math.max(GAP_MIN, g); }
  function speedAt(t) { return 1 + Math.min(1, t / 420); }
  function threatLevel(t) { return 1 + Math.floor(t / STEP_SECONDS); }
  // Wave n arrives at 20·n s: more enemies each time, mixing standard, armored and fast types. Arrivals are staggered in
  // groups of four, and two adjacent lanes are always left open as a dodge route. Darts are spaced apart.
  function waveSpawns(seed, n) {
    const r = rng((seed ^ Math.imul(n + 7, 0x85ebca6b)) >>> 0), t0 = n * WAVE_EVERY;
    const count = Math.min(34, 6 + n * 2), armoredShare = n >= 2 ? Math.min(0.3, 0.06 * n) : 0, fastShare = n >= 3 ? Math.min(0.2, 0.04 * n) : 0;
    const maxTier = t0 >= 270 ? 4 : t0 >= 180 ? 3 : t0 >= 100 ? 2 : 1;
    const std = POOL.filter((p) => STATS[p[0]][3] === "n" && p[1] <= t0).map((p) => p[0]);
    const gapA = Math.floor(r() * (LANES - 1)), open = [];
    for (let l = 0; l < LANES; l++) if (l !== gapA && l !== gapA + 1) open.push(l);
    const out = []; let lastFast = -9;
    for (let i = 0; i < count; i++) {
      const x = r(); let type;
      if (x < fastShare && i - lastFast >= 4) { type = "dart"; lastFast = i; }
      else if (x < fastShare + armoredShare) type = "bulwark" + (1 + Math.floor(r() * maxTier));
      else type = std[Math.floor(r() * std.length)];
      const lane = open[Math.floor(r() * open.length)], st = STATS[type];
      out.push({ id: 1000000 + n * 100 + i, t: r3(t0 + 0.4 + Math.floor(i / 4) * 0.55 + r() * 0.25), type, y: r3(0.12 + lane * (0.76 / (LANES - 1))), hp: st[0], shield: st[1], score: st[2], elite: false, wave: n });
    }
    return out;
  }
  function createSchedule(seed) {
    const r = rng(seed);
    let packT = 2, id = 0, nextWave = 1;
    const buf = [];
    function pack() {
      const t = packT, d = t / 60;
      const pool = POOL.filter((p) => p[1] <= t);
      const total = pool.reduce((s, p) => s + p[2], 0);
      const groups = 1 + (d > 3 && r() < 0.5 ? 1 : 0) + (d > 7 && r() < 0.4 ? 1 : 0);
      const made = [];
      for (let gi = 0; gi < groups; gi++) {
        let x = r() * total, type = pool[0][0];
        for (const p of pool) { x -= p[2]; if (x <= 0) { type = p[0]; break; } }
        const st = STATS[type], base = t + gi * 1.4;
        if (st[3] === "s") {
          const n = 1 + (d > 5 && r() < 0.5 ? 1 : 0);
          for (let i = 0; i < n; i++) made.push({ t: base + i * 1.3, type, y: i % 2 === 0 ? "bottom" : "top" });
          continue;
        }
        let n = st[3] === "a" ? 1 + (st[0] <= 10 && d > 4 && r() < 0.35 ? 1 : 0) : st[3] === "f" ? 1 + (d > 3 && r() < 0.5 ? 1 : 0) : 2 + Math.floor(Math.min(d, 6) * 0.5) + Math.floor(r() * 2);
        const pat = st[3] === "a" || st[3] === "f" ? "column" : ["line", "column", "v"][Math.floor(r() * 3)];
        if (pat === "line") { const y = 0.15 + r() * 0.7; for (let i = 0; i < n; i++) made.push({ t: base + i * 0.55, type, y }); }
        else if (pat === "v") { const cy = 0.3 + r() * 0.4, half = (n - 1) / 2; for (let i = 0; i < n; i++) made.push({ t: base + Math.abs(i - half) * 0.35, type, y: cy + (i - half) * 0.09 }); }
        else {
          const span = Math.min(0.17 * (n - 1), 0.7), cy = 0.15 + span / 2 + r() * (0.7 - span);
          for (let i = 0; i < n; i++) made.push({ t: base + (st[3] === "f" ? i * 0.9 : 0), type, y: n === 1 ? 0.17 + r() * 0.66 : cy - span / 2 + (span / (n - 1)) * i });
        }
      }
      if (t >= 20 && r() < Math.min(0.3, 0.1 + d * 0.025)) {
        const cand = made.filter((m) => typeof m.y === "number" && STATS[m.type][3] === "n");
        if (cand.length) cand[Math.floor(r() * cand.length)].elite = true;
      }
      const hpScale = 1;
      for (const m of made) {
        const st = STATS[m.type];
        m.id = ++id; m.t = r3(m.t);
        if (typeof m.y === "number") m.y = r3(Math.min(0.9, Math.max(0.1, m.y)));
        m.hp = Math.round(st[0] * hpScale * (m.elite ? ELITE_HP : 1) * 10) / 10;
        m.shield = Math.round(st[1] * (m.elite ? 1.5 : 1));
        m.score = st[2] * (m.elite ? ELITE_SCORE : 1) + (m.elite ? ELITE_BONUS : 0);
        m.elite = !!m.elite;
        buf.push(m);
      }
      packT = t + spawnGap(t) + groups * 0.35;
    }
    return {
      // returns every spawn with t <= untilT, in time order, each exactly once
      take(untilT) {
        while (packT <= untilT + 12) pack();
        while (nextWave * WAVE_EVERY <= untilT + 12) for (const s of waveSpawns(seed, nextWave++)) buf.push(s);
        buf.sort((a, b) => a.t - b.t || a.id - b.id);
        const out = [];
        while (buf.length && buf[0].t <= untilT) out.push(buf.shift());
        return out;
      },
    };
  }

  function newDropState() { return { heals: {} }; }
  function dropFor(seed, spawn, killT, state) {
    if (spawn.elite) return "up";
    const x = hash01(seed, spawn.id);
    if (x < 0.07) {
      const w = Math.floor(killT / HEAL_WINDOW), n = state.heals[w] || 0;
      if (n < HEAL_CAP) { state.heals[w] = n + 1; return "hp"; }
      return "score";
    }
    if (x < 0.11) return "shield";
    if (x < 0.15) return POWERUPS[Math.floor(hash01(seed ^ 0x5bd1e995, spawn.id) * POWERUPS.length) % POWERUPS.length];
    if (x < 0.29) return "score";
    return null;
  }
  function milestonePoints(survival) { const m = Math.floor(survival / 60); return 125 * m * (m + 1); }

  const fail = (reason) => ({ ok: false, reason });
  const isNum = (v) => typeof v === "number" && isFinite(v);
  function sorted(a, key) { for (let i = 1; i < a.length; i++) if (key(a[i]) < key(a[i - 1])) return false; return true; }

  /* Validate a recorded run. `elapsed` is server wall-clock seconds since the run session started.
     Returns { ok, score, kills, elites, survival } or { ok:false, reason }. The score is computed here. */
  function validate(seed, ev, elapsed) {
    if (!ev || typeof ev !== "object") return fail("The run data is missing.");
    if (ev.v !== VERSION) return fail("This run was recorded with an outdated game version. Refresh the page and try again.");
    const { end } = ev, kills = ev.kills, picks = ev.picks, hits = ev.hits, blasts = ev.blasts;
    if (!isNum(end) || end < 3 || end > 4 * 3600) return fail("The run length is invalid.");
    if (![kills, picks, hits, blasts].every(Array.isArray)) return fail("The run data is incomplete.");
    if (kills.length > 20000 || picks.length > 5000 || hits.length > 200 || blasts.length > 2000) return fail("The run contains too many events.");
    if (end > elapsed + 5) return fail("The run lasted longer than the time since it started.");
    if (!kills.every((k) => Array.isArray(k) && isNum(k[0]) && Number.isInteger(k[1]) && (k[2] === 0 || k[2] === 1))) return fail("A defeated-enemy record is malformed.");
    if (!picks.every((p) => Array.isArray(p) && isNum(p[0]) && typeof p[1] === "string")) return fail("A pickup record is malformed.");
    if (!hits.every(isNum) || !blasts.every(isNum)) return fail("A damage or blast record is malformed.");
    const inRange = (t) => t >= 0 && t <= end + 0.05;
    if (!kills.every((k) => inRange(k[0])) || !picks.every((p) => inRange(p[0])) || !hits.every(inRange) || !blasts.every(inRange)) return fail("An event happened outside the run.");
    if (!sorted(kills, (k) => k[0]) || !sorted(picks, (p) => p[0]) || !sorted(hits, (h) => h) || !sorted(blasts, (b) => b)) return fail("Events are out of order.");
    for (let i = 1; i < blasts.length; i++) if (blasts[i] - blasts[i - 1] < BLAST_CD - 0.05) return fail("The special blast was used faster than its cooldown allows.");

    const sched = createSchedule(seed).take(end + 1);
    const byId = new Map(sched.map((s) => [s.id, s]));
    // pass 1: identity checks + deterministic drops (drops never depend on weapon tier)
    const seen = new Set(), killT = new Map(), drops = new Map(), dstate = newDropState();
    for (const [t, id] of kills) {
      const s = byId.get(id);
      if (!s) return fail("The run reports defeating an enemy that never appeared.");
      if (seen.has(id)) return fail("The same enemy was reported defeated twice.");
      seen.add(id); killT.set(id, t); drops.set(id, dropFor(seed, s, t, dstate));
    }
    // pass 2: pickups (validated in time order); weapon tier timeline comes from collected upgrades
    const pickSeen = new Set(), upTimes = [], hpEvents = hits.map((t) => [t, -1]);
    let score = 0;
    for (const [t, pid] of picks) {
      if (pickSeen.has(pid)) return fail("The same item was collected twice.");
      pickSeen.add(pid);
      const m = /^d(\d+)$/.exec(pid);
      if (!m) return fail("An unknown item was collected.");
      const id = +m[1], kt = killT.get(id), kind = drops.get(id);
      if (kt === undefined || !kind) return fail("An item was collected that was never dropped.");
      if (t < kt - 0.02 || t > kt + PICKUP_LIFE) return fail("An item was collected at an impossible time.");
      if (kind === "up") { if (upTimes.length >= 2) score += MAX_TIER_BONUS; upTimes.push(t); }
      else score += PICK_POINTS[kind] || 0;
      if (kind === "hp") hpEvents.push([t, +1]);
    }
    const tierAt = (t) => Math.min(3, 1 + upTimes.filter((u) => u <= t).length);
    const capUntil = (T) => {
      let total = 0, prev = 0, tier = 1;
      for (const u of upTimes) { if (u >= T) break; total += (u - prev) * TIER_DPS[tier]; prev = u; tier = Math.min(3, tier + 1); }
      return total + (T - prev) * TIER_DPS[tier];
    };
    // pass 3: timing and firepower plausibility, server-side score
    let dmgUsed = 0, elites = 0;
    for (const [t, id, cause] of kills) {
      const s = byId.get(id);
      if (t < s.t + ENTRY_MIN - 0.02) return fail("An enemy was defeated before it entered the screen.");
      if (t > s.t + MAX_LIFE) return fail("An enemy was defeated after it would have left the screen.");
      const bl = blasts.filter((b) => b >= s.t - 1.2 && b <= t);
      let eff = s.hp + s.shield - bl.length * BLAST_DMG;
      if (cause === 1) {
        if (!blasts.some((b) => t >= b && t <= b + 1.2)) return fail("An enemy was credited to a special blast that didn’t happen.");
      } else {
        eff = Math.max(0, eff);
        const tier = tierAt(t), need = Math.max(0, eff - TIER_SHOTS[tier]) / TIER_DPS[tier], have = t - s.t;
        if (have + 0.06 < need) return fail("An enemy was defeated faster than the cannon can fire.");
        dmgUsed += eff;
        if (dmgUsed > capUntil(t) * 1.05 + 8) return fail("More damage was dealt than the cannon can produce.");
      }
      score += s.score; if (s.elite) elites++;
    }
    hpEvents.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    let hp = PLAYER_HP, lastHit = -10, dead = false;
    for (const [t, d] of hpEvents) {
      if (dead) return fail("The run continued after the player was defeated.");
      if (d < 0) { if (t - lastHit < INV_MIN) return fail("Damage was taken during the invulnerability window."); lastHit = t; hp--; if (hp <= 0) dead = true; }
      else hp = Math.min(PLAYER_HP, hp + 1);
    }
    if (!dead) return fail("The run ended before the player ran out of health.");
    if (end - lastHit > 2.5) return fail("The run’s end doesn’t match the final hit.");
    score += milestonePoints(end);
    return { ok: true, score: Math.round(score), kills: kills.length, elites, survival: end };
  }

  return { VERSION, STATS, POOL, POWERUPS, UPGRADES, WAVE_EVERY, waveSpawns, TIER_SHOTS, spawnGap, speedAt, threatLevel, STEP_SECONDS, FIRE_INT, MAX_TIER_BONUS, PLAYER_HP, BLAST_CD, BLAST_DMG, HEAL_CAP, HEAL_WINDOW, PICKUP_LIFE, PICK_POINTS,
    rng, hash01, createSchedule, newDropState, dropFor, milestonePoints, validate };
});
