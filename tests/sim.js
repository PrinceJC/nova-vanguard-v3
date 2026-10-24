// Headless campaign + endless simulation. Usage: node tests/sim.js [campaign|endless] [god|dodge]
const fs = require("fs"), path = require("path");
const R = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
globalThis.EndlessRules = require("../shared/endless-rules.js");
Object.assign(globalThis, require("../src/avatars.js"), require("../src/enemies2.js"));
eval(R("src/levels.js") + R("src/engine.js") + R("src/bosses.js") + ";globalThis.API={createGame,updateGame,getLevel,TOTAL_LEVELS,WORLDS};globalThis.__spawn=spawnEnemy;globalThis.__damage=damageEnemy;globalThis.__hurt=hurtPlayer;");
const { createGame, updateGame } = API;

function bot(g, inp, god) {
  const p = g.player; let ty = 270;
  if (g.boss && g.boss.hits.length) ty = g.boss.hits[0].y;
  else if (g.enemies.length) { const e = g.enemies.reduce((a, b) => (a.x < b.x ? a : b)); ty = e.y; }
  const near = g.pickups.find((k) => k.x < 400); if (near && !g.boss) ty = near.y;
  inp.up = p.y > ty + 6; inp.down = p.y < ty - 6; inp.left = p.x > 160; inp.right = p.x < 140;
  if (!god) {
    for (const b of g.ebul) if (Math.abs(b.x - p.x) < 70 && Math.abs(b.y - p.y) < 22) { inp.up = b.y > p.y; inp.down = !inp.up; break; }
    for (const h of g.hz) if (h.type === "hbeam" && Math.abs(h.y - p.y) < h.h / 2 + 8) { inp.up = h.y > p.y || p.y > 480; inp.down = !inp.up; }
  }
  if (p.blasts > 0 && (g.ebul.length > 20 || g.enemies.length > 25)) inp.specialPressed = true;
}

function campaign(L, god, tier) {
  const g = createGame({ mode: "campaign", level: L, tier, god });
  const inp = { autofire: true }; let t = 0, hpSeen = 0, maxHpSpawns = 0;
  while (t < 900) {
    bot(g, inp, god); updateGame(g, 1 / 60, inp); t += 1 / 60;
    maxHpSpawns = Math.max(maxHpSpawns, g.hpSpawns);
    for (const e of g.events) {
      if (e.type === "levelComplete") return { L, ok: true, t: Math.round(t), boss: Math.round(g.bossTime), bosses: g.bossesSpawned, hpSpawns: maxHpSpawns, tier: g.player.tier, name: g.boss.def.name };
      if (e.type === "gameOver") return { L, ok: false, dead: true, t: Math.round(t), bosses: g.bossesSpawned, hpSpawns: maxHpSpawns };
    }
    g.events.length = 0;
  }
  return { L, ok: false, timeout: true, state: g.state, boss: g.boss && { hp: g.boss.hp, atk: g.boss.atkKey } };
}

function endless(seed, god, maxT = 900) {
  const g = createGame({ mode: "endless", seed, god });
  const inp = { autofire: true }; let t = 0;
  while (t < maxT) {
    bot(g, inp, god); updateGame(g, 1 / 60, inp); t += 1 / 60;
    if (g.events.some((e) => e.type === "endlessOver")) break;
    g.events.length = 0;
  }
  // if the bot outlived the cap, end the run legitimately: three hits spaced beyond the invulnerability window
  if (!g.rec.end && !god) for (let k = 0; k < 4 && !g.player.dead; k++) { for (let i = 0; i < 66; i++) updateGame(g, 1 / 60, { autofire: true }); g.player.inv = 0; g.player.shield = 0; globalThis.__hurt(g); }
  return g;
}
module.exports = { campaign, endless, API };
if (require.main === module) {
  const mode = process.argv[2] || "campaign", god = (process.argv[3] || "god") === "god";
  if (mode === "campaign") {
    const from = +process.argv[4] || 1, to = +process.argv[5] || 100; let fails = 0, maxHp = 0, times = [];
    for (let L = from; L <= to; L++) { const r = campaign(L, god, god ? 1 : 3); if (!r.ok) { fails++; console.log("FAIL", JSON.stringify(r)); } else { times.push(r.t); maxHp = Math.max(maxHp, r.hpSpawns); if (r.bosses !== 1) console.log("BOSS COUNT", r); if (L % 10 === 0 || L <= 2) console.log(JSON.stringify(r)); } }
    console.log({ levels: to - from + 1, fails, maxHpSpawnsInAnyLevel: maxHp, avgTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length), minT: Math.min(...times), maxT: Math.max(...times) });
  } else {
    const g = endless(12345, god);
    const res = EndlessRules.validate(g.seed, g.rec, g.rec.end + 1);
    console.log({ survived: g.rec.end, clientScore: g.score, kills: g.rec.kills.length, hits: g.rec.hits.length, picks: g.rec.picks.length, server: res });
  }
}
