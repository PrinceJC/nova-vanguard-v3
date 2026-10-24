// Server-only Supabase access. The service-role key never reaches the browser.
const { createClient } = require("@supabase/supabase-js");
const { HttpError } = require("./runs.js");

function env() {
  const url = process.env.SUPABASE_URL, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missing = [!url && "SUPABASE_URL", !service && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
  if (missing.length) throw new HttpError(500, "Server is missing configuration: " + missing.join(", "));
  return { url, service };
}
let admin = null;
function adminClient() { if (!admin) { const { url, service } = env(); admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }); } return admin; }

async function requireUser(req) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) throw new HttpError(401, "Sign in to play ranked runs.");
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data || !data.user) throw new HttpError(401, "Your session expired. Sign in again.");
  return data.user;
}

const store = {
  async getProfile(id) { const { data, error } = await adminClient().from("profiles").select("id,username,avatar").eq("id", id).maybeSingle(); if (error) throw error; return data; },
  async countRunsSince(id, since) { const { count, error } = await adminClient().from("runs").select("id", { count: "exact", head: true }).eq("user_id", id).gte("started_at", since.toISOString()); if (error) throw error; return count || 0; },
  async abandonOpenRuns(id) { const { error } = await adminClient().from("runs").update({ status: "abandoned", finished_at: new Date().toISOString() }).eq("user_id", id).eq("status", "open"); if (error) throw error; },
  async insertRun(row) { const { data, error } = await adminClient().from("runs").insert(row).select("id").single(); if (error) throw error; return data; },
  async getRun(id, userId) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await adminClient().from("runs").select("*").eq("id", id).eq("user_id", userId).maybeSingle(); if (error) throw error; return data;
  },
  async finishOpenRun(id, userId, patch) { const { data, error } = await adminClient().from("runs").update(patch).eq("id", id).eq("user_id", userId).eq("status", "open").select("id"); if (error) throw error; return data && data.length > 0; },
};

function handler(fn) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      if (req.method !== "POST") throw new HttpError(405, "Use POST.");
      const out = await fn(req);
      res.status(200).json(out);
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) console.error(e);
      res.status(status).json({ ok: false, error: status === 500 && !e.status ? "Server error. Try again in a moment." : e.message, ...(e.extra || {}) });
    }
  };
}
module.exports = { requireUser, store, handler, adminClient };
