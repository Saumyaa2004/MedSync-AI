import { useState } from "react";
import { loginPatient, registerPatient } from "../services/api";
import Logo from "../components/Logo";

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await loginPatient({ email, password });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await registerPatient({ name, email, password, age: age ? parseInt(age) : null });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Email may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    color: "#e2e8f0",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 50%, #0a1628 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px"
    }}>
      {/* Glow effects */}
      <div style={{
        position: "fixed", top: "20%", left: "15%", width: "300px", height: "300px",
        background: "radial-gradient(circle, rgba(56,178,172,0.08) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "fixed", bottom: "20%", right: "15%", width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(43,108,176,0.08) 0%, transparent 70%)",
        pointerEvents: "none"
      }} />

      <div style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "40px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 25px 80px rgba(0,0,0,0.5)"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            <Logo size={56} />
          </div>
          <h1 style={{
            fontSize: "26px", fontWeight: "700", color: "#e2e8f0",
            background: "linear-gradient(135deg, #38b2ac, #63b3ed)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            MedSync AI
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
            Your intelligent healthcare assistant
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.05)",
          borderRadius: "10px", padding: "4px", marginBottom: "24px",
          border: "1px solid rgba(255,255,255,0.06)"
        }}>
          {["login", "register"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); setPassword(""); }}
              style={{
                flex: 1, padding: "9px", border: "none", borderRadius: "7px",
                background: mode === m
                  ? "linear-gradient(135deg, rgba(56,178,172,0.3), rgba(43,108,176,0.3))"
                  : "transparent",
                color: mode === m ? "#63b3ed" : "rgba(255,255,255,0.4)",
                fontWeight: mode === m ? "600" : "400",
                fontSize: "14px",
                transition: "all 0.2s",
                textTransform: "capitalize",
                border: mode === m ? "1px solid rgba(56,178,172,0.2)" : "1px solid transparent"
              }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {mode === "register" && (
            <>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Age (optional)</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Enter your age" style={inputStyle} />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()}
              placeholder="Enter your email" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && mode === "login" && handleLogin()}
                placeholder={mode === "register" ? "Min 6 characters" : "Enter your password"}
                style={{ ...inputStyle, paddingRight: "44px" }} />
              <button onClick={() => setShowPassword(!showPassword)} style={{
                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", fontSize: "16px", color: "rgba(255,255,255,0.3)"
              }}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            onClick={mode === "login" ? handleLogin : handleRegister}
            disabled={loading || !email.trim() || !password.trim() || (mode === "register" && !name.trim())}
            style={{
              background: loading || !email.trim() || !password.trim()
                ? "rgba(255,255,255,0.1)"
                : "linear-gradient(135deg, #38b2ac, #2b6cb0)",
              color: "white", border: "none", padding: "13px", borderRadius: "10px",
              fontSize: "15px", fontWeight: "600", width: "100%", marginTop: "4px",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 4px 20px rgba(56,178,172,0.3)"
            }}>
            {loading
              ? (mode === "login" ? "Signing in..." : "Creating account...")
              : (mode === "login" ? "Sign In" : "Create Account")}
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: "16px", padding: "10px 14px", borderRadius: "8px",
            background: "rgba(197,48,48,0.15)", color: "#fc8181", fontSize: "13px",
            border: "1px solid rgba(197,48,48,0.3)"
          }}>
            {error}
          </div>
        )}

        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: "20px" }}>
          {mode === "login" ? "New here? Switch to Register to create an account." : "Already registered? Sign in with your email and password."}
        </p>
      </div>
    </div>
  );
}