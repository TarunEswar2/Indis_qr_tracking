"use client";

import { useEffect, useState } from "react";
import { Attendee, ITINERARY_ITEMS, supabase } from "@/lib/supabaseClient";

// Bare-bones admin table: lists every attendee and their itinerary
// status. This is a functional stub for the data layer, not the final
// design — swap the markup once the dashboard UX is decided.

export default function AdminPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("attendees")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (!error && data) setAttendees(data as Attendee[]);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-xl font-semibold mb-4">Admin Dashboard</h1>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-slate-300">
                <th className="p-2">Name</th>
                <th className="p-2">Serial</th>
                {ITINERARY_ITEMS.map(({ key, label }) => (
                  <th key={key} className="p-2">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendees.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="p-2">{a.name}</td>
                  <td className="p-2">{a.serial_code}</td>
                  {ITINERARY_ITEMS.map(({ key }) => (
                    <td key={key} className="p-2">
                      {a[key] ? "✓" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
