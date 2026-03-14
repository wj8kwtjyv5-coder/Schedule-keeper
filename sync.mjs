/**
 * ScheduleKeeper Sync API
 * - GET  /.netlify/functions/sync           → returns full state (for Scriptable widget)
 * - POST /.netlify/functions/sync           → saves full state (from web app)
 * - POST /.netlify/functions/sync?action=complete&taskId=ID  → marks one task done
 *
 * Storage: Netlify Blobs (free tier, built-in)
 * No env vars needed — works out of the box on Netlify.
 */

import { getStore } from "@netlify/blobs";

const cors = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
});

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(), body: "" };
  }

  let store;
  try {
    store = getStore("sk-state");
  } catch (e) {
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: "Blobs not available. Deploy via Git-connected Netlify (not drag-and-drop)." }) };
  }

  // ── GET: return state for widget ──────────────────────────────────────────
  if (event.httpMethod === "GET") {
    try {
      const raw = await store.get("state");
      if (!raw) return { statusCode: 200, headers: cors(), body: JSON.stringify({ tasks: [], habits: [], habitLogs: {} }) };
      return { statusCode: 200, headers: cors(), body: raw };
    } catch (e) {
      return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: String(e) }) };
    }
  }

  // ── POST ──────────────────────────────────────────────────────────────────
  if (event.httpMethod === "POST") {
    const params = new URLSearchParams(event.rawQuery || "");
    const action = params.get("action");
    const taskId = params.get("taskId");

    // Action: mark a specific task complete (used by iOS Shortcut / Back Tap)
    if (action === "complete" && taskId) {
      try {
        const raw = await store.get("state");
        const state = raw ? JSON.parse(raw) : { tasks: [], habits: [], habitLogs: {} };
        let found = null;
        state.tasks = (state.tasks || []).map(t => {
          if (t.id === taskId) { found = t; return { ...t, completed: true, completedAt: Date.now() }; }
          return t;
        });
        await store.set("state", JSON.stringify(state));
        return { statusCode: 200, headers: cors(), body: JSON.stringify({ ok: true, task: found?.title || taskId }) };
      } catch (e) {
        return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: String(e) }) };
      }
    }

    // Action: mark today's FIRST incomplete task done (used by "Back Tap" shortcut)
    if (action === "completeNext") {
      try {
        const raw = await store.get("state");
        const state = raw ? JSON.parse(raw) : { tasks: [], habits: [], habitLogs: {} };
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
        const curTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
        let marked = null;
        state.tasks = (state.tasks || []).map(t => {
          if (marked) return t;
          if (t.date === today && !t.completed && t.category !== "work") {
            marked = t;
            return { ...t, completed: true, completedAt: Date.now() };
          }
          return t;
        });
        if (!marked) return { statusCode: 200, headers: cors(), body: JSON.stringify({ ok: false, message: "No tasks left today 🎉" }) };
        await store.set("state", JSON.stringify(state));
        return { statusCode: 200, headers: cors(), body: JSON.stringify({ ok: true, task: marked.title }) };
      } catch (e) {
        return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: String(e) }) };
      }
    }

    // Action: toggle a habit for today
    if (action === "toggleHabit") {
      const habitId = params.get("habitId");
      if (!habitId) return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: "habitId required" }) };
      try {
        const raw = await store.get("state");
        const state = raw ? JSON.parse(raw) : { tasks: [], habits: [], habitLogs: {} };
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
        const key = `${habitId}_${today}`;
        state.habitLogs = state.habitLogs || {};
        state.habitLogs[key] = !state.habitLogs[key];
        await store.set("state", JSON.stringify(state));
        const habit = (state.habits||[]).find(h=>h.id===habitId);
        return { statusCode: 200, headers: cors(), body: JSON.stringify({ ok: true, done: state.habitLogs[key], habit: habit?.title||habitId }) };
      } catch (e) {
        return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: String(e) }) };
      }
    }

    // Default POST: save full state from web app
    try {
      const body = event.body || "{}";
      JSON.parse(body); // validate JSON
      await store.set("state", body);
      return { statusCode: 200, headers: cors(), body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: "Invalid JSON" }) };
    }
  }

  return { statusCode: 405, headers: cors(), body: "Method Not Allowed" };
}
