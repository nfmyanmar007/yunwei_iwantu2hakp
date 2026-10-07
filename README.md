# October 28 Birthday Surprise

A small birthday-surprise website with:

- Dynamic October 28 countdown based on the visitor's local calendar date
- Special messages for the day before, birthday day, and after the birthday
- Animated birthday reveal and confetti
- Optional smile response
- Private status page (`/status.html`)
- Approximate city/region/country analytics from Vercel request headers (no GPS permission request)

## Existing Vercel environment variables

Keep these configured:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STATUS_SECRET`

## Supabase location columns

The project continues to save visits even if you do not run this migration, but approximate location will not be stored until these columns exist.

Run this once in the Supabase SQL Editor:

```sql
alter table public.apology_visits
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists country text;
```

The project deliberately does **not** save precise GPS coordinates. Location comes from Vercel's coarse request geolocation headers and can be wrong because of VPNs, mobile carrier routing, proxies, or IP geolocation limitations.

## Link ID

The new default link ID is:

`oct28-birthday-01`

If you change it in `script.js`, change the default in `status.html` too.
