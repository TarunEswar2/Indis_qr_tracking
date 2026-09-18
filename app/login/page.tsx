"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppUser, UserRole } from "@/lib/supabaseClient";

// The one login screen for the whole app — replaces the old separate
// admin/volunteer password screens. Everyone (volunteer or admin) types
// their own username + password here; app_users (supabase/schema.sql)
// decides their role, and that role decides where they land:
//   admin -> /admin, volunteer -> /scan
// components/AuthGate.tsx sends people here whenever it finds no one
// signed in (and still separately refuses a signed-in-but-wrong-role
// visit to a page, e.g. a volunteer hitting /admin directly).

const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  volunteer: "/scan",
};

const SESSION_KEY = "indis_user";

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!username.trim() || !password.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Incorrect username or password.");
        return;
      }
      const loggedInUser: AppUser = await res.json();
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
      } catch {}
      // A next= is honored only if it actually matches where this role is
      // allowed to go — otherwise (or if there's no next=) send them to
      // their own home page. This is also why a volunteer who somehow had
      // ?next=/admin in the URL still lands on /scan, not /admin.
      const home = ROLE_HOME[loggedInUser.role];
      const destination = next && next.startsWith(home) ? next : home;
      window.location.href = destination;
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap">
      <div className="phone">
        <div className="app-topbar">
          <div className="mark">INDIS 2026</div>
        </div>
        <div className="app-body">
          <div className="screen gate">
            <div className="gate-icon">
              <LockIcon />
            </div>
            <h1 className="confirm-title">Sign in</h1>
            <p className="qr-help gate-sub">
              Enter your username and password. You&rsquo;ll only be asked once per session.
            </p>
            <input
              className="id-input gate-input"
              type="text"
              autoFocus
              autoComplete="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <input
              className="id-input gate-input"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            {error && (
              <div className="id-error-box" style={{ width: "100%", marginBottom: 14 }}>
                <p className="id-error-text">{error}</p>
              </div>
            )}
            <button
              className="primary-btn gate-btn"
              disabled={!username.trim() || !password.trim() || loading}
              onClick={submit}
            >
              {loading ? "Checking…" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
