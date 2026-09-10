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
- ~~**Open issue**: the prototype's data model (categories `lunch`/`highTea`/`gala` per day, day-indexed) doesn't map 1:1 onto the schema's fixed columns (`lunch_day1`, `high_tea_day2`, etc.).~~ **Resolved below** — kept the existing schema as-is (no migration) and added a `keyFor(day, category)` mapping in `app/scan/page.tsx` instead: Day 1 → Kit/Lunch/High Tea, Day 2 → Lunch/High Tea/Gala. Revisit this with the normalized `itinerary_items` + `scan_log`-as-source-of-truth design (discussed in chat, not yet built) if we need to add more categories later without touching the schema every time.

**Scanner rebuilt to match the prototype's UI, wired to real data**
- `app/scan/page.tsx` is no longer a functional stub — it now reproduces the prototype's exact 3-screen flow (Home day/category picker → Scan (QR camera or manual ID) → Confirmed with a live status table), but backed by real `getAttendeeBySerial` / `markItineraryItem` calls instead of mock state.
- Delegate card shows real name/org/serial; the confirmed-screen table reads real column values instead of local mock state.

**Bugs found and fixed while testing on a phone**
1. *"No attendee found" after a successful lookup*: `html5-qrcode`'s `scanner.stop()`/`clear()` can throw **synchronously**, not just reject — that throw was escaping into the surrounding `try` block and landing in the `catch`, wiping out a just-found attendee. Fix: wrap each call in its own `try/catch`.
2. *Camera goes black on "Scan next"*: `stop()`/`clear()` were fired off without being awaited, so a new camera session could start before the old one finished tearing down and the two collided. Fix: made `stopScanner` `async`, awaited it properly, and awaited it before starting a new session.
3. *Camera still goes black when backing out to Home and re-picking a category*: same race as #2, but across *component instances* this time — the old `ScanScreen`'s unmount cleanup (which can't be awaited by React) and the new `ScanScreen`'s mount effect could still collide. Fix: added a module-level `cameraLock` (a single shared promise, not per-component) that every start/stop call queues through, so teardown and startup are strictly serialized no matter which instance or navigation path triggered them.
4. *Multiple "already marked, mark again anyway?" dialogs stacking up for one scan*: the camera keeps calling its decode callback for every matching video frame while `stop()` is still resolving, so several `handleDecoded` calls fired for the same badge, each independently popping its own confirm dialog. Fix: a `decodedOnceRef` guard so only the first decode of a scan session is acted on.
5. *`app/scan/page.tsx` reverted to an older version on disk twice*, undoing pushed fixes. Root cause: very likely a stale editor tab open on that file overwriting disk-level edits on save, since it happened to that file only (other files stayed intact). Lesson: close/reload the file in any editor before external tools touch it, and commit promptly so uncommitted work isn't sitting exposed.

**QR code generation**
- Wrote QR codes for `test001`/`test002`/`test003` from scratch in Python (no `pip`/`npm`/external QR API available — this cloud sandbox's package registries and general internet egress are blocked by policy) and verified them with OpenCV before sending.
- Added `QR_generation/` to the repo — a small standalone Node.js tool (`generate-qr.js` + `batch-generate.js`) for producing badge-style QR codes on a real laptop: colored modules + an optional center logo, always encoded at ECC level H so the logo can safely cover part of the center without breaking the scan. Originally used `canvas` for logo compositing, but that needs native compilation (Python + Visual Studio Build Tools) and failed on Windows — swapped to `sharp`, which ships prebuilt binaries, no compiling required. Confirmed working with a real logo (`mask.png`) and `test001_qr.png` generated successfully.

**Hosting capacity check**
- For our actual scale (~400 attendees, up to 12 volunteer devices scanning concurrently), both Vercel's Hobby tier and Supabase's free tier have huge headroom — Supabase's pooler alone supports 200 concurrent connections, and 12 devices doing occasional quick lookups is nowhere near that. The real risk at the venue is WiFi/cellular reliability for those 12 devices, not hosting limits — worth a connectivity check at the actual venue beforehand.

**Setbacks / lessons**
- Lost time on git basics: nested folder from zip extraction got committed as a git submodule reference (`160000` mode) instead of real files — fixed by `git rm --cached` + flattening + recommit. Ended up wiping and reinitializing the repo once to get a clean single commit.
- GitHub sign-in via a Google-linked account intermittently hit a Google-side 500 error during the OAuth browser flow — worked around by authenticating with a personal access token directly in the terminal instead.

**Next up**
1. ~~Finish Supabase project setup~~ ~~Reconcile the prototype's data model~~ ~~Wire the real scanner UI~~ ~~Swap manual entry for real camera QR scanning~~ ~~Deploy to Vercel~~ — all done as of this entry.
2. Clean up the stray `Claude outputs/` folder that got committed to the repo root (unrelated artifact clutter, not part of the app).
3. Tighten RLS policies before the real event (currently wide open `allow all`).
4. Build out `app/admin/page.tsx` into a real live dashboard.
5. Consider the normalized `itinerary_items` + `scan_log`-as-source-of-truth schema if more categories need to get added later without editing code each time (see resolved note above).
6. Do a live-URL dry run on real phones at the actual venue — specifically to check WiFi/cellular reliability for the ~12 volunteer devices, which is the real risk at our scale, not hosting limits.
