"use client";

import { useEffect, useRef, useState } from "react";
import {
  Attendee,
  CategorySettings,
  ItineraryKey,
  getAttendeeBySerial,
  getCategorySettings,
  getLiveDay,
  markItineraryItem,
} from "@/lib/supabaseClient";
import TopNav from "@/components/TopNav";

// ---------------------------------------------------------------------------
// This screen mirrors prototype_ui/indis-scan-flow.jsx's look AND flow
// exactly (same components, same CSS, same day-lock/pill/icon behavior),
// wired to the real Supabase attendees table instead of mock state.
//
// Real event structure (3 days):
//   Day 1: Conference Kit, Lunch, High Tea
//   Day 2: Lunch, High Tea
//   Day 3: Lunch, High Tea, Gala Dinner
// keyFor() below maps that day+category shape onto the real Supabase
// columns (kit_received, lunch_day1..3, high_tea_day1..3, gala_dinner).
//
// "Today" (which day is open/closed/locked on the home screen) is no
// longer hardcoded — it's the admin-set "live day" (see AdminScreen /
// getLiveDay in lib/supabaseClient.ts), so someone doesn't have to
// redeploy the app each morning of the conference to advance the day.
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

function XMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function KitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function LunchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 3v7a2.5 2.5 0 0 0 5 0V3M8.5 3v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 3c-1.7 0-3 2-3 4.5S15.3 12 17 12M17 3v18M17 3c1.7 0 3 2 3 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 10v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TeaIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5c0 1-1 1-1 2s1 1 1 2M12 3.5c0 1-1 1-1 2s1 1 1 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function GalaIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 3c0 4 2.5 6 6 6s6-2 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 9v8M9 21h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 3h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const CATEGORY_ICON: Record<Category, (props: React.SVGProps<SVGSVGElement>) => JSX.Element> = {
  kit: KitIcon,
  lunch: LunchIcon,
  highTea: TeaIcon,
  gala: GalaIcon,
};

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
  liveDay,
  onPick,
  categorySettings,
}: {
  liveDay: Day;
  onPick: (c: Category) => void;
  categorySettings: CategorySettings | null;
}) {
  // No day picker here on purpose — showing every day's categories (with
  // past/future/locked states) invited volunteers to scan the wrong day.
  // The admin sets one "live day" and this screen only ever shows that
  // day's categories, gated solely by the admin on/off toggle.
  const cats = DAY_CATEGORIES[liveDay];

  return (
    <div className="screen home">
      <div className="home-live-day-row">
        <span className="pill home-live-day-pill">Day {liveDay}</span>
      </div>
      <div className="cat-list">
        {cats.map((c) => {
          const itemKey = keyFor(liveDay, c);
          const enabled = !itemKey || !categorySettings || categorySettings[itemKey] !== false;
          const Icon = CATEGORY_ICON[c];
          return (
            <button
              key={c}
              className={`cat-card ${!enabled ? "cat-card-locked" : ""}`}
              onClick={() => enabled && onPick(c)}
              disabled={!enabled}
            >
              <span className="cat-icon">
                <Icon />
              </span>
              <span className="cat-name">{CATEGORY_LABEL[c]}</span>
              {!enabled ? <span className="pill pill-closed">Paused</span> : <ArrowRight className="cat-arrow" />}
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
  const [notFound, setNotFound] = useState<string | null>(null);
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
      setNotFound(`${CATEGORY_LABEL[category]} isn't tracked on Day ${day}.`);
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
    setNotFound(null);
    setStatus("Looking up…");
    try {
      const attendee = await getAttendeeBySerial(trimmed);
      await stopScanner();
      await confirmForAttendee(attendee);
    } catch {
      setNotFound("ID not found, Check again or try scanning QR again.");
      decodedOnceRef.current = false; // let them try again (camera is still running)
    } finally {
      setStatus(null);
    }
  }

  async function runCheck() {
    if (checking || !idValue.trim()) return;
    setChecking(true);
    setNotFound(null);
    try {
      const attendee = await getAttendeeBySerial(idValue.trim());
      setCheckedAttendee(attendee);
    } catch {
      setNotFound("ID not found, Check again or try scanning QR again.");
      setCheckedAttendee(null);
    } finally {
      setChecking(false);
    }
  }

  function handleIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIdValue(e.target.value);
    if (notFound) setNotFound(null);
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
        setCameraError("Couldn't access the camera. Use the ID tab below instead.");
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

      <div className="tab-row-wrap">
        <div className="tabs">
          <button className={`tab ${tab === "qr" ? "tab-active" : ""}`} onClick={() => setTab("qr")}>
            QR
          </button>
          <button className={`tab ${tab === "id" ? "tab-active" : ""}`} onClick={() => setTab("id")}>
            ID
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
          ) : (
            <p className="qr-help">Align the QR on the delegate's badge within the frame</p>
          )}
          {status && <p className="qr-help">{status}</p>}
          {notFound && (
            <div className="id-error-box">
              <XMark width="16" height="16" className="id-error-icon" />
              <p className="id-error-text">{notFound}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="id-pane">
          <label className="id-label" htmlFor="delegate-id">
            Delegate ID
          </label>
          <div className="id-action-group">
            <div className="id-row">
              <div className="id-input-wrap">
                <input
                  id="delegate-id"
                  className="id-input"
                  placeholder="Enter unique ID"
                  value={idValue}
                  onChange={handleIdChange}
                />
              </div>
              <button
                className="check-btn"
                onClick={runCheck}
                disabled={!idValue.trim() || checking || Boolean(checkedAttendee)}
              >
                {checking ? "Checking…" : "Check"}
              </button>
            </div>

            {notFound && (
              <div className="id-error-box">
                <XMark width="16" height="16" className="id-error-icon" />
                <p className="id-error-text">{notFound}</p>
              </div>
            )}
          </div>

          {checkedAttendee && (
            <>
              <div className="delegate-card">
                <DelegatePreview attendee={checkedAttendee} />
              </div>
              <button className="primary-btn confirm-back-btn" onClick={() => confirmForAttendee(checkedAttendee)}>
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
  confirmedAt,
  onBackToCategories,
  onBackToScanner,
}: {
  day: Day;
  category: Category;
  attendee: Attendee;
  confirmedAt: Date | null;
  onBackToCategories: () => void;
  onBackToScanner: () => void;
}) {
  const timeLabel = confirmedAt ? confirmedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBackToCategories} aria-label="Back to categories">
          <BackArrow />
        </button>
      </div>

      <div className="confirm-block">
        <div className="check-circle">
          <CheckIcon width="30" height="30" />
        </div>
        <p className="confirm-context">
          Day {day}, {CATEGORY_LABEL[category]}
        </p>
        <p className="confirm-title">Entry confirmed</p>
        {timeLabel && <p className="confirm-time">at {timeLabel}</p>}
      </div>

      <div className="delegate-card">
        <DelegatePreview attendee={attendee} />
      </div>

      <button className="primary-btn confirm-back-btn" onClick={onBackToScanner}>
        Scan next
      </button>
    </div>
  );
}

// ---------- ROOT ----------

export default function ScanPage() {
  const [liveDay, setLiveDay] = useState<Day>(1);
  const [screen, setScreen] = useState<"home" | "scan" | "confirmed">("home");
  const [category, setCategory] = useState<Category | null>(null);
  const [tab, setTab] = useState<"qr" | "id">("qr");
  const [idValue, setIdValue] = useState("");
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<Date | null>(null);
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
    getLiveDay()
      .then(setLiveDay)
      .catch(() => {
        // app_settings table missing/unreachable — default to Day 1.
      });
  }, []);

  function pickCategory(c: Category) {
    const itemKey = keyFor(liveDay, c);
    if (itemKey && categorySettings && categorySettings[itemKey] === false) {
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
    setConfirmedAt(new Date());
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
      <div className="phone">
        <TopNav />
        <div className="app-body">
          {screen === "home" && (
            <HomeScreen liveDay={liveDay} onPick={pickCategory} categorySettings={categorySettings} />
          )}
          {screen === "scan" && category && (
            <ScanScreen
              key={`scan-${visit}`}
              day={liveDay}
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
              day={liveDay}
              category={category}
              attendee={attendee}
              confirmedAt={confirmedAt}
              onBackToCategories={backToHome}
              onBackToScanner={backToScanner}
            />
          )}
        </div>
      </div>
    </div>
  );
}
