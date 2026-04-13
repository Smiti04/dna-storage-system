import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";

function EyeIcon({ show }) {
  return show ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  );
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    setError(""); setSuccess("");
    if (!form.username.trim()) { setError("Username is required"); return; }
    if (!form.email.trim()) { setError("Email is required"); return; }
    if (!form.password) { setError("Password is required"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(form.password)) { setError("Must contain an uppercase letter"); return; }
    if (!/\d/.test(form.password)) { setError("Must contain a number"); return; }
    if (!/[^a-zA-Z0-9]/.test(form.password)) { setError("Must contain a special character"); return; }
    try {
      const fd = new FormData(); fd.append("username", form.username); fd.append("email", form.email); fd.append("password", form.password);
      await registerUser(fd);
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) { setError(err.message || "Registration failed"); }
  };

  const label = { display: "block", fontSize: "13px", fontWeight: "500", color: "#5a5078", marginBottom: "6px" };
  const eyeBtn = { position: "absolute", right: "12px", background: "transparent", border: "none", color: "#3a3458", cursor: "pointer", padding: "0" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0912", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "22px", fontWeight: "600", letterSpacing: "2px" }}><span style={{ color: "#a29bfe" }}>DNA</span> <span style={{ color: "#5a5078" }}>VAULT</span></div>
          <div style={{ fontSize: "13px", color: "#3a3458", marginTop: "6px" }}>Create your account</div>
        </div>
        <div style={{ background: "#12101e", border: "1px solid #1e1a2e", borderRadius: "10px", padding: "28px" }}>
          <div style={{ marginBottom: "14px" }}><label style={label}>Username</label><input className="input-field" name="username" placeholder="3–10 characters" value={form.username} onChange={handle} /></div>
          <div style={{ marginBottom: "14px" }}><label style={label}>Email</label><input className="input-field" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handle} /></div>
          <div style={{ marginBottom: "14px" }}>
            <label style={label}>Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input className="input-field" type={showPw ? "text" : "password"} name="password" placeholder="Min 8 chars, uppercase, number, special" value={form.password} onChange={handle} style={{ paddingRight: "40px" }} />
              <button style={eyeBtn} onClick={() => setShowPw(!showPw)}><EyeIcon show={showPw} /></button>
            </div>
            {form.password.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                  {[form.password.length >= 8, /[A-Z]/.test(form.password), /\d/.test(form.password), /[^a-zA-Z0-9]/.test(form.password)].map((m, i) => (
                    <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: m ? "#22c55e" : "#1e1a2e", transition: "background 0.3s" }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {[["8+ chars", form.password.length >= 8], ["Uppercase", /[A-Z]/.test(form.password)], ["Number", /\d/.test(form.password)], ["Special", /[^a-zA-Z0-9]/.test(form.password)]].map(([l, m]) => (
                    <span key={l} style={{ fontSize: "10px", color: m ? "#22c55e" : "#3a3458" }}>{m ? "✓" : "○"} {l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={label}>Confirm Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input className="input-field" type={showCf ? "text" : "password"} name="confirmPassword" placeholder="Re-enter password" value={form.confirmPassword} onChange={handle} style={{ paddingRight: "40px", borderColor: form.confirmPassword ? (form.password === form.confirmPassword ? "#22c55e" : "#ef4444") : undefined }} />
              <button style={eyeBtn} onClick={() => setShowCf(!showCf)}><EyeIcon show={showCf} /></button>
            </div>
            {form.confirmPassword.length > 0 && <div style={{ fontSize: "11px", marginTop: "6px", color: form.password === form.confirmPassword ? "#22c55e" : "#ef4444" }}>{form.password === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}</div>}
          </div>
          {error && <div style={{ fontSize: "13px", color: "#ef4444", marginBottom: "16px", padding: "10px 14px", background: "#1a0a0a", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}
          {success && <div style={{ fontSize: "13px", color: "#22c55e", marginBottom: "16px", padding: "10px 14px", background: "#0a1a12", borderRadius: "6px", border: "1px solid rgba(34,197,94,0.2)" }}>✓ {success}</div>}
          <button className="btn-primary" style={{ width: "100%" }} onClick={handleRegister}>Create account</button>
          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px" }}>
            <Link to="/login" style={{ color: "#48dbfb", textDecoration: "none" }}>← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
