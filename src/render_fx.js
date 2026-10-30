"use strict";
// ============================================================ glow sprites (cheap additive halos instead of shadowBlur)
const GLOW = {};
function glow(color, r = 24) {
  r = 48; const k = color; if (GLOW[k]) return GLOW[k];   // 96 px halo: smooth when scaled on high-density screens
  const c = document.createElement("canvas"); c.width = c.height = r * 2;
  const x = c.getContext("2d"), gr = x.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, color); gr.addColorStop(0.35, color + "88"); gr.addColorStop(1, color + "00");
  x.fillStyle = gr; x.fillRect(0, 0, r * 2, r * 2); return (GLOW[k] = c);
}
function drawGlow(ctx, color, x, y, r, a = 1) { ctx.globalAlpha = a; ctx.drawImage(glow(color), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; }
const worldIndex = (lv) => Math.max(1, WORLDS.indexOf(lv.world) + 1);

// ============================================================ frame
function drawGame(ctx, g, set, now) {
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  const Q = Math.min(set.quality ?? 2, set.perfCap ?? 2), rm = set.reduced, shakeAmt = rm ? 0 : (set.shake ?? 0.7);
  const bg = buildBG(worldIndex(g.lv));
  g.quality = Q;
  ctx.save();
  if (g.shake > 0 && shakeAmt > 0) { const s = g.shake * 14 * shakeAmt; ctx.translate(rand(-s, s), rand(-s, s)); }
  ctx.drawImage(bg.sky, 0, 0);
  drawLayer(ctx, bg.nebula, g.scroll * 0.06);
  if (Q > 0) drawLayer(ctx, bg.far, g.scroll * 0.18);
  if (Q > 0) drawLayer(ctx, bg.scenery, g.scroll * 0.32);
  drawLayer(ctx, bg.streaks, g.scroll * 1.6);
  if (Q > 1) drawMotes(ctx, g, now);

  for (const h of g.hz) drawHazard(ctx, h, g, now);
  drawFastWarnings(ctx, g, now);
  for (const o of g.obs) drawObstacle(ctx, o, g, now);
  drawParticles(ctx, g, rm, Q, false);
  for (const k of g.pickups) drawPickup(ctx, k, now, Q);
  for (const e of g.enemies) drawEnemy(ctx, e, g, now, Q);
  if (g.boss) drawBoss(ctx, g.boss, g, now);
  drawPlayerShots(ctx, g, Q);
  drawPlayer(ctx, g, set, now, Q);
  if (g.blast) drawBlast(ctx, g.blast, rm, g, now);
  drawEnemyShots(ctx, g, Q);
  drawParticles(ctx, g, rm, Q, true);
  drawTexts(ctx, g);
  ctx.restore();
  if (g.flash > 0) { ctx.fillStyle = "#fff"; ctx.globalAlpha = rm ? Math.min(0.05, g.flash * 0.2) : Math.min(0.28, g.flash); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  drawHUD(ctx, g, set, now);
  if (set.opponent) drawOpponentPanel(ctx, set.opponent, now);
}
const MOTES = Array.from({ length: 26 }, (_, i) => ({ x: (i * 397) % W, y: (i * 211) % H, s: 0.6 + (i % 5) * 0.35, sp: 1.3 + (i % 4) * 0.4 }));
function drawMotes(ctx, g, now) {
  ctx.fillStyle = g.lv.pal.star; ctx.globalAlpha = 0.35;
  for (const m of MOTES) { const x = (((m.x - g.scroll * m.sp) % W) + W) % W; ctx.fillRect(x, m.y, m.s * 2, m.s); }
  ctx.globalAlpha = 1;
}

// ---------------- warnings for fast enemies (shown at the right edge ~1.2 s before they enter)
const FAST_TYPES = { dart: 1, torpedo_bot: 1, drill_drone: 1, thorn_wasp: 1 };
function drawFastWarnings(ctx, g, now) {
  const list = [];
  if (g.mode === "campaign") { for (const q of g.queue) if (!q.obs && FAST_TYPES[q.type] && q.at - g.t <= 1.2 && q.at >= g.t) list.push({ y: q.y, k: (q.at - g.t) / 1.2 }); }
  else if (g.pending) { const c = endlessClock(g); for (const s of g.pending) { if (s.t - c > 1.2) break; if (FAST_TYPES[s.type]) list.push({ y: typeof s.y === "number" ? 40 + s.y * (H - 80) : s.y, k: Math.max(0, (s.t - c) / 1.2) }); } }
  for (const w of list) {
    const y = w.y === "top" ? 40 : w.y === "bottom" ? H - 40 : w.y, a = 0.55 + 0.45 * Math.sin(now / 60);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = "rgba(255,63,122,0.18)"; ctx.fillRect(W - 120, y - 22, 120, 44);
    ctx.fillStyle = "#ff3f7a"; ctx.beginPath(); ctx.moveTo(W - 50, y); ctx.lineTo(W - 22, y - 18); ctx.lineTo(W - 22, y + 18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#ff3f7a"; ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W - 60, y); ctx.lineTo(W - 60 - 220 * (1 - w.k), y); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 1; txt(ctx, "!", W - 32, y + 7, 20, "#ffffff", "center", 900); ctx.restore();
  }
}
// ---------------- multiplayer: live opponent view (bottom-centre panel)
function drawOpponentPanel(ctx, opp, now) {
  const pw = 270, ph = 152, x0 = W / 2 - pw / 2, y0 = H - ph - 10, sc = pw / W;
  ctx.save(); ctx.fillStyle = "rgba(10,8,30,0.82)"; roundRect(ctx, x0, y0, pw, ph, 12); ctx.fill(); ctx.strokeStyle = opp.dead ? "#ff6b8a" : "#7ff3ff"; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); roundRect(ctx, x0 + 4, y0 + 22, pw - 8, ph - 26, 9); ctx.clip();
  ctx.fillStyle = "#151845"; ctx.fillRect(x0, y0, pw, ph); for (let i = 0; i < 18; i++) { ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(x0 + ((i * 97 + now / 30) % pw), y0 + 26 + (i * 53) % (ph - 30), 1.5, 1.5); }
  if (!opp.dead) { const av = AVATAR_BY_ID[opp.avatar] || AVATARS[0], px = x0 + (opp.x || 150) * sc, py = y0 + 22 + (opp.y || 270) * sc * 0.93, K = PLAYER_ART_K * sc * 1.6;
    drawAvatarArt(ctx, av, "idle", px + (50 - SPRITE_ANCHOR[0]) * K, py + (33 - SPRITE_ANCHOR[1]) * K, K, now); }
  else txt(ctx, "Defeated", W / 2, y0 + 90, 22, "#ff9ab0", "center", 900);
  ctx.restore();
  txt(ctx, (opp.name || "Opponent") + " · live", x0 + 10, y0 + 17, 13, "#c8f0ff");
  for (let i = 0; i < 3; i++) heart(ctx, x0 + pw - 70 + i * 20, y0 + 4, 14, i < (opp.hp ?? 3) ? "#ff6b9a" : "#3a2a50");
  txt(ctx, `${fmtTime(opp.t || 0)} · ${(opp.score || 0).toLocaleString()}`, x0 + pw - 10, y0 + ph - 8, 13, "#ffe08a", "right", 800);
}
// draws a hero (wings flap behind the body around the shoulder); cx, cy = centre of the body sprite in world units
function drawAvatarArt(ctx, av, frame, cx, cy, K, now, o = {}) {
  const key = av.key && SPR[`av_${av.key}_idle`] ? av.key : av.id;   // customised sprites (fall back to the base hero while they load)
  if (av.board === "wings" || av.wings) {
    const flap = Math.sin(now / 150), px = cx + (WING_PIVOT[0] - 50) * K, py = cy + (WING_PIVOT[1] - 33) * K;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.1 * flap); ctx.scale(1, 0.84 + 0.16 * flap); ctx.translate(-px, -py);
    drawSprWH(ctx, `avw_${key}`, cx + (WING_VB[0] + WING_VB[2] / 2 - 50) * K, cy + (WING_VB[1] + WING_VB[3] / 2 - 33) * K, WING_VB[2] * K, WING_VB[3] * K, { alpha: o.alpha });
    ctx.restore();
  }
  const pu = o.pulse || 1;
  drawSprWH(ctx, `av_${key}_${frame}`, cx, cy, 104 * K * pu, 70 * K * pu, { alpha: o.alpha, skew: o.skew, white: o.white });
}

// ============================================================ player (avatar) with animation states
function drawPlayer(ctx, g, set, now, Q) {
  const p = g.player, av = g.av || AVATAR_BY_ID[g.avatar] || AVATARS[0], sh = av.shot[0];
  if (p.dead) {
    if (p.deadT > 1.3) return;
    const k = p.deadT / 1.3;
    ctx.save(); ctx.translate(p.x - k * 30, p.y + k * k * 160); ctx.rotate(k * 5); ctx.globalAlpha = 1 - k;
    drawAvatarArt(ctx, av, "hurt", 0, 0, PLAYER_ART_K, now); ctx.restore(); return;
  }
  let a = 1;
  if (p.inv > 0) a = set.reduced ? 0.55 : Math.floor(now / 80) % 2 ? 0.3 : 1;
  const bob = Math.sin(now / 160) * 1.6, frame = p.hurtT > 0 ? "hurt" : p.muzzle > 0 ? "fire" : "idle";
  const pulse = p.healT > 0 || p.upT > 0 ? 1 + 0.08 * Math.sin((Math.max(p.healT, p.upT)) * 30) : 1;
  if (p.charge > 0) { // blast charge-up: rings contract into the cannon
    const k = 1 - p.charge / BLAST_CHARGE;
    if (Q > 0) drawGlow(ctx, sh, p.x + (g.muzzle || [MUZZLE_DX])[0], p.y + (g.muzzle || [0, 0])[1], 30 + k * 30, 0.5 + k * 0.5);
    ctx.strokeStyle = sh; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { const r = (1 - ((k + i / 3) % 1)) * 70 + 8; ctx.globalAlpha = 0.25 + 0.6 * ((k + i / 3) % 1); ctx.beginPath(); ctx.arc(p.x + (g.muzzle || [MUZZLE_DX])[0], p.y + (g.muzzle || [0, 0])[1], r, 0, TAU); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  const K = PLAYER_ART_K, mz = g.muzzle || [MUZZLE_DX, MUZZLE_DY], cx = p.x + (50 - SPRITE_ANCHOR[0]) * K, cy = p.y + (33 - SPRITE_ANCHOR[1]) * K, AW = 104 * K, AH = 70 * K;
  if (Q > 0) { const fl = 0.8 + 0.2 * Math.sin(now / 40); drawGlow(ctx, sh, p.x + (2 - SPRITE_ANCHOR[0]) * K, p.y + (56 - SPRITE_ANCHOR[1]) * K, 14 * fl, 0.8); }
  if (Q > 0 && p.muzzle > 0) drawGlow(ctx, p.bullet ? BULLET_POWERUPS[p.bullet.kind].color : sh, p.x + mz[0] + 4, p.y + mz[1], 22, 0.85);
  if (p.upT > 0 && Q > 0) drawGlow(ctx, "#ffd34f", p.x + mz[0] * 0.6, p.y + mz[1], 46, p.upT);
  const recoil = av.cat === "cannon" ? p.recoil * 1.6 : av.cat === "sniper" ? p.recoil * 1.2 : av.cat === "bow" ? 0 : p.recoil * 0.7;
  const lean = av.board === "skate" ? (p.muzzle > 0 ? -0.06 : 0) + Math.sin(now / 260) * 0.03 : 0;
  ctx.save(); ctx.translate(-recoil, bob); ctx.rotate(p.tilt * 0.6 + lean);
  drawAvatarArt(ctx, av, frame, cx, cy, K, now, { alpha: a, pulse, skew: Math.sin(now / 300) * 0.012, white: p.hurtT > 0.25 ? 0.6 : 0 });
  ctx.restore();
  if (p.healT > 0) { ctx.strokeStyle = "#6fe04a"; ctx.lineWidth = 3; ctx.globalAlpha = p.healT / 0.6; ctx.beginPath(); ctx.arc(p.x, p.y - 4, 40 - p.healT * 20, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  if (p.upT > 0) { ctx.strokeStyle = "#ffd34f"; ctx.lineWidth = 3; ctx.globalAlpha = p.upT / 0.8; ctx.beginPath(); ctx.arc(p.x, p.y - 4, 46 - p.upT * 24, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  if (p.shield > 0) { // bubble plus a ring that drains with the remaining duration
    const f = p.shield / p.shieldMax, blink = p.shield < 1.5 && Math.floor(now / 100) % 2;
    ctx.fillStyle = "#9ff7c4"; ctx.globalAlpha = blink ? 0.04 : 0.1; ctx.beginPath(); ctx.ellipse(p.x + 24, p.y - 6, 80, 58, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = blink ? 0.35 : 0.85; ctx.strokeStyle = "#9ff7c4"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x + 24, p.y - 6, 80, 58, 0, -Math.PI / 2, -Math.PI / 2 + TAU * f); ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#1a1030"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, TAU); ctx.fill(); ctx.stroke();
}

// ============================================================ projectiles
function drawPlayerShots(ctx, g, Q) {
  const av = g.av || AVATAR_BY_ID[g.avatar] || AVATARS[0], [col, core] = av.shot, cat = av.cat;
  for (const s of g.pbul) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx));
    if (s.kind) { drawPowerShot(ctx, s, Q); ctx.restore(); continue; }
    if (cat === "bow") { // arrow: shaft, head, fletching, short magical trail
      if (Q > 0) { const tg = ctx.createLinearGradient(-36, 0, -14, 0); tg.addColorStop(0, col + "00"); tg.addColorStop(1, col + "aa"); ctx.strokeStyle = tg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-36, 0); ctx.lineTo(-14, 0); ctx.stroke(); }
      if (Q > 1) { ctx.globalAlpha = 0.4; ctx.drawImage(glow(col, 32), -16, -8, 34, 16); ctx.globalAlpha = 1; }
      ctx.strokeStyle = "#120c22"; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.strokeStyle = av.wc[2]; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.fillStyle = col; ctx.strokeStyle = "#120c22"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(6, -4.4); ctx.lineTo(8, 0); ctx.lineTo(6, 4.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = av.out[2]; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-17, -4); ctx.lineTo(-14, 0); ctx.lineTo(-17, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(12, 0, 1.4, 0, TAU); ctx.fill();
    } else if (cat === "wand") { // glowing magic orb with a sparkle trail
      if (Q > 0) { for (let k = 1; k <= 3; k++) { ctx.globalAlpha = 0.5 - k * 0.12; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-k * 7, Math.sin(s.age * 30 + k) * 2.5, 3.2 - k * 0.6, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
      if (Q > 1) { ctx.globalAlpha = 0.55; ctx.drawImage(glow(col), -14, -14, 28, 28); ctx.globalAlpha = 1; }
      ctx.fillStyle = col; ctx.strokeStyle = "#0f1e3a"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 5.4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.rotate(s.age * 10); ctx.fillStyle = core; starPath(ctx, 0, 0, 4.2, 1.6, 4); ctx.fill(); ctx.restore();
    } else if (cat === "sniper") { // slim, bright precision round
      if (Q > 0) { const tg = ctx.createLinearGradient(-44, 0, -10, 0); tg.addColorStop(0, col + "00"); tg.addColorStop(1, col + "cc"); ctx.fillStyle = tg; ctx.fillRect(-44, -1.2, 34, 2.4); }
      if (Q > 1) { ctx.globalAlpha = 0.35; ctx.drawImage(glow(col, 32), -16, -6, 32, 12); ctx.globalAlpha = 1; }
      if (av.heavy) { const tg = ctx.createLinearGradient(-70, 0, -10, 0); tg.addColorStop(0, col + "00"); tg.addColorStop(1, col + "ee"); ctx.fillStyle = tg; ctx.fillRect(-70, -2, 60, 4); }
      ctx.fillStyle = "#0f1e3a"; ctx.beginPath(); ctx.ellipse(0, 0, av.heavy ? 20 : 16, av.heavy ? 3.6 : 2.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 15, 1.9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = core; ctx.beginPath(); ctx.ellipse(3, 0, 9, 0.9, 0, 0, TAU); ctx.fill();
    } else if (cat === "gun") { // compact luminous bullet
      if (Q > 0) { const tg = ctx.createLinearGradient(-24, 0, -5, 0); tg.addColorStop(0, col + "00"); tg.addColorStop(1, col + "99"); ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(-24, 0); ctx.lineTo(-5, 3); ctx.fill(); }
      if (Q > 1) { ctx.globalAlpha = 0.45; ctx.drawImage(glow(col, 32), -12, -8, 24, 16); ctx.globalAlpha = 1; }
      ctx.fillStyle = col; ctx.strokeStyle = "#0f1e3a"; ctx.lineWidth = 1.5; roundRect(ctx, -6, -3.6, 13, 7.2, 3.6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = core; roundRect(ctx, -2, -1.6, 7, 3.2, 1.6); ctx.fill();
    } else { // cannon: glowing energy bolt
      if (Q > 0) { const tg = ctx.createLinearGradient(-36, 0, -6, 0); tg.addColorStop(0, col + "00"); tg.addColorStop(1, col + "99"); ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-36, 0); ctx.lineTo(-6, 4); ctx.fill(); }
      if (Q > 1) { ctx.globalAlpha = 0.5; ctx.drawImage(glow(col, 32), -20, -12, 40, 24); ctx.globalAlpha = 1; }
      ctx.fillStyle = col; ctx.strokeStyle = "#0f1e3a"; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(15, 0); ctx.quadraticCurveTo(2, -6.5, -11, -3); ctx.quadraticCurveTo(-14, 0, -11, 3); ctx.quadraticCurveTo(2, 6.5, 15, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = core; ctx.beginPath(); ctx.ellipse(2, 0, 8, 2.2, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
}
function drawPowerShot(ctx, s, Q) {
  const pu = BULLET_POWERUPS[s.kind], c = pu.color;
  if (s.kind === "comet") { // long streaking comet with a fiery pink tail
    const tg = ctx.createLinearGradient(-56, 0, 0, 0); tg.addColorStop(0, c + "00"); tg.addColorStop(1, c + "dd");
    ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-56, 0); ctx.lineTo(0, 5); ctx.fill();
    if (Q > 0) { ctx.globalAlpha = 0.6; ctx.drawImage(glow(c, 32), -16, -12, 34, 24); ctx.globalAlpha = 1; }
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(2, 0, 5, 0, TAU); ctx.fill(); ctx.stroke();
  } else if (s.kind === "nova") { // large spinning star
    if (Q > 0) { ctx.globalAlpha = 0.55; ctx.drawImage(glow(c, 32), -20, -20, 40, 40); ctx.globalAlpha = 1; }
    ctx.rotate(s.age * 14); ctx.fillStyle = c; ctx.strokeStyle = "#5a3a08"; ctx.lineWidth = 1.6; starPath(ctx, 0, 0, 12, 5, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffffff"; starPath(ctx, 0, 0, 5.5, 2.4, 5); ctx.fill();
  } else { // prism shard with a rainbow edge
    if (Q > 0) { ctx.globalAlpha = 0.5; ctx.drawImage(glow(c, 32), -16, -10, 32, 20); ctx.globalAlpha = 1; }
    const gr = ctx.createLinearGradient(-12, -6, 14, 6); gr.addColorStop(0, "#ff9ad5"); gr.addColorStop(0.5, c); gr.addColorStop(1, "#ffe27a");
    ctx.fillStyle = gr; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(0, -7); ctx.lineTo(-12, 0); ctx.lineTo(0, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}
function starPath(ctx, x, y, R, r, n, rot = 0) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r : R, a = rot + (i * Math.PI) / n; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }

function drawEnemyShots(ctx, g, Q) {
  for (const b of g.ebul) {
    const col = b.c === "m" ? "#ff3fb4" : "#ff8a1f";
    if (Q > 1 && !b.rock) drawGlow(ctx, col, b.x, b.y, b.r * 2.6, 0.35);
    if (b.rock) {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.y * 0.03);
      ctx.fillStyle = "#6b4a2e"; ctx.strokeStyle = "#ff8a1f"; ctx.lineWidth = 2.5;
      ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = (TAU / 7) * i, r = b.r * (i % 2 ? 0.8 : 1.05); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); continue;
    }
    if (b.torpedo) {
      const a = Math.atan2(b.vy, b.vx);
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
      ctx.fillStyle = "#ffb347"; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-18 - Math.random() * 6, -3); ctx.lineTo(-18 - Math.random() * 6, 3); ctx.fill();
      ctx.fillStyle = "#2a0a18"; roundRect(ctx, -12, -6, 24, 12, 6); ctx.fill();
      ctx.fillStyle = "#e0533a"; roundRect(ctx, -10, -4.5, 20, 9, 4.5); ctx.fill();
      ctx.fillStyle = "#ffd9a0"; ctx.beginPath(); ctx.arc(6, 0, 2.5, 0, TAU); ctx.fill(); ctx.restore(); continue;
    }
    if (b.needle) {
      const a = Math.atan2(b.vy, b.vx);
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
      ctx.fillStyle = "#2a0a18"; ctx.beginPath(); ctx.ellipse(0, 0, 10, 4.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 3.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#fff3e0"; ctx.beginPath(); ctx.ellipse(2, 0, 4, 1.4, 0, 0, TAU); ctx.fill(); ctx.restore(); continue;
    }
    ctx.fillStyle = "#2a0a18"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 2, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    ctx.fillStyle = "#fff3e0"; ctx.beginPath(); ctx.arc(b.x - b.r * 0.15, b.y - b.r * 0.15, b.r * 0.45, 0, TAU); ctx.fill();
  }
}

// ============================================================ special blast wave (drawn at the exact damage radius)
function drawBomb(ctx, h, now) {   // marked landing circle + lobbed projectile
  const k = Math.min(1, h.t / h.tele), col = { jelly: "#ff8ad8", honey: "#ffcf5c", lava: "#ff7a2a", frost: "#bfe9ff" }[h.style] || "#ff8a1f";
  ctx.save(); ctx.strokeStyle = "#ff3fb4"; ctx.setLineDash([6, 5]); ctx.lineWidth = 2.5; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(now / 60); ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha = 0.12 + 0.18 * k; ctx.fillStyle = "#ff3fb4"; ctx.beginPath(); ctx.arc(h.x, h.y, h.r * k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  if (h.t < h.tele) { const x = h.sx + (h.x - h.sx) * k, y = h.sy + (h.y - h.sy) * k - Math.sin(k * Math.PI) * 120;
    ctx.fillStyle = "#2a0a18"; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
    if (h.style === "jelly") { ctx.strokeStyle = col; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 5, y + 8); ctx.lineTo(x + i * 6, y + 18 + Math.sin(now / 80 + i) * 3); ctx.stroke(); } }
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawBlast(ctx, U, rm, g, now) {
  const c = U.color || "#5ef2f2", u = U.u || 0;
  ctx.save();
  switch (U.type) {
    case "cannonball": { const x = U.bx || U.x; drawGlow(ctx, c, x, U.y, 90, 0.6); ctx.fillStyle = "#1a1030"; ctx.beginPath(); ctx.arc(x, U.y, 48, 0, TAU); ctx.fill(); const gr = ctx.createRadialGradient(x - 14, U.y - 14, 4, x, U.y, 46); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.4, c); gr.addColorStop(1, "#1a1030"); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, U.y, 44, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.35; ctx.fillStyle = c; ctx.fillRect(U.x, U.y - 30, Math.max(0, x - U.x - 40), 60); break; }
    case "laser": { const L = 1400, ex = U.x + Math.cos(U.ang || 0) * L, ey = U.y + Math.sin(U.ang || 0) * L; ctx.lineCap = "round"; ctx.strokeStyle = c; ctx.globalAlpha = 0.5; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(U.x, U.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(U.x, U.y); ctx.lineTo(ex, ey); ctx.stroke(); drawGlow(ctx, c, U.x, U.y, 40, 0.9); break; }
    case "tsunami": { const x = U.wx || U.x; ctx.fillStyle = c; ctx.globalAlpha = 0.28; ctx.fillRect(Math.max(0, x - 160), 0, 160, H); ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.moveTo(x - 30, 0);
      for (let y = 0; y <= H; y += 18) ctx.lineTo(x + Math.sin(y / 30 + now / 60) * 18, y); ctx.lineTo(x - 30, H); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; ctx.beginPath(); for (let y = 0; y <= H; y += 18) ctx.lineTo(x + Math.sin(y / 30 + now / 60) * 18, y); ctx.stroke(); break; }
    case "solar": { const y = U.sy || 0; ctx.fillStyle = c; ctx.globalAlpha = 0.25; ctx.fillRect(0, Math.max(0, y - 140), W, 140); ctx.globalAlpha = 0.95; ctx.fillRect(0, y - 14, W, 28); ctx.fillStyle = "#ffffff"; ctx.fillRect(0, y - 5, W, 10); break; }
    case "blackhole": { const r = U.collapsed ? 430 * Math.min(1, (u - 0.75) / 0.2) : 30 + u * 40; ctx.fillStyle = "#05030f"; ctx.beginPath(); ctx.arc(U.cx, U.cy, U.collapsed ? 30 : r, 0, TAU); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 4; for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.6 - i * 0.12; ctx.beginPath(); ctx.arc(U.cx, U.cy, (U.collapsed ? r : 60 + i * 60 + ((now / 4) % 60)), 0, TAU); ctx.stroke(); } drawGlow(ctx, c, U.cx, U.cy, 70, 0.6); break; }
    case "lightning": { ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.globalAlpha = 0.85; let px = U.x, py = U.y; for (let i = 0; i < U.chain.length; i++) { if (u < i * 0.04) break; const e = U.chain[i]; ctx.beginPath(); ctx.moveTo(px, py); const n = 6; for (let k = 1; k <= n; k++) ctx.lineTo(px + (e.x - px) * k / n + (k < n ? rand(-14, 14) : 0), py + (e.y - py) * k / n + (k < n ? rand(-14, 14) : 0)); ctx.stroke(); drawGlow(ctx, c, e.x, e.y, 26, 0.8); px = e.x; py = e.y; }
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.globalAlpha = 1; drawGlow(ctx, c, U.x, U.y, 30, 0.9); break; }
    case "lances": { for (const s of U.spears) { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.fillStyle = c; ctx.globalAlpha = 0.4; ctx.fillRect(-90, -6, 90, 12); ctx.globalAlpha = 1; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(-10, -8); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); } break; }
    case "meteor": { for (const m of U.meteors) { if (m.done) continue; const k = Math.max(0, (u - m.ti) / 0.25); if (u < m.ti) { ctx.strokeStyle = c; ctx.globalAlpha = 0.5; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(m.x, m.y, 85, 0, TAU); ctx.stroke(); ctx.setLineDash([]); continue; }
      const x = m.x - 160 * (1 - k), y = m.y - 420 * (1 - k); ctx.globalAlpha = 1; drawGlow(ctx, c, x, y, 34, 0.8); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 60, y - 150); ctx.stroke(); } break; }
    case "crystal": { for (const s of U.shards) { if (s.done) continue; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(u * 20); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(0, -5); ctx.lineTo(-10, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore(); } break; }
    default: { const a = Math.max(0, 1 - (U.r || 0) / BLAST_MAX); ctx.fillStyle = c; ctx.globalAlpha = 0.08 * a; ctx.beginPath(); ctx.arc(U.x, U.y, U.r || 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = 16; ctx.globalAlpha = 0.35 * a; ctx.beginPath(); ctx.arc(U.x, U.y, Math.max(1, (U.r || 0) - 6), 0, TAU); ctx.stroke(); ctx.strokeStyle = "#e6ffff"; ctx.lineWidth = 6; ctx.globalAlpha = 0.95 * a; ctx.beginPath(); ctx.arc(U.x, U.y, U.r || 0, 0, TAU); ctx.stroke(); }
  }
  ctx.restore();
}

// ============================================================ enemies & obstacles
function drawEnemy(ctx, e, g, now, Q) {
  const d = e.def, sz = e.size;
  if (d.move === "dash" && e.st === "tele") {
    ctx.strokeStyle = "#ff3fb4"; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.globalAlpha = 0.45 + 0.4 * Math.sin(now / 60);
    ctx.beginPath(); ctx.moveTo(e.x - sz / 2, e.y); ctx.lineTo(0, e.y); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  if (d.pull) { ctx.strokeStyle = "#ff3fb4"; ctx.globalAlpha = 0.25; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, e.y, 160 - ((now / 20) % 40), 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  if (e.charging) { ctx.strokeStyle = "#ff8a1f"; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(e.x, e.y, sz * 0.55 + Math.sin(now / 50) * 3, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  if (e.elite) {
    if (Q > 0 && g.enemies.length < 60) drawGlow(ctx, "#ffd34f", e.x, e.y, sz * 0.9, 0.35);
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(now / 400); ctx.strokeStyle = "#ffd34f"; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.arc(0, 0, sz * 0.6, 0, TAU); ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
    ctx.strokeStyle = "#ffe08a"; ctx.lineWidth = 3; ctx.globalAlpha = 0.9; for (let i = 0; i < 4; i++) { const a0 = now / 700 + (i * TAU) / 4; ctx.beginPath(); ctx.arc(e.x, e.y, sz * 0.52, a0, a0 + 0.5); ctx.stroke(); } ctx.globalAlpha = 1;
  }
  if (Q > 0 && g.enemies.length < 45 && d.move !== "turret" && d.move !== "edge") { const fl = 0.75 + 0.25 * Math.sin(now / 45 + e.y0); drawGlow(ctx, e.elite ? "#ffd34f" : "#7ab8ff", e.x + sz * 0.46, e.y, sz * 0.32 * fl, 0.75); drawGlow(ctx, "#ffffff", e.x + sz * 0.42, e.y, sz * 0.12 * fl, 0.8); }
  let name = e.type;
  if (e.type === "glacier_guard" && e.shield <= 0) name = "glacier_guard_broken";
  const bob = d.move === "turret" || d.move === "edge" ? 0 : Math.sin(now / 200 + e.y0) * 1.5;
  const squash = e.flash > 0 ? 0.9 : 1;
  ctx.save(); ctx.translate(e.x, e.y + bob); ctx.scale(2 - squash, squash);
  if (d.wide) { const S = SPR[name]; drawSprWH(ctx, name, 0, 0, sz, sz * (S ? S.vh / S.vw : 0.7), { rot: d.move === "rush" && e.st === "dash" ? e.rot : 0, white: e.flash > 0 ? 0.75 : e.st === "tele" && Math.floor(now / 90) % 2 ? 0.45 : 0 }); }
  else drawSpr(ctx, name, 0, 0, sz, { flipY: e.flip, rot: e.rot, white: e.flash > 0 ? 0.75 : 0, alpha: e.st === "mark" ? 0.4 : 1 });
  ctx.restore();
  if (d.move === "rush" && e.st === "tele") { // rush warning: aim line to the locked target, pulsing ring and "!" marker
    const k = e.stT / d.tele;
    ctx.strokeStyle = "#ff3f7a"; ctx.lineWidth = 2.5; ctx.setLineDash([10, 7]); ctx.globalAlpha = 0.5 + 0.4 * Math.sin(now / 50);
    ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + (e.tx - e.x) * 1.6, e.y + (e.ty - e.y) * 1.6); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(e.x, e.y, sz * (0.9 - k * 0.35), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    txt(ctx, "!", e.x, e.y - sz * 0.6, 26, "#ff3f7a", "center", 900);
  }
  if (d.armored) { // armored: tier-coloured health bar + tier pips
    const T = ARMOR_TIERS[d.armored], w = sz * 0.8, x0 = e.x - w / 2, y0 = e.y - sz / 2 - 12;
    ctx.fillStyle = "#120c22"; roundRect(ctx, x0 - 2, y0 - 2, w + 4, 9, 4); ctx.fill();
    ctx.fillStyle = e.dmgT > 0 ? "#ffffff" : T.metal[0]; roundRect(ctx, x0, y0, Math.max(0, w * (e.hp / e.maxHp)), 5, 2.5); ctx.fill();
    const crowd = g.enemies.length > 30;   // busy screen: keep just the slim bar so enemies stay readable
    if (!crowd) for (let i = 0; i < d.armored; i++) { ctx.fillStyle = T.metal[0]; ctx.strokeStyle = "#120c22"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + i * 9, y0 - 5); ctx.lineTo(x0 + i * 9 + 4, y0 - 10); ctx.lineTo(x0 + i * 9 + 8, y0 - 5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (!crowd) txt(ctx, Math.ceil(e.hp) + "", x0 + w + 6, y0 + 6, 12, "#ffffff", "left", 800);
  }
  if (e.muzzle > 0 && Q > 0) drawGlow(ctx, "#ffb347", e.x - sz * 0.45, e.y, 10, 0.8);
  if (e.maxShield > 0 && e.shield > 0 && e.type !== "glacier_guard") {
    const w = sz * 0.6; ctx.fillStyle = "#1a1030"; ctx.fillRect(e.x - w / 2, e.y - sz / 2 - 7, w, 4);
    ctx.fillStyle = "#d6f2ff"; ctx.fillRect(e.x - w / 2, e.y - sz / 2 - 7, w * (e.shield / e.maxShield), 4);
  }
}

function drawObstacle(ctx, o, g, now) {
  const P = g.lv.pal, metal = (g.lv.world && g.lv.world.pal.metal) || ["#7d8496", "#a36b45", "#5e6b52"];
  ctx.save();
  if (o.kind === "rock") {
    ctx.translate(o.x, o.y); ctx.rotate(o.rot);
    ctx.fillStyle = o.flash > 0 ? "#ffffff" : metal[1]; ctx.strokeStyle = "#1a1030"; ctx.lineWidth = 3;
    ctx.beginPath(); for (let i = 0; i < 7; i++) { const a = (TAU / 7) * i, r = o.r * (i % 2 ? 0.78 : 1); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = P.acc; ctx.globalAlpha = 0.6; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-o.r * 0.4, -o.r * 0.3); ctx.lineTo(o.r * 0.2, -o.r * 0.55); ctx.stroke();
    ctx.globalAlpha = 1; ctx.rotate(-o.rot); ctx.fillStyle = "#1a1030"; ctx.fillRect(-14, -o.r - 10, 28, 4); ctx.fillStyle = "#e8ecf7"; ctx.fillRect(-14, -o.r - 10, 28 * Math.max(0, o.hp / o.max), 4);
  } else if (o.kind === "gate") {
    const col = o.phase === "on" ? "#ffd1ec" : "#ff3fb4";
    for (const y of [22, H - 22]) { ctx.fillStyle = metal[0]; ctx.strokeStyle = "#1a1030"; ctx.lineWidth = 3; roundRect(ctx, o.x - 12, y - 22, 24, 44, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = o.phase === "off" ? "#4a2a3a" : col; ctx.beginPath(); ctx.arc(o.x, y, 6, 0, TAU); ctx.fill(); }
    if (o.phase === "warn") { ctx.strokeStyle = "#ff3fb4"; ctx.setLineDash([10, 8]); ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(now / 50); ctx.beginPath(); ctx.moveTo(o.x, 44); ctx.lineTo(o.x, H - 44); ctx.stroke(); ctx.setLineDash([]); }
    if (o.phase === "on") { ctx.strokeStyle = "#ff3fb4"; ctx.lineWidth = 16; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.moveTo(o.x, 44); ctx.lineTo(o.x, H - 44); ctx.stroke(); ctx.strokeStyle = "#ffe4f6"; ctx.lineWidth = 6; ctx.globalAlpha = 1; boltPath(ctx, o.x, now); ctx.stroke(); }
  } else if (o.kind === "well") {
    ctx.strokeStyle = "#c46bff"; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { const rr = o.r * (1 - (((now / 1300) + i / 3) % 1)); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(o.x, o.y, rr, 0, TAU); ctx.stroke(); }
    ctx.globalAlpha = 0.6; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.fillStyle = "#1a1030"; ctx.beginPath(); ctx.arc(o.x, o.y, 17, 0, TAU); ctx.fill(); ctx.fillStyle = o.flash > 0 ? "#fff" : "#ff3fb4"; ctx.beginPath(); ctx.arc(o.x, o.y, 13, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ============================================================ bosses (hand-built finales + procedural mechs)
const MECH = {};
function mechCanvas(spec, white) {
  const key = spec.id + (white ? "w" : ""); if (MECH[key]) return MECH[key];
  const S = spec.size, D = Math.ceil(S * 1.4), k = 2, c = document.createElement("canvas"); c.width = c.height = D * k;
  const x = c.getContext("2d"); x.scale(k, k); x.translate(D / 2, D / 2);
  const P = WORLDS[spec.w - 1].pal, [m0, m1, m2] = P.metal, ink = "#1a1030";
  const path = (pts) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a * S, b * S) : x.moveTo(a * S, b * S))); x.closePath(); };
  const paint = (fill, lw = 3) => { x.fillStyle = fill; x.fill(); x.strokeStyle = ink; x.lineWidth = lw; x.lineJoin = "round"; x.stroke(); };
  // wings (behind hull)
  if (spec.wings === "swept") { path([[0.05, -0.15], [0.42, -0.62], [0.55, -0.5], [0.3, -0.05]]); paint(m1); path([[0.05, 0.15], [0.42, 0.62], [0.55, 0.5], [0.3, 0.05]]); paint(m1); }
  if (spec.wings === "blades") for (const sg of [-1, 1]) for (let i = 0; i < 3; i++) { path([[0.1 + i * 0.08, sg * 0.2], [0.18 + i * 0.12, sg * (0.6 - i * 0.08)], [0.24 + i * 0.12, sg * (0.56 - i * 0.08)], [0.2 + i * 0.08, sg * 0.18]]); paint(i % 2 ? m2 : m1, 2.5); }
  if (spec.wings === "fins") for (const sg of [-1, 1]) { x.beginPath(); x.ellipse(0.28 * S, sg * 0.36 * S, 0.22 * S, 0.12 * S, sg * 0.5, 0, TAU); paint(m2); }
  if (spec.wings === "petals") for (let i = 0; i < 6; i++) { x.save(); x.rotate((i * TAU) / 6 + 0.3); x.beginPath(); x.ellipse(0.38 * S, 0, 0.2 * S, 0.09 * S, 0, 0, TAU); paint(i % 2 ? m1 : m2, 2.5); x.restore(); }
  if (spec.wings === "rings") { x.lineWidth = 7; x.strokeStyle = ink; for (const r of [0.5, 0.58]) { x.beginPath(); x.ellipse(0.05 * S, 0, r * S, r * 0.42 * S, 0.25, 0, TAU); x.stroke(); } x.lineWidth = 3; x.strokeStyle = P.acc; for (const r of [0.5, 0.58]) { x.beginPath(); x.ellipse(0.05 * S, 0, r * S, r * 0.42 * S, 0.25, 0, TAU); x.stroke(); } }
  // cannons
  const muz = { 1: [0], 2: [-0.18, 0.18], 3: [-0.25, 0, 0.25] }[spec.cannons];
  for (const oy of muz) { x.beginPath(); x.rect(-0.52 * S, (oy - 0.045) * S, 0.3 * S, 0.09 * S); paint(m2, 2.5); x.beginPath(); x.rect(-0.55 * S, (oy - 0.06) * S, 0.06 * S, 0.12 * S); paint(ink, 1); }
  // hull
  switch (spec.hull) {
    case "oval": x.beginPath(); x.ellipse(0, 0, 0.42 * S, 0.3 * S, 0, 0, TAU); paint(m0); break;
    case "hex": path([[-0.4, 0], [-0.2, -0.32], [0.24, -0.32], [0.42, 0], [0.24, 0.32], [-0.2, 0.32]]); paint(m0); break;
    case "diamond": path([[-0.46, 0], [0, -0.36], [0.4, 0], [0, 0.36]]); paint(m0); break;
    case "crescent": x.beginPath(); x.arc(0.05 * S, 0, 0.38 * S, -2.3, 2.3); x.quadraticCurveTo(-0.1 * S, 0, -0.22 * S, -0.28 * S); paint(m0); break;
    case "tri": path([[-0.46, 0], [0.36, -0.36], [0.3, 0], [0.36, 0.36]]); paint(m0); break;
    default: x.beginPath(); x.arc(0, 0, 0.36 * S, 0, TAU); paint(m0); x.beginPath(); x.arc(0, 0, 0.3 * S, 0, TAU); x.strokeStyle = m1; x.lineWidth = 4; x.stroke();
  }
  // panel lines + highlight
  x.strokeStyle = ink; x.globalAlpha = 0.35; x.lineWidth = 2; x.beginPath(); x.moveTo(-0.2 * S, -0.16 * S); x.lineTo(0.25 * S, -0.16 * S); x.moveTo(-0.2 * S, 0.16 * S); x.lineTo(0.25 * S, 0.16 * S); x.stroke();
  x.globalAlpha = 0.45; x.strokeStyle = "#ffffff"; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 0.27 * S, -2.4, -1.2); x.stroke(); x.globalAlpha = 1;
  // visor eye
  x.beginPath(); x.ellipse(-0.24 * S, -0.1 * S, 0.08 * S, 0.035 * S, -0.2, 0, TAU); paint(ink, 1); x.fillStyle = "#ff8a1f"; x.beginPath(); x.ellipse(-0.25 * S, -0.1 * S, 0.05 * S, 0.02 * S, -0.2, 0, TAU); x.fill();
  // decor
  const dd = spec.decor;
  if (dd === "crown") { path([[-0.12, -0.3], [-0.08, -0.44], [-0.02, -0.34], [0.04, -0.46], [0.1, -0.34], [0.16, -0.44], [0.18, -0.3]]); paint("#e0b84a", 2.5); }
  if (dd === "horns") { path([[-0.1, -0.28], [-0.2, -0.5], [-0.02, -0.3]]); paint(m1, 2.5); path([[0.12, -0.28], [0.24, -0.5], [0.2, -0.26]]); paint(m1, 2.5); }
  if (dd === "antenna") { x.strokeStyle = ink; x.lineWidth = 3; x.beginPath(); x.moveTo(0.05 * S, -0.3 * S); x.lineTo(0.12 * S, -0.5 * S); x.stroke(); x.beginPath(); x.arc(0.12 * S, -0.5 * S, 0.03 * S, 0, TAU); paint(P.acc, 2); }
  if (dd === "fin") { path([[-0.05, -0.3], [0.2, -0.5], [0.28, -0.28]]); paint(m2, 2.5); }
  if (dd === "spikes") for (let i = 0; i < 4; i++) { path([[-0.12 + i * 0.1, -0.29], [-0.08 + i * 0.1, -0.42], [-0.04 + i * 0.1, -0.29]]); paint(m1, 2); }
  if (dd === "halo") { x.strokeStyle = "#ffe08a"; x.lineWidth = 4; x.beginPath(); x.ellipse(0.04 * S, -0.42 * S, 0.16 * S, 0.04 * S, 0, 0, TAU); x.stroke(); }
  if (white) { x.globalCompositeOperation = "source-in"; x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); }
  return (MECH[key] = { c, D });
}
function drawMech(ctx, b, white, now) {
  const spec = b.def.spec, m = mechCanvas(spec), S = spec.size, P = WORLDS[spec.w - 1].pal;
  ctx.drawImage(m.c, b.x - m.D / 2, b.y - m.D / 2, m.D, m.D);
  if (white > 0) { ctx.globalAlpha *= white; ctx.drawImage(mechCanvas(spec, true).c, b.x - m.D / 2, b.y - m.D / 2, m.D, m.D); ctx.globalAlpha /= white; }
  const cx = b.core.x, cy = b.core.y, cr = S * 0.11;
  const exposed = spec.weak === "core" || (spec.weak === "cycle" && b.open) || (spec.weak === "parts" && !b.coreShielded);
  ctx.fillStyle = "#1a1030"; ctx.beginPath(); ctx.arc(cx, cy, cr * 1.45, 0, TAU); ctx.fill();
  if (exposed) {
    const pr = cr * (b.open ? 1.3 : 1) * (1 + 0.06 * Math.sin(now / 90));
    ctx.fillStyle = P.acc; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(cx - pr * 0.2, cy - pr * 0.2, pr * 0.45, 0, TAU); ctx.fill();
    ctx.strokeStyle = P.acc; ctx.lineWidth = 2; ctx.globalAlpha = 0.6; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(cx, cy, pr + 10, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = P.metal[2]; ctx.beginPath(); ctx.arc(cx, cy, cr * 1.25, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#1a1030"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - cr * 1.25, cy); ctx.lineTo(cx + cr * 1.25, cy); ctx.stroke();
    ctx.fillStyle = P.acc; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
}

function drawBoss(ctx, b, g, now) {
  const d = b.def;
  if (b.dying && b.dieT > 2.3) return;
  const white = (b.flash > 0 ? 0.2 : 0) + (b.trans > 0 && Math.floor(now / 90) % 2 ? 0.6 : 0);
  const alpha = b.dying ? Math.max(0, 1 - b.dieT / 2.3) : b.alpha;
  for (const p of b.parts) if (p.alive) drawSpr(ctx, p.spr, p.x, p.y, 36, { white: p.flash > 0 ? 0.8 : 0 });
  ctx.save(); ctx.globalAlpha = alpha;
  if (b.dying) ctx.translate(rand(-3, 3), rand(-3, 3));
  if (d.procedural === "mech") drawMech(ctx, b, Math.min(1, white), now);
  else if (d.procedural) drawSerpent(ctx, b, white > 0.5, now);
  else drawSpr(ctx, d.sprite(b), b.x, b.y, d.size, { white: Math.min(1, white), alpha, rot: d.spin ? b.t * 1.6 : 0 });
  ctx.restore();
  if (b.hp / b.max < 0.35 && !b.dying && alpha > 0.5) {
    for (let i = 0; i < 4; i++) {
      const ox = Math.sin(i * 2.3) * d.size * 0.25, oy = Math.cos(i * 1.7) * d.size * 0.22, tt = (now / 900 + i * 0.25) % 1;
      ctx.fillStyle = "#3a3346"; ctx.globalAlpha = 0.5 * (1 - tt); ctx.beginPath(); ctx.arc(b.x + ox + tt * 20, b.y + oy - tt * 40, 8 + tt * 14, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (Math.random() < 0.08) particle(g, b.x + rand(-d.size * 0.3, d.size * 0.3), b.y + rand(-d.size * 0.3, d.size * 0.3), "#ffd34f", 3, 90, 0.3, 2);
  }
  if (b.tele && !b.dying) {
    const r = 10 + (Math.sin(now / 45) + 1) * 5;
    drawGlow(ctx, "#ff8a1f", b.tele.x, b.tele.y, r * 2.4, 0.6);
    ctx.strokeStyle = "#ff8a1f"; ctx.lineWidth = 3; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(b.tele.x, b.tele.y, r, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (b.tentacleGlow && b.tips) for (const p of b.tips) { ctx.fillStyle = "#ff8a1f"; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(now / 50); ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
}

// ============================================================ pickups (distinct shape + colour + label)
function drawPickup(ctx, k, now, Q) {
  const y = k.y + Math.sin(now / 200 + k.x * 0.05) * 3, s = 1 + Math.sin(now / 150) * 0.06, green = k.kind === "hp" || k.kind === "shield";
  if (Q > 0) drawGlow(ctx, BULLET_POWERUPS[k.kind] ? BULLET_POWERUPS[k.kind].color : k.kind === "blast" ? "#7ff3ff" : green ? "#6fe04a" : "#ffd34f", k.x, y, 24, 0.45);
  ctx.save(); ctx.translate(k.x, y); ctx.scale(s, s); ctx.lineWidth = 2.5; ctx.strokeStyle = "#1a1030";
  if (k.kind === "hp") { ctx.fillStyle = "#6fe04a"; roundRect(ctx, -12, -12, 24, 24, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.fillRect(-3, -8, 6, 16); ctx.fillRect(-8, -3, 16, 6); }
  else if (k.kind === "shield") { ctx.fillStyle = "#6fe04a"; ctx.beginPath(); for (let i = 0; i < 6; i++) ctx.lineTo(Math.cos(i * TAU / 6) * 13, Math.sin(i * TAU / 6) * 13); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(6, -4); ctx.lineTo(5, 3); ctx.lineTo(0, 7); ctx.lineTo(-5, 3); ctx.lineTo(-6, -4); ctx.closePath(); ctx.fill(); }
  else if (k.kind === "blast") { ctx.fillStyle = "#0e2a3a"; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill(); ctx.strokeStyle = "#7ff3ff"; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = "#e6ffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 7 + Math.sin(now / 120) * 2, 0, TAU); ctx.stroke(); ctx.fillStyle = "#7ff3ff"; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill(); }
  else if (BULLET_POWERUPS[k.kind]) { const c = BULLET_POWERUPS[k.kind].color; ctx.fillStyle = "#1a1040"; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = c; if (k.kind === "nova") { starPath(ctx, 0, 0, 8, 3.5, 5, now / 300); ctx.fill(); } else if (k.kind === "comet") { ctx.beginPath(); ctx.arc(3, -2, 4, 0, TAU); ctx.fill(); ctx.fillRect(-9, -3, 9, 2); ctx.fillRect(-7, 1, 7, 2); } else { ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(0, -6); ctx.lineTo(-7, 0); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill(); } }
  else if (k.kind === "up") { ctx.rotate(now / 600); ctx.fillStyle = "#ffd34f"; starPath(ctx, 0, 0, 16, 7.5, 5, -Math.PI / 2); ctx.fill(); ctx.stroke(); ctx.rotate(-now / 600); ctx.fillStyle = "#1a1030"; ctx.font = `800 12px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("P", 0, 1); }
  else { const r = k.kind === "big" ? 12 : 8; ctx.fillStyle = "#e0b84a"; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.8, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.8, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff6c9"; ctx.beginPath(); ctx.moveTo(0, -r * 0.6); ctx.lineTo(r * 0.3, 0); ctx.lineTo(0, 0); ctx.fill(); }
  ctx.restore();
}

function drawParticles(ctx, g, rm, Q, front) {
  for (const q of g.parts) {
    const isFront = q.kind === "spark" || q.flashp;
    if (isFront !== front) continue;
    const a = q.life / q.max;
    if (q.ring) { ctx.strokeStyle = q.color; ctx.globalAlpha = a * 0.85; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1 - a) + 4, 0, TAU); ctx.stroke(); }
    else if (q.flashp) { if (rm) continue; ctx.fillStyle = "#fffbe8"; ctx.globalAlpha = a * 0.5; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1.2 - a * 0.4), 0, TAU); ctx.fill(); }
    else if (q.kind === "spark") { ctx.strokeStyle = q.color; ctx.globalAlpha = a; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(q.x - q.size, q.y); ctx.lineTo(q.x + q.size, q.y); ctx.moveTo(q.x, q.y - q.size); ctx.lineTo(q.x, q.y + q.size); ctx.stroke(); }
    else if (q.kind === "shard") { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillStyle = q.color; ctx.globalAlpha = Math.min(1, a * 1.5); ctx.fillRect(-q.size, -q.size * 0.6, q.size * 2, q.size * 1.2); ctx.restore(); }
    else { ctx.fillStyle = q.color; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (0.5 + a * 0.5), 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}
function drawTexts(ctx, g) { for (const t of g.texts) { ctx.globalAlpha = Math.min(1, t.life / t.max * 2); txt(ctx, t.s, t.x, t.y, t.size || 17, t.color, "center", 800); } ctx.globalAlpha = 1; }

// ============================================================ HUD
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function drawHUD(ctx, g, set, now) {
  const p = g.player;
  for (let i = 0; i < PLAYER_HP; i++) { const pop = p.healT > 0 && i === p.hp - 1 ? 1.25 : 1; ctx.save(); ctx.translate(26 + i * 26, 24); ctx.scale(pop, pop); heart(ctx, 0, -10, 20, i < p.hp ? "#ff6b9a" : "#3a2a50"); ctx.restore(); }
  txt(ctx, g.mode === "endless" ? "Endless  " + fmtTime(g.t) : "Level " + g.L.title.split(" ")[0], 20, 66, 17, "#e2d4ff");
  if (p.upT > 0) drawGlow(ctx, "#ffd34f", 200, 26, 40, p.upT);
  txt(ctx, "Weapon", 150, 31, 15, "#c9bde8");
  const shots = EndlessRules.TIER_SHOTS[p.tier];
  for (let i = 0; i < 3; i++) { ctx.fillStyle = i < p.tier ? "#5ef2f2" : "#2b2148"; ctx.strokeStyle = "#1a1030"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(220 + i * 16, 20); ctx.lineTo(231 + i * 16, 26); ctx.lineTo(220 + i * 16, 32); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  const dmgNow = EndlessRules.damageMult(g.t) * (p.bullet ? powerupMultFor(g) : 1);
  txt(ctx, shots + (shots === 1 ? " shot" : " shots") + (p.tier === 3 ? " (max)" : "") + (dmgNow > 1 ? `  ·  Damage ×${dmgNow}` : ""), 150, 50, 13, dmgNow > 1 ? "#ffd34f" : p.tier === 3 ? "#ffd34f" : "#a8fbff");
  // special blast: stored charges (●●○), max 3
  const max = EndlessRules.BLAST_MAX, ready = p.blasts > 0 && p.charge <= 0 && !g.blast, sx = 316, sy = 27;
  if (ready) drawGlow(ctx, "#5ef2f2", sx, sy, 30, 0.45 + 0.3 * Math.sin(now / 200));
  ctx.fillStyle = "#1a1030"; ctx.beginPath(); ctx.arc(sx, sy, 17, 0, TAU); ctx.fill();
  ctx.strokeStyle = ready ? "#5ef2f2" : "#3f8f9a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, 14, 0, TAU); ctx.stroke();
  txt(ctx, set.touch ? String(p.blasts) : "E", sx, sy + 6, 16, ready ? "#ffffff" : "#8aa", "center");
  for (let i = 0; i < max; i++) { ctx.fillStyle = i < p.blasts ? "#5ef2f2" : "#22304a"; ctx.strokeStyle = "#0e1a2a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx + 30 + i * 15, sy - 4, 5.5, 0, TAU); ctx.fill(); ctx.stroke(); }
  txt(ctx, p.charge > 0 ? "Charging…" : p.blasts > 0 ? `Blast ${p.blasts}/${max}` : "No blasts", sx + 24, sy + 15, 12, ready || p.charge > 0 ? "#5ef2f2" : "#7a8aa0");
  let chipX = 440;
  const chip = (label, col, frac) => { ctx.fillStyle = "rgba(18,12,40,0.8)"; roundRect(ctx, chipX, 14, 128, 26, 13); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(chipX + 13, 27, 7, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.stroke(); txt(ctx, label, chipX + 26, 32, 13, col); chipX += 136; };
  if (p.shield > 0) chip("Shield " + p.shield.toFixed(1) + "s", "#9ff7c4", p.shield / p.shieldMax);
  if (p.bullet) { const pu = BULLET_POWERUPS[p.bullet.kind]; chip(pu.name.split(" ")[0] + " ×" + powerupMultFor(g) + " " + p.bullet.t.toFixed(1) + "s", pu.color, p.bullet.t / POWERUP_TIME); }
  txt(ctx, g.score.toLocaleString(), W - 86, 36, 26, "#ffe08a", "right", 800);
  if (g.mode === "endless") {
    const clk = g.rec ? endlessClock(g) : g.t, wave = Math.floor(clk / EndlessRules.WAVE_EVERY), nx = EndlessRules.WAVE_EVERY - (clk % EndlessRules.WAVE_EVERY), bossFight = g.boss && !g.boss.dying;
    const bossIn = g.versus ? null : EndlessRules.BOSS_EVERY_WAVES * (g.bossIdx + 1) - wave;
    txt(ctx, `Wave ${wave} · ${g.kills} defeated`, W - 86, 58, 14, "#c9bde8", "right");
    txt(ctx, bossFight ? "Boss fight!" : `Next wave in ${Math.ceil(nx)}s` + (bossIn ? ` · boss in ${bossIn} wave${bossIn === 1 ? "" : "s"}` : ""), W - 86, 77, 13, "#ff9ad5", "right");
    // personal records: best score and longest survival, turning gold when beaten during this run
    const best = g.best, bs = best ? best.score : 0, bt = best ? best.ms / 1000 : 0;
    const newScore = best ? g.score > bs : g.score > 0, newTime = best ? g.t > bt : g.t > 0;
    ctx.fillStyle = "rgba(18,12,40,0.72)"; roundRect(ctx, W - 286, 86, 200, 42, 10); ctx.fill();
    ctx.strokeStyle = newScore || newTime ? "#ffd34f" : "rgba(160,190,255,0.35)"; ctx.lineWidth = 1.5; ctx.stroke();
    txt(ctx, "Best score", W - 276, 103, 12, "#a8b4e8"); txt(ctx, best ? (newScore ? g.score : bs).toLocaleString() : "—", W - 96, 103, 14, newScore ? "#ffd34f" : "#ffe08a", "right", 800);
    txt(ctx, "Longest run", W - 276, 121, 12, "#a8b4e8"); txt(ctx, best ? fmtTime(newTime ? g.t : bt) : "—", W - 96, 121, 14, newTime ? "#ffd34f" : "#c8f0ff", "right", 800);
    if (best && (newScore || newTime) && g.state === "endless") txt(ctx, "New best!", W - 186, 142, 13, "#ffd34f", "center", 900);
    if (!bossFight && nx <= 2.2 && g.t > 1) { const k = set.reduced ? 1 : 0.6 + 0.4 * Math.sin(now / 90); ctx.globalAlpha = k; ctx.fillStyle = "rgba(255,63,122,0.16)"; ctx.fillRect(0, H / 2 - 44, W, 88);
      txt(ctx, bossIn === 1 ? "Boss incoming!" : `Wave ${wave + 1} incoming!`, W / 2, H / 2 + 12, 40, "#ffd1e6", "center", 900); ctx.globalAlpha = 1; }
  }

  if (g.boss && !g.boss.dying) {
    const b = g.boss, bw = 380, bx = W / 2 - bw / 2, by = H - 34;
    txt(ctx, b.def.name, W / 2, by - 8, 18, "#ffd9a0", "center");
    ctx.fillStyle = "#1a1030"; roundRect(ctx, bx - 3, by - 3, bw + 6, 16, 6); ctx.fill();
    ctx.fillStyle = "#4a2a3a"; roundRect(ctx, bx, by, bw, 10, 4); ctx.fill();
    const f = b.entering ? Math.min(1, b.t / 2) : b.hp / b.max;
    ctx.fillStyle = b.flash > 0 ? "#ffffff" : "#ff8a1f"; roundRect(ctx, bx, by, Math.max(0, bw * f), 10, 4); ctx.fill();
    for (const t of b.def.phases || []) { ctx.fillStyle = "#1a1030"; ctx.fillRect(bx + bw * t - 1, by - 2, 3, 14); }
  }
  if (g.state === "intro") {
    const a = Math.max(0, Math.min(1, g.stateT * 2, (2.6 - g.stateT) * 2));
    ctx.globalAlpha = a;
    txt(ctx, `World ${g.L.w} — level ${g.L.i} of 10`, W / 2, H / 2 - 34, 26, "#c9bde8", "center");
    txt(ctx, g.L.name, W / 2, H / 2 + 20, 54, "#ffffff", "center", 800);
    txt(ctx, g.L.world.name, W / 2, H / 2 + 56, 20, g.lv.pal.acc, "center");
    ctx.globalAlpha = 1;
  }
  if (g.state === "warning") {
    const blink = set.reduced ? 1 : 0.55 + 0.45 * Math.sin(now / 120);
    ctx.fillStyle = "#ff3fb4"; ctx.globalAlpha = 0.18 * blink; ctx.fillRect(0, H / 2 - 60, W, 120); ctx.globalAlpha = blink;
    txt(ctx, "Boss approaching", W / 2, H / 2 - 4, 46, "#ffd1ec", "center", 800);
    const spec = g.L.boss; txt(ctx, spec.finale ? BOSSES[spec.finale]().name : spec.name, W / 2, H / 2 + 34, 24, "#ffffff", "center");
    ctx.globalAlpha = 1;
  }
}
