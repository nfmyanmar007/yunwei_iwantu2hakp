# October 28 Birthday Surprise

A birthday-surprise website with dynamic October 28 countdown, a birthday reveal, private status page, and passive approximate visit analytics.

## Important privacy / accuracy note

This version does **not** request GPS permission and does not bypass browser location protections. It uses Vercel's IP-derived geolocation headers plus the browser's timezone/language. IP-derived location can be wrong because of VPNs, mobile carriers, ISP routing, proxies, and privacy relays.

The latitude/longitude values shown in the status page are the approximate coordinates associated with the public IP geolocation record. They are **not** the exact physical location of the visitor's device.

## Existing Vercel environment variables

Keep these configured:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STATUS_SECRET`

## Supabase migration for richer passive location

Run this once in **Supabase → SQL Editor**:

```sql
alter table public.apology_visits
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists country text,
  add column if not exists postal_code text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists ip_timezone text,
  add column if not exists browser_timezone text,
  add column if not exists browser_language text;
```

After the SQL succeeds, redeploy the project and open the birthday link again. Old visit rows will not magically gain the new fields; new visits can store them.

## What the private status page can show

- Open count and last-opened time
- Whether the birthday wish was opened
- Approximate city / region / country
- Postal-code estimate (when Vercel supplies it)
- IP-derived latitude / longitude
- IP-derived timezone
- Browser timezone
- Browser language
- Birthday response

## Link ID

Default link ID:

`oct28-birthday-01`
