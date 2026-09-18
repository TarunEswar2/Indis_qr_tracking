"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppUser, UserRole } from "@/lib/supabaseClient";

// Per-person login (username + password), replacing the old shared
// admin/staff passwords. Every volunteer/onboarding person and every
// admin has their own row in app_users (supabase/schema.sql) with a
// role that decides which pages they're even allowed on — a
// "volunteer" account is refused at /admin's door, not just kept off
// the nav link.
//
// The logged-in user is stored once, for the whole app, as
// sessionStorage["indis_user"] = {username, role, display_name} — not
// per-page like the old per-role keys — so components/TopNav.tsx can
// read it too and only show the tabs this account is allowed to see.
// Still scoped to sessionStorage (asked again in a new tab), matching
// how the old password gate behaved.
//
// There's no inline login form here anymore — that now lives once, at
// /login (see app/login/page.tsx), so there's a single sign-in screen
// for the whole app instead of a separate one baked into every gated
// page. This component's job is narrower: if no one's signed in, send
// them to /login (remembering where they were headed via ?next=); if
// someone IS signed in but their role doesn't match this page, refuse
// to render it and point them back to their own home page instead.

const SESSION_KEY = "indis_user";

export function readSessionUser(): AppUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.username === "string" && (parsed.role === "admin" || parsed.role === "volunteer")) {
      return parsed as AppUser;
    }
  } catch {}
  return null;
}

export function clearSessionUser() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  volunteer: "/scan",
};

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MinimalHeader() {
  // Same "INDIS 2026" mark as TopNav, but no tab row — shown only on the
  // access-denied screen below now (the signed-out case redirects away
  // before rendering anything).
  return (
    <div className="app-topbar">
      <div className="mark">INDIS 2026</div>
    </div>
  );
}

export default function AuthGate({
  requiredRole,
  children,
}: {
  requiredRole: UserRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // undefined = still checking sessionStorage (avoids a flash of the
  // real page, or a flash redirect to /login, before we know); null = no
  // one logged in; an AppUser = logged in (role may or may not match
  // this page).
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);

  useEffect(() => {
    setUser(readSessionUser());
  }, []);

  useEffect(() => {
    if (user === null) {
      const dest = pathname || ROLE_HOME[requiredRole];
      router.replace(`/login?next=${encodeURIComponent(dest)}`);
    }
  }, [user, pathname, requiredRole, router]);

  function signOut() {
    clearSessionUser();
    router.replace("/login");
  }

  if (user === undefined || user === null) {
    // Either still checking, or the effect above is about to navigate to
    // /login — render nothing rather than a form that would just flash.
    return null;
  }

  // Admin can reach every page — a volunteer-only page still checks
  // requiredRole, but admin always passes regardless of what a page asks
  // for.
  if (user.role === requiredRole || user.role === "admin") {
    return <>{children}</>;
  }

  // Logged in, but this account's role isn't allowed on this page — e.g.
  // a volunteer landed on /admin, whether by typing the URL or an old
  // bookmark. Never render the page itself; just say so and point them
  // back to where they do have access.
  return (
    <div className="wrap">
      <div className="phone">
        <MinimalHeader />
        <div className="app-body">
          <div className="screen gate">
            <div className="gate-icon">
              <LockIcon />
            </div>
            <h1 className="confirm-title">Not available for your account</h1>
            <p className="qr-help gate-sub">
              {user.display_name || user.username} is signed in as {user.role}, which doesn&rsquo;t have access to
              this page.
            </p>
            <Link href={ROLE_HOME[user.role]} className="primary-btn gate-btn" style={{ textAlign: "center" }}>
              Go to my page
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="onboard-rescan-link"
              style={{ marginTop: 14, marginBottom: 0 }}
            >
              Sign in as someone else
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
