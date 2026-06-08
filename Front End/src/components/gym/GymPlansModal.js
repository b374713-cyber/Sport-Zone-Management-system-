import React, { useEffect, useState } from "react";
import { Modal, Button, Table, Spinner, Alert } from "react-bootstrap";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function GymPlansModal({ show, onHide }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/gym/ai-plans`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load plans");
      setPlans(data.plans || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) loadPlans();
  }, [show]);

  // ✅ PDF generator
  const downloadPlanPDF = (planRow) => {
    let plan;
    try {
      plan =
        typeof planRow.plan_json === "string"
          ? JSON.parse(planRow.plan_json)
          : planRow.plan_json;
    } catch {
      alert("Plan JSON is corrupted");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("AI Gym Plan", 14, 15);

    doc.setFontSize(12);
    doc.text("Summary", 14, 25);
    const summaryLines = [
      `Name: ${planRow.full_name}`,
      `Goal: ${plan.summary?.goal}`,
      `Experience: ${plan.summary?.experience_level}`,
      `Duration (weeks): ${plan.summary?.duration_weeks}`,
      `Days/week: ${plan.summary?.days_per_week}`,
    ];
    doc.text(summaryLines, 14, 33);

    let y = 60;

    plan.weekly_plan?.forEach((weekObj) => {
      doc.setFontSize(13);
      doc.text(`Week ${weekObj.week}`, 14, y);
      y += 6;

      weekObj.days?.forEach((dayObj) => {
        doc.setFontSize(12);
        doc.text(`${dayObj.day} - ${dayObj.focus}`, 14, y);
        y += 4;

        const rows =
          dayObj.exercises?.map((ex) => [
            ex.name,
            ex.sets?.toString(),
            ex.reps?.toString(),
            ex.rest_sec?.toString(),
          ]) || [];

        autoTable(doc, {
          startY: y,
          head: [["Exercise", "Sets", "Reps", "Rest (sec)"]],
          body: rows,
          styles: { fontSize: 10 },
          theme: "grid",
        });

        y = doc.lastAutoTable.finalY + 6;

        if (dayObj.notes) {
          doc.setFontSize(10);
          doc.text(`Notes: ${dayObj.notes}`, 14, y);
          y += 6;
        }

        if (y > 270) {
          doc.addPage();
          y = 15;
        }
      });

      y += 4;
    });

    if (plan.nutrition_tips?.length) {
      if (y > 250) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(12);
      doc.text("Nutrition Tips", 14, y);
      y += 6;

      doc.setFontSize(10);
      plan.nutrition_tips.forEach((tip) => {
        doc.text(`- ${tip}`, 14, y);
        y += 5;
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
      });
    }

    doc.save(
      `gym-plan-${planRow.full_name || "member"}-${planRow.plan_id}.pdf`
    );
  };

  // ✅ Delete plan
  const deletePlan = async (planId) => {
    const ok = window.confirm("Delete this plan?");
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/gym/ai-plans/${planId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      // remove from UI instantly
      setPlans((prev) => prev.filter((p) => p.plan_id !== planId));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleClose = () => {
    setPlans([]);
    setError("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>📄 Gym Plans</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {loading && (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <div className="mt-2">Loading plans...</div>
          </div>
        )}

        {!loading && plans.length === 0 && !error && (
          <Alert variant="info">No plans saved yet.</Alert>
        )}

        {!loading && plans.length > 0 && (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Subscriber</th>
                <th>Goal</th>
                <th>Experience</th>
                <th>Days/Week</th>
                <th>Duration</th>
                <th>Created At</th>
                <th>PDF</th>
                <th>Delete</th> {/* ✅ NEW */}
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.plan_id}>
                  <td>{p.plan_id}</td>
                  <td>{p.full_name}</td>
                  <td>{p.goal}</td>
                  <td>{p.experience_level}</td>
                  <td>{p.days_per_week}</td>
                  <td>{p.duration_weeks} weeks</td>
                  <td>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : "-"}
                  </td>

                  <td className="text-center">
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => downloadPlanPDF(p)}
                    >
                      View Plan
                    </Button>
                  </td>

                  <td className="text-center">
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => deletePlan(p.plan_id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
