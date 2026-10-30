/* TEST-ONLY in-browser stand-in for Supabase + the /api functions, used to drive the UI in a headless browser.
   It is never included in the production build (tools/build.js only adds it with --test). The OTP code is 123456. */
(function () {
  const DB_KEY = "__fake_db";
  const load = () => { try { return JSON.parse(localStorage.getItem(DB_KEY)) || null; } catch (e) { return null; } };
  const db = load() || { users: [], profiles: [], saves: [], runs: [], session: null };
  const persist = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
  let pending = null; const listeners = [];
  const uid = () => "u" + Math.random().toString(36).slice(2, 10) + "-0000-0000-0000-000000000000".slice(0, 28);
  const me = () => db.session && db.users.find((u) => u.id === db.session.user.id);
  const manila = (iso, kind) => { const d = new Date(Date.parse(iso) + 8 * 3600e3); if (kind === "daily") return d.toISOString().slice(0, 10); const dow = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow)).toISOString().slice(0, 10); };
  const curKey = (kind) => manila(new Date().toISOString(), kind);
  function ranked(kind, key) {
    key = key || curKey(kind);
    const best = {};
    for (const r of db.runs) if (r.status === "valid" && manila(r.finished_at, kind) === key) { const b = best[r.user_id]; if (!b || r.score > b.score || (r.score === b.score && r.finished_at < b.finished_at)) best[r.user_id] = r; }
    return Object.values(best).sort((a, b) => b.score - a.score || a.finished_at.localeCompare(b.finished_at)).map((r, i) => ({ ...r, rank: i + 1 }));
  }
  const rpcs = {
    username_available: ({ p_name }) => /^[A-Za-z0-9_]{3,20}$/.test(p_name) && !db.profiles.some((p) => p.username.toLowerCase() === p_name.toLowerCase() && (!me() || p.id !== me().id)),
    claim_username: ({ p_name }) => {
      const u = me(); if (!u) throw { message: "NOT_SIGNED_IN" };
      if (!/^[A-Za-z0-9_]{3,20}$/.test(p_name)) throw { message: "USERNAME_INVALID" };
      if (db.profiles.some((p) => p.username.toLowerCase() === p_name.toLowerCase() && p.id !== u.id)) throw { message: "USERNAME_TAKEN" };
      let p = db.profiles.find((x) => x.id === u.id);
      if (p) p.username = p_name; else { p = { id: u.id, username: p_name, avatar: "lumi", created_at: new Date().toISOString() }; db.profiles.push(p); }
      persist(); return { ...p };
    },
    get_leaderboard: ({ p_kind, p_key }) => ranked(p_kind, p_key).slice(0, 100).map((r) => ({ rank: r.rank, username: (db.profiles.find((p) => p.id === r.user_id) || {}).username, avatar: r.avatar, score: r.score, survival_ms: r.survival_ms, finished_at: r.finished_at, is_me: me() && r.user_id === me().id })),
    get_my_standing: ({ p_kind, p_key }) => { const all = ranked(p_kind, p_key), m = all.find((r) => me() && r.user_id === me().id); return [{ rank: m ? m.rank : null, score: m ? m.score : null, survival_ms: m ? m.survival_ms : null, players: all.length }]; },
    list_periods: ({ p_kind }) => { const ks = {}; for (const r of db.runs) if (r.status === "valid") { const k = manila(r.finished_at, p_kind); (ks[k] = ks[k] || new Set()).add(r.user_id); } return Object.keys(ks).sort().reverse().map((k) => ({ period: k, players: ks[k].size })); },
    my_endless_best: () => { const rs = db.runs.filter((r) => me() && r.user_id === me().id && r.status === "valid"); return [{ best_score: rs.length ? Math.max(...rs.map((r) => r.score)) : null, best_survival_ms: rs.length ? Math.max(...rs.map((r) => r.survival_ms)) : null, valid_runs: rs.length }]; },
  };
  function table(name) {
    const st = { filters: [], op: "select", patch: null };
    const rows = () => db[name].filter((r) => st.filters.every(([k, v]) => r[k] === v));
    const exec = () => {
      if (st.op === "update") { rows().forEach((r) => Object.assign(r, st.patch)); persist(); return { data: null, error: null }; }
      if (st.op === "upsert") { const ex = db[name].find((r) => r.user_id === st.patch.user_id); if (ex) Object.assign(ex, st.patch); else db[name].push({ ...st.patch }); persist(); return { data: null, error: null }; }
      return { data: rows().map((r) => ({ ...r })), error: null };
    };
    const q = {
      select() { return q; }, eq(k, v) { st.filters.push([k, v]); return q; },
      update(p) { st.op = "update"; st.patch = p; return q; }, upsert(p) { st.op = "upsert"; st.patch = p; return q; },
      maybeSingle() { const r = exec(); return Promise.resolve({ data: r.data ? r.data[0] || null : null, error: null }); },
      then(res, rej) { return Promise.resolve(exec()).then(res, rej); },
    };
    return q;
  }
  const delay = (v) => new Promise((r) => setTimeout(() => r(v), 60));
  const client = {
    auth: {
      async getSession() { return { data: { session: db.session } }; },
      onAuthStateChange(fn) { listeners.push(fn); return { data: { subscription: { unsubscribe() {} } } }; },
      async signInWithOtp({ email, phone, options }) {
        const u = db.users.find((x) => (email && x.email === email) || (phone && x.phone === phone.replace("+", "")));
        if (!u && !options.shouldCreateUser) return delay({ error: { message: "Signups not allowed for otp" } });
        if (window.__fakeCooldown && pending && Date.now() - pending.at < 60000 && pending.key === (email || phone)) return delay({ error: { message: "For security purposes, you can only request this after 52 seconds." } });
        pending = { key: email || phone, email, phone, create: options.shouldCreateUser, at: Date.now() }; window.__fakeSent = (window.__fakeSent || 0) + 1;
        return delay({ error: null });
      },
      async verifyOtp({ email, phone, token }) {
        if (!pending || pending.key !== (email || phone) || token !== "123456") return delay({ error: { message: "Token has expired or is invalid" } });
        let u = db.users.find((x) => (email && x.email === email) || (phone && x.phone === phone.replace("+", "")));
        if (!u) { u = { id: uid(), email: email || null, phone: phone ? phone.replace("+", "") : null }; db.users.push(u); }
        u.confirmed = true;
        db.session = { access_token: "tok-" + u.id, user: { ...u, email_confirmed_at: "now" } }; persist(); listeners.forEach((f) => f("SIGNED_IN", db.session));
        return delay({ data: { session: db.session, user: u }, error: null });
      },
      async signInAnonymously({ options } = {}) {
        if (window.__fakeNoAnon) return delay({ error: { message: "Anonymous sign-ins are disabled" } });
        const u = { id: uid(), email: null, phone: null, is_anonymous: true, confirmed: true };
        db.users.push(u); db.session = { access_token: "tok-" + u.id, user: { ...u } }; persist(); listeners.forEach((f) => f("SIGNED_IN", db.session));
        return delay({ data: { session: db.session, user: db.session.user }, error: null });
      },
      async signUp({ email, phone, password, options }) {
        if (db.users.some((x) => (email && x.email === email) || (phone && x.phone === phone.replace("+", "")))) return delay({ data: { user: { identities: [] }, session: null }, error: null });
        if (!password || password.length < 8) return delay({ error: { message: "Password should be at least 8 characters" } });
        const u = { id: uid(), email: email || null, phone: phone ? phone.replace("+", "") : null, password, confirmed: !!window.__fakeAutoConfirm };
        db.users.push(u); persist(); pending = { key: email || phone, email, phone, create: true, at: Date.now(), signup: u.id }; window.__fakeSent = (window.__fakeSent || 0) + 1;
        if (u.confirmed) { db.session = { access_token: "tok-" + u.id, user: { ...u, email_confirmed_at: "now" } }; persist(); }
        return delay({ data: { user: { id: u.id, identities: [{}] }, session: u.confirmed ? db.session : null }, error: null });
      },
      async resend({ email, phone }) { pending = { ...(pending || {}), key: email || phone, email, phone, at: Date.now() }; window.__fakeSent = (window.__fakeSent || 0) + 1; return delay({ error: null }); },
      async updateUser({ password, email }) { const u = me(); if (!u) return { error: { message: "not signed in" } }; if (password && password.length < 8) return { error: { message: "Password should be at least 8 characters" } };
        if (password) u.password = password; if (email) { u.email = email; u.is_anonymous = false; } db.session.user = { ...u, email_confirmed_at: "now" }; persist(); return { data: { user: db.session.user }, error: null }; },
      async setSession({ access_token }) { const u = db.users.find((x) => "tok-" + x.id === access_token); if (!u) return { error: { message: "bad session" } }; db.session = { access_token, user: { ...u, email_confirmed_at: "now" } }; persist(); listeners.forEach((f) => f("SIGNED_IN", db.session)); return { data: { session: db.session, user: db.session.user }, error: null }; },
      async signOut() { db.session = null; persist(); listeners.forEach((f) => f("SIGNED_OUT", null)); return { error: null }; },
    },
    // Realtime broadcast + presence, emulated across browser tabs with localStorage "storage" events (test-only)
    channel(name) {
      const subs = { broadcast: [], presence: [] }, pkey = "__rtp:" + name + ":", bkey = "__rtb:" + name; let me = null, hb = null;
      const state = () => { const out = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(pkey)) { try { const v = JSON.parse(localStorage.getItem(k)); if (Date.now() - v.ts < 6000) out[k.slice(pkey.length)] = [v.meta]; } catch (e) {} } } return out; };
      const firePresence = () => subs.presence.forEach((f) => f());
      const onStorage = (e) => { if (!e.key) return; if (e.key === bkey && e.newValue) { const m = JSON.parse(e.newValue); subs.broadcast.forEach((f) => f({ payload: m.payload })); } else if (e.key.startsWith(pkey)) firePresence(); };
      window.addEventListener("storage", onStorage);
      const ch = {
        on(type, filter, cb) { (type === "broadcast" ? subs.broadcast : subs.presence).push(cb); return ch; },
        subscribe(cb) { setTimeout(() => cb("SUBSCRIBED"), 30); return ch; },
        async track(meta) { me = meta.key; const put = () => { localStorage.setItem(pkey + me, JSON.stringify({ meta, ts: Date.now() })); firePresence(); }; put(); hb = setInterval(put, 2000); },
        presenceState: state,
        send({ payload }) { localStorage.setItem(bkey, JSON.stringify({ payload, n: Math.random() })); },
        _close() { clearInterval(hb); window.removeEventListener("storage", onStorage); if (me) localStorage.removeItem(pkey + me); },
      };
      return ch;
    },
    removeChannel(ch) { ch._close && ch._close(); },
    async rpc(name, args) { try { return await delay({ data: rpcs[name](args || {}), error: null }); } catch (e) { return { data: null, error: e }; } },
    from: table,
  };
  window.supabase = { createClient: () => client };
  const realFetch = window.fetch.bind(window);
  window.fetch = async (url, opts = {}) => {
    const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
    if (url === "/api/config") return json(200, { ok: true, url: "fake", anonKey: "fake" });
    if (url === "/api/login") {
      const { username, password } = JSON.parse(opts.body);
      const p = db.profiles.find((x) => x.username.toLowerCase() === String(username).toLowerCase()), u = p && db.users.find((x) => x.id === p.id);
      if (!u || u.password !== password) return json(401, { error: "That username and password don’t match." });
      if (!u.confirmed) return json(403, { error: "Verify your email or phone first, then sign in.", needsVerify: true });
      return json(200, { ok: true, access_token: "tok-" + u.id, refresh_token: "r" });
    }
    if (url === "/api/run-start") {
      const u = me(); if (!u) return json(401, { error: "Sign in to play ranked runs." });
      const p = db.profiles.find((x) => x.id === u.id);
      db.runs.filter((r) => r.user_id === u.id && r.status === "open").forEach((r) => (r.status = "abandoned"));
      const run = { id: "run" + Math.random().toString(36).slice(2), user_id: u.id, seed: (Math.random() * 2 ** 31) >>> 0, status: "open", started_at: new Date(Date.now() - (window.__fakeClockSkew || 0)).toISOString(), avatar: p.avatar };
      db.runs.push(run); persist(); return json(200, { runId: run.id, seed: run.seed, rulesVersion: 1 });
    }
    if (url === "/api/run-submit") {
      const u = me(), body = JSON.parse(opts.body), run = db.runs.find((r) => r.id === body.runId && u && r.user_id === u.id);
      if (!run) return json(404, { error: "This run session wasn’t found for your account." });
      if (run.status !== "open") return json(409, { error: "This run was already submitted.", duplicate: true });
      const res = window.EndlessRules.validate(run.seed, body.events, (Date.now() - Date.parse(run.started_at)) / 1000);
      Object.assign(run, res.ok ? { status: "valid", score: res.score, survival_ms: Math.round(res.survival * 1000), kills: res.kills, finished_at: new Date().toISOString() } : { status: "rejected", reject_reason: res.reason, finished_at: new Date().toISOString() });
      persist(); return res.ok ? json(200, { ok: true, score: res.score, survival: res.survival, kills: res.kills }) : json(422, { ok: false, error: res.reason });
    }
    return realFetch(url, opts);
  };
  window.__fake = { db, persist, seedRun(username, score, isoTime, avatar = "nova") { let p = db.profiles.find((x) => x.username === username); if (!p) { const id = uid(); db.users.push({ id, email: username + "@x.com" }); p = { id, username, avatar, created_at: new Date().toISOString() }; db.profiles.push(p); } db.runs.push({ id: "seed" + Math.random(), user_id: p.id, seed: 1, status: "valid", score, survival_ms: 123000, kills: 50, finished_at: isoTime, avatar }); persist(); } };
})();
