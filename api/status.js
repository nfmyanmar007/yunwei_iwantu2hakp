function clean(value, max = 80) {
  return String(value || "").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, max);
}

async function readRows(url, key, linkId, withLocation) {
  const fields = withLocation
    ? "event_type,reaction,created_at,city,region,country"
    : "event_type,reaction,created_at";
  const params = new URLSearchParams({
    select: fields,
    link_id: `eq.${linkId}`,
    order: "created_at.desc",
    limit: "100"
  });
  return fetch(`${url}/rest/v1/apology_visits?${params.toString()}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const statusSecret = process.env.STATUS_SECRET;
  if (!supabaseUrl || !serviceRoleKey || !statusSecret) {
    return res.status(500).json({ ok: false, error: "Tracking is not configured." });
  }

  if (!req.headers["x-status-secret"] || req.headers["x-status-secret"] !== statusSecret) {
    return res.status(401).json({ ok: false, error: "Incorrect secret." });
  }

  const linkId = clean(req.query?.linkId || "oct28-birthday-01");

  try {
    let response = await readRows(supabaseUrl, serviceRoleKey, linkId, true);
    let hasLocationColumns = response.ok;
    if (!response.ok) response = await readRows(supabaseUrl, serviceRoleKey, linkId, false);
    if (!response.ok) return res.status(500).json({ ok: false, error: "Could not read status." });

    const rows = await response.json();
    const opens = rows.filter(r => r.event_type === "page_opened");
    const reveals = rows.filter(r => r.event_type === "message_revealed");
    const responses = rows.filter(r => r.event_type === "response_sent");
    const latestLocatedOpen = opens.find(r => r.city || r.region || r.country) || null;

    return res.status(200).json({
      ok: true,
      linkId,
      opened: opens.length > 0,
      messageRevealed: reveals.length > 0,
      openCount: opens.length,
      revealCount: reveals.length,
      lastOpenedAt: opens[0]?.created_at || null,
      lastRevealedAt: reveals[0]?.created_at || null,
      responseReceived: responses.length > 0,
      latestReaction: responses[0]?.reaction || null,
      latestReactionAt: responses[0]?.created_at || null,
      locationEnabled: hasLocationColumns,
      city: latestLocatedOpen?.city || null,
      region: latestLocatedOpen?.region || null,
      country: latestLocatedOpen?.country || null
    });
  } catch (_) {
    return res.status(500).json({ ok: false, error: "Could not read status." });
  }
};
