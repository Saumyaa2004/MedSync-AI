import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import DocumentsPage from "./pages/DocumentsPage";
import Logo from "./components/Logo";
import "./index.css";

export default function App() {
  const [patient, setPatient] = useState(null);
  const [activePage, setActivePage] = useState("chat");

  const handleLogin = (patientData) => { setPatient(patientData); setActivePage("chat"); };
  const handleLogout = () => { setPatient(null); setActivePage("chat"); };

  if (!patient) return <LoginPage onLogin={handleLogin} />;

  const navItems = [
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "documents", label: "Documents", icon: "📄" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e" }}>
      {/* Sidebar */}
      <aside style={{
        width: "230px", flexShrink: 0,
        background: "linear-gradient(180deg, #0d1b3e 0%, #0a1628 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        padding: "24px 16px",
        display: "flex", flexDirection: "column", gap: "6px"
      }}>
        {/* Brand */}
        <div style={{ marginBottom: "32px", padding: "0 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Logo size={32} />
            <span style={{
              fontSize: "18px", fontWeight: "700",
              background: "linear-gradient(135deg, #38b2ac, #63b3ed)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
            }}>MedSync AI</span>
          </div>
          {/* Patient card */}
          <div style={{
            background: "rgba(56,178,172,0.08)", border: "1px solid rgba(56,178,172,0.15)",
            borderRadius: "10px", padding: "10px 12px"
          }}>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>{patient.name}</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
              Patient #{patient.id}
            </p>
          </div>
        </div>

        {/* Nav */}
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActivePage(item.id)} style={{
            background: activePage === item.id
              ? "linear-gradient(135deg, rgba(56,178,172,0.2), rgba(43,108,176,0.2))"
              : "transparent",
            color: activePage === item.id ? "#63b3ed" : "rgba(255,255,255,0.45)",
            border: activePage === item.id ? "1px solid rgba(56,178,172,0.2)" : "1px solid transparent",
            padding: "11px 14px", borderRadius: "10px", textAlign: "left",
            fontSize: "14px", fontWeight: activePage === item.id ? "600" : "400",
            display: "flex", alignItems: "center", gap: "10px", transition: "all 0.2s"
          }}>
            <span>{item.icon}</span> {item.label}
          </button>
        ))}

        <div style={{ marginTop: "auto" }}>
          <button onClick={handleLogout} style={{
            background: "transparent", color: "rgba(255,255,255,0.3)",
            border: "1px solid rgba(255,255,255,0.08)", padding: "10px 14px",
            borderRadius: "10px", fontSize: "13px", width: "100%",
            display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s"
          }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "hidden" }}>
        {activePage === "chat" && <ChatPage patientId={patient.id} />}
        {activePage === "appointments" && <AppointmentsPage patientId={patient.id} />}
        {activePage === "documents" && <DocumentsPage patientId={patient.id} />}
      </main>
    </div>
  );
}