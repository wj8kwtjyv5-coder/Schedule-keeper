/**
 * ScheduleKeeper Workout API (Vercel)
 * - GET  /api/workout                    → returns last 30 days of workout data
 * - GET  /api/workout?add=1&wt=...       → ingests ONE workout from query params
 *   (single "Get Contents of URL" action in an iOS Shortcuts automation —
 *    runs fully in the background, never opens the app)
 * - POST /api/workout {workouts:[...]}   → merges a batch (Scriptable widget)
 *
 * All ingest paths dedup by workout start timestamp.
 * Optional auth: set SK_TOKEN env var to require ?k=<token> on writes.
 */

import { kv } from "@vercel/kv";

const WORKOUT_KEY = "sk-workouts";

const cors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");
};

async function mergeWorkouts(incoming) {
  const raw = await kv.get(WORKOUT_KEY);
  const existing = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
  const byStart = new Map(existing.map(w => [w.start, w]));
  let merged = 0;
  for (const w of incoming) {
    if (w?.start && !byStart.has(w.start)) { byStart.set(w.start, w); merged++; }
  }
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const updated = [...byStart.values()].filter(w => w.start >= cutoff)
    .sort((a, b) => b.start.localeCompare(a.start));
  await kv.set(WORKOUT_KEY, JSON.stringify(updated));
  return { merged, total: updated.length };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const q = req.query || {};
  const token = process.env.SK_TOKEN;

  // ── GET ?add=1 — single-workout ingest from query params ────
  if (req.method === "GET" && q.add === "1") {
    if (token && q.k !== token) return res.status(401).json({ error: "unauthorized" });
    if (!q.wt) return res.status(400).json({ error: "wt required" });
    try {
      const start = q.wstart || new Date().toISOString();
      const w = {
        type: q.wt,
        duration: q.wd ? Number(q.wd) : null,
        calories: q.wcal ? Number(q.wcal) : null,
        distance: q.wdist ? parseFloat(q.wdist) : null,
        avgHR: q.whr ? Number(q.whr) : null,
        start,
        end: q.wend || start,
      };
      const { merged, total } = await mergeWorkouts([w]);
      return res.status(200).json({ ok: true, merged, total });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  // ── GET — list last 30 days ──────────────────────────────────
  if (req.method === "GET") {
    try {
      const raw = await kv.get(WORKOUT_KEY);
      const workouts = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      return res.status(200).json(workouts.filter(w => w.start >= cutoff));
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  // ── POST — batch merge from Scriptable widget ────────────────
  if (req.method === "POST") {
    if (token && q.k !== token) return res.status(401).json({ error: "unauthorized" });
    try {
      const body = req.body || {};
      const incoming = Array.isArray(body.workouts) ? body.workouts : [];
      if (!incoming.length) return res.status(200).json({ ok: true, merged: 0 });
      const { merged, total } = await mergeWorkouts(incoming);
      return res.status(200).json({ ok: true, merged, total });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  return res.status(405).end("Method Not Allowed");
}
