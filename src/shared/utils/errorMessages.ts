import { AxiosError } from 'axios';

/**
 * Un message d'erreur lisible, pour le contexte où l'on se trouve.
 *
 * L'API renvoie déjà un message en français quand elle sait quoi dire : il
 * remonte tel quel. Le repli ne sert qu'aux pannes qui n'en portent pas — le
 * réseau, un 500.
 */
export const getErrorMessage = (error: unknown, context: string): string => {
  if (error instanceof AxiosError) {
    // Network error
    if (!error.response) {
      return `${context} : Vérifiez votre connexion internet.`;
    }

    // Erreur serveur
    switch (error.response.status) {
      case 401:
        return `${context} : Vous devez être connecté.`;
      case 403:
        return `${context} : Vous n'avez pas les permissions.`;
      case 404:
        return `${context} : Ressource introuvable.`;
      case 500:
        return `${context} : Erreur serveur. Réessayez plus tard.`;
      default:
        return `${context} : ${error.response.data?.message || 'Une erreur est survenue.'}`;
    }
  }

  return `${context} : Une erreur inattendue est survenue.`;
};
