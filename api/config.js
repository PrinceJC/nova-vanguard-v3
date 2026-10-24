// Public configuration for the browser. The anon key is designed to be public; access is enforced by row-level security.
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const url = process.env.SUPABASE_URL, anonKey = process.env.SUPABASE_ANON_KEY;
  const missing = [!url && "SUPABASE_URL", !anonKey && "SUPABASE_ANON_KEY", !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean);
  if (missing.length) return res.status(500).json({ ok: false, missing });
  res.status(200).json({ ok: true, url, anonKey });
};
