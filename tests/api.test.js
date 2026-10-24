const assert = require("assert");
const { startRun, submitRun } = require("../api/_lib/runs.js");
const { endless } = require("./sim.js");
const crypto = require("crypto");
let pass = 0; const t = async (n, f) => { await f(); pass++; console.log("  ✓", n); };

function memStore() {
  const runs = new Map(), profiles = new Map([["u1", { id: "u1", username: "Lumi", avatar: "lumi" }], ["u2", { id: "u2", username: "Nova", avatar: "nova" }]]);
  return { runs,
    async getProfile(id) { return profiles.get(id) || null; },
    async countRunsSince(id, since) { return [...runs.values()].filter((r) => r.user_id === id && new Date(r.started_at) >= since).length; },
    async abandonOpenRuns(id) { for (const r of runs.values()) if (r.user_id === id && r.status === "open") r.status = "abandoned"; },
    async insertRun(row) { const id = crypto.randomUUID(); runs.set(id, { id, ...row }); return { id }; },
    async getRun(id, uid) { const r = runs.get(id); return r && r.user_id === uid ? { ...r } : null; },
    async finishOpenRun(id, uid, patch) { const r = runs.get(id); if (!r || r.user_id !== uid || r.status !== "open") return false; Object.assign(r, patch); return true; },
  };
}
const rejects = async (p, status, re) => { let e; try { await p; } catch (x) { e = x; } assert(e, "expected rejection"); assert.strictEqual(e.status, status, e.message); if (re) assert.match(e.message, re); return e; };

(async () => {
  const store = memStore(), user = { id: "u1" };
  const t0 = new Date("2026-10-24T03:00:00Z");
  const s = await startRun(store, user, t0);
  // play a real run with the server-issued seed
  const g = endless(s.seed, false, 1500);
  const submitAt = new Date(t0.getTime() + (g.rec.end + 4) * 1000);

  await t("starting a run requires a username", () => rejects(startRun(store, { id: "nobody" }, t0), 403));
  await t("valid run is accepted and scored by the server", async () => { const r = await submitRun(store, user, { runId: s.runId, events: g.rec, score: 1e9 }, submitAt); assert.strictEqual(r.score, g.score); assert.strictEqual(store.runs.get(s.runId).status, "valid"); });
  await t("submitting the same run again is rejected as a duplicate", async () => { const e = await rejects(submitRun(store, user, { runId: s.runId, events: g.rec }, submitAt), 409, /already submitted/); assert.strictEqual(e.extra.duplicate, true); });
  await t("concurrent double submission records only one result", async () => {
    const s2 = await startRun(store, user, t0); const g2 = endless(s2.seed, false, 1500); const at = new Date(t0.getTime() + (g2.rec.end + 4) * 1000);
    const results = await Promise.allSettled([submitRun(store, user, { runId: s2.runId, events: g2.rec }, at), submitRun(store, user, { runId: s2.runId, events: g2.rec }, at)]);
    assert.strictEqual(results.filter((r) => r.status === "fulfilled").length, 1);
  });
  await t("another player cannot submit your run", async () => { const s3 = await startRun(store, user, t0); await rejects(submitRun(store, { id: "u2" }, { runId: s3.runId, events: g.rec }, submitAt), 404); });
  await t("submitting events from a different seed is rejected with a reason", async () => { const s4 = await startRun(store, user, t0); const e = await rejects(submitRun(store, user, { runId: s4.runId, events: g.rec }, submitAt), 422); assert(e.message.length > 10); assert.strictEqual(store.runs.get(s4.runId).status, "rejected"); });
  await t("a run submitted too soon after starting is rejected", async () => { const s5 = await startRun(store, user, t0); const g5 = endless(s5.seed, false, 1500); await rejects(submitRun(store, user, { runId: s5.runId, events: g5.rec }, new Date(t0.getTime() + 10000)), 422, /longer than/); });
  await t("starting a new run abandons the previous open run", async () => { const a = await startRun(store, user, t0); await startRun(store, user, t0); assert.strictEqual(store.runs.get(a.runId).status, "abandoned"); await rejects(submitRun(store, user, { runId: a.runId, events: g.rec }, submitAt), 409); });
  await t("malformed submissions are rejected", async () => { await rejects(submitRun(store, user, null), 400); await rejects(submitRun(store, user, { runId: "nope", events: {} }), 404); });
  await t("run starts are rate-limited", async () => { const st = memStore(); for (let i = 0; i < 40; i++) await startRun(st, user, t0); await rejects(startRun(st, user, t0), 429); });
  console.log(`\n${pass} API tests passed`);
})().catch((e) => { console.error(e); process.exit(1); });
