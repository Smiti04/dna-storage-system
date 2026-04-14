import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:9000",
  timeout: 300000, // 5 minutes global timeout
});

// Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ── Helper: extract readable error message ──────────────────────────
export const extractError = (err, fallback = "Something went wrong") => {
  if (!err) return fallback;

  // Timeout
  if (err.code === "ECONNABORTED") return "Request timed out — file may be too large for free tier";

  // FastAPI validation errors come as array
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map(d => d.msg || JSON.stringify(d)).join(", ");
  }
  if (typeof detail === "string") return detail;

  // Network error
  if (err.message === "Network Error") return "Cannot reach server. Is the backend running?";

  // HTTP status messages
  const status = err?.response?.status;
  if (status === 400) return detail || "Bad request";
  if (status === 401) return detail || "Unauthorized — check your credentials";
  if (status === 403) return detail || "Access denied";
  if (status === 404) return detail || "Resource not found";
  if (status === 408) return "Server timeout — file too large for free tier";
  if (status === 422) return "Invalid data sent to server";
  if (status === 500) return detail || "Server error — check backend logs";
  if (status === 502) return "Server is starting up — try again in 30 seconds";
  if (status === 503) return "Server unavailable — try again shortly";
  if (status === 504) return "Gateway timeout — encoding took too long. Try a smaller file.";

  return err?.message || fallback;
};

// =======================
// BACKEND HEALTH CHECK
// =======================
export const checkBackendHealth = () => API.get("/health", { timeout: 8000 });

// =======================
// AUTH APIs
// =======================
export const loginUser = async (username, password) => {
  const data = new URLSearchParams();
  data.append("username", username);
  data.append("password", password);

  try {
    const res = await API.post("/login", data, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return res;
  } catch (err) {
    return { error: extractError(err, "Login failed") };
  }
};

export const registerUser = async (data) => {
  try {
    return await API.post("/register", data);
  } catch (err) {
    throw { message: extractError(err, "Registration failed") };
  }
};

// =======================
// FILE APIs
// =======================
export const uploadFile = (file, encodingType, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("encoding_type", encodingType);

  return API.post("/upload", formData, {
    timeout: 600000, // 10 minutes for upload+encoding
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(`Uploading: ${percent}%`);
      }
    },
  });
};

export const getUserFiles = () => API.get("/user_files");

export const deleteFile = (file_id) => {
  const formData = new FormData();
  formData.append("file_id", file_id);
  return API.delete("/delete_file", { data: formData });
};

// =======================
// JOB STATUS (poll for background encoding)
// =======================
export const getJobStatus = (jobId) => API.get(`/job_status/${jobId}`);

// =======================
// RETRIEVE FILE
// =======================
export const retrieveFile = (file_id, retrieval_key, onProgress) => {
  const formData = new FormData();
  formData.append("file_id", file_id);
  formData.append("key", retrieval_key);

  if (onProgress) onProgress("Requesting file from server...");

  return API.post("/retrieve", formData, {
    responseType: "arraybuffer",
    timeout: 600000, // 10 minutes for decoding
    onDownloadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(`Downloading: ${percent}%`);
      }
    },
  });
};

// =======================
// GET DNA SEQUENCE
// =======================
export const getSequence = (file_id) => {
  const formData = new FormData();
  formData.append("file_id", file_id);
  return API.post("/get_sequence", formData);
};

// =======================
// ANALYZE DNA CONSTRAINTS
// =======================
export const analyzeConstraints = (file_id) => {
  const formData = new FormData();
  formData.append("file_id", file_id);
  return API.post("/analyze_constraints", formData);
};

// =======================
// CHANGE PASSWORD
// =======================
export const changePassword = (current_password, new_password) => {
  const formData = new FormData();
  formData.append("current_password", current_password);
  formData.append("new_password", new_password);
  return API.post("/change_password", formData);
};