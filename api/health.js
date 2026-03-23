/**
 * ScheduleKeeper Health API
 * - GET  /api/health  → latest Apple Watch health snapshot
 * - POST /api/health  → receive health data from healthSync.js Scriptable script
 *
 * Storage: Vercel KV — add KV store in Vercel dashboard (Storage tab), env vars auto-injected.
 */

import { kv } from "@vercel/kv";

const WORKOUT_CATEGORY = {
  Running: "run",
  Cycling: "bike",
  Soccer: "football",
  Football: "football",
  TraditionalStrengthTraining: "other",
  FunctionalStrengthTraining: "other",
  Yoga: "pilates",
  Pilates: "pilates",
  Swimming: "other",
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const snapshot = await kv.get("sk:health:latest");
      return res.status(200).json(snapshot || null);
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  // ── POST ──────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const data = req.body || {};
    if (!data.date) data.date = new Date().toISOString().slice(0, 10);

    // Build completeByCategory actions for each workout
    const autoCompleteActions = [];
    if (Array.isArray(data.workouts)) {
      for (const w of data.workouts) {
        const cat = WORKOUT_CATEGORY[w.type] || null;
        if (cat) autoCompleteActions.push({ type: "completeByCategory", date: data.date, category: cat, duration_min: w.duration_min });
      }
    }

    // Compute readiness score (0–100)
    const hrScore    = data.resting_hr  ? Math.max(0, Math.min(40, (75 - data.resting_hr)  * 1.6)) : 20;
    const hrvScore   = data.hrv         ? Math.max(0, Math.min(40, data.hrv * 0.57))               : 20;
    const sleepScore = data.sleep_hours ? Math.max(0, Math.min(20, (data.sleep_hours / 9)  * 20))  : 10;
    const readiness  = Math.round(hrScore + hrvScore + sleepScore);

    const snapshot = { ...data, readiness, autoCompleteActions, received_at: Date.now() };

    try {
      await kv.set("sk:health:latest", snapshot);
      await kv.set(`sk:health:${data.date}`, snapshot);
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }

    return res.status(200).json({ ok: true, readiness, autoCompleteActions });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
