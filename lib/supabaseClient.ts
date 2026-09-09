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
  { key: "high_tea_day1", label: "High Tea — Day 1" },
  { key: "high_tea_day2", label: "High Tea — Day 2" },
  { key: "gala_dinner", label: "Gala Dinner" },
] as const;

export type ItineraryKey = (typeof ITINERARY_ITEMS)[number]["key"];

export type Attendee = {
  id: string;
  serial_code: string;
  name: string;
  organization: string | null;
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
