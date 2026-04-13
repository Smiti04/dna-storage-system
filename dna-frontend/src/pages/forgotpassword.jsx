import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const lb = {display:"block",fontSize:"14px",fontWeight:"600",color:"#c4b5fd",marginBottom:"6px"};

  return (
    <div style={{minHeight:"100vh",background:"#0a0912",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:"400px",padding:"0 20px"}}>
        <div style={{textAlign:"center",marginBottom:"36px"}}>
          <div style={{fontSize:"24px",fontWeight:"700",letterSpacing:"2px",fontFamily:"var(--font-display)"}}><span style={{color:"#a29bfe"}}>DNA</span> <span style={{color:"#9a8fc0"}}>VAULT</span></div>
          <div style={{fontSize:"14px",color:"#9a8fc0",marginTop:"6px",fontWeight:"500"}}>Reset your password</div>
        </div>
        <div style={{background:"#12101e",border:"1px solid #2a2440",borderRadius:"10px",padding:"28px"}}>
          <div style={{marginBottom:"14px"}}><label style={lb}>Email</label><input className="input-field" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <button className="btn-primary" style={{width:"100%",marginBottom:"14px"}}>Send Reset Code</button>
          <div style={{marginBottom:"14px"}}><label style={lb}>Reset Code</label><input className="input-field" placeholder="Enter code from email" value={otp} onChange={e=>setOtp(e.target.value)} /></div>
          <div style={{marginBottom:"18px"}}><label style={lb}>New Password</label><input className="input-field" type="password" placeholder="Enter new password" value={newPw} onChange={e=>setNewPw(e.target.value)} /></div>
          <button className="btn-primary" style={{width:"100%"}}>Reset Password</button>
          {error&&<div style={{fontSize:"13px",fontWeight:"600",color:"#ef4444",marginTop:"14px",padding:"10px 14px",background:"#1a0a0a",borderRadius:"6px",border:"1px solid rgba(239,68,68,0.3)"}}>{error}</div>}
          {msg&&<div style={{fontSize:"13px",fontWeight:"600",color:"#22c55e",marginTop:"14px",padding:"10px 14px",background:"#0a1a12",borderRadius:"6px",border:"1px solid rgba(34,197,94,0.3)"}}>{msg}</div>}
          <div style={{marginTop:"18px",textAlign:"center",fontSize:"13px",fontWeight:"600"}}>
            <Link to="/login" style={{color:"#48dbfb",textDecoration:"none"}}>← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ForgotPassword;
