// Front_end/snp/src/components/gym/FloatingCoachMore.jsx
import React, { useEffect, useState } from "react";
import { Button, Modal, Form, ListGroup, Badge } from "react-bootstrap";
import coachesService from "../../services/coachesService";

export default function FloatingCoachMore({ onChanged, inline, style }) {
  const [show, setShow] = useState(false);
  const [coaches, setCoaches] = useState([]);
  const [mode, setMode] = useState("list"); // list | create | edit
  const [activeCoach, setActiveCoach] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    specialties: "",
    experience_years: "",
    hourly_rate: "",
    bio: "",
    photo_url: "",   // ✅ base64 stored here
    status: "Active",
  });

  async function loadCoaches() {
    try {
      const rows = await coachesService.list();
      setCoaches(rows || []);
    } catch (e) {
      console.error(e);
      setCoaches([]);
    }
  }

  useEffect(() => {
    if (show) loadCoaches();
  }, [show]);

  const openCreate = () => {
    setMode("create");
    setActiveCoach(null);
    setForm({
      full_name: "",
      phone: "",
      email: "",
      specialties: "",
      experience_years: "",
      hourly_rate: "",
      bio: "",
      photo_url: "",
      status: "Active",
    });
  };

  const openEdit = (c) => {
    setMode("edit");
    setActiveCoach(c);
    setForm({
      full_name: c.full_name || "",
      phone: c.phone || "",
      email: c.email || "",
      specialties: c.specialties || "",
      experience_years: c.experience_years ?? "",
      hourly_rate: c.hourly_rate ?? "",
      bio: c.bio || "",
      photo_url: c.photo_url || "",
      status: c.status || "Active",
    });
  };

  // ✅ local file → base64 → save to form.photo_url
  const handleFilePick = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setForm((f) => ({ ...f, photo_url: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        photo_url: form.photo_url?.trim() || null, // ✅ never send ""
      };

      if (mode === "create") {
        await coachesService.create(payload);
      } else if (mode === "edit" && activeCoach) {
        await coachesService.update(activeCoach.coach_id, payload);
      }

      setMode("list");
      await loadCoaches();
      onChanged?.();
    } catch (e) {
      console.error(e);
      alert(e.message || "Save failed");
    }
  };

  const handleDelete = async (c) => {
    const ok = window.confirm(
      `Delete coach "${c.full_name}"?\n\nIf they have assignments/sessions, prefer deactivate.`
    );
    if (!ok) return;

    try {
      await coachesService.remove(c.coach_id);
      await loadCoaches();
      onChanged?.();
    } catch (e) {
      console.error(e);
      alert("Delete failed. Coach may still have assignments/sessions.");
    }
  };

  return (
    <>
      {inline ? (
        <Button size="sm" onClick={() => setShow(true)} style={style}>
          More
        </Button>
      ) : (
        <Button
          onClick={() => setShow(true)}
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            width: 64,
            height: 64,
            borderRadius: "50%",
            fontWeight: 800,
            boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
            zIndex: 999,
          }}
        >
          More
        </Button>
      )}

      <Modal show={show} onHide={() => setShow(false)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>Manage Coaches</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {mode === "list" && (
            <>
              <div className="d-flex justify-content-end mb-2">
                <Button size="sm" onClick={openCreate}>
                  + New Coach
                </Button>
              </div>

              <ListGroup>
                {coaches.map((c) => (
                  <ListGroup.Item
                    key={c.coach_id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div className="fw-bold">{c.full_name}</div>
                      <div className="text-muted small">
                        {c.phone || c.email || "—"}
                      </div>
                      <div className="text-muted small">
                        {c.specialties || ""}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={c.status === "Active" ? "success" : "secondary"}>
                        {c.status}
                      </Badge>

                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(c)}
                      >
                        Delete
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}

                {coaches.length === 0 && (
                  <ListGroup.Item className="text-muted">
                    No coaches found
                  </ListGroup.Item>
                )}
              </ListGroup>
            </>
          )}

          {(mode === "create" || mode === "edit") && (
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                />
              </Form.Group>

              <div className="row g-2">
                <div className="col-6">
                  <Form.Group className="mb-2">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                    />
                  </Form.Group>
                </div>

                <div className="col-6">
                  <Form.Group className="mb-2">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-2">
                <Form.Label>Specialties</Form.Label>
                <Form.Control
                  value={form.specialties}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, specialties: e.target.value }))
                  }
                />
              </Form.Group>

              <div className="row g-2">
                <div className="col-6">
                  <Form.Group className="mb-2">
                    <Form.Label>Experience Years</Form.Label>
                    <Form.Control
                      type="number"
                      value={form.experience_years}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          experience_years: e.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                </div>

                <div className="col-6">
                  <Form.Group className="mb-2">
                    <Form.Label>Hourly Rate</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={form.hourly_rate}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          hourly_rate: e.target.value,
                        }))
                      }
                    />
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-2">
                <Form.Label>Bio</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                />
              </Form.Group>

              {/* ✅ Photo upload same as members */}
              <Form.Group className="mb-2">
                <Form.Label>Photo (Upload)</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFilePick(e.target.files?.[0])}
                />

                {form.photo_url && (
                  <div className="mt-2">
                    <img
                      src={form.photo_url}
                      alt="preview"
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer>
          {mode !== "list" ? (
            <>
              <Button variant="secondary" onClick={() => setMode("list")}>
                Back
              </Button>
              <Button onClick={handleSave}>
                {mode === "create" ? "Create" : "Save"}
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setShow(false)}>
              Close
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}
