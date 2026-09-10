import { NextRequest, NextResponse } from "next/server";

// The /admin, /scan and /onboarding password gates moved to a client-side,
// per-tab check (components/AuthGate.tsx, using sessionStorage instead of
// a cookie) so that opening a new tab always asks for the password again —
// a cookie is shared across every tab in the browser, so it couldn't do
// that. sessionStorage can only be read in the browser, not here in
// middleware, so there's nothing left for this file to gate on the server
// side; it's kept as a no-op (rather than deleted) so it's easy to find if
// a future server-side check is ever needed again.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
