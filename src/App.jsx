import { useState, useEffect, useRef } from "react";

const CATEGORIES = {
  fitness: { label: "Health & Fitness", icon: "⚡", color: "#FF6B35" },
  sleep: { label: "Sleep & Rest", icon: "🌙", color: "#7B68EE" },
  learning: { label: "Learning & Reading", icon: "📖", color: "#00C9A7" },
  mindfulness: { label: "Mindfulness", icon: "🧘", color: "#FFD166" },
  work: { label: "Work & Productivity", icon: "🎯", color: "#06D6A0" },
};

const DEFAULT_HABITS = [
  { id: 1, name: "Morning workout", category: "fitness", target: 1 },
  { id: 2, name: "Drink 8 glasses of water", category: "fitness", target: 1 },
  { id: 3, name: "Sleep by 11pm", category: "sleep", target: 1 },
  { id: 4, name: "Read 20 pages", category: "learning", target: 1 },
  { id: 5, name: "10 min meditation", category: "mindfulness", target: 1 },
  { id: 6, name: "Deep work block", category: "work", target: 1 },
];

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

function getDayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

function getStreak(habitId, completions) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (completions[key]?.[habitId]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function HabitTracker() {
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [completions, setCompletions] = useState({});
  const [view, setView] = useState("today");
  const [showAdd, setShowAdd] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", category: "fitness" });
  const [celebrateId, setCelebrateId] = useState(null);
  const today = getTodayKey();
  const last7 = getLast7Days();

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("habitData");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.habits) setHabits(parsed.habits);
        if (parsed.completions) setCompletions(parsed.completions);
      }
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("habitData", JSON.stringify({ habits, completions }));
    } catch {}
  }, [habits, completions]);

  function toggleHabit(habitId) {
    const current = completions[today]?.[habitId];
    setCompletions((prev) => ({
      ...prev,
      [today]: { ...prev[today], [habitId]: !current },
    }));
    if (!current) {
      setCelebrateId(habitId);
      setTimeout(() => setCelebrateId(null), 800);
    }
  }

  function addHabit() {
    if (!newHabit.name.trim()) return;
    const habit = { id: Date.now(), name: newHabit.name.trim(), category: newHabit.category, target: 1 };
    setHabits((prev) => [...prev, habit]);
    setNewHabit({ name: "", category: "fitness" });
    setShowAdd(false);
  }

  function deleteHabit(id) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  const todayCompleted = habits.filter((h) => completions[today]?.[h.id]).length;
  const todayScore = habits.length > 0 ? Math.round((todayCompleted / habits.length) * 100) : 0;

  const chartData = last7.map((day) => {
    const done = habits.filter((h) => completions[day]?.[h.id]).length;
    const pct = habits.length > 0 ? Math.round((done / habits.length) * 100) : 0;
    return { day, label: getDayLabel(day), pct, done, total: habits.length };
  });

  const maxStreak = habits.reduce((max, h) => Math.max(max, getStreak(h.id, completions)), 0);
  const totalCompleted = Object.values(completions).reduce((sum, dayMap) => {
    return sum + Object.values(dayMap).filter(Boolean).length;
  }, 0);

  const grouped = Object.entries(CATEGORIES).map(([key, cat]) => ({
    ...cat,
    key,
    habits: habits.filter((h) => h.category === key),
  })).filter((g) => g.habits.length > 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      color: "#F0EDE8",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      padding: "0 0 80px 0",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Fraunces:wght@700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A0A0F; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

        .habit-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          border: 1px solid transparent;
          position: relative;
          overflow: hidden;
        }
        .habit-row:hover { background: #16161e; transform: translateX(2px); }
        .habit-row.done { border-color: rgba(255,255,255,0.08); }
        .check-circle {
          width: 26px; height: 26px; border-radius: 50%;
          border: 2px solid #333;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
          font-size: 13px;
        }
        .check-circle.checked {
          border-color: transparent;
          animation: popIn 0.3s ease;
        }
        @keyframes popIn {
          0% { transform: scale(0.8); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .celebrate {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          animation: celebrate 0.8s ease forwards;
          background: radial-gradient(circle at center, rgba(255,255,255,0.05), transparent 70%);
        }
        @keyframes celebrate {
          0% { opacity: 0; transform: scale(0.8); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: scale(1.5); }
        }
        .nav-btn {
          background: none; border: none; color: #666;
          font-family: 'DM Mono', monospace;
          font-size: 12px; letter-spacing: 0.1em;
          cursor: pointer; padding: 8px 16px; border-radius: 20px;
          transition: all 0.2s; text-transform: uppercase;
        }
        .nav-btn.active { color: #F0EDE8; background: #1e1e2e; }
        .bar { transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .score-ring {
          transition: stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .add-btn {
          background: #F0EDE8; color: #0A0A0F;
          border: none; border-radius: 10px;
          font-family: 'DM Mono', monospace;
          font-size: 13px; font-weight: 500;
          padding: 12px 24px; cursor: pointer;
          transition: transform 0.15s, opacity 0.15s;
        }
        .add-btn:hover { transform: scale(1.03); opacity: 0.9; }
        .del-btn {
          background: none; border: none; color: #444;
          cursor: pointer; font-size: 16px; padding: 4px 8px;
          border-radius: 6px; transition: color 0.15s;
          margin-left: auto;
        }
        .del-btn:hover { color: #ff6b6b; }
        input[type="text"], select {
          background: #1a1a24; border: 1px solid #2a2a3a;
          color: #F0EDE8; border-radius: 10px;
          font-family: 'DM Mono', monospace; font-size: 14px;
          padding: 12px 16px; width: 100%; outline: none;
          transition: border-color 0.2s;
        }
        input[type="text"]:focus, select:focus { border-color: #444; }
        select option { background: #1a1a24; }
        .stat-card {
          background: #111118; border: 1px solid #1e1e2e;
          border-radius: 16px; padding: 20px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .fade-in { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .streak-badge {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(255,107,53,0.15); border: 1px solid rgba(255,107,53,0.3);
          border-radius: 20px; padding: 2px 10px; font-size: 11px; color: #FF6B35;
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: "32px 24px 0" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.15em", color: "#555", textTransform: "uppercase", marginBottom: 4 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Stay<br />Disciplined.
        </h1>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "20px 24px 0" }}>
        <div className="stat-card">
          <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>Today</span>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: todayScore >= 80 ? "#06D6A0" : todayScore >= 50 ? "#FFD166" : "#F0EDE8" }}>
            {todayScore}<span style={{ fontSize: 14, color: "#555" }}>%</span>
          </span>
        </div>
        <div className="stat-card">
          <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>Best Streak</span>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: "#FF6B35" }}>
            {maxStreak}<span style={{ fontSize: 14, color: "#555" }}>d</span>
          </span>
        </div>
        <div className="stat-card">
          <span style={{ fontSize: 10, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>Total</span>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700 }}>
            {totalCompleted}
          </span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 4, padding: "20px 24px 0" }}>
        {["today", "progress"].map((v) => (
          <button key={v} className={`nav-btn ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
            {v === "today" ? "Today" : "7-Day Chart"}
          </button>
        ))}
      </div>

      {/* Today View */}
      {view === "today" && (
        <div className="fade-in" style={{ padding: "20px 24px 0" }}>
          {/* Score Ring */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1a1a24" strokeWidth="10" />
                <circle
                  className="score-ring"
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke={todayScore >= 80 ? "#06D6A0" : todayScore >= 50 ? "#FFD166" : "#FF6B35"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - todayScore / 100)}`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900 }}>{todayCompleted}</span>
                <span style={{ fontSize: 10, color: "#555" }}>of {habits.length}</span>
              </div>
            </div>
          </div>

          {grouped.map((group) => (
            <div key={group.key} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 14 }}>{group.icon}</span>
                <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: group.color }}>
                  {group.label}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {group.habits.map((habit) => {
                  const done = completions[today]?.[habit.id];
                  const streak = getStreak(habit.id, completions);
                  return (
                    <div
                      key={habit.id}
                      className={`habit-row ${done ? "done" : ""}`}
                      onClick={() => toggleHabit(habit.id)}
                    >
                      {celebrateId === habit.id && <div className="celebrate" />}
                      <div
                        className={`check-circle ${done ? "checked" : ""}`}
                        style={done ? { background: group.color } : {}}
                      >
                        {done && <span style={{ color: "#0A0A0F", fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, color: done ? "#888" : "#F0EDE8", textDecoration: done ? "line-through" : "none", transition: "all 0.2s" }}>
                          {habit.name}
                        </p>
                      </div>
                      {streak > 1 && (
                        <span className="streak-badge">🔥 {streak}</span>
                      )}
                      <button className="del-btn" onClick={(e) => { e.stopPropagation(); deleteHabit(habit.id); }}>×</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add Habit */}
          {showAdd ? (
            <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 16, padding: 20, marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="text"
                placeholder="Habit name..."
                value={newHabit.name}
                onChange={(e) => setNewHabit((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addHabit()}
                autoFocus
              />
              <select value={newHabit.category} onChange={(e) => setNewHabit((p) => ({ ...p, category: e.target.value }))}>
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="add-btn" onClick={addHabit} style={{ flex: 1 }}>Add Habit</button>
                <button className="add-btn" onClick={() => setShowAdd(false)} style={{ flex: 1, background: "#1e1e2e", color: "#F0EDE8" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button
              className="add-btn"
              onClick={() => setShowAdd(true)}
              style={{ width: "100%", marginTop: 16, background: "#16161e", color: "#F0EDE8", border: "1px dashed #2a2a3a" }}
            >
              + Add New Habit
            </button>
          )}
        </div>
      )}

      {/* Progress View */}
      {view === "progress" && (
        <div className="fade-in" style={{ padding: "24px 24px 0" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 20 }}>Completion Rate — Last 7 Days</p>

          {/* Bar Chart */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 160, marginBottom: 20, background: "#111118", borderRadius: 16, padding: "20px 16px 12px" }}>
            {chartData.map(({ day, label, pct, done, total }) => (
              <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: pct > 0 ? "#F0EDE8" : "#333" }}>{pct > 0 ? pct + "%" : ""}</span>
                <div style={{ width: "100%", height: 100, display: "flex", alignItems: "flex-end", borderRadius: 6, overflow: "hidden", background: "#1a1a24" }}>
                  <div
                    className="bar"
                    style={{
                      width: "100%",
                      height: `${pct}%`,
                      minHeight: pct > 0 ? 4 : 0,
                      background: pct >= 80 ? "#06D6A0" : pct >= 50 ? "#FFD166" : pct > 0 ? "#FF6B35" : "transparent",
                      borderRadius: "4px 4px 0 0",
                    }}
                  />
                </div>
                <span style={{ fontSize: 10, color: day === today ? "#F0EDE8" : "#555", fontWeight: day === today ? 500 : 400 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Per-habit streaks */}
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 12 }}>Habit Streaks</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {habits.map((habit) => {
              const streak = getStreak(habit.id, completions);
              const cat = CATEGORIES[habit.category];
              const weekRate = last7.filter((d) => completions[d]?.[habit.id]).length;
              return (
                <div key={habit.id} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{cat.icon}</span>
                      <span style={{ fontSize: 13 }}>{habit.name}</span>
                    </div>
                    <span className="streak-badge">🔥 {streak}d</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {last7.map((d) => (
                      <div
                        key={d}
                        title={d}
                        style={{
                          flex: 1, height: 6, borderRadius: 3,
                          background: completions[d]?.[habit.id] ? cat.color : "#1e1e2e",
                          transition: "background 0.3s",
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: "#555", marginTop: 6 }}>{weekRate}/7 days this week</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
