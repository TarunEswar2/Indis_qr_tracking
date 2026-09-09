# INDIS QR Tracker

QR-code based itinerary tracking for the INDIS conference. Volunteers scan a
delegate's badge QR to check off kit pickup, lunch, high tea, or the gala
dinner; organizers see live status on an admin dashboard.

## Getting started

1. Install dependencies:
   ```
   npm install
   ```
2. Create a Supabase project at supabase.com, then in its SQL editor run
   `supabase/schema.sql` to create the tables.
3. Copy `.env.example` to `.env.local` and fill in your Supabase project URL
   and anon key (Project Settings → API in the Supabase dashboard).
4. Run the dev server:
   ```
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Deploying

Push this repo to GitHub, then import it at vercel.com/new. Add the same two
`NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel project settings.
Every push to `main` auto-deploys.

## Structure

- `app/scan` — volunteer-facing scanner screen
- `app/admin` — organizer dashboard
- `lib/supabaseClient.ts` — all database read/write logic
- `supabase/schema.sql` — database schema, run once in Supabase

See `CLAUDE.md` for fuller context on the data model and team split.
