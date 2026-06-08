
const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.1.1.53:5000";

// PRODUCTS
export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/api/store/products`);
  return res.json();
}

// RESERVE (grouped reservation)
// IMPORTANT: send customer_id (backend will accept customer_id or user_id)
export async function reserveItems(
  customer_id: number,
  items: { product_id: number; quantity: number }[]
) {
  const res = await fetch(`${API_BASE}/api/store/reserve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer_id, items, fee_amount: 5 }),
  });
  return res.json();
}

// MY RESERVATIONS (grouped)
export async function fetchMyReservations(customerId: number) {
  const res = await fetch(`${API_BASE}/api/store/my-reservations/${customerId}`);
  return res.json();
}

// AI SUGGESTIONS (WEB / OLD)
export async function fetchAISuggestions(payload: any) {
  const res = await fetch(`${API_BASE}/api/store/ai-suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// AI SUGGESTIONS (MOBILE / NEW)
export async function fetchAISuggestionsMobile(payload: any) {
  const res = await fetch(`${API_BASE}/api/store/ai-suggestions/mobile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// BOOKINGS SUMMARY (sports + gaming + store + payments + totals)
export async function fetchBookingsSummary(customerId: number) {
  const res = await fetch(`${API_BASE}/api/bookings/summary/${customerId}`);
  return res.json();
}
