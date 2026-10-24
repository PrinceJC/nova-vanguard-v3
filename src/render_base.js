"use strict";
// ============================================================ sprite cache
const SPR = {};
function svgURI(s) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s); }
function loadSprites() {
  const names = Object.keys(SPRITE_SVG);
  return Promise.all(names.map((n) => new Promise((res) => {
    const svg = SPRITE_SVG[n];
    const m = svg.match(/viewBox="[^"]*?\s([\d.]+)\s([\d.]+)"/), vw = parseFloat(m[1]), vh = parseFloat(m[2]);
    const big = Math.max(vw, vh), k = big > 120 ? 2.2 : big > 70 ? 4.5 : 6, pw = Math.round(vw * k), ph = Math.round(vh * k);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = pw; c.height = ph;
      const cx = c.getContext("2d"); cx.drawImage(img, 0, 0, pw, ph);
      if (typeof ENEMIES !== "undefined" && (ENEMIES[n] || n === "glacier_guard_broken")) { // drop shadow + metallic sheen pass
        const sh = document.createElement("canvas"); sh.width = pw; sh.height = ph; const sx = sh.getContext("2d");
        sx.drawImage(img, 0, 0, pw, ph); sx.globalCompositeOperation = "source-in"; sx.fillStyle = "rgba(6,4,24,0.55)"; sx.fillRect(0, 0, pw, ph);
        cx.save(); cx.globalCompositeOperation = "destination-over"; cx.drawImage(sh, pw * 0.03, ph * 0.05); cx.restore();
        cx.globalCompositeOperation = "source-atop";
        const gr = cx.createLinearGradient(0, 0, pw * 0.4, ph); gr.addColorStop(0, "rgba(255,255,255,0.32)"); gr.addColorStop(0.35, "rgba(255,255,255,0.04)"); gr.addColorStop(0.65, "rgba(10,8,40,0.05)"); gr.addColorStop(1, "rgba(10,8,40,0.38)");
        cx.fillStyle = gr; cx.fillRect(0, 0, pw, ph); cx.globalCompositeOperation = "source-over";
      }
      SPR[n] = { c, w: null, vb: vw, vw, vh }; res();
    };
    img.onerror = () => res();
    img.src = svgURI(svg);
  })));
}
function whiteOf(s) { // hit-flash silhouette, created the first time it is needed
  if (!s.w) { const w = document.createElement("canvas"); w.width = s.c.width; w.height = s.c.height; const wx = w.getContext("2d"); wx.drawImage(s.c, 0, 0); wx.globalCompositeOperation = "source-in"; wx.fillStyle = "#fff"; wx.fillRect(0, 0, w.width, w.height); s.w = w; }
  return s.w;
}
function drawSprWH(ctx, name, x, y, w, h, o = {}) {
  const s = SPR[name]; if (!s) return;
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.skew) ctx.transform(1, o.skew, 0, 1, 0, 0);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  ctx.drawImage(s.c, -w / 2, -h / 2, w, h);
  if (o.white) { ctx.globalAlpha = (o.alpha ?? 1) * o.white; ctx.drawImage(whiteOf(s), -w / 2, -h / 2, w, h); }
  ctx.restore();
}
function drawSpr(ctx, name, x, y, size, o = {}) {
  const s = SPR[name]; if (!s) return;
  ctx.save(); ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.flipY) ctx.scale(1, -1);
  if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  ctx.drawImage(s.c, -size / 2, -size / 2, size, size);
  if (o.white) { ctx.globalAlpha = (o.alpha ?? 1) * o.white; ctx.drawImage(whiteOf(s), -size / 2, -size / 2, size, size); }
  ctx.restore();
}

// ============================================================ backgrounds
const BG = {};
// Backgrounds are pre-rendered at the device's real resolution (logical px × render scale), so they stay sharp on
// high-density phones and tablets. Changing the scale (rotation, resize) simply rebuilds the cached layers.
let RENDER_SCALE = 1;
function setRenderScale(sc) { sc = Math.max(1, Math.min(2.5, Math.round(sc * 4) / 4)); if (sc !== RENDER_SCALE) { RENDER_SCALE = sc; for (const k of Object.keys(BG)) delete BG[k]; } return sc; }
function srand(seed) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }
function mkLayer(draw, seed) {
  const c = document.createElement("canvas"); c.width = Math.round(W * RENDER_SCALE); c.height = Math.round(H * RENDER_SCALE);
  const x = c.getContext("2d"); x.scale(c.width / W, c.height / H); x.imageSmoothingQuality = "high"; const r = srand(seed);
  const wrap = (fn) => { fn(0); fn(-W); fn(W); };
  draw(x, r, wrap); return c;
}
function mixHex(a, b, t) { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); }
function buildBG(L) {
  if (BG[L]) return BG[L];
  const lv = WORLDS[L - 1], P = lv.pal, t = lv.bg;
  const sky = mkLayer((x, r) => { // deep blue-violet space tinted by the world
    const gr = x.createLinearGradient(0, 0, W * 0.3, H); gr.addColorStop(0, mixHex("#101a6a", P.top, 0.35)); gr.addColorStop(0.55, mixHex("#1d1a86", P.bot, 0.3)); gr.addColorStop(1, mixHex("#2a1670", P.bot, 0.4));
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 170; i++) { x.globalAlpha = r() * 0.6 + 0.25; x.fillStyle = r() < 0.15 ? P.star : "#ffffff"; const s = r() * 0.9 + 0.35; x.beginPath(); x.arc(r() * W, r() * H, s, 0, TAU); x.fill(); }
    x.globalAlpha = 1;
  }, L * 7);
  const nebula = mkLayer((x, r, wrap) => {
    const cols = ["#7a4ae0", "#3a6ad8", P.acc, "#c04ad8", "#2a8ae0"];
    for (let i = 0; i < 9; i++) {
      const cx = r() * W, cy = r() * H, rad = 120 + r() * 220, col = cols[i % cols.length];
      wrap((o) => { const g = x.createRadialGradient(cx + o, cy, 0, cx + o, cy, rad); g.addColorStop(0, col + "55"); g.addColorStop(0.5, col + "22"); g.addColorStop(1, col + "00"); x.fillStyle = g; x.fillRect(cx + o - rad, cy - rad, rad * 2, rad * 2); });
    }
    for (let i = 0; i < 6; i++) { const sx = r() * W, sy = r() * H; x.fillStyle = "#ffffff"; x.globalAlpha = 0.85; x.beginPath(); x.moveTo(sx, sy - 7); x.lineTo(sx + 1.4, sy - 1.4); x.lineTo(sx + 7, sy); x.lineTo(sx + 1.4, sy + 1.4); x.lineTo(sx, sy + 7); x.lineTo(sx - 1.4, sy + 1.4); x.lineTo(sx - 7, sy); x.lineTo(sx - 1.4, sy - 1.4); x.fill(); }
    x.globalAlpha = 1;
  }, L * 11);
  const far = mkLayer((x, r, wrap) => { // faint world silhouettes far away
    x.fillStyle = P.far; x.globalAlpha = 0.3;
    for (let i = 0; i < 10; i++) {
      const px = r() * W, w = 40 + r() * 70, h = 60 + r() * 140;
      wrap((o) => { x.beginPath();
        if (t === "city" || t === "fortress" || t === "ruins") x.rect(px + o, H - h, w * 0.7, h);
        else if (t === "crystal" || t === "ice") { x.moveTo(px + o, H); x.lineTo(px + o + w / 2, H - h); x.lineTo(px + o + w, H); }
        else x.ellipse(px + o, r() * H, w * 1.3, h * 0.2, 0, 0, TAU);
        x.fill(); });
    }
    x.globalAlpha = 0.25; x.fillStyle = P.mid; x.beginPath(); x.arc(W * (0.3 + r() * 0.5), H * (0.2 + r() * 0.3), 30 + r() * 40, 0, TAU); x.fill(); x.globalAlpha = 1;
  }, L * 13);
  const streaks = mkLayer((x, r) => { // subtle light streaks
    for (let i = 0; i < 14; i++) { const sx = r() * W, sy = r() * H, len = 60 + r() * 160; const g = x.createLinearGradient(sx, sy, sx + len, sy - len * 0.08); g.addColorStop(0, "rgba(160,200,255,0)"); g.addColorStop(0.7, "rgba(160,200,255,0.35)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.strokeStyle = g; x.lineWidth = 1.5; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + len, sy - len * 0.08); x.stroke(); }
  }, L * 17);
  const scenery = mkLayer((x, r, wrap) => {
    const px = W * (0.25 + r() * 0.5), py = H * (0.18 + r() * 0.3), pr = 46 + r() * 40;
    const pg = x.createRadialGradient(px - pr * 0.35, py - pr * 0.35, pr * 0.1, px, py, pr);
    pg.addColorStop(0, mixHex(P.acc, "#ffffff", 0.35)); pg.addColorStop(0.55, mixHex(P.mid, P.acc, 0.35)); pg.addColorStop(1, mixHex(P.far, "#05040f", 0.5));
    x.globalAlpha = 0.85; x.fillStyle = pg; x.beginPath(); x.arc(px, py, pr, 0, TAU); x.fill();
    x.strokeStyle = mixHex(P.acc, "#ffffff", 0.5); x.globalAlpha = 0.35; x.lineWidth = 2; x.beginPath(); x.arc(px, py, pr, -2.6, -0.6); x.stroke();
    if (r() < 0.6) { x.globalAlpha = 0.45; x.strokeStyle = P.star; x.lineWidth = 3; x.beginPath(); x.ellipse(px, py, pr * 1.7, pr * 0.35, -0.25, 0, TAU); x.stroke(); }
    x.globalAlpha = 1;
    for (let i = 0; i < 9; i++) {
      const ax = r() * W, ay = 30 + r() * (H - 60), ar = 6 + r() * 16, rot = r() * TAU;
      wrap((o) => { x.save(); x.translate(ax + o, ay); x.rotate(rot);
        const ag = x.createLinearGradient(-ar, -ar, ar, ar); ag.addColorStop(0, mixHex(P.mid, "#ffffff", 0.25)); ag.addColorStop(1, mixHex(P.far, "#000000", 0.4));
        x.globalAlpha = 0.7; x.fillStyle = ag; x.beginPath(); for (let k = 0; k < 7; k++) { const a = (TAU / 7) * k, rr = ar * (k % 2 ? 0.75 : 1); x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill();
        x.strokeStyle = mixHex(P.acc, "#ffffff", 0.4); x.globalAlpha = 0.35; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-ar * 0.6, -ar * 0.5); x.lineTo(ar * 0.3, -ar * 0.8); x.stroke(); x.restore(); });
    }
  }, L * 19);
  return (BG[L] = { sky, nebula, far, scenery, streaks, mid: far, near: streaks });
}
function drawLayer(ctx, c, off) { const o = -(((off % W) + W) % W); ctx.drawImage(c, o, 0, W, H); ctx.drawImage(c, o + W, 0, W, H); }

function drawSerpent(ctx, b, white, now) {
  for (let i = b.segs.length - 1; i >= 0; i--) {
    const s = b.segs[i], r = s.r;
    ctx.save(); ctx.translate(s.x, s.y);
    ctx.fillStyle = "#1a1030"; ctx.beginPath(); ctx.moveTo(-r - 3, 0); ctx.lineTo(0, -r * 1.3 - 3); ctx.lineTo(r + 3, 0); ctx.lineTo(0, r * 1.3 + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = white ? "#ffffff" : "#9b6bff"; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(0, -r * 1.3); ctx.lineTo(r, 0); ctx.lineTo(0, r * 1.3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#e2d4ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * 0.5, 0); ctx.lineTo(0, -r * 0.7); ctx.lineTo(r * 0.2, 0); ctx.stroke();
    ctx.restore();
    if (i > 0) { const q = b.segs[i - 1]; ctx.fillStyle = "#1a1030"; ctx.beginPath(); ctx.arc((s.x + q.x) / 2, (s.y + q.y) / 2, 6.5, 0, TAU); ctx.fill(); ctx.fillStyle = "#ff4fb3"; ctx.beginPath(); ctx.arc((s.x + q.x) / 2, (s.y + q.y) / 2, 4.5 + Math.sin(now / 120 + i) * 1, 0, TAU); ctx.fill(); }
  }
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang + Math.PI);
  const poly = (pts, fill) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = "#1a1030"; ctx.lineWidth = 3; ctx.stroke(); };
  poly([[-34, 6], [-14, -22], [24, -24], [36, 0], [24, 26], [-14, 24]], white ? "#fff" : "#6a3fc9");
  poly([[-8, -20], [4, -42], [14, -22]], white ? "#fff" : "#c99cff");
  poly([[14, -22], [30, -40], [30, -14]], white ? "#fff" : "#c99cff");
  poly([[-34, 6], [0, 6], [-14, 24]], "#3d2a6b");
  ctx.fillStyle = "#ff4fb3"; ctx.beginPath(); ctx.arc(-2, -6, 7, 0, TAU); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-4, -8, 2.5, 0, TAU); ctx.fill();
  ctx.restore();
}


function drawHazard(ctx, h, g, now) {
  const tele = h.t < h.tele, pulse = 0.5 + 0.5 * Math.sin(now / 70);
  ctx.save();
  switch (h.type) {
    case "laser": {
      const L = 1400, ex = h.x + Math.cos(h.ang) * L, ey = h.y + Math.sin(h.ang) * L;
      if (tele) { ctx.strokeStyle = "#ff3fb4"; ctx.lineWidth = 2; ctx.setLineDash([10, 7]); ctx.globalAlpha = 0.4 + 0.5 * pulse; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey); ctx.stroke(); }
      else { ctx.lineCap = "round"; ctx.strokeStyle = "#ff3fb4"; ctx.lineWidth = h.w + 6; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.globalAlpha = 1; ctx.lineWidth = h.w * 0.6; ctx.strokeStyle = "#ffd1ec"; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey); ctx.stroke(); }
      break;
    }
    case "hbeam": {
      const y0 = h.y - h.h / 2;
      if (tele) { ctx.fillStyle = "#ff3fb4"; ctx.globalAlpha = 0.08 + 0.1 * pulse; ctx.fillRect(0, y0, W, h.h); ctx.globalAlpha = 0.7; ctx.strokeStyle = "#ff3fb4"; ctx.setLineDash([12, 8]); ctx.lineWidth = 2; ctx.strokeRect(-4, y0, W + 8, h.h); }
      else { ctx.fillStyle = "#ff3fb4"; ctx.globalAlpha = 0.45; ctx.fillRect(0, y0, W, h.h); ctx.globalAlpha = 0.95; ctx.fillStyle = h.color === "ice" ? "#ffe4f6" : "#ffd1ec"; ctx.fillRect(0, h.y - h.h * 0.22, W, h.h * 0.44); }
      break;
    }
    case "vstrike": {
      const x0 = h.x - h.w / 2, col = h.kind === "debris" ? "#ff8a1f" : "#ff3fb4";
      if (tele) {
        ctx.fillStyle = col; ctx.globalAlpha = 0.08 + 0.1 * pulse; ctx.fillRect(x0, 0, h.w, H);
        ctx.globalAlpha = 0.8; ctx.strokeStyle = col; ctx.setLineDash([10, 8]); ctx.lineWidth = 2; ctx.strokeRect(x0, -4, h.w, H + 8); ctx.setLineDash([]);
        ctx.fillStyle = col; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(h.x - 12, 14); ctx.lineTo(h.x + 12, 14); ctx.lineTo(h.x, 34); ctx.fill();
      } else if (h.kind !== "debris") {
        ctx.strokeStyle = "#ff8a1f"; ctx.lineWidth = 10; ctx.globalAlpha = 0.6; boltPath(ctx, h.x, now); ctx.stroke();
        ctx.strokeStyle = "#fff3c4"; ctx.lineWidth = 4; ctx.globalAlpha = 1; boltPath(ctx, h.x, now); ctx.stroke();
      }
      break;
    }
    case "zone": {
      ctx.strokeStyle = "#c46bff"; ctx.lineWidth = 2;
      if (tele) { ctx.setLineDash([8, 6]); ctx.globalAlpha = 0.5 + 0.4 * pulse; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke(); }
      else {
        ctx.globalAlpha = 0.12; ctx.fillStyle = "#8a4bff"; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke();
        for (let i = 0; i < 3; i++) { const rr = h.r * (1 - (((now / 1400) + i / 3) % 1)); ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(h.x, h.y, rr, 0, TAU); ctx.stroke(); }
        ctx.globalAlpha = 1; ctx.fillStyle = "#2a0a18"; ctx.beginPath(); ctx.arc(h.x, h.y, 15, 0, TAU); ctx.fill(); ctx.fillStyle = "#ff3fb4"; ctx.beginPath(); ctx.arc(h.x, h.y, 12, 0, TAU); ctx.fill();
      }
      break;
    }
    case "marker": {
      const r = h.r * (1.4 - 0.4 * (h.t / h.tele));
      ctx.strokeStyle = "#ff3fb4"; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(h.x - r * 0.5, h.y); ctx.lineTo(h.x + r * 0.5, h.y); ctx.moveTo(h.x, h.y - r * 0.5); ctx.lineTo(h.x, h.y + r * 0.5); ctx.stroke();
      break;
    }
    case "band": {
      const y0 = h.y - h.h / 2;
      ctx.fillStyle = "#ff8a1f"; ctx.globalAlpha = 0.08 + 0.1 * pulse; ctx.fillRect(0, y0, W, h.h);
      ctx.globalAlpha = 0.8; ctx.strokeStyle = "#ff8a1f"; ctx.setLineDash([12, 8]); ctx.lineWidth = 2; ctx.strokeRect(-4, y0, W + 8, h.h); ctx.setLineDash([]);
      ctx.fillStyle = "#ff8a1f"; for (let x = W - 80 - ((now / 4) % 120); x > 0; x -= 120) { ctx.beginPath(); ctx.moveTo(x, h.y); ctx.lineTo(x + 22, h.y - 14); ctx.lineTo(x + 22, h.y + 14); ctx.fill(); }
      break;
    }
  }
  ctx.restore();
}

function boltPath(ctx, x, now) { ctx.beginPath(); let px = x; ctx.moveTo(px, 0); const s = Math.floor(now / 50); const r = srand(s * 7 + Math.floor(x)); for (let y = 30; y <= H; y += 30) { px = x + (r() - 0.5) * 26; ctx.lineTo(px, y); } }


function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function heart(ctx, x, y, s, fill) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.35); ctx.bezierCurveTo(x - s * 0.5, y + s * 0.65, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.65, x + s * 0.5, y + s * 0.35); ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.35);
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = "#1a1030"; ctx.lineWidth = 2; ctx.stroke();
}


const FONT = "'Exo 2', 'Baloo 2', 'Trebuchet MS', sans-serif";

function txt(ctx, s, x, y, size, color, align = "left", weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
  ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = "rgba(16,8,32,0.85)"; ctx.lineJoin = "round"; ctx.strokeText(s, x, y);
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}

