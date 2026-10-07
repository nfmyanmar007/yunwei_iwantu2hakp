# October 28 Birthday Surprise — Version 4

Version 4 keeps the birthday countdown, response tracking, smoother reading, and approximate IP/network location from Version 3. It adds an **explicit browser location permission flow**.

## How precise location works

When the visitor presses **Open your birthday surprise**, the page clearly asks whether they want to share their current device location with the sender.

- **Share location** → the browser's own geolocation permission prompt appears.
- If the visitor taps **Allow**, latitude, longitude, and the browser-reported accuracy radius are saved.
- **Continue without sharing** → the birthday page continues without GPS/device location.
- If the visitor denies or the device cannot obtain a location, the birthday page still continues normally.

This does not bypass browser permission. Device coordinates are stored only after explicit consent. Accuracy varies by device and environment and is not guaranteed to be an exact street address.

## Vercel environment variables

Keep these variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STATUS_SECRET`

## REQUIRED Supabase SQL for Version 4

Run this in **Supabase → SQL Editor → New query** and click **Run**:

```sql
alter table public.apology_visits
  add column if not exists reaction text,
  add column if not exists city text,
  add column if not exists region text,
  add column if not exists country text,
  add column if not exists postal_code text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists ip_timezone text,
  add column if not exists browser_timezone text,
  add column if not exists browser_language text,
  add column if not exists geo_source text,
  add column if not exists network_org text,
  add column if not exists vercel_city text,
  add column if not exists vercel_region text,
  add column if not exists vercel_country text,
  add column if not exists gps_latitude double precision,
  add column if not exists gps_longitude double precision,
  add column if not exists gps_accuracy double precision,
  add column if not exists location_permission text;

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
    'location_declined',
    'location_denied',
    'location_unavailable',
    'location_timeout'
  ));

alter table public.apology_visits
  add constraint apology_visits_reaction_check
  check (
    reaction is null or reaction in (
      'yes_smile','of_course',
      'still_hurt','need_time','forgive','read_take_care'
    )
  );

alter table public.apology_visits
  add constraint apology_visits_location_permission_check
  check (
    location_permission is null or location_permission in (
      'granted','skipped','denied','unavailable','timeout'
    )
  );
```

## Test

1. Run the SQL above.
2. Deploy Version 4 to Vercel.
3. Open the birthday link over HTTPS.
4. Press **Open your birthday surprise**.
5. Press **Share location**.
6. When the browser asks, tap **Allow**.
7. Open `/status.html` and check the private dashboard.

The status page will show, when shared:

- GPS/device latitude and longitude
- browser-reported accuracy, such as `±25 meters`
- time captured
- a Google Maps link for the coordinates
- separate IP/network estimate for comparison

Default link ID: `oct28-birthday-01`
