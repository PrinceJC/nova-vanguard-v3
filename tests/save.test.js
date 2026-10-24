const assert = require("assert");
const { AVATARS, AVATAR_BY_ID, avatarUnlocked } = require("../src/avatars.js");
Object.assign(globalThis, { AVATARS, AVATAR_BY_ID, avatarUnlocked });
const S = require("../src/net.js");
let pass = 0; const t = (n, f) => { f(); pass++; console.log("  ✓", n); };

const v1 = { unlocked: 7, completed: [true, true, true, true, true, true, false, false, false, false], best: [100, 200, 300, 400, 500, 600, 0, 0, 0, 0], levelTier: [1, 2, 3, 3, 3, 3, 3, 1, 1, 1], run: { level: 7, tier: 3, score: 45000 }, settings: { music: 0.2, sfxMute: true } };
t("v1 progress converts to campaign levels 1–10", () => { const s = S.convertV1(v1); assert.strictEqual(s.campaign.unlocked, 7); assert.deepStrictEqual(s.campaign.completed.slice(0, 7), [true, true, true, true, true, true, false]); assert.strictEqual(s.campaign.best[5], 600); assert.deepStrictEqual(s.campaign.run, { level: 7, tier: 3, score: 45000 }); assert.strictEqual(s.settings.music, 0.2); assert.strictEqual(s.settings.sfxMute, true); });
t("v1 save with all 10 cleared unlocks level 11", () => { const s = S.convertV1({ unlocked: 10, completed: Array(10).fill(true), run: null, lastTotal: 150000 }); assert.strictEqual(s.campaign.unlocked, 11); assert.strictEqual(s.campaign.run.level, 11); });
t("migration never overwrites more advanced cloud progress", () => {
  const cloud = S.blankSave(); cloud.campaign.unlocked = 23; for (let i = 0; i < 22; i++) cloud.campaign.completed[i] = true; cloud.campaign.best[2] = 9999; cloud.campaign.run = { level: 23, tier: 3, score: 900000 };
  const m = S.mergeSaves(cloud, S.convertV1(v1));
  assert.strictEqual(m.campaign.unlocked, 23); assert.strictEqual(m.campaign.run.level, 23); assert.strictEqual(m.campaign.best[2], 9999); assert.strictEqual(m.campaign.best[5], 600);
});
t("migration fills in cloud gaps from older local progress", () => { const m = S.mergeSaves(S.blankSave(), S.convertV1(v1)); assert.strictEqual(m.campaign.unlocked, 7); assert.strictEqual(m.campaign.run.level, 7); });
t("merge is idempotent", () => { const a = S.mergeSaves(S.blankSave(), S.convertV1(v1)); assert.deepStrictEqual(S.mergeSaves(a, S.convertV1(v1)), a); });
t("corrupt or hostile save data is repaired", () => { for (const bad of [null, "x", { campaign: { unlocked: "lots", completed: "no", run: { level: 99 } }, avatars: { selected: "hacker" }, settings: { quality: 9, music: 50 } }]) { const s = S.sanitizeSave(bad); assert.strictEqual(s.campaign.completed.length, 100); assert(s.campaign.unlocked >= 1); assert.strictEqual(s.avatars.selected, "lumi"); assert(s.settings.music <= 1); assert(!s.campaign.run || s.campaign.run.level <= s.campaign.unlocked); } });
t("avatar unlocks follow campaign milestones (4 starters, rest by level)", () => {
  const s = S.blankSave(); assert.strictEqual(S.refreshUnlocks(s).avatars.unlocked.length, 4);
  for (let i = 0; i < 40; i++) s.campaign.completed[i] = true; assert.strictEqual(S.refreshUnlocks(s).avatars.unlocked.length, 12);
  for (let i = 0; i < 100; i++) s.campaign.completed[i] = true; assert.strictEqual(S.refreshUnlocks(s).avatars.unlocked.length, 20);
});
t("selecting a locked avatar falls back to Lumi", () => { const s = S.blankSave(); s.avatars.selected = "luma"; assert.strictEqual(S.sanitizeSave(s).avatars.selected, "lumi"); });
t("Manila period keys and resets", () => {
  const ms = Date.parse("2026-10-21T15:59:59Z"); assert.strictEqual(S.manilaDateKey(ms), "2026-10-21"); assert.strictEqual(S.manilaDateKey(ms + 1000), "2026-10-22");
  assert.strictEqual(S.manilaWeekKey(Date.parse("2026-10-18T15:59:00Z")), "2026-10-12"); assert.strictEqual(S.manilaWeekKey(Date.parse("2026-10-18T16:00:00Z")), "2026-10-19");
  assert.strictEqual(new Date(S.nextResetMs("daily", ms)).toISOString(), "2026-10-21T16:00:00.000Z");
  assert.strictEqual(new Date(S.nextResetMs("weekly", Date.parse("2026-10-24T03:00:00Z"))).toISOString(), "2026-10-25T16:00:00.000Z");
  assert.strictEqual(S.shiftKey("weekly", "2026-10-19", -1), "2026-10-12");
});
t("username rule", () => { for (const ok of ["abc", "Lumi_01", "A".repeat(20)]) assert(S.USERNAME_RE.test(ok)); for (const bad of ["ab", "A".repeat(21), "has space", "dash-y", "émile"]) assert(!S.USERNAME_RE.test(bad)); });
t("phone numbers: Philippine formats normalise to +63 9XX…", () => {
  for (const raw of ["09171234567", "9171234567", "+639171234567", "639171234567", "0917 123 4567", "917-123-4567", "(0917) 123 4567"]) { const r = S.normalizePhone("+63", raw); assert.strictEqual(r.error, "", raw + " → " + r.error); assert.strictEqual(r.e164, "+639171234567", raw); }
});
t("phone numbers: clear errors for wrong length, prefix or empty", () => { assert.match(S.normalizePhone("+63", "").error, /Enter/); assert.match(S.normalizePhone("+63", "917123").error, /6 digits/); assert.match(S.normalizePhone("+63", "8171234567").error, /start with 9/); assert.strictEqual(S.normalizePhone("+1", "415 555 0123").e164, "+14155550123"); assert.strictEqual(S.normalizePhone("+65", "8123 4567").error, ""); });
t("password rules", () => { assert(S.passwordProblem("short1")); assert(S.passwordProblem("longpassword")); assert(S.passwordProblem("12345678")); assert.strictEqual(S.passwordProblem("nova2026x"), ""); });
console.log(`\n${pass} save/migration tests passed`);
