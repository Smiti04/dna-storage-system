// src/components/Sidebar.jsx
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <aside style={{
      width: "240px", minHeight: "100vh", background: "#ffffff",
      borderRight: "1px solid #e2e8f0", display: "flex",
      flexDirection: "column", padding: "0", flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.3px" }}>
          DNA Store
        </div>
        <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px", fontWeight: "400" }}>
          Bio-Digital Storage
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {links.map((l) => {
          const active = location.pathname === l.path;
          return (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                width: "100%", padding: "10px 14px", marginBottom: "2px",
                background: active ? "#eff6ff" : "transparent",
                border: "none",
                borderRadius: "8px", color: active ? "#2563eb" : "#475569",
                fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: active ? "600" : "400",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
              onMouseOver={e => { if (!active) { e.currentTarget.style.background = "#f8fafc"; } }}
              onMouseOut={e => { if (!active) { e.currentTarget.style.background = "transparent"; } }}
            >
              <span style={{ fontSize: "15px", opacity: 0.7 }}>{l.icon}</span>
              {l.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid #e2e8f0" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "10px", background: "transparent",
            border: "1px solid #e2e8f0", borderRadius: "8px",
            color: "#94a3b8", fontFamily: "var(--font-body)", fontSize: "13px",
            fontWeight: "500", cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseOver={e => { e.target.style.borderColor = "#ef4444"; e.target.style.color = "#ef4444"; }}
          onMouseOut={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.color = "#94a3b8"; }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
