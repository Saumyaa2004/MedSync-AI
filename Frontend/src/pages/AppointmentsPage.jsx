import { useState, useEffect } from "react";
import { bookAppointment, getAppointments, cancelAppointment } from "../services/api";

export default function AppointmentsPage({ patientId }) {
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchAppointments = () => {
    getAppointments(patientId).then(res => setAppointments(res.data)).catch(() => {});
  };

  useEffect(() => { fetchAppointments(); }, [patientId]);

  const handleBook = async () => {
    if (!doctor.trim() || !date) return;
    setLoading(true); setMessage(null);
    try {
      await bookAppointment({ patient_id: patientId, doctor, date });
      setMessage({ type: "success", text: `Appointment with ${doctor} booked!` });
      setDoctor(""); setDate(""); fetchAppointments();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Booking failed." });
    } finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    try { await cancelAppointment(id); fetchAppointments(); } catch {}
  };

  const inputStyle = {
    padding: "11px 14px", borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)", fontSize: "14px", outline: "none",
    background: "rgba(255,255,255,0.05)", color: "#e2e8f0", width: "100%", boxSizing: "border-box"
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.03)", borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.07)", padding: "20px", marginBottom: "16px"
  };

  return (
    <div style={{ padding: "28px", maxWidth: "680px", background: "#0a0f1e", minHeight: "100vh" }}>
      <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#e2e8f0", marginBottom: "24px" }}>
        📅 Appointments
      </h2>

      {/* Booking form */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.6)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Book New Appointment
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input value={doctor} onChange={e => setDoctor(e.target.value)}
            placeholder="Doctor name (e.g. Dr. Sharma)" style={inputStyle} />
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          <button onClick={handleBook} disabled={loading || !doctor.trim() || !date} style={{
            background: loading || !doctor.trim() || !date
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, #38b2ac, #2b6cb0)",
            color: "white", border: "none", padding: "11px", borderRadius: "8px",
            fontSize: "14px", fontWeight: "600", transition: "all 0.2s",
            boxShadow: "0 4px 15px rgba(56,178,172,0.2)"
          }}>
            {loading ? "Booking..." : "Book Appointment"}
          </button>
        </div>

        {message && (
          <div style={{
            marginTop: "12px", padding: "10px 14px", borderRadius: "8px", fontSize: "13px",
            background: message.type === "success" ? "rgba(56,178,172,0.1)" : "rgba(197,48,48,0.1)",
            color: message.type === "success" ? "#38b2ac" : "#fc8181",
            border: `1px solid ${message.type === "success" ? "rgba(56,178,172,0.2)" : "rgba(197,48,48,0.2)"}`
          }}>
            {message.text}
          </div>
        )}
      </div>

      {/* List */}
      <h3 style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.4)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Your Appointments
      </h3>
      {appointments.length === 0 && (
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "14px" }}>No appointments yet.</p>
      )}
      {appointments.map(appt => (
        <div key={appt.id} style={{
          ...cardStyle, marginBottom: "10px",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <p style={{ fontWeight: "600", fontSize: "14px", color: "#e2e8f0" }}>{appt.doctor}</p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
              {new Date(appt.date).toLocaleString()}
            </p>
            <span style={{
              fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px",
              color: appt.status === "scheduled" ? "#38b2ac" : "rgba(255,255,255,0.25)"
            }}>
              {appt.status}
            </span>
          </div>
          {appt.status === "scheduled" && (
            <button onClick={() => handleCancel(appt.id)} style={{
              background: "rgba(197,48,48,0.1)", border: "1px solid rgba(197,48,48,0.3)",
              color: "#fc8181", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "600"
            }}>
              Cancel
            </button>
          )}
        </div>
      ))}
    </div>
  );
}