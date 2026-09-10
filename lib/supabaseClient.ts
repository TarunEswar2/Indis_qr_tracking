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
} & Record<ItineraryKey, string | null>; // null = not done, timestamp = done

/**
 * Look up an attendee by the serial code embedded in their badge QR.
 */
export async function getAttendeeBySerial(serialCode: string) {
  const { data, error } = await supabase
    .from("attendees")
    .select("*")
    .eq("serial_code", serialCode)
    .single();

  if (error) throw error;
  return data as Attendee;
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
  organization: string
) {
  const { data, error } = await supabase
    .from("attendees")
    .insert({
      serial_code: serialCode,
      name,
      organization: organization || null,
      is_onspot: true,
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
