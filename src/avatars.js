"use strict";
// ============================================================ 20 playable heroes — polished chibi glider style
// Avatar ids are unchanged so unlocks/selections carry over. Stats are identical for every hero;
// weapon category only changes artwork and projectile visuals.
const AVATARS = [
  { id: "lumi", name: "Nova", title: "Silver Vanguard", cat: "shield", unlock: 0, hair: "long", bangs: "parted", hc: ["#dde4f0", "#ffffff", "#98a6c2"], skin: "#f6dfd0", eye: "#3a8cff",
    out: ["#2a5ad8", "#eef3fb", "#7fd0ff", "#c3cede"], wc: ["#d8e0ee", "#1e3a8a", "#7fd0ff"], acc: "wingclip", shot: ["#8fd8ff", "#ffffff"], weaponName: "Vanguard aegis" },
  { id: "astra", name: "Astra", title: "Sunrise Vanguard", cat: "cannon", unlock: 0, hair: "long", bangs: "swept", hc: ["#ff8a5c", "#ffd0a8", "#c4452e"], skin: "#f6dcc8", eye: "#f2a93b",
    out: ["#f4f6ff", "#2bb3a8", "#f2c14e", "#d99a2b"], wc: ["#f4f6ff", "#1f6f74", "#f2c14e"], acc: "star", shot: ["#7ff3e4", "#ffffff"], weaponName: "Dawnfire cannon" },
  { id: "nova", name: "Lumi", title: "Starlight Marksman", cat: "sniper", unlock: 0, hair: "sidetail", bangs: "swept", hc: ["#c9bde8", "#f2eeff", "#8f82c4"], skin: "#f6dcc8", eye: "#1fb5b8",
    out: ["#1f2a5c", "#eef1fb", "#8b5cf6", "#4a3b6b"], wc: ["#eef1fb", "#1f2a5c", "#8b5cf6"], acc: "clip", shot: ["#9ff3ff", "#ffffff"], weaponName: "Prism longrifle" },
  { id: "riko", name: "Riko", title: "Spark Brawler", cat: "cannon", unlock: 0, hair: "spiky", bangs: "spiky", hc: ["#ff9a52", "#ffd6a8", "#c4602a"], skin: "#f3d2b8", eye: "#3fd47a",
    out: ["#2b3a2f", "#d8e8d0", "#3fd47a", "#1a241c"], wc: ["#3a4a40", "#c9d6c8", "#3fd47a"], acc: "earpiece", shot: ["#a8ffc8", "#ffffff"], weaponName: "Pulse mortar" },
  { id: "pip", name: "Pip", title: "Pocket Engineer", cat: "cannon", unlock: 0, hair: "cap", bangs: "straight", hc: ["#7a5236", "#a87a56", "#4a2e1c"], skin: "#e8b896", eye: "#5aa0ff",
    out: ["#f2b33a", "#fff4d8", "#2f6fbf", "#a8761a"], wc: ["#5e6b80", "#c9ccd6", "#f2b33a"], acc: "none", shot: ["#8fe8ff", "#ffffff"], weaponName: "Gadget cannon" },
  { id: "aria", name: "Aria", title: "Crystal Songbow", cat: "bow", unlock: 5, hair: "long", bangs: "parted", hc: ["#9fe6e0", "#e8fffc", "#5fb4ae"], skin: "#f6dcc8", eye: "#a074ff",
    out: ["#5a3ea8", "#f0eaff", "#9fe6e0", "#3a2870"], wc: ["#e0d4ff", "#5a3ea8", "#9fe6e0"], acc: "flower", shot: ["#c8fff6", "#ffffff"], weaponName: "Resonance bow" },
  { id: "kestrel", name: "Kestrel", title: "Sky Ranger", cat: "bow", unlock: 10, hair: "wolf", bangs: "swept", hc: ["#4a3628", "#7a6050", "#241810"], skin: "#8d5a3b", eye: "#ffd34f",
    out: ["#3e5a3a", "#e8e2c8", "#c9a24a", "#26381f"], wc: ["#6a4a2e", "#c9a24a", "#3e5a3a"], acc: "scarf", shot: ["#e2ffd0", "#ffffff"], weaponName: "Galewood recurve" },
  { id: "mochi", name: "Mochi", title: "Bunny Archer", cat: "bow", unlock: 15, hair: "twintail", bangs: "straight", hc: ["#f4f0ff", "#ffffff", "#c4bce0"], skin: "#fbe6dc", eye: "#4fb4ff",
    out: ["#7fb8e8", "#ffffff", "#2f6fbf", "#4f86b8"], wc: ["#c8f4ff", "#2f6fbf", "#ffffff"], acc: "bunny", shot: ["#d8f4ff", "#ffffff"], weaponName: "Moonbeam bow" },
  { id: "sable", name: "Sable", title: "Night Sniper", cat: "sniper", unlock: 20, hair: "long", bangs: "swept", hc: ["#2c2848", "#5a5488", "#141024"], skin: "#f3d2b8", eye: "#5ef2c0",
    out: ["#1a1830", "#c8c4e0", "#5ef2c0", "#0e0c1c"], wc: ["#2a2840", "#c8f4ff", "#5ef2c0"], acc: "visor", shot: ["#9fffe0", "#ffffff"], weaponName: "Nightglass rifle" },
  { id: "juno", name: "Juno", title: "Tidal Gunner", cat: "gun", unlock: 25, hair: "braid", bangs: "parted", hc: ["#2f8f9a", "#7fd6de", "#1a5a62"], skin: "#c68a5e", eye: "#ffe08a",
    out: ["#e8f4f4", "#2f8f9a", "#ffd34f", "#9ac4c8"], wc: ["#2f8f9a", "#e8f4f4", "#ffd34f"], acc: "star", shot: ["#9ffff0", "#ffffff"], weaponName: "Riptide carbine" },
  { id: "vega", name: "Vega", title: "Astral Deadeye", cat: "sniper", unlock: 30, hair: "bun", bangs: "straight", hc: ["#e8c25a", "#fff2b8", "#a07a20"], skin: "#f6dcc8", eye: "#6fc8ff",
    out: ["#2a2050", "#f0e8ff", "#e0b84a", "#18123a"], wc: ["#f0e8ff", "#2a2050", "#e0b84a"], acc: "halo", shot: ["#fff4c4", "#ffffff"], weaponName: "Zenith rail" },
  { id: "haru", name: "Haru", title: "Bloom Archer", cat: "bow", unlock: 35, hair: "spiky", bangs: "swept", hc: ["#5aa83c", "#b0e888", "#2f6a1e"], skin: "#e8b896", eye: "#ff9ad5",
    out: ["#f2f0e0", "#5aa83c", "#ffd34f", "#b8b6a0"], wc: ["#5aa83c", "#f2f0e0", "#ffd34f"], acc: "flower", shot: ["#e0ffc8", "#ffffff"], weaponName: "Thornbloom bow" },
  { id: "ines", name: "Ines", title: "Frost Sniper", cat: "sniper", unlock: 40, hair: "hood", bangs: "parted", hc: ["#e8f4ff", "#ffffff", "#a8c4dc"], skin: "#f3d2b8", eye: "#4fb4ff",
    out: ["#bfe4ff", "#ffffff", "#2f6fbf", "#86b4d8"], wc: ["#e6ffff", "#2f6fbf", "#bfe4ff"], acc: "none", shot: ["#e0f8ff", "#ffffff"], weaponName: "Rime rifle" },
  { id: "dax", name: "Dax", title: "Foundry Bruiser", cat: "cannon", unlock: 45, hair: "cap", bangs: "spiky", hc: ["#2a1e18", "#5a4434", "#120c08"], skin: "#8d5a3b", eye: "#ffb347",
    out: ["#5a4234", "#e8d8c0", "#4fe0ff", "#3a2a20"], wc: ["#7a5a44", "#c9ccd6", "#4fe0ff"], acc: "goggles", shot: ["#8ff0ff", "#ffffff"], weaponName: "Forge cannon" },
  { id: "orla", name: "Orla", title: "Coral Diver", cat: "gun", unlock: 50, hair: "wolf", bangs: "parted", hc: ["#3a5aa8", "#8aaaf0", "#1e3270"], skin: "#f6dcc8", eye: "#3ee8c8",
    out: ["#1e4a5a", "#d8f4f0", "#3ee8c8", "#103038"], wc: ["#1e4a5a", "#d8f4f0", "#3ee8c8"], acc: "goggles", shot: ["#9ffff0", "#ffffff"], weaponName: "Bubble repeater" },
  { id: "zephyr", name: "Zephyr", title: "Storm Rider", cat: "gun", unlock: 55, hair: "spiky", bangs: "spiky", hc: ["#e8ecf7", "#ffffff", "#9aa4c0"], skin: "#c68a5e", eye: "#6fc8ff",
    out: ["#3d4a7a", "#e8ecf7", "#6fc8ff", "#262f52"], wc: ["#3d4a7a", "#e8ecf7", "#6fc8ff"], acc: "antenna", shot: ["#d8f0ff", "#ffffff"], weaponName: "Gale pistols" },
  { id: "tamsin", name: "Tamsin", title: "Rune Scholar", cat: "sniper", unlock: 60, hair: "braid", bangs: "straight", hc: ["#8a4a2e", "#c4805a", "#5a2a16"], skin: "#f3d2b8", eye: "#9effe0",
    out: ["#4a3a6a", "#f0e8d8", "#9effe0", "#2e2244"], wc: ["#c4a46a", "#4a3a6a", "#9effe0"], acc: "glasses", shot: ["#d0fff0", "#ffffff"], weaponName: "Glyph rifle" },
  { id: "wren", name: "Wren", title: "Feather Scout", cat: "bow", unlock: 65, hair: "bob", bangs: "swept", hc: ["#b0603a", "#e8a47a", "#7a3a1e"], skin: "#e8b896", eye: "#3fd47a",
    out: ["#e8e0c8", "#4a6a3a", "#3fd47a", "#b0a888"], wc: ["#4a6a3a", "#e8e0c8", "#3fd47a"], acc: "feather", shot: ["#e8ffd0", "#ffffff"], weaponName: "Skylark bow" },
  { id: "cass", name: "Cass", title: "Neon Hacker", cat: "gun", unlock: 70, hair: "twintail", bangs: "parted", hc: ["#3a3a4a", "#6a6a84", "#1e1e2a"], skin: "#f6dcc8", eye: "#5ef2f2",
    out: ["#1a1a2a", "#e0e0ff", "#5ef2f2", "#0e0e18"], wc: ["#2a2a40", "#e0e0ff", "#5ef2f2"], acc: "catears", shot: ["#a8ffff", "#ffffff"], weaponName: "Glitch SMG" },
  { id: "elio", name: "Elio", title: "Sunforge Paladin", cat: "gun", unlock: 75, hair: "wolf", bangs: "swept", hc: ["#f2d65a", "#fff4b8", "#b8962a"], skin: "#c68a5e", eye: "#4fb4ff",
    out: ["#f0ecf8", "#3a5aa8", "#e0b84a", "#b8b4c8"], wc: ["#e0b84a", "#f0ecf8", "#3a5aa8"], acc: "halo", shot: ["#fff6c8", "#ffffff"], weaponName: "Aegis rifle" },
  { id: "luma", name: "Luma", title: "Eclipse Herald", cat: "cannon", unlock: 80, hair: "sidetail", bangs: "swept", hc: ["#3a2a5c", "#7a62b0", "#1e1436"], skin: "#f6dcc8", eye: "#c88cff",
    out: ["#120c20", "#c8b8f0", "#c88cff", "#06040e"], wc: ["#2a2048", "#c8b8f0", "#c88cff"], acc: "horns", shot: ["#e4ccff", "#ffffff"], weaponName: "Umbra cannon" },
  { id: "seraphine", name: "Seraphine", title: "Dawnwing Guardian", cat: "gun", board: "wings", unlock: 12, hair: "wavy", bangs: "parted", hc: ["#ffe6a8", "#fff8e0", "#d8a84a"], skin: "#f8e2d4", eye: "#e07ab8",
    out: ["#fff8f0", "#f4c6dc", "#ffcf5c", "#e8b44a"], wc: ["#fff4e0", "#c47a9a", "#ffcf5c"], acc: "halo", shot: ["#ffe9b0", "#ffffff"], weaponName: "Radiant pistol" },
  { id: "elara", name: "Elara", title: "Starlit Wandmage", cat: "wand", unlock: 22, hair: "bun", bangs: "swept", hc: ["#b48cff", "#e8dcff", "#6a48c0"], skin: "#f6dcc8", eye: "#5ef2c0",
    out: ["#3a2a7a", "#efe8ff", "#5ef2c0", "#9a7ad8"], wc: ["#e8dcff", "#3a2a7a", "#5ef2c0"], acc: "witchhat", shot: ["#b8fff0", "#ffffff"], weaponName: "Comet wand" },
  { id: "kai", name: "Kai", title: "Neon Skater", cat: "gun", board: "skate", unlock: 32, hair: "spiky", bangs: "spiky", hc: ["#3ad0a8", "#a8ffe8", "#1a7a62"], skin: "#c68a5e", eye: "#ffd34f",
    out: ["#2a2a3e", "#ffd34f", "#ff5fa8", "#14141e"], wc: ["#3a3a54", "#ffd34f", "#ff5fa8"], acc: "headphones", shot: ["#ffe27a", "#ffffff"], weaponName: "Kickflip blaster" },
  { id: "lyra", name: "Lyra", title: "Moonleaf Archer", cat: "bow", unlock: 42, hair: "braid", bangs: "parted", hc: ["#e8eef8", "#ffffff", "#a8b4cc"], skin: "#f3d2b8", eye: "#3fd47a",
    out: ["#2e5a3a", "#e8f0d8", "#8ff0a8", "#c8d8b0"], wc: ["#c8d8b0", "#2e5a3a", "#8ff0a8"], acc: "leafcrown", shot: ["#d8ffe0", "#ffffff"], weaponName: "Moonleaf bow" },
  { id: "rook", name: "Rook", title: "Iron Deadeye", cat: "sniper", heavy: true, unlock: 52, hair: "cap", bangs: "straight", hc: ["#2a2420", "#5a4a40", "#14100c"], skin: "#8d5a3b", eye: "#ff8a5c",
    out: ["#4a4e5a", "#d8dce4", "#ff8a5c", "#2a2e38"], wc: ["#5a606e", "#2a2e38", "#ff8a5c"], acc: "scope", shot: ["#ffd8c0", "#ffffff"], weaponName: "Ironsight railgun" },
];
const AVATAR_BY_ID = Object.fromEntries(AVATARS.map((a) => [a.id, a]));
// ---------------- unique ultimates (all deal the original blast's damage; type sets the shape, colour/name make it theirs)
const ULTS = {
  lumi: ["nova", "Aegis Nova", "#8fd8ff"], astra: ["cannonball", "Dawnfire Cannonball", "#ffb86b"], nova: ["laser", "Prism Laser", "#c8b8ff"], riko: ["lightning", "Spark Chain", "#a8ffc8"],
  pip: ["meteor", "Gadget Meteor Shower", "#8fe8ff"], aria: ["crystal", "Crystal Storm", "#c8fff6"], kestrel: ["lances", "Gale Lances", "#e2ffd0"], mochi: ["tsunami", "Moon Tide", "#d8f4ff"],
  sable: ["blackhole", "Night Singularity", "#9fffe0"], juno: ["tsunami", "Riptide Wave", "#7ff5e8"], vega: ["solar", "Zenith Flare", "#fff4c4"], haru: ["lances", "Thornbloom Spears", "#e0ffc8"],
  ines: ["crystal", "Frostglass Storm", "#e0f8ff"], dax: ["meteor", "Forge Meteors", "#ffd08a"], orla: ["blackhole", "Abyssal Vortex", "#7ff0d8"], zephyr: ["lightning", "Thunder Chain", "#d8f0ff"],
  tamsin: ["laser", "Glyph Beam", "#d0fff0"], wren: ["lances", "Feather Volley", "#e8ffd0"], cass: ["lightning", "Glitch Arc", "#a8ffff"], elio: ["solar", "Sun Flare", "#fff6c8"],
  luma: ["blackhole", "Eclipse Hole", "#e4ccff"], seraphine: ["nova", "Heaven's Halo", "#ffe9b0"], elara: ["crystal", "Starfall Storm", "#b8fff0"], kai: ["cannonball", "Kickflip Cannonball", "#ffe27a"],
  lyra: ["tsunami", "Moonleaf Tide", "#d8ffe0"], rook: ["laser", "Railgun Lance", "#ffd8c0"],
};
for (const a of AVATARS) { const u = ULTS[a.id] || ["nova", "Blast", a.shot[0]]; a.ult = { type: u[0], name: u[1], color: u[2] }; }
const ULT_LABEL = { nova: "Nova ring", cannonball: "Cannonball", laser: "Sweeping laser", tsunami: "Tsunami wave", blackhole: "Black hole", lightning: "Chain lightning", lances: "Piercing lances", meteor: "Meteor shower", crystal: "Homing crystal storm", solar: "Solar flare sweep" };

// ---------------- customisation + skins (bought with coins)
const SWATCH = { crimson: "#d83a5a", azure: "#2f7ad8", emerald: "#2fa86a", violet: "#7a4ae0", gold: "#e0b84a", onyx: "#24222e", pearl: "#eef0f8", coral: "#ff7a5c" };
const BOOT = { onyx: "#24222e", snow: "#eef0f8", ember: "#d8582a", mint: "#3ad0a8", rose: "#e86bb5" };
const PARTS = {
  hat: { default: 0, capHat: 0, headband: 120, catears: 200, bunny: 250, halo: 300, witchhat: 300, crown: 350 },
  back: { none: 0, wings: 500 },
  ride: { default: 0, glider: 0, hover: 200, skate: 250, none: 150 },
  weapon: { default: 0, cannon: 300, bow: 300, sniper: 300, gun: 300, wand: 350, shield: 400 },
  color: { default: 0, ...Object.fromEntries(Object.keys(SWATCH).map((k) => [k, 80])) },
  boots: { default: 0, ...Object.fromEntries(Object.keys(BOOT).map((k) => [k, 60])) },
};
const PART_LABEL = { capHat: "Cap", headband: "Headband", catears: "Cat ears", bunny: "Bunny ears", halo: "Halo", witchhat: "Witch hat", crown: "Crown", wings: "Wings", glider: "Glider", hover: "Hoverboard", skate: "Skateboard", none: "None", default: "Default",
  cannon: "Cannon", bow: "Bow", sniper: "Sniper", gun: "Gun", wand: "Wand", shield: "Shield cannon" };
const SKINS = [
  { id: "lumi_gold", avatar: "lumi", name: "Gilded Vanguard", price: 600, hc: ["#fff2c8", "#ffffff", "#c8a85a"], out: ["#c8962a", "#fff8e8", "#ffe27a", "#f0d27a"], wc: ["#fff2c8", "#8a5a1a", "#ffe27a"], shot: ["#ffe9a8", "#ffffff"] },
  { id: "lumi_shadow", avatar: "lumi", name: "Midnight Aegis", price: 450, hc: ["#3a3a58", "#7a7aa8", "#1a1a2e"], out: ["#14142a", "#c8c8e8", "#9f8cff", "#2a2a44"], wc: ["#2a2a44", "#9f8cff", "#c8c8e8"], shot: ["#c8b8ff", "#ffffff"] },
  { id: "astra_sakura", avatar: "astra", name: "Sakura Dawn", price: 400, hc: ["#ffb8d8", "#fff0f6", "#d86a9a"], out: ["#fff4f8", "#e86bb5", "#ffd1e6", "#d86a9a"], wc: ["#fff4f8", "#c4487a", "#ffd1e6"] },
  { id: "nova_neon", avatar: "nova", name: "Neon Pulse", price: 400, hc: ["#5ef2f2", "#d8ffff", "#1a8a8a"], out: ["#1a1a2a", "#5ef2f2", "#ff5fa8", "#0e0e18"], wc: ["#1a1a2a", "#ff5fa8", "#5ef2f2"], shot: ["#ff9ad5", "#ffffff"] },
  { id: "riko_ice", avatar: "riko", name: "Glacier Brawler", price: 350, hc: ["#bfe9ff", "#ffffff", "#5a8ad8"], out: ["#2a3a5a", "#e8f4ff", "#7fd0ff", "#1a2440"] },
  { id: "pip_retro", avatar: "pip", name: "Retro Arcade", price: 300, hc: ["#ff5f7a", "#ffc8d0", "#a8283e"], out: ["#2a2a54", "#ffd34f", "#ff5f7a", "#14142a"] },
  { id: "aria_dusk", avatar: "aria", name: "Duskbloom", price: 400, hc: ["#ff9a7a", "#ffe0d0", "#c4502e"], out: ["#3a1a4a", "#ffe8f0", "#ff9a7a", "#22102e"] },
  { id: "mochi_carrot", avatar: "mochi", name: "Carrot Patch", price: 300, hc: ["#ffd8a8", "#fff4e8", "#d8984a"], out: ["#ff8a3a", "#fff4e8", "#5aa83c", "#c4602a"] },
  { id: "sable_crimson", avatar: "sable", name: "Crimson Night", price: 450, hc: ["#3a1018", "#7a2a3a", "#1a060c"], out: ["#2a0a14", "#f0c8d0", "#ff3f6a", "#14060a"], shot: ["#ff9ab0", "#ffffff"] },
  { id: "vega_aurora", avatar: "vega", name: "Aurora Deadeye", price: 500, hc: ["#9ff7c4", "#e8fff4", "#3a9a6a"], out: ["#14304a", "#e8fff4", "#9ff7c4", "#0a1c2e"] },
  { id: "kai_sunset", avatar: "kai", name: "Sunset Ollie", price: 350, hc: ["#ff8a5c", "#ffd0a8", "#c4452e"], out: ["#3a1a3a", "#ffcf5c", "#ff5f7a", "#22102e"] },
  { id: "seraphine_dark", avatar: "seraphine", name: "Fallen Seraph", price: 600, hc: ["#2a2440", "#5a5488", "#141024"], out: ["#1a1830", "#c8c4e0", "#ff5fa8", "#0e0c1c"], wc: ["#2a2840", "#ff5fa8", "#c8c4e0"], shot: ["#ffb8e0", "#ffffff"] },
  { id: "elara_sun", avatar: "elara", name: "Sunlit Mage", price: 450, hc: ["#ffe27a", "#fff8d8", "#c8962a"], out: ["#fff4d8", "#e0b84a", "#ff9a5c", "#c8962a"] },
  { id: "rook_desert", avatar: "rook", name: "Desert Ops", price: 400, hc: ["#8a6a4a", "#b8946a", "#5a4028"], out: ["#c8a46a", "#f0e4c8", "#ff8a3a", "#8a6a3a"], wc: ["#a8885a", "#5a4028", "#ff8a3a"] },
];
const SKIN_BY_ID = Object.fromEntries(SKINS.map((k) => [k.id, k]));
function avatarPrice(a) { return a.unlock ? 200 + a.unlock * 15 : 0; }
// Build the hero actually used in play (skin + parts). Hitbox and stats never change; weapon only changes looks + projectiles.
function effectiveAvatar(id, custom) {
  const base = AVATAR_BY_ID[id] || AVATARS[0];
  if (!custom || !Object.keys(custom).some((k) => custom[k] && custom[k] !== "default")) return base;
  const a = { ...base, hc: [...base.hc], out: [...base.out], wc: [...base.wc], shot: [...base.shot] };
  const sk = custom.skin && SKIN_BY_ID[custom.skin] && SKIN_BY_ID[custom.skin].avatar === id ? SKIN_BY_ID[custom.skin] : null;
  if (sk) { for (const k of ["hc", "out", "wc", "shot"]) if (sk[k]) a[k] = [...sk[k]]; }
  if (custom.color && SWATCH[custom.color]) a.out[0] = SWATCH[custom.color];
  if (custom.boots && BOOT[custom.boots]) a.boots = BOOT[custom.boots];
  if (custom.hat && custom.hat !== "default") { a.acc = custom.hat; if (a.hair === "cap") a.hair = "bob"; }
  if (custom.weapon && custom.weapon !== "default") a.cat = custom.weapon;
  if (custom.ride && custom.ride !== "default") a.board = custom.ride === "glider" ? undefined : custom.ride;
  if (custom.back === "wings") a.wings = true; else if (custom.back === "none" && a.board !== "wings") a.wings = false;
  a.ult = { ...base.ult, color: sk && sk.shot ? sk.shot[0] : base.ult.color };
  a.key = id + "~" + [custom.skin, custom.hat, custom.back, custom.ride, custom.weapon, custom.color, custom.boots].map((x) => x || "-").join(".");
  return a;
}
const WEAPON_CATS = { cannon: "Cannon", bow: "Bow", sniper: "Sniper rifle", gun: "Rifle / gun", shield: "Shield cannon", wand: "Magic wand" };
function avatarUnlocked(av, completedCount) { return av.unlock === 0 || completedCount >= av.unlock; }
const MUZZLES = { cannon: [95, 41], sniper: [99, 40], gun: [88, 41], bow: [72, 41], shield: [70, 43], wand: [66, 33] };   // projectile origin, sprite units
const SPRITE_ANCHOR = [31, 41];                                                          // hitbox centre (chest)

// ------------------------------------------------------------ SVG
const OL = "#141030";
const st = (w = 1.4) => `stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); return "#" + [n >> 16, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join(""); };
function defs(a, p) {
  const [b, l, d] = a.hc, [m, , acc, trim] = a.out;
  return `<defs>
<linearGradient id="${p}h" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${l}"/><stop offset=".4" stop-color="${b}"/><stop offset="1" stop-color="${d}"/></linearGradient>
<linearGradient id="${p}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(a.skin, 0.12)}"/><stop offset="1" stop-color="${shade(a.skin, -0.08)}"/></linearGradient>
<linearGradient id="${p}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(m, 0.25)}"/><stop offset=".55" stop-color="${m}"/><stop offset="1" stop-color="${shade(m, -0.35)}"/></linearGradient>
<linearGradient id="${p}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(trim, 0.35)}"/><stop offset="1" stop-color="${shade(trim, -0.25)}"/></linearGradient>
<linearGradient id="${p}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(a.wc[0], 0.3)}"/><stop offset=".5" stop-color="${a.wc[0]}"/><stop offset="1" stop-color="${shade(a.wc[0], -0.3)}"/></linearGradient>
<radialGradient id="${p}e" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="${shade(a.eye, 0.55)}"/><stop offset=".55" stop-color="${a.eye}"/><stop offset="1" stop-color="${shade(a.eye, -0.55)}"/></radialGradient>
<radialGradient id="${p}c"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="${a.shot[0]}"/><stop offset="1" stop-color="${a.shot[0]}" stop-opacity="0"/></radialGradient>
</defs>`;
}
function hairBack(a, p) {
  const f = `fill="url(#${p}h)" ${st()}`, l = a.hc[1];
  switch (a.hair) {
    case "sidetail": return `<path d="M22 10 Q8 8 4 20 Q1 31 7 39 Q9 30 13 26 Q18 18 26 15 Z" ${f}/><path d="M18 13 Q9 18 7 28" fill="none" stroke="${l}" stroke-width="1.5" stroke-linecap="round" opacity=".9"/>`;
    case "twintail": return `<path d="M20 13 Q6 16 5 31 Q6 40 11 45 Q10 33 17 24 Z" ${f}/><path d="M42 12 Q54 16 53 31 Q52 38 48 42 Q48 30 42 23 Z" ${f}/><path d="M15 17 Q8 25 8 35" fill="none" stroke="${l}" stroke-width="1.4" stroke-linecap="round"/>`;
    case "bob": return `<path d="M17 22 Q15 6 31 5 Q47 6 46 22 L46 33 Q41 31 39 28 L24 28 Q21 32 16 33 Z" ${f}/>`;
    case "long": return `<path d="M18 18 Q14 6 31 5 Q46 6 46 20 Q47 34 42 44 Q34 42 26 47 Q20 46 14 49 Q4 46 0 40 Q8 38 10 32 Q12 24 18 18 Z" ${f}/><path d="M20 28 Q14 36 6 41 M24 34 Q20 40 16 46" fill="none" stroke="${l}" stroke-width="1.3" stroke-linecap="round" opacity=".85"/>`;
    case "wavy": return `<path d="M18 18 Q14 6 31 5 Q46 6 46 20 Q48 30 44 38 Q46 44 40 47 Q34 44 30 48 Q24 45 18 48 Q12 44 14 38 Q8 34 12 28 Q12 22 18 18 Z" ${f}/><path d="M18 30 Q14 36 18 42 M42 30 Q46 36 42 42" fill="none" stroke="${l}" stroke-width="1.2" stroke-linecap="round"/>`;
    case "spiky": return `<path d="M17 21 L10 12 L19 13 L16 3 L26 10 L31 1 L35 10 L44 4 L42 14 L51 13 L45 22 Z" ${f}/>`;
    case "bun": return `<circle cx="22" cy="7" r="6.5" ${f}/><path d="M18 5 Q21 2 25 4" fill="none" stroke="${l}" stroke-width="1.3"/>`;
    case "braid": { let s = ""; for (let i = 0; i < 6; i++) s += `<ellipse cx="${19 - i * 2.6}" cy="${26 + i * 4.2}" rx="3.7" ry="3.1" fill="url(#${p}h)" ${st(1.2)}/>`; return s + `<path d="M5 50 L3 54 L8 53 Z" fill="${a.out[2]}" ${st(1)}/>`; }
    case "wolf": return `<path d="M17 20 Q15 6 31 5 Q47 6 46 21 L49 31 L43 27 L44 35 L38 29 L24 29 L19 35 L19 28 L13 31 Z" ${f}/>`;
    case "hood": return `<path d="M14 24 Q12 3 31 2 Q50 3 48 24 L48 35 Q31 39 14 35 Z" fill="url(#${p}m)" ${st()}/><path d="M18 7 Q31 1 44 7" fill="none" stroke="url(#${p}g)" stroke-width="1.8"/>`;
    case "cap": return `<path d="M18 22 Q16 8 31 7 Q46 8 45 22 L45 29 L18 29 Z" ${f}/>`;
  }
  return "";
}
function bangs(a, p) {
  const f = `fill="url(#${p}h)" ${st(1.3)}`, l = a.hc[1];
  if (a.hair === "cap") return `<path d="M17 17 Q17 5 31 4 Q44 5 45 15 Z" fill="${a.out[2]}" ${st(1.3)}/><path d="M38 14 Q50 13 56 17 Q47 19.5 38 18.5 Z" fill="${a.out[3]}" ${st(1.2)}/><path d="M19 17 L22 23 L26 18 L30 23 L33 17 Z" ${f}/><circle cx="30" cy="9.5" r="2.4" fill="${a.out[1]}" ${st(0.8)}/>`;
  if (a.hair === "hood") return `<path d="M20 22 Q21 11 31 10 Q41 11 43 20 L39 16 L36 21 L33 14 L29 20 L26 15 Z" ${f}/>`;
  const shapes = {
    straight: "M18 22 Q17 7 32 6 Q45 7 45 20 L45 22 L41 20 L38 23 L35 20 L31 23 L28 20 L24 23 L21 20 Z",
    spiky: "M18 22 Q17 8 32 6 Q45 7 46 20 L42 17 L41 23 L37 16 L35 22 L31 15 L28 21 L25 15 L23 22 Z",
    parted: "M18 23 Q17 7 32 6 Q45 7 45 21 Q41 14 34 12 Q37 18 36 22 Q31 15 27 13 Q22 16 20 25 Z",
    swept: "M18 22 Q17 7 32 6 Q45 7 45 20 Q42 14 38 13 L37 19 L33 12 Q29 18 24 18 L25 14 Q20 18 20 25 Z" };
  return `<path d="${shapes[a.bangs] || shapes.swept}" ${f}/><path d="M26 9 Q35 7 41 11" fill="none" stroke="${l}" stroke-width="1.6" stroke-linecap="round" opacity=".95"/><path d="M38 8.5 Q42 10 44 14" fill="none" stroke="#ffffff" stroke-width=".9" stroke-linecap="round" opacity=".55"/>`;
}
function accessory(a, p) {
  const acc = a.out[2];
  switch (a.acc) {
    case "clip": return `<circle cx="21" cy="10" r="2.8" fill="${a.shot[0]}" ${st(1.1)}/><circle cx="20.2" cy="9.2" r=".9" fill="#fff"/>`;
    case "star": return `<path d="M21 5 L22.7 9 L27 9.4 L23.8 12 L24.7 16.2 L21 14 L17.3 16.2 L18.2 12 L15 9.4 L19.3 9 Z" fill="url(#${p}g)" ${st(0.9)}/>`;
    case "goggles": return `<rect x="22" y="8.6" width="22" height="5" rx="2.5" fill="${OL}"/><circle cx="29" cy="11.1" r="3.5" fill="${a.shot[0]}" ${st(1.1)}/><circle cx="38" cy="11.1" r="3.5" fill="${a.shot[0]}" ${st(1.1)}/><circle cx="28" cy="10" r="1.1" fill="#fff"/><circle cx="37" cy="10" r="1.1" fill="#fff"/>`;
    case "earpiece": return `<path d="M43 18 L49 15 L50 23 L44 25 Z" fill="${a.out[0]}" ${st(1.1)}/><line x1="45" y1="19" x2="48" y2="18" stroke="${acc}" stroke-width="1.6" stroke-linecap="round"/>`;
    case "flower": return `<g transform="translate(20 10)">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="0" cy="-2.7" rx="1.8" ry="2.7" fill="#ffb3d9" transform="rotate(${r})" ${st(0.7)}/>`).join("")}<circle r="1.6" fill="#ffd34f"/></g>`;
    case "scarf": return `<path d="M25 34 Q31 37 38 34 L38 38 Q31 40 25 38 Z" fill="${acc}" ${st(1.1)}/><path d="M26 37 Q15 39 4 34 Q12 43 25 40 Z" fill="${acc}" ${st(1.1)}/>`;
    case "bunny": return `<path d="M26 8 Q20 -6 24 -8 Q30 -6 30 7 Z" fill="${a.hc[0]}" ${st(1.2)}/><path d="M34 7 Q36 -7 40 -6 Q44 -2 38 9 Z" fill="${a.hc[0]}" ${st(1.2)}/><path d="M26 4 Q24 -3 25 -5 M37 4 Q39 -3 40 -3" stroke="#ffb3d9" stroke-width="1.6" fill="none"/>`;
    case "visor": return `<path d="M30 21 L46 21 L45 27 L31 27 Z" fill="${a.shot[0]}" fill-opacity=".55" ${st(1.1)}/><path d="M32 22 L43 22" stroke="#fff" stroke-width=".8" opacity=".7"/>`;
    case "halo": return `<ellipse cx="32" cy="1.5" rx="9.5" ry="2.6" fill="none" stroke="url(#${p}g)" stroke-width="2.2"/>`;
    case "antenna": return `<path d="M36 6 L40 -2" ${st(1.4)} fill="none"/><circle cx="40" cy="-2" r="2.3" fill="${acc}" ${st(1)}/>`;
    case "glasses": return `<circle cx="34" cy="25" r="4" fill="none" stroke="${OL}" stroke-width="1.3"/><circle cx="41.5" cy="25" r="3.6" fill="none" stroke="${OL}" stroke-width="1.3"/>`;
    case "feather": return `<path d="M20 12 Q12 4 10 -2 Q18 2 22 10 Z" fill="${acc}" ${st(1)}/>`;
    case "catears": return `<path d="M22 9 L21 -1 L29 5 Z M37 5 L44 -1 L43 9 Z" fill="${a.hc[0]}" ${st(1.2)}/><path d="M23 6 L22.5 2 L26 4.5 Z M40 4.5 L42.5 2 L42 6 Z" fill="#ff9ad5"/>`;
    case "capHat": return `<path d="M17 16 Q17 4 31 3 Q44 4 45 14 Z" fill="${a.out[2]}" ${st(1.3)}/><path d="M38 13 Q50 12 56 16 Q47 18.5 38 17.5 Z" fill="${a.out[0]}" ${st(1.2)}/><circle cx="30" cy="8.5" r="2.2" fill="${a.out[1]}" ${st(0.7)}/>`;
    case "headband": return `<path d="M18.5 15 Q31 9 45 13.5 L45 17 Q31 12.6 18.5 18.6 Z" fill="${a.out[2]}" ${st(1)}/><path d="M18 17 Q12 20 8 26 Q14 22 19 20 Z" fill="${a.out[2]}" ${st(0.9)}/>`;
    case "crown": return `<path d="M21 9 L23 1 L27 6 L31 -1 L35 6 L39 1 L41 9 Z" fill="#ffd34f" ${st(1.1)}/><path d="M23 7 L39 7" stroke="#fff4b8" stroke-width="1" opacity=".8"/><circle cx="31" cy="4" r="1.4" fill="${a.shot[0]}"/>`;
    case "wingclip": return `<path d="M20 9 Q14 4 10 6 Q14 8 15 11 Q11 11 9 14 Q14 14 18 13 Z" fill="url(#${p}g)" ${st(0.9)}/><circle cx="20" cy="11" r="2" fill="${a.shot[0]}" ${st(0.8)}/>`;
    case "witchhat": return `<path d="M17 12 Q31 6 46 11 Q40 4 36 -6 Q34 -9 30 -8 Q26 -2 22 4 Z" fill="${a.out[0]}" ${st(1.2)}/><path d="M17 12 Q31 6 46 11" fill="none" stroke="url(#${p}g)" stroke-width="2"/><path d="M33 -2 L34.2 0.6 L37 1 L35 2.8 L35.6 5.6 L33 4.2 L30.4 5.6 L31 2.8 L29 1 L31.8 .6 Z" fill="${a.shot[0]}"/>`;
    case "headphones": return `<path d="M18 20 Q18 4 32 4 Q45 4 45 18" fill="none" stroke="${OL}" stroke-width="3"/><path d="M18 20 Q18 4 32 4 Q45 4 45 18" fill="none" stroke="${a.out[2]}" stroke-width="1.6"/><rect x="42" y="16" width="6" height="9" rx="2.5" fill="${a.out[1]}" ${st(1)}/>`;
    case "leafcrown": return [0, 1, 2, 3].map((i) => `<path d="M${22 + i * 5} ${8 - (i % 2) * 2} q2 -5 5 -3 q-1 4 -5 3 Z" fill="${a.out[2]}" ${st(0.7)}/>`).join("");
    case "scope": return `<path d="M30 20.6 L44 20.6 L44 23 L30 23 Z" fill="${OL}"/><circle cx="41" cy="25" r="3.4" fill="none" stroke="${a.out[2]}" stroke-width="1.4"/>`;
    case "horns": return `<path d="M24 8 Q20 0 24 -3 Q25 3 28 6 Z M38 6 Q42 0 40 -4 Q44 2 42 8 Z" fill="url(#${p}g)" ${st(1.1)}/>`;
  }
  return "";
}
function eyes(a, p, frame) {
  if (frame === "hurt") return `<path d="M31 23 L35 25.5 L31 28 M43 23 L39 25.5 L43 28" fill="none" stroke="${OL}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 31 Q38.5 29.5 41 31" fill="none" stroke="#c4485e" stroke-width="1.3" stroke-linecap="round"/>`;
  return `<ellipse cx="33.6" cy="25" rx="2.6" ry="3.4" fill="#ffffff"/><ellipse cx="40.6" cy="25" rx="2.4" ry="3.4" fill="#ffffff"/>
<ellipse cx="33.9" cy="25.3" rx="2.2" ry="3.1" fill="url(#${p}e)"/><ellipse cx="40.8" cy="25.3" rx="2" ry="3.1" fill="url(#${p}e)"/>
<ellipse cx="34.1" cy="26" rx="1" ry="1.5" fill="${OL}"/><ellipse cx="41" cy="26" rx=".9" ry="1.5" fill="${OL}"/>
<circle cx="33" cy="23.8" r="1.05" fill="#fff"/><circle cx="40" cy="23.8" r="1" fill="#fff"/><circle cx="34.8" cy="27.3" r=".5" fill="#fff"/><circle cx="41.6" cy="27.3" r=".45" fill="#fff"/>
<path d="M30.8 21.8 Q33.6 20.2 36.4 21.6 M38.2 21.6 Q40.8 20.2 43.2 22" fill="none" stroke="${OL}" stroke-width="1.35" stroke-linecap="round"/>
<path d="M31.4 19.4 Q33.6 18.6 35.6 19.4 M38.8 19.2 Q41 18.6 42.8 19.6" fill="none" stroke="${a.hc[2]}" stroke-width=".9" stroke-linecap="round"/>
<path d="M36.6 30 Q38.6 31.9 41.2 29.6" fill="none" stroke="#c4485e" stroke-width="1.25" stroke-linecap="round"/>`;
}
function weapon(a, p, frame) {
  const [b, d, acc] = a.wc, W = `fill="url(#${p}w)" ${st(1.3)}`, D = `fill="${d}" ${st(1.1)}`, G = `fill="url(#${p}g)" ${st(1)}`, sh = a.shot[0];
  if (a.cat === "cannon") return `
<path d="M31 35.6 L44 34.4 L46 47 L33 47.6 Q29 42 31 35.6 Z" ${D}/>
<path d="M42 36 L86 37.2 L92 35.4 L95.4 41 L92 46.6 L86 44.8 L42 46 Z" ${W}/>
<path d="M45 38.2 L85 39" stroke="#ffffff" stroke-width="1" opacity=".55"/>
<rect x="58" y="35.6" width="4" height="10.6" rx="1.3" ${G}/><rect x="72" y="36.2" width="3.6" height="9.6" rx="1.2" ${G}/>
<path d="M85 34.2 L93 31.4 L97 41 L93 50.6 L85 47.8 L88 41 Z" ${G}/>
<circle cx="38" cy="42" r="5.4" fill="url(#${p}c)"/><circle cx="38" cy="42" r="2.8" fill="${sh}" ${st(0.9)}/>
<path d="M64 41 L84 41" stroke="${sh}" stroke-width="1.2" opacity=".85"/>`;
  if (a.cat === "shield") return `
<path d="M50 28 L66 30 Q70 42 66 54 L50 58 Q44 43 50 28 Z" ${W}/>
<path d="M52 31 L64 32.6 Q67.4 42 64 51.6 L52 54.6 Q47.6 43 52 31 Z" fill="none" stroke="url(#${p}g)" stroke-width="1.6"/>
<path d="M57 34 L58.4 43 L57 52 M51 43 L66 43" stroke="${d}" stroke-width="1.4" fill="none" opacity=".7"/>
<path d="M50 28 L54 22 L58 29 Z M50 58 L54 64 L58 57 Z" fill="url(#${p}g)" ${st(1)}/>
<circle cx="58" cy="43" r="5" fill="url(#${p}c)"/><circle cx="58" cy="43" r="3" fill="${sh}" ${st(1)}/>
<path d="M64 41 L70 42 L70 44 L64 45 Z" fill="${d}" ${st(0.9)}/>
<path d="M53 32 Q56 31 59 32.4" stroke="#ffffff" stroke-width="1.2" opacity=".75" fill="none"/>`;
  if (a.cat === "wand") return `
<path d="M45 45 L62 35" stroke="${OL}" stroke-width="3.4" stroke-linecap="round"/><path d="M45 45 L62 35" stroke="url(#${p}w)" stroke-width="2" stroke-linecap="round"/>
<path d="M49 42.6 L52 40.8" stroke="url(#${p}g)" stroke-width="2.6" stroke-linecap="round"/>
<circle cx="64" cy="34" r="6" fill="url(#${p}c)"/>
<path d="M64 28.6 L65.6 32.4 L69.4 33 L66.4 35.4 L67.2 39.2 L64 37 L60.8 39.2 L61.6 35.4 L58.6 33 L62.4 32.4 Z" fill="${sh}" ${st(0.9)}/>
<circle cx="68" cy="29" r=".9" fill="#fff"/><circle cx="59" cy="30" r=".7" fill="#fff"/>`;
  if (a.cat === "sniper") return `
<path d="M27 37.6 L38 36.4 L40 42.4 L29 44.4 Q26 41 27 37.6 Z" ${D}/>
<path d="M37 36.6 L66 36.2 L68 42.2 L38 43 Z" ${W}/>
<path d="M66 38.4 L96 39.2 L96 41 L66 41.8 Z" ${D}/><rect x="94" y="37.6" width="5.4" height="5" rx="1" ${G}/>
<path d="M45 30.6 L63 30.6 L64 34.6 L44.6 34.6 Z" ${D}/><circle cx="63.6" cy="32.6" r="2" fill="${sh}" ${st(0.8)}/><circle cx="63.2" cy="32" r=".6" fill="#fff"/>
<rect x="49" y="34.4" width="2.4" height="2.2" ${G}/><rect x="57" y="34.4" width="2.4" height="2.2" ${G}/>
<rect x="47" y="38" width="13" height="2.8" rx="1.2" fill="${sh}"/><path d="M47 38.2 L60 38.2" stroke="#fff" stroke-width=".6"/>`;
  if (a.cat === "gun") return `
<path d="M38 35.6 L76 35 L78.6 41.4 L40 43 Z" ${W}/>
<path d="M76 37.6 L86.4 38 L86.4 41 L76 41.4 Z" ${D}/><rect x="85" y="37" width="3.8" height="5" rx="1" ${G}/>
<path d="M52 42.4 L59 42.2 L57.4 50 L50.6 49.2 Z" ${D}/>
<path d="M42 37.6 L74 37" stroke="${sh}" stroke-width="1.4"/><path d="M58 32.6 L68 32.4 L68 35.2 L58 35.4 Z" ${G}/>`;
  const drawn = frame !== "fire";
  return `
<path d="M62 22 Q72 30 67 41 Q72 52 62 60" fill="none" stroke="${OL}" stroke-width="4.2" stroke-linecap="round"/>
<path d="M62 22 Q72 30 67 41 Q72 52 62 60" fill="none" stroke="url(#${p}w)" stroke-width="2.8" stroke-linecap="round"/>
<path d="M63.4 24.4 Q70 30 68.4 36 M63.4 57.6 Q70 52 68.4 46" stroke="url(#${p}g)" stroke-width="1" fill="none"/>
<path d="M60.6 20 L64 23.4 L61.4 24.4 Z M60.6 62 L64 58.6 L61.4 57.6 Z" fill="url(#${p}g)"/>
<circle cx="67.4" cy="41" r="2.2" fill="${sh}" ${st(0.8)}/>
${drawn ? `<path d="M62 22 L44 41 L62 60" stroke="#f6f2ff" stroke-width=".8" fill="none"/>
<path d="M44 41 L72 41" stroke="${d}" stroke-width="1.4"/><path d="M70.6 38.8 L76 41 L70.6 43.2 Z" fill="${sh}" ${st(0.6)}/>
<path d="M44.6 41 L41 38.8 L43.4 41 L41 43.2 Z" fill="${acc}"/><path d="M48 41 L70 41" stroke="${sh}" stroke-width=".7" opacity=".85"/>`
    : `<path d="M62 22 Q63.8 41 62 60" stroke="#f6f2ff" stroke-width=".8" fill="none"/>`}`;
}
function hands(a) { return { cannon: [44, 46], sniper: [42, 43], gun: [46, 44], bow: [66, 41], shield: [52, 46], wand: [46, 44] }[a.cat]; }

function avatarSVG(a, frame = "idle", view = "game") {
  const p = a.id + frame[0] + view[0], [m, inner, acc, trim] = a.out, sh = a.shot[0];
  const thr = frame === "fire" ? 5 : 4;
  const flow = a.hair === "long" || a.hair === "sidetail" || a.hair === "twintail" || a.hair === "wolf" ? `<path d="M18 14 Q2 12 -1 22 Q4 20 8 24 Q0 28 -2 36 Q6 31 12 32 Q8 38 9 44 Q14 34 20 26 Z" fill="url(#${p}h)" ${st(1.2)}/><path d="M14 16 Q4 18 2 24 M12 26 Q5 30 3 34" fill="none" stroke="${a.hc[1]}" stroke-width="1.3" stroke-linecap="round"/>` : "";
  const boardKind = a.board || "glider";
  const skate = `<path d="M14 58 Q12 54 18 54 L50 53.6 Q56 53.6 56 57 Q55 60 50 60 L19 60.4 Q14 60.4 14 58 Z" fill="url(#${p}m)" ${st(1.4)}/>
<path d="M19 55.6 L50 55.2" stroke="url(#${p}g)" stroke-width="1.6"/><path d="M24 54 L28 51 L32 54 Z" fill="${a.out[2]}" ${st(0.8)}/>
<ellipse cx="22" cy="62" rx="${frame === "fire" ? 5 : 4}" ry="1.8" fill="url(#${p}c)"/><ellipse cx="48" cy="62" rx="${frame === "fire" ? 5 : 4}" ry="1.8" fill="url(#${p}c)"/>
<circle cx="22" cy="60.6" r="1.6" fill="${sh}" ${st(0.7)}/><circle cx="48" cy="60.6" r="1.6" fill="${sh}" ${st(0.7)}/>`;
  const wingFeet = `<path d="M26 61 l2 4 l2 -4 M33 61 l2 4 l2 -4" stroke="${sh}" stroke-width="1.2" fill="none" opacity=".8"/>`;
  const glider = `<path d="M2 57 Q6 52 16 52 L84 51 Q94 51 98 55 Q92 59 84 59 L14 60 Q5 60 2 57 Z" fill="url(#${p}m)" ${st(1.5)}/>
<path d="M14 53.6 L84 52.9" stroke="url(#${p}g)" stroke-width="1.6"/><path d="M20 57.4 L80 57" stroke="#ffffff" stroke-width=".9" opacity=".45"/>
<path d="M40 52 L46 47 L52 52 Z M62 51.6 L66 48 L70 51.4 Z" fill="url(#${p}g)" ${st(1)}/>
<ellipse cx="2.6" cy="56" rx="${frame === "fire" ? 6 : 4.6}" ry="2.8" fill="url(#${p}c)"/><ellipse cx="2.4" cy="56" rx="2" ry="1.2" fill="#ffffff"/>`;
  const hover = `<path d="M8 57 Q10 53 18 53 L80 52.6 Q90 52.6 92 56 Q88 59.4 80 59.4 L18 59.8 Q10 59.8 8 57 Z" fill="url(#${p}m)" ${st(1.4)}/><path d="M18 56 L80 55.6" stroke="${sh}" stroke-width="1.6"/><ellipse cx="30" cy="62.4" rx="9" ry="1.8" fill="url(#${p}c)"/><ellipse cx="66" cy="62.4" rx="9" ry="1.8" fill="url(#${p}c)"/>`;
  const board = boardKind === "wings" || boardKind === "none" ? wingFeet : boardKind === "skate" ? skate : boardKind === "hover" ? hover : glider;
  const legs = `<ellipse cx="28" cy="${60 + thr / 4}" rx="2.4" ry="${thr / 2 + 1}" fill="${sh}" opacity=".9"/><ellipse cx="35" cy="${60 + thr / 4}" rx="2.4" ry="${thr / 2 + 1}" fill="${sh}" opacity=".9"/>
<path d="M25.5 49 L30.5 49 L30.5 57.5 Q28 59.2 25.5 57.5 Z" fill="${a.boots || `url(#${p}m)`}" ${st(1.3)}/><path d="M32.5 49 L37.5 49 L37.5 57.5 Q35 59.2 32.5 57.5 Z" fill="${a.boots || `url(#${p}m)`}" ${st(1.3)}/>
<rect x="25.5" y="54.4" width="5" height="1.8" fill="url(#${p}g)"/><rect x="32.5" y="54.4" width="5" height="1.8" fill="url(#${p}g)"/>`;
  const torso = `<rect x="24" y="44.6" width="15" height="6" rx="2" fill="${trim}" ${st(1.3)}/>
<path d="M24 35 L39 35 L39.6 46 Q31.5 48.4 23.4 46 Z" fill="url(#${p}m)" ${st(1.4)}/>
<path d="M28.5 36 L34.5 36 L34 44.6 L29 44.6 Z" fill="${inner}"/><path d="M28.5 36 L31.5 39.4 L34.5 36" fill="none" stroke="${acc}" stroke-width="1.3"/>
<path d="M24 44.6 L39.4 44.6 L39.4 46.6 L24 46.6 Z" fill="url(#${p}g)"/><path d="M30.4 44.2 L33 44.2 L33 47.2 L30.4 47.2 Z" fill="${sh}"/>
<path d="M25 36.4 L27 36.4 L26.4 45 L24.6 44.6 Z" fill="#ffffff" opacity=".22"/>
<path d="M21.6 34 Q24 31.4 28 33.4 L26.4 39 Q22.6 39 21.6 34 Z" fill="url(#${p}m)" ${st(1.2)}/><path d="M22.4 34 Q24.4 32.4 27 33.6" stroke="url(#${p}g)" stroke-width="1" fill="none"/>`;
  const head = `<circle cx="31" cy="21" r="14" fill="${a.hair === "hood" ? `url(#${p}m)` : `url(#${p}h)`}" ${st()}/>
<path d="M21 23 Q21 34 31 35 Q42 34 43 23 Q43 15 33 14 Q22 15 21 23 Z" fill="url(#${p}s)" ${st(1.3)}/>
<path d="M22 22 Q30 19 43 21 L43 23.6 Q31 21.4 22 24.4 Z" fill="${shade(a.skin, -0.12)}" opacity=".55"/>
<ellipse cx="31" cy="29" rx="2" ry="1.1" fill="#f4a7b4" opacity=".7"/><ellipse cx="42.6" cy="29.2" rx="1.3" ry=".9" fill="#f4a7b4" opacity=".6"/>`;
  const sideLock = a.hair === "spiky" || a.hair === "cap" || a.hair === "bun" ? "" : `<path d="M20 20 Q17 28 20 34 Q23 28 23 22 Z" fill="url(#${p}h)" ${st(1.1)}/>`;
  const hx = hands(a);
  const arm = `<path d="M30 37 Q${(30 + hx[0]) / 2} ${hx[1] + 2} ${hx[0] - 2} ${hx[1]}" fill="none" stroke="${OL}" stroke-width="5.4" stroke-linecap="round"/><path d="M30 37 Q${(30 + hx[0]) / 2} ${hx[1] + 2} ${hx[0] - 2} ${hx[1]}" fill="none" stroke="${shade(m, -0.15)}" stroke-width="3.2" stroke-linecap="round"/><circle cx="${hx[0]}" cy="${hx[1]}" r="2.6" fill="url(#${p}s)" ${st(1)}/>`;
  const drawArm = a.cat === "bow" ? `<path d="M33 38 Q${frame === "fire" ? "38 37 40 39" : "40 39 44 41"}" fill="none" stroke="${OL}" stroke-width="5" stroke-linecap="round"/><path d="M33 38 Q${frame === "fire" ? "38 37 40 39" : "40 39 44 41"}" fill="none" stroke="${shade(m, -0.15)}" stroke-width="3" stroke-linecap="round"/><circle cx="${frame === "fire" ? 40 : 44}" cy="${frame === "fire" ? 39 : 41}" r="2.3" fill="url(#${p}s)" ${st(0.9)}/>` : "";
  const [mx, my] = MUZZLES[a.cat];
  const flash = frame === "fire" && a.cat !== "bow" ? (a.heavy ? `<path d="M${mx - 1} ${my} L${mx + 14} ${my - 7} L${mx + 9} ${my} L${mx + 14} ${my + 7} Z" fill="${sh}"/><path d="M${mx + 2} ${my - 5} L${mx + 6} ${my} L${mx + 2} ${my + 5}" stroke="#fff" stroke-width="1" fill="none"/>` : `<path d="M${mx - 1} ${my} L${mx + 9} ${my - 4} L${mx + 6} ${my} L${mx + 9} ${my + 4} Z" fill="${sh}"/>`) + `<circle cx="${mx}" cy="${my}" r="2.6" fill="#ffffff"/>` : "";
  const body = defs(a, p) + flow + hairBack(a, p) + board + legs + torso + head + sideLock + bangs(a, p) + eyes(a, p, frame) + accessory(a, p) + weapon(a, p, frame) + arm + drawArm + flash;
  if (view === "portrait") return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="12 -5 40 40" width="40" height="40"><defs><radialGradient id="${p}bg" cx=".5" cy=".4"><stop offset="0" stop-color="${shade(m, 0.2)}"/><stop offset="1" stop-color="#0b1030"/></radialGradient></defs><rect x="12" y="-5" width="40" height="40" fill="url(#${p}bg)"/><circle cx="16" cy="0" r=".5" fill="#fff"/><circle cx="48" cy="3" r=".4" fill="#fff"/>${body}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 104 70" width="104" height="70">${body}</svg>`;
}

const WING_PIVOT = [24, 36];   // shoulder point the wings flap around (sprite units)
const WING_VB = [-40, -34, 140, 100];   // wider canvas so the full wingspan fits; same units as the body sprite
function wingSVG(a) {
  const p = a.id + "wg", b = a.out[1], acc = a.out[2], O = "#141030";
  const wing = (rot, sc, op) => `<g transform="translate(24 36) rotate(${rot}) scale(${sc}) translate(-26 -36)" opacity="${op}">
<path d="M26 36 C14 26 4 16 -1 2 C5 5 11 6 15 11 C10 11 5 14 2 18 C9 18 14 20 18 24 C11 26 6 30 4 35 C11 34 17 35 22 38 C16 41 12 45 11 50 C17 47 22 44 27 41 Z" fill="url(#${p}f)" stroke="${O}" stroke-width="1.3" stroke-linejoin="round"/>
<path d="M24 34 Q14 24 5 9 M22 31 Q14 24 7 19 M22 36 Q14 33 8 33 M24 39 Q18 43 14 47" stroke="#ffffff" stroke-width="1" fill="none" opacity=".75" stroke-linecap="round"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${WING_VB.join(" ")}" width="${WING_VB[2]}" height="${WING_VB[3]}"><defs><linearGradient id="${p}f" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${acc}"/></linearGradient></defs>
${wing(14, 1.45, 0.75)}${wing(-4, 1.75, 1)}</svg>`;
}
function registerAvatarSprites() {
  for (const a of AVATARS) { for (const f of ["idle", "fire", "hurt"]) SPRITE_SVG[`av_${a.id}_${f}`] = avatarSVG(a, f); SPRITE_SVG[`avw_${a.id}`] = wingSVG(a); }
}
const PORTRAIT_CACHE = {};
function avatarPortrait(id, av) { const a = av || AVATAR_BY_ID[id] || AVATARS[0], k = a.key || a.id; if (!PORTRAIT_CACHE[k]) PORTRAIT_CACHE[k] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(avatarSVG(a, "idle", "portrait")); return PORTRAIT_CACHE[k]; }
// on-demand sprites for customised heroes (resolves once the images are rasterised)
function ensureAvatarSprites(av) {
  const k = av.key || av.id; if (SPR[`av_${k}_idle`]) return Promise.resolve();
  return Promise.all([...["idle", "fire", "hurt"].map((f) => loadOneSprite(`av_${k}_${f}`, avatarSVG(av, f))), loadOneSprite(`avw_${k}`, wingSVG(av))]);
}
function avatarFull(id, frame = "idle") { const a = AVATAR_BY_ID[id] || AVATARS[0]; return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(avatarSVG(a, frame)); }
if (typeof module === "object" && module.exports) module.exports = { effectiveAvatar, SKINS, SKIN_BY_ID, PARTS, SWATCH, BOOT, ULTS, avatarPrice, AVATARS, avatarSVG, wingSVG, AVATAR_BY_ID, avatarUnlocked, MUZZLES, SPRITE_ANCHOR, WEAPON_CATS, WING_PIVOT, WING_VB };
