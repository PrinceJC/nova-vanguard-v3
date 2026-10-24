import asyncio, json
from playwright.async_api import async_playwright
URL = "file:///home/claude/v2/tests/test.html"
V1 = {"unlocked": 4, "completed": [True]*3 + [False]*7, "run": {"level": 4, "tier": 3, "score": 9000}}
def ok(cond, msg): print(("  PASS " if cond else "  FAIL ") + msg); return cond
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        pg = await b.new_page(viewport={"width": 1280, "height": 720})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: errs.append(m.text) if m.type == "error" and "favicon" not in m.text else None)
        await pg.goto(URL); await pg.evaluate(f"()=>{{localStorage.clear(); localStorage.setItem('lumi-blaster-save-v1', JSON.stringify({json.dumps(V1)}))}}"); await pg.reload(); await pg.wait_for_timeout(1500)
        S = lambda: pg.evaluate("()=>window.__lumi.screen()")
        # ---------- sign-up: username → password → email → code → menu
        await pg.click(".lhero >> text=Create Account")
        await pg.fill("input[autocomplete=username]", "Nova_Pilot"); await pg.wait_for_timeout(600); await pg.click("text=Next")
        await pg.fill("input[autocomplete=new-password] >> nth=0", "short"); await pg.click("button:has-text('Next')")
        ok("at least 8" in (await pg.inner_text("#pwhint")).lower(), "weak password rejected: " + await pg.inner_text("#pwhint"))
        await pg.fill("input[autocomplete=new-password] >> nth=0", "starlight42"); await pg.fill("input[autocomplete=new-password] >> nth=1", "starlight41"); await pg.click("button:has-text('Next')")
        ok("match" in await pg.inner_text("#pwhint"), "mismatch caught")
        await pg.fill("input[autocomplete=new-password] >> nth=1", "starlight42"); await pg.click("button:has-text('Next')")
        # phone validation messages, then switch to email
        await pg.get_by_role("radio", name="Mobile number").click()
        await pg.fill("input[type=tel]", "0917 123"); await pg.wait_for_timeout(100); m1 = await pg.inner_text("#phonehint")
        await pg.fill("input[type=tel]", "0917 123 4567"); await pg.wait_for_timeout(100); m2 = await pg.inner_text("#phonehint")
        ok("digits" in m1 and "+63 917 123 4567" in m2, f"phone guidance: '{m1}' → '{m2}'")
        await pg.screenshot(path="/tmp/a_phone.png")
        await pg.get_by_role("radio", name="Email").click(); await pg.fill("input[type=email]", "nova@example.com"); await pg.click("button:has-text('Create account')"); await pg.wait_for_timeout(400)
        await pg.screenshot(path="/tmp/a_code.png")
        ok("tap it" in await pg.inner_text(".auth"), "code screen explains code OR link")
        await pg.fill("input.code", "123456"); await pg.click("button:has-text('Verify')"); await pg.wait_for_timeout(1600)
        ok(await S() == "menu", "signed up and reached menu")
        sv = await pg.evaluate("()=>window.__lumi.save()"); ok(sv["campaign"]["unlocked"] == 4, "old local progress migrated (unlocked 4)")
        # ---------- sign out → sign in with username + password
        await pg.get_by_role("button", name="Sign out", exact=True).click(); await pg.wait_for_timeout(500)
        await pg.click(".lhero >> text=Play Now")
        await pg.fill("input[autocomplete=username]", "nova_pilot"); await pg.fill("input[autocomplete=current-password]", "wrongpass1"); await pg.click("button:has-text('Sign in')"); await pg.wait_for_timeout(300)
        ok("don’t match" in await pg.inner_text(".err"), "wrong password error: " + await pg.inner_text(".err"))
        await pg.fill("input[autocomplete=current-password]", "starlight42"); await pg.click("button:has-text('Sign in')"); await pg.wait_for_timeout(1500)
        ok(await S() == "menu", "username + password sign-in (case-insensitive username), no email code")
        # ---------- change password in profile
        await pg.get_by_role("button", name="Profile", exact=True).click(); await pg.wait_for_timeout(400)
        await pg.fill(".cols2 input[autocomplete=new-password] >> nth=0", "galaxy2027"); await pg.fill(".cols2 input[autocomplete=new-password] >> nth=1", "galaxy2027"); await pg.click("text=Update password"); await pg.wait_for_timeout(300)
        ok("updated" in await pg.inner_text(".ok"), "password changed in profile")
        await pg.get_by_role("button", name="Sign out", exact=True).click(); await pg.wait_for_timeout(400)
        # ---------- forgot password → code → new password → sign in
        await pg.click(".lhero >> text=Play Now"); await pg.click("text=Forgot password?")
        await pg.fill("input[type=email]", "nova@example.com"); await pg.click("button:has-text('Send code')"); await pg.wait_for_timeout(300)
        await pg.fill("input.code", "123456"); await pg.click("button:has-text('Verify')"); await pg.wait_for_timeout(800)
        await pg.fill("input[autocomplete=new-password] >> nth=0", "recovered99"); await pg.fill("input[autocomplete=new-password] >> nth=1", "recovered99"); await pg.click("text=Save password"); await pg.wait_for_timeout(1500)
        ok(await S() == "menu", "recovered account and set a new password")
        await pg.get_by_role("button", name="Sign out", exact=True).click(); await pg.wait_for_timeout(400)
        await pg.click(".lhero >> text=Play Now"); await pg.fill("input[autocomplete=username]", "Nova_Pilot"); await pg.fill("input[autocomplete=current-password]", "recovered99"); await pg.click("button:has-text('Sign in')"); await pg.wait_for_timeout(1500)
        ok(await S() == "menu", "signed in with the new password")
        # ---------- avatar selection screen
        await pg.evaluate("()=>{const s=window.__lumi.save();}")
        await pg.get_by_role("button", name="Avatars", exact=True).click(); await pg.wait_for_timeout(1200); await pg.screenshot(path="/tmp/a_avatars.png")
        info = await pg.inner_text(".avinfo"); ok("Shield" in info and "Nova" in info, "selection shows name + weapon category: " + info.split("\n")[1][:60])
        await pg.click(".avtile:has-text(\"Lumi\")"); await pg.wait_for_timeout(300); await pg.click("text=Use Lumi"); await pg.wait_for_timeout(300)
        ok((await pg.evaluate("()=>window.__lumi.save()"))["avatars"]["selected"] == "nova", "selected Lumi (sniper)")
        await pg.get_by_role("button", name="Back", exact=True).click()
        # ---------- campaign: weapon resets on retry after game over
        await pg.get_by_role("button", name="Campaign", exact=True).click(); await pg.wait_for_timeout(300); await pg.click(".page header >> text=Continue"); await pg.wait_for_timeout(3200)
        await pg.keyboard.down("Space")
        await pg.evaluate("()=>{const g=window.__lumi.game(); g.player.tier=3; for(const [t,y,x] of [['scout_drone',200,640],['wing_bot',330,720],['frost_drone',420,820]]) spawnEnemy(g,t,y,x);}")
        await pg.wait_for_timeout(700); await pg.screenshot(path="/tmp/a_sniper.png")
        await pg.evaluate("()=>{const g=window.__lumi.game(); for(let i=0;i<5;i++){g.player.inv=0;g.player.shield=0;hurtPlayer(g);} }"); await pg.wait_for_timeout(2600)
        await pg.click("text=Retry level"); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("()=>window.__lumi.game().player.tier") == 1, "retry after game over resets weapon to one shot")
        # clear this level with six shots, continue: the next level must start at one shot, progress kept
        lvl = await pg.evaluate("()=>window.__lumi.game().level")
        await pg.evaluate("()=>{const g=window.__lumi.game(); g.god=true; g.player.tier=3; g.waveIdx=g.waves.length; g.enemies=[]; g.queue=[]; g.sinceLast=20;}")
        for i in range(30):
            await pg.wait_for_timeout(500)
            st = await pg.evaluate("()=>{const g=window.__lumi.game(); if(g&&g.boss&&!g.boss.entering&&!g.boss.dying){ g.player.tier=3; g.boss.trans=0; damageBoss(g,{mult:1},1e6);} return window.__lumi.screen()}")
            if st == "complete": break
        await pg.wait_for_timeout(600); await pg.click("text=Continue"); await pg.wait_for_timeout(600)
        g2 = await pg.evaluate("()=>({level: window.__lumi.game().level, tier: window.__lumi.game().player.tier})")
        sv = await pg.evaluate("()=>window.__lumi.save().campaign")
        ok(g2["level"] == lvl + 1 and g2["tier"] == 1, f"finished {lvl} with 6 shots → level {g2['level']} starts with {g2['tier']} shot")
        ok(sv["unlocked"] >= lvl + 1 and sv["completed"][lvl - 1], "unlocked levels and completion kept")
        await pg.keyboard.press("Escape"); await pg.click("text=Main menu"); await pg.get_by_role("button", name="Campaign", exact=True).click(); await pg.wait_for_timeout(300)
        await pg.click(f".tile >> nth={lvl - 1}"); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("()=>window.__lumi.game().player.tier") == 1, "replaying a level from the map starts with one shot")
        await pg.keyboard.up("Space"); await pg.keyboard.press("Escape"); await pg.click("text=Main menu")
        # ---------- archer in endless: no enemy bullets, ranked submission works
        await pg.get_by_role("button", name="Avatars", exact=True).click(); await pg.click(".avtile >> nth=0"); await pg.wait_for_timeout(200)
        await pg.evaluate("()=>{const s=window.__lumi.save();}")
        await pg.get_by_role("button", name="Back", exact=True).click()
        await pg.evaluate("()=>{}")
        await pg.get_by_role("button", name="Endless mode", exact=True).click(); await pg.wait_for_timeout(1000); await pg.keyboard.down("Space")
        await pg.evaluate("()=>{const g=window.__lumi.game(); g.player.tier=2;}")
        await pg.wait_for_timeout(9000); await pg.screenshot(path="/tmp/a_endless.png")
        ok(await pg.evaluate("()=>window.__lumi.game().ebul.length") == 0, "endless has no enemy projectiles")
        for i in range(5):
            await pg.evaluate("()=>{const g=window.__lumi.game(); g.player.inv=0; g.player.shield=0; hurtPlayer(g);}"); await pg.wait_for_timeout(1250)
        await pg.keyboard.up("Space"); await pg.wait_for_timeout(3000)
        ok("Verified and ranked" in await pg.inner_text(".result"), "endless run verified by the server rules (v5)")
        res_txt = await pg.inner_text(".result"); ok("Best score" in res_txt and "Longest survival" in res_txt, "results show best score and longest survival")
        await pg.click("text=Play again"); await pg.wait_for_timeout(1200)
        bst = await pg.evaluate("()=>window.__lumi.game().best"); verified = await pg.evaluate("()=>window.__fake.db.runs.filter(r=>r.status==='valid'&&r.id.startsWith('run')).map(r=>r.score)")
        ok(bst is not None and bst["score"] == max(verified) and bst["ms"] > 0, f"next run shows records in the HUD: best {bst and bst['score']}, longest {bst and round(bst['ms']/1000,1)}s")
        await pg.wait_for_timeout(1500); await pg.screenshot(path="/tmp/best_hud.png")
        await pg.keyboard.press("Escape"); await pg.click("text=Main menu")
        # ---------- (results screen was left via Main menu above)
        # ---------- three archer/gun/cannon gameplay shots
        for av, path in [("aria", "/tmp/a_bow.png"), ("zephyr", "/tmp/a_gun.png"), ("lumi", "/tmp/a_cannon.png")]:
            await pg.evaluate(f"()=>{{ const g=createGame({{mode:'campaign',level:3,tier:3,avatar:'{av}',god:true}}); g.state='waves'; g.waveIdx=99; window.__shotGame=g; }}")
            await pg.evaluate("""()=>{const g=window.__shotGame; const c=document.querySelector('canvas'); const ctx=c.getContext('2d'); const inp={fire:true};
              spawnEnemy(g,'scout_drone',200,700); spawnEnemy(g,'shield_pod',320,800,{elite:true}); for(let i=0;i<24;i++) updateGame(g,1/60,inp);
              const sc=c.width/960; ctx.setTransform(sc,0,0,sc,0,0); drawGame(ctx,g,{quality:2,shake:0},performance.now()); }""")
            await pg.screenshot(path=path)
        print("console/page errors:", errs)
        await b.close()
asyncio.run(main())
