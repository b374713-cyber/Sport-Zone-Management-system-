// Front_end/snp/src/components/gym/GymCoaches.js
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Row, Col, Form, Modal, Badge, InputGroup } from 'react-bootstrap';
import coachesService from '../../services/coachesService';

const theme = {
  headerGradient: 'linear-gradient(90deg, #3b2a88 0%, #146b57 100%)',
  purpleMid: '#6a4fb3'
};

const empty = {
  coach_id: null,
  full_name: '',
  phone: '',
  email: '',
  specialties: '',
  experience_years: 0,
  certifications: '',
  hourly_rate: '',
  bio: '',
  status: 'Active',
  photo_url: ''      // ✅ new
};

const statusBadge = (s) => ({ Active:'success', Inactive:'secondary' }[s] || 'secondary');

export default function GymCoaches() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      setRows(await coachesService.list());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter(r => {
      const ok = statusFilter === 'All' || r.status === statusFilter;
      if (!ok) return false;
      if (!q) return true;
      const hay = [r.full_name, r.specialties, r.email, r.phone, r.certifications].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter]);

  const openAdd = () => { setForm(empty); setShow(true); };
  const openEdit = (r) => { setForm({ ...r }); setShow(true); };

  const save = async () => {
    if (!form.full_name || !form.specialties) {
      alert('Full name and specialties are required.');
      return;
    }
    const payload = {
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      specialties: form.specialties,
      experience_years: Number(form.experience_years) || 0,
      certifications: form.certifications || null,
      hourly_rate: form.hourly_rate === '' ? null : Number(form.hourly_rate),
      bio: form.bio || null,
      status: form.status || 'Active',
      photo_url: form.photo_url || null    // ✅ send to backend
    };
    if (form.coach_id == null) {
      const created = await coachesService.create(payload);
      if (created?.coach_id) setRows(prev => [created, ...prev]); else await load();
    } else {
      const updated = await coachesService.update(form.coach_id, payload);
      if (updated?.coach_id) setRows(prev => prev.map(x => x.coach_id === updated.coach_id ? updated : x)); else await load();
    }
    setShow(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this coach?')) return;
    await coachesService.remove(id);
    setRows(prev => prev.filter(x => x.coach_id !== id));
  };

  return (
    <Card className="border-0">
      <Card.Header style={{ background: theme.headerGradient, color: '#fff', borderRadius: 12 }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">👨‍🏫 Coaches</h5>
          <Badge bg="light" text="dark">Admin View</Badge>
        </div>
      </Card.Header>

      <Card.Body>
        <Row className="g-2 align-items-end mb-3">
          <Col md={5}>
            <Form.Label>Search</Form.Label>
            <InputGroup>
              <InputGroup.Text><i className="bi bi-search" /></InputGroup.Text>
              <Form.Control
                placeholder="Name, specialty, email, phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Label>Status</Form.Label>
            <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Inactive</option>
            </Form.Select>
          </Col>
          <Col className="text-md-end mt-3 mt-md-0">
            <Button style={{ background: theme.purpleMid, borderColor: theme.purpleMid }} onClick={openAdd} disabled={loading}>
              <i className="bi bi-plus-circle me-2" /> Add Coach
            </Button>
          </Col>
        </Row>

        <div className="table-responsive">
          <Table hover className="align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Specialties</th>
                <th>Experience</th>
                <th>Rate</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center text-muted py-4">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted py-4">No coaches found.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.coach_id}>
                  <td>{r.coach_id}</td>
                  <td>
                    <div className="fw-semibold">{r.full_name}</div>
                    <div className="text-muted small">
                      {r.email || '—'} • {r.phone || '—'}
                    </div>
                  </td>
                  <td>{r.specialties}</td>
                  <td>{r.experience_years} yrs</td>
                  <td>{r.hourly_rate != null ? `$${Number(r.hourly_rate).toFixed(2)}` : '—'}</td>
                  <td><Badge bg={statusBadge(r.status)}>{r.status}</Badge></td>
                  <td>
                    <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openEdit(r)}>Edit</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => remove(r.coach_id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>

      {/* Modal */}
      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton style={{ background: theme.headerGradient, color: '#fff' }}>
          <Modal.Title>{form.coach_id == null ? 'Add Coach' : `Edit #${form.coach_id}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Specialties *</Form.Label>
                  <Form.Control
                    placeholder="Yoga, Fitness, HIIT…"
                    value={form.specialties}
                    onChange={e => setForm({ ...form, specialties: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Experience (yrs)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={form.experience_years}
                    onChange={e => setForm({ ...form, experience_years: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Hourly Rate</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={form.hourly_rate}
                      onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Certifications</Form.Label>
                  <Form.Control
                    value={form.certifications}
                    onChange={e => setForm({ ...form, certifications: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group>
                  <Form.Label>Bio</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={8}>
                <Form.Group>
                  <Form.Label>Photo URL</Form.Label>
                  <Form.Control
                    placeholder="https://…/coach.jpg"
                    value={form.photo_url || ''}
                    onChange={e => setForm({ ...form, photo_url: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Close</Button>
          <Button
            style={{ background: theme.purpleMid, borderColor: theme.purpleMid }}
            onClick={save}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
}
