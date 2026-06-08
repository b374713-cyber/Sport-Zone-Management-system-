// Front_end/snp/src/components/gym/GymMembersBoard.js
import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, ListGroup, Badge, Form, InputGroup } from 'react-bootstrap';
import membersService from '../../services/membersService';
import ProfileMember from './ProfileMember';

const headerGradient = 'linear-gradient(90deg, #3b2a88 0%, #146b57 100%)';

export default function GymMembersBoard() {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const list = await membersService.list();
      setMembers(list);
      if (!selected && list.length > 0) setSelected(list[0]);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return members;
    return members.filter((m) =>
      [m.full_name, m.phone, m.email].join(' ').toLowerCase().includes(q)
    );
  }, [members, search]);

  return (
    <Row className="g-3">
      {/* Left: member list */}
      <Col md={4}>
        <Card className="border-0 shadow-sm h-100">
          <Card.Header style={{ background: headerGradient, color: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center">
              <span>🧍 Members</span>
            </div>
          </Card.Header>
          <Card.Body className="p-2">
            <Form.Group className="mb-2">
              <InputGroup size="sm">
                <InputGroup.Text>
                  <i className="bi bi-search" />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by name or phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
            </Form.Group>

            <ListGroup variant="flush" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {filtered.map((m) => (
                <ListGroup.Item
                  key={m.member_id}
                  action
                  active={selected?.member_id === m.member_id}
                  onClick={() => setSelected(m)}
                >
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle bg-secondary me-2"
                      style={{ width: 36, height: 36, overflow: 'hidden' }}
                    >
                      {m.photo_url ? (
                        <img src={m.photo_url} alt="" style={{ width: '100%' }} />
                      ) : (
                        <span className="text-white d-block text-center" style={{ lineHeight: '36px' }}>
                          🙂
                        </span>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{m.full_name}</div>
                      <small className="text-muted">
                        {m.phone || m.email || 'No contact'}
                      </small>
                    </div>
                    <Badge bg="primary">{m.status}</Badge>
                  </div>
                </ListGroup.Item>
              ))}
              {filtered.length === 0 && (
                <ListGroup.Item className="text-muted">
                  No members match your search.
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card.Body>
        </Card>
      </Col>

      {/* Right: selected member profile */}
      <Col md={8}>
        {selected ? (
          <ProfileMember member={selected} />
        ) : (
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center justify-content-center text-muted">
              Select a member from the left…
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  );
}
