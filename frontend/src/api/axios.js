/**
 * api/axios.js — Configuration centrale d'Axios
 * ================================================
 * Toutes les requêtes HTTP passent par ici.
 * - Attache automatiquement le token JWT à chaque requête
 * - Redirige vers /login si le token est expiré (401)
 */
import axios from 'axios';

// URL de base du backend Django
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Créer une instance Axios configurée
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Intercepteur de REQUÊTE ──────────────────────────────────
// Avant chaque appel, on ajoute le token JWT dans l'en-tête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Intercepteur de RÉPONSE ──────────────────────────────────
// Si le serveur répond 401 (token expiré) → on essaie de rafraîchir
api.interceptors.response.use(
  (response) => response, // Succès → on laisse passer
  async (error) => {
    const originalRequest = error.config;

    // Token expiré et on n'a pas déjà essayé de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const res = await axios.post(`${API_BASE}/auth/refresh/`, { refresh });
        
        // Sauvegarder le nouveau token
        localStorage.setItem('access_token', res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        
        return api(originalRequest); // Rejouer la requête originale
      } catch {
        // Refresh échoué → déconnexion forcée
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
