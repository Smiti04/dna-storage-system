import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";

function EyeIcon({ show }) {
  return show ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (!/[A-Z]/.test(form.password)) { setError("Password must contain an uppercase letter"); return; }
    if (!/\d/.test(form.password)) { setError("Password must contain a number"); return; }
    if (!/[^a-zA-Z0-9]/.test(form.password)) { setError("Password must contain a special character"); return; }

    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("password", form.password);
      await registerUser(formData);
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  };

  const labelStyle = { display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "6px" };
  const eyeBtn = { position: "absolute", right: "12px", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0", display: "flex", alignItems: "center" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "420px", padding: "0 20px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--neon-green)", letterSpacing: "6px", textShadow: "var(--glow-green)" }}>DNA//STORE</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", letterSpacing: "3px" }}>CREATE YOUR ACCOUNT</div>
        </div>

        <div className="card" style={{ border: "1px solid rgba(0,255,136,0.15)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--neon-green)", letterSpacing: "2px", marginBottom: "24px" }}>▸ REGISTER</div>

          {/* Username */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>USERNAME</label>
            <input className="input-field" type="text" name="username" placeholder="3–10 characters" value={form.username} onChange={handle} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>EMAIL</label>
            <input className="input-field" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handle} />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>PASSWORD</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                className="input-field"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="min 8 chars, uppercase, number, special"
                value={form.password}
                onChange={handle}
                style={{ paddingRight: "40px" }}
              />
              <button style={eyeBtn} onClick={() => setShowPassword(!showPassword)}
                onMouseOver={e => e.currentTarget.style.color = "var(--neon-green)"}
                onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                <EyeIcon show={showPassword} />
              </button>
            </div>

            {/* Strength meter */}
            {form.password.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                  {[
                    form.password.length >= 8,
                    /[A-Z]/.test(form.password),
                    /\d/.test(form.password),
                    /[^a-zA-Z0-9]/.test(form.password),
                  ].map((met, i) => (
                    <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: met ? "var(--neon-green)" : "var(--border)", transition: "background 0.3s" }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {[
                    ["8+ chars", form.password.length >= 8],
                    ["Uppercase", /[A-Z]/.test(form.password)],
                    ["Number", /\d/.test(form.password)],
                    ["Special char", /[^a-zA-Z0-9]/.test(form.password)],
                  ].map(([label, met]) => (
                    <span key={label} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: met ? "var(--neon-green)" : "var(--text-muted)" }}>
                      {met ? "✓" : "○"} {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>CONFIRM PASSWORD</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                className="input-field"
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="re-enter your password"
                value={form.confirmPassword}
                onChange={handle}
                style={{
                  paddingRight: "40px",
                  borderColor: form.confirmPassword
                    ? form.password === form.confirmPassword ? "var(--neon-green)" : "#ef4444"
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
            {form.confirmPassword.length > 0 && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", marginTop: "6px", color: form.password === form.confirmPassword ? "var(--neon-green)" : "#ef4444" }}>
                {form.password === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
              </div>
            )}
          </div>

          {/* Error / Success */}
          {error && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ef4444", marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)", lineHeight: "1.5" }}>
              ⚠ {error}
            </div>
          )}
          {success && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--neon-green)", marginBottom: "16px", padding: "10px 14px", background: "rgba(0,255,136,0.08)", borderRadius: "6px", border: "1px solid rgba(0,255,136,0.2)" }}>
              ✓ {success}
            </div>
          )}

          <button className="btn-primary" style={{ width: "100%" }} onClick={handleRegister}>REGISTER →</button>

          <div style={{ marginTop: "20px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
            <Link to="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>← BACK TO LOGIN</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;