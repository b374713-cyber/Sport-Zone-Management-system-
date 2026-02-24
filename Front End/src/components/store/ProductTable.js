// // import React, { useState } from "react";
// // import EditProductModal from "./EditProductModal";
// // import "../../store_sp.css";

// // const ProductTable = ({ products, onEdit, onDelete, onStockIn, onStockOut }) => {
// //   const [editOpen, setEditOpen] = useState(false);
// //   const [selectedProduct, setSelectedProduct] = useState(null);

// //   const openEdit = (p) => {
// //     setSelectedProduct(p);
// //     setEditOpen(true);
// //   };

// //   const askQty = (label, cb) => {
// //     const q = prompt(label);
// //     const n = parseInt(q, 10);
// //     if (!n || n <= 0) return;
// //     cb(n);
// //   };

// //   return (
// //     <>
// //       <table className="store-table">
// //         <thead>
// //           <tr>
// //             <th>Image</th>
// //             <th>Name</th>
// //             <th>Category</th>
// //             <th>Price</th>
// //             <th>Stock</th>
// //             <th>Status</th>
// //             <th style={{ width: 220 }}>Actions</th>
// //           </tr>
// //         </thead>

// //         <tbody>
// //           {products.map((p) => (
// //             <tr key={p.product_id}>
// //               <td>
// //                 {p.image_url ? (
// //                   <div className="thumb-wrap">
// //                     <img
// //                       src={`http://localhost:5000${p.image_url}`}
// //                       alt={p.name}
// //                       className="store-thumb"
// //                     />

// //                     {/* Hover Preview كبير */}
// //                     <div className="thumb-preview">
// //                       <img
// //                         src={`http://localhost:5000${p.image_url}`}
// //                         alt={p.name}
// //                       />
// //                     </div>
// //                   </div>
// //                 ) : (
// //                   <div className="store-thumb placeholder">—</div>
// //                 )}
// //               </td>

// //               <td>{p.name}</td>
// //               <td>{p.category}</td>
// //               <td>{`$${p.price}`}</td>
// //               <td>{p.stock_qty}</td>
// //               <td>{p.status}</td>

// //               <td>
// //                 <button onClick={() => openEdit(p)}>Edit</button>
// //                 <button onClick={() => onDelete(p.product_id)}>Delete</button>
// //                 <button
// //                   onClick={() =>
// //                     askQty("Stock In quantity?", (n) =>
// //                       onStockIn(p.product_id, n)
// //                     )
// //                   }
// //                 >
// //                   +Stock
// //                 </button>
// //                 <button
// //                   onClick={() =>
// //                     askQty("Stock Out quantity?", (n) =>
// //                       onStockOut(p.product_id, n)
// //                     )
// //                   }
// //                 >
// //                   -Stock
// //                 </button>
// //               </td>
// //             </tr>
// //           ))}

// //           {products.length === 0 && (
// //             <tr>
// //               <td colSpan="7" style={{ padding: 20, textAlign: "center" }}>
// //                 No products found.
// //               </td>
// //             </tr>
// //           )}
// //         </tbody>
// //       </table>

// //       {/* مودال التعديل */}
// //       <EditProductModal
// //         open={editOpen}
// //         onClose={() => setEditOpen(false)}
// //         product={selectedProduct}
// //         onSubmit={onEdit}
// //       />
// //     </>
// //   );
// // };

// // export default ProductTable;
// import React, { useState, useEffect, useRef } from "react";
// import EditProductModal from "./EditProductModal";
// import "../../store_sp.css";

// const ProductTable = ({ products, onEdit, onDelete, onStockIn, onStockOut }) => {
//   const [editOpen, setEditOpen] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
  
//   // Ref for modal container
//   const modalRef = useRef(null);

//   // Auto-scroll when edit modal opens
//   useEffect(() => {
//     if (editOpen && modalRef.current) {
//       // Small delay to ensure modal is rendered
//       setTimeout(() => {
//         // Scroll to the modal
//         modalRef.current?.scrollIntoView({ 
//           behavior: 'smooth', 
//           block: 'center'
//         });
        
//         // Also scroll the page to top if needed
//         window.scrollTo({
//           top: Math.max(0, window.pageYOffset - 100),
//           behavior: 'smooth'
//         });
//       }, 100);
//     }
//   }, [editOpen]);

//   const openEdit = (p) => {
//     setSelectedProduct(p);
//     setEditOpen(true);
//   };

//   const askQty = (label, cb) => {
//     const q = prompt(label);
//     const n = parseInt(q, 10);
//     if (!n || n <= 0) return;
//     cb(n);
//   };

//   return (
//     <>
//       <style>{`
//         .edit-modal-overlay {
//           position: fixed;
//           top: 0;
//           left: 0;
//           right: 0;
//           bottom: 0;
//           background-color: rgba(0, 0, 0, 0.5);
//           z-index: 1050;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 20px;
//           overflow-y: auto;
//         }
        
//         .edit-modal-content {
//           background: white;
//           border-radius: 8px;
//           max-width: 800px;
//           width: 100%;
//           max-height: 90vh;
//           overflow-y: auto;
//           box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
//           margin: auto;
//         }
        
//         /* Ensure modal is visible */
//         .edit-modal-content .modal-content {
//           max-height: 85vh;
//           overflow-y: auto;
//         }
//       `}</style>

//       <table className="store-table">
//         <thead>
//           <tr>
//             <th>Image</th>
//             <th>Name</th>
//             <th>Category</th>
//             <th>Price</th>
//             <th>Stock</th>
//             <th>Status</th>
//             <th style={{ width: 220 }}>Actions</th>
//           </tr>
//         </thead>

//         <tbody>
//           {products.map((p) => (
//             <tr key={p.product_id}>
//               <td>
//                 {p.image_url ? (
//                   <div className="thumb-wrap">
//                     <img
//                       src={`http://localhost:5000${p.image_url}`}
//                       alt={p.name}
//                       className="store-thumb"
//                     />

//                     {/* Hover Preview */}
//                     <div className="thumb-preview">
//                       <img
//                         src={`http://localhost:5000${p.image_url}`}
//                         alt={p.name}
//                       />
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="store-thumb placeholder">—</div>
//                 )}
//               </td>

//               <td>{p.name}</td>
//               <td>{p.category}</td>
//               <td>{`$${p.price}`}</td>
//               <td>{p.stock_qty}</td>
//               <td>{p.status}</td>

//               <td>
//                 <button onClick={() => openEdit(p)}>
//                   Edit
//                 </button>
//                 <button onClick={() => onDelete(p.product_id)}>Delete</button>
//                 <button
//                   onClick={() =>
//                     askQty("Stock In quantity?", (n) =>
//                       onStockIn(p.product_id, n)
//                     )
//                   }
//                 >
//                   +Stock
//                 </button>
//                 <button
//                   onClick={() =>
//                     askQty("Stock Out quantity?", (n) =>
//                       onStockOut(p.product_id, n)
//                     )
//                   }
//                 >
//                   -Stock
//                 </button>
//               </td>
//             </tr>
//           ))}

//           {products.length === 0 && (
//             <tr>
//               <td colSpan="7" style={{ padding: 20, textAlign: "center" }}>
//                 No products found.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       {/* Edit Modal */}
//       {editOpen && (
//         <div 
//           className="edit-modal-overlay"
//           onClick={() => setEditOpen(false)}
//           ref={modalRef}
//         >
//           <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
//             <EditProductModal
//               open={editOpen}
//               onClose={() => setEditOpen(false)}
//               product={selectedProduct}
//               onSubmit={onEdit}
//             />
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default ProductTable;
import React, { useState, useEffect, useRef } from "react";
import EditProductModal from "./EditProductModal";
import "../../store_sp.css";

const ProductTable = ({ products, onEdit, onDelete, onStockIn, onStockOut }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Refs for scrolling
  const tableContainerRef = useRef(null);
  const productRowRefs = useRef({});

  const openEdit = (p) => {
    setSelectedProduct(p);
    setEditOpen(true);
    
    // Scroll to the product row
    setTimeout(() => {
      const rowRef = productRowRefs.current[p.product_id];
      if (rowRef) {
        // Get the table container
        const container = tableContainerRef.current || document.documentElement;
        
        // Calculate position
        const rowRect = rowRef.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Scroll the page to show the modal area
        const scrollToPosition = window.pageYOffset + rowRect.top - 200;
        
        window.scrollTo({
          top: scrollToPosition,
          behavior: 'smooth'
        });
      }
    }, 10);
  };

  const askQty = (label, cb) => {
    const q = prompt(label);
    const n = parseInt(q, 10);
    if (!n || n <= 0) return;
    cb(n);
  };

  return (
    <>
      <div ref={tableContainerRef}>
        <table className="store-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr 
                key={p.product_id} 
                ref={el => productRowRefs.current[p.product_id] = el}
                className={selectedProduct?.product_id === p.product_id ? 'highlighted-row' : ''}
              >
                <td>
                  {p.image_url ? (
                    <div className="thumb-wrap">
                      <img
                        src={`http://localhost:5000${p.image_url}`}
                        alt={p.name}
                        className="store-thumb"
                      />

                      {/* Hover Preview */}
                      <div className="thumb-preview">
                        <img
                          src={`http://localhost:5000${p.image_url}`}
                          alt={p.name}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="store-thumb placeholder">—</div>
                  )}
                </td>

                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{`$${p.price}`}</td>
                <td>{p.stock_qty}</td>
                <td>{p.status}</td>

                <td>
                  <button onClick={() => openEdit(p)}>
                    Edit
                  </button>
                  <button onClick={() => onDelete(p.product_id)}>Delete</button>
                  <button
                    onClick={() =>
                      askQty("Stock In quantity?", (n) =>
                        onStockIn(p.product_id, n)
                      )
                    }
                  >
                    +Stock
                  </button>
                  <button
                    onClick={() =>
                      askQty("Stock Out quantity?", (n) =>
                        onStockOut(p.product_id, n)
                      )
                    }
                  >
                    -Stock
                  </button>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: 20, textAlign: "center" }}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <EditProductModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        product={selectedProduct}
        onSubmit={onEdit}
      />

      <style>{`
        .highlighted-row {
          background-color: rgba(30, 140, 111, 0.15) !important;
          box-shadow: inset 4px 0 0 #1e8c6f;
          transition: all 0.3s ease;
        }
        
        /* Ensure modal is always visible */
        .store-modal-backdrop {
          z-index: 9999 !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background-color: rgba(0, 0, 0, 0.7) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 20px !important;
        }
        
        .store-modal {
          position: relative !important;
          z-index: 10000 !important;
          background: white !important;
          padding: 30px !important;
          border-radius: 12px !important;
          max-width: 550px !important;
          width: 100% !important;
          max-height: 85vh !important;
          overflow-y: auto !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
    </>
  );
};

export default ProductTable;