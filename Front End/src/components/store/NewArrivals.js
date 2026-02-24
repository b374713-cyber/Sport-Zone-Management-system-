import React from "react";
import "../../store_sp.css";

const NewArrivals = ({ products = [], onSelect }) => {
  // آخر 4 منتجات حسب created_at
  const latest = [...products]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  if (latest.length === 0) {
    return (
      <div className="new-arrivals-empty">
        <h4 className="section-title">New Arrivals</h4>
        <p>No products yet. Add your first products to see them here.</p>
      </div>
    );
  }

  return (
    <div className="new-arrivals-section">
      <h4 className="section-title">New Arrivals</h4>

      <div className="new-arrivals-grid">
        {latest.map((p) => (
          <div
            key={p.product_id}
            className="arrival-card"
            onClick={() => onSelect?.(p)}
          >
            <div className="arrival-img-wrap">
              {p.image_url ? (
                <img
                  src={`http://localhost:5000${p.image_url}`}
                  alt={p.name}
                  className="arrival-img"
                />
              ) : (
                <div className="arrival-img placeholder">No Image</div>
              )}
            </div>

            <div className="arrival-info">
              <div className="arrival-name">{p.name}</div>
              <div className="arrival-category">{p.category}</div>
              <div className="arrival-price">${p.price}</div>
              <div className="arrival-stock">
                Stock: {p.stock_qty}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewArrivals;
