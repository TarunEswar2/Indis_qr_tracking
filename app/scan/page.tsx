"use client";

import { useEffect, useRef, useState } from "react";
import {
  Attendee,
  CategorySettings,
  ItineraryKey,
  getAttendeeBySerial,
  getCategorySettings,
  markItineraryItem,
} from "@/lib/supabaseClient";

// ---------------------------------------------------------------------------
// This screen intentionally mirrors prototype_ui/indis-scan-flow.jsx's look
// and flow exactly (same components, same CSS), but wired to the real
// Supabase attendees table instead of mock state. A volunteer first picks
// a day + category (Kit / Lunch / High Tea / Gala), THEN scans or looks up
// an attendee — the scan/lookup marks just that one category.
//
// Real event structure (3 days):
//   Day 1: Conference Kit, Lunch, High Tea
//   Day 2: Lunch, High Tea
//   Day 3: Lunch, High Tea, Gala Dinner
// keyFor() below maps that day+category shape onto the real Supabase
// columns (kit_received, lunch_day1..3, high_tea_day1..3, gala_dinner).
// ---------------------------------------------------------------------------

type Category = "kit" | "lunch" | "highTea" | "gala";
type Day = 1 | 2 | 3;

const CATEGORY_LABEL: Record<Category, string> = {
  kit: "Conference Kit",
  lunch: "Lunch",
  highTea: "High Tea",
  gala: "Gala Dinner",
};

const DAY_CATEGORIES: Record<Day, Category[]> = {
  1: ["kit", "lunch", "highTea"],
  2: ["lunch", "highTea"],
  3: ["lunch", "highTea", "gala"],
};

// day + category -> real Supabase column, or null if that combo doesn't apply.
function keyFor(day: Day, category: Category): ItineraryKey | null {
  if (category === "kit") return day === 1 ? "kit_received" : null;
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
  if (category === "gala") return day === 3 ? "gala_dinner" : null;
  return null;
}

const TODAY: Day = 1; // change to 2 or 3 as the event moves along

const SCANNER_ELEMENT_ID = "reader";

// html5-qrcode's camera start/stop is async, and React's effect-cleanup
// function can't be awaited — so when ScanScreen unmounts (back button,
// re-picking a category) and a new instance mounts right after, the old
// instance's stop() and the new instance's start() can race, leaving the
// camera stream in a broken/black state. This module-level lock forces
// every start/stop across every instance to run one at a time, in order.
let cameraLock: Promise<void> = Promise.resolve();

function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = cameraLock.then(task, task);
  cameraLock = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

// ---------- icons (ported as-is from the prototype) ----------

function BackArrow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M19 12H5M5 12L11 6M5 12L11 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4 12.5L9.5 18L20 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M5 12H19M19 12L13 6M19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockedTag() {
  return <span className="pill pill-confirmed">Done</span>;
}

function OffTag() {
  return <span className="pill pill-off">Closed</span>;
}

function DelegatePreview({ attendee }: { attendee: Attendee }) {
  return (
    <div className="delegate-block">
      <p className="delegate-serial">{attendee.serial_code}</p>
      <p className="delegate-tag">Delegate</p>
      <p className="delegate-name">{attendee.name}</p>
      <p className="delegate-role">{attendee.organization ?? "—"}</p>
    </div>
  );
}

// ---------- HOME ----------

function HomeScreen({
  day,
  setDay,
  today,
  onPick,
  categorySettings,
}: {
  day: Day;
  setDay: (d: Day) => void;
  today: Day;
  onPick: (c: Category) => void;
  categorySettings: CategorySettings | null;
}) {
  const cats = DAY_CATEGORIES[day];
  // Days are no longer locked to "today" — volunteers can scan any day's
  // categories at any time (e.g. catching up a late arrival on Day 1
  // while the event is on Day 2). Only an admin-disabled category locks.

  return (
    <div className="screen home">
      <div className="topline">
        <div className="mark">INDIS 2026</div>
        <div className="mark-sub">Volunteer scan</div>
      </div>

      <div className="day-switch">
        {([1, 2, 3] as Day[]).map((d) => (
          <button
            key={d}
            className={`day-tab ${d === day ? "day-tab-active" : ""}`}
            onClick={() => setDay(d)}
          >
            Day {d}
          </button>
        ))}
      </div>

      <h1 className="day-heading">Day {String(day).padStart(2, "0")}</h1>
      <p className="day-sub">Select what you're scanning for</p>

      <div className="cat-list">
        {cats.map((c) => {
          const itemKey = keyFor(day, c);
          // Admin turned this off in the dashboard. A category with no
          // itemKey (doesn't apply to this day) is never selectable
          // anyway via DAY_CATEGORIES, so this only affects real ones.
          const closedByAdmin = Boolean(itemKey && categorySettings && !categorySettings[itemKey]);
          const selectable = !closedByAdmin;
          return (
            <button
              key={c}
              className={`cat-card ${!selectable ? "cat-card-locked" : ""}`}
              onClick={() => selectable && onPick(c)}
              disabled={!selectable}
            >
              <span className="cat-name">{CATEGORY_LABEL[c]}</span>
              {closedByAdmin ? <OffTag /> : <ArrowRight className="cat-arrow" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- SCAN ----------

function ScanScreen({
  day,
  category,
  tab,
  setTab,
  onBack,
  onConfirmed,
  idValue,
  setIdValue,
}: {
  day: Day;
  category: Category;
  tab: "qr" | "id";
  setTab: (t: "qr" | "id") => void;
  onBack: () => void;
  onConfirmed: (attendee: Attendee) => void;
  idValue: string;
  setIdValue: (v: string) => void;
}) {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkedAttendee, setCheckedAttendee] = useState<Attendee | null>(null);
  const scannerRef = useRef<any>(null);
  // html5-qrcode fires its decode callback for every matching video frame,
  // and scanner.stop() is async — so several frames can decode the same
  // badge before the camera actually shuts off, each independently calling
  // handleDecoded (and, if already marked, each popping its own confirm()
  // dialog). This flag makes sure only the first decode of a given "scan
  // session" is acted on.
  const decodedOnceRef = useRef(false);

  const itemKey = keyFor(day, category);

  async function confirmForAttendee(attendee: Attendee) {
    if (!itemKey) {
      setError(`${CATEGORY_LABEL[category]} isn't tracked on Day ${day}.`);
      return;
    }
    const alreadyDone = Boolean(attendee[itemKey]);
    if (alreadyDone && !confirm(`${attendee.name} is already marked for ${CATEGORY_LABEL[category]}. Mark again anyway?`)) {
      // They said no — this was called from the QR path with the camera
      // already stopped, so restart it and let them scan someone else.
      decodedOnceRef.current = false;
      startScanner();
      return;
    }
    await markItineraryItem(attendee.id, itemKey);
    const refreshed = await getAttendeeBySerial(attendee.serial_code);
    onConfirmed(refreshed);
  }

  async function handleDecoded(serialCode: string) {
    if (decodedOnceRef.current) return; // ignore extra frames of the same badge
    decodedOnceRef.current = true;

    const trimmed = serialCode.trim();
    if (!trimmed) {
      decodedOnceRef.current = false;
      return;
    }
    setError(null);
    setStatus("Looking up…");
    try {
      const attendee = await getAttendeeBySerial(trimmed);
      await stopScanner();
      await confirmForAttendee(attendee);
    } catch {
      setError("No attendee found for that code.");
      decodedOnceRef.current = false; // let them try again (camera is still running)
    } finally {
      setStatus(null);
    }
  }

  async function runCheck() {
    if (checking || !idValue.trim()) return;
    setChecking(true);
    setError(null);
    try {
      const attendee = await getAttendeeBySerial(idValue.trim());
      setCheckedAttendee(attendee);
    } catch {
      setError("No attendee found for that code.");
      setCheckedAttendee(null);
    } finally {
      setChecking(false);
    }
  }

  function handleIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIdValue(e.target.value);
    if (checkedAttendee) setCheckedAttendee(null);
  }

  async function startScanner() {
    await runExclusive(async () => {
      setCameraError(null);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const el = document.getElementById(SCANNER_ELEMENT_ID);
        if (!el) return;

        // html5-qrcode's own clear() doesn't always fully remove the old
        // <video>/<canvas> it created before a new instance mounts a new
        // one — on some phones that leaves a stale, black video element
        // stacked on top of (or instead of) the live one. Force the
        // container empty ourselves before creating a fresh scanner, so
        // there's never more than one video element in there.
        el.innerHTML = "";

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            handleDecoded(decodedText);
          },
          () => {
            // per-frame "no QR found" — expected constantly, not an error
          }
        );

        // Some mobile browsers report start() as resolved before the
        // video element actually has a frame (readyState < 2), which is
        // what a "camera looks black but the code thinks it's running"
        // report usually is. Give it a beat and nudge play() if needed.
        const video = el.querySelector("video") as HTMLVideoElement | null;
        if (video) {
          if (video.paused) {
            video.play().catch(() => {});
          }
          if (video.readyState < 2) {
            await new Promise((r) => setTimeout(r, 300));
            if (video.paused) video.play().catch(() => {});
          }
        }

        setScannerActive(true);
      } catch {
        setScannerActive(false);
        setCameraError("Couldn't access the camera. Use manual entry below instead.");
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
      // Belt-and-suspenders: make sure nothing (a stale <video>, an
      // orphaned overlay) is left behind in the container for the next
      // startScanner() to inherit.
      const el = document.getElementById(SCANNER_ELEMENT_ID);
      if (el) el.innerHTML = "";
    });
  }

  useEffect(() => {
    startScanner();

    // Mobile Chrome/Safari can freeze the camera's <video> element to a
    // black frame when the tab is backgrounded (app-switch, phone lock)
    // and doesn't always resume it cleanly on its own when you come back.
    // Restarting the scanner on visibility-regain fixes that black-screen
    // case without waiting for the volunteer to notice and hit back/retry.
    function handleVisibility() {
      if (document.visibilityState === "visible" && scannerRef.current) {
        stopScanner().then(() => startScanner());
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <BackArrow />
        </button>
        <h1 className="scan-title">
          Day {String(day).padStart(2, "0")}, {CATEGORY_LABEL[category]}
        </h1>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "qr" ? "tab-active" : ""}`} onClick={() => setTab("qr")}>
          QR
        </button>
        <button className={`tab ${tab === "id" ? "tab-active" : ""}`} onClick={() => setTab("id")}>
          ID
        </button>
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
          ) : (
            <p className="qr-help">Align the QR on the delegate's badge within the frame</p>
          )}
          {status && <p className="scan-status">{status}</p>}
          {error && <p className="scan-error">{error}</p>}
        </div>
      ) : (
        <div className="id-pane">
          <label className="id-label" htmlFor="delegate-id">
            Delegate ID
          </label>
          <div className="id-row">
            <div className="id-input-wrap">
              <input
                id="delegate-id"
                className="id-input"
                placeholder="Enter unique ID"
                value={idValue}
                onChange={handleIdChange}
              />
              {checkedAttendee && <CheckIcon className="id-check-icon" width="16" height="16" />}
            </div>
            <button
              className="check-btn"
              onClick={runCheck}
              disabled={!idValue.trim() || checking || Boolean(checkedAttendee)}
            >
              {checking ? "Checking…" : "Check"}
            </button>
          </div>

          {error && <p className="scan-error">{error}</p>}

          {checkedAttendee && (
            <>
              <DelegatePreview attendee={checkedAttendee} />
              <button
                className="primary-btn confirm-entry-btn"
                onClick={() => confirmForAttendee(checkedAttendee)}
              >
                Confirm {CATEGORY_LABEL[category]} Entry
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- CONFIRMED ----------

function ConfirmedScreen({
  day,
  category,
  attendee,
  onBackToCategories,
  onBackToScanner,
}: {
  day: Day;
  category: Category;
  attendee: Attendee;
  onBackToCategories: () => void;
  onBackToScanner: () => void;
}) {
  const rows: Category[] = ["kit", "lunch", "highTea", "gala"];
  const days: Day[] = [1, 2, 3];

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBackToCategories} aria-label="Back to categories">
          <BackArrow />
        </button>
      </div>

      <div className="confirm-block">
        <div className="check-circle">
          <CheckIcon />
        </div>
        <p className="confirm-title">Entry confirmed</p>
      </div>

      <DelegatePreview attendee={attendee} />

      <div className="table">
        <div className="table-row table-head">
          {days.map((d) => (
            <div key={d} className={`table-cell head-cell ${d === day ? "col-active" : ""}`}>
              Day {d}
            </div>
          ))}
        </div>
        {rows.map((c) => (
          <div className="table-row" key={c}>
            {days.map((d) => {
              const key = keyFor(d, c);
              const status = key === null ? "na" : attendee[key] ? "confirmed" : "pending";
              const isCurrent = d === day && c === category;
              return (
                <div
                  key={d}
                  className={`table-cell ${d === day ? "col-active" : ""} ${
                    isCurrent ? "cell-current" : ""
                  }`}
                >
                  <span className="cell-label">{CATEGORY_LABEL[c]}</span>
                  <span className={`cell-value cell-${status}`}>
                    {status === "na" ? "N/A" : status === "confirmed" ? "Confirmed" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button className="primary-btn back-scan-btn" onClick={onBackToScanner}>
        Scan next
      </button>
    </div>
  );
}

// ---------- ROOT ----------

export default function ScanPage() {
  const [day, setDay] = useState<Day>(TODAY);
  const [screen, setScreen] = useState<"home" | "scan" | "confirmed">("home");
  const [category, setCategory] = useState<Category | null>(null);
  const [tab, setTab] = useState<"qr" | "id">("qr");
  const [idValue, setIdValue] = useState("");
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [visit, setVisit] = useState(0);
  const [categorySettings, setCategorySettings] = useState<CategorySettings | null>(null);

  useEffect(() => {
    getCategorySettings()
      .then(setCategorySettings)
      .catch(() => {
        // category_settings table missing/unreachable — fall back to
        // "everything open" rather than blocking the whole scanner.
        setCategorySettings(null);
      });
  }, []);

  function pickCategory(c: Category) {
    const itemKey = keyFor(day, c);
    if (itemKey && categorySettings && !categorySettings[itemKey]) {
      // Shouldn't normally happen (the card is disabled), but guards
      // against a stale render if the admin flips a toggle mid-visit.
      return;
    }
    setCategory(c);
    setTab("qr");
    setIdValue("");
    setScreen("scan");
    setVisit((v) => v + 1);
  }

  function handleConfirmed(a: Attendee) {
    setAttendee(a);
    setScreen("confirmed");
  }

  function backToHome() {
    setScreen("home");
    setCategory(null);
    setAttendee(null);
  }

  function backToScanner() {
    setTab("qr");
    setIdValue("");
    setAttendee(null);
    setScreen("scan");
    setVisit((v) => v + 1);
  }

  return (
    <div className="wrap">
      <style>{`
        :root {
          --black: #0A0A0C;
          --white: #FFFFFF;
          --blue: #2F5CFF;
          --blue-dim: #E7ECFF;
          --grey-50: #F1F1F3;
          --grey-100: #F5F5F7;
          --grey-300: #DBDBDF;
          --grey-500: #8B8B93;
          --grey-700: #4A4A52;
        }

        .wrap {
          min-height: 100vh;
          width: 100%;
          background: var(--grey-50);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          font-family: Helvetica, Arial, sans-serif;
          box-sizing: border-box;
        }

        .wrap *, .wrap *::before, .wrap *::after {
          box-sizing: border-box;
        }

        .phone {
          width: 390px;
          max-width: 100%;
          min-height: 780px;
          background: var(--white);
          border-radius: 28px;
          border: 1px solid var(--grey-300);
          box-shadow: 0 20px 50px rgba(10,10,12,0.10);
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .screen {
          padding: 28px 24px 32px;
          flex: 1;
          display: flex;
          flex-direction: column;
          animation: fadein 0.25s ease;
        }

        @keyframes fadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* HOME */
        .topline { margin-bottom: 28px; }
        .mark { font-size: 13px; font-weight: 600; color: var(--blue); letter-spacing: 0.01em; }
        .mark-sub { font-size: 12px; color: var(--grey-500); margin-top: 2px; }

        .day-switch {
          display: flex;
          background: var(--grey-100);
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 32px;
        }
        .day-tab {
          flex: 1;
          border: none;
          background: transparent;
          padding: 9px 0;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          color: var(--grey-700);
          border-radius: 9px;
          cursor: pointer;
        }
        .day-tab-active { background: var(--black); color: var(--white); }

        .day-heading { font-size: 40px; font-weight: 700; margin: 0; color: var(--black); line-height: 1.05; }
        .day-sub { font-size: 14px; color: var(--grey-500); margin: 8px 0 28px; }

        .cat-list { display: flex; flex-direction: column; gap: 12px; }
        .cat-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--grey-100);
          border: 1px solid var(--grey-300);
          border-radius: 14px;
          padding: 20px 20px;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
        }
        .cat-card:hover { border-color: var(--black); }
        .cat-card-locked { cursor: default; opacity: 0.6; }
        .cat-card-locked:hover { border-color: var(--grey-300); }
        .cat-name { font-size: 17px; font-weight: 600; color: var(--black); }
        .cat-arrow { color: var(--grey-500); }
        .pill { font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 100px; }
        .pill-confirmed { background: var(--blue-dim); color: var(--blue); }
        .pill-off { background: var(--grey-300); color: var(--grey-700); }

        /* SCAN SCREEN */
        .scan-header { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .icon-btn { border: none; background: transparent; padding: 4px; margin: -4px; color: var(--black); cursor: pointer; display: flex; }
        .scan-title { font-size: 21px; font-weight: 600; color: var(--black); margin: 0; }

        .tabs { display: flex; background: var(--grey-100); border-radius: 12px; padding: 4px; margin-bottom: 28px; }
        .tab { flex: 1; border: none; background: transparent; padding: 10px 0; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--grey-700); border-radius: 9px; cursor: pointer; }
        .tab-active { background: var(--white); color: var(--black); box-shadow: 0 1px 4px rgba(10,10,12,0.12); }

        .qr-pane { display: flex; flex-direction: column; align-items: center; margin-top: 8px; }
        .viewfinder {
          width: 100%;
          aspect-ratio: 1 / 1;
          max-width: 280px;
          background: var(--black);
          border-radius: 18px;
          position: relative;
          overflow: hidden;
        }
        .viewfinder-camera { position: absolute; inset: 0; width: 100%; height: 100%; }
        .viewfinder-camera video, .viewfinder-camera canvas { width: 100% !important; height: 100% !important; object-fit: cover; }
        .corner { position: absolute; width: 26px; height: 26px; border: 3px solid var(--blue); z-index: 2; pointer-events: none; }
        .corner-tl { top: 16px; left: 16px; border-right: none; border-bottom: none; border-top-left-radius: 6px; }
        .corner-tr { top: 16px; right: 16px; border-left: none; border-bottom: none; border-top-right-radius: 6px; }
        .corner-bl { bottom: 16px; left: 16px; border-right: none; border-top: none; border-bottom-left-radius: 6px; }
        .corner-br { bottom: 16px; right: 16px; border-left: none; border-top: none; border-bottom-right-radius: 6px; }
        .scan-line {
          position: absolute;
          left: 16px; right: 16px;
          height: 2px;
          background: var(--blue);
          box-shadow: 0 0 8px var(--blue);
          animation: sweep 0.9s ease-in-out infinite;
          z-index: 2;
        }
        @keyframes sweep {
          0% { top: 16px; }
          50% { top: calc(100% - 18px); }
          100% { top: 16px; }
        }
        .qr-help { font-size: 13px; color: var(--grey-500); text-align: center; margin: 18px 0 6px; max-width: 260px; }
        .qr-help-warn { color: #B45309; }
        .scan-status { font-size: 13px; color: var(--grey-700); margin: 6px 0 0; }
        .scan-error { font-size: 13px; color: #D64545; margin: 10px 0 0; text-align: center; }

        .id-pane { display: flex; flex-direction: column; flex: 1; margin-top: 8px; }
        .id-label { font-size: 13px; color: var(--grey-700); margin-bottom: 8px; font-weight: 500; }
        .id-row { display: flex; gap: 10px; margin-bottom: 12px; }
        .id-input-wrap { flex: 1; position: relative; display: flex; align-items: center; }
        .id-input { width: 100%; font-family: inherit; font-size: 15px; padding: 14px 40px 14px 16px; border: 1px solid var(--grey-300); border-radius: 12px; outline: none; }
        .id-input:focus { border-color: var(--blue); }
        .id-check-icon { position: absolute; right: 14px; color: var(--blue); pointer-events: none; }
        .check-btn { background: var(--black); color: var(--white); border: none; font-family: inherit; font-size: 14px; font-weight: 600; padding: 0 20px; border-radius: 12px; cursor: pointer; white-space: nowrap; }
        .check-btn:disabled { background: var(--grey-300); color: var(--grey-500); cursor: default; }

        .confirm-entry-btn { margin-top: auto; }

        .primary-btn { background: var(--blue); color: var(--white); border: none; font-family: inherit; font-size: 15px; font-weight: 600; padding: 15px 0; border-radius: 12px; cursor: pointer; }
        .primary-btn:disabled { background: var(--grey-300); color: var(--grey-500); cursor: default; }

        /* CONFIRMED */
        .confirm-block { display: flex; flex-direction: column; align-items: center; margin: 12px 0 28px; }
        .check-circle { color: var(--blue); margin-bottom: 14px; }
        .confirm-title { font-size: 22px; font-weight: 600; color: var(--black); margin: 0; }

        .delegate-block { margin-bottom: 26px; }
        .delegate-serial { font-family: inherit; font-size: 12px; color: var(--grey-500); margin: 0 0 10px; letter-spacing: 0.02em; }
        .delegate-tag { font-size: 12px; color: var(--grey-500); margin: 0 0 4px; }
        .delegate-name { font-size: 24px; font-weight: 700; color: var(--black); margin: 0 0 6px; }
        .delegate-role { font-size: 14px; color: var(--grey-700); margin: 0; line-height: 1.5; }

        .table { border: 1px solid var(--grey-300); border-radius: 14px; overflow: hidden; margin-bottom: 24px; }
        .table-row { display: grid; grid-template-columns: repeat(3, 1fr); }
        .table-row + .table-row { border-top: 1px solid var(--grey-300); }
        .table-cell { padding: 12px 10px; border-right: 1px solid var(--grey-300); display: flex; flex-direction: column; gap: 3px; }
        .table-cell:last-child { border-right: none; }
        .head-cell { font-size: 12px; font-weight: 600; color: var(--grey-700); background: var(--grey-100); }
        .col-active { background: var(--blue-dim); }
        .head-cell.col-active { background: var(--black); color: var(--white); }
        .cell-label { font-size: 11px; color: var(--grey-500); }
        .cell-value { font-size: 13px; font-weight: 600; }
        .cell-confirmed { color: var(--blue); }
        .cell-pending { color: var(--grey-700); }
        .cell-na { color: var(--grey-300); }
        .cell-current .cell-value { text-decoration: underline; text-decoration-color: var(--blue); text-underline-offset: 3px; }

        .back-scan-btn { margin-top: auto; }
      `}</style>

      <div className="phone">
        {screen === "home" && (
          <HomeScreen
            day={day}
            setDay={setDay}
            today={TODAY}
            onPick={pickCategory}
            categorySettings={categorySettings}
          />
        )}
        {screen === "scan" && category && (
          <ScanScreen
            key={`scan-${visit}`}
            day={day}
            category={category}
            tab={tab}
            setTab={setTab}
            onBack={backToHome}
            onConfirmed={handleConfirmed}
            idValue={idValue}
            setIdValue={setIdValue}
          />
        )}
        {screen === "confirmed" && category && attendee && (
          <ConfirmedScreen
            day={day}
            category={category}
            attendee={attendee}
            onBackToCategories={backToHome}
            onBackToScanner={backToScanner}
          />
        )}
      </div>
    </div>
  );
}
