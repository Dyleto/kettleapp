import eventEmitter from '@/shared/utils/eventEmitter';
import axios from 'axios';
import { isPublicRoute } from '@/shared/config/routes';

/**
 * Le client HTTP de l'application, et le seul.
 *
 * `withCredentials` n'est pas une option de confort : la session vit dans un
 * cookie `httpOnly`, que le JavaScript ne peut pas lire. Sans lui, le
 * navigateur ne l'envoie pas et toutes les requêtes repartent anonymes.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

/**
 * Kettle tutoie le client et vouvoie le coach.
 *
 * L'intercepteur est partagé par les deux espaces : il ne peut pas se fier au
 * rôle du compte — un compte porte souvent les deux — mais l'adresse dit où
 * l'on se trouve, et c'est la même règle que pour « Mon compte ».
 */
const isClientArea = () => location.pathname.startsWith('/client');

/**
 * Les deux pannes qu'un écran ne sait pas expliquer lui-même.
 *
 * Un 401 ne remonte à personne : la requête a échoué au milieu d'un écran qui
 * ne l'attendait pas, et chaque appelant aurait eu à le traiter. Il est donc
 * traité une fois ici. Le délai avant la redirection laisse le temps de lire
 * pourquoi on repart de la connexion — sans lui, la page change sans un mot.
 *
 * Rien n'est dit sur une route publique : y annoncer une session expirée à
 * quelqu'un qui n'a jamais été connecté ne décrit rien de ce qui s'est passé.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isPublicRoute(location.pathname)) {
      eventEmitter.emit('error', {
        title: 'Session expirée',
        message: isClientArea()
          ? 'Reconnecte-toi.'
          : 'Veuillez vous reconnecter.',
      });

      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }

    if (error.response?.status === 403) {
      eventEmitter.emit('error', {
        title: 'Accès refusé',
        message:
          error.response?.data?.message ||
          (isClientArea()
            ? "Tu n'as pas les droits nécessaires."
            : "Vous n'avez pas les permissions nécessaires."),
      });
    }

    return Promise.reject(error);
  }
);

export default api;
