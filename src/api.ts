// Same-origin API (nginx proxies /api -> backend). Cookies carry the session.
const API = "/api";

export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  return res;
}

export async function getMe() {
  const r = await api("/auth/me");
  return r.ok ? r.json() : null;
}

export async function requestCode(email: string) {
  const r = await api("/auth/request", { method: "POST", body: JSON.stringify({ email }) });
  return r.json();
}

export async function verifyCode(email: string, code: string) {
  const r = await api("/auth/verify", { method: "POST", body: JSON.stringify({ email, code }) });
  return r.json();
}

export async function logout() {
  await api("/auth/logout", { method: "POST" });
}
