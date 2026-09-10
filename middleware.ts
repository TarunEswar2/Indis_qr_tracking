import { NextRequest, NextResponse } from "next/server";

// Gates /admin behind the "admin" password, /scan behind the "volunteer"
// password, and /onboarding behind the "onboarding" password (see
// supabase/schema.sql's app_passwords table and app/api/auth/route.ts).
// Anything else on the site is untouched.
const COOKIE_NAMES = {
  admin: "indis_admin_ok",
  volunteer: "indis_volunteer_ok",
  onboarding: "indis_onboarding_ok",
} as const;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const role = pathname.startsWith("/admin")
    ? "admin"
    : pathname.startsWith("/scan")
    ? "volunteer"
    : pathname.startsWith("/onboarding")
    ? "onboarding"
    : null;

  if (!role) return NextResponse.next();

  const cookieName = COOKIE_NAMES[role];
  const authed = req.cookies.get(cookieName)?.value === "1";
  if (authed) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("role", role);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/scan",
    "/scan/:path*",
    "/onboarding",
    "/onboarding/:path*",
  ],
};
