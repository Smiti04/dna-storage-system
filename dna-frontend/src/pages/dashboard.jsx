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

function StatCard({ label, value, color, bg }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: "160px" }}>
      <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "500", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "28px", fontWeight: "700", color }}>{value}</div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => { getUserFiles().then(res => setFiles(res.data.files)).catch(() => {}); }, []);

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");
    if (!pwForm.current) { setPwError("Current password is required"); return; }
    if (!pwForm.newPw) { setPwError("New password is required"); return; }
    if (!pwForm.confirm) { setPwError("Please confirm your new password"); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError("New passwords do not match"); return; }
    if (pwForm.newPw === pwForm.current) { setPwError("New password must be different"); return; }
    if (pwForm.newPw.length < 8) { setPwError("Must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(pwForm.newPw)) { setPwError("Must contain an uppercase letter"); return; }
    if (!/\d/.test(pwForm.newPw)) { setPwError("Must contain a number"); return; }
    if (!/[^a-zA-Z0-9]/.test(pwForm.newPw)) { setPwError("Must contain a special character"); return; }

    setPwLoading(true);
    try {
      await changePassword(pwForm.current, pwForm.newPw);
      setPwSuccess("Password changed successfully");
      setPwForm({ current: "", newPw: "", confirm: "" });
      setTimeout(() => { setShowChangePassword(false); setPwSuccess(""); }, 2000);
    } catch (err) { setPwError(extractError(err, "Failed to change password")); }
    setPwLoading(false);
  };

  const actions = [
    { label: "Upload File", sub: "Encode & store in DNA", icon: "↑", path: "/upload", color: "#2563eb", bg: "#eff6ff" },
    { label: "My Files", sub: "View stored files", icon: "◈", path: "/files", color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Retrieve", sub: "Decode & download", icon: "↓", path: "/retrieve", color: "#059669", bg: "#ecfdf5" },
  ];

  const labelStyle = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };
  const eyeBtn = { position: "absolute", right: "12px", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0", display: "flex", alignItems: "center" };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Welcome to DNA Store — your bio-digital storage system</div>

        <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
          <StatCard label="Files stored" value={files.length} color="#2563eb" />
          <StatCard label="System status" value="Online" color="#16a34a" />
          <StatCard label="Encoding" value="DNA" color="#7c3aed" />
        </div>

        <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "12px", textTransform: "uppercase" }}>Quick actions</div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "32px" }}>
          {actions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              style={{ flex: 1, minWidth: "200px", padding: "20px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.boxShadow = `0 4px 12px ${a.color}15`; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)"; }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: a.color, marginBottom: "12px" }}>{a.icon}</div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", marginBottom: "4px" }}>{a.label}</div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>{a.sub}</div>
            </button>
          ))}
        </div>

        {files.length > 0 && (
          <>
            <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "12px", textTransform: "uppercase" }}>Recent files</div>
            <div className="card" style={{ marginBottom: "32px" }}>
              {files.slice(0, 5).map((f, i) => (
                <div key={f.file_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < Math.min(files.length, 5) - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>{f.filename}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px", fontFamily: "var(--font-mono)" }}>{f.file_id}</div>
                  </div>
                  <button className="btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }} onClick={() => navigate("/files")}>View</button>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ fontSize: "12px", fontWeight: "600", color: "#94a3b8", letterSpacing: "0.5px", marginBottom: "12px", textTransform: "uppercase" }}>Account</div>
        <div className="card" style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "500", color: "#0f172a", marginBottom: "2px" }}>Change Password</div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>Update your account password</div>
            </div>
            <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px", background: showChangePassword ? "#94a3b8" : undefined }}
              onClick={() => { setShowChangePassword(!showChangePassword); setPwError(""); setPwSuccess(""); setPwForm({ current: "", newPw: "", confirm: "" }); }}>
              {showChangePassword ? "Cancel" : "Change"}
            </button>
          </div>

          {showChangePassword && (
            <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Current password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input className="input-field" type={showCurrent ? "text" : "password"} placeholder="Enter current password" value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })} style={{ paddingRight: "40px" }} />
                  <button style={eyeBtn} onClick={() => setShowCurrent(!showCurrent)}><EyeIcon show={showCurrent} /></button>
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>New password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input className="input-field" type={showNew ? "text" : "password"} placeholder="Min 8 chars, uppercase, number, special" value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} style={{ paddingRight: "40px" }} />
                  <button style={eyeBtn} onClick={() => setShowNew(!showNew)}><EyeIcon show={showNew} /></button>
                </div>
                {pwForm.newPw.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                      {[pwForm.newPw.length >= 8, /[A-Z]/.test(pwForm.newPw), /\d/.test(pwForm.newPw), /[^a-zA-Z0-9]/.test(pwForm.newPw)].map((met, i) => (
                        <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: met ? "#22c55e" : "#e2e8f0", transition: "background 0.3s" }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {[["8+ chars", pwForm.newPw.length >= 8], ["Uppercase", /[A-Z]/.test(pwForm.newPw)], ["Number", /\d/.test(pwForm.newPw)], ["Special", /[^a-zA-Z0-9]/.test(pwForm.newPw)]].map(([label, met]) => (
                        <span key={label} style={{ fontSize: "11px", color: met ? "#16a34a" : "#94a3b8" }}>{met ? "✓" : "○"} {label}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Confirm new password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input className="input-field" type={showConfirm ? "text" : "password"} placeholder="Re-enter new password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} style={{ paddingRight: "40px", borderColor: pwForm.confirm ? (pwForm.newPw === pwForm.confirm ? "#22c55e" : "#ef4444") : undefined }} />
                  <button style={eyeBtn} onClick={() => setShowConfirm(!showConfirm)}><EyeIcon show={showConfirm} /></button>
                </div>
                {pwForm.confirm.length > 0 && (
                  <div style={{ fontSize: "12px", marginTop: "6px", color: pwForm.newPw === pwForm.confirm ? "#16a34a" : "#ef4444" }}>
                    {pwForm.newPw === pwForm.confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </div>
                )}
              </div>
              {pwError && <div style={{ fontSize: "13px", color: "#ef4444", marginBottom: "16px", padding: "10px 14px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fee2e2" }}>{pwError}</div>}
              {pwSuccess && <div style={{ fontSize: "13px", color: "#16a34a", marginBottom: "16px", padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #dcfce7" }}>✓ {pwSuccess}</div>}
              <button className="btn-primary" onClick={handleChangePassword} disabled={pwLoading}>{pwLoading ? "Updating..." : "Update password"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
