// Front_end/snp/src/services/aiService.js
import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:5000", // نفس الباك
});

export const getAISuggestions = async (payload) => {
  const res = await client.post("/api/ai/suggest", payload);
  return res.data; 
};
