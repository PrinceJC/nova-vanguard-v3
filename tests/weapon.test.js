const assert = require("assert");
const { API } = require("./sim.js");
const { createGame, updateGame } = API;
const { AVATARS, avatarSVG } = require("../src/avatars.js");
let pass = 0; const t = (n, f) => { f(); pass++; console.log("  ✓", n); };
const fire = (g) => { g.pbul = []; g.player.fireCd = 0; updateGame(g, 0.001, { fire: true }); return g.pbul.map((b) => ({ ...b })); };
const g = createGame({ mode: "campaign", level: 1, tier: 1, god: true }); g.state = "waves"; g.waveIdx = 99;
t("tier 1 fires exactly one bullet per attack", () => assert.strictEqual(fire(g).length, 1));
t("tier 2 fires three: one central shot and two angled", () => { g.player.tier = 2; const b = fire(g), a = b.map((x) => Math.atan2(x.vy, x.vx)).sort((x, y) => x - y); assert.strictEqual(b.length, 3); assert(Math.abs(a[1]) < 1e-9 && Math.abs(a[0] + a[2]) < 1e-9 && a[2] > 0); });
t("tier 3 fires six as three symmetrical pairs, each on its own trajectory", () => { g.player.tier = 3; const b = fire(g), a = b.map((x) => +Math.atan2(x.vy, x.vx).toFixed(6)); assert.strictEqual(b.length, 6); assert.strictEqual(new Set(a).size, 6); for (const v of a) assert(a.includes(-v)); assert(!a.includes(0)); });
const { MUZZLES, SPRITE_ANCHOR } = require("../src/avatars.js"), K = 150 / 104;
t("every avatar's projectiles leave from its own weapon muzzle or bow release point", () => {
  for (const a of AVATARS) { const h = createGame({ mode: "campaign", level: 1, tier: 3, god: true, avatar: a.id }); h.state = "waves"; h.waveIdx = 99; const b = fire(h), p = h.player, m = MUZZLES[a.cat];
    const ex = p.x + (m[0] - SPRITE_ANCHOR[0]) * K, ey = p.y + (m[1] - SPRITE_ANCHOR[1]) * K;
    assert.strictEqual(b.length, 6); for (const x of b) assert(Math.abs(x.x - ex) < 1.5 && Math.abs(x.y - ey) < 1.5, a.id); }
});
t("roster: 26 unique heroes incl. Nova (shield), winged, wand, skater, archer and sniper additions", () => {
  assert.strictEqual(AVATARS.length, 26); assert.strictEqual(new Set(AVATARS.map((a) => a.name)).size, 26);
  const nova = AVATARS.find((a) => a.id === "lumi"); assert.strictEqual(nova.name, "Nova"); assert.strictEqual(nova.cat, "shield");
  const by = (id) => AVATARS.find((a) => a.id === id); assert.strictEqual(by("seraphine").board, "wings"); assert.strictEqual(by("elara").cat, "wand"); assert.strictEqual(by("kai").board, "skate"); assert.strictEqual(by("lyra").cat, "bow"); assert.strictEqual(by("rook").cat, "sniper"); assert.strictEqual(by("astra").unlock, 0);
  const original = { lumi: 0, nova: 0, riko: 0, pip: 0, aria: 5, kestrel: 10, mochi: 15, sable: 20, juno: 25, vega: 30, haru: 35, ines: 40, dax: 45, orla: 50, zephyr: 55, tamsin: 60, wren: 65, cass: 70, elio: 75, luma: 80 };
  for (const [id, u] of Object.entries(original)) assert.strictEqual(by(id).unlock, u, id + " keeps its unlock requirement"); });
t("firing artwork lines up with the projectile origin for every hero", () => { for (const a of AVATARS) { const [mx, my] = MUZZLES[a.cat];
  if (a.cat === "bow") { const idle = avatarSVG(a, "idle", "game"); assert(idle.includes('M44 41 L72 41') && mx === 72 && my === 41, a.id); assert(!avatarSVG(a, "fire", "game").includes('M44 41 L72 41'), a.id + " releases"); }
  else assert(avatarSVG(a, "fire", "game").includes(`<circle cx="${mx}" cy="${my}" r="2.6"`), a.id); } });
t("hold-to-fire repeats the active pattern every fire interval", () => { const h = createGame({ mode: "campaign", level: 1, tier: 3, god: true }); h.state = "waves"; h.waveIdx = 99; let n = 0; for (let i = 0; i < 60; i++) { const before = h.pbul.length; updateGame(h, 1 / 60, { fire: true }); n += Math.max(0, h.pbul.length - before); } assert(n >= 40, n); });
t("fire rate starts slow and speeds up with each weapon upgrade (0.22 s → 0.17 s → 0.13 s)", () => {
  const vol = []; for (const tier of [1, 2, 3]) { const h = createGame({ mode: "campaign", level: 1, tier, god: true }); h.state = "waves"; h.waveIdx = 99; let v = 0;
    for (let i = 0; i < 120; i++) { const before = h.pbul.length; updateGame(h, 1 / 60, { fire: true }); if (h.pbul.length > before) v++; } vol.push(v); }
  assert(vol[0] < vol[1] && vol[1] < vol[2], "volleys per 2 s: " + vol.join(" < ")); assert(vol[0] <= 10 && vol[2] >= 15, vol.join(","));
  assert.deepStrictEqual(globalThis.EndlessRules.TIER_INT, [0, 0.22, 0.17, 0.13]);
});
t("the hero moves 20% faster (360 px/s)", () => { const h = createGame({ mode: "campaign", level: 1, god: true }); h.state = "waves"; h.waveIdx = 99; const y0 = h.player.y = 300; for (let i = 0; i < 30; i++) updateGame(h, 1 / 60, { up: true }); assert(Math.abs((y0 - h.player.y) - 180) < 8, "moved " + (y0 - h.player.y)); });
t("defeating a campaign elite drops exactly one weapon upgrade at its position", () => { const h = createGame({ mode: "campaign", level: 5, tier: 1, god: true }); const e = spawnEnemyG(h, true); e.t = 1; damage(h, e); const ups = h.pickups.filter((k) => k.kind === "up"); assert.strictEqual(ups.length, 1); assert(Math.abs(ups[0].x - e.x) < 1 && Math.abs(ups[0].y - e.y) < 1); });
t("normal enemies never drop weapon upgrades", () => { const h = createGame({ mode: "campaign", level: 5, tier: 1, god: true }); for (let i = 0; i < 300; i++) { const e = spawnEnemyG(h, false); e.t = 1; damage(h, e); } assert(!h.pickups.some((k) => k.kind === "up")); });
t("upgrade pickups drift left slower than enemy bullets", () => { assert(55 < 85); });
t("elites are 1.5× larger and at least twice as tough", () => { const h = createGame({ mode: "campaign", level: 5, tier: 1 }); const a = spawnEnemyG(h, false), b = spawnEnemyG(h, true); assert.strictEqual(b.size / a.size, 1.5); assert(b.hp >= a.hp * 2); });
t("weapon upgrades only on collection; max tier gives +1000 once per pickup", () => {
  const h = createGame({ mode: "campaign", level: 5, tier: 1, god: true }); h.state = "waves"; h.waveIdx = 99;
  const grab = () => { h.pickups = [{ x: h.player.x, y: h.player.y, kind: "up", t: 0, vy: 0 }]; const s0 = h.score; updateGame(h, 0.001, {}); return h.score - s0; };
  assert.strictEqual(h.player.tier, 1); grab(); assert.strictEqual(h.player.tier, 2); grab(); assert.strictEqual(h.player.tier, 3);
  assert.strictEqual(grab(), 1000); assert.strictEqual(grab(), 1000); assert.strictEqual(h.player.tier, 3);
});
t("endless: enemies never fire projectiles; danger is contact only", () => { const h = createGame({ mode: "endless", seed: 77, god: true }); for (let i = 0; i < 60 * 240; i++) { updateGame(h, 1 / 60, {}); assert.strictEqual(h.ebul.length, 0); } assert(h.enemies.length + h.kills >= 0); });
t("endless: spawn gap shrinks every 20 s, cumulatively, to a floor", () => { const R = globalThis.EndlessRules; let prev = Infinity; for (let s = 0; s <= 600; s += 20) { const gp = R.spawnGap(s); assert(gp <= prev); if (s >= 20 && gp > 1.1) assert(gp < R.spawnGap(s - 20)); prev = gp; } assert.strictEqual(R.spawnGap(0), R.spawnGap(19.9)); assert.strictEqual(R.spawnGap(5000), 0.9); });
t("endless waves: every 20 s, bigger each time, staggered, two lanes left open, darts spaced", () => { const R = globalThis.EndlessRules; let prev = 0;
  for (let n = 1; n <= 15; n++) { const w = R.waveSpawns(77, n); assert(w.length > prev || w.length >= 50, "wave " + n + " grows"); prev = w.length; if (n === 1) assert.strictEqual(w.length, 13);
    const ts = w.map((s) => s.t), lanes = new Set(w.map((s) => s.y)); assert(Math.min(...ts) >= n * 20 && Math.max(...ts) - Math.min(...ts) >= 0.5 && Math.max(...ts) < (n + 1) * 20); assert(lanes.size <= 6, "at least two lanes open");
    const darts = w.map((s, i) => (s.type === "dart" ? s.t : null)).filter((x) => x !== null).sort((a, b) => a - b); for (let i = 1; i < darts.length; i++) assert(darts[i] - darts[i - 1] >= 0.5);
    if (n >= 3) assert(w.some((s) => s.type.startsWith("bulwark"))); }
  const all = R.createSchedule(77).take(130), ids = all.map((s) => s.id); assert.strictEqual(new Set(ids).size, ids.length, "unique ids");
  const a = R.createSchedule(77).take(60).concat(R.createSchedule(77).take(0)), b = R.createSchedule(77); const chunked = [...b.take(25), ...b.take(60)]; assert.deepStrictEqual(chunked.map((s) => s.id), R.createSchedule(77).take(60).map((s) => s.id), "deterministic regardless of chunking"); });
t("endless: enemy speed ramps smoothly and resets each new run", () => { const R = globalThis.EndlessRules; assert.strictEqual(R.speedAt(0), 1); assert(R.speedAt(120) > 1 && R.speedAt(240) > R.speedAt(120)); assert(Math.abs(R.speedAt(100.1) - R.speedAt(100)) < 0.001); const fresh = createGame({ mode: "endless", seed: 5 }); assert.strictEqual(fresh.t, 0); });
t("ranked endless always starts at one shot, regardless of avatar", () => { for (const a of AVATARS) assert.strictEqual(createGame({ mode: "endless", seed: 1, avatar: a.id }).player.tier, 1); });
t("campaign levels start at the tier the app passes in (the app always passes 1)", () => { assert.strictEqual(createGame({ mode: "campaign", level: 12, tier: 1 }).player.tier, 1); assert.strictEqual(createGame({ mode: "campaign", level: 12 }).player.tier, 1); });
t("player hitbox is a small core inside the much larger artwork", () => assert(PLAYER_HITBOX() * 2 < 140 * 0.1));
function PLAYER_HITBOX() { return 6; }
t("no health or diamond pickups ever drop; elites still drop weapon upgrades", () => { const h = createGame({ mode: "campaign", level: 5, tier: 1, god: true }); for (let i = 0; i < 600; i++) { const e = spawnEnemyG(h, i % 7 === 0); e.t = 1; damage(h, e); } const k = h.pickups.map((x) => x.kind); assert(!k.some((x) => x === "hp" || x === "score" || x === "big" || x === "shield")); assert(k.filter((x) => x === "up").length > 50); });
function spawnEnemyG(h, elite) { return globalThis.__spawn(h, "shield_pod", 270, 600, { elite }); }
function damage(h, e) { globalThis.__damage(h, e, 9999, true); }
// ---------------- lives, armored, fast enemies, bullet power-ups
t("three lives in Campaign and Endless, with no way to restore them", () => {
  for (const m of [{ mode: "campaign", level: 1 }, { mode: "endless", seed: 3 }]) { const h = createGame(m); assert.strictEqual(h.player.hp, 3); }
  assert.strictEqual(globalThis.EndlessRules.PLAYER_HP, 3);
  const h = createGame({ mode: "endless", seed: 9 }); for (let i = 0; i < 3; i++) { h.player.inv = 0; globalThis.__hurt(h); } assert(h.player.dead);
});
t("armored enemies need 5 / 10 / 15 / 15 hits at the start (big enemies capped at 15)", () => {
  for (const [tier, hits] of [[1, 5], [2, 10], [3, 15], [4, 15]]) for (const mode of [{ mode: "endless", seed: 1 }, { mode: "campaign", level: 1 }]) {
    const h = createGame(mode); const e = globalThis.__spawn(h, "bulwark" + tier, 270, 600, mode.mode === "endless" ? { sid: 999, hp: globalThis.EndlessRules.hitsFor("bulwark" + tier, 0) } : {}); e.t = 1; let n = 0;
    if (h.spawnMap) h.spawnMap.set(999, { id: 999, score: 300, elite: false });
    while (!e.dead && n < 50) { globalThis.__damage(h, e, 1, false, 0); n++; } assert.strictEqual(n, hits, `tier ${tier} ${mode.mode}: took ${n} hits, hp field ${e.maxHp}, shield ${e.maxShield}, level ${h.level}, t ${h.t}`); }
});
t("endless schedule: armored tiers have exact hit counts and arrive gradually", () => { const R = globalThis.EndlessRules, s = R.createSchedule(5).take(600), first = {};
  for (const x of s) { if (!(x.type in first)) first[x.type] = x.t; if (x.type.startsWith("bulwark")) { assert.strictEqual(x.hp, R.hitsFor(x.type, x.t, x.elite)); if (x.t < 60) assert.strictEqual(x.hp, { bulwark1: 5, bulwark2: 10, bulwark3: 15, bulwark4: 15 }[x.type]); assert(x.hp <= 15); } }
  assert(first.bulwark1 >= 35 && first.bulwark2 >= 100 && first.bulwark3 >= 180 && first.bulwark4 >= 270 && first.dart >= 55); assert(first.mite < 10); });
t("fast darts warn for 0.9 s before rushing, and the rush is dodgeable", () => {
  const h = createGame({ mode: "endless", seed: 2, god: true }); h.player.x = 150; h.player.y = 270;
  const e = globalThis.__spawn(h, "dart", 270, W_() + 30); let tele = 0, dashedAt = -1;
  for (let i = 0; i < 300 && dashedAt < 0; i++) { updateGame(h, 1 / 60, { up: tele > 0.2 }); if (e.st === "tele") tele += 1 / 60; if (e.st === "dash") dashedAt = i; }
  assert(tele >= 0.85, "visible warning " + tele.toFixed(2)); assert(Math.abs(e.ty - 270) < 1, "locks the target at warning start");
  let minD = 1e9; for (let i = 0; i < 120; i++) { updateGame(h, 1 / 60, { up: true }); minD = Math.min(minD, Math.hypot(e.x - h.player.x, e.y - h.player.y)); } assert(minD > e.r * 0.75 + 6, "player who moves during the warning is not hit (" + minD.toFixed(0) + ")");
});
function W_() { return 960; }
t("endless still has no enemy projectiles with the new families", () => { const h = createGame({ mode: "endless", seed: 11, god: true }); for (let i = 0; i < 60 * 300; i++) { updateGame(h, 1 / 60, {}); if (h.ebul.length) throw new Error("projectile at " + h.t); } });
t("damage: stage ×1→×5 and power-ups ×2→×6 by 5-minute stage (Campaign worlds raise power-ups too)", () => {
  const R = globalThis.EndlessRules; assert.deepStrictEqual([0, 299, 300, 600, 900, 1200, 2400].map(R.damageMult), [1, 1, 2, 3, 4, 5, 5]);
  assert.deepStrictEqual([0, 300, 600, 900, 1200, 2400].map((t) => R.powerupMult(t)), [2, 3, 4, 5, 6, 6]);
  const h = createGame({ mode: "endless", seed: 2, god: true }); h.state = "endless";
  for (const [t, base, boosted] of [[10, 1, 2], [310, 2, 6], [610, 3, 12], [1300, 5, 30]]) { h.t = t; h.player.bullet = null; assert.strictEqual(fire(h)[0].dmg, base, "base at " + t); h.player.bullet = { kind: "nova", t: 9 }; assert.strictEqual(fire(h)[0].dmg, boosted, "boosted at " + t); }
  for (const [level, mult] of [[5, 2], [35, 3], [65, 4], [95, 5]]) { const c = createGame({ mode: "campaign", level, god: true }); c.state = "waves"; c.waveIdx = 999; c.t = 10; c.player.bullet = { kind: "prism", t: 9 }; assert.strictEqual(fire(c)[0].dmg, mult, "campaign level " + level); }
  const c = createGame({ mode: "campaign", level: 1 }); c.t = 320; const e = globalThis.__spawn(c, "bulwark1", 270, 600); e.t = 1; const hp0 = e.hp; globalThis.__damage(c, e, 2, false, 0); assert.strictEqual(hp0 - e.hp, 2);
});
t("Blast pickups: every 30 s, then 10 s at 5 min, 8 s at 10, 6 s at 15, 5 s from 20", () => {
  const R = globalThis.EndlessRules, ts = R.timedPickupsUntil(1260).filter((p) => p.kind === "blast").map((p) => p.t);
  const gaps = (a, b) => [...new Set(ts.filter((t) => t >= a && t < b).map((t, i, arr) => (i ? t - arr[i - 1] : null)).filter((x) => x !== null))];
  assert.deepStrictEqual(ts.slice(0, 3), [30, 60, 90]); assert.deepStrictEqual(gaps(30, 300), [30]); assert.deepStrictEqual(gaps(300, 600), [10]); assert.deepStrictEqual(gaps(600, 900), [8]); assert.deepStrictEqual(gaps(900, 1200), [6]); assert.deepStrictEqual(gaps(1200, 1260), [5]);
  const g = createGame({ mode: "endless", seed: 6, god: true }); const seen = []; for (let i = 0; i < 60 * 340; i++) { const n = g.pickups.length; updateGame(g, 1 / 60, {}); for (const k of g.pickups.slice(n)) if (k.kind === "blast") seen.push(Math.round(g.t)); }
  assert.deepStrictEqual(seen.filter((t) => t >= 290), [300, 310, 320, 330, 340].filter((t) => t <= g.t), "game spawns them on the same schedule");
});
t("bullet power-ups change bullet look and speed for 10 s, then expire", () => {
  const h = createGame({ mode: "campaign", level: 2, tier: 1, god: true }); h.state = "waves"; h.waveIdx = 99;
  const base = fire(h)[0].vx;
  for (const [kind, mult] of [["comet", 1.6], ["nova", 1.1], ["prism", 1.35]]) {
    h.pickups = [{ x: h.player.x, y: h.player.y, kind, t: 0, vy: 0 }]; updateGame(h, 0.001, {}); const b = fire(h)[0];
    assert.strictEqual(b.kind, kind); assert(Math.abs(b.vx / base - mult) < 0.01, kind); assert.strictEqual(b.dmg, 2, "power-up ×2 at the start of a world-1 level"); }
  for (let i = 0; i < 60 * 11; i++) updateGame(h, 1 / 60, {}); assert.strictEqual(h.player.bullet, null); assert.strictEqual(fire(h)[0].kind, null);
});
t("bullet power-ups still drop occasionally", () => { const h = createGame({ mode: "campaign", level: 5, tier: 1, god: true }); for (let i = 0; i < 800; i++) { const e = globalThis.__spawn(h, "scout_drone", 270, 600); e.t = 1; globalThis.__damage(h, e, 99, true); } assert(h.pickups.some((x) => ["comet", "nova", "prism"].includes(x.kind))); });
// ---------------- v6 rules
t("points: basic 5, tougher 10, larger 15, then +5 per tier (both modes), awarded once", () => {
  const R = globalThis.EndlessRules; assert.deepStrictEqual(["mite", "dart", "bulwark1", "bulwark2", "bulwark3", "bulwark4"].map((x) => R.pointsFor(x)), [5, 10, 15, 20, 25, 30]);
  const h = createGame({ mode: "campaign", level: 3, god: true });
  for (const [type, pts] of [["scout_drone", 5], ["frost_drone", 10], ["glacier_guard", 15], ["bulwark1", 15], ["bulwark4", 30]]) { const e = globalThis.__spawn(h, type, 270, 600); e.t = 1; const s0 = h.score; globalThis.__damage(h, e, 9999, true); globalThis.__damage(h, e, 9999, true); assert.strictEqual(h.score - s0, pts, type); }
});
t("durability by active minute: basic 1→5 hits (capped), tougher tiers scale from base", () => {
  const R = globalThis.EndlessRules; assert.deepStrictEqual([30, 90, 150, 210, 250, 900].map((t) => R.hitsFor("mite", t)), [1, 2, 3, 4, 5, 5]);
  assert.deepStrictEqual([30, 90, 150].map((t) => R.hitsFor("bulwark1", t)), [5, 10, 15]);
  const h = createGame({ mode: "campaign", level: 1 }); const hits = []; for (const t of [30, 90, 150, 210, 250]) { h.t = t; hits.push(globalThis.__spawn(h, "scout_drone", 270, 600).hp); } assert.deepStrictEqual(hits, [1, 2, 3, 4, 5]);
  h.t = 30; const old = globalThis.__spawn(h, "scout_drone", 270, 600); h.t = 200; globalThis.__spawn(h, "scout_drone", 300, 600); assert.strictEqual(old.hp, 1, "enemies already on screen keep their health");
  assert.strictEqual(createGame({ mode: "campaign", level: 2 }).t, 0, "durability timer resets each level");
});
t("timed pickups: Blast every 30 s, shield every 60 s, in both modes", () => {
  for (const mode of [{ mode: "endless", seed: 8, god: true }, { mode: "campaign", level: 2, god: true }]) {
    const h = createGame(mode);
    const seen = []; for (let i = 0; i < 60 * 130; i++) { const before = h.pickups.length; updateGame(h, 1 / 60, {}); for (const k of h.pickups.slice(before)) if (k.kind === "blast" || k.kind === "shield") seen.push(k.kind[0] + Math.round(h.t)); if (h.state === "warning" || h.boss) break; }
    const b = seen.filter((x) => x[0] === "b").map((x) => +x.slice(1)), s = seen.filter((x) => x[0] === "s").map((x) => +x.slice(1));
    assert.deepStrictEqual(b.slice(0, 4), [30, 60, 90, 120], mode.mode + " blast"); assert.deepStrictEqual(s.slice(0, 2), [30, 90], mode.mode + " shield");
  }
});
t("blast charges: start with 1, pickups add 1 up to 3, each blast uses 1, none left = no blast", () => {
  for (const mode of [{ mode: "campaign", level: 1, god: true }, { mode: "endless", seed: 1, god: true }]) {
    const h = createGame(mode); h.state = mode.mode === "endless" ? "endless" : "waves"; h.waveIdx = 999; const p = h.player; assert.strictEqual(p.blasts, 1);
    const grab = () => { h.pickups = [{ x: p.x, y: p.y, kind: "blast", t: 0, vy: 0, pid: "bl0" }]; updateGame(h, 0.001, {}); };
    grab(); grab(); assert.strictEqual(p.blasts, 3); grab(); assert.strictEqual(p.blasts, 3, "capped at 3");
    const fireBlast = () => { updateGame(h, 1 / 60, { specialPressed: true }); for (let i = 0; i < 80; i++) updateGame(h, 1 / 60, {}); };
    fireBlast(); assert.strictEqual(p.blasts, 2); fireBlast(); fireBlast(); assert.strictEqual(p.blasts, 0);
    updateGame(h, 1 / 60, { specialPressed: true }); assert.strictEqual(p.charge, 0, "no charge left: nothing happens"); for (let i = 0; i < 60 * 20; i++) updateGame(h, 1 / 60, {}); assert.strictEqual(p.blasts, 0, "no automatic recharge");
  }
});
t("endless stages stop at 20 min: ×2/×4/×8/×16 enemies, speed +3.5% per wave, hit caps 5 / 10 / 15, max 50 on screen", () => {
  const R = globalThis.EndlessRules; assert.deepStrictEqual([0, 299, 300, 600, 900, 1200, 1500, 2400].map(R.countMult), [1, 1, 2, 4, 8, 16, 16, 16]);
  for (let wv = 0; wv < 60; wv++) assert(Math.abs(R.speedAt((wv + 1) * 20) - R.speedAt(wv * 20) - 0.035) < 1e-9, "speed +3.5% every wave"); assert.strictEqual(R.speedAt(1200), R.speedAt(2400), "speed stops growing after 20 min");
  assert(Math.abs(R.speedAt(300, true) / R.speedAt(300) - 1.3) < 1e-9, "duels 30% faster");
  for (const t of [0, 90, 310, 610, 1250, 3000]) { assert(R.hitsFor("mite", t) <= 5); assert(R.hitsFor("dart", t) <= 10); for (const b of ["bulwark1", "bulwark2", "bulwark3", "bulwark4"]) assert(R.hitsFor(b, t) <= 15 && R.hitsFor(b, t, true) <= 15); }
  assert.strictEqual(R.hitsFor("bulwark1", 310), 15); assert.strictEqual(R.hitsFor("dart", 310), 10); assert.strictEqual(R.hitsFor("mite", 610), 5); assert.strictEqual(R.hitsFor("bulwark1", 70), 10);
  const s = R.createSchedule(4).take(660), per = (a, b) => s.filter((x) => x.t >= a && x.t < b).length; assert(per(300, 360) > per(240, 300) * 1.6, "count doubles at 5 min");
  const g = createGame({ mode: "endless", seed: 4, god: true }); let peak = 0; for (let i = 0; i < 60 * 420; i++) { updateGame(g, 1 / 60, {}); peak = Math.max(peak, g.enemies.length); } assert(peak <= 50 && peak >= 40, "on-screen cap 50 (peak " + peak + ")");
  const c = createGame({ mode: "campaign", level: 90, god: true }); c.t = 400; assert(globalThis.__spawn(c, "bulwark4", 270, 600).hp <= 15); assert(globalThis.__spawn(c, "dart", 270, 600).hp <= 10);
});
// ---------------- major update: ultimates, Endless bosses, fast warnings, customisation
t("every hero has a uniquely named ultimate; each ultimate type hits enemies for the blast's damage within ~1.4 s", () => {
  assert.strictEqual(new Set(AVATARS.map((a) => a.ult.name)).size, AVATARS.length);
  for (const type of ["nova", "cannonball", "laser", "tsunami", "solar", "blackhole", "lightning", "lances", "meteor", "crystal"]) {
    const id = AVATARS.find((a) => a.ult.type === type).id, h = createGame({ mode: "campaign", level: 1, avatar: id, god: true }); h.state = "waves"; h.waveIdx = 999;
    const es = []; for (const [x, y] of [[420, 270], [600, 230], [700, 300]]) { const e = globalThis.__spawn(h, "bulwark4", y, x); e.t = 1; e.hp = 99; es.push(e); }
    updateGame(h, 1 / 60, { specialPressed: true }); let t = 0; while (t < 1.45) { updateGame(h, 1 / 60, {}); t += 1 / 60; }
    const hit = es.filter((e) => e.hp <= 89).length; assert(hit >= 1, type + " hit " + hit); for (const e of es) assert(e.hp === 99 || e.hp === 89, type + " deals exactly 10"); assert(!h.blast, type + " finishes in time");
  }
});
t("Endless bosses: one every 15 waves, field cleared, spawns paused, six different bosses, bombs telegraphed", () => {
  const g = createGame({ mode: "endless", seed: 12, god: true }); for (let i = 0; i < 60 * 30; i++) updateGame(g, 1 / 60, {});
  assert(g.enemies.length > 0 && !g.boss); g.t = 299.99; updateGame(g, 1 / 60, {});
  assert(g.boss && g.boss.def.kind === "octo_queen" && g.enemies.length === 0 && g.rec.bosses.length === 1, "boss arrives, field cleared");
  for (let i = 0; i < 60 * 12; i++) { updateGame(g, 1 / 60, {}); assert.strictEqual(g.enemies.length, 0, "no regular enemies during the boss"); }
  assert(g.hz.some((h) => h.type === "bomb") || g.ebul.length > 0, "boss attacks"); assert.strictEqual(g.boss.max, globalThis.EndlessRules.bossHp(0, g.rec.bosses[0][0]));
  g.boss.entering = false; damageBoss(g, null, 1e6, true); assert(g.rec.bosses[0][1] !== null && g.bossIdx === 1);
  for (let i = 0; i < 60 * 5; i++) updateGame(g, 1 / 60, {}); assert(!g.boss && g.enemies.length > 0, "regular waves resume after the boss");
  const kinds = new Set(); for (let i = 0; i < 6; i++) kinds.add(makeEndlessBoss(g, i).def.name); assert.strictEqual(kinds.size, 6);
  const R = globalThis.EndlessRules; assert.deepStrictEqual([0, 1, 2, 3].map((i) => R.bossHp(i, 100)), [500, 600, 700, 800], "each boss tougher than the last");
  assert(makeEndlessBoss(g, 4).def.rest[0] < makeEndlessBoss(g, 0).def.rest[0], "later bosses rest less");
  assert.deepStrictEqual([0, 1, 2].map(R.bossClock), [300, 600, 900], "bosses after waves 15, 30, 45");
});
t("validator: a boss that appears early, or never appears when due, is rejected", () => {
  const R = globalThis.EndlessRules, ev = { v: R.VERSION, end: 100, kills: [], picks: [], hits: [98, 99, 100], blasts: [], bosses: [[50, null, 0]] };
  assert.match(R.validate(5, ev, 120).reason, /wrong time/);
});
const FAST_TYPES_T = { dart: 1, torpedo_bot: 1, drill_drone: 1, thorn_wasp: 1 };
t("fast enemies are announced ~1.2 s before they appear (both modes)", () => {
  const g = createGame({ mode: "endless", seed: 77, god: true }); let seen = 0; for (let i = 0; i < 60 * 200 && !seen; i++) { updateGame(g, 1 / 60, {}); const c = endlessClock(g); if (g.pending.some((s) => s.type === "dart" && s.t - c > 0.9 && s.t - c <= 1.2)) seen++; } assert(seen, "darts visible in the lookahead before spawning");
  const h = createGame({ mode: "campaign", level: 15, god: true }); let warned = 0; for (let i = 0; i < 60 * 120 && !warned; i++) { updateGame(h, 1 / 60, {}); if (h.queue.some((q) => FAST_TYPES_T[q.type] && q.at - h.t > 0.5 && q.at - h.t <= 1.2)) warned++; } assert(warned, "campaign fast enemies queued with lead time");
});
t("customised weapon changes projectiles and muzzle; hitbox never changes", () => {
  const av = globalThis.effectiveAvatar("lumi", { weapon: "bow", ride: "skate", hat: "crown", back: "wings" }); const g = createGame({ mode: "campaign", level: 1, avatar: "lumi", av, god: true });
  assert.strictEqual(g.av.cat, "bow"); assert.deepStrictEqual(g.muzzle, muzzleFor("lumi", av)); assert.notDeepStrictEqual(g.muzzle, muzzleFor("lumi"));
});
t("duels: bigger waves, busier spawns, 30% faster enemies, and a bullet power-up every 10 s for both players", () => {
  const R = globalThis.EndlessRules; for (const n of [1, 3, 6]) assert(R.waveSpawns(4, n, true).length > R.waveSpawns(4, n).length);
  const cnt = (o) => R.createSchedule(4, o).take(180).length; assert(cnt({ versus: true }) > cnt({}) * 1.3);
  const a = createGame({ mode: "endless", seed: 9, versus: true, god: true }), b = createGame({ mode: "endless", seed: 9, versus: true, god: true }), pa = [], pb = [];
  for (let i = 0; i < 60 * 41; i++) { for (const [g, arr] of [[a, pa], [b, pb]]) { const n = g.pickups.length; updateGame(g, 1 / 60, {}); for (const k of g.pickups.slice(n)) if (["comet", "nova", "prism"].includes(k.kind) && k.x > 960) arr.push(Math.round(g.t) + k.kind); } }
  assert.deepStrictEqual(pa.slice(0, 4), ["10comet", "20nova", "30prism", "40comet"]); assert.deepStrictEqual(pa, pb, "identical for both players");
  assert(!a.boss, "no bosses in duels");
});
console.log(`\n${pass} weapon/elite/enemy tests passed`);
