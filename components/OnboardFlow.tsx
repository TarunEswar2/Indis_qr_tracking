"use client";

import { useEffect, useRef, useState } from "react";
import {
  Attendee,
  DuplicateSerialError,
  getAttendeeBySerial,
  registerOnspotAttendee,
  supabase,
} from "@/lib/supabaseClient";

// Onboarding desk: for walk-ins who show up without a pre-printed
// pre-registered badge. Staff hand them one of the spare pre-generated
// QR codes (see QR_generation/), scan or type its serial code here, fill
// in their name/org, and this creates a brand-new attendees row tagged
// is_onspot — so /admin can see, filter, and count on-the-spot
// registrations separately from the pre-registered list.
//
// Lives inside app/admin/page.tsx now (behind the admin login, opened
// via the "Onboard walk-in" button) rather than as its own route —
// mirrors prototype_ui/indis-scan-flow.jsx's AdminScreen, which nests
// this exact flow (OnboardFlow) inside the admin dashboard instead of
// giving it a separate top-level tab.

const SCANNER_ELEMENT_ID = "onboarding-reader";

let cameraLock: Promise<void> = Promise.resolve();

function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = cameraLock.then(task, task);
  cameraLock = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function BackArrow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function OnboardFlow({ onBack }: { onBack: () => void }) {
  // "qr" shows only the camera; "id" shows only the name/org form —
  // never both at once. A successful scan switches straight to "id" so
  // the tab bar itself becomes the "next screen" transition (matching
  // prototype_ui/indis-scan-flow.jsx's OnboardFlow exactly), rather than
  // a separate hidden step.
  const [tab, setTab] = useState<"qr" | "id">("qr");
  const [serialCode, setSerialCode] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  // Which days this walk-in actually registered for — defaults to all
  // three (the common case), narrowed if they only signed up for part
  // of the event. Mirrors attendees.registered_days (see
  // supabase/schema.sql) and is what the scan flow later checks before
  // letting a volunteer mark them for a day they didn't register for.
  const [registeredDays, setRegisteredDays] = useState<number[]>([1, 2, 3]);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState<Attendee | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const scannerRef = useRef<any>(null);
  const decodedOnceRef = useRef(false);

  async function refreshCount() {
    const { count } = await supabase
      .from("attendees")
      .select("id", { count: "exact", head: true })
      .eq("is_onspot", true);
    setTodayCount(count ?? 0);
  }

  useEffect(() => {
    refreshCount();
  }, []);

  async function startScanner() {
    await runExclusive(async () => {
      setCameraError(null);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const el = document.getElementById(SCANNER_ELEMENT_ID);
        if (!el) return;
        el.innerHTML = "";

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            if (decodedOnceRef.current) return;
            decodedOnceRef.current = true;
            handleDecoded(decodedText.trim());
          },
          () => {}
        );

        const video = el.querySelector("video") as HTMLVideoElement | null;
        if (video && video.paused) video.play().catch(() => {});

        setScannerActive(true);
      } catch {
        setScannerActive(false);
        setCameraError("Couldn't access the camera. Use the Type ID tab instead.");
      }
    });
  }

  // Checks the scanned code against the attendees table before doing
  // anything else — a code that's already registered (either a
  // pre-registered badge, or someone already onboarded) never gets to
  // the name/org form at all; it just shows a warning right here on the
  // scan screen and starts scanning again.
  async function handleDecoded(serial: string) {
    stopScanner();
    let alreadyRegistered = true;
    try {
      await getAttendeeBySerial(serial);
    } catch {
      alreadyRegistered = false;
    }

    if (alreadyRegistered) {
      setScanWarning(`"${serial}" is already registered.`);
      decodedOnceRef.current = false;
      startScanner();
      return;
    }

    setScanWarning(null);
    setSerialCode(serial);
    setTab("id");
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScannerActive(false);
    if (!scanner) return;
    await runExclusive(async () => {
      try {
        await scanner.stop();
      } catch {}
      try {
        await scanner.clear();
      } catch {}
      const el = document.getElementById(SCANNER_ELEMENT_ID);
      if (el) el.innerHTML = "";
    });
  }

  useEffect(() => {
    if (tab === "qr" && !registered) {
      decodedOnceRef.current = false;
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, registered]);

  function switchTab(next: "qr" | "id") {
    if (next === tab) return;
    setTab(next);
    if (next === "qr") {
      // Coming back to the scan tab always starts at a fresh scan, not
      // wherever the previous attempt left off.
      setSerialCode("");
      setError(null);
      setScanWarning(null);
    }
  }

  function toggleDay(day: number) {
    setRegisteredDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !serialCode.trim() || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const attendee = await registerOnspotAttendee(
        serialCode.trim(),
        name.trim(),
        organization.trim(),
        registeredDays.length > 0 ? registeredDays : [1, 2, 3]
      );
      setRegistered(attendee);
      refreshCount();
    } catch (e) {
      if (e instanceof DuplicateSerialError) {
        setError(e.message + " Use a different code, or check the attendee list if this was a mistake.");
      } else {
        setError("Couldn't register — try again.");
      }
      setSerialCode("");
      decodedOnceRef.current = false;
      setTab("qr");
    } finally {
      setSubmitting(false);
    }
  }

  function registerAnother() {
    setRegistered(null);
    setSerialCode("");
    setName("");
    setOrganization("");
    setRegisteredDays([1, 2, 3]);
    setError(null);
    setScanWarning(null);
    decodedOnceRef.current = false;
    setTab("qr");
  }

  if (registered) {
    return (
      <div className="screen">
        <div className="scan-header">
          <button className="icon-btn" onClick={onBack} aria-label="Back to dashboard">
            <BackArrow />
          </button>
          <h1 className="scan-title">Onboard walk-in</h1>
        </div>

        <div className="confirm-block">
          <div className="check-circle">
            <CheckIcon width="30" height="30" />
          </div>
          <p className="confirm-title">Registered</p>
          <p className="confirm-time">They're now in the system and can be scanned normally</p>
        </div>

        <div className="delegate-card">
          <div className="delegate-block">
            <p className="delegate-serial">{registered.serial_code}</p>
            <p className="delegate-tag">Delegate</p>
            <p className="delegate-name">{registered.name}</p>
            <p className="delegate-role">{registered.organization || "—"}</p>
          </div>
        </div>

        <p className="onboard-count">
          On-the-spot registrations so far: <b>{todayCount ?? "…"}</b>
        </p>

        <button className="primary-btn confirm-back-btn" onClick={registerAnother}>
          Register another
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to dashboard">
          <BackArrow />
        </button>
        <h1 className="scan-title">Onboard walk-in</h1>
      </div>

      <p className="onboard-count">
        On-the-spot registrations so far: <b>{todayCount ?? "…"}</b>
      </p>

      <div className="tab-row-wrap">
        <div className="tabs">
          <button className={`tab ${tab === "qr" ? "tab-active" : ""}`} onClick={() => switchTab("qr")} type="button">
            Scan QR
          </button>
          <button className={`tab ${tab === "id" ? "tab-active" : ""}`} onClick={() => switchTab("id")} type="button">
            Type ID
          </button>
        </div>
        <div className="tab-row-baseline" />
      </div>

      {tab === "qr" ? (
        <div className="qr-pane">
          <div className="viewfinder">
            <div id={SCANNER_ELEMENT_ID} className="viewfinder-camera" />
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />
            {scannerActive && <span className="scan-line" />}
          </div>
          {cameraError ? (
            <p className="qr-help qr-help-warn">{cameraError}</p>
          ) : scanWarning ? (
            <p className="qr-help qr-help-warn">{scanWarning} Try a different spare code.</p>
          ) : (
            <p className="qr-help">Scan the QR printed on the walk-in's new ID tag</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="onboard-form">
          <label className="id-label" htmlFor="onboard-serial">
            Serial / ID on the QR code
          </label>
          <input
            id="onboard-serial"
            className="id-input onboard-field"
            value={serialCode}
            onChange={(e) => setSerialCode(e.target.value)}
            placeholder="e.g. ONSPOT007"
          />

          <label className="id-label" htmlFor="onboard-name">
            Full name
          </label>
          <input
            id="onboard-name"
            className="id-input onboard-field"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Delegate's name"
          />

          <label className="id-label" htmlFor="onboard-org">
            Organization (optional)
          </label>
          <input
            id="onboard-org"
            className="id-input onboard-field"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="College / company"
          />

          <label className="id-label">Day validity</label>
          <div className="onboard-day-checks">
            {[1, 2, 3].map((day) => (
              <label key={day} className="onboard-day-check">
                <input
                  type="checkbox"
                  checked={registeredDays.includes(day)}
                  onChange={() => toggleDay(day)}
                />
                Day {day}
              </label>
            ))}
          </div>

          {error && (
            <div className="id-error-box">
              <p className="id-error-text">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="primary-btn onboard-register-btn"
            disabled={submitting || !serialCode.trim() || !name.trim() || registeredDays.length === 0}
          >
            {submitting ? "Registering…" : "Register"}
          </button>
        </form>
      )}
    </div>
  );
}
