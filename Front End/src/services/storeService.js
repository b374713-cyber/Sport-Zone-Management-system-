// // Front_end/snp/src/services/storeService.js
// import axios from "axios";

// const client = axios.create({
//   baseURL: "http://localhost:5000",
// });

// // ------------------- Helpers -------------------
// export const resolveImageUrl = (path) => {
//   if (!path) return "";
//   if (path.startsWith("http://") || path.startsWith("https://")) return path;
//   return `${client.defaults.baseURL}${path}`;
// };

// // ------------------- Upload -------------------
// export const uploadProductImage = async (file) => {
//   const formData = new FormData();
//   formData.append("image", file);

//   const res = await client.post("/api/store/upload", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
//   return res.data;
// };

// // ------------------- AI Suggestions -------------------
// export const getAISuggestions = async (payload) => {
//   const res = await client.post("/api/store/ai-suggestions", payload);
//   return res.data;
// };

// // ------------------- Products -------------------
// export const getProducts = async (filters = {}) => {
//   // ✅ Only send filters that have values
//   const cleaned = {};
//   Object.entries(filters || {}).forEach(([k, v]) => {
//     if (v === undefined || v === null) return;
//     const s = String(v).trim();
//     if (s === "") return;
//     cleaned[k] = s;
//   });

//   const params = new URLSearchParams(cleaned).toString();
//   const url = `/api/store/products${params ? `?${params}` : ""}`;

//   const res = await client.get(url);
//   return res.data;
// };

// export const addProduct = async (payload) => {
//   const res = await client.post("/api/store/products", payload);
//   return res.data;
// };

// export const updateProduct = async (id, payload) => {
//   const res = await client.put(`/api/store/products/${id}`, payload);
//   return res.data;
// };

// export const deleteProduct = async (id) => {
//   const res = await client.delete(`/api/store/products/${id}`);
//   return res.data;
// };

// export const stockIn = async (product_id, quantity) => {
//   const res = await client.post(`/api/store/products/${product_id}/stock-in`, {
//     quantity,
//   });
//   return res.data;
// };

// export const stockOut = async (product_id, quantity) => {
//   const res = await client.post(`/api/store/products/${product_id}/stock-out`, {
//     quantity,
//   });
//   return res.data;
// };

// // ------------------- Reservations -------------------
// export const getReservations = async (view = "reserved") => {
//   const qs = view ? `?view=${encodeURIComponent(view)}` : "";
//   const res = await client.get(`/api/store/reservations${qs}`);
//   return res.data;
// };

// export const confirmReservationByCode = async (code) => {
//   const res = await client.post(`/api/store/reservations/confirm-by-code`, {
//     code,
//   });
//   return res.data;
// };

// export const confirmReservationById = async (id) => {
//   const res = await client.post(`/api/store/reservations/${id}/confirm`);
//   return res.data;
// };

// export const expireReservationsManual = async () => {
//   const res = await client.put("/api/store/reservations/expire");
//   return res.data;
// };

// Front_end/snp/src/services/storeService.js
import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:5000",
});

// ------------------- Helpers -------------------
export const resolveImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${client.defaults.baseURL}${path}`;
};

// ------------------- Store Stats -------------------
export const getStoreStats = async () => {
  const res = await client.get("/api/store/stats");
  return res.data; // Returns { storeSales: number, totals: {...} }
};

// ------------------- Upload -------------------
export const uploadProductImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const res = await client.post("/api/store/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ------------------- AI Suggestions -------------------
export const getAISuggestions = async (payload) => {
  const res = await client.post("/api/store/ai-suggestions", payload);
  return res.data;
};

// ------------------- Products -------------------
export const getProducts = async (filters = {}) => {
  // ✅ Only send filters that have values
  const cleaned = {};
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (s === "") return;
    cleaned[k] = s;
  });

  const params = new URLSearchParams(cleaned).toString();
  const url = `/api/store/products${params ? `?${params}` : ""}`;

  const res = await client.get(url);
  return res.data;
};

export const addProduct = async (payload) => {
  const res = await client.post("/api/store/products", payload);
  return res.data;
};

export const updateProduct = async (id, payload) => {
  const res = await client.put(`/api/store/products/${id}`, payload);
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await client.delete(`/api/store/products/${id}`);
  return res.data;
};

export const stockIn = async (product_id, quantity) => {
  const res = await client.post(`/api/store/products/${product_id}/stock-in`, {
    quantity,
  });
  return res.data;
};

export const stockOut = async (product_id, quantity) => {
  const res = await client.post(`/api/store/products/${product_id}/stock-out`, {
    quantity,
  });
  return res.data;
};

// ------------------- Reservations -------------------
export const getReservations = async (view = "reserved") => {
  const qs = view ? `?view=${encodeURIComponent(view)}` : "";
  const res = await client.get(`/api/store/reservations${qs}`);
  return res.data;
};

export const confirmReservationByCode = async (code) => {
  const res = await client.post(`/api/store/reservations/confirm-by-code`, {
    code,
  });
  return res.data;
};

export const confirmReservationById = async (id) => {
  const res = await client.post(`/api/store/reservations/${id}/confirm`);
  return res.data;
};

export const expireReservationsManual = async () => {
  const res = await client.put("/api/store/reservations/expire");
  return res.data;
};