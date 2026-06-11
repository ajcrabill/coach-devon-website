import { useEffect, useState } from "react";
import { getMe, logout } from "./api";
import Login from "./Login";
import Crm from "./Crm";
import LeadGen from "./LeadGen";

type Me = { email: string; name: string; is_admin: boolean; features: string[] };

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"crm" | "leadgen">("crm");

  const refresh = () => getMe().then((m) => { setMe(m); setLoading(false); });
  useEffect(() => { refresh(); }, []);

  if (loading) return <div style={{ background: "#0e1116", minHeight: "100vh" }} />;
  if (!me) return <Login onAuthed={refresh} />;

  const tab = (v: "crm" | "leadgen", label: string) => (
    <button onClick={() => setView(v)} style={{ ...navBtn, ...(view === v ? navActive : {}) }}>{label}</button>
  );

  return (
    <div>
      <div style={bar}>
        <div style={{ display: "flex", gap: 6 }}>
          {tab("crm", "CRM")}
          {tab("leadgen", "Lead Review")}
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ color: "#8b93a1", fontSize: 13 }}>
            {me.email}{me.is_admin ? " · admin" : ""}
          </span>
          <button style={btn} onClick={() => logout().then(() => setMe(null))}>sign out</button>
        </div>
      </div>
      {view === "crm" ? <Crm /> : <LeadGen />}
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: "transparent", border: "1px solid transparent", color: "#8b93a1",
  padding: "5px 14px", borderRadius: 7, fontSize: 13, cursor: "pointer", fontWeight: 600,
};
const navActive: React.CSSProperties = { background: "#151a22", border: "1px solid #2b333f", color: "#e6e9ef" };

const bar: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14,
  background: "#0e1116", padding: "8px 36px", borderBottom: "1px solid #1a2029",
};
const btn: React.CSSProperties = {
  background: "#151a22", border: "1px solid #2b333f", color: "#e6e9ef",
  padding: "5px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer",
};
