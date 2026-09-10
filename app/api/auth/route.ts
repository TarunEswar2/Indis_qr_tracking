import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Just verifies a role's password against Supabase. The "stay unlocked"
// bit is no longer a cookie set here — it's sessionStorage, written by
// the caller (components/AuthGate.tsx) on a 200 response, so that being
// unlocked is scoped to one browser tab instead of the whole browser:
// open a new tab and it asks again, per what was asked for.
export async function POST(req: NextRequest) {
  let body: { role?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { role, password } = body;

  if (role !== "admin" && role !== "volunteer" && role !== "onboarding") {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Password required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("app_passwords")
    .select("password")
    .eq("role", role)
    .single();

  if (error || !data) {
    // Table/row missing (e.g. migration not run yet) — fail closed, not
    // open, so a missing password row locks the page rather than skipping
    // the check entirely.
    return NextResponse.json(
      { error: "Password check isn't set up yet — run the latest supabase/schema.sql." },
      { status: 500 }
    );
  }

  if (data.password !== password) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
