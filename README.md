# coach-devon-website

Frontend for **Devon** (Effective School Boards' CRM). React/Vite SPA with email-OTP
login, served at https://devon.effectiveschoolboards.com via the backend's nginx +
the host Traefik (auto-TLS). Talks to the `coach-devon` API at same-origin `/api`.

```bash
npm install && npm run dev      # dev (proxies /api -> :8090)
npm run build                   # static build (served by nginx in the container)
```
