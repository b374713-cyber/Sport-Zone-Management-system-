// Front_end/snp/src/components/gym/GymSubscriptions.js

import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  Form,
  Modal,
  Badge,
  InputGroup
} from 'react-bootstrap';
import gymService from '../../services/gymService';

const headerGradient = 'linear-gradient(90deg, #3b2a88 0%, #146b57 100%)';

const emptyForm = {
  subscription_id: null,
  // subscription data
  full_name: '',
  phone: '',
  coach_id: '',
  plan_type: 'Monthly',
  start_date: '',
  end_date: '',
  price: '',
  status: 'Active',
  // member data
  gender: '',
  birth_date: '',
  height_cm: '',
  weight_kg: '',
  photo_url: '',
  email: '',
  notes: ''
};

const statusBadge = (s) =>
  ({ Active: 'success', Expired: 'danger', Paused: 'secondary', Pending: 'warning' }[s] || 'secondary');

export default function GymSubscriptions() {
  const [rows, setRows] = useState([]);
  const [pendingRows, setPendingRows] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [activeTab, setActiveTab] = useState("active"); // active | pending

  const [show, setShow] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState(""); // ✅ for dropdown on add

  // ✅ load Active + Pending + Customers
  const loadAll = async () => {
    setLoading(true);
    try {
      const list = await gymService.listSubscriptions();
      setRows(list || []);

      const pendingList = await gymService.listPendingSubscriptions();
      setPendingRows(pendingList || []);

      const cust = await gymService.listCustomers();
      setCustomers(cust || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      const ok = statusFilter === 'All' || r.status === statusFilter;
      if (!ok) return false;
      if (!q) return true;
      const hay = [r.full_name, r.phone, r.plan_type, String(r.coach_id || '')]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter]);

  const openAdd = () => {
    setForm(emptyForm);
    setPhotoFile(null);
    setSelectedCustomerId("");
    setShow(true);
  };

  const openEdit = (r) => {
    setForm({
      ...emptyForm,
      ...r
    });
    setPhotoFile(null);
    setSelectedCustomerId("");
    setShow(true);
  };

  // Upload the photo if a new file is chosen; return URL or null
  const uploadPhotoIfNeeded = async () => {
    if (!photoFile) {
      return form.photo_url || null;
    }

    const data = new FormData();
    data.append('image', photoFile);

    const res = await fetch('http://localhost:5000/api/uploads/member-photo', {
      method: 'POST',
      body: data
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to upload photo');
    }

    return json.url;
  };

  const save = async () => {
    if (!form.full_name.trim()) {
      alert('Full Name is required.');
      return;
    }
    if (!form.plan_type || !form.start_date || !form.end_date || !form.status) {
      alert('Plan type, dates and status are required.');
      return;
    }

    try {
      const finalPhotoUrl = await uploadPhotoIfNeeded();

      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone || null,
        coach_id: form.coach_id === '' ? null : Number(form.coach_id),
        plan_type: form.plan_type,
        start_date: form.start_date,
        end_date: form.end_date,
        price: form.price === '' ? 0 : Number(form.price),
        status: form.status,
        // member fields
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        height_cm: form.height_cm === '' ? null : Number(form.height_cm),
        weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg),
        photo_url: finalPhotoUrl,
        email: form.email || null,
        notes: form.notes || null
      };

      let result;
      if (form.subscription_id == null) {
        result = await gymService.createSubscription(payload);
        if (result?.subscription) {
          setRows((prev) => [result.subscription, ...prev]);
        } else {
          await loadAll();
        }
      } else {
        result = await gymService.updateSubscription(form.subscription_id, payload);
        if (result?.subscription) {
          setRows((prev) =>
            prev.map((x) =>
              x.subscription_id === result.subscription.subscription_id
                ? result.subscription
                : x
            )
          );
        } else {
          await loadAll();
        }
      }

      setShow(false);
      setPhotoFile(null);
      setSelectedCustomerId("");
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to save subscription');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this subscription AND the linked member & ID cards?')) return;
    try {
      await gymService.deleteSubscription(id);
      setRows((prev) => prev.filter((x) => x.subscription_id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete subscription");
    }
  };

  // ✅ approve pending
  const approvePending = async (id) => {
    if (!window.confirm("Approve this application?")) return;
    try {
      await gymService.approveSubscription(id);
      await loadAll();
      setActiveTab("active");
    } catch (err) {
      alert(err.message || "Failed to approve");
    }
  };

  return (
    <Card className="border-0">
      <Card.Header style={{ background: headerGradient, color: '#fff', borderRadius: 12 }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">🏅 Subscriptions</h5>
          <Badge bg="light" text="dark">Live</Badge>
        </div>
      </Card.Header>

      <Card.Body>

        {/* ✅ Tabs */}
        <div className="d-flex gap-2 mb-3">
          <Button
            variant={activeTab === "active" ? "primary" : "outline-primary"}
            onClick={() => setActiveTab("active")}
          >
            Active Subscriptions
          </Button>

          <Button
            variant={activeTab === "pending" ? "warning" : "outline-warning"}
            onClick={() => setActiveTab("pending")}
          >
            Pending Applications ({pendingRows.length})
          </Button>
        </div>

        {/* ✅ Active Tab UI */}
        {activeTab === "active" && (
          <>
            <Row className="g-2 align-items-end mb-3">
              <Col md={6}>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search" />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Name, phone, coach, plan, status…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All</option>
                  <option>Active</option>
                  <option>Expired</option>
                  <option>Paused</option>
                </Form.Select>
              </Col>
              <Col className="text-md-end mt-3 mt-md-0">
                <Button onClick={openAdd}>Add Subscription</Button>
              </Col>
            </Row>

            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Subscriber</th>
                    <th>Phone</th>
                    <th>Coach</th>
                    <th>Plan</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="text-center text-muted py-4">
                        Loading…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center text-muted py-4">
                        No subscriptions found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.subscription_id}>
                        <td>{r.subscription_id}</td>
                        <td>{r.full_name}</td>
                        <td>{r.phone || '—'}</td>
                        <td>{r.coach_id ? `Coach #${r.coach_id}` : '—'}</td>
                        <td>{r.plan_type}</td>
                        <td>{r.start_date}</td>
                        <td>{r.end_date}</td>
                        <td>{r.price != null ? `$${Number(r.price).toFixed(2)}` : '$0.00'}</td>
                        <td>
                          <Badge bg={statusBadge(r.status)}>{r.status}</Badge>
                        </td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="me-1"
                            onClick={() => openEdit(r)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => remove(r.subscription_id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </>
        )}

        {/* ✅ Pending Tab Table */}
        {activeTab === "pending" && (
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Applicant</th>
                  <th>Phone</th>
                  <th>Plan</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ width: 140 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      Loading…
                    </td>
                  </tr>
                ) : pendingRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      No pending applications.
                    </td>
                  </tr>
                ) : (
                  pendingRows.map((p, i) => (
                    <tr key={p.subscription_id}>
                      <td>{i + 1}</td>
                      <td>{p.full_name}</td>
                      <td>{p.phone || "—"}</td>
                      <td>{p.plan_type}</td>
                      <td>{p.start_date}</td>
                      <td>{p.end_date}</td>
                      <td>{p.price != null ? `$${Number(p.price).toFixed(2)}` : '$0.00'}</td>
                      <td>
                        <Badge bg={statusBadge(p.status)}>{p.status}</Badge>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => approvePending(p.subscription_id)}
                        >
                          Approve
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}

      </Card.Body>

      {/* Modal: Add / Edit */}
      <Modal show={show} onHide={() => setShow(false)} size="lg">
        <Modal.Header closeButton style={{ background: headerGradient, color: '#fff' }}>
          <Modal.Title>
            {form.subscription_id == null ? 'Add Subscription' : `Edit #${form.subscription_id}`}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Row className="g-3">

              {/* ✅ ADD MODE: select customer */}
              {form.subscription_id == null ? (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Customer Account *</Form.Label>
                    <Form.Select
                      value={selectedCustomerId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedCustomerId(id);

                        const c = customers.find(x => String(x.customer_id) === String(id));
                        if (c) {
                          setForm(prev => ({
                            ...prev,
                            full_name: c.name || "",
                            phone: c.phone || "",
                            email: c.email || "",
                            birth_date: c.birth_date ? String(c.birth_date).slice(0,10) : "",
                            gender: c.gender || "",
                            address: c.address || "",
                            photo_url: c.photo_url || ""
                          }));
                        }
                      }}
                    >
                      <option value="">Select customer...</option>
                      {customers.map(c => (
                        <option key={c.customer_id} value={c.customer_id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </Form.Select>
                    <small className="text-muted">
                      Name/phone/email auto-filled from Customers table.
                    </small>
                  </Form.Group>
                </Col>
              ) : (
                // ✅ EDIT MODE: normal text input
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Full Name *</Form.Label>
                    <Form.Control
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Subscriber name"
                    />
                  </Form.Group>
                </Col>
              )}

              {/* Phone + Email */}
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g., 0551234567"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Optional email"
                  />
                </Form.Group>
              </Col>

              {/* Plan info */}
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Coach ID</Form.Label>
                  <Form.Control
                    value={form.coach_id}
                    onChange={(e) => setForm({ ...form, coach_id: e.target.value })}
                    placeholder="e.g., 5"
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Plan Type *</Form.Label>
                  <Form.Select
                    value={form.plan_type}
                    onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
                  >
                    <option>Monthly</option>
                    <option>3-Month</option>
                    <option>6-Month</option>
                    <option>Yearly</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Start *</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>End *</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Price</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option>Active</option>
                    <option>Expired</option>
                    <option>Paused</option>
                    <option>Pending</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Member details */}
              <Col xs={12} className="mt-3">
                <hr />
                <strong>Member Details (used in Members tab & ID card)</strong>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="">—</option>
                    <option>Male</option>
                    <option>Female</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Birth Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Height (cm)</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.height_cm}
                    onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={3}>
                <Form.Group>
                  <Form.Label>Weight (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={form.weight_kg}
                    onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Photo (upload)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0] || null)}
                  />
                  {form.photo_url && !photoFile && (
                    <small className="text-muted d-block mt-1">
                      Current image: {form.photo_url}
                    </small>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </Form.Group>
              </Col>

            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Close
          </Button>
          <Button onClick={save}>Save</Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
