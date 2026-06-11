// Devon API over Tailscale Funnel (public HTTPS). Auth is a bearer token kept in
// localStorage — no cross-site cookies, so it works from the GitHub Pages origin.
const API = "https://esbcloud.taild49f53.ts.net:8443";
const TOKEN_KEY = "devon_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function api(path: string, opts: RequestInit = {}) {
  const t = getToken();
  return fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(opts.headers || {}),
    },
    ...opts,
  });
}

export async function getMe() {
  if (!getToken()) return null;
  const r = await api("/auth/me");
  return r.ok ? r.json() : null;
}

export async function requestCode(email: string) {
  const r = await api("/auth/request", { method: "POST", body: JSON.stringify({ email }) });
  return r.json();
}

export async function verifyCode(email: string, code: string) {
  const r = await api("/auth/verify", { method: "POST", body: JSON.stringify({ email, code }) });
  const data = await r.json();
  if (data.ok && data.token) setToken(data.token);
  return data;
}

export async function logout() {
  clearToken();
}
