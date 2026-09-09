"use client";

import { useEffect, useRef, useState } from "react";
import {
  Attendee,
  ITINERARY_ITEMS,
  ItineraryKey,
  getAttendeeBySerial,
  markItineraryItem,
} from "@/lib/supabaseClient";

// NOTE for whoever builds the real UI (this is a functional stub, not
// the final design — swap the markup, keep the logic):
// 1. On mount, start the html5-qrcode scanner targeting #reader.
// 2. On a successful decode, call handleScan(decodedText).
// 3. handleScan looks up the attendee, shows their card + itinerary
//    status, and lets the volunteer tap which item they're fulfilling.

export default function ScanPage() {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleScan(serialCode: string) {
    setError(null);
    setLoading(true);
    try {
      const result = await getAttendeeBySerial(serialCode.trim());
      setAttendee(result);
    } catch (e) {
      setAttendee(null);
      setError("No attendee found for that code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMark(item: ItineraryKey) {
    if (!attendee) return;
    const alreadyDone = Boolean(attendee[item]);
    if (alreadyDone && !confirm("Already marked. Mark again anyway?")) return;

    await markItineraryItem(attendee.id, item);
    // refresh local state so the UI reflects the new status immediately
    const refreshed = await getAttendeeBySerial(attendee.serial_code);
    setAttendee(refreshed);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Volunteer Scanner</h1>

      {/* TODO: replace this manual-entry stand-in with the actual
          html5-qrcode camera view (a <div id="reader" />) once the
          scanning UI is designed. Manual entry stays as a fallback
          for damaged/unscannable badges. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (inputRef.current?.value) handleScan(inputRef.current.value);
        }}
        className="flex gap-2 mb-6"
      >
        <input
          ref={inputRef}
          placeholder="Enter or scan serial code"
          className="flex-1 rounded border border-slate-300 px-3 py-2"
        />
        <button className="rounded bg-slate-900 text-white px-4 py-2">
          Look up
        </button>
      </form>

      {loading && <p>Looking up…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {attendee && (
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="font-medium">{attendee.name}</p>
          <p className="text-sm text-slate-500 mb-4">
            {attendee.organization ?? "—"} · {attendee.serial_code}
          </p>

          <div className="grid gap-2">
            {ITINERARY_ITEMS.map(({ key, label }) => {
              const done = Boolean(attendee[key]);
              return (
                <button
                  key={key}
                  onClick={() => handleMark(key)}
                  className={`flex justify-between rounded border px-3 py-2 text-left ${
                    done
                      ? "bg-green-50 border-green-300"
                      : "border-slate-300"
                  }`}
                >
                  <span>{label}</span>
                  <span>{done ? "✓" : ""}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
