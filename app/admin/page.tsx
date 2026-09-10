"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Attendee,
  CategorySettings,
  ITINERARY_ITEMS,
  ItineraryKey,
  getCategorySettings,
  getLiveDay,
  setCategoryEnabled,
  setLiveDay,
  supabase,
} from "@/lib/supabaseClient";
import TopNav from "@/components/TopNav";
import AuthGate from "@/components/AuthGate";

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
  2: ["lunch", "highTea"],
  3: ["lunch", "highTea", "gala"],
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
  if (category === "gala") return day === 3 ? "gala_dinner" : null;
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
  2: ["lunch_day2", "high_tea_day2"],
  3: ["lunch_day3", "high_tea_day3", "gala_dinner"],
};

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
    return <StatusDot done={Boolean(attendee[key])} />;
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
    const header = ["serial_code", "name", "organization", ...items.map((i) => i.label)];
    const rows = filtered.map((a) => [a.serial_code, a.name, a.organization ?? "", ...items.map((i) => (a[i.key] ? "Done" : ""))]);
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
                      <span className="cell-name">Name</span>
                      <span className="cell-desig">Organization</span>
                      {columns.map((c) => (
                        <span className="cell-cat" key={c}>
                          {SHORT_LABEL[c]}
                        </span>
                      ))}
                    </div>
                    <div className="attendee-body">
                      {filtered.map((a) => (
                        <div className="attendee-row" key={a.id} title={a.serial_code}>
                          <span className="cell-name">{a.name}</span>
                          <span className="cell-desig">{a.organization || "—"}</span>
                          {columns.map((c) => (
                            <span className="cell-cat" key={c}>
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
        </div>
      </div>
    </div>
  );
}

export default function AdminPageGated() {
  return (
    <AuthGate role="admin">
      <AdminPage />
    </AuthGate>
  );
}
