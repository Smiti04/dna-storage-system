import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  return (
    <div>
      <h2>Forgot Password</h2>

      <input
        placeholder="Enter Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button>Send OTP</button>

      <input placeholder="Enter OTP" />
      <input placeholder="New Password" />

      <button>Reset Password</button>

      <p>
        <Link to="/">Back to Login</Link>
      </p>
    </div>
  );
}

export default ForgotPassword;