// // import React, { useEffect, useMemo, useState } from "react";
// // import { getReservations, resolveImageUrl } from "../../services/storeService";

// // const API_BASE_URL = "http://localhost:5000";

// // const SelledItemsTab = () => {
// //   const [reservations, setReservations] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   // Invoice modal state
// //   const [invoiceOpen, setInvoiceOpen] = useState(false);
// //   const [invoiceReservationId, setInvoiceReservationId] = useState(null);
// //   const [paymentMethod, setPaymentMethod] = useState("Cash");
// //   const [paidAt, setPaidAt] = useState("");
// //   const [creatingInvoice, setCreatingInvoice] = useState(false);

// //   const openPdf = (pdfUrl) => {
// //     if (!pdfUrl) return;
// //     window.open(`${API_BASE_URL}${pdfUrl}`, "_blank");
// //   };

// //   const downloadPdf = async (pdfUrl, filename = "invoice.pdf") => {
// //     try {
// //       if (!pdfUrl) return;
// //       const url = `${API_BASE_URL}${pdfUrl}`;

// //       const resp = await fetch(url);
// //       if (!resp.ok) throw new Error("Failed to download PDF");

// //       const blob = await resp.blob();
// //       const objUrl = window.URL.createObjectURL(blob);

// //       const a = document.createElement("a");
// //       a.href = objUrl;
// //       a.download = filename;
// //       document.body.appendChild(a);
// //       a.click();
// //       a.remove();

// //       window.URL.revokeObjectURL(objUrl);
// //     } catch (e) {
// //       console.error("downloadPdf error:", e);
// //       alert("Failed to download PDF.");
// //     }
// //   };

// //   const fetchAllReservations = async () => {
// //     try {
// //       setLoading(true);

// //       // we need ALL to see RECEIVED
// //       const data = await getReservations("all");
// //       const list = Array.isArray(data)
// //         ? data
// //         : Array.isArray(data?.reservations)
// //         ? data.reservations
// //         : [];

// //       setReservations(list);
// //     } catch (e) {
// //       console.error("fetchAllReservations error:", e);
// //       setReservations([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchAllReservations();
// //   }, []);

// //   const selled = useMemo(() => {
// //     return (Array.isArray(reservations) ? reservations : []).filter((r) => {
// //       const st = String(r.status || "").trim().toLowerCase();
// //       return st === "received";
// //     });
// //   }, [reservations]);

// //   const formatDate = (d) => {
// //     if (!d) return "—";
// //     const dt = new Date(d);
// //     if (Number.isNaN(dt.getTime())) return "—";
// //     return dt.toLocaleDateString('en-US', {
// //       year: 'numeric',
// //       month: 'short',
// //       day: 'numeric',
// //       hour: '2-digit',
// //       minute: '2-digit'
// //     });
// //   };

// //   const handleCreateOrOpenInvoice = async () => {
// //     try {
// //       if (!invoiceReservationId) return;
// //       setCreatingInvoice(true);

// //       // 1) check existing invoice
// //       const checkResp = await fetch(
// //         `${API_BASE_URL}/api/store/invoices/by-reservation/${invoiceReservationId}`
// //       );

// //       if (checkResp.ok) {
// //         const checkData = await checkResp.json();
// //         const inv = checkData?.invoice;
// //         if (inv?.pdf_path) {
// //           setInvoiceOpen(false);
// //           // open + download
// //           openPdf(inv.pdf_path);
// //           await downloadPdf(inv.pdf_path, `invoice_${inv.invoice_number || invoiceReservationId}.pdf`);
// //           return;
// //         }
// //       }

// //       // 2) create invoice
// //       const resp = await fetch(`${API_BASE_URL}/api/store/invoices/create-from-reservation`, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({
// //           reservation_id: invoiceReservationId,
// //           payment_method: paymentMethod || null,
// //           paid_at: paidAt ? new Date(paidAt).toISOString() : null,
// //         }),
// //       });

// //       const data = await resp.json();
// //       if (!resp.ok) throw new Error(data?.message || "Failed");

// //       alert(`Invoice created: ${data.invoice_number || ""}`);
// //       setInvoiceOpen(false);

// //       if (data?.pdf_url) {
// //         openPdf(data.pdf_url);
// //         await downloadPdf(data.pdf_url, `invoice_${data.invoice_number || invoiceReservationId}.pdf`);
// //       }
// //     } catch (e) {
// //       console.error("invoice error:", e);
// //       alert("Failed to generate/open invoice.");
// //     } finally {
// //       setCreatingInvoice(false);
// //     }
// //   };

// //   if (loading) return (
// //     <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
// //       <div className="spinner-border text-primary" role="status">
// //         <span className="visually-hidden">Loading sold items...</span>
// //       </div>
// //       <span className="ms-3">Loading sold items...</span>
// //     </div>
// //   );

// //   return (
// //     <div className="container-fluid py-3">
// //       <div className="row mb-4">
// //         <div className="col-12">
// //           <div className="d-flex justify-content-between align-items-center">
// //             <div>
// //               <h2 className="mb-1">Sold Items</h2>
// //               <p className="text-muted mb-0">
// //                 Items completed during exchange (Received)
// //               </p>
// //             </div>
// //             <button 
// //               className="btn btn-outline-primary" 
// //               onClick={fetchAllReservations}
// //             >
// //               <i className="bi bi-arrow-clockwise me-2"></i>
// //               Refresh
// //             </button>
// //           </div>
// //         </div>
// //       </div>

// //       {selled.length === 0 ? (
// //         <div className="text-center py-5">
// //           <div className="fs-4 text-muted mb-3">No sold items yet.</div>
// //           <div className="text-muted">Items marked as "Received" will appear here</div>
// //         </div>
// //       ) : (
// //         <div className="row g-4">
// //           {selled.map((r) => (
// //             <div key={r.reservation_id} className="col-12">
// //               <div className="card border-0 shadow-sm border-start border-4 border-success">
// //                 <div className="card-body">
// //                   {/* Header */}
// //                   <div className="d-flex justify-content-between align-items-start mb-3">
// //                     <div>
// //                       <div className="d-flex align-items-center gap-2 mb-2">
// //                         <h5 className="card-title mb-0 fw-bold text-success">
// //                           <i className="bi bi-check-circle-fill me-2"></i>
// //                           {r.reservation_code}
// //                         </h5>
// //                         <span className="badge bg-success">Sold</span>
// //                       </div>
// //                       <div className="text-muted">
// //                         <i className="bi bi-calendar-check me-2"></i>
// //                         {formatDate(r.confirmed_at)}
// //                       </div>
// //                     </div>
// //                     <div className="text-end">
// //                       {r.customer_name && (
// //                         <div className="fw-bold">
// //                           <i className="bi bi-person-circle me-2"></i>
// //                           Customer: {r.customer_name}
// //                         </div>
// //                       )}
// //                     </div>
// //                   </div>

// //                   {/* Items Grid */}
// //                   <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 mb-4">
// //                     {(r.items || []).map((it, idx) => (
// //                       <div key={`${it.product_id}-${idx}`} className="col">
// //                         <div className="card h-100 border">
// //                           <div 
// //                             className="position-relative" 
// //                             style={{ 
// //                               height: "150px", 
// //                               overflow: "hidden",
// //                               backgroundColor: "#f8f9fa"
// //                             }}
// //                           >
// //                             <img
// //                               src={resolveImageUrl(it.image_url)}
// //                               alt={it.name || "item"}
// //                               className="card-img-top h-100 w-100 object-fit-cover"
// //                               onError={(e) => {
// //                                 e.currentTarget.style.display = "none";
// //                                 e.currentTarget.parentElement.innerHTML = 
// //                                   '<div class="h-100 w-100 d-flex align-items-center justify-content-center bg-light"><i class="bi bi-image text-muted fs-1"></i></div>';
// //                               }}
// //                             />
// //                           </div>
// //                           <div className="card-body d-flex flex-column">
// //                             <h6 className="card-title fw-bold mb-2" style={{ minHeight: "40px" }}>
// //                               {it.name || "Item"}
// //                             </h6>
// //                             <div className="mt-auto">
// //                               <div className="d-flex justify-content-between mb-2">
// //                                 <span className="text-muted">Quantity:</span>
// //                                 <span className="fw-bold">{it.quantity} units</span>
// //                               </div>
// //                               <div className="d-flex justify-content-between">
// //                                 <span className="text-muted">Price:</span>
// //                                 <span className="fw-bold text-success">
// //                                   ${Number(it.unit_price || 0).toFixed(2)}
// //                                 </span>
// //                               </div>
// //                             </div>
// //                           </div>
// //                         </div>
// //                       </div>
// //                     ))}
// //                   </div>

// //                   {/* Footer */}
// //                   <div className="d-flex justify-content-between align-items-center border-top pt-3">
// //                     <div>
// //                       <h5 className="mb-0 fw-bold text-dark">
// //                         Total: ${Number(r.total_final_price || 0).toFixed(2)}
// //                       </h5>
// //                     </div>
// //                     <div className="d-flex align-items-center gap-3">
// //                       <span className="badge bg-success">
// //                         <i className="bi bi-cash-coin me-2"></i>
// //                         Status: {r.status}
// //                       </span>
// //                       <button 
// //                         className="btn btn-primary"
// //                         onClick={() => {
// //                           setInvoiceReservationId(r.reservation_id);
// //                           setPaymentMethod("Cash");
// //                           setPaidAt("");
// //                           setInvoiceOpen(true);
// //                         }}
// //                       >
// //                         <i className="bi bi-file-earmark-pdf me-2"></i>
// //                         Invoice PDF
// //                       </button>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           ))}
// //         </div>
// //       )}

// //       {/* Invoice Modal */}
// //       {invoiceOpen && (
// //         <div 
// //           className="modal fade show" 
// //           style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
// //           onClick={() => !creatingInvoice && setInvoiceOpen(false)}
// //         >
// //           <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
// //             <div className="modal-content">
// //               <div className="modal-header">
// //                 <h5 className="modal-title">
// //                   <i className="bi bi-file-earmark-pdf text-primary me-2"></i>
// //                   Create / Open Invoice PDF
// //                 </h5>
// //                 <button 
// //                   type="button" 
// //                   className="btn-close" 
// //                   onClick={() => setInvoiceOpen(false)}
// //                   disabled={creatingInvoice}
// //                 ></button>
// //               </div>
// //               <div className="modal-body">
// //                 <div className="alert alert-info">
// //                   <i className="bi bi-info-circle me-2"></i>
// //                   If an invoice already exists, it will be opened and downloaded automatically.
// //                 </div>

// //                 <div className="mb-3">
// //                   <label className="form-label fw-bold">
// //                     <i className="bi bi-credit-card me-2"></i>
// //                     Payment method
// //                   </label>
// //                   <select
// //                     className="form-select"
// //                     value={paymentMethod}
// //                     onChange={(e) => setPaymentMethod(e.target.value)}
// //                     disabled={creatingInvoice}
// //                   >
// //                     <option value="Cash">Cash</option>
// //                     <option value="Card">Card</option>
// //                     <option value="Transfer">Transfer</option>
// //                   </select>
// //                 </div>

// //                 <div className="mb-4">
// //                   <label className="form-label fw-bold">
// //                     <i className="bi bi-calendar-check me-2"></i>
// //                     Paid at (optional)
// //                   </label>
// //                   <input
// //                     type="datetime-local"
// //                     className="form-control"
// //                     value={paidAt}
// //                     onChange={(e) => setPaidAt(e.target.value)}
// //                     disabled={creatingInvoice}
// //                   />
// //                 </div>
// //               </div>
// //               <div className="modal-footer">
// //                 <button 
// //                   className="btn btn-secondary" 
// //                   onClick={() => setInvoiceOpen(false)}
// //                   disabled={creatingInvoice}
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button 
// //                   className="btn btn-primary d-flex align-items-center" 
// //                   onClick={handleCreateOrOpenInvoice}
// //                   disabled={creatingInvoice}
// //                 >
// //                   {creatingInvoice ? (
// //                     <>
// //                       <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
// //                       Processing...
// //                     </>
// //                   ) : (
// //                     <>
// //                       <i className="bi bi-file-earmark-arrow-down me-2"></i>
// //                       Generate / Open + Download
// //                     </>
// //                   )}
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Stats Summary */}
// //       {selled.length > 0 && (
// //         <div className="row mt-5">
// //           <div className="col-12">
// //             <div className="card border-0 bg-light">
// //               <div className="card-body">
// //                 <div className="row">
// //                   <div className="col-md-3 text-center">
// //                     <div className="fs-4 fw-bold text-success">{selled.length}</div>
// //                     <div className="text-muted">Total Sales</div>
// //                   </div>
// //                   <div className="col-md-3 text-center">
// //                     <div className="fs-4 fw-bold">
// //                       ${selled.reduce((sum, r) => sum + Number(r.total_final_price || 0), 0).toFixed(2)}
// //                     </div>
// //                     <div className="text-muted">Total Revenue</div>
// //                   </div>
// //                   <div className="col-md-3 text-center">
// //                     <div className="fs-4 fw-bold">
// //                       {selled.reduce((sum, r) => sum + (r.items?.length || 0), 0)}
// //                     </div>
// //                     <div className="text-muted">Items Sold</div>
// //                   </div>
// //                   <div className="col-md-3 text-center">
// //                     <div className="fs-4 fw-bold">
// //                       {selled.length > 0 
// //                         ? formatDate(Math.max(...selled.map(r => new Date(r.confirmed_at || r.created_at).getTime())))
// //                         : "—"
// //                       }
// //                     </div>
// //                     <div className="text-muted">Latest Sale</div>
// //                   </div>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default SelledItemsTab;
// import React, { useEffect, useMemo, useState } from "react";
// import { getReservations, resolveImageUrl } from "../../services/storeService";

// const API_BASE_URL = "http://localhost:5000";

// const SelledItemsTab = () => {
//   const [reservations, setReservations] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Invoice modal state
//   const [invoiceOpen, setInvoiceOpen] = useState(false);
//   const [invoiceReservationId, setInvoiceReservationId] = useState(null);
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paidAt, setPaidAt] = useState("");
//   const [creatingInvoice, setCreatingInvoice] = useState(false);

//   const openPdf = (pdfUrl) => {
//     if (!pdfUrl) return;
//     window.open(`${API_BASE_URL}${pdfUrl}`, "_blank");
//   };

//   const downloadPdf = async (pdfUrl, filename = "invoice.pdf") => {
//     try {
//       if (!pdfUrl) return;
//       const url = `${API_BASE_URL}${pdfUrl}`;

//       const resp = await fetch(url);
//       if (!resp.ok) throw new Error("Failed to download PDF");

//       const blob = await resp.blob();
//       const objUrl = window.URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = objUrl;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();

//       window.URL.revokeObjectURL(objUrl);
//     } catch (e) {
//       console.error("downloadPdf error:", e);
//       alert("Failed to download PDF.");
//     }
//   };

//   const fetchAllReservations = async () => {
//     try {
//       setLoading(true);

//       // we need ALL to see RECEIVED
//       const data = await getReservations("all");
//       const list = Array.isArray(data)
//         ? data
//         : Array.isArray(data?.reservations)
//         ? data.reservations
//         : [];

//       setReservations(list);
//     } catch (e) {
//       console.error("fetchAllReservations error:", e);
//       setReservations([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAllReservations();
//   }, []);

//   const selled = useMemo(() => {
//     return (Array.isArray(reservations) ? reservations : []).filter((r) => {
//       const st = String(r.status || "").trim().toLowerCase();
//       return st === "received";
//     });
//   }, [reservations]);

//   const formatDate = (d) => {
//     if (!d) return "—";
//     const dt = new Date(d);
//     if (Number.isNaN(dt.getTime())) return "—";
//     return dt.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const handleCreateOrOpenInvoice = async () => {
//     try {
//       if (!invoiceReservationId) return;
//       setCreatingInvoice(true);

//       // 1) check existing invoice
//       const checkResp = await fetch(
//         `${API_BASE_URL}/api/store/invoices/by-reservation/${invoiceReservationId}`
//       );

//       if (checkResp.ok) {
//         const checkData = await checkResp.json();
//         const inv = checkData?.invoice;
//         if (inv?.pdf_path) {
//           setInvoiceOpen(false);
//           // open + download
//           openPdf(inv.pdf_path);
//           await downloadPdf(inv.pdf_path, `invoice_${inv.invoice_number || invoiceReservationId}.pdf`);
//           return;
//         }
//       }

//       // 2) create invoice
//       const resp = await fetch(`${API_BASE_URL}/api/store/invoices/create-from-reservation`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           reservation_id: invoiceReservationId,
//           payment_method: paymentMethod || null,
//           paid_at: paidAt ? new Date(paidAt).toISOString() : null,
//         }),
//       });

//       const data = await resp.json();
//       if (!resp.ok) throw new Error(data?.message || "Failed");

//       alert(`Invoice created: ${data.invoice_number || ""}`);
//       setInvoiceOpen(false);

//       if (data?.pdf_url) {
//         openPdf(data.pdf_url);
//         await downloadPdf(data.pdf_url, `invoice_${data.invoice_number || invoiceReservationId}.pdf`);
//       }
//     } catch (e) {
//       console.error("invoice error:", e);
//       alert("Failed to generate/open invoice.");
//     } finally {
//       setCreatingInvoice(false);
//     }
//   };

//   if (loading) return (
//     <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
//       <div className="spinner-border text-primary" role="status">
//         <span className="visually-hidden">Loading sold items...</span>
//       </div>
//       <span className="ms-3">Loading sold items...</span>
//     </div>
//   );

//   return (
//     <div className="container-fluid py-3">
//       {/* Inline CSS for scrollable sold items */}
//       <style>{`
//         .scrollable-sold-items-container {
//           height: 650px; /* Fixed height */
//           overflow-y: auto; /* Enable vertical scrolling */
//           overflow-x: hidden; /* Prevent horizontal scroll */
//           padding: 15px;
//           background: #ffffff;
//           border-radius: 12px;
//           border: 1px solid #e0e0e0;
//           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
//           margin-top: 20px;
//         }
        
//         /* Custom scrollbar styling */
//         .scrollable-sold-items-container::-webkit-scrollbar {
//           width: 10px;
//         }
        
//         .scrollable-sold-items-container::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 10px;
//         }
        
//         .scrollable-sold-items-container::-webkit-scrollbar-thumb {
//           background: #1e8c6f; /* Emerald green from theme */
//           border-radius: 10px;
//         }
        
//         .scrollable-sold-items-container::-webkit-scrollbar-thumb:hover {
//           background: #146b57; /* Darker green */
//         }
        
//         /* For Firefox */
//         .scrollable-sold-items-container {
//           scrollbar-width: thin;
//           scrollbar-color: #1e8c6f #f1f1f1;
//         }
        
//         /* Responsive adjustments */
//         @media (max-width: 1200px) {
//           .scrollable-sold-items-container {
//             height: 550px;
//           }
//         }
        
//         @media (max-width: 992px) {
//           .scrollable-sold-items-container {
//             height: 500px;
//           }
//         }
        
//         @media (max-width: 768px) {
//           .scrollable-sold-items-container {
//             height: 450px;
//           }
//         }
//       `}</style>

//       <div className="row mb-4">
//         <div className="col-12">
//           <div className="d-flex justify-content-between align-items-center">
//             <div>
//               <h2 className="mb-1">Sold Items</h2>
//               <p className="text-muted mb-0">
//                 Items completed during exchange (Received)
//               </p>
//             </div>
//             <button 
//               className="btn btn-outline-primary" 
//               onClick={fetchAllReservations}
//             >
//               <i className="bi bi-arrow-clockwise me-2"></i>
//               Refresh
//             </button>
//           </div>
//         </div>
//       </div>

//       {selled.length === 0 ? (
//         <div className="text-center py-5">
//           <div className="fs-4 text-muted mb-3">No sold items yet.</div>
//           <div className="text-muted">Items marked as "Received" will appear here</div>
//         </div>
//       ) : (
//         <>
//           <div className="scrollable-sold-items-container">
//             <div className="row g-4">
//               {selled.map((r) => (
//                 <div key={r.reservation_id} className="col-12">
//                   <div className="card border-0 shadow-sm border-start border-4 border-success">
//                     <div className="card-body">
//                       {/* Header */}
//                       <div className="d-flex justify-content-between align-items-start mb-3">
//                         <div>
//                           <div className="d-flex align-items-center gap-2 mb-2">
//                             <h5 className="card-title mb-0 fw-bold text-success">
//                               <i className="bi bi-check-circle-fill me-2"></i>
//                               {r.reservation_code}
//                             </h5>
//                             <span className="badge bg-success">Sold</span>
//                           </div>
//                           <div className="text-muted">
//                             <i className="bi bi-calendar-check me-2"></i>
//                             {formatDate(r.confirmed_at)}
//                           </div>
//                         </div>
//                         <div className="text-end">
//                           {r.customer_name && (
//                             <div className="fw-bold">
//                               <i className="bi bi-person-circle me-2"></i>
//                               Customer: {r.customer_name}
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       {/* Items Grid */}
//                       <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 mb-4">
//                         {(r.items || []).map((it, idx) => (
//                           <div key={`${it.product_id}-${idx}`} className="col">
//                             <div className="card h-100 border">
//                               <div 
//                                 className="position-relative" 
//                                 style={{ 
//                                   height: "150px", 
//                                   overflow: "hidden",
//                                   backgroundColor: "#f8f9fa"
//                                 }}
//                               >
//                                 <img
//                                   src={resolveImageUrl(it.image_url)}
//                                   alt={it.name || "item"}
//                                   className="card-img-top h-100 w-100 object-fit-cover"
//                                   onError={(e) => {
//                                     e.currentTarget.style.display = "none";
//                                     e.currentTarget.parentElement.innerHTML = 
//                                       '<div class="h-100 w-100 d-flex align-items-center justify-content-center bg-light"><i class="bi bi-image text-muted fs-1"></i></div>';
//                                   }}
//                                 />
//                               </div>
//                               <div className="card-body d-flex flex-column">
//                                 <h6 className="card-title fw-bold mb-2" style={{ minHeight: "40px" }}>
//                                   {it.name || "Item"}
//                                 </h6>
//                                 <div className="mt-auto">
//                                   <div className="d-flex justify-content-between mb-2">
//                                     <span className="text-muted">Quantity:</span>
//                                     <span className="fw-bold">{it.quantity} units</span>
//                                   </div>
//                                   <div className="d-flex justify-content-between">
//                                     <span className="text-muted">Price:</span>
//                                     <span className="fw-bold text-success">
//                                       ${Number(it.unit_price || 0).toFixed(2)}
//                                     </span>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>

//                       {/* Footer */}
//                       <div className="d-flex justify-content-between align-items-center border-top pt-3">
//                         <div>
//                           <h5 className="mb-0 fw-bold text-dark">
//                             Total: ${Number(r.total_final_price || 0).toFixed(2)}
//                           </h5>
//                         </div>
//                         <div className="d-flex align-items-center gap-3">
//                           <span className="badge bg-success">
//                             <i className="bi bi-cash-coin me-2"></i>
//                             Status: {r.status}
//                           </span>
//                           <button 
//                             className="btn btn-primary"
//                             onClick={() => {
//                               setInvoiceReservationId(r.reservation_id);
//                               setPaymentMethod("Cash");
//                               setPaidAt("");
//                               setInvoiceOpen(true);
//                             }}
//                           >
//                             <i className="bi bi-file-earmark-pdf me-2"></i>
//                             Invoice PDF
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Stats Summary - placed outside scrollable container */}
//           <div className="row mt-5">
//             <div className="col-12">
//               <div className="card border-0 bg-light">
//                 <div className="card-body">
//                   <div className="row">
//                     <div className="col-md-3 text-center">
//                       <div className="fs-4 fw-bold text-success">{selled.length}</div>
//                       <div className="text-muted">Total Sales</div>
//                     </div>
//                     <div className="col-md-3 text-center">
//                       <div className="fs-4 fw-bold">
//                         ${selled.reduce((sum, r) => sum + Number(r.total_final_price || 0), 0).toFixed(2)}
//                       </div>
//                       <div className="text-muted">Total Revenue</div>
//                     </div>
//                     <div className="col-md-3 text-center">
//                       <div className="fs-4 fw-bold">
//                         {selled.reduce((sum, r) => sum + (r.items?.length || 0), 0)}
//                       </div>
//                       <div className="text-muted">Items Sold</div>
//                     </div>
//                     <div className="col-md-3 text-center">
//                       <div className="fs-4 fw-bold">
//                         {selled.length > 0 
//                           ? formatDate(Math.max(...selled.map(r => new Date(r.confirmed_at || r.created_at).getTime())))
//                           : "—"
//                         }
//                       </div>
//                       <div className="text-muted">Latest Sale</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Invoice Modal */}
//       {invoiceOpen && (
//         <div 
//           className="modal fade show" 
//           style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
//           onClick={() => !creatingInvoice && setInvoiceOpen(false)}
//         >
//           <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title">
//                   <i className="bi bi-file-earmark-pdf text-primary me-2"></i>
//                   Create / Open Invoice PDF
//                 </h5>
//                 <button 
//                   type="button" 
//                   className="btn-close" 
//                   onClick={() => setInvoiceOpen(false)}
//                   disabled={creatingInvoice}
//                 ></button>
//               </div>
//               <div className="modal-body">
//                 <div className="alert alert-info">
//                   <i className="bi bi-info-circle me-2"></i>
//                   If an invoice already exists, it will be opened and downloaded automatically.
//                 </div>

//                 <div className="mb-3">
//                   <label className="form-label fw-bold">
//                     <i className="bi bi-credit-card me-2"></i>
//                     Payment method
//                   </label>
//                   <select
//                     className="form-select"
//                     value={paymentMethod}
//                     onChange={(e) => setPaymentMethod(e.target.value)}
//                     disabled={creatingInvoice}
//                   >
//                     <option value="Cash">Cash</option>
//                     <option value="Card">Card</option>
//                     <option value="Transfer">Transfer</option>
//                   </select>
//                 </div>

//                 <div className="mb-4">
//                   <label className="form-label fw-bold">
//                     <i className="bi bi-calendar-check me-2"></i>
//                     Paid at (optional)
//                   </label>
//                   <input
//                     type="datetime-local"
//                     className="form-control"
//                     value={paidAt}
//                     onChange={(e) => setPaidAt(e.target.value)}
//                     disabled={creatingInvoice}
//                   />
//                 </div>
//               </div>
//               <div className="modal-footer">
//                 <button 
//                   className="btn btn-secondary" 
//                   onClick={() => setInvoiceOpen(false)}
//                   disabled={creatingInvoice}
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   className="btn btn-primary d-flex align-items-center" 
//                   onClick={handleCreateOrOpenInvoice}
//                   disabled={creatingInvoice}
//                 >
//                   {creatingInvoice ? (
//                     <>
//                       <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
//                       Processing...
//                     </>
//                   ) : (
//                     <>
//                       <i className="bi bi-file-earmark-arrow-down me-2"></i>
//                       Generate / Open + Download
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // export default SelledItemsTab;
// import React, { useEffect, useMemo, useState, useRef } from "react";
// import { getReservations, resolveImageUrl } from "../../services/storeService";

// const API_BASE_URL = "http://localhost:5000";

// const SelledItemsTab = () => {
//   const [reservations, setReservations] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Invoice modal state
//   const [invoiceOpen, setInvoiceOpen] = useState(false);
//   const [invoiceReservationId, setInvoiceReservationId] = useState(null);
//   const [currentReservation, setCurrentReservation] = useState(null);
//   const [paymentMethod, setPaymentMethod] = useState("Cash");
//   const [paidAt, setPaidAt] = useState("");
//   const [creatingInvoice, setCreatingInvoice] = useState(false);

//   // Refs for scrolling
//   const modalRef = useRef(null);
//   const reservationRefs = useRef({});
//   const containerRef = useRef(null);

//   const openPdf = (pdfUrl) => {
//     if (!pdfUrl) return;
//     window.open(`${API_BASE_URL}${pdfUrl}`, "_blank");
//   };

//   const downloadPdf = async (pdfUrl, filename = "invoice.pdf") => {
//     try {
//       if (!pdfUrl) return;
//       const url = `${API_BASE_URL}${pdfUrl}`;

//       const resp = await fetch(url);
//       if (!resp.ok) throw new Error("Failed to download PDF");

//       const blob = await resp.blob();
//       const objUrl = window.URL.createObjectURL(blob);

//       const a = document.createElement("a");
//       a.href = objUrl;
//       a.download = filename;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();

//       window.URL.revokeObjectURL(objUrl);
//     } catch (e) {
//       console.error("downloadPdf error:", e);
//       alert("Failed to download PDF.");
//     }
//   };

//   const fetchAllReservations = async () => {
//     try {
//       setLoading(true);

//       // we need ALL to see RECEIVED
//       const data = await getReservations("all");
//       const list = Array.isArray(data)
//         ? data
//         : Array.isArray(data?.reservations)
//         ? data.reservations
//         : [];

//       setReservations(list);
//     } catch (e) {
//       console.error("fetchAllReservations error:", e);
//       setReservations([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAllReservations();
//   }, []);

//   // Auto-scroll when modal opens
//   useEffect(() => {
//     if (invoiceOpen && modalRef.current) {
//       // Small delay to ensure modal is rendered
//       setTimeout(() => {
//         modalRef.current?.scrollIntoView({ 
//           behavior: 'smooth', 
//           block: 'center'
//         });
//       }, 100);
//     }
//   }, [invoiceOpen]);

//   const selled = useMemo(() => {
//     return (Array.isArray(reservations) ? reservations : []).filter((r) => {
//       const st = String(r.status || "").trim().toLowerCase();
//       return st === "received";
//     });
//   }, [reservations]);

//   const formatDate = (d) => {
//     if (!d) return "—";
//     const dt = new Date(d);
//     if (Number.isNaN(dt.getTime())) return "—";
//     return dt.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   // Convert date to datetime-local input format (YYYY-MM-DDTHH:mm)
//   const formatDateForInput = (dateString) => {
//     if (!dateString) return "";
//     const date = new Date(dateString);
//     if (Number.isNaN(date.getTime())) return "";
    
//     // Format: YYYY-MM-DDTHH:mm
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     const hours = String(date.getHours()).padStart(2, '0');
//     const minutes = String(date.getMinutes()).padStart(2, '0');
    
//     return `${year}-${month}-${day}T${hours}:${minutes}`;
//   };

//   const openInvoiceModal = (reservation) => {
//     // First scroll to the reservation (put it at top of container)
//     const reservationElement = reservationRefs.current[reservation.reservation_id];
//     if (reservationElement && containerRef.current) {
//       // Calculate position to scroll to
//       const container = containerRef.current;
//       const reservationTop = reservationElement.offsetTop;
      
//       // Scroll to put the reservation at the top of the container
//       container.scrollTo({
//         top: reservationTop - 20, // 20px padding
//         behavior: 'smooth'
//       });
      
//       // Wait a moment for scroll to complete, then open modal
//       setTimeout(() => {
//         setInvoiceReservationId(reservation.reservation_id);
//         setCurrentReservation(reservation);
//         setPaymentMethod("Cash");
        
//         // Auto-fill with the sale date (use confirmed_at or created_at)
//         const saleDate = reservation.confirmed_at || reservation.created_at || new Date().toISOString();
//         setPaidAt(formatDateForInput(saleDate));
        
//         setInvoiceOpen(true);
//       }, 300);
//     } else {
//       // Fallback if refs not available
//       setInvoiceReservationId(reservation.reservation_id);
//       setCurrentReservation(reservation);
//       setPaymentMethod("Cash");
      
//       const saleDate = reservation.confirmed_at || reservation.created_at || new Date().toISOString();
//       setPaidAt(formatDateForInput(saleDate));
      
//       setInvoiceOpen(true);
//     }
//   };

//   const handleCreateOrOpenInvoice = async () => {
//     try {
//       if (!invoiceReservationId) return;
//       setCreatingInvoice(true);

//       // 1) check existing invoice
//       const checkResp = await fetch(
//         `${API_BASE_URL}/api/store/invoices/by-reservation/${invoiceReservationId}`
//       );

//       if (checkResp.ok) {
//         const checkData = await checkResp.json();
//         const inv = checkData?.invoice;
//         if (inv?.pdf_path) {
//           setInvoiceOpen(false);
//           // open + download
//           openPdf(inv.pdf_path);
//           await downloadPdf(inv.pdf_path, `invoice_${inv.invoice_number || invoiceReservationId}.pdf`);
//           return;
//         }
//       }

//       // 2) create invoice with auto-filled date
//       const resp = await fetch(`${API_BASE_URL}/api/store/invoices/create-from-reservation`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           reservation_id: invoiceReservationId,
//           payment_method: paymentMethod || null,
//           paid_at: paidAt ? new Date(paidAt).toISOString() : null,
//         }),
//       });

//       const data = await resp.json();
//       if (!resp.ok) throw new Error(data?.message || "Failed");

//       alert(`Invoice created: ${data.invoice_number || ""}`);
//       setInvoiceOpen(false);

//       if (data?.pdf_url) {
//         openPdf(data.pdf_url);
//         await downloadPdf(data.pdf_url, `invoice_${data.invoice_number || invoiceReservationId}.pdf`);
//       }
//     } catch (e) {
//       console.error("invoice error:", e);
//       alert("Failed to generate/open invoice.");
//     } finally {
//       setCreatingInvoice(false);
//     }
//   };

//   if (loading) return (
//     <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
//       <div className="spinner-border text-primary" role="status">
//         <span className="visually-hidden">Loading sold items...</span>
//       </div>
//       <span className="ms-3">Loading sold items...</span>
//     </div>
//   );

//   return (
//     <div className="container-fluid py-3">
//       {/* Inline CSS for scrollable sold items */}
//       <style>{`
//         .scrollable-sold-items-container {
//           height: 650px; /* Fixed height */
//           overflow-y: auto; /* Enable vertical scrolling */
//           overflow-x: hidden; /* Prevent horizontal scroll */
//           padding: 15px;
//           background: #ffffff;
//           border-radius: 12px;
//           border: 1px solid #e0e0e0;
//           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
//           margin-top: 20px;
//         }
        
//         /* Custom scrollbar styling */
//         .scrollable-sold-items-container::-webkit-scrollbar {
//           width: 10px;
//         }
        
//         .scrollable-sold-items-container::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 10px;
//         }
        
//         .scrollable-sold-items-container::-webkit-scrollbar-thumb {
//           background: #1e8c6f; /* Emerald green from theme */
//           border-radius: 10px;
//         }
        
//         .scrollable-sold-items-container::-webkit-scrollbar-thumb:hover {
//           background: #146b57; /* Darker green */
//         }
        
//         /* For Firefox */
//         .scrollable-sold-items-container {
//           scrollbar-width: thin;
//           scrollbar-color: #1e8c6f #f1f1f1;
//         }
        
//         /* Responsive adjustments */
//         @media (max-width: 1200px) {
//           .scrollable-sold-items-container {
//             height: 550px;
//           }
//         }
        
//         @media (max-width: 992px) {
//           .scrollable-sold-items-container {
//             height: 500px;
//           }
//         }
        
//         @media (max-width: 768px) {
//           .scrollable-sold-items-container {
//             height: 450px;
//           }
//         }
        
//         /* Highlight the active reservation */
//         .reservation-card.highlighted {
//           box-shadow: 0 0 0 3px rgba(30, 140, 111, 0.3);
//           background-color: rgba(30, 140, 111, 0.05);
//           transition: all 0.3s ease;
//         }
        
//         /* Modal positioning */
//         .invoice-modal-overlay {
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
        
//         .invoice-modal-content {
//           background: white;
//           border-radius: 8px;
//           max-width: 500px;
//           width: 100%;
//           max-height: 90vh;
//           overflow-y: auto;
//           box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
//           margin: auto;
//         }
        
//         /* Better visibility for the modal */
//         .invoice-modal-content .modal-body {
//           max-height: 60vh;
//           overflow-y: auto;
//         }
//       `}</style>

//       <div className="row mb-4">
//         <div className="col-12">
//           <div className="d-flex justify-content-between align-items-center">
//             <div>
//               <h2 className="mb-1">Sold Items</h2>
//               <p className="text-muted mb-0">
//                 Items completed during exchange (Received)
//               </p>
//             </div>
//             <div className="d-flex gap-2">
//               <button 
//                 className="btn btn-outline-primary" 
//                 onClick={fetchAllReservations}
//               >
//                 <i className="bi bi-arrow-clockwise me-2"></i>
//                 Refresh
//               </button>
//               <button 
//                 className="btn btn-outline-secondary"
//                 onClick={() => {
//                   // Scroll to the latest (last) sold item
//                   if (selled.length > 0 && containerRef.current) {
//                     const lastReservationId = selled[selled.length - 1].reservation_id;
//                     const lastElement = reservationRefs.current[lastReservationId];
//                     if (lastElement) {
//                       containerRef.current.scrollTo({
//                         top: lastElement.offsetTop - 20,
//                         behavior: 'smooth'
//                       });
//                     }
//                   }
//                 }}
//               >
//                 <i className="bi bi-arrow-down-circle me-2"></i>
//                 Go to Latest
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {selled.length === 0 ? (
//         <div className="text-center py-5">
//           <div className="fs-4 text-muted mb-3">No sold items yet.</div>
//           <div className="text-muted">Items marked as "Received" will appear here</div>
//         </div>
//       ) : (
//         <>
//           <div 
//             className="scrollable-sold-items-container" 
//             ref={containerRef}
//           >
//             <div className="row g-4">
//               {selled.map((r, index) => (
//                 <div 
//                   key={r.reservation_id} 
//                   className="col-12"
//                   ref={el => reservationRefs.current[r.reservation_id] = el}
//                 >
//                   <div className="card border-0 shadow-sm border-start border-4 border-success reservation-card">
//                     <div className="card-body">
//                       {/* Header */}
//                       <div className="d-flex justify-content-between align-items-start mb-3">
//                         <div>
//                           <div className="d-flex align-items-center gap-2 mb-2">
//                             <h5 className="card-title mb-0 fw-bold text-success">
//                               <i className="bi bi-check-circle-fill me-2"></i>
//                               {r.reservation_code}
//                             </h5>
//                             <span className="badge bg-success">Sold</span>
//                             {index === selled.length - 1 && (
//                               <span className="badge bg-warning">Latest</span>
//                             )}
//                           </div>
//                           <div className="text-muted">
//                             <i className="bi bi-calendar-check me-2"></i>
//                             Sold on: {formatDate(r.confirmed_at)}
//                           </div>
//                         </div>
//                         <div className="text-end">
//                           {r.customer_name && (
//                             <div className="fw-bold">
//                               <i className="bi bi-person-circle me-2"></i>
//                               Customer: {r.customer_name}
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       {/* Items Grid */}
//                       <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 mb-4">
//                         {(r.items || []).map((it, idx) => (
//                           <div key={`${it.product_id}-${idx}`} className="col">
//                             <div className="card h-100 border">
//                               <div 
//                                 className="position-relative" 
//                                 style={{ 
//                                   height: "150px", 
//                                   overflow: "hidden",
//                                   backgroundColor: "#f8f9fa"
//                                 }}
//                               >
//                                 <img
//                                   src={resolveImageUrl(it.image_url)}
//                                   alt={it.name || "item"}
//                                   className="card-img-top h-100 w-100 object-fit-cover"
//                                   onError={(e) => {
//                                     e.currentTarget.style.display = "none";
//                                     e.currentTarget.parentElement.innerHTML = 
//                                       '<div class="h-100 w-100 d-flex align-items-center justify-content-center bg-light"><i class="bi bi-image text-muted fs-1"></i></div>';
//                                   }}
//                                 />
//                               </div>
//                               <div className="card-body d-flex flex-column">
//                                 <h6 className="card-title fw-bold mb-2" style={{ minHeight: "40px" }}>
//                                   {it.name || "Item"}
//                                 </h6>
//                                 <div className="mt-auto">
//                                   <div className="d-flex justify-content-between mb-2">
//                                     <span className="text-muted">Quantity:</span>
//                                     <span className="fw-bold">{it.quantity} units</span>
//                                   </div>
//                                   <div className="d-flex justify-content-between">
//                                     <span className="text-muted">Price:</span>
//                                     <span className="fw-bold text-success">
//                                       ${Number(it.unit_price || 0).toFixed(2)}
//                                     </span>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>

//                       {/* Footer */}
//                       <div className="d-flex justify-content-between align-items-center border-top pt-3">
//                         <div>
//                           <h5 className="mb-0 fw-bold text-dark">
//                             Total: ${Number(r.total_final_price || 0).toFixed(2)}
//                           </h5>
//                         </div>
//                         <div className="d-flex align-items-center gap-3">
//                           <span className="badge bg-success">
//                             <i className="bi bi-cash-coin me-2"></i>
//                             Status: {r.status}
//                           </span>
//                           <button 
//                             className="btn btn-primary"
//                             onClick={() => openInvoiceModal(r)}
//                           >
//                             <i className="bi bi-file-earmark-pdf me-2"></i>
//                             Invoice PDF
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Stats Summary - placed outside scrollable container */}
//           <div className="row mt-5">
//             <div className="col-12">
//               <div className="card border-0 bg-light">
//                 <div className="card-body">
//                   <div className="row">
//                     <div className="col-md-3 text-center">
//                       <div className="fs-4 fw-bold text-success">{selled.length}</div>
//                       <div className="text-muted">Total Sales</div>
//                     </div>
//                     <div className="col-md-3 text-center">
//                       <div className="fs-4 fw-bold">
//                         ${selled.reduce((sum, r) => sum + Number(r.total_final_price || 0), 0).toFixed(2)}
//                       </div>
//                       <div className="text-muted">Total Revenue</div>
//                     </div>
//                     <div className="col-md-3 text-center">
//                       <div className="fs-4 fw-bold">
//                         {selled.reduce((sum, r) => sum + (r.items?.length || 0), 0)}
//                       </div>
//                       <div className="text-muted">Items Sold</div>
//                     </div>
//                     <div className="col-md-3 text-center">
//                       <div className="fs-4 fw-bold">
//                         {selled.length > 0 
//                           ? formatDate(Math.max(...selled.map(r => new Date(r.confirmed_at || r.created_at).getTime())))
//                           : "—"
//                         }
//                       </div>
//                       <div className="text-muted">Latest Sale</div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Invoice Modal */}
//       {invoiceOpen && (
//         <div 
//           className="invoice-modal-overlay"
//           onClick={() => !creatingInvoice && setInvoiceOpen(false)}
//           ref={modalRef}
//         >
//           <div className="invoice-modal-content" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <h5 className="modal-title">
//                 <i className="bi bi-file-earmark-pdf text-primary me-2"></i>
//                 Create / Open Invoice PDF
//                 {currentReservation && (
//                   <span className="ms-2 text-muted fs-6">
//                     for {currentReservation.reservation_code}
//                   </span>
//                 )}
//               </h5>
//               <button 
//                 type="button" 
//                 className="btn-close" 
//                 onClick={() => setInvoiceOpen(false)}
//                 disabled={creatingInvoice}
//               ></button>
//             </div>
//             <div className="modal-body">
//               <div className="alert alert-info mb-3">
//                 <i className="bi bi-info-circle me-2"></i>
//                 If an invoice already exists, it will be opened and downloaded automatically.
//               </div>

//               <div className="mb-3">
//                 <label className="form-label fw-bold">
//                   <i className="bi bi-credit-card me-2"></i>
//                   Payment method
//                 </label>
//                 <select
//                   className="form-select"
//                   value={paymentMethod}
//                   onChange={(e) => setPaymentMethod(e.target.value)}
//                   disabled={creatingInvoice}
//                 >
//                   <option value="Cash">Cash</option>
//                   <option value="Card">Card</option>
//                   <option value="Transfer">Transfer</option>
//                 </select>
//               </div>

//               <div className="mb-4">
//                 <label className="form-label fw-bold">
//                   <i className="bi bi-calendar-check me-2"></i>
//                   Paid at
//                   <span className="text-muted ms-2">(auto-filled with sale date)</span>
//                 </label>
//                 <input
//                   type="datetime-local"
//                   className="form-control"
//                   value={paidAt}
//                   onChange={(e) => setPaidAt(e.target.value)}
//                   disabled={creatingInvoice}
//                 />
//                 {currentReservation && (
//                   <div className="form-text text-muted mt-1">
//                     Sale date: {formatDate(currentReservation.confirmed_at || currentReservation.created_at)}
//                   </div>
//                 )}
//               </div>
//             </div>
//             <div className="modal-footer">
//               <button 
//                 className="btn btn-secondary" 
//                 onClick={() => setInvoiceOpen(false)}
//                 disabled={creatingInvoice}
//               >
//                 Cancel
//               </button>
//               <button 
//                 className="btn btn-primary d-flex align-items-center" 
//                 onClick={handleCreateOrOpenInvoice}
//                 disabled={creatingInvoice}
//               >
//                 {creatingInvoice ? (
//                   <>
//                     <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
//                     Processing...
//                   </>
//                 ) : (
//                   <>
//                     <i className="bi bi-file-earmark-arrow-down me-2"></i>
//                     Generate / Open + Download
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SelledItemsTab;
import React, { useEffect, useMemo, useState, useRef } from "react";
import { getReservations, resolveImageUrl } from "../../services/storeService";

const API_BASE_URL = "http://localhost:5000";

const SelledItemsTab = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invoice modal state
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceReservationId, setInvoiceReservationId] = useState(null);
  const [currentReservation, setCurrentReservation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paidAt, setPaidAt] = useState("");
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Refs for scrolling
  const modalRef = useRef(null);
  const reservationRefs = useRef({});
  const containerRef = useRef(null);

  const openPdf = (pdfUrl) => {
    if (!pdfUrl) return;
    window.open(`${API_BASE_URL}${pdfUrl}`, "_blank");
  };

  const downloadPdf = async (pdfUrl, filename = "invoice.pdf") => {
    try {
      if (!pdfUrl) return;
      const url = `${API_BASE_URL}${pdfUrl}`;

      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Failed to download PDF");

      const blob = await resp.blob();
      const objUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(objUrl);
    } catch (e) {
      console.error("downloadPdf error:", e);
      alert("Failed to download PDF.");
    }
  };

  const fetchAllReservations = async () => {
    try {
      setLoading(true);

      // we need ALL to see RECEIVED
      const data = await getReservations("all");
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.reservations)
        ? data.reservations
        : [];

      setReservations(list);
    } catch (e) {
      console.error("fetchAllReservations error:", e);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReservations();
  }, []);

  // Auto-scroll to latest when loading completes
  useEffect(() => {
    if (!loading && selled.length > 0 && containerRef.current) {
      // Auto-scroll to the latest item (last in array) after a short delay
      setTimeout(() => {
        scrollToLatest();
      }, 500);
    }
  }, [loading]);

  // Function to scroll to latest item
  const scrollToLatest = () => {
    if (selled.length > 0 && containerRef.current) {
      const lastReservationId = selled[selled.length - 1].reservation_id;
      const lastElement = reservationRefs.current[lastReservationId];
      if (lastElement) {
        // Scroll to put the latest item at the top of the container
        containerRef.current.scrollTo({
          top: lastElement.offsetTop - 20, // 20px padding from top
          behavior: 'smooth'
        });
      }
    }
  };

  // Auto-scroll when modal opens
  useEffect(() => {
    if (invoiceOpen && modalRef.current) {
      setTimeout(() => {
        modalRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
      }, 100);
    }
  }, [invoiceOpen]);

  const selled = useMemo(() => {
    return (Array.isArray(reservations) ? reservations : []).filter((r) => {
      const st = String(r.status || "").trim().toLowerCase();
      return st === "received";
    });
  }, [reservations]);

  const formatDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Convert date to datetime-local input format (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    
    // Format: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const openInvoiceModal = (reservation) => {
    // First scroll to the reservation (put it at top of container)
    const reservationElement = reservationRefs.current[reservation.reservation_id];
    if (reservationElement && containerRef.current) {
      // Scroll to put the reservation at the top of the container
      containerRef.current.scrollTo({
        top: reservationElement.offsetTop - 20, // 20px padding
        behavior: 'smooth'
      });
      
      // Wait a moment for scroll to complete, then open modal
      setTimeout(() => {
        setInvoiceReservationId(reservation.reservation_id);
        setCurrentReservation(reservation);
        setPaymentMethod("Cash");
        
        // Auto-fill with the sale date (use confirmed_at or created_at)
        const saleDate = reservation.confirmed_at || reservation.created_at || new Date().toISOString();
        setPaidAt(formatDateForInput(saleDate));
        
        setInvoiceOpen(true);
      }, 300);
    } else {
      // Fallback if refs not available
      setInvoiceReservationId(reservation.reservation_id);
      setCurrentReservation(reservation);
      setPaymentMethod("Cash");
      
      const saleDate = reservation.confirmed_at || reservation.created_at || new Date().toISOString();
      setPaidAt(formatDateForInput(saleDate));
      
      setInvoiceOpen(true);
    }
  };

  const handleCreateOrOpenInvoice = async () => {
    try {
      if (!invoiceReservationId) return;
      setCreatingInvoice(true);

      // 1) check existing invoice
      const checkResp = await fetch(
        `${API_BASE_URL}/api/store/invoices/by-reservation/${invoiceReservationId}`
      );

      if (checkResp.ok) {
        const checkData = await checkResp.json();
        const inv = checkData?.invoice;
        if (inv?.pdf_path) {
          setInvoiceOpen(false);
          // open + download
          openPdf(inv.pdf_path);
          await downloadPdf(inv.pdf_path, `invoice_${inv.invoice_number || invoiceReservationId}.pdf`);
          return;
        }
      }

      // 2) create invoice with auto-filled date
      const resp = await fetch(`${API_BASE_URL}/api/store/invoices/create-from-reservation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: invoiceReservationId,
          payment_method: paymentMethod || null,
          paid_at: paidAt ? new Date(paidAt).toISOString() : null,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed");

      alert(`Invoice created: ${data.invoice_number || ""}`);
      setInvoiceOpen(false);

      if (data?.pdf_url) {
        openPdf(data.pdf_url);
        await downloadPdf(data.pdf_url, `invoice_${data.invoice_number || invoiceReservationId}.pdf`);
      }
    } catch (e) {
      console.error("invoice error:", e);
      alert("Failed to generate/open invoice.");
    } finally {
      setCreatingInvoice(false);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading sold items...</span>
      </div>
      <span className="ms-3">Loading sold items...</span>
    </div>
  );

  return (
    <div className="container-fluid py-3">
      {/* Inline CSS for scrollable sold items */}
      <style>{`
        .scrollable-sold-items-container {
          height: 650px; /* Fixed height */
          overflow-y: auto; /* Enable vertical scrolling */
          overflow-x: hidden; /* Prevent horizontal scroll */
          padding: 15px;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          margin-top: 20px;
        }
        
        /* Custom scrollbar styling */
        .scrollable-sold-items-container::-webkit-scrollbar {
          width: 10px;
        }
        
        .scrollable-sold-items-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .scrollable-sold-items-container::-webkit-scrollbar-thumb {
          background: #1e8c6f; /* Emerald green from theme */
          border-radius: 10px;
        }
        
        .scrollable-sold-items-container::-webkit-scrollbar-thumb:hover {
          background: #146b57; /* Darker green */
        }
        
        /* For Firefox */
        .scrollable-sold-items-container {
          scrollbar-width: thin;
          scrollbar-color: #1e8c6f #f1f1f1;
        }
        
        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .scrollable-sold-items-container {
            height: 550px;
          }
        }
        
        @media (max-width: 992px) {
          .scrollable-sold-items-container {
            height: 500px;
          }
        }
        
        @media (max-width: 768px) {
          .scrollable-sold-items-container {
            height: 450px;
          }
        }
        
        /* Highlight the active reservation */
        .reservation-card.highlighted {
          box-shadow: 0 0 0 3px rgba(30, 140, 111, 0.3);
          background-color: rgba(30, 140, 111, 0.05);
          transition: all 0.3s ease;
        }
        
        /* Modal positioning */
        .invoice-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-y: auto;
        }
        
        .invoice-modal-content {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          margin: auto;
        }
        
        /* Better visibility for the modal */
        .invoice-modal-content .modal-body {
          max-height: 60vh;
          overflow-y: auto;
        }
      `}</style>

      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Sold Items</h2>
              <p className="text-muted mb-0">
                Items completed during exchange (Received)
              </p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-primary" 
                onClick={fetchAllReservations}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={scrollToLatest}
              >
                <i className="bi bi-arrow-down-circle me-2"></i>
                Go to Latest
              </button>
            </div>
          </div>
        </div>
      </div>

      {selled.length === 0 ? (
        <div className="text-center py-5">
          <div className="fs-4 text-muted mb-3">No sold items yet.</div>
          <div className="text-muted">Items marked as "Received" will appear here</div>
        </div>
      ) : (
        <>
          <div 
            className="scrollable-sold-items-container" 
            ref={containerRef}
          >
            <div className="row g-4">
              {selled.map((r, index) => (
                <div 
                  key={r.reservation_id} 
                  className="col-12"
                  ref={el => reservationRefs.current[r.reservation_id] = el}
                >
                  <div className={`card border-0 shadow-sm border-start border-4 border-success reservation-card ${index === selled.length - 1 ? 'highlighted' : ''}`}>
                    <div className="card-body">
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <h5 className="card-title mb-0 fw-bold text-success">
                              <i className="bi bi-check-circle-fill me-2"></i>
                              {r.reservation_code}
                            </h5>
                            <span className="badge bg-success">Sold</span>
                            {index === selled.length - 1 && (
                              <span className="badge bg-warning">Latest</span>
                            )}
                          </div>
                          <div className="text-muted">
                            <i className="bi bi-calendar-check me-2"></i>
                            Sold on: {formatDate(r.confirmed_at)}
                          </div>
                        </div>
                        <div className="text-end">
                          {r.customer_name && (
                            <div className="fw-bold">
                              <i className="bi bi-person-circle me-2"></i>
                              Customer: {r.customer_name}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Items Grid */}
                      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 mb-4">
                        {(r.items || []).map((it, idx) => (
                          <div key={`${it.product_id}-${idx}`} className="col">
                            <div className="card h-100 border">
                              <div 
                                className="position-relative" 
                                style={{ 
                                  height: "150px", 
                                  overflow: "hidden",
                                  backgroundColor: "#f8f9fa"
                                }}
                              >
                                <img
                                  src={resolveImageUrl(it.image_url)}
                                  alt={it.name || "item"}
                                  className="card-img-top h-100 w-100 object-fit-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    e.currentTarget.parentElement.innerHTML = 
                                      '<div class="h-100 w-100 d-flex align-items-center justify-content-center bg-light"><i class="bi bi-image text-muted fs-1"></i></div>';
                                  }}
                                />
                              </div>
                              <div className="card-body d-flex flex-column">
                                <h6 className="card-title fw-bold mb-2" style={{ minHeight: "40px" }}>
                                  {it.name || "Item"}
                                </h6>
                                <div className="mt-auto">
                                  <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Quantity:</span>
                                    <span className="fw-bold">{it.quantity} units</span>
                                  </div>
                                  <div className="d-flex justify-content-between">
                                    <span className="text-muted">Price:</span>
                                    <span className="fw-bold text-success">
                                      ${Number(it.unit_price || 0).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="d-flex justify-content-between align-items-center border-top pt-3">
                        <div>
                          <h5 className="mb-0 fw-bold text-dark">
                            Total: ${Number(r.total_final_price || 0).toFixed(2)}
                          </h5>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                          <span className="badge bg-success">
                            <i className="bi bi-cash-coin me-2"></i>
                            Status: {r.status}
                          </span>
                          <button 
                            className="btn btn-primary"
                            onClick={() => openInvoiceModal(r)}
                          >
                            <i className="bi bi-file-earmark-pdf me-2"></i>
                            Invoice PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Summary - placed outside scrollable container */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="card border-0 bg-light">
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-3 text-center">
                      <div className="fs-4 fw-bold text-success">{selled.length}</div>
                      <div className="text-muted">Total Sales</div>
                    </div>
                    <div className="col-md-3 text-center">
                      <div className="fs-4 fw-bold">
                        ${selled.reduce((sum, r) => sum + Number(r.total_final_price || 0), 0).toFixed(2)}
                      </div>
                      <div className="text-muted">Total Revenue</div>
                    </div>
                    <div className="col-md-3 text-center">
                      <div className="fs-4 fw-bold">
                        {selled.reduce((sum, r) => sum + (r.items?.length || 0), 0)}
                      </div>
                      <div className="text-muted">Items Sold</div>
                    </div>
                    <div className="col-md-3 text-center">
                      <div className="fs-4 fw-bold">
                        {selled.length > 0 
                          ? formatDate(Math.max(...selled.map(r => new Date(r.confirmed_at || r.created_at).getTime())))
                          : "—"
                        }
                      </div>
                      <div className="text-muted">Latest Sale</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Invoice Modal */}
      {invoiceOpen && (
        <div 
          className="invoice-modal-overlay"
          onClick={() => !creatingInvoice && setInvoiceOpen(false)}
          ref={modalRef}
        >
          <div className="invoice-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-file-earmark-pdf text-primary me-2"></i>
                Create / Open Invoice PDF
                {currentReservation && (
                  <span className="ms-2 text-muted fs-6">
                    for {currentReservation.reservation_code}
                  </span>
                )}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setInvoiceOpen(false)}
                disabled={creatingInvoice}
              ></button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-3">
                <i className="bi bi-info-circle me-2"></i>
                If an invoice already exists, it will be opened and downloaded automatically.
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">
                  <i className="bi bi-credit-card me-2"></i>
                  Payment method
                </label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={creatingInvoice}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">
                  <i className="bi bi-calendar-check me-2"></i>
                  Paid at
                  <span className="text-muted ms-2">(auto-filled with sale date)</span>
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  disabled={creatingInvoice}
                />
                {currentReservation && (
                  <div className="form-text text-muted mt-1">
                    Sale date: {formatDate(currentReservation.confirmed_at || currentReservation.created_at)}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setInvoiceOpen(false)}
                disabled={creatingInvoice}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary d-flex align-items-center" 
                onClick={handleCreateOrOpenInvoice}
                disabled={creatingInvoice}
              >
                {creatingInvoice ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-arrow-down me-2"></i>
                    Generate / Open + Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelledItemsTab;