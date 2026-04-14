import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { changePassword, extractError } from "../services/api";

function EyeIcon({ show }) {
  return show ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  );
}

function ChangePassword() {
  const [pw, setPw] = useState({ cur: "", nw: "", cf: "" });
  const [sC, setSC] = useState(false);
  const [sN, setSN] = useState(false);
  const [sCf, setSCf] = useState(false);
  const [pErr, setPErr] = useState("");
  const [pOk, setPOk] = useState("");
  const [pL, setPL] = useState(false);

  const doPw = async () => {
    setPErr(""); setPOk("");
    if (!pw.cur) { setPErr("Current password required"); return; }
    if (!pw.nw) { setPErr("New password required"); return; }
    if (!pw.cf) { setPErr("Confirm password"); return; }
    if (pw.nw !== pw.cf) { setPErr("Passwords don't match"); return; }
    if (pw.nw === pw.cur) { setPErr("Must be different"); return; }
    if (pw.nw.length < 8 || !/[A-Z]/.test(pw.nw) || !/\d/.test(pw.nw) || !/[^a-zA-Z0-9]/.test(pw.nw)) {
      setPErr("8+ chars, upper, number, special"); return;
    }
    setPL(true);
    try {
      await changePassword(pw.cur, pw.nw);
      setPOk("Password changed successfully");
      setPw({ cur: "", nw: "", cf: "" });
    } catch (e) {
      setPErr(extractError(e, "Failed"));
    }
    setPL(false);
  };

  const lb = { display: "block", fontSize: "14px", fontWeight: "600", color: "#c4b5fd", marginBottom: "6px" };
  const eb = { position: "absolute", right: "12px", background: "transparent", border: "none", color: "#6b5f8a", cursor: "pointer", padding: "0" };

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <div className="page-title">Change Password</div>
        <div className="page-subtitle">Update your account password</div>

        <div className="card" style={{ maxWidth: "480px" }}>
          {[["Current password", pw.cur, "cur", sC, setSC], ["New password", pw.nw, "nw", sN, setSN], ["Confirm password", pw.cf, "cf", sCf, setSCf]].map(([lbl, val, key, vis, setVis]) => (
            <div key={key} style={{ marginBottom: "16px" }}>
              <label style={lb}>{lbl}</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input className="input-field" type={vis ? "text" : "password"} value={val}
                  onChange={e => setPw({ ...pw, [key]: e.target.value })}
                  onKeyDown={e => e.key === "Enter" && doPw()}
                  style={{ paddingRight: "40px" }} />
                <button style={eb} onClick={() => setVis(!vis)}><EyeIcon show={vis} /></button>
              </div>
            </div>
          ))}

          <div style={{ fontSize: "12px", color: "#6b5f8a", marginBottom: "16px", fontWeight: "500" }}>
            Must be at least 8 characters with an uppercase letter, a number, and a special character.
          </div>

          {pErr && (
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#ef4444", marginBottom: "12px", padding: "8px 12px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)" }}>
              {pErr}
            </div>
          )}
          {pOk && (
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#22c55e", marginBottom: "12px", padding: "8px 12px", background: "#0a1a12", borderRadius: "6px", border: "1px solid rgba(34,197,94,0.3)" }}>
              ✓ {pOk}
            </div>
          )}

          <button className="btn-primary" onClick={doPw} disabled={pL}>
            {pL ? "Updating..." : "Update password"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;


