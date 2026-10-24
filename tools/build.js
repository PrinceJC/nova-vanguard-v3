// Builds public/index.html from src/. Usage: node tools/build.js [--test]
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), rd = (f) => fs.readFileSync(path.join(root, f), "utf8");
const test = process.argv.includes("--test");
const order = ["src/sprites.js", "shared/endless-rules.js", "src/avatars.js", "src/levels.js", "src/engine.js", "src/bosses.js", "src/render_base.js", "src/render_fx.js", "src/audio.js", "src/net.js", "src/app.js"];
const js = order.map((f) => `/* ${f} */\n` + rd(f)).join("\n");
const libs = test
  ? ["node_modules/.vendor/react.production.min.js", "node_modules/.vendor/react-dom.production.min.js", "tests/fake-backend.js"].map((f) => `<script>${rd(f)}</script>`).join("\n")
  : ['<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>',
     '<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>',
     '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"></script>'].join("\n");
const fonts = test ? "" : '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">';
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0d0719">
<title>Nova Vanguard — 100 levels. 20 heroes. One endless challenge.</title>
<meta name="description" content="Nova Vanguard: a 100-level side-scrolling space shooter with 20 heroes, 100 bosses and ranked daily and weekly endless leaderboards.">
<link rel="icon" href="icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="icon-180.png"><link rel="manifest" href="manifest.webmanifest">
${fonts}
<style>${rd("src/style.css")}</style>
</head>
<body>
<div id="root"></div>
${libs}
<script>
${js}
</script>
</body>
</html>`;
const outDir = path.join(root, test ? "tests" : "public");
for (const f of fs.readdirSync(path.join(root, "tools/static"))) fs.copyFileSync(path.join(root, "tools/static", f), path.join(outDir, f));
const out = path.join(outDir, test ? "test.html" : "index.html");
fs.writeFileSync(out, html);
console.log("built", path.relative(root, out), Math.round(html.length / 1024) + " KB");
