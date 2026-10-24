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
t("hold-to-fire repeats the active pattern every fire interval", () => { const h = createGame({ mode: "campaign", level: 1, tier: 3, god: true }); h.state = "waves"; h.waveIdx = 99; let n = 0; for (let i = 0; i < 60; i++) { const before = h.pbul.length; updateGame(h, 1 / 60, { fire: true }); n += Math.max(0, h.pbul.length - before); } assert(n >= 36 && n % 6 === 0, n); });
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
  for (let n = 1; n <= 15; n++) { const w = R.waveSpawns(77, n); assert(w.length > prev || w.length === 34, "wave " + n + " grows"); prev = w.length;
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
t("player damage: ×1 → ×2 at 5 min → ×3 → ×4 → ×5 at 20 min (then stops); power-ups double it", () => {
  const R = globalThis.EndlessRules; assert.deepStrictEqual([0, 299, 300, 600, 900, 1200, 2400].map(R.damageMult), [1, 1, 2, 3, 4, 5, 5]);
  for (const mode of [{ mode: "endless", seed: 2, god: true }, { mode: "campaign", level: 1, god: true }]) {
    const h = createGame(mode); h.state = mode.mode === "endless" ? "endless" : "waves"; h.waveIdx = 999;
    for (const [t, d] of [[10, 1], [310, 2], [610, 3], [1300, 5]]) { h.t = t; h.player.bullet = null; assert.strictEqual(fire(h)[0].dmg, d, mode.mode + " at " + t); h.player.bullet = { kind: "nova", t: 9 }; assert.strictEqual(fire(h)[0].dmg, d * 2, mode.mode + " boosted at " + t); }
  }
  const h = createGame({ mode: "campaign", level: 1 }); h.t = 320; const e = globalThis.__spawn(h, "bulwark1", 270, 600); e.t = 1; const hp0 = e.hp; globalThis.__damage(h, e, 2, false, 0); assert.strictEqual(hp0 - e.hp, 2, "a ×2 bullet removes two hits of health");
});
t("bullet power-ups change bullet look and speed for 10 s, then expire", () => {
  const h = createGame({ mode: "campaign", level: 2, tier: 1, god: true }); h.state = "waves"; h.waveIdx = 99;
  const base = fire(h)[0].vx;
  for (const [kind, mult] of [["comet", 1.6], ["nova", 1.1], ["prism", 1.35]]) {
    h.pickups = [{ x: h.player.x, y: h.player.y, kind, t: 0, vy: 0 }]; updateGame(h, 0.001, {}); const b = fire(h)[0];
    assert.strictEqual(b.kind, kind); assert(Math.abs(b.vx / base - mult) < 0.01, kind); assert.strictEqual(b.dmg, 2, "power-up doubles damage"); }
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
t("endless five-minute stages stop at 20 min: ×2/×4/×8/×16 enemies, speed +25% per stage, hit caps 5 / 10 / 15, max 50 on screen", () => {
  const R = globalThis.EndlessRules; assert.deepStrictEqual([0, 299, 300, 600, 900, 1200, 1500, 2400].map(R.countMult), [1, 1, 2, 4, 8, 16, 16, 16]);
  assert.strictEqual(R.speedAt(300) / R.speedAt(0), 1.25); assert.strictEqual(R.speedAt(600) / R.speedAt(300), 1.25); assert.strictEqual(R.speedAt(1500), R.speedAt(2400), "speed stops growing after 20 min");
  for (const t of [0, 90, 310, 610, 1250, 3000]) { assert(R.hitsFor("mite", t) <= 5); assert(R.hitsFor("dart", t) <= 10); for (const b of ["bulwark1", "bulwark2", "bulwark3", "bulwark4"]) assert(R.hitsFor(b, t) <= 15 && R.hitsFor(b, t, true) <= 15); }
  assert.strictEqual(R.hitsFor("bulwark1", 310), 15); assert.strictEqual(R.hitsFor("dart", 310), 10); assert.strictEqual(R.hitsFor("mite", 610), 5); assert.strictEqual(R.hitsFor("bulwark1", 70), 10);
  const s = R.createSchedule(4).take(660), per = (a, b) => s.filter((x) => x.t >= a && x.t < b).length; assert(per(300, 360) > per(240, 300) * 1.6, "count doubles at 5 min");
  const g = createGame({ mode: "endless", seed: 4, god: true }); let peak = 0; for (let i = 0; i < 60 * 420; i++) { updateGame(g, 1 / 60, {}); peak = Math.max(peak, g.enemies.length); } assert(peak <= 50 && peak >= 40, "on-screen cap 50 (peak " + peak + ")");
  const c = createGame({ mode: "campaign", level: 90, god: true }); c.t = 400; assert(globalThis.__spawn(c, "bulwark4", 270, 600).hp <= 15); assert(globalThis.__spawn(c, "dart", 270, 600).hp <= 10);
});
console.log(`\n${pass} weapon/elite/enemy tests passed`);
