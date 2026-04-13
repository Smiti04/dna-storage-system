import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getUserFiles, changePassword, extractError } from "../services/api";

function EyeIcon({ show }) {
  return show ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showC, setShowC] = useState(false); const [showN, setShowN] = useState(false); const [showCf, setShowCf] = useState(false);
  const [pwError, setPwError] = useState(""); const [pwSuccess, setPwSuccess] = useState(""); const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => { getUserFiles().then(r => setFiles(r.data.files)).catch(() => {}); }, []);

  const handleChangePw = async () => {
    setPwError(""); setPwSuccess("");
    if (!pwForm.current) { setPwError("Current password required"); return; }
    if (!pwForm.newPw) { setPwError("New password required"); return; }
    if (!pwForm.confirm) { setPwError("Confirm your password"); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError("Passwords do not match"); return; }
    if (pwForm.newPw === pwForm.current) { setPwError("Must be different from current"); return; }
    if (pwForm.newPw.length < 8 || !/[A-Z]/.test(pwForm.newPw) || !/\d/.test(pwForm.newPw) || !/[^a-zA-Z0-9]/.test(pwForm.newPw)) { setPwError("8+ chars, uppercase, number, special char"); return; }
    setPwLoading(true);
    try { await changePassword(pwForm.current, pwForm.newPw); setPwSuccess("Password changed"); setPwForm({ current:"", newPw:"", confirm:"" }); setTimeout(() => { setShowPw(false); setPwSuccess(""); }, 2000); }
    catch (err) { setPwError(extractError(err, "Failed")); }
    setPwLoading(false);
  };

  const actions = [
    { label: "Upload File", sub: "Encode & store in DNA", icon: "↑", path: "/upload", color: "#a29bfe", bg: "#1a1528" },
    { label: "My Files", sub: "View stored files", icon: "◈", path: "/files", color: "#48dbfb", bg: "#0c1a22" },
    { label: "Retrieve", sub: "Decode & download", icon: "↓", path: "/retrieve", color: "#f0932b", bg: "#1a1210" },
  ];

  const label = { display: "block", fontSize: "13px", fontWeight: "500", color: "#5a5078", marginBottom: "6px" };
  const eyeBtn = { position: "absolute", right: "12px", background: "transparent", border: "none", color: "#3a3458", cursor: "pointer", padding: "0" };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Welcome to DNA Vault — archiving data in living molecules</div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          {[["Files stored", files.length, "#a29bfe"], ["System status", "Online", "#22c55e"], ["Encoding", "DNA", "#48dbfb"]].map(([l, v, c]) => (
            <div key={l} className="card" style={{ flex: 1, minWidth: "150px" }}>
              <div style={{ fontSize: "11px", color: "#3a3458", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "6px" }}>{l}</div>
              <div style={{ fontSize: "24px", fontWeight: "600", color: c }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: "11px", color: "#3a3458", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Quick actions</div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
          {actions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              style={{ flex: 1, minWidth: "180px", padding: "18px", background: "#12101e", border: "1px solid #1e1a2e", borderRadius: "8px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              onMouseOver={e => e.currentTarget.style.borderColor = a.color + "55"}
              onMouseOut={e => e.currentTarget.style.borderColor = "#1e1a2e"}>
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: a.color, marginBottom: "10px" }}>{a.icon}</div>
              <div style={{ fontSize: "14px", fontWeight: "500", color: "#e0daf0", marginBottom: "3px" }}>{a.label}</div>
              <div style={{ fontSize: "12px", color: "#3a3458" }}>{a.sub}</div>
            </button>
          ))}
        </div>

        {files.length > 0 && (
          <>
            <div style={{ fontSize: "11px", color: "#3a3458", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Recent files</div>
            <div className="card" style={{ marginBottom: "28px" }}>
              {files.slice(0, 5).map((f, i) => (
                <div key={f.file_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < Math.min(files.length, 5) - 1 ? "1px solid #1e1a2e" : "none" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "#e0daf0" }}>{f.filename}</div>
                    <div style={{ fontSize: "11px", color: "#3a3458", fontFamily: "var(--font-mono)", marginTop: "1px" }}>{f.file_id}</div>
                  </div>
                  <button className="btn-primary" style={{ padding: "5px 12px", fontSize: "11px" }} onClick={() => navigate("/files")}>View</button>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ fontSize: "11px", color: "#3a3458", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Account</div>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "500", color: "#e0daf0" }}>Change Password</div>
              <div style={{ fontSize: "12px", color: "#3a3458" }}>Update your account password</div>
            </div>
            <button className="btn-primary" style={{ padding: "7px 14px", fontSize: "12px", background: showPw ? "#5a5078" : undefined }}
              onClick={() => { setShowPw(!showPw); setPwError(""); setPwSuccess(""); setPwForm({ current:"", newPw:"", confirm:"" }); }}>
              {showPw ? "Cancel" : "Change"}
            </button>
          </div>
          {showPw && (
            <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: "1px solid #1e1a2e" }}>
              {[["Current password", pwForm.current, "current", showC, setShowC], ["New password", pwForm.newPw, "newPw", showN, setShowN], ["Confirm new password", pwForm.confirm, "confirm", showCf, setShowCf]].map(([lbl, val, key, vis, setVis]) => (
                <div key={key} style={{ marginBottom: "12px" }}>
                  <label style={label}>{lbl}</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input className="input-field" type={vis ? "text" : "password"} value={val} onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })} style={{ paddingRight: "40px" }} />
                    <button style={eyeBtn} onClick={() => setVis(!vis)}><EyeIcon show={vis} /></button>
                  </div>
                </div>
              ))}
              {pwError && <div style={{ fontSize: "12px", color: "#ef4444", marginBottom: "12px", padding: "8px 12px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)" }}>{pwError}</div>}
              {pwSuccess && <div style={{ fontSize: "12px", color: "#22c55e", marginBottom: "12px", padding: "8px 12px", background: "#0a1a12", borderRadius: "6px", border: "1px solid rgba(34,197,94,0.2)" }}>✓ {pwSuccess}</div>}
              <button className="btn-primary" onClick={handleChangePw} disabled={pwLoading}>{pwLoading ? "Updating..." : "Update password"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
