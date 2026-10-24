import asyncio, json
from playwright.async_api import async_playwright
SEED = {"users":[{"id":"u1","email":"a@x.com","password":"pw123456x","confirmed":True}],"profiles":[{"id":"u1","username":"Pilot","avatar":"lumi","created_at":"2026-10-01T00:00:00Z"}],
        "saves":[{"user_id":"u1","data":{"campaign":{"unlocked":20,"completed":[True]*19+[False]*81}}}],"runs":[],"session":{"access_token":"tok-u1","user":{"id":"u1","email":"a@x.com"}}}
DEVICES = [("iPhone landscape", 844, 390, 3), ("iPad landscape", 1180, 820, 2), ("Android tablet", 1280, 800, 2)]
def ok(c, m): print(("  PASS " if c else "  FAIL ") + m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        for name, w, h, dpr in DEVICES:
            print(f"== {name} {w}x{h} @{dpr}x")
            ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dpr, is_mobile=True, has_touch=True)
            pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto("file:///home/claude/v2/tests/test.html"); await pg.evaluate(f"()=>{{localStorage.clear(); localStorage.setItem('__fake_db', JSON.stringify({json.dumps(SEED)}))}}")
            await pg.reload(); await pg.wait_for_timeout(1500)
            await pg.locator(".lhero .lbtn.primary").tap(); await pg.wait_for_timeout(1200)
            await pg.get_by_role("button", name="Campaign", exact=True).tap(); await pg.wait_for_timeout(300); await pg.locator(".tile:not(.locked)").last.tap(); await pg.wait_for_timeout(3200)
            info = await pg.evaluate("()=>{const c=document.querySelector('.stage canvas'); const r=c.getBoundingClientRect(); return {cw:c.width, css:r.width, cssH:r.height, rs:RENDER_SCALE, bg:buildBG(1).sky.width, tier:window.__lumi.game().player.tier, hp:window.__lumi.game().player.hp}}")
            exp = round(info["css"] * max(1, min(dpr, 2, (2.8e6 / (info["css"] * info["cssH"])) ** 0.5)))
            ok(abs(info["cw"] - exp) <= 3, f"canvas renders at device density: {info['cw']}px for {info['css']:.0f} css px (×{info['cw']/info['css']:.2f})")
            ok(info["bg"] >= 960 * 1.5, f"backgrounds pre-rendered at {info['bg']}px wide (not 960)")
            ok(abs(info["css"] / info["cssH"] - 16/9) < 0.01, "16:9 playfield, not stretched")
            ok(info["tier"] == 1 and info["hp"] == 3, "level starts with 1 shot and 3 lives")
            await pg.screenshot(path=f"/tmp/m_{name.split()[0]}.png")
            # ---- simultaneous touches: joystick drag + blast button
            cdp = await ctx.new_cdp_session(pg)
            box = await pg.locator(".specialbtn").bounding_box(); bx, by = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
            y0 = await pg.evaluate("()=>window.__lumi.game().player.y")
            sx, sy = w * 0.15, h * 0.7
            await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": sx, "y": sy, "id": 1}]})
            for i in range(1, 12):
                await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": sx, "y": sy - i * 6, "id": 1}]}); await pg.wait_for_timeout(30)
            await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": sx, "y": sy - 66, "id": 1}, {"x": bx, "y": by, "id": 2}]})
            await pg.wait_for_timeout(700)
            st = await pg.evaluate("()=>{const g=window.__lumi.game(); const a=g.player.charge>0||g.blast; for(let i=0;i<40;i++) updateGame(g,1/60,{autofire:true}); return {y:g.player.y, cd:g.player.specialCd, firing:g.player.firing && g.pbul.length>0, charged:a}}")
            await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
            ok(st["y"] < y0 - 20 and st["cd"] > 0 and st["firing"], f"move + blast at the same time (moved {y0 - st['y']:.0f}px up, blast cooldown {st['cd']:.1f}s, auto-fire resumes after the charge)")
            # ---- frame timing during play
            ft = await pg.evaluate("()=>new Promise(r=>{let n=0,t0=performance.now(),last=t0,worst=0;const f=(t)=>{worst=Math.max(worst,t-last);last=t;if(++n<120)requestAnimationFrame(f);else r({avg:(t-t0)/n,worst})};requestAnimationFrame(f)})")
            print(f"  INFO frame time avg {ft['avg']:.1f} ms, worst {ft['worst']:.0f} ms (headless software rendering; real GPUs are faster)")
            # ---- rotate to portrait mid-level and back
            t_before = await pg.evaluate("()=>window.__lumi.game().t"); gid = await pg.evaluate("()=>{window.__gref=window.__lumi.game(); return 1}")
            await pg.set_viewport_size({"width": h, "height": w}); await pg.wait_for_timeout(800)
            msg = await pg.locator(".rotatemsg").count(); scr = await pg.evaluate("()=>window.__lumi.screen()")
            ok(msg == 1 and scr == "paused", f"portrait → rotate message shown, game paused ({scr})")
            if name.startswith("iPhone"): await pg.screenshot(path="/tmp/m_portrait.png")
            await pg.set_viewport_size({"width": w, "height": h}); await pg.wait_for_timeout(800)
            same = await pg.evaluate("()=>window.__gref===window.__lumi.game()"); t_after = await pg.evaluate("()=>window.__lumi.game().t")
            info2 = await pg.evaluate("()=>{const c=document.querySelector('.stage canvas'); return {cw:c.width, css:c.getBoundingClientRect().width}}")
            ok(await pg.locator(".rotatemsg").count() == 0 and same and t_after >= t_before, f"back to landscape: same level continues (t {t_before:.1f}→{t_after:.1f}s), canvas {info2['cw']}px")
            pb = await pg.locator(".pausebtn").count() + await pg.locator(".panel").count()
            await pg.get_by_role("button", name="Resume", exact=True).tap(); await pg.wait_for_timeout(300)
            ok(await pg.evaluate("()=>window.__lumi.screen()") == "playing", "resume after rotating back")
            # controls inside the visible area
            for sel in [".specialbtn", ".pausebtn", ".joyzone"]:
                bb = await pg.locator(sel).bounding_box()
                ok(bb and bb["x"] >= 0 and bb["y"] >= 0 and bb["x"] + bb["width"] <= w + 1 and bb["y"] + bb["height"] <= h + 1, f"{sel} fully on screen")
            print("  errors:", errs)
            await ctx.close()
        await b.close()
asyncio.run(main())
