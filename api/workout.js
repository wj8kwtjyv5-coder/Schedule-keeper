/**
 * ScheduleKeeper Workout API (Vercel)
 * - GET  /api/workout  → returns last 30 days of workout data
 * - POST /api/workout  → merges new workouts (deduplicates by start time)
 *
 * Populated by Scriptable widget via HealthKit
 */

import { kv } from "@vercel/kv";

const WORKOUT_KEY = "sk-workouts";

const cors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

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

  if (req.method === "POST") {
    try {
      const body = req.body || {};
      const incoming = Array.isArray(body.workouts) ? body.workouts : [];
      if (!incoming.length) return res.status(200).json({ ok: true, merged: 0 });

      const raw = await kv.get(WORKOUT_KEY);
      const existing = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];

      const byStart = new Map(existing.map(w => [w.start, w]));
      let merged = 0;
      for (const w of incoming) {
        if (!byStart.has(w.start)) { byStart.set(w.start, w); merged++; }
      }

      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const updated = [...byStart.values()].filter(w => w.start >= cutoff)
        .sort((a, b) => b.start.localeCompare(a.start));

      await kv.set(WORKOUT_KEY, JSON.stringify(updated));
      return res.status(200).json({ ok: true, merged, total: updated.length });
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  return res.status(405).end("Method Not Allowed");
}
