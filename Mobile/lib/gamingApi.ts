const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.1.1.53:5000";

export async function startGamingSession(payload: any) {
  const res = await fetch(`${API_BASE}/api/gaming/sessions/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
