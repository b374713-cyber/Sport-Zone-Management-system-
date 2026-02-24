import React, { useState } from "react";
import { getAISuggestions, resolveImageUrl } from "../../services/storeService";
import "../../store_sp.css";

const AISuggestionsTab = () => {
  const [form, setForm] = useState({
    style: "",
    category: "",
    maxPrice: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [source, setSource] = useState("");

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuggestions([]);
    setSource("");

    try {
      const res = await getAISuggestions({
        style: form.style,
        category: form.category,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : null,
        notes: form.notes,
      });

      setSuggestions(Array.isArray(res?.suggestions) ? res.suggestions : []);
      setSource(res?.source || "");
    } catch (err) {
      console.error(err);
      alert("Failed to get AI suggestions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tab">
      <h2 className="ai-title">AI Suggestions from Your Real Stock</h2>
      <p className="ai-sub">
        Fill your preferences and the system will pick only from products you already have.
      </p>

      <form className="ai-form" onSubmit={handleSubmit}>
        <div className="ai-row">
          <label>Style / Mood</label>
          <input
            value={form.style}
            onChange={(e) => update("style", e.target.value)}
            placeholder="sportive / casual / warm / comfy..."
          />
        </div>

        <div className="ai-row">
          <label>Category (optional)</label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          >
            <option value="">Any</option>
            <option value="Shoes">Shoes</option>
            <option value="Clothes">Clothes</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>

        <div className="ai-row">
          <label>Max Price (optional)</label>
          <input
            type="number"
            value={form.maxPrice}
            onChange={(e) => update("maxPrice", e.target.value)}
            placeholder="e.g. 120"
          />
        </div>

        <div className="ai-row">
          <label>More Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Tell what you want exactly..."
          />
        </div>

        <button className="ai-btn" disabled={loading}>
          {loading ? "Thinking..." : "Get Suggestions"}
        </button>
      </form>

      <hr style={{ margin: "18px 0" }} />

      {loading && <p>Loading suggestions...</p>}

      {!loading && suggestions.length === 0 && (
        <p className="muted">No suggestions yet. Fill the form above.</p>
      )}

      <div className="ai-grid">
        {suggestions.map((s) => (
          <div key={s.product_id} className="ai-card">
            {s.image_url ? (
              <img src={resolveImageUrl(s.image_url)} alt={s.name} />
            ) : (
              <div className="ai-placeholder">No Image</div>
            )}

            <div className="ai-info">
              <div className="ai-name">{s.name}</div>
              <div className="ai-meta">
                {s.category} • ${s.price}
              </div>
              <div className="ai-reason">{s.reason}</div>
            </div>
          </div>
        ))}
      </div>

      {source && (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          source: {source}
        </div>
      )}
    </div>
  );
};

export default AISuggestionsTab;
