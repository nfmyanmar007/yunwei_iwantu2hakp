const ALLOWED_EVENTS = new Set([
  "page_opened",
  "message_revealed",
  "response_sent",
  "location_shared",
  "location_declined",
  "location_denied",
  "location_unavailable",
  "location_timeout"
]);
const ALLOWED_REACTIONS = new Set(["yes_smile", "of_course"]);

function clean(value, max = 100) {
  return String(value || "").replace(/[^a-zA-Z0-9 .,_:/()+-]/g, "").trim().slice(0, max);
}
function decodeHeader(value) { try { return decodeURIComponent(String(value || "")); } catch (_) { return String(value || ""); } }
function numberOrNull(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function vercelGeo(req) {
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
function clientIp(req) {
  const raw = String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "");
  const first = raw.split(",")[0].trim();
  if (!first || first.length > 64 || !/^[0-9a-fA-F:.]+$/.test(first)) return null;
  return first;
}
async function secondaryGeo(req) {
  const ip = clientIp(req);
  if (!ip) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { "User-Agent": "October28BirthdayLink/1.0" }, signal: controller.signal
    });
    clearTimeout(timer);
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.error) return null;
    const result = {
      city: clean(data.city, 100) || null,
      region: clean(data.region_code || data.region, 100) || null,
      country: clean(data.country_code || data.country, 20) || null,
      postal_code: clean(data.postal, 30) || null,
      latitude: numberOrNull(data.latitude, -90, 90),
      longitude: numberOrNull(data.longitude, -180, 180),
      ip_timezone: clean(data.timezone, 100) || null,
      network_org: clean(data.org, 160) || null
    };
    return result.city || result.region || result.country ? result : null;
  } catch (_) { return null; }
}
function chooseBest(vercel, secondary) {
  if (secondary?.city) return { ...secondary, geo_source: "secondary_ip" };
  return { ...vercel, network_org: null, geo_source: "vercel_ip" };
}
async function insertRow(supabaseUrl, key, payload) {
  const response = await fetch(`${supabaseUrl}/rest/v1/apology_visits`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(payload)
  });
  const detail = response.ok ? "" : await response.text().catch(() => "");
  return { ok: response.ok, status: response.status, detail };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return res.status(503).json({ ok: false, error: "Tracking is not configured." });

  const linkId = clean(req.body?.linkId || "oct28-birthday-01", 80).replace(/ /g, "");
  const eventType = clean(req.body?.eventType || "", 40).replace(/ /g, "");
  const reaction = clean(req.body?.reaction || "", 40).replace(/ /g, "");
  const browserTimezone = clean(req.body?.browserTimezone || "", 100) || null;
  const browserLanguage = clean(req.body?.browserLanguage || "", 40) || null;
  const gpsLatitude = numberOrNull(req.body?.gpsLatitude, -90, 90);
  const gpsLongitude = numberOrNull(req.body?.gpsLongitude, -180, 180);
  const gpsAccuracy = numberOrNull(req.body?.gpsAccuracy, 0, 100000);

  if (!linkId || !ALLOWED_EVENTS.has(eventType)) return res.status(400).json({ ok: false, error: "Invalid event." });
  if (eventType === "response_sent" && !ALLOWED_REACTIONS.has(reaction)) return res.status(400).json({ ok: false, error: "Invalid reaction." });
  if (eventType === "location_shared" && (gpsLatitude === null || gpsLongitude === null)) {
    return res.status(400).json({ ok: false, error: "Invalid location." });
  }

  const vg = vercelGeo(req);
  const sg = eventType === "page_opened" ? await secondaryGeo(req) : null;
  const best = chooseBest(vg, sg);

  const locationPermission = eventType === "location_shared" ? "granted"
    : eventType === "location_declined" ? "skipped"
    : eventType === "location_denied" ? "denied"
    : eventType === "location_unavailable" ? "unavailable"
    : eventType === "location_timeout" ? "timeout"
    : null;

  const fullPayload = {
    link_id: linkId,
    event_type: eventType,
    city: best.city,
    region: best.region,
    country: best.country,
    postal_code: best.postal_code,
    latitude: best.latitude,
    longitude: best.longitude,
    ip_timezone: best.ip_timezone,
    browser_timezone: browserTimezone,
    browser_language: browserLanguage,
    geo_source: best.geo_source,
    network_org: best.network_org || null,
    vercel_city: vg.city,
    vercel_region: vg.region,
    vercel_country: vg.country,
    gps_latitude: eventType === "location_shared" ? gpsLatitude : null,
    gps_longitude: eventType === "location_shared" ? gpsLongitude : null,
    gps_accuracy: eventType === "location_shared" ? gpsAccuracy : null,
    location_permission: locationPermission
  };
  if (eventType === "response_sent") fullPayload.reaction = reaction;

  try {
    let result = await insertRow(supabaseUrl, serviceRoleKey, fullPayload);
    if (!result.ok) {
      const v3Payload = { ...fullPayload };
      delete v3Payload.gps_latitude; delete v3Payload.gps_longitude; delete v3Payload.gps_accuracy; delete v3Payload.location_permission;
      result = await insertRow(supabaseUrl, serviceRoleKey, v3Payload);
    }
    if (!result.ok) {
      const minimal = { link_id: linkId, event_type: eventType };
      if (eventType === "response_sent") minimal.reaction = reaction;
      result = await insertRow(supabaseUrl, serviceRoleKey, minimal);
    }
    if (!result.ok) return res.status(500).json({ ok: false, error: eventType === "response_sent" ? "Your answer could not be saved. Please try again." : "Visit analytics could not be saved." });
    return res.status(200).json({ ok: true, stored: true });
  } catch (_) {
    return res.status(500).json({ ok: false, error: "Tracking request failed." });
  }
};
