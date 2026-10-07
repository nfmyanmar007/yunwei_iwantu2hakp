# October 28 Birthday Surprise — Version 3

This version fixes three reported issues:

1. **IP location:** compares a secondary IP geolocation provider with Vercel. The best available estimate is stored, while the Vercel estimate is also retained so the status page can warn when the providers disagree. This is still **not GPS** and cannot guarantee the visitor's physical city.
2. **Birthday response:** the API now confirms that Supabase actually saved the answer. It no longer reports `Sent` after a failed insert.
3. **Reading scroll:** Next/Back no longer force the browser to the top of the page.

## Privacy / location

The page does not request precise browser/GPS location. For page-open events, the server may send the visitor's public IP to `ipapi.co` only to obtain approximate IP geolocation. The raw IP is not stored by this project. The visitor-facing page should continue to disclose that approximate visit location analytics are used.

IP geolocation can still be wrong because of ISP routing, mobile carriers, VPNs, proxies, privacy relays, and stale IP databases.

## Vercel environment variables

Keep:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STATUS_SECRET`

## REQUIRED Supabase migration

Run this in **Supabase → SQL Editor** before testing Version 3:

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
  add column if not exists vercel_country text;

-- Remove older CHECK constraints that may reject the new birthday event/reactions.
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
      )
  loop
    execute format('alter table public.apology_visits drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.apology_visits
  add constraint apology_visits_event_type_check
  check (event_type in ('page_opened','message_revealed','response_sent'));

alter table public.apology_visits
  add constraint apology_visits_reaction_check
  check (
    reaction is null or reaction in (
      'yes_smile','of_course',
      'still_hurt','need_time','forgive','read_take_care'
    )
  );
```

The old reaction values are retained in the constraint so historical/original project rows remain valid.

## Test after deployment

1. Deploy Version 3 to Vercel.
2. Open the birthday link in a fresh/private browser window.
3. Finish all birthday paragraphs.
4. Choose **Yes ❤️** or **Of course 😄**.
5. Press **Send my answer** and confirm it says `Sent ❤️`.
6. Open `/status.html` and check the answer and location estimates.

Default link ID: `oct28-birthday-01`
