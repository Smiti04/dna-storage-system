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
      width: "220px", minHeight: "100vh", background: "#060d1a",
      borderRight: "1px solid #1e293b", display: "flex",
      flexDirection: "column", padding: "0", flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "13px", color: "var(--neon-green)", letterSpacing: "3px" }}>
          DNA//STORE
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
          BIO-DIGITAL STORAGE
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {links.map((l) => {
          const active = location.pathname === l.path;
          return (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                width: "100%", padding: "11px 14px", marginBottom: "4px",
                background: active ? "rgba(0,255,136,0.08)" : "transparent",
                border: active ? "1px solid rgba(0,255,136,0.3)" : "1px solid transparent",
                borderRadius: "6px", color: active ? "var(--neon-green)" : "var(--text-secondary)",
                fontFamily: "var(--font-mono)", fontSize: "12px", letterSpacing: "1px",
                cursor: "pointer", textAlign: "left", transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "16px" }}>{l.icon}</span>
              {l.label.toUpperCase()}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid #1e293b" }}>
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "10px", background: "transparent",
            border: "1px solid #334155", borderRadius: "6px",
            color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "11px",
            letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseOver={e => { e.target.style.borderColor = "#ef4444"; e.target.style.color = "#ef4444"; }}
          onMouseOut={e => { e.target.style.borderColor = "#334155"; e.target.style.color = "#64748b"; }}
        >
          ⏻ LOGOUT
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;