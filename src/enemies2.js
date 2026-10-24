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
