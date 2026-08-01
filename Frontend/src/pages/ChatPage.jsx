import { useState, useEffect, useRef } from "react";
import { sendMessage, getHistory } from "../services/api";

export default function ChatPage({ patientId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getHistory(patientId).then(res => {
      const history = res.data.raw || [];
      const formatted = history.reverse().map(conv => ([
        { role: "user", text: conv.query },
        { role: "assistant", text: conv.response }
      ])).flat();
      setMessages(formatted);
    }).catch(() => {});
  }, [patientId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendMessage(patientId, input);
      const { response, intent, is_emergency } = res.data;
      setMessages(prev => [...prev, { role: "assistant", text: response, intent, is_emergency }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Something went wrong. Please try again.", intent: null }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0f1e" }}>
      {/* Header */}
      <div style={{
        padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(13,27,62,0.8)", backdropFilter: "blur(10px)"
      }}>
        <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#e2e8f0" }}>AI Health Assistant</h2>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
          Ask about medications, symptoms, or your health documents
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", marginTop: "80px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.3)" }}>How can I help you today?</p>
            <p style={{ fontSize: "13px", marginTop: "8px", color: "rgba(255,255,255,0.2)" }}>
              Ask about medications, book appointments, or upload reports
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "68%",
              padding: "12px 16px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: msg.is_emergency
                ? "rgba(197,48,48,0.15)"
                : msg.role === "user"
                ? "linear-gradient(135deg, #2b6cb0, #2c7a7b)"
                : "rgba(255,255,255,0.05)",
              color: "#e2e8f0",
              border: msg.is_emergency
                ? "1px solid rgba(197,48,48,0.4)"
                : msg.role === "assistant"
                ? "1px solid rgba(255,255,255,0.08)"
                : "none",
              fontSize: "14px", lineHeight: "1.6", whiteSpace: "pre-wrap",
              boxShadow: msg.role === "user" ? "0 4px 15px rgba(43,108,176,0.3)" : "none"
            }}>
              {msg.is_emergency && (
                <div style={{ fontWeight: "700", color: "#fc8181", marginBottom: "6px", fontSize: "13px" }}>
                  🚨 Emergency Alert
                </div>
              )}
              {msg.text}
              {msg.intent && (
                <div style={{ marginTop: "8px", fontSize: "10px", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {msg.intent === "rag" ? "📚 knowledge base" : msg.intent === "appointment" ? "📅 appointment" : "💬 general"}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "12px 20px", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px",
              color: "rgba(255,255,255,0.4)", fontSize: "20px", letterSpacing: "4px"
            }}>⋯</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(13,27,62,0.8)", backdropFilter: "blur(10px)",
        display: "flex", gap: "12px", alignItems: "flex-end"
      }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send)" rows={1}
          style={{
            flex: 1, padding: "12px 18px", borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.1)", resize: "none", fontSize: "14px",
            outline: "none", lineHeight: "1.5", background: "rgba(255,255,255,0.05)",
            color: "#e2e8f0"
          }}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()} style={{
          background: loading || !input.trim()
            ? "rgba(255,255,255,0.1)"
            : "linear-gradient(135deg, #38b2ac, #2b6cb0)",
          color: "white", border: "none", borderRadius: "50%",
          width: "44px", height: "44px", fontSize: "18px",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: "0 4px 15px rgba(56,178,172,0.3)", transition: "all 0.2s"
        }}>➤</button>
      </div>
    </div>
  );
}