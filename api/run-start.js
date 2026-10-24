const { requireUser, store, handler } = require("./_lib/supabase.js");
const { startRun } = require("./_lib/runs.js");
module.exports = handler(async (req) => startRun(store, await requireUser(req)));
