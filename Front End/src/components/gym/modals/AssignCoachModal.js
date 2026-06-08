import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import coachesService from '../../../services/coachesService';
import membersService from '../../../services/membersService';
import assignmentsService from '../../../services/assignmentsService';

export default function AssignCoachModal({ show, onHide, presetCoach=null, presetMember=null, onAssigned }) {
  const [coaches, setCoaches] = useState([]);
  const [members, setMembers] = useState([]);
  const [coachId, setCoachId] = useState(presetCoach?.coach_id || '');
  const [memberId, setMemberId] = useState(presetMember?.member_id || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setCoaches(await coachesService.list());
      setMembers(await membersService.list());
    };
    if (show) load();
  }, [show]);

  useEffect(() => {
    setCoachId(presetCoach?.coach_id || '');
    setMemberId(presetMember?.member_id || '');
  }, [presetCoach, presetMember]);

  const save = async () => {
    if (!coachId || !memberId) { alert('Please choose both coach and member.'); return; }
    setSaving(true);
    try {
      await assignmentsService.assign({ coach_id: Number(coachId), member_id: Number(memberId) });
      onAssigned?.();
    } catch (e) {
      alert('Failed to assign: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton><Modal.Title>Assign Coach to Member</Modal.Title></Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Coach</Form.Label>
            <Form.Select value={coachId} onChange={e => setCoachId(e.target.value)} disabled={!!presetCoach}>
              <option value="">Choose…</option>
              {coaches.map(c => <option key={c.coach_id} value={c.coach_id}>{c.full_name} — {c.specialties}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Member</Form.Label>
            <Form.Select value={memberId} onChange={e => setMemberId(e.target.value)} disabled={!!presetMember}>
              <option value="">Choose…</option>
              {members.map(m => <option key={m.member_id} value={m.member_id}>{m.full_name}</option>)}
            </Form.Select>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Close</Button>
        <Button onClick={save} disabled={saving}>{saving ? 'Assigning…' : 'Assign'}</Button>
      </Modal.Footer>
    </Modal>
  );
}
