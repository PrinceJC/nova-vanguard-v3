// Runs the real migration on PGlite (Postgres in WASM) with a stub of Supabase's auth schema.
import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import fs from "fs";
import assert from "assert";

const db = new PGlite({ extensions: { citext } });
let pass = 0; const t = async (name, fn) => { await fn(); pass++; console.log("  ✓", name); };
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key, email text, phone text, email_confirmed_at timestamptz, phone_confirmed_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public to anon, authenticated;
`);
for (const f of fs.readdirSync(new URL("../supabase/migrations/", import.meta.url)).sort()) await db.exec(fs.readFileSync(new URL("../supabase/migrations/" + f, import.meta.url), "utf8"));
console.log("Migration applied.");

const A = "11111111-1111-1111-1111-111111111111", B = "22222222-2222-2222-2222-222222222222", C = "33333333-3333-3333-3333-333333333333", U = "44444444-4444-4444-4444-444444444444";
await db.exec(`insert into auth.users values ('${A}','a@x.com',null,now(),null),('${B}',null,'+639171234567',null,now()),('${C}','c@x.com',null,now(),null),('${U}','u@x.com',null,null,null)`);
async function as(uid, sql, params) {
  await db.exec(`set role ${uid ? "authenticated" : "anon"}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid || ""]);
  try { return await db.query(sql, params); } finally { await db.exec("reset role"); }
}
const fails = async (p, re) => { let e = null; try { await p; } catch (x) { e = x; } assert(e, "expected an error"); if (re) assert.match(e.message, re); };

await t("username availability check works for signed-out visitors", async () => { const r = await as(null, "select public.username_available('Lumi_01') ok"); assert.strictEqual(r.rows[0].ok, true); });
await t("verified user claims a username", async () => { const r = await as(A, "select (public.claim_username('Lumi_01')).username::text u"); assert.strictEqual(r.rows[0].u, "Lumi_01"); });
await t("availability check is case-insensitive", async () => { assert.strictEqual((await as(null, "select public.username_available('lumi_01') ok")).rows[0].ok, false); });
await t("taken username (different case) is rejected with USERNAME_TAKEN", () => fails(as(B, "select public.claim_username('LUMI_01')"), /USERNAME_TAKEN/));
await t("invalid usernames are rejected", async () => { for (const n of ["ab", "this_name_is_way_too_long", "bad name", "émile", "dash-ed"]) await fails(as(B, "select public.claim_username($1)", [n]), /USERNAME_INVALID/); });
await t("phone-verified user claims a username", async () => { await as(B, "select public.claim_username('Nova')"); });
await t("unverified account cannot claim a username", () => fails(as(U, "select public.claim_username('Sneaky')"), /NOT_VERIFIED/));
await t("database enforces uniqueness even bypassing the RPC", () => fails(db.query(`insert into public.profiles (id, username) values ('${C}', 'NOVA')`), /duplicate|unique/));
await t("rename keeps the same account id (progress stays linked)", async () => {
  await as(A, "insert into public.saves (user_id, data) values ($1, '{\"campaign\":{\"unlocked\":7}}')", [A]);
  await as(A, "select public.claim_username('Lumi_Star')");
  const r = await as(A, "select p.id, s.data->'campaign'->>'unlocked' u from public.profiles p join public.saves s on s.user_id = p.id where p.id = $1", [A]);
  assert.strictEqual(r.rows[0].u, "7"); assert.strictEqual(r.rows[0].id, A);
});
await t("players cannot change their username by direct update", () => fails(as(A, "update public.profiles set username = 'Hacker' where id = $1", [A]), /permission/));
await t("players can change their own avatar but not someone else's", async () => {
  await as(A, "update public.profiles set avatar = 'nova' where id = $1", [A]);
  await as(A, "update public.profiles set avatar = 'riko' where id = $1", [B]);
  const r = await db.query(`select id, avatar from public.profiles order by id`);
  assert.strictEqual(r.rows.find((x) => x.id === A).avatar, "nova"); assert.strictEqual(r.rows.find((x) => x.id === B).avatar, "lumi");
});
await t("new hero ids are accepted", async () => { for (const id of ["astra", "seraphine", "elara", "kai", "lyra", "rook"]) await as(A, "update public.profiles set avatar = $2 where id = $1", [A, id]); await as(A, "update public.profiles set avatar = 'nova' where id = $1", [A]); });
await t("unknown avatar ids are rejected", () => fails(as(A, "update public.profiles set avatar = 'not_real' where id = $1", [A]), /avatar_known/));
await t("saves: players read only their own save", async () => { const r = await as(B, "select * from public.saves"); assert.strictEqual(r.rows.length, 0); });
await t("saves: players cannot write another player's save", async () => {
  await fails(as(B, "insert into public.saves (user_id, data) values ($1, '{}')", [A]), /row-level security/);
  await as(B, "update public.saves set data = '{\"campaign\":{\"unlocked\":100}}' where user_id = $1", [A]);
  assert.strictEqual((await db.query(`select data->'campaign'->>'unlocked' u from public.saves where user_id='${A}'`)).rows[0].u, "7");
});
await t("saves: players cannot delete saves", () => fails(as(A, "delete from public.saves where user_id = $1", [A]), /permission/));
await t("saves must be JSON objects", () => fails(as(A, "update public.saves set data = '[1,2]' where user_id = $1", [A]), /saves_is_object/));
await t("runs: browser cannot insert or edit leaderboard records", async () => {
  await fails(as(A, "insert into public.runs (user_id, seed, rules_version, status, score) values ($1, 1, 1, 'valid', 999999)", [A]), /permission/);
  await db.query(`insert into public.runs (id, user_id, seed, rules_version, status) values ('aaaaaaaa-0000-0000-0000-000000000001', '${A}', 5, 1, 'open')`);
  await fails(as(A, "update public.runs set status='valid', score=999999"), /permission/);
});
await t("signed-out visitors can read the public leaderboard but not profiles, saves or runs", async () => { await as(null, "select * from public.get_leaderboard('daily')"); await fails(as(null, "select * from public.profiles"), /permission/); await fails(as(null, "select * from public.saves"), /permission/); await fails(as(null, "select * from public.runs"), /permission/); await fails(as(null, "select * from public.get_my_standing('daily')"), /permission/); });
await t("private contact data is not exposed through profiles", async () => { const r = await as(B, "select * from public.profiles limit 1"); assert(!("email" in r.rows[0]) && !("phone" in r.rows[0])); });

// ---------------- leaderboards
await db.exec(`insert into auth.users values ('${C}x'::text::uuid,null,null,null,null)`).catch(() => {});
await as(C, "select public.claim_username('Riko')");
const run = (uid, score, ts, status = "valid") => db.query(`insert into public.runs (user_id, seed, rules_version, status, score, survival_ms, kills, finished_at) values ($1, 1, 1, $2, $3, 60000, 10, $4::timestamptz)`, [uid, status, score, ts]);
// Manila is UTC+8. 2026-10-21 (Wed) Manila day = 2026-10-20 16:00Z .. 2026-10-21 16:00Z
await run(A, 5000, "2026-10-20T16:00:00Z");      // Manila 10-21 00:00 → day 10-21
await run(A, 7000, "2026-10-21T15:59:59Z");      // Manila 10-21 23:59:59 → day 10-21 (best for A)
await run(A, 99999, "2026-10-21T16:00:00Z");     // Manila 10-22 00:00 → next day
await run(B, 7000, "2026-10-21T10:00:00Z");      // ties A's 7000 but earlier → B ranks first
await run(C, 8000, "2026-10-21T12:00:00Z", "rejected"); // rejected runs never count
await run(C, 3000, "2026-10-21T13:00:00Z");
await run(B, 4000, "2026-10-18T15:59:00Z");      // Manila Sun 10-18 23:59 → previous week
await run(B, 4500, "2026-10-18T16:00:00Z");      // Manila Mon 10-19 00:00 → this week

await t("daily board uses Manila midnight boundaries and counts each player once", async () => {
  const r = await as(A, "select rank, username, score, is_me from public.get_leaderboard('daily', '2026-10-21')");
  assert.deepStrictEqual(r.rows.map((x) => [Number(x.rank), x.username, x.score]), [[1, "Nova", 7000], [2, "Lumi_Star", 7000], [3, "Riko", 3000]]);
  assert.strictEqual(r.rows[1].is_me, true);
});
await t("identical scores: the player who reached it first ranks higher", async () => { const r = await as(A, "select username from public.get_leaderboard('daily','2026-10-21') limit 1"); assert.strictEqual(r.rows[0].username, "Nova"); });
await t("run finishing at Manila midnight belongs to the next day", async () => { const r = await as(A, "select score from public.get_leaderboard('daily', '2026-10-22')"); assert.deepStrictEqual(r.rows.map((x) => x.score), [99999]); });
await t("weekly board runs Monday 00:00 to Monday 00:00 Manila", async () => {
  const r = await as(B, "select username, score from public.get_leaderboard('weekly', '2026-10-21')");
  assert.deepStrictEqual(r.rows.map((x) => [x.username, x.score]), [["Lumi_Star", 99999], ["Nova", 7000], ["Riko", 3000]]);
  const prev = await as(B, "select username, score from public.get_leaderboard('weekly', '2026-10-12')");
  assert.deepStrictEqual(prev.rows.map((x) => [x.username, x.score]), [["Nova", 4000]]);
});
await t("my standing reports rank and player count", async () => { const r = await as(C, "select * from public.get_my_standing('daily','2026-10-21')"); assert.deepStrictEqual([Number(r.rows[0].rank), r.rows[0].score, Number(r.rows[0].players)], [3, 3000, 3]); });
await t("archive lists past periods", async () => { const r = await as(A, "select period::text p, players from public.list_periods('daily')"); assert(r.rows.some((x) => x.p === "2026-10-21") && r.rows.some((x) => x.p === "2026-10-18")); });
await t("period bounds are exact", async () => {
  const d = await db.query("select start_ts at time zone 'UTC' s, end_ts at time zone 'UTC' e from public.lb_bounds('daily','2026-10-21')");
  assert.strictEqual(d.rows[0].s.toISOString(), "2026-10-20T16:00:00.000Z"); assert.strictEqual(d.rows[0].e.toISOString(), "2026-10-21T16:00:00.000Z");
  const w = await db.query("select start_ts at time zone 'UTC' s, end_ts at time zone 'UTC' e from public.lb_bounds('weekly','2026-10-24')");
  assert.strictEqual(w.rows[0].s.toISOString(), "2026-10-18T16:00:00.000Z"); assert.strictEqual(w.rows[0].e.toISOString(), "2026-10-25T16:00:00.000Z");
});
await t("anonymous leaderboard shows usernames and never marks a row as yours", async () => { const r = await as(null, "select username, is_me from public.get_leaderboard('daily', '2026-10-21')"); assert.strictEqual(r.rows.length, 3); assert(r.rows.every((x) => !x.is_me)); assert(!("email" in r.rows[0])); });
await t("personal endless best", async () => { const r = await as(A, "select * from public.my_endless_best()"); assert.strictEqual(r.rows[0].best_score, 99999); });
console.log(`\n${pass} database tests passed`);
