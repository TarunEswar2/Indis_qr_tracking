# INDIS QR Tracker — context for Claude

This is a 2-person student project: a QR-scanning system for tracking
conference attendee itinerary fulfillment (kit, lunch x2, high tea x2,
gala dinner) at the INDIS conference.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind — PWA, no native app
- Supabase (Postgres) — schema in `supabase/schema.sql`
- `html5-qrcode` for camera-based QR scanning
- Deployed on Vercel, auto-deploy on push to `main`

## Team split
- Backend / data (Tarun): Supabase schema, `lib/supabaseClient.ts`,
  scan-logging logic, admin data queries.
- Frontend / UX (teammate): the actual scanner and admin screen
  designs — `app/scan/page.tsx` and `app/admin/page.tsx` currently
  contain FUNCTIONAL STUBS (working data logic, placeholder markup).
  Replace the markup, keep the function calls (`getAttendeeBySerial`,
  `markItineraryItem`) intact so the backend keeps working.

## Data model
One `attendees` row per badge (`serial_code` = the code printed on the
QR, e.g. `ICORD25IN519`). Each itinerary item is a nullable timestamp
column on that row — null means not yet done. Every scan also writes a
row to `scan_log` for auditing. The list of itinerary items lives in
one place: `ITINERARY_ITEMS` in `lib/supabaseClient.ts` — add new
items there + as a schema column, not scattered across components.

## Conventions
- Keep `app/scan` and `app/admin` as separate concerns; don't cross-import.
- All Supabase calls go through `lib/supabaseClient.ts` helpers, not
  ad-hoc `supabase.from(...)` calls scattered in components (exception:
  simple reads like the admin table list are fine inline).
- Commit in small, working chunks — this repo has 2 active editors.
