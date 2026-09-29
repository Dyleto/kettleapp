import { useEffect } from 'react';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { getErrorMessage } from '@/shared/utils/errorMessages';

/**
 * Montre l'erreur d'une requête, une fois, sans que l'écran ait à s'en
 * occuper.
 *
 * React Query garde l'objet `error` tant que la requête reste en échec :
 * l'afficher au fil du rendu produisait un toast à chaque redessin. L'effet
 * ne dépend que de l'erreur et du titre, donc il ne parle qu'une fois par
 * panne.
 */
export const useToastError = (
  error: Error | null | undefined,
  title: string
) => {
  useEffect(() => {
    if (error) {
      toaster.create({
        title,
        description: getErrorMessage(error, title),
        type: 'error',
      });
    }
  }, [error, title]);
};
