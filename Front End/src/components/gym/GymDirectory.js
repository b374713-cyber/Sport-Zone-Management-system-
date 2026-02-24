// // // // Front_end/snp/src/components/gym/GymDirectory.js
// // // import React, { useEffect, useState } from "react";
// // // import { Row, Col, Card, ListGroup, Badge } from "react-bootstrap";
// // // import coachesService from "../../services/coachesService";
// // // import membersService from "../../services/membersService";
// // // import ProfileCoach from "./ProfileCoach";
// // // import ProfileMember from "./ProfileMember";
// // // import AssignCoachModal from "./modals/AssignCoachModal";
// // // import FloatingCoachMore from "./FloatingCoachMore";

// // // const headerGradient = "linear-gradient(90deg, #3b2a88 0%, #146b57 100%)";

// // // export default function GymDirectory() {
// // //   const [coaches, setCoaches] = useState([]);
// // //   const [members, setMembers] = useState([]);
// // //   const [selectedCoach, setSelectedCoach] = useState(null);
// // //   const [selectedMember, setSelectedMember] = useState(null);
// // //   const [showAssign, setShowAssign] = useState(false);

// // //   const load = async () => {
// // //     setCoaches(await coachesService.list());
// // //     setMembers(await membersService.list());
// // //   };

// // //   useEffect(() => {
// // //     load();
// // //   }, []);

// // //   const openCoach = (c) => {
// // //     setSelectedCoach(c);
// // //     setSelectedMember(null);
// // //   };

// // //   const openMember = (m) => {
// // //     setSelectedMember(m);
// // //     setSelectedCoach(null);
// // //   };

// // //   const onAssigned = async () => {
// // //     setShowAssign(false);
// // //     await load();
// // //   };

// // //   // ✅ same safe helper used for members (absolute/base64/relative)
// // //   const buildPhotoSrc = (raw) => {
// // //     if (!raw || String(raw).trim() === "") return null;
// // //     const v = String(raw);

// // //     if (v.startsWith("http") || v.startsWith("data:")) return v;
// // //     return `http://localhost:5000/${v.replace(/^\/+/, "")}`;
// // //   };

// // //   return (
// // //     <Row className="g-3">
// // //       {/* Left pane: Coaches */}
// // //       <Col md={4}>
// // //         <Card className="border-0 shadow-sm">
// // //           <Card.Header
// // //             style={{ background: headerGradient, color: "#fff" }}
// // //             className="d-flex justify-content-between align-items-center"
// // //           >
// // //             <span>👨‍🏫 Coaches</span>

// // //             {/* ✅ small yellow "More" inside header */}
// // //             <FloatingCoachMore
// // //               inline
// // //               onChanged={load}
// // //               style={{
// // //                 background: "#f9d949",
// // //                 color: "#000",
// // //                 border: "none",
// // //                 fontWeight: 800,
// // //                 padding: "4px 12px",
// // //                 borderRadius: "999px",
// // //                 fontSize: 13,
// // //                 boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
// // //               }}
// // //             />
// // //           </Card.Header>

// // //           <ListGroup variant="flush">
// // //             {coaches.map((c) => {
// // //               const cPhoto = buildPhotoSrc(c.photo_url);

// // //               return (
// // //                 <ListGroup.Item
// // //                   key={c.coach_id}
// // //                   action
// // //                   onClick={() => openCoach(c)}
// // //                 >
// // //                   <div className="d-flex align-items-center">
// // //                     <div
// // //                       className="rounded-circle bg-secondary me-2"
// // //                       style={{ width: 36, height: 36, overflow: "hidden" }}
// // //                     >
// // //                       {cPhoto ? (
// // //                         <img
// // //                           src={cPhoto}
// // //                           alt=""
// // //                           style={{
// // //                             width: "100%",
// // //                             height: "100%",
// // //                             objectFit: "cover",
// // //                           }}
// // //                           onError={(e) =>
// // //                             (e.currentTarget.style.display = "none")
// // //                           }
// // //                         />
// // //                       ) : (
// // //                         <span className="text-white d-block text-center">
// // //                           👤
// // //                         </span>
// // //                       )}
// // //                     </div>

// // //                     <div className="flex-grow-1">
// // //                       <div className="fw-semibold">{c.full_name}</div>
// // //                       <small className="text-muted">
// // //                         {c.specialties || ""}
// // //                       </small>
// // //                     </div>

// // //                     <Badge bg="success">{c.status}</Badge>
// // //                   </div>
// // //                 </ListGroup.Item>
// // //               );
// // //             })}

// // //             {coaches.length === 0 && (
// // //               <ListGroup.Item className="text-muted">
// // //                 No coaches found
// // //               </ListGroup.Item>
// // //             )}
// // //           </ListGroup>
// // //         </Card>
// // //       </Col>

// // //       {/* Middle pane: Members */}
// // //       <Col md={4}>
// // //         <Card className="border-0 shadow-sm">
// // //           <Card.Header style={{ background: headerGradient, color: "#fff" }}>
// // //             🧍 Members
// // //           </Card.Header>

// // //           <ListGroup variant="flush">
// // //             {members.map((m) => {
// // //               const mPhoto = buildPhotoSrc(m.photo_url);

// // //               return (
// // //                 <ListGroup.Item
// // //                   key={m.member_id}
// // //                   action
// // //                   onClick={() => openMember(m)}
// // //                 >
// // //                   <div className="d-flex align-items-center">
// // //                     <div
// // //                       className="rounded-circle bg-secondary me-2"
// // //                       style={{ width: 36, height: 36, overflow: "hidden" }}
// // //                     >
// // //                       {mPhoto ? (
// // //                         <img
// // //                           src={mPhoto}
// // //                           alt=""
// // //                           style={{
// // //                             width: "100%",
// // //                             height: "100%",
// // //                             objectFit: "cover",
// // //                           }}
// // //                           onError={(e) =>
// // //                             (e.currentTarget.style.display = "none")
// // //                           }
// // //                         />
// // //                       ) : (
// // //                         <span className="text-white d-block text-center">
// // //                           🙂
// // //                         </span>
// // //                       )}
// // //                     </div>

// // //                     <div className="flex-grow-1">
// // //                       <div className="fw-semibold">{m.full_name}</div>
// // //                       <small className="text-muted">
// // //                         {m.phone || "No phone"}
// // //                       </small>
// // //                     </div>

// // //                     <Badge bg="primary">{m.status}</Badge>
// // //                   </div>
// // //                 </ListGroup.Item>
// // //               );
// // //             })}

// // //             {members.length === 0 && (
// // //               <ListGroup.Item className="text-muted">
// // //                 No members found
// // //               </ListGroup.Item>
// // //             )}
// // //           </ListGroup>
// // //         </Card>
// // //       </Col>

// // //       {/* Right pane: Details */}
// // //       <Col md={4}>
// // //         {!selectedCoach && !selectedMember && (
// // //           <Card className="border-0 shadow-sm">
// // //             <Card.Body>Select a coach or member…</Card.Body>
// // //           </Card>
// // //         )}

// // //         {selectedCoach && (
// // //           <ProfileCoach
// // //             coach={selectedCoach}
// // //             onAssignClick={() => setShowAssign(true)}
// // //           />
// // //         )}

// // //         {selectedMember && (
// // //           <ProfileMember
// // //             member={selectedMember}
// // //             onAssignClick={() => setShowAssign(true)}
// // //           />
// // //         )}
// // //       </Col>

// // //       {/* Shared Assign modal */}
// // //       <AssignCoachModal
// // //         show={showAssign}
// // //         onHide={() => setShowAssign(false)}
// // //         presetCoach={selectedCoach}
// // //         presetMember={selectedMember}
// // //         onAssigned={onAssigned}
// // //       />
// // //     </Row>
// // //   );
// // // }
// // // Front_end/snp/src/components/gym/GymDirectory.js
// // import React, { useEffect, useState } from "react";
// // import { Row, Col, Card, ListGroup, Badge } from "react-bootstrap";
// // import coachesService from "../../services/coachesService";
// // import membersService from "../../services/membersService";
// // import ProfileCoach from "./ProfileCoach";
// // import ProfileMember from "./ProfileMember";
// // import AssignCoachModal from "./modals/AssignCoachModal";
// // import FloatingCoachMore from "./FloatingCoachMore";

// // const headerGradient = "linear-gradient(90deg, #3b2a88 0%, #146b57 100%)";

// // export default function GymDirectory() {
// //   const [coaches, setCoaches] = useState([]);
// //   const [members, setMembers] = useState([]);
// //   const [selectedCoach, setSelectedCoach] = useState(null);
// //   const [selectedMember, setSelectedMember] = useState(null);
// //   const [showAssign, setShowAssign] = useState(false);
  
// //   // ✅ ADD: refreshKey to force profile components to refetch assignments
// //   const [refreshKey, setRefreshKey] = useState(0);

// //   const load = async () => {
// //     // ✅ Load both coaches and members in parallel
// //     const [cList, mList] = await Promise.all([
// //       coachesService.list(),
// //       membersService.list(),
// //     ]);

// //     setCoaches(cList);
// //     setMembers(mList);

// //     // ✅ Keep selection in sync after reload
// //     setSelectedCoach((prev) =>
// //       prev ? (cList.find((x) => x.coach_id === prev.coach_id) || null) : null
// //     );
// //     setSelectedMember((prev) =>
// //       prev ? (mList.find((x) => x.member_id === prev.member_id) || null) : null
// //     );

// //     // ✅ Force profiles to refetch assignments
// //     setRefreshKey((k) => k + 1);
// //   };

// //   useEffect(() => {
// //     load();
// //   }, []);

// //   const openCoach = (c) => {
// //     setSelectedCoach(c);
// //     setSelectedMember(null);
// //   };

// //   const openMember = (m) => {
// //     setSelectedMember(m);
// //     setSelectedCoach(null);
// //   };

// //   const onAssigned = async () => {
// //     setShowAssign(false);
// //     await load(); // ✅ This now refreshes lists AND right panels
// //   };

// //   // ✅ same safe helper used for members (absolute/base64/relative)
// //   const buildPhotoSrc = (raw) => {
// //     if (!raw || String(raw).trim() === "") return null;
// //     const v = String(raw);

// //     if (v.startsWith("http") || v.startsWith("data:")) return v;
// //     return `http://localhost:5000/${v.replace(/^\/+/, "")}`;
// //   };

// //   return (
// //     <Row className="g-3">
// //       {/* Left pane: Coaches */}
// //       <Col md={4}>
// //         <Card className="border-0 shadow-sm">
// //           <Card.Header
// //             style={{ background: headerGradient, color: "#fff" }}
// //             className="d-flex justify-content-between align-items-center"
// //           >
// //             <span>👨‍🏫 Coaches</span>

// //             {/* ✅ small yellow "More" inside header */}
// //             <FloatingCoachMore
// //               inline
// //               onChanged={load}
// //               style={{
// //                 background: "#f9d949",
// //                 color: "#000",
// //                 border: "none",
// //                 fontWeight: 800,
// //                 padding: "4px 12px",
// //                 borderRadius: "999px",
// //                 fontSize: 13,
// //                 boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
// //               }}
// //             />
// //           </Card.Header>

// //           <ListGroup variant="flush">
// //             {coaches.map((c) => {
// //               const cPhoto = buildPhotoSrc(c.photo_url);

// //               return (
// //                 <ListGroup.Item
// //                   key={c.coach_id}
// //                   action
// //                   onClick={() => openCoach(c)}
// //                 >
// //                   <div className="d-flex align-items-center">
// //                     <div
// //                       className="rounded-circle bg-secondary me-2"
// //                       style={{ width: 36, height: 36, overflow: "hidden" }}
// //                     >
// //                       {cPhoto ? (
// //                         <img
// //                           src={cPhoto}
// //                           alt=""
// //                           style={{
// //                             width: "100%",
// //                             height: "100%",
// //                             objectFit: "cover",
// //                           }}
// //                           onError={(e) =>
// //                             (e.currentTarget.style.display = "none")
// //                           }
// //                         />
// //                       ) : (
// //                         <span className="text-white d-block text-center">
// //                           👤
// //                         </span>
// //                       )}
// //                     </div>

// //                     <div className="flex-grow-1">
// //                       <div className="fw-semibold">{c.full_name}</div>
// //                       <small className="text-muted">
// //                         {c.specialties || ""}
// //                       </small>
// //                     </div>

// //                     <Badge bg="success">{c.status}</Badge>
// //                   </div>
// //                 </ListGroup.Item>
// //               );
// //             })}

// //             {coaches.length === 0 && (
// //               <ListGroup.Item className="text-muted">
// //                 No coaches found
// //               </ListGroup.Item>
// //             )}
// //           </ListGroup>
// //         </Card>
// //       </Col>

// //       {/* Middle pane: Members */}
// //       <Col md={4}>
// //         <Card className="border-0 shadow-sm">
// //           <Card.Header style={{ background: headerGradient, color: "#fff" }}>
// //             🧍 Members
// //           </Card.Header>

// //           <ListGroup variant="flush">
// //             {members.map((m) => {
// //               const mPhoto = buildPhotoSrc(m.photo_url);

// //               return (
// //                 <ListGroup.Item
// //                   key={m.member_id}
// //                   action
// //                   onClick={() => openMember(m)}
// //                 >
// //                   <div className="d-flex align-items-center">
// //                     <div
// //                       className="rounded-circle bg-secondary me-2"
// //                       style={{ width: 36, height: 36, overflow: "hidden" }}
// //                     >
// //                       {mPhoto ? (
// //                         <img
// //                           src={mPhoto}
// //                           alt=""
// //                           style={{
// //                             width: "100%",
// //                             height: "100%",
// //                             objectFit: "cover",
// //                           }}
// //                           onError={(e) =>
// //                             (e.currentTarget.style.display = "none")
// //                           }
// //                         />
// //                       ) : (
// //                         <span className="text-white d-block text-center">
// //                           🙂
// //                         </span>
// //                       )}
// //                     </div>

// //                     <div className="flex-grow-1">
// //                       <div className="fw-semibold">{m.full_name}</div>
// //                       <small className="text-muted">
// //                         {m.phone || "No phone"}
// //                       </small>
// //                     </div>

// //                     <Badge bg="primary">{m.status}</Badge>
// //                   </div>
// //                 </ListGroup.Item>
// //               );
// //             })}

// //             {members.length === 0 && (
// //               <ListGroup.Item className="text-muted">
// //                 No members found
// //               </ListGroup.Item>
// //             )}
// //           </ListGroup>
// //         </Card>
// //       </Col>

// //       {/* Right pane: Details */}
// //       <Col md={4}>
// //         {!selectedCoach && !selectedMember && (
// //           <Card className="border-0 shadow-sm">
// //             <Card.Body>Select a coach or member…</Card.Body>
// //           </Card>
// //         )}

// //         {selectedCoach && (
// //           <ProfileCoach
// //             coach={selectedCoach}
// //             refreshKey={refreshKey} // ✅ ADD: pass refreshKey
// //             onAssignClick={() => setShowAssign(true)}
// //           />
// //         )}

// //         {selectedMember && (
// //           <ProfileMember
// //             member={selectedMember}
// //             refreshKey={refreshKey} // ✅ ADD: pass refreshKey
// //             onAssignClick={() => setShowAssign(true)}
// //           />
// //         )}
// //       </Col>

// //       {/* Shared Assign modal */}
// //       <AssignCoachModal
// //         show={showAssign}
// //         onHide={() => setShowAssign(false)}
// //         presetCoach={selectedCoach}
// //         presetMember={selectedMember}
// //         onAssigned={onAssigned}
// //       />
// //     </Row>
// //   );
// // }
// // Front_end/snp/src/components/gym/GymDirectory.js
// import React, { useEffect, useState } from "react";
// import { Row, Col, Card, ListGroup, Badge, Button } from "react-bootstrap";
// import coachesService from "../../services/coachesService";
// import membersService from "../../services/membersService";
// import ProfileCoach from "./ProfileCoach";
// import ProfileMember from "./ProfileMember";
// import AssignCoachModal from "./modals/AssignCoachModal";
// import FloatingCoachMore from "./FloatingCoachMore";
// import { FaUsers, FaUserTie, FaUserPlus, FaFilter, FaSearch, FaSync } from "react-icons/fa";
// import "./gym_Style.css";

// const headerGradient = "linear-gradient(135deg, #3b2a88 0%, #146b57 100%)";

// export default function GymDirectory() {
//   const [coaches, setCoaches] = useState([]);
//   const [members, setMembers] = useState([]);
//   const [selectedCoach, setSelectedCoach] = useState(null);
//   const [selectedMember, setSelectedMember] = useState(null);
//   const [showAssign, setShowAssign] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [activeFilter, setActiveFilter] = useState("all");
  
//   const [refreshKey, setRefreshKey] = useState(0);

//   const load = async () => {
//     setLoading(true);
//     try {
//       const [cList, mList] = await Promise.all([
//         coachesService.list(),
//         membersService.list(),
//       ]);

//       setCoaches(cList);
//       setMembers(mList);

//       setSelectedCoach((prev) =>
//         prev ? (cList.find((x) => x.coach_id === prev.coach_id) || null) : null
//       );
//       setSelectedMember((prev) =>
//         prev ? (mList.find((x) => x.member_id === prev.member_id) || null) : null
//       );

//       setRefreshKey((k) => k + 1);
//     } catch (error) {
//       console.error("Error loading data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const openCoach = (c) => {
//     setSelectedCoach(c);
//     setSelectedMember(null);
//   };

//   const openMember = (m) => {
//     setSelectedMember(m);
//     setSelectedCoach(null);
//   };

//   const onAssigned = async () => {
//     setShowAssign(false);
//     await load();
//   };

//   const buildPhotoSrc = (raw) => {
//     if (!raw || String(raw).trim() === "") return null;
//     const v = String(raw);

//     if (v.startsWith("http") || v.startsWith("data:")) return v;
//     return `http://localhost:5000/${v.replace(/^\/+/, "")}`;
//   };

//   const filteredCoaches = coaches.filter(coach => {
//     if (activeFilter !== "all" && coach.status !== activeFilter) return false;
//     if (!searchTerm) return true;
    
//     return coach.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//            (coach.specialties || "").toLowerCase().includes(searchTerm.toLowerCase());
//   });

//   const filteredMembers = members.filter(member => {
//     if (activeFilter !== "all" && member.status !== activeFilter) return false;
//     if (!searchTerm) return true;
    
//     return member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//            (member.phone || "").toLowerCase().includes(searchTerm.toLowerCase());
//   });

//   return (
//     <div className="position-relative">
//       {/* Floating Refresh Button */}
//       <Button
//         variant="warning"
//         className="floating-btn position-absolute"
//         style={{
//           top: '20px',
//           right: '20px',
//           zIndex: 1000,
//           width: '50px',
//           height: '50px',
//           borderRadius: '50%',
//           padding: 0,
//           backgroundColor: '#f9d949',
//           borderColor: '#f9d949'
//         }}
//         onClick={load}
//         disabled={loading}
//       >
//         <FaSync className={loading ? "fa-spin" : ""} size={20} />
//       </Button>

//       {/* Search and Filter Bar */}
//       <Card className="mb-4 border-0 shadow-sm gym-card">
//         <Card.Body className="p-3">
//           <Row className="align-items-center">
//             <Col md={6}>
//               <div className="input-group">
//                 <span className="input-group-text bg-white border-end-0">
//                   <FaSearch className="text-muted" />
//                 </span>
//                 <input
//                   type="text"
//                   className="form-control border-start-0"
//                   placeholder="Search coaches or members..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//               </div>
//             </Col>
//             <Col md={6} className="mt-2 mt-md-0">
//               <div className="d-flex justify-content-end">
//                 <div className="btn-group">
//                   <Button
//                     variant={activeFilter === "all" ? "primary" : "outline-primary"}
//                     size="sm"
//                     onClick={() => setActiveFilter("all")}
//                   >
//                     All
//                   </Button>
//                   <Button
//                     variant={activeFilter === "Active" ? "success" : "outline-success"}
//                     size="sm"
//                     onClick={() => setActiveFilter("Active")}
//                   >
//                     Active
//                   </Button>
//                   <Button
//                     variant={activeFilter === "Inactive" ? "secondary" : "outline-secondary"}
//                     size="sm"
//                     onClick={() => setActiveFilter("Inactive")}
//                   >
//                     Inactive
//                   </Button>
//                 </div>
//               </div>
//             </Col>
//           </Row>
//         </Card.Body>
//       </Card>

//       <Row className="g-4">
//         {/* Left pane: Coaches */}
//         <Col lg={4}>
//           <Card className="border-0 shadow-sm gym-card h-100">
//             <Card.Header className="gym-gradient-header text-white py-3">
//               <div className="d-flex justify-content-between align-items-center">
//                 <div className="d-flex align-items-center">
//                   <div className="bg-white rounded-circle p-2 me-3">
//                     <FaUserTie size={20} className="text-primary" />
//                   </div>
//                   <div>
//                     <h5 className="mb-0">👨‍🏫 Coaches</h5>
//                     <small className="opacity-75">
//                       {filteredCoaches.length} {filteredCoaches.length === 1 ? 'coach' : 'coaches'}
//                     </small>
//                   </div>
//                 </div>
                
//                 <FloatingCoachMore
//                   inline
//                   onChanged={load}
//                   style={{
//                     background: "#f9d949",
//                     color: "#000",
//                     border: "none",
//                     fontWeight: 800,
//                     padding: "4px 12px",
//                     borderRadius: "999px",
//                     fontSize: 13,
//                     boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
//                   }}
//                 />
//               </div>
//             </Card.Header>

//             <div className="custom-scrollbar" style={{ maxHeight: '600px', overflowY: 'auto' }}>
//               <ListGroup variant="flush">
//                 {loading ? (
//                   Array.from({ length: 3 }).map((_, i) => (
//                     <ListGroup.Item key={i} className="py-3">
//                       <div className="d-flex align-items-center">
//                         <div className="skeleton rounded-circle me-3" style={{ width: 40, height: 40 }} />
//                         <div className="flex-grow-1">
//                           <div className="skeleton mb-1" style={{ height: 15, width: '70%' }} />
//                           <div className="skeleton" style={{ height: 12, width: '50%' }} />
//                         </div>
//                       </div>
//                     </ListGroup.Item>
//                   ))
//                 ) : filteredCoaches.map((c) => {
//                   const cPhoto = buildPhotoSrc(c.photo_url);
//                   const isActive = c.status === "Active";

//                   return (
//                     <ListGroup.Item
//                       key={c.coach_id}
//                       action
//                       onClick={() => openCoach(c)}
//                       className={`py-3 border-start-0 border-end-0 ${selectedCoach?.coach_id === c.coach_id ? 'bg-light' : ''}`}
//                       style={{
//                         borderLeft: selectedCoach?.coach_id === c.coach_id ? '4px solid #3b2a88' : 'none',
//                         transition: 'all 0.3s ease'
//                       }}
//                     >
//                       <div className="d-flex align-items-center">
//                         <div className="position-relative me-3">
//                           <div className="profile-img-container rounded-circle" style={{ width: 45, height: 45, overflow: "hidden" }}>
//                             {cPhoto ? (
//                               <img
//                                 src={cPhoto}
//                                 alt=""
//                                 style={{
//                                   width: "100%",
//                                   height: "100%",
//                                   objectFit: "cover",
//                                 }}
//                                 onError={(e) =>
//                                   (e.currentTarget.style.display = "none")
//                                 }
//                               />
//                             ) : (
//                               <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-primary">
//                                 <FaUserTie className="text-white" size={18} />
//                               </div>
//                             )}
//                           </div>
//                           {isActive && (
//                             <span className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-2 border-white rounded-circle">
//                               <span className="visually-hidden">Active</span>
//                             </span>
//                           )}
//                         </div>

//                         <div className="flex-grow-1">
//                           <div className="fw-semibold text-dark">{c.full_name}</div>
//                           <small className="text-muted d-block text-truncate" style={{ maxWidth: '150px' }}>
//                             {c.specialties || "No specialty"}
//                           </small>
//                         </div>

//                         <Badge bg={isActive ? "success" : "secondary"} className="status-badge">
//                           {c.status}
//                         </Badge>
//                       </div>
//                     </ListGroup.Item>
//                   );
//                 })}

//                 {!loading && filteredCoaches.length === 0 && (
//                   <ListGroup.Item className="text-center py-5">
//                     <FaUserTie size={40} className="text-muted mb-3" />
//                     <p className="text-muted mb-0">No coaches found</p>
//                     {searchTerm && (
//                       <Button variant="link" size="sm" onClick={() => setSearchTerm("")}>
//                         Clear search
//                       </Button>
//                     )}
//                   </ListGroup.Item>
//                 )}
//               </ListGroup>
//             </div>
//           </Card>
//         </Col>

//         {/* Middle pane: Members */}
//         <Col lg={4}>
//           <Card className="border-0 shadow-sm gym-card h-100">
//             <Card.Header className="gym-gradient-header text-white py-3">
//               <div className="d-flex justify-content-between align-items-center">
//                 <div className="d-flex align-items-center">
//                   <div className="bg-white rounded-circle p-2 me-3">
//                     <FaUsers size={20} className="text-success" />
//                   </div>
//                   <div>
//                     <h5 className="mb-0">🧍 Members</h5>
//                     <small className="opacity-75">
//                       {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
//                     </small>
//                   </div>
//                 </div>
                
//                 {/* Floating Add Member Button */}
//                 <Button
//                   variant="light"
//                   size="sm"
//                   className="d-flex align-items-center"
//                   style={{
//                     background: "rgba(255,255,255,0.9)",
//                     fontWeight: 600,
//                     padding: "4px 12px",
//                     borderRadius: "999px",
//                     fontSize: 13,
//                     boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
//                   }}
//                 >
//                   <FaUserPlus className="me-1" />
//                   Add
//                 </Button>
//               </div>
//             </Card.Header>

//             <div className="custom-scrollbar" style={{ maxHeight: '600px', overflowY: 'auto' }}>
//               <ListGroup variant="flush">
//                 {loading ? (
//                   Array.from({ length: 3 }).map((_, i) => (
//                     <ListGroup.Item key={i} className="py-3">
//                       <div className="d-flex align-items-center">
//                         <div className="skeleton rounded-circle me-3" style={{ width: 40, height: 40 }} />
//                         <div className="flex-grow-1">
//                           <div className="skeleton mb-1" style={{ height: 15, width: '70%' }} />
//                           <div className="skeleton" style={{ height: 12, width: '50%' }} />
//                         </div>
//                       </div>
//                     </ListGroup.Item>
//                   ))
//                 ) : filteredMembers.map((m) => {
//                   const mPhoto = buildPhotoSrc(m.photo_url);
//                   const isActive = m.status === "Active";

//                   return (
//                     <ListGroup.Item
//                       key={m.member_id}
//                       action
//                       onClick={() => openMember(m)}
//                       className={`py-3 border-start-0 border-end-0 ${selectedMember?.member_id === m.member_id ? 'bg-light' : ''}`}
//                       style={{
//                         borderLeft: selectedMember?.member_id === m.member_id ? '4px solid #146b57' : 'none',
//                         transition: 'all 0.3s ease'
//                       }}
//                     >
//                       <div className="d-flex align-items-center">
//                         <div className="position-relative me-3">
//                           <div className="profile-img-container rounded-circle" style={{ width: 45, height: 45, overflow: "hidden" }}>
//                             {mPhoto ? (
//                               <img
//                                 src={mPhoto}
//                                 alt=""
//                                 style={{
//                                   width: "100%",
//                                   height: "100%",
//                                   objectFit: "cover",
//                                 }}
//                                 onError={(e) =>
//                                   (e.currentTarget.style.display = "none")
//                                 }
//                               />
//                             ) : (
//                               <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-success">
//                                 <FaUsers className="text-white" size={18} />
//                               </div>
//                             )}
//                           </div>
//                           {isActive && (
//                             <span className="position-absolute top-0 start-100 translate-middle p-1 bg-success border border-2 border-white rounded-circle">
//                               <span className="visually-hidden">Active</span>
//                             </span>
//                           )}
//                         </div>

//                         <div className="flex-grow-1">
//                           <div className="fw-semibold text-dark">{m.full_name}</div>
//                           <small className="text-muted d-block text-truncate" style={{ maxWidth: '150px' }}>
//                             📞 {m.phone || "No phone"}
//                           </small>
//                         </div>

//                         <Badge bg={isActive ? "primary" : "secondary"} className="status-badge">
//                           {m.status}
//                         </Badge>
//                       </div>
//                     </ListGroup.Item>
//                   );
//                 })}

//                 {!loading && filteredMembers.length === 0 && (
//                   <ListGroup.Item className="text-center py-5">
//                     <FaUsers size={40} className="text-muted mb-3" />
//                     <p className="text-muted mb-0">No members found</p>
//                     {searchTerm && (
//                       <Button variant="link" size="sm" onClick={() => setSearchTerm("")}>
//                         Clear search
//                       </Button>
//                     )}
//                   </ListGroup.Item>
//                 )}
//               </ListGroup>
//             </div>
//           </Card>
//         </Col>

//         {/* Right pane: Details */}
//         <Col lg={4}>
//           {!selectedCoach && !selectedMember ? (
//             <Card className="border-0 shadow-sm gym-card h-100">
//               <Card.Body className="d-flex flex-column align-items-center justify-content-center py-5">
//                 <div className="bg-light rounded-circle p-4 mb-3">
//                   <FaUsers size={40} className="text-muted" />
//                 </div>
//                 <h5 className="text-muted">Select a coach or member</h5>
//                 <p className="text-muted text-center mb-0">
//                   Click on any coach or member from the lists to view their details here
//                 </p>
//               </Card.Body>
//             </Card>
//           ) : selectedCoach ? (
//             <ProfileCoach
//               coach={selectedCoach}
//               refreshKey={refreshKey}
//               onAssignClick={() => setShowAssign(true)}
//             />
//           ) : (
//             <ProfileMember
//               member={selectedMember}
//               refreshKey={refreshKey}
//               onAssignClick={() => setShowAssign(true)}
//             />
//           )}
//         </Col>
//       </Row>

//       {/* Stats Footer */}
//       <Card className="mt-4 border-0 shadow-sm gym-card">
//         <Card.Body className="p-3">
//           <Row className="text-center">
//             <Col md={4} className="mb-3 mb-md-0">
//               <div className="stat-card p-3">
//                 <FaUserTie size={24} className="text-primary mb-2" />
//                 <h4 className="mb-1">{coaches.length}</h4>
//                 <small className="text-muted">Total Coaches</small>
//               </div>
//             </Col>
//             <Col md={4} className="mb-3 mb-md-0">
//               <div className="stat-card p-3">
//                 <FaUsers size={24} className="text-success mb-2" />
//                 <h4 className="mb-1">{members.length}</h4>
//                 <small className="text-muted">Total Members</small>
//               </div>
//             </Col>
//             <Col md={4}>
//               <div className="stat-card p-3">
//                 <FaUserPlus size={24} className="text-warning mb-2" />
//                 <h4 className="mb-1">
//                   {coaches.filter(c => c.status === "Active").length + members.filter(m => m.status === "Active").length}
//                 </h4>
//                 <small className="text-muted">Active Profiles</small>
//               </div>
//             </Col>
//           </Row>
//         </Card.Body>
//       </Card>

//       {/* Shared Assign modal */}
//       <AssignCoachModal
//         show={showAssign}
//         onHide={() => setShowAssign(false)}
//         presetCoach={selectedCoach}
//         presetMember={selectedMember}
//         onAssigned={onAssigned}
//       />
//     </div>
//   );
// }
// Front_end/snp/src/components/gym/GymDirectory.js
import React, { useEffect, useState } from "react";
import { Row, Col, Card, ListGroup, Badge, Button, Container } from "react-bootstrap";
import coachesService from "../../services/coachesService";
import membersService from "../../services/membersService";
import ProfileCoach from "./ProfileCoach";
import ProfileMember from "./ProfileMember";
import AssignCoachModal from "./modals/AssignCoachModal";
import { FaUsers, FaUserTie, FaUserPlus, FaSearch, FaSync } from "react-icons/fa";
import "./gym_Style.css";

const headerGradient = "linear-gradient(135deg, #4a6bff 0%, #00c9a7 100%)";

export default function GymDirectory() {
  const [coaches, setCoaches] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAssign, setShowAssign] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  
  const [refreshKey, setRefreshKey] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [cList, mList] = await Promise.all([
        coachesService.list(),
        membersService.list(),
      ]);

      setCoaches(cList);
      setMembers(mList);

      // Keep current selection updated
      if (selectedCoach) {
        const updatedCoach = cList.find(c => c.coach_id === selectedCoach.coach_id);
        setSelectedCoach(updatedCoach || null);
      }
      if (selectedMember) {
        const updatedMember = mList.find(m => m.member_id === selectedMember.member_id);
        setSelectedMember(updatedMember || null);
      }

      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCoach = (c) => {
    setSelectedCoach(c);
    setSelectedMember(null);
    // Scroll to profile panel
    setTimeout(() => {
      document.getElementById('profile-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const openMember = (m) => {
    setSelectedMember(m);
    setSelectedCoach(null);
    // Scroll to profile panel
    setTimeout(() => {
      document.getElementById('profile-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const onAssigned = async () => {
    setShowAssign(false);
    await load();
  };

  const buildPhotoSrc = (raw) => {
    if (!raw || String(raw).trim() === "") return null;
    const v = String(raw);
    if (v.startsWith("http") || v.startsWith("data:")) return v;
    return `http://localhost:5000/${v.replace(/^\/+/, "")}`;
  };

  const filteredCoaches = coaches.filter(coach => {
    if (activeFilter !== "all" && coach.status !== activeFilter) return false;
    if (!searchTerm) return true;
    
    return coach.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (coach.specialties || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredMembers = members.filter(member => {
    if (activeFilter !== "all" && member.status !== activeFilter) return false;
    if (!searchTerm) return true;
    
    return member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (member.phone || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  const clearSelection = () => {
    setSelectedCoach(null);
    setSelectedMember(null);
  };

  return (
    <Container fluid className="py-3">
      {/* Simple Refresh Button */}
      <div className="position-fixed bottom-3 end-3 z-3">
        <Button
          variant="primary"
          className="floating-btn rounded-circle d-flex align-items-center justify-content-center"
          style={{
            width: '45px',
            height: '45px',
          }}
          onClick={load}
          disabled={loading}
          title="Refresh Data"
        >
          <FaSync className={loading ? "fa-spin" : ""} size={18} />
        </Button>
      </div>

      {/* Header */}
      <Card className="border-0 shadow-sm gym-card mb-4">
        <Card.Body className="p-4">
          <Row className="align-items-center">
            <Col md={8}>
              <h2 className="mb-2" style={{ 
                background: headerGradient, 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                fontWeight: '700' 
              }}>
                🏋️‍♂️ Gym Directory
              </h2>
              <p className="text-muted mb-0">
                Click on any coach or member to view details
              </p>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Button
                variant="outline-primary"
                onClick={clearSelection}
                disabled={!selectedCoach && !selectedMember}
              >
                Clear Selection
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Simple Search Bar */}
      <Card className="border-0 shadow-sm gym-card mb-4">
        <Card.Body className="p-3">
          <Row className="align-items-center">
            <Col md={8}>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </Col>
            <Col md={4} className="mt-2 mt-md-0">
              <div className="d-flex justify-content-end align-items-center">
                <span className="me-2 text-muted">Status:</span>
                <div className="btn-group">
                  <Button
                    variant={activeFilter === "all" ? "primary" : "outline-primary"}
                    size="sm"
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={activeFilter === "Active" ? "success" : "outline-success"}
                    size="sm"
                    onClick={() => setActiveFilter("Active")}
                  >
                    Active
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Two Columns Layout */}
      <Row className="g-4 mb-5">
        {/* Coaches Column */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm gym-card h-100">
            <Card.Header className="gym-gradient-header text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <FaUserTie size={24} className="me-2" />
                  <div>
                    <h4 className="mb-0">Coaches</h4>
                    <small className="opacity-75">
                      {filteredCoaches.length} available
                    </small>
                  </div>
                </div>
                <Badge bg="light" text="dark">
                  {coaches.filter(c => c.status === "Active").length} Active
                </Badge>
              </div>
            </Card.Header>

            <ListGroup variant="flush" className="custom-scrollbar" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <ListGroup.Item key={i} className="py-3">
                    <div className="d-flex align-items-center">
                      <div className="skeleton rounded-circle me-3" style={{ width: 45, height: 45 }} />
                      <div className="flex-grow-1">
                        <div className="skeleton mb-2" style={{ height: 16, width: '60%' }} />
                        <div className="skeleton" style={{ height: 14, width: '40%' }} />
                      </div>
                    </div>
                  </ListGroup.Item>
                ))
              ) : filteredCoaches.map((c) => {
                const cPhoto = buildPhotoSrc(c.photo_url);
                const isSelected = selectedCoach?.coach_id === c.coach_id;

                return (
                  <ListGroup.Item
                    key={c.coach_id}
                    action
                    onClick={() => openCoach(c)}
                    className={`py-3 ${isSelected ? 'active-selection' : ''}`}
                    style={{
                      cursor: 'pointer',
                      borderLeft: isSelected ? '4px solid #4a6bff' : 'none'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <div className="rounded-circle" style={{ 
                          width: 45, 
                          height: 45, 
                          overflow: "hidden",
                          background: '#f0f0f0'
                        }}>
                          {cPhoto ? (
                            <img
                              src={cPhoto}
                              alt={c.full_name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-primary">
                              <FaUserTie className="text-white" size={18} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1 fw-bold">{c.full_name}</h6>
                            <small className="text-muted d-block">
                              {c.specialties || "General Fitness"}
                            </small>
                          </div>
                          <div className="text-end">
                            <Badge bg={c.status === "Active" ? "success" : "secondary"} className="mb-1">
                              {c.status}
                            </Badge>
                            {c.hourly_rate && (
                              <div className="text-success small">
                                ${Number(c.hourly_rate).toFixed(2)}/hr
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                );
              })}

              {!loading && filteredCoaches.length === 0 && (
                <ListGroup.Item className="text-center py-5">
                  <FaUserTie size={48} className="text-muted mb-3 opacity-50" />
                  <h5 className="text-muted mb-2">No coaches found</h5>
                  {searchTerm && (
                    <Button variant="outline-primary" size="sm" onClick={() => setSearchTerm("")}>
                      Clear search
                    </Button>
                  )}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>

        {/* Members Column */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm gym-card h-100">
            <Card.Header className="gym-gradient-header text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <FaUsers size={24} className="me-2" />
                  <div>
                    <h4 className="mb-0">Members</h4>
                    <small className="opacity-75">
                      {filteredMembers.length} enrolled
                    </small>
                  </div>
                </div>
                <Badge bg="light" text="dark">
                  {members.filter(m => m.status === "Active").length} Active
                </Badge>
              </div>
            </Card.Header>

            <ListGroup variant="flush" className="custom-scrollbar" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <ListGroup.Item key={i} className="py-3">
                    <div className="d-flex align-items-center">
                      <div className="skeleton rounded-circle me-3" style={{ width: 45, height: 45 }} />
                      <div className="flex-grow-1">
                        <div className="skeleton mb-2" style={{ height: 16, width: '60%' }} />
                        <div className="skeleton" style={{ height: 14, width: '40%' }} />
                      </div>
                    </div>
                  </ListGroup.Item>
                ))
              ) : filteredMembers.map((m) => {
                const mPhoto = buildPhotoSrc(m.photo_url);
                const isSelected = selectedMember?.member_id === m.member_id;
                const age = m.birth_date ? new Date().getFullYear() - new Date(m.birth_date).getFullYear() : null;

                return (
                  <ListGroup.Item
                    key={m.member_id}
                    action
                    onClick={() => openMember(m)}
                    className={`py-3 ${isSelected ? 'active-selection' : ''}`}
                    style={{
                      cursor: 'pointer',
                      borderLeft: isSelected ? '4px solid #00c9a7' : 'none'
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <div className="rounded-circle" style={{ 
                          width: 45, 
                          height: 45, 
                          overflow: "hidden",
                          background: '#f0f0f0'
                        }}>
                          {mPhoto ? (
                            <img
                              src={mPhoto}
                              alt={m.full_name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          ) : (
                            <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-success">
                              <FaUsers className="text-white" size={18} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1 fw-bold">{m.full_name}</h6>
                            <small className="text-muted d-block">
                              {m.phone || "No phone"}
                            </small>
                            {m.email && (
                              <small className="text-muted d-block">
                                {m.email}
                              </small>
                            )}
                          </div>
                          <div className="text-end">
                            <Badge bg={m.status === "Active" ? "primary" : "secondary"} className="mb-1">
                              {m.status}
                            </Badge>
                            {age && (
                              <div className="text-info small">
                                Age: {age}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                );
              })}

              {!loading && filteredMembers.length === 0 && (
                <ListGroup.Item className="text-center py-5">
                  <FaUsers size={48} className="text-muted mb-3 opacity-50" />
                  <h5 className="text-muted mb-2">No members found</h5>
                  {searchTerm && (
                    <Button variant="outline-primary" size="sm" onClick={() => setSearchTerm("")}>
                      Clear search
                    </Button>
                  )}
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>

      {/* Profile Details Panel - Shows ALL assignments */}
      {(selectedCoach || selectedMember) && (
        <div id="profile-panel" className="mb-5">
          <Card className="border-0 shadow-lg gym-card">
            <Card.Header className="gym-gradient-header text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  {selectedCoach ? `👨‍🏫 ${selectedCoach.full_name}` : `🧍 ${selectedMember.full_name}`}
                </h4>
                <div>
                  <Button
                    variant="outline-light"
                    size="sm"
                    className="me-2"
                    onClick={() => setShowAssign(true)}
                  >
                    <FaUserPlus className="me-1" />
                    {selectedCoach ? "Assign to Member" : "Assign Coach"}
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card.Header>
            
            <Card.Body className="p-0">
              {selectedCoach ? (
                <ProfileCoach
                  coach={selectedCoach}
                  refreshKey={refreshKey}
                  onAssignClick={() => setShowAssign(true)}
                />
              ) : (
                <ProfileMember
                  member={selectedMember}
                  refreshKey={refreshKey}
                  onAssignClick={() => setShowAssign(true)}
                />
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Stats Summary */}
      <Card className="border-0 shadow-sm gym-card mb-4">
        <Card.Body className="p-4">
          <Row className="text-center">
            <Col xs={6} md={3} className="mb-4">
              <div className="stat-card p-3 h-100">
                <FaUserTie size={24} className="text-primary mb-2" />
                <h3 className="mb-1">{coaches.length}</h3>
                <div className="text-muted">Total Coaches</div>
              </div>
            </Col>
            
            <Col xs={6} md={3} className="mb-4">
              <div className="stat-card p-3 h-100">
                <FaUsers size={24} className="text-success mb-2" />
                <h3 className="mb-1">{members.length}</h3>
                <div className="text-muted">Total Members</div>
              </div>
            </Col>
            
            <Col xs={6} md={3} className="mb-4">
              <div className="stat-card p-3 h-100">
                <FaUserPlus size={24} className="text-warning mb-2" />
                <h3 className="mb-1">
                  {coaches.filter(c => c.status === "Active").length + members.filter(m => m.status === "Active").length}
                </h3>
                <div className="text-muted">Active Users</div>
              </div>
            </Col>
            
            <Col xs={6} md={3} className="mb-4">
              <div className="stat-card p-3 h-100">
                <FaSync size={24} className="text-info mb-2" />
                <h3 className="mb-1">{new Date().getDate()}</h3>
                <div className="text-muted">Today</div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Empty State */}
      {!selectedCoach && !selectedMember && (
        <Card className="border-0 shadow-sm gym-card text-center">
          <Card.Body className="py-5">
            <div className="mb-4" style={{ fontSize: '3rem' }}>
              👈
            </div>
            <h4 className="text-muted mb-3">Select a Coach or Member</h4>
            <p className="text-muted mb-4">
              Click on any name from the lists above to view details
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Assign Modal */}
      <AssignCoachModal
        show={showAssign}
        onHide={() => setShowAssign(false)}
        presetCoach={selectedCoach}
        presetMember={selectedMember}
        onAssigned={onAssigned}
      />
    </Container>
  );
}