import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/api";

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

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!username.trim()) { setError("Username is required"); return; }
    if (!password) { setError("Password is required"); return; }

    setLoading(true);
    const res = await loginUser(username, password);
    setLoading(false);

    if (res?.error) { setError(res.error); return; }
    if (res?.data?.access_token) {
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } else {
      setError("Unexpected response from server");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "420px", padding: "0 20px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--neon-green)", letterSpacing: "6px", textShadow: "var(--glow-green)" }}>DNA//STORE</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", letterSpacing: "3px" }}>BIOLOGICAL DATA STORAGE SYSTEM</div>
        </div>

        <div className="card" style={{ border: "1px solid rgba(0,255,136,0.15)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--neon-green)", letterSpacing: "2px", marginBottom: "24px" }}>▸ AUTHENTICATE</div>

          {/* Username */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "6px" }}>USERNAME</label>
            <input
              className="input-field"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="enter username"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", marginBottom: "6px" }}>PASSWORD</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                className="input-field"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: "40px" }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0", display: "flex", alignItems: "center" }}
                onMouseOver={e => e.currentTarget.style.color = "var(--neon-green)"}
                onMouseOut={e => e.currentTarget.style.color = "var(--text-muted)"}
              >
                <EyeIcon show={showPassword} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#ef4444", marginBottom: "16px", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.2)", lineHeight: "1.5" }}>
              ⚠ {error}
            </div>
          )}

          <button className="btn-primary" style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>
            {loading ? "AUTHENTICATING..." : "LOGIN →"}
          </button>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
            <Link to="/register" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>CREATE ACCOUNT</Link>
            <Link to="/forgot" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>FORGOT PASSWORD</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;