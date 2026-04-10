import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px", fontFamily: "var(--font-display)" }}>DNA Store</div>
          <div style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>Reset your password</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Email</label>
            <input className="input-field" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <button className="btn-primary" style={{ width: "100%", marginBottom: "16px" }}>Send Reset Code</button>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Reset Code</label>
            <input className="input-field" placeholder="Enter the code from your email" value={otp} onChange={(e) => setOtp(e.target.value)} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>New Password</label>
            <input className="input-field" type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>

          <button className="btn-primary" style={{ width: "100%" }}>Reset Password</button>

          {error && <div style={{ fontSize: "13px", color: "#ef4444", marginTop: "16px", padding: "10px 14px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fee2e2" }}>{error}</div>}
          {message && <div style={{ fontSize: "13px", color: "#16a34a", marginTop: "16px", padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #dcfce7" }}>{message}</div>}

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "13px" }}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500" }}>← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
