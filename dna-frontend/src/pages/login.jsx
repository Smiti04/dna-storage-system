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
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.5px", fontFamily: "var(--font-display)" }}>DNA Store</div>
          <div style={{ fontSize: "14px", color: "#94a3b8", marginTop: "4px" }}>Sign in to your account</div>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "32px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>

          {/* Username */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Username</label>
            <input
              className="input-field"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>Password</label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                className="input-field"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ paddingRight: "40px" }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0", display: "flex", alignItems: "center" }}
                onMouseOver={e => e.currentTarget.style.color = "#2563eb"}
                onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}
              >
                <EyeIcon show={showPassword} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontSize: "13px", color: "#ef4444", marginBottom: "16px", padding: "10px 14px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fee2e2" }}>
              {error}
            </div>
          )}

          <button className="btn-primary" style={{ width: "100%" }} onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <Link to="/register" style={{ color: "#2563eb", textDecoration: "none", fontWeight: "500" }}>Create account</Link>
            <Link to="/forgot" style={{ color: "#94a3b8", textDecoration: "none" }}>Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
