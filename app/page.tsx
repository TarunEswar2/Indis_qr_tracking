import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-semibold">INDIS Conference Tracker</h1>
      <p className="text-slate-600 max-w-sm">
        QR-based itinerary tracking for conference volunteers and organizers.
      </p>
      <div className="flex gap-4">
        <Link
          href="/scan"
          className="rounded-lg bg-slate-900 px-5 py-3 text-white font-medium"
        >
          Volunteer Scanner
        </Link>
        <Link
          href="/admin"
          className="rounded-lg border border-slate-300 px-5 py-3 font-medium"
        >
          Admin Dashboard
        </Link>
      </div>
    </main>
  );
}
