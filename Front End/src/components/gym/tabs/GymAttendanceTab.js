// // import React, { useEffect, useMemo, useState } from "react";
// // import { 
// //   Row, Col, Card, Table, Form, Button, Spinner, Badge,
// //   Modal, ProgressBar, Tabs, Tab, ListGroup, Alert
// // } from "react-bootstrap";
// // import axios from "axios";
// // import { 
// //   FaDumbbell, FaRunning, FaCalendarCheck, FaChartLine, 
// //   FaFire, FaClock, FaUserCheck, FaCalendarDay,
// //   FaCalendarWeek, FaCalendarAlt, FaWeight, FaHeartbeat,
// //   FaBed, FaUtensils, FaTrophy, FaUsers, FaBolt
// // } from "react-icons/fa";
// // import { 
// //   GiMuscleUp, GiWaterDrop, GiFootsteps, GiWeightScale 
// // } from "react-icons/gi";

// // const API = "http://localhost:5000/api/gym";

// // function toYMD(d) {
// //   const x = new Date(d);
// //   const yyyy = x.getFullYear();
// //   const mm = String(x.getMonth() + 1).padStart(2, "0");
// //   const dd = String(x.getDate()).padStart(2, "0");
// //   return `${yyyy}-${mm}-${dd}`;
// // }

// // function formatTime(dateStr) {
// //   const d = new Date(dateStr);
// //   return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// // }

// // function getWeekNumber(date) {
// //   const d = new Date(date);
// //   d.setHours(0, 0, 0, 0);
// //   d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
// //   const week1 = new Date(d.getFullYear(), 0, 4);
// //   return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
// // }

// // function getDayOfWeek(date) {
// //   const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// //   return days[new Date(date).getDay()];
// // }

// // function AttendanceCard({ attendance, onClick, isSelected }) {
// //   const today = new Date();
// //   const attendanceDate = new Date(attendance.attended_at);
// //   const isToday = attendanceDate.toDateString() === today.toDateString();
  
// //   return (
// //     <Card 
// //       className={`attendance-card ${isSelected ? 'selected' : ''} ${isToday ? 'today-card' : ''}`}
// //       onClick={onClick}
// //     >
// //       <Card.Body>
// //         <div className="d-flex justify-content-between align-items-start">
// //           <div>
// //             <h6 className="mb-1 fw-bold text-primary">{attendance.full_name}</h6>
// //             <small className="text-muted">ID: {attendance.customer_id}</small>
// //           </div>
// //           <Badge bg={isToday ? "success" : "info"} className="attendance-badge">
// //             {formatTime(attendance.attended_at)}
// //           </Badge>
// //         </div>
        
// //         <div className="mt-3">
// //           <div className="d-flex align-items-center mb-1">
// //             <FaCalendarDay className="me-2 text-secondary" size={12} />
// //             <small className="text-muted">{getDayOfWeek(attendance.attended_at)}</small>
// //           </div>
// //           <div className="d-flex align-items-center">
// //             <FaDumbbell className="me-2 text-warning" size={12} />
// //             <small className="text-muted">{attendance.plan_type || "No Plan"}</small>
// //           </div>
// //         </div>
        
// //         <div className="mt-3 d-flex justify-content-between align-items-center">
// //           <div>
// //             <FaFire className="text-danger" />
// //             <small className="ms-1">Week {getWeekNumber(attendance.attended_at)}</small>
// //           </div>
// //           <Badge bg={attendance.status === "Active" ? "success" : "secondary"}>
// //             {attendance.status}
// //           </Badge>
// //         </div>
// //       </Card.Body>
// //     </Card>
// //   );
// // }

// // function ProgressStats({ progress }) {
// //   if (!progress) return null;
  
// //   const stats = [
// //     { label: "Weight", value: progress.weight_kg, unit: "kg", icon: <GiWeightScale />, color: "primary" },
// //     { label: "Calories", value: progress.calories, unit: "kcal", icon: <FaFire />, color: "warning" },
// //     { label: "Protein", value: progress.protein_g, unit: "g", icon: <GiMuscleUp />, color: "danger" },
// //     { label: "Steps", value: progress.steps, unit: "steps", icon: <GiFootsteps />, color: "success" },
// //     { label: "Water", value: progress.water_liters, unit: "L", icon: <GiWaterDrop />, color: "info" },
// //     { label: "Sleep", value: progress.sleep_hours, unit: "hrs", icon: <FaBed />, color: "dark" },
// //   ];

// //   return (
// //     <Row className="g-2 mt-3">
// //       {stats.map((stat, idx) => (
// //         stat.value != null && (
// //           <Col xs={6} md={4} key={idx}>
// //             <div className="progress-stat">
// //               <div className="d-flex align-items-center">
// //                 <span className={`stat-icon text-${stat.color}`}>{stat.icon}</span>
// //                 <div className="ms-2">
// //                   <div className="stat-value">{stat.value} {stat.unit}</div>
// //                   <div className="stat-label">{stat.label}</div>
// //                 </div>
// //               </div>
// //             </div>
// //           </Col>
// //         )
// //       ))}
// //     </Row>
// //   );
// // }

// // function MemberDetailModal({ show, onHide, member, attendance, progress, onMarkAttendance }) {
// //   // FIXED: Move hooks to the top unconditionally
// //   const [activeTab, setActiveTab] = useState("overview");
// //   const [attendanceHistory, setAttendanceHistory] = useState([]);
// //   const [loadingHistory, setLoadingHistory] = useState(false);

// //   useEffect(() => {
// //     if (show && member?.customer_id) {
// //       loadAttendanceHistory();
// //     } else {
// //       setAttendanceHistory([]);
// //     }
// //   }, [show, member?.customer_id]);

// //   const loadAttendanceHistory = async () => {
// //     if (!member?.customer_id) return;
    
// //     setLoadingHistory(true);
// //     try {
// //       const res = await axios.get(`${API}/attendance/history/${member.customer_id}`, {
// //         params: { from: "2024-01-01", to: toYMD(new Date()) }
// //       });
// //       setAttendanceHistory(res.data?.rows || []);
// //     } catch (error) {
// //       console.error("Failed to load attendance history:", error);
// //     } finally {
// //       setLoadingHistory(false);
// //     }
// //   };

// //   if (!member) return null;

// //   const attendanceCount = attendanceHistory.length;
// //   const thisWeekAttendance = attendanceHistory.filter(a => {
// //     const date = new Date(a.attended_at);
// //     const today = new Date();
// //     const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
// //     return date >= startOfWeek;
// //   }).length;

// //   return (
// //     <Modal show={show} onHide={onHide} size="lg" centered>
// //       <Modal.Header closeButton className="bg-primary text-white">
// //         <Modal.Title>
// //           <FaDumbbell className="me-2" />
// //           {member.full_name}'s Dashboard
// //         </Modal.Title>
// //       </Modal.Header>
// //       <Modal.Body>
// //         <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
// //           <Tab eventKey="overview" title={<><FaChartLine className="me-1" /> Overview</>}>
// //             <Row className="g-3">
// //               <Col md={6}>
// //                 <Card className="border-0 shadow-sm">
// //                   <Card.Body>
// //                     <h6 className="fw-bold text-primary">Member Information</h6>
// //                     <ListGroup variant="flush">
// //                       <ListGroup.Item className="d-flex justify-content-between">
// //                         <span>Customer ID</span>
// //                         <strong>{member.customer_id}</strong>
// //                       </ListGroup.Item>
// //                       <ListGroup.Item className="d-flex justify-content-between">
// //                         <span>Phone</span>
// //                         <strong>{member.phone || "N/A"}</strong>
// //                       </ListGroup.Item>
// //                       <ListGroup.Item className="d-flex justify-content-between">
// //                         <span>Plan Type</span>
// //                         <Badge bg="info">{member.plan_type || "N/A"}</Badge>
// //                       </ListGroup.Item>
// //                       <ListGroup.Item className="d-flex justify-content-between">
// //                         <span>Status</span>
// //                         <Badge bg={member.status === "Active" ? "success" : "warning"}>
// //                           {member.status}
// //                         </Badge>
// //                       </ListGroup.Item>
// //                     </ListGroup>
// //                   </Card.Body>
// //                 </Card>
// //               </Col>
// //               <Col md={6}>
// //                 <Card className="border-0 shadow-sm">
// //                   <Card.Body>
// //                     <h6 className="fw-bold text-primary">Attendance Stats</h6>
// //                     <div className="text-center py-4">
// //                       <div className="display-4 fw-bold text-primary">{attendanceCount}</div>
// //                       <p className="text-muted">Total Visits</p>
// //                     </div>
// //                     <div className="d-flex justify-content-around">
// //                       <div className="text-center">
// //                         <div className="h3 fw-bold text-success">{thisWeekAttendance}</div>
// //                         <small className="text-muted">This Week</small>
// //                       </div>
// //                       <div className="text-center">
// //                         <div className="h3 fw-bold text-warning">
// //                           {attendanceCount > 0 ? Math.round((thisWeekAttendance / 7) * 100) : 0}%
// //                         </div>
// //                         <small className="text-muted">Weekly Rate</small>
// //                       </div>
// //                     </div>
// //                   </Card.Body>
// //                 </Card>
// //               </Col>
// //             </Row>

// //             {progress && (
// //               <Card className="mt-3 border-0 shadow-sm">
// //                 <Card.Body>
// //                   <h6 className="fw-bold text-primary">Today's Progress</h6>
// //                   <ProgressStats progress={progress} />
// //                   {progress.notes && (
// //                     <div className="mt-3 p-3 bg-light rounded">
// //                       <small className="text-muted">Notes:</small>
// //                       <p className="mb-0">{progress.notes}</p>
// //                     </div>
// //                   )}
// //                 </Card.Body>
// //               </Card>
// //             )}
// //           </Tab>

// //           <Tab eventKey="attendance" title={<><FaCalendarCheck className="me-1" /> Attendance</>}>
// //             <Card className="border-0 shadow-sm">
// //               <Card.Body>
// //                 <div className="d-flex justify-content-between align-items-center mb-3">
// //                   <h6 className="fw-bold text-primary mb-0">Attendance History</h6>
// //                   <Button 
// //                     variant="outline-primary" 
// //                     size="sm"
// //                     onClick={onMarkAttendance}
// //                     disabled={attendance?.already}
// //                   >
// //                     <FaUserCheck className="me-1" />
// //                     {attendance?.already ? "Already Attended Today" : "Mark Attendance"}
// //                   </Button>
// //                 </div>
                
// //                 {loadingHistory ? (
// //                   <div className="text-center py-4">
// //                     <Spinner animation="border" variant="primary" />
// //                   </div>
// //                 ) : attendanceHistory.length === 0 ? (
// //                   <Alert variant="info">
// //                     No attendance records found for this member.
// //                   </Alert>
// //                 ) : (
// //                   <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
// //                     <Table hover responsive size="sm">
// //                       <thead>
// //                         <tr>
// //                           <th>Date</th>
// //                           <th>Day</th>
// //                           <th>Time</th>
// //                           <th>Week</th>
// //                         </tr>
// //                       </thead>
// //                       <tbody>
// //                         {attendanceHistory.map((record, idx) => {
// //                           const recordDate = new Date(record.attended_at);
// //                           const isToday = recordDate.toDateString() === new Date().toDateString();
// //                           return (
// //                             <tr key={idx} className={isToday ? 'table-success' : ''}>
// //                               <td>{toYMD(record.attended_at)}</td>
// //                               <td>{getDayOfWeek(record.attended_at)}</td>
// //                               <td>{formatTime(record.attended_at)}</td>
// //                               <td>Week {getWeekNumber(record.attended_at)}</td>
// //                             </tr>
// //                           );
// //                         })}
// //                       </tbody>
// //                     </Table>
// //                   </div>
// //                 )}
// //               </Card.Body>
// //             </Card>
// //           </Tab>

// //           <Tab eventKey="progress" title={<><FaChartLine className="me-1" /> Progress</>}>
// //             <Card className="border-0 shadow-sm">
// //               <Card.Body>
// //                 <h6 className="fw-bold text-primary mb-3">Progress Timeline</h6>
// //                 {progress ? (
// //                   <div className="progress-timeline">
// //                     <div className="timeline-item">
// //                       <div className="timeline-marker bg-primary"></div>
// //                       <div className="timeline-content">
// //                         <div className="d-flex justify-content-between">
// //                           <strong>Today</strong>
// //                           <small className="text-muted">{toYMD(new Date())}</small>
// //                         </div>
// //                         <div className="mt-2">
// //                           <Row className="g-2">
// //                             <Col xs={6}>
// //                               <div className="text-center p-2 bg-light rounded">
// //                                 <GiWeightScale className="h4 text-primary mb-2" />
// //                                 <div className="fw-bold">{progress.weight_kg || "N/A"} kg</div>
// //                                 <small className="text-muted">Weight</small>
// //                               </div>
// //                             </Col>
// //                             <Col xs={6}>
// //                               <div className="text-center p-2 bg-light rounded">
// //                                 <FaFire className="h4 text-warning mb-2" />
// //                                 <div className="fw-bold">{progress.calories || "N/A"} cal</div>
// //                                 <small className="text-muted">Calories</small>
// //                               </div>
// //                             </Col>
// //                           </Row>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 ) : (
// //                   <Alert variant="info">
// //                     No progress data available for today. Check back later!
// //                   </Alert>
// //                 )}
// //               </Card.Body>
// //             </Card>
// //           </Tab>
// //         </Tabs>
// //       </Modal.Body>
// //     </Modal>
// //   );
// // }

// // export default function GymAttendanceTab() {
// //   const [date, setDate] = useState(toYMD(new Date()));
// //   const [loading, setLoading] = useState(false);
// //   const [rows, setRows] = useState([]);
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [selectedMember, setSelectedMember] = useState(null);
// //   const [showModal, setShowModal] = useState(false);
// //   const [progressData, setProgressData] = useState(null);
// //   const [loadingProgress, setLoadingProgress] = useState(false);
// //   const [stats, setStats] = useState({ total: 0, today: 0, active: 0 });

// //   const loadTodayAttendance = async () => {
// //     setLoading(true);
// //     setSelectedMember(null);
// //     setProgressData(null);
// //     try {
// //       const res = await axios.get(`${API}/attendance/today`, { params: { date } });
// //       const data = res.data?.rows || [];
// //       setRows(data);
      
// //       // Calculate stats
// //       const today = toYMD(new Date());
// //       const todayRows = data.filter(r => {
// //         const rowDate = new Date(r.attended_at);
// //         return toYMD(rowDate) === today;
// //       });
      
// //       setStats({
// //         total: data.length,
// //         today: todayRows.length,
// //         active: data.filter(r => r.status === "Active").length
// //       });
// //     } catch (e) {
// //       console.error("Failed to load attendance:", e);
// //       setRows([]);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const loadProgressForMember = async (customerId) => {
// //     setLoadingProgress(true);
// //     setProgressData(null);
// //     try {
// //       const res = await axios.get(`${API}/progress/logs/customer/${customerId}`, {
// //         params: { from: date, to: date }
// //       });
// //       const latest = res.data?.logs?.[0] || null;
// //       setProgressData(latest);
// //     } catch (e) {
// //       console.error("Failed to load progress:", e);
// //       setProgressData(null);
// //     } finally {
// //       setLoadingProgress(false);
// //     }
// //   };

// //   const markAttendance = async (customerId) => {
// //     try {
// //       const res = await axios.post(`${API}/attendance/checkin`, {
// //         customer_id: customerId
// //       });
// //       if (res.data.ok) {
// //         alert(res.data.already ? "Member already attended today!" : "Attendance marked successfully!");
// //         loadTodayAttendance();
// //       }
// //     } catch (error) {
// //       alert("Failed to mark attendance: " + (error.response?.data?.error || error.message));
// //     }
// //   };

// //   const handleMemberSelect = (member) => {
// //     setSelectedMember(member);
// //     loadProgressForMember(member.customer_id);
// //     setShowModal(true);
// //   };

// //   const filteredRows = useMemo(() => {
// //     const term = searchTerm.trim().toLowerCase();
// //     if (!term) return rows;
// //     return rows.filter(r => 
// //       (r.full_name || "").toLowerCase().includes(term) ||
// //       (r.phone || "").toLowerCase().includes(term) ||
// //       String(r.customer_id || "").includes(term)
// //     );
// //   }, [rows, searchTerm]);

// //   useEffect(() => {
// //     loadTodayAttendance();
// //   }, []);

// //   const StatCard = ({ title, value, icon, color, subtext }) => (
// //     <Card className={`stat-card border-0 bg-gradient-${color}`}>
// //       <Card.Body className="text-white">
// //         <div className="d-flex justify-content-between align-items-center">
// //           <div>
// //             <h6 className="mb-1">{title}</h6>
// //             <h2 className="fw-bold mb-0">{value}</h2>
// //             {subtext && <small className="opacity-75">{subtext}</small>}
// //           </div>
// //           <div className="stat-icon">
// //             {icon}
// //           </div>
// //         </div>
// //       </Card.Body>
// //     </Card>
// //   );

// //   return (
// //     <div className="gym-attendance-container">
// //       <style>{`
// //         .gym-attendance-container {
// //           min-height: 100vh;
// //           background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
// //           padding: 20px;
// //         }
        
// //         .stat-card {
// //           border-radius: 15px;
// //           box-shadow: 0 4px 15px rgba(0,0,0,0.1);
// //           transition: transform 0.3s ease;
// //         }
        
// //         .stat-card:hover {
// //           transform: translateY(-5px);
// //         }
        
// //         .bg-gradient-primary {
// //           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// //         }
        
// //         .bg-gradient-success {
// //           background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
// //         }
        
// //         .bg-gradient-warning {
// //           background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
// //         }
        
// //         .stat-icon {
// //           font-size: 2.5rem;
// //           opacity: 0.8;
// //         }
        
// //         .attendance-card {
// //           border-radius: 12px;
// //           box-shadow: 0 3px 10px rgba(0,0,0,0.08);
// //           cursor: pointer;
// //           transition: all 0.3s ease;
// //           border: 2px solid transparent;
// //           margin-bottom: 15px;
// //         }
        
// //         .attendance-card:hover {
// //           transform: translateY(-3px);
// //           box-shadow: 0 5px 20px rgba(0,0,0,0.15);
// //           border-color: #667eea;
// //         }
        
// //         .attendance-card.selected {
// //           border-color: #667eea;
// //           background-color: rgba(102, 126, 234, 0.05);
// //         }
        
// //         .attendance-card.today-card {
// //           border-left: 4px solid #38ef7d;
// //         }
        
// //         .attendance-badge {
// //           border-radius: 20px;
// //           padding: 5px 12px;
// //           font-size: 0.8rem;
// //         }
        
// //         .progress-stat {
// //           background: white;
// //           padding: 12px;
// //           border-radius: 10px;
// //           box-shadow: 0 2px 5px rgba(0,0,0,0.05);
// //           border-left: 4px solid;
// //         }
        
// //         .stat-icon {
// //           font-size: 1.5rem;
// //         }
        
// //         .stat-value {
// //           font-weight: bold;
// //           font-size: 1.1rem;
// //         }
        
// //         .stat-label {
// //           font-size: 0.8rem;
// //           color: #666;
// //         }
        
// //         .progress-timeline {
// //           position: relative;
// //           padding-left: 30px;
// //         }
        
// //         .timeline-item {
// //           position: relative;
// //           margin-bottom: 20px;
// //         }
        
// //         .timeline-marker {
// //           position: absolute;
// //           left: -30px;
// //           top: 0;
// //           width: 20px;
// //           height: 20px;
// //           border-radius: 50%;
// //           border: 3px solid white;
// //           box-shadow: 0 0 0 3px;
// //         }
        
// //         .timeline-content {
// //           background: white;
// //           padding: 15px;
// //           border-radius: 10px;
// //           box-shadow: 0 2px 10px rgba(0,0,0,0.05);
// //         }
        
// //         .floating-action-btn {
// //           position: fixed;
// //           bottom: 30px;
// //           right: 30px;
// //           width: 60px;
// //           height: 60px;
// //           border-radius: 50%;
// //           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// //           color: white;
// //           border: none;
// //           box-shadow: 0 5px 20px rgba(102, 126, 234, 0.5);
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           font-size: 1.5rem;
// //           z-index: 1000;
// //           transition: all 0.3s ease;
// //         }
        
// //         .floating-action-btn:hover {
// //           transform: scale(1.1);
// //           box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
// //         }
        
// //         .attendance-grid {
// //           max-height: calc(100vh - 300px);
// //           overflow-y: auto;
// //           padding-right: 10px;
// //         }
        
// //         .attendance-grid::-webkit-scrollbar {
// //           width: 6px;
// //         }
        
// //         .attendance-grid::-webkit-scrollbar-track {
// //           background: #f1f1f1;
// //           border-radius: 10px;
// //         }
        
// //         .attendance-grid::-webkit-scrollbar-thumb {
// //           background: #667eea;
// //           border-radius: 10px;
// //         }
        
// //         .week-indicator {
// //           display: flex;
// //           align-items: center;
// //           justify-content: center;
// //           background: white;
// //           padding: 10px 20px;
// //           border-radius: 10px;
// //           box-shadow: 0 2px 10px rgba(0,0,0,0.1);
// //           margin-bottom: 20px;
// //         }
        
// //         .week-indicator .current-week {
// //           font-size: 1.5rem;
// //           font-weight: bold;
// //           color: #667eea;
// //           margin: 0 10px;
// //         }
// //       `}</style>

// //       {/* Floating Action Button */}
// //       <Button 
// //         className="floating-action-btn"
// //         onClick={loadTodayAttendance}
// //         title="Refresh Attendance"
// //       >
// //         <FaRunning />
// //       </Button>

// //       {/* Header with Stats */}
// //       <Row className="g-3 mb-4">
// //         <Col md={4}>
// //           <StatCard 
// //             title="Total Today" 
// //             value={stats.today} 
// //             icon={<FaUsers />}
// //             color="primary"
// //             subtext="Members attended"
// //           />
// //         </Col>
// //         <Col md={4}>
// //           <StatCard 
// //             title="Active Plans" 
// //             value={stats.active} 
// //             icon={<FaDumbbell />}
// //             color="success"
// //             subtext="Active subscriptions"
// //           />
// //         </Col>
// //         <Col md={4}>
// //           <StatCard 
// //             title="Total Records" 
// //             value={stats.total} 
// //             icon={<FaCalendarAlt />}
// //             color="warning"
// //             subtext="All attendance"
// //           />
// //         </Col>
// //       </Row>

// //       {/* Week Indicator */}
// //       <div className="week-indicator">
// //         <FaCalendarWeek className="me-2 text-primary" />
// //         <span>Week</span>
// //         <span className="current-week">{getWeekNumber(date)}</span>
// //         <span>• {getDayOfWeek(date)}</span>
// //       </div>

// //       <Row className="g-4">
// //         {/* Left Column - Controls and Search */}
// //         <Col lg={3}>
// //           <Card className="border-0 shadow-sm mb-4">
// //             <Card.Body>
// //               <h6 className="fw-bold text-primary mb-3">
// //                 <FaCalendarCheck className="me-2" />
// //                 Date Filter
// //               </h6>
// //               <Form.Group className="mb-3">
// //                 <Form.Label>Select Date</Form.Label>
// //                 <Form.Control
// //                   type="date"
// //                   value={date}
// //                   onChange={(e) => setDate(e.target.value)}
// //                   className="border-primary"
// //                 />
// //               </Form.Group>
              
// //               <Button 
// //                 variant="primary" 
// //                 className="w-100 mb-3"
// //                 onClick={loadTodayAttendance}
// //                 disabled={loading}
// //               >
// //                 {loading ? (
// //                   <>
// //                     <Spinner animation="border" size="sm" className="me-2" />
// //                     Loading...
// //                   </>
// //                 ) : (
// //                   <>
// //                     <FaRunning className="me-2" />
// //                     Load Attendance
// //                   </>
// //                 )}
// //               </Button>

// //               <Form.Group>
// //                 <Form.Label>
// //                   <FaUsers className="me-1" />
// //                   Search Members
// //                 </Form.Label>
// //                 <Form.Control
// //                   type="text"
// //                   placeholder="Name, phone, or ID..."
// //                   value={searchTerm}
// //                   onChange={(e) => setSearchTerm(e.target.value)}
// //                   className="border-primary"
// //                 />
// //               </Form.Group>

// //               {filteredRows.length > 0 && (
// //                 <div className="mt-3">
// //                   <small className="text-muted">
// //                     Showing {filteredRows.length} of {rows.length} members
// //                   </small>
// //                 </div>
// //               )}
// //             </Card.Body>
// //           </Card>

// //           {/* Quick Actions */}
// //           <Card className="border-0 shadow-sm">
// //             <Card.Body>
// //               <h6 className="fw-bold text-primary mb-3">
// //                 <FaBolt className="me-2" />
// //                 Quick Actions
// //               </h6>
// //               <Button 
// //                 variant="outline-success" 
// //                 className="w-100 mb-2"
// //                 onClick={() => {
// //                   if (selectedMember) {
// //                     markAttendance(selectedMember.customer_id);
// //                   } else {
// //                     alert("Please select a member first!");
// //                   }
// //                 }}
// //               >
// //                 <FaUserCheck className="me-2" />
// //                 Mark Attendance
// //               </Button>
// //               <Button 
// //                 variant="outline-primary" 
// //                 className="w-100"
// //                 onClick={() => {
// //                   const today = new Date();
// //                   setDate(toYMD(today));
// //                   loadTodayAttendance();
// //                 }}
// //               >
// //                 <FaCalendarDay className="me-2" />
// //                 Today's View
// //               </Button>
// //             </Card.Body>
// //           </Card>
// //         </Col>

// //         {/* Right Column - Attendance Grid */}
// //         <Col lg={9}>
// //           <Card className="border-0 shadow-sm">
// //             <Card.Body>
// //               <div className="d-flex justify-content-between align-items-center mb-4">
// //                 <h5 className="fw-bold text-primary mb-0">
// //                   <FaDumbbell className="me-2" />
// //                   Today's Attendance ({filteredRows.length})
// //                 </h5>
// //                 <div className="d-flex gap-2">
// //                   <Badge bg="success" className="px-3 py-2">
// //                     <FaClock className="me-1" />
// //                     {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
// //                   </Badge>
// //                   <Badge bg="info" className="px-3 py-2">
// //                     Week {getWeekNumber(date)}
// //                   </Badge>
// //                 </div>
// //               </div>

// //               {loading ? (
// //                 <div className="text-center py-5">
// //                   <Spinner animation="border" variant="primary" size="lg" />
// //                   <p className="mt-3 text-muted">Loading attendance data...</p>
// //                 </div>
// //               ) : filteredRows.length === 0 ? (
// //                 <Alert variant="info" className="text-center">
// //                   <FaCalendarCheck className="h2 mb-3" />
// //                   <h5>No attendance records for this date</h5>
// //                   <p className="mb-0">Try selecting a different date or check back later.</p>
// //                 </Alert>
// //               ) : (
// //                 <div className="attendance-grid">
// //                   <Row>
// //                     {filteredRows.map((attendance, idx) => (
// //                       <Col md={6} lg={4} key={attendance.attendance_id}>
// //                         <AttendanceCard
// //                           attendance={attendance}
// //                           onClick={() => handleMemberSelect(attendance)}
// //                           isSelected={selectedMember?.attendance_id === attendance.attendance_id}
// //                         />
// //                       </Col>
// //                     ))}
// //                   </Row>
// //                 </div>
// //               )}
// //             </Card.Body>
// //           </Card>

// //           {/* Bottom Stats */}
// //           {filteredRows.length > 0 && (
// //             <Row className="mt-4 g-3">
// //               <Col md={4}>
// //                 <Card className="border-0 shadow-sm">
// //                   <Card.Body className="text-center">
// //                     <FaClock className="h3 text-primary mb-2" />
// //                     <h4 className="fw-bold">
// //                       {formatTime(filteredRows[0]?.attended_at) || "N/A"}
// //                     </h4>
// //                     <small className="text-muted">First Check-in</small>
// //                   </Card.Body>
// //                 </Card>
// //               </Col>
// //               <Col md={4}>
// //                 <Card className="border-0 shadow-sm">
// //                   <Card.Body className="text-center">
// //                     <FaTrophy className="h3 text-warning mb-2" />
// //                     <h4 className="fw-bold">
// //                       {filteredRows.filter(r => r.status === "Active").length}
// //                     </h4>
// //                     <small className="text-muted">Active Members</small>
// //                   </Card.Body>
// //                 </Card>
// //               </Col>
// //               <Col md={4}>
// //                 <Card className="border-0 shadow-sm">
// //                   <Card.Body className="text-center">
// //                     <FaFire className="h3 text-danger mb-2" />
// //                     <h4 className="fw-bold">
// //                       {Math.round((filteredRows.length / rows.length) * 100) || 0}%
// //                     </h4>
// //                     <small className="text-muted">Attendance Rate</small>
// //                   </Card.Body>
// //                 </Card>
// //               </Col>
// //             </Row>
// //           )}
// //         </Col>
// //       </Row>

// //       {/* Member Detail Modal */}
// //       <MemberDetailModal
// //         show={showModal}
// //         onHide={() => setShowModal(false)}
// //         member={selectedMember}
// //         attendance={selectedMember ? {
// //           already: rows.some(r => 
// //             r.customer_id === selectedMember.customer_id && 
// //             toYMD(new Date(r.attended_at)) === toYMD(new Date())
// //           )
// //         } : null}
// //         progress={progressData}
// //         loadingProgress={loadingProgress}
// //         onMarkAttendance={() => {
// //           if (selectedMember) {
// //             markAttendance(selectedMember.customer_id);
// //             setShowModal(false);
// //           }
// //         }}
// //       />
// //     </div>
// //   );
// // }
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   Row,
//   Col,
//   Card,
//   Table,
//   Form,
//   Button,
//   Spinner,
//   Badge,
//   Modal,
//   Tabs,
//   Tab,
//   ListGroup,
//   Alert,
// } from "react-bootstrap";
// import axios from "axios";
// import {
//   FaDumbbell,
//   FaRunning,
//   FaCalendarCheck,
//   FaChartLine,
//   FaFire,
//   FaClock,
//   FaUserCheck,
//   FaCalendarDay,
//   FaCalendarWeek,
//   FaCalendarAlt,
//   FaBed,
//   FaTrophy,
//   FaUsers,
//   FaBolt,
// } from "react-icons/fa";
// import { GiMuscleUp, GiWaterDrop, GiFootsteps, GiWeightScale } from "react-icons/gi";

// const API = "http://localhost:5000/api/gym";

// /* ---------------- Helpers ---------------- */
// function toYMD(d) {
//   const x = new Date(d);
//   const yyyy = x.getFullYear();
//   const mm = String(x.getMonth() + 1).padStart(2, "0");
//   const dd = String(x.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// }

// function formatTime(dateStr) {
//   const d = new Date(dateStr);
//   return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
// }

// function getWeekNumber(date) {
//   const d = new Date(date);
//   d.setHours(0, 0, 0, 0);
//   d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
//   const week1 = new Date(d.getFullYear(), 0, 4);
//   return (
//     1 +
//     Math.round(
//       ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
//     )
//   );
// }

// function getDayOfWeek(date) {
//   const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
//   return days[new Date(date).getDay()];
// }

// function safeNum(n) {
//   const x = Number(n);
//   return Number.isFinite(x) ? x : null;
// }

// function diff(a, b) {
//   const A = safeNum(a);
//   const B = safeNum(b);
//   if (A == null || B == null) return null;
//   return +(A - B).toFixed(2);
// }

// /* ---------------- UI Pieces ---------------- */
// function AttendanceCard({ attendance, onClick, isSelected }) {
//   const today = new Date();
//   const attendanceDate = new Date(attendance.attended_at);
//   const isToday = attendanceDate.toDateString() === today.toDateString();

//   return (
//     <Card
//       className={`attendance-card ${isSelected ? "selected" : ""} ${isToday ? "today-card" : ""}`}
//       onClick={onClick}
//     >
//       <Card.Body>
//         <div className="d-flex justify-content-between align-items-start">
//           <div>
//             <h6 className="mb-1 fw-bold text-primary">{attendance.full_name}</h6>
//             <small className="text-muted">ID: {attendance.customer_id}</small>
//           </div>
//           <Badge bg={isToday ? "success" : "info"} className="attendance-badge">
//             {formatTime(attendance.attended_at)}
//           </Badge>
//         </div>

//         <div className="mt-3">
//           <div className="d-flex align-items-center mb-1">
//             <FaCalendarDay className="me-2 text-secondary" size={12} />
//             <small className="text-muted">{getDayOfWeek(attendance.attended_at)}</small>
//           </div>
//           <div className="d-flex align-items-center">
//             <FaDumbbell className="me-2 text-warning" size={12} />
//             <small className="text-muted">{attendance.plan_type || "No Plan"}</small>
//           </div>
//         </div>

//         <div className="mt-3 d-flex justify-content-between align-items-center">
//           <div>
//             <FaFire className="text-danger" />
//             <small className="ms-1">Week {getWeekNumber(attendance.attended_at)}</small>
//           </div>
//           <Badge bg={attendance.status === "Active" ? "success" : "secondary"}>{attendance.status}</Badge>
//         </div>
//       </Card.Body>
//     </Card>
//   );
// }

// function ProgressStats({ progress }) {
//   if (!progress) return null;

//   const stats = [
//     { label: "Weight", value: progress.weight_kg, unit: "kg", icon: <GiWeightScale />, color: "primary" },
//     { label: "Calories", value: progress.calories, unit: "kcal", icon: <FaFire />, color: "warning" },
//     { label: "Protein", value: progress.protein_g, unit: "g", icon: <GiMuscleUp />, color: "danger" },
//     { label: "Steps", value: progress.steps, unit: "steps", icon: <GiFootsteps />, color: "success" },
//     { label: "Water", value: progress.water_liters, unit: "L", icon: <GiWaterDrop />, color: "info" },
//     { label: "Sleep", value: progress.sleep_hours, unit: "hrs", icon: <FaBed />, color: "dark" },
//   ];

//   return (
//     <Row className="g-2 mt-3">
//       {stats.map(
//         (stat, idx) =>
//           stat.value != null && (
//             <Col xs={6} md={4} key={idx}>
//               <div className="progress-stat">
//                 <div className="d-flex align-items-center">
//                   <span className={`stat-icon text-${stat.color}`}>{stat.icon}</span>
//                   <div className="ms-2">
//                     <div className="stat-value">
//                       {stat.value} {stat.unit}
//                     </div>
//                     <div className="stat-label">{stat.label}</div>
//                   </div>
//                 </div>
//               </div>
//             </Col>
//           )
//       )}
//     </Row>
//   );
// }

// function TrendBadge({ value, goodWhenDown = false }) {
//   // value = current - previous
//   if (value == null) return <span className="text-muted">—</span>;
//   const isUp = value > 0;
//   const isDown = value < 0;

//   let variant = "secondary";
//   if (goodWhenDown) {
//     variant = isDown ? "success" : isUp ? "danger" : "secondary";
//   } else {
//     variant = isUp ? "success" : isDown ? "danger" : "secondary";
//   }

//   const sign = value > 0 ? "+" : "";
//   return (
//     <Badge bg={variant} className="px-2">
//       {sign}
//       {value}
//     </Badge>
//   );
// }

// /* ---------------- Modal (Now includes Progress History) ---------------- */
// function MemberDetailModal({
//   show,
//   onHide,
//   member,
//   attendance,
//   progressToday, // latest progress for selected date
//   selectedDate, // YYYY-MM-DD
//   onMarkAttendance,
// }) {
//   const [activeTab, setActiveTab] = useState("overview");

//   const [attendanceHistory, setAttendanceHistory] = useState([]);
//   const [loadingAttendanceHistory, setLoadingAttendanceHistory] = useState(false);

//   const [progressHistory, setProgressHistory] = useState([]); // MANY logs (to compare)
//   const [loadingProgressHistory, setLoadingProgressHistory] = useState(false);

//   useEffect(() => {
//     if (show && member?.customer_id) {
//       loadAttendanceHistory();
//       loadProgressHistory();
//     } else {
//       setAttendanceHistory([]);
//       setProgressHistory([]);
//       setActiveTab("overview");
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [show, member?.customer_id]);

//   const loadAttendanceHistory = async () => {
//     if (!member?.customer_id) return;
//     setLoadingAttendanceHistory(true);
//     try {
//       const res = await axios.get(`${API}/attendance/history/${member.customer_id}`, {
//         params: { from: "2024-01-01", to: toYMD(new Date()) },
//       });
//       setAttendanceHistory(res.data?.rows || []);
//     } catch (error) {
//       console.error("Failed to load attendance history:", error);
//       setAttendanceHistory([]);
//     } finally {
//       setLoadingAttendanceHistory(false);
//     }
//   };

//   const loadProgressHistory = async () => {
//     if (!member?.customer_id) return;
//     setLoadingProgressHistory(true);
//     try {
//       // Pull a wide range so you can compare “times filled”.
//       // You can change from/to later (ex: last 90 days).
//       const res = await axios.get(`${API}/progress/logs/customer/${member.customer_id}`, {
//         params: { from: "2024-01-01", to: toYMD(new Date()) },
//       });

//       // Expecting: { logs: [...] }
//       const logs = res.data?.logs || [];
//       // Make sure sorted by log_date desc for UI
//       logs.sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
//       setProgressHistory(logs);
//     } catch (e) {
//       console.error("Failed to load progress history:", e);
//       setProgressHistory([]);
//     } finally {
//       setLoadingProgressHistory(false);
//     }
//   };

//   if (!member) return null;

//   const attendanceCount = attendanceHistory.length;

//   const thisWeekAttendance = attendanceHistory.filter((a) => {
//     const date = new Date(a.attended_at);
//     const today = new Date();
//     const startOfWeek = new Date(today);
//     startOfWeek.setDate(today.getDate() - today.getDay());
//     startOfWeek.setHours(0, 0, 0, 0);
//     return date >= startOfWeek;
//   }).length;

//   const progressCount = progressHistory.length;

//   // For “trend” compare latest log vs previous log
//   const latest = progressHistory[0] || null;
//   const prev = progressHistory[1] || null;

//   const weightDiff = latest && prev ? diff(latest.weight_kg, prev.weight_kg) : null; // down = good
//   const stepsDiff = latest && prev ? diff(latest.steps, prev.steps) : null; // up = good
//   const sleepDiff = latest && prev ? diff(latest.sleep_hours, prev.sleep_hours) : null; // up = good
//   const calDiff = latest && prev ? diff(latest.calories, prev.calories) : null; // depends (neutral)

//   return (
//     <Modal show={show} onHide={onHide} size="lg" centered>
//       <Modal.Header closeButton className="bg-primary text-white">
//         <Modal.Title>
//           <FaDumbbell className="me-2" />
//           {member.full_name}'s Dashboard
//         </Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || "overview")} className="mb-3">
//           {/* ---------------- Overview ---------------- */}
//           <Tab eventKey="overview" title={<><FaChartLine className="me-1" /> Overview</>}>
//             <Row className="g-3">
//               <Col md={6}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Body>
//                     <h6 className="fw-bold text-primary">Member Information</h6>
//                     <ListGroup variant="flush">
//                       <ListGroup.Item className="d-flex justify-content-between">
//                         <span>Customer ID</span>
//                         <strong>{member.customer_id}</strong>
//                       </ListGroup.Item>
//                       <ListGroup.Item className="d-flex justify-content-between">
//                         <span>Phone</span>
//                         <strong>{member.phone || "N/A"}</strong>
//                       </ListGroup.Item>
//                       <ListGroup.Item className="d-flex justify-content-between">
//                         <span>Plan Type</span>
//                         <Badge bg="info">{member.plan_type || "N/A"}</Badge>
//                       </ListGroup.Item>
//                       <ListGroup.Item className="d-flex justify-content-between">
//                         <span>Status</span>
//                         <Badge bg={member.status === "Active" ? "success" : "warning"}>{member.status}</Badge>
//                       </ListGroup.Item>
//                     </ListGroup>
//                   </Card.Body>
//                 </Card>
//               </Col>

//               <Col md={6}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Body>
//                     <h6 className="fw-bold text-primary">Attendance Stats</h6>
//                     <div className="text-center py-3">
//                       <div className="display-4 fw-bold text-primary">{attendanceCount}</div>
//                       <p className="text-muted mb-0">Total Visits</p>
//                     </div>
//                     <div className="d-flex justify-content-around mt-2">
//                       <div className="text-center">
//                         <div className="h3 fw-bold text-success">{thisWeekAttendance}</div>
//                         <small className="text-muted">This Week</small>
//                       </div>
//                       <div className="text-center">
//                         <div className="h3 fw-bold text-warning">
//                           {attendanceCount > 0 ? Math.round((thisWeekAttendance / 7) * 100) : 0}%
//                         </div>
//                         <small className="text-muted">Weekly Rate</small>
//                       </div>
//                     </div>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>

//             {/* Today Progress (for selected date) */}
//             {progressToday && (
//               <Card className="mt-3 border-0 shadow-sm">
//                 <Card.Body>
//                   <div className="d-flex justify-content-between align-items-center">
//                     <h6 className="fw-bold text-primary mb-0">Selected Date Progress</h6>
//                     <Badge bg="secondary">{selectedDate}</Badge>
//                   </div>
//                   <ProgressStats progress={progressToday} />
//                   {progressToday.notes && (
//                     <div className="mt-3 p-3 bg-light rounded">
//                       <small className="text-muted">Notes:</small>
//                       <p className="mb-0">{progressToday.notes}</p>
//                     </div>
//                   )}
//                 </Card.Body>
//               </Card>
//             )}

//             {/* Progress summary + last trend */}
//             <Card className="mt-3 border-0 shadow-sm">
//               <Card.Body>
//                 <div className="d-flex justify-content-between align-items-center">
//                   <h6 className="fw-bold text-primary mb-0">Progress Entries</h6>
//                   <Badge bg="info">{progressCount} logs</Badge>
//                 </div>

//                 {loadingProgressHistory ? (
//                   <div className="text-center py-4">
//                     <Spinner animation="border" variant="primary" />
//                   </div>
//                 ) : progressHistory.length === 0 ? (
//                   <Alert variant="info" className="mt-3 mb-0">
//                     No progress logs found for this member yet.
//                   </Alert>
//                 ) : (
//                   <Row className="g-3 mt-2">
//                     <Col md={3}>
//                       <div className="p-3 bg-light rounded text-center">
//                         <div className="fw-bold">Weight</div>
//                         <div className="mt-1">
//                           <TrendBadge value={weightDiff} goodWhenDown />
//                         </div>
//                         <small className="text-muted">vs previous</small>
//                       </div>
//                     </Col>
//                     <Col md={3}>
//                       <div className="p-3 bg-light rounded text-center">
//                         <div className="fw-bold">Steps</div>
//                         <div className="mt-1">
//                           <TrendBadge value={stepsDiff} />
//                         </div>
//                         <small className="text-muted">vs previous</small>
//                       </div>
//                     </Col>
//                     <Col md={3}>
//                       <div className="p-3 bg-light rounded text-center">
//                         <div className="fw-bold">Sleep</div>
//                         <div className="mt-1">
//                           <TrendBadge value={sleepDiff} />
//                         </div>
//                         <small className="text-muted">vs previous</small>
//                       </div>
//                     </Col>
//                     <Col md={3}>
//                       <div className="p-3 bg-light rounded text-center">
//                         <div className="fw-bold">Calories</div>
//                         <div className="mt-1">
//                           <TrendBadge value={calDiff} />
//                         </div>
//                         <small className="text-muted">vs previous</small>
//                       </div>
//                     </Col>
//                   </Row>
//                 )}
//               </Card.Body>
//             </Card>
//           </Tab>

//           {/* ---------------- Attendance History ---------------- */}
//           <Tab eventKey="attendance" title={<><FaCalendarCheck className="me-1" /> Attendance</>}>
//             <Card className="border-0 shadow-sm">
//               <Card.Body>
//                 <div className="d-flex justify-content-between align-items-center mb-3">
//                   <h6 className="fw-bold text-primary mb-0">Attendance History</h6>
//                   <Button
//                     variant="outline-primary"
//                     size="sm"
//                     onClick={onMarkAttendance}
//                     disabled={attendance?.already}
//                   >
//                     <FaUserCheck className="me-1" />
//                     {attendance?.already ? "Already Attended Today" : "Mark Attendance"}
//                   </Button>
//                 </div>

//                 {loadingAttendanceHistory ? (
//                   <div className="text-center py-4">
//                     <Spinner animation="border" variant="primary" />
//                   </div>
//                 ) : attendanceHistory.length === 0 ? (
//                   <Alert variant="info" className="mb-0">
//                     No attendance records found for this member.
//                   </Alert>
//                 ) : (
//                   <div style={{ maxHeight: "320px", overflowY: "auto" }}>
//                     <Table hover responsive size="sm" className="mb-0">
//                       <thead>
//                         <tr>
//                           <th>Date</th>
//                           <th>Day</th>
//                           <th>Time</th>
//                           <th>Week</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {attendanceHistory.map((record, idx) => {
//                           const recordDate = new Date(record.attended_at);
//                           const isToday = recordDate.toDateString() === new Date().toDateString();
//                           return (
//                             <tr key={idx} className={isToday ? "table-success" : ""}>
//                               <td>{toYMD(record.attended_at)}</td>
//                               <td>{getDayOfWeek(record.attended_at)}</td>
//                               <td>{formatTime(record.attended_at)}</td>
//                               <td>Week {getWeekNumber(record.attended_at)}</td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </Table>
//                   </div>
//                 )}
//               </Card.Body>
//             </Card>
//           </Tab>

//           {/* ---------------- Progress History (COMPARE) ---------------- */}
//           <Tab eventKey="progress" title={<><FaChartLine className="me-1" /> Progress</>}>
//             <Card className="border-0 shadow-sm">
//               <Card.Body>
//                 <div className="d-flex justify-content-between align-items-center mb-3">
//                   <h6 className="fw-bold text-primary mb-0">Progress Timeline</h6>
//                   <Badge bg="info">{progressCount} logs</Badge>
//                 </div>

//                 {loadingProgressHistory ? (
//                   <div className="text-center py-4">
//                     <Spinner animation="border" variant="primary" />
//                   </div>
//                 ) : progressHistory.length === 0 ? (
//                   <Alert variant="info" className="mb-0">
//                     No progress logs available yet.
//                   </Alert>
//                 ) : (
//                   <>
//                     {/* Latest “card” */}
//                     <div className="progress-timeline">
//                       <div className="timeline-item">
//                         <div className="timeline-marker bg-primary"></div>
//                         <div className="timeline-content">
//                           <div className="d-flex justify-content-between">
//                             <strong>Latest</strong>
//                             <small className="text-muted">{toYMD(progressHistory[0].log_date)}</small>
//                           </div>
//                           <div className="mt-2">
//                             <Row className="g-2">
//                               <Col xs={6}>
//                                 <div className="text-center p-2 bg-light rounded">
//                                   <GiWeightScale className="h4 text-primary mb-2" />
//                                   <div className="fw-bold">{progressHistory[0].weight_kg ?? "N/A"} kg</div>
//                                   <small className="text-muted">Weight</small>
//                                 </div>
//                               </Col>
//                               <Col xs={6}>
//                                 <div className="text-center p-2 bg-light rounded">
//                                   <FaFire className="h4 text-warning mb-2" />
//                                   <div className="fw-bold">{progressHistory[0].calories ?? "N/A"} cal</div>
//                                   <small className="text-muted">Calories</small>
//                                 </div>
//                               </Col>
//                             </Row>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* Full history table (THIS is what your doctor asked for: see all times they filled progress) */}
//                     <div className="mt-3" style={{ maxHeight: "320px", overflowY: "auto" }}>
//                       <Table hover responsive size="sm" className="mb-0">
//                         <thead>
//                           <tr>
//                             <th>Date</th>
//                             <th>Weight</th>
//                             <th>Calories</th>
//                             <th>Protein</th>
//                             <th>Steps</th>
//                             <th>Water</th>
//                             <th>Sleep</th>
//                             <th>Notes</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {progressHistory.map((p, idx) => (
//                             <tr key={idx}>
//                               <td>{toYMD(p.log_date)}</td>
//                               <td>{p.weight_kg ?? "—"}</td>
//                               <td>{p.calories ?? "—"}</td>
//                               <td>{p.protein_g ?? "—"}</td>
//                               <td>{p.steps ?? "—"}</td>
//                               <td>{p.water_liters ?? "—"}</td>
//                               <td>{p.sleep_hours ?? "—"}</td>
//                               <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
//                                 {p.notes ?? ""}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </Table>
//                     </div>

//                     {/* Mini compare latest vs previous */}
//                     {latest && prev && (
//                       <Alert variant="light" className="mt-3 mb-0 border">
//                         <div className="d-flex justify-content-between align-items-center">
//                           <div>
//                             <strong>Compare last 2 logs:</strong>{" "}
//                             <span className="text-muted">
//                               {toYMD(prev.log_date)} → {toYMD(latest.log_date)}
//                             </span>
//                           </div>
//                         </div>
//                         <div className="mt-2 d-flex flex-wrap gap-2">
//                           <span>
//                             Weight: <TrendBadge value={weightDiff} goodWhenDown />
//                           </span>
//                           <span>
//                             Steps: <TrendBadge value={stepsDiff} />
//                           </span>
//                           <span>
//                             Sleep: <TrendBadge value={sleepDiff} />
//                           </span>
//                           <span>
//                             Calories: <TrendBadge value={calDiff} />
//                           </span>
//                         </div>
//                       </Alert>
//                     )}
//                   </>
//                 )}
//               </Card.Body>
//             </Card>
//           </Tab>
//         </Tabs>
//       </Modal.Body>
//     </Modal>
//   );
// }

// /* ---------------- Main Page ---------------- */
// export default function GymAttendanceTab() {
//   const [date, setDate] = useState(toYMD(new Date()));
//   const [loading, setLoading] = useState(false);
//   const [rows, setRows] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   const [selectedMember, setSelectedMember] = useState(null);
//   const [showModal, setShowModal] = useState(false);

//   const [progressData, setProgressData] = useState(null);
//   const [loadingProgress, setLoadingProgress] = useState(false);

//   const [stats, setStats] = useState({ total: 0, today: 0, active: 0 });

//   const loadAttendanceForDate = async () => {
//     setLoading(true);
//     setSelectedMember(null);
//     setProgressData(null);

//     try {
//       const res = await axios.get(`${API}/attendance/today`, { params: { date } });
//       const data = res.data?.rows || [];
//       setRows(data);

//       // stats (for selected date, not only real "today")
//       setStats({
//         total: data.length,
//         today: data.length,
//         active: data.filter((r) => r.status === "Active").length,
//       });
//     } catch (e) {
//       console.error("Failed to load attendance:", e);
//       setRows([]);
//       setStats({ total: 0, today: 0, active: 0 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadProgressForMemberOnSelectedDate = async (customerId) => {
//     setLoadingProgress(true);
//     setProgressData(null);
//     try {
//       const res = await axios.get(`${API}/progress/logs/customer/${customerId}`, {
//         params: { from: date, to: date },
//       });
//       const latest = res.data?.logs?.[0] || null; // should be the log for that date if exists
//       setProgressData(latest);
//     } catch (e) {
//       console.error("Failed to load progress:", e);
//       setProgressData(null);
//     } finally {
//       setLoadingProgress(false);
//     }
//   };

//   const markAttendance = async (customerId) => {
//     try {
//       const res = await axios.post(`${API}/attendance/checkin`, { customer_id: customerId });
//       if (res.data.ok) {
//         alert(res.data.already ? "Member already attended today!" : "Attendance marked successfully!");
//         loadAttendanceForDate();
//       }
//     } catch (error) {
//       alert("Failed to mark attendance: " + (error.response?.data?.error || error.message));
//     }
//   };

//   const handleMemberSelect = async (member) => {
//     setSelectedMember(member);
//     setShowModal(true);
//     await loadProgressForMemberOnSelectedDate(member.customer_id);
//   };

//   const filteredRows = useMemo(() => {
//     const term = searchTerm.trim().toLowerCase();
//     if (!term) return rows;
//     return rows.filter(
//       (r) =>
//         (r.full_name || "").toLowerCase().includes(term) ||
//         (r.phone || "").toLowerCase().includes(term) ||
//         String(r.customer_id || "").includes(term)
//     );
//   }, [rows, searchTerm]);

//   useEffect(() => {
//     loadAttendanceForDate();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const StatCard = ({ title, value, icon, color, subtext }) => (
//     <Card className={`stat-card border-0 bg-gradient-${color}`}>
//       <Card.Body className="text-white">
//         <div className="d-flex justify-content-between align-items-center">
//           <div>
//             <h6 className="mb-1">{title}</h6>
//             <h2 className="fw-bold mb-0">{value}</h2>
//             {subtext && <small className="opacity-75">{subtext}</small>}
//           </div>
//           <div className="stat-icon">{icon}</div>
//         </div>
//       </Card.Body>
//     </Card>
//   );

//   return (
//     <div className="gym-attendance-container">
//       <style>{`
//         .gym-attendance-container {
//           min-height: 100vh;
//           background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
//           padding: 20px;
//         }

//         .stat-card {
//           border-radius: 15px;
//           box-shadow: 0 4px 15px rgba(0,0,0,0.1);
//           transition: transform 0.3s ease;
//         }
//         .stat-card:hover { transform: translateY(-5px); }

//         .bg-gradient-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
//         .bg-gradient-success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
//         .bg-gradient-warning { background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); }

//         .stat-icon { font-size: 2.5rem; opacity: 0.8; }

//         .attendance-card {
//           border-radius: 12px;
//           box-shadow: 0 3px 10px rgba(0,0,0,0.08);
//           cursor: pointer;
//           transition: all 0.3s ease;
//           border: 2px solid transparent;
//           margin-bottom: 15px;
//         }
//         .attendance-card:hover {
//           transform: translateY(-3px);
//           box-shadow: 0 5px 20px rgba(0,0,0,0.15);
//           border-color: #667eea;
//         }
//         .attendance-card.selected {
//           border-color: #667eea;
//           background-color: rgba(102, 126, 234, 0.05);
//         }
//         .attendance-card.today-card { border-left: 4px solid #38ef7d; }

//         .attendance-badge {
//           border-radius: 20px;
//           padding: 5px 12px;
//           font-size: 0.8rem;
//         }

//         .progress-stat {
//           background: white;
//           padding: 12px;
//           border-radius: 10px;
//           box-shadow: 0 2px 5px rgba(0,0,0,0.05);
//           border-left: 4px solid;
//         }
//         .stat-icon { font-size: 1.5rem; }
//         .stat-value { font-weight: bold; font-size: 1.1rem; }
//         .stat-label { font-size: 0.8rem; color: #666; }

//         .progress-timeline { position: relative; padding-left: 30px; }
//         .timeline-item { position: relative; margin-bottom: 20px; }
//         .timeline-marker {
//           position: absolute;
//           left: -30px;
//           top: 0;
//           width: 20px;
//           height: 20px;
//           border-radius: 50%;
//           border: 3px solid white;
//           box-shadow: 0 0 0 3px;
//         }
//         .timeline-content {
//           background: white;
//           padding: 15px;
//           border-radius: 10px;
//           box-shadow: 0 2px 10px rgba(0,0,0,0.05);
//         }

//         .floating-action-btn {
//           position: fixed;
//           bottom: 30px;
//           right: 30px;
//           width: 60px;
//           height: 60px;
//           border-radius: 50%;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           color: white;
//           border: none;
//           box-shadow: 0 5px 20px rgba(102, 126, 234, 0.5);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 1.5rem;
//           z-index: 1000;
//           transition: all 0.3s ease;
//         }
//         .floating-action-btn:hover {
//           transform: scale(1.1);
//           box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
//         }

//         .attendance-grid {
//           max-height: calc(100vh - 300px);
//           overflow-y: auto;
//           padding-right: 10px;
//         }
//         .attendance-grid::-webkit-scrollbar { width: 6px; }
//         .attendance-grid::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
//         .attendance-grid::-webkit-scrollbar-thumb { background: #667eea; border-radius: 10px; }

//         .week-indicator {
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: white;
//           padding: 10px 20px;
//           border-radius: 10px;
//           box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//           margin-bottom: 20px;
//         }
//         .week-indicator .current-week {
//           font-size: 1.5rem;
//           font-weight: bold;
//           color: #667eea;
//           margin: 0 10px;
//         }
//       `}</style>

//       {/* Floating Action Button */}
//       <Button className="floating-action-btn" onClick={loadAttendanceForDate} title="Refresh Attendance">
//         <FaRunning />
//       </Button>

//       {/* Header with Stats */}
//       <Row className="g-3 mb-4">
//         <Col md={4}>
//           <StatCard title="Selected Date" value={stats.today} icon={<FaUsers />} color="primary" subtext="Members attended" />
//         </Col>
//         <Col md={4}>
//           <StatCard title="Active Plans" value={stats.active} icon={<FaDumbbell />} color="success" subtext="Active subscriptions" />
//         </Col>
//         <Col md={4}>
//           <StatCard title="Records Loaded" value={stats.total} icon={<FaCalendarAlt />} color="warning" subtext="For this date" />
//         </Col>
//       </Row>

//       {/* Week Indicator */}
//       <div className="week-indicator">
//         <FaCalendarWeek className="me-2 text-primary" />
//         <span>Week</span>
//         <span className="current-week">{getWeekNumber(date)}</span>
//         <span>• {getDayOfWeek(date)}</span>
//       </div>

//       <Row className="g-4">
//         {/* Left Column */}
//         <Col lg={3}>
//           <Card className="border-0 shadow-sm mb-4">
//             <Card.Body>
//               <h6 className="fw-bold text-primary mb-3">
//                 <FaCalendarCheck className="me-2" />
//                 Date Filter
//               </h6>
//               <Form.Group className="mb-3">
//                 <Form.Label>Select Date</Form.Label>
//                 <Form.Control
//                   type="date"
//                   value={date}
//                   onChange={(e) => setDate(e.target.value)}
//                   className="border-primary"
//                 />
//               </Form.Group>

//               <Button variant="primary" className="w-100 mb-3" onClick={loadAttendanceForDate} disabled={loading}>
//                 {loading ? (
//                   <>
//                     <Spinner animation="border" size="sm" className="me-2" />
//                     Loading...
//                   </>
//                 ) : (
//                   <>
//                     <FaRunning className="me-2" />
//                     Load Attendance
//                   </>
//                 )}
//               </Button>

//               <Form.Group>
//                 <Form.Label>
//                   <FaUsers className="me-1" />
//                   Search Members
//                 </Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="Name, phone, or ID..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="border-primary"
//                 />
//               </Form.Group>

//               {filteredRows.length > 0 && (
//                 <div className="mt-3">
//                   <small className="text-muted">
//                     Showing {filteredRows.length} of {rows.length} members
//                   </small>
//                 </div>
//               )}
//             </Card.Body>
//           </Card>

//           {/* Quick Actions */}
//           <Card className="border-0 shadow-sm">
//             <Card.Body>
//               <h6 className="fw-bold text-primary mb-3">
//                 <FaBolt className="me-2" />
//                 Quick Actions
//               </h6>

//               <Button
//                 variant="outline-success"
//                 className="w-100 mb-2"
//                 onClick={() => {
//                   if (selectedMember) markAttendance(selectedMember.customer_id);
//                   else alert("Please select a member first!");
//                 }}
//               >
//                 <FaUserCheck className="me-2" />
//                 Mark Attendance
//               </Button>

//               <Button
//                 variant="outline-primary"
//                 className="w-100"
//                 onClick={() => {
//                   const today = new Date();
//                   setDate(toYMD(today));
//                   // IMPORTANT: load AFTER date change (use next tick)
//                   setTimeout(loadAttendanceForDate, 0);
//                 }}
//               >
//                 <FaCalendarDay className="me-2" />
//                 Today's View
//               </Button>
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Right Column */}
//         <Col lg={9}>
//           <Card className="border-0 shadow-sm">
//             <Card.Body>
//               <div className="d-flex justify-content-between align-items-center mb-4">
//                 <h5 className="fw-bold text-primary mb-0">
//                   <FaDumbbell className="me-2" />
//                   Attendance ({filteredRows.length})
//                 </h5>
//                 <div className="d-flex gap-2">
//                   <Badge bg="success" className="px-3 py-2">
//                     <FaClock className="me-1" />
//                     {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//                   </Badge>
//                   <Badge bg="info" className="px-3 py-2">
//                     Week {getWeekNumber(date)}
//                   </Badge>
//                 </div>
//               </div>

//               {loading ? (
//                 <div className="text-center py-5">
//                   <Spinner animation="border" variant="primary" size="lg" />
//                   <p className="mt-3 text-muted">Loading attendance data...</p>
//                 </div>
//               ) : filteredRows.length === 0 ? (
//                 <Alert variant="info" className="text-center">
//                   <FaCalendarCheck className="h2 mb-3" />
//                   <h5>No attendance records for this date</h5>
//                   <p className="mb-0">Try selecting a different date or check back later.</p>
//                 </Alert>
//               ) : (
//                 <div className="attendance-grid">
//                   <Row>
//                     {filteredRows.map((attendance) => (
//                       <Col md={6} lg={4} key={attendance.attendance_id}>
//                         <AttendanceCard
//                           attendance={attendance}
//                           onClick={() => handleMemberSelect(attendance)}
//                           isSelected={selectedMember?.attendance_id === attendance.attendance_id}
//                         />
//                       </Col>
//                     ))}
//                   </Row>
//                 </div>
//               )}
//             </Card.Body>
//           </Card>

//           {/* Bottom Stats */}
//           {filteredRows.length > 0 && (
//             <Row className="mt-4 g-3">
//               <Col md={4}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Body className="text-center">
//                     <FaClock className="h3 text-primary mb-2" />
//                     <h4 className="fw-bold">{formatTime(filteredRows[filteredRows.length - 1]?.attended_at) || "N/A"}</h4>
//                     <small className="text-muted">First Check-in</small>
//                   </Card.Body>
//                 </Card>
//               </Col>
//               <Col md={4}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Body className="text-center">
//                     <FaTrophy className="h3 text-warning mb-2" />
//                     <h4 className="fw-bold">{filteredRows.filter((r) => r.status === "Active").length}</h4>
//                     <small className="text-muted">Active Members</small>
//                   </Card.Body>
//                 </Card>
//               </Col>
//               <Col md={4}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Body className="text-center">
//                     <FaFire className="h3 text-danger mb-2" />
//                     <h4 className="fw-bold">{100}%</h4>
//                     <small className="text-muted">Loaded Rate</small>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>
//           )}
//         </Col>
//       </Row>

//       {/* Member Detail Modal */}
//       <MemberDetailModal
//         show={showModal}
//         onHide={() => setShowModal(false)}
//         member={selectedMember}
//         selectedDate={date}
//         attendance={
//           selectedMember
//             ? {
//                 already: rows.some(
//                   (r) =>
//                     r.customer_id === selectedMember.customer_id &&
//                     toYMD(new Date(r.attended_at)) === toYMD(new Date())
//                 ),
//               }
//             : null
//         }
//         progressToday={loadingProgress ? null : progressData}
//         onMarkAttendance={() => {
//           if (selectedMember) {
//             markAttendance(selectedMember.customer_id);
//             setShowModal(false);
//           }
//         }}
//       />
//     </div>
//   );
// }

// import React, { useEffect, useMemo, useState } from "react";
// import { 
//   Row, Col, Card, Table, Form, Button, Spinner, Badge,
//   Modal, ProgressBar, Tabs, Tab, ListGroup, Alert
// } from "react-bootstrap";
// import axios from "axios";
// import { 
//   FaDumbbell, FaRunning, FaCalendarCheck, FaChartLine, 
//   FaFire, FaClock, FaUserCheck, FaCalendarDay,
//   FaCalendarWeek, FaCalendarAlt, FaWeight, FaHeartbeat,
//   FaBed, FaUtensils, FaTrophy, FaUsers, FaBolt
// } from "react-icons/fa";
// import { 
//   GiMuscleUp, GiWaterDrop, GiFootsteps, GiWeightScale 
// } from "react-icons/gi";

// const API = "http://localhost:5000/api/gym";

// function toYMD(d) {
//   const x = new Date(d);
//   const yyyy = x.getFullYear();
//   const mm = String(x.getMonth() + 1).padStart(2, "0");
//   const dd = String(x.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// }

// function formatTime(dateStr) {
//   const d = new Date(dateStr);
//   return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// }

// function getWeekNumber(date) {
//   const d = new Date(date);
//   d.setHours(0, 0, 0, 0);
//   d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
//   const week1 = new Date(d.getFullYear(), 0, 4);
//   return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
// }

// function getDayOfWeek(date) {
//   const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
//   return days[new Date(date).getDay()];
// }

// function AttendanceCard({ attendance, onClick, isSelected }) {
//   const today = new Date();
//   const attendanceDate = new Date(attendance.attended_at);
//   const isToday = attendanceDate.toDateString() === today.toDateString();
  
//   return (
//     <Card 
//       className={`attendance-card ${isSelected ? 'selected' : ''} ${isToday ? 'today-card' : ''}`}
//       onClick={onClick}
//     >
//       <Card.Body>
//         <div className="d-flex justify-content-between align-items-start">
//           <div>
//             <h6 className="mb-1 fw-bold text-primary">{attendance.full_name}</h6>
//             <small className="text-muted">ID: {attendance.customer_id}</small>
//           </div>
//           <Badge bg={isToday ? "success" : "info"} className="attendance-badge">
//             {formatTime(attendance.attended_at)}
//           </Badge>
//         </div>
        
//         <div className="mt-3">
//           <div className="d-flex align-items-center mb-1">
//             <FaCalendarDay className="me-2 text-secondary" size={12} />
//             <small className="text-muted">{getDayOfWeek(attendance.attended_at)}</small>
//           </div>
//           <div className="d-flex align-items-center">
//             <FaDumbbell className="me-2 text-warning" size={12} />
//             <small className="text-muted">{attendance.plan_type || "No Plan"}</small>
//           </div>
//         </div>
        
//         <div className="mt-3 d-flex justify-content-between align-items-center">
//           <div>
//             <FaFire className="text-danger" />
//             <small className="ms-1">Week {getWeekNumber(attendance.attended_at)}</small>
//           </div>
//           <Badge bg={attendance.status === "Active" ? "success" : "secondary"}>
//             {attendance.status}
//           </Badge>
//         </div>
//       </Card.Body>
//     </Card>
//   );
// }

// function ProgressStats({ progress }) {
//   if (!progress) return null;
  
//   const stats = [
//     { label: "Weight", value: progress.weight_kg, unit: "kg", icon: <GiWeightScale />, color: "primary" },
//     { label: "Calories", value: progress.calories, unit: "kcal", icon: <FaFire />, color: "warning" },
//     { label: "Protein", value: progress.protein_g, unit: "g", icon: <GiMuscleUp />, color: "danger" },
//     { label: "Steps", value: progress.steps, unit: "steps", icon: <GiFootsteps />, color: "success" },
//     { label: "Water", value: progress.water_liters, unit: "L", icon: <GiWaterDrop />, color: "info" },
//     { label: "Sleep", value: progress.sleep_hours, unit: "hrs", icon: <FaBed />, color: "dark" },
//   ];

//   return (
//     <Row className="g-2 mt-3">
//       {stats.map((stat, idx) => (
//         stat.value != null && (
//           <Col xs={6} md={4} key={idx}>
//             <div className="progress-stat">
//               <div className="d-flex align-items-center">
//                 <span className={`stat-icon text-${stat.color}`}>{stat.icon}</span>
//                 <div className="ms-2">
//                   <div className="stat-value">{stat.value} {stat.unit}</div>
//                   <div className="stat-label">{stat.label}</div>
//                 </div>
//               </div>
//             </div>
//           </Col>
//         )
//       ))}
//     </Row>
//   );
// }

// function MemberDetailModal({ show, onHide, member, attendance, progress, onMarkAttendance }) {
//   // FIXED: Move hooks to the top unconditionally
//   const [activeTab, setActiveTab] = useState("overview");
//   const [attendanceHistory, setAttendanceHistory] = useState([]);
//   const [loadingHistory, setLoadingHistory] = useState(false);

//   useEffect(() => {
//     if (show && member?.customer_id) {
//       loadAttendanceHistory();
//     } else {
//       setAttendanceHistory([]);
//     }
//   }, [show, member?.customer_id]);

//   const loadAttendanceHistory = async () => {
//     if (!member?.customer_id) return;
    
//     setLoadingHistory(true);
//     try {
//       const res = await axios.get(`${API}/attendance/history/${member.customer_id}`, {
//         params: { from: "2024-01-01", to: toYMD(new Date()) }
//       });
//       setAttendanceHistory(res.data?.rows || []);
//     } catch (error) {
//       console.error("Failed to load attendance history:", error);
//     } finally {
//       setLoadingHistory(false);
//     }
//   };

//   if (!member) return null;

//   const attendanceCount = attendanceHistory.length;
//   const thisWeekAttendance = attendanceHistory.filter(a => {
//     const date = new Date(a.attended_at);
//     const today = new Date();
//     const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
//     return date >= startOfWeek;
//   }).length;

//   return (
//     <Modal show={show} onHide={onHide} size="lg" centered>
//       <Modal.Header closeButton className="bg-primary text-white">
//         <Modal.Title>
//           <FaDumbbell className="me-2" />
//           {member.full_name}'s Dashboard
//         </Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
//           <Tab eventKey="overview" title={<><FaChartLine className="me-1" /> Overview</>}>
//             <Row className="g-3">
//               <Col md={6}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Body>
//                     <h6 className="fw-bold text-primary">Member Information</h6>
//                     <ListGroup variant="flush">
//                       <ListGroup.Item className="d-flex justify-content-between">
//                         <span>Customer ID</span>
//                         <strong>{member.customer_id}</strong>
//                       </ListGroup.Item>
//                       <ListGroup.Item className="d-flex justify-content-between">
//                         <span>Phone</span>
//                         <strong>{member.phone || "N/A"}</strong>
//                       </ListGroup.Item>
//                       <ListGroup.Item className="d-flex justify-content-between">
//                         <span>Plan Type</span>
//                         <Badge bg="info">{member.plan_type || "N/A"}</Badge>
//                       </ListGroup.Item>
//                       <ListGroup.Item className="d-flex justify-content-between">
//                         <span>Status</span>
//                         <Badge bg={member.status === "Active" ? "success" : "warning"}>
//                           {member.status}
//                         </Badge>
//                       </ListGroup.Item>
//                     </ListGroup>
//                   </Card.Body>
//                 </Card>
//               </Col>
//               <Col md={6}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Body>
//                     <h6 className="fw-bold text-primary">Attendance Stats</h6>
//                     <div className="text-center py-4">
//                       <div className="display-4 fw-bold text-primary">{attendanceCount}</div>
//                       <p className="text-muted">Total Visits</p>
//                     </div>
//                     <div className="d-flex justify-content-around">
//                       <div className="text-center">
//                         <div className="h3 fw-bold text-success">{thisWeekAttendance}</div>
//                         <small className="text-muted">This Week</small>
//                       </div>
//                       <div className="text-center">
//                         <div className="h3 fw-bold text-warning">
//                           {attendanceCount > 0 ? Math.round((thisWeekAttendance / 7) * 100) : 0}%
//                         </div>
//                         <small className="text-muted">Weekly Rate</small>
//                       </div>
//                     </div>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>

//             {progress && (
//               <Card className="mt-3 border-0 shadow-sm">
//                 <Card.Body>
//                   <h6 className="fw-bold text-primary">Today's Progress</h6>
//                   <ProgressStats progress={progress} />
//                   {progress.notes && (
//                     <div className="mt-3 p-3 bg-light rounded">
//                       <small className="text-muted">Notes:</small>
//                       <p className="mb-0">{progress.notes}</p>
//                     </div>
//                   )}
//                 </Card.Body>
//               </Card>
//             )}
//           </Tab>

//           <Tab eventKey="attendance" title={<><FaCalendarCheck className="me-1" /> Attendance</>}>
//             <Card className="border-0 shadow-sm">
//               <Card.Body>
//                 <div className="d-flex justify-content-between align-items-center mb-3">
//                   <h6 className="fw-bold text-primary mb-0">Attendance History</h6>
//                   <Button 
//                     variant="outline-primary" 
//                     size="sm"
//                     onClick={onMarkAttendance}
//                     disabled={attendance?.already}
//                   >
//                     <FaUserCheck className="me-1" />
//                     {attendance?.already ? "Already Attended Today" : "Mark Attendance"}
//                   </Button>
//                 </div>
                
//                 {loadingHistory ? (
//                   <div className="text-center py-4">
//                     <Spinner animation="border" variant="primary" />
//                   </div>
//                 ) : attendanceHistory.length === 0 ? (
//                   <Alert variant="info">
//                     No attendance records found for this member.
//                   </Alert>
//                 ) : (
//                   <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
//                     <Table hover responsive size="sm">
//                       <thead>
//                         <tr>
//                           <th>Date</th>
//                           <th>Day</th>
//                           <th>Time</th>
//                           <th>Week</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {attendanceHistory.map((record, idx) => {
//                           const recordDate = new Date(record.attended_at);
//                           const isToday = recordDate.toDateString() === new Date().toDateString();
//                           return (
//                             <tr key={idx} className={isToday ? 'table-success' : ''}>
//                               <td>{toYMD(record.attended_at)}</td>
//                               <td>{getDayOfWeek(record.attended_at)}</td>
//                               <td>{formatTime(record.attended_at)}</td>
//                               <td>Week {getWeekNumber(record.attended_at)}</td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </Table>
//                   </div>
//                 )}
//               </Card.Body>
//             </Card>
//           </Tab>

//           <Tab eventKey="progress" title={<><FaChartLine className="me-1" /> Progress</>}>
//             <Card className="border-0 shadow-sm">
//               <Card.Body>
//                 <h6 className="fw-bold text-primary mb-3">Progress Timeline</h6>
//                 {progress ? (
//                   <div className="progress-timeline">
//                     <div className="timeline-item">
//                       <div className="timeline-marker bg-primary"></div>
//                       <div className="timeline-content">
//                         <div className="d-flex justify-content-between">
//                           <strong>Today</strong>
//                           <small className="text-muted">{toYMD(new Date())}</small>
//                         </div>
//                         <div className="mt-2">
//                           <Row className="g-2">
//                             <Col xs={6}>
//                               <div className="text-center p-2 bg-light rounded">
//                                 <GiWeightScale className="h4 text-primary mb-2" />
//                                 <div className="fw-bold">{progress.weight_kg || "N/A"} kg</div>
//                                 <small className="text-muted">Weight</small>
//                               </div>
//                             </Col>
//                             <Col xs={6}>
//                               <div className="text-center p-2 bg-light rounded">
//                                 <FaFire className="h4 text-warning mb-2" />
//                                 <div className="fw-bold">{progress.calories || "N/A"} cal</div>
//                                 <small className="text-muted">Calories</small>
//                               </div>
//                             </Col>
//                           </Row>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <Alert variant="info">
//                     No progress data available for today. Check back later!
//                   </Alert>
//                 )}
//               </Card.Body>
//             </Card>
//           </Tab>
//         </Tabs>
//       </Modal.Body>
//     </Modal>
//   );
// }

// export default function GymAttendanceTab() {
//   const [date, setDate] = useState(toYMD(new Date()));
//   const [loading, setLoading] = useState(false);
//   const [rows, setRows] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedMember, setSelectedMember] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [progressData, setProgressData] = useState(null);
//   const [loadingProgress, setLoadingProgress] = useState(false);
//   const [stats, setStats] = useState({ total: 0, today: 0, active: 0 });

//   const loadTodayAttendance = async () => {
//     setLoading(true);
//     setSelectedMember(null);
//     setProgressData(null);
//     try {
//       const res = await axios.get(`${API}/attendance/today`, { params: { date } });
//       const data = res.data?.rows || [];
//       setRows(data);
      
//       // Calculate stats
//       const today = toYMD(new Date());
//       const todayRows = data.filter(r => {
//         const rowDate = new Date(r.attended_at);
//         return toYMD(rowDate) === today;
//       });
      
//       setStats({
//         total: data.length,
//         today: todayRows.length,
//         active: data.filter(r => r.status === "Active").length
//       });
//     } catch (e) {
//       console.error("Failed to load attendance:", e);
//       setRows([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadProgressForMember = async (customerId) => {
//     setLoadingProgress(true);
//     setProgressData(null);
//     try {
//       const res = await axios.get(`${API}/progress/logs/customer/${customerId}`, {
//         params: { from: date, to: date }
//       });
//       const latest = res.data?.logs?.[0] || null;
//       setProgressData(latest);
//     } catch (e) {
//       console.error("Failed to load progress:", e);
//       setProgressData(null);
//     } finally {
//       setLoadingProgress(false);
//     }
//   };

//   const markAttendance = async (customerId) => {
//     try {
//       const res = await axios.post(`${API}/attendance/checkin`, {
//         customer_id: customerId
//       });
//       if (res.data.ok) {
//         alert(res.data.already ? "Member already attended today!" : "Attendance marked successfully!");
//         loadTodayAttendance();
//       }
//     } catch (error) {
//       alert("Failed to mark attendance: " + (error.response?.data?.error || error.message));
//     }
//   };

//   const handleMemberSelect = (member) => {
//     setSelectedMember(member);
//     loadProgressForMember(member.customer_id);
//     setShowModal(true);
//   };

//   const filteredRows = useMemo(() => {
//     const term = searchTerm.trim().toLowerCase();
//     if (!term) return rows;
//     return rows.filter(r => 
//       (r.full_name || "").toLowerCase().includes(term) ||
//       (r.phone || "").toLowerCase().includes(term) ||
//       String(r.customer_id || "").includes(term)
//     );
//   }, [rows, searchTerm]);

//   useEffect(() => {
//     loadTodayAttendance();
//   }, []);

//   const StatCard = ({ title, value, icon, color, subtext }) => (
//     <Card className={`stat-card border-0 bg-gradient-${color}`}>
//       <Card.Body className="text-white">
//         <div className="d-flex justify-content-between align-items-center">
//           <div>
//             <h6 className="mb-1">{title}</h6>
//             <h2 className="fw-bold mb-0">{value}</h2>
//             {subtext && <small className="opacity-75">{subtext}</small>}
//           </div>
//           <div className="stat-icon">
//             {icon}
//           </div>
//         </div>
//       </Card.Body>
//     </Card>
//   );

//   return (
//     <div className="gym-attendance-container">
//       <style>{`
//         .gym-attendance-container {
//           min-height: 100vh;
//           background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
//           padding: 20px;
//         }
        
//         .stat-card {
//           border-radius: 15px;
//           box-shadow: 0 4px 15px rgba(0,0,0,0.1);
//           transition: transform 0.3s ease;
//         }
        
//         .stat-card:hover {
//           transform: translateY(-5px);
//         }
        
//         .bg-gradient-primary {
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//         }
        
//         .bg-gradient-success {
//           background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
//         }
        
//         .bg-gradient-warning {
//           background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
//         }
        
//         .stat-icon {
//           font-size: 2.5rem;
//           opacity: 0.8;
//         }
        
//         .attendance-card {
//           border-radius: 12px;
//           box-shadow: 0 3px 10px rgba(0,0,0,0.08);
//           cursor: pointer;
//           transition: all 0.3s ease;
//           border: 2px solid transparent;
//           margin-bottom: 15px;
//         }
        
//         .attendance-card:hover {
//           transform: translateY(-3px);
//           box-shadow: 0 5px 20px rgba(0,0,0,0.15);
//           border-color: #667eea;
//         }
        
//         .attendance-card.selected {
//           border-color: #667eea;
//           background-color: rgba(102, 126, 234, 0.05);
//         }
        
//         .attendance-card.today-card {
//           border-left: 4px solid #38ef7d;
//         }
        
//         .attendance-badge {
//           border-radius: 20px;
//           padding: 5px 12px;
//           font-size: 0.8rem;
//         }
        
//         .progress-stat {
//           background: white;
//           padding: 12px;
//           border-radius: 10px;
//           box-shadow: 0 2px 5px rgba(0,0,0,0.05);
//           border-left: 4px solid;
//         }
        
//         .stat-icon {
//           font-size: 1.5rem;
//         }
        
//         .stat-value {
//           font-weight: bold;
//           font-size: 1.1rem;
//         }
        
//         .stat-label {
//           font-size: 0.8rem;
//           color: #666;
//         }
        
//         .progress-timeline {
//           position: relative;
//           padding-left: 30px;
//         }
        
//         .timeline-item {
//           position: relative;
//           margin-bottom: 20px;
//         }
        
//         .timeline-marker {
//           position: absolute;
//           left: -30px;
//           top: 0;
//           width: 20px;
//           height: 20px;
//           border-radius: 50%;
//           border: 3px solid white;
//           box-shadow: 0 0 0 3px;
//         }
        
//         .timeline-content {
//           background: white;
//           padding: 15px;
//           border-radius: 10px;
//           box-shadow: 0 2px 10px rgba(0,0,0,0.05);
//         }
        
//         .floating-action-btn {
//           position: fixed;
//           bottom: 30px;
//           right: 30px;
//           width: 60px;
//           height: 60px;
//           border-radius: 50%;
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           color: white;
//           border: none;
//           box-shadow: 0 5px 20px rgba(102, 126, 234, 0.5);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 1.5rem;
//           z-index: 1000;
//           transition: all 0.3s ease;
//         }
        
//         .floating-action-btn:hover {
//           transform: scale(1.1);
//           box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
//         }
        
//         .attendance-grid {
//           max-height: calc(100vh - 300px);
//           overflow-y: auto;
//           padding-right: 10px;
//         }
        
//         .attendance-grid::-webkit-scrollbar {
//           width: 6px;
//         }
        
//         .attendance-grid::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 10px;
//         }
        
//         .attendance-grid::-webkit-scrollbar-thumb {
//           background: #667eea;
//           border-radius: 10px;
//         }
        
//         .week-indicator {
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           background: white;
//           padding: 10px 20px;
//           border-radius: 10px;
//           box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//           margin-bottom: 20px;
//         }
        
//         .week-indicator .current-week {
//           font-size: 1.5rem;
//           font-weight: bold;
//           color: #667eea;
//           margin: 0 10px;
//         }
//       `}</style>

//       {/* Floating Action Button */}
//       <Button 
//         className="floating-action-btn"
//         onClick={loadTodayAttendance}
//         title="Refresh Attendance"
//       >
//         <FaRunning />
//       </Button>

//       {/* Header with Stats */}
//       <Row className="g-3 mb-4">
//         <Col md={4}>
//           <StatCard 
//             title="Total Today" 
//             value={stats.today} 
//             icon={<FaUsers />}
//             color="primary"
//             subtext="Members attended"
//           />
//         </Col>
//         <Col md={4}>
//           <StatCard 
//             title="Active Plans" 
//             value={stats.active} 
//             icon={<FaDumbbell />}
//             color="success"
//             subtext="Active subscriptions"
//           />
//         </Col>
//         <Col md={4}>
//           <StatCard 
//             title="Total Records" 
//             value={stats.total} 
//             icon={<FaCalendarAlt />}
//             color="warning"
//             subtext="All attendance"
//           />
//         </Col>
//       </Row>

//       {/* Week Indicator */}
//       <div className="week-indicator">
//         <FaCalendarWeek className="me-2 text-primary" />
//         <span>Week</span>
//         <span className="current-week">{getWeekNumber(date)}</span>
//         <span>• {getDayOfWeek(date)}</span>
//       </div>

//       <Row className="g-4">
//         {/* Left Column - Controls and Search */}
//         <Col lg={3}>
//           <Card className="border-0 shadow-sm mb-4">
//             <Card.Body>
//               <h6 className="fw-bold text-primary mb-3">
//                 <FaCalendarCheck className="me-2" />
//                 Date Filter
//               </h6>
//               <Form.Group className="mb-3">
//                 <Form.Label>Select Date</Form.Label>
//                 <Form.Control
//                   type="date"
//                   value={date}
//                   onChange={(e) => setDate(e.target.value)}
//                   className="border-primary"
//                 />
//               </Form.Group>
              
//               <Button 
//                 variant="primary" 
//                 className="w-100 mb-3"
//                 onClick={loadTodayAttendance}
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <>
//                     <Spinner animation="border" size="sm" className="me-2" />
//                     Loading...
//                   </>
//                 ) : (
//                   <>
//                     <FaRunning className="me-2" />
//                     Load Attendance
//                   </>
//                 )}
//               </Button>

//               <Form.Group>
//                 <Form.Label>
//                   <FaUsers className="me-1" />
//                   Search Members
//                 </Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="Name, phone, or ID..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="border-primary"
//                 />
//               </Form.Group>

//               {filteredRows.length > 0 && (
//                 <div className="mt-3">
//                   <small className="text-muted">
//                     Showing {filteredRows.length} of {rows.length} members
//                   </small>
//                 </div>
//               )}
//             </Card.Body>
//           </Card>

//           {/* Quick Actions */}
//           <Card className="border-0 shadow-sm">
//             <Card.Body>
//               <h6 className="fw-bold text-primary mb-3">
//                 <FaBolt className="me-2" />
//                 Quick Actions
//               </h6>
//               <Button 
//                 variant="outline-success" 
//                 className="w-100 mb-2"
//                 onClick={() => {
//                   if (selectedMember) {
//                     markAttendance(selectedMember.customer_id);
//                   } else {
//                     alert("Please select a member first!");
//                   }
//                 }}
//               >
//                 <FaUserCheck className="me-2" />
//                 Mark Attendance
//               </Button>
//               <Button 
//                 variant="outline-primary" 
//                 className="w-100"
//                 onClick={() => {
//                   const today = new Date();
//                   setDate(toYMD(today));
//                   loadTodayAttendance();
//                 }}
//               >
//                 <FaCalendarDay className="me-2" />
//                 Today's View
//               </Button>
//             </Card.Body>
//           </Card>
//         </Col>

//         {/* Right Column - Attendance Grid */}
//         <Col lg={9}>
//           <Card className="border-0 shadow-sm">
//             <Card.Body>
//               <div className="d-flex justify-content-between align-items-center mb-4">
//                 <h5 className="fw-bold text-primary mb-0">
//                   <FaDumbbell className="me-2" />
//                   Today's Attendance ({filteredRows.length})
//                 </h5>
//                 <div className="d-flex gap-2">
//                   <Badge bg="success" className="px-3 py-2">
//                     <FaClock className="me-1" />
//                     {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                   </Badge>
//                   <Badge bg="info" className="px-3 py-2">
//                     Week {getWeekNumber(date)}
//                   </Badge>
//                 </div>
//               </div>

//               {loading ? (
//                 <div className="text-center py-5">
//                   <Spinner animation="border" variant="primary" size="lg" />
//                   <p className="mt-3 text-muted">Loading attendance data...</p>
//                 </div>
//               ) : filteredRows.length === 0 ? (
//                 <Alert variant="info" className="text-center">
//                   <FaCalendarCheck className="h2 mb-3" />
//                   <h5>No attendance records for this date</h5>
//                   <p className="mb-0">Try selecting a different date or check back later.</p>
//                 </Alert>
//               ) : (
//                 <div className="attendance-grid">
//                   <Row>
//                     {filteredRows.map((attendance, idx) => (
//                       <Col md={6} lg={4} key={attendance.attendance_id}>
//                         <AttendanceCard
//                           attendance={attendance}
//                           onClick={() => handleMemberSelect(attendance)}
//                           isSelected={selectedMember?.attendance_id === attendance.attendance_id}
//                         />
//                       </Col>
//                     ))}
//                   </Row>
//                 </div>
//               )}
//             </Card.Body>
//           </Card>

//           {/* Bottom Stats */}
//           {filteredRows.length > 0 && (
//             <Row className="mt-4 g-3">
//               <Col md={4}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Body className="text-center">
//                     <FaClock className="h3 text-primary mb-2" />
//                     <h4 className="fw-bold">
//                       {formatTime(filteredRows[0]?.attended_at) || "N/A"}
//                     </h4>
//                     <small className="text-muted">First Check-in</small>
//                   </Card.Body>
//                 </Card>
//               </Col>
//               <Col md={4}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Body className="text-center">
//                     <FaTrophy className="h3 text-warning mb-2" />
//                     <h4 className="fw-bold">
//                       {filteredRows.filter(r => r.status === "Active").length}
//                     </h4>
//                     <small className="text-muted">Active Members</small>
//                   </Card.Body>
//                 </Card>
//               </Col>
//               <Col md={4}>
//                 <Card className="border-0 shadow-sm">
//                   <Card.Body className="text-center">
//                     <FaFire className="h3 text-danger mb-2" />
//                     <h4 className="fw-bold">
//                       {Math.round((filteredRows.length / rows.length) * 100) || 0}%
//                     </h4>
//                     <small className="text-muted">Attendance Rate</small>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             </Row>
//           )}
//         </Col>
//       </Row>

//       {/* Member Detail Modal */}
//       <MemberDetailModal
//         show={showModal}
//         onHide={() => setShowModal(false)}
//         member={selectedMember}
//         attendance={selectedMember ? {
//           already: rows.some(r => 
//             r.customer_id === selectedMember.customer_id && 
//             toYMD(new Date(r.attended_at)) === toYMD(new Date())
//           )
//         } : null}
//         progress={progressData}
//         loadingProgress={loadingProgress}
//         onMarkAttendance={() => {
//           if (selectedMember) {
//             markAttendance(selectedMember.customer_id);
//             setShowModal(false);
//           }
//         }}
//       />
//     </div>
//   );
// }
import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Spinner,
  Badge,
  Modal,
  Tabs,
  Tab,
  ListGroup,
  Alert,
} from "react-bootstrap";
import axios from "axios";
import {
  FaDumbbell,
  FaRunning,
  FaCalendarCheck,
  FaChartLine,
  FaFire,
  FaClock,
  FaUserCheck,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaBed,
  FaTrophy,
  FaUsers,
  FaBolt,
} from "react-icons/fa";
import { GiMuscleUp, GiWaterDrop, GiFootsteps, GiWeightScale } from "react-icons/gi";

const API = "http://localhost:5000/api/gym";

/* ---------------- Helpers ---------------- */
function toYMD(d) {
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  );
}

function getDayOfWeek(date) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date(date).getDay()];
}

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
}

function diff(a, b) {
  const A = safeNum(a);
  const B = safeNum(b);
  if (A == null || B == null) return null;
  return +(A - B).toFixed(2);
}

/* ---------------- UI Pieces ---------------- */
function AttendanceCard({ attendance, onClick, isSelected }) {
  const today = new Date();
  const attendanceDate = new Date(attendance.attended_at);
  const isToday = attendanceDate.toDateString() === today.toDateString();

  return (
    <Card
      className={`attendance-card ${isSelected ? "selected" : ""} ${isToday ? "today-card" : ""}`}
      onClick={onClick}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h6 className="mb-1 fw-bold text-primary">{attendance.full_name}</h6>
            <small className="text-muted">ID: {attendance.customer_id}</small>
          </div>
          <Badge bg={isToday ? "success" : "info"} className="attendance-badge">
            {formatTime(attendance.attended_at)}
          </Badge>
        </div>

        <div className="mt-3">
          <div className="d-flex align-items-center mb-1">
            <FaCalendarDay className="me-2 text-secondary" size={12} />
            <small className="text-muted">{getDayOfWeek(attendance.attended_at)}</small>
          </div>
          <div className="d-flex align-items-center">
            <FaDumbbell className="me-2 text-warning" size={12} />
            <small className="text-muted">{attendance.plan_type || "No Plan"}</small>
          </div>
        </div>

        <div className="mt-3 d-flex justify-content-between align-items-center">
          <div>
            <FaFire className="text-danger" />
            <small className="ms-1">Week {getWeekNumber(attendance.attended_at)}</small>
          </div>
          <Badge bg={attendance.status === "Active" ? "success" : "secondary"}>{attendance.status}</Badge>
        </div>
      </Card.Body>
    </Card>
  );
}

function ProgressStats({ progress }) {
  if (!progress) return null;

  const stats = [
    { label: "Weight", value: progress.weight_kg, unit: "kg", icon: <GiWeightScale />, color: "primary" },
    { label: "Calories", value: progress.calories, unit: "kcal", icon: <FaFire />, color: "warning" },
    { label: "Protein", value: progress.protein_g, unit: "g", icon: <GiMuscleUp />, color: "danger" },
    { label: "Steps", value: progress.steps, unit: "steps", icon: <GiFootsteps />, color: "success" },
    { label: "Water", value: progress.water_liters, unit: "L", icon: <GiWaterDrop />, color: "info" },
    { label: "Sleep", value: progress.sleep_hours, unit: "hrs", icon: <FaBed />, color: "dark" },
  ];

  return (
    <Row className="g-2 mt-3">
      {stats.map(
        (stat, idx) =>
          stat.value != null && (
            <Col xs={6} md={4} key={idx}>
              <div className="progress-stat">
                <div className="d-flex align-items-center">
                  <span className={`stat-icon text-${stat.color}`}>{stat.icon}</span>
                  <div className="ms-2">
                    <div className="stat-value">
                      {stat.value} {stat.unit}
                    </div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </div>
              </div>
            </Col>
          )
      )}
    </Row>
  );
}

function TrendBadge({ value, goodWhenDown = false }) {
  // value = current - previous
  if (value == null) return <span className="text-muted">—</span>;
  const isUp = value > 0;
  const isDown = value < 0;

  let variant = "secondary";
  if (goodWhenDown) {
    variant = isDown ? "success" : isUp ? "danger" : "secondary";
  } else {
    variant = isUp ? "success" : isDown ? "danger" : "secondary";
  }

  const sign = value > 0 ? "+" : "";
  return (
    <Badge bg={variant} className="px-2">
      {sign}
      {value}
    </Badge>
  );
}

/* ---------------- Modal (Now includes Progress History) ---------------- */
function MemberDetailModal({
  show,
  onHide,
  member,
  attendance,
  progressToday, // latest progress for selected date
  selectedDate, // YYYY-MM-DD
  onMarkAttendance,
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loadingAttendanceHistory, setLoadingAttendanceHistory] = useState(false);

  const [progressHistory, setProgressHistory] = useState([]); // MANY logs (to compare)
  const [loadingProgressHistory, setLoadingProgressHistory] = useState(false);

  useEffect(() => {
    if (show && member?.customer_id) {
      loadAttendanceHistory();
      loadProgressHistory();
    } else {
      setAttendanceHistory([]);
      setProgressHistory([]);
      setActiveTab("overview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, member?.customer_id]);

  const loadAttendanceHistory = async () => {
    if (!member?.customer_id) return;
    setLoadingAttendanceHistory(true);
    try {
      const res = await axios.get(`${API}/attendance/history/${member.customer_id}`, {
        params: { from: "2024-01-01", to: toYMD(new Date()) },
      });
      setAttendanceHistory(res.data?.rows || []);
    } catch (error) {
      console.error("Failed to load attendance history:", error);
      setAttendanceHistory([]);
    } finally {
      setLoadingAttendanceHistory(false);
    }
  };

  const loadProgressHistory = async () => {
    if (!member?.customer_id) return;
    setLoadingProgressHistory(true);
    try {
      // Pull a wide range so you can compare “times filled”.
      // You can change from/to later (ex: last 90 days).
      const res = await axios.get(`${API}/progress/logs/customer/${member.customer_id}`, {
        params: { from: "2024-01-01", to: toYMD(new Date()) },
      });

      // Expecting: { logs: [...] }
      const logs = res.data?.logs || [];
      // Make sure sorted by log_date desc for UI
      logs.sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
      setProgressHistory(logs);
    } catch (e) {
      console.error("Failed to load progress history:", e);
      setProgressHistory([]);
    } finally {
      setLoadingProgressHistory(false);
    }
  };

  if (!member) return null;

  const attendanceCount = attendanceHistory.length;

  const thisWeekAttendance = attendanceHistory.filter((a) => {
    const date = new Date(a.attended_at);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return date >= startOfWeek;
  }).length;

  const progressCount = progressHistory.length;

  // For “trend” compare latest log vs previous log
  const latest = progressHistory[0] || null;
  const prev = progressHistory[1] || null;

  const weightDiff = latest && prev ? diff(latest.weight_kg, prev.weight_kg) : null; // down = good
  const stepsDiff = latest && prev ? diff(latest.steps, prev.steps) : null; // up = good
  const sleepDiff = latest && prev ? diff(latest.sleep_hours, prev.sleep_hours) : null; // up = good
  const calDiff = latest && prev ? diff(latest.calories, prev.calories) : null; // depends (neutral)

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaDumbbell className="me-2" />
          {member.full_name}'s Dashboard
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || "overview")} className="mb-3">
          {/* ---------------- Overview ---------------- */}
          <Tab eventKey="overview" title={<><FaChartLine className="me-1" /> Overview</>}>
            <Row className="g-3">
              <Col md={6}>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <h6 className="fw-bold text-primary">Member Information</h6>
                    <ListGroup variant="flush">
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Customer ID</span>
                        <strong>{member.customer_id}</strong>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Phone</span>
                        <strong>{member.phone || "N/A"}</strong>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Plan Type</span>
                        <Badge bg="info">{member.plan_type || "N/A"}</Badge>
                      </ListGroup.Item>
                      <ListGroup.Item className="d-flex justify-content-between">
                        <span>Status</span>
                        <Badge bg={member.status === "Active" ? "success" : "warning"}>{member.status}</Badge>
                      </ListGroup.Item>
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <h6 className="fw-bold text-primary">Attendance Stats</h6>
                    <div className="text-center py-3">
                      <div className="display-4 fw-bold text-primary">{attendanceCount}</div>
                      <p className="text-muted mb-0">Total Visits</p>
                    </div>
                    <div className="d-flex justify-content-around mt-2">
                      <div className="text-center">
                        <div className="h3 fw-bold text-success">{thisWeekAttendance}</div>
                        <small className="text-muted">This Week</small>
                      </div>
                      <div className="text-center">
                        <div className="h3 fw-bold text-warning">
                          {attendanceCount > 0 ? Math.round((thisWeekAttendance / 7) * 100) : 0}%
                        </div>
                        <small className="text-muted">Weekly Rate</small>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Today Progress (for selected date) */}
            {progressToday && (
              <Card className="mt-3 border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold text-primary mb-0">Selected Date Progress</h6>
                    <Badge bg="secondary">{selectedDate}</Badge>
                  </div>
                  <ProgressStats progress={progressToday} />
                  {progressToday.notes && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <small className="text-muted">Notes:</small>
                      <p className="mb-0">{progressToday.notes}</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}

            {/* Progress summary + last trend */}
            <Card className="mt-3 border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold text-primary mb-0">Progress Entries</h6>
                  <Badge bg="info">{progressCount} logs</Badge>
                </div>

                {loadingProgressHistory ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : progressHistory.length === 0 ? (
                  <Alert variant="info" className="mt-3 mb-0">
                    No progress logs found for this member yet.
                  </Alert>
                ) : (
                  <Row className="g-3 mt-2">
                    <Col md={3}>
                      <div className="p-3 bg-light rounded text-center">
                        <div className="fw-bold">Weight</div>
                        <div className="mt-1">
                          <TrendBadge value={weightDiff} goodWhenDown />
                        </div>
                        <small className="text-muted">vs previous</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 bg-light rounded text-center">
                        <div className="fw-bold">Steps</div>
                        <div className="mt-1">
                          <TrendBadge value={stepsDiff} />
                        </div>
                        <small className="text-muted">vs previous</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 bg-light rounded text-center">
                        <div className="fw-bold">Sleep</div>
                        <div className="mt-1">
                          <TrendBadge value={sleepDiff} />
                        </div>
                        <small className="text-muted">vs previous</small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <div className="p-3 bg-light rounded text-center">
                        <div className="fw-bold">Calories</div>
                        <div className="mt-1">
                          <TrendBadge value={calDiff} />
                        </div>
                        <small className="text-muted">vs previous</small>
                      </div>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* ---------------- Attendance History ---------------- */}
          <Tab eventKey="attendance" title={<><FaCalendarCheck className="me-1" /> Attendance</>}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-primary mb-0">Attendance History</h6>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={onMarkAttendance}
                    disabled={attendance?.already}
                  >
                    <FaUserCheck className="me-1" />
                    {attendance?.already ? "Already Attended Today" : "Mark Attendance"}
                  </Button>
                </div>

                {loadingAttendanceHistory ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : attendanceHistory.length === 0 ? (
                  <Alert variant="info" className="mb-0">
                    No attendance records found for this member.
                  </Alert>
                ) : (
                  <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                    <Table hover responsive size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Time</th>
                          <th>Week</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceHistory.map((record, idx) => {
                          const recordDate = new Date(record.attended_at);
                          const isToday = recordDate.toDateString() === new Date().toDateString();
                          return (
                            <tr key={idx} className={isToday ? "table-success" : ""}>
                              <td>{toYMD(record.attended_at)}</td>
                              <td>{getDayOfWeek(record.attended_at)}</td>
                              <td>{formatTime(record.attended_at)}</td>
                              <td>Week {getWeekNumber(record.attended_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* ---------------- Progress History (COMPARE) ---------------- */}
          <Tab eventKey="progress" title={<><FaChartLine className="me-1" /> Progress</>}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-primary mb-0">Progress Timeline</h6>
                  <Badge bg="info">{progressCount} logs</Badge>
                </div>

                {loadingProgressHistory ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : progressHistory.length === 0 ? (
                  <Alert variant="info" className="mb-0">
                    No progress logs available yet.
                  </Alert>
                ) : (
                  <>
                    {/* Latest “card” */}
                    <div className="progress-timeline">
                      <div className="timeline-item">
                        <div className="timeline-marker bg-primary"></div>
                        <div className="timeline-content">
                          <div className="d-flex justify-content-between">
                            <strong>Latest</strong>
                            <small className="text-muted">{toYMD(progressHistory[0].log_date)}</small>
                          </div>
                          <div className="mt-2">
                            <Row className="g-2">
                              <Col xs={6}>
                                <div className="text-center p-2 bg-light rounded">
                                  <GiWeightScale className="h4 text-primary mb-2" />
                                  <div className="fw-bold">{progressHistory[0].weight_kg ?? "N/A"} kg</div>
                                  <small className="text-muted">Weight</small>
                                </div>
                              </Col>
                              <Col xs={6}>
                                <div className="text-center p-2 bg-light rounded">
                                  <FaFire className="h4 text-warning mb-2" />
                                  <div className="fw-bold">{progressHistory[0].calories ?? "N/A"} cal</div>
                                  <small className="text-muted">Calories</small>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Full history table (THIS is what your doctor asked for: see all times they filled progress) */}
                    <div className="mt-3" style={{ maxHeight: "320px", overflowY: "auto" }}>
                      <Table hover responsive size="sm" className="mb-0">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Weight</th>
                            <th>Calories</th>
                            <th>Protein</th>
                            <th>Steps</th>
                            <th>Water</th>
                            <th>Sleep</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {progressHistory.map((p, idx) => (
                            <tr key={idx}>
                              <td>{toYMD(p.log_date)}</td>
                              <td>{p.weight_kg ?? "—"}</td>
                              <td>{p.calories ?? "—"}</td>
                              <td>{p.protein_g ?? "—"}</td>
                              <td>{p.steps ?? "—"}</td>
                              <td>{p.water_liters ?? "—"}</td>
                              <td>{p.sleep_hours ?? "—"}</td>
                              <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {p.notes ?? ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {/* Mini compare latest vs previous */}
                    {latest && prev && (
                      <Alert variant="light" className="mt-3 mb-0 border">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>Compare last 2 logs:</strong>{" "}
                            <span className="text-muted">
                              {toYMD(prev.log_date)} → {toYMD(latest.log_date)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          <span>
                            Weight: <TrendBadge value={weightDiff} goodWhenDown />
                          </span>
                          <span>
                            Steps: <TrendBadge value={stepsDiff} />
                          </span>
                          <span>
                            Sleep: <TrendBadge value={sleepDiff} />
                          </span>
                          <span>
                            Calories: <TrendBadge value={calDiff} />
                          </span>
                        </div>
                      </Alert>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
}

/* ---------------- Main Page ---------------- */
export default function GymAttendanceTab() {
  const [date, setDate] = useState(toYMD(new Date()));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedMember, setSelectedMember] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [progressData, setProgressData] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  const [stats, setStats] = useState({ total: 0, today: 0, active: 0 });

  const loadAttendanceForDate = async () => {
    setLoading(true);
    setSelectedMember(null);
    setProgressData(null);

    try {
      const res = await axios.get(`${API}/attendance/today`, { params: { date } });
      const data = res.data?.rows || [];
      setRows(data);

      // stats (for selected date, not only real "today")
      setStats({
        total: data.length,
        today: data.length,
        active: data.filter((r) => r.status === "Active").length,
      });
    } catch (e) {
      console.error("Failed to load attendance:", e);
      setRows([]);
      setStats({ total: 0, today: 0, active: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadProgressForMemberOnSelectedDate = async (customerId) => {
    setLoadingProgress(true);
    setProgressData(null);
    try {
      const res = await axios.get(`${API}/progress/logs/customer/${customerId}`, {
        params: { from: date, to: date },
      });
      const latest = res.data?.logs?.[0] || null; // should be the log for that date if exists
      setProgressData(latest);
    } catch (e) {
      console.error("Failed to load progress:", e);
      setProgressData(null);
    } finally {
      setLoadingProgress(false);
    }
  };

  const markAttendance = async (customerId) => {
    try {
      const res = await axios.post(`${API}/attendance/checkin`, { customer_id: customerId });
      if (res.data.ok) {
        alert(res.data.already ? "Member already attended today!" : "Attendance marked successfully!");
        loadAttendanceForDate();
      }
    } catch (error) {
      alert("Failed to mark attendance: " + (error.response?.data?.error || error.message));
    }
  };

  const handleMemberSelect = async (member) => {
    setSelectedMember(member);
    setShowModal(true);
    await loadProgressForMemberOnSelectedDate(member.customer_id);
  };

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        (r.full_name || "").toLowerCase().includes(term) ||
        (r.phone || "").toLowerCase().includes(term) ||
        String(r.customer_id || "").includes(term)
    );
  }, [rows, searchTerm]);


  // -------------------------------
  // AI Analysis + PDF report states
  // -------------------------------
  const [activeMainTab, setActiveMainTab] = useState("attendance");
  const [aiFrom, setAiFrom] = useState("");
  const [aiTo, setAiTo] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState(null);

  // set default AI range (last 28 days) once
  useEffect(() => {
    if (aiFrom || aiTo) return;
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const from = new Date(today.getTime() - 28 * 86400000).toISOString().slice(0, 10);
    setAiFrom(from);
    setAiTo(to);
  }, []);

  useEffect(() => {
    loadAttendanceForDate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const StatCard = ({ title, value, icon, color, subtext }) => (
    <Card className={`stat-card border-0 bg-gradient-${color}`}>
      <Card.Body className="text-white">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">{title}</h6>
            <h2 className="fw-bold mb-0">{value}</h2>
            {subtext && <small className="opacity-75">{subtext}</small>}
          </div>
          <div className="stat-icon">{icon}</div>
        </div>
      </Card.Body>
    </Card>
  );


  const runAiAnalyze = async () => {
    try {
      setAiError("");
      setAiLoading(true);
      setAiResult(null);

      const r = await axios.get(`${API}/ai/analyze`, {
        params: { from: aiFrom, to: aiTo },
      });

      if (!r.data?.ok) {
        throw new Error(r.data?.error || "Failed to analyze");
      }

      setAiResult(r.data);
    } catch (e) {
      setAiError(e?.response?.data?.error || e?.message || "Failed to analyze");
    } finally {
      setAiLoading(false);
    }
  };

  const downloadAiPdf = async () => {
    try {
      setAiError("");
      const r = await axios.get(`${API}/ai/report`, {
        params: { from: aiFrom, to: aiTo },
        responseType: "blob",
      });

      const blob = new Blob([r.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gym_report_${aiFrom}_to_${aiTo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setAiError(e?.response?.data?.error || e?.message || "Failed to download PDF");
    }
  };

  const buildQuickChartUrl = (chartConfig) => {
    try {
      return "https://quickchart.io/chart?c=" + encodeURIComponent(JSON.stringify(chartConfig));
    } catch {
      return "";
    }
  };

  const aiCharts = (() => {
    const members = aiResult?.dataset?.members || [];
    if (!Array.isArray(members) || members.length === 0) return null;

    const top = [...members]
      .filter(x => x && (x.attendance_total != null))
      .sort((a, b) => (b.attendance_total || 0) - (a.attendance_total || 0))
      .slice(0, 10);

    const attendanceTop10Url = buildQuickChartUrl({
      type: "bar",
      data: {
        labels: top.map(x => x.full_name || String(x.member_id || x.customer_id || "")),
        datasets: [{ label: "Attendance", data: top.map(x => Number(x.attendance_total || 0)) }],
      },
      options: { plugins: { legend: { display: false } } },
    });

    const loss = [...members]
      .filter(x => Number.isFinite(Number(x.weight_change_kg)))
      .sort((a, b) => Number(a.weight_change_kg) - Number(b.weight_change_kg))
      .slice(0, 10);

    const weightChangeUrl = loss.length ? buildQuickChartUrl({
      type: "bar",
      data: {
        labels: loss.map(x => x.full_name || String(x.member_id || x.customer_id || "")),
        datasets: [{ label: "Weight Change (kg)", data: loss.map(x => Number(x.weight_change_kg)) }],
      },
      options: { plugins: { legend: { display: false } } },
    }) : "";

    return { attendanceTop10Url, weightChangeUrl };
  })();

  const renderAiSummary = (result) => {
    const a = result?.analysis;
    const r = result?.dataset?.range;
    if (!a) return "No analysis returned.";

    const lines = [];
    if (r?.from && r?.to) lines.push(`Range: ${r.from} → ${r.to}`);
    if (a.summary?.overall_attendance_rate_avg != null) {
      lines.push(`Avg attendance rate: ${a.summary.overall_attendance_rate_avg}%`);
    }
    if (a.summary?.overall_notes) lines.push(a.summary.overall_notes);
    if (Array.isArray(a.summary?.key_trends) && a.summary.key_trends.length) {
      lines.push("");
      lines.push("Key trends:");
      a.summary.key_trends.forEach((t) => lines.push(`• ${t}`));
    }
    return lines.join("\n");
  };

  return (
    <div className="gym-attendance-container">
      <style>{`
        .gym-attendance-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          padding: 20px;
        }

        .stat-card {
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-5px); }

        .bg-gradient-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .bg-gradient-success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .bg-gradient-warning { background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); }

        .stat-icon { font-size: 2.5rem; opacity: 0.8; }

        .attendance-card {
          border-radius: 12px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          margin-bottom: 15px;
        }
        .attendance-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.15);
          border-color: #667eea;
        }
        .attendance-card.selected {
          border-color: #667eea;
          background-color: rgba(102, 126, 234, 0.05);
        }
        .attendance-card.today-card { border-left: 4px solid #38ef7d; }

        .attendance-badge {
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 0.8rem;
        }

        .progress-stat {
          background: white;
          padding: 12px;
          border-radius: 10px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          border-left: 4px solid;
        }
        .stat-icon { font-size: 1.5rem; }
        .stat-value { font-weight: bold; font-size: 1.1rem; }
        .stat-label { font-size: 0.8rem; color: #666; }

        .progress-timeline { position: relative; padding-left: 30px; }
        .timeline-item { position: relative; margin-bottom: 20px; }
        .timeline-marker {
          position: absolute;
          left: -30px;
          top: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 3px;
        }
        .timeline-content {
          background: white;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .floating-action-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          z-index: 1000;
          transition: all 0.3s ease;
        }
        .floating-action-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }

        .attendance-grid {
          max-height: calc(100vh - 300px);
          overflow-y: auto;
          padding-right: 10px;
        }
        .attendance-grid::-webkit-scrollbar { width: 6px; }
        .attendance-grid::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .attendance-grid::-webkit-scrollbar-thumb { background: #667eea; border-radius: 10px; }

        .week-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          padding: 10px 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        .week-indicator .current-week {
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
          margin: 0 10px;
        }
      `}</style>

      <Tabs
        activeKey={activeMainTab}
        onSelect={(k) => k && setActiveMainTab(k)}
        className="mb-3"
        justify
      >
        <Tab eventKey="attendance" title="Attendance">

      {/* Floating Action Button */}
      <Button className="floating-action-btn" onClick={loadAttendanceForDate} title="Refresh Attendance">
        <FaRunning />
      </Button>

      {/* Header with Stats */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <StatCard title="Selected Date" value={stats.today} icon={<FaUsers />} color="primary" subtext="Members attended" />
        </Col>
        <Col md={4}>
          <StatCard title="Active Plans" value={stats.active} icon={<FaDumbbell />} color="success" subtext="Active subscriptions" />
        </Col>
        <Col md={4}>
          <StatCard title="Records Loaded" value={stats.total} icon={<FaCalendarAlt />} color="warning" subtext="For this date" />
        </Col>
      </Row>

      {/* Week Indicator */}
      <div className="week-indicator">
        <FaCalendarWeek className="me-2 text-primary" />
        <span>Week</span>
        <span className="current-week">{getWeekNumber(date)}</span>
        <span>• {getDayOfWeek(date)}</span>
      </div>

      <Row className="g-4">
        {/* Left Column */}
        <Col lg={3}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h6 className="fw-bold text-primary mb-3">
                <FaCalendarCheck className="me-2" />
                Date Filter
              </h6>
              <Form.Group className="mb-3">
                <Form.Label>Select Date</Form.Label>
                <Form.Control
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="border-primary"
                />
              </Form.Group>

              <Button variant="primary" className="w-100 mb-3" onClick={loadAttendanceForDate} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FaRunning className="me-2" />
                    Load Attendance
                  </>
                )}
              </Button>

              <Form.Group>
                <Form.Label>
                  <FaUsers className="me-1" />
                  Search Members
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Name, phone, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-primary"
                />
              </Form.Group>

              {filteredRows.length > 0 && (
                <div className="mt-3">
                  <small className="text-muted">
                    Showing {filteredRows.length} of {rows.length} members
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h6 className="fw-bold text-primary mb-3">
                <FaBolt className="me-2" />
                Quick Actions
              </h6>

              <Button
                variant="outline-success"
                className="w-100 mb-2"
                onClick={() => {
                  if (selectedMember) markAttendance(selectedMember.customer_id);
                  else alert("Please select a member first!");
                }}
              >
                <FaUserCheck className="me-2" />
                Mark Attendance
              </Button>

              <Button
                variant="outline-primary"
                className="w-100"
                onClick={() => {
                  const today = new Date();
                  setDate(toYMD(today));
                  // IMPORTANT: load AFTER date change (use next tick)
                  setTimeout(loadAttendanceForDate, 0);
                }}
              >
                <FaCalendarDay className="me-2" />
                Today's View
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column */}
        <Col lg={9}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-primary mb-0">
                  <FaDumbbell className="me-2" />
                  Attendance ({filteredRows.length})
                </h5>
                <div className="d-flex gap-2">
                  <Badge bg="success" className="px-3 py-2">
                    <FaClock className="me-1" />
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Badge>
                  <Badge bg="info" className="px-3 py-2">
                    Week {getWeekNumber(date)}
                  </Badge>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" size="lg" />
                  <p className="mt-3 text-muted">Loading attendance data...</p>
                </div>
              ) : filteredRows.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <FaCalendarCheck className="h2 mb-3" />
                  <h5>No attendance records for this date</h5>
                  <p className="mb-0">Try selecting a different date or check back later.</p>
                </Alert>
              ) : (
                <div className="attendance-grid">
                  <Row>
                    {filteredRows.map((attendance) => (
                      <Col md={6} lg={4} key={attendance.attendance_id}>
                        <AttendanceCard
                          attendance={attendance}
                          onClick={() => handleMemberSelect(attendance)}
                          isSelected={selectedMember?.attendance_id === attendance.attendance_id}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Bottom Stats */}
          {filteredRows.length > 0 && (
            <Row className="mt-4 g-3">
              <Col md={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <FaClock className="h3 text-primary mb-2" />
                    <h4 className="fw-bold">{formatTime(filteredRows[filteredRows.length - 1]?.attended_at) || "N/A"}</h4>
                    <small className="text-muted">First Check-in</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <FaTrophy className="h3 text-warning mb-2" />
                    <h4 className="fw-bold">{filteredRows.filter((r) => r.status === "Active").length}</h4>
                    <small className="text-muted">Active Members</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <FaFire className="h3 text-danger mb-2" />
                    <h4 className="fw-bold">{100}%</h4>
                    <small className="text-muted">Loaded Rate</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Col>
      </Row>

        </Tab>

        <Tab eventKey="ai" title="AI Analysis">
          <Card className="shadow-sm">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <Form.Label>From</Form.Label>
                  <Form.Control type="date" value={aiFrom} onChange={(e) => setAiFrom(e.target.value)} />
                </Col>
                <Col md={4}>
                  <Form.Label>To</Form.Label>
                  <Form.Control type="date" value={aiTo} onChange={(e) => setAiTo(e.target.value)} />
                </Col>
                <Col md={4} className="d-flex gap-2">
                  <Button variant="primary" onClick={runAiAnalyze} disabled={aiLoading || !aiFrom || !aiTo}>
                    {aiLoading ? "Analyzing..." : "Run Analysis"}
                  </Button>
                  <Button variant="outline-success" onClick={downloadAiPdf} disabled={aiLoading || !aiFrom || !aiTo}>
                    Download PDF
                  </Button>
                </Col>
              </Row>

              {aiError ? <Alert className="mt-3" variant="danger">{aiError}</Alert> : null}

              {aiResult ? (
                <div className="mt-4">
                  <Row className="g-3">
                    <Col lg={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <Card.Title className="mb-2">Summary</Card.Title>
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {renderAiSummary(aiResult)}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col lg={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <Card.Title className="mb-2">Charts</Card.Title>
                          {aiCharts?.attendanceTop10Url ? (
                            <div className="mb-3">
                              <div className="small text-muted mb-1">Top 10 Attendance</div>
                              <img alt="Top attendance chart" src={aiCharts.attendanceTop10Url} style={{ width: "100%", borderRadius: 8 }} />
                            </div>
                          ) : null}
                          {aiCharts?.weightChangeUrl ? (
                            <div>
                              <div className="small text-muted mb-1">Weight Change (Top Loss)</div>
                              <img alt="Weight change chart" src={aiCharts.weightChangeUrl} style={{ width: "100%", borderRadius: 8 }} />
                            </div>
                          ) : null}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Row className="g-3 mt-1">
                    <Col lg={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <Card.Title className="mb-2">Top Improvers</Card.Title>
                          <ul className="mb-0">
                            {(aiResult.analysis?.top_improvers || []).map((x, i) => (
                              <li key={i}><b>{x.full_name || x.member_id}</b>: {x.reason}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col lg={6}>
                      <Card className="h-100">
                        <Card.Body>
                          <Card.Title className="mb-2">At Risk</Card.Title>
                          <ul className="mb-0">
                            {(aiResult.analysis?.at_risk || []).map((x, i) => (
                              <li key={i}><b>{x.full_name || x.member_id}</b>: {x.reason}</li>
                            ))}
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Card className="mt-3">
                    <Card.Body>
                      <Card.Title className="mb-2">Member Insights</Card.Title>
                      <Table responsive bordered hover size="sm" className="mb-0">
                        <thead>
                          <tr>
                            <th>Member</th>
                            <th>Attendance</th>
                            <th>Progress</th>
                            <th>Next Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(aiResult.analysis?.member_insights || []).map((m, i) => (
                            <tr key={i}>
                              <td>{m.full_name || m.member_id}</td>
                              <td>{m.attendance}</td>
                              <td>{m.progress}</td>
                              <td>{m.next_action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>

                  <Card className="mt-3">
                    <Card.Body>
                      <Card.Title className="mb-2">Recommendations</Card.Title>
                      <ol className="mb-0">
                        {(aiResult.analysis?.recommendations || []).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ol>
                    </Card.Body>
                  </Card>
                </div>
              ) : (
                <div className="text-muted mt-4">Run analysis to see insights and charts.</div>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Member Detail Modal */}
      <MemberDetailModal
        show={showModal}
        onHide={() => setShowModal(false)}
        member={selectedMember}
        selectedDate={date}
        attendance={
          selectedMember
            ? {
                already: rows.some(
                  (r) =>
                    r.customer_id === selectedMember.customer_id &&
                    toYMD(new Date(r.attended_at)) === toYMD(new Date())
                ),
              }
            : null
        }
        progressToday={loadingProgress ? null : progressData}
        onMarkAttendance={() => {
          if (selectedMember) {
            markAttendance(selectedMember.customer_id);
            setShowModal(false);
          }
        }}
      />
    </div>
  );
}