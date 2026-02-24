// // Front_end/snp/src/components/gym/AIGymPlanModal.js

// import React, { useMemo, useState, useEffect } from "react";
// import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// const API_BASE =
//   process.env.REACT_APP_API_URL || "http://localhost:5000";

// export default function AIGymPlanModal({ show, onHide }) {
//   const emptyForm = useMemo(
//     () => ({
//       subscription_id: "",
//       member_id: null,
//       full_name: "",
//       phone: "",
//       age: "",
//       weight: "",
//       height: "",
//       gender: "male",
//       subscription_months: "",
//       experience_level: "beginner",
//       goal: "fitness",
//       days_per_week: 3,
//       plan_duration_weeks: 4
//     }),
//     []
//   );

//   const [form, setForm] = useState(emptyForm);
//   const [loading, setLoading] = useState(false);
//   const [plan, setPlan] = useState(null);
//   const [raw, setRaw] = useState("");
//   const [error, setError] = useState("");
//   const [subs, setSubs] = useState([]);
//   const [saving, setSaving] = useState(false);
//   const [saveMsg, setSaveMsg] = useState("");

//   const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

//   // ✅ Load subscriptions when modal opens
//   useEffect(() => {
//     if (!show) return;
//     (async () => {
//       try {
//         const res = await fetch(`${API_BASE}/api/gym/subscriptions/names`);
//         const data = await res.json();
//         setSubs(data.subscriptions || []);
//       } catch (e) {
//         console.log("Failed to load names", e);
//       }
//     })();
//   }, [show]);

//   // ✅ Helper: extract months from plan_type like "6-Month"
//   const monthsFromPlanType = (planType) => {
//     if (!planType) return "";
//     const m = String(planType).match(/(\d+)/);
//     return m ? Number(m[1]) : "";
//   };

//   // ✅ On choose subscriber -> autofill some fields
//   const handleSelectSubscriber = (subId) => {
//     update("subscription_id", subId);

//     const sub = subs.find(s => String(s.subscription_id) === String(subId));
//     if (!sub) return;

//     update("member_id", sub.member_id || null);
//     update("full_name", sub.full_name || "");
//     update("phone", sub.phone || "");

//     const months = monthsFromPlanType(sub.plan_type);
//     if (months) update("subscription_months", months);
//   };

//   const handleGenerate = async () => {
//     setError("");
//     setPlan(null);
//     setRaw("");
//     setSaveMsg("");
//     setLoading(true);

//     try {
//       const res = await fetch(`${API_BASE}/api/gym/ai-plan`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           full_name: form.full_name,
//           age: Number(form.age),
//           weight: Number(form.weight),
//           height: form.height ? Number(form.height) : null,
//           gender: form.gender,
//           subscription_months: form.subscription_months
//             ? Number(form.subscription_months)
//             : null,
//           experience_level: form.experience_level,
//           goal: form.goal,
//           days_per_week: Number(form.days_per_week),
//           plan_duration_weeks: Number(form.plan_duration_weeks)
//         })
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Request failed");

//       if (data.plan) setPlan(data.plan);
//       else setRaw(data.raw || "");
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Save Plan to DB
//   const savePlanToDB = async () => {
//     if (!plan) return;

//     setSaving(true);
//     setSaveMsg("");
//     try {
//       const res = await fetch(`${API_BASE}/api/gym/ai-plans/save`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           subscription_id: Number(form.subscription_id),
//           member_id: form.member_id ? Number(form.member_id) : null,
//           full_name: form.full_name,
//           age: Number(form.age),
//           weight: Number(form.weight),
//           height: form.height ? Number(form.height) : null,
//           gender: form.gender,
//           experience_level: form.experience_level,
//           goal: form.goal,
//           days_per_week: Number(form.days_per_week),
//           duration_weeks: Number(form.plan_duration_weeks),
//           plan_json: plan
//         })
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Save failed");

//       setSaveMsg("✅ Plan saved successfully");
//     } catch (e) {
//       setSaveMsg("❌ " + e.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ✅ PDF Generator
//   const downloadPDF = () => {
//     if (!plan) return;

//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text("AI Gym Plan", 14, 15);

//     doc.setFontSize(12);
//     doc.text("Summary", 14, 25);
//     const summaryLines = [
//       `Name: ${form.full_name}`,
//       `Goal: ${plan.summary?.goal}`,
//       `Experience: ${plan.summary?.experience_level}`,
//       `Duration (weeks): ${plan.summary?.duration_weeks}`,
//       `Days/week: ${plan.summary?.days_per_week}`,
//     ];
//     doc.text(summaryLines, 14, 33);

//     let y = 60;

//     plan.weekly_plan?.forEach((weekObj) => {
//       doc.setFontSize(13);
//       doc.text(`Week ${weekObj.week}`, 14, y);
//       y += 6;

//       weekObj.days?.forEach((dayObj) => {
//         doc.setFontSize(12);
//         doc.text(`${dayObj.day} - ${dayObj.focus}`, 14, y);
//         y += 4;

//         const rows =
//           dayObj.exercises?.map((ex) => [
//             ex.name,
//             ex.sets?.toString(),
//             ex.reps?.toString(),
//             ex.rest_sec?.toString(),
//           ]) || [];

//         autoTable(doc, {
//           startY: y,
//           head: [["Exercise", "Sets", "Reps", "Rest (sec)"]],
//           body: rows,
//           styles: { fontSize: 10 },
//           theme: "grid",
//         });

//         y = doc.lastAutoTable.finalY + 6;

//         if (dayObj.notes) {
//           doc.setFontSize(10);
//           doc.text(`Notes: ${dayObj.notes}`, 14, y);
//           y += 6;
//         }

//         if (y > 270) {
//           doc.addPage();
//           y = 15;
//         }
//       });

//       y += 4;
//     });

//     if (plan.nutrition_tips?.length) {
//       if (y > 250) {
//         doc.addPage();
//         y = 15;
//       }
//       doc.setFontSize(12);
//       doc.text("Nutrition Tips", 14, y);
//       y += 6;
//       doc.setFontSize(10);

//       plan.nutrition_tips.forEach((tip) => {
//         doc.text(`- ${tip}`, 14, y);
//         y += 5;
//         if (y > 270) {
//           doc.addPage();
//           y = 15;
//         }
//       });
//     }

//     doc.save(`gym-plan-${form.full_name || "member"}.pdf`);
//   };

//   const handleClose = () => {
//     setForm(emptyForm);
//     setPlan(null);
//     setRaw("");
//     setError("");
//     setSaveMsg("");
//     onHide();
//   };

//   return (
//     <Modal show={show} onHide={handleClose} centered size="lg">
//       <Modal.Header closeButton>
//         <Modal.Title>AI Gym Plan Generator</Modal.Title>
//       </Modal.Header>

//       <Modal.Body>
//         {error && <Alert variant="danger">{error}</Alert>}
//         {saveMsg && <Alert variant={saveMsg.startsWith("✅") ? "success" : "warning"}>{saveMsg}</Alert>}

//         {!plan && !raw && (
//           <Form>
//             {/* ✅ Subscribers Dropdown */}
//             <Form.Group className="mb-3">
//               <Form.Label>Select Subscriber</Form.Label>
//               <Form.Select
//                 value={form.subscription_id}
//                 onChange={(e) => handleSelectSubscriber(e.target.value)}
//               >
//                 <option value="">-- choose subscriber --</option>
//                 {subs.map((s) => (
//                   <option key={s.subscription_id} value={s.subscription_id}>
//                     {s.full_name} (#{s.subscription_id})
//                   </option>
//                 ))}
//               </Form.Select>
//             </Form.Group>

//             <Form.Group className="mb-2">
//               <Form.Label>Full Name</Form.Label>
//               <Form.Control
//                 value={form.full_name}
//                 onChange={(e) => update("full_name", e.target.value)}
//               />
//             </Form.Group>

//             <div className="d-flex gap-2">
//               <Form.Group className="mb-2 flex-grow-1">
//                 <Form.Label>Age</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.age}
//                   onChange={(e) => update("age", e.target.value)}
//                 />
//               </Form.Group>

//               <Form.Group className="mb-2 flex-grow-1">
//                 <Form.Label>Weight (kg)</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.weight}
//                   onChange={(e) => update("weight", e.target.value)}
//                 />
//               </Form.Group>

//               <Form.Group className="mb-2 flex-grow-1">
//                 <Form.Label>Height (cm)</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.height}
//                   onChange={(e) => update("height", e.target.value)}
//                 />
//               </Form.Group>
//             </div>

//             <div className="d-flex gap-2">
//               <Form.Group className="mb-2 flex-grow-1">
//                 <Form.Label>Gender</Form.Label>
//                 <Form.Select
//                   value={form.gender}
//                   onChange={(e) => update("gender", e.target.value)}
//                 >
//                   <option value="male">Male</option>
//                   <option value="female">Female</option>
//                 </Form.Select>
//               </Form.Group>

//               <Form.Group className="mb-2 flex-grow-1">
//                 <Form.Label>Subscription Months</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={form.subscription_months}
//                   onChange={(e) =>
//                     update("subscription_months", e.target.value)
//                   }
//                 />
//               </Form.Group>
//             </div>

//             <div className="d-flex gap-2">
//               <Form.Group className="mb-2 flex-grow-1">
//                 <Form.Label>Experience Level</Form.Label>
//                 <Form.Select
//                   value={form.experience_level}
//                   onChange={(e) =>
//                     update("experience_level", e.target.value)
//                   }
//                 >
//                   <option value="beginner">Beginner</option>
//                   <option value="intermediate">Intermediate</option>
//                   <option value="advanced">Advanced</option>
//                 </Form.Select>
//               </Form.Group>

//               <Form.Group className="mb-2 flex-grow-1">
//                 <Form.Label>Goal</Form.Label>
//                 <Form.Select
//                   value={form.goal}
//                   onChange={(e) => update("goal", e.target.value)}
//                 >
//                   <option value="fitness">Fitness</option>
//                   <option value="fat_loss">Fat Loss</option>
//                   <option value="muscle_gain">Muscle Gain</option>
//                 </Form.Select>
//               </Form.Group>
//             </div>

//             <div className="d-flex gap-2">
//               <Form.Group className="mb-2 flex-grow-1">
//                 <Form.Label>Days / Week</Form.Label>
//                 <Form.Control
//                   type="number"
//                   min={2}
//                   max={6}
//                   value={form.days_per_week}
//                   onChange={(e) =>
//                     update("days_per_week", e.target.value)
//                   }
//                 />
//               </Form.Group>

//               <Form.Group className="mb-2 flex-grow-1">
//                 <Form.Label>Plan Duration (weeks)</Form.Label>
//                 <Form.Control
//                   type="number"
//                   min={1}
//                   max={12}
//                   value={form.plan_duration_weeks}
//                   onChange={(e) =>
//                     update("plan_duration_weeks", e.target.value)
//                   }
//                 />
//               </Form.Group>
//             </div>
//           </Form>
//         )}

//         {loading && (
//           <div className="text-center py-4">
//             <Spinner animation="border" />
//             <div className="mt-2">Generating plan...</div>
//           </div>
//         )}

//         {plan && (
//           <div>
//             <h5 className="mb-2">Summary</h5>
//             <pre style={{ whiteSpace: "pre-wrap" }}>
//               {JSON.stringify(plan.summary, null, 2)}
//             </pre>

//             <h5 className="mt-3 mb-2">Weekly Plan</h5>
//             <pre style={{ whiteSpace: "pre-wrap" }}>
//               {JSON.stringify(plan.weekly_plan, null, 2)}
//             </pre>

//             <h5 className="mt-3 mb-2">Nutrition Tips</h5>
//             <ul>
//               {plan.nutrition_tips?.map((t, i) => (
//                 <li key={i}>{t}</li>
//               ))}
//             </ul>

//             <small className="text-muted">
//               {plan.disclaimer}
//             </small>
//           </div>
//         )}

//         {raw && (
//           <div>
//             <Alert variant="warning">
//               Gemini returned non-JSON. Showing raw output:
//             </Alert>
//             <pre style={{ whiteSpace: "pre-wrap" }}>{raw}</pre>
//           </div>
//         )}
//       </Modal.Body>

//       <Modal.Footer>
//         {plan && (
//           <>
//             <Button variant="success" onClick={downloadPDF}>
//               Download PDF
//             </Button>

//             <Button variant="primary" onClick={savePlanToDB} disabled={saving}>
//               {saving ? "Saving..." : "Save Plan"}
//             </Button>
//           </>
//         )}

//         {!plan && !raw && (
//           <Button onClick={handleGenerate} disabled={loading || !form.subscription_id}>
//             {loading ? "Generating..." : "Generate Plan"}
//           </Button>
//         )}

//         <Button variant="secondary" onClick={handleClose}>
//           Close
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// }
// Front_end/snp/src/components/gym/AIGymPlanModal.js
import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
} from "react-bootstrap";

// ----------------------------
// CONFIG (same style as Dashboard)
// ----------------------------
const RAW_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// API should end with /api exactly once
const API = RAW_BASE.endsWith("/api")
  ? RAW_BASE
  : `${RAW_BASE.replace(/\/$/, "")}/api`;

export default function AIGymPlanModal({ show, onHide }) {
  const [subscribers, setSubscribers] = useState([]);
  const [selectedSubscriberId, setSelectedSubscriberId] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    age: "",
    weight: "",
    height: "",
    gender: "Male",
    subscription_months: "",
    experience: "Beginner",
    goal: "Fitness",
    days_per_week: 3,
    duration_weeks: 4,
  });

  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("");

  // Load subscribers list when modal opens
  useEffect(() => {
    if (!show) return;

    setError("");
    setPlan("");
    setSelectedSubscriberId("");
    setForm((f) => ({ ...f, full_name: "" }));

    (async () => {
      try {
        setLoadingSubs(true);

        const res = await fetch(`${API}/gym/subscriptions/names`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });

        const text = await res.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          console.error("AIGymPlanModal: not JSON:", text.slice(0, 200));
          throw new Error(
            "Server returned invalid response (not JSON). Check API URL."
          );
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to load subscribers");
        }

        setSubscribers(data.subscribers || []);
      } catch (e) {
        console.error(e);
        setSubscribers([]);
        setError(e.message || "Failed to load subscribers");
      } finally {
        setLoadingSubs(false);
      }
    })();
  }, [show]);

  const handleSelectSubscriber = async (subscriberId) => {
    setSelectedSubscriberId(subscriberId);
    setError("");
    setPlan("");

    if (!subscriberId) return;

    try {
      // fetch subscriber details
      const res = await fetch(`${API}/gym/subscriptions/${subscriberId}`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("handleSelectSubscriber: not JSON:", text.slice(0, 200));
        throw new Error("Server returned invalid response (not JSON).");
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to load subscriber details");
      }

      const s = data.subscription;

      setForm((prev) => ({
        ...prev,
        full_name: s?.subscriber_name || "",
        age: s?.age || "",
        weight: s?.weight || "",
        height: s?.height || "",
        gender: s?.gender || "Male",
        subscription_months: s?.subscription_months || "",
      }));
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load subscriber details");
    }
  };

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const generatePlan = async () => {
    setError("");
    setPlan("");

    if (!form.full_name) {
      setError("Please choose a subscriber or enter full name.");
      return;
    }

    try {
      setLoadingPlan(true);

      const res = await fetch(`${API}/gym/ai-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(form),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("generatePlan: not JSON:", text.slice(0, 200));
        throw new Error("Server returned invalid response (not JSON).");
      }

      if (!res.ok) throw new Error(data.error || "Failed to generate plan");

      setPlan(data.plan || "✅ Plan generated, but empty response.");
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to generate plan");
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>AI Gym Plan Generator</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Select Subscriber</Form.Label>

            {loadingSubs ? (
              <div className="d-flex align-items-center gap-2">
                <Spinner animation="border" size="sm" />
                <span className="text-muted">Loading subscribers…</span>
              </div>
            ) : (
              <Form.Select
                value={selectedSubscriberId}
                onChange={(e) => handleSelectSubscriber(e.target.value)}
              >
                <option value="">-- choose subscriber --</option>
                {subscribers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              name="full_name"
              value={form.full_name}
              onChange={onChange}
            />
          </Form.Group>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Age</Form.Label>
                <Form.Control name="age" value={form.age} onChange={onChange} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Weight (kg)</Form.Label>
                <Form.Control
                  name="weight"
                  value={form.weight}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Height (cm)</Form.Label>
                <Form.Control
                  name="height"
                  value={form.height}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Gender</Form.Label>
                <Form.Select
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                >
                  <option>Male</option>
                  <option>Female</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Subscription Months</Form.Label>
                <Form.Control
                  name="subscription_months"
                  value={form.subscription_months}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Experience Level</Form.Label>
                <Form.Select
                  name="experience"
                  value={form.experience}
                  onChange={onChange}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Goal</Form.Label>
                <Form.Select name="goal" value={form.goal} onChange={onChange}>
                  <option>Fitness</option>
                  <option>Weight Loss</option>
                  <option>Muscle Gain</option>
                  <option>Strength</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Days / Week</Form.Label>
                <Form.Control
                  name="days_per_week"
                  value={form.days_per_week}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Plan Duration (weeks)</Form.Label>
                <Form.Control
                  name="duration_weeks"
                  value={form.duration_weeks}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Button
            variant="primary"
            onClick={generatePlan}
            disabled={loadingPlan}
          >
            {loadingPlan ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Generating…
              </>
            ) : (
              "Generate Plan"
            )}
          </Button>
        </Form>

        {plan && (
          <Alert variant="success" className="mt-3" style={{ whiteSpace: "pre-wrap" }}>
            {plan}
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
