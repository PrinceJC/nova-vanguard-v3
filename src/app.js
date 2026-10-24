"use strict";
const h = React.createElement;
const { useState, useEffect, useRef, useCallback } = React;
const IS_TOUCH = typeof window !== "undefined" && ((window.matchMedia && window.matchMedia("(pointer: coarse)").matches) || "ontouchstart" in window);
const KEYMAP = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right", Space: "fire" };
const fmt = (n) => Math.round(n || 0).toLocaleString();
const PENDING_NAME = "lumi-pending-username";
const cacheKey = (uid) => "lumi-v2-cache:" + uid, migratedKey = (uid) => "lumi-v1-migrated:" + uid;
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) {} };

// ============================================================ orientation + device helpers
// Ask for landscape when a game starts (needs a user tap). Android/Chrome and installed apps support fullscreen +
// orientation lock; iOS Safari does not, so the rotate prompt covers that case.
function requestLandscape() {
  if (!IS_TOUCH) return;
  const el = document.documentElement;
  const lock = () => { try { const p = screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape"); if (p && p.catch) p.catch(() => {}); } catch (e) {} };
  try { if (!document.fullscreenElement && el.requestFullscreen) { const p = el.requestFullscreen({ navigationUI: "hide" }); if (p && p.then) p.then(lock, lock); else lock(); } else lock(); } catch (e) { lock(); }
}
const isPortrait = () => IS_TOUCH && window.innerHeight > window.innerWidth * 1.05;

// ============================================================ small components
function Btn({ children, onClick, main, disabled, small, label, auto, type }) {
  const ref = useRef(null);
  useEffect(() => { if (auto && ref.current && !IS_TOUCH) ref.current.focus(); }, [auto]);
  return h("button", { ref, type: type || "button", className: "btn" + (main ? " main" : "") + (small ? " small" : ""), disabled, "aria-label": label, onClick: (e) => { Sound.init(); Sound.play("click"); onClick && onClick(e); } }, children);
}
function Toggle({ on, onChange, children }) { return h("button", { className: "toggle" + (on ? " on" : ""), "aria-pressed": on, onClick: () => { Sound.init(); Sound.play("click"); onChange(!on); } }, h("span", { className: "knob" }), children); }
function Slider({ value, onChange, label }) {
  return h("label", { className: "slider" }, h("span", null, label), h("input", { type: "range", min: 0, max: 100, value: Math.round(value * 100), onChange: (e) => onChange(+e.target.value / 100) }), h("output", null, Math.round(value * 100)));
}
function Seg({ value, options, onChange, label }) {
  return h("div", { className: "seg", role: "radiogroup", "aria-label": label }, options.map(([v, t]) => h("button", { key: v, role: "radio", "aria-checked": value === v, className: value === v ? "on" : "", onClick: () => { Sound.play("click"); onChange(v); } }, t)));
}
function Portrait({ id, size = 44, locked }) { return h("img", { className: "portrait" + (locked ? " locked" : ""), src: avatarPortrait(id), width: size, height: size, alt: "" }); }
function Page({ title, onBack, backLabel = "Back", children, right }) {
  return h("div", { className: "page" }, h("header", null, h("h2", null, title), h("div", { className: "row" }, right, onBack && h(Btn, { small: true, onClick: onBack, auto: true }, backLabel))), children);
}

// animated avatar preview (hover + periodic firing + hurt flinch) using the in-game renderer
function AvatarPreview({ id, w = 298, h: hh = 150 }) {
  const ref = useRef(null);
  useEffect(() => {
    let raf, last = performance.now(), t = 0, fire = 0;
    const fake = { avatar: id, pbul: [] };
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const c = ref.current; if (!c) return; const ctx = c.getContext("2d"), dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, w, hh);
      fire -= dt; let frame = "idle";
      if (t % 4 > 3.3) frame = "hurt";
      else if (fire <= 0) { fire = 0.24; const tier = 1 + Math.floor(t / 2.5) % 3, mz = muzzleFor(id); for (const a of SHOT_PATTERNS[tier]) fake.pbul.push({ x: 92 + mz[0] * 0.85, y: hh / 2 + mz[1] * 0.85, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, age: 0 }); frame = "fire"; }
      else if (fire > 0.12) frame = "fire";
      for (const b of fake.pbul) { b.x += b.vx * dt; b.age += dt; }
      fake.pbul = fake.pbul.filter((b) => b.x < w + 20);
      drawPlayerShots(ctx, fake, 2);
      ctx.save(); ctx.translate(0, Math.sin(now / 160) * 3);
      drawSprWH(ctx, `av_${id}_${frame}`, 92, hh / 2 + 2 * PLAYER_ART_K * 0.85, 124 * PLAYER_ART_K * 0.85, 84 * PLAYER_ART_K * 0.85, { white: frame === "hurt" && t % 4 < 3.45 ? 0.5 : 0 }); ctx.restore();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [id]);
  return h("canvas", { ref, width: w * 2, height: hh * 2, style: { width: w, height: hh }, className: "preview", "aria-label": "Animated preview" });
}

// ============================================================ touch controls
function TouchControls({ input, game }) {
  const base = useRef(null), knob = useRef(null), id = useRef(null), origin = useRef({ x: 0, y: 0 });
  const [cd, setCd] = useState(0);
  useEffect(() => { const t = setInterval(() => { const g = game.current; setCd(g ? Math.max(0, g.player.specialCd) : 0); }, 200); return () => clearInterval(t); }, []);
  const start = (e) => {
    const t = e.changedTouches[0]; id.current = t.identifier;
    const r = e.currentTarget.getBoundingClientRect(), sc = r.width / 470;
    origin.current = { x: t.clientX, y: t.clientY, sc };
    if (base.current) { base.current.style.left = (t.clientX - r.left) / sc - 60 + "px"; base.current.style.top = (t.clientY - r.top) / sc - 60 + "px"; base.current.style.opacity = 1; }
    e.preventDefault();
  };
  const move = (e) => {
    for (const t of e.changedTouches) if (t.identifier === id.current) {
      const o = origin.current, max = 50; let dx = (t.clientX - o.x) / o.sc, dy = (t.clientY - o.y) / o.sc; const l = Math.hypot(dx, dy);
      if (l > max * 1.35) { // floating stick: the base follows a thumb that slides far, so direction changes stay instant
        const k = (l - max) / l; o.x += (t.clientX - o.x) * k; o.y += (t.clientY - o.y) * k;
        if (base.current) { base.current.style.left = parseFloat(base.current.style.left) + dx * k + "px"; base.current.style.top = parseFloat(base.current.style.top) + dy * k + "px"; }
        dx *= 1 - k; dy *= 1 - k;
      }
      if (Math.hypot(dx, dy) > max) { const m = Math.hypot(dx, dy); dx = (dx / m) * max; dy = (dy / m) * max; }
      const mag = Math.hypot(dx, dy); input.current.joyX = mag < 5 ? 0 : dx / max; input.current.joyY = mag < 5 ? 0 : dy / max;
      if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    e.preventDefault();
  };
  const end = (e) => { for (const t of e.changedTouches) if (t.identifier === id.current) { id.current = null; input.current.joyX = 0; input.current.joyY = 0; if (knob.current) knob.current.style.transform = "translate(0,0)"; if (base.current) base.current.style.opacity = 0.45; } };
  return h(React.Fragment, null,
    h("div", { className: "joyzone", onTouchStart: start, onTouchMove: move, onTouchEnd: end, onTouchCancel: end }, h("div", { className: "joybase", ref: base }, h("div", { className: "joyknob", ref: knob }))),
    h("button", { className: "specialbtn" + (cd <= 0 ? " ready" : ""), "aria-label": "Special blast", onTouchStart: (e) => { e.preventDefault(); input.current.specialPressed = true; } }, cd > 0 ? Math.ceil(cd) : "Blast"));
}

// ============================================================ sign-up / sign-in
function ContactInput({ contact, setContact, showErrors }) {
  const ph = contact.kind === "phone" ? normalizePhone(contact.cc, contact.num) : null;
  return h("div", { className: "contact" },
    h(Seg, { label: "Verify with", value: contact.kind, options: [["email", "Email"], ["phone", "Mobile number"]], onChange: (k) => setContact({ ...contact, kind: k }) }),
    contact.kind === "email"
      ? h("label", { className: "field" }, h("span", null, "Email address"), h("input", { type: "email", autoComplete: "email", inputMode: "email", value: contact.email, onChange: (e) => setContact({ ...contact, email: e.target.value.trim() }), placeholder: "you@example.com" }))
      : h(React.Fragment, null,
          h("div", { className: "phone" },
            h("label", { className: "field cc" }, h("span", null, "Country code"), h("select", { value: contact.cc, onChange: (e) => setContact({ ...contact, cc: e.target.value }) }, COUNTRY_CODES.map(([c, n]) => h("option", { key: c + n, value: c }, `${c} ${n}`)))),
            h("label", { className: "field" }, h("span", null, "Mobile number"), h("input", { type: "tel", autoComplete: "tel-national", inputMode: "tel", value: contact.num, onChange: (e) => setContact({ ...contact, num: e.target.value.replace(/[^\d\s+()-]/g, "") }), placeholder: ph.rule.example || "Mobile number", "aria-describedby": "phonehint" }))),
          h("p", { id: "phonehint", className: "hint" + (ph.error && (showErrors || contact.num.length > 4) ? " bad" : !ph.error ? " ok" : ""), "aria-live": "polite" },
            !contact.num ? ph.rule.hint : ph.error && (showErrors || contact.num.length > 4) ? ph.error : !ph.error ? `We’ll text ${contact.cc} ${ph.digits.replace(/(\d{3})(\d{3})(\d+)/, "$1 $2 $3")}` : ph.rule.hint)));
}
function contactValue(c) {
  if (c.kind === "email") { if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) throw new Error("Enter a valid email address, like name@example.com."); return { email: c.email.toLowerCase() }; }
  const ph = normalizePhone(c.cc, c.num); if (ph.error) throw new Error(ph.error); return { phone: ph.e164 };
}
function PasswordFields({ pw, setPw, pw2, setPw2, label = "Password", showErrors }) {
  const prob = passwordProblem(pw), mismatch = pw2 && pw !== pw2;
  return h(React.Fragment, null,
    h("label", { className: "field" }, h("span", null, label), h("input", { type: "password", autoComplete: "new-password", value: pw, onChange: (e) => setPw(e.target.value), "aria-describedby": "pwhint" })),
    h("label", { className: "field" }, h("span", null, "Confirm password"), h("input", { type: "password", autoComplete: "new-password", value: pw2, onChange: (e) => setPw2(e.target.value) })),
    h("p", { id: "pwhint", className: "hint " + ((prob && (showErrors || pw)) || mismatch ? "bad" : pw ? "ok" : ""), "aria-live": "polite" },
      !pw ? "At least 8 characters, with a letter and a number." : prob ? prob : mismatch ? "The passwords don’t match." : "Strong enough"));
}

// mode: signin | signup | otp (code sign-in) | recover (forgot password) | claim (choose username after verification)
function AuthFlow({ mode: startMode, onDone, onBack, startStep }) {
  const [mode, setMode] = useState(startMode);
  const [step, setStep] = useState(startStep || (startMode === "signup" ? "username" : startMode === "signin" ? "login" : "contact"));
  const [name, setName] = useState(lsGet(PENDING_NAME) || ""); const [avail, setAvail] = useState(null);
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [contact, setContact] = useState({ kind: "email", email: "", cc: "+63", num: "" });
  const [code, setCode] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [cool, setCool] = useState(0); const [tried, setTried] = useState(false);
  const sentTo = useRef(null);
  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);
  useEffect(() => {
    if (step !== "username" && step !== "claim") return;
    if (!USERNAME_RE.test(name)) { setAvail(null); return; }
    setAvail("checking"); const t = setTimeout(() => Net.usernameAvailable(name).then((ok) => setAvail(ok ? "yes" : "no")).catch(() => setAvail("error")), 350);
    return () => clearTimeout(t);
  }, [name, step]);
  // Email links: if the player taps the link in the email instead of typing the code, this tab notices the sign-in.
  useEffect(() => {
    if (step !== "code") return;
    const t = setInterval(async () => { const u = await Net.refreshUser().catch(() => null); if (u && (u.email_confirmed_at || u.phone_confirmed_at)) { clearInterval(t); finish(); } }, 3000);
    return () => clearInterval(t);
  }, [step]);
  const go = (m, s) => { setErr(""); setTried(false); setMode(m); setStep(s); };
  const run = async (fn) => { setErr(""); setBusy(true); try { await fn(); } catch (e) { setErr(friendlyError(e)); } finally { setBusy(false); } };
  const finish = async () => {
    const prof = await Net.loadProfile();
    if (prof) { lsDel(PENDING_NAME); return mode === "recover" ? setStep("newpass") : onDone(); }
    if (USERNAME_RE.test(name)) { try { await Net.claimUsername(name); lsDel(PENDING_NAME); return onDone(); } catch (e) { setErr(friendlyError(e)); } }
    setStep("claim");
  };
  const nameOk = USERNAME_RE.test(name) && avail === "yes";
  const nameHint = !name ? "3–20 characters: letters, numbers and underscores." : !USERNAME_RE.test(name) ? "Use 3–20 letters, numbers or underscores (no spaces)." : avail === "checking" ? "Checking…" : avail === "yes" ? "Available" : avail === "no" ? "That username is already taken." : avail === "error" ? "Couldn’t check right now." : "";
  const usernameForm = (claim) => h("form", { onSubmit: (e) => { e.preventDefault(); if (!nameOk) return; if (claim) run(async () => { await Net.claimUsername(name); lsDel(PENDING_NAME); onDone(); }); else { lsSet(PENDING_NAME, name); go("signup", "password"); } } },
    h("h2", null, claim ? "Choose your username" : "Create your account"),
    h("p", { className: "note" }, "Your username is how you sign in and how other players see you on leaderboards."),
    h("label", { className: "field" }, h("span", null, "Username"), h("input", { autoFocus: !IS_TOUCH, maxLength: 20, autoComplete: "username", value: name, onChange: (e) => setName(e.target.value.replace(/\s/g, "")), "aria-describedby": "namehint" })),
    h("p", { id: "namehint", className: "hint " + (nameOk ? "ok" : avail === "no" || (name && !USERNAME_RE.test(name)) ? "bad" : ""), "aria-live": "polite" }, nameHint),
    err && h("p", { className: "err", role: "alert" }, err),
    h("div", { className: "row" }, h(Btn, { main: true, type: "submit", disabled: !nameOk || busy }, claim ? (busy ? "Saving…" : "Save username") : "Next"), !claim && h(Btn, { onClick: onBack }, "Cancel")),
    !claim && h("p", { className: "note small" }, "Already have an account? ", h("button", { type: "button", className: "linkbtn inline", onClick: () => go("signin", "login") }, "Sign in")));
  const steps = mode === "signup" ? ["Username", "Password", "Email or phone", "Verify"] : null;
  const idx = { username: 0, password: 1, contact: 2, code: 3 }[step];

  let body = null;
  if (step === "login") body = h("form", { onSubmit: (e) => { e.preventDefault(); run(async () => { await Net.usernameLogin(name.trim(), pw); await finish(); }); } },
    h("h2", null, "Sign in"),
    h("label", { className: "field" }, h("span", null, "Username"), h("input", { autoFocus: !IS_TOUCH, autoComplete: "username", maxLength: 20, value: name, onChange: (e) => setName(e.target.value.replace(/\s/g, "")) })),
    h("label", { className: "field" }, h("span", null, "Password"), h("input", { type: "password", autoComplete: "current-password", value: pw, onChange: (e) => setPw(e.target.value) })),
    err && h("p", { className: "err", role: "alert" }, err),
    h("div", { className: "row" }, h(Btn, { main: true, type: "submit", disabled: busy || !name || !pw }, busy ? "Signing in…" : "Sign in"), h(Btn, { onClick: onBack }, "Back")),
    h("div", { className: "row links" }, h("button", { type: "button", className: "linkbtn", onClick: () => go("recover", "contact") }, "Forgot password?"), h("button", { type: "button", className: "linkbtn", onClick: () => go("otp", "contact") }, "Sign in with a one-time code"), h("button", { type: "button", className: "linkbtn", onClick: () => go("signup", "username") }, "Create an account")));
  else if (step === "username" || step === "claim") body = usernameForm(step === "claim");
  else if (step === "password") body = h("form", { onSubmit: (e) => { e.preventDefault(); setTried(true); if (passwordProblem(pw) || pw !== pw2) return; go("signup", "contact"); } },
    h("h2", null, "Choose a password"), h("p", { className: "note" }, `You’ll sign in as ${name} with this password.`),
    h(PasswordFields, { pw, setPw, pw2, setPw2, showErrors: tried }),
    h("div", { className: "row" }, h(Btn, { main: true, type: "submit" }, "Next"), h(Btn, { onClick: () => go("signup", "username") }, "Back")));
  else if (step === "contact") body = h("form", { onSubmit: (e) => { e.preventDefault(); setTried(true); run(async () => {
      const c = contactValue(contact); sentTo.current = c;
      if (mode === "signup") { const signedIn = await Net.signUpPassword(c, pw, name); if (signedIn) return finish(); }
      else await Net.sendCode(c, false);
      setCool(60); setCode(""); setStep("code");
    }); } },
    h("h2", null, mode === "signup" ? "Add your email or phone" : mode === "recover" ? "Reset your password" : "Sign in with a code"),
    h("p", { className: "note" }, mode === "signup" ? "Used to verify your account and recover it if you forget your password. Never shown to other players." : mode === "recover" ? "Enter the email or mobile number on your account. We’ll send a code, then you can choose a new password." : "Enter the email or mobile number on your account."),
    h(ContactInput, { contact, setContact, showErrors: tried }),
    err && h("p", { className: "err", role: "alert" }, err),
    h("div", { className: "row" }, h(Btn, { main: true, type: "submit", disabled: busy }, busy ? "Sending…" : mode === "signup" ? "Create account" : "Send code"), h(Btn, { onClick: () => (mode === "signup" ? go("signup", "password") : go("signin", "login")) }, "Back")));
  else if (step === "code") body = h("form", { onSubmit: (e) => { e.preventDefault(); run(async () => {
      if (!/^\d{6,10}$/.test(code)) throw new Error("Enter the 6-digit code.");
      if (mode === "signup") await Net.verifySignup(sentTo.current, code); else await Net.verifyCode(sentTo.current, code);
      await finish();
    }); } },
    h("h2", null, "Check your " + (sentTo.current && sentTo.current.email ? "email" : "messages")),
    h("p", { className: "note" }, sentTo.current && sentTo.current.email ? `We sent a message to ${sentTo.current.email}. Enter the 6-digit code from it below. If the email only has a button or link, just tap it — this screen will continue automatically.` : `We texted a 6-digit code to ${sentTo.current && sentTo.current.phone}.`),
    h("label", { className: "field" }, h("span", null, "6-digit code"), h("input", { className: "code", autoFocus: !IS_TOUCH, inputMode: "numeric", autoComplete: "one-time-code", maxLength: 10, value: code, onChange: (e) => setCode(e.target.value.replace(/\D/g, "")) })),
    err && h("p", { className: "err", role: "alert" }, err),
    h("div", { className: "row" }, h(Btn, { main: true, type: "submit", disabled: busy }, busy ? "Checking…" : "Verify"),
      h(Btn, { disabled: cool > 0 || busy, onClick: () => run(async () => { if (mode === "signup") await Net.resendSignup(sentTo.current); else await Net.sendCode(sentTo.current, false); setCool(60); }) }, cool > 0 ? `Resend in ${cool}s` : "Resend code"),
      h(Btn, { onClick: () => setStep("contact") }, "Change")));
  else if (step === "newpass") body = h("form", { onSubmit: (e) => { e.preventDefault(); setTried(true); if (passwordProblem(pw) || pw !== pw2) return; run(async () => { await Net.setPassword(pw); onDone(); }); } },
    h("h2", null, "Choose a new password"), h(PasswordFields, { pw, setPw, pw2, setPw2, label: "New password", showErrors: tried }),
    err && h("p", { className: "err", role: "alert" }, err),
    h("div", { className: "row" }, h(Btn, { main: true, type: "submit", disabled: busy }, busy ? "Saving…" : "Save password"), h(Btn, { onClick: onDone }, "Skip for now")));
  return h("div", { className: "authpage" }, h("div", { className: "panel auth" },
    steps && step !== "claim" && h("ol", { className: "steps", "aria-label": "Progress" }, steps.map((s, i) => h("li", { key: s, className: i === idx ? "on" : i < idx ? "done" : "" }, s))), body));
}

// ============================================================ App
function App() {
  const [screen, setScreen] = useState("loading");
  const [cfgError, setCfgError] = useState("");
  const [authMode, setAuthMode] = useState("signup");
  const [profile, setProfile] = useState(null);
  const [save, setSave] = useState(blankSave);
  const [saveStatus, setSaveStatus] = useState("");
  const [result, setResult] = useState(null);
  const [eres, setEres] = useState(null);
  const [world, setWorld] = useState(1);
  const [settingsFrom, setSettingsFrom] = useState("menu");
  const [confirm, setConfirm] = useState(null);
  const [focusAv, setFocusAv] = useState(null);
  const [stage, setStage] = useState({ w: 960, h: 540, s: 1 });
  const [portrait, setPortrait] = useState(isPortrait());
  const perf = useRef({ cap: 2, dprCap: 2, frames: 0, acc: 0 }); const [perfTick, setPerfTick] = useState(0);
  const canvas = useRef(null), game = useRef(null), input = useRef({}), screenRef = useRef(screen), saveRef = useRef(save), attract = useRef(null), runRef = useRef(null), dirty = useRef(false), saveTimer = useRef(null);
  screenRef.current = screen; saveRef.current = save;
  if (typeof window !== "undefined") window.__lumi = { game: () => game.current, screen: () => screenRef.current, save: () => saveRef.current };
  const set = save.settings;
  useEffect(() => { Sound.apply(set); }, [set]);

  // ---------- cloud save sync
  const pushCloud = useCallback(async () => {
    if (!Net.user) return false;
    clearTimeout(saveTimer.current);
    try { await Net.writeSave(saveRef.current); dirty.current = false; setSaveStatus("Saved to your account"); return true; }
    catch (e) { dirty.current = true; setSaveStatus("Saved on this device — will sync when the connection returns"); return false; }
  }, []);
  const commit = useCallback((fn, immediate) => {
    const n = sanitizeSave(JSON.parse(JSON.stringify(saveRef.current))); fn(n); refreshUnlocks(n);
    saveRef.current = n; setSave(n);
    if (Net.user) lsSet(cacheKey(Net.user.id), JSON.stringify(n));
    dirty.current = true; clearTimeout(saveTimer.current);
    if (immediate) return pushCloud();
    saveTimer.current = setTimeout(pushCloud, 1500);
  }, []);
  useEffect(() => { const t = setInterval(() => { if (dirty.current && Net.user && navigator.onLine !== false) pushCloud(); }, 30000); const on = () => dirty.current && pushCloud(); window.addEventListener("online", on); return () => { clearInterval(t); window.removeEventListener("online", on); }; }, []);

  // load profile + cloud save, migrate the old local save once, never lowering progress
  const loadAccount = useCallback(async () => {
    setScreen("loading");
    try {
      const prof = await Net.loadProfile();
      if (!prof) { setAuthMode("claim"); setScreen("auth"); return; }
      setProfile(prof);
      let cloud = null; try { cloud = await Net.loadSave(); } catch (e) { cloud = null; }
      const cachedRaw = lsGet(cacheKey(prof.id));
      let merged = sanitizeSave(cloud);
      if (cachedRaw) { try { merged = mergeSaves(merged, JSON.parse(cachedRaw)); } catch (e) {} }
      let migrated = false;
      const v1raw = lsGet(V1_KEY);
      if (v1raw && !lsGet(migratedKey(prof.id))) {
        let v1 = null; try { v1 = JSON.parse(v1raw); } catch (e) {}
        const conv = convertV1(v1);
        if (conv) { merged = mergeSaves(merged, conv, !cloud); merged.migrations.v1 = new Date().toISOString(); migrated = true; }
      }
      if (!cloud && !migrated) merged.avatars.selected = prof.avatar || "lumi";
      refreshUnlocks(merged);
      saveRef.current = merged; setSave(merged); lsSet(cacheKey(prof.id), JSON.stringify(merged));
      const ok = await pushCloud();
      if (migrated && ok) { lsSet(migratedKey(prof.id), "1"); setSaveStatus("Your earlier progress was added to your account"); }
      if (prof.avatar !== merged.avatars.selected) Net.setAvatar(merged.avatars.selected).catch(() => {});
      setScreen("menu");
    } catch (e) { setCfgError(friendlyError(e)); setScreen("neterror"); }
  }, []);

  // ---------- boot
  useEffect(() => {
    const fonts = document.fonts && document.fonts.load ? Promise.race([Promise.all([document.fonts.load("800 40px 'Exo 2'"), document.fonts.load("600 16px 'Nunito'")]), new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
    registerAvatarSprites(); registerEnemySprites();
    Promise.all([loadSprites(), fonts, Net.init()]).then(([, , ok]) => {
      for (let i = 1; i <= 10; i++) buildBG(i);
      attract.current = { scroll: 0 };
      if (!ok) { setCfgError(Net.cfgError); setScreen("setup"); return; }
      Net.onChange = (evt) => { if (evt === "SIGNED_OUT") { game.current = null; Sound.stopMusic(); setProfile(null); setScreen("landing"); } };
      setScreen("landing");
    });
  }, []);

  // ---------- stage scaling
  // Resize on rotation/resizing: the 16:9 playfield is letter-boxed (never stretched) and the running game keeps going.
  useEffect(() => {
    const fit = () => { const r = document.getElementById("root").getBoundingClientRect(), s = Math.min((r.width || innerWidth) / W, (r.height || innerHeight) / H); setStage({ w: Math.floor(W * s), h: Math.floor(H * s), s }); setPortrait(isPortrait()); };
    const late = () => { fit(); setTimeout(fit, 250); setTimeout(fit, 600); };   // iOS reports the new size a moment after rotating
    fit(); addEventListener("resize", fit); addEventListener("orientationchange", late); document.addEventListener("fullscreenchange", late);
    if (window.visualViewport) visualViewport.addEventListener("resize", fit);
    return () => { removeEventListener("resize", fit); removeEventListener("orientationchange", late); document.removeEventListener("fullscreenchange", late); if (window.visualViewport) visualViewport.removeEventListener("resize", fit); };
  }, []);
  // Canvas resolution follows the device pixel density (capped for smooth frame rates), so art stays crisp.
  useEffect(() => { const c = canvas.current; if (!c) return;
    const budget = Math.sqrt(2.8e6 / Math.max(1, stage.w * stage.h));   // cap total canvas pixels (~2.8 MP) so big tablets stay smooth
    const dpr = Math.max(1, Math.min(devicePixelRatio || 1, set.quality === 0 ? 1.5 : perf.current.dprCap, budget)); c.width = Math.round(stage.w * dpr); c.height = Math.round(stage.h * dpr); setRenderScale(stage.s * dpr); }, [stage, set.quality, perfTick]);
  useEffect(() => { if (portrait && screenRef.current === "playing") pause(); }, [portrait]);
  useEffect(() => { // no accidental pinch / double-tap zoom or page bounce while the game screen is shown (landing page stays normal)
    const stop = (e) => { if (screenRef.current !== "landing") e.preventDefault(); };
    document.addEventListener("gesturestart", stop); document.addEventListener("dblclick", stop);
    return () => { document.removeEventListener("gesturestart", stop); document.removeEventListener("dblclick", stop); };
  }, []);

  // ---------- campaign flow
  const camp = save.campaign, cc = completedCount(save);
  // Every Campaign level starts with the default single-shot weapon. Weapon power-ups last for that level only:
  // advancing, replaying, retrying after game over and starting a new run all reset to one bullet per attack.
  const startLevel = useCallback((L) => {
    requestLandscape();
    game.current = createGame({ mode: "campaign", level: L, tier: 1, avatar: saveRef.current.avatars.selected, quality: saveRef.current.settings.quality });
    input.current = {}; setScreen("playing");
    Sound.init(); Sound.duck(false); Sound.music(game.current.lv.music, false);
  }, []);
  const newRun = () => { setConfirm(null); commit((s) => { s.campaign.run = { level: 1, tier: 1, score: 0 }; }); startLevel(1); };
  const continueRun = () => { const r = saveRef.current.campaign.run; if (r) startLevel(r.level); else newRun(); };
  // Weapon upgrades belong to the current run only. Continuing a run keeps them; starting a level from the map,
  // starting a new run, or restarting after game over always begins with the default single shot.
  const playLevel = (L) => {
    const cur = saveRef.current.campaign.run;
    const run = cur && cur.level === L ? { ...cur, tier: 1 } : { level: L, tier: 1, score: 0 };
    commit((s) => { s.campaign.run = run; }); startLevel(L);
  };
  const retry = () => {
    const g = game.current;
    if (g && g.mode === "endless") return startEndless();
    const r = saveRef.current.campaign.run; if (!r) return;
    commit((s) => { if (s.campaign.run) s.campaign.run.tier = 1; });
    startLevel(r.level);
  };
  const toMenu = () => { game.current = null; runRef.current = null; Sound.stopMusic(); Sound.duck(false); setScreen("menu"); };
  const pause = useCallback(() => { if (screenRef.current === "playing") { setScreen("paused"); Sound.duck(true); } }, []);
  const resume = () => { input.current = {}; setScreen("playing"); Sound.duck(false); };

  const onComplete = useCallback(() => {
    const g = game.current, L = g.level, run = saveRef.current.campaign.run || { level: L, tier: 1, score: 0 };
    const clear = 1000 + 60 * L, health = g.player.hp * 300, flawless = g.hitsTaken === 0 ? 2000 : 0;
    const levelTotal = g.score + clear + health + flawless, runTotal = run.score + levelTotal;
    const before = completedCount(saveRef.current);
    const res = { L, title: g.L.title, boss: g.boss.def.name, score: g.score, clear, health, flawless, levelTotal, runTotal, tier: g.player.tier, final: L === TOTAL_LEVELS, newBest: runTotal > saveRef.current.campaign.bestTotal };
    commit((s) => {
      const c = s.campaign; c.best[L - 1] = Math.max(c.best[L - 1], levelTotal); c.completed[L - 1] = true;
      if (L < TOTAL_LEVELS) { c.unlocked = Math.max(c.unlocked, L + 1); c.run = { level: L + 1, tier: 1, score: runTotal }; }
      else { c.run = null; c.lastTotal = runTotal; c.bestTotal = Math.max(c.bestTotal, runTotal); }
    }, true);
    const after = completedCount(saveRef.current);
    res.newAvatars = AVATARS.filter((a) => a.unlock > before && a.unlock <= after).map((a) => a.name);
    setResult(res); Sound.stopMusic(); Sound.play("clear");
    setScreen(L === TOTAL_LEVELS ? "victory" : "complete");
  }, []);

  // ---------- endless flow (ranked)
  const startEndless = useCallback(async () => {
    requestLandscape();
    setScreen("endless-start"); setEres(null); Sound.init();
    let seed, ranked = true, why = "";
    try { const r = await Net.startRun(); runRef.current = r.runId; seed = r.seed; }
    catch (e) { ranked = false; runRef.current = null; seed = (Math.random() * 2 ** 31) >>> 0; why = friendlyError(e); }
    game.current = createGame({ mode: "endless", seed, avatar: saveRef.current.avatars.selected, quality: saveRef.current.settings.quality });
    game.current.ranked = ranked; game.current.unrankedWhy = why;
    input.current = {}; setScreen("playing"); Sound.duck(false); Sound.music(WORLDS[9].music, true);
  }, []);
  const onEndlessOver = useCallback(async () => {
    const g = game.current;
    const local = EndlessRules.validate(g.seed, g.rec, g.rec.end + 5);
    const base = { score: g.score, survival: g.rec.end, kills: g.rec.kills.length, ranked: g.ranked };
    setEres({ ...base, status: g.ranked ? "submitting" : "unranked", reason: g.unrankedWhy });
    setTimeout(() => { Sound.stopMusic(); setScreen("endless-result"); }, 1500);
    if (!g.ranked) return;
    try {
      const r = await Net.submitRun(runRef.current, g.rec);
      const [best, day, week] = await Promise.all([Net.endlessBest().catch(() => null), Net.standing("daily").catch(() => null), Net.standing("weekly").catch(() => null)]);
      setEres({ ...base, status: "verified", score: r.score, best, day, week });
    } catch (e) {
      if (e.status === 422) setEres({ ...base, status: "rejected", reason: e.message });
      else if (e.status === 409) setEres({ ...base, status: "duplicate", reason: e.message });
      else setEres({ ...base, status: "neterror", reason: friendlyError(e), local });
    }
  }, []);
  const resubmit = async () => {
    const g = game.current; if (!g || !runRef.current) return;
    setEres((x) => ({ ...x, status: "submitting" }));
    try { const r = await Net.submitRun(runRef.current, g.rec); const [best, day, week] = await Promise.all([Net.endlessBest().catch(() => null), Net.standing("daily").catch(() => null), Net.standing("weekly").catch(() => null)]); setEres((x) => ({ ...x, status: "verified", score: r.score, best, day, week })); }
    catch (e) { setEres((x) => ({ ...x, status: e.status === 422 ? "rejected" : e.status === 409 ? "duplicate" : "neterror", reason: e.status ? e.message : friendlyError(e) })); }
  };

  // ---------- keyboard + focus
  useEffect(() => {
    const down = (e) => {
      const k = KEYMAP[e.code], tag = (e.target && e.target.tagName) || "";
      if (screenRef.current === "playing") {
        if (k) { input.current[k] = true; e.preventDefault(); }
        if (e.code === "KeyE" || e.code === "KeyK") { if (!e.repeat) input.current.specialPressed = true; e.preventDefault(); }
        if (e.code === "Escape" || e.code === "KeyP") { pause(); e.preventDefault(); }
      } else if (screenRef.current === "paused" && (e.code === "Escape" || e.code === "KeyP")) { e.preventDefault(); resume(); }
      else if (k && tag !== "INPUT" && tag !== "SELECT" && e.code === "Space" && tag !== "BUTTON") e.preventDefault();
    };
    const up = (e) => { const k = KEYMAP[e.code]; if (k) input.current[k] = false; };
    const blur = () => { input.current = {}; pause(); };
    const vis = () => { if (document.hidden) blur(); };
    addEventListener("keydown", down); addEventListener("keyup", up); addEventListener("blur", blur); document.addEventListener("visibilitychange", vis);
    return () => { removeEventListener("keydown", down); removeEventListener("keyup", up); removeEventListener("blur", blur); document.removeEventListener("visibilitychange", vis); };
  }, []);

  // ---------- main loop
  useEffect(() => {
    let raf, last = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const rawDt = (now - last) / 1000, dt = Math.min(0.05, rawDt); last = now;
      const c = canvas.current; if (!c) return;
      // automatic performance fallback: if frames run slow during play, trim effects first, then canvas resolution
      const P = perf.current;
      if (screenRef.current === "playing" && rawDt < 0.25) { P.frames++; P.acc += rawDt; if (P.frames >= 150) { const avg = P.acc / P.frames; P.frames = 0; P.acc = 0;
        if (avg > 1 / 48) { if (P.cap > 0) P.cap--; else if (P.dprCap > 1.25) { P.dprCap -= 0.25; setPerfTick((x) => x + 1); } } } }
      const ctx = c.getContext("2d"), sc = c.width / W; ctx.setTransform(sc, 0, 0, sc, 0, 0);
      const scr = screenRef.current, g = game.current, S = saveRef.current.settings;
      if (g) {
        if (scr === "playing" || scr === "complete" || scr === "victory" || scr === "gameover" || scr === "endless-result") {
          input.current.autofire = S.autofire || IS_TOUCH;
          if (scr !== "playing") { input.current.fire = false; input.current.autofire = false; input.current.specialPressed = false; }
          g.quality = S.quality;
          updateGame(g, scr === "playing" ? dt : dt * 0.6, input.current);
          for (const e of g.events) {
            if (e.type === "sfx") Sound.play(e.name);
            else if (e.type === "bossStart") Sound.music(g.lv.music, true);
            else if (e.type === "warning") Sound.stopMusic();
            else if (e.type === "levelComplete" && scr === "playing") onComplete();
            else if (e.type === "gameOver" && scr === "playing") { Sound.stopMusic(); setScreen("gameover"); }
            else if (e.type === "endlessOver") onEndlessOver();
          }
          g.events.length = 0;
        }
        drawGame(ctx, g, { ...S, touch: IS_TOUCH, perfCap: P.cap }, now);
        if (g.mode === "endless" && !g.ranked && scr === "playing") txt(ctx, "Practice run (not ranked)", W / 2, H - 14, 15, "#c9bde8", "center");
      } else if (attract.current) {
        const a = attract.current; a.scroll += dt * 50; const bg = buildBG(((Math.floor(now / 12000)) % 10) + 1);
        ctx.drawImage(bg.sky, 0, 0); drawLayer(ctx, bg.far, a.scroll * 0.12); drawLayer(ctx, bg.mid, a.scroll * 0.35); drawLayer(ctx, bg.near, a.scroll);
      } else { ctx.fillStyle = "#160c28"; ctx.fillRect(0, 0, W, H); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ============================================================ screens
  let overlay = null;
  const userChip = profile && h("button", { className: "userchip", onClick: () => setScreen("profile"), "aria-label": "Open profile" }, h(Portrait, { id: save.avatars.selected, size: 34 }), h("span", null, profile.username));

  if (screen === "loading") overlay = h("div", { className: "center" }, h("p", { className: "loading" }, "Nova Vanguard is loading…"));
  if (screen === "setup" || screen === "neterror") overlay = h("div", { className: "center" }, h("div", { className: "panel narrow wide" },
    h("h2", null, screen === "setup" ? "Server setup needed" : "Can’t reach the server"),
    h("p", { className: "note" }, cfgError),
    screen === "setup" && h("p", { className: "note" }, "Add the Supabase environment variables in your Vercel project (Settings → Environment Variables), then redeploy. The README lists every step."),
    h(Btn, { main: true, onClick: () => location.reload() }, "Try again")));

  if (screen === "welcome") overlay = h("div", { className: "title" },
    h("div", { className: "hero" }, h("img", { src: avatarFull("lumi"), alt: "Lumi, a chibi gunner with a silver-lavender ponytail", className: "heroimg" }),
      h("h1", null, "Nova Vanguard"), h("p", { className: "tag" }, "100 levels. 20 heroes. One endless challenge.")),
    h("nav", { className: "menu", "aria-label": "Account" },
      h(Btn, { main: true, auto: true, onClick: () => { setAuthMode("signup"); setScreen("auth"); } }, "Create account"),
      h(Btn, { onClick: () => { setAuthMode("signin"); setScreen("auth"); } }, "Sign in"),
      h("button", { className: "linkbtn", onClick: () => { setAuthMode("recover"); setScreen("auth"); } }, "Can’t sign in? Recover your account"),
      h("p", { className: "note small" }, "An account keeps your progress in the cloud and puts your scores on the leaderboards.")));

  useEffect(() => { document.body.classList.toggle("doc", screen === "landing"); document.body.classList.toggle("game", screen !== "landing"); if (screen === "landing") window.scrollTo(0, 0); }, [screen]);
  if (screen === "landing") return h(Landing, { signedIn: !!Net.user, onPlay: () => { if (Net.user) loadAccount(); else { setAuthMode("signin"); setScreen("auth"); } }, onCreate: () => { setAuthMode("signup"); setScreen("auth"); } });
  if (screen === "auth") overlay = h(AuthFlow, { key: authMode, mode: authMode === "claim" ? "signup" : authMode, startStep: authMode === "claim" ? "claim" : undefined, onBack: () => setScreen("landing"), onDone: loadAccount });

  if (screen === "menu") overlay = h("div", { className: "title" },
    h("div", { className: "hero" }, h("img", { src: avatarFull(save.avatars.selected), alt: AVATAR_BY_ID[save.avatars.selected].name, className: "heroimg" }),
      h("h1", null, "Nova Vanguard"), h("p", { className: "tag" }, `Welcome back, ${profile ? profile.username : ""}. ${cc}/100 levels cleared.`),
      saveStatus && h("p", { className: "note small", "aria-live": "polite" }, saveStatus)),
    h("nav", { className: "menu", "aria-label": "Main menu" },
      h(Btn, { main: true, auto: true, onClick: () => { setWorld(Math.ceil((camp.run ? camp.run.level : camp.unlocked) / 10)); setScreen("campaign"); } }, "Campaign"),
      h(Btn, { onClick: startEndless }, "Endless mode"),
      h(Btn, { onClick: () => setScreen("avatars") }, "Avatars"),
      h(Btn, { onClick: () => setScreen("rankings") }, "Daily & weekly rankings"),
      h("div", { className: "row tight" }, h(Btn, { small: true, onClick: () => { game.current = null; setScreen("landing"); } }, "Home"), h(Btn, { small: true, onClick: () => setScreen("profile") }, "Profile"), h(Btn, { small: true, onClick: () => { setSettingsFrom("menu"); setScreen("settings"); } }, "Settings"), h(Btn, { small: true, onClick: () => Net.signOut() }, "Sign out"))),
    userChip);

  if (screen === "campaign") {
    const W_ = WORLDS[world - 1];
    overlay = h(Page, { title: "Campaign", onBack: () => setScreen("menu"), right: confirm === "newrun" ? null : h(Btn, { small: true, main: true, onClick: continueRun }, camp.run ? `Continue ${getLevel(camp.run.level).title.split(" ")[0]}` : "Start at 1-1") },
      confirm === "newrun" && h("div", { className: "panel confirm" }, h("p", null, "Restart the campaign run from level 1-1? Unlocked levels and best scores stay."), h("div", { className: "row" }, h(Btn, { main: true, onClick: newRun }, "Start new run"), h(Btn, { onClick: () => setConfirm(null) }, "Keep my run"))),
      h("div", { className: "worlds", role: "tablist" }, WORLDS.map((w, i) => {
        const locked = i * 10 + 1 > camp.unlocked, done = camp.completed.slice(i * 10, i * 10 + 10).filter(Boolean).length;
        return h("button", { key: i, role: "tab", "aria-selected": world === i + 1, disabled: locked, className: "wtab" + (world === i + 1 ? " on" : ""), style: { "--acc": w.pal.acc }, onClick: () => setWorld(i + 1) }, h("b", null, i + 1), h("span", null, locked ? "Locked" : `${done}/10`));
      })),
      h("div", { className: "worldhead", style: { "--acc": W_.pal.acc } }, h("h3", null, `World ${world}: ${W_.name}`), h("span", { className: "note" }, `Finale boss: ${BOSSES[W_.finale]().name}`)),
      h("div", { className: "grid" }, Array.from({ length: 10 }, (_, i) => {
        const L = (world - 1) * 10 + i + 1, lv = getLevel(L), locked = L > camp.unlocked, done = camp.completed[L - 1];
        return h("button", { key: L, className: "tile" + (locked ? " locked" : "") + (done ? " done" : "") + (camp.run && camp.run.level === L ? " current" : ""), disabled: locked, style: { "--acc": W_.pal.acc, "--bg": W_.pal.bot },
          "aria-label": locked ? `Level ${lv.title.split(" ")[0]} locked` : `Play level ${lv.title}`, onClick: () => { Sound.init(); playLevel(L); } },
          h("span", { className: "num" }, `${world}-${i + 1}`), h("span", { className: "nm" }, locked ? "Locked" : lv.name),
          h("span", { className: "sc" }, locked ? "Clear the level before" : camp.best[L - 1] ? "Best " + fmt(camp.best[L - 1]) : "Not cleared"),
          !locked && h("span", { className: "boss" }, lv.boss.finale ? "Finale" : lv.boss.name),
          done && h("span", { className: "check", "aria-hidden": true }, "✓"));
      })),
      camp.run && camp.run.level > 1 && confirm !== "newrun" && h("button", { className: "linkbtn", onClick: () => setConfirm("newrun") }, "Restart the run from 1-1"));
  }

  if (screen === "avatars") {
    const sel = save.avatars.selected, focus = focusAv || sel, setFocus = setFocusAv;
    const fa = AVATAR_BY_ID[focus] || AVATARS[0], unlocked = save.avatars.unlocked.includes(fa.id);
    overlay = h(Page, { title: "Avatars", onBack: () => { setFocusAv(null); setScreen("menu"); } },
      h("div", { className: "avlayout" },
        h("div", { className: "avgrid" }, AVATARS.map((a) => { const ok = save.avatars.unlocked.includes(a.id); return h("button", { key: a.id, className: "avtile" + (a.id === focus ? " focus" : "") + (a.id === sel ? " sel" : ""), onClick: () => setFocus(a.id), "aria-label": `${a.name}${ok ? "" : ", locked"}` }, h(Portrait, { id: a.id, size: 42, locked: !ok }), h("span", null, a.name), h("small", { className: "cat" }, ok ? WEAPON_CATS[a.cat] : `Clear ${a.unlock}`)); })),
        h("div", { className: "panel avinfo" },
          h(AvatarPreview, { id: fa.id }),
          h("h3", null, fa.name), h("p", { className: "note" }, `${fa.title} · ${WEAPON_CATS[fa.cat]}: ${fa.weaponName}`),
          h("p", { className: "note small" }, "All avatars share the same hitbox, speed, damage and health."),
          unlocked ? (fa.id === sel ? h("p", { className: "ok" }, "Selected") : h(Btn, { main: true, onClick: () => { commit((s) => { s.avatars.selected = fa.id; }); Net.setAvatar(fa.id).catch(() => {}); } }, "Use " + fa.name))
            : h("p", { className: "hint bad" }, `Unlocks after clearing ${fa.unlock} campaign levels (${cc}/${fa.unlock}).`))));
  }

  if (screen === "rankings") overlay = h(Rankings, { onBack: () => setScreen("menu") });
  if (screen === "profile") overlay = h(Profile, { profile, save, onBack: () => setScreen("menu"), onRenamed: (p) => setProfile(p), onAvatars: () => setScreen("avatars") });

  if (screen === "settings") overlay = h(Page, { title: "Settings", onBack: () => setScreen(settingsFrom), backLabel: "Done" },
    h("div", { className: "cols2" },
      h("div", { className: "panel form" },
        h("h3", null, "Sound"),
        h(Slider, { label: "Music", value: set.music, onChange: (v) => commit((s) => (s.settings.music = v)) }),
        h(Toggle, { on: set.musicMute, onChange: (v) => commit((s) => (s.settings.musicMute = v)) }, "Mute music"),
        h(Slider, { label: "Effects", value: set.sfx, onChange: (v) => commit((s) => (s.settings.sfx = v)) }),
        h(Toggle, { on: set.sfxMute, onChange: (v) => commit((s) => (s.settings.sfxMute = v)) }, "Mute effects")),
      h("div", { className: "panel form" },
        h("h3", null, "Visuals and play"),
        h("div", { className: "slider" }, h("span", null, "Graphics"), h(Seg, { label: "Graphics quality", value: set.quality, options: [[0, "Low"], [1, "Medium"], [2, "High"]], onChange: (v) => commit((s) => (s.settings.quality = v)) })),
        h(Slider, { label: "Screen shake", value: set.shake, onChange: (v) => commit((s) => (s.settings.shake = v)) }),
        h(Toggle, { on: set.reduced, onChange: (v) => commit((s) => (s.settings.reduced = v)) }, "Reduced motion (no shake or strong flashes)"),
        IS_TOUCH ? h("p", { className: "note small" }, "Auto-fire is always on with touch controls.") : h(Toggle, { on: set.autofire, onChange: (v) => commit((s) => (s.settings.autofire = v)) }, "Auto-fire (no need to hold Space)"),
        h("p", { className: "note small" }, IS_TOUCH ? "Drag on the left side to move. Tap Blast for the special attack." : "Move: WASD or arrows. Shoot: Space. Special blast: E. Pause: Esc."))));

  if (screen === "playing") overlay = h(React.Fragment, null, h("button", { className: "pausebtn", "aria-label": "Pause", onClick: pause }, h("span"), h("span")), IS_TOUCH && h(TouchControls, { input, game }));
  if (screen === "paused") overlay = h("div", { className: "center dim" }, h("div", { className: "panel menu narrow" }, h("h2", null, "Paused"),
    h(Btn, { main: true, auto: true, onClick: resume }, "Resume"),
    h(Btn, { onClick: retry }, game.current && game.current.mode === "endless" ? "Restart run" : "Restart level"),
    h(Btn, { onClick: () => { setSettingsFrom("paused"); setScreen("settings"); } }, "Settings"),
    h(Btn, { onClick: toMenu }, "Main menu")));
  if (screen === "endless-start") overlay = h("div", { className: "center dim" }, h("p", { className: "loading" }, "Starting a ranked run…"));
  if (screen === "gameover") overlay = h("div", { className: "center dim" }, h("div", { className: "panel menu narrow" }, h("h2", null, `${AVATAR_BY_ID[save.avatars.selected].name} is down`),
    h("p", { className: "note" }, "Retry restarts this level with three lives, the default single-shot weapon, and its score reset."),
    h(Btn, { main: true, auto: true, onClick: retry }, "Retry level"), h(Btn, { onClick: toMenu }, "Main menu")));

  if (screen === "complete" && result) overlay = h("div", { className: "center dim" }, h("div", { className: "panel result" },
    h("div", { className: "who" }, h(Portrait, { id: save.avatars.selected, size: 40 }), h("span", null, profile && profile.username)),
    h("h2", null, `${result.title.split(" ")[0]} cleared`),
    h("p", { className: "note" }, `${result.boss} defeated. Next: ${getLevel(result.L + 1).title}.`),
    h("table", null, h("tbody", null,
      h("tr", null, h("td", null, "Score"), h("td", null, fmt(result.score))), h("tr", null, h("td", null, "Clear bonus"), h("td", null, "+" + fmt(result.clear))),
      h("tr", null, h("td", null, "Health bonus"), h("td", null, "+" + fmt(result.health))), result.flawless > 0 && h("tr", null, h("td", null, "No-hit bonus"), h("td", null, "+" + fmt(result.flawless))),
      h("tr", { className: "tot" }, h("td", null, "Level total"), h("td", null, fmt(result.levelTotal))), h("tr", null, h("td", null, "Run total"), h("td", null, fmt(result.runTotal))))),
    result.newAvatars.length > 0 && h("p", { className: "ok" }, "New avatar unlocked: " + result.newAvatars.join(", ")),
    h("p", { className: "note small", "aria-live": "polite" }, saveStatus),
    h("div", { className: "row" }, h(Btn, { main: true, auto: true, onClick: continueRun }, "Continue"), h(Btn, { onClick: toMenu }, "Main menu"))));

  if (screen === "victory" && result) overlay = h("div", { className: "center dim" }, h("div", { className: "panel result victory" },
    h("img", { src: avatarFull(save.avatars.selected), alt: "", className: "vicimg" }),
    h("h2", null, "All 100 bosses defeated"),
    h("p", { className: "note" }, `The Celestial Core is quiet again. Well flown, ${profile && profile.username}.`),
    h("p", { className: "big" }, fmt(result.runTotal)),
    h("p", { className: "note" }, result.newBest ? "New best full campaign!" : "Best campaign total: " + fmt(save.campaign.bestTotal)),
    h("div", { className: "row" }, h(Btn, { main: true, auto: true, onClick: () => setScreen("campaign") }, "Replay a level"), h(Btn, { onClick: newRun }, "New campaign"), h(Btn, { onClick: toMenu }, "Main menu"))));

  if (screen === "endless-result" && eres) {
    const st = eres.status, ft = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    overlay = h("div", { className: "center dim" }, h("div", { className: "panel result" },
      h("div", { className: "who" }, h(Portrait, { id: save.avatars.selected, size: 40 }), h("span", null, profile && profile.username)),
      h("h2", null, "Run over"),
      h("p", { className: "big" }, fmt(eres.score)),
      h("table", null, h("tbody", null,
        h("tr", null, h("td", null, "Survived"), h("td", null, ft(eres.survival))), h("tr", null, h("td", null, "Enemies defeated"), h("td", null, fmt(eres.kills))),
        eres.best && h("tr", null, h("td", null, "Personal best"), h("td", null, fmt(eres.best.best_score))),
        eres.day && h("tr", null, h("td", null, "Today’s rank"), h("td", null, eres.day.rank ? `#${eres.day.rank} of ${eres.day.players}` : "—")),
        eres.week && h("tr", null, h("td", null, "This week’s rank"), h("td", null, eres.week.rank ? `#${eres.week.rank} of ${eres.week.players}` : "—")))),
      st === "submitting" && h("p", { className: "note", "aria-live": "polite" }, "Verifying your run with the server…"),
      st === "verified" && h("p", { className: "ok" }, "Verified and ranked. Only your best run of each day and week counts."),
      st === "rejected" && h("p", { className: "err", role: "alert" }, "This run wasn’t ranked: " + eres.reason),
      st === "duplicate" && h("p", { className: "note" }, eres.reason),
      st === "unranked" && h("p", { className: "note" }, "Practice run, not ranked. " + (eres.reason || "")),
      st === "neterror" && h("p", { className: "err", role: "alert" }, eres.reason),
      h("div", { className: "row" }, h(Btn, { main: true, auto: true, onClick: startEndless }, "Play again"), st === "neterror" && h(Btn, { onClick: resubmit }, "Retry submission"), h(Btn, { onClick: () => { game.current = null; setScreen("rankings"); } }, "Rankings"), h(Btn, { onClick: toMenu }, "Main menu"))));
  }

  return h(React.Fragment, null,
    h("div", { className: "stage", style: { width: stage.w, height: stage.h } },
      h("canvas", { ref: canvas, style: { width: stage.w, height: stage.h }, "aria-label": "Game playfield" }),
      h("div", { className: "ui" + (set.reduced ? " rm" : ""), style: { transform: `scale(${stage.s})` } }, overlay)),
    portrait && h("div", { className: "rotatemsg", role: "alertdialog", "aria-live": "assertive", "aria-label": "Rotate your device to landscape" },
      h("div", { className: "phoneicon", "aria-hidden": true }, h("span")),
      h("h2", null, "Rotate your device to landscape"),
      h("p", null, screen === "paused" || screen === "playing" ? "The game is paused and will be right where you left it." : "Nova Vanguard plays sideways for a wider view.")));
}

// ============================================================ landing page
function SpaceCanvas({ world = 1, className }) {
  const ref = useRef(null);
  useEffect(() => {
    let raf, sc = 0, last = performance.now(), visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting)); if (ref.current) io.observe(ref.current);
    const loop = (now) => { raf = requestAnimationFrame(loop); const c = ref.current; if (!c || !visible) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; sc += dt * 40;
      const ctx = c.getContext("2d"); ctx.setTransform(c.width / W, 0, 0, c.height / H, 0, 0); const bg = buildBG(world);
      ctx.drawImage(bg.sky, 0, 0); drawLayer(ctx, bg.nebula, sc * 0.06); drawLayer(ctx, bg.far, sc * 0.18); drawLayer(ctx, bg.streaks, sc * 1.6); };
    raf = requestAnimationFrame(loop); return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [world]);
  return h("canvas", { ref, width: 1280, height: 720, className, "aria-hidden": true });
}
// live in-engine preview: a real endless game played by a simple pilot (invincible, demo only)
function DemoCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    let raf, last = performance.now(), visible = true, g = null, inp = { autofire: true };
    const reset = () => { g = createGame({ mode: "endless", seed: 20261024, avatar: "lumi", quality: 2, god: true }); g.t = 30; g.sched.take(30); g.player.tier = 1; };
    reset();
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting)); if (ref.current) io.observe(ref.current);
    const loop = (now) => {
      raf = requestAnimationFrame(loop); const c = ref.current; if (!c || !visible) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const p = g.player, tgt = g.enemies.length ? g.enemies.reduce((a, b) => (a.x < b.x ? a : b)) : null, near = g.pickups.find((k) => k.x < 600);
      const ty = near ? near.y : tgt ? tgt.y : H / 2;
      inp.up = p.y > ty + 8; inp.down = p.y < ty - 8; inp.left = p.x > 170; inp.right = p.x < 150;
      if (p.specialCd <= 0 && g.ebul.length > 14) inp.specialPressed = true;
      updateGame(g, dt, inp); g.events.length = 0;
      if (g.t > 150) reset();
      const ctx = c.getContext("2d"), sc = c.width / W; ctx.setTransform(sc, 0, 0, sc, 0, 0);
      drawGame(ctx, g, { quality: 2, shake: 0.3, reduced: matchMedia("(prefers-reduced-motion: reduce)").matches, touch: false }, now);
    };
    raf = requestAnimationFrame(loop); return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);
  return h("canvas", { ref, width: 1280, height: 720, className: "demo", "aria-label": "Live gameplay preview" });
}
function Landing({ signedIn, onPlay, onCreate }) {
  const [board, setBoard] = useState({ daily: null, weekly: null, err: "" });
  useEffect(() => { Promise.all([Net.leaderboard("daily"), Net.leaderboard("weekly")]).then(([d, w]) => setBoard({ daily: d.slice(0, 5), weekly: w.slice(0, 5), err: "" })).catch((e) => setBoard({ daily: [], weekly: [], err: friendlyError(e) })); }, []);
  const featured = ["aria", "nova", "kestrel", "zephyr", "luma"];
  const ft = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
  const Board = ({ title, rows }) => h("div", { className: "lcard" }, h("h3", null, title),
    rows === null ? h("p", { className: "muted" }, "Loading…") : rows.length === 0 ? h("p", { className: "muted" }, "No ranked runs yet. The first verified score takes the top spot.") :
    h("ol", { className: "lboard" }, rows.map((r) => h("li", { key: r.rank }, h("span", { className: "rk" }, r.rank), h("img", { src: avatarPortrait(r.avatar), alt: "", width: 30, height: 30 }), h("span", { className: "un" }, r.username), h("span", { className: "sc" }, fmt(r.score)), h("span", { className: "tm" }, ft(r.survival_ms))))));
  const cta = (big) => h("div", { className: "ctas" }, h("button", { className: "lbtn primary" + (big ? " lg" : ""), onClick: onPlay }, signedIn ? "Continue Playing" : "Play Now"), !signedIn && h("button", { className: "lbtn" + (big ? " lg" : ""), onClick: onCreate }, "Create Account"));
  return h("div", { className: "landing" },
    h("nav", { className: "lnav" }, h("a", { className: "brand", href: "#top" }, h("img", { src: "icon.svg", alt: "", width: 34, height: 34 }), "Nova Vanguard"),
      h("div", { className: "links" }, ["Gameplay", "Campaign", "Heroes", "Endless", "Rankings", "How to play"].map((t) => h("a", { key: t, href: "#" + t.toLowerCase().replace(/ /g, "-") }, t))),
      h("button", { className: "lbtn primary small", onClick: onPlay }, signedIn ? "Continue Playing" : "Play Now")),
    h("header", { id: "top", className: "lhero" }, h(SpaceCanvas, { className: "herobg" }),
      h("div", { className: "herocopy" }, h("h1", null, "Nova Vanguard"), h("p", { className: "tagline" }, "100 levels. 20 heroes. One endless challenge."),
        h("p", { className: "lead" }, "A fantasy space shooter. Pick a cannon, bow, sniper rifle or gun, power up from one shot to six, grab timed bullet power-ups, and break through 100 bosses or chase the daily leaderboard."), cta(true)),
      h("div", { className: "heroart" }, h("img", { className: "mainhero", src: avatarFull("lumi"), alt: "Astra, the sunrise vanguard, riding her glider with the Dawnfire cannon" }),
        h("div", { className: "squad" }, featured.map((id) => h("figure", { key: id }, h("img", { src: avatarPortrait(id), alt: "", width: 64, height: 64 }), h("figcaption", null, AVATAR_BY_ID[id].name)))))),
    h("section", { id: "gameplay", className: "lsec" }, h("h2", null, "See it in motion"), h("p", { className: "muted" }, "This is the game itself running live in your browser: real enemies, real bullets, and the special blast."), h("div", { className: "demowrap" }, h(DemoCanvas))),
    h("section", { id: "campaign", className: "lsec" }, h("h2", null, "The campaign"),
      h("div", { className: "stats" }, [["100", "levels"], ["10", "worlds"], ["1", "boss in every level"]].map(([n, l]) => h("div", { key: l, className: "stat" }, h("b", null, n), h("span", null, l)))),
      h("ol", { className: "worldlist" }, WORLDS.map((w, i) => h("li", { key: w.name, style: { "--acc": w.pal.acc } }, h("span", { className: "wn" }, i + 1), h("span", null, w.name), h("small", null, BOSSES[w.finale]().name))))),
    h("section", { id: "heroes", className: "lsec" }, h("h2", null, "20 heroes"), h("p", { className: "muted" }, "Four are ready from the start. The rest unlock as you clear campaign levels. Every hero has the same hitbox, speed and damage, so picks are about style, not advantage."),
      h("div", { className: "herogrid" }, AVATARS.map((a) => h("figure", { key: a.id, className: "hcard" }, h("img", { src: avatarFull(a.id), alt: a.name, loading: "lazy" }), h("figcaption", null, h("b", null, a.name), h("span", null, a.title), h("small", { className: a.unlock ? "" : "starter" }, `${WEAPON_CATS[a.cat]} · ${a.unlock ? `Clear ${a.unlock} levels` : "Starter"}`)))))),
    h("section", { id: "endless", className: "lsec split" }, h("div", null, h("h2", null, "Endless mode"),
      h("p", null, "Waves never stop and enemies never shoot, but contact hurts. Armored Bulwarks take 5 to 20 hits, Darts flash a warning before they rush, and every 20 seconds the swarm gets thicker and faster."),
      h("ul", { className: "ticks" }, h("li", null, "Every ranked run starts the same: three lives, one shot"), h("li", null, "Scores are rebuilt and verified by the server before they count"), h("li", null, "Daily and weekly boards reset at midnight and on Mondays, Manila time"))),
      h("div", { id: "rankings", className: "boards" }, board.err && h("p", { className: "muted" }, board.err), h(Board, { title: "Today’s top pilots", rows: board.daily }), h(Board, { title: "This week", rows: board.weekly }))),
    h("section", { id: "how-to-play", className: "lsec" }, h("h2", null, "How to play"),
      h("div", { className: "howgrid" },
        h("div", { className: "lcard" }, h("h3", null, "Desktop"), h("dl", null, h("dt", null, "WASD / arrows"), h("dd", null, "Move"), h("dt", null, "Space"), h("dd", null, "Shoot (hold, or turn on auto-fire)"), h("dt", null, "E"), h("dd", null, "Special blast"), h("dt", null, "Esc"), h("dd", null, "Pause"))),
        h("div", { className: "lcard" }, h("h3", null, "Mobile"), h("dl", null, h("dt", null, "Left thumb"), h("dd", null, "Drag anywhere to steer"), h("dt", null, "Shooting"), h("dd", null, "Automatic"), h("dt", null, "Blast button"), h("dd", null, "Special blast"), h("dt", null, "Top right"), h("dd", null, "Pause"))),
        h("div", { className: "lcard" }, h("h3", null, "Power-ups"), h("ul", { className: "legendl" },
          h("li", null, h("i", { className: "ico star" }), h("span", null, h("b", null, "Weapon upgrade."), " Dropped by every elite. One shot → three → six. At max power each extra one is worth 1,000 points.")),
          h("li", null, h("i", { className: "ico plus" }), h("span", null, h("b", null, "Health."), " Restores one heart. At most two appear per level.")),
          h("li", null, h("i", { className: "ico hex" }), h("span", null, h("b", null, "Shield."), " Absorbs one hit for six seconds.")),
          h("li", null, h("i", { className: "ico comet" }), h("span", null, h("b", null, "Bullet power-ups."), " Comet, Nova and Prism rounds change your shots and their speed for 10 seconds.")),
          h("li", null, h("i", { className: "ico wave" }), h("span", null, h("b", null, "Special blast."), " Charge, then release a wave that clears enemy bullets and damages everything it touches. Recharges in 14 seconds."))))),
      h("div", { className: "ctaband" }, h("h2", null, "Ready to fly?"), cta(true))),
    h("footer", { className: "lfoot" }, h("span", null, "© 2026 Nova Vanguard"), h("nav", null, h("a", { href: "support.html" }, "Account support"), h("a", { href: "privacy.html" }, "Privacy"), h("a", { href: "terms.html" }, "Terms"))));
}

// ============================================================ rankings
function Rankings({ onBack }) {
  const [kind, setKind] = useState("daily");
  const curKey = () => (kind === "daily" ? manilaDateKey() : manilaWeekKey());
  const [key, setKey] = useState(curKey());
  const [rows, setRows] = useState(null); const [mine, setMine] = useState(null); const [err, setErr] = useState(""); const [periods, setPeriods] = useState([]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { setKey(kind === "daily" ? manilaDateKey() : manilaWeekKey()); Net.periods(kind).then(setPeriods).catch(() => setPeriods([])); }, [kind]);
  useEffect(() => {
    setRows(null); setErr("");
    Promise.all([Net.leaderboard(kind, key), Net.standing(kind, key)]).then(([r, m]) => { setRows(r); setMine(m); }).catch((e) => setErr(friendlyError(e)));
  }, [kind, key]);
  const isCurrent = key === curKey();
  const left = Math.max(0, nextResetMs(kind, now) - now), hh = Math.floor(left / 3600e3), mm = Math.floor((left % 3600e3) / 60e3), ss = Math.floor((left % 60e3) / 1000);
  const label = kind === "daily" ? new Date(key + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }) : "Week of " + new Date(key + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  const ft = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
  return h(Page, { title: "Rankings", onBack },
    h("div", { className: "rankhead" },
      h(Seg, { label: "Period", value: kind, options: [["daily", "Daily"], ["weekly", "Weekly"]], onChange: setKind }),
      h("div", { className: "period" },
        h("button", { className: "arrow", "aria-label": "Previous period", onClick: () => setKey(shiftKey(kind, key, -1)) }, "‹"),
        h("span", null, label, isCurrent ? " (current)" : " (archived)"),
        h("button", { className: "arrow", "aria-label": "Next period", disabled: isCurrent, onClick: () => setKey(shiftKey(kind, key, 1)) }, "›")),
      periods.length > 0 && h("select", { "aria-label": "Jump to an archived period", value: periods.some((p) => p.period === key) ? key : "", onChange: (e) => e.target.value && setKey(e.target.value) },
        h("option", { value: "" }, "Archives…"), periods.map((p) => h("option", { key: p.period, value: p.period }, `${p.period} (${p.players} players)`))),
      h("span", { className: "note small reset" }, isCurrent ? `Resets in ${kind === "weekly" ? Math.floor(hh / 24) + "d " + (hh % 24) + "h " : hh + "h "}${mm}m ${ss}s (Manila time)` : "Final results")),
    h("div", { className: "panel board" },
      err ? h("p", { className: "err" }, err) : !rows ? h("p", { className: "note" }, "Loading…") : rows.length === 0 ? h("p", { className: "note" }, isCurrent ? "No ranked runs yet in this period. Play Endless mode to take first place." : "No ranked runs in this period.") :
      h("table", { className: "lb" }, h("thead", null, h("tr", null, h("th", null, "#"), h("th", null, "Player"), h("th", null, "Score"), h("th", null, "Time"))),
        h("tbody", null, rows.map((r) => h("tr", { key: r.rank, className: r.is_me ? "me" : "" }, h("td", null, r.rank), h("td", { className: "pl" }, h(Portrait, { id: r.avatar, size: 28 }), r.username), h("td", null, fmt(r.score)), h("td", null, ft(r.survival_ms))))))),
    mine && h("p", { className: "mine" }, mine.rank ? `Your position: #${mine.rank} of ${mine.players}, best ${fmt(mine.score)}` : `You haven’t set a ranked score in this period. ${mine.players} players have.`));
}

// ============================================================ profile
function Profile({ profile, save, onBack, onRenamed, onAvatars }) {
  const [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [pwMsg, setPwMsg] = useState(""), [pwErr, setPwErr] = useState(""), [pwTried, setPwTried] = useState(false);
  const changePw = async () => { setPwTried(true); setPwErr(""); setPwMsg(""); if (passwordProblem(pw) || pw !== pw2) return; try { await Net.setPassword(pw); setPw(""); setPw2(""); setPwTried(false); setPwMsg("Password updated. Use it next time you sign in."); } catch (e) { setPwErr(friendlyError(e)); } };
  const [best, setBest] = useState(null); const [name, setName] = useState(profile ? profile.username : ""); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { Net.endlessBest().then(setBest).catch(() => {}); }, []);
  const rename = async () => {
    setErr(""); setMsg("");
    if (!USERNAME_RE.test(name)) return setErr("Usernames are 3–20 characters: letters, numbers and underscores.");
    setBusy(true);
    try { if (!(await Net.usernameAvailable(name))) throw new Error("USERNAME_TAKEN"); const p = await Net.claimUsername(name); onRenamed(p); setMsg("Username updated. Your progress and scores stay with your account."); }
    catch (e) { setErr(friendlyError(e)); } finally { setBusy(false); }
  };
  if (!profile) return null;
  return h(Page, { title: "Profile", onBack },
    h("div", { className: "cols2" },
      h("div", { className: "panel" },
        h("div", { className: "who big" }, h(Portrait, { id: save.avatars.selected, size: 72 }), h("div", null, h("h3", null, profile.username), h("p", { className: "note small" }, `Signed in with ${Net.contactLabel()} (only you can see this)`))),
        h("label", { className: "field" }, h("span", null, "Change username"), h("input", { value: name, maxLength: 20, onChange: (e) => setName(e.target.value.replace(/\s/g, "")) })),
        err && h("p", { className: "err", role: "alert" }, err), msg && h("p", { className: "ok" }, msg),
        h("div", { className: "row" }, h(Btn, { small: true, disabled: busy || name === profile.username, onClick: rename }, busy ? "Saving…" : "Save username"), h(Btn, { small: true, onClick: onAvatars }, "Change avatar"), h(Btn, { small: true, onClick: () => Net.signOut() }, "Sign out"))),
      h("div", { className: "panel" }, h("h3", null, "Progress"),
        h("table", null, h("tbody", null,
          h("tr", null, h("td", null, "Campaign levels cleared"), h("td", null, `${completedCount(save)}/100`)),
          h("tr", null, h("td", null, "Avatars unlocked"), h("td", null, `${save.avatars.unlocked.length}/20`)),
          h("tr", null, h("td", null, "Best campaign total"), h("td", null, fmt(save.campaign.bestTotal))),
          h("tr", null, h("td", null, "Endless best score"), h("td", null, best && best.best_score ? fmt(best.best_score) : "—")),
          h("tr", null, h("td", null, "Ranked endless runs"), h("td", null, best ? fmt(best.valid_runs) : "—")),
          h("tr", null, h("td", null, "Member since"), h("td", null, new Date(profile.created_at).toLocaleDateString())))),
        h("h3", null, "Password"), h(PasswordFields, { pw, setPw, pw2, setPw2, label: "New password", showErrors: pwTried }),
        pwErr && h("p", { className: "err", role: "alert" }, pwErr), pwMsg && h("p", { className: "ok" }, pwMsg),
        h(Btn, { small: true, onClick: changePw }, "Update password"))));
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
