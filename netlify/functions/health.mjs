/**
 * ScheduleKeeper Health API
 * - GET  /.netlify/functions/health           → returns latest health snapshot
 * - POST /.netlify/functions/health           → receives Apple Watch health data from Scriptable
 *
 * Incoming POST body (from healthSync.js Scriptable script):
 * {
 *   date: "YYYY-MM-DD",
 *   resting_hr: 52,
 *   baseline_hr: 50,       // user's personal baseline (7-day avg), optional
 *   hrv: 65,               // HRV in ms (SDNN)
 *   sleep_hours: 7.5,
 *   sleep_quality: "good", // "good" | "ok" | "poor"
 *   workouts: [
 *     { type: "Running", start_time: "06:15", duration_min: 32, calories: 380, avg_hr: 158, max_hr: 175 }
 *   ]
 * }
 *
 * Storage: Netlify Blobs — no env vars needed on Netlify.
 */

import { getStore } from "@netlify/blobs";

const cors = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
});

// Map Apple Watch workout type strings to app task categories
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

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(), body: "" };
  }

  let store;
  try {
    store = getStore("sk-health");
  } catch (e) {
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: "Blobs not available." }) };
  }

  // ── GET: return latest health snapshot ────────────────────────────────────
  if (event.httpMethod === "GET") {
    try {
      const raw = await store.get("latest");
      if (!raw) return { statusCode: 200, headers: cors(), body: JSON.stringify(null) };
      return { statusCode: 200, headers: cors(), body: raw };
    } catch (e) {
      return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: String(e) }) };
    }
  }

  // ── POST: receive health data from Scriptable ──────────────────────────────
  if (event.httpMethod === "POST") {
    let data;
    try {
      data = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: "Invalid JSON" }) };
    }

    // Validate minimal payload
    if (!data.date) data.date = new Date().toISOString().slice(0, 10);

    // Build actions: auto-complete tasks if matching workouts found
    // (The app will apply these on the next sync/load via completeTask actions)
    const autoCompleteActions = [];
    if (Array.isArray(data.workouts)) {
      for (const w of data.workouts) {
        const cat = WORKOUT_CATEGORY[w.type] || null;
        if (cat) {
          // Signal to the app: "a workout of this category happened today"
          // The app will find the first uncompleted matching task and complete it
          autoCompleteActions.push({ type: "completeByCategory", date: data.date, category: cat, duration_min: w.duration_min });
        }
      }
    }

    // Compute a simple readiness score (0–100)
    const hrScore   = data.resting_hr ? Math.max(0, Math.min(40, (75 - data.resting_hr) * 1.6)) : 20;
    const hrvScore  = data.hrv        ? Math.max(0, Math.min(40, data.hrv * 0.57)) : 20;
    const sleepScore= data.sleep_hours? Math.max(0, Math.min(20, (data.sleep_hours / 9) * 20)) : 10;
    const readiness = Math.round(hrScore + hrvScore + sleepScore);
    const snapshot  = { ...data, readiness, autoCompleteActions, received_at: Date.now() };

    try {
      await store.set("latest", JSON.stringify(snapshot));
      // Also archive by date so history is preserved
      await store.set(`health_${data.date}`, JSON.stringify(snapshot));
    } catch (e) {
      return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: String(e) }) };
    }

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({ ok: true, readiness, autoCompleteActions }),
    };
  }

  return { statusCode: 405, headers: cors(), body: JSON.stringify({ error: "Method not allowed" }) };
}
