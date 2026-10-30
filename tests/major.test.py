import asyncio, json
from playwright.async_api import async_playwright
URL = "file:///home/claude/v2/tests/test.html"
SEED = {"users":[{"id":"u1","email":"a@x.com","password":"pw123456x","confirmed":True}],"profiles":[{"id":"u1","username":"Pilot","avatar":"lumi","created_at":"2026-10-01T00:00:00Z"}],
        "saves":[{"user_id":"u1","data":{"campaign":{"unlocked":3,"completed":[True]*2+[False]*98},"shop":{"coins":2000}}}],"runs":[],"session":{"access_token":"tok-u1","user":{"id":"u1","email":"a@x.com"}}}
def ok(c, m): print(("  PASS " if c else "  FAIL ") + m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        ctx = await b.new_context(viewport={"width": 1280, "height": 720}); A = await ctx.new_page(); errs = []
        A.on("pageerror", lambda e: errs.append("A: " + str(e)))
        S = lambda pg: pg.evaluate("()=>window.__lumi.screen()")
        await A.goto(URL); await A.evaluate(f"()=>{{localStorage.clear(); localStorage.setItem('__fake_db', JSON.stringify({json.dumps(SEED)}))}}"); await A.reload(); await A.wait_for_timeout(1500)
        await A.locator(".lhero .lbtn.primary").click(); await A.wait_for_timeout(1500)
        ok("2,000" in await A.inner_text(".title"), "coins shown in the menu")
        # ---- shop: buy a skin and a part, then customise
        await A.click("text=Shop"); await A.wait_for_timeout(300); await A.click("text=Skins"); await A.wait_for_timeout(200)
        await A.locator(".shopitem:has-text('Gilded Vanguard') button").click(); await A.wait_for_timeout(300)
        sv = await A.evaluate("()=>window.__lumi.save().shop")
        ok("skin:lumi_gold" in sv["owned"] and sv["coins"] == 1400, f"bought a skin (coins {sv['coins']})")
        await A.click("text=Customize my hero"); await A.wait_for_timeout(400)
        await A.locator(".custrow:has-text('Skin') .chip:has-text('Gilded Vanguard')").click()
        await A.locator(".custrow:has-text('Headwear') .chip:has-text('Crown')").click(); await A.wait_for_timeout(300)
        await A.locator(".custrow:has-text('Back') .chip:has-text('Wings')").click(); await A.wait_for_timeout(300)
        sv = await A.evaluate("()=>window.__lumi.save().shop")
        ok(sv["custom"].get("lumi", {}).get("skin") == "lumi_gold" and sv["custom"]["lumi"].get("hat") == "crown" and sv["custom"]["lumi"].get("back") == "wings" and sv["coins"] == 1400 - 350 - 500, f"equipped skin + bought crown and wings (coins {sv['coins']})")
        await A.screenshot(path="/tmp/m_custom.png")
        await A.get_by_role("button", name="Back", exact=True).click(); await A.get_by_role("button", name="Back", exact=True).click(); await A.wait_for_timeout(300)
        # ---- joystick sensitivity setting
        await A.click("text=Settings") if await A.locator("text=Settings").count() else None
        await A.wait_for_timeout(300)
        if await A.locator("[aria-label='Joystick sensitivity'] >> text=High").count():
            await A.locator("[aria-label='Joystick sensitivity'] >> text=High").click(); await A.wait_for_timeout(200)
            ok(await A.evaluate("()=>window.__lumi.save().settings.joySens") == 1.5, "joystick sensitivity saved (High)")
            await A.click("text=Done"); await A.wait_for_timeout(300)
        # ---- campaign level: customised hero in play, coins awarded
        await A.get_by_role("button", name="Campaign", exact=True).click(); await A.wait_for_timeout(300); await A.locator(".tile:not(.locked)").first.click(); await A.wait_for_timeout(1500)
        key = await A.evaluate("()=>window.__lumi.game().av.key"); ok(key and "lumi_gold" in key and "crown" in key, "game uses the customised hero: " + str(key))
        coins0 = await A.evaluate("()=>window.__lumi.save().shop.coins")
        await A.evaluate("()=>{const g=window.__lumi.game(); g.god=true; g.score=4200; g.waveIdx=g.waves.length; g.enemies=[]; g.queue=[]; g.sinceLast=20;}")
        for i in range(30):
            await A.wait_for_timeout(500)
            st = await A.evaluate("()=>{const g=window.__lumi.game(); if(g&&g.boss&&!g.boss.entering&&!g.boss.dying){ g.boss.trans=0; damageBoss(g,{mult:1},1e6);} return window.__lumi.screen()}")
            if st == "complete": break
        await A.wait_for_timeout(500)
        coins1 = await A.evaluate("()=>window.__lumi.save().shop.coins"); txt = await A.inner_text(".result")
        ok(coins1 > coins0 and "Coins earned" in txt, f"level complete awards coins (+{coins1 - coins0})")
        await A.click("text=Main menu") if await A.locator("text=Main menu").count() else None; await A.wait_for_timeout(500)
        if await S(A) != "menu": await A.keyboard.press("Escape"); await A.wait_for_timeout(300)
        # ---- multiplayer between two tabs
        await A.get_by_role("button", name="Multiplayer", exact=True).click(); await A.wait_for_timeout(300); await A.click("text=Create a room"); await A.wait_for_timeout(800)
        code = (await A.evaluate("()=>window.__lumi.mp().code")); ok(code and len(code) == 6, "room created: " + str(code))
        B = await ctx.new_page(); B.on("pageerror", lambda e: errs.append("B: " + str(e)))
        await B.goto(URL + "?room=" + code); await B.wait_for_timeout(1500); await B.locator(".lhero .lbtn.primary").click(); await B.wait_for_timeout(2000)
        ok(await S(B) == "mp" and await B.evaluate("()=>window.__lumi.mp().phase") == "lobby", "invite link joins the room automatically")
        await A.wait_for_timeout(2500)
        n = await A.evaluate("()=>window.__lumi.mp().players.length"); ok(n == 2, f"host sees both players ({n})")
        await A.screenshot(path="/tmp/m_lobby.png")
        await A.click("text=Start duel"); await A.wait_for_timeout(4500)
        ok(await S(A) == "playing" and await S(B) == "playing", "both players start after the countdown")
        sa, sb = await A.evaluate("()=>window.__lumi.game().seed"), await B.evaluate("()=>window.__lumi.game().seed"); ok(sa == sb, "same waves (shared seed)")
        await A.wait_for_timeout(1500)
        opp = await A.evaluate("()=>window.__lumi.opp()"); ok(opp is not None and opp.get("hp") == 3, "host receives the rival's live state")
        await A.screenshot(path="/tmp/m_duel.png")
        for i in range(3):
            await B.evaluate("()=>{const g=window.__lumi.game(); g.player.inv=0; g.player.shield=0; hurtPlayer(g);}"); await B.wait_for_timeout(1100)
        await B.wait_for_timeout(2500)
        ok(await B.evaluate("()=>window.__lumi.mp().phase") == "wait", "defeated player waits while the rival keeps flying")
        await A.bring_to_front(); await A.wait_for_timeout(7000)   # background tabs pause their animation loop; on real devices each player is in front
        for i in range(3):
            await A.evaluate("()=>{const g=window.__lumi.game(); g.player.inv=0; g.player.shield=0; hurtPlayer(g);}"); await A.wait_for_timeout(1100)
        await A.wait_for_timeout(3000)
        ra, rb = await A.evaluate("()=>window.__lumi.mp().result"), await B.evaluate("()=>window.__lumi.mp().result")
        print("   ra:", ra and {k: ra[k] for k in ("win","mine","opp")}, " rb:", rb and {k: rb[k] for k in ("win","mine","opp")}, " phases:", await A.evaluate("()=>window.__lumi.mp().phase"), await B.evaluate("()=>window.__lumi.mp().phase"))
        ok(ra and rb and ra["win"] and not rb["win"], "longest survivor wins (host survived longer)")
        ok(abs(ra["opp"]["t"] - rb["mine"]["t"]) < 0.05 and abs(rb["opp"]["t"] - ra["mine"]["t"]) < 0.05, "both players see the same final times")
        await A.screenshot(path="/tmp/m_result.png")
        print("errors:", errs)
        await b.close()
asyncio.run(main())
