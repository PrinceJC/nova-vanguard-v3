"use strict";
// ============================================================ Endless enemy families (shaded vector sprites)
// mite = standard (1 hit) · bulwark1–4 = armored (5/10/15/20 hits) · dart = fast rusher
const ARMOR_TIERS = [null, { hits: 5, metal: ["#c98a52", "#8a5428"], name: "Bronze" }, { hits: 10, metal: ["#cfd6e4", "#7c869c"], name: "Silver" },
  { hits: 15, metal: ["#f2cf5c", "#a8801e"], name: "Gold" }, { hits: 20, metal: ["#b48cff", "#5a3aa8"], name: "Void" }];
function enemy2SVG(kind, tier) {
  const O = "#141030", s = (w = 1.4) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round"`;
  if (kind === "mite") return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 36 36" width="36" height="36"><defs>
<radialGradient id="mb" cx=".35" cy=".3"><stop offset="0" stop-color="#bfe8ff"/><stop offset=".6" stop-color="#5a8ad0"/><stop offset="1" stop-color="#2a3e78"/></radialGradient></defs>
<path d="M22 10 L31 6 L29 16 Z M22 22 L31 26 L29 16 Z" fill="#3a4e88" ${s(1.2)}/><circle cx="16" cy="16" r="10" fill="url(#mb)" ${s()}/>
<path d="M9 12 Q15 7 22 10" stroke="#ffffff" stroke-width="1.5" fill="none" opacity=".7" stroke-linecap="round"/><circle cx="12" cy="16" r="4.4" fill="#1a1030"/><circle cx="11.4" cy="16" r="2.8" fill="#ff8a1f"/><circle cx="10.6" cy="15.1" r="1" fill="#fff4d6"/></svg>`;
  if (kind === "dart") return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 52 36" width="52" height="36"><defs>
<linearGradient id="db" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9ad0"/><stop offset=".5" stop-color="#e0306e"/><stop offset="1" stop-color="#7a0e3a"/></linearGradient></defs>
<path d="M30 16 L46 4 L42 16 L46 28 Z" fill="#5a0a2a" ${s(1.2)}/><path d="M2 16 L22 8 L40 11 L44 16 L40 21 L22 24 Z" fill="url(#db)" ${s()}/>
<path d="M8 14 L24 10 L36 12" stroke="#ffd1e6" stroke-width="1.3" fill="none" opacity=".8"/><path d="M14 16 L24 13.6 L24 18.4 Z" fill="#fff2a8" ${s(0.8)}/><circle cx="31" cy="16" r="2.4" fill="#ffd34f" ${s(0.8)}/></svg>`;
  const T = ARMOR_TIERS[tier], [hi, lo] = T.metal, plates = tier;
  let ex = "";
  for (let i = 0; i < plates; i++) ex += `<path d="M${10 + i * 6} ${8 - (i % 2)} L${14 + i * 6} ${4 - (i % 2)} L${18 + i * 6} ${8 - (i % 2)} Z" fill="${hi}" ${s(1)}/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 52 52" width="52" height="52"><defs>
<linearGradient id="ab${tier}" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${lo}"/><stop offset="1" stop-color="#1e1832"/></linearGradient>
<radialGradient id="ac${tier}"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#ff8a1f"/><stop offset="1" stop-color="#7a2a08"/></radialGradient></defs>
${ex}<path d="M6 14 L16 8 L36 8 L44 18 L44 32 L36 42 L16 42 L6 36 Z" fill="url(#ab${tier})" ${s(1.6)}/>
<path d="M2 18 L10 14 L10 36 L2 32 Z" fill="${hi}" ${s(1.3)}/><path d="M4 20 L8 18 L8 32 L4 30 Z" fill="#ffffff" opacity=".35"/>
<path d="M14 12 L34 12" stroke="#ffffff" stroke-width="1.4" opacity=".55" stroke-linecap="round"/><path d="M16 38 L36 38" stroke="#000" stroke-width="1.4" opacity=".3"/>
<circle cx="24" cy="25" r="7" fill="#1a1030" ${s(1.2)}/><circle cx="24" cy="25" r="4.6" fill="url(#ac${tier})"/>
${tier >= 3 ? `<path d="M30 14 L40 18 L40 30 L30 36" stroke="${hi}" stroke-width="2" fill="none"/>` : ""}${tier >= 4 ? `<circle cx="24" cy="25" r="10" fill="none" stroke="#e8d4ff" stroke-width="1.2" stroke-dasharray="3 3"/>` : ""}</svg>`;
}
function registerEnemySprites() {
  SPRITE_SVG.mite = enemy2SVG("mite"); SPRITE_SVG.dart = enemy2SVG("dart");
  for (let t = 1; t <= 4; t++) SPRITE_SVG["bulwark" + t] = enemy2SVG("bulwark", t);
}
if (typeof module === "object" && module.exports) module.exports = { enemy2SVG, ARMOR_TIERS };

// ============================================================ Endless-only bosses (one every 30,000 points)
function endlessBossSVG(kind) {
  const O = "#141030", s = (w = 3) => `stroke="${O}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const wrap = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 260 260" width="260" height="260"><defs>${defs}</defs>${body}</svg>`;
  if (kind === "octo_queen") {
    let ten = ""; for (let i = 0; i < 8; i++) { const y = 120 + i * 12, c = i % 2 ? "#c04ad8" : "#e06ac8"; ten += `<path d="M${150 - i * 4} ${y} Q${90 - i * 6} ${y + 40 + i * 4} ${40 + i * 10} ${y + 70 - i * 3} Q${70 + i * 6} ${y + 50} ${120 - i * 2} ${y + 6}" fill="${c}" ${s(2.5)}/>`; }
    return wrap(`<radialGradient id="oq" cx=".4" cy=".35"><stop offset="0" stop-color="#ffb8f0"/><stop offset=".6" stop-color="#c04ad8"/><stop offset="1" stop-color="#5a1a7a"/></radialGradient>`,
      `${ten}<ellipse cx="160" cy="100" rx="86" ry="78" fill="url(#oq)" ${s()}/><path d="M100 60 Q150 30 210 60" stroke="#ffd8f6" stroke-width="5" fill="none" opacity=".7"/>
<circle cx="118" cy="112" r="16" fill="#fff" ${s(2)}/><circle cx="114" cy="114" r="8" fill="${O}"/><circle cx="158" cy="118" r="13" fill="#fff" ${s(2)}/><circle cx="154" cy="120" r="6" fill="${O}"/>
<path d="M120 36 L132 14 L144 34 L158 10 L170 34 L184 16 L192 40 Z" fill="#ffd34f" ${s(2.5)}/><circle cx="158" cy="62" r="11" fill="#5ef2f2" ${s(2)}/>
<circle cx="200" cy="90" r="6" fill="#ffd8f6" opacity=".8"/><circle cx="214" cy="120" r="4" fill="#ffd8f6" opacity=".7"/>`);
  }
  if (kind === "blade_sovereign") {
    let blades = ""; for (let i = 0; i < 4; i++) blades += `<path d="M128 128 L118 30 Q128 10 150 20 Q144 70 140 128 Z" fill="url(#bs)" ${s(2.5)} transform="rotate(${i * 90} 128 128)"/><path d="M128 120 L124 40" stroke="#ffffff" stroke-width="2" opacity=".7" transform="rotate(${i * 90} 128 128)"/>`;
    return wrap(`<linearGradient id="bs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6ff"/><stop offset=".5" stop-color="#9aa4c0"/><stop offset="1" stop-color="#4a5070"/></linearGradient><radialGradient id="bc"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#ff5f7a"/><stop offset="1" stop-color="#7a0e2a"/></radialGradient>`,
      `${blades}<circle cx="128" cy="128" r="54" fill="#2a2e44" ${s()}/><circle cx="128" cy="128" r="44" fill="none" stroke="#ffd34f" stroke-width="4"/><circle cx="128" cy="128" r="22" fill="url(#bc)" ${s(2)}/>
${[0, 60, 120, 180, 240, 300].map((a) => `<circle cx="${128 + Math.cos(a * Math.PI / 180) * 36}" cy="${128 + Math.sin(a * Math.PI / 180) * 36}" r="4" fill="#ffd34f"/>`).join("")}`);
  }
  if (kind === "hive_matriarch") return wrap(`<linearGradient id="hm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#c88a1a"/></linearGradient>`,
    `<path d="M120 90 Q170 10 230 30 Q200 90 140 110 Z M120 120 Q170 200 230 190 Q200 130 140 118 Z" fill="#e8f6ff" fill-opacity=".75" ${s(2.5)}/>
<ellipse cx="180" cy="130" rx="70" ry="48" fill="url(#hm)" ${s()}/>${[150, 175, 200, 225].map((x) => `<path d="M${x} ${88} Q${x + 6} 130 ${x} ${172}" stroke="${O}" stroke-width="10" fill="none"/>`).join("")}<path d="M248 130 L262 126 L248 140 Z" fill="${O}"/>
<ellipse cx="112" cy="124" rx="34" ry="30" fill="#c88a1a" ${s()}/><circle cx="68" cy="118" r="30" fill="#ffd34f" ${s()}/><circle cx="56" cy="110" r="10" fill="#7a1a2a"/><circle cx="76" cy="106" r="9" fill="#7a1a2a"/>
<path d="M60 90 Q50 60 36 54 M74 88 Q80 58 94 50" stroke="${O}" stroke-width="3" fill="none"/><path d="M110 40 L122 24 L132 40 Z" fill="#ff9ad5" ${s(2)}/>`);
  if (kind === "magma_titan") return wrap(`<linearGradient id="mt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a5a54"/><stop offset="1" stop-color="#2a1e1a"/></linearGradient><radialGradient id="mc"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#ff8a1f"/><stop offset="1" stop-color="#7a1a08"/></radialGradient>`,
    `<path d="M70 70 L190 56 L230 120 L210 220 L80 228 L50 140 Z" fill="url(#mt)" ${s()}/><path d="M90 80 L120 120 L100 170 M170 70 L150 130 L190 190 M60 150 L110 150" stroke="#ff8a1f" stroke-width="5" fill="none"/>
<circle cx="140" cy="140" r="30" fill="url(#mc)" ${s(2.5)}/><path d="M40 110 L10 100 L20 150 L48 150 Z M220 110 L250 96 L246 150 L216 150 Z" fill="url(#mt)" ${s()}/>
<path d="M96 40 L130 20 L170 34 L180 60 L90 64 Z" fill="url(#mt)" ${s()}/><rect x="104" y="40" width="20" height="9" fill="#ff8a1f"/><rect x="140" y="38" width="20" height="9" fill="#ff8a1f"/>`);
  if (kind === "mirror_wraith") return wrap(`<linearGradient id="mw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8d8ff"/><stop offset="1" stop-color="#3a2a7a" stop-opacity=".2"/></linearGradient>`,
    `<path d="M90 60 Q130 10 170 60 L200 230 Q160 200 130 240 Q100 200 60 230 Z" fill="url(#mw)" ${s()}/><path d="M100 70 Q130 40 160 70 L156 110 Q130 124 104 110 Z" fill="#1a1440" ${s(2.5)}/>
<path d="M112 88 L124 92 M136 92 L148 88" stroke="#5ef2f2" stroke-width="5" stroke-linecap="round"/>${[[40, 90], [210, 80], [30, 170], [220, 170], [130, 20]].map(([x, y]) => `<path d="M${x} ${y - 14} L${x + 10} ${y} L${x} ${y + 14} L${x - 10} ${y} Z" fill="#e8f0ff" ${s(2)}/>`).join("")}
<circle cx="130" cy="150" r="14" fill="#c46bff" ${s(2)}/>`);
  // frost_hydra
  return wrap(`<linearGradient id="fh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6f2ff"/><stop offset="1" stop-color="#3a6aa8"/></linearGradient>`,
    `${[[60, 50], [40, 130], [70, 200]].map(([x, y]) => `<path d="M170 140 Q120 ${y} ${x + 30} ${y}" stroke="${O}" stroke-width="26" fill="none"/><path d="M170 140 Q120 ${y} ${x + 30} ${y}" stroke="url(#fh)" stroke-width="20" fill="none"/>
<path d="M${x - 12} ${y} L${x + 20} ${y - 18} L${x + 48} ${y - 6} L${x + 48} ${y + 10} L${x + 20} ${y + 16} Z" fill="url(#fh)" ${s(2.5)}/><circle cx="${x + 20}" cy="${y - 4}" r="5" fill="#5ef2f2"/><path d="M${x - 12} ${y} L${x + 12} ${y + 4}" stroke="${O}" stroke-width="2"/>`).join("")}
<ellipse cx="190" cy="150" rx="60" ry="56" fill="url(#fh)" ${s()}/><path d="M160 110 L170 90 L182 112 L196 88 L206 114" fill="#ffffff" ${s(2)}/><circle cx="190" cy="152" r="16" fill="#5ef2f2" ${s(2)}/>`);
}
const ENDLESS_BOSS_KINDS = ["octo_queen", "blade_sovereign", "hive_matriarch", "magma_titan", "mirror_wraith", "frost_hydra"];
function registerEndlessBossSprites() { for (const k of ENDLESS_BOSS_KINDS) SPRITE_SVG["eb_" + k] = endlessBossSVG(k); }
if (typeof module === "object" && module.exports) Object.assign(module.exports, { endlessBossSVG, ENDLESS_BOSS_KINDS });
