# Apology Message Page

A quiet, mobile-first apology page with optional anonymous visit receipt.

## New behavior

The message is now shown **one paragraph at a time**.
She must press **Next** to continue to the next paragraph.

## Personalize

Edit the top of `script.js`:

```js
const config = {
  herName: "ရင်ဝေ",
  myName: "My Name",
  linkId: "apology-01",
  enableAnonymousVisitReceipt: true,
  title: "တောင်းပန်ချင်တဲ့ စကား",
  paragraphs: [
    "First paragraph...",
    "Second paragraph..."
  ]
};
```

## Privacy

When tracking is enabled, the application code stores only:

- `link_id`
- `event_type` (`page_opened` or `message_revealed`)
- server timestamp

The application code does not intentionally store IP address, location, browser/device details, contacts, camera/microphone data, or form answers.

The page visibly discloses that an anonymous open/reveal receipt may be recorded.

## Vercel + Supabase tracking setup

1. Create a Supabase project, or use an existing project.
2. Run `supabase-setup.sql` in Supabase SQL Editor.
3. Deploy this folder to Vercel.
4. In Vercel → Project → Settings → Environment Variables, add:

   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STATUS_SECRET`

5. Redeploy after adding environment variables.

Important: `SUPABASE_SERVICE_ROLE_KEY` is server-side only. Never put it in `script.js`.

## Check whether the link was opened

Visit:

`https://YOUR-DOMAIN.vercel.app/status.html`

Enter:

- the same `linkId` from `script.js`
- your `STATUS_SECRET`

It will show whether:
- the page was opened
- the "Read my message" button was pressed

## No tracking option

Set:

```js
enableAnonymousVisitReceipt: false
```

The apology page will still work normally.

## Static hosting

The message page works on GitHub Pages or Netlify as a static site, but the supplied tracking API is designed for Vercel serverless functions. Without the API/environment setup, tracking fails silently and the message page continues to work.


## Optional reaction after the final paragraph

After she finishes reading, the page offers four optional responses:

- I'm still hurt
- I need more time
- I forgive you
- I read this. Take care.

Her selection is **not sent immediately**. She must explicitly press **Send my response**.
She can also leave the page without choosing or sending anything.

If you already created the Supabase table using an older version of this project,
run the newest `supabase-setup.sql` once so the `reaction` column and
`response_sent` event are available.
