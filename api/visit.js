const ALLOWED_EVENTS = new Set(["page_opened", "message_revealed", "response_sent"]);
const ALLOWED_REACTIONS = new Set(["yes_smile", "of_course"]);

function clean(value, max = 100) {
  return String(value || "").replace(/[^a-zA-Z0-9 .,_-]/g, "").trim().slice(0, max);
}

function decodeHeader(value) {
  try { return decodeURIComponent(String(value || "")); } catch (_) { return String(value || ""); }
}

function coarseLocation(req) {
  const city = clean(decodeHeader(req.headers["x-vercel-ip-city"]), 100);
  const region = clean(req.headers["x-vercel-ip-country-region"], 100);
  const country = clean(req.headers["x-vercel-ip-country"], 20);
  return { city: city || null, region: region || null, country: country || null };
}

async function insertRow(supabaseUrl, key, payload) {
  return fetch(`${supabaseUrl}/rest/v1/apology_visits`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify(payload)
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return res.status(204).end();

  const linkId = clean(req.body?.linkId || "oct28-birthday-01", 80).replace(/ /g, "");
  const eventType = clean(req.body?.eventType || "", 40).replace(/ /g, "");
  const reaction = clean(req.body?.reaction || "", 40).replace(/ /g, "");

  if (!linkId || !ALLOWED_EVENTS.has(eventType)) return res.status(400).json({ ok: false });
  if (eventType === "response_sent" && !ALLOWED_REACTIONS.has(reaction)) return res.status(400).json({ ok: false });

  const location = coarseLocation(req);
  const payload = { link_id: linkId, event_type: eventType, ...location };
  if (eventType === "response_sent") payload.reaction = reaction;

  try {
    let response = await insertRow(supabaseUrl, serviceRoleKey, payload);

    // Backward-compatible fallback: visits still save even before the optional
    // city/region/country columns are added in Supabase.
    if (!response.ok) {
      const fallback = { link_id: linkId, event_type: eventType };
      if (eventType === "response_sent") fallback.reaction = reaction;
      response = await insertRow(supabaseUrl, serviceRoleKey, fallback);
    }

    return res.status(204).end();
  } catch (_) {
    return res.status(204).end();
  }
};
