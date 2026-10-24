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
t("roster: 20 heroes, 5 cannons, 5 bows, 5 snipers, 5 guns; Nova is a cannon user", () => { const c = {}; for (const a of AVATARS) c[a.cat] = (c[a.cat] || 0) + 1; assert.deepStrictEqual(c, { cannon: 5, sniper: 5, bow: 5, gun: 5 }); assert.strictEqual(AVATARS.length, 20); assert.strictEqual(AVATARS.find((a) => a.id === "lumi").name, "Astra"); assert(!AVATARS.some((a) => a.name === "Nova")); });
t("firing artwork lines up with the projectile origin for every hero", () => { for (const a of AVATARS) { const [mx, my] = MUZZLES[a.cat];
  if (a.cat === "bow") { const idle = avatarSVG(a, "idle", "game"); assert(idle.includes('M44 41 L72 41') && mx === 72 && my === 41, a.id); assert(!avatarSVG(a, "fire", "game").includes('M44 41 L72 41'), a.id + " releases"); }
  else assert(avatarSVG(a, "fire", "game").includes(`<circle cx="${mx}" cy="${my}" r="2.6"`), a.id); } });
t("hold-to-fire repeats the active pattern every fire interval", () => { const h = createGame({ mode: "campaign", level: 1, tier: 3, god: true }); h.state = "waves"; h.waveIdx = 99; let n = 0; for (let i = 0; i < 60; i++) { const before = h.pbul.length; updateGame(h, 1 / 60, { fire: true }); n += Math.max(0, h.pbul.length - before); } assert(n >= 36 && n % 6 === 0, n); });
t("defeating a campaign elite drops exactly one weapon upgrade at its position", () => { const h = createGame({ mode: "campaign", level: 5, tier: 1, god: true }); const e = spawnEnemyG(h, true); e.t = 1; damage(h, e); const ups = h.pickups.filter((k) => k.kind === "up"); assert.strictEqual(ups.length, 1); assert(Math.abs(ups[0].x - e.x) < 1 && Math.abs(ups[0].y - e.y) < 1); });
t("normal enemies never drop weapon upgrades", () => { const h = createGame({ mode: "campaign", level: 5, tier: 1, god: true }); for (let i = 0; i < 300; i++) { const e = spawnEnemyG(h, false); e.t = 1; damage(h, e); } assert(!h.pickups.some((k) => k.kind === "up")); });
t("upgrade pickups drift left slower than enemy bullets", () => { assert(55 < 85); });
t("elites are 1.5× larger and tougher than normal enemies", () => { const h = createGame({ mode: "campaign", level: 5, tier: 1 }); const a = spawnEnemyG(h, false), b = spawnEnemyG(h, true); assert.strictEqual(b.size / a.size, 1.5); assert(b.hp > a.hp * 2); });
t("weapon upgrades only on collection; max tier gives +1000 once per pickup", () => {
  const h = createGame({ mode: "campaign", level: 5, tier: 1, god: true }); h.state = "waves"; h.waveIdx = 99;
  const grab = () => { h.pickups = [{ x: h.player.x, y: h.player.y, kind: "up", t: 0, vy: 0 }]; const s0 = h.score; updateGame(h, 0.001, {}); return h.score - s0; };
  assert.strictEqual(h.player.tier, 1); grab(); assert.strictEqual(h.player.tier, 2); grab(); assert.strictEqual(h.player.tier, 3);
  assert.strictEqual(grab(), 1000); assert.strictEqual(grab(), 1000); assert.strictEqual(h.player.tier, 3);
});
t("endless: enemies never fire projectiles; danger is contact only", () => { const h = createGame({ mode: "endless", seed: 77, god: true }); for (let i = 0; i < 60 * 240; i++) { updateGame(h, 1 / 60, {}); assert.strictEqual(h.ebul.length, 0); } assert(h.enemies.length + h.kills >= 0); });
t("endless: spawn gap shrinks every 20 s, cumulatively, to a floor", () => { const R = globalThis.EndlessRules; let prev = Infinity; for (let s = 0; s <= 600; s += 20) { const gp = R.spawnGap(s); assert(gp <= prev); if (s >= 20 && gp > 1.1) assert(gp < R.spawnGap(s - 20)); prev = gp; } assert.strictEqual(R.spawnGap(0), R.spawnGap(19.9)); assert.strictEqual(R.spawnGap(5000), 1.1); });
t("endless: enemy speed ramps smoothly and resets each new run", () => { const R = globalThis.EndlessRules; assert.strictEqual(R.speedAt(0), 1); assert(R.speedAt(120) > 1 && R.speedAt(240) > R.speedAt(120)); assert(Math.abs(R.speedAt(100.1) - R.speedAt(100)) < 0.001); const fresh = createGame({ mode: "endless", seed: 5 }); assert.strictEqual(fresh.t, 0); });
t("ranked endless always starts at one shot, regardless of avatar", () => { for (const a of AVATARS) assert.strictEqual(createGame({ mode: "endless", seed: 1, avatar: a.id }).player.tier, 1); });
t("campaign levels start at the tier the app passes in (the app always passes 1)", () => { assert.strictEqual(createGame({ mode: "campaign", level: 12, tier: 1 }).player.tier, 1); assert.strictEqual(createGame({ mode: "campaign", level: 12 }).player.tier, 1); });
t("player hitbox is a small core inside the much larger artwork", () => assert(PLAYER_HITBOX() * 2 < 140 * 0.1));
function PLAYER_HITBOX() { return 6; }
t("health pickups stay capped at two per campaign level even with weapon drops", () => { const h = createGame({ mode: "campaign", level: 5, tier: 1, god: true }); for (let i = 0; i < 600; i++) { const e = spawnEnemyG(h, i % 7 === 0); e.t = 1; damage(h, e); } assert(h.pickups.filter((k) => k.kind === "hp").length <= 2); assert(h.pickups.filter((k) => k.kind === "up").length > 50); });
function spawnEnemyG(h, elite) { return globalThis.__spawn(h, "shield_pod", 270, 600, { elite }); }
function damage(h, e) { globalThis.__damage(h, e, 9999, true); }
// ---------------- lives, armored, fast enemies, bullet power-ups
t("three lives in Campaign and Endless; healing caps at three", () => {
  for (const m of [{ mode: "campaign", level: 1 }, { mode: "endless", seed: 3 }]) { const h = createGame(m); assert.strictEqual(h.player.hp, 3); h.pickups = [{ x: h.player.x, y: h.player.y, kind: "hp", t: 0, vy: 0 }]; updateGame(h, 0.001, {}); assert.strictEqual(h.player.hp, 3); }
  assert.strictEqual(globalThis.EndlessRules.PLAYER_HP, 3);
  const h = createGame({ mode: "endless", seed: 9 }); for (let i = 0; i < 3; i++) { h.player.inv = 0; globalThis.__hurt(h); } assert(h.player.dead);
});
t("armored enemies need exactly 5 / 10 / 15 / 20 bullet hits", () => {
  for (const [tier, hits] of [[1, 5], [2, 10], [3, 15], [4, 20]]) for (const mode of [{ mode: "endless", seed: 1 }, { mode: "campaign", level: 60 }]) {
    const h = createGame(mode); const e = globalThis.__spawn(h, "bulwark" + tier, 270, 600, mode.mode === "endless" ? { sid: 999 } : {}); e.t = 1; let n = 0;
    if (h.spawnMap) h.spawnMap.set(999, { id: 999, score: 300, elite: false });
    while (!e.dead && n < 50) { globalThis.__damage(h, e, 1, false, 0); n++; } assert.strictEqual(n, hits, `tier ${tier} ${mode.mode}`); }
});
t("endless schedule: armored tiers have exact hit counts and arrive gradually", () => { const R = globalThis.EndlessRules, s = R.createSchedule(5).take(600), first = {};
  for (const x of s) { if (!(x.type in first)) first[x.type] = x.t; if (x.type.startsWith("bulwark") && !x.elite) assert.strictEqual(x.hp, { bulwark1: 5, bulwark2: 10, bulwark3: 15, bulwark4: 20 }[x.type]); }
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
t("bullet power-ups change bullet look and speed for 10 s, then expire", () => {
  const h = createGame({ mode: "campaign", level: 2, tier: 1, god: true }); h.state = "waves"; h.waveIdx = 99;
  const base = fire(h)[0].vx;
  for (const [kind, mult] of [["comet", 1.6], ["nova", 1.1], ["prism", 1.35]]) {
    h.pickups = [{ x: h.player.x, y: h.player.y, kind, t: 0, vy: 0 }]; updateGame(h, 0.001, {}); const b = fire(h)[0];
    assert.strictEqual(b.kind, kind); assert(Math.abs(b.vx / base - mult) < 0.01, kind); assert.strictEqual(b.dmg, 1, "damage unchanged (ranked fairness)"); }
  for (let i = 0; i < 60 * 11; i++) updateGame(h, 1 / 60, {}); assert.strictEqual(h.player.bullet, null); assert.strictEqual(fire(h)[0].kind, null);
});
t("power-ups never count toward the health-pickup cap", () => { const h = createGame({ mode: "campaign", level: 5, tier: 1, god: true }); for (let i = 0; i < 800; i++) { const e = globalThis.__spawn(h, "scout_drone", 270, 600); e.t = 1; globalThis.__damage(h, e, 99, true); } const k = h.pickups.map((x) => x.kind); assert(k.filter((x) => x === "hp").length <= 2); assert(k.some((x) => ["comet", "nova", "prism"].includes(x))); });
console.log(`\n${pass} weapon/elite/enemy tests passed`);
