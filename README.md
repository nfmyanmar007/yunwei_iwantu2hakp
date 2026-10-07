# October 28 Birthday Surprise — Version 5

Version 5 keeps the birthday countdown, reaction tracking, and smoother reading from earlier versions. It replaces Version 4's location handling with a model where nothing about the visitor's location is ever collected unless she actively chooses to share it.

## How location sharing works now

When the visitor presses **Open your birthday surprise**, she's shown three options, all equally easy to pick:

- **Share exact location** → the browser's own geolocation permission prompt appears. If she allows it, her latitude, longitude, and the browser-reported accuracy are saved.
- **Share my city only** → an approximate city/region/country is looked up from her IP address, *only because she tapped this button*. No postal code or coordinates are stored for this path.
- **Don't share location** → nothing location-related is recorded. The page continues normally.

There is no background or automatic location lookup anywhere else in the page. `page_opened` only records that the page was opened, with no geo data attached.

She can also leave an optional written reply alongside her reaction, which is often more useful than coordinates anyway.

## What changed from Version 4

Version 4 silently looked up an approximate IP-based location on every page load, before the visitor made any choice — even if she chose "continue without sharing" in the location dialog, that approximate location had already been stored. This version removes that entirely. Location data is now only ever stored after an explicit, specific choice, and the dashboard only ever shows what she chose to share.

Also fixed:
- Added basic rate limiting to `/api/visit`.
- `status.html` no longer persists the status secret anywhere; it's held in memory for the current tab only.
- Removed the multi-tier fallback chain that silently dropped fields when SQL columns were missing; now there's one clear "full" or "minimal" mode.
- Reaction options and the database check constraint are now consistent, and a couple of extra reactions (`still_hurt`, `need_time`) are supported if you want a more honest-feeling prompt.

## Vercel environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STATUS_SECRET`

## REQUIRED Supabase SQL for Version 5

Run this in **Supabase → SQL Editor → New query** and click **Run**. If you're upgrading from Version 4, this adds a `message` column and drops the now-unused IP-tracking columns (postal code, exact IP coordinates, network org, Vercel geo columns) — nothing in those columns was consented to, so there's nothing worth keeping.

```sql
alter table public.apology_visits
  add column if not exists reaction text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists country text,
  add column if not exists browser_timezone text,
  add column if not exists browser_language text,
  add column if not exists gps_latitude double precision,
  add column if not exists gps_longitude double precision,
  add column if not exists gps_accuracy double precision,
  add column if not exists location_permission text,
  add column if not exists message text;

alter table public.apology_visits
  drop column if exists postal_code,
  drop column if exists latitude,
  drop column if exists longitude,
  drop column if exists ip_timezone,
  drop column if exists geo_source,
  drop column if exists network_org,
  drop column if exists vercel_city,
  drop column if exists vercel_region,
  drop column if exists vercel_country;

do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'apology_visits'
      and c.contype = 'c'
      and (
        pg_get_constraintdef(c.oid) ilike '%reaction%'
        or pg_get_constraintdef(c.oid) ilike '%event_type%'
        or pg_get_constraintdef(c.oid) ilike '%location_permission%'
      )
  loop
    execute format('alter table public.apology_visits drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.apology_visits
  add constraint apology_visits_event_type_check
  check (event_type in (
    'page_opened',
    'message_revealed',
    'response_sent',
    'location_shared',
    'location_city_shared',
    'location_skipped',
    'location_denied',
    'location_unavailable',
    'location_timeout'
  ));

alter table public.apology_visits
  add constraint apology_visits_reaction_check
  check (
    reaction is null or reaction in (
      'yes_smile','of_course','still_hurt','need_time'
    )
  );

alter table public.apology_visits
  add constraint apology_visits_location_permission_check
  check (
    location_permission is null or location_permission in (
      'granted_gps','granted_city','skipped','denied','unavailable','timeout'
    )
  );
```

## Test

1. Run the SQL above.
2. Deploy Version 5 to Vercel.
3. Open the birthday link over HTTPS.
4. Press **Open your birthday surprise**.
5. Try each of the three location options in turn and confirm the dialog's behavior matches what it says.
6. Open `/status.html` and confirm it only shows what you actually shared in step 5.

Default link ID: `oct28-birthday-01`
