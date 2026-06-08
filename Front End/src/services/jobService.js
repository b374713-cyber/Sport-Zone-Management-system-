// Front_end/snp/src/services/idCardsService.js
const BASE = "http://10.1.1.53:5000/api/idcards";   // ✅ phone can reach this

async function generate(payload, opts = {}) {
  const { force = false } = opts;
  const body = { ...payload, force };

  const res = await fetch(`${BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(
      data.message || data.error || "Failed to generate ID card"
    );
    if (data.error) err.code = data.error;
    if (data.card) err.card = data.card;
    throw err;
  }

  return data; // { card: {...} }
}

function publicUrl(token) {
  return `${BASE}/public/${token}`;
}

async function getById(id) {
  const res = await fetch(`${BASE}/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Not found");
  return data;
}

export default { generate, publicUrl, getById };
