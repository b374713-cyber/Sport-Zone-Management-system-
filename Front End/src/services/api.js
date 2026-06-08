import axios from "axios";

// .env:
// REACT_APP_API_URL=https://xxxx.ngrok-free.dev

const envRoot = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

// If you're running the web app locally, keep using localhost backend (stable for dev)
const isLocalWeb =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const ROOT = isLocalWeb
  ? "http://localhost:5000"
  : envRoot || "http://localhost:5000";

const API_BASE_URL = `${ROOT}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to all requests automatically
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

// Optional exports (sometimes useful)
export const API_ROOT = ROOT;
export const API_URL = API_BASE_URL;
