// Front_end/snp/src/components/dashboard/GamingStats.js
import React, { useEffect, useMemo, useState } from "react";
import { Spinner, Alert, Badge, ProgressBar } from "react-bootstrap";
import axios from "axios";

const API = "http://localhost:5000/api";

// Enhanced device metadata with emojis
const DEVICE_META = {
  Console: {
    icon: "🎮",
    color: "#8b5cf6",
    gradient: "from-purple-600 to-indigo-600",
    bg: "rgba(139, 92, 246, 0.12)",
  },
  PlayStation: {
    icon: "🟦",
    color: "#0066cc",
    gradient: "from-blue-600 to-cyan-600",
    bg: "rgba(0, 102, 204, 0.12)",
  },
  Xbox: {
    icon: "🟩",
    color: "#107c10",
    gradient: "from-green-600 to-emerald-600",
    bg: "rgba(16, 124, 16, 0.12)",
  },
  PC: {
    icon: "🖥️",
    color: "#0ea5e9",
    gradient: "from-sky-600 to-blue-500",
    bg: "rgba(14, 165, 233, 0.12)",
  },
  VR: {
    icon: "🥽",
    color: "#f59e0b",
    gradient: "from-amber-600 to-orange-500",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  Arcade: {
    icon: "🕹️",
    color: "#ec4899",
    gradient: "from-pink-600 to-rose-500",
    bg: "rgba(236, 72, 153, 0.12)",
  },
  Default: {
    icon: "🎲",
    color: "#64748b",
    gradient: "from-slate-600 to-gray-600",
    bg: "rgba(100, 116, 139, 0.12)",
  },
};

function getDeviceMeta(type) {
  return DEVICE_META[type] || DEVICE_META.Default;
}

// =======================
// Sexy Main Top Stat Card
// =======================
function StatCard({ title, value, icon, color, trend, subtitle, gradient }) {
  return (
    <div className={`stat-card ${gradient}`}>
      <div className="stat-card-content">
        <div className="stat-icon" style={{ backgroundColor: `${color}22` }}>
          {icon}
        </div>
        <div className="stat-info">
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          {trend && (
            <div className="stat-trend">
              <span className={`trend-${trend.type}`}>
                {trend.icon} {trend.value}
              </span>
              <span className="stat-subtitle">{subtitle}</span>
            </div>
          )}
        </div>
      </div>

      {/* glow */}
      <div
        className="stat-glow"
        style={{
          background: `radial-gradient(circle, ${color}55, transparent 70%)`,
        }}
      />
    </div>
  );
}

// =======================
// Device Performance Card
// =======================
function DeviceCard({ device, rank, type = "plays", overallTotal }) {
  const { icon, color, bg } = getDeviceMeta(device.device_type);

  const plays = Number(device.playCount || 0);
  const hours = Number(device.totalHours || 0);
  const income = Number(device.totalIncome || 0);

  const incomeShare =
    overallTotal.income > 0 ? (income / overallTotal.income) * 100 : 0;
  const timeShare =
    overallTotal.hours > 0 ? (hours / overallTotal.hours) * 100 : 0;
  const playsShare =
    overallTotal.plays > 0 ? (plays / overallTotal.plays) * 100 : 0;

  const performanceScore = Math.round(
    (incomeShare * 0.5 + timeShare * 0.3 + playsShare * 0.2) / 10
  );

  const getRankBadge = (rankNum) => {
    switch (rankNum) {
      case 1:
        return { icon: "👑", color: "#fbbf24", label: "Champion" };
      case 2:
        return { icon: "🥈", color: "#94a3b8", label: "Runner-up" };
      case 3:
        return { icon: "🥉", color: "#b45309", label: "Third" };
      default:
        return { icon: "🏆", color: "#475569", label: `Rank #${rankNum}` };
    }
  };

  const rankBadge = getRankBadge(rank);

  return (
    <div className="device-performance-card" style={{ "--device-color": color }}>
      <div className="device-card-header">
        <div className="device-rank">
          <div
            className="rank-badge"
            style={{ backgroundColor: rankBadge.color }}
          >
            <span className="rank-icon">{rankBadge.icon}</span>
            <span>{rankBadge.label}</span>
          </div>
        </div>

        <div className="device-meta">
          <div className="device-icon-wrapper" style={{ backgroundColor: bg }}>
            <span className="device-icon-emoji">{icon}</span>
          </div>
          <div className="device-name">
            <h4>{device.device_type}</h4>
            <span className="device-type">
              {type === "plays" ? "Most Played" : "Most Time"}
            </span>
          </div>
        </div>
      </div>

      <div className="device-stats-grid">
        <div className="stat-item">
          <div className="stat-label">
            <span className="stat-label-icon">🔥</span> Plays
          </div>
          <div className="stat-number">{plays.toLocaleString()}</div>
          <ProgressBar
            now={playsShare}
            className="custom-progress"
            style={{ "--progress-color": color }}
          />
          <div className="stat-percent">{playsShare.toFixed(1)}%</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">
            <span className="stat-label-icon">⏱️</span> Hours
          </div>
          <div className="stat-number">{hours.toFixed(0)}</div>
          <ProgressBar
            now={timeShare}
            className="custom-progress"
            style={{ "--progress-color": color }}
          />
          <div className="stat-percent">{timeShare.toFixed(1)}%</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">
            <span className="stat-label-icon">💰</span> Income
          </div>
          <div className="stat-number">${income.toLocaleString()}</div>
          <ProgressBar
            now={incomeShare}
            className="custom-progress"
            style={{ "--progress-color": color }}
          />
          <div className="stat-percent">{incomeShare.toFixed(1)}%</div>
        </div>
      </div>

      <div className="device-performance-score">
        <div className="score-label">Performance Score</div>
        <div className="score-value">
          {performanceScore}/10
          <div className="score-stars">
            {"★".repeat(performanceScore)}
            {"☆".repeat(Math.max(0, 10 - performanceScore))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =======================
// Circular Progress
// =======================
function CircularProgress({ percentage, label, icon, color, size = 90 }) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress-container">
      <svg width={size} height={size} className="circular-progress-svg">
        <circle
          className="progress-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="8"
        />
        <circle
          className="progress-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke={color}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <div className="circular-progress-content">
        <div className="circular-icon">{icon}</div>
        <div className="circular-value">{percentage.toFixed(0)}%</div>
        <div className="circular-label">{label}</div>
      </div>
    </div>
  );
}

export default function GamingStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [activeView, setActiveView] = useState("overview");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await axios.get(`${API}/gaming/statistics`);
        setData(res.data.statistics);
      } catch (e) {
        setErr(e.response?.data?.error || "Failed to fetch gaming statistics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ✅ FIXED: dedupe totals so no double counting
  const overallTotals = useMemo(() => {
    if (!data) return { income: 0, hours: 0, plays: 0 };

    const map = new Map();

    const add = (arr = []) => {
      arr.forEach((d) => {
        const key = d.device_type;
        const prev = map.get(key) || { income: 0, hours: 0, plays: 0 };
        map.set(key, {
          income: prev.income + Number(d.totalIncome || 0),
          hours: prev.hours + Number(d.totalHours || 0),
          plays: prev.plays + Number(d.playCount || 0),
        });
      });
    };

    add(data.mostPlayedDevices);
    add(data.mostTimePlayed);

    const merged = [...map.values()];
    return {
      income: merged.reduce((s, d) => s + d.income, 0),
      hours: merged.reduce((s, d) => s + d.hours, 0),
      plays: merged.reduce((s, d) => s + d.plays, 0),
    };
  }, [data]);

  const topDevice = useMemo(() => {
    if (!data?.mostPlayedDevices?.[0]) return null;
    return {
      ...data.mostPlayedDevices[0],
      meta: getDeviceMeta(data.mostPlayedDevices[0].device_type),
    };
  }, [data]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-wrapper">
          <Spinner animation="border" variant="primary" />
          <span>Loading Gaming Universe...</span>
        </div>
      </div>
    );
  }

  if (err) return <Alert variant="danger">{err}</Alert>;
  if (!data) return null;

  // ✅ FIXED: backend doesn't return totalHours/totalSessions, so compute safely
  const totalIncome = Number(data.totalIncome || 0);
  const totalHours = overallTotals.hours;
  const totalSessions = overallTotals.plays;

  // Floating background icons (subtle)
  const floatingIcons = ["💰", "🎮", "🕹️", "🖥️", "🥽", "⭐", "⚡"];

  return (
    <div className="gaming-dashboard">
      <style>{`
        .gaming-dashboard {
          position: relative;
          background: radial-gradient(ellipse at top, #0f172a 0%, #020617 70%);
          padding: 24px;
          color: white;
          border-radius: 18px;
          overflow: hidden;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        /* Floating background */
        .floating-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.18;
          z-index: 0;
        }
        .floating-bg span {
          position: absolute;
          font-size: 42px;
          filter: blur(0.2px);
          animation: floaty 10s ease-in-out infinite;
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(8deg); }
        }

        /* Header */
        .dashboard-header {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 26px;
        }
        .dashboard-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .dashboard-title h1 {
          font-size: 2.1rem;
          font-weight: 900;
          background: linear-gradient(135deg, #22c55e, #0ea5e9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }
        .dashboard-subtitle {
          color: #94a3b8;
          font-size: 0.95rem;
          margin-top: 4px;
        }

        .view-controls {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.06);
          padding: 6px;
          border-radius: 14px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .view-btn {
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #94a3b8;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .view-btn.active {
          background: rgba(14, 165, 233, 0.22);
          color: #38bdf8;
          box-shadow: 0 6px 16px rgba(14, 165, 233, 0.35);
          transform: translateY(-1px);
        }

        /* TOP STATS GRID */
        .stats-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin-bottom: 26px;
        }
        @media (max-width: 1200px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr; }
        }

        .stat-card {
          position: relative;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 22px;
          padding: 22px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
        }
        .stat-card-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-icon {
          width: 62px;
          height: 62px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .stat-title {
          font-size: 0.85rem;
          color: #94a3b8;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 1.95rem;
          font-weight: 900;
          line-height: 1;
        }
        .stat-trend {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          margin-top: 8px;
        }
        .trend-up { color: #22c55e; font-weight: 800; }
        .trend-down { color: #ef4444; font-weight: 800; }
        .stat-subtitle { color: #64748b; font-weight: 600; }

        .stat-glow {
          position: absolute;
          top: -60%;
          left: -60%;
          width: 220%;
          height: 220%;
          opacity: 0.35;
          z-index: 1;
        }

        /* PERFORMANCE GRID */
        .performance-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 18px;
        }
        @media (max-width: 1024px) {
          .performance-grid { grid-template-columns: 1fr; }
        }

        .devices-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 6px 0 6px;
        }
        .section-header h3 {
          font-size: 1.35rem;
          font-weight: 900;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .device-performance-card {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 22px;
          padding: 22px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
        .device-performance-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--device-color), transparent);
        }

        .device-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .rank-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 18px;
          font-weight: 800;
          font-size: 0.82rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .rank-icon { font-size: 1.1rem; }

        .device-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .device-icon-wrapper {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .device-icon-emoji { font-size: 1.9rem; }

        .device-name h4 {
          font-size: 1.2rem;
          font-weight: 900;
          margin: 0;
        }
        .device-type {
          color: #94a3b8;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .device-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (max-width: 650px) {
          .device-stats-grid { grid-template-columns: 1fr; }
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          padding: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .stat-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .stat-number {
          font-size: 1.35rem;
          font-weight: 900;
          margin-bottom: 10px;
        }

        /* ✅ Custom progress styling */
        .custom-progress {
          height: 6px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }
        .custom-progress .progress-bar {
          background: var(--progress-color);
          border-radius: 3px;
        }

        .stat-percent {
          text-align: right;
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--progress-color);
        }

        .device-performance-score {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), transparent);
          border-radius: 14px;
          padding: 12px 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .score-label { font-size: 0.9rem; color: #94a3b8; font-weight: 700; }
        .score-value {
          font-size: 1.35rem;
          font-weight: 900;
          color: #fbbf24;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .score-stars { font-size: 1.1rem; letter-spacing: 2px; }

        /* Circular */
        .circular-progress-section {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 22px;
          padding: 22px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .progress-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-top: 14px;
        }
        @media (max-width: 768px) {
          .progress-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .circular-progress-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .progress-bg { fill: none; stroke: rgba(255, 255, 255, 0.12); }
        .progress-fill {
          fill: none;
          stroke-linecap: round;
          transition: stroke-dashoffset 1s ease-in-out;
        }

        .circular-progress-content {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        .circular-icon { font-size: 1.35rem; margin-bottom: 2px; }
        .circular-value { font-size: 1.2rem; font-weight: 900; }
        .circular-label { font-size: 0.78rem; color: #94a3b8; font-weight: 700; }

        /* Gradient helpers ✅ fixed by using TWO classes with space */
        .from-purple-600.to-indigo-600 { background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(79, 70, 229, 0.12)); }
        .from-blue-600.to-cyan-600 { background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(6, 182, 212, 0.12)); }
        .from-green-600.to-emerald-600 { background: linear-gradient(135deg, rgba(22, 163, 74, 0.12), rgba(16, 185, 129, 0.12)); }
        .from-sky-600.to-blue-500 { background: linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(59, 130, 246, 0.12)); }
        .from-amber-600.to-orange-500 { background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(249, 115, 22, 0.12)); }
        .from-pink-600.to-rose-500 { background: linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(244, 63, 94, 0.12)); }
        .from-slate-600.to-gray-600 { background: linear-gradient(135deg, rgba(71, 85, 105, 0.12), rgba(75, 85, 99, 0.12)); }

        /* Loader */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 340px;
        }
        .spinner-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }
        .spinner-wrapper span {
          color: #94a3b8;
          font-size: 1.05rem;
          font-weight: 700;
        }
      `}</style>

      {/* Floating background */}
      <div className="floating-bg">
        {floatingIcons.map((ic, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 13) % 90}%`,
              top: `${(i * 17) % 85}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${8 + i}s`,
            }}
          >
            {ic}
          </span>
        ))}
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <div
            className="stat-icon"
            style={{ backgroundColor: "rgba(14, 165, 233, 0.2)" }}
          >
            <span style={{ fontSize: "2rem" }}>🎮</span>
          </div>
          <div>
            <h1>Gaming Universe</h1>
            <div className="dashboard-subtitle">
              Real-time analytics across all gaming platforms
            </div>
          </div>
        </div>

        <div className="view-controls">
          <button
            className={`view-btn ${
              activeView === "overview" ? "active" : ""
            }`}
            onClick={() => setActiveView("overview")}
          >
            Overview
          </button>
          <button
            className={`view-btn ${activeView === "devices" ? "active" : ""}`}
            onClick={() => setActiveView("devices")}
          >
            Devices
          </button>
          <button
            className={`view-btn ${
              activeView === "analytics" ? "active" : ""
            }`}
            onClick={() => setActiveView("analytics")}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* TOP STATS */}
      <div className="stats-grid">
        <StatCard
          title="Total Revenue"
          value={`$${totalIncome.toLocaleString()}`}
          icon="💰"
          color="#22c55e"
          trend={{ type: "up", value: "+12.5%", icon: "↗" }}
          subtitle="From all sessions"
          gradient="from-green-600 to-emerald-600"
        />

        <StatCard
          title="Play Time"
          value={`${totalHours.toLocaleString()}h`}
          icon="⏱️"
          color="#0ea5e9"
          trend={{ type: "up", value: "+8.3%", icon: "↗" }}
          subtitle="Total hours played"
          gradient="from-sky-600 to-blue-500"
        />

        <StatCard
          title="Total Sessions"
          value={totalSessions.toLocaleString()}
          icon="🔥"
          color="#f59e0b"
          trend={{ type: "up", value: "+5.7%", icon: "↗" }}
          subtitle="Completed plays"
          gradient="from-amber-600 to-orange-500"
        />

        <StatCard
          title="Top Platform"
          value={topDevice?.device_type || "N/A"}
          icon={topDevice?.meta?.icon || "🎲"}
          color={topDevice?.meta?.color || "#8b5cf6"}
          trend={{ type: "up", value: "#1 Rank", icon: "🏆" }}
          subtitle="Most profitable platform"
          gradient="from-purple-600 to-indigo-600"
        />
      </div>

      {/* Performance */}
      <div className="performance-grid">
        <div className="devices-container">
          <div className="section-header">
            <h3>
              <span>🔥</span> Most Played Devices
            </h3>
            <Badge bg="dark" className="p-2">
              Top 3 by Plays
            </Badge>
          </div>

          {data.mostPlayedDevices?.slice(0, 3).map((device, index) => (
            <DeviceCard
              key={`played-${device.device_type}-${index}`}
              device={device}
              rank={index + 1}
              type="plays"
              overallTotal={overallTotals}
            />
          ))}

          <div className="section-header" style={{ marginTop: 22 }}>
            <h3>
              <span>⏱️</span> Most Time Played
            </h3>
            <Badge bg="dark" className="p-2">
              Top 3 by Hours
            </Badge>
          </div>

          {data.mostTimePlayed?.slice(0, 3).map((device, index) => (
            <DeviceCard
              key={`time-${device.device_type}-${index}`}
              device={device}
              rank={index + 1}
              type="time"
              overallTotal={overallTotals}
            />
          ))}
        </div>

        {/* Circular */}
        <div className="circular-progress-section">
          <h3 style={{ fontWeight: 900 }}>Platform Distribution</h3>
          <p className="text-muted" style={{ color: "#94a3b8" }}>
            Share of total gaming activity
          </p>

          <div className="progress-grid">
            <CircularProgress
              percentage={
                overallTotals.income > 0
                  ? (Number(data.mostPlayedDevices?.[0]?.totalIncome || 0) /
                      overallTotals.income) *
                    100
                  : 0
              }
              label="Revenue Leader"
              icon="💰"
              color="#22c55e"
              size={120}
            />

            <CircularProgress
              percentage={
                overallTotals.hours > 0
                  ? (Number(data.mostTimePlayed?.[0]?.totalHours || 0) /
                      overallTotals.hours) *
                    100
                  : 0
              }
              label="Time Leader"
              icon="⏱️"
              color="#0ea5e9"
              size={120}
            />

            <CircularProgress
              percentage={
                overallTotals.plays > 0
                  ? (Number(data.mostPlayedDevices?.[0]?.playCount || 0) /
                      overallTotals.plays) *
                    100
                  : 0
              }
              label="Plays Leader"
              icon="🔥"
              color="#f59e0b"
              size={120}
            />
          </div>

          <div
            style={{
              marginTop: 22,
              padding: 16,
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: 14,
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <h5 style={{ fontWeight: 900 }}>Performance Insights</h5>
            <ul style={{ color: "#94a3b8", marginTop: 8, paddingLeft: 18 }}>
              <li>Top platform dominates revenue generation</li>
              <li>Time distribution shows engagement patterns</li>
              <li>Play count indicates popularity</li>
              <li>Balanced metrics = healthy gaming ecosystem</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
