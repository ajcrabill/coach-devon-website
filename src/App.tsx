import { useEffect, useState } from "react";
import { getMe, logout } from "./api";
import Login from "./Login";
import Crm from "./Crm";

type Me = { email: string; name: string; is_admin: boolean; features: string[] };

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => getMe().then((m) => { setMe(m); setLoading(false); });
  useEffect(() => { refresh(); }, []);

  if (loading) return <div style={{ background: "#0e1116", minHeight: "100vh" }} />;
  if (!me) return <Login onAuthed={refresh} />;

  return (
    <div>
      <div style={bar}>
        <span style={{ color: "#8b93a1", fontSize: 13 }}>
          {me.email}{me.is_admin ? " · admin" : ""}
        </span>
        <button style={btn} onClick={() => logout().then(() => setMe(null))}>sign out</button>
      </div>
      <Crm />
    </div>
  );
}

const bar: React.CSSProperties = {
  display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14,
  background: "#0e1116", padding: "8px 36px", borderBottom: "1px solid #1a2029",
};
const btn: React.CSSProperties = {
  background: "#151a22", border: "1px solid #2b333f", color: "#e6e9ef",
  padding: "5px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer",
};
