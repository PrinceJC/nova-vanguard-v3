"use strict";
// ============================================================ worlds
const WORLDS = [
  { name: "Neon Outskirts", minions: ["scout_drone", "wing_bot", "shield_pod"], finale: "scrap_king", obstacle: null,
    pal: { top: "#1b1240", bot: "#3a1d5c", far: "#2a1a52", mid: "#3b2470", near: "#191033", acc: "#ff7ad9", star: "#ffd6f5", metal: ["#7d8496", "#a36b45", "#5e6b52"] }, bg: "city", music: { root: 57, minor: false, bpm: 116 },
    sectors: ["Billboard Row", "Rail Yard", "Arcade Strip", "Signal Tower", "Night Market", "Overpass", "Scrap Lot", "Power Grid", "Skyline Drop", "Crown Junction"],
    prefix: ["Rust", "Neon", "Junk", "Volt", "Bolt", "Chrome", "Grid", "Static", "Pylon"] },
  { name: "Crystal Caverns", minions: ["crystal_bat", "shard_spinner", "gem_crawler"], finale: "prism_serpent", obstacle: "rock",
    pal: { top: "#140d2e", bot: "#2b1650", far: "#24154a", mid: "#3a1f6e", near: "#120a26", acc: "#b48cff", star: "#e2d4ff", metal: ["#6a3fc9", "#9b6bff", "#3d2a6b"] }, bg: "crystal", music: { root: 55, minor: true, bpm: 112 },
    sectors: ["Glimmer Mouth", "Echo Hall", "Geode Garden", "Shard Falls", "Amethyst Vein", "Mirror Lake", "Quartz Spiral", "Hollow Choir", "Prism Depths", "Serpent Throne"],
    prefix: ["Geode", "Quartz", "Facet", "Shard", "Lumen", "Opal", "Prism", "Glint", "Crys"] },
  { name: "Overgrown Reactor", minions: ["spore_floater", "thorn_wasp", "vine_sentry"], finale: "bloomcore", obstacle: "gate",
    pal: { top: "#0e2420", bot: "#1d3d2a", far: "#183428", mid: "#24492f", near: "#0b1a14", acc: "#c9e04a", star: "#e8ffd0", metal: ["#8a8f9e", "#4e9a34", "#5a1f3a"] }, bg: "jungle", music: { root: 52, minor: false, bpm: 120 },
    sectors: ["Mossy Gate", "Coolant Bog", "Root Tunnels", "Spore Vents", "Greenhouse", "Pump Station", "Thorn Maze", "Pollen Storm", "Core Canopy", "Bloom Heart"],
    prefix: ["Moss", "Thorn", "Spore", "Root", "Vine", "Bramble", "Petal", "Sap", "Bloom"] },
  { name: "Frozen Orbit", minions: ["frost_drone", "ice_wisp", "glacier_guard"], finale: "cryo_manta", obstacle: "rock",
    pal: { top: "#0c1a33", bot: "#1e3a5e", far: "#1a3150", mid: "#2b4f78", near: "#0b1526", acc: "#bfe9ff", star: "#ffffff", metal: ["#5f7b99", "#9fc6e6", "#46617f"] }, bg: "ice", music: { root: 50, minor: true, bpm: 108 },
    sectors: ["Frost Ring", "Comet Tail", "Ice Docks", "Polar Relay", "Snow Belt", "Cryo Lab", "Hail Field", "Aurora Arc", "Glacier Gate", "Manta Reach"],
    prefix: ["Frost", "Rime", "Glacier", "Hail", "Cryo", "Sleet", "Polar", "Boreal", "Ice"] },
  { name: "Desert Foundry", minions: ["sand_skimmer", "furnace_bot", "drill_drone"], finale: "dune_colossus", obstacle: "rock",
    pal: { top: "#2b1530", bot: "#6b3a2a", far: "#4a2a2e", mid: "#7a4a30", near: "#2a160e", acc: "#ffb347", star: "#ffe2b8", metal: ["#c9925a", "#7a5a44", "#b0703a"] }, bg: "desert", music: { root: 53, minor: false, bpm: 124 },
    sectors: ["Dust Road", "Smelter Row", "Mirage Flats", "Slag Pits", "Dune Sea", "Kiln Works", "Sandstorm", "Ore Lift", "Furnace Gate", "Colossus Bay"],
    prefix: ["Dune", "Slag", "Kiln", "Ember", "Cinder", "Mirage", "Ore", "Scorch", "Sand"] },
  { name: "Sunken Circuit", minions: ["aqua_drone", "electric_jelly", "torpedo_bot"], finale: "abyssal_nautilus", obstacle: "well",
    pal: { top: "#061a2a", bot: "#0f3448", far: "#0e2c40", mid: "#164258", near: "#04121c", acc: "#7fe0c8", star: "#c9fff3", metal: ["#46617f", "#c9b28f", "#3d6f8f"] }, bg: "sea", music: { root: 48, minor: true, bpm: 104 },
    sectors: ["Tide Pools", "Cable Trench", "Kelp Server", "Bubble Vault", "Pressure Line", "Coral Bus", "Whirl Gate", "Deep Relay", "Abyss Rim", "Nautilus Den"],
    prefix: ["Tide", "Coral", "Abyss", "Brine", "Kelp", "Reef", "Surge", "Deep", "Hydro"] },
  { name: "Thunder Heights", minions: ["spark_bird", "storm_drone", "lightning_sentry"], finale: "tempest_roc", obstacle: "gate",
    pal: { top: "#141634", bot: "#323a66", far: "#252a52", mid: "#3a426e", near: "#10122a", acc: "#ffd34f", star: "#fff3c4", metal: ["#3d4a7a", "#4a5a92", "#8d93a8"] }, bg: "storm", music: { root: 54, minor: true, bpm: 128 },
    sectors: ["Cloud Steps", "Rod Forest", "Gale Pass", "Thunderhead", "Spark Nest", "Static Cliffs", "Storm Eye", "Bolt Ridge", "Sky Anvil", "Roc Summit"],
    prefix: ["Storm", "Gale", "Volt", "Thunder", "Squall", "Arc", "Tempest", "Zap", "Nimbus"] },
  { name: "Gravity Ruins", minions: ["orbit_drone", "gravity_mine", "ancient_guardian"], finale: "gravemind_sentinel", obstacle: "well",
    pal: { top: "#17142a", bot: "#2e2a3e", far: "#26223a", mid: "#3d3650", near: "#100e1c", acc: "#b48cff", star: "#efe6ff", metal: ["#8b8370", "#6b5b95", "#9a8f7a"] }, bg: "ruins", music: { root: 49, minor: true, bpm: 100 },
    sectors: ["Fallen Arch", "Floating Steps", "Rune Plaza", "Orbit Garden", "Silent Hall", "Pull Chamber", "Monolith Row", "Warp Stair", "Sentinel Gate", "Gravemind Vault"],
    prefix: ["Rune", "Grave", "Monolith", "Orbit", "Relic", "Obelisk", "Ward", "Echo", "Tomb"] },
  { name: "Eclipse Fortress", minions: ["void_scout", "rift_jumper", "eclipse_knight"], finale: "eclipse_empress", obstacle: "gate",
    pal: { top: "#0e0818", bot: "#2a0f2e", far: "#1e0f2a", mid: "#341640", near: "#0a0510", acc: "#ff3fb4", star: "#ffd1ec", metal: ["#3a2a5c", "#5a4682", "#2b2140"] }, bg: "fortress", music: { root: 51, minor: true, bpm: 132 },
    sectors: ["Outer Wall", "Shadow Moat", "Rift Barracks", "Banner Hall", "Void Armory", "Knight Court", "Dusk Spire", "Mirror Keep", "Crown Bridge", "Empress Throne"],
    prefix: ["Void", "Dusk", "Rift", "Umbra", "Eclipse", "Shade", "Night", "Gloom", "Penumbra"] },
  { name: "Celestial Core", minions: ["void_scout", "ice_wisp", "ancient_guardian"], finale: "astral_devourer", obstacle: "mix",
    pal: { top: "#0a0a22", bot: "#241a4a", far: "#1a1640", mid: "#2e2464", near: "#08081a", acc: "#e0b84a", star: "#fff2b0", metal: ["#2b2650", "#5a5080", "#1a1638"] }, bg: "cosmos", music: { root: 57, minor: true, bpm: 136 },
    sectors: ["Star Gate", "Nebula Drift", "Comet Forge", "Halo Ring", "Pulsar Field", "Gravity Lens", "Nova Garden", "Event Rim", "Singularity", "Devourer Core"],
    prefix: ["Astral", "Nova", "Pulsar", "Quasar", "Stellar", "Cosmic", "Zenith", "Nebula", "Solar"] },
];
const NOUNS = ["Warden", "Bastion", "Hydra", "Sentinel", "Tyrant", "Leviathan", "Golem", "Harrier", "Matriarch", "Behemoth", "Reaver", "Overseer", "Colossus", "Phantom", "Juggernaut", "Wyrm", "Marauder", "Monarch", "Titan", "Herald"];
const TOTAL_LEVELS = 100;

function lrng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ============================================================ boss designer (90 unique procedural bosses + 10 world finales)
const ATTACK_UNLOCK = { aimed: 1, fan: 1, ring: 3, stream: 5, summon: 8, wall: 10, spiral: 12, beams: 15, strikes: 18, lasers: 22, torpedo: 25, dive: 30, gravity: 35, teleport: 40 };
const MOVES_UNLOCK = { bob: 1, sweep: 1, figure8: 6, drift: 11, strafe: 21, orbit: 31 };
const HULLS = ["oval", "hex", "diamond", "crescent", "tri", "disc"];
const WINGS = ["none", "swept", "blades", "fins", "petals", "rings"];
const DECOR = ["crown", "horns", "antenna", "fin", "spikes", "halo"];
let BOSS_CATALOG = null;

function buildCatalog() {
  const used = new Set(), names = new Set(), cat = {};
  for (let n = 1; n <= TOTAL_LEVELS; n++) {
    const w = Math.ceil(n / 10), i = (n - 1) % 10 + 1;
    if (i === 10) { cat[n] = { finale: WORLDS[w - 1].finale }; continue; }
    let k = 0, spec;
    do { spec = designBoss(n, w, k++); } while ((used.has(spec.sig) || names.has(spec.name)) && k < 200);
    used.add(spec.sig); names.add(spec.name); cat[n] = spec;
  }
  return cat;
}
function designBoss(n, w, salt) {
  const r = lrng(n * 7919 + salt * 104729 + 17);
  const pickK = (obj) => { const ks = Object.keys(obj).filter((k) => obj[k] <= n); return ks[Math.floor(r() * ks.length)]; };
  const avail = Object.keys(ATTACK_UNLOCK).filter((k) => ATTACK_UNLOCK[k] <= n);
  const newest = avail.filter((k) => ATTACK_UNLOCK[k] > n - 12);
  const count = n < 10 ? 2 : n < 40 ? 3 : 4;
  const attacks = [];
  if (newest.length && r() < 0.7) attacks.push(newest[Math.floor(r() * newest.length)]); // feature a recently unlocked mechanic
  while (attacks.length < count) { const a = avail[Math.floor(r() * avail.length)]; if (!attacks.includes(a)) attacks.push(a); }
  const parts = n >= 26 && r() < 0.35 ? "orbiters" : n >= 14 && r() < 0.35 ? "turrets" : "none";
  const weak = parts !== "none" && r() < 0.5 ? "parts" : r() < 0.55 ? "cycle" : "core";
  const move = pickK(MOVES_UNLOCK);
  const hull = HULLS[Math.floor(r() * HULLS.length)], wings = WINGS[Math.floor(r() * WINGS.length)], decor = DECOR[Math.floor(r() * DECOR.length)];
  const cannons = 1 + Math.floor(r() * 3);
  const W_ = WORLDS[w - 1];
  const name = W_.prefix[Math.floor(r() * W_.prefix.length)] + " " + NOUNS[Math.floor(r() * NOUNS.length)];
  const sig = [attacks.slice().sort().join("+"), move, parts, weak, hull, wings].join("|");
  return {
    id: "proc" + n, n, w, name, attacks, parts, weak, move, hull, wings, decor, cannons, sig,
    size: Math.round(170 + Math.min(50, n * 0.5) + r() * 20),
    hp: Math.round(150 + n * 3.4),
    phases: n >= 50 ? [0.6, 0.3] : [0.5],
    hue: r(), speed: 0.9 + r() * 0.3,
  };
}
function bossSpec(n) { if (!BOSS_CATALOG) BOSS_CATALOG = buildCatalog(); return BOSS_CATALOG[n]; }

// ============================================================ levels
function getLevel(n) {
  n = Math.max(1, Math.min(TOTAL_LEVELS, n | 0));
  const w = Math.ceil(n / 10), i = (n - 1) % 10 + 1, W_ = WORLDS[w - 1];
  return { n, w, i, world: W_, name: W_.sectors[i - 1], title: `${w}-${i} ${W_.sectors[i - 1]}`, pal: W_.pal, bg: W_.bg, music: W_.music, boss: bossSpec(n) };
}

function buildCampaignWaves(n) {
  const L = getLevel(n), w = L.w, i = L.i, r = lrng(n * 31337 + 5);
  const [a, b, c] = L.world.minions;
  const guestsAll = WORLDS.slice(0, w - 1).flatMap((x) => x.minions).filter((m) => m !== "gravity_mine" || w >= 8);
  const guests = [];
  const nGuests = w === 1 ? 0 : i >= 7 ? 2 : i >= 4 ? 1 : 0;
  while (guests.length < Math.min(nGuests, guestsAll.length)) { const g = guestsAll[Math.floor(r() * guestsAll.length)]; if (!guests.includes(g)) guests.push(g); }
  if (w === 10) { while (guests.length < 3) { const g = guestsAll[Math.floor(r() * guestsAll.length)]; if (!guests.includes(g)) guests.push(g); } }
  const k = Math.floor((w - 1) / 3) + (i >= 6 ? 1 : 0);
  const G = (x) => guests[x % Math.max(1, guests.length)] || a;
  const T = [
    [[a, 3 + k, "line"]],
    [[i >= 5 ? b : a, 3 + k, "column"]],
    [[b, 3 + k, "line"]],
    [[b, 3 + k, "column"], [a, 2, "line"]],
    [[c, 1, "single"]],
    [[a, 3 + k, "v"], [c, 1, "single"]],
    [[guests.length ? G(0) : b, 3 + k, "line"]],
    [[a, 3 + k, "column"], [b, 3, "line"]],
    [[c, 2, "column"], [guests.length ? G(1) : b, 2 + k, "line"]],
    [[a, 3 + k, "v"], [b, 3, "line"], [c, 1, "single"]],
    [[b, 4 + k, "column"], [c, 2, "column"]],
    [[guests.length ? G(2) : a, 3 + k, "line"], [b, 3 + k, "line"], [c, 2, "column"]],
  ];
  // rotate the middle of the list so levels inside a world don't all play the same opening
  const mid = T.slice(2, 11); const rot = (i * 3) % mid.length; const order = [T[0], T[1], ...mid.slice(rot), ...mid.slice(0, rot), T[11]];
  // obstacles: world obstacle from level 3 of each world (never in world 1)
  const obs = L.world.obstacle === "mix" ? ["rock", "gate", "well"][i % 3] : L.world.obstacle;
  if (obs && i >= 3) { [3, 7, 10].forEach((ix, j) => { if (i >= 3 + j * 2) order[ix] = order[ix].concat([["obs:" + obs, 1 + (i >= 8 ? 1 : 0), "single"]]); }); }
  return order.map((groups, ix) => ({ groups, dur: 6.2 + groups.length * 0.9 + (ix === 3 || ix === 7 || ix === 10 ? 1.5 : 0), elite: ix === 3 || ix === 7 || ix === 10 }));
}
if (typeof module === "object" && module.exports) module.exports = { WORLDS, getLevel, buildCampaignWaves, bossSpec, TOTAL_LEVELS, buildCatalog };
