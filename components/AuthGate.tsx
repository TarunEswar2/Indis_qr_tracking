"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";

// Password gate, styled exactly like prototype_ui/indis-scan-flow.jsx's
// PasswordGate (same .gate/.gate-icon/.gate-sub/.gate-input/.gate-btn
// classes, same lock icon, same copy) instead of a separate modal — it's
// just another "screen" inside the same phone frame, topbar and all.
//
// Two roles only: "staff" (shared by /scan and /onboarding — unlock
// either one and both are unlocked) and "admin" (its own password). Each
// unlock is written to sessionStorage, so it's asked once per browser
// tab/session — matching the prototype's own "you'll only be asked once
// per session" copy — but never on every screen switch within that tab.

type Role = "staff" | "admin";

const SESSION_KEYS: Record<Role, string> = {
  staff: "indis_staff_ok",
  admin: "indis_admin_ok",
};

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function AuthGate({
  role,
  label,
  children,
}: {
  role: Role;
  label: string;
  children: React.ReactNode;
}) {
  // null = still checking sessionStorage (avoids a flash of the real page
  // before we know), true = unlocked for this tab, false = show the gate.
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ok = false;
    try {
      ok = sessionStorage.getItem(SESSION_KEYS[role]) === "1";
    } catch {
      ok = false;
    }
    setUnlocked(ok);
  }, [role]);

  async function submit() {
    if (!password.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Incorrect password.");
        return;
      }
      try {
        sessionStorage.setItem(SESSION_KEYS[role], "1");
      } catch {}
      setPassword("");
      setUnlocked(true);
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (unlocked === null) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="wrap">
      <div className="phone">
        <TopNav />
        <div className="app-body">
          <div className="screen gate">
            <div className="gate-icon">
              <LockIcon />
            </div>
            <h1 className="confirm-title">{label} access</h1>
            <p className="qr-help gate-sub">
              Enter the password to continue. You&rsquo;ll only be asked once per session.
            </p>
            <input
              className="id-input gate-input"
              type="password"
              autoFocus
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
            <button className="primary-btn gate-btn" disabled={!password.trim() || loading} onClick={submit}>
              {loading ? "Checking…" : "Unlock"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
