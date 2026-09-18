import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// The itinerary items every attendee can be checked off for.
// Keep this list in one place — both the scanner UI and the admin
// dashboard import it, so adding an item later (e.g. "workshop_pass")
// only means editing this array + the DB column + the schema file.
export const ITINERARY_ITEMS = [
  { key: "kit_received", label: "Conference Kit" },
  { key: "lunch_day1", label: "Lunch — Day 1" },
  { key: "lunch_day2", label: "Lunch — Day 2" },
  { key: "lunch_day3", label: "Lunch — Day 3" },
  { key: "high_tea_day1", label: "High Tea — Day 1" },
  { key: "high_tea_day2", label: "High Tea — Day 2" },
  { key: "high_tea_day3", label: "High Tea — Day 3" },
  { key: "gala_dinner", label: "Gala Dinner" },
] as const;

export type ItineraryKey = (typeof ITINERARY_ITEMS)[number]["key"];

export type Attendee = {
  id: string;
  serial_code: string;
  name: string;
  organization: string | null;
  is_onspot: boolean;
  designation: string; // e.g. "Delegate", "Speaker" — defaults to "TEST" until set (see supabase/schema.sql)
  phone: string | null;
  email: string | null;
  registered_days: number[]; // which of [1, 2, 3] this person actually registered for
} & Record<ItineraryKey, string | null>; // null = not done, timestamp = done

/**
 * Whether an attendee actually registered for a given day — some people
 * only sign up for 1 or 2 of the 3 days. Used to stop a volunteer from
 * checking someone in for a day they never registered for.
 */
export function isRegisteredForDay(attendee: Attendee, day: 1 | 2 | 3): boolean {
  return Array.isArray(attendee.registered_days) && attendee.registered_days.includes(day);
}

// Columns the volunteer/onboarding scan flow is allowed to see for a
// single attendee lookup — everything EXCEPT phone and email. Those two
// are admin-only contact details; leaving them out of this select means
// they never reach a volunteer's browser at all (not just hidden in the
// UI — genuinely absent from the network response), so there's nothing
// to find even by opening dev tools. Deliberately built as "everything
// except phone/email" rather than a hardcoded list, so a new column
// added later is included here automatically unless explicitly excluded.
const ATTENDEE_COLUMNS_NO_CONTACT = [
  "id",
  "serial_code",
  "name",
  "organization",
  "is_onspot",
  "designation",
  "registered_days",
  ...ITINERARY_ITEMS.map((i) => i.key),
].join(", ");

/**
 * Look up an attendee by the serial code embedded in their badge QR.
 * Used by the volunteer scan flow and onboarding — never returns phone
 * or email (see ATTENDEE_COLUMNS_NO_CONTACT above). The admin dashboard
 * gets the full row, including contact info, through its own separate
 * bulk query in app/admin/page.tsx.
 */
export async function getAttendeeBySerial(serialCode: string) {
  const { data, error } = await supabase
    .from("attendees")
    .select(ATTENDEE_COLUMNS_NO_CONTACT)
    .eq("serial_code", serialCode)
    .single();

  if (error) throw error;
  return data as unknown as Attendee;
}

/**
 * Mark one itinerary item as fulfilled for an attendee, and log the scan.
 * Safe to call twice — it just overwrites the timestamp — but the UI
 * should warn the volunteer on a re-scan so they don't double-serve food.
 */
export async function markItineraryItem(
  attendeeId: string,
  item: ItineraryKey,
  scannedBy?: string
) {
  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("attendees")
    .update({ [item]: now })
    .eq("id", attendeeId);

  if (updateError) throw updateError;

  const { error: logError } = await supabase.from("scan_log").insert({
    attendee_id: attendeeId,
    item,
    scanned_by: scannedBy ?? null,
    scanned_at: now,
  });

  if (logError) throw logError;
}

/**
 * Set (or clear) one itinerary item directly — used by the admin
 * dashboard's attendee table, where an admin can correct a scan by hand
 * (mark something done that a volunteer missed, or undo an accidental
 * scan) without going through the QR flow. done=true stamps "now" and
 * logs it to scan_log same as a real scan; done=false clears the column
 * back to null and does NOT write a scan_log row (there's nothing to log
 * — it's an undo, not an event).
 */
export async function setItineraryItem(
  attendeeId: string,
  item: ItineraryKey,
  done: boolean,
  scannedBy?: string
) {
  const now = done ? new Date().toISOString() : null;

  const { error: updateError } = await supabase
    .from("attendees")
    .update({ [item]: now })
    .eq("id", attendeeId);

  if (updateError) throw updateError;

  if (done) {
    const { error: logError } = await supabase.from("scan_log").insert({
      attendee_id: attendeeId,
      item,
      scanned_by: scannedBy ?? null,
      scanned_at: now,
    });
    if (logError) throw logError;
  }
}

// ---------------------------------------------------------------------
// On-the-spot registration. For walk-ins who show up without a
// pre-printed pre-registered badge: staff at the onboarding desk hand
// them one of the spare pre-generated QR codes (see QR_generation/),
// scan or type its serial code here along with their name/org, and this
// creates a brand-new attendees row for them — tagged is_onspot so admin
// can see, filter, and count how many walk-ins were onboarded on-site
// separately from the pre-registered list.
// ---------------------------------------------------------------------

export class DuplicateSerialError extends Error {}

export async function registerOnspotAttendee(
  serialCode: string,
  name: string,
  organization: string,
  registeredDays: number[] = [1, 2, 3]
) {
  const { data, error } = await supabase
    .from("attendees")
    .insert({
      serial_code: serialCode,
      name,
      organization: organization || null,
      is_onspot: true,
      registered_days: registeredDays,
    })
    .select()
    .single();

  if (error) {
    // Postgres unique-violation code — this serial code was already used.
    if (error.code === "23505") {
      throw new DuplicateSerialError(`"${serialCode}" is already registered.`);
    }
    throw error;
  }
  return data as Attendee;
}

/**
 * Update which days an attendee is registered for — used by the admin
 * dashboard's attendee table to correct a walk-in's day validity after
 * the fact (e.g. they paid to extend to another day).
 */
export async function setAttendeeRegisteredDays(attendeeId: string, days: number[]) {
  const { error } = await supabase
    .from("attendees")
    .update({ registered_days: days })
    .eq("id", attendeeId);
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Category on/off switches (for the admin dashboard). Backed by the
// `category_settings` table — one row per itinerary key. A key with no
// row (e.g. before the migration in supabase/schema.sql is run) defaults
// to enabled, so nothing breaks if this table is missing rows.
// ---------------------------------------------------------------------

export type CategorySettings = Record<ItineraryKey, boolean>;

export async function getCategorySettings(): Promise<CategorySettings> {
  const settings = {} as CategorySettings;
  for (const item of ITINERARY_ITEMS) settings[item.key] = true;

  const { data, error } = await supabase.from("category_settings").select("key, enabled");
  if (error) throw error;

  for (const row of data ?? []) {
    if (row.key in settings) settings[row.key as ItineraryKey] = Boolean(row.enabled);
  }
  return settings;
}

export async function setCategoryEnabled(key: ItineraryKey, enabled: boolean) {
  const { error } = await supabase.from("category_settings").upsert({ key, enabled });
  if (error) throw error;
}

// ---------------------------------------------------------------------
// "Live day" — which day (1/2/3) the volunteer scan flow treats as
// "today". Drives the home screen's open (today) / closed (past) /
// locked (future) category states, matching the prototype's day-switch
// UI. Set from the admin dashboard's day nav. Backed by a tiny
// key/value `app_settings` table; defaults to 1 if the row is missing.
// ---------------------------------------------------------------------

export type Day = 1 | 2 | 3;

export async function getLiveDay(): Promise<Day> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "live_day")
    .maybeSingle();
  if (error) throw error;
  const parsed = Number(data?.value);
  return (parsed === 1 || parsed === 2 || parsed === 3 ? parsed : 1) as Day;
}

export async function setLiveDay(day: Day) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "live_day", value: String(day) });
  if (error) throw error;
}

// ---------------------------------------------------------------------
// Per-person login. Every volunteer/onboarding person and every admin
// has their own row in app_users (see supabase/schema.sql) with a role
// that decides which pages they can reach. There's no direct table
// access for the anon key here — verify_login() is a SECURITY DEFINER
// Postgres function that checks the password server-side (via pgcrypto)
// and only ever returns username/role/display_name, never the hash, and
// only on an exact match. Called from app/api/auth/route.ts.
// ---------------------------------------------------------------------

export type UserRole = "admin" | "volunteer";

export type AppUser = {
  username: string;
  role: UserRole;
  display_name: string | null;
};

export async function verifyLogin(username: string, password: string): Promise<AppUser | null> {
  const { data, error } = await supabase.rpc("verify_login", {
    p_username: username,
    p_password: password,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    username: row.username,
    role: row.role as UserRole,
    display_name: row.display_name ?? null,
  };
}
