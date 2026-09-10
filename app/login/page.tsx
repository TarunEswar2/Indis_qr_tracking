"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  volunteer: "/scan",
  onboarding: "/onboarding",
};

function LoginForm() {
  const params = useSearchParams();
  const roleParam = params.get("role");
  const role = roleParam && roleParam in ROLE_HOME ? roleParam : "volunteer";
  const next = params.get("next") || ROLE_HOME[role];

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || loading) return;
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
      // A full page load (not the Next.js client router) so the browser
      // sends the just-set cookie on this exact next request and the
      // middleware sees it immediately — a client-side router.replace()
      // can navigate using an already-cached version of the target page
      // from before the cookie existed, which is what forced a second
      // "Continue" click to actually get through.
      window.location.href = next;
      return;
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--grey-100, #F6F6F7)",
        padding: 16,
        fontFamily: "var(--font-body), Helvetica, Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--white, #FFFFFF)",
          padding: 32,
          borderRadius: 20,
          width: "100%",
          maxWidth: 360,
          boxShadow: "0 16px 40px rgba(10,10,12,0.08)",
          border: "1.5px solid var(--black, #2B2B30)",
          boxSizing: "border-box",
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--font-heading), Helvetica, Arial, sans-serif",
            color: "var(--accent, #2B4FBE)",
            margin: "0 0 4px",
          }}
        >
          INDIS 2026
        </p>
        <h1
          style={{
            fontSize: 21,
            fontWeight: 700,
            fontFamily: "var(--font-heading), Helvetica, Arial, sans-serif",
            margin: "0 0 6px",
            color: "var(--black, #2B2B30)",
          }}
        >
          {role === "admin"
            ? "Admin access"
            : role === "onboarding"
            ? "Onboarding desk access"
            : "Volunteer access"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--grey-500, #8B8B93)", margin: "0 0 22px" }}>
          Enter the {role} password to continue.
        </p>

        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            border: "1.5px solid var(--black, #2B2B30)",
            marginBottom: 12,
            fontSize: 15,
            fontFamily: "inherit",
            boxSizing: "border-box",
            outline: "none",
          }}
        />

        {error && (
          <p
            style={{
              color: "var(--error, #C0392B)",
              background: "var(--error-wash, rgba(192,57,43,0.12))",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 600,
              margin: "0 0 12px",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: "100%",
            padding: "15px 0",
            borderRadius: 12,
            border: `1.5px solid ${loading || !password ? "var(--grey-300, #D9D9DC)" : "var(--black, #2B2B30)"}`,
            background: loading || !password ? "var(--grey-300, #D9D9DC)" : "var(--black, #2B2B30)",
            color: loading || !password ? "var(--grey-500, #8B8B93)" : "var(--white, #FFFFFF)",
            fontWeight: 600,
            fontSize: 15,
            fontFamily: "inherit",
            cursor: loading || !password ? "default" : "pointer",
          }}
        >
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
