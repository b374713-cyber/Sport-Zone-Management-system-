// Front_end/snp/src/components/jobs/ApplyJobButton.js
import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api';

export default function ApplyJobButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API}/settings/hiring`);
        const data = await res.json();
        if (mounted) setOpen(Boolean(data.hiring_open));
      } catch {
        if (mounted) setOpen(false);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const goApply = () => {
    if (!open) return;             // block navigation if closed
    navigate('/apply');
  };

  if (loading) {
    return (
      <Button variant="secondary" size="lg" className="px-5 py-3" disabled>
        Checking hiring…
      </Button>
    );
  }

  return open ? (
    <Button
      onClick={goApply}
      variant="warning"
      size="lg"
      className="px-5 py-3 fw-bold text-dark border-0 btn-hover-pop"
      style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}
    >
      👥 Apply for Job
    </Button>
  ) : (
    <Button variant="secondary" size="lg" className="px-5 py-3" disabled title="Hiring is closed">
      Apply for Job (Closed)
    </Button>
  );
}
