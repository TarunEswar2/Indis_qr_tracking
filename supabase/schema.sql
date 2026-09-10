-- Run this once in the Supabase SQL editor to set up the database.

create table if not exists attendees (
  id uuid primary key default gen_random_uuid(),
  serial_code text unique not null,      -- matches the code printed on the badge QR (e.g. ICORD25IN519)
  name text not null,
  organization text,
  kit_received timestamptz,
  lunch_day1 timestamptz,
  lunch_day2 timestamptz,
  lunch_day3 timestamptz,
  high_tea_day1 timestamptz,
  high_tea_day2 timestamptz,
  high_tea_day3 timestamptz,
  gala_dinner timestamptz,
  created_at timestamptz default now()
);

-- Adds Day 3 lunch/high tea columns for an event that already has an
-- `attendees` table from before (the create table above only runs for a
-- brand new table). Safe to run on a fresh table too.
alter table attendees add column if not exists lunch_day3 timestamptz;
alter table attendees add column if not exists high_tea_day3 timestamptz;

create table if not exists scan_log (
  id uuid primary key default gen_random_uuid(),
  attendee_id uuid references attendees(id) not null,
  item text not null,                    -- one of the itinerary keys above
  scanned_by text,                       -- volunteer identifier, optional for v1
  scanned_at timestamptz default now()
);

-- Enable Row Level Security and allow the anon key to read/write for now.
-- Tighten this before the actual event if you want scans authenticated
-- (e.g. require volunteers to log in) rather than anyone with the URL.
alter table attendees enable row level security;
alter table scan_log enable row level security;

create policy "allow all on attendees" on attendees
  for all using (true) with check (true);

create policy "allow all on scan_log" on scan_log
  for all using (true) with check (true);

-- Added for the admin dashboard: lets an admin turn a category on/off
-- (e.g. close "Gala Dinner" scanning once the event moves on) without
-- touching code. One row per itinerary key; missing rows default to
-- enabled in the app.
create table if not exists category_settings (
  key text primary key,
  enabled boolean not null default true
);

insert into category_settings (key, enabled) values
  ('kit_received', true),
  ('lunch_day1', true),
  ('lunch_day2', true),
  ('lunch_day3', true),
  ('high_tea_day1', true),
  ('high_tea_day2', true),
  ('high_tea_day3', true),
  ('gala_dinner', true)
on conflict (key) do nothing;

alter table category_settings enable row level security;

create policy "allow all on category_settings" on category_settings
  for all using (true) with check (true);

-- Password gate for /admin and /scan. One row per role. Plain text on
-- purpose, so you can just edit it in the Supabase table editor whenever
-- you want to change a password — no code change or redeploy needed.
--
-- Read-only for the anon key (no insert/update/delete policy), so the app
-- can check a password but can't be used to change one from the browser —
-- passwords are only ever edited by hand in the Supabase table editor.
-- Note: this means the password values are technically readable by anyone
-- who inspects the site's network requests directly (same anon key your
-- app already uses everywhere else), not just through the login screen.
-- Fine for a volunteer tool; don't reuse these passwords anywhere sensitive.
create table if not exists app_passwords (
  role text primary key,      -- 'admin' or 'volunteer'
  password text not null
);

insert into app_passwords (role, password) values
  ('admin', 'changeme-admin'),
  ('volunteer', 'changeme-volunteer')
on conflict (role) do nothing;

alter table app_passwords enable row level security;

create policy "allow read on app_passwords" on app_passwords
  for select using (true);
