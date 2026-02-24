// export default ReservedItemsTabBootstrap;
import React, { useEffect, useMemo, useState } from "react";
import {
  getReservations,
  confirmReservationByCode,
  expireReservationsManual,
  resolveImageUrl,
} from "../../services/storeService";

const API_BASE_URL = "http://localhost:5000";

const ReservedItemsTabBootstrap = ({ onRefreshProducts }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [codeInput, setCodeInput] = useState("");
  const [confirming, setConfirming] = useState(false);

  // legacy invoice modal (PDF printing)
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceReservationId, setInvoiceReservationId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paidAt, setPaidAt] = useState("");
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [lastPdfUrl, setLastPdfUrl] = useState(null);

  const openUrl = (url) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  const openPdf = (pdfUrl) => {
    if (!pdfUrl) return;
    window.open(`${API_BASE_URL}${pdfUrl}`, "_blank");
  };

  const getPaymentLabel = (r) => {
    const st = String(r?.payment_stripe_status || "").trim().toLowerCase();
    const paid = !!r?.payment_is_paid;

    if (st === "cash") return { text: "Cash", cls: "bg-secondary" };
    if (paid || st === "paid") return { text: "Paid", cls: "bg-success" };
    return { text: "Not Paid", cls: "bg-danger" };
  };

  const isAlreadyPaid = (r) => {
    const st = String(r?.payment_stripe_status || "").trim().toLowerCase();
    return !!r?.payment_is_paid || st === "paid" || st === "cash";
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getReservations("reserved");
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.reservations)
        ? data.reservations
        : [];
      setReservations(list);
    } catch (e) {
      console.error("fetchReservations error:", e);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const visibleReservations = useMemo(() => {
    return (Array.isArray(reservations) ? reservations : []).filter((r) => {
      const st = String(r.status || "").trim().toLowerCase();
      return st === "reserved" || st === "received";
    });
  }, [reservations]);

  const timeLeftLabel = (expires_at) => {
    if (!expires_at) return "—";
    const expMs = new Date(expires_at).getTime();
    if (!expMs || Number.isNaN(expMs)) return "—";
    const diffMs = expMs - Date.now();
    if (diffMs <= 0) return "Expired";
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs / (1000 * 60)) % 60);
    return `${hrs}h ${mins}m left`;
  };

  const handleConfirmByCode = async () => {
    const code = codeInput.trim();
    if (!code) return;

    try {
      setConfirming(true);
      const data = await confirmReservationByCode(code);
      alert(data?.message || "Confirmed");
      setCodeInput("");
      await fetchReservations();
      if (typeof onRefreshProducts === "function") onRefreshProducts();
    } catch (e) {
      console.error("confirmReservationByCode error:", e);
      alert("Failed to confirm reservation.");
    } finally {
      setConfirming(false);
    }
  };

  const handleManualExpire = async () => {
    try {
      await expireReservationsManual();
      await fetchReservations();
      if (typeof onRefreshProducts === "function") onRefreshProducts();
    } catch (e) {
      console.error("expireReservationsManual error:", e);
      alert("Failed to run expiry.");
    }
  };


















  
  const handleConfirmReceiveRequest = async (reservation_id) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/store/receive-requests/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed");

      alert(`Pickup code: ${data?.request?.request_code || ""}`);
      await fetchReservations();
    } catch (e) {
      console.error("confirm receive request error:", e);
      alert("Failed to confirm receive request.");
    }
  };

  const handleCreateStripeInvoice = async (reservation) => {
    try {
      if (!reservation?.reservation_id) return;
      setCreatingInvoice(true);

      const resp = await fetch(`${API_BASE_URL}/api/store/payments/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservation.reservation_id,
          customer_id: reservation.customer_id || reservation.user_id || null,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || data?.message || "Failed");

      if (data?.hosted_invoice_url) openUrl(data.hosted_invoice_url);

      alert("Stripe invoice created/opened.");
      await fetchReservations();
    } catch (e) {
      console.error("create stripe invoice error:", e);
      alert(e?.message || "Failed to create Stripe invoice.");
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Staff action: cash received NOW
  // const handlePayCash = async (reservation) => {
  //   try {
  //     if (!reservation?.reservation_id) return;
  //     setCreatingInvoice(true);

  //     const resp = await fetch(`${API_BASE_URL}/api/store/payments/pay-cash`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         reservation_id: reservation.reservation_id,
  //         customer_id: reservation.customer_id || reservation.user_id || null,
  //       }),
  //     });

  //     const data = await resp.json();
  //     if (!resp.ok) throw new Error(data?.error || data?.message || "Failed");

  //     alert("Cash payment recorded.");
  //     await fetchReservations();
  //   } catch (e) {
  //     console.error("pay cash error:", e);
  //     alert(e?.message || "Failed to record cash.");
  //   } finally {
  //     setCreatingInvoice(false);
  //   }
  // };
const handlePayCash = async (reservation) => {
  try {
    if (!reservation?.reservation_id) return;
    setCreatingInvoice(true);

    const resp = await fetch(`${API_BASE_URL}/api/store/payments/pay-cash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservation_id: reservation.reservation_id,
        customer_id: reservation.customer_id || reservation.user_id || null,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error || data?.message || "Failed");

    // ✅ DOWNLOAD PDF ONLY FOR CASH
    window.open(
      `${API_BASE_URL}/api/store/payments/cash-invoice/${reservation.reservation_id}`,
      "_blank"
    );

    alert("Cash payment recorded + invoice downloaded.");
    await fetchReservations();
  } catch (e) {
    console.error("pay cash error:", e);
    alert(e?.message || "Failed to record cash.");
  } finally {
    setCreatingInvoice(false);
  }
};

  // Legacy invoice PDF printing (parallel invoice route)
  const openInvoiceModal = (reservationId) => {
    setInvoiceReservationId(reservationId);
    setPaymentMethod("Cash");
    setPaidAt("");
    setLastPdfUrl(null);
    setInvoiceOpen(true);
  };

  const closeInvoiceModal = () => {
    setInvoiceOpen(false);
    setInvoiceReservationId(null);
  };

  const handleCreateInvoice = async () => {
    try {
      if (!invoiceReservationId) return;
      setCreatingInvoice(true);

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

      if (data?.pdf_url) {
        setLastPdfUrl(data.pdf_url);
        openPdf(data.pdf_url);
      }
    } catch (e) {
      console.error("create invoice error:", e);
      alert("Failed to create invoice PDF.");
    } finally {
      setCreatingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading reservations...</span>
        </div>
        <span className="ms-3">Loading reservations...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      {/* Inline CSS for scrollable reservations */}
      <style>{`
        .scrollable-reservations-container {
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
        .scrollable-reservations-container::-webkit-scrollbar {
          width: 10px;
        }
        
        .scrollable-reservations-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .scrollable-reservations-container::-webkit-scrollbar-thumb {
          background: #6a4fb3; /* Purple from theme */
          border-radius: 10px;
        }
        
        .scrollable-reservations-container::-webkit-scrollbar-thumb:hover {
          background: #3b2a88; /* Darker purple */
        }
        
        /* For Firefox */
        .scrollable-reservations-container {
          scrollbar-width: thin;
          scrollbar-color: #6a4fb3 #f1f1f1;
        }
        
        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .scrollable-reservations-container {
            height: 550px;
          }
        }
        
        @media (max-width: 992px) {
          .scrollable-reservations-container {
            height: 500px;
          }
        }
        
        @media (max-width: 768px) {
          .scrollable-reservations-container {
            height: 450px;
          }
        }
      `}</style>

      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Reserved Items</h2>
              <p className="text-muted mb-0">Online reservations waiting for pickup (48h)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-8">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Enter reservation code (e.g. SZ-12345)"
            />
            <button className="btn btn-primary" disabled={confirming} onClick={handleConfirmByCode}>
              {confirming ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Confirming...
                </>
              ) : (
                "Confirm"
              )}
            </button>
          </div>
        </div>
        <div className="col-md-4 mt-2 mt-md-0">
          <div className="d-flex gap-2">
            <button className="btn btn-outline-danger flex-fill" onClick={handleManualExpire}>
              Run expiry now
            </button>
            <button className="btn btn-outline-secondary flex-fill" onClick={fetchReservations}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {visibleReservations.length === 0 ? (
        <div className="text-center py-5">
          <div className="fs-4 text-muted">No reserved/received items.</div>
        </div>
      ) : (
        <div className="scrollable-reservations-container">
          <div className="row g-4">
            {visibleReservations.map((r) => {
              const reqStatus = String(r.receive_request_status || "").trim().toLowerCase();
              const isReceiveRequested = reqStatus === "pending" || reqStatus === "confirmed";
              const paymentLabel = getPaymentLabel(r);
              const paid = isAlreadyPaid(r);

              return (
                <div key={r.reservation_id} className="col-12">
                  <div className={`card border-0 shadow-sm ${isReceiveRequested ? "border-start border-4 border-success" : ""}`}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="card-title mb-1 fw-bold">{r.reservation_code}</h5>
                          <div className="badge bg-warning text-dark">{timeLeftLabel(r.expires_at)}</div>
                        </div>
                        <div className="text-end">{r.customer_name && <div className="fw-bold">Customer: {r.customer_name}</div>}</div>
                      </div>

                      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3 mb-4">
                        {(r.items || []).map((it, idx) => (
                          <div key={`${it.product_id}-${idx}`} className="col">
                            <div className="card h-100 border">
                              <div className="position-relative" style={{ height: "150px", overflow: "hidden" }}>
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
                                  <div className="d-flex justify-content-between">
                                    <span className="text-muted">Qty:</span>
                                    <span className="fw-bold">{it.quantity}</span>
                                  </div>
                                  <div className="d-flex justify-content-between">
                                    <span className="text-muted">Price:</span>
                                    <span className="fw-bold">{Number(it.unit_price || 0).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {reqStatus === "pending" && (
                        <div className="mb-3">
                          <button className="btn btn-success" onClick={() => handleConfirmReceiveRequest(r.reservation_id)}>
                            <i className="bi bi-check-circle me-2"></i>
                            Receive (confirm request)
                          </button>
                        </div>
                      )}

                      {reqStatus === "confirmed" && (
                        <div className="alert alert-info mb-3">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-info-circle me-2"></i>
                            <div>
                              <strong>Waiting customer approval</strong>
                              <div className="small">Code: {r.receive_request_code || "—"}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="d-flex justify-content-between align-items-center border-top pt-3">
                        <div>
                          <h5 className="mb-0 fw-bold">Total: {Number(r.total_final_price || 0).toFixed(2)}</h5>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="badge bg-primary">Status: {r.status}</span>
                          <span className={`badge ${paymentLabel.cls}`}>Payment: {paymentLabel.text}</span>

                          {String(r.status || "").trim().toLowerCase() === "reserved" && (
                            <div className="d-flex gap-2">
                              <button className="btn btn-outline-secondary" disabled={creatingInvoice || paid} onClick={() => handlePayCash(r)}>
                                Pay Cash
                              </button>

                              {r.payment_invoice_pdf_url && (
                                <button className="btn btn-outline-primary" onClick={() => openUrl(r.payment_invoice_pdf_url)}>
                                  Open PDF
                                </button>
                              )}
                            </div>
                          )}

                          {String(r.status || "").trim().toLowerCase() === "received" && (
                            <button className="btn btn-outline-primary" onClick={() => openInvoiceModal(r.reservation_id)}>
                              <i className="bi bi-file-earmark-pdf me-2"></i>
                              Invoice PDF
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {invoiceOpen && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} onClick={closeInvoiceModal}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Invoice PDF</h5>
                <button type="button" className="btn-close" onClick={closeInvoiceModal} disabled={creatingInvoice}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Payment method</label>
                  <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} disabled={creatingInvoice}>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Paid at (optional)</label>
                  <input type="datetime-local" className="form-control" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} disabled={creatingInvoice} />
                </div>

                {lastPdfUrl && (
                  <div className="mb-3">
                    <button className="btn btn-outline-primary w-100" onClick={() => openPdf(lastPdfUrl)}>
                      <i className="bi bi-download me-2"></i>
                      Download / Open PDF
                    </button>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeInvoiceModal} disabled={creatingInvoice}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={handleCreateInvoice} disabled={creatingInvoice}>
                  {creatingInvoice ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      Generate PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservedItemsTabBootstrap;