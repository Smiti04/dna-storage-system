import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { extractError } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:9000";

function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState(1); // 1 = email, 2 = token + new password
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const requestToken = async () => {
    setErr(""); setMsg("");
    if (!email) { setErr("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setErr("Invalid email format"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email", email);
      const res = await axios.post(`${API_URL}/forgot_password`, fd);
      setMsg(`Reset token generated. Check your email or the token file: ${res.data.file || "backend logs"}`);
      setStep(2);
    } catch (e) {
      setErr(extractError(e, "Failed to request reset"));
    }
    setLoading(false);
  };

  const resetPw = async () => {
    setErr(""); setMsg("");
    if (!token) { setErr("Token is required"); return; }
    if (!newPassword) { setErr("New password is required"); return; }
    if (newPassword !== confirmPassword) { setErr("Passwords don't match"); return; }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
      setErr("Password must be 8+ chars with uppercase, number, and special character");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("token", token);
      fd.append("new_password", newPassword);
      const res = await axios.post(`${API_URL}/reset_password`, fd);
      if (res.data.error) {
        setErr(res.data.error);
      } else {
        setMsg("Password reset successful! Redirecting to login...");
        setTimeout(() => nav("/login"), 2000);
      }
    } catch (e) {
      setErr(extractError(e, "Reset failed"));
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", background: "#0e0c18",
    border: "1px solid #2a2440", borderRadius: "6px",
    color: "#f0ecf8", fontSize: "14px", fontWeight: "500",
    fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box",
  };
  const lb = { display: "block", fontSize: "13px", fontWeight: "600", color: "#c4b5fd", marginBottom: "6px" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "#0a0912" }}>
      <div className="card" style={{ maxWidth: "440px", width: "100%", padding: "36px 32px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: "800", color: "#f0ecf8", marginBottom: "4px" }}>
          Reset Password
        </div>
        <div style={{ fontSize: "13px", color: "#9a8fc0", marginBottom: "24px", fontWeight: "500" }}>
          {step === 1 ? "Enter your email to receive a reset token" : "Enter the token and your new password"}
        </div>

        {step === 1 && (
          <>
            <div style={{ marginBottom: "18px" }}>
              <label style={lb}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && requestToken()}
                placeholder="you@example.com" style={inputStyle} />
            </div>
            <button className="btn-primary" onClick={requestToken} disabled={loading} style={{ width: "100%" }}>
              {loading ? "Sending..." : "Send Reset Token"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ marginBottom: "14px" }}>
              <label style={lb}>Email</label>
              <input type="email" value={email} disabled
                style={{ ...inputStyle, opacity: 0.6 }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={lb}>Reset token (6-digit code)</label>
              <input type="text" value={token} onChange={e => setToken(e.target.value)}
                placeholder="123456" style={{ ...inputStyle, fontFamily: "var(--font-mono)", letterSpacing: "3px" }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={lb}>New password</label>
              <input type={showPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                style={inputStyle} />
            </div>
            <div style={{ marginBottom: "18px" }}>
              <label style={lb}>Confirm password</label>
              <input type={showPw ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && resetPw()}
                style={inputStyle} />
              <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", color: "#9a8fc0", fontWeight: "500", cursor: "pointer" }}>
                <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} />
                Show passwords
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setStep(1); setErr(""); setMsg(""); }}
                style={{ padding: "10px 16px", background: "transparent", border: "1px solid #2a2440", borderRadius: "6px", color: "#9a8fc0", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                Back
              </button>
              <button className="btn-primary" onClick={resetPw} disabled={loading} style={{ flex: 1 }}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </>
        )}

        {err && (
          <div style={{ marginTop: "14px", fontSize: "13px", fontWeight: "600", color: "#ef4444", padding: "10px 12px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)" }}>
            {err}
          </div>
        )}
        {msg && (
          <div style={{ marginTop: "14px", fontSize: "13px", fontWeight: "600", color: "#22c55e", padding: "10px 12px", background: "#0a1a12", borderRadius: "6px", border: "1px solid rgba(34,197,94,0.3)" }}>
            ✓ {msg}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#9a8fc0", fontWeight: "500" }}>
          Remembered?{" "}
          <span onClick={() => nav("/login")} style={{ color: "#a29bfe", cursor: "pointer", fontWeight: "700" }}>
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
