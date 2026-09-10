import React, { useState } from "react";

const CATEGORY_LABEL = {
  conferenceKit: "Conference Kit",
  lunch: "Lunch",
  highTea: "High Tea",
  gala: "Gala Dinner",
};

const DAY_CATEGORIES = {
  1: ["conferenceKit", "lunch", "highTea"],
  2: ["lunch", "highTea"],
  3: ["lunch", "highTea", "gala"],
};

const INITIAL_SCANS = {
  1: { conferenceKit: "confirmed", lunch: "confirmed", highTea: "confirmed", gala: "na" },
  2: { conferenceKit: "na", lunch: "confirmed", highTea: "pending", gala: "na" },
  3: { conferenceKit: "na", lunch: "pending", highTea: "pending", gala: "pending" },
};

const CATEGORY_CAPACITY = 300;

const DAY_SCAN_COUNTS = {
  1: { conferenceKit: 284, lunch: 276, highTea: 251 },
  2: { lunch: 198, highTea: 142 },
  3: { lunch: 0, highTea: 0, gala: 0 },
};

const SHORT_LABEL = {
  conferenceKit: "Kit",
  lunch: "Lunch",
  highTea: "Tea",
  gala: "Gala",
};

const ATTENDEES = [
  {
    id: "IND-2026-0842",
    name: "Jane Doe",
    designation: "HOD, Dept. of Design, IIT Guwahati",
    status: {
      1: { conferenceKit: "confirmed", lunch: "confirmed", highTea: "confirmed" },
      2: { lunch: "confirmed", highTea: "pending" },
      3: { lunch: "pending", highTea: "pending", gala: "pending" },
    },
  },
  {
    id: "IND-2026-0119",
    name: "Arjun Mehta",
    designation: "Assoc. Professor, NID Ahmedabad",
    status: {
      1: { conferenceKit: "confirmed", lunch: "confirmed", highTea: "pending" },
      2: { lunch: "confirmed", highTea: "confirmed" },
      3: { lunch: "pending", highTea: "pending", gala: "pending" },
    },
  },
  {
    id: "IND-2026-0284",
    name: "Priya Nair",
    designation: "PhD Scholar, IISc Bengaluru",
    status: {
      1: { conferenceKit: "confirmed", lunch: "pending", highTea: "pending" },
      2: { lunch: "pending", highTea: "pending" },
      3: { lunch: "pending", highTea: "pending", gala: "pending" },
    },
  },
  {
    id: "IND-2026-0537",
    name: "Rohan Iyer",
    designation: "UX Lead, Contineu",
    status: {
      1: { conferenceKit: "confirmed", lunch: "confirmed", highTea: "confirmed" },
      2: { lunch: "confirmed", highTea: "confirmed" },
      3: { lunch: "confirmed", highTea: "pending", gala: "pending" },
    },
  },
  {
    id: "IND-2026-0662",
    name: "Ananya Reddy",
    designation: "Design Director, PeepalDesign",
    status: {
      1: { conferenceKit: "confirmed", lunch: "confirmed", highTea: "pending" },
      2: { lunch: "pending", highTea: "pending" },
      3: { lunch: "pending", highTea: "pending", gala: "pending" },
    },
  },
  {
    id: "IND-2026-0771",
    name: "Karthik Subramaniam",
    designation: "Student, MDes, IIT Guwahati",
    status: {
      1: { conferenceKit: "confirmed", lunch: "confirmed", highTea: "confirmed" },
      2: { lunch: "confirmed", highTea: "confirmed" },
      3: { lunch: "pending", highTea: "pending", gala: "pending" },
    },
  },
];


const DELEGATE = {
  serial: "IND-2026-0842",
  name: "Jane Doe",
  role: "HOD, Department of Design",
  college: "IIT Guwahati",
};

function BackArrow(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Check(props) {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XMark(props) {
  return (
    <svg width="46" height="46" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeft(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExportIcon(props) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3v11M12 3L8 7M12 3l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function KitIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function LunchIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 3v7a2.5 2.5 0 0 0 5 0V3M8.5 3v7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 3c-1.7 0-3 2-3 4.5S15.3 12 17 12M17 3v18M17 3c1.7 0 3 2 3 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 10v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TeaIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M17 10.5h1.5a2.5 2.5 0 0 1 0 5H17" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3.5c0 1-1 1-1 2s1 1 1 2M12 3.5c0 1-1 1-1 2s1 1 1 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function GalaIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 3c0 4 2.5 6 6 6s6-2 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 9v8M9 21h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 3h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const CATEGORY_ICON = {
  conferenceKit: KitIcon,
  lunch: LunchIcon,
  highTea: TeaIcon,
  gala: GalaIcon,
};

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

function DayTab({ d, isActive, isPast, onClick }) {
  return (
    <button
      className={`day-tab ${isActive ? "day-tab-active" : ""} ${isPast ? "day-tab-past" : ""}`}
      onClick={onClick}
    >
      Day {d}
    </button>
  );
}

function HomeScreen({ day, setDay, today, categoryEnabled, onPick }) {
  const cats = DAY_CATEGORIES[day];
  const isToday = day === today;
  const isPast = day < today;

  return (
    <div className="screen home">
      <div className="tab-row-wrap day-switch-wrap">
        <div className="day-switch">
          {[1, 2, 3].map((d) => (
            <DayTab key={d} d={d} isActive={d === day} isPast={d < today} onClick={() => setDay(d)} />
          ))}
        </div>
        <div className="tab-row-baseline" />
      </div>

      <h1 className="day-heading">Day {String(day).padStart(2, "0")}</h1>

      <div className="cat-list">
        {cats.map((c) => {
          const Icon = CATEGORY_ICON[c];
          const enabled = categoryEnabled[day][c];
          const clickable = isToday && enabled;
          return (
            <button
              key={c}
              className={`cat-card ${!clickable ? "cat-card-locked" : ""}`}
              onClick={() => clickable && onPick(c)}
              disabled={!clickable}
            >
              <span className="cat-icon">
                <Icon />
              </span>
              <span className="cat-name">{CATEGORY_LABEL[c]}</span>
              {isToday && !enabled ? (
                <span className="pill pill-closed">Paused</span>
              ) : isToday ? (
                <ArrowRight className="cat-arrow" />
              ) : isPast ? (
                <span className="pill pill-closed">Closed</span>
              ) : (
                <LockIcon className="cat-lock" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScanScreen({ day, category, tab, setTab, onBack, onSimulate, idValue, setIdValue }) {
  const [scanning, setScanning] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notFound, setNotFound] = useState(false);

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
      const found = idValue.trim().toLowerCase() !== "0000";
      if (found) {
        setNotFound(false);
        onSimulate();
      } else {
        setNotFound(true);
      }
    }, 700);
  };

  const handleIdChange = (e) => {
    setIdValue(e.target.value);
    if (notFound) setNotFound(false);
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

      <div className="tab-row-wrap">
        <div className="tabs">
          <button className={`tab ${tab === "qr" ? "tab-active" : ""}`} onClick={() => setTab("qr")}>
            QR
          </button>
          <button className={`tab ${tab === "id" ? "tab-active" : ""}`} onClick={() => setTab("id")}>
            ID
          </button>
        </div>
        <div className="tab-row-baseline" />
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
          <div className="id-action-group">
            <div className="id-row">
              <div className="id-input-wrap">
                <input
                  id="delegate-id"
                  className="id-input"
                  placeholder="Enter unique ID"
                  value={idValue}
                  onChange={handleIdChange}
                />
              </div>
              <button className="check-btn" onClick={runCheck} disabled={!idValue.trim() || checking}>
                {checking ? "Checking…" : "Check"}
              </button>
            </div>

            {notFound ? (
              <div className="id-error-box">
                <XMark width="16" height="16" className="id-error-icon" />
                <p className="id-error-text">ID not found, Check again or try scanning QR again.</p>
              </div>
            ) : (
              <p className="id-demo-hint">(demo: enter "0000" to preview the not-found state)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmedScreen({ day, category, confirmedAt, onBackToCategories, onBackToScanner }) {
  const timeLabel = confirmedAt
    ? confirmedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";
  return (
    <div className="screen">
      <div className="scan-header">
        <button className="icon-btn" onClick={onBackToCategories} aria-label="Back to categories">
          <BackArrow />
        </button>
      </div>

      <div className="confirm-block">
        <div className="check-circle">
          <Check width="30" height="30" />
        </div>
        <p className="confirm-context">
          Day {day}, {CATEGORY_LABEL[category]}
        </p>
        <p className="confirm-title">Entry confirmed</p>
        {timeLabel && <p className="confirm-time">at {timeLabel}</p>}
      </div>

      <div className="delegate-card">
        <DelegatePreview />
      </div>

      <button className="primary-btn confirm-back-btn" onClick={onBackToScanner}>
        Scan next
      </button>
    </div>
  );
}

function PasswordGate({ tabLabel, onUnlock }) {
  const [pw, setPw] = useState("");
  const submit = () => {
    if (!pw.trim()) return;
    onUnlock();
  };
  return (
    <div className="screen gate">
      <div className="gate-icon">
        <LockIcon width="26" height="26" />
      </div>
      <h1 className="confirm-title">{tabLabel} access</h1>
      <p className="qr-help gate-sub">
        Enter the password to continue. You'll only be asked once per session.
      </p>
      <input
        className="id-input gate-input"
        type="password"
        placeholder="Password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button className="primary-btn gate-btn" disabled={!pw.trim()} onClick={submit}>
        Unlock
      </button>
      <p className="gate-demo">(demo: any password works)</p>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "toggle-on" : ""}`}
      onClick={onChange}
      aria-pressed={checked}
      aria-label={label}
    >
      <span className="toggle-knob" />
    </button>
  );
}

function StatusDot({ status }) {
  if (status === "confirmed") {
    return <Check className="attendee-status-yes" width="14" height="14" />;
  }
  return <span className="attendee-status-no">—</span>;
}

function AdminScreen({
  adminDay,
  onChangeAdminDay,
  categoryEnabled,
  onToggleCategory,
  onToggleMaster,
  attendeeTab,
  onSetAttendeeTab,
}) {
  const dayCats = DAY_CATEGORIES[adminDay];
  const masterOn = dayCats.every((c) => categoryEnabled[adminDay][c]);

  const columns = attendeeTab === "all" ? ["conferenceKit", "lunch", "highTea", "gala"] : DAY_CATEGORIES[attendeeTab];

  const cellValue = (attendee, col) => {
    if (attendeeTab === "all") {
      const daysWithCol = [1, 2, 3].filter((d) => DAY_CATEGORIES[d].includes(col));
      if (daysWithCol.length === 0) return null;
      const confirmedCount = daysWithCol.filter((d) => attendee.status[d][col] === "confirmed").length;
      return <span className="attendee-fraction">{confirmedCount}/{daysWithCol.length}</span>;
    }
    const status = attendee.status[attendeeTab][col];
    if (status === undefined) return null;
    return <StatusDot status={status} />;
  };

  const handleExport = () => {
    const header = ["ID", "Name", "Designation", ...columns.map((c) => SHORT_LABEL[c])];
    const lines = [header.join(",")];
    ATTENDEES.forEach((a) => {
      const row = [
        a.id,
        a.name,
        `"${a.designation}"`,
        ...columns.map((c) => {
          if (attendeeTab === "all") {
            const daysWithCol = [1, 2, 3].filter((d) => DAY_CATEGORIES[d].includes(c));
            const confirmedCount = daysWithCol.filter((d) => a.status[d][c] === "confirmed").length;
            return `${confirmedCount}/${daysWithCol.length}`;
          }
          const status = a.status[attendeeTab][c];
          return status === "confirmed" ? "Confirmed" : status === "pending" ? "Pending" : "";
        }),
      ];
      lines.push(row.join(","));
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `indis-attendees-${attendeeTab === "all" ? "all" : "day" + attendeeTab}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="screen admin-screen">
      <div className="admin-section-head">
        <h2 className="admin-h2">Categories</h2>
        <div className="admin-day-nav">
          <button
            className="icon-circle-btn"
            onClick={() => onChangeAdminDay(-1)}
            disabled={adminDay === 1}
            aria-label="Previous day"
          >
            <ChevronLeft />
          </button>
          <button
            className="icon-circle-btn"
            onClick={() => onChangeAdminDay(1)}
            disabled={adminDay === 3}
            aria-label="Next day"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className="admin-cat-table">
        <div className="admin-cat-day-row">
          <span>DAY {String(adminDay).padStart(2, "0")}</span>
          <Toggle checked={masterOn} onChange={() => onToggleMaster(adminDay)} label="Toggle all categories" />
        </div>
        {dayCats.map((c) => (
          <div className="admin-cat-row" key={c}>
            <span className="admin-cat-name">{CATEGORY_LABEL[c]}</span>
            <span className="admin-cat-count">
              {DAY_SCAN_COUNTS[adminDay][c]}/{CATEGORY_CAPACITY}
            </span>
            <Toggle
              checked={categoryEnabled[adminDay][c]}
              onChange={() => onToggleCategory(adminDay, c)}
              label={`Toggle ${CATEGORY_LABEL[c]}`}
            />
          </div>
        ))}
      </div>

      <div className="admin-section-head admin-attendees-head">
        <h2 className="admin-h2">Attendees</h2>
        <button className="export-btn" onClick={handleExport}>
          <ExportIcon />
          Export All
        </button>
      </div>

      <div className="tab-row-wrap">
        <div className="tabs admin-attendee-tabs">
          <button className={`tab ${attendeeTab === "all" ? "tab-active" : ""}`} onClick={() => onSetAttendeeTab("all")}>
            All
          </button>
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              className={`tab ${attendeeTab === d ? "tab-active" : ""}`}
              onClick={() => onSetAttendeeTab(d)}
            >
              Day {String(d).padStart(2, "0")}
            </button>
          ))}
        </div>
        <div className="tab-row-baseline" />
      </div>

      <div className="attendee-table-wrap">
        <div className="attendee-table">
          <div className="attendee-row attendee-head">
            <span className="cell-id">ID</span>
            <span className="cell-name">Name</span>
            <span className="cell-desig">Designation</span>
            {columns.map((c) => (
              <span className="cell-cat" key={c}>
                {SHORT_LABEL[c]}
              </span>
            ))}
          </div>
          <div className="attendee-body">
            {ATTENDEES.map((a) => (
              <div className="attendee-row" key={a.id}>
                <span className="cell-id">{a.id}</span>
                <span className="cell-name">{a.name}</span>
                <span className="cell-desig">{a.designation}</span>
                {columns.map((c) => (
                  <span className="cell-cat" key={c}>
                    {cellValue(a, c)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const TODAY = 2;

export default function App() {
  const [mainTab, setMainTab] = useState("volunteer");
  const [unlocked, setUnlocked] = useState({ volunteer: false, admin: false });
  const [day, setDay] = useState(TODAY);
  const [screen, setScreen] = useState("home");
  const [category, setCategory] = useState(null);
  const [tab, setTab] = useState("qr");
  const [idValue, setIdValue] = useState("");
  const [scans, setScans] = useState(INITIAL_SCANS);
  const [visit, setVisit] = useState(0);
  const [confirmedAt, setConfirmedAt] = useState(null);
  const [categoryEnabled, setCategoryEnabled] = useState({
    1: { conferenceKit: true, lunch: true, highTea: true },
    2: { lunch: true, highTea: true },
    3: { lunch: true, highTea: true, gala: true },
  });
  const [adminDay, setAdminDay] = useState(1);
  const [attendeeTab, setAttendeeTab] = useState("all");

  const unlockTab = (t) => setUnlocked((prev) => ({ ...prev, [t]: true }));

  const toggleCategory = (d, cat) => {
    setCategoryEnabled((prev) => ({
      ...prev,
      [d]: { ...prev[d], [cat]: !prev[d][cat] },
    }));
  };

  const toggleMasterForDay = (d) => {
    setCategoryEnabled((prev) => {
      const cats = DAY_CATEGORIES[d];
      const allOn = cats.every((c) => prev[d][c]);
      const updated = { ...prev[d] };
      cats.forEach((c) => {
        updated[c] = !allOn;
      });
      return { ...prev, [d]: updated };
    });
  };

  const changeAdminDay = (delta) => {
    const next = Math.min(3, Math.max(1, adminDay + delta));
    setAdminDay(next);
    if (attendeeTab !== "all") setAttendeeTab(next);
  };

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
    setConfirmedAt(new Date());
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
        @font-face {
          font-family: 'Nohemi';
          src: url(data:font/ttf;base64,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AQoBCgC7AQwBDAC8AQ4BDgC9AREBEQC+ARMBHAC/AR4BJADJASYBJgDQASgBKgDRASwBMgDUATUBYADbAAEABAFdABAAAAAcAA8ADwATABsAFAAyABAANgAvACgAOwARADUAHQAQAA0AIQAOABIAHgAiAA8ADwAVAAkAAQAAACsAAAAjACwAPAA3AD0AKgAAACkAKQApACMABwACAAIABgAIAAMAMAAFACAABAAxAAkAFgAXAAAAOAAZAAAAAAAYADkAOgAfAB8AAAAAAAAAGgAAAAAAAAAfAAAAAAAAACcAJwAAACQAMgAQAAAAAAAKAAAANAAAAAAANAAAAAsADAALAAwACQAJAAAAAAAfAB8AAAAAAAAAAAAQAAAAPAAAACIAAAAfAB8AHwAfAAAACQAAACYAJQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAEAAsABEAAAAcABwAPQA9ABAAAQANAA0ADQANAA0ADQAQAAAAOwA7ABwAHAAcABwADwAPAA8ADwATAAAADwAQABAAEAAQABAAMgAvAC8ALwAvACIAIgAVACoAKgAqACoAKgAqADwAAAAAAD0APQA9AD0AAgACAAIAAgAAAAAAKQABAAEAAQABAAEANwAjACMAIwAjADEAMQAEAA0AKgANACoADQAqABAAPAAQADwAEAA8ABAAPAA7AC0AHAA9ABwAPQAcAD0AHAA9ABwAPQA2AAAANgAAADYAAAA2AAAAAAApAAAAKQAPAAIADwACAA8AAgAPAAIADwAAAAIAKAACABIABQAFABMAAAATAAAAEwAzABMAAAAPACkADwApAA8AKQApAAAAAAAQAAEAEAABABAAAQA1AAcANQAHADUABwAyADcAMgA3ADIANwAUAAgAFAAuABQACAAvACMALwAjAC8AIwAvACMALwAjAC8AIwAOADAAIgAxABUABAAVAAQAAQAEAV0AGwARACgAKAAoACgAKAAcACYAGwAbACcAJAAoACgAKAAoABsAHQAgABoAKAAfACEAKAAoACUADwAOADQANAASABUAGQAOAA0ADgAKABMAGQA0ABkAFwAZACsAIwADAAQAAQALADQABwACAAwADwAtAC4AMAAxACoALwAzAB4AIgAy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CywACwAvQCwAAQACAwECZwAAAAVfBgEFBR5NAAMDBF8ABAQfBE4AAAALAAsREREREQcIGysBESERIREhESERIREIPPpsBR764gW6+DgLLP4w/Rj+Pv0e/jALLAAAAQCaAAACqAssAAMAE0AQAAEBHk0AAAAfAE4REAIIGCspAREhAqj98gIOCywAAAAAAQCaAAAKDgssAAsAIUAeAAQAAQAEAWcFAQMDHk0CAQAAHwBOEREREREQBggcKykBESERIREhESERIQoO/fL6qP3yAg4FWAIOBKr7Vgss+1AEsAAAAQCaAAAIEgssAAUAH0AcAwECAh5NAAAAAWAAAQEfAU4AAAAFAAUREQQIGCsBESERIRECqAVq+IgLLPak/jALLAAAAAABAJoAAAg8CywACQAjQCAAAQACAwECZwAAAARfAAQEHk0AAwMfA04REREREAUIGysBIREhESERIREhCDz6bAUe+uL98geiCVz88P44+3wLLAAAAAABACIAAAl0CywABwAbQBgCAQAAA18AAwMeTQABAR8BThERERAECBorASERIREhESEJdPxe/fL8XglSCVz2pAlcAdAAAAEATv/ECgMLaABJADtAOAABAgQCAQSAAAQFAgQFfgACAgBhBgEAACZNAAUFA2EAAwMnA04BADAuKiklIwwKBgUASQFJBwgWKwEgDAESFSE0LgIjIg4EFRQeAQQfARYEHgMVFAIMASEgLAECNSEUHgEEMzIkPgE1NC4CLwEuBzU0PgIsAQUYAQoBrAEuo/4EX63yk1KgknxbM16xAQKjhXgBAPPZo1+y/r3+PP7t/tX+Lf6+qQH8aMEBE6yTAQTDcV6u9JaoWr67sp+GYTZUmNcBBQEuC2iC8/6i23K3gUUWLkVddkdheE0wGBQSLUlxrPKm4P6v4XGD+AFo5XrChkc2b6pzaoJQLRYZDR4qOVJuk7t2kvXGlWQzAAAAAQB8/8QK7QtoACkAMEAtAAQFAQUEAYAAAQAFAQB+AAUFA2EAAwMmTQAAAAJhAAICJwJOIhQsJBIkBggcKwEUGgEEMyAAEyEKAQAEISIsAQoCNTQaAiwBMyAEABITIQIAISIECgECjHLYATnHAUEBiEICDCvd/rD+R/75yv6Y/s/yqlpaqvIBMQFoygEHAbkBUN0r/fRC/nj+v8f+x9hyBZbz/oP++YkBbAFo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DkEQIgAGAAARAwCbAzQCywAJsQEBuALLsDUrAP//AJoAAAhiDkEQIgAGAAARAwCYAd4CywAJsQEBuALLsDUrAP//AJoAAAhiDdcQIgAGAAARAwCdAbkCywAJsQECuALLsDUrAP///0IAAAKoDkEQIgAHAAARAwCc/qgCywAJsQEBuALLsDUrAP//AJoAAAKoDkEQIgAHAAARAwCbAGMCywAJsQEBuALLsDUrAP///6cAAAObDkEQIgAHAAARAwCY/w0CywAJsQEBuALLsDUrAP///4MAAAO/DdcQIgAHAAARAwCd/ukCywAJsQECuALLsDUrAP///5YAAAgSCywQIgAJAAARAwC+/vv/OQAJsQEBuP85sDUrAAABAJsEJwY/CB0AAwAGswMBATIrCQERAQY/+lwFpAaz/XQBagKMAAD//wCaAAAKrQ3uECIAHQAAEQMASQLwApsACbEBAbgCm7A1KwD//wB8/8QLMA5BECIABAAAEQMAnALbAssACbECAbgCy7A1KwD//wB8/8QLMA5BECIABAAAEQMAmwSWAssACbECAbgCy7A1KwD//wB8/8QLMA5BECIABAAAEQMAmANAAssACbECAbgCy7A1KwD//wB8/8QLMA4eECIABAAAEQMASQMhAssACbECAbgCy7A1KwD//wB8/8QLMA3XECIABAAAEQMAnQMcAssACbECArgCy7A1KwD//wBO/8QKAw5BECIADAAAEQMAmQKJAssACbEBAbgCy7A1KwD//wCa/8QKPg5BECIADwAAEQMAnAJzAssACbEBAbgCy7A1KwD//wCa/8QKPg5BECIADwAAEQMAmwQuAssACbEBAbgCy7A1KwD//wCa/8QKPg5BECIADwAAEQMAmALYAssACbEBAbgCy7A1KwD//wCa/8QKPg3XECIADwAAEQMAnQK0AssACbEBArgCy7A1KwD//wAJAAAKng3XECIAGwAAEQMAnQKbAssACbEBArgCy7A1KwD//wAJAAAKng5BECIAGwAAEQMAmwQVAssACbEBAbgCy7A1KwD//wCaAAAJSw5BECIAHgAAEQMAmQJLAssACbEBAbgCy7A1KwD//wBU/8QIwAuyECIAKQAAEQMAnAGkADwACLECAbA8sDUrAAD//wBU/8QIwAuyECIAKQAAEQMAmwNfADwACLECAbA8sDUrAAD//wBU/8QIwAuyECIAKQAAEQMAmAIJADwACLECAbA8sDUrAAD//wBU/8QIwAuPECIAKQAAEQMASQHqADwACLECAbA8sDUrAAD//wBU/8QIwAtIECIAKQAAEQMAnQHlADwACLECArA8sDUrAAD//wBU/8QIwAyaECIAKQAAEQMAlgJLADwACLECArA8sDUrAAD//wBg/PQIuQjZECIAJgAAEAMAngM9AAD//wBg/8QJ5guQECIAIwAAEQMA1QPYB3UACbECAbgHdbA1KwAAAQCbAcYGDgMaAAMAGEAVAAEAAAFXAAEBAF8AAAEATxEQAgcYKwEhESEGDvqNBXMBxgFU//8AYP/ECMALshAiACgAABEDAJwBpQA8AAixAgGwPLA1KwAA//8AYP/ECMALshAiACgAABEDAJsDYAA8AAixAgGwPLA1KwAA//8AYP/ECMALshAiACgAABEDAJgCCwA8AAixAgGwPLA1KwAA//8AYP/ECMALSBAiACgAABEDAJ0B5gA8AAixAgKwPLA1KwAA////YAAAAroLshAiAJoAABEDAJz+xgA8AAixAQGwPLA1KwAA//8AxAAAAroLshAiAJoAABEDAJsAgQA8AAixAQGwPLA1KwAA////xQAAA7kLshAiAJoAABEDAJj/KwA8AAixAQGwPLA1KwAA////oQAAA90LSBAiAJoAABEDAJ3/BwA8AAixAQKwPLA1KwAA////ewAAA64LkBAiACEAABEDAN/+4QJHAAmxAQG4AkewNSsAAAEAmgFIBM0EhgADAAazAwEBMisJAREBBM37zQQzAy3+GwFYAeYAAP//AJAAAAiiC48QIgArAAARAwBJAeYAPAAIsQEBsDywNSsAAP//AGD/xAj0C7IQIgAgAAARAwCcAbEAPAAIsQIBsDywNSsAAP//AGD/xAj0C7IQIgAgAAARAwCbA2wAPAAIsQIBsDywNSsAAP//AGD/xAj0C7IQIgAgAAARAwCYAhYAPAAIsQIBsDywNSsAAP//AGD/xAj0C48QIgAgAAARAwBJAfcAPAAIsQIBsDywNSsAAP//AGD/xAj0C0gQIgAgAAARAwCdAfIAPAAIsQICsDywNSsAAP//AEn/xAhPC7IQIgAnAAARAwCZAaIAPAAIsQEBsDywNSsAAP//AIb/xAiYC7IQIgAuAAARAwCcAZYAPAAIsQEBsDyw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/8QI9ArYECIAIAAAEQMAawH4ADAACLECAbAwsDUrAAD//wB8/8QLMA4nECIABAAAEQMAlAM2AssACbECAbgCy7A1KwD//wBg/8QI9AuYECIAIAAAEQMAlAILADwACLECAbA8sDUrAAD//wB8/8QLMA5BECIABAAAEQMBbQNWAssACbECArgCy7A1KwD//wBg/8QI9AuyECIAIAAAEQMBbQIrADwACLECArA8sDUrAAD//wCaAAAKRw5BECIAEwAAEQMAmwNmAssACbECAbgCy7A1KwD//wCQAAAGFguyECIALwAAEQMAmwIiADwACLEBAbA8sDUrAAD//wCa/OwKRwssECIAEwAAEAMBYwNGAAD//wA//OwGFgidECIALwAAEAIBY6UAAAD//wCaAAAKRw5BECIAEwAAEQMAmQIRAssACbECAbgCy7A1KwD//wCQAAAGFguyECIALwAAEQMAmQDOADwACLEBAbA8sDUrAAD//wBO/8QKAw5BECIADAAAEQMAmwPeAssACbEBAbgCy7A1KwD//wBJ/8QITwuyECIAJwAAEQMAmwL3ADwACLEBAbA8sDUrAAD//wBO/8QKAw5BECIADAAAEQMAmAKIAssACbEBAbgCy7A1KwD//wBJ/8QITwuyECIAJwAAEQMAmAGhADwACLEBAbA8sDUrAAD//wBO/PQKAwtoECIADAAAEAMAngPYAAD//wBJ/PQITwjZECIAJwAAEAMAngLzAAD//wAi/PQJdAssECIACwAAEAMAngNdAAD//wBA/PQGAAqZECIAMwAAEAMAngJNAAD//wAiAAAJdA5BECIACwAAEQMAmQI6AssACbEBAbgCy7A1KwD//wBA/8UGQAzWECIAMwAAEQMBYgOnDOoACbEBAbgM6rA1KwD//wAiAAAJdAssECIACwAAEQMBewDcAekACbEBAbgB6bA1KwD//wA9/8UGAAqZECIAMwAAEQMBZv+jAcsACbEBAbgBy7A1KwD//wCa/8QKPg4eECIADwAAEQMASQK5AssACbEBAbgCy7A1KwD//wCG/8QImAuPECIALgAAEQMASQHcADwACLEBAbA8sDUrAAD//wCa/8QKPg1nECIADwAAEQMAawK6Ar8ACbEBAbgCv7A1KwD//wCG/8QImArYECIALgAAEQMAawHdADAACLEBAbAwsDUrAAD//wCa/8QKPg4nECIADwAAEQMAlALNAssACbEBAbgCy7A1KwD//wCG/8QImAuYECIALgAAEQMAlAHwADwACLEBAbA8sDUrAAD//wCa/8QKPg8pECIADwAAEQMAlgMaAssACbEBArgCy7A1KwD//wCG/8QImAyaECIALgAAEQMAlgI9ADwACLEBArA8sDUrAAD//wCa/8QKPg5BECIADwAAEQMBbQLtAssACbEBArgCy7A1KwD//wCG/8QImAuyECIALgAAEQMBbQIQADwACLEBArA8sDUrAAD//wCa/T4KPgssECIADwAAEQMBfAO4ADsACLEBAbA7sDUrAAD//wCG/T4InQidECIALgAAEQMAlwU0ADsACLEBAbA7sDUrAAD//wBeAAAQrw5BECIAGAAAEQMAmAXyAssACbEBAbgCy7A1KwD//wA2AAAONQuyECIANQAAEQMAmASiADwACLEBAbA8sDUrAAD//wAJAAAKng5BECIAGwAAEQMAmAK/AssACbEBAbgCy7A1KwD//wAo/M4I9wuCECIAOQAAEQMAmAH7AAwACLEBAbAMsDUrAAD//wCaAAAJSw5BECIAHgAAEQMAmwOgAssACbEBAbgCy7A1KwD//wBjAAAH8wuCECIAOAAAEQMAmwLmAAwACLEBAbAMsDUrAAD//wCaAAAJSw3XECIAHgAAEQMAlQNiAssACbEBAbgCy7A1KwD//wBjAAAH8wsYECIAOAAAEQMAlQKoAAwACLEBAbAMsDUrAAD//wCaAAALuQssEAIAAAAAAAEAmvw1Apn/7AADABhAFQABAAABVwABAQBfAAABAE8REAIIGCsBIRMhAfH+qU8BsPw1A7cAAAAAAQCa/OwCtP9qAAMALUuwMVBYQAsAAQEAXwAAACMAThtAEAABAAABVwABAQBfAAABAE9ZtBEQAggYKwEhEyEB0v7IVgHE/OwCfgAAAAEAmwCrArUDKQADABhAFQAAAQEAVwAAAAFfAAEAAU8REAIIGCsBIQMhAX0BOFb+PAMp/YIAAAAAAf7P/M4CjQidABEAMEuwMVBYQBAAAgIhTQABAQBhAAAAKwBOG0ANAAEAAAEAZQACAiECTlm1FyEkAwgZKyUUAgYEKwERMzI+BDURIQKNadr+seVHQF+EVzEYBQH2e/P+nedwAa8uTGJqai0IQwAAAAEAmgIxBi4DdAADABhAFQABAAABVwABAQBfAAABAE8REAIIGCsBIREhBi76bAWUAjEBQwABAJv9AwORALYAGQA6QAsMAQEAAUwLAAIASkuwMVBYQAsAAAABYQABASMBThtAEAAAAQEAWQAAAAFhAAEAAVFZtDQnAggYKyUOAxUUFjMyNjcRDgEjIi4CNTQ+AjcC0ENvTyyYmCxeNDt0MXvFi0tKi8h+iy1pbWswWlUHB/7GCAczXodUUZuRikAAAAEAmgH0C+oDWAADABhAFQABAAABVwABAQBfAAABAE8REAIIGCsBIREhC+r0sAtQAfQBZAABAJsJMgJeCwwAAwATQBAAAAABXwABAR4AThEQAggYKwEhESECXv49AcMJMgHaAP//AHz/xAswDkEQIgCpAAARAwCbBJYCywAJsQMBuALLsDUrAP//AE787AoDC2gQIgAMAAAQAwFjA3AAAP//ACL87Al0CywQIgALAAAQAwFjAvUAAAACAJoI9wVUC3YAAwAHADKxBmREQCcCAQABAQBXAgEAAAFfBQMEAwEAAU8EBAAABAcEBwYFAAMAAxEGCBcrsQYARBsBIQEhEyEBmtYBqP68AQLWAaj+vAj3An/9gQJ//YEAAAD//wBeAAAQrw5BECIAGAAAEQMAmwdIAssACbEBAbgCy7A1KwD//wBeAAAQrw5BECIAGAAAEQMAnAWNAssACbEBAbgCy7A1KwD//wBeAAAQrw3XECIAGAAAEQMAnQXOAssACbEBArgCy7A1KwD//wAJAAAKng5BECIAGwAAEQMAnAJaAssACbEBAbgCy7A1KwD//wATAAAOKg5BECIApQAAEQMAmwhDAssACbECAbgCy7A1KwD//wBU/8QPKguyECIApwAAEQMAmwaBADwACLEDAbA8sDUrAAD//wBg/8QI9AuyECIAqgAAEQMAmwNsADwACLEDAbA8sDUrAAD//wBJ/OwITwjZECIAJwAAEAMBYwKLAAD//wBA/OwGAAqZECIAMwAAEAMBYwHlAAD//wA2AAAONQuyECIANQAAEQMAmwX3ADwACLEBAbA8sDUrAAD//wA2AAAONQuyECIANQAAEQMAnAQ8ADwACLEBAbA8sDUrAAD//wA2AAAONQtIECIANQAAEQMAnQR9ADwACLEBArA8sDUrAAD//wAo/M4I9wuCECIAOQAAEQMAnAGVAAwACLEBAbAMsDUrAAAAAQCaAocHRwPrAAMAGEAVAAEAAAFXAAEBAF8AAAEATxEQAggYKwEhESEHR/lTBq0ChwFkAAEAjf0DA1v/7QAZAEdACgsBAQAMAQIBAkxLsDFQWEAVAAMDAGEAAAAnTQABAQJhAAICIwJOG0ASAAEAAgECZQADAwBhAAAAJwBOWbYYNCYQBAgaKwUiDgIVFBYzMjY3EQ4BIyIuAjU0PgI3A1RRoX9PlIUpVi84bzBwuoRJabn+lTsuSl0uP0UHB/7GCAcvVnhKWJhwQQIAAQAAAAEAAEUAnqVfDzz1AA8PoAAAAADhMsBEAAAAAOEzDpX+z/w1E2UNIAAAAAYAAgAAAAAAAAABAAALkP0KASwT//7P/fQTZQABAAAAAAAAAAAAAAAAAAABfQxTAJoAAAAAAfQAAAOUAAALrQB8A2gAKgivAJoDQwCaCqgAmghcAJoIiQCaCZYAIgpRAE4LegB8C6kAfArYAJoJuwBNCqgAmgqVAJoKpQCaCnUAmgusAHwLEgATCroAExENAF4KjQCaCtoAJwqnAAkOVgCaC0cAmgnlAJoDaACaCVQAYAMWAJAJggCQCYIAYAmCAGAJggCQCRkAYAieAEkJIABgCUYAVAmCAGAJKACQCSgAkA50AJAJKACGBm8AkAMWAIgDFv7PBpUAQAZtAEAJHgAnDmwANgkhAJAJtQA6CFYAYwkdACgDaAAqCyAAfAcuAF4KJgCaCosAfAtcAJoKfACaCr8AfAmQAF4K2gB8Cr8AfAg9AJoIiACaB1gAlQbXAJoFkQCaBtMAnQbTAJMDaACaCPEAmgiIAJoI8QCaA2wAnAmyAE0DJQCaBaEAmgwQAJEO7wB8ClEATgxpAHwNxQCbC08AfAV3AHwFdwBLBdgAfAMNAJoF2ABUBGAAfARgAFQD+QCaA/kAmgaNAJoGjQCZA2gAKgX9ACoEggCaCQcAmgvBAJoQrACaBWQAmgxTAJoNuwB8DvUAfQ71AH0MUwCaCRkAYAqtAJoKpwAJB/YASwiIAJoIiACaCCoAmgoAAJkDDQCaCjkAmgNoAJoDbACcCbIAmgVUAH0GrgCaBsgAmwRoAJoFwwCaBg8AmgZIAJoKswCaC0oAmgviAJoMBQCaE/8AmwxTAJoK/ACaCJ4ASQeiAJoHogCaCToAmgdpAJsHaQBOC/cAmwv3AE4FPACaAvgAmgSjAJYEBACbBSgAmgUpAJoDfgDEBDgAmgQ4AJoFcgCaBDMAmwmrAEAJqwBACnUAmgmCAJAJxwCaCVQAYA54ABMO+QB8D4oAVA/MAGALrAB8CVQAYAsSABMLEgATCxIAEwsSABMLEgATCxIAEwt6AHwHJACaCqj/dgqo/3YIrwCaCK8AmgivAJoIrwCaA0P/QgNDAJoDQ/+nA0P/gwhc/5YG2ACbC0cAmgutAHwLrQB8C60AfAutAHwLrQB8ClEATgrYAJoK2ACaCtgAmgrYAJoKpwAJCqcACQnlAJoJRgBUCUYAVAlGAFQJRgBUCUYAVAlGAFQJGQBgCYIAYAaoAJsJIABgCSAAYAkgAGAJIABgA37/YAN+AMQDfv/FA37/oQMW/3sFZwCaCSgAkAlUAGAJVABgCVQAYAlUAGAJVABgCJ4ASQkoAIYJKACGCSgAhgkoAIYJHQAoCR0AKAhWAGMLEgATCUYAVAsSABMJRgBUCxIAEwlGAFQLegB8CRkAYAt6AHwJGQBgC3oAfAkZAGALegB8CRkAYAqoAJoJggBgCK8AmgkgAGAIrwCaCSAAYAivAJoJIABgCK8AmgkgAGAIrwCaCSAAYAupAHwJggBgC6kAfAmCAGALqQB8CYIAYAupAHwJggBgCqgAmgko/5AKqP+sCSj/ngND/4gDfv+mA0P/iQN+/6cDQ/+cA37/ugND/98DFv+9A0MAmgz+AJoGLACICbsATQMV/s8KjQCaCSEAkAkhAJAIXACaAxYAkAhcAJoDFgA+CFwAmgMWAJAIXACaAxYAkAtHAJoJKACQC0cAmgkoAJALRwCaCSgAkAxTAJoMUwCaDFMAmgutAHwJVABgC60AfAlUAGALrQB8CVQAYAqlAJoGbwCQCqUAmgZvAD8KpQCaBm8AkApRAE4IngBJClEATgieAEkKUQBOCJ4ASQmWACIGbQBACZYAIgZtAEAJlgAiBm0APQrYAJoJKACGCtgAmgkoAIYK2ACaCSgAhgrYAJoJKACGCtgAmgkoAIYK2ACaCSgAhhENAF4ObAA2CqcACQkdACgJ5QCaCFYAYwnlAJoIVgBjDFMAmgMzAJoDTwCaA08AmwMV/s8GyACaBCwAmwyEAJoC+ACbC6wAfApRAE4JlgAiBe8AmhENAF4RDQBeEQ0AXgqnAAkOeAATD4oAVAlUAGAIngBJBm0AQA5sADYObAA2DmwANgkdACgH4gCaA+gAjQAAAEIAQgBCAEIAqgC8AO4BBgEwAVIBfAGeAiwCmAMqA2wDrgP6BGgEyAUSBYgFvgXmBh4GSgZ8BqgG3AcEBzAHSAemB8gIWgjwCYYKGAp8CwALbgwCDNwNKg16DeoOOg5sDqAO+g9UD5gPwA/4EDYQaBCUEOgRDhF2EcoSNhLCEvwTbhP+FDoUzBVcFXYVphXkFggWhha4FsQW1hbwFx4XLhdcF8wX5BfwGFQZoho4GtAbihwaHEocWh0AHR4dLh2SHaIdsh3EHdAd4h3qHfYeEB4uHkgeYh6AHoge1h+uIIogkiD8IXQhwiJIImYieCKcIrwi6iL6IwojHCMsI3wj7iQ+JIAk3CVMJZglwCXaJfAmBib+JwYnTigQKEAogij4KRwpLCk4KUgpfimcKewqMCpeKogqoCqsKswq9itYK2QrcCu+LFAs7C1yLb4uGi9IMDgwvDE2MUgxWjFsMX4xkDGiMa4xyDHaMeIx9DIGMhgyKjI8Mk4yYDJyMoQymDKqMrwyzjLgMvIzBDMWMygzOjNMM14zcDOCM5QzpjO4M8oz3DPuNAA0DDQeNDg0SjRcNG40gDSSNKQ0tjTINNo07jUANRI1JDU2NUg1WjVsNX41kDWiNbQ1xjXYNeo1/DYONiA2MjZENlY2aDZ6Now2njawNsI21DbmNvg3CjccNy43QDdSN2Q3djeIN5o3rDe+N9A34jf0OAY4GDgqODY4SDhaOGw4fjiQOKI4tDjGONg46jj8OQ45IDkyOT45SjlcOW45ejmGObI5xDnWOeI57joAOhI6JDo2Okg6WjpmOnI6hDqWOp46pjquOsA60jrkOvY7CDsaOyw7PjtKO1Y7aDt6O4w7njuwO8I7zjvaO+Y78jwEPBY8KDw6PEw8XjxwPII8lDymPLg8yjzcPO49AD0SPSQ9Nj1IPVo9bD1+PZA9oj2qPcY97D4IPkA+Wj6gPro+0j7kPvA+/D8uP0A/Uj9kP3Y/iD+aP6w/uD/EP9Y/6D/6QAxAJkByAAEAAAF9AHQABwBkAAUAAgAiAEsAjQAAAIYODAADAAQAAAAcAVYAAQAAAAAAAAANAAAAAQAAAAAAAQAKAA0AAQAAAAAAAgAHABcAAQAAAAAAAwAnAB4AAQAAAAAABAANAEUAAQAAAAAABQAjAFIAAQAAAAAABgANAHUAAQAAAAAABwAHAIIAAQAAAAAACQANAIkAAQAAAAAACgA8AJYAAQAAAAAADAAkANIAAQAAAAAADQIrAPYAAQAAAAAADgAkAyEAAwABBAkAAAAaA0UAAwABBAkAAQAUA18AAwABBAkAAgAOA3MAAwABBAkAAwBOA4EAAwABBAkABAAaA88AAwABBAkABQBGA+kAAwABBAkABgAaBC8AAwABBAkABwAOBEkAAwABBAkACQAaBFcAAwABBAkACgB4BHEAAwABBAkADABIBOkAAwABBAkADQRWBTEAAwABBAkADgBICYcAAwABBAkAEAAMCc8AAwABBAkAEQAMCdupcmFqZXNocmFqcHV0Tm9oZW1pIE1lZFJlZ3VsYXJWZXJzaW9uIDEuMDAwOztOb2hlbWktTWVkaXVtOzIwMjM7Rkw3MjBOb2hlbWkgTWVkaXVtVmVyc2lvbiAxLjAwMDsgdHRmYXV0b2hpbnQgKHYxLjguNClOb2hlbWktTWVkaXVtTk9IRU1JqnJhamVzaCByYWpwdXROb2hlbappIHR5cGVmYWNlLiwgIGRlc2lnbiBhbmQgZGlzdHJpYnV0ZWQgYnkgUmFqZXNoIFJhanB1dC5odHRwczovL3d3dy5iZWhhbmNlLm5ldC9yYWpwdXRyYWplc2hCeSBkb3dubG9hZGluZy9pbnN0YWxsaW5nIE5PSEVNSaogZnJlZSB0eXBlZmFjZSB5b3UgYWdyZWUgdG8gdGhpcyBsaWNlbnNlLgpUaGlzIHR5cGVmYWNlIGlzIGZyZWV3YXJlLCB5b3UgY2FuIHVzZSBpdCBmcmVlbHkgZm9yIHBlcnNvbmFsIGFuZCBjb21tZXJjaWFsIHByb2plY3RzLiBUaGUgdHlwZWZhY2UgZmlsZXMgbWF5IG5vdCBiZSBtb2RpZmllZCB3aXRob3V0IHdyaXR0ZW4gcGVybWlzc2lvbiBmcm9tIFJhamVzaCBSYWpwdXQgKHJhanB1dHJhamVzaF80NDhAeWFob28uY29tKS4KUmFqZXNoIFJhanB1dCBpcyBub3QgbGlhYmxlIGZvciBhbnkgZGFtYWdlIHJlc3VsdGluZyBmcm9tIHRoZSB1c2Ugb2YgdGhpcyB0eXBlZmFjZS4gRXhjZXB0IGZvciB5b3VyIHJpZ2h0IHRvIHVzZSB0aGlzIHR5cGVmYWNlLCBhbGwgb3RoZXIgcmlnaHRzIGFyZSBvd25lZCBhbmQgcmV0YWluZWQgYnkgUmFqZXNoIFJhanB1dC4KVGhhbmsgeW91IGZvciB5b3VyIHN1cHBvcnQuClBsZWFzZSBzcHJlYWQgdGhlIHdvcmQgYXJvdW5kLCBpZiB5b3UgbGlrZSB0aGUgTk9IRU1JqiB0eXBlZmFjZS5odHRwczovL3d3dy5iZWhhbmNlLm5ldC9yYWpwdXRyYWplc2gAqQByAGEAagBlAHMAaAByAGEAagBwAHUAdABOAG8AaABlAG0AaQAgAE0AZQBkAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMAA7ADsATgBvAGgAZQBtAGkALQBNAGUAZABpAHUAbQA7ADIAMAAyADMAOwBGAEwANwAyADAATgBvAGgAZQBtAGkAIABNAGUAZABpAHUAbQBWAGUAcgBzAGkAbwBuACAAMQAuADAAMAAwADsAIAB0AHQAZgBhAHUAdABvAGgAaQBuAHQAIAAoAHYAMQAuADgALgA0ACkATgBvAGgAZQBtAGkALQBNAGUAZABpAHUAbQBOAE8ASABFAE0ASSEiAHIAYQBqAGUAcwBoACAAcgBhAGoAcAB1AHQATgBvAGgAZQBtISIAaQAgAHQAeQBwAGUAZgBhAGMAZQAuACwAIAAgAGQAZQBzAGkAZwBuACAAYQBuAGQAIABkAGkAcwB0AHIAaQBiAHUAdABlAGQAIABiAHkAIABSAGEAagBlAHMAaAAgAFIAYQBqAHAAdQB0AC4AaAB0AHQAcABzADoALwAvAHcAdwB3AC4AYgBlAGgAYQBuAGMAZQAuAG4AZQB0AC8AcgBhAGoAcAB1AHQAcgBhAGoAZQBzAGgAQgB5ACAAZABvAHcAbgBsAG8AYQBkAGkAbgBnAC8AaQBuAHMAdABhAGwAbABpAG4AZwAgAE4ATwBIAEUATQBJISIAIABmAHIAZQBlACAAdAB5AHAAZQBmAGEAYwBlACAAeQBvAHUAIABhAGcAcgBlAGUAIAB0AG8AIAB0AGgAaQBzACAAbABpAGMAZQBuAHMAZQAuAAoAVABoAGkAcwAgAHQAeQBwAGUAZgBhAGMAZQAgAGkAcwAgAGYAcgBlAGUAdwBhAHIAZQAsACAAeQBvAHUAIABjAGEAbgAgAHUAcwBlACAAaQB0ACAAZgByAGUAZQBsAHkAIABmAG8AcgAgAHAAZQByAHMAbwBuAGEAbAAgAGEAbgBkACAAYwBvAG0AbQBlAHIAYwBpAGEAbAAgAHAAcgBvAGoAZQBjAHQAcwAuACAAVABoAGUAIAB0AHkAcABlAGYAYQBjAGUAIABmAGkAbABlAHMAIABtAGEAeQAgAG4AbwB0ACAAYgBlACAAbQBvAGQAaQBmAGkAZQBkACAAdwBpAHQAaABvAHUAdAAgAHcAcgBpAHQAdABlAG4AIABwAGUAcgBtAGkAcwBzAGkAbwBuACAAZgByAG8AbQAgAFIAYQBqAGUAcwBoACAAUgBhAGoAcAB1AHQAIAAoAHIAYQBqAHAAdQB0AHIAYQBqAGUAcwBoAF8ANAA0ADgAQAB5AGEAaABvAG8ALgBjAG8AbQApAC4ACgBSAGEAagBlAHMAaAAgAFIAYQBqAHAAdQB0ACAAaQBzACAAbgBvAHQAIABsAGkAYQBiAGwAZQAgAGYAbwByACAAYQBuAHkAIABkAGEAbQBhAGcAZQAgAHIAZQBzAHUAbAB0AGkAbgBnACAAZgByAG8AbQAgAHQAaABlACAAdQBzAGUAIABvAGYAIAB0AGgAaQBzACAAdAB5AHAAZQBmAGEAYwBlAC4AIABFAHgAYwBlAHAAdAAgAGYAbwByACAAeQBvAHUAcgAgAHIAaQBnAGgAdAAgAHQAbwAgAHUAcwBlACAAdABoAGkAcwAgAHQAeQBwAGUAZgBhAGMAZQAsACAAYQBsAGwAIABvAHQAaABlAHIAIAByAGkAZwBoAHQAcwAgAGEAcgBlACAAbwB3AG4AZQBkACAAYQBuAGQAIAByAGUAdABhAGkAbgBlAGQAIABiAHkAIABSAGEAagBlAHMAaAAgAFIAYQBqAHAAdQB0AC4ACgBUAGgAYQBuAGsAIAB5AG8AdQAgAGYAbwByACAAeQBvAHUAcgAgAHMAdQBwAHAAbwByAHQALgAKAFAAbABlAGEAcwBlACAAcwBwAHIAZQBhAGQAIAB0AGgAZQAgAHcAbwByAGQAIABhAHIAbwB1AG4AZAAsACAAaQBmACAAeQBvAHUAIABsAGkAawBlACAAdABoAGUAIABOAE8ASABFAE0ASSEiACAAdAB5AHAAZQBmAGEAYwBlAC4AaAB0AHQAcABzADoALwAvAHcAdwB3AC4AYgBlAGgAYQBuAGMAZQAuAG4AZQB0AC8AcgBhAGoAcAB1AHQAcgBhAGoAZQBzAGgATgBvAGgAZQBtAGkATQBlAGQAaQB1AG0AAAAAAgAAAAAAAP84AGQAAAAAAAAAAAAAAAAAAAAAAAAAAAF9AAAAAQECAAMAMgAeACgALAArAC8AKQA3ADYAJgAqADgALQAnACUANQAzADQAJAA5ADoALgA7ADwAMAAxAD0AEQBSAE8ARQBHAFQAUwBGAFYASABEAEoAUQBLAFAAWABVAEwATQBJAFcAWQBaAE4AWwBdAFwADwATABQAFQAWABcAGAAZABoAGwAcABAADgANAEEA2QASAD8AHQAfACAAIQAEACIACgAFAAYAIwAHAQMACAAJAAsADABeAF8AYAA+AEAAtgC3ALQAtQDEAMUAhwBCALIAswDaAKQAjACKAIsAvQCEAIUAlgCmAO8AkwDwALgA6ACrAMMAowCiAIMAnQCeAPEA8gDzAQQAvAD1APQA9gDGAQUAiACGAIIAwgBhAL4AvwCpAKoA2wDcAN0A4ADYAOEA1wCNAEMAjgDeAMAAwQDtAO4AiQDqAJAAsACgALEAkQChAK0AyQDHAK4AYgBjAGQBBgDpAQcAywBlAMgAygDPAMwAzQDOAOIBCABmANMA0ADRAK8AZwDkANYA1ADVAGgAuwDrAOYAagBpAGsAbQBsAG4AbwEBAQkAcQBwAHIAcwB1AHQAdgB3AOMBCgB4AHoAeQB7AH0AfADlAH8AfgCAAIEA7AC6AOcBCwEMAQ0BDgEPARAA/QD+AREBEgETARQA/wEAARUBFgEXARgBGQEaARsBHAEdAR4BHwEgASEBIgD4APkBIwEkASUBJgEnASgBKQEqASsBLAEtAS4BLwEwATEBMgD6ATMBNAE1ATYBNwE4ATkBOgE7ATwBPQE+AT8BQAFBAUIBQwFEAUUBRgFHAUgBSQFKAUsBTAFNAU4BTwFQAVEBUgFTAVQBVQFWAVcBWAFZAVoA+wD8AVsBXAFdAV4BXwFgAWEBYgFjAWQBZQFmAWcBaAFpAWoBawFsAW0BbgFvAXABcQFyAXMBdAF1AXYBdwF4AXkBegF7AXwBfQF+AX8BgADfAYEBggGDAYQBhQGGAYcBiAGJAYoBiwGMAY0BjgGPB3VuaTAwMEQERXVybwd1bmkyMDc0B3VuaTAzQkMGZXRoYmFyBkRjcm9hdAhjcm9zc2JhcgtldGhiYXIuY2FzZQ1jcm9zc2Jhci5jYXNlB0FtYWNyb24HYW1hY3JvbgZBYnJldmUGYWJyZXZlB0FvZ29uZWsHYW9nb25lawtDY2lyY3VtZmxleAtjY2lyY3VtZmxleApDZG90YWNjZW50CmNkb3RhY2NlbnQGRGNhcm9uBmRjYXJvbgdFbWFjcm9uB2VtYWNyb24GRWJyZXZlBmVicmV2ZQpFZG90YWNjZW50CmVkb3RhY2NlbnQHRW9nb25lawdlb2dvbmVrBkVjYXJvbgZlY2Fyb24LR2NpcmN1bWZsZXgLZ2NpcmN1bWZsZXgKR2RvdGFjY2VudApnZG90YWNjZW50B3VuaTAxMjIHdW5pMDEyMwtIY2lyY3VtZmxleAtoY2lyY3VtZmxleARIYmFyBGhiYXIGSXRpbGRlBml0aWxkZQdJbWFjcm9uB2ltYWNyb24GSWJyZXZlBmlicmV2ZQdJb2dvbmVrB2lvZ29uZWsCSUoCaWoLSmNpcmN1bWZsZXgLamNpcmN1bWZsZXgHdW5pMDEzNgd1bmkwMTM3DGtncmVlbmxhbmRpYwZMYWN1dGUGbGFjdXRlB3VuaTAxM0IHdW5pMDEzQwZMY2Fyb24GbGNhcm9uBExkb3QEbGRvdAZOYWN1dGUGbmFjdXRlB3VuaTAxNDUHdW5pMDE0NgZOY2Fyb24GbmNhcm9uC25hcG9zdHJvcGhlA0VuZwNlbmcHT21hY3JvbgdvbWFjcm9uBk9icmV2ZQZvYnJldmUNT2h1bmdhcnVtbGF1dA1vaHVuZ2FydW1sYXV0BlJhY3V0ZQZyYWN1dGUHdW5pMDE1Ngd1bmkwMTU3BlJjYXJvbgZyY2Fyb24GU2FjdXRlBnNhY3V0ZQtTY2lyY3VtZmxleAtzY2lyY3VtZmxleAd1bmkwMTYyB3VuaTAxNjMGVGNhcm9uBnRjYXJvbgRUYmFyBHRiYXIGVXRpbGRlBnV0aWxkZQdVbWFjcm9uB3VtYWNyb24GVWJyZXZlBnVicmV2ZQVVcmluZwV1cmluZw1VaHVuZ2FydW1sYXV0DXVodW5nYXJ1bWxhdXQHVW9nb25lawd1b2dvbmVrC1djaXJjdW1mbGV4C3djaXJjdW1mbGV4C1ljaXJjdW1mbGV4C3ljaXJjdW1mbGV4BlphY3V0ZQZ6YWN1dGUKWmRvdGFjY2VudAp6ZG90YWNjZW50BWxvbmdzCmNvbW1hY2NlbnQLY29tbWFjY2VudDILY29tbWFjY2VudDMHdW5pMDIzNwd0YmFybmV3B29nb25lazIKY3VzdG9tYmFySApkb3RhY2NlbnQyC09zbGFzaGFjdXRlB3VuaTAyMTgHdW5pMDIxQQZXYWN1dGUGV2dyYXZlCVdkaWVyZXNpcwZZZ3JhdmUHQUVhY3V0ZQdhZWFjdXRlC29zbGFzaGFjdXRlB3VuaTAyMTkHdW5pMDIxQgZ3YWN1dGUGd2dyYXZlCXdkaWVyZXNpcwZ5Z3JhdmULVG92ZXJsYXliYXIHb2dvbmVrMwABAAH//wAPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYQBhAGEAYQAADDD97AAADDD97AH4AfgBvAG8CywAAAuQCJ0AAP0NDDD97Ato/8QMEgjZ/8T8zgww/ewAYQBhAGEAYQtpBZcMMP3sC2kFgQww/eywACwgsABVWEVZICBLuAAMUUuwBlNaWLA0G7AoWWBmIIpVWLACJWG5CAAIAGNjI2IbISGwAFmwAEMjRLIAAQBDYEItsAEssCBgZi2wAiwjISMhLbADLCBkswMUFQBCQ7ATQyBgYEKxAhRDQrElA0OwAkNUeCCwDCOwAkNDYWSwBFB4sgICAkNgQrAhZRwhsAJDQ7IOFQFCHCCwAkMjQrITARNDYEIjsABQWGVZshYBAkNgQi2wBCywAyuwFUNYIyEjIbAWQ0MjsABQWGVZGyBkILDAULAEJlqyKAENQ0VjRbAGRVghsAMlWVJbWCEjIRuKWCCwUFBYIbBAWRsgsDhQWCGwOFlZILEBDUNFY0VhZLAoUFghsQENQ0VjRSCwMFBYIbAwWRsgsMBQWCBmIIqKYSCwClBYYBsgsCBQWCGwCmAbILA2UFghsDZgG2BZWVkbsAIlsAxDY7AAUliwAEuwClBYIbAMQxtLsB5QWCGwHkthuBAAY7AMQ2O4BQBiWVlkYVmwAStZWSOwAFBYZVlZIGSwFkMjQlktsAUsIEUgsAQlYWQgsAdDUFiwByNCsAgjQhshIVmwAWAtsAYsIyEjIbADKyBksQdiQiCwCCNCsAZFWBuxAQ1DRWOxAQ1DsANgRWOwBSohILAIQyCKIIqwASuxMAUlsAQmUVhgUBthUllYI1khWSCwQFNYsAErGyGwQFkjsABQWGVZLbAHLLAJQyuyAAIAQ2BCLbAILLAJI0IjILAAI0JhsAJiZrABY7ABYLAHKi2wCSwgIEUgsA5DY7gEAGIgsABQWLBAYFlmsAFjYESwAWAtsAossgkOAENFQiohsgABAENgQi2wCyywAEMjRLIAAQBDYEItsAwsICBFILABKyOwAEOwBCVgIEWKI2EgZCCwIFBYIbAAG7AwUFiwIBuwQFlZI7AAUFhlWbADJSNhRESwAWAtsA0sICBFILABKyOwAEOwBCVgIEWKI2EgZLAkUFiwABuwQFkjsABQWGVZsAMlI2FERLABYC2wDiwgsAAjQrMNDAADRVBYIRsjIVkqIS2wDyyxAgJFsGRhRC2wECywAWAgILAPQ0qwAFBYILAPI0JZsBBDSrAAUlggsBAjQlktsBEsILAQYmawAWMguAQAY4ojYbARQ2AgimAgsBEjQiMtsBIsS1RYsQRkRFkksA1lI3gtsBMsS1FYS1NYsQRkRFkbIVkksBNlI3gtsBQssQASQ1VYsRISQ7ABYUKwEStZsABDsAIlQrEPAiVCsRACJUKwARYjILADJVBYsQEAQ2CwBCVCioogiiNhsBAqISOwAWEgiiNhsBAqIRuxAQBDYLACJUKwAiVhsBAqIVmwD0NHsBBDR2CwAmIgsABQWLBAYFlmsAFjILAOQ2O4BABiILAAUFiwQGBZZrABY2CxAAATI0SwAUOwAD6yAQEBQ2BCLbAVLACxAAJFVFiwEiNCIEWwDiNCsA0jsANgQiBgtxgYAQARABMAQkJCimAgsBQjQrABYbEUCCuwiysbIlktsBYssQAVKy2wFyyxARUrLbAYLLECFSstsBkssQMVKy2wGiyxBBUrLbAbLLEFFSstsBwssQYVKy2wHSyxBxUrLbAeLLEIFSstsB8ssQkVKy2wKywjILAQYmawAWOwBmBLVFgjIC6wAV0bISFZLbAsLCMgsBBiZrABY7AWYEtUWCMgLrABcRshIVktsC0sIyCwEGJmsAFjsCZgS1RYIyAusAFyGyEhWS2wICwAsA8rsQACRVRYsBIjQiBFsA4jQrANI7ADYEIgYLABYbUYGAEAEQBCQopgsRQIK7CLKxsiWS2wISyxACArLbAiLLEBICstsCMssQIgKy2wJCyxAyArLbAlLLEEICstsCYssQUgKy2wJyyxBiArLbAoLLEHICstsCkssQggKy2wKiyxCSArLbAuLCA8sAFgLbAvLCBgsBhgIEMjsAFgQ7ACJWGwAWCwLiohLbAwLLAvK7AvKi2wMSwgIEcgILAOQ2O4BABiILAAUFiwQGBZZrABY2AjYTgjIIpVWCBHICCwDkNjuAQAYiCwAFBYsEBgWWawAWNgI2E4GyFZLbAyLACxAAJFVFixDghFQrABFrAxKrEFARVFWDBZGyJZLbAzLACwDyuxAAJFVFixDghFQrABFrAxKrEFARVFWDBZGyJZLbA0LCA1sAFgLbA1LACxDghFQrABRWO4BABiILAAUFiwQGBZZrABY7ABK7AOQ2O4BABiILAAUFiwQGBZZrABY7ABK7AAFrQAAAAAAEQ+IzixNAEVKiEtsDYsIDwgRyCwDkNjuAQAYiCwAFBYsEBgWWawAWNgsABDYTgtsDcsLhc8LbA4LCA8IEcgsA5DY7gEAGIgsABQWLBAYFlmsAFjYLAAQ2GwAUNjOC2wOSyxAgAWJSAuIEewACNCsAIlSYqKRyNHI2EgWGIbIVmwASNCsjgBARUUKi2wOiywABawFyNCsAQlsAQlRyNHI2GxDABCsAtDK2WKLiMgIDyKOC2wOyywABawFyNCsAQlsAQlIC5HI0cjYSCwBiNCsQwAQrALQysgsGBQWCCwQFFYswQgBSAbswQmBRpZQkIjILAKQyCKI0cjRyNhI0ZgsAZDsAJiILAAUFiwQGBZZrABY2AgsAErIIqKYSCwBENgZCOwBUNhZFBYsARDYRuwBUNgWbADJbACYiCwAFBYsEBgWWawAWNhIyAgsAQmI0ZhOBsjsApDRrACJbAKQ0cjRyNhYCCwBkOwAmIgsABQWLBAYFlmsAFjYCMgsAErI7AGQ2CwASuwBSVhsAUlsAJiILAAUFiwQGBZZrABY7AEJmEgsAQlYGQjsAMlYGRQWCEbIyFZIyAgsAQmI0ZhOFktsDwssAAWsBcjQiAgILAFJiAuRyNHI2EjPDgtsD0ssAAWsBcjQiCwCiNCICAgRiNHsAErI2E4LbA+LLAAFrAXI0KwAyWwAiVHI0cjYbAAVFguIDwjIRuwAiWwAiVHI0cjYSCwBSWwBCVHI0cjYbAGJbAFJUmwAiVhuQgACABjYyMgWGIbIVljuAQAYiCwAFBYsEBgWWawAWNgIy4jICA8ijgjIVktsD8ssAAWsBcjQiCwCkMgLkcjRyNhIGCwIGBmsAJiILAAUFiwQGBZZrABYyMgIDyKOC2wQCwjIC5GsAIlRrAXQ1hQG1JZWCA8WS6xMAEUKy2wQSwjIC5GsAIlRrAXQ1hSG1BZWCA8WS6xMAEUKy2wQiwjIC5GsAIlRrAXQ1hQG1JZWCA8WSMgLkawAiVGsBdDWFIbUFlYIDxZLrEwARQrLbBDLLA6KyMgLkawAiVGsBdDWFAbUllYIDxZLrEwARQrLbBELLA7K4ogIDywBiNCijgjIC5GsAIlRrAXQ1hQG1JZWCA8WS6xMAEUK7AGQy6wMCstsEUssAAWsAQlsAQmICAgRiNHYbAMI0IuRyNHI2GwC0MrIyA8IC4jOLEwARQrLbBGLLEKBCVCsAAWsAQlsAQlIC5HI0cjYSCwBiNCsQwAQrALQysgsGBQWCCwQFFYswQgBSAbswQmBRpZQkIjIEewBkOwAmIgsABQWLBAYFlmsAFjYCCwASsgiophILAEQ2BkI7AFQ2FkUFiwBENhG7AFQ2BZsAMlsAJiILAAUFiwQGBZZrABY2GwAiVGYTgjIDwjOBshICBGI0ewASsjYTghWbEwARQrLbBHLLEAOisusTABFCstsEgssQA7KyEjICA8sAYjQiM4sTABFCuwBkMusDArLbBJLLAAFSBHsAAjQrIAAQEVFBMusDYqLbBKLLAAFSBHsAAjQrIAAQEVFBMusDYqLbBLLLEAARQTsDcqLbBMLLA5Ki2wTSywABZFIyAuIEaKI2E4sTABFCstsE4ssAojQrBNKy2wTyyyAABGKy2wUCyyAAFGKy2wUSyyAQBGKy2wUiyyAQFGKy2wUyyyAABHKy2wVCyyAAFHKy2wVSyyAQBHKy2wViyyAQFHKy2wVyyzAAAAQystsFgsswABAEMrLbBZLLMBAABDKy2wWiyzAQEAQystsFssswAAAUMrLbBcLLMAAQFDKy2wXSyzAQABQystsF4sswEBAUMrLbBfLLIAAEUrLbBgLLIAAUUrLbBhLLIBAEUrLbBiLLIBAUUrLbBjLLIAAEgrLbBkLLIAAUgrLbBlLLIBAEgrLbBmLLIBAUgrLbBnLLMAAABEKy2waCyzAAEARCstsGksswEAAEQrLbBqLLMBAQBEKy2wayyzAAABRCstsGwsswABAUQrLbBtLLMBAAFEKy2wbiyzAQEBRCstsG8ssQA8Ky6xMAEUKy2wcCyxADwrsEArLbBxLLEAPCuwQSstsHIssAAWsQA8K7BCKy2wcyyxATwrsEArLbB0LLEBPCuwQSstsHUssAAWsQE8K7BCKy2wdiyxAD0rLrEwARQrLbB3LLEAPSuwQCstsHgssQA9K7BBKy2weSyxAD0rsEIrLbB6LLEBPSuwQCstsHsssQE9K7BBKy2wfCyxAT0rsEIrLbB9LLEAPisusTABFCstsH4ssQA+K7BAKy2wfyyxAD4rsEErLbCALLEAPiuwQistsIEssQE+K7BAKy2wgiyxAT4rsEErLbCDLLEBPiuwQistsIQssQA/Ky6xMAEUKy2whSyxAD8rsEArLbCGLLEAPyuwQSstsIcssQA/K7BCKy2wiCyxAT8rsEArLbCJLLEBPyuwQSstsIossQE/K7BCKy2wiyyyCwADRVBYsAYbsgQCA0VYIyEbIVlZQiuwCGWwAyRQeLEFARVFWDBZLbEEAESyDwgTKwBLuAAyUlixAQGOWbABuQgACABjcLAERVxYsQAHQrQAKQADACqxAAdCtzAEHAgSAwMKKrEAB0K3NgImBhcBAwoqWbEACkK8DEAHQATAAAMACyqxAA1CvABAAEAAQAADAAsquQADAABEsSQBiFFYsECIWLkAAwBkRLEoAYhRWLgIAIhYuQADAABEWRuxJwGIUVi6CIAAAQRAiGNUWLkAAwAARFlZWVlZtzIEHggUAwMOKrgB/4WwBI2xAgBEswVkBgBERAp0dGZhdXRvaGludCB2ZXJzaW9uID0gMS44LjQKCmFkanVzdC1zdWJnbHlwaHMgPSAwCmRlZmF1bHQtc2NyaXB0ID0gbGF0bgpkdy1jbGVhcnR5cGUtc3RlbS13aWR0aC1tb2RlID0gcXVhbnRpemVkCmZhbGxiYWNrLXNjYWxpbmcgPSAwCmZhbGxiYWNrLXNjcmlwdCA9IGxhdG4KZmFsbGJhY2stc3RlbS13aWR0aCA9IDAKZ2RpLWNsZWFydHlwZS1zdGVtLXdpZHRoLW1vZGUgPSBzdHJvbmcKZ3JheS1zdGVtLXdpZHRoLW1vZGUgPSBxdWFudGl6ZWQKaGludGluZy1saW1pdCA9IDUwCmhpbnRpbmctcmFuZ2UtbWF4ID0gNTAKaGludGluZy1yYW5nZS1taW4gPSA4CmhpbnQtY29tcG9zaXRlcyA9IDAKaWdub3JlLXJlc3RyaWN0aW9ucyA9IDAKaW5jcmVhc2UteC1oZWlnaHQgPSAxMgpyZWZlcmVuY2UgPSBOb2hlbWktUmVndWxhci50dGYKcmVmZXJlbmNlLWluZGV4ID0gMApzeW1ib2wgPSAwClRURkEtaW5mbyA9IDEKd2luZG93cy1jb21wYXRpYmlsaXR5ID0gMQp4LWhlaWdodC1zbmFwcGluZy1leGNlcHRpb25zID0gOC0xNQpjb250cm9sLWluc3RydWN0aW9ucyA9IAoKCgAAAAAAAAEAAAAA) format('truetype');
          font-weight: 500 900;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          src: url(data:font/ttf;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAL4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/xAAAAAD/xP+mAAAAAAAA/8T/xAAA/8QAAAAAAAAAAAAAAAAAAP9qAAAAAAAAAAAAAAAA/y4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABP/8wAAAAAAAAAAABMAAAAA/+wAEwAT//r/8wAAAAAAAP/z//MAAP/zAAAAAAAAAAAAAAAAAAD/agAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+mAAD/2P/i/+IAAAAAAAAAAAAA/7D/pgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/dAAA/8T/4v/E/7oAAP+I/8QAAP+c/2oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/7f/E/+L/xAAAAAD/iAAA/+z/sP+I//YAAAAAAAAAAAAAAAAAAAAAAAAAAP+IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP9+/+z/zv/i/+L/zv9M/4j/xP/s/7D/iAAAAAAAAAAAAAAAAAAAAAAAAP+IAAD/iAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFoAAABrgAAAAAAAAAAAAAAyAAAAAAAAABaAAAAAAGkAAAAAAAAAAAAAAFoAAABaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABzAAAAAAAAAAAAAAAAAAAAAAAAABaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAA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AQoBCgC7AQwBDAC8AQ4BDgC9AREBEQC+ARMBHAC/AR4BJADJASYBJgDQASgBKgDRASwBMgDUATUBYADbAAEABAFdABAAAAAcAA8ADwATABsAFAAyABAANgAvACgAOwARADUAHQAQAA0AIQAOABIAHgAiAA8ADwAVAAkAAQAAACsAAAAjACwAPAA3AD0AKgAAACkAKQApACMABwACAAIABgAIAAMAMAAFACAABAAxAAkAFgAXAAAAOAAZAAAAAAAYADkAOgAfAB8AAAAAAAAAGgAAAAAAAAAfAAAAAAAAACcAJwAAACQAMgAQAAAAAAAKAAAANAAAAAAANAAAAAsADAALAAwACQAJAAAAAAAfAB8AAAAAAAAAAAAQAAAAPAAAACIAAAAfAB8AHwAfAAAACQAAACYAJQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAEAAsABEAAAAcABwAPQA9ABAAAQANAA0ADQANAA0ADQAQAAAAOwA7ABwAHAAcABwADwAPAA8ADwATAAAADwAQABAAEAAQABAAMgAvAC8ALwAvACIAIgAVACoAKgAqACoAKgAqADwAAAAAAD0APQA9AD0AAgACAAIAAgAAAAAAKQABAAEAAQABAAEANwAjACMAIwAjADEAMQAEAA0AKgANACoADQAqABAAPAAQADwAEAA8ABAAPAA7AC0AHAA9ABwAPQAcAD0AHAA9ABwAPQA2AAAANgAAADYAAAA2AAAAAAApAAAAKQAPAAIADwACAA8AAgAPAAIADwAAAAIAKAACABIABQAFABMAAAATAAAAEwAzABMAAAAPACkADwApAA8AKQApAAAAAAAQAAEAEAABABAAAQA1AAcANQAHADUABwAyADcAMgA3ADIANwAUAAgAFAAuABQACAAvACMALwAjAC8AIwAvACMALwAjAC8AIwAOADAAIgAxABUABAAVAAQAAQAEAV0AGwARACgAKAAoACgAKAAcACYAGwAbACcAJAAoACgAKAAoABsAHQAgABoAKAAfACEAKAAoACUADwAOADQANAASABUAGQAOAA0ADgAKABMAGQA0ABkAFwAZACsAIwADAAQAAQALADQABwACAAwADwAtAC4AMAAxACoALwAzAB4AIgAy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AAcAABEDAJz+kQLLAAmxAQG4AsuwNSsA//8AqgAAAk4OQRAiAAcAABEDAJsASQLLAAmxAQG4AsuwNSsA////rAAAA0wOQRAiAAcAABEDAJj/AgLLAAmxAQG4AsuwNSsA////hQAAA3MNvBAiAAcAABEDAJ3+2wLLAAmxAQK4AsuwNSsA////ngAACA4LLBAiAAkAABEDAL7+8/85AAmxAQG4/zmwNSsAAAEAqwQ7BisH+wADAAazAwEBMisJAREBBiv6gAWABrf9hAFEAnwAAP//AKoAAAqVDdAQIgAdAAARAwBJAvACjwAJsQEBuAKPsDUrAP//AIz/xAsZDkEQIgAEAAARAwCcAuUCywAJsQIBuALLsDUrAP//AIz/xAsZDkEQIgAEAAARAwCbBJ0CywAJsQIBuALLsDUrAP//AIz/xAsZDkEQIgAEAAARAwCYA1YCywAJsQIBuALLsDUrAP//AIz/xAsZDgwQIgAEAAARAwBJAyACywAJsQIBuALLsDUrAP//AIz/xAsZDbwQIgAEAAARAwCdAy8CywAJsQICuALLsDUrAP//AFr/xAnTDkEQIgAMAAARAwCZApkCywAJsQEBuALLsDUrAP//AKr/xAoyDkEQIgAPAAARAwCcAoMCywAJsQEBuALLsDUrAP//AKr/xAoyDkEQIgAPAAARAwCbBDsCywAJsQEBuALLsDUrAP//AKr/xAoyDkEQIgAPAAARAwCYAvQCywAJsQEBuALLsDUrAP//AKr/xAoyDbwQIgAPAAARAwCdAs0CywAJsQECuALLsDUrAP//ABkAAAqGDbwQIgAbAAARAwCdAq8CywAJsQECuALLsDUrAP//ABkAAAqGDkEQIgAbAAARAwCbBB0CywAJsQEBuALLsDUrAP//AKoAAAkzDkEQIgAeAAARAwCZAl0CywAJsQEBuALLsDUrAP//AGT/xAioC7IQIgApAAARAwCcAaYAPAAIsQIBsDywNSsAAP//AGT/xAioC7IQIgApAAARAwCbA18APAAIsQIBsDywNSsAAP//AGT/xAioC7IQIgApAAARAwCYAhcAPAAIsQIBsDywNSsAAP//AGT/xAioC30QIgApAAARAwBJAeEAPAAIsQIBsDywNSsAAP//AGT/xAioCy0QIgApAAARAwCdAfAAPAAIsQICsDywNSsAAP//AGT/xAioDJcQIgApAAARAwCWAjAAPAAIsQICsDywNSsAAP//AG789QifCNkQIgAmAAAQAwCeAzcAAP//AG7/xAnbC5AQIgAjAAARAwDVA9YHdQAJsQIBuAd1sDUrAAABAKsB2gYFAwYAAwAYQBUAAQAAAVcAAQEAXwAAAQBPERACBxgrASERIQYF+qYFWgHaASz//wBu/8QIqAuyECIAKAAAEQMAnAGyADwACLECAbA8sDUrAAD//wBu/8QIqAuyECIAKAAAEQMAmwNrADwACLECAbA8sDUrAAD//wBu/8QIqAuyECIAKAAAEQMAmAIjADwACLECAbA8sDUrAAD//wBu/8QIqAstECIAKAAAEQMAnQH8ADwACLECArA8sDUrAAD///9qAAACdguyECIAmgAAEQMAnP7AADwACLEBAbA8sDUrAAD//wDhAAACdguyECIAmgAAEQIAm3k8AAixAQGwPLA1K////9sAAAN7C7IQIgCaAAARAwCY/zEAPAAIsQEBsDywNSsAAP///7QAAAOiCy0QIgCaAAARAwCd/woAPAAIsQECsDywNSsAAP///3QAAANzC5AQIgAhAAARAwDf/soCRwAJsQEBuAJHsDUrAAABAKoBZgSpBGUAAwAGswMBATIrCQERAQSp/AED/wM1/jEBMQHOAAD//wCgAAAIigt9ECIAKwAAEQMASQHlADwACLEBAbA8sDUrAAD//wBu/8QI2guyECIAIAAAEQMAnAG5ADwACLECAbA8sDUrAAD//wBu/8QI2guyECIAIAAAEQMAmwNxADwACLECAbA8sDUrAAD//wBu/8QI2guyECIAIAAAEQMAmAIqADwACLECAbA8sDUrAAD//wBu/8QI2gt9ECIAIAAAEQMASQH0ADwACLECAbA8sDUrAAD//wBu/8QI2gstECIAIAAAEQMAnQIDADwACLECArA8sDUrAAD//wBV/8QIIAuyECIAJwAAEQMAmQGwADwACLEBAbA8sDUrAAD//wCW/8QIgAuyECIALgAAEQMAnAGgADwACLEBAbA8sDUrAAD//wCW/8QIgAuyECIALgAAEQMAmwNYADwACLEBAbA8sDUrAAD//wCW/8QIgAuyECIALgAAEQMAmAIRADwACLEBAbA8sDUrAAD//wCW/8QIgAstECIALgAAEQMAnQHqADwACLEBArA8sDUrAAD//wA3/M4I0wt2ECIAOQAAEAMAmwNSAAD//wA3/M4I0wrxECIAOQAAEAMAnQHkAAD//wBzAAAH0At2ECIAOAAAEAMAmQGgAAD//wAjAAAK3w1XECIAFgAAEQMAawLPAssACbECAbgCy7A1KwD//wBk/8QIqArIECIAKQAAEQMAawHfADwACLECAbA8sDUrAAD//wAjAAAK3w4NECIAFgAAEQMAlALjAssACbECAbgCy7A1KwD//wBk/8QIqAt+ECIAKQAAEQMAlAHzADwACLECAbA8sDUrAAD//wAj/T4K5AssECIAFgAAEQMAlwd9ADsACLECAbA7sDUrAAD//wBk/T4IrQjZECIAKQAAEQMAlwVGADsACLECAbA7sDUrAAD//wCM/8QK1w5BECIADQAAEQMAmwSeAssACbEBAbgCy7A1KwD//wBu/8QInwu2ECIAJgAAEQMAmwNxAEAACLEBAbBAsDUrAAD//wCM/8QK1w5BECIADQAAEQMAmANWAssACbEBAbgCy7A1KwD//wBu/8QInwu2ECIAJgAAEQMAmAIqAEAACLEBAbBAsDUrAAD//wCM/8QK1w28ECIADQAAEQMAlQRaAssACbEBAbgCy7A1KwD//wBu/8QInwsxECIAJgAAEQMAlQMuAEAACLEBAbBAsDUrAAD//wCM/8QK1w5BECIADQAAEQMAmQNYAssACbEBAbgCy7A1KwD//wBu/8QInwu2ECIAJgAAEQMAmQIsAEAACLEBAbBAsDUrAAD//wCqAAAKFA5BECIAEQAAEQMAmQHfAssACbECAbgCy7A1KwD//wBu/8QLRwuQECIAIwAAEQMBYgi+C6QACbECAbgLpLA1KwD//wCqAAAIXg1XECIABgAAEQMAawHFAssACbEBAbgCy7A1KwD//wBu/8QIqArIECIAKAAAEQMAawHrADwACLECAbA8sDUrAAD//wCqAAAIXg4NECIABgAAEQMAlAHZAssACbEBAbgCy7A1KwD//wBu/8QIqAt+ECIAKAAAEQMAlAIAADwACLECAbA8sDUrAAD//wCqAAAIXg28ECIABgAAEQMAlQMBAssACbEBAbgCy7A1KwD//wBu/8QIqAstECIAKAAAEQMAlQMnADwACLECAbA8sDUrAAD//wCq/T4IYwssECIABgAAEQMAlwT8ADsACLEBAbA7sDUrAAD//wBu/RcIqAjZECIAKAAAEQMBZwRiABQACLECAbAUsDUrAAD//wCqAAAIXg5BECIABgAAEQMAmQH/AssACbEBAbgCy7A1KwD//wBu/8QIqAuyECIAKAAAEQMAmQIlADwACLECAbA8sDUrAAD//wCM/8QK+Q5BECIADgAAEQMAmANWAssACbEBAbgCy7A1KwD//wBu/M4I2guyECIAKgAAEQMAmAJxADwACLECAbA8sDUrAAD//wCM/8QK+Q4NECIADgAAEQMAlAMyAssACbEBAbgCy7A1KwD//wBu/M4I2gt+ECIAKgAAEQMAlAJNADwACLECAbA8sDUrAAD//wCM/8QK+Q28ECIADgAAEQMAlQRaAssACbEBAbgCy7A1KwD//wBu/M4I2gstECIAKgAAEQMAlQN1ADwACLECAbA8sDUrAAD//wCM/OwK+QtoECIADgAAEAMBYwOYAAD//wBu/M4I2gwCECIAKgAAEQMBZAN6CNkACbECAbgI2bA1KwD//wCqAAAJ9g5BECIACAAAEQMAmALWAssACbEBAbgCy7A1KwD///+ZAAAIig6lECIALAAAEQMAmP7vAy8ACbEBAbgDL7A1KwD///+yAAAK7gssECIACAAAEQMBaP8IBlQACbEBAbgGVLA1KwD///+fAAAIiguQECIALAAAEQMA1f70B3UACbEBAbgHdbA1KwD///92AAADrA4MECIABwAAEQMASf7MAssACbEBAbgCy7A1KwD///+lAAAD2wt9ECIAmgAAEQMASf77ADwACLEBAbA8sDUrAAD///90AAADhA1XECIABwAAEQMAa/7KAssACbEBAbgCy7A1KwD///+jAAADswrIECIAmgAAEQMAa/75ADwACLEBAbA8sDUrAAD///+IAAADbg4NECIABwAAEQMAlP7eAssACbEBAbgCy7A1KwD///+4AAADngt+ECIAmgAAEQMAlP8OADwACLEBAbA8sDUrAAD///+X/T4CUwssECIABwAAEQMAl/7sADsACLEBAbA7sDUrAAD///9+/T4CPwuQECIAMAAAEQMAl/7TADsACLECAbA7sDUrAAD//wCqAAACTg28ECIABwAAEQMAlQAGAssACbEBAbgCy7A1KwD//wCq/8QL+gssECIABwAAEAMAEAL5AAD//wCW/M4FFAuQECIAMAAAEAMAMQLVAAD//wBV/8QKAg5BECIAEAAAEQMAmAW4AssACbEBAbgCy7A1KwD///6o/M4DSQuyECIBZQAAEQMAmP7/ADwACLEBAbA8sDUrAAD//wCq/OwKYgssECIAGQAAEAMBYwMqAAD//wCg/OwIwAuQECIANgAAEAMBYwJeAAAAAQCgAAAIwAidAAoAHkAbCAMCAAIBTAMBAgIhTQEBAAAfAE4SERIRBAgaKwkBIQERIREhEQEhA4kFN/28+7n+awGVBBkCCAQ1+8sDkvxuCJ38LAPUAAAA//8AqgAACA4OQRAiAAkAABEDAJsASQLLAAmxAQG4AsuwNSsA//8AoAAAAjUOpRAiACEAABEDAJsAOgMvAAmxAQG4Ay+wNSsA//8AqvzsCA4LLBAiAAkAABADAWMCoQAA//8AP/zsAjULkBAiACEAABACAWOVAAAA//8AqgAACA4LLBAiAAkAABEDAWIFaAtAAAmxAQG4C0CwNSsA//8AoAAABLULkBAiACEAABEDAWICLAukAAmxAQG4C6SwNSsA//8AqgAACA4LLBAiAAkAABEDAWkFTfwhAAmxAQG4/CGwNSsA//8AoAAABLMLkBAiACEAABEDAWkCcfq+AAmxAQG4+r6wNSsA//8AqgAACpUOBRAiAB0AABEDAJsEbQKPAAmxAQG4Ao+wNSsA//8AoAAACIoLshAiACsAABEDAJsDYgA8AAixAQGwPLA1KwAA//8AqvzsCpULLBAiAB0AABADAWMDWQAA//8AoPzsCIoI2RAiACsAABADAWMC3AAA//8AqgAACpUOBRAiAB0AABEDAJkDJwKPAAmxAQG4Ao+wNSsA//8AoAAACIoLshAiACsAABEDAJkCHQA8AAixAQGwPLA1KwAA//8AqgAAC8kLLBACAAAAAP//AKoAAAvJCywQAgAAAAD//wCqAAALyQssEAIAAAAA//8AjP/ECxkNVxAiAAQAABEDAGsDHgLLAAmxAgG4AsuwNSsA//8Abv/ECNoKyBAiACAAABEDAGsB8gA8AAixAgGwPLA1KwAA//8AjP/ECxkODRAiAAQAABEDAJQDMgLLAAmxAgG4AsuwNSsA//8Abv/ECNoLfhAiACAAABEDAJQCBgA8AAixAgGwPLA1KwAA//8AjP/ECxkOQRAiAAQAABEDAW0DcALLAAmxAgK4AsuwNSsA//8Abv/ECNoLshAiACAAABEDAW0CRAA8AAixAgKwPLA1KwAA//8AqgAACicOQRAiABMAABEDAJsDgwLLAAmxAgG4AsuwNSsA//8AoAAABfALshAiAC8AABEDAJsCOAA8AAixAQGwPLA1KwAA//8AqvzsCicLLBAiABMAABADAWMDWQAA//8AQPzsBfAInRAiAC8AABACAWOWAAAA//8AqgAACicOQRAiABMAABEDAJkCPQLLAAmxAgG4AsuwNSsA//8AoAAABfALshAiAC8AABEDAJkA8gA8AAixAQGwPLA1KwAA//8AWv/ECdMOQRAiAAwAABEDAJsD3gLLAAmxAQG4AsuwNSsA//8AVf/ECCALshAiACcAABEDAJsC9gA8AAixAQGwPLA1KwAA//8AWv/ECdMOQRAiAAwAABEDAJgClwLLAAmxAQG4AsuwNSsA//8AVf/ECCALshAiACcAABEDAJgBrgA8AAixAQGwPLA1KwAA//8AWvz1CdMLaBAiAAwAABADAJ4DxgAA//8AVfz1CCAI2RAiACcAABADAJ4C2QAA//8AI/z1CV8LLBAiAAsAABADAJ4DSwAA//8AUPz1BesKmRAiADMAABADAJ4CQQAA//8AIwAACV8OQRAiAAsAABEDAJkCSwLLAAmxAQG4AsuwNSsA//8AUP/FBfoM1hAiADMAABEDAWIDcQzqAAmxAQG4DOqwNSsA//8AIwAACV8LLBAiAAsAABEDAXsA0QHpAAmxAQG4AemwNSsA//8ATP/FBesKmRAiADMAABEDAWb/ogHDAAmxAQG4AcOwNSsA//8Aqv/ECjIODBAiAA8AABEDAEkCvgLLAAmxAQG4AsuwNSsA//8Alv/ECIALfRAiAC4AABEDAEkB2wA8AAixAQGwPLA1KwAA//8Aqv/ECjINVxAiAA8AABEDAGsCvALLAAmxAQG4AsuwNSsA//8Alv/ECIAKyBAiAC4AABEDAGsB2QA8AAixAQGwPLA1KwAA//8Aqv/ECjIODRAiAA8AABEDAJQC0ALLAAmxAQG4AsuwNSsA//8Alv/ECIALfhAiAC4AABEDAJQB7QA8AAixAQGwPLA1KwAA//8Aqv/ECjIPJhAiAA8AABEDAJYDDQLLAAmxAQK4AsuwNSsA//8Alv/ECIAMlxAiAC4AABEDAJYCKgA8AAixAQKwPLA1KwAA//8Aqv/ECjIOQRAiAA8AABEDAW0DDgLLAAmxAQK4AsuwNSsA//8Alv/ECIALshAiAC4AABEDAW0CKwA8AAixAQKwPLA1KwAA//8Aqv0+CjILLBAiAA8AABEDAXwDuAA7AAixAQGwO7A1KwAA//8Alv0+CIUInRAiAC4AABEDAJcFHgA7AAixAQGwO7A1KwAA//8AbgAAEJoOQRAiABgAABEDAJgGCgLLAAmxAQG4AsuwNSsA//8ARgAADh0LshAiADUAABEDAJgEuAA8AAixAQGwPLA1KwAA//8AGQAACoYOQRAiABsAABEDAJgC1gLLAAmxAQG4AsuwNSsA//8AN/zOCNMLdhAiADkAABADAJgCCwAA//8AqgAACTMOQRAiAB4AABEDAJsDowLLAAmxAQG4AsuwNSsA//8AcwAAB9ALdhAiADgAABADAJsC5gAA//8AqgAACTMNvBAiAB4AABEDAJUDXwLLAAmxAQG4AsuwNSsA//8AcwAAB9AK8RAiADgAABADAJUCogAA//8AqgAAC8kLLBACAAAAAAABAKr8NQKJ/+wAAwAYQBUAAQAAAVcAAQEAXwAAAQBPERACCBgrASETIQHh/slPAZD8NQO3AAAAAAEAqvzsAn7/agADAC1LsDFQWEALAAEBAF8AAAAjAE4bQBAAAQAAAVcAAQEAXwAAAQBPWbQREAIIGCsBIxMhAaT6TgGG/OwCfgAAAAABAKsAqwJ/AykAAwAYQBUAAAEBAFcAAAABXwABAAFPERACCBgrATMDIQGF+k7+egMp/YIAAf6o/M4CPgidAA8AMEuwMVBYQBAAAgIhTQABAQBhAAAAKwBOG0ANAAEAAAEAZQACAiECTlm1FyEiAwgZKyUQACEjETMyPgQ1ESECPv5Z/lFAQG6ZYzcbBQGVWv44/jwBbjdac3l0LQhDAAAAAQCqAkgGHQN0AAMAGEAVAAEAAAFXAAEBAF8AAAEATxEQAggYKwEhESEGHfqNBXMCSAEsAAEAq/0DA5kAsQAXADpACwwBAQABTAsAAgBKS7AxUFhACwAAAAFhAAEBIwFOG0AQAAABAQBZAAAAAWEAAQABUVm0NCcCCBgrJQ4DFRQWMzI2NxEOASMiLgI1NAAlAs1IclAropstYTY5dDF5xIlKAQIBCIYwbXFwMmFZBwf+6AgHMl6HVp4BIIMAAAAAAQCqAgEL5gNLAAMAGEAVAAEAAAFXAAEBAF8AAAEATxEQAggYKwEhESEL5vTECzwCAQFKAAEAqglBAkIK8QADAC1LsCFQWEALAAAAAV8AAQEeAE4bQBAAAQAAAVcAAQEAXwAAAQBPWbQREAIIGCsBIREhAkL+aAGYCUEBsAAAAP//AIz/xAsYDkEQIgCpAAARAwCbBJ0CywAJsQMBuALLsDUrAP//AFr87AnTC2gQIgAMAAAQAwFjA3sAAP//ACP87AlfCywQIgALAAAQAwFjAwAAAAACAKoI9wUEC3YAAwAHADKxBmREQCcCAQABAQBXAgEAAAFfBQMEAwEAAU8EBAAABAcEBwYFAAMAAxEGCBcrsQYARBsBIQEhEyEBqtYBcv68AQ7WAXL+vAj3An/9gQJ//YEAAAD//wBuAAAQmg5BECIAGAAAEQMAmwdRAssACbEBAbgCy7A1KwD//wBuAAAQmg5BECIAGAAAEQMAnAWZAssACbEBAbgCy7A1KwD//wBuAAAQmg28ECIAGAAAEQMAnQXjAssACbEBArgCy7A1KwD//wAZAAAKhg5BECIAGwAAEQMAnAJlAssACbEBAbgCy7A1KwD//wAjAAAOHg5BECIApQAAEQMAmwhtAssACbECAbgCy7A1KwD//wBk/8QPTQuyECIApwAAEQMAmwamADwACLEDAbA8sDUrAAD//wBu/8QI2guyECIAqgAAEQMAmwNxADwACLEDAbA8sDUrAAD//wBV/OwIIAjZECIAJwAAEAMBYwKOAAD//wBQ/OwF6wqZECIAMwAAEAMBYwH2AAD//wBGAAAOHQuyECIANQAAEQMAmwX/ADwACLEBAbA8sDUrAAD//wBGAAAOHQuyECIANQAAEQMAnARHADwACLEBAbA8sDUrAAD//wBGAAAOHQstECIANQAAEQMAnQSRADwACLEBArA8sDUrAAD//wA3/M4I0wt2ECIAOQAAEAMAnAGaAAAAAQCqArEHOgP7AAMAGEAVAAEAAAFXAAEBAF8AAAEATxEQAggYKwEhESEHOvlwBpACsQFKAAEAlv0DA1L/7QAZAEdACgsBAQAMAQIBAkxLsDFQWEAVAAMDAGEAAAAnTQABAQJhAAICIwJOG0ASAAEAAgECZQADAwBhAAAAJwBOWbYYMzYQBAgaKwUiDgIVFBYzMjY3EQ4BIyIuAjU0PgI3A0tSo4JRl4kmWDE2ay5vtYJHZrT4kjsyUGQzREwHB/7oCAcvVnhKWJhwQQIAAQAAAAEAACItLFJfDzz1AA8PoAAAAADhMsBEAAAAAOEzDiz+qPw1E1ANIAAAAAYAAgAAAAAAAAABAAALkP0KASwT+v6o/iATUAABAAAAAAAAAAAAAAAAAAABfQxzAKoAAAAAAfQAAAOEAAALpQCMA1IAQAizAKoC+QCqCqAAqghjAKoIiwCqCYIAIwotAFoLdwCMC6MAjArcAKoJqwBVCqAAqgp9AKoKlQCqCmUAqgukAIwLAgAjCrIAIxEIAG4KhQCqCtIANwqfABkOTgCqCz8AqgndAKoDUgCqCUgAbgLVAKAJegCgCXoAbgl6AG4JegCgCQ0Abgh6AFUJFgBuCT4AZAl6AG4JIACgCSAAoA5xAKAJIACWBlkAoALVAJYC1f6oBpUAUAZoAFAJCwA3DmQARgkBAKAJoQBBCEMAcwkKADcDUgBACxgAjAcmAG4KHgCqCoMAjAtUAKoKdACqCrcAjAmGAG4K0gCMCrcAjAhdAKoIqACqB2IAqgbbAKoFigCqBpcAqwaXAKoDUgCqCREAqgioAKoJEQCqA1IAqgmiAFUC+QCqBTkAqgwkAKoO5wCMCi0AWgx6AIwNtQCrC0cAjAVtAI0FbQBaBbgAjALbAKoFuABkBDAAjAQwAGQD2wCqA9sAqgYzAKoGMwCqA1IAQAWrAEAEbQCqCScAqgvhAKoQzACqBWQAqgxzAKoNuwCMDxUAjQ8VAI0McwCqCQ0AbgqlAKoKnwAZCBEAWwioAKoIqACqCC4AqgogAKoC2wCqCfYAqgNSAKoDUgCqCaIAqgVCAI0GtACqBs4AqwR6AKsFzwCqBhsAqgZUAKoKpACqCz4ArAvjAKsL3wCqE/oAqwxzAKoKZACqCHoAVQeoAKoHqACqCTAAqgdnAKsHZwBVC+MAqwvjAFUFOgCqAu0AqgTDAKoEEgCrBPQAqgT1AKsDVwDhBB4AqgQeAKoFQwCqBEUAqwlqAFAJagBQCmUAqgl6AKAJtwCqCUgAbg50ACMO/QCMD7sAZA/uAG4LpACMCUgAbgsCACMLAgAjCwIAIwsCACMLAgAjCwIAIwt3AIwHRACqCqD/agqg/2oIswCqCLMAqgizAKoIswCqAvn/OwL5AKoC+f+sAvn/hQhj/54G1QCrCz8AqgulAIwLpQCMC6UAjAulAIwLpQCMCi0AWgrcAKoK3ACqCtwAqgrcAKoKnwAZCp8AGQndAKoJPgBkCT4AZAk+AGQJPgBkCT4AZAk+AGQJDQBuCXoAbgawAKsJFgBuCRYAbgkWAG4JFgBuA1f/agNXAOEDV//bA1f/tALV/3QFUwCqCSAAoAlIAG4JSABuCUgAbglIAG4JSABuCHoAVQkgAJYJIACWCSAAlgkgAJYJCgA3CQoANwhDAHMLAgAjCT4AZAsCACMJPgBkCwIAIwk+AGQLdwCMCQ0Abgt3AIwJDQBuC3cAjAkNAG4LdwCMCQ0AbgqgAKoJegBuCLMAqgkWAG4IswCqCRYAbgizAKoJFgBuCLMAqgkWAG4IswCqCRYAbgujAIwJegBuC6MAjAl6AG4LowCMCXoAbgujAIwJegBuCqAAqgkg/5kKoP+yCSD/nwL5/3YDV/+lAvn/dANX/6MC+f+IA1f/uAL5/5cC1f9+AvkAqgykAKoFqgCWCasAVQLU/qgKhQCqCQEAoAkBAKAIYwCqAtUAoAhjAKoC1QA/CGMAqgLVAKAIYwCqAtUAoAs/AKoJIACgCz8AqgkgAKALPwCqCSAAoAxzAKoMcwCqDHMAqgulAIwJSABuC6UAjAlIAG4LpQCMCUgAbgqVAKoGWQCgCpUAqgZZAEAKlQCqBlkAoAotAFoIegBVCi0AWgh6AFUKLQBaCHoAVQmCACMGaABQCYIAIwZoAFAJggAjBmgATArcAKoJIACWCtwAqgkgAJYK3ACqCSAAlgrcAKoJIACWCtwAqgkgAJYK3ACqCSAAlhEIAG4OZABGCp8AGQkKADcJ3QCqCEMAcwndAKoIQwBzDHMAqgMzAKoDKQCqAykAqwLU/qgGxwCqBEQAqwyQAKoC7QCqC6QAjAotAFoJggAjBa8AqhEIAG4RCABuEQgAbgqfABkOdAAjD7sAZAlIAG4IegBVBmgAUA5kAEYOZABGDmQARgkKADcH5ACqA+gAlgAAAEIAQgBCAEIArAC+APABCAEyAVQBfgGgAjICogM2A3oDvAQKBHgE2AUiBZoF0gX6BjIGXgaQBrwG8AcYB0QHXAe+B+AIcgkKCaIKNAqcCx4LjgwkDO4NQA2UDggOXA6ODsIPGg9yD7YP3hAWEFQQhhCyEQQRKhGUEegSVhLiExwTkhQoFGQU9hWKFaQV1BYSFjYWnhbQFtwW7hcIFzYXRhd0F+YX/hgKGG4ZwBpcGvobtBxIHHocih00HVIdYh3GHdYd5h32HgIeEh4aHiYeQB5eHngekh6wHrgfBh/gILwgxCEuIagh9iJ8IpoirCLQIu4jHCMsIzwjTiNeI64kICRwJLAlDCV8Jcgl8CYKJiAmNicuJzYnfig+KG4osCkeKUIpUileKW4ppCnCKhIqViqAKqYqvirKKuYrECtwK3wriCvWLGgtCi2SLd4uPC9QMAIwhDD+MRAxIjE0MUYxWDFqMXYxkDGiMaoxvDHOMeAx8jIEMhYyKDI6MkwyYDJyMoQyljKoMroyzDLeMvAzAjMUMyYzODNKM1wzbjOAM5IzpDO2M8gz1DPmNAA0EjQkNDY0SDRaNGo0fDSONKA0tDTGNNg06jT8NQ41IDUyNUQ1VjVoNXo1hjWSNZ41sDXCNdQ15jX4Ngo2HDYuNkA2UjZkNnY2iDaaNqw2vjbQNuI29DcGNxg3Kjc8N043YDdyN4Q3ljeoN7o3zDfeN+o3/DgOOCA4MjhEOFY4aDh6OIw4njiwOMI41DjmOPI4/jkQOSI5Ljk6OWY5eDmKOZY5ojm0OcY52DnqOfw6DjoaOiY6ODpKOlI6WjpiOnQ6hjqYOqo6vDrOOuA68jr+Owo7HDsuO0A7UjtkO3Y7gjuOO5o7pju4O8o73DvuPAA8EjwkPDY8SDxaPGw8fjyQPKI8tDzGPNg86jz8PQg9Gj0mPTg9RD1MPWg9jj2oPd49+D4+Plg+fj6QPpw+qD7aPuw+/j8QPyI/ND9GP1g/ZD9wP4I/lD+mP7I/zEAYAAEAAAF9AHQABwBpAAUAAgAiAEsAjQAAAHwODAADAAQAAAAaAT4AAQAAAAAAAAANAAAAAQAAAAAAAQAGAA0AAQAAAAAAAgAHABMAAQAAAAAAAwAoABoAAQAAAAAABAAOAEIAAQAAAAAABQAjAFAAAQAAAAAABgAOAHMAAQAAAAAABwAHAIEAAQAAAAAACQANAIgAAQAAAAAACgA8AJUAAQAAAAAADAAkANEAAQAAAAAADQIrAPUAAQAAAAAADgAkAyAAAwABBAkAAAAaA0QAAwABBAkAAQAMA14AAwABBAkAAgAOA2oAAwABBAkAAwBQA3gAAwABBAkABAAcA8gAAwABBAkABQBGA+QAAwABBAkABgAcBCoAAwABBAkABwAOBEYAAwABBAkACQAaBFQAAwABBAkACgB4BG4AAwABBAkADABIBOYAAwABBAkADQRWBS4AAwABBAkADgBICYSpcmFqZXNocmFqcHV0Tm9oZW1pUmVndWxhclZlcnNpb24gMS4wMDA7O05vaGVtaS1SZWd1bGFyOzIwMjM7Rkw3MjBOb2hlbWkgUmVndWxhclZlcnNpb24gMS4wMDA7IHR0ZmF1dG9oaW50ICh2MS44LjQpTm9oZW1pLVJlZ3VsYXJOT0hFTUmqcmFqZXNoIHJhanB1dE5vaGVtqmkgdHlwZWZhY2UuLCAgZGVzaWduIGFuZCBkaXN0cmlidXRlZCBieSBSYWplc2ggUmFqcHV0Lmh0dHBzOi8vd3d3LmJlaGFuY2UubmV0L3JhanB1dHJhamVzaEJ5IGRvd25sb2FkaW5nL2luc3RhbGxpbmcgTk9IRU1JqiBmcmVlIHR5cGVmYWNlIHlvdSBhZ3JlZSB0byB0aGlzIGxpY2Vuc2UuClRoaXMgdHlwZWZhY2UgaXMgZnJlZXdhcmUsIHlvdSBjYW4gdXNlIGl0IGZyZWVseSBmb3IgcGVyc29uYWwgYW5kIGNvbW1lcmNpYWwgcHJvamVjdHMuIFRoZSB0eXBlZmFjZSBmaWxlcyBtYXkgbm90IGJlIG1vZGlmaWVkIHdpdGhvdXQgd3JpdHRlbiBwZXJtaXNzaW9uIGZyb20gUmFqZXNoIFJhanB1dCAocmFqcHV0cmFqZXNoXzQ0OEB5YWhvby5jb20pLgpSYWplc2ggUmFqcHV0IGlzIG5vdCBsaWFibGUgZm9yIGFueSBkYW1hZ2UgcmVzdWx0aW5nIGZyb20gdGhlIHVzZSBvZiB0aGlzIHR5cGVmYWNlLiBFeGNlcHQgZm9yIHlvdXIgcmlnaHQgdG8gdXNlIHRoaXMgdHlwZWZhY2UsIGFsbCBvdGhlciByaWdodHMgYXJlIG93bmVkIGFuZCByZXRhaW5lZCBieSBSYWplc2ggUmFqcHV0LgpUaGFuayB5b3UgZm9yIHlvdXIgc3VwcG9ydC4KUGxlYXNlIHNwcmVhZCB0aGUgd29yZCBhcm91bmQsIGlmIHlvdSBsaWtlIHRoZSBOT0hFTUmqIHR5cGVmYWNlLmh0dHBzOi8vd3d3LmJlaGFuY2UubmV0L3JhanB1dHJhamVzaACpAHIAYQBqAGUAcwBoAHIAYQBqAHAAdQB0AE4AbwBoAGUAbQBpAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMAA7ADsATgBvAGgAZQBtAGkALQBSAGUAZwB1AGwAYQByADsAMgAwADIAMwA7AEYATAA3ADIAMABOAG8AaABlAG0AaQAgAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMAA7ACAAdAB0AGYAYQB1AHQAbwBoAGkAbgB0ACAAKAB2ADEALgA4AC4ANAApAE4AbwBoAGUAbQBpAC0AUgBlAGcAdQBsAGEAcgBOAE8ASABFAE0ASSEiAHIAYQBqAGUAcwBoACAAcgBhAGoAcAB1AHQATgBvAGgAZQBtISIAaQAgAHQAeQBwAGUAZgBhAGMAZQAuACwAIAAgAGQAZQBzAGkAZwBuACAAYQBuAGQAIABkAGkAcwB0AHIAaQBiAHUAdABlAGQAIABiAHkAIABSAGEAagBlAHMAaAAgAFIAYQBqAHAAdQB0AC4AaAB0AHQAcABzADoALwAvAHcAdwB3AC4AYgBlAGgAYQBuAGMAZQAuAG4AZQB0AC8AcgBhAGoAcAB1AHQAcgBhAGoAZQBzAGgAQgB5ACAAZABvAHcAbgBsAG8AYQBkAGkAbgBnAC8AaQBuAHMAdABhAGwAbABpAG4AZwAgAE4ATwBIAEUATQBJISIAIABmAHIAZQBlACAAdAB5AHAAZQBmAGEAYwBlACAAeQBvAHUAIABhAGcAcgBlAGUAIAB0AG8AIAB0AGgAaQBzACAAbABpAGMAZQBuAHMAZQAuAAoAVABoAGkAcwAgAHQAeQBwAGUAZgBhAGMAZQAgAGkAcwAgAGYAcgBlAGUAdwBhAHIAZQAsACAAeQBvAHUAIABjAGEAbgAgAHUAcwBlACAAaQB0ACAAZgByAGUAZQBsAHkAIABmAG8AcgAgAHAAZQByAHMAbwBuAGEAbAAgAGEAbgBkACAAYwBvAG0AbQBlAHIAYwBpAGEAbAAgAHAAcgBvAGoAZQBjAHQAcwAuACAAVABoAGUAIAB0AHkAcABlAGYAYQBjAGUAIABmAGkAbABlAHMAIABtAGEAeQAgAG4AbwB0ACAAYgBlACAAbQBvAGQAaQBmAGkAZQBkACAAdwBpAHQAaABvAHUAdAAgAHcAcgBpAHQAdABlAG4AIABwAGUAcgBtAGkAcwBzAGkAbwBuACAAZgByAG8AbQAgAFIAYQBqAGUAcwBoACAAUgBhAGoAcAB1AHQAIAAoAHIAYQBqAHAAdQB0AHIAYQBqAGUAcwBoAF8ANAA0ADgAQAB5AGEAaABvAG8ALgBjAG8AbQApAC4ACgBSAGEAagBlAHMAaAAgAFIAYQBqAHAAdQB0ACAAaQBzACAAbgBvAHQAIABsAGkAYQBiAGwAZQAgAGYAbwByACAAYQBuAHkAIABkAGEAbQBhAGcAZQAgAHIAZQBzAHUAbAB0AGkAbgBnACAAZgByAG8AbQAgAHQAaABlACAAdQBzAGUAIABvAGYAIAB0AGgAaQBzACAAdAB5AHAAZQBmAGEAYwBlAC4AIABFAHgAYwBlAHAAdAAgAGYAbwByACAAeQBvAHUAcgAgAHIAaQBnAGgAdAAgAHQAbwAgAHUAcwBlACAAdABoAGkAcwAgAHQAeQBwAGUAZgBhAGMAZQAsACAAYQBsAGwAIABvAHQAaABlAHIAIAByAGkAZwBoAHQAcwAgAGEAcgBlACAAbwB3AG4AZQBkACAAYQBuAGQAIAByAGUAdABhAGkAbgBlAGQAIABiAHkAIABSAGEAagBlAHMAaAAgAFIAYQBqAHAAdQB0AC4ACgBUAGgAYQBuAGsAIAB5AG8AdQAgAGYAbwByACAAeQBvAHUAcgAgAHMAdQBwAHAAbwByAHQALgAKAFAAbABlAGEAcwBlACAAcwBwAHIAZQBhAGQAIAB0AGgAZQAgAHcAbwByAGQAIABhAHIAbwB1AG4AZAAsACAAaQBmACAAeQBvAHUAIABsAGkAawBlACAAdABoAGUAIABOAE8ASABFAE0ASSEiACAAdAB5AHAAZQBmAGEAYwBlAC4AaAB0AHQAcABzADoALwAvAHcAdwB3AC4AYgBlAGgAYQBuAGMAZQAuAG4AZQB0AC8AcgBhAGoAcAB1AHQAcgBhAGoAZQBzAGgAAAACAAAAAAAA/zgAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAX0AAAABAQIAAwAyAB4AKAAsACsALwApADcANgAmACoAOAAtACcAJQA1ADMANAAkADkAOgAuADsAPAAwADEAPQARAFIATwBFAEcAVABTAEYAVgBIAEQASgBRAEsAUABYAFUATABNAEkAVwBZAFoATgBbAF0AXAAPABMAFAAVABYAFwAYABkAGgAbABwAEAAOAA0AQQDZABIAPwAdAB8AIAAhAAQAIgAKAAUABgAjAAcBAwAIAAkACwAMAF4AXwBgAD4AQAC2ALcAtAC1AMQAxQCHAEIAsgCzANoApACMAIoAiwC9AIQAhQCWAKYA7wCTAPAAuADoAKsAwwCjAKIAgwCdAJ4A8QDyAPMBBAC8APUA9AD2AMYBBQCIAIYAggDCAGEAvgC/AKkAqgDbANwA3QDgANgA4QDXAI0AQwCOAN4AwADBAO0A7gCJAOoAkACwAKAAsQCRAKEArQDJAMcArgBiAGMAZAEGAOkBBwDLAGUAyADKAM8AzADNAM4A4gEIAGYA0wDQANEArwBnAOQA1gDUANUAaAC7AOsA5gBqAGkAawBtAGwAbgBvAQEBCQBxAHAAcgBzAHUAdAB2AHcA4wEKAHgAegB5AHsAfQB8AOUAfwB+AIAAgQDsALoA5wELAQwBDQEOAQ8BEAD9AP4BEQESARMBFAD/AQABFQEWARcBGAEZARoBGwEcAR0BHgEfASABIQEiAPgA+QEjASQBJQEmAScBKAEpASoBKwEsAS0BLgEvATABMQEyAPoBMwE0ATUBNgE3ATgBOQE6ATsBPAE9AT4BPwFAAUEBQgFDAUQBRQFGAUcBSAFJAUoBSwFMAU0BTgFPAVABUQFSAVMBVAFVAVYBVwFYAVkBWgD7APwBWwFcAV0BXgFfAWABYQFiAWMBZAFlAWYBZwFoAWkBagFrAWwBbQFuAW8BcAFxAXIBcwF0AXUBdgF3AXgBeQF6AXsBfAF9AX4BfwGAAN8BgQGCAYMBhAGFAYYBhwGIAYkBigGLAYwBjQGOAY8HdW5pMDAwRARFdXJvB3VuaTIwNzQHdW5pMDNCQwZldGhiYXIGRGNyb2F0CGNyb3NzYmFyC2V0aGJhci5jYXNlDWNyb3NzYmFyLmNhc2UHQW1hY3JvbgdhbWFjcm9uBkFicmV2ZQZhYnJldmUHQW9nb25lawdhb2dvbmVrC0NjaXJjdW1mbGV4C2NjaXJjdW1mbGV4CkNkb3RhY2NlbnQKY2RvdGFjY2VudAZEY2Fyb24GZGNhcm9uB0VtYWNyb24HZW1hY3JvbgZFYnJldmUGZWJyZXZlCkVkb3RhY2NlbnQKZWRvdGFjY2VudAdFb2dvbmVrB2VvZ29uZWsGRWNhcm9uBmVjYXJvbgtHY2lyY3VtZmxleAtnY2lyY3VtZmxleApHZG90YWNjZW50Cmdkb3RhY2NlbnQHdW5pMDEyMgd1bmkwMTIzC0hjaXJjdW1mbGV4C2hjaXJjdW1mbGV4BEhiYXIEaGJhcgZJdGlsZGUGaXRpbGRlB0ltYWNyb24HaW1hY3JvbgZJYnJldmUGaWJyZXZlB0lvZ29uZWsHaW9nb25lawJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAd1bmkwMTM2B3VuaTAxMzcMa2dyZWVubGFuZGljBkxhY3V0ZQZsYWN1dGUHdW5pMDEzQgd1bmkwMTNDBkxjYXJvbgZsY2Fyb24ETGRvdARsZG90Bk5hY3V0ZQZuYWN1dGUHdW5pMDE0NQd1bmkwMTQ2Bk5jYXJvbgZuY2Fyb24LbmFwb3N0cm9waGUDRW5nA2VuZwdPbWFjcm9uB29tYWNyb24GT2JyZXZlBm9icmV2ZQ1PaHVuZ2FydW1sYXV0DW9odW5nYXJ1bWxhdXQGUmFjdXRlBnJhY3V0ZQd1bmkwMTU2B3VuaTAxNTcGUmNhcm9uBnJjYXJvbgZTYWN1dGUGc2FjdXRlC1NjaXJjdW1mbGV4C3NjaXJjdW1mbGV4B3VuaTAxNjIHdW5pMDE2MwZUY2Fyb24GdGNhcm9uBFRiYXIEdGJhcgZVdGlsZGUGdXRpbGRlB1VtYWNyb24HdW1hY3JvbgZVYnJldmUGdWJyZXZlBVVyaW5nBXVyaW5nDVVodW5nYXJ1bWxhdXQNdWh1bmdhcnVtbGF1dAdVb2dvbmVrB3VvZ29uZWsLV2NpcmN1bWZsZXgLd2NpcmN1bWZsZXgLWWNpcmN1bWZsZXgLeWNpcmN1bWZsZXgGWmFjdXRlBnphY3V0ZQpaZG90YWNjZW50Cnpkb3RhY2NlbnQFbG9uZ3MKY29tbWFjY2VudAtjb21tYWNjZW50Mgtjb21tYWNjZW50Mwd1bmkwMjM3B3RiYXJuZXcHb2dvbmVrMgpjdXN0b21iYXJICmRvdGFjY2VudDILT3NsYXNoYWN1dGUHdW5pMDIxOAd1bmkwMjFBBldhY3V0ZQZXZ3JhdmUJV2RpZXJlc2lzBllncmF2ZQdBRWFjdXRlB2FlYWN1dGULb3NsYXNo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PFkusTABFCstsEQssDsriiAgPLAGI0KKOCMgLkawAiVGsBdDWFAbUllYIDxZLrEwARQrsAZDLrAwKy2wRSywABawBCWwBCYgICBGI0dhsAwjQi5HI0cjYbALQysjIDwgLiM4sTABFCstsEYssQoEJUKwABawBCWwBCUgLkcjRyNhILAGI0KxDABCsAtDKyCwYFBYILBAUVizBCAFIBuzBCYFGllCQiMgR7AGQ7ACYiCwAFBYsEBgWWawAWNgILABKyCKimEgsARDYGQjsAVDYWRQWLAEQ2EbsAVDYFmwAyWwAmIgsABQWLBAYFlmsAFjYbACJUZhOCMgPCM4GyEgIEYjR7ABKyNhOCFZsTABFCstsEcssQA6Ky6xMAEUKy2wSCyxADsrISMgIDywBiNCIzixMAEUK7AGQy6wMCstsEkssAAVIEewACNCsgABARUUEy6wNiotsEossAAVIEewACNCsgABARUUEy6wNiotsEsssQABFBOwNyotsEwssDkqLbBNLLAAFkUjIC4gRoojYTixMAEUKy2wTiywCiNCsE0rLbBPLLIAAEYrLbBQLLIAAUYrLbBRLLIBAEYrLbBSLLIBAUYrLbBTLLIAAEcrLbBULLIAAUcrLbBVLLIBAEcrLbBWLLIBAUcrLbBXLLMAAABDKy2wWCyzAAEAQystsFksswEAAEMrLbBaLLMBAQBDKy2wWyyzAAABQystsFwsswABAUMrLbBdLLMBAAFDKy2wXiyzAQEBQystsF8ssgAARSstsGAssgABRSstsGEssgEARSstsGIssgEBRSstsGMssgAASCstsGQssgABSCstsGUssgEASCstsGYssgEBSCstsGcsswAAAEQrLbBoLLMAAQBEKy2waSyzAQAARCstsGosswEBAEQrLbBrLLMAAAFEKy2wbCyzAAEBRCstsG0sswEAAUQrLbBuLLMBAQFEKy2wbyyxADwrLrEwARQrLbBwLLEAPCuwQCstsHEssQA8K7BBKy2wciywABaxADwrsEIrLbBzLLEBPCuwQCstsHQssQE8K7BBKy2wdSywABaxATwrsEIrLbB2LLEAPSsusTABFCstsHcssQA9K7BAKy2weCyxAD0rsEErLbB5LLEAPSuwQistsHossQE9K7BAKy2weyyxAT0rsEErLbB8LLEBPSuwQistsH0ssQA+Ky6xMAEUKy2wfiyxAD4rsEArLbB/LLEAPiuwQSstsIAssQA+K7BCKy2wgSyxAT4rsEArLbCCLLEBPiuwQSstsIMssQE+K7BCKy2whCyxAD8rLrEwARQrLbCFLLEAPyuwQCstsIYssQA/K7BBKy2whyyxAD8rsEIrLbCILLEBPyuwQCstsIkssQE/K7BBKy2wiiyxAT8rsEIrLbCLLLILAANFUFiwBhuyBAIDRVgjIRshWVlCK7AIZbADJFB4sQUBFUVYMFktsQQARLIPCBMrAEu4ADJSWLEBAY5ZsAG5CAAIAGNwsARFXFixAAdCtAApAAMAKrEAB0K3MAQcCBIDAwoqsQAHQrc2AiYGFwEDCipZsQAKQrwMQAdABMAAAwALKrEADUK8AEAAQABAAAMACyq5AAMAAESxJAGIUViwQIhYuQADAGREsSgBiFFYuAgAiFi5AAMAAERZG7EnAYhRWLoIgAABBECIY1RYuQADAABEWVlZWVm3MgQeCBQDAw4quAH/hbAEjbECAESzBWQGAERECnR0ZmF1dG9oaW50IHZlcnNpb24gPSAxLjguNAoKYWRqdXN0LXN1YmdseXBocyA9IDAKZGVmYXVsdC1zY3JpcHQgPSBsYXRuCmR3LWNsZWFydHlwZS1zdGVtLXdpZHRoLW1vZGUgPSBxdWFudGl6ZWQKZmFsbGJhY2stc2NhbGluZyA9IDAKZmFsbGJhY2stc2NyaXB0ID0gbGF0bgpmYWxsYmFjay1zdGVtLXdpZHRoID0gMApnZGktY2xlYXJ0eXBlLXN0ZW0td2lkdGgtbW9kZSA9IHN0cm9uZwpncmF5LXN0ZW0td2lkdGgtbW9kZSA9IHF1YW50aXplZApoaW50aW5nLWxpbWl0ID0gNTAKaGludGluZy1yYW5nZS1tYXggPSA1MApoaW50aW5nLXJhbmdlLW1pbiA9IDgKaGludC1jb21wb3NpdGVzID0gMAppZ25vcmUtcmVzdHJpY3Rpb25zID0gMAppbmNyZWFzZS14LWhlaWdodCA9IDEyCnJlZmVyZW5jZSA9IApyZWZlcmVuY2UtaW5kZXggPSAwCnN5bWJvbCA9IDAKVFRGQS1pbmZvID0gMQp3aW5kb3dzLWNvbXBhdGliaWxpdHkgPSAxCngtaGVpZ2h0LXNuYXBwaW5nLWV4Y2VwdGlvbnMgPSA4LTE1CmNvbnRyb2wtaW5zdHJ1Y3Rpb25zID0gCgoKAAAAAAEAAAAA) format('truetype');
          font-weight: 100 499;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Givonic';
          src: url(data:font/otf;base64,T1RUTwALAIAAAwAwQ0ZGIEFyymQAAFmYAAAZUUdQT1O/J/TYAAA5JAAAIHJPUy8yYrnc3QAAASAAAABgY21hcBRlFv4AAAeEAAACBmhlYWQdppI2AAAAvAAAADZoaGVhBswDPgAAAPQAAAAkaG10eMXcE9oAAAmMAAABiGtlcm6osbHkAAALNAAALfBtYXhwAGJQAAAAARgAAAAGbmFtZQaDq5AAAAGAAAAGA3Bvc3T/nwAyAAALFAAAACAAAQAAAAEAABGk5/xfDzz1AAMD6AAAAADdcEWVAAAAAN2nCXT/v/8XA7kDNgAAAAMAAgAAAAAAAAABAAAC7v8GAGQD0/+/AAIDuQABAAAAAAAAAAAAAAAAAAAAYgAAUAAAYgAAAAMCBAHCAAUAAAKKAlgAAABLAooCWAAAAV4AMgEsAAAAAAAAAAAAAAAAgAAAAwAAAAAAAAAAAAAAAFBZUlMAAAAAAH4C7v8GAGQDmwDpAAAAAQAAAAAB9AK8ACAAIAACAAAAMwJqAAEAAAAAAAAAPQAAAAEAAAAAAAEADAA9AAEAAAAAAAIABwBJAAEAAAAAAAMALQBQAAEAAAAAAAQADAA9AAEAAAAAAAUADQB9AAEAAAAAAAYACwCKAAEAAAAAAAcAMQCVAAEAAAAAAAgAEQDGAAEAAAAAAAkADgDXAAEAAAAAAAoAPQAAAAEAAAAAAAsAEgDlAAEAAAAAAAwAEgDlAAEAAAAAABAADAA9AAEAAAAAABEABwBJAAEAAAAAABIADAA9AAEAAAAAAQAABgD3AAEAAAAAAQEABAD9AAEAAAAAAQIACwEBAAEAAAAAAQMABQEMAAEAAAAAAQQABwBJAAEAAAAAAQUABgERAAEAAAAAAQYACQEXAAEAAAAAAQcABAEgAAEAAAAAAQgACgEkAAEAAAAAAQkABQEuAAMAAQQJAAAAegEzAAMAAQQJAAEAGAGtAAMAAQQJAAIADgHFAAMAAQQJAAMAWgHTAAMAAQQJAAQAFgItAAMAAQQJAAUAGgJDAAMAAQQJAAYAFgItAAMAAQQJAAcAYgJdAAMAAQQJAAgAIgK/AAMAAQQJAAkAHALhAAMAAQQJAAoAegEzAAMAAQQJAAsAJAL9AAMAAQQJAAwAJAL9AAMAAQQJABAAGAGtAAMAAQQJABEADgHFAAMAAQQJAQAADAMhAAMAAQQJAQEACAMtAAMAAQQJAQIAFgM1AAMAAQQJAQMACgNLAAMAAQQJAQQADgHFAAMAAQQJAQUADANVAAMAAQQJAQYAEgNhAAMAAQQJAQcACANzAAMAAQQJAQgAFAN7AAMAAQQJAQkACgOPQ29weXJpZ2h0IChjKSAyMDIxIGJ5IExldHRlcmhlbmQgU3R1ZGlvLiBBbGwgcmlnaHRzIHJlc2VydmVkLkdpdm9uaWMgRGVtb1JlZ3VsYXJWZXJzaW9uIDEuMDAwO1BZUlM7R2l2b25pYy1SZWd1bGFyOzIwMjE7Rkw3MjBWZXJzaW9uIDEuMDAwR2l2b25pY0RlbW9HaXZvbmljIERlbW8gaXMgYSB0cmFkZW1hcmsgb2YgTGV0dGVyaGVuZCBTdHVkaW8uTGV0dGVyaGVuZCBTdHVkaW9TYWhydWwgSGlkYXlhdHd3dy5sZXR0ZXJoZW5kLmNvbVdlaWdodFRoaW5FeHRyYSBMaWdodExpZ2h0TWVkaXVtU2VtaSBCb2xkQm9sZEV4dHJhIEJvbGRCbGFjawBDAG8AcAB5AHIAaQBnAGgAdAAgACgAYwApACAAMgAwADIAMQAgAGIAeQAgAEwAZQB0AHQAZQByAGgAZQBuAGQAIABTAHQAdQBkAGkAbwAuACAAQQBsAGwAIAByAGkAZwBoAHQAcwAgAHIAZQBzAGUAcgB2AGUAZAAuAEcAaQB2AG8AbgBpAGMAIABEAGUAbQBvAFIAZQBnAHUAbABhAHIAVgBlAHIAcwBpAG8AbgAgADEALgAwADAAMAA7AFAAWQBSAFMAOwBHAGkAdgBvAG4AaQBjAC0AUgBlAGcAdQBsAGEAcgA7ADIAMAAyADEAOwBGAEwANwAyADAARwBpAHYAbwBuAGkAYwBEAGUAbQBvAFYAZQByAHMAaQBvAG4AIAAxAC4AMAAwADAARwBpAHYAbwBuAGkAYwAgAEQAZQBtAG8AIABpAHMAIABhACAAdAByAGEAZABlAG0AYQByAGsAIABvAGYAIABMAGUAdAB0AGUAcgBoAGUAbgBkACAAUwB0AHUAZABpAG8ALgBMAGUAdAB0AGUAcgBoAGUAbgBkACAAUwB0AHUAZABpAG8AUwBhAGgAcgB1AGwAIABIAGkAZABhAHkAYQB0AHcAdwB3AC4AbABlAHQAdABlAHIAaABlAG4AZAAuAGMA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AAwACP/nAAwACf/nAAwACv+qAAwAC//nAAwADP/nAAwADf/sAAwADv/sAAwAD//nAAwAEP/nAAwAEf/nAAwAEv/nAAwAE//rAAwAFP/7AAwAFf/nAAwAFv/CAAwAF/+9AAwAGP+9AAwAGf+/AAwAGv+0AAwAG//UAAwAHP/qAAwAHf/sAAwAH//hAAwAIP/2AAwAIv/hAAwAI//hAAwAJP/sAAwAJf/0AAwAJv/sAAwAJ//hAAwAKv/sAAwAK//hAAwALP/MAAwALf/jAAwALv/jAAwAL//cAAwAMP/kAAwAMf/jAAwAMv/dAAwAM//2AAwANP/bAAwANv/2AAwAN//sAAwAOP/MAA0AA//jAA0ABP/jAA0ABf/GAA0ABv/jAA0AB//GAA0ACP/jAA0ACf/jAA0ACv/LAA0AC//jAA0ADP/jAA0ADf/GAA0ADv/GAA0AD//jAA0AEP/jAA0AEf/jAA0AEv/jAA0AE//kAA0AFP/nAA0AFf/jAA0AFv/QAA0AF//NAA0AGP/NAA0AGf/GAA0AGv/IAA0AG//jAA0AHP/sAA0AHf/lAA0AHv/nAA0AH//NAA0AIP/qAA0AIf/nAA0AIv/NAA0AI//NAA0AJP/lAA0AJf/iAA0AJv/lAA0AJ//NAA0AKP/nAA0AKf/nAA0AKv/lAA0AK//NAA0ALf/VAA0ALv/VAA0AL//dAA0AMP/iAA0AMf/VAA0AMv/sAA0AM//qAA0ANP/TAA0ANf/pAA0ANv/jAA0AN//RAA0AOP/yAA4AA//qAA4ABP/qAA4ABf/yAA4ABv/qAA4AB//yAA4ACP/qAA4ACf/qAA4ACv+8AA4AC//qAA4ADP/qAA4ADf/yAA4ADv/yAA4AD//qAA4AEP/qAA4AEf/qAA4AEv/qAA4AE//1AA4AFf/qAA4AFv/UAA4AF//KAA4AGP/KAA4AGf/PAA4AGv+2AA4AG//nAA4AHP/xAA4AHf/nAA4AHv/4AA4AH//fAA4AIP/7AA4AIf/4AA4AIv/fAA4AI//fAA4AJP/nAA4AJf/2AA4AJv/nAA4AJ//fAA4AKP/4AA4AKf/4AA4AKv/nAA4AK//fAA4ALf/qAA4ALv/qAA4AL//nAA4AMP/sAA4AMf/qAA4AMv/iAA4AM//7AA4ANP/dAA4ANf/6AA4ANv/4AA4AN//kAA4AUv/6AA4AU//6AA8AA//sAA8ABP/sAA8ABf/nAA8ABv/sAA8AB//nAA8ACP/sAA8ACf/sAA8ACv/TAA8AC//sAA8ADP/sAA8ADf/nAA8ADv/nAA8AD//sAA8AEP/sAA8AEf/sAA8AEv/sAA8AE//sAA8AFP+/AA8AFf/sAA8AFv+XAA8AF//dAA8AGP/dAA8AGf/IAA8AGv/DAA8AG//SAA8AHP/xAA8AHf/wAA8AHv/vAA8AH//KAA8AIP/4AA8AIf/vAA8AIv/KAA8AI//KAA8AJP/wAA8AJf/sAA8AJv/wAA8AJ//KAA8AKP/vAA8AKf/vAA8AKv/wAA8AK//KAA8ALP86AA8ALf/uAA8ALv/uAA8AL//FAA8AMP/sAA8AMf/uAA8AMv/sAA8AM//4AA8ANP++AA8ANv/9AA8AN//UAA8AOP86ABAAA//2ABAABP/2ABAABf/YABAABv/2ABAAB//YABAACP/2ABAACf/2ABAACv/IABAAC//2ABAADP/2ABAADf/YABAADv/YABAAD//2ABAAEP/2ABAAEf/2ABAAEv/2ABAAE//dABAAFP/oABAAFf/2ABAAFv/xABAAF//OABAAGP/OABAAGf/tABAAGv/CABAAG//3ABAAHP/sABAAHf/2ABAAHv/+ABAAH/+/ABAAIP/xABAAIf/+ABAAIv+/ABAAI/+/ABAAJP/2ABAAJf/nABAAJv/2ABAAJ/+/ABAAKP/+ABAAKf/+ABAAKv/2ABAAK/+/ABAALf/lABAALv/lABAAL//TABAAMf/lABAAMv/7ABAAM//xABAANP/OABAANQACABAANv/2ABAAN//hABEAA//qABEABP/qABEABf+TABEABv/qABEAB/+TABEACP/qABEACf/qABEACv/xABEAC//qABEADP/qABEADf+TABEADv+TABEAD//qABEAEP/qABEAEf/qABEAEv/qABEAE//eABEAFP/YABEAFf/qABEAFv/oABEAF//vABEAGP/vABEAGf/1ABEAGv/oABEAG//3ABEAHP/PABEAHf/xABEAHv/nABEAH/+nABEAIP/uABEAIf/nABEAIv+nABEAI/+nABEAJP/xABEAJf+4ABEAJv/xABEAJ/+nABEAKP/nABEAKf/nABEAKv/xABEAK/+nABEALf+dABEALv+dABEAL//JABEAMP/sABEAMf+dABEAMv/xABEAM//uABEANP/IABEANf/lABEANv/DABEAN//JABEAQ/+TABIABf/lABIAB//lABIACv/xABIADf/lABIADv/lABIAFP/+ABIAFv/qABIAF//vABIAGP/vABIAGf/3ABIAGv/oABIAHP/3ABIAHv/zABIAH//YABIAIf/zABIAIv/YABIAI//YABIAJf/zABIAJ//YABIAKP/zABIAKf/zABIAK//YABIALP+lABIALf/pABIALv/pABIAL//kABIAMP/zABIAMf/pABIAMv/zABIANP/XABIAN//pABIAOP/DABIAQ//oABIATf/gABIATv/jABMAA//5ABMABf/rABMAB//rABMACv/sABMADf/rABMADv/rABMAE//7ABMAFP/7ABMAFv/WABMAF//sABMAGP/sABMAGf/rABMAGv/oABMAG//vABMAHP/tABMAH//rABMAIv/rABMAI//rABMAJf/7ABMAJ//rABMAK//rABMALP/gABMALf/tABMALv/tABMAL//tABMAMP/qABMAMf/tABMAMv/xABMANP/eABMAN//zABMAOP/gABQAA//7ABQABP/7ABQABf/iABQABv/7ABQAB//iABQACP/7ABQACf/7ABQAC//7ABQADP/7ABQADf/iABQADv/iABQAD//7ABQAEP/7ABQAEf/7ABQAEv/7ABQAE///ABQAFP/9ABQAFf/7ABQAFv/VABQAF//7ABQAGP/7ABQAGf/3ABQAGv/3ABQAG//5ABQAHP/7ABQAHf/8ABQAH//kABQAIP/9ABQAIv/kABQAI//kABQAJP/8ABQAJf/5ABQAJv/8ABQAJ//kABQAKv/8ABQAK//kABQALP/nABQALf/wABQALv/wABQAL//tABQAMP/rABQAMf/wABQAMv/xABQAM//9ABQANP/cABQANv/4ABQAN//wABQAOP/eABUABf/lABUAB//lABUACv/xABUADf/lABUADv/lABUAFP/+ABUAFv/qABUAF//vABUAGP/vABUAGf/3ABUAGv/oABUAHP/3ABUAHv/zABUAH//YABUAIf/zABUAIv/YABUAI//YABUAJf/zABUAJ//YABUAKP/zABUAKf/zABUAK//YABUALP+lABUALf/pABUALv/pABUAL//kABUAMP/zABUAMf/pABUAMv/zABUANP/XABUAN//pABUAOP/DABUAQ//oABUATf/gABUATv/jABYAA//rABYABP/rABYABf/CABYABv/rABYAB//CABYACP/rABYACf/rABYACv+hABYAC//rABYADP/rABYADf/CABYADv/CABYAD//rABYAEP/rABYAEf/rABYAEv/rABYAE//WABYAFP/0ABYAFf/rABYAFgAFABYAF/+FABYAGP+FABYAGf/7ABYAGv+MABYAG//+ABYAHP/oABYAH//cABYAIv/cABYAI//cABYAJf/sABYAJ//cABYAK//cABYALf/DABYALv/DABYAL//yABYAMf/DABYANP/1ABYANf/xABYANv/mABYAN//3ABYAQ//qABYAUv+7ABYAU/+7ABcAA//vABcABP/vABcABf/BABcABv/vABcAB//BABcACP/vABcACf/vABcACv/2ABcAC//vABcADP/vABcADf/BABcADv/BABcAD//vABcAEP/vABcAEf/vABcAEv/vABcAE//sABcAFP+wABcAFf/vABcAFv+FABcAF//7ABcAGf/1ABcAGv/3ABcAG//yABcAHP/XABcAHf/0ABcAHv/MABcAH/+fABcAIP/3ABcAIf/MABcAIv+fABcAI/+fABcAJP/0ABcAJf/FABcAJv/0ABcAJ/+fABcAKP/MABcAKf/MABcAKv/0ABcAK/+fABcALP+6ABcALf/LABcALv/LABcAL/+eABcAMP/NABcAMf/LABcAMv/JABcAM//3ABcANP+NABcANf/qABcANv/iABcAN/+uABcAOP+mABcAQ//wABcATf/rABcATv/rABgAA//vABgABP/vABgABf/BABgABv/vABgAB//BABgACP/vABgACf/vABgACv/2ABgAC//vABgADP/vABgADf/BABgADv/BABgAD//vABgAEP/vABgAEf/vABgAEv/vABgAE//sABgAFP+wABgAFf/vABgAFv+FABgAGf/1ABgAGv/3ABgAG//yABgAHP/XABgAHf/0ABgAHv/MABgAH/+fABgAIP/3ABgAIf/MABgAIv+fABgAI/+fABgAJP/0ABgAJf/FABgAJv/0ABgAJ/+fABgAKP/MABgAKf/MABgAKv/0ABgAK/+fABgALP+6ABgALf/LABgALv/LABgAL/+eABgAMP/NABgAMf/LABgAMv/JABgAM//3ABgANP+NABgANf/qABgANv/iABgAN/+uABgAOP+mABgAQ//wABgATf/2ABgATv/2ABkAA//3ABkABP/3ABkABf+/ABkABv/3ABkAB/+/ABkACP/3ABkACf/3ABkACv/2ABkAC//3ABkADP/3ABkADf+/ABkADv+/ABkAD//3ABkAEP/3ABkAEf/3ABkAEv/3ABkAE//rABkAFP/rABkAFf/3ABkAFv/7ABkAF//1ABkAGP/1ABkAGf/3ABkAGv/1ABkAG//5ABkAHP/dABkAHf/5ABkAHv/3ABkAH//PABkAIP/7ABkAIf/3ABkAIv/PABkAI//PABkAJP/5ABkAJf/cABkAJv/5ABkAJ//PABkAKP/3ABkAKf/3ABkAKv/5ABkAK//PABkALf/DABkALv/DABkAL//gABkAMf/DABkAMv/5ABkAM//7ABkANP/cABkANf/yABkANv/kABkAN//oABkAQ//NABoAA//oABoABP/oABoABf+0ABoABv/oABoAB/+0ABoACP/oABoACf/oABoACv/2ABoAC//oABoADP/oABoADf+0ABoADv+0ABoAD//oABoAEP/oABoAEf/oABoAEv/oABoAE//oABoAFP+TABoAFf/oABoAFv+MABoAF//3ABoAGP/3ABoAGf/1ABoAGv/1ABoAG//1ABoAHP/IABoAHf/tABoAHv+8ABoAH/94ABoAIP/yABoAIf+8ABoAIv94ABoAI/94ABoAJP/tABoAJf+iABoAJv/tABoAJ/94ABoAKP+8ABoAKf+8ABoAKv/tABoAK/94ABoALP+vABoALf+4ABoALv+4ABoAL/9/ABoAMP+zABoAMf+4ABoAMv+7ABoAM//yABoANP96ABoANf/RABoANv/NABoAN/+YABoAOP+vABoAQ//4ABoATf/zABoATv/zABsABf/UABsAB//UABsACv/2ABsADf/UABsADv/UABsAE//xABsAFP/6ABsAFgADABsAF//7ABsAGf/+ABsAGv/1ABsAGwACABsAHP/uABsAHf/6ABsAHv/7ABsAH//ZABsAIv/ZABsAI//ZABsAJf/uABsAJ//ZABsAK//ZABsALf/TABsALv/TABsAL//1ABsAMf/TABsAMgAHABsANP/zABsANf/4ABsANv/1ABsAN//yABsAQ//AABwAA//sABwABP/sABwABf/lABwABv/sABwAB//lABwACP/sABwACf/sABwACv/AABwAC//sABwADP/sABwADf/lABwADv/lABwAD//sABwAEP/sABwAEf/sABwAEv/sABwAE//fABwAFf/sABwAFv/mABwAF//AABwAGP/AABwAGf/UABwAGv+wABwAG//sABwAHP/xABwAHf/0ABwAHv/7ABwAH//iABwAIP/6ABwAIv/iABwAI//iABwAJP/0ABwAJf/vABwAJv/0ABwAJ//iABwAKv/0ABwAK//iABwALf/TABwALv/TABwAL//sABwAMP/mABwAMf/TABwAMv/nABwANP/iABwANf/2ABwANv/2ABwAN//2AB0AH//wAB0AIv/wAB0AI//wAB0AJf/9AB0AJ//wAB0AK//wAB0ALf/vAB0ALv/vAB0AL//7AB0AMP/2AB0AMf/vAB0ANP/wAB0AN//7AB4AHf/7AB4AH//xAB4AIP/7AB4AIv/xAB4AI//xAB4AJf/zAB4AJ//xAB4AKP/0AB4AK//xAB4ALf/RAB4ALv/RAB4AL//6AB4AMP/5AB4AMf/RAB4AMv/2AB4ANP/nAB4ANf/2AB4ANv/2AB4AN//xAB4AUv+6AB4AU/+6AB8AHf/xAB8AHv/4AB8AH//tAB8AIP/7AB8AIf/4AB8AIv/tAB8AI//tAB8AJP/xAB8AJf/vAB8AJv/xAB8AJ//tAB8AKP/4AB8AKf/4AB8AKv/xAB8AK//tAB8ALP/kAB8ALf/PAB8ALv/SAB8AL//1AB8AMP/VAB8AMf/PAB8AMv/dAB8ANP/dAB8ANf/nAB8ANv/tAB8AN//nAB8AOP/kAB8AUv+9AB8AU/+9ACAAH//vACAAIv/vACAAI//vACAAJ//vACAAK//vACAALf/0ACAALv/0ACAAL//3ACAAMP/1ACAAMf/0ACAANP/xACAANv/7ACAAN//6ACEAH//xACEAIv/xACEAI//xACEAJf/zACEAJ//xACEAKP/0ACEAK//xACEALf/RACEALv/RACEAMP/5ACEAMf/RACEAMv/2ACEANP/nACEANf/2ACEANv/2ACEAN//xACEAUv+6ACEAU/+6ACIAHf/3ACIAHv/4ACIAH//xACIAIf/4ACIAIv/xACIAI//xACIAJP/3ACIAJf/wACIAJv/3ACIAJ//xACIAKP/4ACIAKf/4ACIAKv/3ACIAK//xACIALf/eACIALv/eACIAMP/nACIAMf/eACIAMv/nACIANP/gACIANf/2ACIANv/nACIAN//sACMAHf/0ACMAHv/7ACMAH//fACMAIP/7ACMAIv/fACMAI//fACMAJP/0ACMAJf/rACMAJv/0ACMAJ//fACMAKv/0ACMAK//fACMALf/hACMALv/hACMAL//zACMAMP/2ACMAMf/hACMAMv/2ACMANP/bACMANf/7ACMANv/yACMAN//2ACQAH//xACQAIv/xACQAI//xACQAJf/zACQAJ//xACQAKP/0ACQAK//xACQALf/RACQALv/RACQAMP/5ACQAMf/RACQAMv/2ACQANP/nACQANf/2ACQANv/2ACQAN//xACQAUv+6ACQAU/+6ACUAH//uACUAIv/uACUAI//uACUAJf/yACUAJ//uACUAK//uACUALf/sACUALv/sACUAL//7ACUAMP/9ACUAMf/sACUAMv/7ACUANP/xACUANv/1ACUAN//xACYAHf/xACYAHv/4ACYAH//tACYAIf/4ACYAIv/tACYAI//tACYAJP/xACYAJf/vACYAJv/xACYAJ//tACYAKP/4ACYAKf/4ACYAKv/xACYAK//tACYALP/kACYALf/PACYALv/SACYAL//1ACYAMP/VACYAMf/PACYAMv/dACYANP/dACYANf/nACYANv/tACYAN//nACYAOP/kACYAUv+9ACYAU/+9ACcAH//wACcAIv/wACcAI//wACcAJ//wACcAK//wACcALf/vACcALv/vACcAMP/2ACcAMf/vACcANP/wACgAHf/xACgAHv/4ACgAH//tACgAIv/tACgAI//tACgAJP/xACgAJf/vACgAJv/xACgAJ//tACgAKv/xACgAK//tACgALP/kACgALf/PACgALv/SACgAL//1ACgAMP/VACgAMf/PACgAMv/dACgANP/dACgANf/nACgANv/tACgAN//nACgAOP/kACgAUv+9ACgAU/+9ACkAHf/wACkAHv/rACkAH//IACkAIP/vACkAIf/rACkAIv/IACkAI//IACkAJP/wACkAJf/nACkAJv/wACkAJ//IACkAKP/rACkAKf/rACkAKv/wACkAK//IACkALP/TACkALf/4ACkALv/4ACkAL//WACkAMP/4ACkAMf/4ACkAMv/2ACkAM//vACkANP+yACkANgAFACkAN//RACkAOP/FACkAUv+9ACkAU/+9ACoAHf/xACoAHv/xACoAH//CACoAIP/zACoAIf/xACoAIv/CACoAI//CACoAJP/xACoAJf/aACoAJv/xACoAJ//CACoAKP/xACoAKf/xACoAKv/xACoAK//CACoALf/iACoALv/iACoAL//nACoAMf/iACoAM//zACoANP/nACoANf/7ACoANv/zACoAN//hACoAQ//vACsAH//yACsAIv/yACsAI//yACsAJf/+ACsAJ//yACsAK//yACsALf/xACsALv/xACsAL//5ACsAMP/5ACsAMf/xACsAMv/7ACsANP/+ACsAN//2ACwAA/+rACwABP+rACwABv+rACwACP+rACwACf+rACwAC/+rACwADP+rACwAD/+rACwAEP+rACwAEf+rACwAEv+rACwAFf+rACwAF/+xACwAGP++ACwAGv+xAC0AHf/lAC0AHv/tAC0AH//GAC0AIP/0AC0AIf/tAC0AIv/GAC0AI//GAC0AJP/lAC0AJf/sAC0AJv/lAC0AJ//GAC0AKP/tAC0AKf/tAC0AKv/lAC0AK//GAC0ALP/DAC0ALf/zAC0ALv/zAC0AL//NAC0AMP/2AC0AMf/zAC0AMv/tAC0AM//0AC0ANP+/AC0ANf/7AC0ANv/4AC0AN//QAC0AOP/DAC0AUv/bAC0AU//bAC4AHf/lAC4AHv/tAC4AH//JAC4AIP/0AC4AIf/tAC4AIv/JAC4AI//JAC4AJP/lAC4AJf/sAC4AJv/lAC4AJ//JAC4AKP/tAC4AKf/tAC4AKv/lAC4AK//JAC4ALP/DAC4ALf/zAC4ALv/zAC4AL//NAC4AMP/2AC4AMf/zAC4AMv/tAC4AM//0AC4ANP+/AC4ANv/4AC4AN//QAC4AOP/DAC4AUv/bAC4AU//bAC8AH//xAC8AIv/xAC8AI//xAC8AJf/zAC8AJ//xAC8AKP/0AC8AK//xAC8ALf/RAC8ALv/RAC8AMP/5AC8AMf/RAC8AMv/2AC8ANP/nAC8ANf/2AC8ANv/2AC8AN//xAC8AUv+6AC8AU/+6ADAAHf/2ADAAHv/7ADAAH//QADAAIP/1ADAAIf/7ADAAIv/QADAAI//QADAAJP/2ADAAJf/nADAAJv/2ADAAJ//QADAAKP/7ADAAKf/7ADAAKv/2ADAAK//QADAALf/2ADAALv/2ADAAL//nADAAMP/7ADAAMf/2ADAAMv/7ADAAM//1ADAANP/lADAANf/7ADAAN//bADAAOP/7ADEAHf/lADEAHv/tADEAH//GADEAIP/0ADEAIf/tADEAIv/GADEAI//GADEAJP/lADEAJf/sADEAJv/lADEAJ//GADEAKP/tADEAKf/tADEAKv/lADEAK//GADEALP/DADEALf/zADEALv/zADEAL//NADEAMP/2ADEAMf/zADEAMv/tADEAM//0ADEANP+/ADEANv/4ADEAN//QADEAOP/DADEAUv/bADEAU//bADIAHf/2ADIAHv/2ADIAH//NADIAIP/2ADIAIf/2ADIAIv/NADIAI//NADIAJP/2ADIAJf/qADIAJv/2ADIAJ//NADIAKP/2ADIAKf/2ADIAKv/2ADIAK//NADIALf/uADIALv/uADIAL//mADIAMP/7ADIAMf/uADIAM//2ADIANP/hADIAN//iADMAH//vADMAIv/vADMAI//vADMAJ//vADMAK//vADMALf/0ADMALv/0ADMAL//3ADMAMP/1ADMAMf/0ADMANP/xADQAHf/xADQAHv/sADQAH//QADQAIP/2ADQAIf/sADQAIv/QADQAI//QADQAJP/xADQAJf/aADQAJv/xADQAJ//QADQAKP/sADQAKf/sADQAKv/xADQAK//QADQALf/MADQALv/MADQAL//fADQAMP/eADQAMf/MADQAMv/qADQAM//2ADQANP/nADQANf/sADQANv/rADQAN//iADUAHf/sADUAHv/jADUAH/+3ADUAIP/xADUAIf/jADUAIv+3ADUAI/+3ADUAJP/sADUAJf/TADUAJv/sADUAJ/+3ADUAKP/jADUAKf/jADUAKv/sADUAK/+3ADUALP/YADUALf/nADUALv/nADUAL//BADUAMP/iADUAMf/nADUAMv/nADUAM//xADUANP+mADUANf/sADUANv/2ADUAN//EADUAOP/ZADYAH//iADYAIv/iADYAI//iADYAJf/2ADYAJ//iADYAK//iADYALf/3ADYALv/3ADYAMf/3ADYAMgAFADYANP/2ADYANgAEADYAN//5ADcAHf/tADcAHv/wADcAH//nADcAIP/xADcAIf/wADcAIv/nADcAI//nADcAJP/tADcAJf/jADcAJv/tADcAJ//nADcAKP/wADcAKf/wADcAKv/tADcAK//nADcALf/QADcALv/QADcAL//6ADcAMP/dADcAMf/QADcAMv/vADcAM//xADcANP/iADcANf/rADcANv/vADcAN//mADgAA/+8ADgABP+8ADgABf+tADgABv+8ADgAB/+tADgACP+8ADgACf+8ADgAC/+8ADgADP+8ADgADf+tADgADv+tADgAD/+8ADgAEP+8ADgAEf+8ADgAEv+8ADgAE/+6ADgAFf+8ADgAF/+xADgAGP++ADgAGv+xADgALf++ADgALv++ADgAMf++ADgANv++ADkAOQAUADkAP//7ADoAO//sADoAPP/yADoAPf/7ADoAP//qADoAQP/sADoAQf/yADoAQv/3ADsAOv/sADsAO//tADsAPP/yADsAPf/7ADsAP//qADsAQP/UADsAQf/3ADsAQv/qADwAOv/xADwAO//tADwAPP/2ADwAPv/3ADwAP//yADwAQP/nADwAQf/nADwAQv/yAD0AOv/7AD0AO//7AD0APAAGAD0AP//7AD0AQP/fAD0AQf/3AD0AQv/3AD4AOf/yAD4AOv/sAD4AO//uAD4APP/3AD4APv/3AD4AP//rAD4AQP/PAD4AQf/yAD4AQv/tAD8AOf/xAD8AOv/cAD8AO//uAD8APP/uAD8APf/7AD8APv/oAD8AP//yAD8AQP+5AD8AQf/JAD8AQv/yAEAAOv/eAEAAO//KAEAAPP/tAEAAPf/kAEAAPv/uAEAAP//KAEAAQP/yAEAAQf/nAEAAQv/VAEEAOv/tAEEAO//sAEEAPP/nAEEAPf/LAEEAPv/yAEEAP/+1AEEAQP/sAEEAQv/UAEIAOv/3AEIAO//oAEIAPP/yAEIAPf/7AEIAPv/yAEIAP//jAEIAQP/SAEIAQf/iAEIAQv/uAEMAA//nAEMABP/nAEMABv/nAEMACP/nAEMACf/nAEMAC//nAEMADP/nAEMAD//nAEMAEP/nAEMAEf/nAEMAEv/nAEMAFf/nAEMAFv/qAEMAF//wAEMAGP/wAEMAGf/LAEMAGv/4AEMAMP/6AEgASP87AEkASf87AE8AT//mAE8AUP/XAFAAT//SAFIABf/KAFIAB//K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AFL/mABT/5gANQAD//EABP/xAAX/qgAG//EAB/+qAAj/8QAJ//EACgAOAAv/8QAM//EADf+qAA7/qgAP//EAEP/xABH/8QAS//EAE//sABT/ngAV//EAFv+hABf/9gAY//YAGf/2ABr/9gAb//YAHP/VAB3/8QAe/7gAH/96ACD/9gAh/7gAIv96ACP/egAk//EAJf+sACb/8QAn/3oAKP+4ACn/uAAq//EAK/96AC3/uQAu/7kAL/+HADD/twAx/7kAMv+wADP/9gA0/3UANf/aADb/zgA3/50AOP/yACgAA//2AAT/9gAF/+UABv/2AAf/5QAI//YACf/2AAr/1QAL//YADP/2AA3/5QAO/+UAD//2ABD/9gAR//YAEv/2ABP/9wAV//YAFv/iABf/2QAY/9kAGf/fABr/ygAb//kAHP/2AB//7wAi/+8AI//vACX/9QAn/+8AK//vAC3/7QAu/+0AL//zADD/8QAx/+0AMv/7ADT/6AA3//EAOP/7ADEAA//nAAT/5wAF/+wABv/nAAf/7AAI/+cACf/nAAr/qgAL/+cADP/nAA3/7AAO/+wAD//nABD/5wAR/+cAEv/nABP/6wAU//sAFf/nABb/wgAX/70AGP+9ABn/vwAa/7QAG//UABz/6gAd/+wAH//hACD/9gAi/+EAI//hACT/7AAl//QAJv/sACf/4QAq/+wAK//hACz/zAAt/+MALv/jAC//3AAw/+QAMf/jADL/3QAz//YANP/bADb/9gA3/+wAOP/MADUAA//jAAT/4wAF/8YABv/jAAf/xgAI/+MACf/jAAr/ywAL/+MADP/jAA3/xgAO/8YAD//jABD/4wAR/+MAEv/jABP/5AAU/+cAFf/jABb/0AAX/80AGP/NABn/xgAa/8gAG//jABz/7AAd/+UAHv/nAB//zQAg/+oAIf/nACL/zQAj/80AJP/lACX/4gAm/+UAJ//NACj/5wAp/+cAKv/lACv/zQAt/9UALv/VAC//3QAw/+IAMf/VADL/7AAz/+oANP/TADX/6QA2/+MAN//RADj/8gA1AAP/6gAE/+oABf/yAAb/6gAH//IACP/qAAn/6gAK/7wAC//qAAz/6gAN//IADv/yAA//6gAQ/+oAEf/qABL/6gAT//UAFf/qABb/1AAX/8oAGP/KABn/zwAa/7YAG//nABz/8QAd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/+YAMf/TADL/5wA0/+IANf/2ADb/9gA3//YADQAf//AAIv/wACP/8AAl//0AJ//wACv/8AAt/+8ALv/vAC//+wAw//YAMf/vADT/8AA3//sAFQAd//sAH//xACD/+wAi//EAI//xACX/8wAn//EAKP/0ACv/8QAt/9EALv/RAC//+gAw//kAMf/RADL/9gA0/+cANf/2ADb/9gA3//EAUv+6AFP/ugAdAB3/8QAe//gAH//tACD/+wAh//gAIv/tACP/7QAk//EAJf/vACb/8QAn/+0AKP/4ACn/+AAq//EAK//tACz/5AAt/88ALv/SAC//9QAw/9UAMf/PADL/3QA0/90ANf/nADb/7QA3/+cAOP/kAFL/vQBT/70ADQAf/+8AIv/vACP/7wAn/+8AK//vAC3/9AAu//QAL//3ADD/9QAx//QANP/xADb/+wA3//oAEgAf//EAIv/xACP/8QAl//MAJ//xACj/9AAr//EALf/RAC7/0QAw//kAMf/RADL/9gA0/+cANf/2ADb/9gA3//EAUv+6AFP/ugAXAB3/9wAe//gAH//xACH/+AAi//EAI//xACT/9wAl//AAJv/3ACf/8QAo//gAKf/4ACr/9wAr//EALf/eAC7/3gAw/+cAMf/eADL/5wA0/+AANf/2ADb/5wA3/+wAFgAd//QAHv/7AB//3wAg//sAIv/fACP/3wAk//QAJf/rACb/9AAn/98AKv/0ACv/3wAt/+EALv/hAC//8wAw//YAMf/hADL/9gA0/9sANf/7ADb/8gA3//YAEgAf//EAIv/xACP/8QAl//MAJ//xACj/9AAr//EALf/RAC7/0QAw//kAMf/RADL/9gA0/+cANf/2ADb/9gA3//EAUv+6AFP/ugAPAB//7gAi/+4AI//uACX/8gAn/+4AK//uAC3/7AAu/+wAL//7ADD//QAx/+wAMv/7ADT/8QA2//UAN//xABwAHf/xAB7/+AAf/+0AIf/4ACL/7QAj/+0AJP/xACX/7wAm//EAJ//tACj/+AAp//gAKv/xACv/7QAs/+QALf/PAC7/0gAv//UAMP/VADH/zwAy/90ANP/dADX/5wA2/+0AN//nADj/5ABS/70AU/+9AAoAH//wACL/8AAj//AAJ//wACv/8AAt/+8ALv/vADD/9gAx/+8ANP/wABkAHf/xAB7/+AAf/+0AIv/tACP/7QAk//EAJf/vACb/8QAn/+0AKv/xACv/7QAs/+QALf/PAC7/0gAv//UAMP/VADH/zwAy/90ANP/dADX/5wA2/+0AN//nADj/5ABS/70AU/+9AB0AHf/wAB7/6wAf/8gAIP/vACH/6wAi/8gAI//IACT/8AAl/+cAJv/wACf/yAAo/+sAKf/rACr/8AAr/8gALP/TAC3/+AAu//gAL//WADD/+AAx//gAMv/2ADP/7wA0/7IANgAFADf/0QA4/8UAUv+9AFP/vQAZAB3/8QAe//EAH//CACD/8wAh//EAIv/CACP/wgAk//EAJf/aACb/8QAn/8IAKP/xACn/8QAq//EAK//CAC3/4gAu/+IAL//nADH/4gAz//MANP/nADX/+wA2//MAN//hAEP/7wAOAB//8gAi//IAI//yACX//gAn//IAK//yAC3/8QAu//EAL//5ADD/+QAx//EAMv/7ADT//gA3//YADwAD/6sABP+rAAb/qwAI/6sACf+rAAv/qwAM/6sAD/+rABD/qwAR/6sAEv+rABX/qwAX/7EAGP++ABr/sQAeAB3/5QAe/+0AH//GACD/9AAh/+0AIv/GACP/xgAk/+UAJf/sACb/5QAn/8YAKP/tACn/7QAq/+UAK//GACz/wwAt//MALv/zAC//zQAw//YAMf/zADL/7QAz//QANP+/ADX/+wA2//gAN//QADj/wwBS/9sAU//bAB0AHf/lAB7/7QAf/8kAIP/0ACH/7QAi/8kAI//JACT/5QAl/+wAJv/lACf/yQAo/+0AKf/tACr/5QAr/8kALP/DAC3/8wAu//MAL//NADD/9gAx//MAMv/tADP/9AA0/78ANv/4ADf/0AA4/8MAUv/bAFP/2wASAB//8QAi//EAI//xACX/8wAn//EAKP/0ACv/8QAt/9EALv/RADD/+QAx/9EAMv/2ADT/5wA1//YANv/2ADf/8QBS/7oAU/+6ABoAHf/2AB7/+wAf/9AAIP/1ACH/+wAi/9AAI//QACT/9gAl/+cAJv/2ACf/0AAo//sAKf/7ACr/9gAr/9AALf/2AC7/9gAv/+cAMP/7ADH/9gAy//sAM//1ADT/5QA1//sAN//bADj/+wAdAB3/5QAe/+0AH//GACD/9AAh/+0AIv/GACP/xgAk/+UAJf/sACb/5QAn/8YAKP/tACn/7QAq/+UAK//GACz/wwAt//MALv/zAC//zQAw//YAMf/zADL/7QAz//QANP+/ADb/+AA3/9AAOP/DAFL/2wBT/9sAFwAd//YAHv/2AB//zQAg//YAIf/2ACL/zQAj/80AJP/2ACX/6gAm//YAJ//NACj/9gAp//YAKv/2ACv/zQAt/+4ALv/uAC//5gAw//sAMf/uADP/9gA0/+EAN//iAAsAH//vACL/7wAj/+8AJ//vACv/7wAt//QALv/0AC//9wAw//UAMf/0ADT/8QAaAB3/8QAe/+wAH//QACD/9gAh/+wAIv/QACP/0AAk//EAJf/aACb/8QAn/9AAKP/sACn/7AAq//EAK//QAC3/zAAu/8wAL//fADD/3gAx/8wAMv/qADP/9gA0/+cANf/sADb/6wA3/+IAHAAd/+wAHv/jAB//twAg//EAIf/jACL/twAj/7cAJP/sACX/0wAm/+wAJ/+3ACj/4wAp/+MAKv/sACv/twAs/9gALf/nAC7/5wAv/8EAMP/iADH/5wAy/+cAM//xADT/pgA1/+wANv/2ADf/xAA4/9kADQAf/+IAIv/iACP/4gAl//YAJ//iACv/4gAt//cALv/3ADH/9wAyAAUANP/2ADYABAA3//kAGgAd/+0AHv/wAB//5wAg//EAIf/wACL/5wAj/+cAJP/tACX/4wAm/+0AJ//nACj/8AAp//AAKv/tACv/5wAt/9AALv/QAC//+gAw/90AMf/QADL/7wAz//EANP/iADX/6wA2/+8AN//mABgAA/+8AAT/vAAF/60ABv+8AAf/rQAI/7wACf+8AAv/vAAM/7wADf+tAA7/rQAP/7wAEP+8ABH/vAAS/7wAE/+6ABX/vAAX/7EAGP++ABr/sQAt/74ALv++ADH/vgA2/74AAgA5ABQAP//7AAcAO//sADz/8gA9//sAP//qAED/7ABB//IAQv/3AAgAOv/sADv/7QA8//IAPf/7AD//6gBA/9QAQf/3AEL/6gAIADr/8QA7/+0APP/2AD7/9wA///IAQP/nAEH/5wBC//IABwA6//sAO//7ADwABgA///sAQP/fAEH/9wBC//cACQA5//IAOv/sADv/7gA8//cAPv/3AD//6wBA/88AQf/yAEL/7QAKADn/8QA6/9wAO//uADz/7gA9//sAPv/oAD//8gBA/7kAQf/J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) format('opentype');
          font-weight: 100 900;
          font-style: normal;
          font-display: swap;
        }

        :root {
          --black: #2B2B30;
          --white: #FFFFFF;
          --grey-100: #F6F6F7;
          --grey-300: #D9D9DC;
          --grey-500: #8B8B93;
          --grey-700: #46464C;
          --accent: #2B4FBE;
          --accent-wash: rgba(43, 79, 190, 0.10);
          --accent-wash-strong: rgba(43, 79, 190, 0.18);
          --success: #1E9E5A;
          --success-wash: rgba(30, 158, 90, 0.12);
          --error: #C0392B;
          --error-wash: rgba(192, 57, 43, 0.12);
          --black-wash: rgba(43, 43, 48, 0.06);
          --font-heading: 'Nohemi', Helvetica, Arial, sans-serif;
          --font-body: 'Givonic', Helvetica, Arial, sans-serif;
        }

        .wrap {
          min-height: 100vh;
          width: 100%;
          background: var(--grey-100);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          font-family: var(--font-body);
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
          border-radius: 30px;
          border: 1.5px solid var(--black);
          box-shadow: 0 16px 40px rgba(10,10,12,0.08);
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .app-topbar {
          padding: 22px 24px 0;
        }
        .mark {
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 600;
          color: var(--accent);
          letter-spacing: 0.01em;
          margin: 0 0 12px;
        }
        .main-tabs-row {
          display: flex;
          background: var(--grey-100);
          border: 1.5px solid var(--black);
          border-radius: 999px;
          padding: 4px;
        }
        .main-tab-shape {
          position: relative;
          flex: 1;
          border: none;
          cursor: pointer;
          font-family: var(--font-heading);
          font-size: 14px;
          font-weight: 700;
          padding: 12px 0;
          background: transparent;
          color: var(--grey-700);
          border-radius: 999px;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .main-tab-shape-active {
          background: var(--white);
          color: var(--black);
          border: 1.5px solid var(--black);
        }

        .app-body {
          flex: 1;
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

        /* PASSWORD GATE */
        .gate {
          align-items: center;
          text-align: center;
          padding-top: 64px;
        }
        .gate-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--grey-100);
          border: 1.5px solid var(--black);
          color: var(--black);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .gate-sub {
          margin: 8px 0 24px;
        }
        .gate-input {
          width: 100%;
          margin-bottom: 14px;
          text-align: center;
        }
        .gate-btn {
          width: 100%;
        }
        .gate-demo {
          font-size: 12px;
          color: var(--grey-500);
          margin-top: 14px;
        }

        /* ADMIN */
        .admin-screen {
          padding-bottom: 24px;
        }
        .admin-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .admin-attendees-head {
          margin-top: 32px;
        }
        .admin-h2 {
          font-family: var(--font-heading);
          font-size: 17px;
          font-weight: 700;
          color: var(--black);
          margin: 0;
        }
        .admin-day-nav {
          display: flex;
          gap: 8px;
        }
        .icon-circle-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1.5px solid var(--black);
          background: var(--white);
          color: var(--black);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .icon-circle-btn:disabled {
          opacity: 0.35;
          cursor: default;
        }

        .toggle {
          width: 40px;
          height: 23px;
          border-radius: 999px;
          border: 1.5px solid var(--black);
          background: var(--white);
          padding: 2px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-shrink: 0;
          transition: background 0.15s ease, justify-content 0.15s ease;
        }
        .toggle-on {
          background: var(--black);
          justify-content: flex-end;
        }
        .toggle-knob {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: var(--black);
        }
        .toggle-on .toggle-knob {
          background: var(--white);
        }

        .admin-cat-table {
          border: 1.5px solid var(--black);
          border-radius: 14px;
          overflow: hidden;
        }
        .admin-cat-day-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--grey-300);
          font-family: var(--font-heading);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: var(--black);
        }
        .admin-cat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: var(--grey-100);
          border-top: 1px solid var(--grey-300);
        }
        .admin-cat-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--black);
          flex: 1;
        }
        .admin-cat-count {
          font-size: 13px;
          color: var(--grey-700);
          margin-right: 16px;
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--grey-100);
          border: 1.5px solid var(--black);
          border-radius: 10px;
          padding: 8px 12px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: var(--black);
          cursor: pointer;
        }
        .export-btn:active {
          background: var(--black-wash);
        }

        .attendee-table-wrap {
          border: 1.5px solid var(--black);
          border-radius: 14px;
          overflow: auto;
          max-height: 320px;
          background: var(--grey-300);
        }
        .attendee-table-wrap::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .attendee-table-wrap::-webkit-scrollbar-track {
          background: var(--grey-300);
        }
        .attendee-table-wrap::-webkit-scrollbar-thumb {
          background: var(--grey-500);
          border-radius: 4px;
        }
        .attendee-table {
          min-width: 560px;
        }
        .attendee-row {
          display: flex;
        }
        .attendee-row > span {
          padding: 10px 10px;
          font-size: 12px;
          border-right: 1px solid var(--grey-100);
          display: flex;
          align-items: center;
        }
        .attendee-row > span:last-child {
          border-right: none;
        }
        .attendee-head {
          position: sticky;
          top: 0;
          background: var(--grey-300);
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.02em;
          z-index: 1;
        }
        .attendee-body .attendee-row {
          border-top: 1px solid var(--grey-100);
        }
        .attendee-body .attendee-row {
          background: var(--white);
        }
        .attendee-body .attendee-row:nth-child(even) {
          background: var(--grey-100);
        }
        .cell-id { width: 130px; flex-shrink: 0; color: var(--grey-700); }
        .cell-name { width: 120px; flex-shrink: 0; font-weight: 600; color: var(--black); }
        .cell-desig { width: 190px; flex-shrink: 0; color: var(--grey-700); }
        .cell-cat { width: 60px; flex-shrink: 0; justify-content: center; }
        .attendee-status-yes { color: var(--success); }
        .attendee-status-no { color: var(--grey-300); }
        .attendee-fraction { color: var(--grey-700); font-weight: 600; }

        /* HOME */
        .topline {
          margin-bottom: 22px;
        }
        .mark-sub {
          font-size: 12px;
          color: var(--grey-500);
          margin-top: 2px;
        }

        .tab-row-wrap {
          position: relative;
          margin-bottom: 22px;
        }
        .tab-row-baseline {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 1px;
          background: var(--grey-300);
        }
        .day-switch {
          display: flex;
        }
        .day-tab {
          flex: 1;
          position: relative;
          border: none;
          background: transparent;
          padding: 10px 4px 12px;
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 600;
          color: var(--grey-700);
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .day-tab:not(:first-child)::before {
          content: "";
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 1px;
          background: var(--grey-300);
        }
        .day-tab-active {
          color: var(--accent);
          font-weight: 700;
        }
        .day-tab-active::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          background: var(--accent);
          z-index: 1;
        }
        .day-tab-past:not(.day-tab-active) {
          color: var(--grey-500);
          opacity: 0.7;
        }

        .day-heading {
          font-family: var(--font-heading);
          font-size: 38px;
          font-weight: 700;
          margin: 0 0 24px;
          color: var(--black);
          line-height: 1.05;
        }

        .cat-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .cat-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: var(--white);
          border: 1.5px solid var(--black);
          border-radius: 16px;
          padding: 14px 16px;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
          transition: transform 0.1s ease, background 0.15s ease;
        }
        .cat-card:active:not(:disabled) {
          transform: scale(0.98);
          background: var(--black-wash);
        }
        .cat-card-locked {
          cursor: default;
          opacity: 0.55;
        }
        .cat-card-locked:active {
          transform: none;
          background: var(--white);
        }
        .cat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          flex-shrink: 0;
        }
        .cat-name {
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 600;
          color: var(--black);
          flex: 1;
        }
        .cat-arrow {
          color: var(--black);
          flex-shrink: 0;
        }
        .cat-lock {
          color: var(--grey-500);
          flex-shrink: 0;
        }
        .pill {
          font-size: 12px;
          font-weight: 500;
          padding: 5px 11px;
          border-radius: 100px;
          flex-shrink: 0;
        }
        .pill-closed {
          background: var(--grey-100);
          color: var(--grey-500);
        }

        /* SCAN SCREEN */
        .scan-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
        }
        .icon-btn {
          border: 1.5px solid var(--black);
          background: var(--white);
          border-radius: 10px;
          padding: 6px;
          color: var(--black);
          cursor: pointer;
          display: flex;
        }
        .scan-title {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 600;
          color: var(--black);
          margin: 0;
        }

        .tabs {
          display: flex;
        }
        .tab {
          flex: 1;
          position: relative;
          border: none;
          background: transparent;
          padding: 9px 4px 12px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: var(--grey-700);
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .tab:not(:first-child)::before {
          content: "";
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 1px;
          background: var(--grey-300);
        }
        .tab-active {
          color: var(--accent);
          font-weight: 700;
        }
        .tab-active::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 2px;
          background: var(--accent);
          z-index: 1;
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
          background: radial-gradient(circle at 50% 40%, #26262b, var(--black) 75%);
          border: 1.5px solid var(--black);
          border-radius: 18px;
          position: relative;
          overflow: hidden;
        }
        .corner {
          position: absolute;
          width: 26px;
          height: 26px;
          border: 3px solid var(--accent);
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
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          animation: sweep 0.9s ease-in-out infinite;
        }
        @keyframes sweep {
          0% { top: 16px; }
          50% { top: calc(100% - 18px); }
          100% { top: 16px; }
        }
        .qr-help {
          font-size: 13px;
          color: var(--grey-700);
          text-align: center;
          margin: 18px 0 22px;
          max-width: 260px;
        }
        .demo-btn {
          border: 1.5px dashed var(--black);
          background: transparent;
          color: var(--black);
          font-family: inherit;
          font-size: 13px;
          font-weight: 500;
          padding: 12px 20px;
          border-radius: 10px;
          cursor: pointer;
        }
        .demo-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .id-pane {
          display: flex;
          flex-direction: column;
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
          margin-bottom: 10px;
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
          padding: 14px 16px;
          border: 1.5px solid var(--black);
          border-radius: 12px;
          outline: none;
          background: var(--white);
        }
        .id-input:focus {
          background: var(--accent-wash);
        }
        .id-demo-hint {
          font-size: 12px;
          color: var(--grey-500);
          margin: 0;
        }
        .id-error-box {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: var(--error-wash);
          border: 1.5px solid var(--black);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .id-error-icon {
          color: var(--error);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .id-error-text {
          font-size: 13px;
          color: var(--grey-700);
          line-height: 1.4;
          margin: 0;
        }
        .check-btn {
          background: var(--black);
          color: var(--white);
          border: 1.5px solid var(--black);
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          padding: 0 20px;
          border-radius: 12px;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 0.1s ease, opacity 0.1s ease;
        }
        .check-btn:active:not(:disabled) {
          transform: scale(0.96);
          opacity: 0.85;
        }
        .check-btn:disabled {
          background: var(--grey-300);
          border-color: var(--grey-300);
          color: var(--grey-500);
          opacity: 1;
          cursor: default;
        }

        .primary-btn {
          background: var(--black);
          color: var(--white);
          border: 1.5px solid var(--black);
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          padding: 15px 0;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.1s ease, opacity 0.1s ease;
        }
        .primary-btn:active:not(:disabled) {
          transform: scale(0.98);
          opacity: 0.85;
        }
        .primary-btn:disabled {
          background: var(--grey-300);
          border-color: var(--grey-300);
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
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--success-wash);
          border: 1.5px solid var(--black);
          color: var(--success);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .confirm-context {
          font-size: 14px;
          color: var(--grey-700);
          margin: 0 0 2px;
        }
        .confirm-title {
          font-family: var(--font-heading);
          font-size: 22px;
          font-weight: 600;
          color: var(--black);
          margin: 0;
        }
        .confirm-time {
          font-size: 13px;
          color: var(--grey-500);
          margin: 6px 0 0;
        }

        .delegate-card {
          background: var(--grey-100);
          border-radius: 18px;
          padding: 24px 22px;
          margin-bottom: 28px;
        }
        .delegate-block {
          margin-bottom: 0;
        }
        .delegate-serial {
          font-family: inherit;
          font-size: 12px;
          color: var(--accent);
          margin: 0 0 10px;
          letter-spacing: 0.02em;
        }
        .delegate-tag {
          font-size: 12px;
          color: var(--grey-500);
          margin: 0 0 4px;
        }
        .delegate-name {
          font-family: var(--font-heading);
          font-size: 26px;
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

        .confirm-back-btn {
          margin-top: 4px;
        }
      `}</style>

      <div className="phone">
        {(!unlocked[mainTab] || mainTab === "admin" || screen === "home") && (
          <div className="app-topbar">
            <div className="mark">INDIS 2026</div>
            <div className="main-tabs-row">
              <button
                className={`main-tab-shape ${mainTab === "volunteer" ? "main-tab-shape-active" : ""}`}
                onClick={() => setMainTab("volunteer")}
              >
                Volunteer
              </button>
              <button
                className={`main-tab-shape ${mainTab === "admin" ? "main-tab-shape-active" : ""}`}
                onClick={() => setMainTab("admin")}
              >
                Admin
              </button>
            </div>
          </div>
        )}

        <div className="app-body">
          {!unlocked[mainTab] ? (
            <PasswordGate
              key={mainTab}
              tabLabel={mainTab === "volunteer" ? "Volunteer" : "Admin"}
              onUnlock={() => unlockTab(mainTab)}
            />
          ) : mainTab === "admin" ? (
            <AdminScreen
              adminDay={adminDay}
              onChangeAdminDay={changeAdminDay}
              categoryEnabled={categoryEnabled}
              onToggleCategory={toggleCategory}
              onToggleMaster={toggleMasterForDay}
              attendeeTab={attendeeTab}
              onSetAttendeeTab={setAttendeeTab}
            />
          ) : (
            <>
              {screen === "home" && (
                <HomeScreen
                  day={day}
                  setDay={setDay}
                  today={TODAY}
                  categoryEnabled={categoryEnabled}
                  onPick={pickCategory}
                />
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
                  confirmedAt={confirmedAt}
                  onBackToCategories={backToHome}
                  onBackToScanner={backToScanner}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
