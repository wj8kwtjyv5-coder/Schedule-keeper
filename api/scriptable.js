/**
 * Serves the widget as a native .scriptable import file.
 * Opening it on iOS hands off to Scriptable, which shows a one-tap
 * "Add to My Scripts" screen — no code pasting.
 *
 * widget.js is read from the function's own filesystem (bundled via
 * vercel.json includeFiles) — never over HTTP, which Vercel's bot
 * protection can intercept with an HTML challenge page (seen in the
 * wild as "SyntaxError: Unexpected token '<'" inside Scriptable).
 */

import { readFileSync } from "fs";
import { join } from "path";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");

  let script = null;
  for (const p of [
    join(process.cwd(), "widget.js"),
    join(process.cwd(), "..", "widget.js"),
  ]) {
    try { script = readFileSync(p, "utf8"); break; } catch {}
  }

  // Fallback: same-deployment fetch — but never ship an HTML challenge page
  if (!script) {
    try {
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const proto = req.headers["x-forwarded-proto"] || "https";
      const r = await fetch(`${proto}://${host}/widget.js`);
      const text = await r.text();
      if (r.ok && !text.trimStart().startsWith("<")) script = text;
    } catch {}
  }

  if (!script) {
    res.setHeader("Content-Type", "application/json");
    return res.status(502).json({ error: "Could not load widget source" });
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
