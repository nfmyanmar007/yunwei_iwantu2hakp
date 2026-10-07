function clean(value, max = 80) { return String(value || "").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, max); }

async function readRows(url, key, linkId, mode) {
  let fields = "event_type,reaction,created_at";
  if (mode === "full") fields += ",city,region,country,browser_timezone,browser_language,gps_latitude,gps_longitude,gps_accuracy,location_permission,message";
  else if (mode === "minimal") fields = "event_type,reaction,created_at";
  const params = new URLSearchParams({ select: fields, link_id: `eq.${linkId}`, order: "created_at.desc", limit: "100" });
  return fetch(`${url}/rest/v1/apology_visits?${params.toString()}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const statusSecret = process.env.STATUS_SECRET;
  if (!supabaseUrl || !serviceRoleKey || !statusSecret) return res.status(500).json({ ok: false, error: "Tracking is not configured." });
  if (!req.headers["x-status-secret"] || req.headers["x-status-secret"] !== statusSecret) return res.status(401).json({ ok: false, error: "Incorrect secret." });

  const linkId = clean(req.query?.linkId || "oct28-birthday-01");
  try {
    let mode = "full";
    let response = await readRows(supabaseUrl, serviceRoleKey, linkId, mode);
    if (!response.ok) { mode = "minimal"; response = await readRows(supabaseUrl, serviceRoleKey, linkId, mode); }
    if (!response.ok) return res.status(500).json({ ok: false, error: "Could not read status." });

    const rows = await response.json();
    const opens = rows.filter(r => r.event_type === "page_opened");
    const reveals = rows.filter(r => r.event_type === "message_revealed");
    const responses = rows.filter(r => r.event_type === "response_sent");
    const locationEvents = rows.filter(r => ["location_shared", "location_city_shared", "location_skipped", "location_denied", "location_unavailable", "location_timeout"].includes(r.event_type));
    const latestGps = rows.find(r => r.event_type === "location_shared" && r.gps_latitude != null && r.gps_longitude != null) || null;
    const latestCity = rows.find(r => r.event_type === "location_city_shared" && (r.city || r.region || r.country)) || null;
    const latestPermissionEvent = locationEvents[0] || null;
    const latestMessage = responses.find(r => r.message) || reveals.find(r => r.message) || null;

    return res.status(200).json({
      ok: true, linkId,
      opened: opens.length > 0, messageRevealed: reveals.length > 0,
      openCount: opens.length, revealCount: reveals.length,
      lastOpenedAt: opens[0]?.created_at || null, lastRevealedAt: reveals[0]?.created_at || null,
      responseReceived: responses.length > 0, responseCount: responses.length,
      latestReaction: responses[0]?.reaction || null, latestReactionAt: responses[0]?.created_at || null,
      locationMode: mode,
      locationPermission: latestPermissionEvent?.location_permission || null,
      locationPermissionAt: latestPermissionEvent?.created_at || null,
      gpsLatitude: latestGps?.gps_latitude ?? null,
      gpsLongitude: latestGps?.gps_longitude ?? null,
      gpsAccuracy: latestGps?.gps_accuracy ?? null,
      gpsCapturedAt: latestGps?.created_at || null,
      city: latestCity?.city || null,
      region: latestCity?.region || null,
      country: latestCity?.country || null,
      cityCapturedAt: latestCity?.created_at || null,
      message: latestMessage?.message || null,
      messageAt: latestMessage?.created_at || null
    });
  } catch (_) { return res.status(500).json({ ok: false, error: "Could not read status." }); }
};
