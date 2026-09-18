"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppUser } from "@/lib/supabaseClient";
import { clearSessionUser, readSessionUser } from "@/components/AuthGate";

const LINKS = [
  { href: "/scan", label: "Volunteer" },
  { href: "/admin", label: "Admin" },
];

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 20c0-3.6 3.4-6.5 7.5-6.5s7.5 2.9 7.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The prototype's "app-topbar" — an "INDIS 2026" mark above a pill-shaped
 * row of tabs — rendered with real <Link>s instead of client-side state.
 * Only rendered once AuthGate has already let the current page through,
 * so there's always a logged-in user by the time this mounts — but the
 * tabs shown still depend on that user's role: a volunteer account only
 * ever sees "Volunteer" here, never "Admin" at all (matching Admin's own
 * door-level refusal in components/AuthGate.tsx — this is the "don't
 * even show it" half of that, not the only protection).
 *
 * The account icon at the top right (matching the prototype) opens a
 * small card with who's signed in and a Sign out button — replaces the
 * old plain text link that used to sit under the tabs.
 */
export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(readSessionUser());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [menuOpen]);

  const links = user?.role === "admin" ? LINKS : LINKS.filter((l) => l.href === "/scan");

  function signOut() {
    clearSessionUser();
    router.refresh();
    // A hard reload is the simplest way to get AuthGate to re-check and
    // show the sign-in screen again, since it only reads sessionStorage
    // once on mount.
    window.location.reload();
  }

  return (
    <div className="app-topbar">
      <div className="app-topbar-head">
        <div className="mark">INDIS 2026</div>
        {user && (
          <div className="topnav-profile" ref={menuRef}>
            <button
              type="button"
              className="topnav-avatar-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Account"
            >
              <UserIcon />
            </button>
            {menuOpen && (
              <div className="topnav-profile-card">
                <p className="topnav-profile-name">{user.display_name || user.username}</p>
                <p className="topnav-profile-role">{user.role === "admin" ? "Admin" : "Volunteer"}</p>
                <button type="button" className="topnav-signout-btn" onClick={signOut}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="main-tabs-row">
        {links.map((link) => {
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
