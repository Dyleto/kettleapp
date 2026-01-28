import { AxiosError } from "axios";

/**
 * Génère un message d'erreur lisible selon le contexte
 */
export const getErrorMessage = (error: unknown, context: string): string => {
  if (error instanceof AxiosError) {
    // Erreur réseau
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
        return `${context} : ${error.response.data?.message || "Une erreur est survenue."}`;
    }
  }

  return `${context} : Une erreur inattendue est survenue.`;
};
