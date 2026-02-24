import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api/events";

const CreateEventTab = () => {
  const [form, setForm] = useState({
    title: "",
    sport: "Football",
    event_date: "",
    groups_count: 2,
    trophy: "",
    description: "",
  });

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false);

  const [card, setCard] = useState(null);          // text card from Gemini
  const [events, setEvents] = useState([]);        // events from DB
  const [aiImages, setAiImages] = useState({});    // {event_id: base64}

  const lastCreatedEventRef = useRef(null);

  const loadEvents = async () => {
    const r = await axios.get(`${API}/list`);
    setEvents(r.data || []);
  };

  useEffect(() => { loadEvents(); }, []);

  const onChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const createEvent = async () => {
    setLoadingCreate(true);
    try {
      const r = await axios.post(`${API}/create`, {
        ...form,
        groups_count: Number(form.groups_count),
      });

      setCard(r.data.card);
      lastCreatedEventRef.current = r.data.event;
      await loadEvents();

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      alert("Failed to create event");
    } finally {
      setLoadingCreate(false);
    }
  };

  // ✅ UPDATED: Generate AI Image using Puter (FREE, no backend needed)
  const generateAIImage = async (eventPayload) => {
    if (!eventPayload) return;
    setLoadingImg(true);

    try {
      if (!window.puter?.ai?.txt2img) {
        throw new Error("Puter AI not loaded. Check index.html script.");
      }

      // 1) Build prompt just like your backend did
      const basePrompt = `
Design a professional, colorful sports tournament invitation poster.
Sport: ${eventPayload.sport}
Event title: ${eventPayload.title}
Date: ${eventPayload.event_date}
Teams/Groups: ${eventPayload.groups_count}
Trophy: ${eventPayload.trophy || "Official Trophy"}
Extra description: ${eventPayload.description || ""}
Style: modern, vibrant, high-quality, sport-themed background, dynamic lighting, clean typography, poster layout.
      `.trim();

      const finalPrompt = card?.stylePrompt
        ? `${basePrompt}\nExtra style notes: ${card.stylePrompt}`
        : basePrompt;

      // 2) Puter returns a data URL like:
      // "data:image/png;base64,AAAA..."
      const dataUrl = await window.puter.ai.txt2img(finalPrompt);

      if (!dataUrl) throw new Error("No image returned from Puter");

      // 3) Extract base64 only
      const base64 = dataUrl.split(",")[1];
      if (!base64) throw new Error("Invalid image format from Puter");

      setAiImages(prev => ({ ...prev, [eventPayload.event_id]: base64 }));
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI image: " + err.message);
    } finally {
      setLoadingImg(false);
    }
  };

  const downloadAIImage = (base64, eventTitle = "event_card") => {
    if (!base64) return;
    const link = document.createElement("a");
    link.download = `${eventTitle}.png`;
    link.href = `data:image/png;base64,${base64}`;
    link.click();
  };

  const selectedEvent =
    lastCreatedEventRef.current ||
    (events.length ? events[0] : null);

  const selectedBase64 =
    selectedEvent ? aiImages[selectedEvent.event_id] : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr", gap: 16 }}>
      {/* LEFT */}
      <div>
        <h2 className="ai-title">Create Tournament Event</h2>
        <p className="ai-sub">Fill the form and generate an invitation card with real AI image.</p>

        <div className="ai-form">
          <div className="ai-row">
            <label>Title</label>
            <input name="title" value={form.title} onChange={onChange} />
          </div>

          <div className="ai-row">
            <label>Sport</label>
            <select name="sport" value={form.sport} onChange={onChange}>
              <option>Football</option>
              <option>Basketball</option>
              <option>Tennis</option>
              <option>Pedalo</option>
            </select>
          </div>

          <div className="ai-row">
            <label>Date</label>
            <input type="date" name="event_date" value={form.event_date} onChange={onChange} />
          </div>

          <div className="ai-row">
            <label>Groups / Teams count</label>
            <input type="number" name="groups_count" value={form.groups_count} onChange={onChange} />
          </div>

          <div className="ai-row">
            <label>Trophy</label>
            <input name="trophy" value={form.trophy} onChange={onChange} />
          </div>

          <div className="ai-row">
            <label>Description</label>
            <textarea name="description" rows="3" value={form.description} onChange={onChange} />
          </div>

          <button className="ai-btn" onClick={createEvent} disabled={loadingCreate}>
            {loadingCreate ? "Creating..." : "Create Event + Generate Text"}
          </button>
        </div>

        {/* Text Card Preview */}
        {card && selectedEvent && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                background: "#0f0f0f",
                color: "white",
                borderRadius: 16,
                padding: 20,
                border: "2px dashed #f3b86e",
                maxWidth: 520
              }}
            >
              <h1 style={{ margin: 0, fontSize: 28 }}>{card.headline}</h1>
              <p style={{ opacity: 0.85 }}>{card.subline}</p>
              <ul>
                {(card.details || []).map((d, i) => <li key={i}>{d}</li>)}
              </ul>
              <div style={{ marginTop: 10, fontWeight: 700 }}>
                SportZone — Official Invitation
              </div>
            </div>

            {/* Generate REAL AI Image */}
            <button
              style={{ marginTop: 12 }}
              onClick={() => generateAIImage(selectedEvent)}
              disabled={loadingImg}
            >
              {loadingImg ? "Generating AI Image..." : "Generate AI Invitation Image"}
            </button>

            {/* Show AI Image if exists */}
            {selectedBase64 && (
              <div style={{ marginTop: 14 }}>
                <img
                  alt="AI Invitation"
                  src={`data:image/png;base64,${selectedBase64}`}
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    borderRadius: 12,
                    border: "2px solid #f3b86e"
                  }}
                />
                <button
                  style={{ marginTop: 10 }}
                  onClick={() => downloadAIImage(selectedBase64, selectedEvent.title)}
                >
                  Download AI Card
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="ai-tab">
        <h3 className="ai-title">Created Event Cards</h3>
        <div className="ai-results">
          {events.map(ev => {
            const img64 = aiImages[ev.event_id];
            return (
              <div
                key={ev.event_id}
                className="ai-card"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  lastCreatedEventRef.current = ev;
                  setCard(prev => prev || {
                    headline: ev.title,
                    subline: `${ev.sport} Tournament`,
                    details: [
                      `Date: ${String(ev.event_date).slice(0,10)}`,
                      `Groups: ${ev.groups_count}`,
                      ev.trophy ? `Trophy: ${ev.trophy}` : ""
                    ].filter(Boolean)
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {/* Thumbnail */}
                {img64 ? (
                  <img
                    src={`data:image/png;base64,${img64}`}
                    alt={ev.title}
                    style={{ width: "100%", height: 170, objectFit: "cover" }}
                  />
                ) : (
                  <div className="ai-placeholder">No AI image yet</div>
                )}

                <div className="ai-info">
                  <div className="ai-name">{ev.title}</div>
                  <div className="ai-meta">
                    {ev.sport} • {String(ev.event_date).slice(0,10)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, padding: 8 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateAIImage(ev);
                    }}
                    disabled={loadingImg}
                  >
                    Generate
                  </button>
                  {img64 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadAIImage(img64, ev.title);
                      }}
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {events.length === 0 && <div className="ai-empty">No events yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default CreateEventTab;
