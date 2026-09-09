"use client";

import { useEffect, useRef, useState } from "react";
import {
  Attendee,
  ITINERARY_ITEMS,
  ItineraryKey,
  getAttendeeBySerial,
  markItineraryItem,
} from "@/lib/supabaseClient";

// Camera-based QR scanning via html5-qrcode, with manual entry kept as a
// fallback for damaged/unscannable badges. The scanner runs inside the
// #reader div and is started/stopped as the volunteer moves between
// "looking for a badge" and "reviewing a found attendee" so the camera
// isn't burning battery/CPU while a result is on screen.

const SCANNER_ELEMENT_ID = "reader";

export default function ScanPage() {
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<any>(null);

  async function handleScan(serialCode: string) {
    const trimmed = serialCode.trim();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    try {
      const result = await getAttendeeBySerial(trimmed);
      setAttendee(result);
      stopScanner();
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
    const refreshed = await getAttendeeBySerial(attendee.serial_code);
    setAttendee(refreshed);
  }

  function scanNext() {
    setAttendee(null);
    setError(null);
    startScanner();
  }

  // --- camera scanner lifecycle ---

  async function startScanner() {
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const el = document.getElementById(SCANNER_ELEMENT_ID);
      if (!el) return;

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText: string) => {
          // fires on every successful decode; handleScan below stops
          // the scanner once we get a match, so this can't double-fire
          // into two lookups for the same badge
          handleScan(decodedText);
        },
        () => {
          // per-frame "no QR found" callback — expected constantly while
          // aiming the camera, intentionally not surfaced as an error
        }
      );
      setScannerActive(true);
    } catch (e: any) {
      setScannerActive(false);
      setCameraError(
        "Couldn't access the camera. Check camera permissions, or use manual entry below."
      );
    }
  }

  function stopScanner() {
    const scanner = scannerRef.current;
    if (scanner) {
      // html5-qrcode's stop()/clear() can throw *synchronously* (not just
      // reject) if the scanner isn't in a "running" state yet. Without these
      // try/catches, that throw was escaping into handleScan's try block and
      // getting swallowed by its catch — wiping out a just-found attendee
      // and showing "No attendee found" even though the lookup succeeded.
      try {
        scanner.stop().catch(() => {});
      } catch {}
      try {
        scanner.clear().catch(() => {});
      } catch {}
      scannerRef.current = null;
    }
    setScannerActive(false);
  }

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Volunteer Scanner</h1>

      {!attendee && (
        <>
          <div
            id={SCANNER_ELEMENT_ID}
            className="w-full rounded-lg overflow-hidden bg-slate-900 mb-3"
            style={{ minHeight: scannerActive ? undefined : 0 }}
          />

          {cameraError && (
            <p className="text-sm text-amber-600 mb-3">{cameraError}</p>
          )}
          {!cameraError && (
            <p className="text-sm text-slate-500 mb-4">
              Point the camera at the QR code on the delegate's badge.
            </p>
          )}

          <details className="mb-6">
            <summary className="text-sm text-slate-600 cursor-pointer">
              Enter code manually instead
            </summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputRef.current?.value) handleScan(inputRef.current.value);
              }}
              className="flex gap-2 mt-3"
            >
              <input
                ref={inputRef}
                placeholder="Enter serial code"
                className="flex-1 rounded border border-slate-300 px-3 py-2"
              />
              <button className="rounded bg-slate-900 text-white px-4 py-2">
                Look up
              </button>
            </form>
          </details>
        </>
      )}

      {loading && <p>Looking up…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {attendee && (
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="font-medium">{attendee.name}</p>
          <p className="text-sm text-slate-500 mb-4">
            {attendee.organization ?? "—"} · {attendee.serial_code}
          </p>

          <div className="grid gap-2 mb-4">
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

          <button
            onClick={scanNext}
            className="w-full rounded bg-slate-900 text-white px-4 py-2"
          >
            Scan next attendee
          </button>
        </div>
      )}
    </main>
  );
}
