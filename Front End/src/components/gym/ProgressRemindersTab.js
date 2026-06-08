// src/components/gym/ProgressRemindersTab.js
import React, { useEffect, useMemo, useState } from "react";
import gymService from "../../services/gymService";
import { Button, Card, Badge, Spinner, Alert, Row, Col } from "react-bootstrap";
import { FaBell, FaUser, FaCalendar, FaPaperPlane, FaSync } from "react-icons/fa";

const DAYS_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_LABEL = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

export default function ProgressRemindersTab() {
  const [subscribers, setSubscribers] = useState([]);
  const [pushTokens, setPushTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    withTokens: 0,
    withoutTokens: 0
  });

  const fetchData = async () => {
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      
      // Fetch subscribers with weekly plans
      console.log("Fetching subscribers...");
      const subsList = await gymService.listSubscribersWithPlans();
      console.log("Subscribers response:", subsList);
      
      // Fetch push tokens
      console.log("Fetching push tokens...");
      const tokensList = await gymService.listPushTokens();
      console.log("Tokens response:", tokensList);
      
      // Merge push token info with subscribers
      const mergedSubscribers = subsList.map(sub => {
        const tokenInfo = tokensList.find(token => token.customer_id === sub.customer_id);
        const hasToken = !!tokenInfo?.expo_push_token;
        
        return {
          ...sub,
          has_push_token: hasToken,
          push_token: tokenInfo?.expo_push_token,
          customer_name: sub.name || `Customer ${sub.customer_id}`
        };
      });
      
      setSubscribers(mergedSubscribers);
      setPushTokens(tokensList);
      
      // Update stats
      const withTokens = mergedSubscribers.filter(s => s.has_push_token).length;
      setStats({
        total: mergedSubscribers.length,
        withTokens: withTokens,
        withoutTokens: mergedSubscribers.length - withTokens
      });
      
      if (mergedSubscribers.length === 0) {
        setError("No subscribers found with weekly plans. Customers need to set up their weekly plan in the mobile app.");
      } else {
        setSuccess(`Found ${mergedSubscribers.length} subscriber(s)`);
      }
      
    } catch (e) {
      console.error("Error fetching data:", e);
      
      // Fallback mock data for testing
      const mockSubscribers = [
        {
          customer_id: 4,
          name: "Bashar Faraj",
          customer_name: "Bashar Faraj",
          email: "bashar@example.com",
          days: ["mon", "tue", "wed", "thu", "fri"],
          plan_created_at: new Date().toISOString(),
          has_push_token: false
        },
        {
          customer_id: 7,
          name: "Ali faraj",
          customer_name: "Ali faraj",
          email: "ali@example.com",
          days: ["sat", "tue", "wed", "fri"],
          plan_created_at: new Date().toISOString(),
          has_push_token: true
        }
      ];
      
      setSubscribers(mockSubscribers);
      setError("Using demo data. Backend connection issue: " + (e.message || e.toString()));
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const normalizeDays = (days) => {
    if (!days) return [];
    
    if (Array.isArray(days)) {
      return days.map(d => {
        const day = String(d).toLowerCase().trim();
        return DAYS_ORDER.includes(day) ? day : '';
      }).filter(d => d);
    }
    
    if (typeof days === "string") {
      try {
        const parsed = JSON.parse(days);
        if (Array.isArray(parsed)) {
          return parsed.map(d => {
            const day = String(d).toLowerCase().trim();
            return DAYS_ORDER.includes(day) ? day : '';
          }).filter(d => d);
        }
      } catch (e) {
        // If it's not JSON, try comma-separated
        return days
          .replace(/[\[\]"\s]/g, '')
          .split(',')
          .map(d => {
            const day = d.toLowerCase().trim();
            return DAYS_ORDER.includes(day) ? day : '';
          })
          .filter(d => d);
      }
    }
    
    return [];
  };

  const sortedSubscribers = useMemo(() => {
    return [...subscribers].sort((a, b) => {
      const nameA = (a.customer_name || "").toLowerCase();
      const nameB = (b.customer_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [subscribers]);

  const sendReminder = async (customer) => {
    try {
      setSendingId(customer.customer_id);
      setError("");
      setSuccess("");
      
      if (!customer.has_push_token) {
        setError(`${customer.customer_name} doesn't have push notifications enabled. They need to open the mobile app first.`);
        setSendingId(null);
        return;
      }

      console.log(`Sending reminder to customer ${customer.customer_id}...`);
      const response = await gymService.sendReminderToCustomer(
        customer.customer_id,
        "Don't forget your gym session today! 💪"
      );

      console.log("Reminder sent successfully:", response);
      setSuccess(`✅ Reminder sent to ${customer.customer_name}!`);
      
    } catch (e) {
      console.error("Send reminder error:", e);
      const errorMsg = e.message || e.toString();
      setError(`❌ Failed to send reminder: ${errorMsg}`);
    } finally {
      setSendingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <div className="mt-3">Loading subscribers...</div>
      </div>
    );
  }

  return (
    <div className="gym-content">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
        <div>
          <h2 style={{ fontWeight: 900, marginBottom: 6, color: "#2c3e50" }}>
            <FaBell className="me-2" />
            Gym Reminders for Subscribers
          </h2>
          <div style={{ color: "#667085", fontWeight: 600 }}>
            View weekly plans + send push reminders to gym subscribers
          </div>
        </div>

        <Button variant="info" onClick={fetchData}>
          <FaSync className="me-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm text-center" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
            <Card.Body>
              <FaUser size={24} className="mb-2" />
              <h3 className="mb-0">{stats.total}</h3>
              <div>Total Subscribers</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm text-center" style={{ background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", color: "white" }}>
            <Card.Body>
              <FaBell size={24} className="mb-2" />
              <h3 className="mb-0">{stats.withTokens}</h3>
              <div>Push Enabled</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm text-center" style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", color: "white" }}>
            <Card.Body>
              <FaCalendar size={24} className="mb-2" />
              <h3 className="mb-0">{stats.withoutTokens}</h3>
              <div>Need Push Setup</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Messages */}
      {error && (
        <Alert variant={error.includes("demo") ? "info" : "warning"} className="mb-4">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      {/* Subscribers List */}
      {sortedSubscribers.length === 0 ? (
        <div className="text-center py-5 border rounded">
          <h5 className="text-muted">No subscribers found</h5>
          <p className="text-muted">
            Customers need to set up their weekly plan in the mobile app first.
          </p>
          <Button variant="outline-primary" onClick={fetchData}>
            Check Again
          </Button>
        </div>
      ) : (
        <div className="row">
          {sortedSubscribers.map((sub) => {
            const days = normalizeDays(sub.days);
            const orderedDays = DAYS_ORDER.filter(d => days.includes(d));
            
            const planDate = sub.plan_created_at 
              ? new Date(sub.plan_created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'Unknown date';

            return (
              <div key={sub.customer_id} className="col-md-6 col-lg-4 mb-4">
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: 12 }}>
                  <Card.Body className="d-flex flex-column">
                    {/* Header with name and status */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div style={{ flex: 1 }}>
                        <div className="d-flex align-items-center">
                          <FaUser className="me-2 text-primary" />
                          <h5 className="mb-0" style={{ fontWeight: 700 }}>
                            {sub.customer_name}
                          </h5>
                        </div>
                        <div className="small text-muted mt-1">
                          ID: {sub.customer_id} • Plan: {planDate}
                        </div>
                        {sub.email && (
                          <div className="small text-muted">{sub.email}</div>
                        )}
                      </div>
                      
                      <Badge 
                        bg={sub.has_push_token ? "success" : "secondary"}
                        className="px-3 py-2"
                        style={{ fontSize: "0.8rem" }}
                      >
                        {sub.has_push_token ? "Push Ready" : "No Token"}
                      </Badge>
                    </div>

                    {/* Weekly Plan Days */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <FaCalendar className="me-2 text-info" />
                        <h6 className="mb-0" style={{ fontWeight: 600 }}>Weekly Plan</h6>
                      </div>
                      
                      <div className="d-flex flex-wrap gap-2">
                        {orderedDays.length === 0 ? (
                          <span className="text-muted small">No days selected</span>
                        ) : (
                          orderedDays.map((day) => (
                            <span
                              key={day}
                              className="px-3 py-1 rounded"
                              style={{
                                background: "#e3f2fd",
                                color: "#1976d2",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                border: "1px solid #bbdefb"
                              }}
                            >
                              {DAY_LABEL[day]}
                            </span>
                          ))
                        )}
                      </div>
                      
                      <div className="small text-muted mt-2">
                        {orderedDays.length} day{orderedDays.length !== 1 ? 's' : ''} per week
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto pt-3 border-top">
                      <Button
                        variant={sub.has_push_token ? "primary" : "outline-secondary"}
                        className="w-100"
                        disabled={!sub.has_push_token || sendingId === sub.customer_id}
                        onClick={() => sendReminder(sub)}
                      >
                        {sendingId === sub.customer_id ? (
                          <>
                            <Spinner size="sm" animation="border" className="me-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaBell className="me-2" />
                            {sub.has_push_token ? "Send Reminder" : "Enable Push First"}
                          </>
                        )}
                      </Button>
                      
                      {!sub.has_push_token && (
                        <div className="small text-warning mt-2 text-center">
                          Customer needs to open mobile app
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-light rounded">
        <h6><FaPaperPlane className="me-2" />How it works:</h6>
        <ul className="mb-0 small">
          <li>Customers set their weekly plan in the mobile app (Weekly Plan tab)</li>
          <li>Push tokens are automatically saved when they open the mobile app</li>
          <li>Green "Push Ready" badge means customer can receive notifications</li>
          <li>Click "Send Reminder" to notify customers about their gym sessions</li>
          <li>Only shows customers who have set up a weekly plan</li>
        </ul>
      </div>
    </div>
  );
}