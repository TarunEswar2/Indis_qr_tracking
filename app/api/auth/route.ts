import { NextRequest, NextResponse } from "next/server";
import { verifyLogin } from "@/lib/supabaseClient";

// Verifies a username/password against app_users (see
// supabase/schema.sql and lib/supabaseClient.ts's verifyLogin). Returns
// the account's role and display name on success — that's what
// components/AuthGate.tsx uses both to unlock the current page and to
// decide whether this account is even allowed on it (a "volunteer"
// account never gets into /admin, no matter what).
export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { username, password } = body;

  if (typeof username !== "string" || !username.trim()) {
    return NextResponse.json({ error: "Username required." }, { status: 400 });
  }
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Password required." }, { status: 400 });
  }

  let user;
  try {
    user = await verifyLogin(username.trim(), password);
  } catch {
    // e.g. app_users/verify_login not set up yet — fail closed, not
    // open, so a missing migration locks the page rather than skipping
    // the check entirely.
    return NextResponse.json(
      { error: "Login isn't set up yet — run the latest supabase/schema.sql." },
      { status: 500 }
    );
  }

  if (!user) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, ...user });
}
