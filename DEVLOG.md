# Devlog — INDIS QR Tracker

Running log of decisions, setup, and what's next. Add a dated entry each time something meaningful changes — don't rewrite history, just append.

## 2026-09-09

**Repo & environment**
- Created `Indis_qr_tracking` on GitHub (TarunEswar2), one clean commit, flat structure at repo root (`app/`, `lib/`, `public/`, `supabase/`, config files).
- Stack: Next.js 14 (App Router) + TypeScript + Tailwind, deployed via Vercel (auto-deploy on push to `main`). Chose a web app over native so volunteers just open a URL on their phone — no app store, no install friction.
- Backend: Supabase (Postgres). Chose it over Firebase for the relational fit (one attendee row, multiple itinerary columns) and because its built-in table editor lets either of us manually inspect/fix data without writing SQL.

**Data model (`supabase/schema.sql`)**
- `attendees`: one row per badge. `serial_code` matches the QR on the ID card. Each itinerary item (`kit_received`, `lunch_day1`, `lunch_day2`, `high_tea_day1`, `high_tea_day2`, `gala_dinner`) is a nullable timestamp — null means not done yet.
- `scan_log`: audit trail, one row per scan event (attendee, item, volunteer, timestamp).
- RLS is currently wide open (`allow all`) for ease of development — needs tightening before the real event if we want scans attributed to a specific volunteer login.

**Code structure**
- `lib/supabaseClient.ts` — the only place that talks to the database. `getAttendeeBySerial()` for lookup, `markItineraryItem()` for marking + logging. Both UI screens call into this rather than touching Supabase directly.
- `app/scan/page.tsx` — volunteer scanner. Currently a functional stub: real lookup/mark logic, but manual text-entry instead of camera QR (that's next).
- `app/admin/page.tsx` — bare admin table, read-only, pulls live from `attendees`.
- Team split: Tarun owns `lib/supabaseClient.ts` + schema (backend/data). Teammate owns the actual screen designs.

**Teammate's prototype**
- Added `prototype_ui/indis-scan-flow.jsx` — a self-contained mock UI (day/category picker → QR-or-ID scan screen → confirmation screen with a 3-day status table). Currently uses mock/hardcoded data, not wired to Supabase.
- **Open issue**: the prototype's data model (categories `lunch`/`highTea`/`gala` per day, day-indexed) doesn't map 1:1 onto the schema's fixed columns (`lunch_day1`, `high_tea_day2`, etc.). Needs a decision before this UI gets connected to real data — either adjust the schema to be day/category-normalized, or adjust the prototype's model to match the fixed-column shape.

**Setbacks / lessons**
- Lost time on git basics: nested folder from zip extraction got committed as a git submodule reference (`160000` mode) instead of real files — fixed by `git rm --cached` + flattening + recommit. Ended up wiping and reinitializing the repo once to get a clean single commit.
- GitHub sign-in via a Google-linked account intermittently hit a Google-side 500 error during the OAuth browser flow — worked around by authenticating with a personal access token directly in the terminal instead.

**Next up**
1. Finish Supabase project setup (schema run, keys copied into `.env.local`) and confirm `npm run dev` works end to end with a manually-inserted test attendee.
2. Reconcile the prototype's data model with the schema (see open issue above).
3. Wire the real scanner UI to `getAttendeeBySerial` / `markItineraryItem`, replacing mock state.
4. Swap manual entry for real camera QR scanning (`html5-qrcode`).
5. Deploy to Vercel with env vars set; do a live-URL dry run on real phones before the event.
