"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/scan", label: "Volunteer" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/admin", label: "Admin" },
];

/**
 * The prototype's "app-topbar" — an "INDIS 2026" mark above a pill-shaped
 * row of tabs — rendered with real <Link>s instead of client-side state.
 * Each destination is still its own route behind its own /login +
 * middleware cookie check, so switching tabs here never bypasses a
 * password gate; it's just a fast way to move between the three roles
 * without typing a URL.
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
