import eventEmitter from "@/utils/eventEmitter";
import axios from "axios";
import { isPublicRoute } from "./routes";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Fonction pour configurer le token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isPublicRoute(location.pathname)) {
      eventEmitter.emit("error", {
        title: "Session expirée",
        message: "Veuillez vous reconnecter.",
      });

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
