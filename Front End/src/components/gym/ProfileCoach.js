// // // // Front_end/snp/src/components/gym/ProfileCoach.js

// // // import React, { useEffect, useState } from "react";
// // // import { Card, Badge, Button, Table } from "react-bootstrap";
// // // import assignmentsService from "../../services/assignmentsService";
// // // import idCardsService from "../../services/idCardsService";
// // // import IdCardModal from "./IdCardModal"; // ✅ SAME modal used in members

// // // export default function ProfileCoach({ coach, onAssignClick }) {
// // //   const [assignments, setAssignments] = useState([]);

// // //   // ✅ ID card modal state (same as members)
// // //   const [showCard, setShowCard] = useState(false);
// // //   const [activeCard, setActiveCard] = useState(null);

// // //   const openModalWith = (card) => {
// // //     setActiveCard(card || null);
// // //     setShowCard(true);
// // //   };

// // //   // ✅ same safe helper used in members
// // //   const buildPhotoSrc = (raw) => {
// // //     if (!raw || String(raw).trim() === "") return null;
// // //     const v = String(raw);
// // //     if (v.startsWith("http") || v.startsWith("data:")) return v;
// // //     return `http://localhost:5000/${v.replace(/^\/+/, "")}`;
// // //   };

// // //   // ✅ load assignments for this coach (keeps your table)
// // //   useEffect(() => {
// // //     if (!coach?.coach_id) {
// // //       setAssignments([]);
// // //       return;
// // //     }

// // //     const load = async () => {
// // //       try {
// // //         let rows;

// // //         // support both service names so nothing breaks
// // //         if (typeof assignmentsService.byCoach === "function") {
// // //           rows = await assignmentsService.byCoach(coach.coach_id);
// // //         } else if (typeof assignmentsService.listByCoach === "function") {
// // //           rows = await assignmentsService.listByCoach(coach.coach_id);
// // //         } else {
// // //           rows = [];
// // //         }

// // //         const normalized = Array.isArray(rows)
// // //           ? rows
// // //           : rows?.assignments || rows?.rows || [];

// // //         setAssignments(normalized);
// // //       } catch (e) {
// // //         console.error("load assignments error:", e);
// // //         setAssignments([]);
// // //       }
// // //     };

// // //     load();
// // //   }, [coach]);

// // //   // ✅ Generate coach ID card using SAME flow as members
// // //   const handleGenerateIdCard = async () => {
// // //     if (!coach?.coach_id) return;

// // //     const payload = {
// // //       role: "coach",
// // //       coach_id: coach.coach_id,
// // //       color: "#3b2a88",
// // //       template: "verticalB", // DB template only
// // //     };

// // //     try {
// // //       const res = await idCardsService.generate(payload, { force: false });
// // //       openModalWith(res.card);
// // //     } catch (e) {
// // //       if (e.code === "ALREADY_EXISTS" && e.card) {
// // //         const c = e.card;

// // //         const again = window.confirm(
// // //           `This coach already has an ID card.\n` +
// // //             `Existing ID: ${c.sub_id}\nCreated: ${new Date(
// // //               c.created_at
// // //             ).toLocaleString()}\n\n` +
// // //             `Generate a NEW ID card anyway?`
// // //         );

// // //         if (!again) {
// // //           // open existing styled modal
// // //           openModalWith(c);
// // //           return;
// // //         }

// // //         try {
// // //           const res2 = await idCardsService.generate(payload, { force: true });
// // //           openModalWith(res2.card);
// // //         } catch (err2) {
// // //           console.error(err2);
// // //           alert(err2.message || "Failed to generate coach ID card");
// // //         }
// // //       } else {
// // //         console.error(e);
// // //         alert(e.message || "Failed to generate coach ID card");
// // //       }
// // //     }
// // //   };

// // //   if (!coach) return null;

// // //   const photoSrc = buildPhotoSrc(coach.photo_url);

// // //   return (
// // //     <>
// // //       <Card className="border-0 shadow-sm">
// // //         <Card.Header className="d-flex justify-content-between align-items-center">
// // //           <div className="d-flex align-items-center">
// // //             <div
// // //               className="rounded me-2"
// // //               style={{
// // //                 width: 56,
// // //                 height: 56,
// // //                 overflow: "hidden",
// // //                 background: "#eee",
// // //               }}
// // //             >
// // //               {photoSrc ? (
// // //                 <img
// // //                   src={photoSrc}
// // //                   alt="coach"
// // //                   style={{
// // //                     width: "100%",
// // //                     height: "100%",
// // //                     objectFit: "cover",
// // //                   }}
// // //                   onError={(e) => (e.currentTarget.style.display = "none")}
// // //                 />
// // //               ) : (
// // //                 <span
// // //                   className="d-block text-center"
// // //                   style={{ lineHeight: "56px" }}
// // //                 >
// // //                   👤
// // //                 </span>
// // //               )}
// // //             </div>

// // //             <div>
// // //               <h6 className="mb-0">{coach.full_name}</h6>
// // //               <small className="text-muted">{coach.specialties}</small>
// // //             </div>
// // //           </div>

// // //           <Badge bg={coach.status === "Active" ? "success" : "secondary"}>
// // //             {coach.status}
// // //           </Badge>
// // //         </Card.Header>

// // //         <Card.Body>
// // //           <div className="mb-2">
// // //             <strong>Experience:</strong> {coach.experience_years ?? "—"} years
// // //           </div>

// // //           {coach.certifications && (
// // //             <div className="mb-2">
// // //               <strong>Certifications:</strong> {coach.certifications}
// // //             </div>
// // //           )}

// // //           {coach.hourly_rate != null && (
// // //             <div className="mb-3">
// // //               <strong>Rate:</strong> $
// // //               {Number(coach.hourly_rate).toFixed(2)}/hr
// // //             </div>
// // //           )}

// // //           <div className="d-flex justify-content-between align-items-center mb-2">
// // //             <h6 className="mb-0">Assigned Members</h6>

// // //             <div>
// // //               <Button
// // //                 size="sm"
// // //                 className="me-2"
// // //                 variant="outline-success"
// // //                 onClick={handleGenerateIdCard}
// // //               >
// // //                 Generate ID Card
// // //               </Button>

// // //               <Button
// // //                 size="sm"
// // //                 variant="outline-primary"
// // //                 onClick={onAssignClick}
// // //               >
// // //                 Assign to Member
// // //               </Button>
// // //             </div>
// // //           </div>

// // //           {/* ✅ same assignment table (working) */}
// // //           <Table size="sm" hover>
// // //             <thead>
// // //               <tr>
// // //                 <th>Member ID</th>
// // //                 <th>Member Name</th>
// // //                 <th>Start Date</th>
// // //                 <th>Status</th>
// // //               </tr>
// // //             </thead>

// // //             <tbody>
// // //               {assignments.map((a) => (
// // //                 <tr key={a.assignment_id}>
// // //                   <td>{a.member_id}</td>
// // //                   <td>{a.member_name}</td>
// // //                   <td>{a.start_date?.slice(0, 10)}</td>
// // //                   <td>
// // //                     <Badge bg={a.status === "Active" ? "success" : "secondary"}>
// // //                       {a.status}
// // //                     </Badge>
// // //                   </td>
// // //                 </tr>
// // //               ))}

// // //               {assignments.length === 0 && (
// // //                 <tr>
// // //                   <td colSpan={4} className="text-muted">
// // //                     No assignments
// // //                   </td>
// // //                 </tr>
// // //               )}
// // //             </tbody>
// // //           </Table>
// // //         </Card.Body>
// // //       </Card>

// // //       {/* ✅ Styled horizontal modal with QR + PDF + both faces image download */}
// // //       <IdCardModal
// // //         show={showCard}
// // //         onHide={() => setShowCard(false)}
// // //         card={activeCard}
// // //       />
// // //     </>
// // //   );
// // // }
// // // Front_end/snp/src/components/gym/ProfileCoach.js

// // import React, { useEffect, useState } from "react";
// // import { Card, Badge, Button, Table } from "react-bootstrap";
// // import assignmentsService from "../../services/assignmentsService";
// // import idCardsService from "../../services/idCardsService";
// // import IdCardModal from "./IdCardModal"; // ✅ SAME modal used in members

// // export default function ProfileCoach({ coach, onAssignClick, refreshKey }) {
// //   const [assignments, setAssignments] = useState([]);

// //   // ✅ ID card modal state (same as members)
// //   const [showCard, setShowCard] = useState(false);
// //   const [activeCard, setActiveCard] = useState(null);

// //   const openModalWith = (card) => {
// //     setActiveCard(card || null);
// //     setShowCard(true);
// //   };

// //   // ✅ same safe helper used in members
// //   const buildPhotoSrc = (raw) => {
// //     if (!raw || String(raw).trim() === "") return null;
// //     const v = String(raw);
// //     if (v.startsWith("http") || v.startsWith("data:")) return v;
// //     return `http://localhost:5000/${v.replace(/^\/+/, "")}`;
// //   };

// //   // ✅ load assignments for this coach (keeps your table)
// //   // ✅ ADD refreshKey to dependency array
// //   useEffect(() => {
// //     if (!coach?.coach_id) {
// //       setAssignments([]);
// //       return;
// //     }

// //     const load = async () => {
// //       try {
// //         let rows;

// //         // support both service names so nothing breaks
// //         if (typeof assignmentsService.byCoach === "function") {
// //           rows = await assignmentsService.byCoach(coach.coach_id);
// //         } else if (typeof assignmentsService.listByCoach === "function") {
// //           rows = await assignmentsService.listByCoach(coach.coach_id);
// //         } else {
// //           rows = [];
// //         }

// //         const normalized = Array.isArray(rows)
// //           ? rows
// //           : rows?.assignments || rows?.rows || [];

// //         setAssignments(normalized);
// //       } catch (e) {
// //         console.error("load assignments error:", e);
// //         setAssignments([]);
// //       }
// //     };

// //     load();
// //   }, [coach, refreshKey]); // ✅ ADD: refreshKey triggers re-fetch

// //   // ✅ Generate coach ID card using SAME flow as members
// //   const handleGenerateIdCard = async () => {
// //     if (!coach?.coach_id) return;

// //     const payload = {
// //       role: "coach",
// //       coach_id: coach.coach_id,
// //       color: "#3b2a88",
// //       template: "verticalB", // DB template only
// //     };

// //     try {
// //       const res = await idCardsService.generate(payload, { force: false });
// //       openModalWith(res.card);
// //     } catch (e) {
// //       if (e.code === "ALREADY_EXISTS" && e.card) {
// //         const c = e.card;

// //         const again = window.confirm(
// //           `This coach already has an ID card.\n` +
// //             `Existing ID: ${c.sub_id}\nCreated: ${new Date(
// //               c.created_at
// //             ).toLocaleString()}\n\n` +
// //             `Generate a NEW ID card anyway?`
// //         );

// //         if (!again) {
// //           // open existing styled modal
// //           openModalWith(c);
// //           return;
// //         }

// //         try {
// //           const res2 = await idCardsService.generate(payload, { force: true });
// //           openModalWith(res2.card);
// //         } catch (err2) {
// //           console.error(err2);
// //           alert(err2.message || "Failed to generate coach ID card");
// //         }
// //       } else {
// //         console.error(e);
// //         alert(e.message || "Failed to generate coach ID card");
// //       }
// //     }
// //   };

// //   if (!coach) return null;

// //   const photoSrc = buildPhotoSrc(coach.photo_url);

// //   return (
// //     <>
// //       <Card className="border-0 shadow-sm">
// //         <Card.Header className="d-flex justify-content-between align-items-center">
// //           <div className="d-flex align-items-center">
// //             <div
// //               className="rounded me-2"
// //               style={{
// //                 width: 56,
// //                 height: 56,
// //                 overflow: "hidden",
// //                 background: "#eee",
// //               }}
// //             >
// //               {photoSrc ? (
// //                 <img
// //                   src={photoSrc}
// //                   alt="coach"
// //                   style={{
// //                     width: "100%",
// //                     height: "100%",
// //                     objectFit: "cover",
// //                   }}
// //                   onError={(e) => (e.currentTarget.style.display = "none")}
// //                 />
// //               ) : (
// //                 <span
// //                   className="d-block text-center"
// //                   style={{ lineHeight: "56px" }}
// //                 >
// //                   👤
// //                 </span>
// //               )}
// //             </div>

// //             <div>
// //               <h6 className="mb-0">{coach.full_name}</h6>
// //               <small className="text-muted">{coach.specialties}</small>
// //             </div>
// //           </div>

// //           <Badge bg={coach.status === "Active" ? "success" : "secondary"}>
// //             {coach.status}
// //           </Badge>
// //         </Card.Header>

// //         <Card.Body>
// //           <div className="mb-2">
// //             <strong>Experience:</strong> {coach.experience_years ?? "—"} years
// //           </div>

// //           {coach.certifications && (
// //             <div className="mb-2">
// //               <strong>Certifications:</strong> {coach.certifications}
// //             </div>
// //           )}

// //           {coach.hourly_rate != null && (
// //             <div className="mb-3">
// //               <strong>Rate:</strong> $
// //               {Number(coach.hourly_rate).toFixed(2)}/hr
// //             </div>
// //           )}

// //           <div className="d-flex justify-content-between align-items-center mb-2">
// //             <h6 className="mb-0">Assigned Members</h6>

// //             <div>
// //               <Button
// //                 size="sm"
// //                 className="me-2"
// //                 variant="outline-success"
// //                 onClick={handleGenerateIdCard}
// //               >
// //                 Generate ID Card
// //               </Button>

// //               <Button
// //                 size="sm"
// //                 variant="outline-primary"
// //                 onClick={onAssignClick}
// //               >
// //                 Assign to Member
// //               </Button>
// //             </div>
// //           </div>

// //           {/* ✅ same assignment table (working) */}
// //           <Table size="sm" hover>
// //             <thead>
// //               <tr>
// //                 <th>Member ID</th>
// //                 <th>Member Name</th>
// //                 <th>Start Date</th>
// //                 <th>Status</th>
// //               </tr>
// //             </thead>

// //             <tbody>
// //               {assignments.map((a) => (
// //                 <tr key={a.assignment_id}>
// //                   <td>{a.member_id}</td>
// //                   <td>{a.member_name}</td>
// //                   <td>{a.start_date?.slice(0, 10)}</td>
// //                   <td>
// //                     <Badge bg={a.status === "Active" ? "success" : "secondary"}>
// //                       {a.status}
// //                     </Badge>
// //                   </td>
// //                 </tr>
// //               ))}

// //               {assignments.length === 0 && (
// //                 <tr>
// //                   <td colSpan={4} className="text-muted">
// //                     No assignments
// //                   </td>
// //                 </tr>
// //               )}
// //             </tbody>
// //           </Table>
// //         </Card.Body>
// //       </Card>

// //       {/* ✅ Styled horizontal modal with QR + PDF + both faces image download */}
// //       <IdCardModal
// //         show={showCard}
// //         onHide={() => setShowCard(false)}
// //         card={activeCard}
// //       />
// //     </>
// //   );
// // }
// // Front_end/snp/src/components/gym/ProfileCoach.js

// import React, { useEffect, useState } from "react";
// import { Card, Badge, Button, Table } from "react-bootstrap";
// import assignmentsService from "../../services/assignmentsService";
// import idCardsService from "../../services/idCardsService";
// import IdCardModal from "./IdCardModal"; // ✅ SAME modal used in members

// export default function ProfileCoach({ coach, onAssignClick, refreshKey }) {
//   const [assignments, setAssignments] = useState([]);

//   // ✅ ID card modal state (same as members)
//   const [showCard, setShowCard] = useState(false);
//   const [activeCard, setActiveCard] = useState(null);

//   const openModalWith = (card) => {
//     setActiveCard(card || null);
//     setShowCard(true);
//   };

//   // ✅ same safe helper used in members
//   const buildPhotoSrc = (raw) => {
//     if (!raw || String(raw).trim() === "") return null;
//     const v = String(raw);
//     if (v.startsWith("http") || v.startsWith("data:")) return v;
//     return `http://localhost:5000/${v.replace(/^\/+/, "")}`;
//   };

//   // ✅ Function to load assignments
//   const loadAssignments = async () => {
//     try {
//       let rows;

//       // support both service names so nothing breaks
//       if (typeof assignmentsService.byCoach === "function") {
//         rows = await assignmentsService.byCoach(coach.coach_id);
//       } else if (typeof assignmentsService.listByCoach === "function") {
//         rows = await assignmentsService.listByCoach(coach.coach_id);
//       } else {
//         rows = [];
//       }

//       const normalized = Array.isArray(rows)
//         ? rows
//         : rows?.assignments || rows?.rows || [];

//       setAssignments(normalized);
//     } catch (e) {
//       console.error("load assignments error:", e);
//       setAssignments([]);
//     }
//   };

//   // ✅ load assignments for this coach
//   useEffect(() => {
//     if (!coach?.coach_id) {
//       setAssignments([]);
//       return;
//     }

//     loadAssignments();
//   }, [coach, refreshKey]); // ✅ ADD: refreshKey triggers re-fetch

//   // ✅ Generate coach ID card using SAME flow as members
//   const handleGenerateIdCard = async () => {
//     if (!coach?.coach_id) return;

//     const payload = {
//       role: "coach",
//       coach_id: coach.coach_id,
//       color: "#3b2a88",
//       template: "verticalB", // DB template only
//     };

//     try {
//       const res = await idCardsService.generate(payload, { force: false });
//       openModalWith(res.card);
//     } catch (e) {
//       if (e.code === "ALREADY_EXISTS" && e.card) {
//         const c = e.card;

//         const again = window.confirm(
//           `This coach already has an ID card.\n` +
//             `Existing ID: ${c.sub_id}\nCreated: ${new Date(
//               c.created_at
//             ).toLocaleString()}\n\n` +
//             `Generate a NEW ID card anyway?`
//         );

//         if (!again) {
//           // open existing styled modal
//           openModalWith(c);
//           return;
//         }

//         try {
//           const res2 = await idCardsService.generate(payload, { force: true });
//           openModalWith(res2.card);
//         } catch (err2) {
//           console.error(err2);
//           alert(err2.message || "Failed to generate coach ID card");
//         }
//       } else {
//         console.error(e);
//         alert(e.message || "Failed to generate coach ID card");
//       }
//     }
//   };

//   // ✅ Unassign member from coach
//   const handleUnassign = async (assignmentId) => {
//     if (!window.confirm("Unassign this member from the coach?")) return;

//     try {
//       await assignmentsService.endAssignment({ assignment_id: assignmentId });
//       await loadAssignments(); // re-fetch table
//     } catch (e) {
//       console.error(e);
//       alert("Failed to unassign");
//     }
//   };

//   if (!coach) return null;

//   const photoSrc = buildPhotoSrc(coach.photo_url);

//   return (
//     <>
//       <Card className="border-0 shadow-sm">
//         <Card.Header className="d-flex justify-content-between align-items-center">
//           <div className="d-flex align-items-center">
//             <div
//               className="rounded me-2"
//               style={{
//                 width: 56,
//                 height: 56,
//                 overflow: "hidden",
//                 background: "#eee",
//               }}
//             >
//               {photoSrc ? (
//                 <img
//                   src={photoSrc}
//                   alt="coach"
//                   style={{
//                     width: "100%",
//                     height: "100%",
//                     objectFit: "cover",
//                   }}
//                   onError={(e) => (e.currentTarget.style.display = "none")}
//                 />
//               ) : (
//                 <span
//                   className="d-block text-center"
//                   style={{ lineHeight: "56px" }}
//                 >
//                   👤
//                 </span>
//               )}
//             </div>

//             <div>
//               <h6 className="mb-0">{coach.full_name}</h6>
//               <small className="text-muted">{coach.specialties}</small>
//             </div>
//           </div>

//           <Badge bg={coach.status === "Active" ? "success" : "secondary"}>
//             {coach.status}
//           </Badge>
//         </Card.Header>

//         <Card.Body>
//           <div className="mb-2">
//             <strong>Experience:</strong> {coach.experience_years ?? "—"} years
//           </div>

//           {coach.certifications && (
//             <div className="mb-2">
//               <strong>Certifications:</strong> {coach.certifications}
//             </div>
//           )}

//           {coach.hourly_rate != null && (
//             <div className="mb-3">
//               <strong>Rate:</strong> $
//               {Number(coach.hourly_rate).toFixed(2)}/hr
//             </div>
//           )}

//           <div className="d-flex justify-content-between align-items-center mb-2">
//             <h6 className="mb-0">Assigned Members</h6>

//             <div>
//               <Button
//                 size="sm"
//                 className="me-2"
//                 variant="outline-success"
//                 onClick={handleGenerateIdCard}
//               >
//                 Generate ID Card
//               </Button>

//               <Button
//                 size="sm"
//                 variant="outline-primary"
//                 onClick={onAssignClick}
//               >
//                 Assign to Member
//               </Button>
//             </div>
//           </div>

//           {/* ✅ Assignment table with Unassign button */}
//           <Table size="sm" hover>
//             <thead>
//               <tr>
//                 <th>Member ID</th>
//                 <th>Member Name</th>
//                 <th>Start Date</th>
//                 <th>Status</th>
//                 <th>Action</th> {/* ✅ Added Action column */}
//               </tr>
//             </thead>

//             <tbody>
//               {assignments.map((a) => (
//                 <tr key={a.assignment_id}>
//                   <td>{a.member_id}</td>
//                   <td>{a.member_name}</td>
//                   <td>{a.start_date?.slice(0, 10)}</td>
//                   <td>
//                     <Badge bg={a.status === "Active" ? "success" : "secondary"}>
//                       {a.status}
//                     </Badge>
//                   </td>
//                   <td>
//                     {a.status === "Active" ? (
//                       <Button
//                         size="sm"
//                         variant="outline-danger"
//                         onClick={() => handleUnassign(a.assignment_id)}
//                       >
//                         Unassign
//                       </Button>
//                     ) : (
//                       <span className="text-muted">—</span>
//                     )}
//                   </td>
//                 </tr>
//               ))}

//               {assignments.length === 0 && (
//                 <tr>
//                   <td colSpan={5} className="text-muted">
//                     No assignments
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </Table>
//         </Card.Body>
//       </Card>

//       {/* ✅ Styled horizontal modal with QR + PDF + both faces image download */}
//       <IdCardModal
//         show={showCard}
//         onHide={() => setShowCard(false)}
//         card={activeCard}
//       />
//     </>
//   );
// }
// Front_end/snp/src/components/gym/ProfileCoach.js
import React, { useEffect, useState } from "react";
import { Card, Badge, Button, Table, Row, Col } from "react-bootstrap";
import assignmentsService from "../../services/assignmentsService";
import idCardsService from "../../services/idCardsService";
import IdCardModal from "./IdCardModal";
import { FaIdCard, FaUserPlus, FaAward, FaMoneyBillWave, FaCalendarAlt, FaTrash } from "react-icons/fa";
import "./gym_Style.css";

export default function ProfileCoach({ coach, onAssignClick, refreshKey }) {
  const [assignments, setAssignments] = useState([]);
  const [showCard, setShowCard] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [loading, setLoading] = useState(false);

  const openModalWith = (card) => {
    setActiveCard(card || null);
    setShowCard(true);
  };

  const buildPhotoSrc = (raw) => {
    if (!raw || String(raw).trim() === "") return null;
    const v = String(raw);
    if (v.startsWith("http") || v.startsWith("data:")) return v;
    return `http://localhost:5000/${v.replace(/^\/+/, "")}`;
  };

  // Load assignments - FIXED: Shows ALL assignments (active and inactive)
  const loadAssignments = async () => {
    setLoading(true);
    try {
      let rows;
      if (typeof assignmentsService.byCoach === "function") {
        rows = await assignmentsService.byCoach(coach.coach_id);
      } else if (typeof assignmentsService.listByCoach === "function") {
        rows = await assignmentsService.listByCoach(coach.coach_id);
      } else {
        rows = [];
      }

      const normalized = Array.isArray(rows)
        ? rows
        : rows?.assignments || rows?.rows || [];

      setAssignments(normalized);
    } catch (e) {
      console.error("load assignments error:", e);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!coach?.coach_id) {
      setAssignments([]);
      return;
    }
    loadAssignments();
  }, [coach, refreshKey]);

  const handleGenerateIdCard = async () => {
    if (!coach?.coach_id) return;

    const payload = {
      role: "coach",
      coach_id: coach.coach_id,
      color: "#4a6bff",
      template: "verticalB",
    };

    try {
      const res = await idCardsService.generate(payload, { force: false });
      openModalWith(res.card);
    } catch (e) {
      if (e.code === "ALREADY_EXISTS" && e.card) {
        const c = e.card;
        const again = window.confirm(
          `This coach already has an ID card.\n` +
            `Existing ID: ${c.sub_id}\nCreated: ${new Date(c.created_at).toLocaleString()}\n\n` +
            `Generate a NEW ID card anyway?`
        );
        if (!again) {
          openModalWith(c);
          return;
        }
        try {
          const res2 = await idCardsService.generate(payload, { force: true });
          openModalWith(res2.card);
        } catch (err2) {
          console.error(err2);
          alert(err2.message || "Failed to generate coach ID card");
        }
      } else {
        console.error(e);
        alert(e.message || "Failed to generate coach ID card");
      }
    }
  };

  const handleUnassign = async (assignmentId) => {
    if (!window.confirm("Unassign this member from the coach?")) return;
    try {
      await assignmentsService.endAssignment({ assignment_id: assignmentId });
      await loadAssignments();
    } catch (e) {
      console.error(e);
      alert("Failed to unassign");
    }
  };

  if (!coach) return null;

  const photoSrc = buildPhotoSrc(coach.photo_url);
  const activeAssignments = assignments.filter(a => a.status === "Active").length;
  const totalAssignments = assignments.length;

  return (
    <>
      <Card className="border-0 shadow-sm">
        {/* Coach Info */}
        <Card.Header className="d-flex justify-content-between align-items-center bg-white">
          <div className="d-flex align-items-center">
            <div className="me-3">
              <div className="rounded-circle" style={{ width: 70, height: 70, overflow: "hidden", background: '#f0f0f0' }}>
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt="coach"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-primary">
                    <FaIdCard className="text-white" size={30} />
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="mb-1">{coach.full_name}</h4>
              <div className="d-flex align-items-center">
                <Badge bg={coach.status === "Active" ? "success" : "secondary"} className="me-2">
                  {coach.status}
                </Badge>
                <small className="text-muted">
                  {activeAssignments} active assignments
                </small>
              </div>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Quick Stats */}
          <Row className="mb-4">
            <Col xs={6} md={3} className="mb-3">
              <div className="text-center">
                <div className="fs-5 fw-bold">{coach.experience_years || "0"}</div>
                <small className="text-muted">Years Experience</small>
              </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
              <div className="text-center">
                <div className="fs-5 fw-bold text-success">
                  ${coach.hourly_rate ? Number(coach.hourly_rate).toFixed(2) : "0.00"}
                </div>
                <small className="text-muted">Hourly Rate</small>
              </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
              <div className="text-center">
                <div className="fs-5 fw-bold">{totalAssignments}</div>
                <small className="text-muted">Total Assignments</small>
              </div>
            </Col>
            <Col xs={6} md={3} className="mb-3">
              <div className="text-center">
                <div className="fs-5 fw-bold">{activeAssignments}</div>
                <small className="text-muted">Active</small>
              </div>
            </Col>
          </Row>

          {/* Details */}
          <div className="mb-4">
            <h6 className="border-bottom pb-2 mb-3">Details</h6>
            <Row>
              <Col md={6}>
                <div className="mb-2">
                  <strong>Specialties:</strong> {coach.specialties || "—"}
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-2">
                  <strong>Certifications:</strong> {coach.certifications || "—"}
                </div>
              </Col>
            </Row>
          </div>

          {/* Actions */}
          <div className="d-flex justify-content-between mb-4">
            <Button
              variant="outline-success"
              onClick={handleGenerateIdCard}
              className="d-flex align-items-center"
            >
              <FaIdCard className="me-2" />
              Generate ID Card
            </Button>
            <Button
              variant="outline-primary"
              onClick={onAssignClick}
              className="d-flex align-items-center"
            >
              <FaUserPlus className="me-2" />
              Assign to Member
            </Button>
          </div>

          {/* Assignments Table - Shows ALL assignments */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Assigned Members ({assignments.length})</h6>
              <small className="text-muted">
                Showing {activeAssignments} active of {totalAssignments} total
              </small>
            </div>

            <div className="table-responsive">
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>Member ID</th>
                    <th>Member Name</th>
                    <th>Start Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : assignments.length > 0 ? (
                    assignments.map((a) => (
                      <tr key={a.assignment_id}>
                        <td>{a.member_id}</td>
                        <td>{a.member_name}</td>
                        <td>{a.start_date?.slice(0, 10) || "—"}</td>
                        <td>
                          <Badge bg={a.status === "Active" ? "success" : "secondary"}>
                            {a.status}
                          </Badge>
                        </td>
                        <td>
                          {a.status === "Active" ? (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleUnassign(a.assignment_id)}
                            >
                              <FaTrash size={12} />
                            </Button>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        No members assigned yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </Card.Body>
      </Card>

      <IdCardModal
        show={showCard}
        onHide={() => setShowCard(false)}
        card={activeCard}
      />
    </>
  );
}