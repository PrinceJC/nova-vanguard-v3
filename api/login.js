// Username + password sign-in. The browser never learns which email/phone belongs to a username:
// the server looks it up with the service role, signs in with Supabase, and returns only the session tokens.
const { createClient } = require("@supabase/supabase-js");
const { handler, adminClient } = require("./_lib/supabase.js");
const { HttpError } = require("./_lib/runs.js");
const attempts = new Map();   // per-instance throttle on top of Supabase's own auth rate limits
function throttle(key) {
  const now = Date.now(), list = (attempts.get(key) || []).filter((t) => now - t < 10 * 60e3);
  if (list.length >= 8) throw new HttpError(429, "Too many sign-in attempts. Wait a few minutes and try again.");
  list.push(now); attempts.set(key, list);
}
const WRONG = "That username and password don’t match.";
module.exports = handler(async (req) => {
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const username = String(body.username || "").trim(), password = String(body.password || "");
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username) || password.length < 1 || password.length > 72) throw new HttpError(400, WRONG);
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "ip";
  throttle(ip + "|" + username.toLowerCase());
  const admin = adminClient();
  const { data: prof, error: pe } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (pe) throw pe;
  if (!prof) throw new HttpError(401, WRONG);
  const { data: u, error: ue } = await admin.auth.admin.getUserById(prof.id);
  if (ue || !u || !u.user) throw new HttpError(401, WRONG);
  const creds = u.user.email ? { email: u.user.email, password } : { phone: u.user.phone, password };
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await anon.auth.signInWithPassword(creds);
  if (error) {
    if (/not confirmed/i.test(error.message)) throw new HttpError(403, "Verify your email or phone first, then sign in.", { needsVerify: true });
    throw new HttpError(401, WRONG + " If you created your account with codes only, choose “Sign in with a one-time code” and set a password in your profile.");
  }
  return { ok: true, access_token: data.session.access_token, refresh_token: data.session.refresh_token };
});
