import React, { useState, useEffect, useRef } from "react";

const CATEGORY_LABEL = {
  lunch: "Lunch",
  highTea: "High Tea",
  gala: "Gala Dinner",
};

const DAY_CATEGORIES = {
  1: ["lunch", "highTea"],
  2: ["lunch", "highTea"],
  3: ["lunch", "highTea", "gala"],
};

const INITIAL_SCANS = {
  1: { lunch: "confirmed", highTea: "confirmed", gala: "na" },
  2: { lunch: "confirmed", highTea: "pending", gala: "na" },
  3: { lunch: "pending", highTea: "pending", gala: "pending" },
};

const DELEGATE = {
  serial: "IND-2026-0842",
  name: "Jane Doe",
  role: "HOD, Department of Design",
  college: "IIT Guwahati",
};

function BackArrow(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M19 12H5M5 12L11 6M5 12L11 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Check(props) {
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

function ArrowRight(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M5 12H19M19 12L13 6M19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockedTag() {
  return <span className="pill pill-confirmed">Confirmed</span>;
}

function DelegatePreview() {
  return (
    <div className="delegate-block">
      <p className="delegate-serial">{DELEGATE.serial}</p>
      <p className="delegate-tag">Delegate</p>
      <p className="delegate-name">{DELEGATE.name}</p>
      <p className="delegate-role">{DELEGATE.role}</p>
      <p className="delegate-role">{DELEGATE.college}</p>
    </div>
  );
}

function HomeScreen({ day, setDay, today, onPick }) {
  const cats = DAY_CATEGORIES[day];
  const isToday = day === today;
  const isPast = day < today;
  return (
    <div className="screen home">
      <div className="topline">
        <div className="mark">INDIS 2026</div>
        <div className="mark-sub">Volunteer scan</div>
      </div>

      <div className="day-switch">
        {[1, 2, 3].map((d) => (
          <button
            key={d}
            className={`day-tab ${d === day ? "day-tab-active" : ""}`}
            onClick={() => setDay(d)}
          >
            Day {d}
          </button>
        ))}
      </div>

      <h1 className="day-heading">Day {String(day).padStart(2, "0")}</h1>
      <p className="day-sub">Select what you're scanning for</p>

      <div className="cat-list">
        {cats.map((c) => (
          <button
            key={c}
            className={`cat-card ${!isToday ? "cat-card-locked" : ""}`}
            onClick={() => isToday && onPick(c)}
            disabled={!isToday}
          >
            <span className="cat-name">{CATEGORY_LABEL[c]}</span>
            {isToday ? (
              <ArrowRight className="cat-arrow" />
            ) : isPast ? (
              <LockedTag />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScanScreen({ day, category, tab, setTab, onBack, onSimulate, idValue, setIdValue }) {
  const [scanning, setScanning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  const runScan = () => {
    if (scanning) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onSimulate();
    }, 900);
  };

  const runCheck = () => {
    if (checking || !idValue.trim()) return;
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setChecked(true);
    }, 600);
  };

  const handleIdChange = (e) => {
    setIdValue(e.target.value);
    if (checked) setChecked(false);
  };

  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <BackArrow />
        </button>
        <h1 className="scan-title">
          Day {String(day).padStart(2, "0")}, {CATEGORY_LABEL[category]}
        </h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === "qr" ? "tab-active" : ""}`}
          onClick={() => setTab("qr")}
        >
          QR
        </button>
        <button
          className={`tab ${tab === "id" ? "tab-active" : ""}`}
          onClick={() => setTab("id")}
        >
          ID
        </button>
      </div>

      {tab === "qr" ? (
        <div className="qr-pane">
          <div className="viewfinder">
            <span className="corner corner-tl" />
            <span className="corner corner-tr" />
            <span className="corner corner-bl" />
            <span className="corner corner-br" />
            {scanning && <span className="scan-line" />}
          </div>
          <p className="qr-help">Align the QR on the delegate's ID within the frame</p>
          <button className="demo-btn" onClick={runScan} disabled={scanning}>
            {scanning ? "Scanning…" : "Simulate scan (demo)"}
          </button>
        </div>
      ) : (
        <div className="id-pane">
          <label className="id-label" htmlFor="delegate-id">
            Delegate ID
          </label>
          <div className="id-row">
            <div className="id-input-wrap">
              <input
                id="delegate-id"
                className="id-input"
                placeholder="Enter unique ID"
                value={idValue}
                onChange={handleIdChange}
              />
              {checked && <Check className="id-check-icon" width="16" height="16" />}
            </div>
            <button
              className="check-btn"
              onClick={runCheck}
              disabled={!idValue.trim() || checking || checked}
            >
              {checking ? "Checking…" : "Check"}
            </button>
          </div>

          {checked && (
            <>
              <DelegatePreview />
              <button className="primary-btn confirm-entry-btn" onClick={onSimulate}>
                Confirm {CATEGORY_LABEL[category]} Entry
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ConfirmedScreen({ day, category, scans, onBackToCategories, onBackToScanner }) {
  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBackToCategories} aria-label="Back to categories">
          <BackArrow />
        </button>
      </div>

      <div className="confirm-block">
        <div className="check-circle">
          <Check />
        </div>
        <p className="confirm-title">Entry confirmed</p>
      </div>

      <DelegatePreview />

      <div className="table">
        <div className="table-row table-head">
          {[1, 2, 3].map((d) => (
            <div key={d} className={`table-cell head-cell ${d === day ? "col-active" : ""}`}>
              Day {d}
            </div>
          ))}
        </div>
        {["lunch", "highTea", "gala"].map((c) => (
          <div className="table-row" key={c}>
            {[1, 2, 3].map((d) => {
              const status = scans[d][c];
              const isCurrent = d === day && c === category;
              return (
                <div
                  key={d}
                  className={`table-cell ${d === day ? "col-active" : ""} ${
                    isCurrent ? "cell-current" : ""
                  }`}
                >
                  <span className="cell-label">{CATEGORY_LABEL[c]}</span>
                  <span className={`cell-value cell-${status}`}>
                    {status === "na"
                      ? "N/A"
                      : status === "confirmed"
                      ? "Confirmed"
                      : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <button className="primary-btn back-scan-btn" onClick={onBackToScanner}>
        Scan next
      </button>
    </div>
  );
}

const TODAY = 2;

export default function App() {
  const [day, setDay] = useState(TODAY);
  const [screen, setScreen] = useState("home");
  const [category, setCategory] = useState(null);
  const [tab, setTab] = useState("qr");
  const [idValue, setIdValue] = useState("");
  const [scans, setScans] = useState(INITIAL_SCANS);
  const [visit, setVisit] = useState(0);

  const pickCategory = (c) => {
    setCategory(c);
    setTab("qr");
    setIdValue("");
    setScreen("scan");
    setVisit((v) => v + 1);
  };

  const completeScan = () => {
    setScans((prev) => ({
      ...prev,
      [day]: { ...prev[day], [category]: "confirmed" },
    }));
    setScreen("confirmed");
  };

  const backToHome = () => {
    setScreen("home");
    setCategory(null);
  };

  const backToScanner = () => {
    setTab("qr");
    setIdValue("");
    setScreen("scan");
    setVisit((v) => v + 1);
  };

  return (
    <div className="wrap">
      <style>{`
        :root {
          --black: #0A0A0C;
          --white: #FFFFFF;
          --blue: #2F5CFF;
          --blue-dim: #E7ECFF;
          --grey-50: #F1F1F3;
          --grey-100: #F5F5F7;
          --grey-300: #DBDBDF;
          --grey-500: #8B8B93;
          --grey-700: #4A4A52;
        }

        .wrap {
          min-height: 100vh;
          width: 100%;
          background: var(--grey-50);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          font-family: Helvetica, Arial, sans-serif;
          box-sizing: border-box;
        }

        .wrap *, .wrap *::before, .wrap *::after {
          box-sizing: border-box;
        }

        .phone {
          width: 390px;
          max-width: 100%;
          min-height: 780px;
          background: var(--white);
          border-radius: 28px;
          border: 1px solid var(--grey-300);
          box-shadow: 0 20px 50px rgba(10,10,12,0.10);
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .screen {
          padding: 28px 24px 32px;
          flex: 1;
          display: flex;
          flex-direction: column;
          animation: fadein 0.25s ease;
        }

        @keyframes fadein {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* HOME */
        .topline {
          margin-bottom: 28px;
        }
        .mark {
          font-size: 13px;
          font-weight: 600;
          color: var(--blue);
          letter-spacing: 0.01em;
        }
        .mark-sub {
          font-size: 12px;
          color: var(--grey-500);
          margin-top: 2px;
        }

        .day-switch {
          display: flex;
          background: var(--grey-100);
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 32px;
        }
        .day-tab {
          flex: 1;
          border: none;
          background: transparent;
          padding: 9px 0;
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          color: var(--grey-700);
          border-radius: 9px;
          cursor: pointer;
        }
        .day-tab-active {
          background: var(--black);
          color: var(--white);
        }

        .day-heading {
          font-size: 40px;
          font-weight: 700;
          margin: 0;
          color: var(--black);
          line-height: 1.05;
        }
        .day-sub {
          font-size: 14px;
          color: var(--grey-500);
          margin: 8px 0 28px;
        }

        .cat-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cat-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--grey-100);
          border: 1px solid var(--grey-300);
          border-radius: 14px;
          padding: 20px 20px;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
        }
        .cat-card:hover {
          border-color: var(--black);
        }
        .cat-card-locked {
          cursor: default;
          opacity: 0.6;
        }
        .cat-card-locked:hover {
          border-color: var(--grey-300);
        }
        .cat-name {
          font-size: 17px;
          font-weight: 600;
          color: var(--black);
        }
        .cat-arrow {
          color: var(--grey-500);
        }
        .pill {
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 100px;
        }
        .pill-confirmed {
          background: var(--blue-dim);
          color: var(--blue);
        }
        .pill-pending {
          background: var(--grey-300);
          color: var(--grey-700);
        }

        /* SCAN SCREEN */
        .scan-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
        }
        .icon-btn {
          border: none;
          background: transparent;
          padding: 4px;
          margin: -4px;
          color: var(--black);
          cursor: pointer;
          display: flex;
        }
        .scan-title {
          font-size: 21px;
          font-weight: 600;
          color: var(--black);
          margin: 0;
        }

        .tabs {
          display: flex;
          background: var(--grey-100);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
        }
        .tab {
          flex: 1;
          border: none;
          background: transparent;
          padding: 10px 0;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: var(--grey-700);
          border-radius: 9px;
          cursor: pointer;
        }
        .tab-active {
          background: var(--white);
          color: var(--black);
          box-shadow: 0 1px 4px rgba(10,10,12,0.12);
        }

        .qr-pane {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 8px;
        }
        .viewfinder {
          width: 100%;
          aspect-ratio: 1 / 1;
          max-width: 280px;
          background: var(--black);
          border-radius: 18px;
          position: relative;
          overflow: hidden;
        }
        .corner {
          position: absolute;
          width: 26px;
          height: 26px;
          border: 3px solid var(--blue);
        }
        .corner-tl { top: 16px; left: 16px; border-right: none; border-bottom: none; border-top-left-radius: 6px; }
        .corner-tr { top: 16px; right: 16px; border-left: none; border-bottom: none; border-top-right-radius: 6px; }
        .corner-bl { bottom: 16px; left: 16px; border-right: none; border-top: none; border-bottom-left-radius: 6px; }
        .corner-br { bottom: 16px; right: 16px; border-left: none; border-top: none; border-bottom-right-radius: 6px; }
        .scan-line {
          position: absolute;
          left: 16px;
          right: 16px;
          height: 2px;
          background: var(--blue);
          box-shadow: 0 0 8px var(--blue);
          animation: sweep 0.9s ease-in-out infinite;
        }
        @keyframes sweep {
          0% { top: 16px; }
          50% { top: calc(100% - 18px); }
          100% { top: 16px; }
        }
        .qr-help {
          font-size: 13px;
          color: var(--grey-500);
          text-align: center;
          margin: 18px 0 22px;
          max-width: 260px;
        }
        .demo-btn {
          border: 1px dashed var(--grey-500);
          background: transparent;
          color: var(--grey-700);
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          padding: 12px 20px;
          border-radius: 10px;
          cursor: pointer;
        }
        .demo-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .id-pane {
          display: flex;
          flex-direction: column;
          flex: 1;
          margin-top: 8px;
        }
        .id-label {
          font-size: 13px;
          color: var(--grey-700);
          margin-bottom: 8px;
          font-weight: 500;
        }
        .id-row {
          display: flex;
          gap: 10px;
          margin-bottom: 22px;
        }
        .id-input-wrap {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }
        .id-input {
          width: 100%;
          font-family: inherit;
          font-size: 15px;
          padding: 14px 40px 14px 16px;
          border: 1px solid var(--grey-300);
          border-radius: 12px;
          outline: none;
        }
        .id-input:focus {
          border-color: var(--blue);
        }
        .id-check-icon {
          position: absolute;
          right: 14px;
          color: var(--blue);
          pointer-events: none;
        }
        .check-btn {
          background: var(--black);
          color: var(--white);
          border: none;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          padding: 0 20px;
          border-radius: 12px;
          cursor: pointer;
          white-space: nowrap;
        }
        .check-btn:disabled {
          background: var(--grey-300);
          color: var(--grey-500);
          cursor: default;
        }

        .confirm-entry-btn {
          margin-top: auto;
        }

        .primary-btn {
          background: var(--blue);
          color: var(--white);
          border: none;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          padding: 15px 0;
          border-radius: 12px;
          cursor: pointer;
        }
        .primary-btn:disabled {
          background: var(--grey-300);
          color: var(--grey-500);
          cursor: default;
        }

        /* CONFIRMED */
        .confirm-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 12px 0 28px;
        }
        .check-circle {
          color: var(--blue);
          margin-bottom: 14px;
        }
        .confirm-title {
          font-size: 22px;
          font-weight: 600;
          color: var(--black);
          margin: 0;
        }

        .delegate-block {
          margin-bottom: 26px;
        }
        .delegate-serial {
          font-family: inherit;
          font-size: 12px;
          color: var(--grey-500);
          margin: 0 0 10px;
          letter-spacing: 0.02em;
        }
        .delegate-tag {
          font-size: 12px;
          color: var(--grey-500);
          margin: 0 0 4px;
        }
        .delegate-name {
          font-size: 24px;
          font-weight: 700;
          color: var(--black);
          margin: 0 0 6px;
        }
        .delegate-role {
          font-size: 14px;
          color: var(--grey-700);
          margin: 0;
          line-height: 1.5;
        }

        .table {
          border: 1px solid var(--grey-300);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .table-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
        }
        .table-row + .table-row {
          border-top: 1px solid var(--grey-300);
        }
        .table-cell {
          padding: 12px 10px;
          border-right: 1px solid var(--grey-300);
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .table-cell:last-child {
          border-right: none;
        }
        .head-cell {
          font-size: 12px;
          font-weight: 600;
          color: var(--grey-700);
          background: var(--grey-100);
        }
        .col-active {
          background: var(--blue-dim);
        }
        .head-cell.col-active {
          background: var(--black);
          color: var(--white);
        }
        .cell-label {
          font-size: 11px;
          color: var(--grey-500);
        }
        .cell-value {
          font-size: 13px;
          font-weight: 600;
        }
        .cell-confirmed { color: var(--blue); }
        .cell-pending { color: var(--grey-700); }
        .cell-na { color: var(--grey-300); }
        .cell-current .cell-value {
          text-decoration: underline;
          text-decoration-color: var(--blue);
          text-underline-offset: 3px;
        }

        .back-scan-btn {
          margin-top: auto;
        }
      `}</style>

      <div className="phone">
        {screen === "home" && (
          <HomeScreen day={day} setDay={setDay} today={TODAY} onPick={pickCategory} />
        )}
        {screen === "scan" && (
          <ScanScreen
            key={`scan-${visit}`}
            day={day}
            category={category}
            tab={tab}
            setTab={setTab}
            onBack={backToHome}
            onSimulate={completeScan}
            idValue={idValue}
            setIdValue={setIdValue}
          />
        )}
        {screen === "confirmed" && (
          <ConfirmedScreen
            day={day}
            category={category}
            scans={scans}
            onBackToCategories={backToHome}
            onBackToScanner={backToScanner}
          />
        )}
      </div>
    </div>
  );
}
