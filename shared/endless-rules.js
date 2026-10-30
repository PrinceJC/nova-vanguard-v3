/* Endless-mode rules shared by the game (browser) and the ranked-run validator (server).
   Deterministic integer/IEEE arithmetic only (no Math.sin/pow on doubles), so browser and server agree exactly. */
(function (root, factory) {
  const m = factory();
  if (typeof module === "object" && module.exports) module.exports = m; else root.EndlessRules = m;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const VERSION = 11;
  const PLAYER_HP = 3, INV_MIN = 0.9, BLAST_CD = 14, FIRE_INT = 0.15, BLAST_DMG = 10;
  const PICKUP_LIFE = 30, ENTRY_MIN = 0.15, MAX_LIFE = 45;
  const TIER_SHOTS = [0, 1, 3, 6], TIER_DPS = TIER_SHOTS.map((n) => n / FIRE_INT), MAX_TIER_BONUS = 1000;
  const POINTS_PER_TIER = 5, SHIELD_EVERY = 60, SHIELD_FIRST = 30, BLAST_EVERY = 30, BLAST_FIRST = 30;
  const BLAST_START = 1, BLAST_MAX = 3, BLAST_GAP = 1.0;   // stored blast charges: start with 1, hold up to 3, pickups add 1
  const MAX_ON_SCREEN = 50, MAX_STAGE = 4, HIT_CAP = { n: 5, f: 10, a: 15 };   // stages stop growing at 20 min
  const POWERUP_TIME = 10, POWERUP_DMG = 2;
  // Endless bosses: one arrives every 30,000 points; regular spawns pause (and the screen is cleared) during the fight
  const BOSS_EVERY_POINTS = 30000, BOSS_ENTRY = 1.8;
  function bossHp(idx, t) { return Math.ceil(320 * (1 + 0.6 * idx) * (1 + capStageT(t))); }
  function bossBonus(idx) { return 3000 + 1000 * idx; }
  function capStageT(t) { return Math.min(4, Math.floor(t / 300)); }   // bullet power-ups (Comet / Nova / Prism) last 10 s and double damage
  const UPGRADES = [];   // weapon upgrades come only from defeated elites
  const PICK_POINTS = {};   // no point pickups (diamonds removed); max-tier weapon pickups give MAX_TIER_BONUS
  const POWERUPS = ["comet", "nova", "prism"];

  // type: [base hits, shield, score tier, kind]   kind: n basic · f fast · a armored
  // score = 5 × tier. Base hits scale with active time (see hitsFor).
  const STATS = {
    mite: [1, 0, 1, "n"], scout_drone: [1, 0, 1, "n"], wing_bot: [1, 0, 1, "n"], crystal_bat: [1, 0, 1, "n"],
    aqua_drone: [1, 0, 1, "n"], spark_bird: [1, 0, 1, "n"], sand_skimmer: [1, 0, 1, "n"], ice_wisp: [1, 0, 1, "n"],
    dart: [2, 0, 2, "f"],
    bulwark1: [5, 0, 3, "a"], bulwark2: [10, 0, 4, "a"], bulwark3: [15, 0, 5, "a"], bulwark4: [20, 0, 6, "a"],
  };
  const POOL = [
    ["mite", 0, 3], ["scout_drone", 0, 2.5], ["wing_bot", 8, 2], ["crystal_bat", 25, 1.6], ["aqua_drone", 45, 1.4], ["sand_skimmer", 70, 1.3],
    ["spark_bird", 90, 1.3], ["ice_wisp", 120, 1],
    ["bulwark1", 35, 1.3], ["dart", 55, 1.4], ["bulwark2", 100, 1.1], ["bulwark3", 180, 0.9], ["bulwark4", 270, 0.7],
  ];

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

  // ---------------- difficulty curves
  // durability: ×1 under 1 min, ×2 at 1–2 min … ×5 from 4 min (basic enemies capped at 5 hits)
  function minuteMult(t) { return Math.min(5, 1 + Math.floor(t / 60)); }
  // five-minute stages (growth stops at 20 min): enemy count ×2 per stage (max 16×), speed +25% per stage,
  // non-basic durability ×1.5 per stage. Hit caps: basic 5, fast 10, big/armored/elite 15.
  function stageOf(t) { return Math.floor(t / 300); }
  function capStage(t) { return Math.min(MAX_STAGE, stageOf(t)); }
  function pow15(s) { let v = 1; for (let i = 0; i < s; i++) v *= 1.5; return v; }     // exact (3^s / 2^s)
  function pow125(s) { let v = 1; for (let i = 0; i < s; i++) v *= 1.25; return v; }   // exact (5^s / 4^s)
  function countMult(t) { return 1 << capStage(t); }
  // player damage per bullet: ×1, then ×2 at 5 min, ×3 at 10, ×4 at 15, ×5 at 20 (stops growing with the stages)
  function damageMult(t) { return 1 + capStage(t); }
  // bullet power-up damage: ×2, then ×3 at 5 min, ×4 at 10, ×5 at 15, ×6 at 20 (Campaign: at least the world's difficulty step)
  function powerupMult(t, levelStage = 0) { return 2 + Math.max(capStage(t), levelStage); }
  // Blast pickup interval tightens as the crowds grow: 30 s, then 10 s at 5 min, 8 s at 10, 6 s at 15, 5 s from 20
  const BLAST_INTERVALS = [30, 10, 8, 6, 5];
  function blastInterval(t) { return BLAST_INTERVALS[capStage(t)]; }
  function speedAt(t) { const s = capStage(t), f = stageOf(t) >= MAX_STAGE ? 1 : (t - s * 300) / 300; return pow125(s) * (1 + 0.2 * f); }
  function hitsFor(type, t, elite) {
    const st = STATS[type], base = st[0] * (elite ? 2 : 1);
    if (st[3] === "n" && !elite) return Math.min(HIT_CAP.n, base * minuteMult(t));
    const cap = elite ? HIT_CAP.a : HIT_CAP[st[3]];
    return Math.min(cap, Math.ceil(base * minuteMult(t) * pow15(capStage(t)) - 1e-9));
  }
  function pointsFor(type, elite) { return POINTS_PER_TIER * (STATS[type][2] + (elite ? 2 : 0)); }
  const STEP_SECONDS = 20, STEP_FACTOR = 0.92, GAP_START = 3.0, GAP_MIN = 0.9, WAVE_EVERY = 20, LANES = 8;
  function spawnGap(t) { const steps = Math.floor(t / STEP_SECONDS); let g = GAP_START; for (let i = 0; i < steps && g > GAP_MIN; i++) g *= STEP_FACTOR; return Math.max(GAP_MIN, g); }
  function threatLevel(t) { return 1 + Math.floor(t / STEP_SECONDS); }

  function finish(m) { m.t = r3(m.t); if (typeof m.y === "number") m.y = r3(Math.min(0.9, Math.max(0.1, m.y))); m.hp = hitsFor(m.type, m.t, m.elite); m.shield = STATS[m.type][1]; m.score = pointsFor(m.type, m.elite); m.elite = !!m.elite; return m; }

  // Wave n at 20·n s: grows each time; staggered groups of four; two adjacent lanes always open; darts spaced apart.
  // After 5 min every enemy is repeated countMult(t) times, spread further over time in open lanes.
  function waveSpawns(seed, n) {
    const r = rng((seed ^ Math.imul(n + 7, 0x85ebca6b)) >>> 0), t0 = n * WAVE_EVERY, mult = countMult(t0);
    const count = Math.min(34, 6 + n * 2), armoredShare = n >= 2 ? Math.min(0.3, 0.06 * n) : 0, fastShare = n >= 3 ? Math.min(0.2, 0.04 * n) : 0;
    const maxTier = t0 >= 270 ? 4 : t0 >= 180 ? 3 : t0 >= 100 ? 2 : 1;
    const std = POOL.filter((p) => STATS[p[0]][3] === "n" && p[1] <= t0).map((p) => p[0]);
    const gapA = Math.floor(r() * (LANES - 1)), open = [];
    for (let l = 0; l < LANES; l++) if (l !== gapA && l !== gapA + 1) open.push(l);
    const out = []; let lastFast = -9, k = 0, lastDartT = -9;
    const spread = 0.55 / Math.max(1, mult / 2);   // denser groups when multiplied, still staggered
    for (let i = 0; i < count; i++) {
      const x = r(); let type;
      if (x < fastShare && i - lastFast >= 4) { type = "dart"; lastFast = i; }
      else if (x < fastShare + armoredShare) type = "bulwark" + (1 + Math.floor(r() * maxTier));
      else type = std[Math.floor(r() * std.length)];
      const tBase = t0 + 0.4 + Math.floor(k / 4) * spread;
      for (let c = 0; c < (type === "dart" ? Math.min(mult, 4) : mult); c++) {
        const lane = open[Math.floor(r() * open.length)];
        // dart copies are spaced 0.6 s apart so each rush can be read and dodged; other copies stagger more tightly
        let t = type === "dart" ? tBase + 0.2 + c * 0.6 : t0 + 0.4 + Math.floor(k / 4) * spread + r() * 0.25;
        if (type === "dart") { t = Math.max(t, lastDartT + 0.6); lastDartT = t; }
        out.push(finish({ id: 1000000 + n * 10000 + k, t, type, y: 0.12 + lane * (0.76 / (LANES - 1)), wave: n }));
        k++;
      }
    }
    return out;
  }

  function createSchedule(seed) {
    const r = rng(seed);
    let packT = 2, id = 0, nextWave = 1;
    const buf = [];
    function pack() {
      const t = packT, d = t / 60, mult = countMult(t);
      const pool = POOL.filter((p) => p[1] <= t);
      const total = pool.reduce((s, p) => s + p[2], 0);
      const groups = 1 + (d > 3 && r() < 0.5 ? 1 : 0) + (d > 7 && r() < 0.4 ? 1 : 0);
      const made = [];
      for (let gi = 0; gi < groups; gi++) {
        let x = r() * total, type = pool[0][0];
        for (const p of pool) { x -= p[2]; if (x <= 0) { type = p[0]; break; } }
        const st = STATS[type], base = t + gi * 1.4;
        const n = st[3] === "a" ? 1 + (st[0] <= 10 && d > 4 && r() < 0.35 ? 1 : 0) : st[3] === "f" ? 1 + (d > 3 && r() < 0.5 ? 1 : 0) : 2 + Math.floor(Math.min(d, 6) * 0.5) + Math.floor(r() * 2);
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
      for (const m of made) {
        buf.push(finish({ ...m, id: ++id }));
        for (let c = 1; c < mult; c++) buf.push(finish({ id: ++id, t: m.t + c * 0.33, type: m.type, y: (typeof m.y === "number" ? 0.12 + ((m.y - 0.12 + c * 0.29) % 0.76) : m.y) }));
      }
      packT = t + spawnGap(t) + groups * 0.35;
    }
    return {
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

  // Timed pickups (same for every run): a shield every 60 s, a Blast pickup every 20 s.
  function timedPickupsUntil(T) {
    const out = [];
    for (let k = 0; SHIELD_FIRST + k * SHIELD_EVERY <= T; k++) out.push({ id: "sh" + k, kind: "shield", t: SHIELD_FIRST + k * SHIELD_EVERY, y: 0.25 + (k % 3) * 0.25 });
    for (let k = 0, t = BLAST_FIRST; t <= T; k++, t += blastInterval(t)) out.push({ id: "bl" + k, kind: "blast", t, y: 0.3 + (k % 4) * 0.13 });
    return out.sort((a, b) => a.t - b.t);
  }
  function newDropState() { return {}; }
  // enemy drops: elites always drop a weapon upgrade; otherwise only occasional bullet power-ups (no health, no diamonds, no shields)
  function dropFor(seed, spawn) {
    if (spawn.elite) return "up";
    const x = hash01(seed, spawn.id);
    if (x < 0.04) return POWERUPS[Math.floor(hash01(seed ^ 0x5bd1e995, spawn.id) * POWERUPS.length) % POWERUPS.length];
    return null;
  }
  function milestonePoints(survival) { const m = Math.floor(survival / 60); return 125 * m * (m + 1); }

  const fail = (reason) => ({ ok: false, reason });
  const isNum = (v) => typeof v === "number" && isFinite(v);
  function sorted(a, key) { for (let i = 1; i < a.length; i++) if (key(a[i]) < key(a[i - 1])) return false; return true; }

  function validate(seed, ev, elapsed) {
    if (!ev || typeof ev !== "object") return fail("The run data is missing.");
    if (ev.v !== VERSION) return fail("This run was recorded with an outdated game version. Refresh the page and try again.");
    const { end } = ev, kills = ev.kills, picks = ev.picks, hits = ev.hits, blasts = ev.blasts;
    if (!isNum(end) || end < 3 || end > 4 * 3600) return fail("The run length is invalid.");
    if (![kills, picks, hits, blasts].every(Array.isArray)) return fail("The run data is incomplete.");
    if (kills.length > 60000 || picks.length > 5000 || hits.length > 200 || blasts.length > 2000) return fail("The run contains too many events.");
    if (end > elapsed + 5) return fail("The run lasted longer than the time since it started.");
    if (!kills.every((k) => Array.isArray(k) && isNum(k[0]) && Number.isInteger(k[1]) && (k[2] === 0 || k[2] === 1))) return fail("A defeated-enemy record is malformed.");
    if (!picks.every((p) => Array.isArray(p) && isNum(p[0]) && typeof p[1] === "string")) return fail("A pickup record is malformed.");
    if (!hits.every(isNum) || !blasts.every(isNum)) return fail("A damage or blast record is malformed.");
    const inRange = (t) => t >= 0 && t <= end + 0.05;
    if (!kills.every((k) => inRange(k[0])) || !picks.every((p) => inRange(p[0])) || !hits.every(inRange) || !blasts.every(inRange)) return fail("An event happened outside the run.");
    if (!sorted(kills, (k) => k[0]) || !sorted(picks, (p) => p[0]) || !sorted(hits, (h) => h) || !sorted(blasts, (b) => b)) return fail("Events are out of order.");

    // ---- endless bosses: [start, end|null, index]. Regular schedule time pauses while a boss is alive.
    const bosses = Array.isArray(ev.bosses) ? ev.bosses : [];
    if (bosses.length > 200 || !bosses.every((b) => Array.isArray(b) && isNum(b[0]) && (b[1] === null || isNum(b[1])) && Number.isInteger(b[2]))) return fail("A boss record is malformed.");
    for (let i = 0; i < bosses.length; i++) { const [s0, e0, ix] = bosses[i]; if (ix !== i || !inRange(s0) || (e0 !== null && (e0 < s0 || !inRange(e0))) || (e0 === null && i !== bosses.length - 1) || (i && s0 < bosses[i - 1][1])) return fail("The boss timeline is invalid."); }
    const bossEnd = (b) => (b[1] === null ? end : b[1]);
    const pausedBefore = (T) => { let p = 0; for (const b of bosses) { if (b[0] >= T) break; p += Math.min(T, bossEnd(b)) - b[0]; } return p; };
    const clockEnd = end - pausedBefore(end);
    const startClock = bosses.map((b) => b[0] - pausedBefore(b[0]));
    const realSpawn = (st) => { let T = st; for (let i = 0; i < bosses.length; i++) if (startClock[i] < st) T += bossEnd(bosses[i]) - bosses[i][0]; return T; };
    const inBoss = (t) => bosses.some((b) => t > b[0] + 0.02 && t < bossEnd(b) - 0.02);
    const sched = createSchedule(seed).take(clockEnd + 1).map((s) => ({ ...s, rt: realSpawn(s.t) }));
    const byId = new Map(sched.map((s) => [s.id, s]));
    const timed = new Map(timedPickupsUntil(end + 1).map((p) => [p.id, p]));
    const seen = new Set(), killT = new Map(), drops = new Map();
    for (const [t, id] of kills) {
      const s = byId.get(id);
      if (!s) return fail("The run reports defeating an enemy that never appeared.");
      if (seen.has(id)) return fail("The same enemy was reported defeated twice.");
      seen.add(id); killT.set(id, t); drops.set(id, dropFor(seed, s));
    }
    const pickSeen = new Set(), upTimes = [], blastPicks = [];
    let score = 0;
    for (const [t, pid] of picks) {
      if (pickSeen.has(pid)) return fail("The same item was collected twice.");
      pickSeen.add(pid);
      const tp = timed.get(pid);
      if (tp) { if (t < tp.t - 0.02 || t > tp.t + PICKUP_LIFE) return fail("A timed power-up was collected at an impossible time."); if (tp.kind === "blast") blastPicks.push(t); continue; }
      const m = /^d(\d+)$/.exec(pid);
      if (!m) return fail("An unknown item was collected.");
      const id = +m[1], kt = killT.get(id), kind = drops.get(id);
      if (kt === undefined || !kind) return fail("An item was collected that was never dropped.");
      if (t < kt - 0.02 || t > kt + PICKUP_LIFE) return fail("An item was collected at an impossible time.");
      if (kind === "up") { if (upTimes.length >= 2) score += MAX_TIER_BONUS; upTimes.push(t); }
    }
    // stored blast charges: 1 at the start, +1 per Blast pickup (max 3), −1 per blast; waves can't overlap
    { const evs = blastPicks.map((t) => [t, 1]).concat(blasts.map((t) => [t, -1])).sort((a, b) => a[0] - b[0] || b[1] - a[1]);
      let charges = BLAST_START, last = -9;
      for (const [t, d] of evs) {
        if (d > 0) { charges = Math.min(BLAST_MAX, charges + 1); continue; }
        if (charges < 1) return fail("A special blast was used without a stored charge.");
        if (t - last < BLAST_GAP - 0.05) return fail("Special blasts were fired faster than the blast wave allows.");
        charges--; last = t;
      } }
    const tierAt = (t) => Math.min(3, 1 + upTimes.filter((u) => u <= t).length);
    // power-up windows: each collected Comet/Nova/Prism doubles damage for 10 s from collection (re-collecting restarts the timer)
    const puStarts = []; for (const [t, pid] of picks) { const m2 = /^d(\d+)$/.exec(pid); if (m2 && POWERUPS.includes(drops.get(+m2[1]))) puStarts.push(t); }
    const puAt = (t) => puStarts.some((p) => t >= p && t < p + POWERUP_TIME);
    const rateAt = (t) => TIER_DPS[tierAt(t)] * damageMult(t) * (puAt(t) ? powerupMult(t) : 1);
    const bps = [...new Set([0, ...upTimes, ...puStarts, ...puStarts.map((p) => p + POWERUP_TIME), 300, 600, 900, 1200])].sort((a, b) => a - b);
    const capUntil = (T) => { let total = 0; for (let i = 0; i < bps.length && bps[i] < T; i++) { const a = bps[i], b = Math.min(T, i + 1 < bps.length ? bps[i + 1] : T); if (b > a) total += (b - a) * rateAt(a); } return total; };
    const maxRate = (a, b) => { let m = rateAt(a); for (const p of bps) if (p > a && p <= b) m = Math.max(m, rateAt(p)); return m; };
    let dmgUsed = 0, elites = 0;
    for (const [t, id, cause] of kills) {
      const s = byId.get(id);
      if (t < s.rt + ENTRY_MIN - 0.02) return fail("An enemy was defeated before it entered the screen.");
      if (t > s.rt + MAX_LIFE) return fail("An enemy was defeated after it would have left the screen.");
      if (inBoss(t)) return fail("A regular enemy was defeated during a boss fight.");
      const bl = blasts.filter((b) => b >= s.rt - 1.5 && b <= t);
      let eff = s.hp + s.shield - bl.length * BLAST_DMG;
      if (cause === 1) {
        if (!blasts.some((b) => t >= b && t <= b + 1.5)) return fail("An enemy was credited to a special blast that didn’t happen.");
      } else {
        eff = Math.max(0, eff);
        const mr = maxRate(s.rt, t), need = Math.max(0, eff - mr * FIRE_INT) / mr, have = t - s.rt;
        if (have + 0.06 < need) return fail("An enemy was defeated faster than the cannon can fire.");
        dmgUsed += eff;
        if (dmgUsed > capUntil(t) * 1.05 + 8) return fail("More damage was dealt than the cannon can produce.");
      }
      score += s.score; if (s.elite) elites++;
    }
    { // rebuild the score timeline to check when each boss was due
      const evs = [];
      for (const [t, id] of kills) evs.push([t, byId.get(id).score]);
      for (let m = 1; m * 60 <= end; m++) evs.push([m * 60, 250 * m]);
      let ups = 0; for (const [t, pid] of picks) { const mm = /^d(\d+)$/.exec(pid); if (mm && drops.get(+mm[1]) === "up") { if (ups >= 2) evs.push([t, MAX_TIER_BONUS]); ups++; } }
      bosses.forEach((b, i) => { if (b[1] !== null) evs.push([b[1], bossBonus(i)]); });
      evs.sort((a, b) => a[0] - b[0]);
      let cum = 0, k = 0; const crossing = [];
      for (const [t, pts] of evs) { cum += pts; while (cum >= (crossing.length + 1) * BOSS_EVERY_POINTS) crossing.push(t); }
      for (let i = 0; i < bosses.length; i++) {
        const due = Math.max(crossing[i] ?? Infinity, i ? bosses[i - 1][1] : 0);
        if (!(bosses[i][0] >= due - 0.02 && bosses[i][0] <= due + 0.15)) return fail("A boss appeared at the wrong time.");
        if (bosses[i][1] !== null) {
          const s0 = bosses[i][0], e0 = bosses[i][1], hpB = bossHp(i, s0), bl = blasts.filter((b) => b >= s0 && b <= e0).length;
          const need = Math.max(0, hpB - bl * 14) / maxRate(s0, e0);
          if (e0 - s0 - BOSS_ENTRY + 0.15 < need) return fail("A boss was defeated faster than the cannon can fire.");
          score += bossBonus(i);
        }
      }
      if (crossing.length > bosses.length && crossing[bosses.length] < end - 0.2 && (bosses.length === 0 || bosses[bosses.length - 1][1] !== null)) return fail("A boss that was due never appeared.");
    }
    let hp = PLAYER_HP, lastHit = -10, dead = false;
    for (const t of hits) {   // no healing exists: exactly three hits end the run
      if (dead) return fail("The run continued after the player was defeated.");
      if (t - lastHit < INV_MIN) return fail("Damage was taken during the invulnerability window.");
      lastHit = t; hp--; if (hp <= 0) dead = true;
    }
    if (!dead) return fail("The run ended before the player ran out of lives.");
    if (end - lastHit > 2.5) return fail("The run’s end doesn’t match the final hit.");
    score += milestonePoints(end);
    return { ok: true, score: Math.round(score), kills: kills.length, elites, survival: end };
  }

  return { VERSION, BOSS_EVERY_POINTS, BOSS_ENTRY, bossHp, bossBonus, BLAST_START, BLAST_MAX, BLAST_FIRST, MAX_ON_SCREEN, HIT_CAP, MAX_STAGE, STATS, POOL, POWERUPS, UPGRADES, TIER_SHOTS, FIRE_INT, MAX_TIER_BONUS, PLAYER_HP, BLAST_CD, BLAST_DMG, PICKUP_LIFE, PICK_POINTS,
    WAVE_EVERY, STEP_SECONDS, SHIELD_EVERY, BLAST_EVERY, rng, hash01, createSchedule, waveSpawns, timedPickupsUntil, newDropState, dropFor, milestonePoints, validate,
    spawnGap, speedAt, threatLevel, minuteMult, stageOf, capStage, countMult, damageMult, powerupMult, blastInterval, BLAST_INTERVALS, POWERUP_TIME, POWERUP_DMG, hitsFor, pointsFor, pow15, pow125 };
});
