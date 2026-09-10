"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") === "admin" ? "admin" : "volunteer";
  const next = params.get("next") || (role === "admin" ? "/admin" : "/scan");

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
      router.replace(next);
      router.refresh();
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
        background: "#F1F1F3",
        padding: 16,
        fontFamily: "Helvetica, Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#FFFFFF",
          padding: 32,
          borderRadius: 20,
          width: "100%",
          maxWidth: 360,
          boxShadow: "0 20px 50px rgba(10,10,12,0.10)",
          border: "1px solid #DBDBDF",
          boxSizing: "border-box",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "#2F5CFF", margin: "0 0 4px" }}>
          INDIS 2026
        </p>
        <h1 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 6px", color: "#0A0A0C" }}>
          {role === "admin" ? "Admin access" : "Volunteer access"}
        </h1>
        <p style={{ fontSize: 13, color: "#8B8B93", margin: "0 0 22px" }}>
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
            padding: "13px 14px",
            borderRadius: 10,
            border: "1px solid #DBDBDF",
            marginBottom: 12,
            fontSize: 15,
            fontFamily: "inherit",
            boxSizing: "border-box",
            outline: "none",
          }}
        />

        {error && (
          <p style={{ color: "#D64545", fontSize: 13, margin: "0 0 12px" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 10,
            border: "none",
            background: loading || !password ? "#DBDBDF" : "#2F5CFF",
            color: loading || !password ? "#8B8B93" : "#FFFFFF",
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
