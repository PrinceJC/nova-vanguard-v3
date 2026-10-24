// Ranked-run logic, independent of the database driver so it can be unit-tested.
const crypto = require("crypto");
const Rules = require("../../shared/endless-rules.js");

const MAX_BODY = 600 * 1024, MAX_RUN_AGE = 4 * 3600, START_LIMIT_PER_HOUR = 40;
class HttpError extends Error { constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; } }

async function startRun(store, user, now = new Date()) {
  const profile = await store.getProfile(user.id);
  if (!profile) throw new HttpError(403, "Choose a username before playing ranked runs.");
  if ((await store.countRunsSince(user.id, new Date(now - 3600e3))) >= START_LIMIT_PER_HOUR) throw new HttpError(429, "Too many runs started in the last hour. Try again shortly.");
  await store.abandonOpenRuns(user.id);
  const seed = crypto.randomInt(1, 2 ** 31 - 1);
  const run = await store.insertRun({ user_id: user.id, seed, rules_version: Rules.VERSION, avatar: profile.avatar, status: "open", started_at: now.toISOString() });
  return { runId: run.id, seed, rulesVersion: Rules.VERSION };
}

async function submitRun(store, user, body, now = new Date()) {
  if (!body || typeof body !== "object" || typeof body.runId !== "string") throw new HttpError(400, "The run submission is missing its run id.");
  if (JSON.stringify(body.events || null).length > MAX_BODY) throw new HttpError(413, "The run data is too large.");
  const run = await store.getRun(body.runId, user.id);
  if (!run) throw new HttpError(404, "This run session wasn’t found for your account.");
  if (run.status !== "open") throw new HttpError(409, "This run was already submitted.", { duplicate: true, status: run.status, score: run.score, survival: run.survival_ms / 1000, reason: run.reject_reason });
  const elapsed = (now - new Date(run.started_at)) / 1000;
  let res;
  if (run.rules_version !== Rules.VERSION) res = { ok: false, reason: "The game was updated during this run. Refresh the page to play ranked again." };
  else if (elapsed > MAX_RUN_AGE) res = { ok: false, reason: "This run session expired." };
  else res = Rules.validate(Number(run.seed), body.events, elapsed);
  const patch = res.ok
    ? { status: "valid", score: res.score, survival_ms: Math.round(res.survival * 1000), kills: res.kills, finished_at: now.toISOString() }
    : { status: "rejected", reject_reason: res.reason, finished_at: now.toISOString() };
  const updated = await store.finishOpenRun(run.id, user.id, patch);   // atomic: only succeeds while status = 'open'
  if (!updated) throw new HttpError(409, "This run was already submitted.", { duplicate: true });
  if (!res.ok) throw new HttpError(422, res.reason, { ok: false });
  return { ok: true, score: res.score, survival: res.survival, kills: res.kills, elites: res.elites };
}
module.exports = { startRun, submitRun, HttpError };
