import axios from "axios";

// Create a reusable Axios instance for communicating
// with our FastAPI backend.
const api = axios.create({
  // Live FastAPI backend deployed on Render
  baseURL: "https://feature-flag-api-smxt.onrender.com",
});

export default api;