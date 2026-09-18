"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Attendee,
  CategorySettings,
  ITINERARY_ITEMS,
  ItineraryKey,
  getCategorySettings,
  getLiveDay,
  isRegisteredForDay,
  setAttendeeRegisteredDays,
  setCategoryEnabled,
  setItineraryItem,
  setLiveDay,
  supabase,
} from "@/lib/supabaseClient";
import TopNav from "@/components/TopNav";
import AuthGate, { readSessionUser } from "@/components/AuthGate";
import OnboardFlow from "@/components/OnboardFlow";

// ---------------------------------------------------------------------------
// This screen mirrors prototype_ui/indis-scan-flow.jsx's AdminScreen exactly
// (same phone-mockup frame, same day-chevron nav + master toggle + category
// table, same attendee table with All/Day tabs), wired to the real Supabase
// attendees/category_settings/app_settings tables instead of mock state.
//
// Two things the prototype's demo doesn't need but the real event does are
// folded into the same visual language rather than left as raw Tailwind:
// a search box + "on-spot only" filter above the attendee table, and a
// real CSV/XLSX export (with the headcount summary + BOM fix from earlier)
// wired to the export-btn, plus the separate "live day" control (which day
// the *volunteer* scan flow treats as "today" — see lib/supabaseClient.ts).
// ---------------------------------------------------------------------------

type Category = "kit" | "lunch" | "highTea" | "gala";
type Day = 1 | 2 | 3;

const CATEGORY_LABEL: Record<Category, string> = {
  kit: "Conference Kit",
  lunch: "Lunch",
  highTea: "High Tea",
  gala: "Gala Dinner",
};

const SHORT_LABEL: Record<Category, string> = {
  kit: "Kit",
  lunch: "Lunch",
  highTea: "Tea",
  gala: "Gala",
};

const DAY_CATEGORIES: Record<Day, Category[]> = {
  1: ["kit", "lunch", "highTea"],
  2: ["lunch", "highTea", "gala"],
  3: ["lunch", "highTea"],
};

const ALL_CATEGORIES: Category[] = ["kit", "lunch", "highTea", "gala"];

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
  if (category === "gala") return day === 2 ? "gala_dinner" : null;
  return null;
}

// ---------- icons (ported as-is from the prototype) ----------

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

function ExportIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3v11M12 3L8 7M12 3l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18 8v6M15 11h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function WarningIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 3.5L21 19.5H3L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 9.5v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
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

function StatusDot({ done }: { done: boolean }) {
  if (done) return <CheckIcon className="attendee-status-yes" />;
  return <span className="attendee-status-no">—</span>;
}

// ---------- export helpers (unchanged real functionality) ----------

const DAY_ITEMS: Record<Day, ItineraryKey[]> = {
  1: ["kit_received", "lunch_day1", "high_tea_day1"],
  2: ["lunch_day2", "high_tea_day2", "gala_dinner"],
  3: ["lunch_day3", "high_tea_day3"],
};

const EMERGENCY_SCANNER_ELEMENT_ID = "emergency-reader";

// Serializes camera start/stop calls the same way OnboardFlow does — its
// own lock lives in that file, but this one only ever runs while the
// dashboard's "onboard" view isn't mounted (admin shows one view at a
// time), so there's no risk of two locks fighting over the same camera.
let emergencyCameraLock: Promise<void> = Promise.resolve();

function runEmergencyExclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = emergencyCameraLock.then(task, task);
  emergencyCameraLock = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  // UTF-8 BOM so Excel/Sheets don't mangle the "—" in labels like "Lunch — Day 1".
  const csvWithBom = "﻿" + csv;
  const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function AdminPage() {
  const [view, setView] = useState<"dashboard" | "onboard" | "emergency">("dashboard");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [settings, setSettings] = useState<CategorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onspotOnly, setOnspotOnly] = useState(false);
  const [togglingKey, setTogglingKey] = useState<ItineraryKey | null>(null);
  const [liveDay, setLiveDayState] = useState<Day>(1);
  const [savingLiveDay, setSavingLiveDay] = useState(false);
  const [attendeeTab, setAttendeeTab] = useState<"all" | Day>("all");
  // Which single cell ("attendeeId:itemKey") is mid-toggle right now, so
  // that cell's button disables itself while its write is in flight
  // rather than letting a fast double-click fire two overlapping updates.
  const [togglingCell, setTogglingCell] = useState<string | null>(null);
  // Which attendee's "Days" cell is open for editing right now — click the
  // cell to reveal Day 1/2/3 checkboxes for that row, click elsewhere (or
  // save) to close it.
  const [editingDaysId, setEditingDaysId] = useState<string | null>(null);
  const [savingDaysId, setSavingDaysId] = useState<string | null>(null);
  // Emergency scan: the ONLY place in the app that surfaces an attendee's
  // phone/email (see lib/supabaseClient.ts — every other lookup path
  // explicitly excludes those columns). Searches the already-loaded local
  // `attendees` array (admin's bulk query is select("*"), so it already
  // has phone/email) rather than a fresh network call.
  const [emergencyTab, setEmergencyTab] = useState<"qr" | "id">("qr");
  const [emergencySerial, setEmergencySerial] = useState("");
  const [emergencyResult, setEmergencyResult] = useState<Attendee | null>(null);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);
  const [emergencySearching, setEmergencySearching] = useState(false);
  const [emergencyScannerActive, setEmergencyScannerActive] = useState(false);
  const [emergencyCameraError, setEmergencyCameraError] = useState<string | null>(null);
  const emergencyScannerRef = useRef<any>(null);
  const emergencyDecodedOnceRef = useRef(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [{ data, error: fetchError }, categorySettings, day] = await Promise.all([
        supabase.from("attendees").select("*").order("name"),
        getCategorySettings(),
        getLiveDay().catch(() => 1 as const),
      ]);
      if (fetchError) throw fetchError;
      setAttendees((data ?? []) as Attendee[]);
      setSettings(categorySettings);
      setLiveDayState(day);
    } catch (e: any) {
      setError(
        e?.message?.includes("category_settings")
          ? "category_settings table not found — run the latest supabase/schema.sql migration, then reload."
          : "Couldn't load data from Supabase."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function changeLiveDay(next: Day) {
    if (next === liveDay || savingLiveDay) return;
    setSavingLiveDay(true);
    const prev = liveDay;
    setLiveDayState(next);
    if (attendeeTab !== "all") setAttendeeTab(next);
    try {
      await setLiveDay(next);
    } catch {
      setLiveDayState(prev);
      setError("Couldn't update the live day — try again.");
    } finally {
      setSavingLiveDay(false);
    }
  }

  async function toggleCategory(key: ItineraryKey) {
    if (!settings) return;
    const next = !settings[key];
    setTogglingKey(key);
    setSettings({ ...settings, [key]: next }); // optimistic
    try {
      await setCategoryEnabled(key, next);
    } catch {
      setSettings({ ...settings, [key]: !next });
      setError(`Couldn't update "${key}" — try again.`);
    } finally {
      setTogglingKey(null);
    }
  }

  async function toggleMasterForDay(day: Day) {
    if (!settings) return;
    const cats = DAY_CATEGORIES[day];
    const keys = cats.map((c) => keyFor(day, c)).filter(Boolean) as ItineraryKey[];
    const allOn = keys.every((k) => settings[k]);
    const next = !allOn;
    const prevSettings = settings;
    const optimistic = { ...settings };
    keys.forEach((k) => (optimistic[k] = next));
    setSettings(optimistic);
    try {
      await Promise.all(keys.map((k) => setCategoryEnabled(k, next)));
    } catch {
      setSettings(prevSettings);
      setError("Couldn't update those categories — try again.");
    }
  }

  // Lets an admin correct a scan by hand, right from the attendee table —
  // click a status dot to flip it (mark done, or undo a done back to not
  // done) and it's written straight to Supabase. Confirms first (the grid
  // is dense and easy to mis-click), then is optimistic: the table
  // updates immediately, and rolls back with an error message if the
  // write fails.
  async function handleToggle(attendee: Attendee, key: ItineraryKey, done: boolean, label: string, day?: Day) {
    const cellId = `${attendee.id}:${key}`;
    if (togglingCell === cellId) return;
    // Marking something "done" for a day the attendee never registered
    // for is almost always a mis-scan or the wrong table cell — refuse
    // and tell the admin, rather than silently letting it through the way
    // the QR scan flow refuses it for volunteers (see isRegisteredForDay
    // in lib/supabaseClient.ts).
    if (done && day && !isRegisteredForDay(attendee, day)) {
      alert(`${attendee.name} isn't registered for Day ${day} — can't mark "${label}" as done.`);
      return;
    }
    const verb = done ? "Mark" : "Un-mark";
    if (!confirm(`${verb} "${label}" as ${done ? "done" : "not done"} for ${attendee.name}?`)) return;
    setTogglingCell(cellId);
    const prevValue = attendee[key];
    setAttendees((prev) =>
      prev.map((a) => (a.id === attendee.id ? { ...a, [key]: done ? new Date().toISOString() : null } : a))
    );
    try {
      await setItineraryItem(attendee.id, key, done, readSessionUser()?.username);
    } catch {
      setAttendees((prev) => (prev.map((a) => (a.id === attendee.id ? { ...a, [key]: prevValue } : a))));
      setError("Couldn't update that — try again.");
    } finally {
      setTogglingCell(null);
    }
  }

  // Flips one day on/off in an attendee's registered_days, straight from
  // the table's "Days" cell — optimistic, rolls back on failure.
  async function toggleAttendeeDay(attendee: Attendee, day: Day) {
    if (savingDaysId === attendee.id) return;
    const current = Array.isArray(attendee.registered_days) ? attendee.registered_days : [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    setSavingDaysId(attendee.id);
    setAttendees((prev) => prev.map((a) => (a.id === attendee.id ? { ...a, registered_days: next } : a)));
    try {
      await setAttendeeRegisteredDays(attendee.id, next);
    } catch {
      setAttendees((prev) =>
        prev.map((a) => (a.id === attendee.id ? { ...a, registered_days: current } : a))
      );
      setError("Couldn't update day validity — try again.");
    } finally {
      setSavingDaysId(null);
    }
  }

  // Shared by both the "Scan QR" and "Type ID" tabs — looks the serial up
  // in the already-loaded local `attendees` array (admin's bulk query is
  // select("*"), so phone/email are already there; no extra network call).
  function lookupEmergencySerial(serial: string) {
    const q = serial.trim();
    if (!q) return;
    setEmergencyError(null);
    const match = attendees.find((a) => a.serial_code.toLowerCase() === q.toLowerCase());
    if (match) {
      setEmergencyResult(match);
    } else {
      setEmergencyResult(null);
      setEmergencyError(`No attendee found with ID "${q}".`);
    }
  }

  function handleEmergencyLookup(e: React.FormEvent) {
    e.preventDefault();
    const q = emergencySerial.trim();
    if (!q) return;
    setEmergencySearching(true);
    lookupEmergencySerial(q);
    setEmergencySearching(false);
  }

  async function startEmergencyScanner() {
    await runEmergencyExclusive(async () => {
      setEmergencyCameraError(null);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const el = document.getElementById(EMERGENCY_SCANNER_ELEMENT_ID);
        if (!el) return;
        el.innerHTML = "";

        const scanner = new Html5Qrcode(EMERGENCY_SCANNER_ELEMENT_ID);
        emergencyScannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            if (emergencyDecodedOnceRef.current) return;
            emergencyDecodedOnceRef.current = true;
            handleEmergencyDecoded(decodedText.trim());
          },
          () => {}
        );

        const video = el.querySelector("video") as HTMLVideoElement | null;
        if (video && video.paused) video.play().catch(() => {});

        setEmergencyScannerActive(true);
      } catch {
        setEmergencyScannerActive(false);
        setEmergencyCameraError("Couldn't access the camera. Use the Type ID tab instead.");
      }
    });
  }

  async function stopEmergencyScanner() {
    const scanner = emergencyScannerRef.current;
    emergencyScannerRef.current = null;
    setEmergencyScannerActive(false);
    if (!scanner) return;
    await runEmergencyExclusive(async () => {
      try {
        await scanner.stop();
      } catch {}
      try {
        await scanner.clear();
      } catch {}
      const el = document.getElementById(EMERGENCY_SCANNER_ELEMENT_ID);
      if (el) el.innerHTML = "";
    });
  }

  function handleEmergencyDecoded(serial: string) {
    stopEmergencyScanner();
    lookupEmergencySerial(serial);
  }

  function switchEmergencyTab(next: "qr" | "id") {
    if (next === emergencyTab) return;
    setEmergencyTab(next);
    if (next === "qr") {
      setEmergencyError(null);
    }
  }

  useEffect(() => {
    if (view === "emergency" && emergencyTab === "qr" && !emergencyResult) {
      emergencyDecodedOnceRef.current = false;
      startEmergencyScanner();
    } else {
      stopEmergencyScanner();
    }
    return () => {
      stopEmergencyScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, emergencyTab, emergencyResult]);

  function resetEmergency() {
    setEmergencySerial("");
    setEmergencyResult(null);
    setEmergencyError(null);
    emergencyDecodedOnceRef.current = false;
    setEmergencyTab("qr");
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attendees.filter((a) => {
      if (onspotOnly && !a.is_onspot) return false;
      if (!q) return true;
      return (
        a.serial_code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.organization ?? "").toLowerCase().includes(q)
      );
    });
  }, [attendees, search, onspotOnly]);

  const onspotCount = useMemo(() => attendees.filter((a) => a.is_onspot).length, [attendees]);

  const scanCount = (day: Day, cat: Category) => {
    const key = keyFor(day, cat);
    if (!key) return 0;
    return attendees.filter((a) => Boolean(a[key])).length;
  };

  const columns: Category[] = attendeeTab === "all" ? ALL_CATEGORIES : DAY_CATEGORIES[attendeeTab];

  function cellValue(attendee: Attendee, col: Category) {
    if (attendeeTab === "all") {
      const daysWithCol = ([1, 2, 3] as Day[]).filter((d) => DAY_CATEGORIES[d].includes(col));
      if (daysWithCol.length === 0) return null;
      const confirmedCount = daysWithCol.filter((d) => {
        const key = keyFor(d, col);
        return key ? Boolean(attendee[key]) : false;
      }).length;
      return (
        <span className="attendee-fraction">
          {confirmedCount}/{daysWithCol.length}
        </span>
      );
    }
    const key = keyFor(attendeeTab, col);
    if (!key) return null;
    const done = Boolean(attendee[key]);
    const cellId = `${attendee.id}:${key}`;
    return (
      <button
        type="button"
        className="attendee-status-toggle"
        onClick={() => handleToggle(attendee, key, !done, CATEGORY_LABEL[col], attendeeTab as Day)}
        disabled={togglingCell === cellId}
        title={done ? "Mark as not done" : "Mark as done"}
      >
        <StatusDot done={done} />
      </button>
    );
  }

  // Shared by both export formats. day: 1 | 2 | 3 restricts to just that
  // day's columns (for the caterer); "all" (attendeeTab) exports every
  // column. Cell values are "Done"/"" — never the actual timestamp.
  function buildExportSheet(day?: Day) {
    const items = day ? ITINERARY_ITEMS.filter((i) => DAY_ITEMS[day].includes(i.key)) : ITINERARY_ITEMS;
    const total = filtered.length;
    const summary: (string | number)[][] = [
      [`INDIS 2026 — ${day ? `Day ${day}` : "All days"} export`],
      [`Total participants: ${total}`],
      ...items.map((i) => [`${i.label} scanned: ${filtered.filter((a) => Boolean(a[i.key])).length} of ${total}`]),
      [],
    ];
    const header = [
      "serial_code",
      "name",
      "organization",
      "designation",
      "phone",
      "email",
      "registered_days",
      ...items.map((i) => i.label),
    ];
    const rows = filtered.map((a) => [
      a.serial_code,
      a.name,
      a.organization ?? "",
      a.designation,
      a.phone ?? "",
      a.email ?? "",
      Array.isArray(a.registered_days) ? [...a.registered_days].sort().join(",") : "",
      ...items.map((i) => (a[i.key] ? "Done" : "")),
    ]);
    return { summary, header, rows, suffix: day ? `day${day}` : "all" };
  }

  function handleExportCsv() {
    const day = attendeeTab === "all" ? undefined : attendeeTab;
    const { summary, header, rows, suffix } = buildExportSheet(day);
    downloadCsv(`indis-attendees-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`, [
      ...summary.map((r) => r.map(String)),
      header,
      ...rows,
    ]);
  }

  function handleExportXlsx() {
    const day = attendeeTab === "all" ? undefined : attendeeTab;
    const { summary, header, rows, suffix } = buildExportSheet(day);
    const sheetData = [...summary, header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 22 }, ...header.slice(3).map(() => ({ wch: 16 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendees");
    XLSX.writeFile(wb, `indis-attendees-${suffix}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const dayCats = DAY_CATEGORIES[liveDay];
  const dayKeys = dayCats.map((c) => keyFor(liveDay, c)).filter(Boolean) as ItineraryKey[];
  const masterOn = settings ? dayKeys.every((k) => settings[k]) : true;

  return (
    <div className="wrap">
      <div className="phone admin-phone">
        <TopNav />
        <div className="app-body">
          {view === "onboard" ? (
            <OnboardFlow
              onBack={() => {
                setView("dashboard");
                loadAll();
              }}
            />
          ) : view === "emergency" ? (
            <div className="screen">
              <div className="scan-header">
                <button
                  className="icon-btn"
                  onClick={() => {
                    setView("dashboard");
                    resetEmergency();
                  }}
                  aria-label="Back to dashboard"
                >
                  <ChevronLeft width="20" height="20" />
                </button>
                <h1 className="scan-title">Emergency scan</h1>
              </div>

              {emergencyResult ? (
                <>
                  <div className="confirm-block">
                    <div className="check-circle check-circle-warn">
                      <WarningIcon width="26" height="26" />
                    </div>
                    <p className="confirm-title">Contact details</p>
                    <p className="confirm-time">Use only for a genuine emergency</p>
                  </div>

                  <div className="delegate-card">
                    <div className="delegate-block">
                      <p className="delegate-serial">{emergencyResult.serial_code}</p>
                      <p className="delegate-tag">{emergencyResult.designation || "Delegate"}</p>
                      <p className="delegate-name">{emergencyResult.name}</p>
                      <p className="delegate-role">{emergencyResult.organization || "—"}</p>
                    </div>
                    <div className="emergency-contact-rows">
                      <div className="emergency-contact-row">
                        <span className="emergency-contact-label">Phone</span>
                        <span className="emergency-contact-value">{emergencyResult.phone || "Not on file"}</span>
                      </div>
                      <div className="emergency-contact-row">
                        <span className="emergency-contact-label">Email</span>
                        <span className="emergency-contact-value">{emergencyResult.email || "Not on file"}</span>
                      </div>
                    </div>
                  </div>

                  <button className="primary-btn confirm-back-btn" onClick={resetEmergency}>
                    Look up another
                  </button>
                </>
              ) : (
                <>
                  <div className="tab-row-wrap">
                    <div className="tabs">
                      <button
                        className={`tab ${emergencyTab === "qr" ? "tab-active" : ""}`}
                        onClick={() => switchEmergencyTab("qr")}
                        type="button"
                      >
                        Scan QR
                      </button>
                      <button
                        className={`tab ${emergencyTab === "id" ? "tab-active" : ""}`}
                        onClick={() => switchEmergencyTab("id")}
                        type="button"
                      >
                        Type ID
                      </button>
                    </div>
                    <div className="tab-row-baseline" />
                  </div>

                  {emergencyTab === "qr" ? (
                    <div className="qr-pane">
                      <div className="viewfinder">
                        <div id={EMERGENCY_SCANNER_ELEMENT_ID} className="viewfinder-camera" />
                        <span className="corner corner-tl" />
                        <span className="corner corner-tr" />
                        <span className="corner corner-bl" />
                        <span className="corner corner-br" />
                        {emergencyScannerActive && <span className="scan-line" />}
                      </div>
                      {emergencyCameraError ? (
                        <p className="qr-help qr-help-warn">{emergencyCameraError}</p>
                      ) : emergencyError ? (
                        <p className="qr-help qr-help-warn">
                          {emergencyError} Try again, or use the Type ID tab.
                        </p>
                      ) : (
                        <p className="qr-help">Scan the QR on the attendee's badge</p>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleEmergencyLookup} className="onboard-form">
                      <label className="id-label" htmlFor="emergency-serial">
                        Serial / ID on the badge
                      </label>
                      <input
                        id="emergency-serial"
                        className="id-input onboard-field"
                        autoFocus
                        value={emergencySerial}
                        onChange={(e) => setEmergencySerial(e.target.value)}
                        placeholder="e.g. ICORD25IN519"
                      />

                      {emergencyError && (
                        <div className="id-error-box">
                          <p className="id-error-text">{emergencyError}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="primary-btn onboard-register-btn"
                        disabled={emergencySearching || !emergencySerial.trim()}
                      >
                        {emergencySearching ? "Looking up…" : "Look up"}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          ) : (
          <div className="screen admin-screen">
            {loading ? (
              <p className="qr-help">Loading…</p>
            ) : (
              <>
                {error && (
                  <div className="id-error-box" style={{ marginBottom: 16 }}>
                    <p className="id-error-text">{error}</p>
                  </div>
                )}

                <div className="admin-entry-row">
                  <button className="onboard-entry-btn admin-entry-btn" onClick={() => setView("onboard")} type="button">
                    <UserPlusIcon />
                    Onboard walk-in
                  </button>
                  <button
                    className="onboard-entry-btn emergency-entry-btn admin-entry-btn"
                    onClick={() => setView("emergency")}
                    type="button"
                  >
                    <WarningIcon />
                    Emergency scan
                  </button>
                </div>

                {/* Live day */}
                <div className="admin-section-head">
                  <h2 className="admin-h2">Live day</h2>
                  <div className="admin-day-nav">
                    <button
                      className="icon-circle-btn"
                      onClick={() => changeLiveDay((Math.max(1, liveDay - 1)) as Day)}
                      disabled={liveDay === 1 || savingLiveDay}
                      aria-label="Previous live day"
                    >
                      <ChevronLeft />
                    </button>
                    <span className="admin-live-day-label">Day {liveDay}</span>
                    <button
                      className="icon-circle-btn"
                      onClick={() => changeLiveDay((Math.min(3, liveDay + 1)) as Day)}
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

                {/* Categories — always the live day's, so there's one
                    day concept in this whole screen rather than a second
                    "which day am I editing" control to keep in sync. */}
                <div className="admin-section-head admin-section-head-spaced">
                  <h2 className="admin-h2">Categories</h2>
                </div>

                <div className="admin-cat-table">
                  <div className="admin-cat-day-row">
                    <span>DAY {String(liveDay).padStart(2, "0")}</span>
                    <Toggle checked={masterOn} onChange={() => toggleMasterForDay(liveDay)} label="Toggle all categories" />
                  </div>
                  {dayCats.map((c) => {
                    const key = keyFor(liveDay, c);
                    const enabled = key && settings ? settings[key] : true;
                    return (
                      <div className="admin-cat-row" key={c}>
                        <span className="admin-cat-name">{CATEGORY_LABEL[c]}</span>
                        <span className="admin-cat-count">{scanCount(liveDay, c)} scanned</span>
                        <Toggle
                          checked={Boolean(enabled)}
                          onChange={() => key && toggleCategory(key)}
                          label={`Toggle ${CATEGORY_LABEL[c]}`}
                          disabled={!key || togglingKey === key}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Attendees */}
                <div className="admin-section-head admin-attendees-head">
                  <h2 className="admin-h2">
                    Attendees{" "}
                    <span className="admin-attendee-total">
                      ({filtered.length}
                      {onspotOnly ? " on-the-spot" : ""})
                    </span>
                  </h2>
                  <div className="admin-export-group">
                    <button className="export-btn" onClick={handleExportXlsx} disabled={filtered.length === 0}>
                      <ExportIcon />
                      Excel
                    </button>
                    <button className="export-btn" onClick={handleExportCsv} disabled={filtered.length === 0}>
                      <ExportIcon />
                      CSV
                    </button>
                  </div>
                </div>

                <div className="admin-search-row">
                  <input
                    className="id-input admin-search-input"
                    placeholder="Search name, ID, organization…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <label className="admin-onspot-check">
                    <input type="checkbox" checked={onspotOnly} onChange={(e) => setOnspotOnly(e.target.checked)} />
                    On-the-spot only
                    <span className="admin-onspot-count">({onspotCount})</span>
                  </label>
                </div>

                <div className="tab-row-wrap">
                  <div className="tabs admin-attendee-tabs">
                    <button className={`tab ${attendeeTab === "all" ? "tab-active" : ""}`} onClick={() => setAttendeeTab("all")}>
                      All
                    </button>
                    {([1, 2, 3] as Day[]).map((d) => (
                      <button key={d} className={`tab ${attendeeTab === d ? "tab-active" : ""}`} onClick={() => setAttendeeTab(d)}>
                        Day {String(d).padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                  <div className="tab-row-baseline" />
                </div>

                <div className="attendee-table-wrap">
                  <div className="attendee-table">
                    <div className="attendee-row attendee-head">
                      <span className="cell-id">ID</span>
                      <span className="cell-name">Name</span>
                      <span className="cell-desig">Organization</span>
                      <span className="cell-role">Designation</span>
                      <span className="cell-days">Days</span>
                      {columns.map((c, i) => (
                        <span
                          className="cell-cat"
                          key={c}
                          style={i === columns.length - 1 ? { flex: "1 1 auto" } : undefined}
                        >
                          {SHORT_LABEL[c]}
                        </span>
                      ))}
                    </div>
                    <div className="attendee-body">
                      {filtered.map((a) => (
                        <div className="attendee-row" key={a.id}>
                          <span className="cell-id">{a.serial_code}</span>
                          <span className="cell-name">{a.name}</span>
                          <span className="cell-desig">{a.organization || "—"}</span>
                          <span className="cell-role">{a.designation}</span>
                          <span className="cell-days cell-days-editable">
                            {editingDaysId === a.id ? (
                              <div className="days-edit-pop">
                                {([1, 2, 3] as Day[]).map((day) => (
                                  <label key={day} className="days-edit-check">
                                    <input
                                      type="checkbox"
                                      checked={Array.isArray(a.registered_days) && a.registered_days.includes(day)}
                                      onChange={() => toggleAttendeeDay(a, day)}
                                      disabled={savingDaysId === a.id}
                                    />
                                    Day {day}
                                  </label>
                                ))}
                                <button
                                  type="button"
                                  className="days-edit-done"
                                  onClick={() => setEditingDaysId(null)}
                                >
                                  Done
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="cell-days-btn"
                                onClick={() => setEditingDaysId(a.id)}
                                title="Edit day validity"
                              >
                                {Array.isArray(a.registered_days) && a.registered_days.length > 0
                                  ? [...a.registered_days].sort().join(", ")
                                  : "—"}
                              </button>
                            )}
                          </span>
                          {columns.map((c, i) => (
                            <span
                              className="cell-cat"
                              key={c}
                              style={i === columns.length - 1 ? { flex: "1 1 auto" } : undefined}
                            >
                              {cellValue(a, c)}
                            </span>
                          ))}
                        </div>
                      ))}
                      {filtered.length === 0 && (
                        <div className="attendee-row">
                          <span className="cell-desig">No attendees match.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPageGated() {
  return (
    <AuthGate requiredRole="admin">
      <AdminPage />
    </AuthGate>
  );
}
