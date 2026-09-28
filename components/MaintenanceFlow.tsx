"use client";

import { useEffect, useRef, useState } from "react";
import {
  Attendee,
  AttendeeEditableFields,
  CategorySettings,
  ItineraryKey,
  WalkinItem,
  setAttendeeIdVerified,
  updateAttendee,
} from "@/lib/supabaseClient";

// Admin dashboard -> "Maintenance": two housekeeping tools that don't fit
// the day-to-day scan/onboard/emergency flows.
//
// 1. Scan QR — a continuous badge-verification tester. Point the camera at
//    a stack of printed badges one after another; each scan is checked
//    against the already-loaded `attendees` array (no network call
//    needed to look it up — same reasoning as Emergency scan) and keeps
//    running, so you can burn through a box of badges before the event.
//    A match is written straight to the database as id_verified = true
//    (the same flag Edit participant's "Mark verified" toggle sets) —
//    scanning it here IS the verification, no separate step needed. A
//    code that doesn't decode to any record is flagged but changes
//    nothing in the database.
//
// 2. Edit participant — search or scan a badge to pull up anyone, correct
//    any of their own fields (name, organization, designation, phone,
//    email, which days they're registered for), and tick "ID verified"
//    once you've confirmed the physical badge actually decodes to this
//    exact record — a running checklist, not a fact about the person, so
//    it saves immediately rather than waiting on the rest of the form.
//    serial_code itself is read-only: it's physically printed on the
//    badge, so changing it here would just orphan the badge.

const SCANNER_ELEMENT_ID = "maintenance-reader";
const EDIT_SCANNER_ELEMENT_ID = "maintenance-edit-reader";
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

// ---- Live day & Categories (moved here from the main admin dashboard —
// see MaintenanceFlow default export below) ----

type Category = "kit" | "lunch" | "highTea" | "coffee" | "gala";
type Day = 1 | 2 | 3;

const CATEGORY_LABEL: Record<Category, string> = {
  kit: "Conference Kit",
  lunch: "Lunch",
  highTea: "High Tea",
  coffee: "Coffee",
  gala: "Gala Dinner",
};

// Kit is a one-time item now offered on every day (see keyFor below), so
// it appears in every day's category list.
const DAY_CATEGORIES: Record<Day, Category[]> = {
  1: ["kit", "lunch", "highTea", "coffee"],
  2: ["kit", "lunch", "highTea", "coffee", "gala"],
  3: ["kit", "lunch", "highTea", "coffee"],
};

// Categories that also serve people with no badge/QR at all — the
// dashboard shows their walk-in headcount alongside the scanned count.
const WALKIN_TRACKED: Partial<Record<Category, WalkinItem>> = {
  highTea: "high_tea",
  coffee: "coffee",
};

function keyFor(day: Day, category: Category): ItineraryKey | null {
  if (category === "kit") return "kit_received"; // one-time item, offered every day
  if (category === "lunch") {
    if (day === 1) return "lunch_day1";
    if (day === 2) return "lunch_day2";
    return "lunch_day3";
  }
  if (category === "highTea") {
    if (day === 1) return "high_tea_day1";
    if (day === 2) return "high_tea_day2";
    return "high_tea_day3";
  }
  if (category === "coffee") {
    if (day === 1) return "coffee_day1";
    if (day === 2) return "coffee_day2";
    return "coffee_day3";
  }
  if (category === "gala") return day === 2 ? "gala_dinner" : null;
  return null;
}

function ChevronLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "toggle-on" : ""}`}
      onClick={onChange}
      aria-pressed={checked}
      aria-label={label}
      disabled={disabled}
    >
      <span className="toggle-knob" />
    </button>
  );
}

function LiveDayTool({
  attendees,
  onBack,
  liveDay,
  savingLiveDay,
  onChangeLiveDay,
  settings,
  togglingKey,
  walkinCounts,
  onToggleCategory,
  onToggleMasterForDay,
  onAdjustWalkin,
}: {
  attendees: Attendee[];
  onBack: () => void;
  liveDay: Day;
  savingLiveDay: boolean;
  onChangeLiveDay: (next: Day) => void;
  settings: CategorySettings | null;
  togglingKey: ItineraryKey | null;
  walkinCounts: Record<string, number>;
  onToggleCategory: (key: ItineraryKey) => void;
  onToggleMasterForDay: (day: Day) => void;
  onAdjustWalkin: (item: WalkinItem, delta: number) => void;
}) {
  const dayCats = DAY_CATEGORIES[liveDay];
  const dayKeys = dayCats.map((c) => keyFor(liveDay, c)).filter(Boolean) as ItineraryKey[];
  const masterOn = settings ? dayKeys.every((k) => settings[k]) : true;

  function scanCount(day: Day, cat: Category) {
    const key = keyFor(day, cat);
    if (!key) return 0;
    return attendees.filter((a) => Boolean(a[key])).length;
  }

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to maintenance">
          <BackArrow />
        </button>
        <h1 className="scan-title">Live day &amp; Categories</h1>
      </div>

      <div className="admin-section-head">
        <h2 className="admin-h2">Live day</h2>
        <div className="admin-day-nav">
          <button
            className="icon-circle-btn"
            onClick={() => onChangeLiveDay((Math.max(1, liveDay - 1)) as Day)}
            disabled={liveDay === 1 || savingLiveDay}
            aria-label="Previous live day"
          >
            <ChevronLeft />
          </button>
          <span className="admin-live-day-label">Day {liveDay}</span>
          <button
            className="icon-circle-btn"
            onClick={() => onChangeLiveDay((Math.min(3, liveDay + 1)) as Day)}
            disabled={liveDay === 3 || savingLiveDay}
            aria-label="Next live day"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <p className="qr-help admin-live-day-help">
        What the volunteer scanner treats as "today" — its categories are open (subject to the toggles
        below), earlier days show "Closed", later days are locked.
      </p>

      <div className="admin-section-head admin-section-head-spaced">
        <h2 className="admin-h2">Categories</h2>
      </div>

      <div className="admin-cat-table">
        <div className="admin-cat-day-row">
          <span>DAY {String(liveDay).padStart(2, "0")}</span>
          <Toggle checked={masterOn} onChange={() => onToggleMasterForDay(liveDay)} label="Toggle all categories" />
        </div>
        {dayCats.map((c) => {
          const key = keyFor(liveDay, c);
          const enabled = key && settings ? settings[key] : true;
          // Lunch is only walk-in-tracked on Day 1 (for now) — High
          // Tea/Coffee stay tracked every day. See the matching
          // day-aware override in app/scan/page.tsx.
          const walkinItem: WalkinItem | undefined =
            c === "lunch" ? (liveDay === 1 ? "lunch" : undefined) : WALKIN_TRACKED[c];
          return (
            <div className="admin-cat-row" key={c}>
              <span className="admin-cat-name">{CATEGORY_LABEL[c]}</span>
              <span className="admin-cat-count">
                {scanCount(liveDay, c)} scanned
                {walkinItem && (
                  <span className="admin-walkin-adjust">
                    {" · "}
                    {walkinCounts[`${liveDay}:${walkinItem}`] ?? 0} walk-in
                    <button
                      type="button"
                      className="admin-walkin-btn"
                      onClick={() => onAdjustWalkin(walkinItem, -1)}
                      aria-label={`Decrease ${CATEGORY_LABEL[c]} walk-in count`}
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className="admin-walkin-btn"
                      onClick={() => onAdjustWalkin(walkinItem, 1)}
                      aria-label={`Increase ${CATEGORY_LABEL[c]} walk-in count`}
                    >
                      +
                    </button>
                  </span>
                )}
              </span>
              <Toggle
                checked={Boolean(enabled)}
                onChange={() => key && onToggleCategory(key)}
                label={`Toggle ${CATEGORY_LABEL[c]}`}
                disabled={!key || togglingKey === key}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BackArrow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Tool = "scanqr" | "edit" | "liveday" | null;

function ScanQrTool({
  attendees,
  onBack,
  onAttendeeUpdated,
}: {
  attendees: Attendee[];
  onBack: () => void;
  onAttendeeUpdated: (a: Attendee) => void;
}) {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [notFoundSerial, setNotFoundSerial] = useState<string | null>(null);
  // The matched attendee waiting on-screen for a human decision — nothing
  // is written to the database until "Confirm verified" is pressed. The
  // scanner is paused while this is set, so a second badge can't sneak in
  // underneath before you've reviewed the first one.
  const [pending, setPending] = useState<Attendee | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const decodedOnceRef = useRef(false);

  // Checked/unchecked comes straight from the database (the id_verified
  // column on every attendee already loaded), not a count of this
  // session's scans — so it reads correctly even if you close and reopen
  // this tool partway through.
  const checkedCount = attendees.filter((a) => a.id_verified).length;
  const uncheckedCount = attendees.length - checkedCount;

  async function handleDecoded(serial: string) {
    if (decodedOnceRef.current) return;
    decodedOnceRef.current = true;
    await stopScanner();

    const trimmed = serial.trim();
    const match = attendees.find((a) => a.serial_code.toLowerCase() === trimmed.toLowerCase());
    setSaveError(null);
    if (match) {
      setNotFoundSerial(null);
      setPending(match);
    } else {
      setPending(null);
      setNotFoundSerial(trimmed);
      // Nothing to confirm — just flash the message and keep scanning.
      setTimeout(() => {
        decodedOnceRef.current = false;
        startScanner();
      }, RESUME_DELAY_MS);
    }
  }

  async function handleConfirm() {
    if (!pending || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await setAttendeeIdVerified(pending.id, true);
      onAttendeeUpdated({ ...pending, id_verified: true });
      resumeScanning();
    } catch {
      setSaveError("Couldn't save — try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    resumeScanning();
  }

  function resumeScanning() {
    setPending(null);
    setSaveError(null);
    decodedOnceRef.current = false;
    // Don't call startScanner() here directly: the camera <div> only
    // exists in the DOM once `pending` is null, and this setPending(null)
    // hasn't been applied to the DOM yet in this same tick (that's what
    // caused the black screen after "Confirm verified" — startScanner ran
    // before the viewfinder div was back on screen, found no element, and
    // silently bailed out). The effect below, keyed on `pending`, starts
    // the camera once React has actually re-rendered the viewfinder.
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
    // Only run the camera while the confirm card isn't showing — the
    // viewfinder div isn't in the DOM while `pending` is set. This also
    // covers the initial mount (pending starts out null) and every
    // "Confirm"/"Skip" that clears it back to null.
    if (pending) return;
    startScanner();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to maintenance">
          <BackArrow />
        </button>
        <h1 className="scan-title">Scan QR — verify badges</h1>
      </div>

      <p className="qr-help">
        <span className="maint-ok">{checkedCount} checked</span> ·{" "}
        <span className="maint-bad">{uncheckedCount} unchecked</span> · {attendees.length} total
      </p>

      {pending ? (
        <div className="maint-confirm-card">
          <div className="delegate-block">
            <p className="delegate-serial">{pending.serial_code}</p>
            <p className="delegate-tag">{pending.designation || "Delegate"}</p>
            <p className="delegate-name">{pending.name}</p>
            <p className="delegate-role">{pending.organization || "—"}</p>
          </div>
          <div className="emergency-contact-rows">
            <div className="emergency-contact-row">
              <span className="emergency-contact-label">Phone</span>
              <span className="emergency-contact-value">{pending.phone || "Not on file"}</span>
            </div>
            <div className="emergency-contact-row">
              <span className="emergency-contact-label">Email</span>
              <span className="emergency-contact-value">{pending.email || "Not on file"}</span>
            </div>
            <div className="emergency-contact-row">
              <span className="emergency-contact-label">Days registered</span>
              <span className="emergency-contact-value">
                {Array.isArray(pending.registered_days) && pending.registered_days.length > 0
                  ? [...pending.registered_days].sort().join(", ")
                  : "—"}
              </span>
            </div>
            <div className="emergency-contact-row">
              <span className="emergency-contact-label">Currently</span>
              <span className="emergency-contact-value">
                {pending.id_verified ? "✓ Already verified" : "Not yet verified"}
              </span>
            </div>
          </div>

          {saveError && (
            <div className="id-error-box" style={{ marginTop: 12 }}>
              <p className="id-error-text">{saveError}</p>
            </div>
          )}

          <p className="qr-help" style={{ marginTop: 12 }}>
            Does everything above look right for this badge?
          </p>
          <div className="maint-confirm-actions">
            <button type="button" className="onboard-entry-btn admin-entry-btn" onClick={handleSkip} disabled={saving}>
              Skip
            </button>
            <button
              type="button"
              className="primary-btn onboard-register-btn"
              onClick={handleConfirm}
              disabled={saving || pending.id_verified}
            >
              {saving ? "Saving…" : pending.id_verified ? "Already verified" : "Confirm verified"}
            </button>
          </div>
        </div>
      ) : (
        <>
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
              <p className="qr-help">Scan a badge to review it</p>
            )}
          </div>

          {notFoundSerial && (
            <div className="maint-result maint-result-bad">
              <p className="maint-result-serial">{notFoundSerial}</p>
              <p className="maint-result-status">✗ Not found in the system</p>
            </div>
          )}
        </>
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
  // Two ways to find someone before editing: type a search, or scan their
  // badge directly (handy when you're going down a physical stack of
  // badges checking each one is linked correctly).
  const [findTab, setFindTab] = useState<"search" | "scan">("search");
  const [search, setSearch] = useState("");
  const [scanNotFound, setScanNotFound] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const decodedOnceRef = useRef(false);

  const [selected, setSelected] = useState<Attendee | null>(null);
  const [form, setForm] = useState<AttendeeEditableFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [verifying, setVerifying] = useState(false);

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
    setScanNotFound(null);
    setForm({
      name: a.name,
      organization: a.organization,
      designation: a.designation,
      phone: a.phone,
      email: a.email,
      registered_days: Array.isArray(a.registered_days) ? [...a.registered_days] : [],
    });
  }

  function handleScanDecoded(serial: string) {
    if (decodedOnceRef.current) return;
    decodedOnceRef.current = true;
    const trimmed = serial.trim();
    const match = attendees.find((a) => a.serial_code.toLowerCase() === trimmed.toLowerCase());
    if (match) {
      stopScanner();
      pick(match);
    } else {
      setScanNotFound(`"${trimmed}" isn't in the system.`);
      decodedOnceRef.current = false; // let them keep scanning
    }
  }

  async function startScanner() {
    await runExclusive(async () => {
      setCameraError(null);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const el = document.getElementById(EDIT_SCANNER_ELEMENT_ID);
        if (!el) return;
        el.innerHTML = "";

        const scanner = new Html5Qrcode(EDIT_SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => handleScanDecoded(decodedText),
          () => {}
        );

        const video = el.querySelector("video") as HTMLVideoElement | null;
        if (video && video.paused) video.play().catch(() => {});

        setScannerActive(true);
      } catch {
        setScannerActive(false);
        setCameraError("Couldn't access the camera. Use Search instead.");
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
      const el = document.getElementById(EDIT_SCANNER_ELEMENT_ID);
      if (el) el.innerHTML = "";
    });
  }

  useEffect(() => {
    if (findTab === "scan" && !selected) {
      decodedOnceRef.current = false;
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findTab, selected]);

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

  async function handleToggleVerified() {
    if (!selected || verifying) return;
    const next = !selected.id_verified;
    setVerifying(true);
    try {
      await setAttendeeIdVerified(selected.id, next);
      const updated = { ...selected, id_verified: next };
      setSelected(updated);
      onAttendeeUpdated(updated);
    } catch {
      setSaveError("Couldn't update verified status — try again.");
    } finally {
      setVerifying(false);
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

        <div className={`maint-verify-row ${selected.id_verified ? "maint-verify-row-on" : ""}`}>
          <span className="maint-verify-label">
            {selected.id_verified ? "✓ ID verified — badge scans and matches this record" : "ID not yet verified"}
          </span>
          <button type="button" className="maint-verify-btn" onClick={handleToggleVerified} disabled={verifying}>
            {verifying ? "Saving…" : selected.id_verified ? "Mark unverified" : "Mark verified"}
          </button>
        </div>

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

      <div className="tab-row-wrap">
        <div className="tabs">
          <button className={`tab ${findTab === "search" ? "tab-active" : ""}`} onClick={() => setFindTab("search")} type="button">
            Search
          </button>
          <button className={`tab ${findTab === "scan" ? "tab-active" : ""}`} onClick={() => setFindTab("scan")} type="button">
            Scan QR
          </button>
        </div>
        <div className="tab-row-baseline" />
      </div>

      {findTab === "search" ? (
        <>
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
                <span className="id-match-serial">
                  {a.serial_code}
                  {a.id_verified && <span className="maint-verified-dot" title="ID verified" />}
                </span>
                <span className="id-match-name">{a.name}</span>
              </button>
            ))}
            {q && results.length === 0 && <p className="qr-help">No attendees match "{search.trim()}".</p>}
          </div>
        </>
      ) : (
        <div className="qr-pane">
          <div className="viewfinder">
            <div id={EDIT_SCANNER_ELEMENT_ID} className="viewfinder-camera" />
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />
            {scannerActive && <span className="scan-line" />}
          </div>
          {cameraError ? (
            <p className="qr-help qr-help-warn">{cameraError}</p>
          ) : scanNotFound ? (
            <p className="qr-help qr-help-warn">{scanNotFound}</p>
          ) : (
            <p className="qr-help">Scan the badge you want to open</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MaintenanceFlow({
  attendees,
  onBack,
  onAttendeeUpdated,
  liveDay,
  savingLiveDay,
  onChangeLiveDay,
  settings,
  togglingKey,
  walkinCounts,
  onToggleCategory,
  onToggleMasterForDay,
  onAdjustWalkin,
}: {
  attendees: Attendee[];
  onBack: () => void;
  onAttendeeUpdated: (a: Attendee) => void;
  liveDay: Day;
  savingLiveDay: boolean;
  onChangeLiveDay: (next: Day) => void;
  settings: CategorySettings | null;
  togglingKey: ItineraryKey | null;
  walkinCounts: Record<string, number>;
  onToggleCategory: (key: ItineraryKey) => void;
  onToggleMasterForDay: (day: Day) => void;
  onAdjustWalkin: (item: WalkinItem, delta: number) => void;
}) {
  const [tool, setTool] = useState<Tool>(null);

  if (tool === "scanqr")
    return <ScanQrTool attendees={attendees} onBack={() => setTool(null)} onAttendeeUpdated={onAttendeeUpdated} />;
  if (tool === "edit") return <EditParticipantTool attendees={attendees} onBack={() => setTool(null)} onAttendeeUpdated={onAttendeeUpdated} />;
  if (tool === "liveday")
    return (
      <LiveDayTool
        attendees={attendees}
        onBack={() => setTool(null)}
        liveDay={liveDay}
        savingLiveDay={savingLiveDay}
        onChangeLiveDay={onChangeLiveDay}
        settings={settings}
        togglingKey={togglingKey}
        walkinCounts={walkinCounts}
        onToggleCategory={onToggleCategory}
        onToggleMasterForDay={onToggleMasterForDay}
        onAdjustWalkin={onAdjustWalkin}
      />
    );

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back to dashboard">
          <BackArrow />
        </button>
        <h1 className="scan-title">Maintenance</h1>
      </div>

      <div className="maint-tool-list">
        <button className="onboard-entry-btn admin-entry-btn" type="button" onClick={() => setTool("liveday")}>
          Live day &amp; categories
        </button>
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
