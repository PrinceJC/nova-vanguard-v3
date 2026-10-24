import asyncio, json
from playwright.async_api import async_playwright
SEED = {"users":[{"id":"u1","email":"a@x.com"}],"profiles":[{"id":"u1","username":"Lumi_01","avatar":"lumi","created_at":"2026-10-01T00:00:00Z"}],"saves":[{"user_id":"u1","data":{"campaign":{"unlocked":100,"completed":[True]*80+[False]*20}}}],"runs":[],"session":{"access_token":"t","user":{"id":"u1","email":"a@x.com"}}}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        pg = await b.new_page(viewport={"width": 1280, "height": 720}); errs=[]
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/v2/tests/test.html"); await pg.evaluate(f"()=>{{localStorage.clear(); localStorage.setItem('__fake_db', JSON.stringify({json.dumps(SEED)}))}}")
        await pg.reload(); await pg.wait_for_timeout(2000)
        print("screen", await pg.evaluate("()=>window.__lumi.screen()"))
        await pg.evaluate("()=>window.__goPlay && window.__goPlay()")
        await pg.evaluate("()=>{}")
        for sel in ["text=Play Now", "text=Continue Playing"]:
            if await pg.locator(sel).count(): await pg.locator(sel).first.click(); break
        await pg.wait_for_timeout(1500)
        if await pg.locator("text=Campaign").count(): await pg.locator("button:has-text('Campaign')").first.click(); await pg.wait_for_timeout(300); await pg.click(".tile >> nth=3")
        await pg.wait_for_timeout(3500); await pg.keyboard.down("Space")
        await pg.evaluate("()=>{const g=window.__lumi.game(); g.god=true; g.player.tier=3; spawnEnemy(g,'shield_pod',200,700,{elite:true}); spawnEnemy(g,'scout_drone',380,760); spawnEnemy(g,'wing_bot',140,820); spawnEnemy(g,'frost_drone',300,880);}")
        await pg.wait_for_timeout(900); await pg.screenshot(path="/tmp/g_scale.png")
        await pg.evaluate("()=>{const g=window.__lumi.game(); g.player.specialCd=0; for(let i=0;i<14;i++) shoot(g,600,100+i*30,Math.PI,120,{c:i%2?'m':'o'}); input=null; special(g);}")
        await pg.wait_for_timeout(700); await pg.screenshot(path="/tmp/g_blast.png")
        await pg.evaluate("()=>{const g=window.__lumi.game(); g.player.tier=1; const e=spawnEnemy(g,'glacier_guard',260,500,{elite:true}); e.t=1; damageEnemy(g,e,999,true);}")
        await pg.wait_for_timeout(500); await pg.screenshot(path="/tmp/g_elite.png")
        print("pickups:", await pg.evaluate("()=>window.__lumi.game().pickups.map(k=>k.kind)"), "ERR", errs)
        await b.close()
asyncio.run(main())
