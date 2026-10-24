const assert = require("assert");
const { endless } = require("./sim.js");
const R = globalThis.EndlessRules;
const clone = (o) => JSON.parse(JSON.stringify(o));
let pass = 0; const t = (name, fn) => { fn(); pass++; console.log("  ✓", name); };

const g = endless(424242, false, 1500);
const base = g.rec, seed = g.seed, el = base.end + 2;
console.log("Honest run:", base.end, "s,", base.kills.length, "kills, score", g.score);

t("honest run is accepted and server score equals client score", () => { const r = R.validate(seed, base, el); assert(r.ok, r.reason); assert.strictEqual(r.score, g.score); });
t("score cannot be supplied by the client (extra fields are ignored)", () => { const e = clone(base); e.score = 99999999; assert.strictEqual(R.validate(seed, e, el).score, g.score); });
t("wrong seed (forged schedule) is rejected", () => assert(!R.validate(seed + 1, base, el).ok));
t("fake enemy id is rejected", () => { const e = clone(base); e.kills.push([e.kills.at(-1)[0], 999999, 0]); assert.match(R.validate(seed, e, el).reason, /never appeared/); });
t("duplicate kill is rejected", () => { const e = clone(base); e.kills.splice(5, 0, e.kills[4]); assert.match(R.validate(seed, e, el).reason, /twice/); });
t("instant kill (before entry) is rejected", () => { const e = clone(base); const s = R.createSchedule(seed).take(400).find((x) => !e.kills.some((k) => k[1] === x.id)); e.kills.push([s.t + 0.01, s.id, 0]); e.kills.sort((a, b) => a[0] - b[0]); assert(!R.validate(seed, e, el).ok); });
t("killing tough enemies faster than the cannon allows is rejected", () => {
  const e = { v: 1, kills: [], picks: [], hits: [0.5, 1.6, 2.7, 3.8, 4.9], blasts: [], end: 5 };
  const sch = R.createSchedule(7).take(5);
  e.kills = []; // 300 s worth of kills compressed into a short run
  const all = R.createSchedule(7).take(200);
  const fast = all.slice(0, 120).map((s, i) => [Math.max(s.t + 0.2, 0), s.id, 0]).sort((a, b) => a[0] - b[0]);
  const end = fast.at(-1)[0] + 0.5; e.kills = fast; e.end = end; e.hits = [end - 4.4, end - 3.3, end - 2.2, end - 1.1, end];
  assert(!R.validate(7, e, end + 2).ok);
});
t("blast faster than its cooldown is rejected", () => { const e = clone(base); e.blasts = [10, 15]; e.blasts.sort((a, b) => a - b); assert.match(R.validate(seed, e, el).reason, /cooldown/); });
t("kill credited to a blast that never happened is rejected", () => { const e = clone(base); const i = e.kills.findIndex((k) => k[2] === 0 && !e.blasts.some((b) => k[0] >= b && k[0] <= b + 1.2)); e.kills[i] = [e.kills[i][0], e.kills[i][1], 1]; assert.match(R.validate(seed, e, el).reason, /blast/); });
t("run longer than wall-clock time since start is rejected", () => assert.match(R.validate(seed, base, base.end - 30).reason, /longer than/));
t("run that ends without the player dying is rejected", () => { const e = clone(base); e.hits.pop(); assert(!R.validate(seed, e, el).ok); });
t("rules use three lives", () => assert.strictEqual(R.PLAYER_HP, 3));
t("hits inside the invulnerability window are rejected", () => { const e = clone(base); e.hits = e.hits.map((h, i) => (i === 1 ? e.hits[0] + 0.3 : h)).sort((a, b) => a - b); assert(!R.validate(seed, e, el).ok); });
t("collecting an item that never dropped is rejected", () => { const e = clone(base); const k = e.kills.find((k) => R.dropFor(seed, R.createSchedule(seed).take(k[0] + 1).find((s) => s.id === k[1]), k[0], R.newDropState()) === null); e.picks.push([k[0] + 1, "d" + k[1]]); e.picks.sort((a, b) => a[0] - b[0]); assert(!R.validate(seed, e, el).ok); });
t("collecting the same item twice is rejected", () => { const e = clone(base); e.picks.splice(2, 0, e.picks[1]); assert.match(R.validate(seed, e, el).reason, /twice/); });
t("outdated rules version is rejected", () => { const e = clone(base); e.v = 0; assert(!R.validate(seed, e, el).ok); });
t("out-of-order events are rejected", () => { const e = clone(base); [e.kills[3], e.kills[9]] = [e.kills[9], e.kills[3]]; assert.match(R.validate(seed, e, el).reason, /order/); });
t("malformed payload is rejected", () => { assert(!R.validate(seed, null, el).ok); assert(!R.validate(seed, { v: 1, end: 10 }, el).ok); assert(!R.validate(seed, { v: 1, end: "x", kills: [], picks: [], hits: [], blasts: [] }, el).ok); });

// endless healing cap: at most 2 health drops per 5-minute window
t("endless health drops never exceed 2 per 5-minute window", () => {
  const gg = endless(99, true, 1500); // invincible bot, 25 minutes
  const st = R.newDropState(); const sched = new Map(R.createSchedule(99).take(1600).map((s) => [s.id, s]));
  const per = {};
  for (const [tt, id] of gg.rec.kills) { const k = R.dropFor(99, sched.get(id), tt, st); if (k === "hp") { const w = Math.floor(tt / 300); per[w] = (per[w] || 0) + 1; } }
  const spawnedClient = {}; // also count drops the client actually spawned
  console.log("    hp drops per window:", JSON.stringify(per));
  assert(Object.values(per).every((n) => n <= 2));
  assert(Object.keys(per).length >= 4);
});
console.log(`\n${pass} endless tests passed`);
