// src/components/store/NewArrivalsRow.js
import React, { useEffect, useState } from "react";
import { getProducts } from "../../services/storeService";

const NewArrivalsRow = ({ onCardClick }) => {
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      setLoading(true);
      try {
        // نجيب آخر 4 منتجات
        const data = await getProducts({});
        setLatest((data || []).slice(0, 4));
      } catch (e) {
        console.error("New arrivals fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  return (
    <div className="store-newarrivals">
      <div className="store-newarrivals-head">
        <h3>New Arrivals</h3>
        <span>Last 4 added products</span>
      </div>

      {loading ? (
        <p style={{ padding: 10 }}>Loading new arrivals...</p>
      ) : latest.length === 0 ? (
        <p style={{ padding: 10 }}>No products yet.</p>
      ) : (
        <div className="store-newarrivals-row">
          {latest.map((p) => (
            <div
              key={p.product_id}
              className="store-product-card"
              onClick={() => onCardClick?.(p)}
            >
              <div className="store-card-img">
                {p.image_url ? (
                  <img
                    src={`http://localhost:5000${p.image_url}`}
                    alt={p.name}
                  />
                ) : (
                  <div className="store-card-img placeholder">No Image</div>
                )}
              </div>

              <div className="store-card-body">
                <div className="store-card-title">{p.name}</div>
                <div className="store-card-cat">{p.category}</div>
                <div className="store-card-price">${p.price}</div>
                <div className="store-card-stock">Stock: {p.stock_qty}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewArrivalsRow;
