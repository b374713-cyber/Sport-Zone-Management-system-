// import React from "react";
// import "../../store_sp.css";

// const ProductCard = ({ p, onEdit, onDelete, onStockIn, onStockOut }) => {
//   const askQty = (label, cb) => {
//     const q = prompt(label);
//     const n = parseInt(q, 10);
//     if (!n || n <= 0) return;
//     cb(n);
//   };

//   return (
//     <div className="prod-card">
//       <div className="prod-img-wrap">
//         {p.image_url ? (
//           <img
//   src={`http://localhost:5000${p.image_url}`}
//   alt={p.name}
//   className="prod-img hover-zoom"
// />

//         ) : (
//           <div className="prod-img placeholder">No Image</div>
//         )}

//         <span
//           className={
//             "prod-badge " +
//             (p.status === "In Stock"
//               ? "ok"
//               : p.status === "Low Stock"
//               ? "low"
//               : "out")
//           }
//         >
//           {p.status}
//         </span>
//       </div>

//       <div className="prod-body">
//         <div className="prod-title">{p.name}</div>
//         <div className="prod-cat">{p.category}</div>

//         <div className="prod-row">
//           <div className="prod-price">${p.price}</div>
//           <div className="prod-stock">Stock: {p.stock_qty}</div>
//         </div>

//         <div className="prod-actions">
//           <button onClick={() => onEdit(p)}>Edit</button>
//           <button onClick={() => onDelete(p.product_id)}>Delete</button>
//           <button onClick={() => askQty("+ Stock quantity?", (n) => onStockIn(p.product_id, n))}>
//             +Stock
//           </button>
//           <button onClick={() => askQty("- Stock quantity?", (n) => onStockOut(p.product_id, n))}>
//             -Stock
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductCard;
import React from "react";
import "../../store_sp.css";

const ProductCard = ({ p, onEdit, onDelete, onStockIn, onStockOut }) => {
  const askQty = (label, cb) => {
    const q = prompt(label);
    const n = parseInt(q, 10);
    if (!n || n <= 0) {
      alert("Please enter a valid positive number");
      return;
    }
    cb(n);
  };

  return (
    <div className="prod-card">
      <div className="prod-img-wrap">
        {p.image_url ? (
          <img
            src={`http://localhost:5000${p.image_url}`}
            alt={p.name}
            className="prod-img hover-zoom"
          />
        ) : (
          <div className="prod-img placeholder">No Image</div>
        )}

        <span
          className={
            "prod-badge " +
            (p.status === "In Stock"
              ? "ok"
              : p.status === "Low Stock"
              ? "low"
              : "out")
          }
        >
          {p.status}
        </span>
      </div>

      <div className="prod-body">
        <div className="prod-title">{p.name}</div>
        <div className="prod-cat">{p.category}</div>

        <div className="prod-row">
          <div className="prod-price">${p.price}</div>
          <div className="prod-stock">Stock: {p.stock_qty}</div>
        </div>

        <div className="prod-actions">
          <button onClick={() => onEdit(p)}>Edit</button>
          <button onClick={() => onDelete(p.product_id)}>Delete</button>
          {/* <button onClick={() => askQty("+ Stock quantity?", (n) => onStockIn(p.product_id, n))}>
            +Stock
          </button>
          <button onClick={() => askQty("- Stock quantity?", (n) => onStockOut(p.product_id, n))}>
            -Stock
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;