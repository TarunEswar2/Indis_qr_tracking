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

-- Designation (role/title at the event — e.g. "Delegate", "Speaker",
-- "Volunteer"), contact info, and which days someone actually registered
-- for (people can register for just 1, 2, or all 3 days — this is what
-- the scan flow checks before letting a volunteer mark them for a day
-- they never signed up for).
--
-- 'TEST' is a deliberate placeholder default so every existing/imported
-- row is visibly not-yet-set rather than silently blank — swap it for
-- the real designation as you get that data in (from your Google Form,
-- same as app_users). registered_days defaults to all three days, since
-- that's the common case; narrow it for anyone who only registered for
-- part of the event.
alter table attendees add column if not exists designation text not null default 'TEST';
alter table attendees add column if not exists phone text;
alter table attendees add column if not exists email text;
alter table attendees add column if not exists registered_days integer[] not null default '{1,2,3}';

-- To update someone's designation/contact/registered days by hand, e.g.
-- from the SQL editor once you have their Google Form response:
--
--   update attendees set
--     designation = 'Speaker',
--     phone = '9876543210',
--     email = 'someone@example.com',
--     registered_days = '{1,2}'   -- registered for Day 1 and Day 2 only
--   where serial_code = 'ICORD25IN519';

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
  role text primary key,      -- 'admin' or 'staff'
  password text not null
);

insert into app_passwords (role, password) values
  ('admin', 'changeme-admin'),
  ('staff', 'changeme-staff')
on conflict (role) do nothing;

-- One shared "staff" password now covers both /scan (volunteer) and
-- /onboarding — they used to be separate roles/passwords, which meant
-- unlocking one didn't unlock the other even though the same people use
-- both. Collapses the old two rows into the single row above; safe to
-- run even if this has already been applied (checks before dropping).
do $$
begin
  if exists (select 1 from app_passwords where role = 'volunteer') then
    update app_passwords set role = 'staff' where role = 'volunteer';
  end if;
  delete from app_passwords where role = 'onboarding';
end $$;

alter table app_passwords enable row level security;

drop policy if exists "allow read on app_passwords" on app_passwords;
create policy "allow read on app_passwords" on app_passwords
  for select using (true);

-- On-the-spot registration: marks an attendee row created at the
-- onboarding desk for a walk-in (as opposed to pre-registered before the
-- event), so admin can see/filter/count them separately.
alter table attendees add column if not exists is_onspot boolean not null default false;

-- Single-row key/value store for small app-wide settings that aren't
-- per-category. Currently used for "live_day" — which day (1/2/3) the
-- volunteer scan flow treats as "today" for the home screen's
-- open/closed/locked category states. Set from the admin dashboard.
create table if not exists app_settings (
  key text primary key,
  value text not null
);

insert into app_settings (key, value) values
  ('live_day', '1')
on conflict (key) do nothing;

alter table app_settings enable row level security;

create policy "allow all on app_settings" on app_settings
  for all using (true) with check (true);

-- ---------------------------------------------------------------------
-- Per-person accounts, replacing the shared admin/staff passwords above
-- (app_passwords is no longer read by the app — safe to ignore or drop
-- it later; left in place so nothing breaks if something still points
-- at it). Every volunteer/onboarding person and every admin gets their
-- own username + password here, with a role that decides which pages
-- they can even reach: a 'volunteer' account never sees /admin at all,
-- an 'admin' account can reach both.
--
-- Unlike app_passwords, this is NOT a "read-only, plaintext, fine to
-- expose" table: password_hash must never be reachable by the anon key.
-- Row Level Security is enabled with NO policies at all, so anon/
-- authenticated get zero direct access to this table, full stop — not
-- even to read a username. The only way in is the verify_login()
-- function below: it's SECURITY DEFINER (runs with the privileges of
-- whoever owns it, bypassing RLS internally) but only ever returns
-- username/role/display_name, and only on an exact password match —
-- the hash itself never leaves the database.
-- On most Supabase projects this installs pgcrypto's functions
-- (crypt/gen_salt) into a schema called "extensions", not "public" — which
-- is why every function below explicitly sets its search_path to include
-- both, rather than assuming crypt()/gen_salt() are just there.
create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'volunteer')),
  display_name text,
  created_at timestamptz not null default now()
);

alter table app_users enable row level security;
-- Deliberately no policies — see comment above.

-- Every sign-in attempt (successful or not) gets one row here — who
-- tried, whether it worked, and when. Lets you answer "who's actually
-- signed in and when" during the event, and spot repeated wrong-password
-- attempts. Same lockdown as app_users: RLS on with no policies at all,
-- so the anon key can't read or write this directly — only verify_login()
-- (below) can, because it's SECURITY DEFINER.
create table if not exists login_log (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  success boolean not null,
  role text,               -- the account's role if the login succeeded, else null
  logged_at timestamptz not null default now()
);

alter table login_log enable row level security;
-- Deliberately no policies — see comment above.

create or replace function verify_login(p_username text, p_password text)
returns table(username text, role text, display_name text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_match record;
begin
  select u.username, u.role, u.display_name into v_match
  from app_users u
  where u.username = p_username
    and u.password_hash = crypt(p_password, u.password_hash);

  insert into login_log (username, success, role)
  values (p_username, v_match.username is not null, v_match.role);

  if v_match.username is not null then
    return query select v_match.username, v_match.role, v_match.display_name;
  end if;
  return;
end;
$$;

-- Anon (the app's normal client) and authenticated may CALL the
-- function above, but still have no direct table access — see comment
-- on app_users.
grant execute on function verify_login(text, text) to anon, authenticated;

-- To see the login history (safe to run here — SQL editor, not the app):
--
--   select username, success, role, logged_at from login_log order by logged_at desc limit 100;
--
-- To see only failed attempts (e.g. to spot someone fumbling a password):
--
--   select username, logged_at from login_log where success = false order by logged_at desc;

-- Two small helper functions so adding people / changing passwords is one
-- short call in the SQL editor instead of having to remember the
-- crypt(..., gen_salt('bf')) syntax every time.
--
-- IMPORTANT: these are deliberately NOT granted to anon/authenticated (no
-- "grant execute ... to anon" line below, unlike verify_login above) — so
-- the app itself can never call them. They only run when YOU call them by
-- hand in the Supabase SQL editor, where you're signed in as the project
-- owner (the postgres role), not through the anon key. That's what keeps
-- "add a new account" from being something a visitor to the site could
-- ever trigger.

create or replace function add_app_user(
  p_username text,
  p_password text,
  p_role text,
  p_display_name text default null
)
returns void
language plpgsql
set search_path = public, extensions
as $$
begin
  insert into app_users (username, password_hash, role, display_name)
  values (p_username, crypt(p_password, gen_salt('bf')), p_role, p_display_name);
end;
$$;

create or replace function set_app_user_password(
  p_username text,
  p_new_password text
)
returns void
language plpgsql
set search_path = public, extensions
as $$
begin
  update app_users
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where username = p_username;
end;
$$;

-- Usage, in the SQL editor (one line per person — e.g. pasted in from your
-- Google Form responses):
--
--   select add_app_user('priya', 'choose-a-password', 'volunteer', 'Priya Sharma');
--   select add_app_user('admin_tarun', 'choose-a-password', 'admin', 'Tarun');
--
-- To change someone's password later:
--
--   select set_app_user_password('priya', 'new-password');
--
-- To see who's registered (safe to run here — you're looking at it
-- directly in the SQL editor, not through the anon-key app, and it never
-- shows the hash):
--
--   select username, role, display_name, created_at from app_users order by role, username;
--
-- To remove someone:
--
--   delete from app_users where username = 'priya';
