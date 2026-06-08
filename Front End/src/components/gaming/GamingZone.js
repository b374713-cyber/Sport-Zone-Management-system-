// import React, { useEffect, useMemo, useState, useRef } from "react";
// import {
//   Card,
//   Tabs,
//   Tab,
//   Button,
//   Table,
//   Badge,
//   Spinner,
//   Row,
//   Col,
//   Modal,
//   Form,
// } from "react-bootstrap";
// import SpinWheel from "./SpinWheel";
// import "./gaming.css";
// import gamingService from "../../services/gamingService";

// // ---------- Helpers ----------
// function toLocalDateTimeString(dtLocalStr) {
//   if (!dtLocalStr) return null;
//   const d = new Date(dtLocalStr);
//   if (isNaN(d.getTime())) return null;
//   const yyyy = d.getFullYear();
//   const MM = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   const HH = String(d.getHours()).padStart(2, "0");
//   const mm = String(d.getMinutes()).padStart(2, "0");
//   const ss = String(d.getSeconds()).padStart(2, "0");
//   return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
// }

// const FIXED_OFFERS = [
//   { code: "1H", label: "1 hour (1H)", minutes: 60 },
//   { code: "2H", label: "2 hours (2H)", minutes: 120 },
//   { code: "2H+1FREE", label: "2 hours + 1 hour free (2H+1FREE)", minutes: 180 },
//   // NOTE: FREE_3H is conditionally shown
// ];

// function getOfferLabel(code) {
//   if (!code) return "";
//   if (code === "FREE_3H") return "🎉 3 hours FREE (Reward)";
//   const found = FIXED_OFFERS.find((o) => o.code === code);
//   return found?.label || code;
// }

// function formatLiveTimer(session, nowMs) {
//   // Reserved sessions countdown to start
//   if (session.status === "Reserved") {
//     if (!session.planned_start_time) return "Reserved ⏳";
//     const plannedMs = new Date(session.planned_start_time).getTime();
//     const remainingMs = plannedMs - nowMs;
//     if (remainingMs <= 0) return "Starting…";
//     const totalSeconds = Math.floor(remainingMs / 1000);
//     const h = Math.floor(totalSeconds / 3600);
//     const m = Math.floor((totalSeconds % 3600) / 60);
//     const s = totalSeconds % 60;
//     return `Starts in ${String(h).padStart(2, "0")}:${String(m).padStart(
//       2,
//       "0"
//     )}:${String(s).padStart(2, "0")}`;
//   }

//   // Active sessions
//   if (!session?.start_time) return "—";

//   // FIXED session countdown
//   if (session.session_type === "Fixed" && session.planned_end_time) {
//     const endMs = new Date(session.planned_end_time).getTime();
//     const remainingMs = Math.max(0, endMs - nowMs);
//     const totalSeconds = Math.floor(remainingMs / 1000);
//     if (totalSeconds === 0) return "Finished ✅";
//     const h = Math.floor(totalSeconds / 3600);
//     const m = Math.floor((totalSeconds % 3600) / 60);
//     const s = totalSeconds % 60;
//     return `${String(h).padStart(2, "0")}:${String(m).padStart(
//       2,
//       "0"
//     )}:${String(s).padStart(2, "0")}`;
//   }

//   // OPEN session count up
//   const startMs = new Date(session.start_time).getTime();
//   const diffMs = Math.max(0, nowMs - startMs);
//   const totalSeconds = Math.floor(diffMs / 1000);
//   const h = Math.floor(totalSeconds / 3600);
//   const m = Math.floor((totalSeconds % 3600) / 60);
//   const s = totalSeconds % 60;
//   return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
//     s
//   ).padStart(2, "0")}`;
// }

// function occupancyColor(percent) {
//   if (percent >= 75) return "bg-danger";
//   if (percent >= 40) return "bg-warning text-dark";
//   return "bg-success";
// }

// function formatRoomLabel(r) {
//   return `Section ${r.section}-Room ${r.room_number}`;
// }

// export default function GamingZone() {
//   const [activeTab, setActiveTab] = useState("live");

//   const [sessions, setSessions] = useState([]);
//   const [rooms, setRooms] = useState([]);
//   const [devices, setDevices] = useState([]);
//   const [customers, setCustomers] = useState([]);

//   const [loadingCustomers, setLoadingCustomers] = useState(false);
//   const [loadingSessions, setLoadingSessions] = useState(false);
//   const [loadingRooms, setLoadingRooms] = useState(false);
//   const [loadingDevices, setLoadingDevices] = useState(false);

//   const [players, setPlayers] = useState([]);
//   const [loadingPlayers, setLoadingPlayers] = useState(false);

//   const [spinCandidates, setSpinCandidates] = useState([]);
//   const [loadingSpin, setLoadingSpin] = useState(false);
//   const [spinRunning, setSpinRunning] = useState(false);
//   const [spinResult, setSpinResult] = useState(null);
//   const [spinTrigger, setSpinTrigger] = useState(0);

//   const [winnerModalInfo, setWinnerModalInfo] = useState(null);
//   const [showWinnerModal, setShowWinnerModal] = useState(false);

//   const [now, setNow] = useState(Date.now());

//   // Start-session modal
//   const [showStartModal, setShowStartModal] = useState(false);
//   const [startSubmitting, setStartSubmitting] = useState(false);
//   const [startError, setStartError] = useState("");
//   const [startForm, setStartForm] = useState({
//     customer_id: "",
//     player_name: "",
//     member_id: "",
//     room_id: "",
//     device_id: "",
//     session_type: "Open",
//     offer_code: "",
//     planned_start_time: "",
//   });

//   // ✅ does selected customer have unused reward?
//   const [startHasReward, setStartHasReward] = useState(false);

//   // PDF Invoice generation state
//   const [generatingInvoice, setGeneratingInvoice] = useState({});

//   // Scroll container ref
//   const sessionsTableRef = useRef(null);
//   const containerRef = useRef(null);

//   // Tick timers
//   useEffect(() => {
//     const id = setInterval(() => setNow(Date.now()), 1000);
//     return () => clearInterval(id);
//   }, []);

//   // Auto-scroll to top when tab changes or sessions load
//   useEffect(() => {
//     if (sessionsTableRef.current && sessions.length > 0) {
//       setTimeout(() => {
//         sessionsTableRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
//       }, 100);
//     }
//   }, [activeTab, sessions.length]);

//   // Initial load
//   useEffect(() => {
//     loadRooms();
//     loadDevices();
//     loadSessions();
//     loadCustomers();
//   }, []);

//   // Load tab-specific
//   useEffect(() => {
//     if (activeTab === "players") loadPlayers();
//     if (activeTab === "spin") loadSpinCandidates();
//   }, [activeTab]);

//   // ---------- Loaders ----------
//   async function loadRooms() {
//     try {
//       setLoadingRooms(true);
//       setRooms(await gamingService.getRooms());
//     } catch (e) {
//       console.error("loadRooms error", e);
//       setRooms([]);
//     } finally {
//       setLoadingRooms(false);
//     }
//   }

//   async function loadDevices() {
//     try {
//       setLoadingDevices(true);
//       setDevices(await gamingService.getDevices());
//     } catch (e) {
//       console.error("loadDevices error", e);
//       setDevices([]);
//     } finally {
//       setLoadingDevices(false);
//     }
//   }

//   async function loadCustomers() {
//     try {
//       setLoadingCustomers(true);
//       setCustomers(await gamingService.getCustomers());
//     } catch (e) {
//       console.error("loadCustomers error", e);
//       setCustomers([]);
//     } finally {
//       setLoadingCustomers(false);
//     }
//   }

//   async function loadSessions() {
//     try {
//       setLoadingSessions(true);
//       setSessions(await gamingService.getActiveSessions());
//     } catch (e) {
//       console.error("loadSessions error", e);
//       setSessions([]);
//     } finally {
//       setLoadingSessions(false);
//     }
//   }

//   async function loadPlayers() {
//     try {
//       setLoadingPlayers(true);
//       setPlayers(await gamingService.getPlayers());
//     } catch (e) {
//       console.error("loadPlayers error", e);
//       setPlayers([]);
//     } finally {
//       setLoadingPlayers(false);
//     }
//   }

//   async function loadSpinCandidates() {
//     try {
//       setLoadingSpin(true);
//       setSpinCandidates(await gamingService.getSpinCandidates());
//     } catch (e) {
//       console.error("loadSpinCandidates error", e);
//       setSpinCandidates([]);
//     } finally {
//       setLoadingSpin(false);
//     }
//   }

//   // ---------- Actions ----------
//   async function handlePayCash(session_id, customer_id) {
//     try {
//       await gamingService.payCash({ session_id, customer_id, confirm: true });
//       alert("Cash payment confirmed ✅");
//       await loadSessions();
//     } catch (e) {
//       alert(e?.response?.data?.error || "Failed to pay cash");
//     }
//   }

//   async function handleEndSession(sessionId) {
//     if (!window.confirm("End this session and calculate billing?")) return;
//     try {
//       await gamingService.endSession({ session_id: sessionId });
//       alert("Session ended ✅");
//       await loadSessions();
//       await loadRooms();
//       await loadDevices();
//       await loadPlayers();
//       if (activeTab === "spin") await loadSpinCandidates();
//     } catch (e) {
//       alert("Error ending session: " + (e?.response?.data?.error || e.message));
//     }
//   }

//   async function handleDeleteSession(sessionId) {
//     if (!window.confirm("Delete this session?")) return;
//     try {
//       await gamingService.deleteSession(sessionId);
//       alert("Session deleted ✅");
//       await loadSessions();
//       await loadRooms();
//       await loadDevices();
//     } catch (e) {
//       alert("Error deleting session: " + (e?.response?.data?.error || e.message));
//     }
//   }

//   // ---------- Download Invoice ----------
// // ---------- Download Invoice ----------
// async function handleDownloadInvoice(sessionId, playerName) {
//   if (generatingInvoice[sessionId]) return;
  
//   try {
//     setGeneratingInvoice(prev => ({ ...prev, [sessionId]: true }));
    
//     const result = await gamingService.generateCashInvoicePdf(sessionId);
    
//     if (result?.invoice_pdf_url) {
//       // ✅ FIX: Create a download link that forces download
//       const url = `http://localhost:5000${result.invoice_pdf_url}`;
//       const safePlayerName = (playerName || 'customer').replace(/[^a-zA-Z0-9]/g, '_');
//       const filename = `invoice_${sessionId}_${safePlayerName}.pdf`;
      
//       // Method 1: Direct fetch and download (most reliable)
//       try {
//         const response = await fetch(url);
//         const blob = await response.blob();
        
//         // Create blob URL
//         const blobUrl = window.URL.createObjectURL(blob);
        
//         // Create hidden download link
//         const link = document.createElement('a');
//         link.href = blobUrl;
//         link.download = filename;
//         link.style.display = 'none';
//         document.body.appendChild(link);
        
//         // Trigger download
//         link.click();
        
//         // Cleanup
//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(blobUrl);
        
//         alert(`Invoice downloaded: ${filename}`);
//       } catch (fetchError) {
//         console.error("Fetch error:", fetchError);
        
//         // Method 2: Fallback to redirect with download attribute
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = filename;
//         link.target = '_blank'; // Some browsers need this
//         link.style.display = 'none';
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
        
//         alert(`Invoice downloading: ${filename}`);
//       }
//     } else if (result?.success) {
//       alert("Invoice generation started. Check the uploads folder.");
//     } else {
//       alert("Failed to generate invoice");
//     }
//   } catch (error) {
//     console.error("Invoice generation error:", error);
//     alert("Error generating invoice: " + (error?.response?.data?.error || error.message));
//   } finally {
//     setGeneratingInvoice(prev => ({ ...prev, [sessionId]: false }));
//   }
// }
//   // ---------- Spin ----------
//   async function handleSpin(playerId) {
//     if (spinRunning) return;
//     if (!playerId && spinCandidates.length === 0) {
//       alert("No eligible players (need 25 points).");
//       return;
//     }

//     setSpinResult(null);
//     setWinnerModalInfo(null);
//     setShowWinnerModal(false);
//     setSpinRunning(true);

//     try {
//       const result = await gamingService.runSpin(playerId);
//       setSpinResult(result);

//       setSpinTrigger((n) => n + 1);

//       const winnerName = result.winner?.player_name || "Unknown";
//       const prizeName = result.prize || "Prize";
//       const pointsSpent = result.points_spent ?? 25;

//       setTimeout(() => {
//         setSpinRunning(false);
//         setWinnerModalInfo({ winnerName, prizeName, pointsSpent });
//         setShowWinnerModal(true);
//       }, 5200);

//       await loadPlayers();
//       await loadSpinCandidates();
//     } catch (e) {
//       alert("Spin error: " + (e?.response?.data?.error || e.message));
//       setSpinRunning(false);
//     }
//   }

//   // ---------- Start Session Modal ----------
//   function openStartModal() {
//     setStartError("");
//     setStartHasReward(false);
//     setStartForm({
//       customer_id: "",
//       player_name: "",
//       member_id: "",
//       room_id: "",
//       device_id: "",
//       session_type: "Open",
//       offer_code: "",
//       planned_start_time: "",
//     });
//     setShowStartModal(true);
//   }

//   function closeStartModal() {
//     if (startSubmitting) return;
//     setShowStartModal(false);
//   }

//   // ✅ reward check
//   async function refreshRewardStatus(customerId) {
//     try {
//       if (!customerId) {
//         setStartHasReward(false);
//         return;
//       }
//       const r = await gamingService.getActiveReward(Number(customerId));
//       setStartHasReward(!!r?.has_reward);
//     } catch {
//       setStartHasReward(false);
//     }
//   }

//   async function handleStartChange(field, value) {
//     if (field === "customer_id") {
//       const selected = customers.find(
//         (c) => String(c.customer_id) === String(value)
//       );

//       setStartForm((prev) => ({
//         ...prev,
//         customer_id: value,
//         player_name: selected?.name || "",
//         member_id: value || "",
//         offer_code: prev.offer_code === "FREE_3H" ? "1H" : prev.offer_code,
//       }));

//       await refreshRewardStatus(value);
//       return;
//     }

//     if (field === "session_type") {
//       setStartForm((prev) => {
//         if (value === "Open")
//           return { ...prev, session_type: value, offer_code: "" };
//         return { ...prev, session_type: value, offer_code: prev.offer_code || "1H" };
//       });
//       return;
//     }

//     if (field === "room_id") {
//       setStartForm((prev) => ({ ...prev, room_id: value, device_id: "" }));
//       return;
//     }

//     setStartForm((prev) => ({ ...prev, [field]: value }));
//   }

//   async function handleSubmitStartSession(e) {
//     e.preventDefault();
//     setStartError("");

//     const {
//       customer_id,
//       player_name,
//       session_type,
//       device_id,
//       member_id,
//       offer_code,
//       planned_start_time,
//     } = startForm;

//     if (!customer_id) return setStartError("Customer is required.");
//     if (!session_type) return setStartError("Session type is required.");
//     if (!device_id) return setStartError("Please choose a device.");

//     if (session_type === "Fixed") {
//       if (!offer_code) return setStartError("Please choose an offer.");
//       if (offer_code === "FREE_3H" && !startHasReward) {
//         return setStartError("This customer does not have an unused FREE reward.");
//       }
//     }

//     try {
//       setStartSubmitting(true);

//       const payload = {
//         customer_id: Number(customer_id),
//         player_name: (player_name || "").trim(),
//         session_type,
//         device_id: Number(device_id),
//         member_id: member_id ? Number(member_id) : null,
//         offer_code: session_type === "Fixed" ? offer_code : null,
//         planned_start_time: planned_start_time
//           ? toLocalDateTimeString(planned_start_time)
//           : null,
//       };

//       await gamingService.startSession(payload);

//       setShowStartModal(false);
//       await loadSessions();
//       await loadRooms();
//       await loadDevices();
//     } catch (e) {
//       setStartError(e?.response?.data?.error || e.message || "Failed to start session");
//     } finally {
//       setStartSubmitting(false);
//     }
//   }

//   const filteredDevices = useMemo(() => {
//     return startForm.room_id
//       ? devices.filter((d) => d.room_id === Number(startForm.room_id))
//       : devices;
//   }, [devices, startForm.room_id]);

//   const selectedDevice = useMemo(() => {
//     return startForm.device_id
//       ? devices.find((d) => d.device_id === Number(startForm.device_id))
//       : null;
//   }, [devices, startForm.device_id]);

//   // ---------- Render tabs ----------
//   const renderLiveTab = () => (
//     <Row>
//       <Col md={8} className="mb-3">
//         <Card className="shadow-sm border-0 glass-session-card" ref={containerRef}>
//           <Card.Header className="d-flex justify-content-between align-items-center glass-card-header">
//             <div>
//               <h5 className="mb-0">Active Sessions</h5>
//               <small className="text-muted">
//                 Devices currently in use + future reservations
//               </small>
//             </div>
//             <div className="d-flex gap-2 align-items-center">
//               <Button size="sm" variant="primary" onClick={openStartModal}>
//                 Start Session
//               </Button>
//               <Button
//                 size="sm"
//                 variant="outline-light"
//                 style={{
//                   borderColor: "#5c7cfa",
//                   color: "#5c7cfa",
//                   background: "transparent",
//                 }}
//                 onClick={loadSessions}
//                 disabled={loadingSessions}
//               >
//                 {loadingSessions ? "Refreshing…" : "Refresh"}
//               </Button>
              
//               {/* Scroll control buttons */}
//               <div className="d-flex gap-1 ms-2">
//                 <Button
//                   size="sm"
//                   variant="outline-secondary"
//                   onClick={() => sessionsTableRef.current?.scrollBy({ top: -100, behavior: 'smooth' })}
//                   title="Scroll Up"
//                 >
//                   ↑
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline-secondary"
//                   onClick={() => sessionsTableRef.current?.scrollBy({ top: 100, behavior: 'smooth' })}
//                   title="Scroll Down"
//                 >
//                   ↓
//                 </Button>
//               </div>
//             </div>
//           </Card.Header>

//           <Card.Body className="p-0 glass-card-body">
//             {loadingSessions && sessions.length === 0 ? (
//               <div className="text-center py-4">
//                 <Spinner animation="border" size="sm" className="me-2" />
//                 <span>Loading sessions…</span>
//               </div>
//             ) : (
//               <div 
//                 className="sessions-scroll-container"
//                 ref={sessionsTableRef}
//                 style={{
//                   maxHeight: "500px",
//                   overflowY: "auto",
//                   overflowX: "hidden",
//                   position: "relative",
//                 }}
//               >
//                 {/* Inline CSS for scrollbar styling */}
//                 <style>{`
//                   .sessions-scroll-container::-webkit-scrollbar {
//                     width: 10px;
//                   }
//                   .sessions-scroll-container::-webkit-scrollbar-track {
//                     background: #2d3748;
//                     border-radius: 10px;
//                   }
//                   .sessions-scroll-container::-webkit-scrollbar-thumb {
//                     background: #5c7cfa;
//                     border-radius: 10px;
//                   }
//                   .sessions-scroll-container::-webkit-scrollbar-thumb:hover {
//                     background: #4c6ef5;
//                   }
//                 `}</style>
                
//                 <Table hover responsive size="sm" className="mb-0">
//                   <thead style={{ position: 'sticky', top: 0, background: '#1a202c', zIndex: 1 }}>
//                     <tr>
//                       <th>Player</th>
//                       <th>Type</th>
//                       <th>Location</th>
//                       <th>Device #</th>
//                       <th>Price/hr</th>
//                       <th>Status</th>
//                       <th>Started / Planned</th>
//                       <th>Timer</th>
//                       <th>Actions</th>
//                       <th>Payment</th>
//                     </tr>
//                   </thead>

//                   <tbody>
//                     {sessions.map((s) => {
//                       const isFree = s.offer_code === "FREE_3H";
//                       const isPaidCash = s.payment_stripe_status === "cash" && s.payment_is_paid;
//                       const isPaidOnline = (s.payment_stripe_status === "paid" || s.payment_stripe_status === "open") && s.payment_is_paid;
                      
//                       // ✅ ONLY show Download Invoice for CASH payments (not online)
//                       const showDownloadInvoice = isPaidCash && !isPaidOnline;
                      
//                       return (
//                         <tr key={s.session_id}>
//                           <td>
//                             {isFree && (
//                               <Badge className="me-2 free-session-badge">FREE</Badge>
//                             )}
//                             {s.player_name}
//                           </td>

//                           <td>{s.device_type}</td>
//                           <td>{`Section ${s.section}-Room ${s.room_number}`}</td>
//                           <td>{s.slot_number}</td>
//                           <td>
//                             {s.price_per_hour != null
//                               ? `$${Number(s.price_per_hour).toFixed(2)}`
//                               : "—"}
//                           </td>

//                           <td>
//                             {s.status === "Reserved" ? (
//                               <Badge bg="info">Reserved</Badge>
//                             ) : (
//                               <Badge bg="warning">In Use</Badge>
//                             )}
//                           </td>

//                           <td>
//                             {s.status === "Reserved" && s.planned_start_time
//                               ? new Date(s.planned_start_time).toLocaleString()
//                               : s.start_time
//                               ? new Date(s.start_time).toLocaleTimeString()
//                               : "—"}
//                           </td>

//                           <td>{formatLiveTimer(s, now)}</td>

//                           <td>
//                             <div className="d-flex gap-1 flex-wrap">
//                               {s.status !== "Reserved" && (
//                                 <Button
//                                   size="sm"
//                                   variant="outline-success"
//                                   onClick={() => handleEndSession(s.session_id)}
//                                 >
//                                   End
//                                 </Button>
//                               )}

//                               <Button
//                                 size="sm"
//                                 variant="outline-danger"
//                                 onClick={() => handleDeleteSession(s.session_id)}
//                               >
//                                 Delete
//                               </Button>

//                               {/* ✅ HIDE PAYMENTS IF FREE */}
//                               {!isFree && !s.payment_is_paid && (
//                                 <Button
//                                   size="sm"
//                                   variant="outline-success"
//                                   onClick={() => handlePayCash(s.session_id, s.member_id)}
//                                 >
//                                   Pay Cash
//                                 </Button>
//                               )}

//                               {/* ✅ SHOW DOWNLOAD INVOICE BUTTON ONLY FOR CASH PAYMENTS */}
//                               {showDownloadInvoice && (
//                                 <Button
//                                   size="sm"
//                                   variant="outline-info"
//                                   onClick={() => handleDownloadInvoice(s.session_id, s.player_name)}
//                                   disabled={generatingInvoice[s.session_id]}
//                                 >
//                                   {generatingInvoice[s.session_id] ? (
//                                     <>
//                                       <Spinner animation="border" size="sm" className="me-1" />
//                                       Generating...
//                                     </>
//                                   ) : (
//                                     "📥 Invoice"
//                                   )}
//                                 </Button>
//                               )}
//                             </div>
//                           </td>

//                           <td>
//                             {isFree ? (
//                               <Badge className="free-session-badge">FREE Reward</Badge>
//                             ) : s.payment_is_paid ? (
//                               <Badge bg="success">Paid</Badge>
//                             ) : s.payment_stripe_status === "cash" ? (
//                               <Badge bg="secondary">Cash Pending</Badge>
//                             ) : (
//                               <Badge bg="danger">Not Paid</Badge>
//                             )}
                            
//                             {/* Show payment method badge */}
//                             {s.payment_is_paid && !isFree && (
//                               <div className="small text-muted mt-1">
//                                 {s.payment_stripe_status === "cash" ? "💵 Cash" : 
//                                  s.payment_stripe_status === "paid" || s.payment_stripe_status === "open" ? "💳 Online" : 
//                                  s.payment_stripe_status || "Paid"}
//                               </div>
//                             )}
//                           </td>
//                         </tr>
//                       );
//                     })}

//                     {sessions.length === 0 && !loadingSessions && (
//                       <tr>
//                         <td colSpan={10} className="text-center text-muted py-3">
//                           No active or reserved sessions
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </Table>
//               </div>
//             )}
//           </Card.Body>
          
//           {/* Scroll indicator */}
//           {sessions.length > 5 && (
//             <Card.Footer className="py-2 d-flex justify-content-between align-items-center">
//               <small className="text-muted">
//                 Showing {sessions.length} sessions • Use scroll buttons or mouse wheel
//               </small>
//               <div className="d-flex gap-1">
//                 <Button
//                   size="sm"
//                   variant="outline-light"
//                   onClick={() => sessionsTableRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
//                 >
//                   Top
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline-light"
//                   onClick={() => sessionsTableRef.current?.scrollTo({ top: sessionsTableRef.current.scrollHeight, behavior: 'smooth' })}
//                 >
//                   Bottom
//                 </Button>
//               </div>
//             </Card.Footer>
//           )}
//         </Card>
//       </Col>

//       <Col md={4}>
//         <Card className="shadow-sm border-0 glass-session-card h-100">
//           <Card.Header className="d-flex justify-content-between align-items-center glass-card-header">
//             <div>
//               <h5 className="mb-0">Room Occupancy</h5>
//               <small className="text-muted">Live usage of rooms</small>
//             </div>
//             <Button
//               size="sm"
//               variant="outline-secondary"
//               onClick={loadRooms}
//               disabled={loadingRooms}
//             >
//               {loadingRooms ? "Refreshing…" : "Refresh"}
//             </Button>
//           </Card.Header>

//           <Card.Body className="glass-card-body" style={{ maxHeight: "500px", overflowY: "auto" }}>
//             {loadingRooms && rooms.length === 0 ? (
//               <div className="text-center py-4">
//                 <Spinner animation="border" size="sm" className="me-2" />
//                 <span>Loading rooms…</span>
//               </div>
//             ) : (
//               <>
//                 {rooms.map((r) => (
//                   <Card key={r.room_id} className="mb-3 border-0 glass-inner-card">
//                     <Card.Body className="py-2">
//                       <div className="d-flex justify-content-between align-items-center mb-1">
//                         <div>
//                           <strong>{formatRoomLabel(r)}</strong>
//                           <div className="small text-muted">
//                             {r.busy_devices ?? 0} / {r.capacity ?? 0} devices in use
//                           </div>
//                         </div>
//                         <div
//                           className={`badge rounded-pill px-3 py-2 ${occupancyColor(
//                             r.occupancy_percent ?? 0
//                           )}`}
//                         >
//                           {r.occupancy_percent ?? 0}%
//                         </div>
//                       </div>
//                       <div className="progress room-progress-bar">
//                         <div
//                           className={`progress-bar ${occupancyColor(r.occupancy_percent ?? 0)}`}
//                           role="progressbar"
//                           style={{ width: `${r.occupancy_percent ?? 0}%` }}
//                         />
//                       </div>
//                     </Card.Body>
//                   </Card>
//                 ))}

//                 {rooms.length === 0 && !loadingRooms && (
//                   <div className="text-center text-muted">No rooms configured yet</div>
//                 )}
//               </>
//             )}
//           </Card.Body>
//         </Card>
//       </Col>
//     </Row>
//   );

//   const renderPlayersTab = () => (
//     <Card className="shadow-sm border-0 glass-session-card">
//       <Card.Header className="d-flex justify-content-between align-items-center glass-card-header">
//         <div>
//           <h5 className="mb-0">Players & Points</h5>
//           <small className="text-muted">Total hours, points and spin eligibility</small>
//         </div>
//         <Button
//           size="sm"
//           variant="outline-secondary"
//           onClick={loadPlayers}
//           disabled={loadingPlayers}
//         >
//           {loadingPlayers ? "Refreshing…" : "Refresh"}
//         </Button>
//       </Card.Header>

//       <Card.Body className="p-0 glass-card-body">
//         {loadingPlayers && players.length === 0 ? (
//           <div className="text-center py-4">
//             <Spinner animation="border" size="sm" className="me-2" />
//             <span>Loading players…</span>
//           </div>
//         ) : players.length === 0 ? (
//           <div className="text-center py-4 text-muted">
//             No players yet. End a session to track points.
//           </div>
//         ) : (
//           <Table hover responsive size="sm" className="mb-0">
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Player</th>
//                 <th>Member ID</th>
//                 <th>Total Hours</th>
//                 <th>Total Points</th>
//                 <th>Spin Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {players.map((p, idx) => (
//                 <tr key={p.player_id} className={p.has_unused_reward ? "winner-gold-row" : ""}>
//                   <td>{idx + 1}</td>
//                   <td>
//                     {p.has_unused_reward && (
//                       <Badge bg="warning" text="dark" className="me-2">
//                         🎉 Winner
//                       </Badge>
//                     )}
//                     {p.player_name}
//                   </td>
//                   <td>{p.member_id || "—"}</td>
//                   <td>{Number(p.total_hours || 0).toFixed(2)}</td>
//                   <td>{p.total_points || 0}</td>
//                   <td>
//                     {p.eligible_for_spin ? (
//                       <Badge bg="success">Eligible 🎉</Badge>
//                     ) : (
//                       <Badge bg="secondary">
//                         {Math.max(0, 25 - (p.total_points || 0))} pts to spin
//                       </Badge>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         )}
//       </Card.Body>
//     </Card>
//   );

//   const renderSpinTab = () => (
//     <Card className="shadow-sm border-0 glass-session-card">
//       <Card.Header className="d-flex justify-content-between align-items-center glass-card-header">
//         <div>
//           <h5 className="mb-0">Spin & Rewards</h5>
//           <small className="text-muted">Random draw for players with 25+ points</small>
//         </div>
//         <div className="d-flex gap-2">
//           <Button
//             size="sm"
//             variant="outline-secondary"
//             onClick={loadSpinCandidates}
//             disabled={loadingSpin || spinRunning}
//           >
//             {loadingSpin ? "Refreshing…" : "Refresh"}
//           </Button>
//           <Button
//             size="sm"
//             variant="primary"
//             onClick={() => handleSpin(null)}
//             disabled={spinRunning || spinCandidates.length === 0}
//           >
//             {spinRunning ? "Spinning…" : "Spin Random Winner"}
//           </Button>
//         </div>
//       </Card.Header>

//       <Card.Body className="glass-card-body">
//         {spinCandidates.length === 0 ? (
//           <div className="text-center py-4 text-muted">
//             No eligible players yet (need 25 points).
//           </div>
//         ) : (
//           <>
//             <Row className="mb-4">
//               <Col md={5}>
//                 <SpinWheel segments={spinCandidates} trigger={spinTrigger} />
//               </Col>
//               <Col md={7}>
//                 <h5 className="mb-2">How it works</h5>
//                 <p className="mb-0 text-muted">
//                   Wheel is visual only — server selects winner + creates FREE reward + sends push.
//                 </p>
//               </Col>
//             </Row>

//             {spinResult && (
//               <Card className="border-0 shadow-sm mb-3 bg-dark text-light">
//                 <Card.Body>
//                   <h6 className="mb-2">Last Spin Result</h6>
//                   <p className="mb-1">
//                     <strong>Winner:</strong> {spinResult.winner?.player_name || "Unknown"}
//                   </p>
//                   <p className="mb-1">
//                     <strong>Prize:</strong> {spinResult.prize || "—"}
//                   </p>
//                   <p className="mb-0">
//                     <strong>Points spent:</strong> {spinResult.points_spent ?? 25}
//                   </p>
//                 </Card.Body>
//               </Card>
//             )}

//             <h6 className="mb-3">Eligible Players</h6>
//             <Table hover responsive size="sm" className="mb-0">
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   <th>Player</th>
//                   <th>Member ID</th>
//                   <th>Total Hours</th>
//                   <th>Total Points</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {spinCandidates.map((p, idx) => (
//                   <tr key={p.player_id}>
//                     <td>{idx + 1}</td>
//                     <td>{p.player_name}</td>
//                     <td>{p.member_id || "—"}</td>
//                     <td>{Number(p.total_hours || 0).toFixed(2)}</td>
//                     <td>{p.total_points || 0}</td>
//                     <td>
//                       <Button
//                         size="sm"
//                         variant="outline-success"
//                         disabled={spinRunning}
//                         onClick={() => handleSpin(p.player_id)}
//                       >
//                         {spinRunning ? "Spinning…" : "Spin for this player"}
//                       </Button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>
//           </>
//         )}
//       </Card.Body>
//     </Card>
//   );

//   return (
//     <div className="gaming-zone-wrapper p-3">
//       <Card className="border-0 shadow-sm gaming-zone-card">
//         <Card.Body className="p-4 gaming-zone-inner">
//           <div className="d-flex justify-content-between align-items-center mb-3">
//             <div>
//               <h3 className="mb-0 text-light">🎮 Gaming Zone</h3>
//               <small className="text-muted">Manage rooms, devices, sessions and rewards</small>
//             </div>
//           </div>

//           <Tabs
//             id="gaming-tabs"
//             activeKey={activeTab}
//             onSelect={(k) => setActiveTab(k)}
//             className="mb-3 gaming-tabs"
//           >
//             <Tab eventKey="live" title="Live Rooms & Sessions">
//               {renderLiveTab()}
//             </Tab>
//             <Tab eventKey="players" title="Players & Points">
//               {renderPlayersTab()}
//             </Tab>
//             <Tab eventKey="spin" title="Spin & Rewards">
//               {renderSpinTab()}
//             </Tab>
//           </Tabs>
//         </Card.Body>
//       </Card>

//       {/* Start Session Modal */}
//       <Modal show={showStartModal} onHide={closeStartModal} centered size="lg">
//         <Form onSubmit={handleSubmitStartSession}>
//           <Modal.Header closeButton>
//             <Modal.Title>Start Gaming Session</Modal.Title>
//           </Modal.Header>

//           <Modal.Body>
//             {startError && <div className="alert alert-danger py-2 mb-3">{startError}</div>}

//             <Row className="g-3">
//               <Col md={7}>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Customer *</Form.Label>
//                   <Form.Select
//                     value={startForm.customer_id}
//                     onChange={(e) => handleStartChange("customer_id", e.target.value)}
//                     required
//                   >
//                     <option value="">
//                       {loadingCustomers ? "Loading..." : "Choose a customer..."}
//                     </option>
//                     {customers.map((c) => (
//                       <option key={c.customer_id} value={c.customer_id}>
//                         {c.name} - {c.email}
//                       </option>
//                     ))}
//                   </Form.Select>

//                   {startForm.customer_id && (
//                     <div className="mt-2">
//                       {startHasReward ? (
//                         <Badge bg="warning" text="dark">
//                           🎉 Winner has FREE 3H reward
//                         </Badge>
//                       ) : (
//                         <Badge bg="secondary">No FREE reward</Badge>
//                       )}
//                     </div>
//                   )}
//                 </Form.Group>

//                 <Form.Group className="mb-3">
//                   <Form.Label>Planned Start Time (optional)</Form.Label>
//                   <Form.Control
//                     type="datetime-local"
//                     value={startForm.planned_start_time}
//                     onChange={(e) => handleStartChange("planned_start_time", e.target.value)}
//                   />
//                   <Form.Text className="text-muted">
//                     Leave empty to start now. Future time → Reserved until that time.
//                   </Form.Text>
//                 </Form.Group>

//                 <Row className="g-3">
//                   <Col md={6}>
//                     <Form.Group>
//                       <Form.Label>Room</Form.Label>
//                       <Form.Select
//                         value={startForm.room_id}
//                         onChange={(e) => handleStartChange("room_id", e.target.value)}
//                       >
//                         <option value="">Any room</option>
//                         {rooms.map((r) => (
//                           <option key={r.room_id} value={r.room_id}>
//                             {formatRoomLabel(r)} ({r.capacity} devices)
//                           </option>
//                         ))}
//                       </Form.Select>
//                     </Form.Group>
//                   </Col>

//                   <Col md={6}>
//                     <Form.Group>
//                       <Form.Label>Device *</Form.Label>
//                       <Form.Select
//                         value={startForm.device_id}
//                         onChange={(e) => handleStartChange("device_id", e.target.value)}
//                         required
//                       >
//                         <option value="">Choose device…</option>
//                         {filteredDevices.map((d) => (
//                           <option
//                             key={d.device_id}
//                             value={d.device_id}
//                             disabled={d.status !== "Available"}
//                           >
//                             {`${d.device_name} (${d.device_type}) - Slot ${d.slot_number} [${d.status}]`}
//                           </option>
//                         ))}
//                       </Form.Select>
//                       <Form.Text className="text-muted">
//                         Only "Available" devices are recommended.
//                       </Form.Text>
//                     </Form.Group>
//                   </Col>
//                 </Row>

//                 <Row className="g-3 mt-2">
//                   <Col md={6}>
//                     <Form.Group>
//                       <Form.Label>Session Type</Form.Label>
//                       <Form.Select
//                         value={startForm.session_type}
//                         onChange={(e) => handleStartChange("session_type", e.target.value)}
//                       >
//                         <option value="Open">Open Time (until stop)</option>
//                         <option value="Fixed">Fixed Time</option>
//                       </Form.Select>
//                     </Form.Group>
//                   </Col>

//                   <Col md={6}>
//                     <Form.Group>
//                       <Form.Label>Offer</Form.Label>
//                       <Form.Select
//                         value={startForm.offer_code}
//                         onChange={(e) => handleStartChange("offer_code", e.target.value)}
//                         disabled={startForm.session_type === "Open"}
//                       >
//                         {startForm.session_type === "Open" ? (
//                           <option value="">Unlimited / Open time</option>
//                         ) : (
//                           <>
//                             <option value="">Choose fixed duration…</option>
//                             {FIXED_OFFERS.map((o) => (
//                               <option key={o.code} value={o.code}>
//                                 {o.label}
//                               </option>
//                             ))}
//                             {startHasReward && (
//                               <option value="FREE_3H">🎉 3 hours FREE (Reward)</option>
//                             )}
//                           </>
//                         )}
//                       </Form.Select>
//                     </Form.Group>
//                   </Col>
//                 </Row>
//               </Col>

//               <Col md={5}>
//                 <Card className="border-0 shadow-sm glass-inner-card h-100">
//                   <Card.Body>
//                     <h6 className="mb-2">Session Summary</h6>
//                     <hr className="my-2" />

//                     <p className="mb-1">
//                       <strong>Customer:</strong>{" "}
//                       {startForm.customer_id
//                         ? customers.find((c) => c.customer_id === Number(startForm.customer_id))
//                             ?.name || "—"
//                         : "Not selected"}
//                     </p>

//                     <p className="mb-1">
//                       <strong>Player:</strong> {startForm.player_name || "—"}
//                     </p>

//                     <p className="mb-1">
//                       <strong>Device:</strong>{" "}
//                       {selectedDevice
//                         ? `${selectedDevice.device_name} (${selectedDevice.device_type}, slot ${selectedDevice.slot_number})`
//                         : "Not selected"}
//                     </p>

//                     <p className="mb-1">
//                       <strong>Price per hour:</strong>{" "}
//                       {selectedDevice
//                         ? `$${Number(selectedDevice.price_per_hour || 0).toFixed(2)}`
//                         : "—"}
//                     </p>

//                     <p className="mb-1">
//                       <strong>Session type:</strong> {startForm.session_type}
//                     </p>

//                     {/* ✅ GOLD BACKGROUND ONLY WHEN FREE_3H */}
//                     <p className="mb-3">
//                       <strong>Offer:</strong>{" "}
//                       {startForm.session_type === "Open" ? (
//                         "Unlimited / Open time"
//                       ) : startForm.offer_code === "FREE_3H" ? (
//                         <span className="gold-offer-pill">
//                           {getOfferLabel(startForm.offer_code)}
//                         </span>
//                       ) : (
//                         getOfferLabel(startForm.offer_code) || "Not selected"
//                       )}
//                     </p>

//                     <p className="mb-0">
//                       <strong>Planned Start:</strong>{" "}
//                       {startForm.planned_start_time
//                         ? new Date(startForm.planned_start_time).toLocaleString()
//                         : "Start now"}
//                     </p>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>
//           </Modal.Body>

//           <Modal.Footer>
//             <Button variant="secondary" onClick={closeStartModal} disabled={startSubmitting}>
//               Cancel
//             </Button>
//             <Button type="submit" variant="primary" disabled={startSubmitting}>
//               {startSubmitting ? "Starting…" : "Start Session"}
//             </Button>
//           </Modal.Footer>
//         </Form>
//       </Modal>

//       {/* Winner popup */}
//       <Modal show={showWinnerModal} onHide={() => setShowWinnerModal(false)} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>🎉 Spin Winner</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {winnerModalInfo ? (
//             <>
//               {/* ✅ GOLD NAME */}
//               <h4 className="mb-3">
//                 <span className="winner-name-gold">{winnerModalInfo.winnerName}</span>
//               </h4>

//               <p className="mb-1">
//                 <strong>Prize:</strong> {winnerModalInfo.prizeName}
//               </p>
//               <p className="mb-0">
//                 <strong>Points spent:</strong> {winnerModalInfo.pointsSpent}
//               </p>
//             </>
//           ) : (
//             <p>No winner data.</p>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="primary" onClick={() => setShowWinnerModal(false)}>
//             OK
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </div>
//   );
// }
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Card,
  Tabs,
  Tab,
  Button,
  Table,
  Badge,
  Spinner,
  Row,
  Col,
  Modal,
  Form,
} from "react-bootstrap";
import SpinWheel from "./SpinWheel";
import "./gaming.css";
import gamingService from "../../services/gamingService";
import { FaSync } from "react-icons/fa"; // Import refresh icon

// ---------- Helpers ----------
function toLocalDateTimeString(dtLocalStr) {
  if (!dtLocalStr) return null;
  const d = new Date(dtLocalStr);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}:${ss}`;
}

const FIXED_OFFERS = [
  { code: "1H", label: "1 hour (1H)", minutes: 60 },
  { code: "2H", label: "2 hours (2H)", minutes: 120 },
  { code: "2H+1FREE", label: "2 hours + 1 hour free (2H+1FREE)", minutes: 180 },
  // NOTE: FREE_3H is conditionally shown
];

function getOfferLabel(code) {
  if (!code) return "";
  if (code === "FREE_3H") return "🎉 3 hours FREE (Reward)";
  const found = FIXED_OFFERS.find((o) => o.code === code);
  return found?.label || code;
}

function formatLiveTimer(session, nowMs) {
  // Reserved sessions countdown to start
  if (session.status === "Reserved") {
    if (!session.planned_start_time) return "Reserved ⏳";
    const plannedMs = new Date(session.planned_start_time).getTime();
    const remainingMs = plannedMs - nowMs;
    if (remainingMs <= 0) return "Starting…";
    const totalSeconds = Math.floor(remainingMs / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `Starts in ${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  }

  // Active sessions
  if (!session?.start_time) return "—";

  // FIXED session countdown
  if (session.session_type === "Fixed" && session.planned_end_time) {
    const endMs = new Date(session.planned_end_time).getTime();
    const remainingMs = Math.max(0, endMs - nowMs);
    const totalSeconds = Math.floor(remainingMs / 1000);
    if (totalSeconds === 0) return "Finished ✅";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  }

  // OPEN session count up
  const startMs = new Date(session.start_time).getTime();
  const diffMs = Math.max(0, nowMs - startMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s
  ).padStart(2, "0")}`;
}

function occupancyColor(percent) {
  if (percent >= 75) return "bg-danger";
  if (percent >= 40) return "bg-warning text-dark";
  return "bg-success";
}

function formatRoomLabel(r) {
  return `Section ${r.section}-Room ${r.room_number}`;
}

export default function GamingZone() {
  const [activeTab, setActiveTab] = useState("live");

  const [sessions, setSessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [spinCandidates, setSpinCandidates] = useState([]);
  const [loadingSpin, setLoadingSpin] = useState(false);
  const [spinRunning, setSpinRunning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [spinTrigger, setSpinTrigger] = useState(0);

  const [winnerModalInfo, setWinnerModalInfo] = useState(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const [now, setNow] = useState(Date.now());

  // Start-session modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [startSubmitting, setStartSubmitting] = useState(false);
  const [startError, setStartError] = useState("");
  const [startForm, setStartForm] = useState({
    customer_id: "",
    player_name: "",
    member_id: "",
    room_id: "",
    device_id: "",
    session_type: "Open",
    offer_code: "",
    planned_start_time: "",
  });

  // ✅ does selected customer have unused reward?
  const [startHasReward, setStartHasReward] = useState(false);

  // PDF Invoice generation state
  const [generatingInvoice, setGeneratingInvoice] = useState({});

  // Scroll container ref
  const sessionsTableRef = useRef(null);
  const containerRef = useRef(null);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0); // To force child components to refresh

  // Tick timers
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to top when tab changes or sessions load
  useEffect(() => {
    if (sessionsTableRef.current && sessions.length > 0) {
      setTimeout(() => {
        sessionsTableRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [activeTab, sessions.length]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, []);

  // Load tab-specific
  useEffect(() => {
    if (activeTab === "players") loadPlayers();
    if (activeTab === "spin") loadSpinCandidates();
  }, [activeTab]);

  // ---------- Load All Data ----------
  async function loadAllData() {
    try {
      setRefreshing(true);
      
      // Load all data in parallel
      await Promise.all([
        loadRooms(false),
        loadDevices(false),
        loadSessions(false),
        loadCustomers(false),
      ]);
      
      // Load tab-specific data
      if (activeTab === "players") await loadPlayers(false);
      if (activeTab === "spin") await loadSpinCandidates(false);
      
      setLastRefresh(new Date());
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error loading all data:", error);
    } finally {
      setRefreshing(false);
    }
  }

  // ---------- Loaders ----------
  async function loadRooms(showLoading = true) {
    try {
      if (showLoading) setLoadingRooms(true);
      setRooms(await gamingService.getRooms());
    } catch (e) {
      console.error("loadRooms error", e);
      setRooms([]);
    } finally {
      if (showLoading) setLoadingRooms(false);
    }
  }

  async function loadDevices(showLoading = true) {
    try {
      if (showLoading) setLoadingDevices(true);
      setDevices(await gamingService.getDevices());
    } catch (e) {
      console.error("loadDevices error", e);
      setDevices([]);
    } finally {
      if (showLoading) setLoadingDevices(false);
    }
  }

  async function loadCustomers(showLoading = true) {
    try {
      if (showLoading) setLoadingCustomers(true);
      setCustomers(await gamingService.getCustomers());
    } catch (e) {
      console.error("loadCustomers error", e);
      setCustomers([]);
    } finally {
      if (showLoading) setLoadingCustomers(false);
    }
  }

  async function loadSessions(showLoading = true) {
    try {
      if (showLoading) setLoadingSessions(true);
      setSessions(await gamingService.getActiveSessions());
    } catch (e) {
      console.error("loadSessions error", e);
      setSessions([]);
    } finally {
      if (showLoading) setLoadingSessions(false);
    }
  }

  async function loadPlayers(showLoading = true) {
    try {
      if (showLoading) setLoadingPlayers(true);
      setPlayers(await gamingService.getPlayers());
    } catch (e) {
      console.error("loadPlayers error", e);
      setPlayers([]);
    } finally {
      if (showLoading) setLoadingPlayers(false);
    }
  }

  async function loadSpinCandidates(showLoading = true) {
    try {
      if (showLoading) setLoadingSpin(true);
      setSpinCandidates(await gamingService.getSpinCandidates());
    } catch (e) {
      console.error("loadSpinCandidates error", e);
      setSpinCandidates([]);
    } finally {
      if (showLoading) setLoadingSpin(false);
    }
  }

  // ---------- Actions ----------
  async function handlePayCash(session_id, customer_id) {
    try {
      await gamingService.payCash({ session_id, customer_id, confirm: true });
      alert("Cash payment confirmed ✅");
      await loadAllData(); // Use loadAllData instead of loadSessions only
    } catch (e) {
      alert(e?.response?.data?.error || "Failed to pay cash");
    }
  }

  async function handleEndSession(sessionId) {
    if (!window.confirm("End this session and calculate billing?")) return;
    try {
      await gamingService.endSession({ session_id: sessionId });
      alert("Session ended ✅");
      await loadAllData(); // Refresh all data
    } catch (e) {
      alert("Error ending session: " + (e?.response?.data?.error || e.message));
    }
  }

  async function handleDeleteSession(sessionId) {
    if (!window.confirm("Delete this session?")) return;
    try {
      await gamingService.deleteSession(sessionId);
      alert("Session deleted ✅");
      await loadAllData(); // Refresh all data
    } catch (e) {
      alert("Error deleting session: " + (e?.response?.data?.error || e.message));
    }
  }

  // ---------- Download Invoice ----------
  async function handleDownloadInvoice(sessionId, playerName) {
    if (generatingInvoice[sessionId]) return;
    
    try {
      setGeneratingInvoice(prev => ({ ...prev, [sessionId]: true }));
      
      const result = await gamingService.generateCashInvoicePdf(sessionId);
      
      if (result?.invoice_pdf_url) {
        // ✅ FIX: Create a download link that forces download
        const url = `http://localhost:5000${result.invoice_pdf_url}`;
        const safePlayerName = (playerName || 'customer').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `invoice_${sessionId}_${safePlayerName}.pdf`;
        
        // Method 1: Direct fetch and download (most reliable)
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          
          // Create blob URL
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Create hidden download link
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          link.style.display = 'none';
          document.body.appendChild(link);
          
          // Trigger download
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          
          alert(`Invoice downloaded: ${filename}`);
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          
          // Method 2: Fallback to redirect with download attribute
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.target = '_blank'; // Some browsers need this
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          alert(`Invoice downloading: ${filename}`);
        }
      } else if (result?.success) {
        alert("Invoice generation started. Check the uploads folder.");
      } else {
        alert("Failed to generate invoice");
      }
    } catch (error) {
      console.error("Invoice generation error:", error);
      alert("Error generating invoice: " + (error?.response?.data?.error || error.message));
    } finally {
      setGeneratingInvoice(prev => ({ ...prev, [sessionId]: false }));
    }
  }
  
  // ---------- Spin ----------
  async function handleSpin(playerId) {
    if (spinRunning) return;
    if (!playerId && spinCandidates.length === 0) {
      alert("No eligible players (need 25 points).");
      return;
    }

    setSpinResult(null);
    setWinnerModalInfo(null);
    setShowWinnerModal(false);
    setSpinRunning(true);

    try {
      const result = await gamingService.runSpin(playerId);
      setSpinResult(result);

      setSpinTrigger((n) => n + 1);

      const winnerName = result.winner?.player_name || "Unknown";
      const prizeName = result.prize || "Prize";
      const pointsSpent = result.points_spent ?? 25;

      setTimeout(() => {
        setSpinRunning(false);
        setWinnerModalInfo({ winnerName, prizeName, pointsSpent });
        setShowWinnerModal(true);
      }, 5200);

      await loadAllData(); // Refresh all data after spin
    } catch (e) {
      alert("Spin error: " + (e?.response?.data?.error || e.message));
      setSpinRunning(false);
    }
  }

  // ---------- Start Session Modal ----------
  function openStartModal() {
    setStartError("");
    setStartHasReward(false);
    setStartForm({
      customer_id: "",
      player_name: "",
      member_id: "",
      room_id: "",
      device_id: "",
      session_type: "Open",
      offer_code: "",
      planned_start_time: "",
    });
    setShowStartModal(true);
  }

  function closeStartModal() {
    if (startSubmitting) return;
    setShowStartModal(false);
  }

  // ✅ reward check
  async function refreshRewardStatus(customerId) {
    try {
      if (!customerId) {
        setStartHasReward(false);
        return;
      }
      const r = await gamingService.getActiveReward(Number(customerId));
      setStartHasReward(!!r?.has_reward);
    } catch {
      setStartHasReward(false);
    }
  }

  async function handleStartChange(field, value) {
    if (field === "customer_id") {
      const selected = customers.find(
        (c) => String(c.customer_id) === String(value)
      );

      setStartForm((prev) => ({
        ...prev,
        customer_id: value,
        player_name: selected?.name || "",
        member_id: value || "",
        offer_code: prev.offer_code === "FREE_3H" ? "1H" : prev.offer_code,
      }));

      await refreshRewardStatus(value);
      return;
    }

    if (field === "session_type") {
      setStartForm((prev) => {
        if (value === "Open")
          return { ...prev, session_type: value, offer_code: "" };
        return { ...prev, session_type: value, offer_code: prev.offer_code || "1H" };
      });
      return;
    }

    if (field === "room_id") {
      setStartForm((prev) => ({ ...prev, room_id: value, device_id: "" }));
      return;
    }

    setStartForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmitStartSession(e) {
    e.preventDefault();
    setStartError("");

    const {
      customer_id,
      player_name,
      session_type,
      device_id,
      member_id,
      offer_code,
      planned_start_time,
    } = startForm;

    if (!customer_id) return setStartError("Customer is required.");
    if (!session_type) return setStartError("Session type is required.");
    if (!device_id) return setStartError("Please choose a device.");

    if (session_type === "Fixed") {
      if (!offer_code) return setStartError("Please choose an offer.");
      if (offer_code === "FREE_3H" && !startHasReward) {
        return setStartError("This customer does not have an unused FREE reward.");
      }
    }

    try {
      setStartSubmitting(true);

      const payload = {
        customer_id: Number(customer_id),
        player_name: (player_name || "").trim(),
        session_type,
        device_id: Number(device_id),
        member_id: member_id ? Number(member_id) : null,
        offer_code: session_type === "Fixed" ? offer_code : null,
        planned_start_time: planned_start_time
          ? toLocalDateTimeString(planned_start_time)
          : null,
      };

      await gamingService.startSession(payload);

      setShowStartModal(false);
      await loadAllData(); // Refresh all data after starting session
    } catch (e) {
      setStartError(e?.response?.data?.error || e.message || "Failed to start session");
    } finally {
      setStartSubmitting(false);
    }
  }

  const filteredDevices = useMemo(() => {
    return startForm.room_id
      ? devices.filter((d) => d.room_id === Number(startForm.room_id))
      : devices;
  }, [devices, startForm.room_id]);

  const selectedDevice = useMemo(() => {
    return startForm.device_id
      ? devices.find((d) => d.device_id === Number(startForm.device_id))
      : null;
  }, [devices, startForm.device_id]);

  // ---------- Render tabs ----------
  const renderLiveTab = () => (
    <Row>
      <Col md={8} className="mb-3">
        <Card className="shadow-sm border-0 glass-session-card" ref={containerRef}>
          <Card.Header className="d-flex justify-content-between align-items-center glass-card-header">
            <div>
              <h5 className="mb-0">Active Sessions</h5>
              <small className="text-muted">
                Devices currently in use + future reservations
              </small>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <Button size="sm" variant="primary" onClick={openStartModal}>
                Start Session
              </Button>
              <Button
                size="sm"
                variant="outline-light"
                style={{
                  borderColor: "#5c7cfa",
                  color: "#5c7cfa",
                  background: "transparent",
                }}
                onClick={() => loadSessions()}
                disabled={loadingSessions || refreshing}
              >
                {loadingSessions ? <Spinner animation="border" size="sm" className="me-2" /> : <FaSync className={refreshing ? "me-2 spin" : "me-2"} />}
                {loadingSessions ? "Refreshing…" : "Refresh"}
              </Button>
              
              {/* Scroll control buttons */}
              <div className="d-flex gap-1 ms-2">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => sessionsTableRef.current?.scrollBy({ top: -100, behavior: 'smooth' })}
                  title="Scroll Up"
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => sessionsTableRef.current?.scrollBy({ top: 100, behavior: 'smooth' })}
                  title="Scroll Down"
                >
                  ↓
                </Button>
              </div>
            </div>
          </Card.Header>

          <Card.Body className="p-0 glass-card-body">
            {refreshing && (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Refreshing data…</span>
              </div>
            )}
            
            {!refreshing && loadingSessions && sessions.length === 0 ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Loading sessions…</span>
              </div>
            ) : (
              <div 
                className="sessions-scroll-container"
                ref={sessionsTableRef}
                style={{
                  maxHeight: "500px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  position: "relative",
                }}
              >
                {/* Inline CSS for scrollbar styling */}
                <style>{`
                  .sessions-scroll-container::-webkit-scrollbar {
                    width: 10px;
                  }
                  .sessions-scroll-container::-webkit-scrollbar-track {
                    background: #2d3748;
                    border-radius: 10px;
                  }
                  .sessions-scroll-container::-webkit-scrollbar-thumb {
                    background: #5c7cfa;
                    border-radius: 10px;
                  }
                  .sessions-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #4c6ef5;
                  }
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  .spin {
                    animation: spin 1s linear infinite;
                  }
                `}</style>
                
                <Table hover responsive size="sm" className="mb-0">
                  <thead style={{ position: 'sticky', top: 0, background: '#1a202c', zIndex: 1 }}>
                    <tr>
                      <th>Player</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Device #</th>
                      <th>Price/hr</th>
                      <th>Status</th>
                      <th>Started / Planned</th>
                      <th>Timer</th>
                      <th>Actions</th>
                      <th>Payment</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sessions.map((s) => {
                      const isFree = s.offer_code === "FREE_3H";
                      const isPaidCash = s.payment_stripe_status === "cash" && s.payment_is_paid;
                      const isPaidOnline = (s.payment_stripe_status === "paid" || s.payment_stripe_status === "open") && s.payment_is_paid;
                      
                      // ✅ ONLY show Download Invoice for CASH payments (not online)
                      const showDownloadInvoice = isPaidCash && !isPaidOnline;
                      
                      return (
                        <tr key={s.session_id}>
                          <td>
                            {isFree && (
                              <Badge className="me-2 free-session-badge">FREE</Badge>
                            )}
                            {s.player_name}
                          </td>

                          <td>{s.device_type}</td>
                          <td>{`Section ${s.section}-Room ${s.room_number}`}</td>
                          <td>{s.slot_number}</td>
                          <td>
                            {s.price_per_hour != null
                              ? `$${Number(s.price_per_hour).toFixed(2)}`
                              : "—"}
                          </td>

                          <td>
                            {s.status === "Reserved" ? (
                              <Badge bg="info">Reserved</Badge>
                            ) : (
                              <Badge bg="warning">In Use</Badge>
                            )}
                          </td>

                          <td>
                            {s.status === "Reserved" && s.planned_start_time
                              ? new Date(s.planned_start_time).toLocaleString()
                              : s.start_time
                              ? new Date(s.start_time).toLocaleTimeString()
                              : "—"}
                          </td>

                          <td>{formatLiveTimer(s, now)}</td>

                          <td>
                            <div className="d-flex gap-1 flex-wrap">
                              {s.status !== "Reserved" && (
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  onClick={() => handleEndSession(s.session_id)}
                                >
                                  End
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleDeleteSession(s.session_id)}
                              >
                                Delete
                              </Button>

                              {/* ✅ HIDE PAYMENTS IF FREE */}
                              {!isFree && !s.payment_is_paid && (
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  onClick={() => handlePayCash(s.session_id, s.member_id)}
                                >
                                  Pay Cash
                                </Button>
                              )}

                              {/* ✅ SHOW DOWNLOAD INVOICE BUTTON ONLY FOR CASH PAYMENTS */}
                              {showDownloadInvoice && (
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  onClick={() => handleDownloadInvoice(s.session_id, s.player_name)}
                                  disabled={generatingInvoice[s.session_id]}
                                >
                                  {generatingInvoice[s.session_id] ? (
                                    <>
                                      <Spinner animation="border" size="sm" className="me-1" />
                                      Generating...
                                    </>
                                  ) : (
                                    "📥 Invoice"
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>

                          <td>
                            {isFree ? (
                              <Badge className="free-session-badge">FREE Reward</Badge>
                            ) : s.payment_is_paid ? (
                              <Badge bg="success">Paid</Badge>
                            ) : s.payment_stripe_status === "cash" ? (
                              <Badge bg="secondary">Cash Pending</Badge>
                            ) : (
                              <Badge bg="danger">Not Paid</Badge>
                            )}
                            
                            {/* Show payment method badge */}
                            {s.payment_is_paid && !isFree && (
                              <div className="small text-muted mt-1">
                                {s.payment_stripe_status === "cash" ? "💵 Cash" : 
                                 s.payment_stripe_status === "paid" || s.payment_stripe_status === "open" ? "💳 Online" : 
                                 s.payment_stripe_status || "Paid"}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {sessions.length === 0 && !loadingSessions && !refreshing && (
                      <tr>
                        <td colSpan={10} className="text-center text-muted py-3">
                          No active or reserved sessions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
          
          {/* Scroll indicator */}
          {sessions.length > 5 && (
            <Card.Footer className="py-2 d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Showing {sessions.length} sessions • Use scroll buttons or mouse wheel
              </small>
              <div className="d-flex gap-1">
                <Button
                  size="sm"
                  variant="outline-light"
                  onClick={() => sessionsTableRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Top
                </Button>
                <Button
                  size="sm"
                  variant="outline-light"
                  onClick={() => sessionsTableRef.current?.scrollTo({ top: sessionsTableRef.current.scrollHeight, behavior: 'smooth' })}
                >
                  Bottom
                </Button>
              </div>
            </Card.Footer>
          )}
        </Card>
      </Col>

      <Col md={4}>
        <Card className="shadow-sm border-0 glass-session-card h-100">
          <Card.Header className="d-flex justify-content-between align-items-center glass-card-header">
            <div>
              <h5 className="mb-0">Room Occupancy</h5>
              <small className="text-muted">Live usage of rooms</small>
            </div>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => loadRooms()}
              disabled={loadingRooms || refreshing}
            >
              {loadingRooms ? <Spinner animation="border" size="sm" className="me-2" /> : <FaSync className={refreshing ? "me-2 spin" : "me-2"} />}
              {loadingRooms ? "Refreshing…" : "Refresh"}
            </Button>
          </Card.Header>

          <Card.Body className="glass-card-body" style={{ maxHeight: "500px", overflowY: "auto" }}>
            {refreshing && (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Refreshing data…</span>
              </div>
            )}
            
            {!refreshing && loadingRooms && rooms.length === 0 ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Loading rooms…</span>
              </div>
            ) : (
              <>
                {rooms.map((r) => (
                  <Card key={r.room_id} className="mb-3 border-0 glass-inner-card">
                    <Card.Body className="py-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div>
                          <strong>{formatRoomLabel(r)}</strong>
                          <div className="small text-muted">
                            {r.busy_devices ?? 0} / {r.capacity ?? 0} devices in use
                          </div>
                        </div>
                        <div
                          className={`badge rounded-pill px-3 py-2 ${occupancyColor(
                            r.occupancy_percent ?? 0
                          )}`}
                        >
                          {r.occupancy_percent ?? 0}%
                        </div>
                      </div>
                      <div className="progress room-progress-bar">
                        <div
                          className={`progress-bar ${occupancyColor(r.occupancy_percent ?? 0)}`}
                          role="progressbar"
                          style={{ width: `${r.occupancy_percent ?? 0}%` }}
                        />
                      </div>
                    </Card.Body>
                  </Card>
                ))}

                {rooms.length === 0 && !loadingRooms && !refreshing && (
                  <div className="text-center text-muted">No rooms configured yet</div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderPlayersTab = () => (
    <Card className="shadow-sm border-0 glass-session-card">
      <Card.Header className="d-flex justify-content-between align-items-center glass-card-header">
        <div>
          <h5 className="mb-0">Players & Points</h5>
          <small className="text-muted">Total hours, points and spin eligibility</small>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => loadPlayers()}
            disabled={loadingPlayers || refreshing}
          >
            {loadingPlayers ? <Spinner animation="border" size="sm" className="me-2" /> : <FaSync className={refreshing ? "me-2 spin" : "me-2"} />}
            {loadingPlayers ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </Card.Header>

      <Card.Body className="p-0 glass-card-body">
        {refreshing && (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Refreshing data…</span>
          </div>
        )}
        
        {!refreshing && loadingPlayers && players.length === 0 ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Loading players…</span>
          </div>
        ) : players.length === 0 && !refreshing ? (
          <div className="text-center py-4 text-muted">
            No players yet. End a session to track points.
          </div>
        ) : (
          <Table hover responsive size="sm" className="mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Member ID</th>
                <th>Total Hours</th>
                <th>Total Points</th>
                <th>Spin Status</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, idx) => (
                <tr key={p.player_id} className={p.has_unused_reward ? "winner-gold-row" : ""}>
                  <td>{idx + 1}</td>
                  <td>
                    {p.has_unused_reward && (
                      <Badge bg="warning" text="dark" className="me-2">
                        🎉 Winner
                      </Badge>
                    )}
                    {p.player_name}
                  </td>
                  <td>{p.member_id || "—"}</td>
                  <td>{Number(p.total_hours || 0).toFixed(2)}</td>
                  <td>{p.total_points || 0}</td>
                  <td>
                    {p.eligible_for_spin ? (
                      <Badge bg="success">Eligible 🎉</Badge>
                    ) : (
                      <Badge bg="secondary">
                        {Math.max(0, 25 - (p.total_points || 0))} pts to spin
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );

  const renderSpinTab = () => (
    <Card className="shadow-sm border-0 glass-session-card">
      <Card.Header className="d-flex justify-content-between align-items-center glass-card-header">
        <div>
          <h5 className="mb-0">Spin & Rewards</h5>
          <small className="text-muted">Random draw for players with 25+ points</small>
        </div>
        <div className="d-flex gap-2">
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => loadSpinCandidates()}
            disabled={loadingSpin || spinRunning || refreshing}
          >
            {loadingSpin ? <Spinner animation="border" size="sm" className="me-2" /> : <FaSync className={refreshing ? "me-2 spin" : "me-2"} />}
            {loadingSpin ? "Refreshing…" : "Refresh"}
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleSpin(null)}
            disabled={spinRunning || spinCandidates.length === 0 || refreshing}
          >
            {spinRunning ? "Spinning…" : "Spin Random Winner"}
          </Button>
        </div>
      </Card.Header>

      <Card.Body className="glass-card-body">
        {refreshing && (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Refreshing data…</span>
          </div>
        )}
        
        {!refreshing && spinCandidates.length === 0 && !loadingSpin ? (
          <div className="text-center py-4 text-muted">
            No eligible players yet (need 25 points).
          </div>
        ) : !refreshing && (
          <>
            <Row className="mb-4">
              <Col md={5}>
                <SpinWheel segments={spinCandidates} trigger={spinTrigger} />
              </Col>
              <Col md={7}>
                <h5 className="mb-2">How it works</h5>
                <p className="mb-0 text-muted">
                  Wheel is visual only — server selects winner + creates FREE reward + sends push.
                </p>
              </Col>
            </Row>

            {spinResult && (
              <Card className="border-0 shadow-sm mb-3 bg-dark text-light">
                <Card.Body>
                  <h6 className="mb-2">Last Spin Result</h6>
                  <p className="mb-1">
                    <strong>Winner:</strong> {spinResult.winner?.player_name || "Unknown"}
                  </p>
                  <p className="mb-1">
                    <strong>Prize:</strong> {spinResult.prize || "—"}
                  </p>
                  <p className="mb-0">
                    <strong>Points spent:</strong> {spinResult.points_spent ?? 25}
                  </p>
                </Card.Body>
              </Card>
            )}

            <h6 className="mb-3">Eligible Players</h6>
            <Table hover responsive size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Member ID</th>
                  <th>Total Hours</th>
                  <th>Total Points</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {spinCandidates.map((p, idx) => (
                  <tr key={p.player_id}>
                    <td>{idx + 1}</td>
                    <td>{p.player_name}</td>
                    <td>{p.member_id || "—"}</td>
                    <td>{Number(p.total_hours || 0).toFixed(2)}</td>
                    <td>{p.total_points || 0}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-success"
                        disabled={spinRunning || refreshing}
                        onClick={() => handleSpin(p.player_id)}
                      >
                        {spinRunning ? "Spinning…" : "Spin for this player"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div className="gaming-zone-wrapper p-3">
      <Card className="border-0 shadow-sm gaming-zone-card">
        <Card.Body className="p-4 gaming-zone-inner">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h3 className="mb-0 text-light">🎮 Gaming Zone</h3>
              <small className="text-muted">Manage rooms, devices, sessions and rewards</small>
              <div className="refresh-info mt-1">
                <small className="text-muted">
                  Last refresh: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {refreshing && (
                    <span className="ms-2">
                      <Spinner animation="border" size="sm" className="me-1" />
                      Refreshing...
                    </span>
                  )}
                </small>
              </div>
            </div>
            
            {/* Main Refresh Button */}
            <div className="d-flex gap-2 align-items-center">
              <Button 
                variant="outline-light" 
                onClick={loadAllData}
                disabled={refreshing}
                className="d-flex align-items-center"
              >
                <FaSync className={refreshing ? "me-2 spin" : "me-2"} />
                {refreshing ? "Refreshing..." : "Refresh All"}
              </Button>
            </div>
          </div>

          <Tabs
            id="gaming-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3 gaming-tabs"
          >
            <Tab eventKey="live" title="Live Rooms & Sessions">
              {renderLiveTab()}
            </Tab>
            <Tab eventKey="players" title="Players & Points">
              {renderPlayersTab()}
            </Tab>
            <Tab eventKey="spin" title="Spin & Rewards">
              {renderSpinTab()}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Start Session Modal */}
      <Modal show={showStartModal} onHide={closeStartModal} centered size="lg">
        <Form onSubmit={handleSubmitStartSession}>
          <Modal.Header closeButton>
            <Modal.Title>Start Gaming Session</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {startError && <div className="alert alert-danger py-2 mb-3">{startError}</div>}

            <Row className="g-3">
              <Col md={7}>
                <Form.Group className="mb-3">
                  <Form.Label>Customer *</Form.Label>
                  <Form.Select
                    value={startForm.customer_id}
                    onChange={(e) => handleStartChange("customer_id", e.target.value)}
                    required
                  >
                    <option value="">
                      {loadingCustomers ? "Loading..." : "Choose a customer..."}
                    </option>
                    {customers.map((c) => (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.name} - {c.email}
                      </option>
                    ))}
                  </Form.Select>

                  {startForm.customer_id && (
                    <div className="mt-2">
                      {startHasReward ? (
                        <Badge bg="warning" text="dark">
                          🎉 Winner has FREE 3H reward
                        </Badge>
                      ) : (
                        <Badge bg="secondary">No FREE reward</Badge>
                      )}
                    </div>
                  )}
                </Form.Group>


<Form.Group className="mb-3">
  <Form.Label>Planned Start Time (optional)</Form.Label>
  <Form.Control
    type="datetime-local"
    value={startForm.planned_start_time}
    onChange={(e) => handleStartChange("planned_start_time", e.target.value)}
    min={new Date().toISOString().slice(0, 16)} // Add this line
  />
  <Form.Text className="text-muted">
    Leave empty to start now. Future time → Reserved until that time.
  </Form.Text>
</Form.Group>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Room</Form.Label>
                      <Form.Select
                        value={startForm.room_id}
                        onChange={(e) => handleStartChange("room_id", e.target.value)}
                      >
                        <option value="">Any room</option>
                        {rooms.map((r) => (
                          <option key={r.room_id} value={r.room_id}>
                            {formatRoomLabel(r)} ({r.capacity} devices)
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Device *</Form.Label>
                      <Form.Select
                        value={startForm.device_id}
                        onChange={(e) => handleStartChange("device_id", e.target.value)}
                        required
                      >
                        <option value="">Choose device…</option>
                        {filteredDevices.map((d) => (
                          <option
                            key={d.device_id}
                            value={d.device_id}
                            disabled={d.status !== "Available"}
                          >
                            {`${d.device_name} (${d.device_type}) - Slot ${d.slot_number} [${d.status}]`}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Only "Available" devices are recommended.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mt-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Session Type</Form.Label>
                      <Form.Select
                        value={startForm.session_type}
                        onChange={(e) => handleStartChange("session_type", e.target.value)}
                      >
                        <option value="Open">Open Time (until stop)</option>
                        <option value="Fixed">Fixed Time</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Offer</Form.Label>
                      <Form.Select
                        value={startForm.offer_code}
                        onChange={(e) => handleStartChange("offer_code", e.target.value)}
                        disabled={startForm.session_type === "Open"}
                      >
                        {startForm.session_type === "Open" ? (
                          <option value="">Unlimited / Open time</option>
                        ) : (
                          <>
                            <option value="">Choose fixed duration…</option>
                            {FIXED_OFFERS.map((o) => (
                              <option key={o.code} value={o.code}>
                                {o.label}
                              </option>
                            ))}
                            {startHasReward && (
                              <option value="FREE_3H">🎉 3 hours FREE (Reward)</option>
                            )}
                          </>
                        )}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Col>

              <Col md={5}>
                <Card className="border-0 shadow-sm glass-inner-card h-100">
                  <Card.Body>
                    <h6 className="mb-2">Session Summary</h6>
                    <hr className="my-2" />

                    <p className="mb-1">
                      <strong>Customer:</strong>{" "}
                      {startForm.customer_id
                        ? customers.find((c) => c.customer_id === Number(startForm.customer_id))
                            ?.name || "—"
                        : "Not selected"}
                    </p>

                    <p className="mb-1">
                      <strong>Player:</strong> {startForm.player_name || "—"}
                    </p>

                    <p className="mb-1">
                      <strong>Device:</strong>{" "}
                      {selectedDevice
                        ? `${selectedDevice.device_name} (${selectedDevice.device_type}, slot ${selectedDevice.slot_number})`
                        : "Not selected"}
                    </p>

                    <p className="mb-1">
                      <strong>Price per hour:</strong>{" "}
                      {selectedDevice
                        ? `$${Number(selectedDevice.price_per_hour || 0).toFixed(2)}`
                        : "—"}
                    </p>

                    <p className="mb-1">
                      <strong>Session type:</strong> {startForm.session_type}
                    </p>

                    {/* ✅ GOLD BACKGROUND ONLY WHEN FREE_3H */}
                    <p className="mb-3">
                      <strong>Offer:</strong>{" "}
                      {startForm.session_type === "Open" ? (
                        "Unlimited / Open time"
                      ) : startForm.offer_code === "FREE_3H" ? (
                        <span className="gold-offer-pill">
                          {getOfferLabel(startForm.offer_code)}
                        </span>
                      ) : (
                        getOfferLabel(startForm.offer_code) || "Not selected"
                      )}
                    </p>

                    <p className="mb-0">
                      <strong>Planned Start:</strong>{" "}
                      {startForm.planned_start_time
                        ? new Date(startForm.planned_start_time).toLocaleString()
                        : "Start now"}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={closeStartModal} disabled={startSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={startSubmitting}>
              {startSubmitting ? "Starting…" : "Start Session"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Winner popup */}
      <Modal show={showWinnerModal} onHide={() => setShowWinnerModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🎉 Spin Winner</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {winnerModalInfo ? (
            <>
              {/* ✅ GOLD NAME */}
              <h4 className="mb-3">
                <span className="winner-name-gold">{winnerModalInfo.winnerName}</span>
              </h4>

              <p className="mb-1">
                <strong>Prize:</strong> {winnerModalInfo.prizeName}
              </p>
              <p className="mb-0">
                <strong>Points spent:</strong> {winnerModalInfo.pointsSpent}
              </p>
            </>
          ) : (
            <p>No winner data.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowWinnerModal(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}