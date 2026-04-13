import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const label = { display: "block", fontSize: "13px", fontWeight: "500", color: "#5a5078", marginBottom: "6px" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0912", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "22px", fontWeight: "600", letterSpacing: "2px" }}><span style={{ color: "#a29bfe" }}>DNA</span> <span style={{ color: "#5a5078" }}>VAULT</span></div>
          <div style={{ fontSize: "13px", color: "#3a3458", marginTop: "6px" }}>Reset your password</div>
        </div>
        <div style={{ background: "#12101e", border: "1px solid #1e1a2e", borderRadius: "10px", padding: "28px" }}>
          <div style={{ marginBottom: "14px" }}><label style={label}>Email</label><input className="input-field" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <button className="btn-primary" style={{ width: "100%", marginBottom: "14px" }}>Send Reset Code</button>
          <div style={{ marginBottom: "14px" }}><label style={label}>Reset Code</label><input className="input-field" placeholder="Enter the code from your email" value={otp} onChange={e => setOtp(e.target.value)} /></div>
          <div style={{ marginBottom: "18px" }}><label style={label}>New Password</label><input className="input-field" type="password" placeholder="Enter new password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
          <button className="btn-primary" style={{ width: "100%" }}>Reset Password</button>
          {error && <div style={{ fontSize: "13px", color: "#ef4444", marginTop: "14px", padding: "10px 14px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
          {message && <div style={{ fontSize: "13px", color: "#22c55e", marginTop: "14px", padding: "10px 14px", background: "#0a1a12", borderRadius: "6px", border: "1px solid rgba(34,197,94,0.2)" }}>{message}</div>}
          <div style={{ marginTop: "18px", textAlign: "center", fontSize: "12px" }}>
            <Link to="/login" style={{ color: "#48dbfb", textDecoration: "none" }}>← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
