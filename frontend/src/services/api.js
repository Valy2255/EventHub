import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Adăugare interceptor pentru a atașa tokenul la cereri
api.interceptors.request.use(
  (config) => {
    // Verificăm întâi în sessionStorage
    let token = sessionStorage.getItem("token");

    // Dacă nu există în sessionStorage, verificăm în localStorage
    if (!token) {
      const authType = localStorage.getItem("authType");

      // Folosim token-ul din localStorage doar dacă tipul de autentificare este persistent
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

// Interceptor pentru a gestiona erorile de autentificare
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Delogăm utilizatorul dacă primim 401 Unauthorized
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
