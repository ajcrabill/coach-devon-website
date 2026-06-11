import { useEffect, useState } from "react";
import { api } from "./api";

type Draft = {
  id: string; to: string; name: string; role: string; district: string; state: string;
  subject: string; body: string; rationale: string;
};
type Queue = { pending: number; drafts: Draft[]; send_ready: boolean; postal_address_set: boolean };

export default function LeadGen() {
  const [q, setQ] = useState<Queue | null>(null);
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [intent, setIntent] = useState<"training" | "instruction">("training");

  const load = () => api("/leadgen/queue").then(r => r.json()).then((d) => { setQ(d); setI(0); });
  useEffect(() => { load(); }, []);

  const cur = q?.drafts[i];
  const next = () => { setDeclining(false); setReason(""); setIntent("training"); setI(i + 1); setMsg(null); };

  const approve = async () => {
    if (!cur) return;
    setBusy(true); setMsg(null);
    const r = await api(`/leadgen/${cur.id}/approve`, { method: "POST" }).then(r => r.json());
    setBusy(false);
    if (r.sent) { setMsg(`✓ Sent to ${r.to}`); setTimeout(next, 700); }
    else setMsg(`Blocked: ${r.reason || r.error || "unknown"}`);
  };

  const decline = async () => {
    if (!cur) return;
    setBusy(true);
    await api(`/leadgen/${cur.id}/decline`, { method: "POST", body: JSON.stringify({ reason, intent }) });
    setBusy(false); next();
  };

  const generate = async () => { setBusy(true); await api("/leadgen/generate?count=5", { method: "POST" }); setBusy(false); load(); };

  if (!q) return <div style={s.page}>Loading…</div>;

  return (
    <div style={s.page}>
      <div style={s.head}>
        <div><h1 style={s.h1}>Lead Review</h1>
          <div style={s.sub}>{q.pending} drafts awaiting your decision</div></div>
        <button style={s.gen} onClick={generate} disabled={busy}>Generate more</button>
      </div>

      {!q.postal_address_set &&
        <div style={s.warn}>⚠ Sending is blocked until ESB_POSTAL_ADDRESS is set (legally required in every email). You can still review &amp; decline.</div>}

      {!cur && <div style={s.done}>No more drafts in the queue. {q.pending === 0 ? "All caught up." : ""}</div>}

      {cur && (
        <div style={s.card}>
          <div style={s.to}>
            <div>
              <span style={cur.role === "superintendent" ? s.supt : s.board}>{cur.role === "superintendent" ? "SUPT" : "BOARD"}</span>
              <span style={s.name}>{cur.name}</span>
              <span style={s.dist}> · {cur.district}, {cur.state}</span>
            </div>
            <div style={s.email}>{cur.to}</div>
          </div>
          {cur.rationale && <div style={s.why}><b>Why now:</b> {cur.rationale}</div>}
          <div style={s.subj}>{cur.subject}</div>
          <pre style={s.body}>{cur.body}</pre>

          {msg && <div style={msg.startsWith("✓") ? s.ok : s.err}>{msg}</div>}

          {!declining ? (
            <div style={s.actions}>
              <button style={s.approve} onClick={approve} disabled={busy || !q.send_ready}>
                ✓ Approve &amp; send
              </button>
              <button style={s.declineBtn} onClick={() => setDeclining(true)} disabled={busy}>✕ Decline</button>
              <span style={s.counter}>{i + 1} of {q.drafts.length} loaded</span>
            </div>
          ) : (
            <div style={s.declineBox}>
              <textarea style={s.ta} placeholder="Why are you declining? (the AI reads this)"
                value={reason} onChange={e => setReason(e.target.value)} rows={3} />
              <div style={s.intentRow}>
                <label style={s.radio}><input type="radio" checked={intent === "training"} onChange={() => setIntent("training")} /> Training (learn my taste)</label>
                <label style={s.radio}><input type="radio" checked={intent === "instruction"} onChange={() => setIntent("instruction")} /> Instruction (a rule for all future drafts)</label>
              </div>
              <div style={s.actions}>
                <button style={s.declineBtn} onClick={decline} disabled={busy}>Submit decline</button>
                <button style={s.cancel} onClick={() => setDeclining(false)}>cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "ui-sans-serif, system-ui, sans-serif", background: "#0e1116", color: "#e6e9ef", minHeight: "100vh", padding: "28px 36px" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #232a35", paddingBottom: 16 },
  h1: { margin: 0, fontSize: 26 }, sub: { color: "#8b93a1", fontSize: 13, marginTop: 3 },
  gen: { background: "#151a22", border: "1px solid #2b333f", color: "#e6e9ef", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  warn: { background: "#3a2a14", border: "1px solid #6b4e23", color: "#e0c08a", padding: "10px 14px", borderRadius: 8, marginTop: 16, fontSize: 13 },
  done: { color: "#8b93a1", marginTop: 40, textAlign: "center", fontSize: 15 },
  card: { background: "#11151c", border: "1px solid #232a35", borderRadius: 12, padding: 24, marginTop: 20, maxWidth: 760 },
  to: { display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid #232a35", paddingBottom: 12 },
  supt: { background: "#1d3a2a", color: "#7ee2a8", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700, marginRight: 8 },
  board: { background: "#1f2a3a", color: "#8fb6ff", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700, marginRight: 8 },
  name: { fontSize: 16, fontWeight: 600 }, dist: { color: "#8b93a1", fontSize: 14 },
  email: { color: "#9aa3b2", fontSize: 12, fontFamily: "ui-monospace, monospace" },
  why: { background: "#15202e", borderLeft: "3px solid #3a6ea5", padding: "8px 12px", margin: "14px 0", fontSize: 13, color: "#bcd0e6", borderRadius: 4 },
  subj: { fontWeight: 700, fontSize: 15, marginTop: 8 },
  body: { whiteSpace: "pre-wrap", fontFamily: "ui-sans-serif, system-ui", fontSize: 14, lineHeight: 1.55, color: "#d4d9e2", marginTop: 10, background: "#0e1116", padding: 16, borderRadius: 8, border: "1px solid #1a2029" },
  actions: { display: "flex", gap: 10, alignItems: "center", marginTop: 16 },
  approve: { background: "#1d6b3f", border: "none", color: "#fff", padding: "10px 18px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  declineBtn: { background: "#5a1d22", border: "none", color: "#ffb3bd", padding: "10px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  cancel: { background: "transparent", border: "none", color: "#8b93a1", cursor: "pointer", fontSize: 13 },
  counter: { marginLeft: "auto", color: "#5b6472", fontSize: 12 },
  declineBox: { marginTop: 14 },
  ta: { width: "100%", background: "#0e1116", border: "1px solid #2b333f", color: "#e6e9ef", borderRadius: 8, padding: 10, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" },
  intentRow: { display: "flex", gap: 18, margin: "10px 0", fontSize: 13, color: "#bcc4d0" },
  radio: { display: "flex", gap: 6, alignItems: "center", cursor: "pointer" },
  ok: { color: "#7ee2a8", marginTop: 12, fontSize: 13 },
  err: { color: "#ffb3bd", marginTop: 12, fontSize: 13 },
};
