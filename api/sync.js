/**
 * ScheduleKeeper Sync API
 * - GET  /api/sync                                → full state (Scriptable widget)
 * - POST /api/sync                                → save full state (web app)
 * - POST /api/sync?action=complete&taskId=ID      → mark task done
 * - POST /api/sync?action=completeNext            → mark first incomplete today done
 * - POST /api/sync?action=toggleHabit&habitId=ID  → toggle habit for today
 *
 * Storage: Vercel KV — add KV store in Vercel dashboard (Storage tab), env vars are auto-injected.
 */

import { kv } from "@vercel/kv";

const EMPTY = { tasks: [], habits: [], habitLogs: {} };

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function today() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const state = await kv.get("sk:state");
      return res.status(200).json(state || EMPTY);
    } catch (e) {
      return res.status(500).json({ error: String(e) });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { action, taskId, habitId } = req.query;

    // Mark a specific task complete
    if (action === "complete" && taskId) {
      try {
        const state = (await kv.get("sk:state")) || EMPTY;
        let found = null;
        state.tasks = (state.tasks || []).map(t => {
          if (t.id === taskId) { found = t; return { ...t, completed: true, completedAt: Date.now() }; }
          return t;
        });
        await kv.set("sk:state", state);
        return res.status(200).json({ ok: true, task: found?.title || taskId });
      } catch (e) {
        return res.status(500).json({ error: String(e) });
      }
    }

    // Mark first incomplete task today as done
    if (action === "completeNext") {
      try {
        const state = (await kv.get("sk:state")) || EMPTY;
        const t = today();
        let marked = null;
        state.tasks = (state.tasks || []).map(task => {
          if (marked) return task;
          if (task.date === t && !task.completed && task.category !== "work") {
            marked = task;
            return { ...task, completed: true, completedAt: Date.now() };
          }
          return task;
        });
        if (!marked) return res.status(200).json({ ok: false, message: "No tasks left today 🎉" });
        await kv.set("sk:state", state);
        return res.status(200).json({ ok: true, task: marked.title });
      } catch (e) {
        return res.status(500).json({ error: String(e) });
      }
    }

    // Toggle a habit for today
    if (action === "toggleHabit" && habitId) {
      try {
        const state = (await kv.get("sk:state")) || EMPTY;
        const key = `${habitId}_${today()}`;
        state.habitLogs = state.habitLogs || {};
        state.habitLogs[key] = !state.habitLogs[key];
        await kv.set("sk:state", state);
        const habit = (state.habits || []).find(h => h.id === habitId);
        return res.status(200).json({ ok: true, done: state.habitLogs[key], habit: habit?.title || habitId });
      } catch (e) {
        return res.status(500).json({ error: String(e) });
      }
    }

    // Default: save full state from web app
    try {
      const body = req.body; // Vercel auto-parses JSON bodies
      if (!body || typeof body !== "object") return res.status(400).json({ error: "Invalid JSON" });
      await kv.set("sk:state", body);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(400).json({ error: String(e) });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
