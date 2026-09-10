"use client";

import { useEffect, useRef, useState } from "react";
import {
  Attendee,
  DuplicateSerialError,
  registerOnspotAttendee,
  supabase,
} from "@/lib/supabaseClient";

// Onboarding desk: for walk-ins who show up without a pre-printed
// pre-registered badge. Staff hand them one of the spare pre-generated
// QR codes (see QR_generation/), scan or type its serial code here, fill
// in their name/org, and this creates a brand-new attendees row tagged
// is_onspot — so /admin can see, filter, and count on-the-spot
// registrations separately from the pre-registered list.
//
// Shares the same camera lock / single-decode pattern as app/scan —
// see that file's comments for why both exist.

const SCANNER_ELEMENT_ID = "onboarding-reader";

let cameraLock: Promise<void> = Promise.resolve();

function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const result = cameraLock.then(task, task);
  cameraLock = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4 12.5L9.5 18L20 6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function OnboardingPage() {
  const [tab, setTab] = useState<"qr" | "id">("qr");
  const [serialCode, setSerialCode] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState<Attendee | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const scannerRef = useRef<any>(null);
  const decodedOnceRef = useRef(false);

  async function refreshCount() {
    const { count } = await supabase
      .from("attendees")
      .select("id", { count: "exact", head: true })
      .eq("is_onspot", true);
    setTodayCount(count ?? 0);
  }

  useEffect(() => {
    refreshCount();
  }, []);

  async function startScanner() {
    await runExclusive(async () => {
      setCameraError(null);
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const el = document.getElementById(SCANNER_ELEMENT_ID);
        if (!el) return;
        el.innerHTML = "";

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText: string) => {
            if (decodedOnceRef.current) return;
            decodedOnceRef.current = true;
            setSerialCode(decodedText.trim());
            stopScanner();
          },
          () => {}
        );

        const video = el.querySelector("video") as HTMLVideoElement | null;
        if (video && video.paused) video.play().catch(() => {});

        setScannerActive(true);
      } catch {
        setScannerActive(false);
        setCameraError("Couldn't access the camera. Use manual entry instead.");
      }
    });
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScannerActive(false);
    if (!scanner) return;
    await runExclusive(async () => {
      try {
        await scanner.stop();
      } catch {}
      try {
        await scanner.clear();
      } catch {}
      const el = document.getElementById(SCANNER_ELEMENT_ID);
      if (el) el.innerHTML = "";
    });
  }

  useEffect(() => {
    if (tab === "qr" && !registered) {
      decodedOnceRef.current = false;
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, registered]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !serialCode.trim() || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const attendee = await registerOnspotAttendee(
        serialCode.trim(),
        name.trim(),
        organization.trim()
      );
      setRegistered(attendee);
      refreshCount();
    } catch (e) {
      if (e instanceof DuplicateSerialError) {
        setError(e.message + " Use a different code, or check /admin if this was a mistake.");
      } else {
        setError("Couldn't register — try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function registerAnother() {
    setRegistered(null);
    setSerialCode("");
    setName("");
    setOrganization("");
    setError(null);
    decodedOnceRef.current = false;
    setTab("qr");
  }

  return (
    <div className="wrap">
      <style>{`
        :root {
          --black: #0A0A0C; --white: #FFFFFF; --blue: #2F5CFF; --blue-dim: #E7ECFF;
          --grey-50: #F1F1F3; --grey-100: #F5F5F7; --grey-300: #DBDBDF;
          --grey-500: #8B8B93; --grey-700: #4A4A52;
        }
        .wrap { min-height: 100vh; width: 100%; background: var(--grey-50); display: flex; align-items: center; justify-content: center; padding: 32px 16px; font-family: Helvetica, Arial, sans-serif; box-sizing: border-box; }
        .wrap *, .wrap *::before, .wrap *::after { box-sizing: border-box; }
        .phone { width: 390px; max-width: 100%; min-height: 700px; background: var(--white); border-radius: 28px; border: 1px solid var(--grey-300); box-shadow: 0 20px 50px rgba(10,10,12,0.10); overflow: hidden; position: relative; display: flex; flex-direction: column; }
        .screen { padding: 28px 24px 32px; flex: 1; display: flex; flex-direction: column; }
        .topline { margin-bottom: 8px; }
        .mark { font-size: 13px; font-weight: 600; color: var(--blue); letter-spacing: 0.01em; }
        .mark-sub { font-size: 12px; color: var(--grey-500); margin-top: 2px; }
        .title { font-size: 26px; font-weight: 700; margin: 14px 0 4px; color: var(--black); }
        .subtitle { font-size: 13px; color: var(--grey-500); margin: 0 0 22px; }
        .counter { font-size: 12px; color: var(--grey-500); margin: 0 0 18px; }
        .counter b { color: var(--black); }

        .tabs { display: flex; background: var(--grey-100); border-radius: 12px; padding: 4px; margin-bottom: 20px; }
        .tab { flex: 1; border: none; background: transparent; padding: 10px 0; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--grey-700); border-radius: 9px; cursor: pointer; }
        .tab-active { background: var(--white); color: var(--black); box-shadow: 0 1px 4px rgba(10,10,12,0.12); }

        .viewfinder { width: 100%; aspect-ratio: 1/1; max-width: 220px; margin: 0 auto 14px; background: var(--black); border-radius: 16px; position: relative; overflow: hidden; }
        .viewfinder-camera { position: absolute; inset: 0; width: 100%; height: 100%; }
        .viewfinder-camera video, .viewfinder-camera canvas { width: 100% !important; height: 100% !important; object-fit: cover; }
        .qr-help { font-size: 12px; color: var(--grey-500); text-align: center; margin: 0 0 6px; }
        .qr-help-warn { color: #B45309; }

        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 12px; font-weight: 600; color: var(--grey-700); margin-bottom: 6px; }
        .field input { width: 100%; font-family: inherit; font-size: 15px; padding: 13px 14px; border: 1px solid var(--grey-300); border-radius: 12px; outline: none; }
        .field input:focus { border-color: var(--blue); }

        .error-text { font-size: 13px; color: #D64545; margin: 0 0 14px; }
        .primary-btn { background: var(--blue); color: var(--white); border: none; font-family: inherit; font-size: 15px; font-weight: 600; padding: 15px 0; border-radius: 12px; cursor: pointer; margin-top: auto; }
        .primary-btn:disabled { background: var(--grey-300); color: var(--grey-500); cursor: default; }

        .confirm-block { display: flex; flex-direction: column; align-items: center; margin: 24px 0 20px; }
        .check-circle { color: var(--blue); margin-bottom: 14px; }
        .confirm-title { font-size: 20px; font-weight: 600; color: var(--black); margin: 0 0 4px; text-align: center; }
        .confirm-sub { font-size: 13px; color: var(--grey-500); margin: 0; text-align: center; }
        .delegate-card { background: var(--grey-100); border: 1px solid var(--grey-300); border-radius: 14px; padding: 18px; margin: 16px 0; }
        .delegate-serial { font-size: 12px; color: var(--grey-500); margin: 0 0 8px; }
        .delegate-name { font-size: 19px; font-weight: 700; color: var(--black); margin: 0 0 4px; }
        .delegate-org { font-size: 13px; color: var(--grey-700); margin: 0; }
      `}</style>

      <div className="phone">
        <div className="screen">
          <div className="topline">
            <div className="mark">INDIS 2026</div>
            <div className="mark-sub">Onboarding desk</div>
          </div>

          {registered ? (
            <>
              <div className="confirm-block">
                <div className="check-circle">
                  <CheckIcon />
                </div>
                <p className="confirm-title">Registered</p>
                <p className="confirm-sub">They're now in the system and can be scanned normally.</p>
              </div>
              <div className="delegate-card">
                <p className="delegate-serial">{registered.serial_code}</p>
                <p className="delegate-name">{registered.name}</p>
                <p className="delegate-org">{registered.organization || "—"}</p>
              </div>
              <p className="counter">
                On-the-spot registrations so far: <b>{todayCount ?? "…"}</b>
              </p>
              <button className="primary-btn" onClick={registerAnother}>
                Register another
              </button>
            </>
          ) : (
            <>
              <h1 className="title">New walk-in</h1>
              <p className="subtitle">Hand them a spare QR code, then fill this in.</p>
              <p className="counter">
                On-the-spot registrations so far: <b>{todayCount ?? "…"}</b>
              </p>

              <div className="tabs">
                <button
                  className={`tab ${tab === "qr" ? "tab-active" : ""}`}
                  onClick={() => setTab("qr")}
                  type="button"
                >
                  Scan QR
                </button>
                <button
                  className={`tab ${tab === "id" ? "tab-active" : ""}`}
                  onClick={() => setTab("id")}
                  type="button"
                >
                  Type ID
                </button>
              </div>

              {tab === "qr" && (
                <>
                  <div className="viewfinder">
                    <div id={SCANNER_ELEMENT_ID} className="viewfinder-camera" />
                  </div>
                  {cameraError ? (
                    <p className="qr-help qr-help-warn">{cameraError}</p>
                  ) : (
                    <p className="qr-help">
                      {serialCode
                        ? `Captured: ${serialCode} — edit below if needed`
                        : "Align the spare QR code within the frame"}
                    </p>
                  )}
                </>
              )}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="serial">Serial / ID on the QR code</label>
                  <input
                    id="serial"
                    value={serialCode}
                    onChange={(e) => setSerialCode(e.target.value)}
                    placeholder="e.g. ONSPOT007"
                  />
                </div>
                <div className="field">
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Delegate's name"
                  />
                </div>
                <div className="field">
                  <label htmlFor="org">Organization (optional)</label>
                  <input
                    id="org"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="College / company"
                  />
                </div>

                {error && <p className="error-text">{error}</p>}

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting || !serialCode.trim() || !name.trim()}
                >
                  {submitting ? "Registering…" : "Register"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
