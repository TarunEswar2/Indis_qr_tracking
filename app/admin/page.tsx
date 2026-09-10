"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Attendee,
  CategorySettings,
  ITINERARY_ITEMS,
  ItineraryKey,
  getCategorySettings,
  setCategoryEnabled,
  supabase,
} from "@/lib/supabaseClient";

// Admin dashboard: toggle which categories are open for scanning, search
// attendees and see their full status, and export as CSV or a real Excel
// (.xlsx) file — per day or all days — with a headcount summary at the
// top of each export, meant to be handed straight to the caterer.
//
// NOTE: this page is now behind the /login password gate (middleware.ts +
// app/api/auth/route.ts) rather than being wide open.

// Which itinerary columns belong to which day, for the per-day CSV export
// (e.g. handing Day 1's lunch/high-tea numbers to the caterer without the
// other days' columns cluttering it up).
const DAY_ITEMS: Record<1 | 2 | 3, ItineraryKey[]> = {
  1: ["kit_received", "lunch_day1", "high_tea_day1"],
  2: ["lunch_day2", "high_tea_day2"],
  3: ["lunch_day3", "high_tea_day3", "gala_dinner"],
};

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  // The "—" in labels like "Lunch — Day 1" is a non-ASCII character —
  // without a UTF-8 BOM at the start of the file, Excel/Sheets often
  // guesses the wrong encoding and turns it into garbage ("â€"" etc).
  // Prepending the BOM makes them detect UTF-8 correctly.
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

export default function AdminPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [settings, setSettings] = useState<CategorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [togglingKey, setTogglingKey] = useState<ItineraryKey | null>(null);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [{ data, error: fetchError }, categorySettings] = await Promise.all([
        supabase.from("attendees").select("*").order("name"),
        getCategorySettings(),
      ]);
      if (fetchError) throw fetchError;
      setAttendees((data ?? []) as Attendee[]);
      setSettings(categorySettings);
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

  async function toggleCategory(key: ItineraryKey) {
    if (!settings) return;
    const next = !settings[key];
    setTogglingKey(key);
    // optimistic update
    setSettings({ ...settings, [key]: next });
    try {
      await setCategoryEnabled(key, next);
    } catch {
      // revert on failure
      setSettings({ ...settings, [key]: !next });
      setError(`Couldn't update "${key}" — try again.`);
    } finally {
      setTogglingKey(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return attendees;
    return attendees.filter(
      (a) =>
        a.serial_code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.organization ?? "").toLowerCase().includes(q)
    );
  }, [attendees, search]);

  const counts = useMemo(() => {
    const totals = {} as Record<ItineraryKey, number>;
    for (const item of ITINERARY_ITEMS) {
      totals[item.key] = attendees.filter((a) => Boolean(a[item.key])).length;
    }
    return totals;
  }, [attendees]);

  // Shared by both export formats. day: 1 | 2 | 3 restricts to just that
  // day's columns (for the caterer); omit it for every column. Cell
  // values are "Done"/"" — never the actual timestamp — since the
  // caterer just needs a headcount, not timing. The summary block up top
  // is the total participant count plus a scanned-count per included
  // category, e.g. "Lunch — Day 1: 320 of 400 scanned".
  function buildExportSheet(day?: 1 | 2 | 3) {
    const items = day
      ? ITINERARY_ITEMS.filter((i) => DAY_ITEMS[day].includes(i.key))
      : ITINERARY_ITEMS;

    const total = attendees.length;
    const summary: (string | number)[][] = [
      [`INDIS 2026 — ${day ? `Day ${day}` : "All days"} export`],
      [`Total participants: ${total}`],
      ...items.map((i) => [`${i.label} scanned: ${counts[i.key] ?? 0} of ${total}`]),
      [],
    ];

    const header = ["serial_code", "name", "organization", ...items.map((i) => i.label)];
    const rows = attendees.map((a) => [
      a.serial_code,
      a.name,
      a.organization ?? "",
      ...items.map((i) => (a[i.key] ? "Done" : "")),
    ]);

    return { summary, header, rows, suffix: day ? `day${day}` : "all" };
  }

  function exportCsv(day?: 1 | 2 | 3) {
    const { summary, header, rows, suffix } = buildExportSheet(day);
    downloadCsv(
      `indis-attendees-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`,
      [...summary.map((r) => r.map(String)), header, ...rows]
    );
  }

  function exportXlsx(day?: 1 | 2 | 3) {
    const { summary, header, rows, suffix } = buildExportSheet(day);
    const sheetData = [...summary, header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    // Bold the title + summary lines and widen columns a bit so the sheet
    // is readable the moment it's opened, not just after manual formatting.
    ws["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 22 }, ...header.slice(3).map(() => ({ wch: 16 }))];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendees");
    XLSX.writeFile(wb, `indis-attendees-${suffix}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <style>{`
        .switch { position: relative; width: 40px; height: 22px; border-radius: 999px; cursor: pointer; border: none; transition: background 0.15s; flex-shrink: 0; }
        .switch-on { background: #2F5CFF; }
        .switch-off { background: #D1D5DB; }
        .switch-off:disabled, .switch-on:disabled { opacity: 0.6; cursor: default; }
        .switch-knob { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 999px; background: white; transition: transform 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.25); }
        .switch-on .switch-knob { transform: translateX(18px); }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">INDIS Admin Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              {attendees.length} attendee{attendees.length === 1 ? "" : "s"} total
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 mr-1">Export as Excel:</span>
              {([1, 2, 3] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => exportXlsx(d)}
                  disabled={loading || attendees.length === 0}
                  className="rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium px-3 py-2 disabled:opacity-40 hover:border-slate-400"
                >
                  Day {d}
                </button>
              ))}
              <button
                onClick={() => exportXlsx()}
                disabled={loading || attendees.length === 0}
                className="rounded-lg bg-slate-900 text-white text-sm font-medium px-4 py-2.5 disabled:opacity-40"
              >
                All days
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 mr-1">Export as CSV:</span>
              {([1, 2, 3] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => exportCsv(d)}
                  disabled={loading || attendees.length === 0}
                  className="rounded-lg border border-slate-200 bg-white text-slate-500 text-xs font-medium px-2.5 py-1.5 disabled:opacity-40 hover:border-slate-300"
                >
                  Day {d}
                </button>
              ))}
              <button
                onClick={() => exportCsv()}
                disabled={loading || attendees.length === 0}
                className="rounded-lg border border-slate-200 bg-white text-slate-500 text-xs font-medium px-2.5 py-1.5 disabled:opacity-40 hover:border-slate-300"
              >
                All days
              </button>
            </div>
          </div>
        </div>

        {/* Headcount summary */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Total participants</p>
            <p className="text-2xl font-semibold text-slate-900">{attendees.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Scanned at least once</p>
            <p className="text-2xl font-semibold text-slate-900">
              {attendees.filter((a) => ITINERARY_ITEMS.some((i) => a[i.key])).length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Not scanned at all</p>
            <p className="text-2xl font-semibold text-slate-900">
              {attendees.filter((a) => !ITINERARY_ITEMS.some((i) => a[i.key])).length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">Total scans logged</p>
            <p className="text-2xl font-semibold text-slate-900">
              {attendees.reduce((sum, a) => sum + ITINERARY_ITEMS.filter((i) => a[i.key]).length, 0)}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {/* Category on/off toggles */}
        <section className="mb-8 bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Scannable categories</h2>
          <p className="text-xs text-slate-500 mb-4">
            Turn a category off to stop volunteers from scanning it (e.g. once Day 1 lunch service ends). Takes effect on the scanner immediately.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ITINERARY_ITEMS.map((item) => {
              const enabled = settings ? settings[item.key] : true;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">
                      {counts[item.key] ?? 0} of {attendees.length} done
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={enabled}
                    disabled={!settings || togglingKey === item.key}
                    onClick={() => toggleCategory(item.key)}
                    className={`switch ${enabled ? "switch-on" : "switch-off"}`}
                  >
                    <span className="switch-knob" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Search + status table */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Attendees</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, serial code, or organization…"
              className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {loading ? (
            <p className="text-sm text-slate-500 py-6">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500 py-6">
              {search ? "No attendee matches that search." : "No attendees yet."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b border-slate-200 text-slate-500">
                    <th className="p-2 font-medium">Serial</th>
                    <th className="p-2 font-medium">Name</th>
                    <th className="p-2 font-medium">Organization</th>
                    {ITINERARY_ITEMS.map((item) => (
                      <th key={item.key} className="p-2 font-medium whitespace-nowrap">
                        {item.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2 font-mono text-xs text-slate-600">{a.serial_code}</td>
                      <td className="p-2 font-medium text-slate-900">{a.name}</td>
                      <td className="p-2 text-slate-600">{a.organization ?? "—"}</td>
                      {ITINERARY_ITEMS.map((item) => {
                        const done = Boolean(a[item.key]);
                        return (
                          <td key={item.key} className="p-2">
                            <span
                              className={
                                done
                                  ? "inline-flex items-center rounded-full bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5"
                                  : "text-slate-300 text-xs"
                              }
                            >
                              {done ? "Done" : "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
