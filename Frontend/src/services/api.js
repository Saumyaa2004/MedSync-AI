import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "https://medsync-backend.onrender.com";

const api = axios.create({ baseURL: BASE_URL });

// Patients
export const registerPatient = (data) => api.post("/patients/", data);
export const getPatient = (id) => api.get(`/patients/${id}`);
export const loginPatient = (data) => api.post("/patients/login", data);

// Chat
export const sendMessage = (patient_id, message) =>
  api.post("/chat/", { patient_id, message });

// Conversations
export const getHistory = (patient_id) =>
  api.get(`/conversations/${patient_id}/history`);

// Appointments
export const bookAppointment = (data) => api.post("/appointments/", data);
export const getAppointments = (patient_id) =>
  api.get(`/appointments/patient/${patient_id}`);
export const cancelAppointment = (id) =>
  api.patch(`/appointments/${id}/cancel`);

// Documents
export const uploadDocument = (patient_id, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/documents/${patient_id}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const askDocument = (patient_id, question) =>
  api.post(`/documents/${patient_id}/ask`, { question });

// Knowledge base
export const askKnowledge = (question) =>
  api.post("/knowledge/ask", { question });