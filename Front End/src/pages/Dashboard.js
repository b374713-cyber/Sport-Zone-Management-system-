// import React, { useState, useEffect } from "react";
// import {
//   Container,
//   Row,
//   Col,
//   Card,
//   Button,
//   Nav,
//   Tab,
//   Tabs,
//   Badge,
//   Table,
//   Alert,
//   Modal,
//   Form,
//   Spinner
// } from "react-bootstrap";

// import { useAuth } from "../context/AuthContext";
// import { employeeService } from "../services/employeeService";
// import GamingStats from "../components/dashboard/GamingStats";

// // Services
// import SportsSchedule from "../components/sports/SportsSchedule";
// import GymDashboard from "../components/gym/GymDashboard";
// import GamingZone from "../components/gaming/GamingZone";
// import StoreDashboard from "./StoreDashboard";

// // ✅ NEW statistics widgets
// import ReservationsCalendarModal from "../components/dashboard/ReservationsCalendarModal";

// // ✅ LIVE CHAT ADMIN COMPONENT
// import LiveChatAdmin from "../components/chat/LiveChatAdmin";
// import { getStoreStats } from "../services/storeService";

// // ----------------------------
// // CONFIG (use .env instead of localhost)
// // ----------------------------
// const RAW_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// // API should end with /api
// const API = RAW_BASE.endsWith("/api")
//   ? RAW_BASE
//   : `${RAW_BASE.replace(/\/$/, "")}/api`;

// // Server base for static files (uploads etc.) should be WITHOUT /api
// const SERVER_BASE = RAW_BASE.replace(/\/api\/?$/, "").replace(/\/$/, "");

// const Dashboard = () => {
//   const { user, logout } = useAuth();
//   const isAdmin = user?.role === "Admin";

//   // ----------------------------
//   // MAIN TABS (Sidebar)
//   // ----------------------------
//   const [activeMainTab, setActiveMainTab] = useState("overview");
//   const [activeServiceTab, setActiveServiceTab] = useState("sports");

//   // ----------------------------
//   // DATA STATE
//   // ----------------------------
//   const [employees, setEmployees] = useState([]);
//   const [statistics, setStatistics] = useState({});
//   const [applications, setApplications] = useState([]);

//   // ----------------------------
//   // UI STATE
//   // ----------------------------
//   const [loading, setLoading] = useState(false);
//   const [loadingApps, setLoadingApps] = useState(false);
//   const [loadingHiring, setLoadingHiring] = useState(false);

//   const [error, setError] = useState("");
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

//   // Modals
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [selectedEmployee, setSelectedEmployee] = useState(null);
//   const [editForm, setEditForm] = useState({});

//   const [showAppModal, setShowAppModal] = useState(false);
//   const [selectedApp, setSelectedApp] = useState(null);

//   // ✅ NEW: Reservations calendar modal
//   const [showResCal, setShowResCal] = useState(false);

//   // Hiring Flag
//   const [hiringOpen, setHiringOpen] = useState(false);

//   // ✅ NEW Create-Employee modal
//   const [showCreateEmpModal, setShowCreateEmpModal] = useState(false);
//   const [selectedAppForCreate, setSelectedAppForCreate] = useState(null);
//   const [createEmpPassword, setCreateEmpPassword] = useState("");
//   const [createEmpError, setCreateEmpError] = useState("");
//   const [createEmpSubmitting, setCreateEmpSubmitting] = useState(false);

//   // ----------------------------
//   // EFFECTS
//   // ----------------------------
//   useEffect(() => {
//     if (!isAdmin) return;

//     if (activeMainTab === "employees") {
//       loadEmployees();
//       loadHiringFlag();
//       loadApplications();
//     }

//     if (activeMainTab === "statistics") {
//       loadStatistics();
//     }
//   }, [activeMainTab, isAdmin]);

//   // ----------------------------
//   // LOADERS
//   // ----------------------------
//   const loadEmployees = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const response = await employeeService.getAllEmployees();
//       setEmployees(response.employees || []);
//     } catch (err) {
//       console.error(err);
//       setError("Failed to load employees.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const loadStatistics = async () => {
//   //   setLoading(true);
//   //   setError("");
//   //   try {
//   //     // ✅ old working summary stats
//   //     const response = await employeeService.getStatistics();
//   //     const oldStats = response.statistics || {};

//   //     // ✅ new matches income
//   //     const matchesRes = await employeeService.getMatchesIncome();

//   //     setStatistics({
//   //       ...oldStats,
//   //       matchesIncome: matchesRes.matchesIncome || 0
//   //     });
//   //   } catch (err) {
//   //     console.error(err);
//   //     setError("Failed to load statistics.");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const loadStatistics = async () => {
//   setLoading(true);
//   setError("");

//   try {
//     // 1) existing stats (employees/gym/reservations/etc.)
//     const response = await employeeService.getStatistics();
//     const oldStats = response.statistics || {};

//     // 2) matches income
//     const matchesRes = await employeeService.getMatchesIncome();

//     // 3) store stats (do NOT break page if it fails)
//     let storeSales = oldStats.storeSales || 0;
//     try {
//       const storeRes = await getStoreStats(); // { storeSales, totals? }
//       storeSales = storeRes?.storeSales ?? storeSales;
//     } catch (e) {
//       console.error("getStoreStats failed, using fallback:", e);
//     }

//     // ✅ final merge
//     setStatistics({
//       ...oldStats,
//       storeSales,
//       matchesIncome: matchesRes.matchesIncome || 0
//     });
//   } catch (err) {
//     console.error("loadStatistics error:", err);
//     setError("Failed to load statistics.");
//   } finally {
//     setLoading(false);
//   }
// };

//   async function loadHiringFlag() {
//     try {
//       const r = await fetch(`${API}/settings/hiring`, {
//         headers: { "ngrok-skip-browser-warning": "true" }
//       });
//       const text = await r.text();
//       const data = text ? JSON.parse(text) : {};
//       setHiringOpen(Boolean(data.hiring_open));
//     } catch (e) {
//       console.error("loadHiringFlag error:", e);
//       setHiringOpen(false);
//     }
//   }

//   async function loadApplications() {
//     try {
//       setLoadingApps(true);

//       const res = await fetch(`${API}/jobs/applications`, {
//         headers: { "ngrok-skip-browser-warning": "true" }
//       });

//       const text = await res.text();
//       let data = {};
//       try {
//         data = text ? JSON.parse(text) : {};
//       } catch (e) {
//         console.error("Dashboard loadApplications: Not JSON:", text.slice(0, 200));
//         throw new Error("Server returned invalid response (not JSON).");
//       }

//       if (!res.ok) {
//         console.error("Failed to load applications:", res.status, data);
//         throw new Error(data.error || "Failed to load applications");
//       }

//       setApplications(data.applications || []);
//     } catch (err) {
//       console.error("loadApplications error:", err);
//       setApplications([]);
//     } finally {
//       setLoadingApps(false);
//     }
//   }

//   // ✅ DELETE APPLICATION
//   async function deleteApplication(id) {
//     if (!window.confirm("Delete this application permanently?")) return;

//     try {
//       const res = await fetch(`${API}/jobs/applications/${id}`, {
//         method: "DELETE",
//         headers: { "ngrok-skip-browser-warning": "true" }
//       });

//       const text = await res.text();
//       let data = {};
//       try {
//         data = text ? JSON.parse(text) : {};
//       } catch {}

//       if (!res.ok) throw new Error(data.error || "Failed to delete application");

//       loadApplications();
//     } catch (e) {
//       console.error("Delete application error:", e);
//       alert(e.message || "Delete failed");
//     }
//   }

//   // ----------------------------
//   // EMPLOYEE CRUD
//   // ----------------------------
//   const handleEditEmployee = (employee) => {
//     setSelectedEmployee(employee);
//     setEditForm({
//       salary: employee.salary || "",
//       job_title: employee.job_title || "",
//       phone: employee.phone || ""
//     });
//     setShowEditModal(true);
//   };

//   const handleUpdateEmployee = async () => {
//     try {
//       await employeeService.updateEmployee(selectedEmployee.user_id, editForm);
//       setShowEditModal(false);
//       loadEmployees();
//       alert("Employee updated successfully!");
//     } catch (err) {
//       console.error(err);
//       alert("Error updating employee.");
//     }
//   };

//   const handleDeleteEmployee = async (userId, name) => {
//     if (!window.confirm(`Delete ${name}?`)) return;
//     try {
//       await employeeService.deleteEmployee(userId);
//       loadEmployees();
//       alert("Employee deleted successfully!");
//     } catch (err) {
//       console.error(err);
//       alert("Error deleting employee.");
//     }
//   };

//   // ----------------------------
//   // HIRING TOGGLE
//   // ----------------------------
//   const toggleHiring = async () => {
//     try {
//       setLoadingHiring(true);
//       const next = !hiringOpen;

//       const res = await fetch(`${API}/settings/hiring`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           "ngrok-skip-browser-warning": "true"
//         },
//         body: JSON.stringify({ open: next })
//       });

//       const text = await res.text();
//       const data = text ? JSON.parse(text) : {};
//       setHiringOpen(Boolean(data.hiring_open));
//     } catch (e) {
//       console.error("Toggle hiring failed", e);
//     } finally {
//       setLoadingHiring(false);
//     }
//   };

//   // ----------------------------
//   // APPLICATIONS
//   // ----------------------------
//   async function updateAppStatus(id, status) {
//     try {
//       const res = await fetch(`${API}/jobs/applications/${id}`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           "ngrok-skip-browser-warning": "true"
//         },
//         body: JSON.stringify({ status })
//       });

//       const text = await res.text();
//       let data = {};
//       try {
//         data = text ? JSON.parse(text) : {};
//       } catch {
//         console.error("updateAppStatus not JSON:", text.slice(0, 200));
//       }

//       if (!res.ok) {
//         throw new Error(data.error || "Failed to update application status");
//       }

//       loadApplications();
//     } catch (e) {
//       console.error("Failed to update status", e);
//     }
//   }

//   function openCreateEmployeeFromApp(app) {
//     setSelectedAppForCreate(app);
//     setCreateEmpPassword("");
//     setCreateEmpError("");
//     setShowCreateEmpModal(true);
//   }

//   async function handleConfirmCreateEmployee() {
//     if (!selectedAppForCreate) return;

//     if (!createEmpPassword || createEmpPassword.length < 6) {
//       setCreateEmpError("Password must be at least 6 characters.");
//       return;
//     }

//     try {
//       setCreateEmpSubmitting(true);
//       setCreateEmpError("");

//       await employeeService.createEmployee({
//         name: selectedAppForCreate.full_name,
//         email: selectedAppForCreate.email,
//         phone: selectedAppForCreate.phone || "",
//         salary: 0,
//         job_title: "Staff Member",
//         password: createEmpPassword
//       });

//       await updateAppStatus(selectedAppForCreate.id, "Registered");
//       await loadEmployees();
//       await loadApplications();

//       alert("Employee created successfully from application.");
//       setShowCreateEmpModal(false);
//     } catch (e) {
//       console.error(e);
//       setCreateEmpError(
//         e.response?.data?.error || e.message || "Failed to create employee."
//       );
//     } finally {
//       setCreateEmpSubmitting(false);
//     }
//   }

//   // ----------------------------
//   // SIDEBAR ITEMS
//   // ----------------------------
//   const getSidebarItems = () => {
//     if (isAdmin) {
//       return [
//         { id: "overview", label: "📊 Overview", icon: "📊", badge: "All" },
//         { id: "employees", label: "👥 Employees", icon: "👥", badge: "Admin" },
//         { id: "statistics", label: "📈 Statistics", icon: "📈", badge: "Admin" }
//       ];
//     }

//     return [
//       { id: "sports", label: "⚽ Sports Reservation", icon: "⚽" },
//       { id: "gym", label: "💪 Gym & Coaching", icon: "💪" },
//       { id: "gaming", label: "🎮 Gaming Zone", icon: "🎮" },
//       { id: "store", label: "🛍️ Sport Store", icon: "🛍️" },
//       { id: "livechat", label: "💬 Live Chat", icon: "💬" } // ✅ NEW
//     ];
//   };

//   // ✅ SERVICE TABS inside Overview (admin + employee)
//   const serviceTabs = [
//     { id: "sports", label: "⚽ Sports Reservation", icon: "⚽" },
//     { id: "gym", label: "💪 Gym & Coaching", icon: "💪" },
//     { id: "gaming", label: "🎮 Gaming Zone", icon: "🎮" },
//     { id: "store", label: "🛍️ Sport Store", icon: "🛍️" },
//     { id: "livechat", label: "💬 Live Chat", icon: "💬" } // ✅ NEW
//   ];

//   // ----------------------------
//   // OVERVIEW - TAB CONTENT
//   // ----------------------------
//   const renderServiceContent = (service) => {
//     const content = {
//       sports: <SportsSchedule />,
//       gym: <GymDashboard />,
//       gaming: <GamingZone apiBase={API} />,
//       store: <StoreDashboard />,
//       livechat: <LiveChatAdmin /> // ✅ NEW
//     };
//     return content[service] || <div>Service not found</div>;
//   };

//   const renderServiceTabs = () => (
//     <div className="service-tabs-container">
//       <div className="service-tabs-header mb-4">
//         <h4 className="text-gradient">
//           {isAdmin ? "Service Management" : "Quick Access"}
//         </h4>
//         <p className="text-muted">
//           {isAdmin
//             ? "Manage all Sport Zone services from one place"
//             : "Access your assigned services quickly"}
//         </p>
//       </div>

//       <Tabs
//         activeKey={activeServiceTab}
//         onSelect={(tab) => setActiveServiceTab(tab)}
//         className="service-tabs mb-4"
//         fill
//       >
//         {serviceTabs.map((service) => (
//           <Tab
//             key={service.id}
//             eventKey={service.id}
//             title={
//               <div
//                 className={
//                   "d-flex align-items-center justify-content-center service-tab-title " +
//                   service.id +
//                   "-tab-wrapper"
//                 }
//               >
//                 <span className="me-2">{service.icon}</span>
//                 <span>{service.label}</span>

//                 {/* Thought bubble */}
//                 <span
//                   className={
//                     `thought-bubble thought-bubble-${service.id}` +
//                     (activeServiceTab === service.id ? " visible" : "")
//                   }
//                 >
//                   {service.id === "sports" && (
//                     <>
//                       <span className="thought-emoji">⚽</span>
//                       <span className="thought-emoji ms-1">🏀</span>
//                       <span className="thought-emoji ms-1">🎾</span>
//                     </>
//                   )}

//                   {service.id === "gym" && (
//                     <>
//                       <span className="thought-emoji">💪</span>
//                       <span className="thought-emoji ms-1">🏋️</span>
//                     </>
//                   )}

//                   {service.id === "gaming" && (
//                     <>
//                       <span className="thought-emoji">🎮</span>
//                       <span className="thought-emoji ms-1">🎧</span>
//                     </>
//                   )}

//                   {service.id === "store" && (
//                     <>
//                       <span className="thought-emoji">👟</span>
//                       <span className="thought-emoji ms-1">👕</span>
//                     </>
//                   )}

//                   {service.id === "livechat" && (
//                     <>
//                       <span className="thought-emoji">💬</span>
//                       <span className="thought-emoji ms-1">🔔</span>
//                     </>
//                   )}
//                 </span>
//               </div>
//             }
//           >
//             <div className="p-4">{renderServiceContent(service.id)}</div>
//           </Tab>
//         ))}
//       </Tabs>
//     </div>
//   );

//   // ----------------------------
//   // EMPLOYEES MANAGEMENT (3 SUB-TABS)
//   // ----------------------------
//   const renderEmployeesManagement = () => (
//     <div className="p-4">
//       <Tabs
//         defaultActiveKey="staff"
//         id="employees-tabs"
//         className="mb-3"
//         fill
//         onSelect={(k) => {
//           if (k === "apps" || k === "register") loadApplications();
//         }}
//       >
//         {/* TAB 1 — Staff */}
//         <Tab eventKey="staff" title="Staff Management">
//           <div className="pt-2">
//             <div className="d-flex justify-content-between align-items-center mb-4">
//               <h4 className="text-gradient">Staff Management</h4>

//               <div className="d-flex align-items-center gap-3">
//                 {isAdmin && (
//                   <Form.Check
//                     type="switch"
//                     id="hiring-switch"
//                     label={hiringOpen ? "Hiring: ON" : "Hiring: OFF"}
//                     checked={hiringOpen}
//                     onChange={toggleHiring}
//                     disabled={loadingHiring}
//                   />
//                 )}

//                 <Button
//                   variant="outline-secondary"
//                   size="sm"
//                   onClick={loadEmployees}
//                   disabled={loading}
//                 >
//                   Refresh
//                 </Button>

//                 <Button variant="primary" size="sm" disabled>
//                   Add Employee
//                 </Button>
//               </div>
//             </div>

//             {loading ? (
//               <div className="text-center py-4">
//                 <Spinner animation="border" variant="primary" />
//                 <p className="mt-2 text-muted">Loading employees...</p>
//               </div>
//             ) : employees.length === 0 ? (
//               <div className="text-center py-5">
//                 <h5>No Employees Found</h5>
//                 <p className="text-muted">
//                   No employees are currently registered in the system.
//                 </p>
//                 <Button variant="outline-primary" onClick={loadEmployees}>
//                   Try Again
//                 </Button>
//               </div>
//             ) : (
//               <Card className="border-0 shadow-sm">
//                 <Card.Header className="bg-light d-flex justify-content-between align-items-center">
//                   <h6 className="mb-0">
//                     Current Employees ({employees.length})
//                   </h6>
//                   <small className="text-muted">
//                     Last updated: {new Date().toLocaleTimeString()}
//                   </small>
//                 </Card.Header>

//                 <Card.Body className="p-0">
//                   <Table responsive hover className="mb-0">
//                     <thead className="bg-light">
//                       <tr>
//                         <th>ID</th>
//                         <th>Name</th>
//                         <th>Email</th>
//                         <th>Role</th>
//                         <th>Job Title</th>
//                         <th>Salary</th>
//                         <th>Phone</th>
//                         <th>Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {employees.map((employee) => (
//                         <tr key={employee.user_id}>
//                           <td>{employee.user_id}</td>
//                           <td>{employee.name}</td>
//                           <td>{employee.email}</td>
//                           <td>
//                             <Badge
//                               bg={
//                                 employee.role === "Admin"
//                                   ? "danger"
//                                   : "primary"
//                               }
//                             >
//                               {employee.role}
//                             </Badge>
//                           </td>
//                           <td>{employee.job_title || "Not assigned"}</td>
//                           <td>
//                             {employee.salary ? (
//                               <strong>
//                                 ${employee.salary.toLocaleString()}
//                               </strong>
//                             ) : (
//                               <span className="text-muted">Not set</span>
//                             )}
//                           </td>
//                           <td>{employee.phone || "Not provided"}</td>
//                           <td>
//                             <Button
//                               variant="outline-primary"
//                               size="sm"
//                               className="me-1"
//                               onClick={() => handleEditEmployee(employee)}
//                             >
//                               Edit
//                             </Button>
//                             <Button
//                               variant="outline-danger"
//                               size="sm"
//                               onClick={() =>
//                                 handleDeleteEmployee(
//                                   employee.user_id,
//                                   employee.name
//                                 )
//                               }
//                             >
//                               Remove
//                             </Button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </Table>
//                 </Card.Body>
//               </Card>
//             )}
//           </div>
//         </Tab>

//         {/* TAB 2 — Applications */}
//         <Tab eventKey="apps" title="Applications Receiving">
//           {loadingApps ? (
//             <div className="text-center py-4">
//               <Spinner animation="border" variant="primary" />
//               <p className="mt-2 text-muted">Loading applications...</p>
//             </div>
//           ) : applications.length === 0 ? (
//             <div className="text-center py-5 text-muted">
//               No applications yet.
//             </div>
//           ) : (
//             <Card className="border-0 shadow-sm">
//               <Card.Header className="bg-light d-flex justify-content-between align-items-center">
//                 <h6 className="mb-0">
//                   Job Applications ({applications.length})
//                 </h6>
//                 <Button
//                   size="sm"
//                   variant="outline-secondary"
//                   onClick={loadApplications}
//                 >
//                   Refresh
//                 </Button>
//               </Card.Header>

//               <Card.Body className="p-0">
//                 <Table responsive hover className="mb-0">
//                   <thead className="bg-light">
//                     <tr>
//                       <th>ID</th>
//                       <th>Name</th>
//                       <th>Email</th>
//                       <th>Phone</th>
//                       <th>CV</th>
//                       <th>Status</th>
//                       <th>Submitted</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {applications.map((a) => (
//                       <tr
//                         key={a.id}
//                         style={{ cursor: "pointer" }}
//                         onClick={() => {
//                           setSelectedApp(a);
//                           setShowAppModal(true);
//                         }}
//                       >
//                         <td>{a.id}</td>
//                         <td>{a.full_name}</td>
//                         <td>{a.email}</td>
//                         <td>{a.phone || "-"}</td>
//                         <td onClick={(e) => e.stopPropagation()}>
//                           {a.cv_image_path ? (
//                             <a
//                               href={`${SERVER_BASE}${a.cv_image_path}`}
//                               target="_blank"
//                               rel="noreferrer"
//                             >
//                               Open
//                             </a>
//                           ) : a.cv_link ? (
//                             <a
//                               href={a.cv_link}
//                               target="_blank"
//                               rel="noreferrer"
//                             >
//                               Open
//                             </a>
//                           ) : (
//                             <span className="text-muted">—</span>
//                           )}
//                         </td>
//                         <td>
//                           <Badge
//                             bg={
//                               a.status === "Accepted"
//                                 ? "success"
//                                 : a.status === "Rejected"
//                                 ? "danger"
//                                 : a.status === "Registered"
//                                 ? "info"
//                                 : "secondary"
//                             }
//                           >
//                             {a.status}
//                           </Badge>
//                         </td>
//                         <td>{new Date(a.created_at).toLocaleString()}</td>

//                         <td onClick={(e) => e.stopPropagation()}>
//                           <div className="d-flex gap-2 flex-wrap">
//                             <Button
//                               size="sm"
//                               variant="outline-success"
//                               disabled={
//                                 a.status === "Accepted" ||
//                                 a.status === "Registered"
//                               }
//                               onClick={() => updateAppStatus(a.id, "Accepted")}
//                             >
//                               Accept
//                             </Button>

//                             <Button
//                               size="sm"
//                               variant="outline-danger"
//                               disabled={
//                                 a.status === "Rejected" ||
//                                 a.status === "Registered"
//                               }
//                               onClick={() => updateAppStatus(a.id, "Rejected")}
//                             >
//                               Reject
//                             </Button>

//                             {/* ✅ Delete appears only if Rejected */}
//                             {a.status === "Rejected" && (
//                               <Button
//                                 size="sm"
//                                 variant="outline-danger"
//                                 onClick={() => deleteApplication(a.id)}
//                               >
//                                 Delete
//                               </Button>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </Table>
//               </Card.Body>
//             </Card>
//           )}

//           {/* Details Modal */}
//           <Modal
//             show={showAppModal}
//             onHide={() => setShowAppModal(false)}
//             centered
//             size="md"
//           >
//             <Modal.Header closeButton>
//               <Modal.Title>Application #{selectedApp?.id}</Modal.Title>
//             </Modal.Header>

//             <Modal.Body>
//               {selectedApp && (
//                 <>
//                   <p>
//                     <strong>Name:</strong> {selectedApp.full_name}
//                   </p>
//                   <p>
//                     <strong>Email:</strong> {selectedApp.email}
//                   </p>
//                   <p>
//                     <strong>Phone:</strong> {selectedApp.phone || "-"}
//                   </p>
//                   <p>
//                     <strong>Status:</strong> {selectedApp.status}
//                   </p>
//                 </>
//               )}
//             </Modal.Body>

//             <Modal.Footer>
//               {selectedApp?.status === "Accepted" && (
//                 <Button
//                   onClick={() => {
//                     setShowAppModal(false);
//                     openCreateEmployeeFromApp(selectedApp);
//                   }}
//                 >
//                   Create Employee
//                 </Button>
//               )}

//               {/* ✅ Optional: allow delete from modal if Rejected */}
//               {selectedApp?.status === "Rejected" && (
//                 <Button
//                   variant="outline-danger"
//                   onClick={() => {
//                     setShowAppModal(false);
//                     deleteApplication(selectedApp.id);
//                   }}
//                 >
//                   Delete
//                 </Button>
//               )}

//               <Button
//                 variant="secondary"
//                 onClick={() => setShowAppModal(false)}
//               >
//                 Close
//               </Button>
//             </Modal.Footer>
//           </Modal>
//         </Tab>

//         {/* TAB 3 — Register Employee */}
//         <Tab eventKey="register" title="Register Employee">
//           <div className="p-3">
//             <Card className="border-0 shadow-sm">
//               <Card.Header className="bg-light d-flex justify-content-between">
//                 <h6 className="mb-0">Accepted Applications</h6>
//                 <Button
//                   size="sm"
//                   variant="outline-secondary"
//                   onClick={loadApplications}
//                 >
//                   Refresh
//                 </Button>
//               </Card.Header>

//               <Card.Body className="p-0">
//                 <Table responsive hover className="mb-0">
//                   <thead className="bg-light">
//                     <tr>
//                       <th>ID</th>
//                       <th>Name</th>
//                       <th>Email</th>
//                       <th>Phone</th>
//                       <th>Status</th>
//                       <th>Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {applications
//                       .filter((a) => a.status === "Accepted")
//                       .map((a) => (
//                         <tr key={a.id}>
//                           <td>{a.id}</td>
//                           <td>{a.full_name}</td>
//                           <td>{a.email}</td>
//                           <td>{a.phone || "-"}</td>
//                           <td>
//                             <Badge bg="success">{a.status}</Badge>
//                           </td>
//                           <td>
//                             <div className="d-flex gap-2 flex-wrap">
//                               <Button
//                                 size="sm"
//                                 onClick={() => openCreateEmployeeFromApp(a)}
//                               >
//                                 Create Employee
//                               </Button>

//                               {/* ✅ Delete button (for testing cleanup) */}
//                               <Button
//                                 size="sm"
//                                 variant="outline-danger"
//                                 onClick={() => deleteApplication(a.id)}
//                               >
//                                 Delete
//                               </Button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}
//                   </tbody>
//                 </Table>
//               </Card.Body>
//             </Card>
//           </div>
//         </Tab>
//       </Tabs>
//     </div>
//   );

//   // ----------------------------
//   // STATISTICS TAB (PREMIUM LOOK)
//   // ----------------------------
//   const renderStatistics = () => {
//     const totalEmployees =
//       statistics.totalEmployees ??
//       statistics.employeesCount ??
//       statistics.total_employees ??
//       employees.length ??
//       0;

//     const storeProducts =
//       statistics.storeProducts ??
//       statistics.productsCount ??
//       statistics.store_products ??
//       0;

//     const gamingDevices =
//       statistics.gamingDevices ??
//       statistics.gamingDevicesCount ??
//       statistics.gaming_devices ??
//       0;

//     const sportsFacilities =
//       statistics.sportsFacilities ??
//       statistics.facilitiesCount ??
//       statistics.sports_facilities ??
//       0;

//     return (
//       <div className="analytics-wrap p-4">
//         {/* Floating decoration */}
//         <div className="analytics-orbs">
//           <span className="orb orb-a" />
//           <span className="orb orb-b" />
//           <span className="orb orb-c" />
//         </div>

//         <div className="d-flex justify-content-between align-items-center mb-4">
//           <div>
//             <h4 className="analytics-title">Business Analytics</h4>
//             <div className="analytics-subtitle">
//               Live business performance snapshot
//             </div>
//           </div>

//           <Button
//             variant="outline-secondary"
//             size="sm"
//             onClick={loadStatistics}
//             disabled={loading}
//           >
//             Refresh
//           </Button>
//         </div>

//         {loading ? (
//           <div className="text-center py-4">
//             <Spinner animation="border" variant="primary" />
//             <p className="mt-2 text-muted">Loading statistics...</p>
//           </div>
//         ) : (
//           <>
//             {/* TOP METRIC CARDS */}
//             <Row className="g-3 analytics-metrics">
//               <Col md={3}>
//                 <div className="metric-card metric-store">
//                   <div className="metric-bg" />
//                   <div className="metric-head">
//                     <div className="metric-icon">💰</div>
//                     <div className="metric-meta">
//                       <div className="metric-label">Store Sales</div>
//                       <div className="metric-sub">Total Revenue</div>
//                     </div>
//                   </div>
//                   <div className="metric-value">
//                     ${statistics.storeSales?.toLocaleString() || "0"}
//                   </div>
//                   <div className="metric-foot">
//                     <span className="metric-pill">Store</span>
//                     <span className="metric-fade">Completed payments</span>
//                   </div>
//                 </div>
//               </Col>

//               <Col md={3}>
//                 <div className="metric-card metric-gym">
//                   <div className="metric-bg" />
//                   <div className="metric-head">
//                     <div className="metric-icon">💪</div>
//                     <div className="metric-meta">
//                       <div className="metric-label">Gym Members</div>
//                       <div className="metric-sub">Active Members</div>
//                     </div>
//                   </div>
//                   <div className="metric-value">
//                     {statistics.gymMembers || "0"}
//                   </div>
//                   <div className="metric-foot">
//                     <span className="metric-pill">Gym</span>
//                     <span className="metric-fade">Active subscriptions</span>
//                   </div>
//                 </div>
//               </Col>

//               <Col md={3}>
//                 <div
//                   className="metric-card metric-res"
//                   onClick={() => setShowResCal(true)}
//                   role="button"
//                 >
//                   <div className="metric-bg" />
//                   <div className="metric-head">
//                     <div className="metric-icon">📅</div>
//                     <div className="metric-meta">
//                       <div className="metric-label">Reservations</div>
//                       <div className="metric-sub">Active Bookings</div>
//                     </div>
//                   </div>
//                   <div className="metric-value">
//                     {statistics.activeReservations || "0"}
//                   </div>
//                   <div className="metric-foot">
//                     <span className="metric-pill">Sports</span>
//                     <span className="metric-fade">Click for calendar</span>
//                   </div>
//                 </div>
//               </Col>

//               <Col md={3}>
//                 <div className="metric-card metric-matches">
//                   <div className="metric-bg" />
//                   <div className="metric-head">
//                     <div className="metric-icon">⚽</div>
//                     <div className="metric-meta">
//                       <div className="metric-label">Matches Income</div>
//                       <div className="metric-sub">Ended Matches</div>
//                     </div>
//                   </div>
//                   <div className="metric-value">
//                     ${statistics.matchesIncome?.toLocaleString() || "0"}
//                   </div>
//                   <div className="metric-foot">
//                     <span className="metric-pill">Matches</span>
//                     <span className="metric-fade">Completed / confirmed</span>
//                   </div>
//                 </div>
//               </Col>
//             </Row>

//             {/* QUICK + STATUS */}
//             <Row className="g-3 mt-3">
//               <Col md={6}>
//                 <div className="panel-card quick-panel">
//                   <div className="panel-head">
//                     <div className="panel-title">⚡ Quick Stats</div>
//                     <div className="panel-chip">Totals</div>
//                   </div>

//                   <div className="quick-grid">
//                     <div className="quick-item">
//                       <div className="quick-label">Total Employees</div>
//                       <div className="quick-value">{totalEmployees}</div>
//                     </div>

//                     <div className="quick-item">
//                       <div className="quick-label">Store Products</div>
//                       <div className="quick-value">{storeProducts}</div>
//                     </div>

//                     <div className="quick-item">
//                       <div className="quick-label">Gaming Devices</div>
//                       <div className="quick-value">{gamingDevices}</div>
//                     </div>

//                     <div className="quick-item">
//                       <div className="quick-label">Sports Facilities</div>
//                       <div className="quick-value">{sportsFacilities}</div>
//                     </div>
//                   </div>
//                 </div>
//               </Col>

//               <Col md={6}>
//                 <div className="panel-card status-panel">
//                   <div className="panel-head">
//                     <div className="panel-title">🛡️ System Status</div>
//                     <div className="panel-chip panel-chip-green">Healthy</div>
//                   </div>

//                   <div className="status-list">
//                     <div className="status-row">
//                       <span>Database</span>
//                       <Badge bg="success" className="status-badge">
//                         Online
//                       </Badge>
//                     </div>
//                     <div className="status-row">
//                       <span>Server</span>
//                       <Badge bg="success" className="status-badge">
//                         Stable
//                       </Badge>
//                     </div>
//                     <div className="status-row">
//                       <span>Payments</span>
//                       <Badge bg="success" className="status-badge">
//                         Active
//                       </Badge>
//                     </div>
//                     <div className="status-row">
//                       <span>Security</span>
//                       <Badge bg="success" className="status-badge">
//                         Protected
//                       </Badge>
//                     </div>
//                   </div>
//                 </div>
//               </Col>
//             </Row>

//             <Row className="mt-4">
//               <Col md={12}>
//                 <Card className="border-0 shadow-sm p-3">
//                   <GamingStats />
//                 </Card>
//               </Col>
//             </Row>
//           </>
//         )}

//         <ReservationsCalendarModal
//           show={showResCal}
//           onHide={() => setShowResCal(false)}
//         />
//       </div>
//     );
//   };

//   // ----------------------------
//   // MAIN CONTENT SWITCHER
//   // ----------------------------
//   const renderContent = () => {
//     if (isAdmin) {
//       if (activeMainTab === "overview") return renderServiceTabs();
//       if (activeMainTab === "employees") return renderEmployeesManagement();
//       if (activeMainTab === "statistics") return renderStatistics();
//       return null;
//     }

//     switch (activeMainTab) {
//       case "sports":
//         return <SportsSchedule />;
//       case "gym":
//         return <GymDashboard />;
//       case "gaming":
//         return <GamingZone apiBase={API} />;
//       case "store":
//         return <StoreDashboard />;
//       case "livechat":
//         return <LiveChatAdmin />; // ✅ NEW
//       default:
//         return <SportsSchedule />;
//     }
//   };

//   // ----------------------------
//   // LOGOUT
//   // ----------------------------
//   const handleLogout = async () => {
//     try {
//       setEmployees([]);
//       setStatistics({});
//       setApplications([]);
//       setError("");
//       await logout();
//     } catch {
//       window.location.href = "/";
//     }
//   };

//   // ----------------------------
//   // RENDER
//   // ----------------------------
//   return (
//     <Container fluid className="dashboard-container p-0 bg-light">
//       <Row className="g-0">
//         {/* SIDEBAR */}
//         <Col
//           xs={sidebarCollapsed ? 1 : 3}
//           lg={sidebarCollapsed ? 1 : 2}
//           className="sidebar-col"
//         >
//           <Card className="sidebar h-100 border-0 shadow-sm rounded-0">
//             <Card.Body className="p-3 d-flex flex-column">
//               {/* Header */}
//               <div className="sidebar-header mb-4">
//                 <div className="d-flex align-items-center justify-content-between">
//                   {!sidebarCollapsed && (
//                     <div>
//                       <h5 className="text-gradient mb-1">🏆 Sport Zone</h5>
//                       <small className="text-muted">Management Portal</small>
//                     </div>
//                   )}
//                   <Button
//                     variant="link"
//                     className="text-muted p-0"
//                     onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
//                   >
//                     <i
//                       className={`bi bi-chevron-${
//                         sidebarCollapsed ? "right" : "left"
//                       }`}
//                     />
//                   </Button>
//                 </div>
//               </div>

//               {/* User */}
//               {!sidebarCollapsed && (
//                 <div className="user-info-card mb-4 p-3 rounded">
//                   <h6 className="mb-0">{user?.name}</h6>
//                   <small className="text-muted">
//                     <Badge
//                       bg={isAdmin ? "danger" : "primary"}
//                       className="me-1"
//                     >
//                       {user?.role}
//                     </Badge>
//                     Staff
//                   </small>
//                 </div>
//               )}

//               {/* Nav Items */}
//               <Nav className="flex-column sidebar-nav">
//                 {getSidebarItems().map((item) => (
//                   <Nav.Item key={item.id}>
//                     <Nav.Link
//                       className={`sidebar-nav-link ${
//                         activeMainTab === item.id ? "active" : ""
//                       }`}
//                       onClick={() => setActiveMainTab(item.id)}
//                     >
//                       <div className="d-flex align-items-center">
//                         <span className="nav-icon">{item.icon}</span>
//                         {!sidebarCollapsed && (
//                           <>
//                             <span className="nav-label">{item.label}</span>
//                             {item.badge && (
//                               <Badge bg="secondary" className="ms-auto">
//                                 {item.badge}
//                               </Badge>
//                             )}
//                           </>
//                         )}
//                       </div>
//                     </Nav.Link>
//                   </Nav.Item>
//                 ))}
//               </Nav>

//               {/* Footer */}
//               <div className="sidebar-footer mt-auto">
//                 {!sidebarCollapsed && (
//                   <Button
//                     variant="outline-danger"
//                     size="sm"
//                     className="w-100"
//                     onClick={handleLogout}
//                   >
//                     Logout
//                   </Button>
//                 )}
//               </div>
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* MAIN CONTENT */}
//         <Col
//           xs={sidebarCollapsed ? 11 : 9}
//           lg={sidebarCollapsed ? 11 : 10}
//           className="main-content-col"
//         >
//           <div className="main-content p-4">
//             {/* Page Header */}
//             <Card className="border-0 shadow-sm mb-4">
//               <Card.Body className="py-3">
//                 <div className="d-flex justify-content-between align-items-center">
//                   <div>
//                     <h4 className="text-gradient mb-1">
//                       {activeMainTab === "overview"
//                         ? "Service Overview"
//                         : activeMainTab === "employees"
//                         ? "Employee Management"
//                         : activeMainTab === "statistics"
//                         ? "Business Analytics"
//                         : activeMainTab === "livechat"
//                         ? "Live Chat"
//                         : "Dashboard"}
//                     </h4>
//                     <p className="text-muted mb-0">
//                       {new Date().toLocaleDateString("en-US", {
//                         weekday: "long",
//                         year: "numeric",
//                         month: "long",
//                         day: "numeric"
//                       })}
//                     </p>
//                   </div>

//                   <div className="text-end">
//                     <div className="text-muted small">Welcome back</div>
//                     <div className="fw-bold">{user?.name}</div>
//                   </div>
//                 </div>
//               </Card.Body>
//             </Card>

//             {error && (
//               <Alert variant="danger" className="mb-4">
//                 {error}
//               </Alert>
//             )}

//             {/* Content */}
//             <Card className="border-0 shadow-sm content-card">
//               <Card.Body className="p-0">{renderContent()}</Card.Body>
//             </Card>
//           </div>
//         </Col>
//       </Row>

//       {/* EDIT EMPLOYEE MODAL */}
//       <Modal
//         show={showEditModal}
//         onHide={() => setShowEditModal(false)}
//         centered
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>
//             Edit Employee: {selectedEmployee?.name}
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form>
//             <Form.Group className="mb-3">
//               <Form.Label>Salary</Form.Label>
//               <Form.Control
//                 type="number"
//                 value={editForm.salary}
//                 onChange={(e) =>
//                   setEditForm({ ...editForm, salary: e.target.value })
//                 }
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Job Title</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={editForm.job_title}
//                 onChange={(e) =>
//                   setEditForm({
//                     ...editForm,
//                     job_title: e.target.value
//                   })
//                 }
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>Phone</Form.Label>
//               <Form.Control
//                 type="tel"
//                 value={editForm.phone}
//                 onChange={(e) =>
//                   setEditForm({ ...editForm, phone: e.target.value })
//                 }
//               />
//             </Form.Group>
//           </Form>
//         </Modal.Body>

//         <Modal.Footer>
//           <Button
//             variant="secondary"
//             onClick={() => setShowEditModal(false)}
//           >
//             Cancel
//           </Button>
//           <Button variant="primary" onClick={handleUpdateEmployee}>
//             Save Changes
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* CREATE EMPLOYEE FROM APPLICATION MODAL */}
//       <Modal
//         show={showCreateEmpModal}
//         onHide={() => setShowCreateEmpModal(false)}
//         centered
//       >
//         <Modal.Body
//           style={{
//             background:
//               "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//             color: "white",
//             borderRadius: "15px",
//             padding: "30px"
//           }}
//         >
//           <h3 className="fw-bold text-center mb-3">Create Employee</h3>

//           {selectedAppForCreate && (
//             <div className="bg-white text-dark p-3 rounded shadow-sm mb-3">
//               <strong>Name:</strong> {selectedAppForCreate.full_name} <br />
//               <strong>Email:</strong> {selectedAppForCreate.email} <br />
//               <strong>Phone:</strong> {selectedAppForCreate.phone || "-"} <br />
//             </div>
//           )}

//           {createEmpError && (
//             <div className="alert alert-danger py-2">{createEmpError}</div>
//           )}

//           <Form.Group className="mb-3">
//             <Form.Label className="fw-semibold text-white">
//               Set Password
//             </Form.Label>
//             <Form.Control
//               type="password"
//               placeholder="Enter password…"
//               className="py-3"
//               value={createEmpPassword}
//               onChange={(e) => setCreateEmpPassword(e.target.value)}
//             />
//           </Form.Group>

//           <div className="d-flex justify-content-between">
//             <Button
//               variant="light"
//               onClick={() => setShowCreateEmpModal(false)}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="success"
//               onClick={handleConfirmCreateEmployee}
//               disabled={createEmpSubmitting}
//             >
//               {createEmpSubmitting ? "Creating..." : "Create Employee"}
//             </Button>
//           </div>
//         </Modal.Body>
//       </Modal>
//     </Container>
//   );
// };

// export default Dashboard;
// Front_end/snp/src/pages/Dashboard.js
// ✅ UPDATED + CLEAN STRUCTURE + PREMIUM ANALYTICS DESIGN + LIVE CHAT TAB + STANDARDIZED EMAIL GENERATION + PDF REPORT

import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Nav,
  Tab,
  Tabs,
  Badge,
  Table,
  Alert,
  Modal,
  Form,
  Spinner
} from "react-bootstrap";

import { useAuth } from "../context/AuthContext";
import { employeeService } from "../services/employeeService";
import GamingStats from "../components/dashboard/GamingStats";
import NotificationBell from '../components/notifications/NotificationBell';
// Services
import SportsSchedule from "../components/sports/SportsSchedule";
import GymDashboard from "../components/gym/GymDashboard";
import GamingZone from "../components/gaming/GamingZone";
import StoreDashboard from "./StoreDashboard";

// ✅ NEW statistics widgets
import ReservationsCalendarModal from "../components/dashboard/ReservationsCalendarModal";

// ✅ LIVE CHAT ADMIN COMPONENT
import LiveChatAdmin from "../components/chat/LiveChatAdmin";
import { getStoreStats } from "../services/storeService";

// PDF Generation
import jsPDF from "jspdf";
import "jspdf-autotable";

// ----------------------------
// CONFIG (use .env instead of localhost)
// ----------------------------
const RAW_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// API should end with /api
const API = RAW_BASE.endsWith("/api")
  ? RAW_BASE
  : `${RAW_BASE.replace(/\/$/, "")}/api`;

// Server base for static files (uploads etc.) should be WITHOUT /api
const SERVER_BASE = RAW_BASE.replace(/\/api\/?$/, "").replace(/\/$/, "");

// Helper function to generate standardized email
const generateEmployeeEmail = (fullName) => {
  if (!fullName) return "employee.sportzone@gmail.com";
  
  // Clean the name: lowercase, remove special characters, keep only letters and spaces
  const cleanName = fullName.trim().toLowerCase().replace(/[^a-z\s]/g, '');
  
  // Split into name parts
  const nameParts = cleanName.split(/\s+/).filter(part => part.length > 0);
  
  if (nameParts.length === 0) return "employee.sportzone@gmail.com";
  
  // Use first name (first part) for email
  const firstName = nameParts[0];
  
  // Generate email: firstname.sportzone@gmail.com
  const email = `${firstName}.sportzone@gmail.com`;
  
  return email;
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "Admin";

  // ----------------------------
  // MAIN TABS (Sidebar)
  // ----------------------------
  const [activeMainTab, setActiveMainTab] = useState("overview");
  const [activeServiceTab, setActiveServiceTab] = useState("sports");

  // ----------------------------
  // DATA STATE
  // ----------------------------
  const [employees, setEmployees] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [applications, setApplications] = useState([]);

  // ----------------------------
  // UI STATE
  // ----------------------------
  const [loading, setLoading] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingHiring, setLoadingHiring] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const [error, setError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [showAppModal, setShowAppModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  // ✅ NEW: Reservations calendar modal
  const [showResCal, setShowResCal] = useState(false);

  // Hiring Flag
  const [hiringOpen, setHiringOpen] = useState(false);

  // ✅ NEW Create-Employee modal
  const [showCreateEmpModal, setShowCreateEmpModal] = useState(false);
  const [selectedAppForCreate, setSelectedAppForCreate] = useState(null);
  const [createEmpPassword, setCreateEmpPassword] = useState("");
  const [createEmpError, setCreateEmpError] = useState("");
  const [createEmpSubmitting, setCreateEmpSubmitting] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");

  // ----------------------------
  // EFFECTS
  // ----------------------------
  useEffect(() => {
    if (!isAdmin) return;

    if (activeMainTab === "employees") {
      loadEmployees();
      loadHiringFlag();
      loadApplications();
    }

    if (activeMainTab === "statistics") {
      loadStatistics();
    }
  }, [activeMainTab, isAdmin]);

  // Update generated email when selectedAppForCreate changes
  useEffect(() => {
    if (selectedAppForCreate) {
      const email = generateEmployeeEmail(selectedAppForCreate.full_name);
      setGeneratedEmail(email);
    }
  }, [selectedAppForCreate]);

  // ----------------------------
  // LOADERS
  // ----------------------------
  const loadEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await employeeService.getAllEmployees();
      setEmployees(response.employees || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    setError("");

    try {
      // 1) existing stats (employees/gym/reservations/etc.)
      const response = await employeeService.getStatistics();
      const oldStats = response.statistics || {};

      // 2) matches income
      const matchesRes = await employeeService.getMatchesIncome();

      // 3) store stats (do NOT break page if it fails)
      let storeSales = oldStats.storeSales || 0;
      try {
        const storeRes = await getStoreStats(); // { storeSales, totals? }
        storeSales = storeRes?.storeSales ?? storeSales;
      } catch (e) {
        console.error("getStoreStats failed, using fallback:", e);
      }

      // ✅ final merge
      setStatistics({
        ...oldStats,
        storeSales,
        matchesIncome: matchesRes.matchesIncome || 0
      });
    } catch (err) {
      console.error("loadStatistics error:", err);
      setError("Failed to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  async function loadHiringFlag() {
    try {
      const r = await fetch(`${API}/settings/hiring`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      const text = await r.text();
      const data = text ? JSON.parse(text) : {};
      setHiringOpen(Boolean(data.hiring_open));
    } catch (e) {
      console.error("loadHiringFlag error:", e);
      setHiringOpen(false);
    }
  }

  async function loadApplications() {
    try {
      setLoadingApps(true);

      const res = await fetch(`${API}/jobs/applications`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Dashboard loadApplications: Not JSON:", text.slice(0, 200));
        throw new Error("Server returned invalid response (not JSON).");
      }

      if (!res.ok) {
        console.error("Failed to load applications:", res.status, data);
        throw new Error(data.error || "Failed to load applications");
      }

      setApplications(data.applications || []);
    } catch (err) {
      console.error("loadApplications error:", err);
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  }

  // ----------------------------
  // PDF REPORT GENERATION
  // ----------------------------
// ----------------------------
// PDF REPORT GENERATION
// ----------------------------
const generatePDFReport = () => {
  setGeneratingPDF(true);
  
  try {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let yPosition = 20;

    // Add Sport Zone Logo/Header (without emoji to avoid encoding issues)
    doc.setFontSize(20);
    doc.setTextColor(40, 53, 147); // Dark blue
    doc.text("Sport Zone - Business Analytics Report", 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${currentDate} at ${currentTime}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Generated by: ${user?.name || "Admin"}`, 20, yPosition);
    yPosition += 10;
    
    // Add a line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 15;

    // 1. EXECUTIVE SUMMARY
    doc.setFontSize(16);
    doc.setTextColor(40, 53, 147);
    doc.text("Executive Summary", 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    
    const summaryText1 = "This report provides a comprehensive overview of Sport Zone's business";
    const summaryText2 = "performance, including financial metrics, operational statistics, and";
    const summaryText3 = "key performance indicators for strategic decision-making.";
    
    doc.text(summaryText1, 20, yPosition);
    yPosition += 6;
    doc.text(summaryText2, 20, yPosition);
    yPosition += 6;
    doc.text(summaryText3, 20, yPosition);
    yPosition += 15;

    // 2. FINANCIAL METRICS - Using text with visual separation
    doc.setFontSize(14);
    doc.setTextColor(40, 53, 147);
    doc.text("💰 Financial Performance", 20, yPosition);
    yPosition += 10;

    const storeSales = statistics.storeSales || 0;
    const matchesIncome = statistics.matchesIncome || 0;
    const monthlyIncome = statistics.monthlyIncome || 0;
    const totalRevenue = storeSales + matchesIncome + monthlyIncome;

    // Financial metrics as bullet points with visual boxes
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    
    // Store Sales
    doc.setFillColor(240, 248, 255);
    doc.rect(25, yPosition, 160, 8, 'F');
    doc.text("Store Sales Revenue:", 30, yPosition + 6);
    doc.setTextColor(40, 53, 147);
    doc.text(`$${storeSales.toLocaleString()}`, 100, yPosition + 6);
    doc.setTextColor(100, 100, 100);
    doc.text("Total revenue from store product sales", 130, yPosition + 6);
    yPosition += 12;

    // Matches Income
    doc.setFillColor(255, 248, 240);
    doc.rect(25, yPosition, 160, 8, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text("Matches Income:", 30, yPosition + 6);
    doc.setTextColor(219, 68, 55);
    doc.text(`$${matchesIncome.toLocaleString()}`, 100, yPosition + 6);
    doc.setTextColor(100, 100, 100);
    doc.text("Income from completed sports matches", 130, yPosition + 6);
    yPosition += 12;

    // Monthly Income
    doc.setFillColor(240, 255, 240);
    doc.rect(25, yPosition, 160, 8, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text("Monthly Income:", 30, yPosition + 6);
    doc.setTextColor(15, 157, 88);
    doc.text(`$${monthlyIncome.toLocaleString()}`, 100, yPosition + 6);
    doc.setTextColor(100, 100, 100);
    doc.text("Total income for current month", 130, yPosition + 6);
    yPosition += 12;

    // Total Revenue (highlighted)
    doc.setFillColor(255, 245, 230);
    doc.rect(25, yPosition, 160, 10, 'F');
    doc.setFontSize(13);
    doc.setTextColor(40, 53, 147);
    doc.text("TOTAL REVENUE:", 30, yPosition + 7);
    doc.setFontSize(14);
    doc.setTextColor(219, 68, 55);
    doc.text(`$${totalRevenue.toLocaleString()}`, 100, yPosition + 7);
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text("Combined total revenue", 130, yPosition + 7);
    yPosition += 20;

    // 3. OPERATIONAL METRICS - Using a grid layout
    doc.setFontSize(14);
    doc.setTextColor(40, 53, 147);
    doc.text("📊 Operational Statistics", 20, yPosition);
    yPosition += 10;

    const totalEmployees = statistics.totalEmployees || employees.length || 0;
    const gymMembers = statistics.gymMembers || 0;
    const activeReservations = statistics.activeReservations || 0;
    const storeProducts = statistics.storeProducts || 0;
    const gamingDevices = statistics.gamingDevices || 0;
    const sportsFacilities = statistics.sportsFacilities || 0;

    // Create a grid of metrics (2 columns)
    doc.setFontSize(12);
    
    // Column 1
    let col1X = 25;
    let col2X = 105;
    let rowHeight = 10;
    
    // Row 1
    doc.setFillColor(245, 245, 245);
    doc.rect(col1X, yPosition, 75, rowHeight, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text("Employees", col1X + 5, yPosition + 7);
    doc.setTextColor(40, 53, 147);
    doc.text(totalEmployees.toString(), col1X + 60, yPosition + 7);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(col2X, yPosition, 75, rowHeight, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text("Gym Members", col2X + 5, yPosition + 7);
    doc.setTextColor(40, 53, 147);
    doc.text(gymMembers.toString(), col2X + 60, yPosition + 7);
    yPosition += rowHeight + 2;

    // Row 2
    doc.setFillColor(255, 255, 255);
    doc.rect(col1X, yPosition, 75, rowHeight, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text("Reservations", col1X + 5, yPosition + 7);
    doc.setTextColor(219, 68, 55);
    doc.text(activeReservations.toString(), col1X + 60, yPosition + 7);
    
    doc.setFillColor(255, 255, 255);
    doc.rect(col2X, yPosition, 75, rowHeight, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text("Store Products", col2X + 5, yPosition + 7);
    doc.setTextColor(15, 157, 88);
    doc.text(storeProducts.toString(), col2X + 60, yPosition + 7);
    yPosition += rowHeight + 2;

    // Row 3
    doc.setFillColor(245, 245, 245);
    doc.rect(col1X, yPosition, 75, rowHeight, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text("Gaming Devices", col1X + 5, yPosition + 7);
    doc.setTextColor(156, 39, 176);
    doc.text(gamingDevices.toString(), col1X + 60, yPosition + 7);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(col2X, yPosition, 75, rowHeight, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text("Sports Facilities", col2X + 5, yPosition + 7);
    doc.setTextColor(255, 112, 67);
    doc.text(sportsFacilities.toString(), col2X + 60, yPosition + 7);
    yPosition += 20;

    // 4. SYSTEM STATUS - Using badges/indicators
    doc.setFontSize(14);
    doc.setTextColor(40, 53, 147);
    doc.text("🛡️ System Status", 20, yPosition);
    yPosition += 10;

    // System status items
    const systemItems = [
      { label: "Database", status: "Online", color: [15, 157, 88] },
      { label: "Server", status: "Stable", color: [66, 133, 244] },
      { label: "Payments", status: "Active", color: [15, 157, 88] },
      { label: "Security", status: "Protected", color: [15, 157, 88] },
      { label: "Hiring", status: hiringOpen ? "OPEN" : "CLOSED", color: hiringOpen ? [15, 157, 88] : [219, 68, 55] }
    ];

    doc.setFontSize(12);
    systemItems.forEach((item, index) => {
      // Draw status indicator
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.circle(30, yPosition + 4, 3, 'F');
      
      // Draw label
      doc.setTextColor(60, 60, 60);
      doc.text(item.label, 40, yPosition + 7);
      
      // Draw status with color
      doc.setTextColor(item.color[0], item.color[1], item.color[2]);
      doc.text(item.status, 90, yPosition + 7);
      
      // Draw last check time
      doc.setTextColor(150, 150, 150);
      doc.text(currentTime, 140, yPosition + 7);
      
      yPosition += 10;
    });

    yPosition += 10;

    // 5. APPLICATIONS SUMMARY (if available)
    if (applications.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(40, 53, 147);
      doc.text("📝 Job Applications", 20, yPosition);
      yPosition += 10;

      const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      // Applications progress bars
      const statuses = [
        { label: "Pending", count: statusCounts.Pending || 0, color: [158, 158, 158] },
        { label: "Accepted", count: statusCounts.Accepted || 0, color: [15, 157, 88] },
        { label: "Rejected", count: statusCounts.Rejected || 0, color: [219, 68, 55] },
        { label: "Registered", count: statusCounts.Registered || 0, color: [66, 133, 244] }
      ];

      doc.setFontSize(12);
      statuses.forEach(status => {
        if (status.count > 0) {
          const percentage = (status.count / applications.length * 100).toFixed(1);
          
          // Draw label
          doc.setTextColor(60, 60, 60);
          doc.text(status.label, 30, yPosition + 7);
          
          // Draw count
          doc.setTextColor(status.color[0], status.color[1], status.color[2]);
          doc.text(status.count.toString(), 80, yPosition + 7);
          
          // Draw percentage
          doc.text(`${percentage}%`, 110, yPosition + 7);
          
          // Draw progress bar background
          doc.setFillColor(240, 240, 240);
          doc.rect(130, yPosition + 3, 50, 4, 'F');
          
          // Draw progress bar fill
          doc.setFillColor(status.color[0], status.color[1], status.color[2]);
          doc.rect(130, yPosition + 3, (percentage / 100) * 50, 4, 'F');
          
          yPosition += 10;
        }
      });
      
      // Total applications
      yPosition += 5;
      doc.setFillColor(245, 245, 245);
      doc.rect(25, yPosition, 160, 8, 'F');
      doc.setTextColor(40, 53, 147);
      doc.text("TOTAL APPLICATIONS:", 30, yPosition + 6);
      doc.setFontSize(13);
      doc.text(applications.length.toString(), 120, yPosition + 6);
      yPosition += 15;
    }

    // 6. FOOTER AND PAGE NUMBERS
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Confidential - For Internal Use Only", 20, 280);
    doc.text("Sport Zone Management System", 150, 280);
    
    // Page number
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, 190, 285, null, null, 'right');
    }

    // Save the PDF
    const fileName = `SportZone_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    alert(`✅ PDF report generated successfully: ${fileName}`);
    
  } catch (error) {
    console.error("PDF generation error:", error);
    alert("❌ Failed to generate PDF report. Please try again.");
  } finally {
    setGeneratingPDF(false);
  }
};
  // ✅ DELETE APPLICATION
  async function deleteApplication(id) {
    if (!window.confirm("Delete this application permanently?")) return;

    try {
      const res = await fetch(`${API}/jobs/applications/${id}`, {
        method: "DELETE",
        headers: { "ngrok-skip-browser-warning": "true" }
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {}

      if (!res.ok) throw new Error(data.error || "Failed to delete application");

      loadApplications();
    } catch (e) {
      console.error("Delete application error:", e);
      alert(e.message || "Delete failed");
    }
  }

  // ----------------------------
  // EMPLOYEE CRUD
  // ----------------------------
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      salary: employee.salary || "",
      job_title: employee.job_title || "",
      phone: employee.phone || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    try {
      await employeeService.updateEmployee(selectedEmployee.user_id, editForm);
      setShowEditModal(false);
      loadEmployees();
      alert("Employee updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating employee.");
    }
  };

  const handleDeleteEmployee = async (userId, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try {
      await employeeService.deleteEmployee(userId);
      loadEmployees();
      alert("Employee deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Error deleting employee.");
    }
  };

  // ----------------------------
  // HIRING TOGGLE
  // ----------------------------
  const toggleHiring = async () => {
    try {
      setLoadingHiring(true);
      const next = !hiringOpen;

      const res = await fetch(`${API}/settings/hiring`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ open: next })
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setHiringOpen(Boolean(data.hiring_open));
    } catch (e) {
      console.error("Toggle hiring failed", e);
    } finally {
      setLoadingHiring(false);
    }
  };

  // ----------------------------
  // APPLICATIONS
  // ----------------------------
  async function updateAppStatus(id, status) {
    try {
      const res = await fetch(`${API}/jobs/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ status })
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("updateAppStatus not JSON:", text.slice(0, 200));
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to update application status");
      }

      loadApplications();
    } catch (e) {
      console.error("Failed to update status", e);
    }
  }

  function openCreateEmployeeFromApp(app) {
    setSelectedAppForCreate(app);
    setCreateEmpPassword("");
    setCreateEmpError("");
    const email = generateEmployeeEmail(app.full_name);
    setGeneratedEmail(email);
    setShowCreateEmpModal(true);
  }

  async function handleConfirmCreateEmployee() {
    if (!selectedAppForCreate) return;

    if (!createEmpPassword || createEmpPassword.length < 6) {
      setCreateEmpError("Password must be at least 6 characters.");
      return;
    }

    try {
      setCreateEmpSubmitting(true);
      setCreateEmpError("");

      // ✅ Use generated email instead of applicant's email
      const employeeEmail = generatedEmail || generateEmployeeEmail(selectedAppForCreate.full_name);

      await employeeService.createEmployee({
        name: selectedAppForCreate.full_name,
        email: employeeEmail,  // ✅ Use generated standardized email
        phone: selectedAppForCreate.phone || "",
        salary: 0,
        job_title: "Staff Member",
        password: createEmpPassword
      });

      await updateAppStatus(selectedAppForCreate.id, "Registered");
      await loadEmployees();
      await loadApplications();

      alert(`Employee created successfully!\n\nName: ${selectedAppForCreate.full_name}\nEmail: ${employeeEmail}\nPassword: ${createEmpPassword}\n\nPlease provide these credentials to the new employee.`);
      setShowCreateEmpModal(false);
    } catch (e) {
      console.error(e);
      // Handle duplicate email error
      if (e.message && e.message.includes('Email already exists')) {
        setCreateEmpError(`Email ${generatedEmail} already exists. Please try a different name or contact support.`);
      } else {
        setCreateEmpError(
          e.response?.data?.error || e.message || "Failed to create employee."
        );
      }
    } finally {
      setCreateEmpSubmitting(false);
    }
  }

  // ----------------------------
  // SIDEBAR ITEMS
  // ----------------------------
  const getSidebarItems = () => {
    if (isAdmin) {
      return [
        { id: "overview", label: "📊 Overview", icon: "📊", badge: "All" },
        { id: "employees", label: "👥 Employees", icon: "👥", badge: "Admin" },
        { id: "statistics", label: "📈 Statistics", icon: "📈", badge: "Admin" }
      ];
    }

    return [
      { id: "sports", label: "⚽ Sports Reservation", icon: "⚽" },
      { id: "gym", label: "💪 Gym & Coaching", icon: "💪" },
      { id: "gaming", label: "🎮 Gaming Zone", icon: "🎮" },
      { id: "store", label: "🛍️ Sport Store", icon: "🛍️" },
      { id: "livechat", label: "💬 Live Chat", icon: "💬" } // ✅ NEW
    ];
  };

  // ✅ SERVICE TABS inside Overview (admin + employee)
  const serviceTabs = [
    { id: "sports", label: "⚽ Sports Reservation", icon: "⚽" },
    { id: "gym", label: "💪 Gym & Coaching", icon: "💪" },
    { id: "gaming", label: "🎮 Gaming Zone", icon: "🎮" },
    { id: "store", label: "🛍️ Sport Store", icon: "🛍️" },
    { id: "livechat", label: "💬 Live Chat", icon: "💬" } // ✅ NEW
  ];

  // ----------------------------
  // OVERVIEW - TAB CONTENT
  // ----------------------------
  const renderServiceContent = (service) => {
    const content = {
      sports: <SportsSchedule />,
      gym: <GymDashboard />,
      gaming: <GamingZone apiBase={API} />,
      store: <StoreDashboard />,
      livechat: <LiveChatAdmin /> // ✅ NEW
    };
    return content[service] || <div>Service not found</div>;
  };

  const renderServiceTabs = () => (
    <div className="service-tabs-container">
      <div className="service-tabs-header mb-4">
        <h4 className="text-gradient">
          {isAdmin ? "Service Management" : "Quick Access"}
        </h4>
        <p className="text-muted">
          {isAdmin
            ? "Manage all Sport Zone services from one place"
            : "Access your assigned services quickly"}
        </p>
      </div>

      <Tabs
        activeKey={activeServiceTab}
        onSelect={(tab) => setActiveServiceTab(tab)}
        className="service-tabs mb-4"
        fill
      >
        {serviceTabs.map((service) => (
          <Tab
            key={service.id}
            eventKey={service.id}
            title={
              <div
                className={
                  "d-flex align-items-center justify-content-center service-tab-title " +
                  service.id +
                  "-tab-wrapper"
                }
              >
                <span className="me-2">{service.icon}</span>
                <span>{service.label}</span>

                {/* Thought bubble */}
                <span
                  className={
                    `thought-bubble thought-bubble-${service.id}` +
                    (activeServiceTab === service.id ? " visible" : "")
                  }
                >
                  {service.id === "sports" && (
                    <>
                      <span className="thought-emoji">⚽</span>
                      <span className="thought-emoji ms-1">🏀</span>
                      <span className="thought-emoji ms-1">🎾</span>
                    </>
                  )}

                  {service.id === "gym" && (
                    <>
                      <span className="thought-emoji">💪</span>
                      <span className="thought-emoji ms-1">🏋️</span>
                    </>
                  )}

                  {service.id === "gaming" && (
                    <>
                      <span className="thought-emoji">🎮</span>
                      <span className="thought-emoji ms-1">🎧</span>
                    </>
                  )}

                  {service.id === "store" && (
                    <>
                      <span className="thought-emoji">👟</span>
                      <span className="thought-emoji ms-1">👕</span>
                    </>
                  )}

                  {service.id === "livechat" && (
                    <>
                      <span className="thought-emoji">💬</span>
                      <span className="thought-emoji ms-1">🔔</span>
                    </>
                  )}
                </span>
              </div>
            }
          >
            <div className="p-4">{renderServiceContent(service.id)}</div>
          </Tab>
        ))}
      </Tabs>
    </div>
  );

  // ----------------------------
  // EMPLOYEES MANAGEMENT (3 SUB-TABS)
  // ----------------------------
  const renderEmployeesManagement = () => (
    <div className="p-4">
      <Tabs
        defaultActiveKey="staff"
        id="employees-tabs"
        className="mb-3"
        fill
        onSelect={(k) => {
          if (k === "apps" || k === "register") loadApplications();
        }}
      >
        {/* TAB 1 — Staff */}
        <Tab eventKey="staff" title="Staff Management">
          <div className="pt-2">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="text-gradient">Staff Management</h4>

              <div className="d-flex align-items-center gap-3">
                {isAdmin && (
                  <Form.Check
                    type="switch"
                    id="hiring-switch"
                    label={hiringOpen ? "Hiring: ON" : "Hiring: OFF"}
                    checked={hiringOpen}
                    onChange={toggleHiring}
                    disabled={loadingHiring}
                  />
                )}

                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={loadEmployees}
                  disabled={loading}
                >
                  Refresh
                </Button>

                <Button variant="primary" size="sm" disabled>
                  Add Employee
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading employees...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-5">
                <h5>No Employees Found</h5>
                <p className="text-muted">
                  No employees are currently registered in the system.
                </p>
                <Button variant="outline-primary" onClick={loadEmployees}>
                  Try Again
                </Button>
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    Current Employees ({employees.length})
                  </h6>
                  <small className="text-muted">
                    Last updated: {new Date().toLocaleTimeString()}
                  </small>
                </Card.Header>

                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Job Title</th>
                        <th>Salary</th>
                        <th>Phone</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((employee) => (
                        <tr key={employee.user_id}>
                          <td>{employee.user_id}</td>
                          <td>{employee.name}</td>
                          <td>{employee.email}</td>
                          <td>
                            <Badge
                              bg={
                                employee.role === "Admin"
                                  ? "danger"
                                  : "primary"
                              }
                            >
                              {employee.role}
                            </Badge>
                          </td>
                          <td>{employee.job_title || "Not assigned"}</td>
                          <td>
                            {employee.salary ? (
                              <strong>
                                ${employee.salary.toLocaleString()}
                              </strong>
                            ) : (
                              <span className="text-muted">Not set</span>
                            )}
                          </td>
                          <td>{employee.phone || "Not provided"}</td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-1"
                              onClick={() => handleEditEmployee(employee)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                handleDeleteEmployee(
                                  employee.user_id,
                                  employee.name
                                )
                              }
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
          </div>
        </Tab>

        {/* TAB 2 — Applications */}
        <Tab eventKey="apps" title="Applications Receiving">
          {loadingApps ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No applications yet.
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  Job Applications ({applications.length})
                </h6>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={loadApplications}
                >
                  Refresh
                </Button>
              </Card.Header>

              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>CV</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((a) => (
                      <tr
                        key={a.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedApp(a);
                          setShowAppModal(true);
                        }}
                      >
                        <td>{a.id}</td>
                        <td>{a.full_name}</td>
                        <td>{a.email}</td>
                        <td>{a.phone || "-"}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {a.cv_image_path ? (
                            <a
                              href={`${SERVER_BASE}${a.cv_image_path}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          ) : a.cv_link ? (
                            <a
                              href={a.cv_link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>
                          <Badge
                            bg={
                              a.status === "Accepted"
                                ? "success"
                                : a.status === "Rejected"
                                ? "danger"
                                : a.status === "Registered"
                                ? "info"
                                : "secondary"
                            }
                          >
                            {a.status}
                          </Badge>
                        </td>
                        <td>{new Date(a.created_at).toLocaleString()}</td>

                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="d-flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline-success"
                              disabled={
                                a.status === "Accepted" ||
                                a.status === "Registered"
                              }
                              onClick={() => updateAppStatus(a.id, "Accepted")}
                            >
                              Accept
                            </Button>

                            <Button
                              size="sm"
                              variant="outline-danger"
                              disabled={
                                a.status === "Rejected" ||
                                a.status === "Registered"
                              }
                              onClick={() => updateAppStatus(a.id, "Rejected")}
                            >
                              Reject
                            </Button>

                            {/* ✅ Delete appears only if Rejected */}
                            {a.status === "Rejected" && (
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => deleteApplication(a.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Details Modal */}
          <Modal
            show={showAppModal}
            onHide={() => setShowAppModal(false)}
            centered
            size="md"
          >
            <Modal.Header closeButton>
              <Modal.Title>Application #{selectedApp?.id}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {selectedApp && (
                <>
                  <p>
                    <strong>Name:</strong> {selectedApp.full_name}
                  </p>
                  <p>
                    <strong>Original Email:</strong> {selectedApp.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedApp.phone || "-"}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedApp.status}
                  </p>
                  <p>
                    <strong>Employee Email:</strong>{" "}
                    <span className="text-primary fw-bold">
                      {generateEmployeeEmail(selectedApp.full_name)}
                    </span>
                  </p>
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              {selectedApp?.status === "Accepted" && (
                <Button
                  onClick={() => {
                    setShowAppModal(false);
                    openCreateEmployeeFromApp(selectedApp);
                  }}
                >
                  Create Employee
                </Button>
              )}

              {/* ✅ Optional: allow delete from modal if Rejected */}
              {selectedApp?.status === "Rejected" && (
                <Button
                  variant="outline-danger"
                  onClick={() => {
                    setShowAppModal(false);
                    deleteApplication(selectedApp.id);
                  }}
                >
                  Delete
                </Button>
              )}

              <Button
                variant="secondary"
                onClick={() => setShowAppModal(false)}
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Tab>

        {/* TAB 3 — Register Employee */}
        <Tab eventKey="register" title="Register Employee">
          <div className="p-3">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between">
                <h6 className="mb-0">Accepted Applications</h6>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={loadApplications}
                >
                  Refresh
                </Button>
              </Card.Header>

              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Employee Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications
                      .filter((a) => a.status === "Accepted")
                      .map((a) => (
                        <tr key={a.id}>
                          <td>{a.id}</td>
                          <td>{a.full_name}</td>
                          <td>{a.email}</td>
                          <td>{a.phone || "-"}</td>
                          <td>
                            <Badge bg="success">{a.status}</Badge>
                          </td>
                          <td>
                            <span className="text-primary fw-bold">
                              {generateEmployeeEmail(a.full_name)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                onClick={() => openCreateEmployeeFromApp(a)}
                              >
                                Create Employee
                              </Button>

                              {/* ✅ Delete button (for testing cleanup) */}
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => deleteApplication(a.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );

  // ----------------------------
  // STATISTICS TAB (PREMIUM LOOK)
  // ----------------------------
  const renderStatistics = () => {
    const totalEmployees =
      statistics.totalEmployees ??
      statistics.employeesCount ??
      statistics.total_employees ??
      employees.length ??
      0;

    const storeProducts =
      statistics.storeProducts ??
      statistics.productsCount ??
      statistics.store_products ??
      0;

    const gamingDevices =
      statistics.gamingDevices ??
      statistics.gamingDevicesCount ??
      statistics.gaming_devices ??
      0;

    const sportsFacilities =
      statistics.sportsFacilities ??
      statistics.facilitiesCount ??
      statistics.sports_facilities ??
      0;

    return (
      <div className="analytics-wrap p-4">
        {/* Floating decoration */}
        <div className="analytics-orbs">
          <span className="orb orb-a" />
          <span className="orb orb-b" />
          <span className="orb orb-c" />
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="analytics-title">Business Analytics</h4>
            <div className="analytics-subtitle">
              Live business performance snapshot
            </div>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={loadStatistics}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={generatePDFReport}
              disabled={generatingPDF || loading}
            >
              {generatingPDF ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <i className="bi bi-file-earmark-pdf me-2"></i>
                  Generate PDF Report
                </>
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading statistics...</p>
          </div>
        ) : (
          <>
            {/* TOP METRIC CARDS */}
            <Row className="g-3 analytics-metrics">
              <Col md={3}>
                <div className="metric-card metric-store">
                  <div className="metric-bg" />
                  <div className="metric-head">
                    <div className="metric-icon">💰</div>
                    <div className="metric-meta">
                      <div className="metric-label">Store Sales</div>
                      <div className="metric-sub">Total Revenue</div>
                    </div>
                  </div>
                  <div className="metric-value">
                    ${statistics.storeSales?.toLocaleString() || "0"}
                  </div>
                  <div className="metric-foot">
                    <span className="metric-pill">Store</span>
                    <span className="metric-fade">Completed payments</span>
                  </div>
                </div>
              </Col>

              <Col md={3}>
                <div className="metric-card metric-gym">
                  <div className="metric-bg" />
                  <div className="metric-head">
                    <div className="metric-icon">💪</div>
                    <div className="metric-meta">
                      <div className="metric-label">Gym Members</div>
                      <div className="metric-sub">Active Members</div>
                    </div>
                  </div>
                  <div className="metric-value">
                    {statistics.gymMembers || "0"}
                  </div>
                  <div className="metric-foot">
                    <span className="metric-pill">Gym</span>
                    <span className="metric-fade">Active subscriptions</span>
                  </div>
                </div>
              </Col>

              <Col md={3}>
                <div
                  className="metric-card metric-res"
                  onClick={() => setShowResCal(true)}
                  role="button"
                >
                  <div className="metric-bg" />
                  <div className="metric-head">
                    <div className="metric-icon">📅</div>
                    <div className="metric-meta">
                      <div className="metric-label">Reservations</div>
                      <div className="metric-sub">Active Bookings</div>
                    </div>
                  </div>
                  <div className="metric-value">
                    {statistics.activeReservations || "0"}
                  </div>
                  <div className="metric-foot">
                    <span className="metric-pill">Sports</span>
                    <span className="metric-fade">Click for calendar</span>
                  </div>
                </div>
              </Col>

              <Col md={3}>
                <div className="metric-card metric-matches">
                  <div className="metric-bg" />
                  <div className="metric-head">
                    <div className="metric-icon">⚽</div>
                    <div className="metric-meta">
                      <div className="metric-label">Matches Income</div>
                      <div className="metric-sub">Ended Matches</div>
                    </div>
                  </div>
                  <div className="metric-value">
                    ${statistics.matchesIncome?.toLocaleString() || "0"}
                  </div>
                  <div className="metric-foot">
                    <span className="metric-pill">Matches</span>
                    <span className="metric-fade">Completed / confirmed</span>
                  </div>
                </div>
              </Col>
            </Row>

            {/* QUICK + STATUS */}
            <Row className="g-3 mt-3">
              <Col md={6}>
                <div className="panel-card quick-panel">
                  <div className="panel-head">
                    <div className="panel-title">⚡ Quick Stats</div>
                    <div className="panel-chip">Totals</div>
                  </div>

                  <div className="quick-grid">
                    <div className="quick-item">
                      <div className="quick-label">Total Employees</div>
                      <div className="quick-value">{totalEmployees}</div>
                    </div>

                    <div className="quick-item">
                      <div className="quick-label">Store Products</div>
                      <div className="quick-value">{storeProducts}</div>
                    </div>

                    <div className="quick-item">
                      <div className="quick-label">Gaming Devices</div>
                      <div className="quick-value">{gamingDevices}</div>
                    </div>

                    <div className="quick-item">
                      <div className="quick-label">Sports Facilities</div>
                      <div className="quick-value">{sportsFacilities}</div>
                    </div>
                  </div>
                </div>
              </Col>

              <Col md={6}>
                <div className="panel-card status-panel">
                  <div className="panel-head">
                    <div className="panel-title">🛡️ System Status</div>
                    <div className="panel-chip panel-chip-green">Healthy</div>
                  </div>

                  <div className="status-list">
                    <div className="status-row">
                      <span>Database</span>
                      <Badge bg="success" className="status-badge">
                        Online
                      </Badge>
                    </div>
                    <div className="status-row">
                      <span>Server</span>
                      <Badge bg="success" className="status-badge">
                        Stable
                      </Badge>
                    </div>
                    <div className="status-row">
                      <span>Payments</span>
                      <Badge bg="success" className="status-badge">
                        Active
                      </Badge>
                    </div>
                    <div className="status-row">
                      <span>Security</span>
                      <Badge bg="success" className="status-badge">
                        Protected
                      </Badge>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            <Row className="mt-4">
              <Col md={12}>
                <Card className="border-0 shadow-sm p-3">
                  <GamingStats />
                </Card>
              </Col>
            </Row>
          </>
        )}

        <ReservationsCalendarModal
          show={showResCal}
          onHide={() => setShowResCal(false)}
        />
      </div>
    );
  };

  // ----------------------------
  // MAIN CONTENT SWITCHER
  // ----------------------------
  const renderContent = () => {
    if (isAdmin) {
      if (activeMainTab === "overview") return renderServiceTabs();
      if (activeMainTab === "employees") return renderEmployeesManagement();
      if (activeMainTab === "statistics") return renderStatistics();
      return null;
    }

    switch (activeMainTab) {
      case "sports":
        return <SportsSchedule />;
      case "gym":
        return <GymDashboard />;
      case "gaming":
        return <GamingZone apiBase={API} />;
      case "store":
        return <StoreDashboard />;
      case "livechat":
        return <LiveChatAdmin />; // ✅ NEW
      default:
        return <SportsSchedule />;
    }
  };

  // ----------------------------
  // LOGOUT
  // ----------------------------
  const handleLogout = async () => {
    try {
      setEmployees([]);
      setStatistics({});
      setApplications([]);
      setError("");
      await logout();
    } catch {
      window.location.href = "/";
    }
  };

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <Container fluid className="dashboard-container p-0 bg-light">
      <Row className="g-0">
        {/* SIDEBAR */}
        <Col
          xs={sidebarCollapsed ? 1 : 3}
          lg={sidebarCollapsed ? 1 : 2}
          className="sidebar-col"
        >
          <Card className="sidebar h-100 border-0 shadow-sm rounded-0">
            <Card.Body className="p-3 d-flex flex-column">
              {/* Header */}
              <div className="sidebar-header mb-4">
                <div className="d-flex align-items-center justify-content-between">
                  {!sidebarCollapsed && (
                    <div>
                      <h5 className="text-gradient mb-1">🏆 Sport Zone</h5>
                      <small className="text-muted">Management Portal</small>
                    </div>
                  )}
                  <Button
                    variant="link"
                    className="text-muted p-0"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  >
                    <i
                      className={`bi bi-chevron-${
                        sidebarCollapsed ? "right" : "left"
                      }`}
                    />
                  </Button>
                </div>
              </div>

              {/* User */}
              {!sidebarCollapsed && (
                <div className="user-info-card mb-4 p-3 rounded">
                  <h6 className="mb-0">{user?.name}</h6>
                  <small className="text-muted">
                    <Badge
                      bg={isAdmin ? "danger" : "primary"}
                      className="me-1"
                    >
                      {user?.role}
                    </Badge>
                    Staff
                  </small>
                </div>
              )}

              {/* Nav Items */}
              <Nav className="flex-column sidebar-nav">
                {getSidebarItems().map((item) => (
                  <Nav.Item key={item.id}>
                    <Nav.Link
                      className={`sidebar-nav-link ${
                        activeMainTab === item.id ? "active" : ""
                      }`}
                      onClick={() => setActiveMainTab(item.id)}
                    >
                      <div className="d-flex align-items-center">
                        <span className="nav-icon">{item.icon}</span>
                        {!sidebarCollapsed && (
                          <>
                            <span className="nav-label">{item.label}</span>
                            {item.badge && (
                              <Badge bg="secondary" className="ms-auto">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>

              {/* Footer */}
              <div className="sidebar-footer mt-auto">
                {!sidebarCollapsed && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="w-100"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* MAIN CONTENT */}
        <Col
          xs={sidebarCollapsed ? 11 : 9}
          lg={sidebarCollapsed ? 11 : 10}
          className="main-content-col"
        >
          <div className="main-content p-4">
            {/* Page Header */}
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="text-gradient mb-1">
                      {activeMainTab === "overview"
                        ? "Service Overview"
                        : activeMainTab === "employees"
                        ? "Employee Management"
                        : activeMainTab === "statistics"
                        ? "Business Analytics"
                        : activeMainTab === "livechat"
                        ? "Live Chat"
                        : "Dashboard"}
                    </h4>
                    <p className="text-muted mb-0">
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>

                  <div className="text-end d-flex align-items-center gap-3">
  {/* Notification Bell */}
  <NotificationBell />
  
  <div>
    <div className="text-muted small">Welcome back</div>
    <div className="fw-bold">{user?.name}</div>
  </div>
</div>
                </div>
              </Card.Body>
            </Card>

            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            {/* Content */}
            <Card className="border-0 shadow-sm content-card">
              <Card.Body className="p-0">{renderContent()}</Card.Body>
            </Card>
          </div>
        </Col>
      </Row>

      {/* EDIT EMPLOYEE MODAL */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Edit Employee: {selectedEmployee?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Salary</Form.Label>
              <Form.Control
                type="number"
                value={editForm.salary}
                onChange={(e) =>
                  setEditForm({ ...editForm, salary: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Job Title</Form.Label>
              <Form.Control
                type="text"
                value={editForm.job_title}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    job_title: e.target.value
                  })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="tel"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateEmployee}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CREATE EMPLOYEE FROM APPLICATION MODAL */}
      <Modal
        show={showCreateEmpModal}
        onHide={() => setShowCreateEmpModal(false)}
        centered
      >
        <Modal.Body
          style={{
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            borderRadius: "15px",
            padding: "30px"
          }}
        >
          <h3 className="fw-bold text-center mb-3">Create Employee</h3>

          {selectedAppForCreate && (
            <div className="bg-white text-dark p-3 rounded shadow-sm mb-3">
              <strong>Name:</strong> {selectedAppForCreate.full_name} <br />
              <strong>Original Email:</strong> {selectedAppForCreate.email} <br />
              <strong>Employee Email:</strong>{" "}
              <span className="text-primary fw-bold">
                {generatedEmail}
              </span> <br />
              <strong>Phone:</strong> {selectedAppForCreate.phone || "-"} <br />
              <small className="text-muted">
                ⚠️ Employee will use the standardized email above, not their personal email
              </small>
            </div>
          )}

          {createEmpError && (
            <div className="alert alert-danger py-2">{createEmpError}</div>
          )}

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold text-white">
              Set Password for {selectedAppForCreate?.full_name.split(' ')[0] || "Employee"}
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password (min. 6 characters)…"
              className="py-3"
              value={createEmpPassword}
              onChange={(e) => setCreateEmpPassword(e.target.value)}
            />
            <Form.Text className="text-white-50">
              Employee will login with: <strong>{generatedEmail}</strong>
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Button
              variant="light"
              onClick={() => setShowCreateEmpModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleConfirmCreateEmployee}
              disabled={createEmpSubmitting}
            >
              {createEmpSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Creating...
                </>
              ) : (
                "Create Employee"
              )}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Dashboard;