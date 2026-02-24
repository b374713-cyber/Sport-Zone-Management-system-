// // // import React, { useEffect, useState, useMemo } from "react";
// // // import { Card, Badge, Button, Table } from "react-bootstrap";

// // // // ✅ corrected paths (services are in src/services)
// // // import assignmentsService from "../../services/assignmentsService";
// // // import idCardsService from "../../services/idCardsService";

// // // import IdCardModal from "./IdCardModal";

// // // const ageFrom = (d) => {
// // //   if (!d) return "—";
// // //   const bd = new Date(d);
// // //   const a = new Date(Date.now() - bd.getTime()).getUTCFullYear() - 1970;
// // //   return a;
// // // };

// // // export default function ProfileMember({ member, onAssignClick }) {
// // //   const [assignments, setAssignments] = useState([]);
// // //   const [showCard, setShowCard] = useState(false);
// // //   const [activeCard, setActiveCard] = useState(null);

// // //   // ✅ HOOK MUST BE BEFORE ANY RETURN
// // //   const photoSrc = useMemo(() => {
// // //     const raw =
// // //       member?.photo_url ||
// // //       member?.photo ||
// // //       member?.image_url ||
// // //       member?.member_photo_url;

// // //     if (!raw) return null;
// // //     if (raw.startsWith("http")) return raw;

// // //     return `http://localhost:5000/${raw.replace(/^\/+/, "")}`;
// // //   }, [member]);

// // //   useEffect(() => {
// // //     const loadAssignments = async () => {
// // //       try {
// // //         const rows = await assignmentsService.byMember(member.member_id);
// // //         setAssignments(rows || []);
// // //       } catch (err) {
// // //         console.error("Failed to load assignments:", err);
// // //         setAssignments([]);
// // //       }
// // //     };

// // //     if (member?.member_id) loadAssignments();
// // //   }, [member]);

// // //   const openModalWith = (card) => {
// // //     setActiveCard(card);
// // //     setShowCard(true);
// // //   };

// // //   const handleGenerateIdCard = async () => {
// // //     const payload = {
// // //       role: "member",
// // //       member_id: member.member_id,
// // //       color: "#146b57",
// // //       template: "verticalA",
// // //     };

// // //     try {
// // //       const res = await idCardsService.generate(payload, { force: false });
// // //       openModalWith(res.card);
// // //     } catch (e) {
// // //       if (e.code === "ALREADY_EXISTS" && e.card) {
// // //         const c = e.card;

// // //         const again = window.confirm(
// // //           `This member already has an ID card.\n` +
// // //             `Existing ID: ${c.sub_id}\nCreated: ${new Date(
// // //               c.created_at
// // //             ).toLocaleString()}\n\n` +
// // //             `Generate a NEW ID card anyway?`
// // //         );

// // //         if (!again) {
// // //           openModalWith(c);
// // //           return;
// // //         }

// // //         try {
// // //           const res2 = await idCardsService.generate(payload, { force: true });
// // //           openModalWith(res2.card);
// // //         } catch (err2) {
// // //           console.error(err2);
// // //           alert(err2.message || "Failed to generate ID card");
// // //         }
// // //       } else {
// // //         console.error(e);
// // //         alert(e.message || "Failed to generate ID card");
// // //       }
// // //     }
// // //   };

// // //   if (!member) return null;

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
// // //                   alt=""
// // //                   style={{ width: "100%", height: "100%", objectFit: "cover" }}
// // //                   onError={(e) => {
// // //                     e.currentTarget.style.display = "none";
// // //                   }}
// // //                 />
// // //               ) : (
// // //                 <span
// // //                   className="d-block text-center"
// // //                   style={{ lineHeight: "56px" }}
// // //                 >
// // //                   🙂
// // //                 </span>
// // //               )}
// // //             </div>

// // //             <div>
// // //               <h6 className="mb-0">{member.full_name}</h6>
// // //               <small className="text-muted">
// // //                 {member.phone || member.email || ""}
// // //               </small>
// // //             </div>
// // //           </div>

// // //           <Badge bg={member.status === "Active" ? "primary" : "secondary"}>
// // //             {member.status}
// // //           </Badge>
// // //         </Card.Header>

// // //         <Card.Body>
// // //           <div className="row g-2 mb-3">
// // //             <div className="col-6">
// // //               <strong>Age:</strong> {ageFrom(member.birth_date)}
// // //             </div>
// // //             <div className="col-6">
// // //               <strong>Gender:</strong> {member.gender || "—"}
// // //             </div>
// // //             <div className="col-6">
// // //               <strong>Height:</strong>{" "}
// // //               {member.height_cm != null ? `${member.height_cm} cm` : "—"}
// // //             </div>
// // //             <div className="col-6">
// // //               <strong>Weight:</strong>{" "}
// // //               {member.weight_kg != null ? `${member.weight_kg} kg` : "—"}
// // //             </div>
// // //           </div>

// // //           <div className="d-flex justify-content-between align-items-center mt-1 mb-2">
// // //             <h6 className="mb-0">Coach History</h6>

// // //             <div>
// // //               <Button
// // //                 size="sm"
// // //                 className="me-2"
// // //                 variant="outline-success"
// // //                 onClick={handleGenerateIdCard}
// // //               >
// // //                 Generate ID Card
// // //               </Button>

// // //               {onAssignClick && (
// // //                 <Button
// // //                   size="sm"
// // //                   variant="outline-primary"
// // //                   onClick={onAssignClick}
// // //                 >
// // //                   Assign Coach
// // //                 </Button>
// // //               )}
// // //             </div>
// // //           </div>

// // //           <Table size="sm" hover>
// // //             <thead>
// // //               <tr>
// // //                 <th>Coach ID</th>
// // //                 <th>Coach Name</th>
// // //                 <th>Specialty</th>
// // //                 <th>Start Date</th>
// // //                 <th>Status</th>
// // //               </tr>
// // //             </thead>

// // //             <tbody>
// // //               {assignments.map((a) => (
// // //                 <tr key={a.assignment_id}>
// // //                   <td>{a.coach_id}</td>
// // //                   <td>{a.coach_name}</td>
// // //                   <td>{a.specialties}</td>
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
// // //                   <td colSpan={5} className="text-muted">
// // //                     No assignments
// // //                   </td>
// // //                 </tr>
// // //               )}
// // //             </tbody>
// // //           </Table>
// // //         </Card.Body>
// // //       </Card>

// // //       <IdCardModal
// // //         show={showCard}
// // //         onHide={() => setShowCard(false)}
// // //         card={activeCard}
// // //       />
// // //     </>
// // //   );
// // // }
// // import React, { useEffect, useState, useMemo } from "react";
// // import { Card, Badge, Button, Table } from "react-bootstrap";

// // // ✅ corrected paths (services are in src/services)
// // import assignmentsService from "../../services/assignmentsService";
// // import idCardsService from "../../services/idCardsService";

// // import IdCardModal from "./IdCardModal";

// // const ageFrom = (d) => {
// //   if (!d) return "—";
// //   const bd = new Date(d);
// //   const a = new Date(Date.now() - bd.getTime()).getUTCFullYear() - 1970;
// //   return a;
// // };

// // export default function ProfileMember({ member, onAssignClick, refreshKey }) {
// //   const [assignments, setAssignments] = useState([]);
// //   const [showCard, setShowCard] = useState(false);
// //   const [activeCard, setActiveCard] = useState(null);

// //   // ✅ HOOK MUST BE BEFORE ANY RETURN
// //   const photoSrc = useMemo(() => {
// //     const raw =
// //       member?.photo_url ||
// //       member?.photo ||
// //       member?.image_url ||
// //       member?.member_photo_url;

// //     if (!raw) return null;
// //     if (raw.startsWith("http")) return raw;

// //     return `http://localhost:5000/${raw.replace(/^\/+/, "")}`;
// //   }, [member]);

// //   // ✅ ADD refreshKey to dependency array
// //   useEffect(() => {
// //     const loadAssignments = async () => {
// //       try {
// //         const rows = await assignmentsService.byMember(member.member_id);
// //         setAssignments(rows || []);
// //       } catch (err) {
// //         console.error("Failed to load assignments:", err);
// //         setAssignments([]);
// //       }
// //     };

// //     if (member?.member_id) loadAssignments();
// //   }, [member, refreshKey]); // ✅ ADD: refreshKey triggers re-fetch

// //   const openModalWith = (card) => {
// //     setActiveCard(card);
// //     setShowCard(true);
// //   };

// //   const handleGenerateIdCard = async () => {
// //     const payload = {
// //       role: "member",
// //       member_id: member.member_id,
// //       color: "#146b57",
// //       template: "verticalA",
// //     };

// //     try {
// //       const res = await idCardsService.generate(payload, { force: false });
// //       openModalWith(res.card);
// //     } catch (e) {
// //       if (e.code === "ALREADY_EXISTS" && e.card) {
// //         const c = e.card;

// //         const again = window.confirm(
// //           `This member already has an ID card.\n` +
// //             `Existing ID: ${c.sub_id}\nCreated: ${new Date(
// //               c.created_at
// //             ).toLocaleString()}\n\n` +
// //             `Generate a NEW ID card anyway?`
// //         );

// //         if (!again) {
// //           openModalWith(c);
// //           return;
// //         }

// //         try {
// //           const res2 = await idCardsService.generate(payload, { force: true });
// //           openModalWith(res2.card);
// //         } catch (err2) {
// //           console.error(err2);
// //           alert(err2.message || "Failed to generate ID card");
// //         }
// //       } else {
// //         console.error(e);
// //         alert(e.message || "Failed to generate ID card");
// //       }
// //     }
// //   };

// //   if (!member) return null;

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
// //                   alt=""
// //                   style={{ width: "100%", height: "100%", objectFit: "cover" }}
// //                   onError={(e) => {
// //                     e.currentTarget.style.display = "none";
// //                   }}
// //                 />
// //               ) : (
// //                 <span
// //                   className="d-block text-center"
// //                   style={{ lineHeight: "56px" }}
// //                 >
// //                   🙂
// //                 </span>
// //               )}
// //             </div>

// //             <div>
// //               <h6 className="mb-0">{member.full_name}</h6>
// //               <small className="text-muted">
// //                 {member.phone || member.email || ""}
// //               </small>
// //             </div>
// //           </div>

// //           <Badge bg={member.status === "Active" ? "primary" : "secondary"}>
// //             {member.status}
// //           </Badge>
// //         </Card.Header>

// //         <Card.Body>
// //           <div className="row g-2 mb-3">
// //             <div className="col-6">
// //               <strong>Age:</strong> {ageFrom(member.birth_date)}
// //             </div>
// //             <div className="col-6">
// //               <strong>Gender:</strong> {member.gender || "—"}
// //             </div>
// //             <div className="col-6">
// //               <strong>Height:</strong>{" "}
// //               {member.height_cm != null ? `${member.height_cm} cm` : "—"}
// //             </div>
// //             <div className="col-6">
// //               <strong>Weight:</strong>{" "}
// //               {member.weight_kg != null ? `${member.weight_kg} kg` : "—"}
// //             </div>
// //           </div>

// //           <div className="d-flex justify-content-between align-items-center mt-1 mb-2">
// //             <h6 className="mb-0">Coach History</h6>

// //             <div>
// //               <Button
// //                 size="sm"
// //                 className="me-2"
// //                 variant="outline-success"
// //                 onClick={handleGenerateIdCard}
// //               >
// //                 Generate ID Card
// //               </Button>

// //               {onAssignClick && (
// //                 <Button
// //                   size="sm"
// //                   variant="outline-primary"
// //                   onClick={onAssignClick}
// //                 >
// //                   Assign Coach
// //                 </Button>
// //               )}
// //             </div>
// //           </div>

// //           <Table size="sm" hover>
// //             <thead>
// //               <tr>
// //                 <th>Coach ID</th>
// //                 <th>Coach Name</th>
// //                 <th>Specialty</th>
// //                 <th>Start Date</th>
// //                 <th>Status</th>
// //               </tr>
// //             </thead>

// //             <tbody>
// //               {assignments.map((a) => (
// //                 <tr key={a.assignment_id}>
// //                   <td>{a.coach_id}</td>
// //                   <td>{a.coach_name}</td>
// //                   <td>{a.specialties}</td>
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
// //                   <td colSpan={5} className="text-muted">
// //                     No assignments
// //                   </td>
// //                 </tr>
// //               )}
// //             </tbody>
// //           </Table>
// //         </Card.Body>
// //       </Card>

// //       <IdCardModal
// //         show={showCard}
// //         onHide={() => setShowCard(false)}
// //         card={activeCard}
// //       />
// //     </>
// //   );
// // }
// import React, { useEffect, useState, useMemo } from "react";
// import { Card, Badge, Button, Table } from "react-bootstrap";

// // ✅ corrected paths (services are in src/services)
// import assignmentsService from "../../services/assignmentsService";
// import idCardsService from "../../services/idCardsService";

// import IdCardModal from "./IdCardModal";

// const ageFrom = (d) => {
//   if (!d) return "—";
//   const bd = new Date(d);
//   const a = new Date(Date.now() - bd.getTime()).getUTCFullYear() - 1970;
//   return a;
// };

// export default function ProfileMember({ member, onAssignClick, refreshKey }) {
//   const [assignments, setAssignments] = useState([]);
//   const [showCard, setShowCard] = useState(false);
//   const [activeCard, setActiveCard] = useState(null);

//   // ✅ HOOK MUST BE BEFORE ANY RETURN
//   const photoSrc = useMemo(() => {
//     const raw =
//       member?.photo_url ||
//       member?.photo ||
//       member?.image_url ||
//       member?.member_photo_url;

//     if (!raw) return null;
//     if (raw.startsWith("http")) return raw;

//     return `http://localhost:5000/${raw.replace(/^\/+/, "")}`;
//   }, [member]);

//   // ✅ Function to load assignments
//   const loadAssignments = async () => {
//     try {
//       const rows = await assignmentsService.byMember(member.member_id);
//       setAssignments(rows || []);
//     } catch (err) {
//       console.error("Failed to load assignments:", err);
//       setAssignments([]);
//     }
//   };

//   // ✅ ADD refreshKey to dependency array
//   useEffect(() => {
//     if (member?.member_id) loadAssignments();
//   }, [member, refreshKey]); // ✅ ADD: refreshKey triggers re-fetch

//   const openModalWith = (card) => {
//     setActiveCard(card);
//     setShowCard(true);
//   };

//   const handleGenerateIdCard = async () => {
//     const payload = {
//       role: "member",
//       member_id: member.member_id,
//       color: "#146b57",
//       template: "verticalA",
//     };

//     try {
//       const res = await idCardsService.generate(payload, { force: false });
//       openModalWith(res.card);
//     } catch (e) {
//       if (e.code === "ALREADY_EXISTS" && e.card) {
//         const c = e.card;

//         const again = window.confirm(
//           `This member already has an ID card.\n` +
//             `Existing ID: ${c.sub_id}\nCreated: ${new Date(
//               c.created_at
//             ).toLocaleString()}\n\n` +
//             `Generate a NEW ID card anyway?`
//         );

//         if (!again) {
//           openModalWith(c);
//           return;
//         }

//         try {
//           const res2 = await idCardsService.generate(payload, { force: true });
//           openModalWith(res2.card);
//         } catch (err2) {
//           console.error(err2);
//           alert(err2.message || "Failed to generate ID card");
//         }
//       } else {
//         console.error(e);
//         alert(e.message || "Failed to generate ID card");
//       }
//     }
//   };

//   // ✅ Unassign coach from member
//   const handleUnassign = async (assignmentId) => {
//     if (!window.confirm("Unassign this coach from the member?")) return;

//     try {
//       await assignmentsService.endAssignment({ assignment_id: assignmentId });
//       await loadAssignments(); // refresh coach history
//     } catch (e) {
//       console.error(e);
//       alert("Failed to unassign");
//     }
//   };

//   if (!member) return null;

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
//                   alt=""
//                   style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                   onError={(e) => {
//                     e.currentTarget.style.display = "none";
//                   }}
//                 />
//               ) : (
//                 <span
//                   className="d-block text-center"
//                   style={{ lineHeight: "56px" }}
//                 >
//                   🙂
//                 </span>
//               )}
//             </div>

//             <div>
//               <h6 className="mb-0">{member.full_name}</h6>
//               <small className="text-muted">
//                 {member.phone || member.email || ""}
//               </small>
//             </div>
//           </div>

//           <Badge bg={member.status === "Active" ? "primary" : "secondary"}>
//             {member.status}
//           </Badge>
//         </Card.Header>

//         <Card.Body>
//           <div className="row g-2 mb-3">
//             <div className="col-6">
//               <strong>Age:</strong> {ageFrom(member.birth_date)}
//             </div>
//             <div className="col-6">
//               <strong>Gender:</strong> {member.gender || "—"}
//             </div>
//             <div className="col-6">
//               <strong>Height:</strong>{" "}
//               {member.height_cm != null ? `${member.height_cm} cm` : "—"}
//             </div>
//             <div className="col-6">
//               <strong>Weight:</strong>{" "}
//               {member.weight_kg != null ? `${member.weight_kg} kg` : "—"}
//             </div>
//           </div>

//           <div className="d-flex justify-content-between align-items-center mt-1 mb-2">
//             <h6 className="mb-0">Coach History</h6>

//             <div>
//               <Button
//                 size="sm"
//                 className="me-2"
//                 variant="outline-success"
//                 onClick={handleGenerateIdCard}
//               >
//                 Generate ID Card
//               </Button>

//               {onAssignClick && (
//                 <Button
//                   size="sm"
//                   variant="outline-primary"
//                   onClick={onAssignClick}
//                 >
//                   Assign Coach
//                 </Button>
//               )}
//             </div>
//           </div>

//           <Table size="sm" hover>
//             <thead>
//               <tr>
//                 <th>Coach ID</th>
//                 <th>Coach Name</th>
//                 <th>Specialty</th>
//                 <th>Start Date</th>
//                 <th>Status</th>
//                 <th>Action</th> {/* ✅ Added Action column */}
//               </tr>
//             </thead>

//             <tbody>
//               {assignments.map((a) => (
//                 <tr key={a.assignment_id}>
//                   <td>{a.coach_id}</td>
//                   <td>{a.coach_name}</td>
//                   <td>{a.specialties || a.specialty || "—"}</td>
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
//                   <td colSpan={6} className="text-muted">
//                     No coach history
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </Table>
//         </Card.Body>
//       </Card>

//       <IdCardModal
//         show={showCard}
//         onHide={() => setShowCard(false)}
//         card={activeCard}
//       />
//     </>
//   );
// }
// Front_end/snp/src/components/gym/ProfileMember.js
import React, { useEffect, useState, useMemo } from "react";
import { Card, Badge, Button, Table, Row, Col } from "react-bootstrap";
import assignmentsService from "../../services/assignmentsService";
import idCardsService from "../../services/idCardsService";
import IdCardModal from "./IdCardModal";
import { FaIdCard, FaUserPlus, FaPhone, FaEnvelope, FaCalendarAlt, FaTrash } from "react-icons/fa";
import "./gym_Style.css";

const ageFrom = (d) => {
  if (!d) return "—";
  const bd = new Date(d);
  const a = new Date(Date.now() - bd.getTime()).getUTCFullYear() - 1970;
  return a;
};

export default function ProfileMember({ member, onAssignClick, refreshKey }) {
  const [assignments, setAssignments] = useState([]);
  const [showCard, setShowCard] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [loading, setLoading] = useState(false);

  const photoSrc = useMemo(() => {
    const raw = member?.photo_url || member?.photo || member?.image_url || member?.member_photo_url;
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    return `http://localhost:5000/${raw.replace(/^\/+/, "")}`;
  }, [member]);

  // Load assignments - FIXED: Shows ALL assignments
  const loadAssignments = async () => {
    setLoading(true);
    try {
      const rows = await assignmentsService.byMember(member.member_id);
      setAssignments(rows || []);
    } catch (err) {
      console.error("Failed to load assignments:", err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (member?.member_id) loadAssignments();
  }, [member, refreshKey]);

  const openModalWith = (card) => {
    setActiveCard(card);
    setShowCard(true);
  };

  const handleGenerateIdCard = async () => {
    const payload = {
      role: "member",
      member_id: member.member_id,
      color: "#00c9a7",
      template: "verticalA",
    };

    try {
      const res = await idCardsService.generate(payload, { force: false });
      openModalWith(res.card);
    } catch (e) {
      if (e.code === "ALREADY_EXISTS" && e.card) {
        const c = e.card;
        const again = window.confirm(
          `This member already has an ID card.\n` +
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
          alert(err2.message || "Failed to generate ID card");
        }
      } else {
        console.error(e);
        alert(e.message || "Failed to generate ID card");
      }
    }
  };

  const handleUnassign = async (assignmentId) => {
    if (!window.confirm("Unassign this coach from the member?")) return;
    try {
      await assignmentsService.endAssignment({ assignment_id: assignmentId });
      await loadAssignments();
    } catch (e) {
      console.error(e);
      alert("Failed to unassign");
    }
  };

  if (!member) return null;

  const age = ageFrom(member.birth_date);
  const activeAssignments = assignments.filter(a => a.status === "Active").length;
  const totalAssignments = assignments.length;

  return (
    <>
      <Card className="border-0 shadow-sm">
        {/* Member Info */}
        <Card.Header className="d-flex justify-content-between align-items-center bg-white">
          <div className="d-flex align-items-center">
            <div className="me-3">
              <div className="rounded-circle" style={{ width: 70, height: 70, overflow: "hidden", background: '#f0f0f0' }}>
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-success">
                    <FaIdCard className="text-white" size={30} />
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="mb-1">{member.full_name}</h4>
              <div className="d-flex align-items-center">
                <Badge bg={member.status === "Active" ? "primary" : "secondary"} className="me-2">
                  {member.status}
                </Badge>
                <small className="text-muted">
                  {activeAssignments} active coaches
                </small>
              </div>
            </div>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Contact Info */}
          <div className="mb-4">
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-1">
                    <FaPhone className="me-2 text-muted" />
                    <strong>Phone:</strong>
                  </div>
                  <div>{member.phone || "—"}</div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-1">
                    <FaEnvelope className="me-2 text-muted" />
                    <strong>Email:</strong>
                  </div>
                  <div>{member.email || "—"}</div>
                </div>
              </Col>
            </Row>
          </div>

          {/* Personal Info */}
          <div className="mb-4">
            <h6 className="border-bottom pb-2 mb-3">Personal Information</h6>
            <Row>
              <Col xs={6} className="mb-2">
                <div><strong>Age:</strong> {age}</div>
              </Col>
              <Col xs={6} className="mb-2">
                <div><strong>Gender:</strong> {member.gender || "—"}</div>
              </Col>
              <Col xs={6} className="mb-2">
                <div><strong>Height:</strong> {member.height_cm ? `${member.height_cm} cm` : "—"}</div>
              </Col>
              <Col xs={6} className="mb-2">
                <div><strong>Weight:</strong> {member.weight_kg ? `${member.weight_kg} kg` : "—"}</div>
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
            {onAssignClick && (
              <Button
                variant="outline-primary"
                onClick={onAssignClick}
                className="d-flex align-items-center"
              >
                <FaUserPlus className="me-2" />
                Assign Coach
              </Button>
            )}
          </div>

          {/* Coach History Table - Shows ALL assignments */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Coach History ({assignments.length})</h6>
              <small className="text-muted">
                Showing {activeAssignments} active of {totalAssignments} total
              </small>
            </div>

            <div className="table-responsive">
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>Coach ID</th>
                    <th>Coach Name</th>
                    <th>Specialty</th>
                    <th>Start Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : assignments.length > 0 ? (
                    assignments.map((a) => (
                      <tr key={a.assignment_id}>
                        <td>{a.coach_id}</td>
                        <td>{a.coach_name}</td>
                        <td>{a.specialties || a.specialty || "—"}</td>
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
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No coach history yet
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