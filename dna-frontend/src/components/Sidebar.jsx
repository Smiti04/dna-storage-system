import { useNavigate, useLocation } from "react-router-dom";

const links = [
  { path: "/dashboard", label: "Dashboard", icon: "⬡" },
  { path: "/upload",    label: "Upload",    icon: "↑" },
  { path: "/files",     label: "My Files",  icon: "◈" },
  { path: "/retrieve",  label: "Retrieve",  icon: "↓" },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

  return (
    <aside style={{ width: "220px", minHeight: "100vh", background: "#0e0c18", borderRight: "1px solid #2a2440", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "24px 18px 20px", borderBottom: "1px solid #2a2440" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", letterSpacing: "2px", color: "#f0ecf8", fontFamily: "var(--font-display)" }}>
          <span style={{ color: "#a29bfe" }}>DNA</span> <span style={{ color: "#9a8fc0" }}>VAULT</span>
        </div>
        <div style={{ fontSize: "11px", color: "#9a8fc0", marginTop: "3px", letterSpacing: "1px", fontWeight: "500" }}>
          BIO-DIGITAL ARCHIVAL
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {links.map((l) => {
          const active = location.pathname === l.path;
          return (
            <button key={l.path} onClick={() => navigate(l.path)}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 14px", marginBottom: "2px", background: active ? "#1a1528" : "transparent", border: active ? "1px solid rgba(162,155,254,0.25)" : "1px solid transparent", borderRadius: "6px", color: active ? "#c4b5fd" : "#9a8fc0", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: active ? "600" : "500", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              onMouseOver={e => { if (!active) e.currentTarget.style.background = "#12101e"; }}
              onMouseOut={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: "14px", opacity: 0.7 }}>{l.icon}</span>
              {l.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "12px 8px", borderTop: "1px solid #2a2440" }}>
        <button onClick={handleLogout}
          style={{ width: "100%", padding: "9px", background: "transparent", border: "1px solid #2a2440", borderRadius: "6px", color: "#9a8fc0", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" }}
          onMouseOver={e => { e.target.style.borderColor = "#ef4444"; e.target.style.color = "#ef4444"; }}
          onMouseOut={e => { e.target.style.borderColor = "#2a2440"; e.target.style.color = "#9a8fc0"; }}>
          Log out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
