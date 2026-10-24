const { requireUser, store, handler } = require("./_lib/supabase.js");
const { submitRun } = require("./_lib/runs.js");
module.exports = handler(async (req) => {
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  return submitRun(store, await requireUser(req), body);
});
