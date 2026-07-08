/**
 * ScheduleKeeper Sync API (Vercel)
 * - GET  /api/sync                              → returns full state (for Scriptable widget)
 * - POST /api/sync                              → saves full state (from web app)
 * - POST /api/sync?action=complete&taskId=ID    → marks one task done
 * - POST /api/sync?action=completeNext          → marks next task done
 * - POST /api/sync?action=toggleHabit&habitId=ID → toggles habit
 *
 * Storage: Vercel KV (set KV_REST_API_URL and KV_REST_API_TOKEN env vars)
 * Setup: vercel.com → Project → Storage → Create KV Database → Connect
 */

import { kv } from "@vercel/kv";

const STATE_KEY = "sk-state";

const cors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  // ── GET: return state for widget ────────────────────────────
  if (req.method === "GET") {
    try {
      const state = await kv.get(STATE_KEY);
      if (!state) return res.status(200).json({ tasks: [], habits: [], habitLogs: {} });
      return res.status(200).json(typeof state === "string" ? JSON.parse(state) : state);
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  // ── POST ─────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { action, taskId, habitId } = req.query || {};

    // Action: mark a specific task complete (used by iOS Shortcut / Back Tap)
    if (action === "complete" && taskId) {
      try {
        const raw = await kv.get(STATE_KEY);
        const state = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : { tasks: [], habits: [], habitLogs: {} };
        let found = null;
        state.tasks = (state.tasks || []).map(t => {
          if (t.id === taskId) { found = t; return { ...t, completed: true, completedAt: Date.now() }; }
          return t;
        });
        await kv.set(STATE_KEY, JSON.stringify(state));
        return res.status(200).json({ ok: true, task: found?.title || taskId });
      } catch (e) {
        return res.status(500).json({ error: String(e) });
      }
    }

    // Action: mark today's next incomplete task done
    if (action === "completeNext") {
      try {
        const raw = await kv.get(STATE_KEY);
        const state = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : { tasks: [], habits: [], habitLogs: {} };
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
        let marked = null;
        state.tasks = (state.tasks || []).map(t => {
          if (marked) return t;
          if (t.date === today && !t.completed && t.category !== "work") {
            marked = t;
            return { ...t, completed: true, completedAt: Date.now() };
          }
          return t;
        });
        if (!marked) return res.status(200).json({ ok: false, message: "No tasks left today 🎉" });
        await kv.set(STATE_KEY, JSON.stringify(state));
        return res.status(200).json({ ok: true, task: marked.title });
      } catch (e) {
        return res.status(500).json({ error: String(e) });
      }
    }

    // Action: toggle a habit for today
    if (action === "toggleHabit" && habitId) {
      try {
        const raw = await kv.get(STATE_KEY);
        const state = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : { tasks: [], habits: [], habitLogs: {} };
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
        const key = `${habitId}_${today}`;
        state.habitLogs = state.habitLogs || {};
        state.habitLogs[key] = !state.habitLogs[key];
        await kv.set(STATE_KEY, JSON.stringify(state));
        const habit = (state.habits || []).find(h => h.id === habitId);
        return res.status(200).json({ ok: true, done: state.habitLogs[key], habit: habit?.title || habitId });
      } catch (e) {
        return res.status(500).json({ error: String(e) });
      }
    }

    // Default POST: save full state from web app
    try {
      const body = req.body;
      const json = typeof body === "string" ? body : JSON.stringify(body);
      JSON.parse(json); // validate
      await kv.set(STATE_KEY, json);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  return res.status(405).end("Method Not Allowed");
}
