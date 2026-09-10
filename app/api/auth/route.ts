import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Session cookie names — deliberately have no maxAge/expires set below,
// which makes them true browser-session cookies: they clear themselves
// when the browser is fully closed (not just the tab), and stay valid for
// as long as it's open, per what was decided for this project.
const COOKIE_NAMES = {
  admin: "indis_admin_ok",
  volunteer: "indis_volunteer_ok",
  onboarding: "indis_onboarding_ok",
} as const;

type Role = keyof typeof COOKIE_NAMES;

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

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAMES[role as Role], "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // no maxAge/expires on purpose — see comment above
  });
  return res;
}
