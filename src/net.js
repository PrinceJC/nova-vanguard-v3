"use strict";
// ============================================================ save model (v2) + one-time migration of the v1 local save
const V1_KEY = "lumi-blaster-save-v1";
const DEFAULT_SETTINGS = { music: 0.6, sfx: 0.8, musicMute: false, sfxMute: false, autofire: false, reduced: false, quality: 2, shake: 0.7 };
function blankSave() {
  return { v: 2, campaign: { unlocked: 1, completed: Array(100).fill(false), best: Array(100).fill(0), levelTier: Array(100).fill(1), run: null, bestTotal: 0, lastTotal: 0 },
    avatars: { selected: "lumi", unlocked: [] }, settings: { ...DEFAULT_SETTINGS }, migrations: {} };
}
const int = (v, a, b, d) => (v !== null && v !== "" && Number.isFinite(+v) ? Math.min(b, Math.max(a, Math.floor(+v))) : d);
function sanitizeSave(r) {
  const s = blankSave();
  if (!r || typeof r !== "object") return s;
  const c = r.campaign && typeof r.campaign === "object" ? r.campaign : {};
  s.campaign.unlocked = int(c.unlocked, 1, 100, 1);
  if (Array.isArray(c.completed)) s.campaign.completed = s.campaign.completed.map((_, i) => c.completed[i] === true);
  if (Array.isArray(c.best)) s.campaign.best = s.campaign.best.map((_, i) => int(c.best[i], 0, 1e9, 0));
  if (Array.isArray(c.levelTier)) s.campaign.levelTier = s.campaign.levelTier.map((_, i) => int(c.levelTier[i], 1, 3, 1));
  s.campaign.bestTotal = int(c.bestTotal, 0, 1e11, 0); s.campaign.lastTotal = int(c.lastTotal, 0, 1e11, 0);
  if (c.run && typeof c.run === "object") { const L = int(c.run.level, 1, 100, 0); if (L && L <= s.campaign.unlocked) s.campaign.run = { level: L, tier: int(c.run.tier, 1, 3, 1), score: int(c.run.score, 0, 1e11, 0) }; }
  const lastDone = s.campaign.completed.lastIndexOf(true);
  s.campaign.unlocked = Math.max(s.campaign.unlocked, Math.min(100, lastDone + 2));
  if (r.avatars && typeof r.avatars === "object" && typeof r.avatars.selected === "string" && AVATAR_BY_ID[r.avatars.selected]) s.avatars.selected = r.avatars.selected;
  if (r.settings && typeof r.settings === "object") {
    for (const k of ["music", "sfx", "shake"]) if (Number.isFinite(+r.settings[k])) s.settings[k] = Math.min(1, Math.max(0, +r.settings[k]));
    if ([0, 1, 2].includes(r.settings.quality)) s.settings.quality = r.settings.quality;
    for (const k of ["musicMute", "sfxMute", "autofire", "reduced"]) if (typeof r.settings[k] === "boolean") s.settings[k] = r.settings[k];
  }
  if (r.migrations && typeof r.migrations === "object") s.migrations = { ...r.migrations };
  refreshUnlocks(s);
  return s;
}
function completedCount(s) { return s.campaign.completed.filter(Boolean).length; }
function refreshUnlocks(s) {
  const n = completedCount(s);
  s.avatars.unlocked = AVATARS.filter((a) => avatarUnlocked(a, n)).map((a) => a.id);
  if (!s.avatars.unlocked.includes(s.avatars.selected)) s.avatars.selected = "lumi";
  return s;
}
// Convert the v1 (10-level, local-only) save. Old levels 1–10 map to campaign levels 1–10.
function convertV1(raw) {
  if (!raw || typeof raw !== "object") return null;
  const s = blankSave();
  const done = Array.isArray(raw.completed) ? raw.completed.slice(0, 10).map((x) => x === true) : [];
  done.forEach((d, i) => (s.campaign.completed[i] = d));
  if (Array.isArray(raw.best)) raw.best.slice(0, 10).forEach((b, i) => (s.campaign.best[i] = int(b, 0, 1e9, 0)));
  if (Array.isArray(raw.levelTier)) raw.levelTier.slice(0, 10).forEach((b, i) => (s.campaign.levelTier[i] = int(b, 1, 3, 1)));
  s.campaign.unlocked = Math.max(int(raw.unlocked, 1, 10, 1), done.lastIndexOf(true) + 2);
  if (raw.run && typeof raw.run === "object") { const L = int(raw.run.level, 1, 10, 0); if (L) s.campaign.run = { level: L, tier: int(raw.run.tier, 1, 3, 1), score: int(raw.run.score, 0, 1e11, 0) }; }
  else if (done[9]) s.campaign.run = { level: 11, tier: s.campaign.levelTier[9], score: int(raw.lastTotal, 0, 1e11, 0) };
  s.campaign.bestTotal = 0;
  if (raw.settings && typeof raw.settings === "object") s.settings = { ...s.settings, ...sanitizeSave({ settings: raw.settings }).settings };
  return sanitizeSave(s);
}
// Merge without ever lowering progress: per-level maximums, furthest run wins.
function mergeSaves(cloud, local, useLocalSettings) {
  const a = sanitizeSave(cloud), b = sanitizeSave(local), m = sanitizeSave(cloud);
  if (useLocalSettings) m.settings = { ...b.settings };
  m.campaign.unlocked = Math.max(a.campaign.unlocked, b.campaign.unlocked);
  for (let i = 0; i < 100; i++) {
    m.campaign.completed[i] = a.campaign.completed[i] || b.campaign.completed[i];
    m.campaign.best[i] = Math.max(a.campaign.best[i], b.campaign.best[i]);
    m.campaign.levelTier[i] = Math.max(a.campaign.levelTier[i], b.campaign.levelTier[i]);
  }
  const ra = a.campaign.run, rb = b.campaign.run;
  m.campaign.run = !ra ? rb : !rb ? ra : rb.level > ra.level || (rb.level === ra.level && rb.score > ra.score) ? rb : ra;
  m.campaign.bestTotal = Math.max(a.campaign.bestTotal, b.campaign.bestTotal);
  m.migrations = { ...b.migrations, ...a.migrations };
  return sanitizeSave(m);
}

// ============================================================ network
const COUNTRY_CODES = [["+63", "Philippines"], ["+1", "United States / Canada"], ["+44", "United Kingdom"], ["+61", "Australia"], ["+65", "Singapore"], ["+60", "Malaysia"], ["+62", "Indonesia"], ["+66", "Thailand"], ["+84", "Vietnam"], ["+81", "Japan"], ["+82", "South Korea"], ["+86", "China"], ["+852", "Hong Kong"], ["+886", "Taiwan"], ["+91", "India"], ["+971", "United Arab Emirates"], ["+966", "Saudi Arabia"], ["+974", "Qatar"], ["+49", "Germany"], ["+33", "France"], ["+34", "Spain"], ["+39", "Italy"], ["+31", "Netherlands"], ["+46", "Sweden"], ["+55", "Brazil"], ["+52", "Mexico"], ["+64", "New Zealand"], ["+27", "South Africa"]];
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
function passwordProblem(pw) {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (pw.length > 72) return "Use 72 characters or fewer.";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Include at least one letter and one number.";
  return "";
}
// Phone rules: national digits after the country code. Common lengths per country; others accept 6–12 digits.
const PHONE_RULES = { "+63": { len: [10], start: "9", example: "917 123 4567", hint: "10 digits starting with 9. Leave out the first 0 (09… becomes 9…)." },
  "+1": { len: [10], example: "415 555 0123", hint: "10 digits: area code + number." }, "+44": { len: [10], start: "7", example: "7400 123456", hint: "10 digits starting with 7 for mobiles (drop the first 0)." },
  "+61": { len: [9], start: "4", example: "412 345 678", hint: "9 digits starting with 4 (drop the first 0)." }, "+65": { len: [8], example: "8123 4567", hint: "8 digits." },
  "+60": { len: [9, 10], start: "1", example: "12 345 6789", hint: "9–10 digits starting with 1 (drop the first 0)." }, "+62": { len: [9, 10, 11, 12], start: "8", example: "812 3456 7890", hint: "9–12 digits starting with 8 (drop the first 0)." },
  "+91": { len: [10], example: "98765 43210", hint: "10 digits." }, "+81": { len: [10], example: "90 1234 5678", hint: "10 digits (drop the first 0)." } };
function normalizePhone(cc, raw) {
  let d = String(raw || "").replace(/[^\d+]/g, "");
  if (d.startsWith("+")) { const c = cc.replace("+", ""); d = d.slice(1); if (d.startsWith(c)) d = d.slice(c.length); }
  else { const c = cc.replace("+", ""); if (d.startsWith("00" + c)) d = d.slice(2 + c.length); else if (d.length > 10 && d.startsWith(c)) d = d.slice(c.length); }
  d = d.replace(/^0+/, "");
  const rule = PHONE_RULES[cc] || { len: [6, 7, 8, 9, 10, 11, 12], example: "", hint: "Enter your number without the country code." };
  let error = "";
  if (!d) error = "Enter your mobile number.";
  else if (!rule.len.includes(d.length)) error = `This number has ${d.length} digits; ${cc} numbers need ${rule.len.length > 1 ? rule.len[0] + "–" + rule.len[rule.len.length - 1] : rule.len[0]}.`;
  else if (rule.start && !d.startsWith(rule.start)) error = `Mobile numbers for ${cc} start with ${rule.start}.`;
  return { e164: cc + d, digits: d, error, rule };
}
function friendlyError(e) {
  const m = (e && (e.message || e.error_description || e.msg)) || String(e || "");
  if (/don’t match/.test(m)) return m;
  if (/Invalid login credentials/i.test(m)) return "That username and password don’t match.";
  if (/User already registered|already been registered|already exists/i.test(m)) return "An account already uses that email or number. Sign in instead, or use “Forgot password”.";
  if (/Password should be|password.*(short|weak|at least)/i.test(m)) return "Choose a stronger password: at least 8 characters with letters and numbers.";
  if (/same.*password|different from the old/i.test(m)) return "Your new password must be different from the old one.";
  if (/not confirmed/i.test(m)) return "Verify your email or phone first. We can send a new code.";
  if (/invalid.*phone|phone.*invalid|Invalid phone/i.test(m)) return "That mobile number isn’t valid. Check the country code and digits.";
  if (/USERNAME_TAKEN/.test(m)) return "That username is already taken. Try another.";
  if (/USERNAME_INVALID/.test(m)) return "Usernames are 3–20 characters: letters, numbers and underscores.";
  if (/NOT_VERIFIED/.test(m)) return "Verify your email or phone before choosing a username.";
  if (/Signups not allowed|User not found|not found/i.test(m)) return "No account uses that email or phone yet. Create an account instead.";
  if (/expired|invalid.*(otp|token)|token.*(invalid|expired)/i.test(m)) return "That code is wrong or has expired. Request a new one.";
  if (/only request this after (\d+)/i.test(m)) return "Please wait " + m.match(/after (\d+)/i)[1] + " seconds before requesting another code.";
  if (/rate limit|too many/i.test(m)) return "Too many attempts. Wait a minute and try again.";
  if (/phone.*(provider|sms)|Unsupported phone provider/i.test(m)) return "Text-message codes aren’t set up on this server yet. Use email instead.";
  if (/Failed to fetch|NetworkError|network/i.test(m)) return "Couldn’t reach the server. Check your connection and try again.";
  return m || "Something went wrong. Try again.";
}
const Net = {
  sb: null, session: null, user: null, profile: null, cfgError: null, onChange: null,
  async init() {
    try {
      const r = await fetch("/api/config", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { this.cfgError = j.missing ? "The server is missing: " + j.missing.join(", ") : "The game server isn’t configured (no /api/config)."; return false; }
      if (!window.supabase || !window.supabase.createClient) { this.cfgError = "The sign-in library failed to load. Check your connection and refresh."; return false; }
      this.sb = window.supabase.createClient(j.url, j.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      const { data } = await this.sb.auth.getSession();
      this.session = data.session; this.user = data.session ? data.session.user : null;
      this.sb.auth.onAuthStateChange((evt, s) => { this.session = s; this.user = s ? s.user : null; if (this.onChange) this.onChange(evt); });
      return true;
    } catch (e) { this.cfgError = "Couldn’t reach the game server. Check your connection and refresh."; return false; }
  },
  contactLabel() {
    const u = this.user; if (!u) return "";
    if (u.email) { const [n, d] = u.email.split("@"); return n.slice(0, 2) + "•••@" + d; }
    if (u.phone) return "+" + String(u.phone).replace(/^\+/, "").slice(0, 3) + " ••• " + String(u.phone).slice(-3);
    return "";
  },
  async usernameAvailable(name) { const { data, error } = await this.sb.rpc("username_available", { p_name: name }); if (error) throw error; return !!data; },
  async sendCode(contact, create) {
    const options = { shouldCreateUser: !!create };
    const req = contact.email ? { email: contact.email, options: { ...options, emailRedirectTo: location.origin } } : { phone: contact.phone, options };
    const { error } = await this.sb.auth.signInWithOtp(req);
    if (error) throw error;
  },
  async verifyCode(contact, token) {
    const { data, error } = await this.sb.auth.verifyOtp(contact.email ? { email: contact.email, token, type: "email" } : { phone: contact.phone, token, type: "sms" });
    if (error) throw error;
    this.session = data.session; this.user = data.user || (data.session && data.session.user);
  },
  // ---- username + password
  async usernameLogin(username, password) {
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const j = await r.json().catch(() => ({ error: "The server sent an unexpected response." }));
    if (!r.ok) { const e = new Error(j.error || "Sign-in failed."); e.status = r.status; e.data = j; throw e; }
    const { data, error } = await this.sb.auth.setSession({ access_token: j.access_token, refresh_token: j.refresh_token });
    if (error) throw error;
    this.session = data.session; this.user = data.user || (data.session && data.session.user);
  },
  async signUpPassword(contact, password, username) {
    const req = contact.email ? { email: contact.email, password, options: { emailRedirectTo: location.origin, data: { username } } } : { phone: contact.phone, password, options: { data: { username } } };
    const { data, error } = await this.sb.auth.signUp(req);
    if (error) throw error;
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error("User already registered");
    if (data.session) { this.session = data.session; this.user = data.session.user; }
    return !!data.session;   // true = signed in already (verification turned off in Supabase)
  },
  async verifySignup(contact, token) {
    let res = await this.sb.auth.verifyOtp(contact.email ? { email: contact.email, token, type: "email" } : { phone: contact.phone, token, type: "sms" });
    if (res.error && contact.email) res = await this.sb.auth.verifyOtp({ email: contact.email, token, type: "signup" });
    if (res.error) throw res.error;
    this.session = res.data.session; this.user = res.data.user || (res.data.session && res.data.session.user);
  },
  async resendSignup(contact) { const { error } = await this.sb.auth.resend(contact.email ? { type: "signup", email: contact.email, options: { emailRedirectTo: location.origin } } : { type: "sms", phone: contact.phone }); if (error) throw error; },
  async setPassword(pw) { const { error } = await this.sb.auth.updateUser({ password: pw }); if (error) throw error; },
  async refreshUser() { const { data } = await this.sb.auth.getSession(); this.session = data.session; this.user = data.session ? data.session.user : null; return this.user; },
  async claimUsername(name) { const { data, error } = await this.sb.rpc("claim_username", { p_name: name }); if (error) throw error; this.profile = data; return data; },
  async loadProfile() { const { data, error } = await this.sb.from("profiles").select("id,username,avatar,created_at").eq("id", this.user.id).maybeSingle(); if (error) throw error; this.profile = data; return data; },
  async setAvatar(id) { const { error } = await this.sb.from("profiles").update({ avatar: id }).eq("id", this.user.id); if (error) throw error; if (this.profile) this.profile.avatar = id; },
  async loadSave() { const { data, error } = await this.sb.from("saves").select("data,updated_at").eq("user_id", this.user.id).maybeSingle(); if (error) throw error; return data ? data.data : null; },
  async writeSave(save) { const { error } = await this.sb.from("saves").upsert({ user_id: this.user.id, data: save }, { onConflict: "user_id" }); if (error) throw error; },
  async api(path, body) {
    const { data } = await this.sb.auth.getSession();
    const token = data.session && data.session.access_token;
    const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({ error: "The server sent an unexpected response." }));
    if (!r.ok) { const e = new Error(j.error || "Request failed."); e.status = r.status; e.data = j; throw e; }
    return j;
  },
  startRun() { return this.api("/api/run-start"); },
  submitRun(runId, events) { return this.api("/api/run-submit", { runId, events }); },
  async leaderboard(kind, key) { const { data, error } = await this.sb.rpc("get_leaderboard", { p_kind: kind, p_key: key || null, p_limit: 100 }); if (error) throw error; return data || []; },
  async standing(kind, key) { const { data, error } = await this.sb.rpc("get_my_standing", { p_kind: kind, p_key: key || null }); if (error) throw error; return (data && data[0]) || null; },
  async periods(kind) { const { data, error } = await this.sb.rpc("list_periods", { p_kind: kind, p_limit: 60 }); if (error) throw error; return data || []; },
  async endlessBest() { const { data, error } = await this.sb.rpc("my_endless_best"); if (error) throw error; return (data && data[0]) || null; },
  async signOut() { try { await this.sb.auth.signOut(); } finally { this.session = null; this.user = null; this.profile = null; } },
};

// ============================================================ Manila time helpers (UTC+8, no daylight saving)
const MANILA_OFFSET = 8 * 3600e3;
function manilaDateKey(ms = Date.now()) { return new Date(ms + MANILA_OFFSET).toISOString().slice(0, 10); }
function manilaWeekKey(ms = Date.now()) { const d = new Date(ms + MANILA_OFFSET); const dow = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow)).toISOString().slice(0, 10); }
function nextResetMs(kind, ms = Date.now()) {
  const d = new Date(ms + MANILA_OFFSET); const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - MANILA_OFFSET;
  if (kind === "daily") return midnight;
  const dow = (d.getUTCDay() + 6) % 7; return midnight + (6 - dow) * 86400e3;
}
function shiftKey(kind, key, dir) { const t = Date.parse(key + "T00:00:00Z") + dir * (kind === "weekly" ? 7 : 1) * 86400e3; return new Date(t).toISOString().slice(0, 10); }
if (typeof module === "object" && module.exports) module.exports = { sanitizeSave, convertV1, mergeSaves, blankSave, manilaDateKey, manilaWeekKey, nextResetMs, shiftKey, USERNAME_RE, refreshUnlocks, normalizePhone, passwordProblem };
