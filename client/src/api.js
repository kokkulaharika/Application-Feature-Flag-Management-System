import axios from "axios";

// Create a reusable Axios instance for communicating
// with our FastAPI backend.
const api = axios.create({
  // Live FastAPI backend deployed on railway
  baseURL: "application-feature-flag-management-system-production-6fe9.up.railway.app  ",
});

export default api;