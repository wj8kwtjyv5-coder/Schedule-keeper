const cors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Content-Type", "application/json");
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = (process.env.ANTHROPICAPIKEY || process.env.ANTHROPIC_API_KEY || "").replace(/\s+/g, "");
  if (!apiKey) return res.status(200).json({ error: "no_key" });

  let payload;
  try { payload = req.body || {}; }
  catch { return res.status(200).json({ error: "invalid_request" }); }

  const { foodText, imageBase64, mimeType } = payload;
  if (!foodText && !imageBase64) return res.status(200).json({ error: "no_input" });

  const system = `You are a nutrition expert. Estimate macros for the meal described or shown. Return ONLY valid JSON, no other text: {"name":"short meal name","cal":500,"protein":35,"carbs":48,"fat":12}. Round to nearest integer. Assume realistic home/restaurant portions. If multiple foods, sum all totals together.`;

  const messages = imageBase64
    ? [{ role: "user", content: [
        { type: "image", source: { type: "base64", media_type: mimeType || "image/jpeg", data: imageBase64 } },
        { type: "text", text: "Estimate macros for this meal. Return JSON only." }
      ]}]
    : [{ role: "user", content: `Estimate macros for: ${foodText}` }];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 200, system, messages }),
    });

    const data = await response.json();
    const raw = data?.content?.[0]?.text || "";
    let out;
    try { out = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
    catch { return res.status(200).json({ error: "parse_error" }); }

    return res.status(200).json({
      name: String(out.name || foodText || "Meal").slice(0, 80),
      cal: Math.max(0, Math.round(+out.cal || 0)),
      protein: Math.max(0, Math.round(+out.protein || 0)),
      carbs: Math.max(0, Math.round(+out.carbs || 0)),
      fat: Math.max(0, Math.round(+out.fat || 0)),
    });
  } catch (e) {
    return res.status(200).json({ error: "connection_error", message: String(e.message || e) });
  }
}
