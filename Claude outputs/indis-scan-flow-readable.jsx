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
          src: url(data:font/ttf;base64,<...font data omitted for readability...>) format('truetype');
          font-weight: 500 900;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Nohemi';
          src: url(data:font/ttf;base64,<...font data omitted for readability...>) format('truetype');
          font-weight: 100 499;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Givonic';
          src: url(data:font/otf;base64,<...font data omitted for readability...>) format('opentype');
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
          background: var(--black);
          color: var(--white);
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
