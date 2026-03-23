/**
 * ScheduleKeeper Coach API
 * POST /api/coach — proxies to Anthropic Claude
 * Requires ANTHROPIC_API_KEY in Vercel environment variables.
 */

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ reply: "Method not allowed", actions: [] });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(200).json({ reply: "Add ANTHROPIC_API_KEY in Vercel environment variables.", actions: [] });

  const { message: msg = "", context: ctx = {} } = req.body || {};
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const system = `You are Coach, a performance coach for a football player. Today is ${today}, tomorrow is ${tomorrow}. Respond ONLY with valid JSON, no other text: {"reply":"warm 1-3 sentence reply","actions":[]}. Actions: {"type":"addTask","task":{"title":"...","date":"YYYY-MM-DD","time":"HH:MM","category":"run|football|game|bike|pilates|recovery|other","notes":"..."}} or {"type":"deleteTask","taskId":"..."} or {"type":"completeTask","taskId":"..."}. Always include at least one action for schedule requests. If match cancelled: delete game task, add quality training. If game today/tomorrow: add match task. If tired: add recovery session.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-3-haiku-20240307", max_tokens: 1000, system, messages: [{ role: "user", content: JSON.stringify({ message: msg, context: ctx }) }] }),
    });
    const data = await r.json();
    const raw = data?.content?.[0]?.text || "";
    let out;
    try { out = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
    catch { out = { reply: raw ? raw.slice(0, 300) : "No response — check API key has credits at console.anthropic.com", actions: [] }; }
    return res.status(200).json({ reply: String(out.reply || ""), actions: Array.isArray(out.actions) ? out.actions : [] });
  } catch (e) {
    return res.status(200).json({ reply: "Connection error: " + String(e.message || e), actions: [] });
  }
}
