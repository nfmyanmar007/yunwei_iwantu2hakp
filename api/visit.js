const ALLOWED_EVENTS = new Set(["page_opened", "message_revealed", "response_sent"]);
const ALLOWED_REACTIONS = new Set(["yes_smile", "of_course"]);

function clean(value, max = 100) {
  return String(value || "").replace(/[^a-zA-Z0-9 .,_:/()+-]/g, "").trim().slice(0, max);
}

function decodeHeader(value) {
  try { return decodeURIComponent(String(value || "")); } catch (_) { return String(value || ""); }
}

function numberOrNull(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

function passiveGeo(req) {
  return {
    city: clean(decodeHeader(req.headers["x-vercel-ip-city"]), 100) || null,
    region: clean(req.headers["x-vercel-ip-country-region"], 100) || null,
    country: clean(req.headers["x-vercel-ip-country"], 20) || null,
    postal_code: clean(req.headers["x-vercel-ip-postal-code"], 30) || null,
    latitude: numberOrNull(req.headers["x-vercel-ip-latitude"], -90, 90),
    longitude: numberOrNull(req.headers["x-vercel-ip-longitude"], -180, 180),
    ip_timezone: clean(decodeHeader(req.headers["x-vercel-ip-timezone"]), 100) || null
  };
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
  const browserTimezone = clean(req.body?.browserTimezone || "", 100) || null;
  const browserLanguage = clean(req.body?.browserLanguage || "", 40) || null;

  if (!linkId || !ALLOWED_EVENTS.has(eventType)) return res.status(400).json({ ok: false });
  if (eventType === "response_sent" && !ALLOWED_REACTIONS.has(reaction)) return res.status(400).json({ ok: false });

  const payload = {
    link_id: linkId,
    event_type: eventType,
    ...passiveGeo(req),
    browser_timezone: browserTimezone,
    browser_language: browserLanguage
  };
  if (eventType === "response_sent") payload.reaction = reaction;

  try {
    let response = await insertRow(supabaseUrl, serviceRoleKey, payload);

    // Compatibility fallback for databases that only have the original
    // city/region/country columns.
    if (!response.ok) {
      const basicLocation = {
        link_id: linkId,
        event_type: eventType,
        city: payload.city,
        region: payload.region,
        country: payload.country
      };
      if (eventType === "response_sent") basicLocation.reaction = reaction;
      response = await insertRow(supabaseUrl, serviceRoleKey, basicLocation);
    }

    // Final fallback: never break visit logging if location columns are absent.
    if (!response.ok) {
      const minimal = { link_id: linkId, event_type: eventType };
      if (eventType === "response_sent") minimal.reaction = reaction;
      await insertRow(supabaseUrl, serviceRoleKey, minimal);
    }

    return res.status(204).end();
  } catch (_) {
    return res.status(204).end();
  }
};
