import { useState, useEffect, useRef } from "react";
import { sendMessage, getHistory, sendVoice, textToSpeech } from "../services/api";
import useRecorder from "../hooks/useRecorder";

// Splits a reply into short chunks (1-2 sentences) for sentence-by-sentence speech,
// capped so very long answers aren't read out in full.
const splitForSpeech = (text, maxChars = 700) => {
  const sentences = text
    .replace(/[*#_`>]/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map(s => s.replace(/^[-•]\s*/, "").trim())
    .filter(s => /[a-z0-9]/i.test(s))
    .map(s => (/[.!?:;,]$/.test(s) ? s : `${s}.`)); // bullet items get a pause
  const chunks = [];
  let total = 0;
  for (const s of sentences) {
    if (total >= maxChars) break;
    const last = chunks[chunks.length - 1];
    // keep the first chunk to one sentence so audio starts as soon as possible
    if (chunks.length > 1 && last.length + s.length < 140) chunks[chunks.length - 1] = `${last} ${s}`;
    else chunks.push(s);
    total += s.length;
  }
  return chunks;
};

export default function ChatPage({ patientId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const bottomRef = useRef(null);
  const audioRef = useRef(null);
  const audioCacheRef = useRef(new Map()); // message id -> audio URLs, one per sentence chunk
  const speakSessionRef = useRef(0);
  const [voice, setVoice] = useState(null); // { id, status: "loading" | "playing" }
  const { supported: micSupported, recording, error: micError, start, stop } = useRecorder();

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

  // Stop any reply audio when leaving the page
  useEffect(() => () => { speakSessionRef.current += 1; audioRef.current?.pause(); }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMessage = { role: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendMessage(patientId, input);
      const { response, intent, is_emergency } = res.data;
      setMessages(prev => [...prev, { id: Date.now(), role: "assistant", text: response, intent, is_emergency }]);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessages(prev => [...prev, {
        role: "assistant",
        text: typeof detail === "string" ? detail : "Something went wrong. Please try again.",
        intent: null, error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Resolves when the clip ends (or can't play, e.g. autoplay blocked)
  const playUrl = url => new Promise(resolve => {
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });

  const stopSpeaking = () => {
    speakSessionRef.current += 1; // cancels any queued sentences
    audioRef.current?.pause();
    setVoice(null);
  };

  // Text is shown first; audio is generated sentence by sentence, so the first sentence
  // plays while the next one is still being synthesized (lower time-to-first-audio).
  const speak = async (id, text) => {
    stopSpeaking();
    const session = speakSessionRef.current;
    const chunks = splitForSpeech(text);
    if (!chunks.length) return;

    const urls = audioCacheRef.current.get(id) || [];
    audioCacheRef.current.set(id, urls);
    const fetchChunk = i => urls[i]
      ? Promise.resolve(urls[i])
      : textToSpeech(chunks[i]).then(res => (urls[i] = URL.createObjectURL(res.data))).catch(() => null);

    setVoice({ id, status: "loading" });
    const t0 = performance.now();
    let next = fetchChunk(0);
    for (let i = 0; i < chunks.length; i++) {
      const url = await next;
      if (session !== speakSessionRef.current || !url) break;
      if (i === 0) {
        const tts_ms = Math.round(performance.now() - t0);
        setMessages(prev => prev.map(m => m.id === id && m.timings && m.timings.tts_ms == null
          ? { ...m, timings: { ...m.timings, tts_ms } } : m));
        setVoice({ id, status: "playing" });
      }
      next = i + 1 < chunks.length ? fetchChunk(i + 1) : null; // prefetch while playing
      await playUrl(url);
      if (session !== speakSessionRef.current) return;
    }
    if (session === speakSessionRef.current) setVoice(null);
  };

  const handleMic = async () => {
    if (loading) return;
    if (!recording) {
      stopSpeaking(); // stop talking when the user starts talking
      return start();
    }
    const blob = await stop();
    if (!blob || blob.size < 1000) return; // ignore accidental taps
    setLoading(true);
    try {
      const res = await sendVoice(patientId, blob);
      const { transcript, response, intent, is_emergency, timings } = res.data;
      const id = Date.now();
      setMessages(prev => [
        ...prev,
        { role: "user", text: transcript, voice: true },
        { id, role: "assistant", text: response, intent, is_emergency, timings: { ...timings, tts_ms: null } },
      ]);
      setLoading(false);
      if (autoSpeak || is_emergency) speak(id, response);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessages(prev => [...prev, {
        role: "assistant",
        text: typeof detail === "string" ? detail : "Voice message failed. Please try again.",
        intent: null, error: true
      }]);
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
        background: "rgba(13,27,62,0.8)", backdropFilter: "blur(10px)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px"
      }}>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#e2e8f0" }}>AI Health Assistant</h2>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
            Ask about medications, symptoms, or your health documents — type or speak
          </p>
        </div>
        {micSupported && (
          <button onClick={() => setAutoSpeak(s => !s)} title="Speak replies out loud" style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#e2e8f0", borderRadius: "16px", padding: "6px 12px", fontSize: "12px",
            cursor: "pointer", flexShrink: 0
          }}>{autoSpeak ? "🔊 Voice on" : "🔇 Voice off"}</button>
        )}
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
              {msg.voice && <span style={{ marginRight: "6px", opacity: 0.7 }}>🎤</span>}
              {msg.text}
              {msg.intent && (
                <div style={{ marginTop: "8px", fontSize: "10px", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {msg.intent === "rag" ? "📚 knowledge base" : msg.intent === "appointment" ? "📅 appointment" : "💬 general"}
                </div>
              )}
              {msg.role === "assistant" && !msg.error && micSupported && (() => {
                const audioId = msg.id ?? `history-${i}`;
                const status = voice?.id === audioId ? voice.status : null;
                return (
                  <button onClick={() => (status ? stopSpeaking() : speak(audioId, msg.text))} style={{
                    display: "block", marginTop: "8px", background: "none", border: "none",
                    color: "#81e6d9", cursor: "pointer", fontSize: "12px", padding: 0
                  }}>
                    {status === "loading" ? "🔊 Preparing voice… (tap to cancel)"
                      : status === "playing" ? "⏹ Stop" : "🔊 Listen"}
                  </button>
                );
              })()}
              {msg.timings && (
                <div style={{ marginTop: "4px", fontSize: "10px", opacity: 0.35 }}>
                  STT {msg.timings.stt_ms}ms · Agent {msg.timings.agent_ms}ms · first audio {msg.timings.tts_ms == null ? "…" : `${msg.timings.tts_ms}ms`}
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

      {micError && (
        <div style={{ padding: "8px 28px", fontSize: "12px", color: "#fc8181", background: "rgba(197,48,48,0.08)" }}>
          🎤 {micError}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(13,27,62,0.8)", backdropFilter: "blur(10px)",
        display: "flex", gap: "12px", alignItems: "flex-end"
      }}>
        <textarea
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder={recording ? "Listening… tap ■ to send" : "Type your message... (Enter to send)"}
          rows={1} disabled={recording}
          style={{
            flex: 1, padding: "12px 18px", borderRadius: "24px",
            border: recording ? "1px solid rgba(229,62,62,0.5)" : "1px solid rgba(255,255,255,0.1)",
            resize: "none", fontSize: "14px",
            outline: "none", lineHeight: "1.5", background: "rgba(255,255,255,0.05)",
            color: "#e2e8f0"
          }}
        />
        {micSupported && (
          <button onClick={handleMic} disabled={loading} title={recording ? "Stop & send" : "Speak"} style={{
            background: recording ? "#e53e3e" : "rgba(255,255,255,0.08)",
            color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%",
            width: "44px", height: "44px", fontSize: "18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, opacity: loading ? 0.5 : 1,
            animation: recording ? "micPulse 1.2s infinite" : "none", transition: "all 0.2s"
          }}>{recording ? "■" : "🎤"}</button>
        )}
        <button onClick={handleSend} disabled={loading || recording || !input.trim()} style={{
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
