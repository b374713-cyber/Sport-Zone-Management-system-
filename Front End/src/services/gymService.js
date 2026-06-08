// Front_end/snp/src/services/gymService.js

const BASE = 'http://localhost:5000/api/gym';

async function jsonOrError(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

// ===========================
// ACTIVE SUBSCRIPTIONS
// ===========================
async function listSubscriptions() {
  const res = await fetch(`${BASE}/subscriptions`);
  const data = await jsonOrError(res);
  return data.subscriptions || [];
}

async function createSubscription(payload) {
  const res = await fetch(`${BASE}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return jsonOrError(res); // { subscription, member }
}

async function updateSubscription(id, payload) {
  const res = await fetch(`${BASE}/subscriptions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return jsonOrError(res);
}

async function deleteSubscription(id) {
  const res = await fetch(`${BASE}/subscriptions/${id}`, {
    method: 'DELETE'
  });
  return jsonOrError(res);
}

// ===========================
// CUSTOMERS (for dropdown)
// GET /api/gym/customers
// ===========================
async function listCustomers() {
  const res = await fetch(`${BASE}/customers`);
  const data = await jsonOrError(res);
  return data.customers || [];
}

// ===========================
// PENDING SUBSCRIPTIONS
// GET /api/gym/subscriptions/pending
// ===========================
async function listPendingSubscriptions() {
  const res = await fetch(`${BASE}/subscriptions/pending`);
  const data = await jsonOrError(res);
  return data.subscriptions || [];
}

// ===========================
// APPROVE PENDING -> ACTIVE
// PATCH /api/gym/subscriptions/:id/approve
// ===========================
async function approveSubscription(id) {
  const res = await fetch(`${BASE}/subscriptions/${id}/approve`, {
    method: 'PATCH'
  });
  return jsonOrError(res); // { message: ... }
}

// ===========================
// ✅ NEW: GET SUBSCRIBERS WITH WEEKLY PLANS
// GET /api/gym/subscribers/weekly-plans
// ===========================
async function listSubscribersWithPlans() {
  try {
    const res = await fetch(`${BASE}/subscribers/weekly-plans`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return data.subscribers || [];
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return [];
  }
}

// ===========================
// ✅ NEW: SEND REMINDER TO CUSTOMER
// POST /api/gym/subscribers/send-reminder
// ===========================
async function sendReminderToCustomer(customerId, message = "Don't forget your gym session today! 💪") {
  try {
    const res = await fetch(`${BASE}/subscribers/send-reminder`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        customer_id: customerId, 
        message: message
      })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }
    
    return data;
  } catch (error) {
    console.error("Error sending reminder:", error);
    throw error;
  }
}

// ===========================
// ✅ NEW: GET PUSH TOKENS
// GET /api/gym/subscribers/push-tokens
// ===========================
async function listPushTokens() {
  try {
    const res = await fetch(`${BASE}/subscribers/push-tokens`);
    const data = await res.json();
    return data.push_tokens || [];
  } catch (error) {
    console.error("Error fetching push tokens:", error);
    return [];
  }
}

// ===========================
// ✅ NEW: SEND DIRECT REMINDER (legacy endpoint)
// POST /api/gym/remind
// ===========================
async function sendDirectReminder(customerId, title, body) {
  const res = await fetch(`${BASE}/remind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      customer_id: customerId,
      title: title || "🏋️ Gym Reminder",
      body: body || "Don't forget your gym session today!"
    })
  });
  return jsonOrError(res);
}

export default {
  // old
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,

  // customers & pending
  listCustomers,
  listPendingSubscriptions,
  approveSubscription,

  // new - subscribers & reminders
  listSubscribersWithPlans,
  sendReminderToCustomer,
  listPushTokens,
  sendDirectReminder
};