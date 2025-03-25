import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add interceptor to attach token to requests
api.interceptors.request.use(
  (config) => {
    // Check sessionStorage first
    let token = sessionStorage.getItem("token");

    // If not in sessionStorage, check localStorage
    if (!token) {
      const authType = localStorage.getItem("authType");

      // Use token from localStorage only if auth type is persistent
      if (authType === "persistent") {
        token = localStorage.getItem("token");
      }
    }

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Log out user if 401 Unauthorized is received
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("authType");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;