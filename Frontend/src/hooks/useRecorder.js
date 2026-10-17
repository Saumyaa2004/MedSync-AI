import { useRef, useState } from "react";

// Chrome/Edge/Firefox record webm/opus, Safari records mp4
const pickMimeType = () =>
  ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]
    .find(t => window.MediaRecorder?.isTypeSupported?.(t)) || "";

export default function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const supported = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      setError(e.name === "NotAllowedError" ? "Microphone permission denied" : "Could not access microphone");
    }
  };

  const stop = () => new Promise(resolve => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return resolve(null);
    recorder.onstop = () => {
      streamRef.current?.getTracks().forEach(t => t.stop()); // turn off the mic light
      recorderRef.current = null;
      setRecording(false);
      resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
    };
    recorder.stop();
  });

  return { supported, recording, error, start, stop };
}
