"use client";

import { useEffect, useRef, useState } from "react";
import { Attendee, AttendeeEditableFields, updateAttendee } from "@/lib/supabaseClient";

// Admin dashboard -> "Maintenance": two housekeeping tools that don't fit
// the day-to-day scan/onboard/emergency flows.
//
// 1. Scan QR — a continuous badge-verification tester. Point the camera at
//    a stack of printed badges one after another; each scan flashes a
//    pass/fail against the already-loaded `attendees` array (no network
//    call needed — same reasoning as Emergency scan) and keeps running,
//    so you can burn through a box of badges before the event and catch
//    any that don't decode or don't match a record, without navigating
//    away between scans.
//
// 2. Edit participant — search for anyone and correct any of their own
//    fields (name, organization, designation, phone, email, which days
//    they're registered for). serial_code is read-only: it's physically
//    printed on the badge, so changing it here would just orphan the badge.

const SCANNER_ELEMENT_ID = "maintenance-reader";
const RESUME_DELAY_MS = 1100;

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

type Tool = "scanqr" | "edit" | null;
type ScanResult = { serial: string; found: boolean; name?: string };

function ScanQrTool({ attendees, onBack }: { attendees: Attendee[]; onBack: () => void }) {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [tally, setTally] = useState({ checked: 0, ok: 0, bad: 0 });
  const scannerRef = useRef<any>(null);
  const busyRef = useRef(false);

  function handleDecoded(serial: string) {
    if (busyRef.current) return;
    busyRef.current = true;

    const trimmed = serial.trim();
    const match = attendees.find((a) => a.serial_code.toLowerCase() === trimmed.toLowerCase());
    setLastResult({ serial: trimmed, found: Boolean(match), name: match?.name });
    setTally((prev) => ({
      checked: prev.checked + 1,
      ok: prev.ok + (match ? 1 : 0),
      bad: prev.bad + (match ? 0 : 1),
    }));

    // Keep scanning — this tool is for burning through a stack of badges,
    // not stopping on the first one. Give the volunteer a beat to read the
    // result before the next decode can register.
    setTimeout(() => {
      busyRef.current = false;
    }, RESUME_DELAY_MS);
  }

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
          (decodedText: string) => handleDecoded(decodedText),
          () => {}
        );

        const video = el.querySelector("video") as HTMLVideoElement | null;
        if (video && video.paused) video.play().catch(() => {});

        setScannerActive(true);
      } catch {
        setScannerActive(false);
        setCameraError("Couldn't access the camera.");
      }
    });
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
    startScanner();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to maintenance">
          <BackArrow />
        </button>
        <h1 className="scan-title">Scan QR — verify badges</h1>
      </div>

      <p className="qr-help">
        Checked <b>{tally.checked}</b> · <span className="maint-ok">{tally.ok} ok</span> ·{" "}
        <span className="maint-bad">{tally.bad} failed</span>
      </p>

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
        ) : (
          <p className="qr-help">Scan badges one after another — it keeps running</p>
        )}
      </div>

      {lastResult && (
        <div className={`maint-result ${lastResult.found ? "maint-result-ok" : "maint-result-bad"}`}>
          <p className="maint-result-serial">{lastResult.serial}</p>
          <p className="maint-result-status">
            {lastResult.found ? `✓ Found — ${lastResult.name}` : "✗ Not found in the system"}
          </p>
        </div>
      )}
    </div>
  );
}

function EditParticipantTool({
  attendees,
  onBack,
  onAttendeeUpdated,
}: {
  attendees: Attendee[];
  onBack: () => void;
  onAttendeeUpdated: (a: Attendee) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Attendee | null>(null);
  const [form, setForm] = useState<AttendeeEditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const q = search.trim().toLowerCase();
  const results = q
    ? attendees
        .filter(
          (a) =>
            a.serial_code.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            (a.organization ?? "").toLowerCase().includes(q)
        )
        .slice(0, 20)
    : [];

  function pick(a: Attendee) {
    setSelected(a);
    setSaved(false);
    setSaveError(null);
    setForm({
      name: a.name,
      organization: a.organization,
      designation: a.designation,
      phone: a.phone,
      email: a.email,
      registered_days: Array.isArray(a.registered_days) ? [...a.registered_days] : [],
    });
  }

  function toggleDay(day: number) {
    if (!form) return;
    setForm({
      ...form,
      registered_days: form.registered_days.includes(day)
        ? form.registered_days.filter((d) => d !== day)
        : [...form.registered_days, day].sort(),
    });
  }

  async function handleSave() {
    if (!selected || !form || saving) return;
    if (!form.name.trim()) {
      setSaveError("Name can't be blank.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateAttendee(selected.id, form);
      onAttendeeUpdated(updated);
      setSelected(updated);
      setSaved(true);
    } catch {
      setSaveError("Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  if (selected && form) {
    return (
      <div className="screen">
        <div className="scan-header">
          <button
            className="icon-btn"
            onClick={() => {
              setSelected(null);
              setForm(null);
            }}
            aria-label="Back to search"
          >
            <BackArrow />
          </button>
          <h1 className="scan-title">Edit participant</h1>
        </div>

        <p className="onboard-count">
          Serial / ID (fixed — printed on badge): <b>{selected.serial_code}</b>
        </p>

        <form
          className="onboard-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <label className="id-label" htmlFor="edit-name">
            Full name
          </label>
          <input
            id="edit-name"
            className="id-input onboard-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label className="id-label" htmlFor="edit-org">
            Organization
          </label>
          <input
            id="edit-org"
            className="id-input onboard-field"
            value={form.organization ?? ""}
            onChange={(e) => setForm({ ...form, organization: e.target.value })}
          />

          <label className="id-label" htmlFor="edit-designation">
            Designation
          </label>
          <input
            id="edit-designation"
            className="id-input onboard-field"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
          />

          <label className="id-label" htmlFor="edit-phone">
            Phone
          </label>
          <input
            id="edit-phone"
            className="id-input onboard-field"
            type="tel"
            inputMode="tel"
            value={form.phone ?? ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <label className="id-label" htmlFor="edit-email">
            Email
          </label>
          <input
            id="edit-email"
            className="id-input onboard-field"
            type="email"
            inputMode="email"
            value={form.email ?? ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label className="id-label">Day validity</label>
          <div className="onboard-day-checks">
            {[1, 2, 3].map((day) => (
              <label key={day} className="onboard-day-check">
                <input type="checkbox" checked={form.registered_days.includes(day)} onChange={() => toggleDay(day)} />
                Day {day}
              </label>
            ))}
          </div>

          {saveError && (
            <div className="id-error-box">
              <p className="id-error-text">{saveError}</p>
            </div>
          )}
          {saved && !saveError && <p className="maint-saved">Saved.</p>}

          <button type="submit" className="primary-btn onboard-register-btn" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to maintenance">
          <BackArrow />
        </button>
        <h1 className="scan-title">Edit participant</h1>
      </div>

      <input
        className="id-input admin-search-input"
        placeholder="Search name, ID, organization…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />

      <div className="id-matches">
        {results.map((a) => (
          <button key={a.id} type="button" className="id-match-btn" onClick={() => pick(a)}>
            <span className="id-match-serial">{a.serial_code}</span>
            <span className="id-match-name">{a.name}</span>
          </button>
        ))}
        {q && results.length === 0 && <p className="qr-help">No attendees match "{search.trim()}".</p>}
      </div>
    </div>
  );
}

export default function MaintenanceFlow({
  attendees,
  onBack,
  onAttendeeUpdated,
}: {
  attendees: Attendee[];
  onBack: () => void;
  onAttendeeUpdated: (a: Attendee) => void;
}) {
  const [tool, setTool] = useState<Tool>(null);

  if (tool === "scanqr") return <ScanQrTool attendees={attendees} onBack={() => setTool(null)} />;
  if (tool === "edit") return <EditParticipantTool attendees={attendees} onBack={() => setTool(null)} onAttendeeUpdated={onAttendeeUpdated} />;

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to dashboard">
          <BackArrow />
        </button>
        <h1 className="scan-title">Maintenance</h1>
      </div>

      <div className="maint-tool-list">
        <button className="onboard-entry-btn admin-entry-btn" type="button" onClick={() => setTool("scanqr")}>
          Scan QR — verify badges
        </button>
        <button className="onboard-entry-btn admin-entry-btn" type="button" onClick={() => setTool("edit")}>
          Edit participant info
        </button>
      </div>
    </div>
  );
}
