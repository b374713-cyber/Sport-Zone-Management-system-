// // Front_end/snp/src/components/gym/GymDashboard.js
// import React, { useState } from "react";
// import { Card, Tabs, Tab, Badge, Button, Row, Col } from "react-bootstrap";
// import GymSubscriptions from "./GymSubscriptions";
// import GymDirectory from "./GymDirectory";
// import GymMembersBoard from "./GymMembersBoard";
// import AIGymPlanModal from "./AIGymPlanModal";
// import GymPlansModal from "./GymPlansModal";
// import ProgressRemindersTab from "./ProgressRemindersTab";
// import GymAttendanceTab from "./tabs/GymAttendanceTab";

// import { 
//   FaChartLine, 
//   FaBullseye, 
//   FaBell, 
//   FaRunning, 
//   FaWeight, 
//   FaHeartbeat,
//   FaFire,
//   FaTrophy,
//   FaCalendarCheck
// } from "react-icons/fa";

// const theme = {
//   headerGradient: "linear-gradient(90deg, #3b2a88 0%, #146b57 100%)",
//   progressGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
//   chipBg: "#efe7ff",
//   chipText: "#3b2a88",
//   tabActive: "#3b2a88",
//   tabInactive: "#e9ecef",
//   pageBg: "#f4f5f7",
// };

// const GymDashboard = () => {
//   const [activeKey, setActiveKey] = useState("subscriptions");

//   const [showAI, setShowAI] = useState(false);
//   const [showPlans, setShowPlans] = useState(false);

//   // Progress tab analytics (mock data)
//   const progressStats = {
//     totalMembers: 124,
//     activeTrackers: 89,
//     avgBMI: 24.2,
//     weightLossTotal: 245, // kg
//     completedGoals: 312,
//     pendingReminders: 18,
//   };

//   return (
//     <div style={{ background: theme.pageBg, minHeight: "100%", padding: "12px" }}>
//       <Card className="border-0 shadow-sm" style={{ borderRadius: 16 }}>
//         {/* Header */}
//         <Card.Header
//           style={{
//             background: theme.headerGradient,
//             color: "#fff",
//             borderTopLeftRadius: 16,
//             borderTopRightRadius: 16,
//           }}
//         >
//           <div className="d-flex justify-content-between align-items-center">
//             <h4 className="mb-0">Gym Management Dashboard</h4>
//             <Badge bg="light" text="dark">
//               Admin View
//             </Badge>
//           </div>
//         </Card.Header>

//         {/* Tabs */}
//         <Card.Body>
//           <style>{`
//             .gym-tabs .nav-link {
//               font-weight: 600;
//               border: 0 !important;
//               margin-right: 6px;
//               border-radius: 999px !important;
//               padding: 8px 14px;
//             }
//             .gym-tabs .nav-link.active {
//               background: ${theme.tabActive} !important;
//               color: #fff !important;
//             }
//             .gym-tabs .nav-link:not(.active) {
//               background: ${theme.tabInactive} !important;
//               color: #2c2f34 !important;
//             }
//             .gym-chip {
//               background: ${theme.chipBg};
//               color: ${theme.chipText};
//               border-radius: 999px;
//               padding: 6px 12px;
//               font-weight: 700;
//             }
//             .gym-content {
//               background: #fff;
//               border-radius: 12px;
//               padding: 18px;
//               box-shadow: 0 6px 16px rgba(0,0,0,0.06);
//               position: relative;
//               min-height: 500px;
//             }
//             .sub-actions {
//               position: absolute;
//               right: 18px;
//               top: 18px;
//               display: flex;
//               gap: 10px;
//               z-index: 10;
//             }
//             .sub-fab {
//               border: none;
//               border-radius: 999px;
//               padding: 8px 14px;
//               font-weight: 700;
//               color: white;
//               cursor: pointer;
//               box-shadow: 0 8px 20px rgba(0,0,0,0.18);
//               display: flex;
//               align-items: center;
//               gap: 8px;
//               font-size: 14px;
//             }
//             .sub-fab.ai {
//               background: linear-gradient(90deg, #ff0000ff 0%, #ffea00ff 100%);
//             }
//             .sub-fab.plans {
//               background: linear-gradient(90deg, #0400ffff 0%, #fb2affff 100%);
//             }
            
//             /* Progress Tab Styles */
//             .progress-header {
//               background: ${theme.progressGradient};
//               color: white;
//               padding: 20px;
//               border-radius: 12px;
//               margin-bottom: 25px;
//             }
//             .stat-card {
//               background: white;
//               border-radius: 12px;
//               padding: 20px;
//               box-shadow: 0 4px 12px rgba(0,0,0,0.08);
//               transition: transform 0.3s ease;
//               height: 100%;
//               border-top: 4px solid;
//             }
//             .stat-card:hover {
//               transform: translateY(-5px);
//               box-shadow: 0 8px 24px rgba(0,0,0,0.12);
//             }
//             .stat-icon {
//               width: 50px;
//               height: 50px;
//               border-radius: 12px;
//               display: flex;
//               align-items: center;
//               justify-content: center;
//               margin-bottom: 15px;
//             }
//             .stat-value {
//               font-size: 28px;
//               font-weight: 900;
//               margin-bottom: 5px;
//             }
//             .stat-label {
//               font-size: 14px;
//               color: #666;
//               font-weight: 600;
//             }
//             .tab-header {
//               display: flex;
//               justify-content: space-between;
//               align-items: center;
//               margin-bottom: 25px;
//             }
//             .quick-actions {
//               display: flex;
//               gap: 10px;
//             }
//             .quick-action-btn {
//               border: none;
//               border-radius: 8px;
//               padding: 8px 16px;
//               font-weight: 600;
//               display: flex;
//               align-items: center;
//               gap: 8px;
//               transition: all 0.3s ease;
//             }
//             .quick-action-btn:hover {
//               transform: scale(1.05);
//             }
//           `}</style>

//           <div className="d-flex justify-content-between align-items-center mb-3">
//             <div className="gym-chip">Start here: choose a tab</div>
//           </div>

//           <Tabs
//             id="gym-tabs"
//             activeKey={activeKey}
//             onSelect={(k) => setActiveKey(k)}
//             className="gym-tabs mb-3"
//           >
//             {/* Subscriptions */}
//             <Tab eventKey="subscriptions" title="🏅 Subscriptions">
//               <div className="gym-content">
//                 <div className="sub-actions">
//                   {/* <button
//                     className="sub-fab plans"
//                     onClick={() => setShowPlans(true)}
//                     title="View Gym Plans"
//                   >
//                     📄 Gym Plans
//                   </button>

//                   <button
//                     className="sub-fab ai"
//                     onClick={() => setShowAI(true)}
//                     title="Generate AI Plan"
//                   >
//                     🤖 AI Plan
//                   </button> */}
//                 </div>

//                 <GymSubscriptions />
//               </div>
//             </Tab>

//             {/* Coaches */}
//             <Tab eventKey="coaches" title="👨‍🏫 Coaches">
//               <div className="gym-content">
//                 <GymDirectory />
//               </div>
//             </Tab>

//             {/* Members */}
//             <Tab eventKey="members" title="🧍 Members">
//               <div className="gym-content">
//                 <GymMembersBoard />
//               </div>
//             </Tab>

//             {/* Attendance */}
//             <Tab eventKey="attendance" title="📅 Attendance">
//               <div className="gym-content">
//                 <h5 className="mb-2">Attendance Tracker</h5>
             
//   <GymAttendanceTab />


//               </div>
//             </Tab>

//             {/* Progress - COMPLETELY REDESIGNED */}
//             <Tab eventKey="progress" title="💪 Progress">
//               <div className="gym-content">
//                 {/* Progress Header with Stats */}
//                 <div className="progress-header">
//                   <Row className="align-items-center">
//                     <Col md={8}>
//                       <h2 className="mb-2">
//                         <FaChartLine className="me-2" />
//                         Progress & Reminders Dashboard
//                       </h2>
//                       <p className="mb-0 opacity-90">
//                         Track member progress, set goals, and manage automated reminders
//                       </p>
//                     </Col>
//                     <Col md={4} className="text-end">
//                       <div className="d-inline-block bg-white text-dark p-3 rounded">
//                         <div className="d-flex align-items-center">
//                           <FaFire className="text-danger me-2" size={24} />
//                           <div>
//                             <div className="fw-bold fs-4">{progressStats.activeTrackers}</div>
//                             <div className="text-muted small">Active Trackers</div>
//                           </div>
//                         </div>
//                       </div>
//                     </Col>
//                   </Row>
//                 </div>

//                 {/* Quick Stats Row */}
//                 <Row className="g-3 mb-4">
//                   <Col md={3}>
//                     <div className="stat-card" style={{ borderTopColor: "#667eea" }}>
//                       <div className="stat-icon" style={{ background: "rgba(102, 126, 234, 0.1)" }}>
//                         <FaWeight style={{ color: "#667eea", fontSize: "24px" }} />
//                       </div>
//                       <div className="stat-value">{progressStats.totalMembers}</div>
//                       <div className="stat-label">Total Members</div>
//                     </div>
//                   </Col>
//                   <Col md={3}>
//                     <div className="stat-card" style={{ borderTopColor: "#764ba2" }}>
//                       <div className="stat-icon" style={{ background: "rgba(118, 75, 162, 0.1)" }}>
//                         <FaHeartbeat style={{ color: "#764ba2", fontSize: "24px" }} />
//                       </div>
//                       <div className="stat-value">{progressStats.avgBMI}</div>
//                       <div className="stat-label">Average BMI</div>
//                     </div>
//                   </Col>
//                   <Col md={3}>
//                     <div className="stat-card" style={{ borderTopColor: "#f56565" }}>
//                       <div className="stat-icon" style={{ background: "rgba(245, 101, 101, 0.1)" }}>
//                         <FaRunning style={{ color: "#f56565", fontSize: "24px" }} />
//                       </div>
//                       <div className="stat-value">{progressStats.weightLossTotal}kg</div>
//                       <div className="stat-label">Total Weight Loss</div>
//                     </div>
//                   </Col>
//                   <Col md={3}>
//                     <div className="stat-card" style={{ borderTopColor: "#48bb78" }}>
//                       <div className="stat-icon" style={{ background: "rgba(72, 187, 120, 0.1)" }}>
//                         <FaTrophy style={{ color: "#48bb78", fontSize: "24px" }} />
//                       </div>
//                       <div className="stat-value">{progressStats.completedGoals}</div>
//                       <div className="stat-label">Goals Completed</div>
//                     </div>
//                   </Col>
//                 </Row>

//                 {/* Quick Actions */}
//                 <div className="tab-header">
//                   <h4 className="mb-0">
//                     <FaBell className="me-2 text-warning" />
//                     Progress Reminders & Tracking
//                   </h4>
//                   <div className="quick-actions">
//                     <button 
//                       className="quick-action-btn"
//                       style={{ background: "#667eea", color: "white" }}
//                       onClick={() => {/* Add export functionality */}}
//                     >
//                       <FaCalendarCheck /> Export Reports
//                     </button>
//                     <button 
//                       className="quick-action-btn"
//                       style={{ background: "#48bb78", color: "white" }}
//                       onClick={() => {/* Add bulk reminder functionality */}}
//                     >
//                       <FaBell /> Send Bulk Reminders
//                     </button>
//                   </div>
//                 </div>

//                 {/* Main Progress Reminders Component */}
//                 <div className="mb-4">
//                   <ProgressRemindersTab />
//                 </div>

//                 {/* Additional Progress Features */}
//                 <Row className="g-3 mt-4">
//                   <Col md={6}>
//                     <div className="stat-card" style={{ borderTopColor: "#ed8936" }}>
//                       <div className="d-flex justify-content-between align-items-center">
//                         <div>
//                           <h5 className="fw-bold">Weekly Progress Reports</h5>
//                           <p className="text-muted mb-2">
//                             Generate weekly progress reports for all members
//                           </p>
//                         </div>
//                         <button 
//                           className="btn"
//                           style={{ background: "#ed8936", color: "white" }}
//                         >
//                           Generate
//                         </button>
//                       </div>
//                     </div>
//                   </Col>
//                   <Col md={6}>
//                     <div className="stat-card" style={{ borderTopColor: "#9f7aea" }}>
//                       <div className="d-flex justify-content-between align-items-center">
//                         <div>
//                           <h5 className="fw-bold">Goal Completion Rate</h5>
//                           <p className="text-muted mb-2">
//                             Current rate: <strong>78%</strong> • Target: 85%
//                           </p>
//                           <div className="progress" style={{ height: "8px" }}>
//                             <div 
//                               className="progress-bar" 
//                               style={{ 
//                                 width: "78%", 
//                                 background: "linear-gradient(90deg, #9f7aea, #667eea)" 
//                               }}
//                             ></div>
//                           </div>
//                         </div>
//                         <div className="text-end">
//                           <div className="fw-bold fs-3">78%</div>
//                           <div className="text-muted small">Completion</div>
//                         </div>
//                       </div>
//                     </div>
//                   </Col>
//                 </Row>

//                 {/* Pending Actions */}
//                 <div className="mt-4 p-4 rounded" style={{ background: "#fff8e1", border: "1px solid #ffd54f" }}>
//                   <div className="d-flex align-items-center mb-2">
//                     <FaBell className="me-2 text-warning" />
//                     <h5 className="mb-0">Pending Actions</h5>
//                   </div>
//                   <Row>
//                     <Col md={4}>
//                       <div className="d-flex align-items-center">
//                         <div className="me-3">
//                           <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
//                             {progressStats.pendingReminders}
//                           </div>
//                         </div>
//                         <div>
//                           <div className="fw-bold">Reminders to Send</div>
//                           <div className="text-muted small">Review and send pending reminders</div>
//                         </div>
//                       </div>
//                     </Col>
//                     <Col md={4}>
//                       <div className="d-flex align-items-center">
//                         <div className="me-3">
//                           <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
//                             7
//                           </div>
//                         </div>
//                         <div>
//                           <div className="fw-bold">Progress Reviews Due</div>
//                           <div className="text-muted small">Members needing follow-up</div>
//                         </div>
//                       </div>
//                     </Col>
//                     <Col md={4}>
//                       <div className="d-flex align-items-center">
//                         <div className="me-3">
//                           <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
//                             24
//                           </div>
//                         </div>
//                         <div>
//                           <div className="fw-bold">Goals Achieved This Week</div>
//                           <div className="text-muted small">Celebrate member successes</div>
//                         </div>
//                       </div>
//                     </Col>
//                   </Row>
//                 </div>

//                 {/* Footer Note */}
//                 <div className="mt-4 text-center">
//                   <p className="text-muted small">
//                     <FaBullseye className="me-1" />
//                     Pro tip: Set up automated reminder templates to save time and increase member engagement
//                   </p>
//                 </div>
//               </div>
//             </Tab>
//           </Tabs>
//         </Card.Body>
//       </Card>

//       {/* Modals */}
//       <AIGymPlanModal show={showAI} onHide={() => setShowAI(false)} />
//       <GymPlansModal show={showPlans} onHide={() => setShowPlans(false)} />
//     </div>
//   );
// };

// export default GymDashboard;
// Front_end/snp/src/components/gym/GymDashboard.js
import React, { useState } from "react";
import { Card, Tabs, Tab, Badge, Button, Row, Col } from "react-bootstrap";
import GymSubscriptions from "./GymSubscriptions";
import GymDirectory from "./GymDirectory";
import GymMembersBoard from "./GymMembersBoard";
import AIGymPlanModal from "./AIGymPlanModal";
import GymPlansModal from "./GymPlansModal";
import ProgressRemindersTab from "./ProgressRemindersTab";
import GymAttendanceTab from "./tabs/GymAttendanceTab";

import { 
  FaChartLine, 
  FaBullseye, 
  FaBell, 
  FaRunning, 
  FaWeight, 
  FaHeartbeat,
  FaFire,
  FaTrophy,
  FaCalendarCheck,
  FaSync
} from "react-icons/fa";

const theme = {
  headerGradient: "linear-gradient(90deg, #3b2a88 0%, #146b57 100%)",
  progressGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  chipBg: "#efe7ff",
  chipText: "#3b2a88",
  tabActive: "#3b2a88",
  tabInactive: "#e9ecef",
  pageBg: "#f4f5f7",
};

const GymDashboard = () => {
  const [activeKey, setActiveKey] = useState("subscriptions");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Key to force refresh children

  const [showAI, setShowAI] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  // Progress tab analytics (mock data)
  const progressStats = {
    totalMembers: 124,
    activeTrackers: 89,
    avgBMI: 24.2,
    weightLossTotal: 245, // kg
    completedGoals: 312,
    pendingReminders: 18,
  };

  // Refresh function
  const handleRefresh = () => {
    setRefreshing(true);
    
    // Increment refresh key to force child components to refresh
    setRefreshKey(prev => prev + 1);
    
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <div style={{ background: theme.pageBg, minHeight: "100%", padding: "12px" }}>
      <Card className="border-0 shadow-sm" style={{ borderRadius: 16 }}>
        {/* Header */}
        <Card.Header
          style={{
            background: theme.headerGradient,
            color: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <h4 className="mb-0 me-3">Gym Management Dashboard</h4>
              <Badge bg="light" text="dark" className="me-3">
                Admin View
              </Badge>
              <Button 
                variant="light" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="d-flex align-items-center"
              >
                <FaSync className={refreshing ? "me-2 spin" : "me-2"} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                .spin {
                  animation: spin 1s linear infinite;
                }
              `}
            </style>
          </div>
        </Card.Header>

        {/* Tabs */}
        <Card.Body>
          <style>{`
            .gym-tabs .nav-link {
              font-weight: 600;
              border: 0 !important;
              margin-right: 6px;
              border-radius: 999px !important;
              padding: 8px 14px;
            }
            .gym-tabs .nav-link.active {
              background: ${theme.tabActive} !important;
              color: #fff !important;
            }
            .gym-tabs .nav-link:not(.active) {
              background: ${theme.tabInactive} !important;
              color: #2c2f34 !important;
            }
            .gym-chip {
              background: ${theme.chipBg};
              color: ${theme.chipText};
              border-radius: 999px;
              padding: 6px 12px;
              font-weight: 700;
            }
            .gym-content {
              background: #fff;
              border-radius: 12px;
              padding: 18px;
              box-shadow: 0 6px 16px rgba(0,0,0,0.06);
              position: relative;
              min-height: 500px;
            }
            .sub-actions {
              position: absolute;
              right: 18px;
              top: 18px;
              display: flex;
              gap: 10px;
              z-index: 10;
            }
            .sub-fab {
              border: none;
              border-radius: 999px;
              padding: 8px 14px;
              font-weight: 700;
              color: white;
              cursor: pointer;
              box-shadow: 0 8px 20px rgba(0,0,0,0.18);
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
            }
            .sub-fab.ai {
              background: linear-gradient(90deg, #ff0000ff 0%, #ffea00ff 100%);
            }
            .sub-fab.plans {
              background: linear-gradient(90deg, #0400ffff 0%, #fb2affff 100%);
            }
            
            /* Progress Tab Styles */
            .progress-header {
              background: ${theme.progressGradient};
              color: white;
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 25px;
            }
            .stat-card {
              background: white;
              border-radius: 12px;
              padding: 20px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
              transition: transform 0.3s ease;
              height: 100%;
              border-top: 4px solid;
            }
            .stat-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            }
            .stat-icon {
              width: 50px;
              height: 50px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 15px;
            }
            .stat-value {
              font-size: 28px;
              font-weight: 900;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
              font-weight: 600;
            }
            .tab-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 25px;
            }
            .quick-actions {
              display: flex;
              gap: 10px;
            }
            .quick-action-btn {
              border: none;
              border-radius: 8px;
              padding: 8px 16px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.3s ease;
            }
            .quick-action-btn:hover {
              transform: scale(1.05);
            }
            .refresh-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(255, 255, 255, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
              border-radius: 12px;
            }
          `}</style>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="gym-chip">Start here: choose a tab</div>
            {refreshing && (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                <small className="text-muted">Refreshing data...</small>
              </div>
            )}
          </div>

          <Tabs
            id="gym-tabs"
            activeKey={activeKey}
            onSelect={(k) => setActiveKey(k)}
            className="gym-tabs mb-3"
          >
            {/* Subscriptions */}
            <Tab eventKey="subscriptions" title="🏅 Subscriptions">
              <div className="gym-content">
                {refreshing && (
                  <div className="refresh-overlay">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                <div className="sub-actions">
                  {/* <button
                    className="sub-fab plans"
                    onClick={() => setShowPlans(true)}
                    title="View Gym Plans"
                  >
                    📄 Gym Plans
                  </button>

                  <button
                    className="sub-fab ai"
                    onClick={() => setShowAI(true)}
                    title="Generate AI Plan"
                  >
                    🤖 AI Plan
                  </button> */}
                </div>
                
                <GymSubscriptions key={`subscriptions-${refreshKey}`} refreshTrigger={refreshKey} />
              </div>
            </Tab>

            {/* Coaches */}
            <Tab eventKey="coaches" title="👨‍🏫 Coaches">
              <div className="gym-content">
                {refreshing && (
                  <div className="refresh-overlay">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                <GymDirectory key={`coaches-${refreshKey}`} refreshTrigger={refreshKey} />
              </div>
            </Tab>

            {/* Members */}
            <Tab eventKey="members" title="🧍 Members">
              <div className="gym-content">
                {refreshing && (
                  <div className="refresh-overlay">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                <GymMembersBoard key={`members-${refreshKey}`} refreshTrigger={refreshKey} />
              </div>
            </Tab>

            {/* Attendance */}
            <Tab eventKey="attendance" title="📅 Attendance">
              <div className="gym-content">
                {refreshing && (
                  <div className="refresh-overlay">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                <h5 className="mb-2">Attendance Tracker</h5>
                <GymAttendanceTab key={`attendance-${refreshKey}`} refreshTrigger={refreshKey} />
              </div>
            </Tab>

            {/* Progress - COMPLETELY REDESIGNED */}
            <Tab eventKey="progress" title="💪 Progress">
              <div className="gym-content">
                {refreshing && (
                  <div className="refresh-overlay">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
                {/* Progress Header with Stats */}
                <div className="progress-header">
                  <Row className="align-items-center">
                    <Col md={8}>
                      <h2 className="mb-2">
                        <FaChartLine className="me-2" />
                        Progress & Reminders Dashboard
                      </h2>
                      <p className="mb-0 opacity-90">
                        Track member progress, set goals, and manage automated reminders
                      </p>
                    </Col>
                    <Col md={4} className="text-end">
                      <div className="d-inline-block bg-white text-dark p-3 rounded">
                        <div className="d-flex align-items-center">
                          <FaFire className="text-danger me-2" size={24} />
                          <div>
                            <div className="fw-bold fs-4">{progressStats.activeTrackers}</div>
                            <div className="text-muted small">Active Trackers</div>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Quick Stats Row */}
                <Row className="g-3 mb-4">
                  <Col md={3}>
                    <div className="stat-card" style={{ borderTopColor: "#667eea" }}>
                      <div className="stat-icon" style={{ background: "rgba(102, 126, 234, 0.1)" }}>
                        <FaWeight style={{ color: "#667eea", fontSize: "24px" }} />
                      </div>
                      <div className="stat-value">{progressStats.totalMembers}</div>
                      <div className="stat-label">Total Members</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="stat-card" style={{ borderTopColor: "#764ba2" }}>
                      <div className="stat-icon" style={{ background: "rgba(118, 75, 162, 0.1)" }}>
                        <FaHeartbeat style={{ color: "#764ba2", fontSize: "24px" }} />
                      </div>
                      <div className="stat-value">{progressStats.avgBMI}</div>
                      <div className="stat-label">Average BMI</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="stat-card" style={{ borderTopColor: "#f56565" }}>
                      <div className="stat-icon" style={{ background: "rgba(245, 101, 101, 0.1)" }}>
                        <FaRunning style={{ color: "#f56565", fontSize: "24px" }} />
                      </div>
                      <div className="stat-value">{progressStats.weightLossTotal}kg</div>
                      <div className="stat-label">Total Weight Loss</div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="stat-card" style={{ borderTopColor: "#48bb78" }}>
                      <div className="stat-icon" style={{ background: "rgba(72, 187, 120, 0.1)" }}>
                        <FaTrophy style={{ color: "#48bb78", fontSize: "24px" }} />
                      </div>
                      <div className="stat-value">{progressStats.completedGoals}</div>
                      <div className="stat-label">Goals Completed</div>
                    </div>
                  </Col>
                </Row>

                {/* Quick Actions */}
                <div className="tab-header">
                  <h4 className="mb-0">
                    <FaBell className="me-2 text-warning" />
                    Progress Reminders & Tracking
                  </h4>
                  <div className="quick-actions">
                    <button 
                      className="quick-action-btn"
                      style={{ background: "#667eea", color: "white" }}
                      onClick={() => {/* Add export functionality */}}
                    >
                      <FaCalendarCheck /> Export Reports
                    </button>
                    <button 
                      className="quick-action-btn"
                      style={{ background: "#48bb78", color: "white" }}
                      onClick={() => {/* Add bulk reminder functionality */}}
                    >
                      <FaBell /> Send Bulk Reminders
                    </button>
                  </div>
                </div>

                {/* Main Progress Reminders Component */}
                <div className="mb-4">
                  <ProgressRemindersTab key={`progress-${refreshKey}`} refreshTrigger={refreshKey} />
                </div>

                {/* Additional Progress Features */}
                <Row className="g-3 mt-4">
                  <Col md={6}>
                    <div className="stat-card" style={{ borderTopColor: "#ed8936" }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="fw-bold">Weekly Progress Reports</h5>
                          <p className="text-muted mb-2">
                            Generate weekly progress reports for all members
                          </p>
                        </div>
                        <button 
                          className="btn"
                          style={{ background: "#ed8936", color: "white" }}
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="stat-card" style={{ borderTopColor: "#9f7aea" }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="fw-bold">Goal Completion Rate</h5>
                          <p className="text-muted mb-2">
                            Current rate: <strong>78%</strong> • Target: 85%
                          </p>
                          <div className="progress" style={{ height: "8px" }}>
                            <div 
                              className="progress-bar" 
                              style={{ 
                                width: "78%", 
                                background: "linear-gradient(90deg, #9f7aea, #667eea)" 
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold fs-3">78%</div>
                          <div className="text-muted small">Completion</div>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Pending Actions */}
                <div className="mt-4 p-4 rounded" style={{ background: "#fff8e1", border: "1px solid #ffd54f" }}>
                  <div className="d-flex align-items-center mb-2">
                    <FaBell className="me-2 text-warning" />
                    <h5 className="mb-0">Pending Actions</h5>
                  </div>
                  <Row>
                    <Col md={4}>
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                            {progressStats.pendingReminders}
                          </div>
                        </div>
                        <div>
                          <div className="fw-bold">Reminders to Send</div>
                          <div className="text-muted small">Review and send pending reminders</div>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                            7
                          </div>
                        </div>
                        <div>
                          <div className="fw-bold">Progress Reviews Due</div>
                          <div className="text-muted small">Members needing follow-up</div>
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                            24
                          </div>
                        </div>
                        <div>
                          <div className="fw-bold">Goals Achieved This Week</div>
                          <div className="text-muted small">Celebrate member successes</div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Footer Note */}
                <div className="mt-4 text-center">
                  <p className="text-muted small">
                    <FaBullseye className="me-1" />
                    Pro tip: Set up automated reminder templates to save time and increase member engagement
                  </p>
                </div>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Modals */}
      <AIGymPlanModal show={showAI} onHide={() => setShowAI(false)} />
      <GymPlansModal show={showPlans} onHide={() => setShowPlans(false)} />
    </div>
  );
};

export default GymDashboard;