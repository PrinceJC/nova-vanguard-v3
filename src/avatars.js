"use strict";
// ============================================================ 20 playable heroes — semi-realistic fantasy redesign
// Avatar ids are unchanged so existing unlocks/selections carry over. Stats are identical for every hero;
// weapon category only changes artwork and projectile visuals.
// cat: cannon | bow | sniper | gun   hair: long | wavy | ponytail | braid | short | bob | bun | twin | mane | crop
const AVATARS = [
  { id: "lumi", name: "Nova", title: "Celestial Vanguard", cat: "cannon", theme: "celestial", unlock: 0, skin: ["#f7e1d6", "#d9b2a2"], lip: "#d9707e", eye: "#4fb8ff",
    hair: "long", hc: ["#dfe3ee", "#ffffff", "#9aa2b8"], armor: ["#1b1e33", "#2a3460", "#0c0e1c"], trim: ["#f4d58a", "#a8782c"], gem: "#5cc8ff", extra: "circlet", shot: ["#7fd8ff", "#ffffff"], weaponName: "Starforged cannon" },
  { id: "nova", name: "Lumi", title: "Comet Marksman", cat: "sniper", theme: "storm", unlock: 0, skin: ["#c98d63", "#9c6542"], lip: "#a8525a", eye: "#8fe3ff",
    hair: "bob", hc: ["#2d3a6b", "#6a80c8", "#18203f"], armor: ["#dfe6f2", "#3a6ab8", "#7f8aa8"], trim: ["#f2cf6a", "#9a7428"], gem: "#8fe3ff", extra: "visor", shot: ["#b8ecff", "#ffffff"], weaponName: "Comet-rail rifle" },
  { id: "riko", name: "Riko", title: "Ember Breaker", cat: "cannon", theme: "flame", unlock: 0, skin: ["#f3d4bc", "#c99f84"], lip: "#c06a62", eye: "#3fd47a",
    hair: "crop", hc: ["#ff8a48", "#ffc48a", "#b8481e"], armor: ["#3a2420", "#7a2e22", "#1e1210"], trim: ["#f6c96a", "#a06a24"], gem: "#ffd27a", extra: "none", shot: ["#ffe9a8", "#ffffff"], weaponName: "Magma siege cannon" },
  { id: "pip", name: "Pip", title: "Clockwork Tinker", cat: "cannon", theme: "mechanical", unlock: 0, skin: ["#e8b896", "#bf8c6c"], lip: "#b8645c", eye: "#5aa0ff",
    hair: "bob", hc: ["#7a4e2e", "#a8744e", "#4a2c18"], armor: ["#5a4a3a", "#b08a4a", "#2e241a"], trim: ["#f0c46a", "#9a6a28"], gem: "#7fe0ff", extra: "goggles", shot: ["#9ff0ff", "#ffffff"], weaponName: "Gearwork mortar" },
  { id: "aria", name: "Aria", title: "Crystal Songbow", cat: "bow", theme: "crystal", unlock: 5, skin: ["#f7e1d6", "#d6ae9e"], lip: "#d06a8a", eye: "#a87cff",
    hair: "wavy", hc: ["#a6ece4", "#e4fffb", "#5fb4ae"], armor: ["#3c2a70", "#7a5ac8", "#1e1440"], trim: ["#e8d4ff", "#8a6ac8"], gem: "#c4a8ff", extra: "circlet", shot: ["#c8f8ff", "#ffffff"], weaponName: "Prism longbow" },
  { id: "kestrel", name: "Kestrel", title: "Wildwind Ranger", cat: "bow", theme: "nature", unlock: 10, skin: ["#8d5a3b", "#64391f"], lip: "#7a3a32", eye: "#ffd34f",
    hair: "mane", hc: ["#3a2a22", "#6a5040", "#1e1410"], armor: ["#3e5a3a", "#6a8a4a", "#1e2e1a"], trim: ["#e2c27a", "#8a6a2a"], gem: "#9fff8a", extra: "hood", shot: ["#d8ffc8", "#ffffff"], weaponName: "Galewood recurve" },
  { id: "mochi", name: "Mochi", title: "Moonfrost Archer", cat: "bow", theme: "frost", unlock: 15, skin: ["#fbe8e0", "#dcbab0"], lip: "#e07a96", eye: "#5fb8ff",
    hair: "twin", hc: ["#f4f2ff", "#ffffff", "#c4c0e0"], armor: ["#c8e4ff", "#5a8ad8", "#8aa8d0"], trim: ["#ffffff", "#9ab8e0"], gem: "#8fdcff", extra: "moon", shot: ["#d8f4ff", "#ffffff"], weaponName: "Lunar frostbow" },
  { id: "sable", name: "Sable", title: "Umbral Sniper", cat: "sniper", theme: "shadow", unlock: 20, skin: ["#f3d4bc", "#c49e88"], lip: "#9a4a5a", eye: "#5ef2c0",
    hair: "long", hc: ["#24203a", "#4a4470", "#100e1e"], armor: ["#15131f", "#2e2a48", "#08070e"], trim: ["#9ad8c4", "#3a7a6a"], gem: "#5ef2c0", extra: "visor", shot: ["#9fffe0", "#ffffff"], weaponName: "Nightglass rifle" },
  { id: "juno", name: "Juno", title: "Tidecaller Gunner", cat: "gun", theme: "tide", unlock: 25, skin: ["#c68a5e", "#99603c"], lip: "#a04e54", eye: "#ffe08a",
    hair: "braid", hc: ["#2f8f9a", "#7fd6de", "#1a5a62"], armor: ["#e6f2f2", "#2f8f9a", "#8ab4b8"], trim: ["#f2d27a", "#9a7a2a"], gem: "#6ff0e0", extra: "none", shot: ["#9ffff0", "#ffffff"], weaponName: "Riptide carbine" },
  { id: "vega", name: "Vega", title: "Astral Deadeye", cat: "sniper", theme: "celestial", unlock: 30, skin: ["#f7e1d6", "#d6ae9e"], lip: "#c8687a", eye: "#6fc8ff",
    hair: "bun", hc: ["#e8c25a", "#fff0b0", "#a07a20"], armor: ["#241c48", "#4a3a88", "#120c28"], trim: ["#f6dc8a", "#a87e2c"], gem: "#ffe08a", extra: "star", shot: ["#fff4c4", "#ffffff"], weaponName: "Zenith longrifle" },
  { id: "haru", name: "Haru", title: "Bloomguard Archer", cat: "bow", theme: "nature", unlock: 35, skin: ["#e8b896", "#bf8c6c"], lip: "#a8605a", eye: "#ff9ad5",
    hair: "crop", hc: ["#5aa83c", "#a8e080", "#2f6a1e"], armor: ["#eeead8", "#5aa83c", "#a8a488"], trim: ["#f2d27a", "#9a7a2a"], gem: "#ffb8e0", extra: "flower", shot: ["#e0ffc8", "#ffffff"], weaponName: "Thornbloom bow" },
  { id: "ines", name: "Ines", title: "Frostglass Sniper", cat: "sniper", theme: "frost", unlock: 40, skin: ["#f7e6dc", "#d8b8aa"], lip: "#c86a80", eye: "#4fb4ff",
    hair: "long", hc: ["#eef6ff", "#ffffff", "#a8c4dc"], armor: ["#bfe0ff", "#ffffff", "#7aa8d0"], trim: ["#d8f0ff", "#6a9ac8"], gem: "#8fdcff", extra: "hood", shot: ["#e0f8ff", "#ffffff"], weaponName: "Rime-chamber rifle" },
  { id: "dax", name: "Dax", title: "Forge Titan", cat: "cannon", theme: "flame", unlock: 45, skin: ["#8d5a3b", "#64391f"], lip: "#7a3a32", eye: "#ffb347",
    hair: "crop", hc: ["#1e1410", "#4a3428", "#0e0a08"], armor: ["#4a3a30", "#8a5a3a", "#241a14"], trim: ["#f0c46a", "#9a6a28"], gem: "#ffd27a", extra: "goggles", shot: ["#ffefb8", "#ffffff"], weaponName: "Anvilheart cannon" },
  { id: "orla", name: "Orla", title: "Abyssal Diver", cat: "gun", theme: "tide", unlock: 50, skin: ["#f7e1d6", "#d6ae9e"], lip: "#c06a7a", eye: "#3ee8c8",
    hair: "mane", hc: ["#3a5aa8", "#7a9ae8", "#1e3270"], armor: ["#1e4a5a", "#2f7a8a", "#0e2a32"], trim: ["#9ff0e0", "#3a8a7a"], gem: "#3ee8c8", extra: "fins", shot: ["#9ffff0", "#ffffff"], weaponName: "Pearlstorm repeater" },
  { id: "zephyr", name: "Zephyr", title: "Stormrider", cat: "gun", theme: "storm", unlock: 55, skin: ["#c68a5e", "#99603c"], lip: "#9a4e4a", eye: "#6fc8ff",
    hair: "crop", hc: ["#eceff8", "#ffffff", "#9aa4c0"], armor: ["#3d4a7a", "#5a6aa8", "#1e2440"], trim: ["#ffe27a", "#a88a2a"], gem: "#8fd8ff", extra: "none", shot: ["#d8f0ff", "#ffffff"], weaponName: "Thunderclap pistols" },
  { id: "tamsin", name: "Tamsin", title: "Runeseer", cat: "sniper", theme: "crystal", unlock: 60, skin: ["#f3d4bc", "#c99f84"], lip: "#b8606a", eye: "#9effe0",
    hair: "braid", hc: ["#8a4a2e", "#c4805a", "#5a2a16"], armor: ["#3a2e5a", "#6a5a9a", "#1e1636"], trim: ["#e8d08a", "#9a7a3a"], gem: "#9effe0", extra: "monocle", shot: ["#d0fff0", "#ffffff"], weaponName: "Glyph-scope rifle" },
  { id: "wren", name: "Wren", title: "Feather Sentinel", cat: "bow", theme: "nature", unlock: 65, skin: ["#e8b896", "#bf8c6c"], lip: "#b0605a", eye: "#3fd47a",
    hair: "bob", hc: ["#b0603a", "#e09a70", "#7a3a1e"], armor: ["#e6dec8", "#4a6a3a", "#a8a088"], trim: ["#e8c87a", "#8a6a2a"], gem: "#8aff9a", extra: "feather", shot: ["#e8ffd0", "#ffffff"], weaponName: "Skylark bow" },
  { id: "cass", name: "Cass", title: "Neon Hacker", cat: "gun", theme: "mechanical", unlock: 70, skin: ["#f7e1d6", "#d6ae9e"], lip: "#d0607a", eye: "#5ef2f2",
    hair: "twin", hc: ["#2e2e3e", "#5a5a72", "#16161e"], armor: ["#1a1a2a", "#34345a", "#0a0a14"], trim: ["#7ff6f6", "#2a8a8a"], gem: "#5ef2f2", extra: "headset", shot: ["#a8ffff", "#ffffff"], weaponName: "Glitch SMG" },
  { id: "elio", name: "Elio", title: "Sunforge Paladin", cat: "gun", theme: "solar", unlock: 75, skin: ["#c68a5e", "#99603c"], lip: "#9a4e4a", eye: "#4fb4ff",
    hair: "mane", hc: ["#f2d65a", "#fff3b0", "#b8962a"], armor: ["#eeeaf6", "#c8c2dc", "#9a94b0"], trim: ["#f6d06a", "#a87a24"], gem: "#ffe27a", extra: "halo", shot: ["#fff6c8", "#ffffff"], weaponName: "Dawnbreaker rifle" },
  { id: "luma", name: "Luma", title: "Eclipse Herald", cat: "cannon", theme: "shadow", unlock: 80, skin: ["#f7e1d6", "#d6ae9e"], lip: "#a84a7a", eye: "#c88cff",
    hair: "wavy", hc: ["#3a2a5c", "#7a62b0", "#1e1436"], armor: ["#120c20", "#2e2048", "#06040c"], trim: ["#c8a8ff", "#6a4aa8"], gem: "#c88cff", extra: "horns", shot: ["#e4ccff", "#ffffff"], weaponName: "Umbra siege cannon" },
];
const AVATAR_BY_ID = Object.fromEntries(AVATARS.map((a) => [a.id, a]));
const WEAPON_CATS = { cannon: "Cannon", bow: "Bow", sniper: "Sniper rifle", gun: "Rifle / gun" };
function avatarUnlocked(av, completedCount) { return av.unlock === 0 || completedCount >= av.unlock; }
// projectile origin in sprite units (muzzle for firearms, arrow release point for bows)
const MUZZLES = { cannon: [114, 39], sniper: [117, 39], gun: [109, 38.5], bow: [92, 38] };
const SPRITE_ANCHOR = [60, 38];   // hitbox centre (chest) in sprite units

// ------------------------------------------------------------ SVG helpers
const OL = "#120c22";
const st = (w = 0.9) => `stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
function defs(a, p) {
  const [s1, s2] = a.skin, [h1, h2, h3] = a.hc, [m1, m2, m3] = a.armor, [t1, t2] = a.trim;
  return `<defs>
<linearGradient id="${p}sk" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient>
<linearGradient id="${p}hr" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${h2}"/><stop offset=".35" stop-color="${h1}"/><stop offset="1" stop-color="${h3}"/></linearGradient>
<linearGradient id="${p}ar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m2}"/><stop offset=".45" stop-color="${m1}"/><stop offset="1" stop-color="${m3}"/></linearGradient>
<linearGradient id="${p}gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t1}"/><stop offset="1" stop-color="${t2}"/></linearGradient>
<radialGradient id="${p}gm"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="${a.gem}"/><stop offset="1" stop-color="${a.gem}" stop-opacity="0"/></radialGradient>
<radialGradient id="${p}ey" cx=".4" cy=".35"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="${a.eye}"/><stop offset="1" stop-color="${OL}"/></radialGradient>
</defs>`;
}
const gem = (p, x, y, s = 1.6) => `<circle cx="${x}" cy="${y}" r="${s * 1.9}" fill="url(#${p}gm)" opacity=".8"/><path d="M${x} ${y - s} L${x + s * 0.7} ${y} L${x} ${y + s} L${x - s * 0.7} ${y} Z" fill="#ffffff" stroke="url(#${p}gd)" stroke-width=".5"/>`;

function backHair(a, p) {
  const f = `fill="url(#${p}hr)" ${st(0.7)}`, l = a.hc[1], d = a.hc[2];
  switch (a.hair) {
    case "long": return `<path d="M58 11 Q46 9 36 15 Q24 21 9 21 Q21 25 29 27 Q16 31 4 36 Q21 37 33 33 Q24 41 15 47 Q33 43 46 35 Q54 30 59 26 Z" ${f}/><path d="M50 13 Q34 17 18 23 M52 19 Q36 27 14 34 M54 24 Q42 34 24 42" stroke="${l}" stroke-width=".7" fill="none" opacity=".8"/><path d="M48 18 Q32 26 20 30" stroke="${d}" stroke-width=".6" fill="none"/>`;
    case "wavy": return `<path d="M58 11 Q48 8 38 14 Q30 20 22 18 Q14 17 8 22 Q16 24 22 26 Q12 30 8 37 Q18 35 26 33 Q20 40 18 47 Q30 41 40 36 Q52 31 59 26 Z" ${f}/><path d="M50 14 Q38 18 28 22 Q20 26 12 26 M52 21 Q40 28 30 30 Q22 33 16 39" stroke="${l}" stroke-width=".7" fill="none" opacity=".8"/>`;
    case "ponytail": return `<path d="M59 10 Q46 3 32 11 Q22 17 9 15 Q21 21 31 20 Q22 26 13 29 Q30 27 42 19 Q50 15 59 17 Z" ${f}/><path d="M50 9 Q36 10 22 17" stroke="${l}" stroke-width=".7" fill="none"/>`;
    case "braid": { let s = `<path d="M58 12 Q55 20 57 26 L61 25 Z" ${f}/>`; for (let i = 0; i < 7; i++) s += `<ellipse cx="${54 - i * 3.6}" cy="${24 + i * 2.2}" rx="2.6" ry="2" fill="url(#${p}hr)" ${st(0.6)}/>`; return s + `<path d="M28 39 L25 43 L30 42 Z" fill="url(#${p}gd)"/>`; }
    case "bob": return `<path d="M58 12 Q54 20 55 28 Q58 30 62 28 L62 14 Z" ${f}/>`;
    case "bun": return `<circle cx="57" cy="8" r="4.2" fill="url(#${p}hr)" ${st(0.7)}/><path d="M55 10 Q46 14 40 22 Q48 18 56 16 Z" ${f}/>`;
    case "twin": return `<path d="M57 13 Q46 14 38 22 Q30 30 18 32 Q30 34 40 28 Q50 22 58 19 Z" ${f}/><path d="M58 18 Q48 24 42 32 Q36 40 26 44 Q38 44 46 36 Q52 28 60 24 Z" ${f}/><circle cx="56" cy="14" r="1.6" fill="url(#${p}gd)"/><circle cx="57" cy="20" r="1.6" fill="url(#${p}gd)"/>`;
    case "mane": return `<path d="M58 10 Q48 8 42 14 L34 13 L40 18 L30 20 L38 23 L30 28 L42 27 L38 33 L48 29 Q55 26 59 24 Z" ${f}/>`;
    default: return `<path d="M58 11 Q53 14 54 22 L60 23 Z" ${f}/>`;
  }
}
function head(a, p, frame, scale) {
  const hurt = frame === "hurt", hf = `fill="url(#${p}hr)" ${st(0.6)}`;
  let s = `<path d="M61.5 25 L60.6 30.5 L65 30.5 L65.2 26 Z" fill="${a.skin[1]}" ${st(0.5)}/>
<path d="M60 12 Q66 8.8 70.6 12.8 Q72.6 16.6 72.2 19.8 L73.8 21.5 L72.2 22.3 Q71.7 25 69 27 Q65 28.6 61.6 26.2 Q58.8 22 60 12 Z" fill="url(#${p}sk)" ${st(0.6)}/>
<ellipse cx="61.6" cy="19.4" rx="1.4" ry="2.2" fill="${a.skin[1]}" ${st(0.4)}/>
<path d="M62.4 25 Q65.5 27.2 69 26.3" fill="none" stroke="${a.skin[1]}" stroke-width=".6"/>`;
  if (hurt) s += `<path d="M66.6 16.8 L69.8 18 L66.8 18.8" fill="none" stroke="${OL}" stroke-width=".6" stroke-linecap="round"/><path d="M69.6 24 Q70.6 23.2 71.6 24" fill="none" stroke="${a.lip}" stroke-width=".7"/>`;
  else s += `<path d="M66.5 17.7 Q68.3 16.3 70.2 17.4 Q68.5 19 66.5 17.7 Z" fill="#ffffff"/>
<circle cx="68.7" cy="17.7" r="1.05" fill="url(#${p}ey)"/><circle cx="68.85" cy="17.75" r=".42" fill="${OL}"/><circle cx="68.35" cy="17.3" r=".32" fill="#ffffff"/>
<path d="M66.3 17.6 Q68.2 16 70.4 17.2" fill="none" stroke="${OL}" stroke-width=".65" stroke-linecap="round"/><path d="M70.2 17.2 L71 16.6" stroke="${OL}" stroke-width=".4"/>
<path d="M66.2 15.3 Q68.4 14.4 70.4 15.1" fill="none" stroke="${a.hc[2]}" stroke-width=".7" stroke-linecap="round"/>
<path d="M71.3 18.6 L72.7 21.3 L71.5 21.8" fill="none" stroke="${a.skin[1]}" stroke-width=".45"/>
<path d="M69.5 23.6 Q70.7 23.1 71.7 23.5 Q70.8 24.5 69.6 24.1 Z" fill="${a.lip}"/><path d="M69.5 23.7 Q70.6 23.6 71.7 23.5" stroke="${OL}" stroke-width=".25" opacity=".5"/>
<ellipse cx="67.6" cy="21.2" rx="1.5" ry=".7" fill="${a.lip}" opacity=".22"/>`;
  // hair on top + bangs
  if (a.extra === "hood") s += `<path d="M56 24 Q54 8 63 5 Q72 3.5 75 11 L73 13 Q70 8 64 8.5 Q59 10 59 24 Z" fill="url(#${p}ar)" ${st(0.6)}/><path d="M73.4 12 Q70 9 64.5 9.5" stroke="url(#${p}gd)" stroke-width=".8" fill="none"/>`;
  s += `<path d="M57.4 20 Q55.5 8 63.4 6 Q71 5.4 73.6 11.2 Q70.4 9.6 66 10.6 Q67.6 12 67 14 Q64.6 11.8 62.6 13.6 Q61.4 17 61.6 21 Q60 17.5 59 22 Z" ${hf}/>
<path d="M60 9 Q66 7 71 9.5" stroke="${a.hc[1]}" stroke-width=".7" fill="none" stroke-linecap="round"/>`;
  if (a.hair === "long" || a.hair === "wavy") s += `<path d="M60.5 13 Q58.4 22 60.6 31 Q58.4 30 57.2 26 Q56.6 18 60.5 13 Z" ${hf}/>`;
  // extras
  switch (a.extra) {
    case "circlet": s += `<path d="M60.4 12.6 Q66 10.2 72 12.4" fill="none" stroke="url(#${p}gd)" stroke-width="1"/>` + gem(p, 66.4, 11.3, 1.1); break;
    case "visor": s += `<path d="M65.6 16 L73 16.3 L72.6 18.8 L65.8 19 Z" fill="${a.gem}" fill-opacity=".55" stroke="url(#${p}gd)" stroke-width=".5"/>`; break;
    case "goggles": s += `<path d="M59.5 11.5 Q66 8.6 73 11.2" stroke="${OL}" stroke-width="1.6" fill="none"/><circle cx="66.6" cy="9.8" r="1.9" fill="${a.gem}" stroke="url(#${p}gd)" stroke-width=".7"/><circle cx="70.8" cy="10.6" r="1.6" fill="${a.gem}" stroke="url(#${p}gd)" stroke-width=".6"/>`; break;
    case "moon": s += `<path d="M58 6 Q56 1 60 -1 Q58.5 2.6 61.5 5 Z" fill="url(#${p}gd)"/>` + gem(p, 60, 3, 0.9); break;
    case "star": s += gem(p, 57, 5.5, 1.6); break;
    case "flower": s += [0, 72, 144, 216, 288].map((r) => `<ellipse cx="59" cy="9" rx=".9" ry="1.6" fill="#ffb8e0" transform="rotate(${r} 59 10.4)"/>`).join("") + `<circle cx="59" cy="10.4" r=".8" fill="#ffe27a"/>`; break;
    case "monocle": s += `<circle cx="68.7" cy="17.8" r="2.1" fill="none" stroke="url(#${p}gd)" stroke-width=".55"/><path d="M66.6 18.6 Q64 24 63 27" stroke="url(#${p}gd)" stroke-width=".3" fill="none"/>`; break;
    case "feather": s += `<path d="M58 10 Q50 2 47 -2 Q54 1 59.5 8.5 Z" fill="${a.gem}" ${st(0.4)}/>`; break;
    case "headset": s += `<path d="M58.4 13 Q58 6 64 5.2" stroke="${OL}" stroke-width="1.2" fill="none"/><rect x="59.4" y="17" width="3" height="4.4" rx="1.2" fill="${a.armor[1]}" stroke="${a.gem}" stroke-width=".5"/><path d="M60 8 L58 3 L62.4 6.4 Z M66.6 6 L69.6 1.6 L70 6.8 Z" fill="${a.hc[0]}" ${st(0.4)}/>`; break;
    case "halo": s += `<ellipse cx="63" cy="2.6" rx="6" ry="1.5" fill="none" stroke="url(#${p}gd)" stroke-width=".9"/>`; break;
    case "horns": s += `<path d="M60.5 9 Q56.5 3 59 0 Q60 4 63 7 Z M66 7.4 Q68 1.8 71.6 1.2 Q69 4 68.6 8.6 Z" fill="url(#${p}gd)" ${st(0.4)}/>`; break;
    case "fins": s += `<path d="M61.5 18 L56.5 15 L57.6 21 Z" fill="${a.gem}" fill-opacity=".8" ${st(0.4)}/>`; break;
  }
  return s;
}
function body(a, p) {
  const ar = `fill="url(#${p}ar)" ${st(0.6)}`, gdw = (w) => `stroke="url(#${p}gd)" stroke-width="${w}" fill="none"`, gd = gdw(0.9), thr = a.shot[0];
  return `
<path d="M54 46 L57.5 50 L45.5 60.5 L41.5 57 Z" fill="${a.armor[2]}" ${st(0.6)}/><path d="M45.5 60.5 L41.5 57 L33 67 L36.4 70 Z" fill="${a.armor[2]}" ${st(0.6)}/>
<path d="M33 67 L36.4 70 L31.4 74.2 L25.6 73.4 L28 69 Z" fill="${a.armor[0]}" ${st(0.6)}/><ellipse cx="25.8" cy="73.8" rx="2.6" ry="1.4" fill="${thr}"/><ellipse cx="25.4" cy="73.8" rx="1.2" ry=".7" fill="#ffffff"/>
<path d="M58 46 L63.4 49 L54.4 61.4 L49.4 58.4 Z" ${ar}/><path d="M54.4 61.4 L49.4 58.4 L43.8 70 L48 72.2 Z" ${ar}/>
<path d="M43.8 70 L48 72.2 L44.2 77 L37.6 76.4 L40.2 72 Z" fill="url(#${p}ar)" ${st(0.6)}/><path d="M40.4 72.4 L47.4 72.6" ${gd}/><ellipse cx="37.8" cy="76.8" rx="2.8" ry="1.5" fill="${thr}"/><ellipse cx="37.4" cy="76.8" rx="1.3" ry=".7" fill="#ffffff"/>
${gem(p, 51.8, 59.8, 1.3)}
<path d="M53 30.4 Q60 27.6 67.6 30.6 L68 37 Q66 44 63.6 47.2 L54.4 47.2 Q52 40 53 30.4 Z" ${ar}/>
<path d="M56 30.4 L60.6 37.2 L65.6 30.8" ${gd}/><path d="M54.4 33 Q55.6 40 55.4 45 M66.6 33.6 Q66 40 63.8 45" ${gdw(0.55)}/>
<path d="M57.4 33 Q60.6 36 64 33.4" stroke="${a.gem}" stroke-width=".45" fill="none" opacity=".8"/>
${gem(p, 60.6, 39.2, 1.7)}
<path d="M54 44.4 L64.4 44.4 L64 47 L54.4 47 Z" fill="url(#${p}gd)" ${st(0.4)}/>
<path d="M53.6 46.6 L64.4 46.6 L65.2 51.6 L58.6 53.4 L52.8 51.4 Z" fill="${a.armor[1]}" ${st(0.6)}/><path d="M53.2 51.2 L58.6 53 L65 51.4" ${gdw(0.6)}/>
<path d="M59.4 28.2 L61 25.6 L66.2 26.6 L66.8 30.4 Z" fill="${a.armor[2]}" stroke="url(#${p}gd)" stroke-width=".6"/>`;
}
function backArm(a, p, hx, hy) {
  return `<path d="M56.4 31 L60.6 30.8 L63.6 38.6 L60 40.4 Z" fill="${a.armor[2]}" ${st(0.6)}/>
<path d="M60.2 38.4 L63.6 38.6 L${hx - 1.5} ${hy - 1.6} L${hx - 1.5} ${hy + 1.6} Z" fill="${a.armor[2]}" ${st(0.6)}/>
<path d="M${hx - 7} ${hy - 1.8} L${hx - 3} ${hy - 1.9} L${hx - 3} ${hy + 1.9} L${hx - 7} ${hy + 2} Z" fill="url(#${p}gd)" ${st(0.4)}/>
<ellipse cx="${hx}" cy="${hy}" rx="2" ry="1.9" fill="url(#${p}sk)" ${st(0.5)}/>`;
}
function frontArm(a, p, hx, hy) {
  return `<path d="M62 33 L66.4 33 L67.2 40.4 L63.6 41.4 Z" fill="url(#${p}ar)" ${st(0.6)}/>
<path d="M63.6 40 L67.2 40.2 L${hx + 1} ${hy - 1.5} L${hx - 0.5} ${hy + 1.8} Z" fill="url(#${p}ar)" ${st(0.6)}/>
<path d="M${(63.6 + hx) / 2 - 1} ${(40 + hy) / 2 - 1.8} l3.4 0 l0 3.6 l-3.4 .2 Z" fill="url(#${p}gd)" ${st(0.4)}/>
<ellipse cx="${hx}" cy="${hy}" rx="2.1" ry="2" fill="url(#${p}sk)" ${st(0.5)}/>
<path d="M58.6 28 Q66 24.6 71.4 29 L70.4 34.4 Q65 36.6 59.8 34.2 Z" fill="url(#${p}ar)" ${st(0.7)}/>
<path d="M59.6 28.6 Q66 25.4 70.8 29.4 M60.4 33.6 Q65 35.6 70 33.8" stroke="url(#${p}gd)" stroke-width="1" fill="none"/>
<path d="M62 31.2 Q66 29 69.6 31.4" stroke="url(#${p}gd)" stroke-width=".5" fill="none"/>${gem(p, 65.8, 31.3, 1.3)}`;
}
function weapon(a, p, frame) {
  const W = `fill="url(#${p}ar)" ${st(0.7)}`, G = `fill="url(#${p}gd)" ${st(0.5)}`, glowc = a.shot[0];
  if (a.cat === "cannon") return `
<path d="M51 35.6 L66 33.6 L68.4 46.2 L54 47.4 Q49.4 42 51 35.6 Z" ${W}/>
<path d="M64 36.2 L103 36.6 L109 34.8 L111.6 39 L109 43.2 L103 41.4 L64 42.4 Z" ${W}/>
<path d="M66 37.6 L102 37.8" stroke="#ffffff" stroke-width=".6" opacity=".55"/>
<rect x="78" y="35.4" width="3.4" height="7.8" rx="1" ${G}/><rect x="90" y="35.6" width="3" height="7.2" rx="1" ${G}/>
<path d="M102 34.2 L111 31.8 L114.4 39 L111 46.2 L102 43.8 L104.6 39 Z" fill="url(#${p}gd)" ${st(0.6)}/>
<circle cx="113.2" cy="39" r="1.6" fill="${glowc}"/>
<path d="M54 36.4 L66 35" stroke="url(#${p}gd)" stroke-width="1" fill="none"/>
<circle cx="59.6" cy="41.4" r="4.4" fill="url(#${p}gm)"/><circle cx="59.6" cy="41.4" r="2.2" fill="${glowc}" stroke="url(#${p}gd)" stroke-width=".6"/>
<path d="M84 39 L100 39" stroke="${glowc}" stroke-width=".8" opacity=".9"/>`;
  if (a.cat === "sniper") return `
<path d="M49.4 37 L58.4 36 L60 41.2 L51.4 43.4 Q48.6 40 49.4 37 Z" ${W}/>
<path d="M58 36.4 L84 36.2 L86 40.6 L58.4 41.4 Z" ${W}/>
<path d="M84 37.8 L114 38.2 L114 39.8 L84 40.4 Z" fill="${a.armor[2]}" ${st(0.5)}/>
<rect x="112.6" y="37.2" width="4.6" height="3.6" rx=".8" ${G}/>
<path d="M66 32.2 L82 32.2 L82.6 35.6 L65.6 35.6 Z" fill="${a.armor[2]}" ${st(0.5)}/><circle cx="82.4" cy="33.9" r="1.5" fill="${glowc}" stroke="url(#${p}gd)" stroke-width=".5"/><rect x="70" y="35.4" width="2" height="1.4" ${G}/><rect x="77" y="35.4" width="2" height="1.4" ${G}/>
<rect x="70" y="37.4" width="10" height="2.4" rx="1" fill="${glowc}" opacity=".9"/><path d="M70 37.4 L80 37.4" stroke="#ffffff" stroke-width=".4"/>
<path d="M60 41 L62 45.6 L65 45.2 L64 41" ${G}/>`;
  if (a.cat === "gun") return `
<path d="M62 35.8 L95 35.2 L97.6 40.6 L64 42 Z" ${W}/>
<path d="M95 36.8 L107.6 37.2 L107.6 39.8 L95 40.2 Z" fill="${a.armor[2]}" ${st(0.5)}/>
<rect x="106" y="36.6" width="3.2" height="3.8" rx=".8" ${G}/>
<path d="M74 41.4 L80 41.2 L78.4 48.4 L72.4 47.6 Z" fill="${a.armor[2]}" ${st(0.5)}/>
<path d="M66 37.4 L92 36.9" stroke="${glowc}" stroke-width="1.2"/><path d="M80 33.4 L88 33.2 L88 35.4 L80 35.6 Z" ${G}/>
<path d="M64 36 L95 35.4" stroke="url(#${p}gd)" stroke-width=".6" fill="none"/>`;
  // bow (+ nocked arrow when drawn)
  const drawn = frame !== "fire";
  return `
<path d="M84 13 Q93.6 22 89 38 Q93.6 54 84 63" fill="none" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/>
<path d="M84 13 Q93.6 22 89 38 Q93.6 54 84 63" fill="none" stroke="url(#${p}ar)" stroke-width="2.2" stroke-linecap="round"/>
<path d="M85.4 15.2 Q91.4 22 89.6 30 M85.4 60.8 Q91.4 54 89.6 46" stroke="url(#${p}gd)" stroke-width=".7" fill="none"/>
<path d="M82.6 11.4 L85.8 14.4 L83.4 15.4 Z M82.6 64.6 L85.8 61.6 L83.4 60.6 Z" fill="url(#${p}gd)"/>
${gem(p, 89.6, 38, 1.5)}
${drawn ? `<path d="M84 13 L66 38 L84 63" stroke="#f4f0ff" stroke-width=".55" fill="none"/>
<path d="M66 38 L94 38" stroke="${a.trim[1]}" stroke-width="1"/><path d="M93 36.4 L97.6 38 L93 39.6 Z" fill="${glowc}" ${st(0.4)}/>
<path d="M66.4 38 L63.4 36.4 L65.6 38 L63.4 39.6 Z" fill="${a.gem}"/><path d="M70 38 L92 38" stroke="${glowc}" stroke-width=".5" opacity=".8"/>`
    : `<path d="M84 13 Q85.6 38 84 63" stroke="#f4f0ff" stroke-width=".55" fill="none"/>`}`;
}
const HANDS = { cannon: { back: [80, 43.4], front: [67.6, 44] }, sniper: { back: [83, 41], front: [64.6, 42.6] }, gun: { back: [86, 41], front: [69, 42.4] }, bow: { back: [89.4, 38], front: [66, 38] } };

function avatarSVG(a, frame = "idle", view = "game") {
  const p = a.id + frame[0] + view[0];
  const hands = HANDS[a.cat], front = a.cat === "bow" && frame === "fire" ? [61.6, 36.6] : hands.front;
  const flash = frame === "fire" && a.cat !== "bow" ? (() => { const [mx, my] = MUZZLES[a.cat]; return `<path d="M${mx - 1} ${my} L${mx + 9} ${my - 4} L${mx + 6} ${my} L${mx + 9} ${my + 4} Z" fill="${a.shot[0]}"/><circle cx="${mx}" cy="${my}" r="2.6" fill="#ffffff"/>`; })() : "";
  const sparkle = `<circle cx="20" cy="30" r=".6" fill="${a.gem}" opacity=".8"/><circle cx="12" cy="40" r=".45" fill="#ffffff" opacity=".7"/><circle cx="30" cy="44" r=".5" fill="${a.gem}" opacity=".7"/>`;
  const art = defs(a, p) + backHair(a, p) + sparkle + backArm(a, p, hands.back[0], hands.back[1]) + body(a, p) + head(a, p, frame) + weapon(a, p, frame) + frontArm(a, p, front[0], front[1]) + flash;
  if (view === "portrait") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="52.5 1 25 25" width="25" height="25"><defs><radialGradient id="${p}bg" cx=".55" cy=".4"><stop offset="0" stop-color="${a.armor[1]}"/><stop offset="1" stop-color="#0b1030"/></radialGradient></defs><rect x="52.5" y="1" width="25" height="25" fill="url(#${p}bg)"/><circle cx="55" cy="4" r=".35" fill="#fff"/><circle cx="74" cy="6" r=".3" fill="#fff"/><circle cx="54" cy="20" r=".25" fill="${a.gem}"/>${art}</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 124 84" width="124" height="84">${art}</svg>`;
}

function registerAvatarSprites() { for (const a of AVATARS) for (const f of ["idle", "fire", "hurt"]) SPRITE_SVG[`av_${a.id}_${f}`] = avatarSVG(a, f); }
const PORTRAIT_CACHE = {};
function avatarPortrait(id) {
  if (id === "lumi") return "nova-portrait.jpg";   // Nova's portrait is the supplied reference artwork
  if (!PORTRAIT_CACHE[id]) { const a = AVATAR_BY_ID[id] || AVATARS[0]; PORTRAIT_CACHE[id] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(avatarSVG(a, "idle", "portrait")); }
  return PORTRAIT_CACHE[id];
}
function avatarFull(id, frame = "idle") { const a = AVATAR_BY_ID[id] || AVATARS[0]; return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(avatarSVG(a, frame)); }
if (typeof module === "object" && module.exports) module.exports = { AVATARS, avatarSVG, AVATAR_BY_ID, avatarUnlocked, MUZZLES, SPRITE_ANCHOR, WEAPON_CATS };
