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
  const nav = useNavigate();
  const [files, setFiles] = useState([]);
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({ cur: "", nw: "", cf: "" });
  const [sC, setSC] = useState(false); const [sN, setSN] = useState(false); const [sCf, setSCf] = useState(false);
  const [pErr, setPErr] = useState(""); const [pOk, setPOk] = useState(""); const [pL, setPL] = useState(false);

  useEffect(() => { getUserFiles().then(r => setFiles(r.data.files)).catch(() => {}); }, []);

  const doPw = async () => {
    setPErr(""); setPOk("");
    if (!pw.cur) { setPErr("Current password required"); return; }
    if (!pw.nw) { setPErr("New password required"); return; }
    if (!pw.cf) { setPErr("Confirm password"); return; }
    if (pw.nw !== pw.cf) { setPErr("Passwords don't match"); return; }
    if (pw.nw === pw.cur) { setPErr("Must be different"); return; }
    if (pw.nw.length < 8 || !/[A-Z]/.test(pw.nw) || !/\d/.test(pw.nw) || !/[^a-zA-Z0-9]/.test(pw.nw)) { setPErr("8+ chars, upper, number, special"); return; }
    setPL(true);
    try { await changePassword(pw.cur, pw.nw); setPOk("Password changed"); setPw({ cur:"", nw:"", cf:"" }); setTimeout(() => { setShowPw(false); setPOk(""); }, 2000); }
    catch (e) { setPErr(extractError(e, "Failed")); }
    setPL(false);
  };

  const acts = [
    { label: "Upload File", sub: "Encode & store in DNA", icon: "↑", path: "/upload", color: "#a29bfe", bg: "#1a1528" },
    { label: "My Files", sub: "View stored files", icon: "◈", path: "/files", color: "#48dbfb", bg: "#0c1a22" },
    { label: "Retrieve", sub: "Decode & download", icon: "↓", path: "/retrieve", color: "#f0932b", bg: "#1a1210" },
  ];

  const lb = { display: "block", fontSize: "14px", fontWeight: "600", color: "#c4b5fd", marginBottom: "6px" };
  const eb = { position: "absolute", right: "12px", background: "transparent", border: "none", color: "#6b5f8a", cursor: "pointer", padding: "0" };
  const sl = { fontSize: "12px", fontWeight: "700", color: "#9a8fc0", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Welcome to DNA Vault — archiving data in living molecules</div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          {[["Files stored", files.length, "#a29bfe"], ["Status", "Online", "#22c55e"], ["Encoding", "DNA", "#48dbfb"]].map(([l, v, c]) => (
            <div key={l} className="card" style={{ flex: 1, minWidth: "150px" }}>
              <div style={{ fontSize: "12px", color: "#9a8fc0", textTransform: "uppercase", marginBottom: "6px", fontWeight: "700" }}>{l}</div>
              <div style={{ fontSize: "26px", fontWeight: "700", color: c }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={sl}>Quick actions</div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
          {acts.map(a => (
            <button key={a.path} onClick={() => nav(a.path)} style={{ flex: 1, minWidth: "180px", padding: "18px", background: "#12101e", border: "1px solid #2a2440", borderRadius: "8px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
              onMouseOver={e => e.currentTarget.style.borderColor = a.color + "55"} onMouseOut={e => e.currentTarget.style.borderColor = "#2a2440"}>
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: a.color, marginBottom: "10px" }}>{a.icon}</div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: "#f0ecf8", marginBottom: "3px" }}>{a.label}</div>
              <div style={{ fontSize: "13px", color: "#9a8fc0", fontWeight: "500" }}>{a.sub}</div>
            </button>
          ))}
        </div>

        {files.length > 0 && (<>
          <div style={sl}>Recent files</div>
          <div className="card" style={{ marginBottom: "28px" }}>
            {files.slice(0, 5).map((f, i) => (
              <div key={f.file_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < Math.min(files.length, 5) - 1 ? "1px solid #2a2440" : "none" }}>
                <div><div style={{ fontSize: "14px", fontWeight: "600", color: "#f0ecf8" }}>{f.filename}</div><div style={{ fontSize: "12px", color: "#9a8fc0", fontFamily: "var(--font-mono)", fontWeight: "500" }}>{f.file_id}</div></div>
                <button className="btn-primary" style={{ padding: "5px 12px", fontSize: "12px" }} onClick={() => nav("/files")}>View</button>
              </div>
            ))}
          </div>
        </>)}

        <div style={sl}>Account</div>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: "15px", fontWeight: "600", color: "#f0ecf8" }}>Change Password</div><div style={{ fontSize: "13px", color: "#9a8fc0", fontWeight: "500" }}>Update your account password</div></div>
            <button className="btn-primary" style={{ padding: "7px 14px", fontSize: "13px", background: showPw ? "#6b5f8a" : undefined }}
              onClick={() => { setShowPw(!showPw); setPErr(""); setPOk(""); setPw({ cur:"", nw:"", cf:"" }); }}>{showPw ? "Cancel" : "Change"}</button>
          </div>
          {showPw && (
            <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: "1px solid #2a2440" }}>
              {[["Current password", pw.cur, "cur", sC, setSC], ["New password", pw.nw, "nw", sN, setSN], ["Confirm password", pw.cf, "cf", sCf, setSCf]].map(([lbl, val, key, vis, setVis]) => (
                <div key={key} style={{ marginBottom: "12px" }}><label style={lb}>{lbl}</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input className="input-field" type={vis ? "text" : "password"} value={val} onChange={e => setPw({ ...pw, [key]: e.target.value })} style={{ paddingRight: "40px" }} />
                    <button style={eb} onClick={() => setVis(!vis)}><EyeIcon show={vis} /></button>
                  </div>
                </div>
              ))}
              {pErr && <div style={{ fontSize: "13px", fontWeight: "600", color: "#ef4444", marginBottom: "12px", padding: "8px 12px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)" }}>{pErr}</div>}
              {pOk && <div style={{ fontSize: "13px", fontWeight: "600", color: "#22c55e", marginBottom: "12px", padding: "8px 12px", background: "#0a1a12", borderRadius: "6px", border: "1px solid rgba(34,197,94,0.3)" }}>✓ {pOk}</div>}
              <button className="btn-primary" onClick={doPw} disabled={pL}>{pL ? "Updating..." : "Update password"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
