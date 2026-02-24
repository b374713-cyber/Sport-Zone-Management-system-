// import React, { useState, useEffect, useMemo, useRef } from "react";
// import {
//   Card,
//   Row,
//   Col,
//   Button,
//   Table,
//   Badge,
//   Modal,
//   Form,
//   Spinner,
//   Alert,
//   OverlayTrigger,
//   Popover,
// } from "react-bootstrap";
// import sportsService from "../../services/sportsService";

// const theme = {
//   purpleDark: "#3b2a88",
//   purpleMid: "#6a4fb3",
//   emerald: "#146b57",
//   emerald2: "#1e8c6f",
//   pageBg: "#f4f5f7",
//   cardBg: "#ffffff",
//   textDark: "#16171a",
//   textMuted: "#6b7280",
//   chipBg: "#efe7ff",
//   chipText: "#3b2a88",
//   gold: "#e2b93b",
//   red: "#e04f5f",
//   headerGradient: "linear-gradient(90deg, #3b2a88 0%, #146b57 100%)",
// };

// const SportsSchedule = () => {
//   const todayStr = new Date().toISOString().split("T")[0];

//   const [activeTab, setActiveTab] = useState("schedule");

//   const [reservations, setReservations] = useState([]);
//   const [stadiums, setStadiums] = useState([]);
//   const [sports, setSports] = useState([]);
//   const [customers, setCustomers] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [showBookingModal, setShowBookingModal] = useState(false);
//   const [selectedDate, setSelectedDate] = useState(todayStr);

//   const [submitting, setSubmitting] = useState(false);

//   const [editModalOpen, setEditModalOpen] = useState(false);
//   const [editing, setEditing] = useState(null);

//   const [bookingForm, setBookingForm] = useState({
//     sport_id: "",
//     stadium_id: "",
//     customer_id: "",
//     reservation_date: todayStr,
//     start_time: "",
//     end_time: "",
//     notes: "",
//     total_price: 0,
//   });

//   const sportsOrder = ["Football", "Basketball", "Tennis", "Pedalo"];

//   // Load initial
//   useEffect(() => {
//     const load = async () => {
//       try {
//         setLoading(true);
//         setError("");
//         const [sportsData, stadiumsData, reservationsData, customersData] =
//           await Promise.all([
//             sportsService.getAllSports(),
//             sportsService.getAllStadiums(),
//             sportsService.getReservationsByDate(selectedDate),
//             sportsService.getCustomers(),
//           ]);

//         setSports(sportsData.sports || []);
//         setStadiums(stadiumsData.stadiums || []);

//         // ✅ hide cancelled
//         const resv = (reservationsData.reservations || []).filter(
//           (r) => r.status !== "Cancelled"
//         );
//         setReservations(resv);

//         setCustomers(customersData.customers || []);
//       } catch (e) {
//         console.error(e);
//         setError("Failed to load data.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Reload when date changes
//   useEffect(() => {
//     const reload = async () => {
//       try {
//         const data = await sportsService.getReservationsByDate(selectedDate);
//         const resv = (data.reservations || []).filter((r) => r.status !== "Cancelled");
//         setReservations(resv);
//       } catch (e) {
//         console.error(e);
//       }
//     };
//     if (selectedDate) reload();
//   }, [selectedDate]);

//   const timeSlots = useMemo(
//     () =>
//       Array.from({ length: 22 - 8 + 1 }, (_, i) => {
//         const h = 8 + i;
//         return {
//           time: `${h}:00 - ${h + 1}:00`,
//           hour: h,
//           start_time: `${String(h).padStart(2, "0")}:00`,
//           end_time: `${String(h + 1).padStart(2, "0")}:00`,
//         };
//       }),
//     []
//   );

//   const timeToMinutes = (t) => {
//     if (!t) return 0;
//     const [h, m] = String(t).split(":").map(Number);
//     return (h || 0) * 60 + (m || 0);
//   };

//   const hasTimeConflict = (stadiumId, date, startTime, endTime, excludeId = null) => {
//     return reservations.some((r) => {
//       if (excludeId && r.reservation_id === excludeId) return false;
//       if (r.status === "Cancelled") return false;
//       if (r.stadium_id !== stadiumId || r.reservation_date !== date) return false;

//       const ns = timeToMinutes(startTime),
//         ne = timeToMinutes(endTime);
//       const es = timeToMinutes(r.start_time),
//         ee = timeToMinutes(r.end_time);
//       return ns < ee && ne > es;
//     });
//   };

//   const isTimeSlotAvailable = (stadiumId, hour) => {
//     const s = `${String(hour).padStart(2, "0")}:00`;
//     const e = `${String(hour + 1).padStart(2, "0")}:00`;
//     return !hasTimeConflict(stadiumId, selectedDate, s, e);
//   };

//   const getReservationForSlot = (stadiumId, hour) => {
//     const s = `${String(hour).padStart(2, "0")}:00`;
//     return reservations.find(
//       (r) =>
//         r.status !== "Cancelled" &&
//         r.stadium_id === stadiumId &&
//         r.reservation_date === selectedDate &&
//         r.start_time === s
//     );
//   };

//   const calculatePrice = (stadiumId, startTime, endTime) => {
//     const st = stadiums.find((s) => s.stadium_id === stadiumId);
//     if (!st) return 0;
//     return ((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60) * st.price_per_hour;
//   };

//   const handleBookSlot = (stadium, timeSlot) => {
//     setBookingForm((b) => ({
//       ...b,
//       stadium_id: stadium.stadium_id,
//       sport_id: stadium.sport_id,
//       reservation_date: selectedDate,
//       start_time: timeSlot.start_time,
//       end_time: timeSlot.end_time,
//       total_price: calculatePrice(stadium.stadium_id, timeSlot.start_time, timeSlot.end_time),
//     }));
//     setShowBookingModal(true);
//   };

//   const handleSubmitBooking = async (e) => {
//     e.preventDefault();
//     if (!bookingForm.customer_id) {
//       alert("Please select a customer.");
//       return;
//     }
//     if (
//       hasTimeConflict(
//         bookingForm.stadium_id,
//         bookingForm.reservation_date,
//         bookingForm.start_time,
//         bookingForm.end_time
//       )
//     ) {
//       alert("Time slot conflict for this stadium.");
//       return;
//     }

//     try {
//       setSubmitting(true);
//       const result = await sportsService.createReservation(bookingForm);

//       // ✅ if backend returns status Pending, it will appear; Cancelled won't.
//       setReservations((prev) => [result.reservation, ...prev]);

//       setShowBookingModal(false);
//       setBookingForm({
//         sport_id: "",
//         stadium_id: "",
//         customer_id: "",
//         reservation_date: todayStr,
//         start_time: "",
//         end_time: "",
//         notes: "",
//         total_price: 0,
//       });
//     } catch (e2) {
//       alert("Failed to save reservation: " + (e2.response?.data?.error || e2.message));
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const openEditReservation = (reservation) => {
//     setEditing({
//       ...reservation,
//       reservation_date: reservation.reservation_date,
//       start_time: reservation.start_time,
//       end_time: reservation.end_time,
//       total_price: reservation.total_price,
//     });
//     setEditModalOpen(true);
//   };

//   const submitEditReservation = async () => {
//     try {
//       if (editing.stadium_id && editing.reservation_date && editing.start_time && editing.end_time) {
//         const conflict = hasTimeConflict(
//           editing.stadium_id,
//           editing.reservation_date,
//           editing.start_time,
//           editing.end_time,
//           editing.reservation_id
//         );
//         if (conflict) {
//           alert("Time conflict for the updated values.");
//           return;
//         }
//       }

//       const { reservation_id, ...updates } = editing;
//       const result = await sportsService.updateReservation(reservation_id, updates);

//       // ✅ if edited to Cancelled -> remove from list
//       if (result.reservation?.status === "Cancelled") {
//         setReservations((prev) => prev.filter((r) => r.reservation_id !== reservation_id));
//       } else {
//         setReservations((prev) =>
//           prev.map((r) => (r.reservation_id === reservation_id ? result.reservation : r))
//         );
//       }

//       setEditModalOpen(false);
//       setEditing(null);
//     } catch (e) {
//       alert("Failed to update: " + (e.response?.data?.error || e.message));
//     }
//   };

//   const getPaymentStatusSafe = async (reservationId) => {
//     try {
//       return await sportsService.getReservationPaymentStatus(reservationId);
//     } catch (e) {
//       return { is_paid: false };
//     }
//   };

//   const cancelReservation = async (reservationId) => {
//     const r = reservations.find((x) => x.reservation_id === reservationId);
//     const ps = await getPaymentStatusSafe(reservationId);
//     const isPaid = ps?.is_paid === true;

//     if (isPaid) {
//       const customerName = r?.customer_name || "Unknown";
//       const amount = Number(r?.total_price || 0);
//       const ok = window.confirm(
//         `PAID reservation!\nThe money of this customer: ${customerName} : $${amount} will be lost.\n\nContinue cancel?`
//       );
//       if (!ok) return;
//     } else {
//       if (!window.confirm("Cancel this reservation?")) return;
//     }

//     try {
//       await sportsService.updateReservationStatus(reservationId, "Cancelled");

//       // ✅ remove from UI immediately
//       setReservations((prev) => prev.filter((x) => x.reservation_id !== reservationId));
//     } catch (e) {
//       alert("Failed to cancel: " + (e.response?.data?.error || e.message));
//     }
//   };

//   const deleteReservation = async (reservationId) => {
//     const r = reservations.find((x) => x.reservation_id === reservationId);
//     const ps = await getPaymentStatusSafe(reservationId);
//     const isPaid = ps?.is_paid === true;

//     if (isPaid) {
//       const customerName = r?.customer_name || "Unknown";
//       const amount = Number(r?.total_price || 0);
//       const ok = window.confirm(
//         `PAID reservation!\nThe money of this customer: ${customerName} : $${amount} will be lost.\n\nContinue delete permanently?`
//       );
//       if (!ok) return;
//     } else {
//       if (!window.confirm("Delete this reservation permanently?")) return;
//     }

//     try {
//       await sportsService.deleteReservation(reservationId);
//       setReservations((prev) => prev.filter((x) => x.reservation_id !== reservationId));
//     } catch (e) {
//       alert("Failed to delete: " + (e.response?.data?.error || e.message));
//     }
//   };

  
//   // ✅ Smooth PDF download (no new tab flash)
//   const downloadFile = (url, filename = "invoice.pdf") => {
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = filename;
//     a.rel = "noopener noreferrer";
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//   };

//   const payCash = async (reservationId) => {
//     try {
//       const ok = window.confirm("Confirm CASH payment for this reservation?");
//       if (!ok) return;

//       const res = await sportsService.payCash(reservationId);

//       // ✅ ONLY update status (keep date/time fields unchanged so schedule grid still finds it)
//       const newStatus = res?.reservation?.status || "Confirmed";

//       setReservations((prev) =>
//         prev.map((x) =>
//           x.reservation_id === reservationId
//             ? { ...x, status: newStatus }
//             : x
//         )
//       );

//       // ✅ Download PDF smoothly
//       if (res?.invoice_pdf_url) {
//         downloadFile(res.invoice_pdf_url, `invoice-${reservationId}.pdf`);
//       } else {
//         console.warn("Cash payment saved but no invoice_pdf_url returned");
//       }
//     } catch (e) {
//       alert("Pay cash failed: " + (e.response?.data?.error || e.message));
//     }
//   };

//   const handleFormChange = (field, value) => {
//     const updated = { ...bookingForm, [field]: value };
//     if (
//       (field === "stadium_id" || field === "start_time" || field === "end_time") &&
//       updated.stadium_id &&
//       updated.start_time &&
//       updated.end_time
//     ) {
//       updated.total_price = calculatePrice(updated.stadium_id, updated.start_time, updated.end_time);
//     }
//     setBookingForm(updated);
//   };

//   const getStatusBadge = (status) => {
//     const variants = {
//       Confirmed: "success",
//       Pending: "warning",
//       Cancelled: "secondary",
//       Completed: "info",
//     };
//     return variants[status] || "secondary";
//   };

//   const stadiumsBySport = (sportName) =>
//     stadiums.filter((s) => (s.sport_name || "").toLowerCase() === sportName.toLowerCase());

//   const reservedPopover = (resv, stadium) => (
//     <Popover id={`popover-${resv.reservation_id}`}>
//       <Popover.Header as="h6">Reservation</Popover.Header>
//       <Popover.Body>
//         <div className="mb-2">
//           <strong>{stadium?.stadium_name || "Stadium"}</strong>
//           <br />
//           {resv.start_time} - {resv.end_time}
//           <br />
//           {resv.customer_name}
//           <br />
//           {resv.customer_phone}
//         </div>

//         <div className="d-flex flex-wrap gap-2">
//           <Button
//             size="sm"
//             variant="outline-primary"
//             style={{ borderColor: theme.purpleMid, color: theme.purpleMid }}
//             onClick={() => openEditReservation(resv)}
//           >
//             Edit
//           </Button>

//           <Button
//             size="sm"
//             variant="outline-warning"
//             style={{ borderColor: theme.gold, color: theme.gold }}
//             onClick={() => cancelReservation(resv.reservation_id)}
//           >
//             Cancel
//           </Button>

//           <Button
//             size="sm"
//             variant="outline-danger"
//             style={{ borderColor: theme.red, color: theme.red }}
//             onClick={() => deleteReservation(resv.reservation_id)}
//           >
//             Delete
//           </Button>

//           {/* Optional cash pay */}
//           {resv.status === "Pending" && (
//             <Button size="sm" variant="success" onClick={() => payCash(resv.reservation_id)}>
//               Pay Cash
//             </Button>
//           )}
//         </div>
//       </Popover.Body>
//     </Popover>
//   );

//   if (loading) {
//     return (
//       <div className="text-center py-5" style={{ background: theme.pageBg }}>
//         <Spinner animation="border" style={{ color: theme.purpleMid }} size="lg" />
//         <p className="mt-3" style={{ color: theme.textMuted }}>
//           Loading sports data...
//         </p>
//       </div>
//     );
//   }

//   const handleHeaderDateChange = (e) => {
//     const v = e.target.value;
//     setSelectedDate(v < todayStr ? todayStr : v);
//   };

//   return (
//     <div className="sports-schedule-container" style={{ background: theme.pageBg }}>
//       <style>{`
//         .themed-header { background: ${theme.headerGradient}; color: #fff; }
//         .themed-chip { background: ${theme.chipBg}; color: ${theme.chipText};
//           border-radius: 999px; padding: 6px 12px; font-weight: 700; }
//         .table thead th {
//           background: linear-gradient(90deg, ${theme.purpleDark} 0%, ${theme.emerald} 100%) !important;
//           color: #fff !important; font-weight: 700; border-bottom: 0 !important;
//           text-shadow: 0 1px 2px rgba(0,0,0,0.4);
//           position: sticky;
//           top: 0;
//           z-index: 10;
//         }
//         .table tbody tr:nth-child(odd) td { background: #fafafb; }
//         .table tbody tr:nth-child(even) td { background: #f6fff9; }
//         .reserved-box {
//           background: linear-gradient(135deg, ${theme.emerald} 0%, ${theme.emerald2} 100%);
//           color: #fff; border-radius: 12px; font-weight: 700; box-shadow: 0 6px 16px rgba(20,107,87,0.25);
//         }
//         .card { border-radius: 16px; }
        
//         /* Scrollable calendar container */
//         .scrollable-calendar-container {
//           height: 600px; /* Fixed height for the calendar */
//           overflow-y: auto; /* Enable vertical scrolling */
//           overflow-x: hidden; /* Prevent horizontal scroll */
//           border: 1px solid #e0e0e0;
//           border-radius: 8px;
//         }
        
//         /* Custom scrollbar styling */
//         .scrollable-calendar-container::-webkit-scrollbar {
//           width: 10px;
//         }
        
//         .scrollable-calendar-container::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 10px;
//         }
        
//         .scrollable-calendar-container::-webkit-scrollbar-thumb {
//           background: ${theme.purpleMid};
//           border-radius: 10px;
//         }
        
//         .scrollable-calendar-container::-webkit-scrollbar-thumb:hover {
//           background: ${theme.purpleDark};
//         }
        
//         /* For Firefox */
//         .scrollable-calendar-container {
//           scrollbar-width: thin;
//           scrollbar-color: ${theme.purpleMid} #f1f1f1;
//         }
        
//         /* Responsive adjustments */
//         @media (max-width: 1200px) {
//           .scrollable-calendar-container {
//             height: 500px;
//           }
//         }
        
//         @media (max-width: 992px) {
//           .scrollable-calendar-container {
//             height: 450px;
//           }
//         }
//       `}</style>

//       <div className="d-flex justify-content-between align-items-center mb-2">
//         <div>
//           <h3 className="mb-1" style={{ fontWeight: 800, color: theme.purpleDark }}>
//             SportZone Scheduler
//           </h3>
//           <div className="themed-chip">
//             {stadiums.length} stadiums • {reservations.length} reservations • {selectedDate}
//           </div>
//         </div>

//         <div className="d-flex gap-2 align-items-center">
//           <Form.Control
//             type="date"
//             value={selectedDate}
//             onChange={handleHeaderDateChange}
//             min={todayStr}
//             style={{ width: "auto" }}
//           />

//           {activeTab === "schedule" && (
//             <Button
//               style={{ background: theme.purpleMid, borderColor: theme.purpleMid }}
//               onClick={() => setShowBookingModal(true)}
//             >
//               Manual Booking
//             </Button>
//           )}
//         </div>
//       </div>

//       <div className="store-tabs" style={{ marginBottom: 12 }}>
//         <button
//           className={`store-tab-btn ${activeTab === "schedule" ? "active" : ""}`}
//           onClick={() => setActiveTab("schedule")}
//         >
//           Schedule
//         </button>
//       </div>

//       {activeTab === "schedule" && (
//         <>
//           {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

//           <Row>
//             <Col lg={8}>
//               <Card className="border-0 shadow-sm mb-4" style={{ background: theme.cardBg }}>
//                 <Card.Header className="themed-header d-flex justify-content-between align-items-center">
//                   <h5 className="mb-0">📅 Schedule by Sport</h5>
//                   <Badge bg="light" text="dark">
//                     4 Sports Columns • Scroll to see all time slots
//                   </Badge>
//                 </Card.Header>
//                 <Card.Body className="p-0">
//                   {/* SCROLLABLE CALENDAR CONTAINER */}
//                   <div className="scrollable-calendar-container">
//                     <Table hover className="mb-0 align-middle">
//                       <thead>
//                         <tr>
//                           <th style={{ position: 'sticky', top: 0, zIndex: 10 }}>Time Slot</th>
//                           {sportsOrder.map((s) => (
//                             <th key={s} className="text-center" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
//                               {s}
//                             </th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {timeSlots.map((slot) => (
//                           <tr key={slot.hour}>
//                             <td className="fw-bold" style={{ color: theme.textDark }}>
//                               {slot.time}
//                             </td>

//                             {sportsOrder.map((sport) => {
//                               const group = stadiumsBySport(sport);

//                               return (
//                                 <td key={sport} className="text-center">
//                                   {group.length === 0 ? (
//                                     <span className="text-muted small">No stadiums</span>
//                                   ) : (
//                                     group.map((stadium) => {
//                                       const resv = getReservationForSlot(stadium.stadium_id, slot.hour);
//                                       const available = isTimeSlotAvailable(stadium.stadium_id, slot.hour);

//                                       return (
//                                         <div key={stadium.stadium_id + "-" + slot.hour} className="mb-2">
//                                           {resv ? (
//                                             <OverlayTrigger
//                                               trigger="click"
//                                               rootClose
//                                               placement="top"
//                                               overlay={reservedPopover(resv, stadium)}
//                                             >
//                                               <div className="reserved-box w-100 py-2" style={{ cursor: "pointer" }}>
//                                                 Reserved
//                                               </div>
//                                             </OverlayTrigger>
//                                           ) : (
//                                             <Button
//                                               variant="outline-success"
//                                               size="sm"
//                                               onClick={() => available && handleBookSlot(stadium, slot)}
//                                               className="w-100"
//                                               style={{
//                                                 color: available ? theme.emerald : "#9aa0a6",
//                                                 borderColor: available ? theme.emerald : "#cfd4d9",
//                                               }}
//                                               disabled={!available}
//                                             >
//                                               {available ? "Available" : "Unavailable"}
//                                             </Button>
//                                           )}

//                                           <div className="small" style={{ color: theme.textMuted, marginTop: 6 }}>
//                                             {stadium.stadium_name} • ${stadium.price_per_hour}/h
//                                           </div>
//                                         </div>
//                                       );
//                                     })
//                                   )}
//                                 </td>
//                               );
//                             })}
//                           </tr>
//                         ))}
//                       </tbody>
//                     </Table>
//                   </div>
//                 </Card.Body>
//               </Card>
//             </Col>

//             <Col lg={4}>
//               <Card className="border-0 shadow-sm" style={{ background: theme.cardBg }}>
//                 <Card.Header className="themed-header">
//                   <div className="d-flex justify-content-between align-items-center">
//                     <h5 className="mb-0">📋 Reservations on {selectedDate}</h5>
//                     <Badge bg="light" text="dark">
//                       Total: {reservations.length}
//                     </Badge>
//                   </div>
//                 </Card.Header>

//                 <Card.Body style={{ maxHeight: "520px", overflowY: "auto" }}>
//                   {reservations.length === 0 ? (
//                     <div className="text-center py-4">
//                       <p className="text-muted mt-2">No reservations for this date</p>
//                     </div>
//                   ) : (
//                     reservations.map((res) => (
//                       <div key={res.reservation_id} className="reservation-item mb-3 p-3 border rounded">
//                         <div className="d-flex justify-content-between align-items-start mb-2">
//                           <h6 className="mb-0">{res.stadium_name}</h6>
//                           <Badge bg={getStatusBadge(res.status)}>{res.status}</Badge>
//                         </div>

//                         <p className="text-muted mb-1">{res.start_time} - {res.end_time}</p>
//                         <p className="text-muted mb-1">{res.customer_name}</p>
//                         <p className="text-muted mb-2">{res.customer_phone}</p>

//                         <div className="d-flex flex-wrap gap-2">
//                           <Button
//                             size="sm"
//                             variant="outline-primary"
//                             style={{ borderColor: theme.purpleMid, color: theme.purpleMid }}
//                             onClick={() => openEditReservation(res)}
//                           >
//                             Edit
//                           </Button>

//                           <Button
//                             size="sm"
//                             variant="outline-warning"
//                             style={{ borderColor: theme.gold, color: theme.gold }}
//                             onClick={() => cancelReservation(res.reservation_id)}
//                           >
//                             Cancel
//                           </Button>

//                           <Button
//                             size="sm"
//                             variant="outline-danger"
//                             style={{ borderColor: theme.red, color: theme.red }}
//                             onClick={() => deleteReservation(res.reservation_id)}
//                           >
//                             Delete
//                           </Button>

//                           {res.status === "Pending" && (
//                             <Button size="sm" variant="success" onClick={() => payCash(res.reservation_id)}>
//                               Pay Cash
//                             </Button>
//                           )}
//                         </div>
//                       </div>
//                     ))
//                   )}
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>

//           {/* Booking Modal */}
//           <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="lg">
//             <Modal.Header closeButton className="themed-header">
//               <Modal.Title>🎯 Manual Stadium Booking</Modal.Title>
//             </Modal.Header>
//             <Modal.Body>
//               <Form onSubmit={handleSubmitBooking}>
//                 <Row>
//                   <Col md={6}>
//                     <Form.Group className="mb-3">
//                       <Form.Label>Select Sport *</Form.Label>
//                       <Form.Select
//                         value={bookingForm.sport_id}
//                         onChange={(e) => handleFormChange("sport_id", e.target.value)}
//                         required
//                       >
//                         <option value="">Choose a sport...</option>
//                         {sports.map((s) => (
//                           <option key={s.sport_id} value={s.sport_id}>
//                             {s.sport_name}
//                           </option>
//                         ))}
//                       </Form.Select>
//                     </Form.Group>
//                   </Col>

//                   <Col md={6}>
//                     <Form.Group className="mb-3">
//                       <Form.Label>Select Stadium *</Form.Label>
//                       <Form.Select
//                         value={bookingForm.stadium_id}
//                         onChange={(e) => handleFormChange("stadium_id", Number(e.target.value))}
//                         required
//                       >
//                         <option value="">Choose a stadium...</option>
//                         {stadiums
//                           .filter((st) => !bookingForm.sport_id || String(st.sport_id) === String(bookingForm.sport_id))
//                           .map((st) => (
//                             <option key={st.stadium_id} value={st.stadium_id}>
//                               {st.stadium_name} - ${st.price_per_hour}/hour
//                             </option>
//                           ))}
//                       </Form.Select>
//                     </Form.Group>
//                   </Col>
//                 </Row>

//                 <Row>
//                   <Col md={6}>
//                     <Form.Group className="mb-3">
//                       <Form.Label>Booking Date *</Form.Label>
//                       <Form.Control
//                         type="date"
//                         value={bookingForm.reservation_date}
//                         onChange={(e) => handleFormChange("reservation_date", e.target.value)}
//                         min={todayStr}
//                         required
//                       />
//                     </Form.Group>
//                   </Col>

//                   <Col md={3}>
//                     <Form.Group className="mb-3">
//                       <Form.Label>Start Time *</Form.Label>
//                       <Form.Control
//                         type="time"
//                         value={bookingForm.start_time}
//                         onChange={(e) => handleFormChange("start_time", e.target.value)}
//                         required
//                       />
//                     </Form.Group>
//                   </Col>

//                   <Col md={3}>
//                     <Form.Group className="mb-3">
//                       <Form.Label>End Time *</Form.Label>
//                       <Form.Control
//                         type="time"
//                         value={bookingForm.end_time}
//                         onChange={(e) => handleFormChange("end_time", e.target.value)}
//                         required
//                       />
//                     </Form.Group>
//                   </Col>
//                 </Row>

//                 <Row>
//                   <Col md={12}>
//                     <Form.Group className="mb-3">
//                       <Form.Label>Customer *</Form.Label>
//                       <Form.Select
//                         value={bookingForm.customer_id}
//                         onChange={(e) => handleFormChange("customer_id", Number(e.target.value))}
//                         required
//                       >
//                         <option value="">Choose a customer...</option>
//                         {customers.map((c) => (
//                           <option key={c.customer_id} value={c.customer_id}>
//                             {c.name} {c.phone ? `- ${c.phone}` : ""}
//                           </option>
//                         ))}
//                       </Form.Select>
//                     </Form.Group>
//                   </Col>
//                 </Row>

//                 {bookingForm.total_price > 0 && (
//                   <Alert variant="success" className="mb-0">
//                     <strong>Total Price: ${bookingForm.total_price}</strong>
//                   </Alert>
//                 )}
//               </Form>
//             </Modal.Body>

//             <Modal.Footer>
//               <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
//                 Cancel
//               </Button>

//               <Button
//                 style={{ background: theme.purpleMid, borderColor: theme.purpleMid }}
//                 onClick={handleSubmitBooking}
//                 disabled={
//                   hasTimeConflict(
//                     bookingForm.stadium_id,
//                     bookingForm.reservation_date,
//                     bookingForm.start_time,
//                     bookingForm.end_time
//                   ) ||
//                   !bookingForm.customer_id ||
//                   !bookingForm.sport_id ||
//                   !bookingForm.stadium_id ||
//                   submitting
//                 }
//               >
//                 {submitting ? (
//                   <>
//                     <Spinner animation="border" size="sm" className="me-2" />
//                     Saving...
//                   </>
//                 ) : (
//                   `Confirm Booking ($ ${bookingForm.total_price || 0})`
//                 )}
//               </Button>
//             </Modal.Footer>
//           </Modal>

//           {/* Edit Modal */}
//           <Modal show={editModalOpen} onHide={() => setEditModalOpen(false)}>
//             <Modal.Header closeButton className="themed-header">
//               <Modal.Title>Edit Reservation</Modal.Title>
//             </Modal.Header>
//             <Modal.Body>
//               {editing && (
//                 <Form>
//                   <Row>
//                     <Col md={6}>
//                       <Form.Group className="mb-3">
//                         <Form.Label>Date</Form.Label>
//                         <Form.Control
//                           type="date"
//                           value={editing.reservation_date}
//                           onChange={(e) => setEditing({ ...editing, reservation_date: e.target.value })}
//                         />
//                       </Form.Group>
//                     </Col>

//                     <Col md={3}>
//                       <Form.Group className="mb-3">
//                         <Form.Label>Start</Form.Label>
//                         <Form.Control
//                           type="time"
//                           value={editing.start_time}
//                           onChange={(e) => setEditing({ ...editing, start_time: e.target.value })}
//                         />
//                       </Form.Group>
//                     </Col>

//                     <Col md={3}>
//                       <Form.Group className="mb-3">
//                         <Form.Label>End</Form.Label>
//                         <Form.Control
//                           type="time"
//                           value={editing.end_time}
//                           onChange={(e) => setEditing({ ...editing, end_time: e.target.value })}
//                         />
//                       </Form.Group>
//                     </Col>
//                   </Row>

//                   <Row>
//                     <Col md={6}>
//                       <Form.Group className="mb-3">
//                         <Form.Label>Customer</Form.Label>
//                         <Form.Select
//                           value={editing.customer_id || ""}
//                           onChange={(e) => setEditing({ ...editing, customer_id: Number(e.target.value) })}
//                         >
//                           <option value="">Select customer...</option>
//                           {customers.map((c) => (
//                             <option key={c.customer_id} value={c.customer_id}>
//                               {c.name} {c.phone ? `- ${c.phone}` : ""}
//                             </option>
//                           ))}
//                         </Form.Select>
//                       </Form.Group>
//                     </Col>

//                     <Col md={6}>
//                       <Form.Group className="mb-3">
//                         <Form.Label>Status</Form.Label>
//                         <Form.Select
//                           value={editing.status}
//                           onChange={(e) => setEditing({ ...editing, status: e.target.value })}
//                         >
//                           <option>Confirmed</option>
//                           <option>Pending</option>
//                           <option>Completed</option>
//                           <option>Cancelled</option>
//                         </Form.Select>
//                       </Form.Group>
//                     </Col>
//                   </Row>

//                   <Form.Group className="mb-3">
//                     <Form.Label>Stadium</Form.Label>
//                     <Form.Select
//                       value={editing.stadium_id}
//                       onChange={(e) => setEditing({ ...editing, stadium_id: Number(e.target.value) })}
//                     >
//                       {stadiums.map((st) => (
//                         <option key={st.stadium_id} value={st.stadium_id}>
//                           {st.stadium_name} - ${st.price_per_hour}/h
//                         </option>
//                       ))}
//                     </Form.Select>
//                   </Form.Group>

//                   <Form.Group>
//                     <Form.Label>Total Price</Form.Label>
//                     <Form.Control
//                       type="number"
//                       value={editing.total_price ?? 0}
//                       onChange={(e) => setEditing({ ...editing, total_price: Number(e.target.value) })}
//                     />
//                   </Form.Group>
//                 </Form>
//               )}
//             </Modal.Body>

//             <Modal.Footer>
//               <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
//                 Close
//               </Button>
//               <Button style={{ background: theme.emerald, borderColor: theme.emerald }} onClick={submitEditReservation}>
//                 Save changes
//               </Button>
//             </Modal.Footer>
//           </Modal>
//         </>
//       )}
//     </div>
//   );
// };

// export default SportsSchedule;
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Badge,
  Modal,
  Form,
  Spinner,
  Alert,
  OverlayTrigger,
  Popover,
} from "react-bootstrap";
import sportsService from "../../services/sportsService";
import { FaSync } from "react-icons/fa"; // Import refresh icon

const theme = {
  purpleDark: "#3b2a88",
  purpleMid: "#6a4fb3",
  emerald: "#146b57",
  emerald2: "#1e8c6f",
  pageBg: "#f4f5f7",
  cardBg: "#ffffff",
  textDark: "#16171a",
  textMuted: "#6b7280",
  chipBg: "#efe7ff",
  chipText: "#3b2a88",
  gold: "#e2b93b",
  red: "#e04f5f",
  headerGradient: "linear-gradient(90deg, #3b2a88 0%, #146b57 100%)",
};

const SportsSchedule = () => {
  const todayStr = new Date().toISOString().split("T")[0];

  const [activeTab, setActiveTab] = useState("schedule");

  const [reservations, setReservations] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [sports, setSports] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [submitting, setSubmitting] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [bookingForm, setBookingForm] = useState({
    sport_id: "",
    stadium_id: "",
    customer_id: "",
    reservation_date: todayStr,
    start_time: "",
    end_time: "",
    notes: "",
    total_price: 0,
  });

  const sportsOrder = ["Football", "Basketball", "Tennis", "Pedalo"];

  // Load initial data
  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
      const [sportsData, stadiumsData, reservationsData, customersData] =
        await Promise.all([
          sportsService.getAllSports(),
          sportsService.getAllStadiums(),
          sportsService.getReservationsByDate(selectedDate),
          sportsService.getCustomers(),
        ]);

      setSports(sportsData.sports || []);
      setStadiums(stadiumsData.stadiums || []);

      // ✅ hide cancelled
      const resv = (reservationsData.reservations || []).filter(
        (r) => r.status !== "Cancelled"
      );
      setReservations(resv);

      setCustomers(customersData.customers || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
      setError("Failed to load data.");
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when date changes
  useEffect(() => {
    const reload = async () => {
      try {
        const data = await sportsService.getReservationsByDate(selectedDate);
        const resv = (data.reservations || []).filter((r) => r.status !== "Cancelled");
        setReservations(resv);
        setLastRefresh(new Date());
      } catch (e) {
        console.error(e);
      }
    };
    if (selectedDate) reload();
  }, [selectedDate]);

  // Refresh function
  const handleRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const timeSlots = useMemo(
    () =>
      Array.from({ length: 22 - 8 + 1 }, (_, i) => {
        const h = 8 + i;
        return {
          time: `${h}:00 - ${h + 1}:00`,
          hour: h,
          start_time: `${String(h).padStart(2, "0")}:00`,
          end_time: `${String(h + 1).padStart(2, "0")}:00`,
        };
      }),
    []
  );

  const timeToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = String(t).split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const hasTimeConflict = (stadiumId, date, startTime, endTime, excludeId = null) => {
    return reservations.some((r) => {
      if (excludeId && r.reservation_id === excludeId) return false;
      if (r.status === "Cancelled") return false;
      if (r.stadium_id !== stadiumId || r.reservation_date !== date) return false;

      const ns = timeToMinutes(startTime),
        ne = timeToMinutes(endTime);
      const es = timeToMinutes(r.start_time),
        ee = timeToMinutes(r.end_time);
      return ns < ee && ne > es;
    });
  };

  const isTimeSlotAvailable = (stadiumId, hour) => {
    const s = `${String(hour).padStart(2, "0")}:00`;
    const e = `${String(hour + 1).padStart(2, "0")}:00`;
    return !hasTimeConflict(stadiumId, selectedDate, s, e);
  };

  const getReservationForSlot = (stadiumId, hour) => {
    const s = `${String(hour).padStart(2, "0")}:00`;
    return reservations.find(
      (r) =>
        r.status !== "Cancelled" &&
        r.stadium_id === stadiumId &&
        r.reservation_date === selectedDate &&
        r.start_time === s
    );
  };

  const calculatePrice = (stadiumId, startTime, endTime) => {
    const st = stadiums.find((s) => s.stadium_id === stadiumId);
    if (!st) return 0;
    return ((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60) * st.price_per_hour;
  };

  const handleBookSlot = (stadium, timeSlot) => {
    setBookingForm((b) => ({
      ...b,
      stadium_id: stadium.stadium_id,
      sport_id: stadium.sport_id,
      reservation_date: selectedDate,
      start_time: timeSlot.start_time,
      end_time: timeSlot.end_time,
      total_price: calculatePrice(stadium.stadium_id, timeSlot.start_time, timeSlot.end_time),
    }));
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.customer_id) {
      alert("Please select a customer.");
      return;
    }
    if (
      hasTimeConflict(
        bookingForm.stadium_id,
        bookingForm.reservation_date,
        bookingForm.start_time,
        bookingForm.end_time
      )
    ) {
      alert("Time slot conflict for this stadium.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await sportsService.createReservation(bookingForm);

      // ✅ if backend returns status Pending, it will appear; Cancelled won't.
      setReservations((prev) => [result.reservation, ...prev]);

      setShowBookingModal(false);
      setBookingForm({
        sport_id: "",
        stadium_id: "",
        customer_id: "",
        reservation_date: todayStr,
        start_time: "",
        end_time: "",
        notes: "",
        total_price: 0,
      });
      
      // Refresh the data after booking
      handleRefresh();
    } catch (e2) {
      alert("Failed to save reservation: " + (e2.response?.data?.error || e2.message));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditReservation = (reservation) => {
    setEditing({
      ...reservation,
      reservation_date: reservation.reservation_date,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      total_price: reservation.total_price,
    });
    setEditModalOpen(true);
  };

  const submitEditReservation = async () => {
    try {
      if (editing.stadium_id && editing.reservation_date && editing.start_time && editing.end_time) {
        const conflict = hasTimeConflict(
          editing.stadium_id,
          editing.reservation_date,
          editing.start_time,
          editing.end_time,
          editing.reservation_id
        );
        if (conflict) {
          alert("Time conflict for the updated values.");
          return;
        }
      }

      const { reservation_id, ...updates } = editing;
      const result = await sportsService.updateReservation(reservation_id, updates);

      // ✅ if edited to Cancelled -> remove from list
      if (result.reservation?.status === "Cancelled") {
        setReservations((prev) => prev.filter((r) => r.reservation_id !== reservation_id));
      } else {
        setReservations((prev) =>
          prev.map((r) => (r.reservation_id === reservation_id ? result.reservation : r))
        );
      }

      setEditModalOpen(false);
      setEditing(null);
      handleRefresh(); // Refresh after edit
    } catch (e) {
      alert("Failed to update: " + (e.response?.data?.error || e.message));
    }
  };

  const getPaymentStatusSafe = async (reservationId) => {
    try {
      return await sportsService.getReservationPaymentStatus(reservationId);
    } catch (e) {
      return { is_paid: false };
    }
  };

  const cancelReservation = async (reservationId) => {
    const r = reservations.find((x) => x.reservation_id === reservationId);
    const ps = await getPaymentStatusSafe(reservationId);
    const isPaid = ps?.is_paid === true;

    if (isPaid) {
      const customerName = r?.customer_name || "Unknown";
      const amount = Number(r?.total_price || 0);
      const ok = window.confirm(
        `PAID reservation!\nThe money of this customer: ${customerName} : $${amount} will be lost.\n\nContinue cancel?`
      );
      if (!ok) return;
    } else {
      if (!window.confirm("Cancel this reservation?")) return;
    }

    try {
      await sportsService.updateReservationStatus(reservationId, "Cancelled");

      // ✅ remove from UI immediately
      setReservations((prev) => prev.filter((x) => x.reservation_id !== reservationId));
      handleRefresh(); // Refresh data
    } catch (e) {
      alert("Failed to cancel: " + (e.response?.data?.error || e.message));
    }
  };

  const deleteReservation = async (reservationId) => {
    const r = reservations.find((x) => x.reservation_id === reservationId);
    const ps = await getPaymentStatusSafe(reservationId);
    const isPaid = ps?.is_paid === true;

    if (isPaid) {
      const customerName = r?.customer_name || "Unknown";
      const amount = Number(r?.total_price || 0);
      const ok = window.confirm(
        `PAID reservation!\nThe money of this customer: ${customerName} : $${amount} will be lost.\n\nContinue delete permanently?`
      );
      if (!ok) return;
    } else {
      if (!window.confirm("Delete this reservation permanently?")) return;
    }

    try {
      await sportsService.deleteReservation(reservationId);
      setReservations((prev) => prev.filter((x) => x.reservation_id !== reservationId));
      handleRefresh(); // Refresh data
    } catch (e) {
      alert("Failed to delete: " + (e.response?.data?.error || e.message));
    }
  };

  
  // ✅ Smooth PDF download (no new tab flash)
  const downloadFile = (url, filename = "invoice.pdf") => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const payCash = async (reservationId) => {
    try {
      const ok = window.confirm("Confirm CASH payment for this reservation?");
      if (!ok) return;

      const res = await sportsService.payCash(reservationId);

      // ✅ ONLY update status (keep date/time fields unchanged so schedule grid still finds it)
      const newStatus = res?.reservation?.status || "Confirmed";

      setReservations((prev) =>
        prev.map((x) =>
          x.reservation_id === reservationId
            ? { ...x, status: newStatus }
            : x
        )
      );

      // ✅ Download PDF smoothly
      if (res?.invoice_pdf_url) {
        downloadFile(res.invoice_pdf_url, `invoice-${reservationId}.pdf`);
      } else {
        console.warn("Cash payment saved but no invoice_pdf_url returned");
      }
      
      handleRefresh(); // Refresh after payment
    } catch (e) {
      alert("Pay cash failed: " + (e.response?.data?.error || e.message));
    }
  };

  const handleFormChange = (field, value) => {
    const updated = { ...bookingForm, [field]: value };
    if (
      (field === "stadium_id" || field === "start_time" || field === "end_time") &&
      updated.stadium_id &&
      updated.start_time &&
      updated.end_time
    ) {
      updated.total_price = calculatePrice(updated.stadium_id, updated.start_time, updated.end_time);
    }
    setBookingForm(updated);
  };

  const getStatusBadge = (status) => {
    const variants = {
      Confirmed: "success",
      Pending: "warning",
      Cancelled: "secondary",
      Completed: "info",
    };
    return variants[status] || "secondary";
  };

  const stadiumsBySport = (sportName) =>
    stadiums.filter((s) => (s.sport_name || "").toLowerCase() === sportName.toLowerCase());

  const reservedPopover = (resv, stadium) => (
    <Popover id={`popover-${resv.reservation_id}`}>
      <Popover.Header as="h6">Reservation</Popover.Header>
      <Popover.Body>
        <div className="mb-2">
          <strong>{stadium?.stadium_name || "Stadium"}</strong>
          <br />
          {resv.start_time} - {resv.end_time}
          <br />
          {resv.customer_name}
          <br />
          {resv.customer_phone}
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline-primary"
            style={{ borderColor: theme.purpleMid, color: theme.purpleMid }}
            onClick={() => openEditReservation(resv)}
          >
            Edit
          </Button>

          <Button
            size="sm"
            variant="outline-warning"
            style={{ borderColor: theme.gold, color: theme.gold }}
            onClick={() => cancelReservation(resv.reservation_id)}
          >
            Cancel
          </Button>

          <Button
            size="sm"
            variant="outline-danger"
            style={{ borderColor: theme.red, color: theme.red }}
            onClick={() => deleteReservation(resv.reservation_id)}
          >
            Delete
          </Button>

          {/* Optional cash pay */}
          {resv.status === "Pending" && (
            <Button size="sm" variant="success" onClick={() => payCash(resv.reservation_id)}>
              Pay Cash
            </Button>
          )}
        </div>
      </Popover.Body>
    </Popover>
  );

  if (loading) {
    return (
      <div className="text-center py-5" style={{ background: theme.pageBg }}>
        <Spinner animation="border" style={{ color: theme.purpleMid }} size="lg" />
        <p className="mt-3" style={{ color: theme.textMuted }}>
          Loading sports data...
        </p>
      </div>
    );
  }

  const handleHeaderDateChange = (e) => {
    const v = e.target.value;
    setSelectedDate(v < todayStr ? todayStr : v);
  };

  return (
    <div className="sports-schedule-container" style={{ background: theme.pageBg }}>
      <style>{`
        .themed-header { background: ${theme.headerGradient}; color: #fff; }
        .themed-chip { background: ${theme.chipBg}; color: ${theme.chipText};
          border-radius: 999px; padding: 6px 12px; font-weight: 700; }
        .table thead th {
          background: linear-gradient(90deg, ${theme.purpleDark} 0%, ${theme.emerald} 100%) !important;
          color: #fff !important; font-weight: 700; border-bottom: 0 !important;
          text-shadow: 0 1px 2px rgba(0,0,0,0.4);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .table tbody tr:nth-child(odd) td { background: #fafafb; }
        .table tbody tr:nth-child(even) td { background: #f6fff9; }
        .reserved-box {
          background: linear-gradient(135deg, ${theme.emerald} 0%, ${theme.emerald2} 100%);
          color: #fff; border-radius: 12px; font-weight: 700; box-shadow: 0 6px 16px rgba(20,107,87,0.25);
        }
        .card { border-radius: 16px; }
        
        /* Scrollable calendar container */
        .scrollable-calendar-container {
          height: 600px; /* Fixed height for the calendar */
          overflow-y: auto; /* Enable vertical scrolling */
          overflow-x: hidden; /* Prevent horizontal scroll */
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }
        
        /* Custom scrollbar styling */
        .scrollable-calendar-container::-webkit-scrollbar {
          width: 10px;
        }
        
        .scrollable-calendar-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .scrollable-calendar-container::-webkit-scrollbar-thumb {
          background: ${theme.purpleMid};
          border-radius: 10px;
        }
        
        .scrollable-calendar-container::-webkit-scrollbar-thumb:hover {
          background: ${theme.purpleDark};
        }
        
        /* For Firefox */
        .scrollable-calendar-container {
          scrollbar-width: thin;
          scrollbar-color: ${theme.purpleMid} #f1f1f1;
        }
        
        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .scrollable-calendar-container {
            height: 500px;
          }
        }
        
        @media (max-width: 992px) {
          .scrollable-calendar-container {
            height: 450px;
          }
        }
        
        /* Refresh button styles */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .refresh-info {
          font-size: 0.8rem;
          color: ${theme.textMuted};
          margin-top: 4px;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h3 className="mb-1" style={{ fontWeight: 800, color: theme.purpleDark }}>
            SportZone Scheduler
          </h3>
          <div className="themed-chip">
            {stadiums.length} stadiums • {reservations.length} reservations • {selectedDate}
          </div>
          <div className="refresh-info">
            Last refresh: {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <Form.Control
            type="date"
            value={selectedDate}
            onChange={handleHeaderDateChange}
            min={todayStr}
            style={{ width: "auto" }}
          />
          
          <Button
            variant="outline-primary"
            onClick={handleRefresh}
            disabled={refreshing}
            className="d-flex align-items-center"
          >
            <FaSync className={refreshing ? "me-2 spin" : "me-2"} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>

          {activeTab === "schedule" && (
            <Button
              style={{ background: theme.purpleMid, borderColor: theme.purpleMid }}
              onClick={() => setShowBookingModal(true)}
            >
              Manual Booking
            </Button>
          )}
        </div>
      </div>

      <div className="store-tabs" style={{ marginBottom: 12 }}>
        <button
          className={`store-tab-btn ${activeTab === "schedule" ? "active" : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          Schedule
        </button>
      </div>

      {activeTab === "schedule" && (
        <>
          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
          
          {refreshing && (
            <div className="text-center mb-3">
              <Spinner animation="border" size="sm" className="me-2" />
              <span className="text-muted">Refreshing data...</span>
            </div>
          )}

          <Row>
            <Col lg={8}>
              <Card className="border-0 shadow-sm mb-4" style={{ background: theme.cardBg }}>
                <Card.Header className="themed-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">📅 Schedule by Sport</h5>
                  <div className="d-flex align-items-center">
                    <Badge bg="light" text="dark" className="me-2">
                      4 Sports Columns • Scroll to see all time slots
                    </Badge>
                    {refreshing && (
                      <Spinner animation="border" size="sm" className="text-light" />
                    )}
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  {/* SCROLLABLE CALENDAR CONTAINER */}
                  <div className="scrollable-calendar-container">
                    <Table hover className="mb-0 align-middle">
                      <thead>
                        <tr>
                          <th style={{ position: 'sticky', top: 0, zIndex: 10 }}>Time Slot</th>
                          {sportsOrder.map((s) => (
                            <th key={s} className="text-center" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                              {s}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((slot) => (
                          <tr key={slot.hour}>
                            <td className="fw-bold" style={{ color: theme.textDark }}>
                              {slot.time}
                            </td>

                            {sportsOrder.map((sport) => {
                              const group = stadiumsBySport(sport);

                              return (
                                <td key={sport} className="text-center">
                                  {group.length === 0 ? (
                                    <span className="text-muted small">No stadiums</span>
                                  ) : (
                                    group.map((stadium) => {
                                      const resv = getReservationForSlot(stadium.stadium_id, slot.hour);
                                      const available = isTimeSlotAvailable(stadium.stadium_id, slot.hour);

                                      return (
                                        <div key={stadium.stadium_id + "-" + slot.hour} className="mb-2">
                                          {resv ? (
                                            <OverlayTrigger
                                              trigger="click"
                                              rootClose
                                              placement="top"
                                              overlay={reservedPopover(resv, stadium)}
                                            >
                                              <div className="reserved-box w-100 py-2" style={{ cursor: "pointer" }}>
                                                Reserved
                                              </div>
                                            </OverlayTrigger>
                                          ) : (
                                            <Button
                                              variant="outline-success"
                                              size="sm"
                                              onClick={() => available && handleBookSlot(stadium, slot)}
                                              className="w-100"
                                              style={{
                                                color: available ? theme.emerald : "#9aa0a6",
                                                borderColor: available ? theme.emerald : "#cfd4d9",
                                              }}
                                              disabled={!available}
                                            >
                                              {available ? "Available" : "Unavailable"}
                                            </Button>
                                          )}

                                          <div className="small" style={{ color: theme.textMuted, marginTop: 6 }}>
                                            {stadium.stadium_name} • ${stadium.price_per_hour}/h
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="border-0 shadow-sm" style={{ background: theme.cardBg }}>
                <Card.Header className="themed-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">📋 Reservations on {selectedDate}</h5>
                    <div className="d-flex align-items-center">
                      <Badge bg="light" text="dark" className="me-2">
                        Total: {reservations.length}
                      </Badge>
                      <Button 
                        variant="outline-light" 
                        size="sm" 
                        onClick={handleRefresh}
                        disabled={refreshing}
                        title="Refresh reservations"
                      >
                        <FaSync className={refreshing ? "spin" : ""} />
                      </Button>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body style={{ maxHeight: "520px", overflowY: "auto" }}>
                  {refreshing && (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" />
                      <p className="text-muted mt-2 small">Refreshing reservations...</p>
                    </div>
                  )}
                  
                  {!refreshing && reservations.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mt-2">No reservations for this date</p>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={handleRefresh}
                        className="mt-2"
                      >
                        <FaSync className="me-1" /> Refresh
                      </Button>
                    </div>
                  ) : (
                    reservations.map((res) => (
                      <div key={res.reservation_id} className="reservation-item mb-3 p-3 border rounded">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0">{res.stadium_name}</h6>
                          <Badge bg={getStatusBadge(res.status)}>{res.status}</Badge>
                        </div>

                        <p className="text-muted mb-1">{res.start_time} - {res.end_time}</p>
                        <p className="text-muted mb-1">{res.customer_name}</p>
                        <p className="text-muted mb-2">{res.customer_phone}</p>

                        <div className="d-flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            style={{ borderColor: theme.purpleMid, color: theme.purpleMid }}
                            onClick={() => openEditReservation(res)}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline-warning"
                            style={{ borderColor: theme.gold, color: theme.gold }}
                            onClick={() => cancelReservation(res.reservation_id)}
                          >
                            Cancel
                          </Button>

                          <Button
                            size="sm"
                            variant="outline-danger"
                            style={{ borderColor: theme.red, color: theme.red }}
                            onClick={() => deleteReservation(res.reservation_id)}
                          >
                            Delete
                          </Button>

                          {res.status === "Pending" && (
                            <Button size="sm" variant="success" onClick={() => payCash(res.reservation_id)}>
                              Pay Cash
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Booking Modal */}
          <Modal show={showBookingModal} onHide={() => setShowBookingModal(false)} size="lg">
            <Modal.Header closeButton className="themed-header">
              <Modal.Title>🎯 Manual Stadium Booking</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmitBooking}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Sport *</Form.Label>
                      <Form.Select
                        value={bookingForm.sport_id}
                        onChange={(e) => handleFormChange("sport_id", e.target.value)}
                        required
                      >
                        <option value="">Choose a sport...</option>
                        {sports.map((s) => (
                          <option key={s.sport_id} value={s.sport_id}>
                            {s.sport_name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Stadium *</Form.Label>
                      <Form.Select
                        value={bookingForm.stadium_id}
                        onChange={(e) => handleFormChange("stadium_id", Number(e.target.value))}
                        required
                      >
                        <option value="">Choose a stadium...</option>
                        {stadiums
                          .filter((st) => !bookingForm.sport_id || String(st.sport_id) === String(bookingForm.sport_id))
                          .map((st) => (
                            <option key={st.stadium_id} value={st.stadium_id}>
                              {st.stadium_name} - ${st.price_per_hour}/hour
                            </option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Booking Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={bookingForm.reservation_date}
                        onChange={(e) => handleFormChange("reservation_date", e.target.value)}
                        min={todayStr}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Time *</Form.Label>
                      <Form.Control
                        type="time"
                        value={bookingForm.start_time}
                        onChange={(e) => handleFormChange("start_time", e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Time *</Form.Label>
                      <Form.Control
                        type="time"
                        value={bookingForm.end_time}
                        onChange={(e) => handleFormChange("end_time", e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Customer *</Form.Label>
                      <Form.Select
                        value={bookingForm.customer_id}
                        onChange={(e) => handleFormChange("customer_id", Number(e.target.value))}
                        required
                      >
                        <option value="">Choose a customer...</option>
                        {customers.map((c) => (
                          <option key={c.customer_id} value={c.customer_id}>
                            {c.name} {c.phone ? `- ${c.phone}` : ""}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {bookingForm.total_price > 0 && (
                  <Alert variant="success" className="mb-0">
                    <strong>Total Price: ${bookingForm.total_price}</strong>
                  </Alert>
                )}
              </Form>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowBookingModal(false)}>
                Cancel
              </Button>

              <Button
                style={{ background: theme.purpleMid, borderColor: theme.purpleMid }}
                onClick={handleSubmitBooking}
                disabled={
                  hasTimeConflict(
                    bookingForm.stadium_id,
                    bookingForm.reservation_date,
                    bookingForm.start_time,
                    bookingForm.end_time
                  ) ||
                  !bookingForm.customer_id ||
                  !bookingForm.sport_id ||
                  !bookingForm.stadium_id ||
                  submitting
                }
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  `Confirm Booking ($ ${bookingForm.total_price || 0})`
                )}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Edit Modal */}
          <Modal show={editModalOpen} onHide={() => setEditModalOpen(false)}>
            <Modal.Header closeButton className="themed-header">
              <Modal.Title>Edit Reservation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {editing && (
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={editing.reservation_date}
                          onChange={(e) => setEditing({ ...editing, reservation_date: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Start</Form.Label>
                        <Form.Control
                          type="time"
                          value={editing.start_time}
                          onChange={(e) => setEditing({ ...editing, start_time: e.target.value })}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>End</Form.Label>
                        <Form.Control
                          type="time"
                          value={editing.end_time}
                          onChange={(e) => setEditing({ ...editing, end_time: e.target.value })}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Customer</Form.Label>
                        <Form.Select
                          value={editing.customer_id || ""}
                          onChange={(e) => setEditing({ ...editing, customer_id: Number(e.target.value) })}
                        >
                          <option value="">Select customer...</option>
                          {customers.map((c) => (
                            <option key={c.customer_id} value={c.customer_id}>
                              {c.name} {c.phone ? `- ${c.phone}` : ""}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select
                          value={editing.status}
                          onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                        >
                          <option>Confirmed</option>
                          <option>Pending</option>
                          <option>Completed</option>
                          <option>Cancelled</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Stadium</Form.Label>
                    <Form.Select
                      value={editing.stadium_id}
                      onChange={(e) => setEditing({ ...editing, stadium_id: Number(e.target.value) })}
                    >
                      {stadiums.map((st) => (
                        <option key={st.stadium_id} value={st.stadium_id}>
                          {st.stadium_name} - ${st.price_per_hour}/h
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Total Price</Form.Label>
                    <Form.Control
                      type="number"
                      value={editing.total_price ?? 0}
                      onChange={(e) => setEditing({ ...editing, total_price: Number(e.target.value) })}
                    />
                  </Form.Group>
                </Form>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
                Close
              </Button>
              <Button style={{ background: theme.emerald, borderColor: theme.emerald }} onClick={submitEditReservation}>
                Save changes
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </div>
  );
};

export default SportsSchedule;