import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getUserFiles, changePassword, extractError } from "../services/api";

function EyeIcon({ show }) {
  return show ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ border: `1px solid ${color}33`, flex: 1, minWidth: "160px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "10px" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "32px", color, textShadow: `0 0 20px ${color}66` }}>{value}</div>
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

  useEffect(() => {
    getUserFiles().then(res => setFiles(res.data.files)).catch(() => {});
  }, []);

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("");

    if (!pwForm.current) { setPwError("Current password is required"); return; }
    if (!pwForm.newPw) { setPwError("New password is required"); return; }
    if (!pwForm.confirm) { setPwError("Please confirm your new password"); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwError("New passwords do not match"); return; }
    if (pwForm.newPw === pwForm.current) { setPwError("New password must be different from current password"); return; }
    if (pwForm.newPw.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(pwForm.newPw)) { setPwError("New password must contain an uppercase letter"); return; }
    if (!/\d/.test(pwForm.newPw)) { setPwError("New password must contain a number"); return; }
    if (!/[^a-zA-Z0-9]/.test(pwForm.newPw)) { setPwError("New password must contain a special character"); return; }

    setPwLoading(true);
    try {
      await changePassword(pwForm.current, pwForm.newPw);
      setPwSuccess("✓ Password changed successfully");
      setPwForm({ current: "", newPw: "", confirm: "" });
      setTimeout(() => { setShowChangePassword(false); setPwSuccess(""); }, 2000);
    } catch (err) {
      setPwError(extractError(err, "Failed to change password"));
    }
    setPwLoading(false);
  };

  const actions = [
    { label: "UPLOAD FILE", sub: "Encode & store in DNA", icon: "↑", path: "/upload", color: "var(--neon-green)" },
    { label: "MY FILES",    sub: "View stored files",    icon: "◈", path: "/files",   color: "var(--neon-blue)" },
    { label: "RETRIEVE",   sub: "Decode & download",    icon: "↓", path: "/retrieve", color: "#a78bfa" },
  ];

  const labelStyle = { display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "6px" };
  const eyeBtn = { position: "absolute", right: "12px", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0", display: "flex", alignItems: "center" };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">DASHBOARD</div>
        <div className="page-subtitle">BIO-DIGITAL STORAGE SYSTEM · ONLINE</div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
          <StatCard label="FILES STORED" value={files.length} color="var(--neon-green)" />
          <StatCard label="SYSTEM STATUS" value="ONLINE" color="var(--neon-blue)" />
          <StatCard label="ENCODING" value="DNA" color="#a78bfa" />
        </div>

        {/* Quick actions */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "2px", marginBottom: "16px" }}>QUICK ACTIONS</div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "32px" }}>
          {actions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              style={{ flex: 1, minWidth: "200px", padding: "24px", background: "var(--bg-card)", border: `1px solid ${a.color}33`, borderRadius: "8px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}
              onMouseOver={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = "var(--bg-card-hover)"; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = `${a.color}33`; e.currentTarget.style.background = "var(--bg-card)"; }}
            >
              <div style={{ fontSize: "28px", color: a.color, marginBottom: "12px" }}>{a.icon}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "12px", color: a.color, letterSpacing: "2px", marginBottom: "6px" }}>{a.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>{a.sub}</div>
            </button>
          ))}
        </div>

        {/* Recent files */}
        {files.length > 0 && (
          <>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "2px", marginBottom: "16px" }}>RECENT FILES</div>
            <div className="card" style={{ marginBottom: "32px" }}>
              {files.slice(0, 5).map((f, i) => (
                <div key={f.file_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < Math.min(files.length, 5) - 1 ? "1px solid var(--border)" : "none" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-primary)" }}>{f.filename}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{f.file_id}</div>
                  </div>
                  <button className="btn-primary" style={{ padding: "6px 14px", fontSize: "11px" }} onClick={() => navigate("/files")}>VIEW</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Account Settings */}
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "2px", marginBottom: "16px" }}>ACCOUNT SETTINGS</div>
        <div className="card" style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-primary)", marginBottom: "4px" }}>Change Password</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>Update your account password</div>
            </div>
            <button
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: "11px" }}
              onClick={() => { setShowChangePassword(!showChangePassword); setPwError(""); setPwSuccess(""); setPwForm({ current: "", newPw: "", confirm: "" }); }}
            >
              {showChangePassword ? "CANCEL" : "CHANGE →"}
            </button>
          </div>

          {showChangePassword && (
            <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>

              {/* Current password */}
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>CURRENT PASSWORD</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    className="input-field"
                    type={showCurrent ? "text" : "password"}
                    placeholder="enter current password"
                    value={pwForm.current}
                    onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                    style={{ paddingRight: "40px" }}
                  />
                  <button style={eyeBtn} onClick={() => setShowCurrent(!showCurrent)}
                    onMouseOver={e => e.currentTarget.style.color = "var(--neon-green)"}
                    onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
                  >
                    <EyeIcon show={showCurrent} />
                  </button>
                </div>
              </div>

              {/* New password */}
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>NEW PASSWORD</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    className="input-field"
                    type={showNew ? "text" : "password"}
                    placeholder="min 8 chars, uppercase, number, special"
                    value={pwForm.newPw}
                    onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                    style={{ paddingRight: "40px" }}
                  />
                  <button style={eyeBtn} onClick={() => setShowNew(!showNew)}
                    onMouseOver={e => e.currentTarget.style.color = "var(--neon-green)"}
                    onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
                  >
                    <EyeIcon show={showNew} />
                  </button>
                </div>

                {/* Strength meter */}
                {pwForm.newPw.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                      {[
                        pwForm.newPw.length >= 8,
                        /[A-Z]/.test(pwForm.newPw),
                        /\d/.test(pwForm.newPw),
                        /[^a-zA-Z0-9]/.test(pwForm.newPw),
                      ].map((met, i) => (
                        <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: met ? "var(--neon-green)" : "var(--border)", transition: "background 0.3s" }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {[
                        ["8+ chars", pwForm.newPw.length >= 8],
                        ["Uppercase", /[A-Z]/.test(pwForm.newPw)],
                        ["Number", /\d/.test(pwForm.newPw)],
                        ["Special", /[^a-zA-Z0-9]/.test(pwForm.newPw)],
                      ].map(([label, met]) => (
                        <span key={label} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: met ? "var(--neon-green)" : "var(--text-muted)" }}>
                          {met ? "✓" : "○"} {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm new password */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>CONFIRM NEW PASSWORD</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    className="input-field"
                    type={showConfirm ? "text" : "password"}
                    placeholder="re-enter new password"
                    value={pwForm.confirm}
                    onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                    style={{
                      paddingRight: "40px",
                      borderColor: pwForm.confirm
                        ? pwForm.newPw === pwForm.confirm ? "var(--neon-green)" : "#ef4444"
                        : undefined,
                    }}
                  />
                  <button style={eyeBtn} onClick={() => setShowConfirm(!showConfirm)}
                    onMouseOver={e => e.currentTarget.style.color = "var(--neon-green)"}
                    onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
                  >
                    <EyeIcon show={showConfirm} />
                  </button>
                </div>
                {pwForm.confirm.length > 0 && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", marginTop: "6px", color: pwForm.newPw === pwForm.confirm ? "var(--neon-green)" : "#ef4444" }}>
                    {pwForm.newPw === pwForm.confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </div>
                )}
              </div>

              {/* Error / Success */}
              {pwError && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ef4444", marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)", lineHeight: "1.5" }}>
                  ⚠ {pwError}
                </div>
              )}
              {pwSuccess && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--neon-green)", marginBottom: "16px", padding: "10px 14px", background: "rgba(0,255,136,0.08)", borderRadius: "6px", border: "1px solid rgba(0,255,136,0.2)" }}>
                  {pwSuccess}
                </div>
              )}

              <button className="btn-primary" onClick={handleChangePassword} disabled={pwLoading}>
                {pwLoading ? "UPDATING..." : "UPDATE PASSWORD →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;