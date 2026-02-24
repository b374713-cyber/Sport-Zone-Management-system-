// lib/gymApi.ts
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.1.1.53:5000";

// 1. Get all coaches (from gym.js - shows ALL coaches)
export async function getAllCoaches() {
  const res = await fetch(`${API_BASE}/api/gym/coaches`);
  return res.json();
}

// 2. Get single coach details (from gym.js)
export async function getCoachById(coachId: number) {
  const res = await fetch(`${API_BASE}/api/gym/coaches/${coachId}`);
  return res.json();
}

// 3. Get customer assignments (from assignments.js)
export async function getCustomerAssignments(customerId: number) {
  const res = await fetch(`${API_BASE}/api/gym/assignments/for-customer/${customerId}`);
  return res.json();
}

// 4. Get available coaches (from assignments.js - filters by member_id)
export async function getAvailableCoaches(memberId?: number) {
  let url = `${API_BASE}/api/gym/coaches/available`;
  if (memberId) url += `?member_id=${memberId}`;
  const res = await fetch(url);
  return res.json();
}

// 5. Assign coach
export async function assignCoach(coachId: number, memberId: number, notes?: string) {
  const res = await fetch(`${API_BASE}/api/gym/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coach_id: coachId,
      member_id: memberId,
      notes: notes || null,
    }),
  });
  return res.json();
}

// 6. Unassign coach
export async function unassignCoach(assignmentId: number) {
  const res = await fetch(`${API_BASE}/api/gym/assignments/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assignment_id: assignmentId,
    }),
  });
  return res.json();
}