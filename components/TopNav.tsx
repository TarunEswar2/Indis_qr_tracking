"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/scan", label: "Volunteer" },
  { href: "/admin", label: "Admin" },
];

/**
 * The prototype's "app-topbar" — an "INDIS 2026" mark above a pill-shaped
 * row of tabs — rendered with real <Link>s instead of client-side state.
 * Just two destinations now (matching prototype_ui/indis-scan-flow.jsx):
 * Volunteer ("staff" password) and Admin (its own password) — onboarding
 * walk-ins now live inside Admin itself (see components/OnboardFlow.tsx),
 * rather than being a separate top-level tab. Each destination is still
 * gated by components/AuthGate.tsx, so switching tabs here never bypasses
 * a password gate.
 */
export default function TopNav() {
  const pathname = usePathname();

  return (
    <div className="app-topbar">
      <div className="mark">INDIS 2026</div>
      <div className="main-tabs-row">
        {LINKS.map((link) => {
          const active = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`main-tab-shape ${active ? "main-tab-shape-active" : ""}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
