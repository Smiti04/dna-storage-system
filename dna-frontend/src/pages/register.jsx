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

  const labelStyle = { display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" };
  const eyeBtn = { position: "absolute", right: "12px", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0", display: "flex", alignItems: "center" };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px", fontFamily: "var(--font-display)" }}>DNA Store</div>
          <div style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>Create your account</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Username</label>
            <input className="input-field" type="text" name="username" placeholder="3–10 characters" value={form.username} onChange={handle} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Email</label>
            <input className="input-field" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handle} />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input className="input-field" type={showPassword ? "text" : "password"} name="password" placeholder="Min 8 chars, uppercase, number, special" value={form.password} onChange={handle} style={{ paddingRight: "40px" }} />
              <button style={eyeBtn} onClick={() => setShowPassword(!showPassword)}
                onMouseOver={e => e.currentTarget.style.color = "#2563eb"}
                onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}>
                <EyeIcon show={showPassword} />
              </button>
            </div>

            {form.password.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                  {[form.password.length >= 8, /[A-Z]/.test(form.password), /\d/.test(form.password), /[^a-zA-Z0-9]/.test(form.password)].map((met, i) => (
                    <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: met ? "#22c55e" : "#e2e8f0", transition: "background 0.3s" }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {[["8+ chars", form.password.length >= 8], ["Uppercase", /[A-Z]/.test(form.password)], ["Number", /\d/.test(form.password)], ["Special", /[^a-zA-Z0-9]/.test(form.password)]].map(([label, met]) => (
                    <span key={label} style={{ fontSize: "11px", color: met ? "#16a34a" : "#94a3b8" }}>{met ? "✓" : "○"} {label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input className="input-field" type={showConfirm ? "text" : "password"} name="confirmPassword" placeholder="Re-enter your password" value={form.confirmPassword} onChange={handle}
                style={{ paddingRight: "40px", borderColor: form.confirmPassword ? (form.password === form.confirmPassword ? "#22c55e" : "#ef4444") : undefined }} />
              <button style={eyeBtn} onClick={() => setShowConfirm(!showConfirm)}
                onMouseOver={e => e.currentTarget.style.color = "#2563eb"}
                onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}>
                <EyeIcon show={showConfirm} />
              </button>
            </div>
            {form.confirmPassword.length > 0 && (
              <div style={{ fontSize: "12px", marginTop: "6px", color: form.password === form.confirmPassword ? "#16a34a" : "#ef4444" }}>
                {form.password === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
              </div>
            )}
          </div>

          {error && <div style={{ fontSize: "13px", color: "#ef4444", marginBottom: "16px", padding: "10px 14px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fee2e2" }}>{error}</div>}
          {success && <div style={{ fontSize: "13px", color: "#16a34a", marginBottom: "16px", padding: "10px 14px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #dcfce7" }}>✓ {success}</div>}

          <button className="btn-primary" style={{ width: "100%" }} onClick={handleRegister}>Create account</button>

          <div style={{ marginTop: "20px", textAlign: "center", fontSize: "13px" }}>
            <Link to="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500" }}>← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
