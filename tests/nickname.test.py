import asyncio, json
from playwright.async_api import async_playwright
URL = "file:///home/claude/v2/tests/test.html"
V1 = {"unlocked": 3, "completed": [True]*2 + [False]*8, "run": {"level": 3, "tier": 2, "score": 4000}}
def ok(c, m): print(("  PASS " if c else "  FAIL ") + m)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        pg = await b.new_page(viewport={"width": 1280, "height": 720}); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        S = lambda: pg.evaluate("()=>window.__lumi.screen()")
        await pg.goto(URL); await pg.evaluate(f"()=>{{localStorage.clear(); localStorage.setItem('lumi-blaster-save-v1', JSON.stringify({json.dumps(V1)}))}}"); await pg.reload(); await pg.wait_for_timeout(1500)
        ok(await pg.locator(".lhero >> text=Create Account").count() == 0, "landing: no account creation required (Play Now + Sign in)")
        await pg.evaluate("()=>window.__fake.seedRun('TakenOne', 50, new Date().toISOString())")
        await pg.click(".lhero >> text=Play Now"); await pg.wait_for_timeout(300)
        ok(await S() == "nickname", "Play Now opens the nickname screen")
        await pg.fill("input[autocomplete=nickname]", "takenone"); await pg.wait_for_timeout(600)
        ok("taken" in await pg.inner_text("#nickhint"), "taken nickname flagged: " + await pg.inner_text("#nickhint"))
        await pg.fill("input[autocomplete=nickname]", "SkyRunner"); await pg.wait_for_timeout(600); await pg.screenshot(path="/tmp/nick.png")
        await pg.click("text=Start playing"); await pg.wait_for_timeout(1500)
        ok(await S() == "menu", "nickname → straight to the main menu (no email, no password, no code)")
        sv = await pg.evaluate("()=>window.__lumi.save()"); ok(sv["campaign"]["unlocked"] == 3, "old local progress carried into the guest profile")
        ok("SkyRunner" in await pg.inner_text(".userchip"), "nickname shown in the menu")
        # ranked endless as a guest → leaderboard shows the nickname
        await pg.get_by_role("button", name="Endless mode", exact=True).click(); await pg.wait_for_timeout(1000); await pg.keyboard.down("Space"); await pg.wait_for_timeout(5000)
        for i in range(3):
            await pg.evaluate("()=>{const g=window.__lumi.game(); g.player.inv=0; g.player.shield=0; hurtPlayer(g);}"); await pg.wait_for_timeout(1250)
        await pg.keyboard.up("Space"); await pg.wait_for_timeout(2800)
        ok("Verified and ranked" in await pg.inner_text(".result"), "guest's Endless run is verified and ranked")
        await pg.click(".result >> text=Rankings"); await pg.wait_for_timeout(800)
        ok("SkyRunner" in await pg.inner_text(".board"), "nickname appears on the daily leaderboard")
        await pg.get_by_role("button", name="Back", exact=True).click()
        # reload: still signed in as the guest
        await pg.reload(); await pg.wait_for_timeout(1500)
        ok(await pg.locator(".lhero .lbtn.primary").inner_text() == "Continue Playing", "returning guest sees Continue Playing")
        await pg.locator(".lhero .lbtn.primary").click(); await pg.wait_for_timeout(1500); ok(await S() == "menu" and "SkyRunner" in await pg.inner_text(".userchip"), "same nickname after reload")
        # guest sign-out warning → save progress with email + password
        await pg.get_by_role("button", name="Sign out", exact=True).click(); await pg.wait_for_timeout(300)
        ok(await pg.locator("text=Sign out of a guest profile?").count() == 1, "guest sign-out shows a warning first")
        await pg.click("text=Save my progress"); await pg.wait_for_timeout(500)
        await pg.fill(".secure input[type=email]", "sky@example.com"); await pg.fill(".secure input[autocomplete=new-password] >> nth=0", "skyrun2026"); await pg.fill(".secure input[autocomplete=new-password] >> nth=1", "skyrun2026")
        await pg.click(".secure >> text=Save my progress"); await pg.wait_for_timeout(500)
        ok("Saved" in await pg.inner_text(".secure"), "guest secured progress with email + password")
        await pg.get_by_role("button", name="Back", exact=True).click(); await pg.get_by_role("button", name="Sign out", exact=True).click(); await pg.wait_for_timeout(600)
        await pg.click(".lhero >> text=Sign in"); await pg.fill("input[autocomplete=username]", "SkyRunner"); await pg.fill("input[autocomplete=current-password]", "skyrun2026"); await pg.click("button:has-text('Sign in')"); await pg.wait_for_timeout(1500)
        sv = await pg.evaluate("()=>window.__lumi.save()")
        ok(await S() == "menu" and sv["campaign"]["unlocked"] == 3, "signed back in with nickname + password; progress intact")
        # offline fallback: anonymous sign-in disabled on the server
        await pg.get_by_role("button", name="Sign out", exact=True).click(); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{window.__fakeNoAnon=true}")
        await pg.click(".lhero >> text=Play Now"); await pg.fill("input[autocomplete=nickname]", "Wanderer"); await pg.wait_for_timeout(600); await pg.click("text=Start playing"); await pg.wait_for_timeout(1200)
        ok(await S() == "menu" and "Wanderer" in await pg.inner_text(".userchip") and "offline" in (await pg.inner_text(".title")).lower(), "guest sign-in unavailable → plays offline with a local save")
        await pg.get_by_role("button", name="Endless mode", exact=True).click(); await pg.wait_for_timeout(1200)
        ok(await pg.evaluate("()=>window.__lumi.game() && window.__lumi.game().ranked===false"), "offline Endless runs as unranked practice")
        print("errors:", errs)
        await b.close()
asyncio.run(main())
