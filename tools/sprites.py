O = "#1a1030"   # outline
SW = 1.6        # base stroke for small sprites

def s(w=SW):
    return f'stroke="{O}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"'

def star(cx, cy, r, fill):
    return (f'<path d="M{cx} {cy-r} L{cx+r*.3} {cy-r*.3} L{cx+r} {cy} L{cx+r*.3} {cy+r*.3} '
            f'L{cx} {cy+r} L{cx-r*.3} {cy+r*.3} L{cx-r} {cy} L{cx-r*.3} {cy-r*.3} Z" fill="{fill}"/>')

# ---------------------------------------------------------------- PLAYER
def player(state="idle"):
    thr = 4 if state != "attack" else 5
    g = f'''
<path d="M22 10 Q8 8 5 20 Q3 30 8 37 Q10 29 14 25 Q19 18 26 15 Z" fill="#c9bde8" {s()}/>
<path d="M18 13 Q10 17 8 27" fill="none" stroke="#ece6fa" stroke-width="1.6" stroke-linecap="round"/>
<ellipse cx="28" cy="{60+thr/4}" rx="2.4" ry="{thr/2+1}" fill="#5ef2f2"/>
<ellipse cx="35" cy="{60+thr/4}" rx="2.4" ry="{thr/2+1}" fill="#5ef2f2"/>
<rect x="25.5" y="50" width="5" height="9" rx="1.5" fill="#1f2a5c" {s()}/>
<rect x="32.5" y="50" width="5" height="9" rx="1.5" fill="#1f2a5c" {s()}/>
<rect x="25.5" y="56" width="5" height="2" fill="#8b5cf6"/>
<rect x="32.5" y="56" width="5" height="2" fill="#8b5cf6"/>
<rect x="24" y="45" width="15" height="6" rx="2" fill="#1f2a5c" {s()}/>
<rect x="24" y="35" width="15" height="12" rx="3" fill="#1f2a5c" {s()}/>
<rect x="28.5" y="36" width="6" height="9" rx="1" fill="#eef1fb"/>
<rect x="24" y="45" width="15" height="2.4" fill="#4a3b6b"/>
<rect x="30.4" y="44.6" width="2.6" height="3" fill="#5ef2f2"/>
<circle cx="31" cy="21" r="14" fill="#c9bde8" {s()}/>
<path d="M21 23 Q21 34 31 35 Q42 34 43 23 Q43 15 33 14 Q22 15 21 23 Z" fill="#f6dcc8" {s(1.3)}/>
<path d="M18 22 Q17 7 32 6 Q45 7 45 20 Q42 14 38 13 L37 19 L33 12 Q29 18 24 18 L25 14 Q20 18 20 25 Z" fill="#c9bde8" {s(1.3)}/>
<path d="M27 9 Q35 7 40 11" fill="none" stroke="#ece6fa" stroke-width="1.4" stroke-linecap="round"/>
<circle cx="21" cy="10" r="2.6" fill="#5ef2f2" {s(1.1)}/>
<ellipse cx="33.5" cy="25" rx="2.3" ry="3.1" fill="#1fb5b8"/>
<ellipse cx="40.5" cy="25" rx="2.1" ry="3.1" fill="#1fb5b8"/>
<circle cx="32.8" cy="23.8" r=".9" fill="#fff"/><circle cx="39.8" cy="23.8" r=".9" fill="#fff"/>
<path d="M31 21.6 Q33.5 20.5 36 21.4 M38.4 21.4 Q40.8 20.5 43 21.8" fill="none" stroke="{O}" stroke-width="1.1" stroke-linecap="round"/>
<path d="M36.5 30 Q38.5 31.6 41 29.6" fill="none" stroke="#c4485e" stroke-width="1.2" stroke-linecap="round"/>
<ellipse cx="31" cy="29" rx="1.8" ry="1" fill="#f4a7b4" opacity=".7"/>
<rect x="32" y="37" width="20" height="8" rx="3" fill="#eef1fb" {s()}/>
<rect x="32" y="37" width="6" height="8" rx="2.5" fill="#1f2a5c" {s(1.2)}/>
<circle cx="43" cy="41" r="2.4" fill="#5ef2f2" {s(1)}/>
<rect x="51" y="36" width="3" height="10" rx="1" fill="#8b5cf6" {s(1.2)}/>
<ellipse cx="57.5" cy="41" rx="1.4" ry="5.5" fill="none" stroke="#5ef2f2" stroke-width="1.6"/>
<circle cx="38" cy="45" r="2.4" fill="#1a1a2e" {s(1)}/>'''
    if state == "attack":
        g += '<path d="M59 41 L64 38 L62 41 L64 44 Z" fill="#a8fbff"/>'
    return 64, g, (58, 41)

# ---------------------------------------------------------------- LEVEL 1
def scout_drone(state="idle"):
    g = f'''
<path d="M20 9 L22 4" {s()} fill="none"/><circle cx="22" cy="4" r="1.6" fill="#ff9a3c" {s(1)}/>
<path d="M24 14 L30 10 L30 22 Z" fill="#4a5578" {s()}/>
<circle cx="16" cy="16" r="10" fill="#7f8db3" {s()}/>
<path d="M8 13 Q16 6 24 13" fill="none" stroke="#b6c2e0" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="12" cy="16" r="5" fill="#2a2f45" {s(1.2)}/>
<circle cx="11.5" cy="16" r="3.2" fill="#ff8a1f"/><circle cx="10.6" cy="15" r="1" fill="#fff3d6"/>
<rect x="12" y="25" width="8" height="3" rx="1.5" fill="#4a5578" {s(1.2)}/>'''
    if state == "attack":
        g += '<circle cx="3" cy="16" r="2.4" fill="#ff8a1f"/>'
    return 32, g, (4, 16)

def wing_bot(state="idle"):
    g = f'''
<path d="M18 16 Q24 2 34 6 Q30 14 20 18 Z" fill="#cfe6ff" opacity=".85" {s(1.3)}/>
<path d="M19 22 Q28 32 36 26 Q30 20 21 20 Z" fill="#cfe6ff" opacity=".85" {s(1.3)}/>
<ellipse cx="22" cy="20" rx="10" ry="5.5" fill="#3f8f8c" {s()}/>
<path d="M14 18 L30 18" stroke="#7fd1c7" stroke-width="1.4"/>
<circle cx="10" cy="19" r="5" fill="#5b6a8f" {s()}/>
<circle cx="8" cy="18.5" r="2" fill="#ff8a1f"/>
<path d="M8 14 L5 9 M11 14 L11 9" {s(1.2)} fill="none"/>
<path d="M31 20 L37 21 L31 23 Z" fill="#5b6a8f" {s(1.2)}/>'''
    return 40, g, (5, 19)

def shield_pod(state="idle"):
    g = f'''
<ellipse cx="27" cy="24" rx="15" ry="12" fill="#6c7896" {s()}/>
<path d="M22 16 L36 16" stroke="#a9b4d1" stroke-width="2" stroke-linecap="round"/>
<circle cx="38" cy="24" r="5.5" fill="#2a2f45" {s(1.3)}/>
<circle cx="38" cy="24" r="3.5" fill="#ff8a1f"/>
<path d="M14 8 Q4 24 14 40 L19 38 Q11 24 19 10 Z" fill="#c7d2ec" {s()}/>
<path d="M13.5 14 Q9 24 13.5 34" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
<rect x="22" y="34" width="10" height="4" rx="2" fill="#3e4866" {s(1.2)}/>'''
    return 48, g, (8, 24)

# ---------------------------------------------------------------- LEVEL 2
def crystal_bat(state="idle"):
    g = f'''
<path d="M18 18 L28 4 L30 14 L38 8 L34 22 Z" fill="#b48cff" {s()}/>
<path d="M18 22 L28 34 L29 26 L37 30 L33 20 Z" fill="#8f63e8" {s()}/>
<path d="M8 20 L16 12 L26 20 L16 28 Z" fill="#6a3fc9" {s()}/>
<path d="M12 18 L16 14 L20 18" fill="none" stroke="#e2d4ff" stroke-width="1.3"/>
<circle cx="13" cy="20" r="1.8" fill="#ff4fb3"/>
<path d="M10 13 L11 9 L13 12" fill="#6a3fc9" {s(1.1)}/>'''
    return 40, g, (8, 20)

def shard_spinner(state="idle"):
    sh = ""
    for a in range(0, 360, 60):
        sh += f'<path d="M20 20 L24 8 L20 2 L16 8 Z" fill="#a77bff" transform="rotate({a} 20 20)" {s(1.3)}/>'
    g = sh + f'''
<circle cx="20" cy="20" r="7" fill="#3d2a6b" {s()}/>
<circle cx="20" cy="20" r="3.5" fill="{"#ff4fb3" if state=="charge" else "#c99cff"}"/>'''
    return 40, g, (14, 20)

def gem_crawler(state="idle"):
    g = f'''
<path d="M10 30 L8 36 M16 31 L15 37 M24 31 L25 37 M30 30 L32 36" {s(1.6)} fill="none"/>
<path d="M6 30 Q8 14 22 13 Q36 14 36 30 Z" fill="#5a4a8a" {s()}/>
<path d="M14 18 L18 12 L21 18 Z M23 16 L27 10 L30 17 Z" fill="#c99cff" {s(1.2)}/>
<circle cx="8" cy="27" r="4" fill="#3d2a6b" {s(1.3)}/>
<circle cx="6.8" cy="26.5" r="1.4" fill="#ff4fb3"/>'''
    return 40, g, (4, 27)

# ---------------------------------------------------------------- LEVEL 3
def spore_floater(state="idle"):
    g = f'''
<path d="M14 26 Q12 32 14 36 M18 27 Q18 33 16 37 M22 26 Q24 31 22 35" fill="none" stroke="#5d8a3a" stroke-width="1.4" stroke-linecap="round"/>
<path d="M18 10 Q6 4 4 14 Q12 14 18 12 Z" fill="#6fbf4a" {s(1.3)}/>
<path d="M20 10 Q32 4 34 14 Q26 14 20 12 Z" fill="#5aa83c" {s(1.3)}/>
<circle cx="18" cy="19" r="9" fill="#e6d07a" {s()}/>
<circle cx="15" cy="16" r="1.5" fill="#fff6c9"/><circle cx="22" cy="23" r="1.3" fill="#c7a94a"/>
<circle cx="13" cy="20" r="2" fill="#3b2a16"/>
<path d="M10 23 Q12 25 14 23" fill="none" stroke="#3b2a16" stroke-width="1.2"/>'''
    return 40, g, (9, 21)

def thorn_wasp(state="idle"):
    g = f'''
<path d="M20 14 Q22 2 30 4 Q28 12 22 16 Z" fill="#e8ffd9" opacity=".85" {s(1.2)}/>
<path d="M2 18 L12 15 L12 21 Z" fill="#2f5e1f" {s(1.3)}/>
<path d="M10 18 Q20 10 30 16 L38 18 L30 20 Q20 26 10 18 Z" fill="#c9e04a" {s()}/>
<path d="M18 14 L18 22 M23 13.5 L23 22.5" stroke="{O}" stroke-width="2"/>
<circle cx="13" cy="17" r="1.6" fill="#ff4f6b"/>'''
    if state == "charge":
        g += '<path d="M0 18 L-0 18" /><rect x="0" y="17.3" width="6" height="1.4" fill="#ff4fb3"/>'
    return 40, g, (2, 18)

def vine_sentry(state="idle"):
    g = f'''
<rect x="8" y="40" width="28" height="6" rx="2" fill="#5a5048" {s()}/>
<path d="M22 40 Q16 32 22 26 Q28 20 22 16" fill="none" stroke="#3f7a2a" stroke-width="5" stroke-linecap="round"/>
<path d="M22 40 Q16 32 22 26 Q28 20 22 16" fill="none" stroke="{O}" stroke-width="1" opacity=".0"/>
<path d="M18 34 Q12 32 12 28 Q17 29 19 32 Z M26 28 Q32 26 33 22 Q28 22 25 26 Z" fill="#6fbf4a" {s(1.2)}/>
<ellipse cx="22" cy="13" rx="9" ry="7" fill="#8a3d5e" {s()}/>
<path d="M13 13 L6 11 L6 15 Z" fill="#4e2236" {s(1.3)}/>
<circle cx="20" cy="10" r="1.6" fill="#ffd34f"/>'''
    return 48, g, (6, 13)

# ---------------------------------------------------------------- LEVEL 4
def frost_drone(state="idle"):
    g = f'''
<path d="M6 13 L14 13 M6 23 L14 23" stroke="{O}" stroke-width="4" stroke-linecap="round"/>
<path d="M6 13 L14 13 M6 23 L14 23" stroke="#7ea6c9" stroke-width="2" stroke-linecap="round"/>
<path d="M12 18 L18 8 L30 8 L34 18 L30 28 L18 28 Z" fill="#9fc6e6" {s()}/>
<path d="M18 8 L22 18 L18 28 M30 8 L26 18 L30 28" fill="none" stroke="#e6f6ff" stroke-width="1.2"/>
<circle cx="24" cy="18" r="3" fill="#ff8a1f" {s(1)}/>'''
    return 40, g, (5, 18)

def ice_wisp(state="idle"):
    g = f'''
<path d="M10 16 Q10 8 18 8 Q30 10 36 16 Q30 22 18 24 Q10 24 10 16 Z" fill="#d6f2ff" {s()}/>
<path d="M24 12 Q32 14 36 16 M24 20 Q30 19 34 18" fill="none" stroke="#9bd6f2" stroke-width="1.3" stroke-linecap="round"/>
<circle cx="15" cy="15" r="1.6" fill="#2a4f7a"/><circle cx="19" cy="15" r="1.6" fill="#2a4f7a"/>'''
    return 40, g, (9, 16)

def glacier_guard(state="idle", broken=False):
    sh = ("M6 8 L14 6 L16 42 L6 40 Z" if not broken else "M6 8 L14 6 L12 22 L8 26 L6 20 Z")
    g = f'''
<rect x="16" y="12" width="24" height="26" rx="5" fill="#5f7b99" {s()}/>
<rect x="20" y="16" width="16" height="5" rx="2" fill="#8fb0cf"/>
<circle cx="22" cy="28" r="3.5" fill="#ff8a1f" {s(1.2)}/>
<rect x="18" y="38" width="20" height="5" rx="2" fill="#3e5470" {s(1.2)}/>
<path d="{sh}" fill="#c6ecff" {s()}/>
<path d="M9 12 L11 30" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>'''
    return 48, g, (6, 24)

# ---------------------------------------------------------------- LEVEL 5
def void_scout(state="idle"):
    g = f'''
<path d="M3 18 L22 8 L36 6 L30 18 L36 30 L22 28 Z" fill="#3d2d5e" {s()}/>
<path d="M22 8 L26 18 L22 28" fill="none" stroke="#ff3fb4" stroke-width="1.6"/>
<path d="M5 18 L22 9.5 L34 8" fill="none" stroke="#9d8cd6" stroke-width="1.2"/>
<path d="M10 18 L18 15 L18 21 Z" fill="#ff3fb4"/>'''
    return 40, g, (3, 18)

def rift_jumper(state="idle"):
    g = f'''
<ellipse cx="20" cy="20" rx="15" ry="5" fill="none" stroke="#ff3fb4" stroke-width="1.6" stroke-dasharray="3 3"/>
<rect x="11" y="11" width="18" height="18" rx="4" fill="#4b3a6e" {s()}/>
<path d="M13 14 L27 14" stroke="#9d8cd6" stroke-width="1.2"/>
<rect x="13" y="16" width="9" height="5" rx="2" fill="#ff3fb4"/>
<path d="M15 29 L13 34 M25 29 L27 34" {s(1.5)} fill="none"/>'''
    return 40, g, (11, 18)

def rift_marker(state="idle"):
    return 40, '''<circle cx="20" cy="20" r="12" fill="none" stroke="#ff3fb4" stroke-width="2" stroke-dasharray="4 3"/>
<path d="M20 12 L20 28 M12 20 L28 20" stroke="#ff3fb4" stroke-width="1.6"/>''', (20, 20)

def eclipse_knight(state="idle"):
    g = f'''
<path d="M30 24 L40 40 L26 38 Z" fill="#5a4682" {s()}/>
<rect x="20" y="16" width="16" height="20" rx="4" fill="#46366a" {s()}/>
<path d="M22 8 Q28 2 34 8 L34 18 L22 18 Z" fill="#5a4682" {s()}/>
<rect x="23" y="11" width="8" height="2.6" rx="1" fill="#ff3fb4"/>
<path d="M28 2 L30 -1" stroke="#ff3fb4"/>
<path d="M6 12 Q2 26 8 38 L16 36 Q12 26 16 14 Z" fill="#8a4bff" opacity=".85" {s()}/>
<path d="M8 18 Q6 26 9 33" fill="none" stroke="#e2c9ff" stroke-width="1.4" stroke-linecap="round"/>
<circle cx="28" cy="26" r="2.6" fill="#c46bff"/>'''
    return 48, g, (6, 26)

# ---------------------------------------------------------------- BOSSES (viewBox 256)
B = 3

def cracks(paths):
    return "".join(f'<path d="{p}" fill="none" stroke="{O}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' for p in paths)

def smoke(pts):
    return "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#3a3346" opacity=".55"/>' for x, y, r in pts)

def scrap_king(state="idle"):
    open_ = state in ("phase", "damaged")
    core = "#ffb347" if state != "charge" else "#ffe08a"
    g = f'''
<path d="M150 200 L140 236 L160 236 Z M190 200 L196 236 L214 232 Z" fill="#4c4f5e" {s(B)}/>
<rect x="104" y="60" width="128" height="148" rx="22" fill="#7d8496" {s(B)}/>
<rect x="196" y="72" width="30" height="58" rx="6" fill="#a36b45" {s(B)}/>
<rect x="110" y="150" width="50" height="50" rx="8" fill="#5e6b52" {s(B)}/>
<circle cx="214" cy="160" r="6" fill="#c9ccd6" {s(2)}/><circle cx="214" cy="184" r="6" fill="#c9ccd6" {s(2)}/>
<rect x="124" y="20" width="64" height="48" rx="12" fill="#9aa1b3" {s(B)}/>
<path d="M132 20 L140 4 L150 18 L160 2 L170 18 L180 4 L184 20" fill="#e0b84a" {s(B)}/>
<rect x="132" y="36" width="34" height="14" rx="5" fill="#2a2f45" {s(2)}/>
<circle cx="142" cy="43" r="5" fill="#ff8a1f"/><circle cx="158" cy="43" r="4" fill="#ff8a1f"/>
<circle cx="168" cy="118" r="{"24" if open_ else "18"}" fill="#2a1d14" {s(B)}/>
<circle cx="168" cy="118" r="{"17" if open_ else "10"}" fill="{core}"/>'''
    if not open_:
        g += f'''<path d="M140 92 L168 94 L168 142 L140 144 Z" fill="#8f97aa" {s(B)}/>
<path d="M196 92 L168 94 L168 142 L196 144 Z" fill="#8f97aa" {s(B)}/>
<circle cx="168" cy="118" r="7" fill="{core}" {s(2)}/>'''
    else:
        g += f'''<path d="M122 92 L142 96 L142 140 L122 146 Z" fill="#8f97aa" {s(B)}/>
<path d="M214 92 L194 96 L194 140 L214 146 Z" fill="#8f97aa" {s(B)}/>
<circle cx="168" cy="118" r="30" fill="none" stroke="#ffb347" stroke-width="3" stroke-dasharray="6 6"/>'''
    # arms + cannons (left facing)
    g += f'''
<path d="M110 84 L80 92 L80 108 L110 110 Z" fill="#666d80" {s(B)}/>
<rect x="18" y="80" width="68" height="34" rx="10" fill="#585e70" {s(B)}/>
<rect x="8" y="86" width="16" height="22" rx="4" fill="#2a2f45" {s(B)}/>
<path d="M110 170 L84 172 L84 186 L110 190 Z" fill="#666d80" {s(B)}/>
<rect x="26" y="160" width="62" height="32" rx="10" fill="#a36b45" {s(B)}/>
<rect x="16" y="166" width="16" height="20" rx="4" fill="#2a2f45" {s(B)}/>'''
    if state == "charge":
        g += '<circle cx="12" cy="97" r="11" fill="#ff8a1f" opacity=".8"/><circle cx="20" cy="176" r="10" fill="#ff8a1f" opacity=".8"/>'
        g += '<path d="M0 97 L-0 97"/><circle cx="12" cy="97" r="16" fill="none" stroke="#ff8a1f" stroke-width="2.5" stroke-dasharray="4 4"/>'
    if state == "damaged":
        g += cracks(["M112 70 L126 88 L118 104", "M214 190 L200 176 L208 160", "M40 84 L52 98"])
        g += smoke([(200, 54, 14), (214, 40, 10), (60, 150, 10)])
        g += '<rect x="196" y="72" width="30" height="20" fill="#2a2f45" opacity=".7"/>'
    return 256, g, (8, 97)

def prism_serpent(state="idle"):
    import math
    segs = ""
    pts = []
    for i in range(7):
        x = 230 - i * 26
        y = 140 + 50 * math.sin(i * 0.9 + 0.5)
        pts.append((x, y))
    for i, (x, y) in enumerate(pts[1:][::-1]):
        r = 14 + i * 1.5
        crack = state == "damaged" and i % 2 == 0
        segs += f'<path d="M{x-r} {y} L{x} {y-r*1.3} L{x+r} {y} L{x} {y+r*1.3} Z" fill="#9b6bff" {s(B)}/>'
        segs += f'<path d="M{x-r*.5} {y} L{x} {y-r*.7} L{x+r*.2} {y}" fill="none" stroke="#e2d4ff" stroke-width="2.5"/>'
        if crack:
            segs += cracks([f"M{x-4} {y-10} L{x+3} {y} L{x-3} {y+9}"])
    joints = ""
    for (x1, y1), (x2, y2) in zip(pts[1:], pts[2:]):
        jc = "#ff4fb3" if state != "damaged" else "#a03070"
        joints += f'<circle cx="{(x1+x2)/2}" cy="{(y1+y2)/2}" r="6" fill="{jc}" {s(2)}/>'
    hx, hy = pts[0]
    hx -= 196
    head = f'''
<path d="M{hx-8} {hy+10} L{hx+16} {hy-22} L{hx+56} {hy-26} L{hx+70} {hy} L{hx+56} {hy+28} L{hx+16} {hy+26} Z" fill="#6a3fc9" {s(B)}/>
<path d="M{hx+20} {hy-22} L{hx+34} {hy-44} L{hx+44} {hy-24} Z M{hx+44} {hy-24} L{hx+62} {hy-42} L{hx+62} {hy-14} Z" fill="#c99cff" {s(B)}/>
<path d="M{hx-8} {hy+10} L{hx+30} {hy+8} L{hx+16} {hy+26} Z" fill="#3d2a6b" {s(2)}/>
<circle cx="{hx+30}" cy="{hy-6}" r="7" fill="#ff4fb3" {s(2)}/>
<circle cx="{hx+28}" cy="{hy-8}" r="2.4" fill="#fff"/>'''
    body = ""
    # reposition: draw body from head to tail on the right
    import math as m
    pts2 = [(hx + 66 + i * 24, 140 + 46 * m.sin(i * 0.9 + 1.4)) for i in range(7)]
    body = ""
    for i, (x, y) in enumerate(pts2[::-1]):
        r = 22 - (6 - i) * 0 - (6 - (6 - i)) * 1.6
        r = 12 + (6 - i) * 0 + i * 1.6
        body += f'<path d="M{x-r} {y} L{x} {y-r*1.3} L{x+r} {y} L{x} {y+r*1.3} Z" fill="#9b6bff" {s(B)}/>'
        body += f'<path d="M{x-r*.5} {y} L{x} {y-r*.7} L{x+r*.2} {y}" fill="none" stroke="#e2d4ff" stroke-width="2.5"/>'
        if state == "damaged" and i % 2 == 1:
            body += cracks([f"M{x-3} {y-9} L{x+3} {y} L{x-3} {y+8}"])
    jt = ""
    for (x1, y1), (x2, y2) in zip(pts2, pts2[1:]):
        jc = "#ff4fb3" if state != "damaged" else "#9a3a74"
        jt += f'<circle cx="{(x1+x2)/2}" cy="{(y1+y2)/2}" r="5.5" fill="{jc}" {s(2)}/>'
    g = body + jt + head
    if state == "charge":
        g += f'<line x1="{hx-10}" y1="{hy+6}" x2="0" y2="{hy+6}" stroke="#ff4fb3" stroke-width="2" stroke-dasharray="6 5"/>'
        g += f'<circle cx="{hx-6}" cy="{hy+8}" r="9" fill="#ff4fb3" opacity=".75"/>'
    if state == "phase":
        g += f'<path d="M{hx+20} {hy-22} L{hx+34} {hy-58} L{hx+44} {hy-24} Z" fill="#ffd34f" {s(B)}/>'
    if state == "damaged":
        g += cracks([f"M{hx+50} {hy-20} L{hx+44} {hy} L{hx+54} {hy+16}"])
        g += smoke([(hx + 70, hy - 40, 10), (180, 90, 9)])
    return 256, g, (hx - 6, hy + 8)

def bloomcore(state="idle"):
    import math
    open_ = state in ("phase",)
    g = f'''
<path d="M60 250 Q90 190 70 150 M200 250 Q170 200 196 160 M128 256 L128 200" fill="none" stroke="#3f7a2a" stroke-width="12" stroke-linecap="round"/>
<path d="M60 250 Q90 190 70 150 M200 250 Q170 200 196 160 M128 256 L128 200" fill="none" stroke="#5aa83c" stroke-width="6" stroke-linecap="round"/>'''
    pet = ""
    n = 8
    for i in range(n):
        a = i * 360 / n
        if open_:
            pet += f'<path d="M128 128 L112 54 Q128 22 144 54 Z" fill="#b6bccb" transform="rotate({a} 128 128) translate(0 -18)" {s(B)}/>'
        else:
            pet += f'<path d="M128 128 L106 70 Q128 40 150 70 Z" fill="#b6bccb" transform="rotate({a+22.5} 128 128)" {s(B)}/>'
            pet += f'<path d="M128 112 L118 76 L128 60" fill="none" stroke="#e4e8f1" stroke-width="3" transform="rotate({a+22.5} 128 128)"/>'
    g += pet
    cr = 34 if open_ else 22
    g += f'<circle cx="128" cy="128" r="{cr}" fill="#5a1f3a" {s(B)}/>'
    g += f'<circle cx="128" cy="128" r="{cr-10}" fill="{"#ffe08a" if state=="charge" else "#ffb347"}"/>'
    if not open_:
        for i in range(4):
            g += f'<path d="M128 128 L128 104" stroke="#8a8f9e" stroke-width="10" stroke-linecap="round" transform="rotate({i*90+45} 128 128)"/>'
    # vines over petals
    g += f'''<path d="M40 110 Q80 96 100 120 Q120 150 160 134 Q196 118 222 140" fill="none" stroke="{O}" stroke-width="10" stroke-linecap="round"/>
<path d="M40 110 Q80 96 100 120 Q120 150 160 134 Q196 118 222 140" fill="none" stroke="#4e9a34" stroke-width="6" stroke-linecap="round"/>
<path d="M70 102 L66 92 M190 124 L196 114 M112 136 L108 146" stroke="#c9e04a" stroke-width="4" stroke-linecap="round"/>'''
    if state == "charge":
        for i in range(8):
            a = math.radians(180 + (i - 3.5) * 14)
            g += f'<path d="M{128+70*math.cos(a)} {128+70*math.sin(a)} l{-10*math.cos(a+0.2):.1f} {-10*math.sin(a+0.2):.1f}" stroke="#ff4fb3" stroke-width="5" stroke-linecap="round"/>'
    if state == "damaged":
        g += cracks(["M92 70 L104 90 L96 100", "M170 180 L156 170", "M190 76 L176 90"])
        g += smoke([(84, 60, 12), (184, 196, 12)])
    return 256, g, (60, 128)

def cryo_manta(state="idle", turrets=True):
    g = f'''
<path d="M70 128 Q120 20 236 30 Q200 80 180 116 Z" fill="#c6ecff" fill-opacity=".8" {s(B)}/>
<path d="M70 128 Q120 236 236 226 Q200 176 180 140 Z" fill="#c6ecff" fill-opacity=".8" {s(B)}/>
<path d="M120 80 Q170 52 214 44 M120 176 Q170 204 214 212" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
<path d="M180 120 Q230 126 254 126 L254 130 Q230 130 180 136 Z" fill="#3e5470" {s(2)}/>
<path d="M30 128 Q50 96 100 96 Q170 100 196 128 Q170 156 100 160 Q50 160 30 128 Z" fill="#46617f" {s(B)}/>
<path d="M30 128 L14 112 M30 128 L14 144" stroke="#46617f" stroke-width="7" stroke-linecap="round"/>
<path d="M30 128 L14 112 M30 128 L14 144" stroke="{O}" stroke-width="2" fill="none"/>
<circle cx="52" cy="118" r="5" fill="#ff8a1f"/>
<circle cx="120" cy="128" r="18" fill="#1d2b40" {s(B)}/>
<circle cx="120" cy="128" r="11" fill="{"#e6ffff" if state=="charge" else "#4fb4ff"}"/>'''
    if turrets and state != "damaged":
        for y in (66, 190):
            g += f'<rect x="150" y="{y-9}" width="22" height="18" rx="5" fill="#5f7b99" {s(B)}/><rect x="136" y="{y-3}" width="16" height="6" fill="#2a3a52" {s(2)}/><circle cx="162" cy="{y}" r="3.5" fill="#ff8a1f"/>'
    if state == "charge":
        g += '<line x1="20" y1="128" x2="0" y2="128" stroke="#ff4fb3" stroke-width="2.5" stroke-dasharray="6 5"/>'
        g += '<path d="M10 116 L20 128 L10 140" fill="none" stroke="#ff4fb3" stroke-width="3"/>'
    if state == "phase":
        g += '<circle cx="120" cy="128" r="26" fill="none" stroke="#4fb4ff" stroke-width="3" stroke-dasharray="6 6"/>'
    if state == "damaged":
        g += cracks(["M150 50 L160 72 L150 86", "M160 210 L170 186", "M80 108 L96 118"])
        g += smoke([(160, 66, 12), (164, 192, 12)])
    return 256, g, (14, 128)

def eclipse_empress(state="idle"):
    import math
    p2 = state in ("phase", "damaged")
    g = ""
    # cape (segmented)
    for i in range(5):
        x = 150 + i * 16
        g += f'<path d="M{x-6} 90 L{x+14} 90 L{x+20+i*4} {210+i*6} L{x} {214+i*4} Z" fill="{"#3a2a5c" if i%2==0 else "#2b2140"}" {s(B)}/>'
    g += f'''
<path d="M120 150 L150 150 L156 220 Q140 236 124 220 Z" fill="#2b2140" {s(B)}/>
<path d="M112 84 Q140 70 168 84 L170 152 Q140 166 110 152 Z" fill="#3a2a5c" {s(B)}/>
<path d="M120 90 L160 90" stroke="#c99cff" stroke-width="3"/>
<circle cx="140" cy="122" r="{"20" if p2 else "14"}" fill="#1e1530" {s(B)}/>
<circle cx="140" cy="122" r="{"13" if p2 else "8"}" fill="{"#f3e3ff" if state=="charge" else "#c46bff"}"/>
<path d="M112 84 L92 96 L96 118 L114 108 Z M168 84 L186 92 L184 112 L168 106 Z" fill="#5a4682" {s(B)}/>
<ellipse cx="140" cy="56" rx="24" ry="26" fill="#d9d2ea" {s(B)}/>
<path d="M120 54 L134 52 M146 52 L160 54" stroke="#ff3fb4" stroke-width="4" stroke-linecap="round"/>
<path d="M118 34 L124 12 L132 28 L140 6 L148 28 L156 12 L162 34 Z" fill="#e0b84a" {s(B)}/>
<circle cx="140" cy="20" r="4" fill="#c46bff"/>
<path d="M96 112 L70 118 L70 128 L98 124 Z" fill="#5a4682" {s(B)}/>
<rect x="46" y="112" width="28" height="20" rx="6" fill="#2b2140" {s(B)}/>'''
    if state == "phase":
        for i, a in enumerate((-60, 0, 60, 180)):
            r = math.radians(a + 180)
            x, y = 140 + 92 * math.cos(r), 122 + 92 * math.sin(r)
            if a == 180: x, y = 230, 122
            g += f'<path d="M{x-16} {y} L{x} {y-12} L{x+12} {y} L{x} {y+12} Z" fill="#8a4bff" {s(B)}/><circle cx="{x}" cy="{y}" r="4" fill="#ff3fb4"/>'
        g += '<circle cx="140" cy="122" r="96" fill="none" stroke="#8a4bff" stroke-width="1.6" stroke-dasharray="4 8"/>'
    if state == "charge":
        g += '<circle cx="46" cy="122" r="14" fill="none" stroke="#ff3fb4" stroke-width="3" stroke-dasharray="5 4"/><circle cx="46" cy="122" r="7" fill="#ff3fb4"/>'
    if state == "damaged":
        g += cracks(["M128 40 L136 56 L128 66", "M118 140 L130 150", "M180 150 L196 176"])
        g += smoke([(170, 40, 12), (100, 170, 10)])
        g += '<path d="M156 12 L162 34 L150 30 Z" fill="#2a2f45"/>'
    return 256, g, (46, 122)

PLAYER = [("player", "Silver gunner (player)", player)]
LEVELS = [
    ("Level 1 — Neon Outskirts", [("scout_drone", "Scout drone", scout_drone, 32), ("wing_bot", "Wing bot", wing_bot, 40), ("shield_pod", "Shield pod", shield_pod, 48)],
     ("scrap_king", "Scrap King", scrap_king, 224)),
    ("Level 2 — Crystal Caverns", [("crystal_bat", "Crystal bat", crystal_bat, 40), ("shard_spinner", "Shard spinner", shard_spinner, 40), ("gem_crawler", "Gem crawler", gem_crawler, 40)],
     ("prism_serpent", "Prism Serpent", prism_serpent, 256)),
    ("Level 3 — Overgrown Reactor", [("spore_floater", "Spore floater", spore_floater, 40), ("thorn_wasp", "Thorn wasp", thorn_wasp, 40), ("vine_sentry", "Vine sentry", vine_sentry, 48)],
     ("bloomcore", "Bloomcore", bloomcore, 224)),
    ("Level 4 — Frozen Orbit", [("frost_drone", "Frost drone", frost_drone, 40), ("ice_wisp", "Ice wisp", ice_wisp, 32), ("glacier_guard", "Glacier guard", glacier_guard, 56)],
     ("cryo_manta", "Cryo Manta", cryo_manta, 240)),
    ("Level 5 — Eclipse Fortress", [("void_scout", "Void scout", void_scout, 40), ("rift_jumper", "Rift jumper", rift_jumper, 40), ("eclipse_knight", "Eclipse knight", eclipse_knight, 56)],
     ("eclipse_empress", "Eclipse Empress", eclipse_empress, 256)),
]

def svg(fn, state="idle", **kw):
    vb, body, _ = fn(state, **kw) if kw else fn(state)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 {vb+4} {vb+4}" width="{vb+4}" height="{vb+4}">{body}</svg>'

# ================================================================ NEW SET (levels 5-8, 10)
def sand_skimmer(state="idle"):
    return 40, f'''
<path d="M30 24 Q36 30 40 28 M32 20 Q38 18 40 20" fill="none" stroke="#e8cf9a" stroke-width="1.4" stroke-linecap="round"/>
<path d="M3 22 L12 15 L32 15 L37 21 L33 27 L9 27 Z" fill="#d9a65a" {s()}/>
<path d="M12 18 L30 18" stroke="#f3d79c" stroke-width="1.4"/>
<ellipse cx="19" cy="14" rx="7" ry="5" fill="#5b4a3a" {s(1.3)}/>
<circle cx="16" cy="14" r="2" fill="#ff8a1f"/>
<rect x="10" y="26" width="18" height="3" rx="1.5" fill="#8a5a32" {s(1.1)}/>''', (3, 22)

def furnace_bot(state="idle"):
    return 48, f'''
<rect x="28" y="2" width="7" height="10" rx="1" fill="#5a4234" {s()}/>
<rect x="12" y="10" width="28" height="30" rx="6" fill="#7a5a44" {s()}/>
<rect x="16" y="14" width="20" height="4" rx="2" fill="#a07a5c"/>
<rect x="7" y="20" width="14" height="13" rx="3" fill="#2a1a10" {s()}/>
<rect x="9" y="23" width="9" height="7" rx="2" fill="{"#ffe08a" if state=="charge" else "#ff8a1f"}"/>
<rect x="15" y="40" width="22" height="5" rx="2" fill="#4a3428" {s(1.2)}/>''', (7, 26)

def drill_drone(state="idle"):
    return 44, f'''
<path d="M2 22 L18 12 L18 32 Z" fill="#c9ccd6" {s()}/>
<path d="M6 20 L16 15 M8 24 L17 19 M10 27 L17 24" stroke="#7d8496" stroke-width="1.4"/>
<ellipse cx="29" cy="22" rx="12" ry="10" fill="#b0703a" {s()}/>
<path d="M22 16 Q30 12 38 17" fill="none" stroke="#d8a06a" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="25" cy="22" r="3" fill="#2a1a10"/><circle cx="25" cy="22" r="1.6" fill="#ff8a1f"/>
<path d="M40 18 L43 16 M40 26 L43 28" {s(1.3)} fill="none"/>''', (2, 22)

def aqua_drone(state="idle"):
    return 36, f'''
<path d="M28 18 L34 12 L34 24 Z" fill="#9fb3c8" {s(1.3)}/>
<circle cx="17" cy="18" r="11" fill="#3d6f8f" {s()}/>
<path d="M9 13 Q17 7 25 13" fill="none" stroke="#7fb0cc" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="13" cy="18" r="4.5" fill="#1d2b40" {s(1.2)}/><circle cx="12.5" cy="18" r="2.6" fill="#ff8a1f"/>
<path d="M14 29 L12 33 M20 29 L22 33" {s(1.3)} fill="none"/>''', (5, 18)

def electric_jelly(state="idle"):
    return 40, f'''
<path d="M12 22 L10 28 L13 32 L11 38 M18 23 L17 29 L20 33 L18 38 M24 23 L25 29 L22 33 L24 38 M30 22 L31 28 L28 32 L30 37" fill="none" stroke="#ffd34f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6 22 Q6 4 20 4 Q34 4 34 22 Q27 25 20 22 Q13 25 6 22 Z" fill="#e86bb5" fill-opacity=".92" {s()}/>
<path d="M11 12 Q16 7 22 7" fill="none" stroke="#ffd1ec" stroke-width="1.8" stroke-linecap="round"/>
<circle cx="15" cy="15" r="1.8" fill="#4e1236"/><circle cx="22" cy="15" r="1.8" fill="#4e1236"/>''', (20, 15)

def torpedo_bot(state="idle"):
    return 48, f'''
<path d="M38 24 L46 16 L46 32 Z" fill="#5a6378" {s()}/>
<path d="M6 24 Q10 15 22 15 L40 16 L40 32 L22 33 Q10 33 6 24 Z" fill="#8a93a6" {s()}/>
<path d="M6 24 Q8 18 14 16 L14 32 Q8 30 6 24 Z" fill="#e0533a" {s(1.3)}/>
<path d="M20 19 L38 19" stroke="#c4cad8" stroke-width="1.6"/>
<circle cx="24" cy="25" r="2.6" fill="#ff8a1f" {s(1)}/>''', (6, 24)

def spark_bird(state="idle"):
    return 40, f'''
<path d="M18 18 L28 4 L32 16 Z" fill="#f2d65a" {s(1.3)}/>
<path d="M18 22 L30 34 L32 22 Z" fill="#d4b23a" {s(1.3)}/>
<path d="M30 18 L39 14 L38 24 L30 22 Z" fill="#3d4a7a" {s(1.3)}/>
<ellipse cx="20" cy="20" rx="12" ry="6" fill="#e8c440" {s()}/>
<path d="M8 19 L2 21 L8 23 Z" fill="#ff8a1f" {s(1.1)}/>
<circle cx="12" cy="18.5" r="1.8" fill="#1a1030"/>
<path d="M18 12 L16 8 L20 10" fill="#ffd34f" {s(1)}/>''', (2, 21)

def storm_drone(state="idle"):
    return 40, f'''
<path d="M18 28 L15 34 L19 33 L16 39" fill="none" stroke="#ffd34f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6 24 Q2 18 8 14 Q10 6 18 8 Q24 3 30 9 Q38 10 36 18 Q40 24 32 27 L10 27 Q6 27 6 24 Z" fill="#8d93a8" {s()}/>
<path d="M10 14 Q16 10 22 11" fill="none" stroke="#c6cbda" stroke-width="1.6" stroke-linecap="round"/>
<rect x="9" y="17" width="14" height="4" rx="2" fill="#ffd34f" {s(1)}/>''', (8, 19)

def lightning_sentry(state="idle"):
    return 48, f'''
<rect x="8" y="41" width="30" height="6" rx="2" fill="#4a4f66" {s()}/>
<rect x="20" y="22" width="6" height="20" fill="#6c728c" {s()}/>
<path d="M17 28 L29 28 M17 34 L29 34" stroke="#c6cbda" stroke-width="1.4"/>
<rect x="12" y="12" width="22" height="13" rx="4" fill="#3d4a7a" {s()}/>
<rect x="4" y="15" width="10" height="6" rx="2" fill="#2a3150" {s(1.3)}/>
<circle cx="27" cy="9" r="5" fill="#ffd34f" {s(1.3)}/>
<circle cx="22" cy="18" r="2" fill="#ff8a1f"/>''', (4, 18)

def orbit_drone(state="idle"):
    return 40, f'''
<ellipse cx="20" cy="20" rx="17" ry="6" fill="none" stroke="#b48cff" stroke-width="1.6" transform="rotate(-20 20 20)"/>
<circle cx="20" cy="20" r="9" fill="#6b5b95" {s()}/>
<path d="M14 16 Q20 12 26 16" fill="none" stroke="#a99bd0" stroke-width="1.5" stroke-linecap="round"/>
<circle cx="17" cy="20" r="2.4" fill="#ff8a1f"/>
<circle cx="5" cy="26" r="3.2" fill="#9a8f7a" {s(1.2)}/>''', (11, 20)

def gravity_mine(state="idle"):
    sp = "".join(f'<path d="M20 4 L22 9 L18 9 Z" fill="#7a6aa8" transform="rotate({a} 20 20)" {s(1)}/>' for a in range(0, 360, 45))
    return 40, sp + f'''
<circle cx="20" cy="20" r="11" fill="#4a3b6b" {s()}/>
<circle cx="20" cy="20" r="5" fill="#ff3fb4" {s(1)}/>
<circle cx="18.5" cy="18.5" r="1.4" fill="#ffd1ec"/>''', (20, 20)

def ancient_guardian(state="idle"):
    return 52, f'''
<path d="M12 8 L40 8 L46 20 L42 44 L10 44 L6 20 Z" fill="#9a8f7a" {s()}/>
<path d="M12 8 L40 8 L42 14 L10 14 Z" fill="#b8ad96"/>
<path d="M12 22 L22 20 L22 26 L12 26 Z M30 20 L40 22 L40 26 L30 26 Z" fill="#2a2018" {s(1.2)}/>
<rect x="14" y="22" width="5" height="3" fill="#ff8a1f"/><rect x="33" y="22" width="5" height="3" fill="#ff8a1f"/>
<path d="M18 34 L34 34 M20 38 L32 38" stroke="#5e5444" stroke-width="2"/>
<path d="M38 10 L34 18 L37 24" fill="none" stroke="#5e5444" stroke-width="1.6"/>
<path d="M26 0 L29 5 L26 8 L23 5 Z" fill="#b48cff" {s(1)}/>''', (8, 24)

def dune_colossus(state="idle"):
    v = state == "phase"
    vc = "#ffb347" if v else "#4a3428"
    vents = "".join(f'<rect x="{x}" y="34" width="22" height="{30 if v else 18}" rx="5" fill="{vc}" {s(B)}/>' for x in (150, 180, 210))
    g = f'''
<path d="M60 200 L90 238 L120 238 L104 196 Z M170 200 L186 238 L216 238 L206 196 Z" fill="#8a5a32" {s(B)}/>
{vents}
<path d="M70 70 L230 60 Q250 128 230 200 L70 196 Q40 132 70 70 Z" fill="#c9925a" {s(B)}/>
<path d="M80 80 L220 72 M78 182 L222 188" stroke="#e8c48a" stroke-width="4"/>
<path d="M120 90 L200 86 L204 170 L120 168 Z" fill="#b07a46" {s(B)}/>
<path d="M140 104 L186 102 L188 152 L140 152 Z" fill="#8a5a32" {s(2)}/>
<rect x="70" y="112" width="40" height="16" rx="6" fill="#2a1a10" {s(B)}/>
<rect x="76" y="116" width="28" height="8" rx="3" fill="#ff8a1f"/>
<circle cx="80" cy="152" r="30" fill="#7a5a44" {s(B)}/>
<circle cx="80" cy="152" r="12" fill="#4a3428" {s(B)}/>
<rect x="18" y="140" width="50" height="10" rx="4" fill="#5a4234" {s(B)}/>
<rect x="18" y="156" width="50" height="10" rx="4" fill="#5a4234" {s(B)}/>'''
    if v:
        g += "".join(f'<rect x="{x+5}" y="40" width="12" height="18" rx="3" fill="#ffe08a"/>' for x in (150, 180, 210))
    return 256, g, (18, 152)

def abyssal_nautilus(state="idle"):
    op = state == "phase"
    ten = "".join(f'<path d="M110 {120+i*14} Q{60-i*4} {110+i*22} {20+i*6} {100+i*24}" fill="none" stroke="{O}" stroke-width="12" stroke-linecap="round"/><path d="M110 {120+i*14} Q{60-i*4} {110+i*22} {20+i*6} {100+i*24}" fill="none" stroke="#7a8aa6" stroke-width="7" stroke-linecap="round"/>' for i in range(5))
    g = ten + f'''
<path d="M100 90 Q100 40 160 34 Q236 34 240 120 Q240 210 160 216 Q100 214 96 160 Z" fill="#c9b28f" {s(B)}/>
<path d="M160 34 Q236 40 236 124 Q232 200 160 210 M200 50 Q170 130 120 200 M226 90 Q180 150 140 210" fill="none" stroke="#9a8160" stroke-width="5"/>
<path d="M80 92 Q70 126 80 160 L118 162 L118 92 Z" fill="#46617f" {s(B)}/>
<circle cx="94" cy="112" r="9" fill="#ff8a1f" {s(2)}/>
<circle cx="168" cy="124" r="{"30" if op else "24"}" fill="#3a2a40" {s(B)}/>
<circle cx="168" cy="124" r="{"20" if op else "10"}" fill="#ff5fc0"/>'''
    if not op:
        g += f'<path d="M144 116 L192 116 M144 132 L192 132" stroke="#8a93a6" stroke-width="8" stroke-linecap="round"/>'
    return 256, g, (40, 126)

def tempest_roc(state="idle"):
    ch = state == "phase"
    g = f'''
<path d="M120 110 L200 10 L236 30 L210 70 L250 60 L200 120 Z" fill="#4a5a92" {s(B)}/>
<path d="M120 146 L200 246 L236 226 L210 186 L250 196 L200 136 Z" fill="#3d4a7a" {s(B)}/>
<path d="M150 90 L206 30 M150 166 L206 226" stroke="#ffd34f" stroke-width="4" stroke-linecap="round"/>
<path d="M200 118 L252 112 L252 144 L200 138 Z" fill="#2a3150" {s(B)}/>
<ellipse cx="140" cy="128" rx="68" ry="34" fill="#3d4a7a" {s(B)}/>
<path d="M90 112 Q140 96 196 114" fill="none" stroke="#7a8ad0" stroke-width="5" stroke-linecap="round"/>
<path d="M60 120 Q66 98 88 100 L100 130 L80 146 Q62 140 60 120 Z" fill="#4a5a92" {s(B)}/>
<path d="M60 120 L30 126 L60 132 Z" fill="#ff8a1f" {s(B)}/>
<circle cx="74" cy="116" r="5" fill="#ffd34f"/>
<path d="M80 100 L72 76 L88 92 L90 70 L98 100" fill="#ffd34f" {s(2)}/>
<circle cx="140" cy="130" r="{"20" if ch else "14"}" fill="#1d2440" {s(B)}/>
<circle cx="140" cy="130" r="{"13" if ch else "7"}" fill="#ffe08a"/>'''
    if ch:
        g += '<path d="M170 60 L160 80 L176 82 L164 104 M176 196 L166 176 L182 174 L170 152" fill="none" stroke="#ffe08a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
    return 256, g, (30, 128)

def gravemind_sentinel(state="idle"):
    import math
    op = state == "phase"
    ring = "".join(f'<path d="M128 22 L144 26 L140 40 L116 40 L112 26 Z" fill="#7a7060" transform="rotate({a} 128 128)" {s(2.5)}/>' for a in range(0, 360, 45))
    g = ring + f'''
<path d="M88 60 L168 60 L190 128 L168 196 L88 196 L66 128 Z" fill="#8b8370" {s(B)}/>
<path d="M88 60 L168 60 L176 84 L80 84 Z" fill="#aba28c"/>
<path d="M90 100 L110 108 M166 100 L146 108 M96 170 L160 170" stroke="#b48cff" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="128" cy="128" rx="{"30" if op else "26"}" ry="{"24" if op else "12"}" fill="#2a2018" {s(B)}/>
<circle cx="128" cy="128" r="{"14" if op else "8"}" fill="#ff8a1f"/>
<path d="M108 196 L100 236 L128 222 L156 236 L148 196 Z" fill="#6e6656" {s(B)}/>'''
    return 256, g, (100, 128)

def astral_devourer(state="idle"):
    p = {"idle": 1, "phase": 2, "phase3": 3}.get(state, 1)
    g = f'''
<path d="M170 30 L240 10 L230 70 Z M170 226 L240 246 L230 186 Z" fill="#2b2650" {s(B)}/>
<circle cx="140" cy="128" r="104" fill="#1a1638" {s(B)}/>
<circle cx="140" cy="128" r="104" fill="none" stroke="#e0b84a" stroke-width="6"/>
<circle cx="140" cy="128" r="84" fill="none" stroke="#5a4682" stroke-width="3" stroke-dasharray="10 8"/>'''
    for i, a in enumerate(range(0, 360, 40)):
        import math
        r = math.radians(a)
        g += f'<circle cx="{140+94*math.cos(r):.1f}" cy="{128+94*math.sin(r):.1f}" r="5" fill="#ff3fb4" {s(1.5)}/>'
    core = {1: 18, 2: 28, 3: 42}[p]
    g += f'<circle cx="140" cy="128" r="{core+12}" fill="#3a1a4a" {s(B)}/>'
    g += f'<circle cx="140" cy="128" r="{core}" fill="#fff2b0"/><circle cx="140" cy="128" r="{core*.55:.0f}" fill="#ff5fc0"/>'
    plates = {1: 4, 2: 2, 3: 0}[p]
    for i in range(plates):
        g += f'<path d="M140 128 L110 70 Q140 56 170 70 Z" fill="#5a5080" transform="rotate({i*(360/max(plates,1))} 140 128)" {s(B)}/>'
    g += f'<path d="M36 100 L10 92 L18 128 L10 164 L36 156" fill="#2b2650" {s(B)}/>'
    return 256, g, (36, 128)

def manta_turret(state="idle"):
    return 40, f'<rect x="14" y="11" width="22" height="18" rx="5" fill="#5f7b99" {s(2)}/><rect x="2" y="17" width="14" height="6" fill="#2a3a52" {s(1.6)}/><circle cx="26" cy="20" r="3.5" fill="#ff8a1f"/>', (2, 20)

def orbiter(state="idle"):
    return 40, f'<path d="M4 20 L20 8 L34 20 L20 32 Z" fill="#8a4bff" {s(2)}/><circle cx="20" cy="20" r="4.5" fill="#ff3fb4"/>', (4, 20)

def stone_orbiter(state="idle"):
    return 40, f'<path d="M6 20 L14 8 L28 8 L34 20 L28 32 L14 32 Z" fill="#8b8370" {s(2)}/><circle cx="20" cy="20" r="4.5" fill="#ff8a1f"/>', (6, 20)
