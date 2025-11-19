import eventEmitter from "@/utils/eventEmitter";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Fonction pour configurer le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("id_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Fonction pour configurer le token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      eventEmitter.emit("error", {
        title: "Session expirée",
        message: "Veuillez vous reconnecter.",
      });

      localStorage.removeItem("id_token");
      localStorage.removeItem("user");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }

    if (error.response?.status === 403) {
      eventEmitter.emit("error", {
        title: "Accès refusé",
        message:
          error.response?.data?.message ||
          "Vous n'avez pas les permissions nécessaires.",
      });
    }

    return Promise.reject(error);
  }
);

export default api;
