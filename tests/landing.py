import asyncio, json, time
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        for name, vp, mobile in [("desk", {"width": 1366, "height": 800}, False), ("mob", {"width": 390, "height": 844}, True)]:
            ctx = await b.new_context(viewport=vp, is_mobile=mobile, has_touch=mobile)
            pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto("file:///home/claude/v2/tests/test.html"); await pg.evaluate("()=>localStorage.clear()"); await pg.reload(); await pg.wait_for_timeout(1500)
            if name == "desk":
                print("empty board:", (await pg.inner_text("#rankings")).replace("\n"," | ")[:160])
                await pg.evaluate("()=>{window.__fake.seedRun('StarPilot', 48210, new Date().toISOString(), 'vega'); window.__fake.seedRun('Kira_7', 39100, new Date().toISOString(), 'sable');}")
                await pg.reload(); await pg.wait_for_timeout(1500)
                print("seeded board:", (await pg.inner_text("#rankings")).replace("\n"," | ")[:200])
                await pg.screenshot(path="/tmp/l_hero.png")
                await pg.locator("#gameplay").scroll_into_view_if_needed(); await pg.wait_for_timeout(6000); await pg.screenshot(path="/tmp/l_demo.png")
                await pg.screenshot(path="/tmp/l_full.png", full_page=True)
                for href in ["support.html", "privacy.html", "terms.html"]:
                    r = await pg.evaluate(f"()=>fetch('{href}').then(r=>r.ok).catch(()=>'file')")
                await pg.evaluate("()=>window.scrollTo(0,0)"); await pg.click("text=Create Account"); await pg.wait_for_timeout(400)
                print("Create Account →", await pg.evaluate("()=>window.__lumi.screen()"), "| title:", await pg.title())
            else:
                await pg.screenshot(path="/tmp/l_mob.png", full_page=False)
                await pg.locator("#heroes").scroll_into_view_if_needed(); await pg.wait_for_timeout(400); await pg.screenshot(path="/tmp/l_mob2.png")
            print(name, "errors:", errs)
        await b.close()
asyncio.run(main())
