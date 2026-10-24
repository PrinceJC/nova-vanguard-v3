import json
from sprites import *
S = {}
def add(name, fn, state="idle", **kw):
    S[name] = svg(fn, state, **kw)
add("player", player); add("player_fire", player, "attack")
for n in ["scout_drone","wing_bot","shield_pod","crystal_bat","shard_spinner","gem_crawler","spore_floater","thorn_wasp","vine_sentry","frost_drone","ice_wisp","glacier_guard","void_scout","rift_jumper","eclipse_knight","sand_skimmer","furnace_bot","drill_drone","aqua_drone","electric_jelly","torpedo_bot","spark_bird","storm_drone","lightning_sentry","orbit_drone","gravity_mine","ancient_guardian","manta_turret","orbiter","stone_orbiter"]:
    add(n, globals()[n])
add("glacier_guard_broken", glacier_guard, broken=True)
for b in ["scrap_king","bloomcore","dune_colossus","abyssal_nautilus","tempest_roc","gravemind_sentinel","eclipse_empress"]:
    add(b, globals()[b]); add(b+"_open", globals()[b], "phase")
add("cryo_manta", cryo_manta, turrets=False); add("cryo_manta_open", cryo_manta, "phase", turrets=False)
add("astral_devourer", astral_devourer); add("astral_devourer_2", astral_devourer, "phase"); add("astral_devourer_3", astral_devourer, "phase3")
open("sprites.js","w").write("const SPRITE_SVG = " + json.dumps(S) + ";\n")
print(len(S), sum(len(v) for v in S.values()))
