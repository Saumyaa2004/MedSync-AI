import { useState } from "react";
import { uploadDocument, askDocument } from "../services/api";

export default function DocumentsPage({ patientId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setUploadMessage(null);
    try {
      const res = await uploadDocument(patientId, file);
      setUploadMessage({ type: "success", text: `✅ ${res.data.filename} ingested (${res.data.chunks_ingested} chunks)` });
      setFile(null);
    } catch (err) {
      setUploadMessage({ type: "error", text: err.response?.data?.detail || "Upload failed." });
    } finally { setUploading(false); }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true); setAnswer(null);
    try {
      const res = await askDocument(patientId, question);
      setAnswer(res.data);
    } catch {
      setAnswer({ answer: "Something went wrong. Please try again.", sources: [] });
    } finally { setAsking(false); }
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.03)", borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.07)", padding: "22px", marginBottom: "20px"
  };

  const inputStyle = {
    padding: "11px 14px", borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)", fontSize: "14px", outline: "none",
    background: "rgba(255,255,255,0.05)", color: "#e2e8f0", width: "100%", boxSizing: "border-box"
  };

  const btnStyle = (disabled) => ({
    background: disabled ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #38b2ac, #2b6cb0)",
    color: "white", border: "none", padding: "11px", borderRadius: "8px",
    fontSize: "14px", fontWeight: "600", width: "100%", transition: "all 0.2s",
    boxShadow: disabled ? "none" : "0 4px 15px rgba(56,178,172,0.2)"
  });

  return (
    <div style={{ padding: "28px", maxWidth: "680px", background: "#0a0f1e", minHeight: "100vh" }}>
      <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#e2e8f0", marginBottom: "24px" }}>
        📄 My Documents
      </h2>

      {/* Upload */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.5)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Upload Medical Document
        </h3>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.25)", marginBottom: "16px" }}>
          Upload prescriptions, lab reports, or discharge summaries (PDF or TXT)
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input type="file" accept=".pdf,.txt" onChange={e => setFile(e.target.files[0])}
            style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }} />
          {file && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>Selected: {file.name}</p>}
          <button onClick={handleUpload} disabled={uploading || !file} style={btnStyle(uploading || !file)}>
            {uploading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
        {uploadMessage && (
          <div style={{
            marginTop: "12px", padding: "10px 14px", borderRadius: "8px", fontSize: "13px",
            background: uploadMessage.type === "success" ? "rgba(56,178,172,0.1)" : "rgba(197,48,48,0.1)",
            color: uploadMessage.type === "success" ? "#38b2ac" : "#fc8181",
            border: `1px solid ${uploadMessage.type === "success" ? "rgba(56,178,172,0.2)" : "rgba(197,48,48,0.2)"}`
          }}>
            {uploadMessage.text}
          </div>
        )}
      </div>

      {/* Ask */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,0.5)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Ask About Your Documents
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAsk()}
            placeholder="e.g. What is my prescribed dosage?" style={inputStyle} />
          <button onClick={handleAsk} disabled={asking || !question.trim()} style={btnStyle(asking || !question.trim())}>
            {asking ? "Searching..." : "Ask"}
          </button>
        </div>
        {answer && (
          <div style={{
            marginTop: "16px", padding: "16px", borderRadius: "8px",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)"
          }}>
            <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#e2e8f0", whiteSpace: "pre-wrap" }}>
              {answer.answer}
            </p>
            {answer.sources?.length > 0 && (
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", marginTop: "10px" }}>
                Source: {answer.sources.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}