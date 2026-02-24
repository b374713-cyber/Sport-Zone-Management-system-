import React, { useEffect, useState } from "react";
import gamingService from "../../services/gamingService";
import "./gaming.css"; // we will add styles here

export default function RoomOccupancyCard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const data = await gamingService.getRooms();
      setRooms(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 10000); // auto-refresh
    return () => clearInterval(interval);
  }, []);

  const colorFor = (percent) => {
    if (percent >= 75) return "occ-red";
    if (percent >= 40) return "occ-yellow";
    return "occ-green";
  };

  return (
    <div className="gaming-card room-card">
      <div className="room-header">
        <span className="title">Room Occupancy</span>
        <button className="refresh-btn" onClick={loadRooms}>Refresh</button>
      </div>
      <p className="subtitle">Live usage of rooms A-1, A-2, B-1, B-2</p>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : rooms.length === 0 ? (
        <div className="empty">No rooms configured yet</div>
      ) : (
        <div className="room-list">
          {rooms.map((r) => (
            <div key={r.room_id} className="room-item">
              <div className="room-info">
                <div className="room-name">
                  🔹 Room {r.section}-{r.room_number}
                </div>
                <div className="room-capacity">
                  {r.busy_devices}/{r.capacity} devices busy
                </div>
              </div>

              <div className={`room-bar ${colorFor(r.occupancy_percent)}`}>
                <div
                  className="room-bar-fill"
                  style={{ width: `${r.occupancy_percent}%` }}
                ></div>
              </div>

              <div className="room-percent">
                {r.occupancy_percent}% Busy
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
