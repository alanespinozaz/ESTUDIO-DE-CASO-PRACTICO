import axios from "axios";

// ======================================================
// 🌎 CONFIGURACIÓN DE AXIOS
// ======================================================
// Detecta si hay una variable de entorno (VITE_API_BASE) o usa localhost por defecto
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3000/api", // ✅ incluye /api
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// 🔐 INTERCEPTOR DE PETICIONES (agrega token JWT)
// ======================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ======================================================
// ⚠️ INTERCEPTOR DE RESPUESTAS (maneja errores globales)
// ======================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("⚠️ Sesión expirada o token inválido");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
