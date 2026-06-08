// app/config/api.ts
const base = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!base) {
  throw new Error("Missing EXPO_PUBLIC_API_BASE_URL in .env");
}

// remove trailing slashes (optional)
export const API_BASE: string = base.replace(/\/+$/, "");
