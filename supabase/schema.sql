-- Run this once in the Supabase SQL editor to set up the database.

create table if not exists attendees (
  id uuid primary key default gen_random_uuid(),
  serial_code text unique not null,      -- matches the code printed on the badge QR (e.g. ICORD25IN519)
  name text not null,
  organization text,
  kit_received timestamptz,
  lunch_day1 timestamptz,
  lunch_day2 timestamptz,
  high_tea_day1 timestamptz,
  high_tea_day2 timestamptz,
  gala_dinner timestamptz,
  created_at timestamptz default now()
);

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
