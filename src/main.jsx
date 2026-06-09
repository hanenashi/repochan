import React from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardCheck, Plus, Save, User } from "lucide-react";
import "./styles.css";

const todayIso = () => {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
    year: "numeric"
  })
    .formatToParts(new Date())
    .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});

  return `${parts.year}-${parts.month}-${parts.day}`;
};
const api = (path, options) =>
  fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  }).then(async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  });

function monthLabel(month) {
  const date = new Date(`${month}-01T00:00:00Z`);
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function getMonthDays(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const startOffset = first.getDay();
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`)
  ];
}

function shiftMonthValue(month, direction) {
  const [year, monthNumber] = month.split("-").map(Number);
  const zeroBased = year * 12 + (monthNumber - 1) + direction;
  const nextYear = Math.floor(zeroBased / 12);
  const nextMonth = (zeroBased % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

function App() {
  const [date, setDate] = React.useState(todayIso());
  const [month, setMonth] = React.useState(todayIso().slice(0, 7));
  const [staff, setStaff] = React.useState([]);
  const [staffId, setStaffId] = React.useState("stan");
  const [items, setItems] = React.useState([]);
  const [days, setDays] = React.useState([]);
  const [currentDay, setCurrentDay] = React.useState(null);
  const [selectedItemId, setSelectedItemId] = React.useState("fridge-temperature");
  const [value, setValue] = React.useState("");
  const [note, setNote] = React.useState("");
  const [actionTaken, setActionTaken] = React.useState("");
  const [isIssueOpen, setIsIssueOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const selectedStaff = staff.find((person) => person.id === staffId) || { id: "stan", name: "stan" };
  const dayMap = React.useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const selectedItem = items.find((item) => item.id === selectedItemId) || items[0];

  async function refresh(nextDate = date, nextMonth = month) {
    const [staffData, itemData, dayData, monthData] = await Promise.all([
      api("/api/staff"),
      api("/api/check-items"),
      api(`/api/days/${nextDate}`),
      api(`/api/days?month=${nextMonth}`)
    ]);
    setStaff(staffData);
    setItems(itemData);
    setCurrentDay(dayData);
    setDays(monthData);
    if (itemData.length && !itemData.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(itemData[0].id);
    }
  }

  React.useEffect(() => {
    let cancelled = false;
    setBusy(true);
    api("/api/bootstrap")
      .then(() => (!cancelled ? refresh() : null))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function markAllOk() {
    setBusy(true);
    setError("");
    try {
      const payload = { staffId: selectedStaff.id, staffName: selectedStaff.name };
      const day = await api(`/api/days/${date}/all-ok`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setCurrentDay(day);
      await refresh(date, month);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveException(event) {
    event.preventDefault();
    if (!selectedItem) return;
    setBusy(true);
    setError("");
    try {
      const day = await api(`/api/days/${date}/exceptions`, {
        method: "POST",
        body: JSON.stringify({
          itemId: selectedItem.id,
          title: selectedItem.title,
          value,
          note,
          actionTaken,
          staffId: selectedStaff.id,
          staffName: selectedStaff.name
        })
      });
      setCurrentDay(day);
      setValue("");
      setNote("");
      setActionTaken("");
      setIsIssueOpen(false);
      await refresh(date, month);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function shiftMonth(direction) {
    const nextMonth = shiftMonthValue(month, direction);
    setMonth(nextMonth);
    refresh(date, nextMonth).catch((err) => setError(err.message));
  }

  function chooseDate(nextDate) {
    if (!nextDate) return;
    setDate(nextDate);
    if (nextDate.slice(0, 7) !== month) setMonth(nextDate.slice(0, 7));
    refresh(nextDate, nextDate.slice(0, 7)).catch((err) => setError(err.message));
  }

  const completeCount = days.filter((day) => day.overallStatus === "ok").length;
  const issueCount = days.filter((day) => day.overallStatus === "has_exception").length;

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Repochan Light</p>
          <h1>Daily HACCP</h1>
        </div>
        <label className="staff-picker">
          <User size={18} />
          <select value={staffId} onChange={(event) => setStaffId(event.target.value)}>
            {staff.map((person) => (
              <option value={person.id} key={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error && <p className="error-banner">{error}</p>}

      <section className={`today-panel ${currentDay?.overallStatus || "empty"}`}>
        <div className="today-copy">
          <p className="eyebrow">{new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" })}</p>
          <h2>{date}</h2>
          <StatusLine day={currentDay} />
        </div>
        <div className="today-actions">
          <button className="primary-action" type="button" onClick={markAllOk} disabled={busy}>
            <Check size={28} />
            Reviewed: no issues today
          </button>
          <button className="secondary-action" type="button" onClick={() => setIsIssueOpen((open) => !open)}>
            <Plus size={22} />
            Add issue
          </button>
        </div>
      </section>

      {isIssueOpen && (
        <form className="issue-form" onSubmit={saveException}>
          <div className="form-grid">
            <label>
              Item
              <select value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)}>
                {items.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Value
              <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={selectedItem?.defaultValue || "optional"} />
            </label>
          </div>
          {selectedItem && (
            <div className="item-guidance">
              <span className={`badge ${selectedItem.category}`}>{selectedItem.category}</span>
              <p>{selectedItem.method}</p>
              <strong>{selectedItem.action}</strong>
            </div>
          )}
          <label>
            What happened?
            <textarea value={note} onChange={(event) => setNote(event.target.value)} required placeholder="Example: fridge door was left open during delivery." />
          </label>
          <label>
            Action taken
            <textarea value={actionTaken} onChange={(event) => setActionTaken(event.target.value)} placeholder="Example: moved food, closed door, rechecked after 30 minutes." />
          </label>
          <button className="save-button" type="submit" disabled={busy}>
            <Save size={20} />
            Save issue
          </button>
        </form>
      )}

      <section className="layout-grid">
        <div className="calendar-panel">
          <div className="panel-header">
            <button className="icon-button" type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <ChevronLeft />
            </button>
            <h2>
              <CalendarDays size={22} />
              {monthLabel(month)}
            </h2>
            <button className="icon-button" type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
              <ChevronRight />
            </button>
          </div>
          <div className="weekday-row">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="month-grid">
            {getMonthDays(month).map((day, index) => {
              const record = day ? dayMap.get(day) : null;
              return (
                <button
                  type="button"
                  key={day || `blank-${index}`}
                  className={`day-cell ${day === date ? "selected" : ""} ${record?.overallStatus || ""}`}
                  onClick={() => chooseDate(day)}
                  disabled={!day}
                >
                  {day && <span>{Number(day.slice(-2))}</span>}
                  {record?.overallStatus === "ok" && <Check size={18} />}
                  {record?.overallStatus === "has_exception" && <AlertTriangle size={18} />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="report-panel">
          <div className="panel-header report-header">
            <h2>
              <ClipboardCheck size={22} />
              Month summary
            </h2>
          </div>
          <div className="summary-tiles">
            <div>
              <span>{completeCount}</span>
              all OK days
            </div>
            <div>
              <span>{issueCount}</span>
              issue days
            </div>
          </div>
          <div className="exception-list">
            {(currentDay?.exceptions || []).length === 0 ? (
              <p>No issues recorded for this day.</p>
            ) : (
              currentDay.exceptions.map((item) => (
                <article key={item.id}>
                  <strong>{item.title}</strong>
                  <p>{item.value}</p>
                  <p>{item.note}</p>
                  {item.actionTaken && <small>{item.actionTaken}</small>}
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusLine({ day }) {
  if (!day) return <p>Not recorded yet. One tap can close a normal day.</p>;
  if (day.overallStatus === "ok") return <p>Complete. Reviewed with no issues.</p>;
  if (day.overallStatus === "has_exception") return <p>Issues recorded. Review the notes before closing.</p>;
  return <p>In progress.</p>;
}

createRoot(document.getElementById("root")).render(<App />);
