import { useEffect, useState } from "react";
import { api } from "./api";

type Stats = {
  districts: number; people: number; superintendents: number;
  board_members: number; emails: number; states: number;
  by_band: Record<string, number>;
};
type DistrictRow = {
  id: string; name: string; state: string; city: string;
  enrollment: number | null; band: string; cgcs_member: boolean | null;
  website: string; people_count: number;
};
type Email = { email: string; status: string; source: string; last_checked: string | null };
type PersonD = { id: string; role: string; name: string; title: string; status: string; subscriber: boolean; last_seen_at: string | null; departed_at: string | null; emails: Email[] };
type DistrictD = DistrictRow & {
  nces_lea_id: string | null; zip: string; street: string; phone: string;
  county: string; locale: string; district_type: string; operational_schools: number | null;
  source: string; people: PersonD[];
};

const BANDS = ["10k+", "5k-10k", "1k-5k", "500-1k", "<500"];

export default function Crm() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<DistrictRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [band, setBand] = useState("");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<DistrictD | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api(`/crm/stats`).then(r => r.json()).then(setStats).catch(e => setErr(String(e))); }, []);

  useEffect(() => {
    const p = new URLSearchParams({ page: String(page), page_size: "50" });
    if (q) p.set("q", q); if (state) p.set("state", state); if (band) p.set("band", band);
    api(`/crm/districts?${p}`).then(r => r.json()).then(d => { setRows(d.districts); setTotal(d.total); }).catch(e => setErr(String(e)));
  }, [q, state, band, page]);

  const openDistrict = (id: string) =>
    api(`/crm/districts/${id}`).then(r => r.json()).then(setSel);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div><h1 style={s.h1}>Devon</h1><div style={s.sub}>Effective School Boards — CRM</div></div>
        {stats && (
          <div style={s.stats}>
            <Stat n={stats.districts} l="districts" />
            <Stat n={stats.superintendents} l="superintendents" />
            <Stat n={stats.board_members} l="board members" />
            <Stat n={stats.emails} l="emails" />
            <Stat n={stats.states} l="states" />
          </div>
        )}
      </header>

      {err && <div style={s.err}>Backend error: {err}</div>}

      <div style={s.controls}>
        <input style={s.input} placeholder="Search district or city…" value={q}
          onChange={e => { setQ(e.target.value); setPage(1); }} />
        <input style={{ ...s.input, width: 70 }} placeholder="ST" maxLength={2} value={state}
          onChange={e => { setState(e.target.value.toUpperCase()); setPage(1); }} />
        <select style={s.input} value={band} onChange={e => { setBand(e.target.value); setPage(1); }}>
          <option value="">all sizes</option>
          {BANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <div style={s.count}>{total.toLocaleString()} matches</div>
      </div>

      <table style={s.table}>
        <thead>
          <tr style={s.tr}><Th>District</Th><Th>ST</Th><Th>City</Th><Th right>Enrollment</Th><Th>Band</Th><Th>CGCS</Th><Th right>People</Th></tr>
        </thead>
        <tbody>
          {rows.map(d => (
            <tr key={d.id} style={s.row} onClick={() => openDistrict(d.id)}>
              <td style={s.td}>{d.name}</td><td style={s.td}>{d.state}</td><td style={s.td}>{d.city}</td>
              <td style={{ ...s.td, textAlign: "right" }}>{d.enrollment?.toLocaleString() ?? "—"}</td>
              <td style={s.td}>{d.band || "—"}</td>
              <td style={s.td}>{d.cgcs_member ? "✓" : ""}</td>
              <td style={{ ...s.td, textAlign: "right" }}>{d.people_count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={s.pager}>
        <button style={s.btn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ prev</button>
        <span style={s.dim}>page {page} of {Math.max(1, Math.ceil(total / 50))}</span>
        <button style={s.btn} disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>next ›</button>
      </div>

      {sel && (
        <div style={s.overlay} onClick={() => setSel(null)}>
          <div style={s.drawer} onClick={e => e.stopPropagation()}>
            <div style={s.drawerHead}>
              <div><h2 style={s.h2}>{sel.name}</h2>
                <div style={s.dim}>{sel.city}, {sel.state} {sel.zip} · {sel.county || "—"}</div></div>
              <button style={s.close} onClick={() => setSel(null)}>✕</button>
            </div>
            <div style={s.meta}>
              <M l="Enrollment" v={sel.enrollment?.toLocaleString() ?? "—"} />
              <M l="Band" v={sel.band || "—"} />
              <M l="Schools" v={String(sel.operational_schools ?? "—")} />
              <M l="CGCS" v={sel.cgcs_member ? "Yes" : "No"} />
              <M l="Type" v={sel.district_type || "—"} />
              <M l="NCES" v={sel.nces_lea_id || "—"} />
            </div>
            {sel.website && <a style={s.link} href={sel.website.startsWith("http") ? sel.website : `http://${sel.website}`} target="_blank">{sel.website}</a>}
            <h3 style={s.h3}>People ({sel.people.filter(p => p.status !== "former").length} current
              {sel.people.some(p => p.status === "former") && <span style={s.dim}> · {sel.people.filter(p => p.status === "former").length} former</span>})</h3>
            {sel.people.map(p => {
              const e0 = p.emails[0];
              const verified = e0 && (e0.status === "verified");
              return (
              <div key={p.id} style={{ ...s.person, opacity: p.status === "former" ? 0.45 : 1 }}>
                <span style={p.role === "superintendent" ? s.supt : s.boardTag}>{p.role === "superintendent" ? "SUPT" : "BOARD"}</span>
                <span style={s.pname}>
                  {p.name}
                  {p.status === "former" && <span style={s.former}>FORMER</span>}
                  {p.subscriber && <span style={s.subBadge}>SUBSCRIBER</span>}
                </span>
                <span style={s.pemail}>
                  {p.emails.map(e => e.email).join(", ") || <em style={s.dim}>no email</em>}
                  {e0 && <span style={verified ? s.vok : s.vmx}>
                    {verified ? "site-verified" : e0.status}
                    {e0.last_checked ? ` · ${e0.last_checked.slice(0, 10)}` : " · never checked"}
                  </span>}
                </span>
              </div>
            ); })}
          </div>
        </div>
      )}
    </div>
  );
}

const Stat = ({ n, l }: { n: number; l: string }) =>
  <div style={s.stat}><div style={s.statN}>{n?.toLocaleString()}</div><div style={s.statL}>{l}</div></div>;
const Th = ({ children, right }: { children: React.ReactNode; right?: boolean }) =>
  <th style={{ ...s.th, textAlign: right ? "right" : "left" }}>{children}</th>;
const M = ({ l, v }: { l: string; v: string }) =>
  <div><div style={s.mLabel}>{l}</div><div style={s.mVal}>{v}</div></div>;

const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "ui-sans-serif, system-ui, sans-serif", background: "#0e1116", color: "#e6e9ef", minHeight: "100vh", padding: "28px 36px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #232a35", paddingBottom: 18 },
  h1: { margin: 0, fontSize: 26, letterSpacing: -0.5 }, sub: { color: "#8b93a1", fontSize: 13, marginTop: 3 },
  stats: { display: "flex", gap: 26 },
  stat: { textAlign: "right" }, statN: { fontSize: 20, fontWeight: 700 }, statL: { fontSize: 11, color: "#8b93a1" },
  err: { background: "#3a1417", border: "1px solid #6b2330", color: "#ffb3bd", padding: "10px 14px", borderRadius: 8, marginTop: 16, fontSize: 13 },
  controls: { display: "flex", gap: 10, alignItems: "center", marginTop: 20 },
  input: { background: "#151a22", border: "1px solid #2b333f", color: "#e6e9ef", padding: "9px 12px", borderRadius: 8, fontSize: 14, outline: "none" },
  count: { marginLeft: "auto", color: "#8b93a1", fontSize: 13 },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 13 },
  tr: { borderBottom: "1px solid #232a35" },
  th: { color: "#8b93a1", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, padding: "8px 10px" },
  row: { borderBottom: "1px solid #1a2029", cursor: "pointer" },
  td: { padding: "9px 10px" },
  pager: { display: "flex", gap: 14, alignItems: "center", justifyContent: "center", marginTop: 18 },
  btn: { background: "#151a22", border: "1px solid #2b333f", color: "#e6e9ef", padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  dim: { color: "#5b6472", fontSize: 12 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "flex-end" },
  drawer: { width: 560, maxWidth: "92vw", height: "100%", background: "#11151c", borderLeft: "1px solid #232a35", padding: 28, overflowY: "auto" },
  drawerHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  h2: { margin: 0, fontSize: 20 }, h3: { fontSize: 13, textTransform: "uppercase", color: "#8b93a1", letterSpacing: 0.5, marginTop: 24 },
  close: { background: "none", border: "none", color: "#8b93a1", fontSize: 18, cursor: "pointer" },
  meta: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 18 },
  mLabel: { fontSize: 11, color: "#5b6472", textTransform: "uppercase" }, mVal: { fontSize: 14, marginTop: 2 },
  link: { display: "inline-block", marginTop: 14, color: "#5ea0ff", fontSize: 13 },
  person: { display: "grid", gridTemplateColumns: "58px 1fr", gap: 10, alignItems: "baseline", padding: "8px 0", borderBottom: "1px solid #1a2029" },
  supt: { background: "#1d3a2a", color: "#7ee2a8", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700, textAlign: "center" },
  boardTag: { background: "#1f2a3a", color: "#8fb6ff", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 700, textAlign: "center" },
  pname: { fontSize: 14 }, pemail: { gridColumn: "2", fontSize: 12, color: "#9aa3b2", fontFamily: "ui-monospace, monospace" },
  former: { marginLeft: 8, fontSize: 9, fontWeight: 700, color: "#e0a458", background: "#3a2a14", padding: "1px 5px", borderRadius: 3, letterSpacing: 0.5 },
  subBadge: { marginLeft: 8, fontSize: 9, fontWeight: 700, color: "#7ee2a8", background: "#15301f", padding: "1px 5px", borderRadius: 3, letterSpacing: 0.5 },
  vok: { display: "block", marginTop: 2, fontSize: 10, color: "#7ee2a8" },
  vmx: { display: "block", marginTop: 2, fontSize: 10, color: "#5b6472" },
};
