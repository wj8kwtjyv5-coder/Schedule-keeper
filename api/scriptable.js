/**
 * Serves the widget as a native .scriptable import file.
 * Opening it on iOS hands off to Scriptable, which shows a one-tap
 * "Add to My Scripts" screen — no code pasting, never drifts from
 * the deployed widget.js (fetched fresh from this deployment).
 */

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";

  let script;
  try {
    const r = await fetch(`${proto}://${host}/widget.js`);
    if (!r.ok) throw new Error(`widget.js fetch: ${r.status}`);
    script = await r.text();
  } catch (e) {
    res.setHeader("Content-Type", "application/json");
    return res.status(502).json({ error: "Could not load widget source", detail: String(e) });
  }

  const file = {
    always_run_in_app: false,
    icon: { color: "orange", glyph: "calendar" },
    name: "ScheduleKeeper",
    script,
    share_sheet_inputs: [],
  };

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Disposition", 'attachment; filename="ScheduleKeeper.scriptable"');
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(JSON.stringify(file));
}
