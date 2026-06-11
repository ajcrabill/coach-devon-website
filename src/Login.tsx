import { useState } from "react";
import { requestCode, verifyCode } from "./api";

export default function Login({ onAuthed }: { onAuthed: () => void }) {
  const [stage, setStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setBusy(true); setMsg(null);
    const r = await requestCode(email.trim());
    setBusy(false);
    setStage("code");
    setMsg(r.dev_code ? `Dev code: ${r.dev_code}` : "If that address is authorized, a code is on its way.");
  };

  const submit = async () => {
    setBusy(true); setMsg(null);
    const r = await verifyCode(email.trim(), code.trim());
    setBusy(false);
    if (r.ok) onAuthed();
    else setMsg(r.error || "Invalid code.");
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>Devon</div>
        <div style={s.tag}>Effective School Boards</div>
        {stage === "email" ? (
          <>
            <label style={s.label}>Sign in with your email</label>
            <input style={s.input} type="email" placeholder="you@effectiveschoolboards.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && email && sendCode()} autoFocus />
            <button style={s.btn} disabled={busy || !email} onClick={sendCode}>
              {busy ? "Sending…" : "Send me a code"}
            </button>
          </>
        ) : (
          <>
            <label style={s.label}>Enter the 6-digit code sent to {email}</label>
            <input style={{ ...s.input, letterSpacing: 6, fontSize: 22, textAlign: "center" }}
              inputMode="numeric" maxLength={6} placeholder="000000"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && submit()} autoFocus />
            <button style={s.btn} disabled={busy || code.length !== 6} onClick={submit}>
              {busy ? "Verifying…" : "Sign in"}
            </button>
            <button style={s.link} onClick={() => { setStage("email"); setCode(""); setMsg(null); }}>
              ← use a different email
            </button>
          </>
        )}
        {msg && <div style={s.msg}>{msg}</div>}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { minHeight: "100vh", background: "#0e1116", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "ui-sans-serif, system-ui, sans-serif" },
  card: { background: "#151a22", border: "1px solid #232a35", borderRadius: 14, padding: 36, width: 360 },
  logo: { fontSize: 30, fontWeight: 700, color: "#e6e9ef", letterSpacing: -0.5 },
  tag: { color: "#8b93a1", fontSize: 13, marginTop: 2, marginBottom: 26 },
  label: { display: "block", color: "#9aa3b2", fontSize: 13, marginBottom: 8 },
  input: { width: "100%", boxSizing: "border-box", background: "#0e1116", border: "1px solid #2b333f", color: "#e6e9ef", padding: "11px 13px", borderRadius: 9, fontSize: 15, outline: "none" },
  btn: { width: "100%", marginTop: 14, background: "#2b5bd7", border: "none", color: "#fff", padding: "11px", borderRadius: 9, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  link: { width: "100%", marginTop: 12, background: "none", border: "none", color: "#8b93a1", fontSize: 13, cursor: "pointer" },
  msg: { marginTop: 16, color: "#9aa3b2", fontSize: 13, textAlign: "center" },
};
