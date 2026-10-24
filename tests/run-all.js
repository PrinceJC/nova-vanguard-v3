// Runs every automated test. Browser tests (tests/*.py) need Playwright + Chromium and are run separately.
const { execSync } = require("child_process");
for (const c of ["node tests/weapon.test.js", "node tests/endless.test.js", "node tests/api.test.js", "node tests/save.test.js", "node tests/db.test.mjs", "node tests/sim.js campaign god 1 100"]) {
  console.log("\n▶ " + c); execSync(c, { stdio: "inherit", cwd: __dirname + "/.." });
}
