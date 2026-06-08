// Front_end/snp/src/components/dashboard/ReservationsCalendarModal.js

import React, { useEffect, useState } from "react";
import { Modal, Button, Alert, Spinner } from "react-bootstrap";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const monthNames = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec"
];

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function firstWeekday(year, monthIndex) {
  // 0=Sun ... 6=Sat
  return new Date(year, monthIndex, 1).getDay();
}

export default function ReservationsCalendarModal({ show, onHide }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState("12"); // "12" | "1"
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reservedDays, setReservedDays] = useState(new Map());
  // Map(dayString -> count)

  // fetch reserved days for the selected year
  useEffect(() => {
    if (!show) return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const url = `${API_BASE}/api/statistics/reservations-calendar?year=${year}`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            // IMPORTANT for ngrok: prevents ngrok HTML warning page
            "ngrok-skip-browser-warning": "true",
          },
        });

        // Read as text first so we can safely detect HTML/non-JSON responses
        const contentType = res.headers.get("content-type") || "";
        const bodyText = await res.text();

        // If backend returns HTML (React index.html, nginx page, ngrok warning page, etc)
        if (!contentType.includes("application/json")) {
          throw new Error(
            `API did not return JSON (status ${res.status}). ` +
            `Make sure REACT_APP_API_URL is correct. Response starts with: ` +
            bodyText.slice(0, 60)
          );
        }

        const data = JSON.parse(bodyText);

        if (!res.ok) throw new Error(data.error || "Failed to load");

        const map = new Map();
        (data.days || []).forEach((d) => {
          map.set(d.day, d.reservations_count);
        });
        setReservedDays(map);
      } catch (e) {
        setError(e?.message || "Unknown error");
        setReservedDays(new Map());
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [show, year]);

  const renderMonth = (y, m) => {
    const totalDays = daysInMonth(y, m);
    const start = firstWeekday(y, m);

    const cells = [];
    // blanks before day 1
    for (let i = 0; i < start; i++) cells.push(null);
    // days
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }

    return (
      <div
        key={`${y}-${m}`}
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 14,
          boxShadow: "0 6px 16px rgba(0,0,0,0.06)"
        }}
      >
        <div className="fw-bold mb-2">{monthNames[m]}</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            fontSize: 12,
            color: "#6b7280",
            textAlign: "center",
            marginBottom: 6
          }}
        >
          {["S","M","T","W","T","F","S"].map((w) => (
            <div key={w} className="fw-semibold">{w}</div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            fontSize: 14,
            textAlign: "center"
          }}
        >
          {rows.flat().map((day, idx) => {
            if (!day) return <div key={idx} />;

            const dayStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const count = reservedDays.get(dayStr);

            return (
              <div
                key={idx}
                title={count ? `${count} reservations` : ""}
                style={{
                  width: 28,
                  height: 28,
                  margin: "0 auto",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  background: count ? "#16a34a" : "transparent",
                  color: count ? "white" : "#111827"
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const render12Months = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 14
      }}
    >
      {monthNames.map((_, m) => renderMonth(year, m))}
    </div>
  );

  const render1Month = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => {
            let nextM = monthIndex - 1;
            let nextY = year;
            if (nextM < 0) { nextM = 11; nextY--; }
            setMonthIndex(nextM);
            if (nextY !== year) setYear(nextY);
          }}
        >
          ◀ Prev
        </Button>

        <h5 className="m-0 text-center" style={{ minWidth: 120 }}>
          {monthNames[monthIndex]} {year}
        </h5>

        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => {
            let nextM = monthIndex + 1;
            let nextY = year;
            if (nextM > 11) { nextM = 0; nextY++; }
            setMonthIndex(nextM);
            if (nextY !== year) setYear(nextY);
          }}
        >
          Next ▶
        </Button>
      </div>

      {renderMonth(year, monthIndex)}
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Reservations Calendar ({year})</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ minHeight: 420 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          {/* Year controls */}
          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => setYear((y) => y - 1)}
            >
              ◀ Prev Year
            </Button>
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => setYear((y) => y + 1)}
            >
              Next Year ▶
            </Button>
          </div>

          {/* View toggle */}
          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "12" ? "primary" : "outline-primary"}
              onClick={() => setViewMode("12")}
            >
              12 Months
            </Button>
            <Button
              size="sm"
              variant={viewMode === "1" ? "primary" : "outline-primary"}
              onClick={() => setViewMode("1")}
            >
              1 Month
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <div className="mt-2">Loading reservations...</div>
          </div>
        ) : (
          viewMode === "12" ? render12Months() : render1Month()
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
