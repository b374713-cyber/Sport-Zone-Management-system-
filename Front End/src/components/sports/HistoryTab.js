import React, { useEffect, useState } from "react";
import axios from "axios";

const HistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      // you already have reservations endpoint — use your real one.
      const r = await axios.get("http://localhost:5000/api/sports/reservations/history");
      setHistory(r.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <p>Loading history...</p>;

  return (
    <div className="ai-tab">
      <h2 className="ai-title">Reservations History</h2>
      <p className="ai-sub">All matches reserved since start.</p>

      <table className="store-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Sport</th>
            <th>Stadium</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h, i) => (
            <tr key={i}>
              <td>{String(h.date).slice(0,10)}</td>
              <td>{h.sport}</td>
              <td>{h.stadium_name}</td>
              <td>{h.time_slot}</td>
              <td>{h.status}</td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr><td colSpan="5" style={{ textAlign:"center", padding:14 }}>No history yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTab;
