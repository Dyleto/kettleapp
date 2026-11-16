import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { isNotFound } from '@/shared/utils/queryState';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

interface LoadFailureProps {
  query: Pick<UseQueryResult, 'error' | 'refetch' | 'isRefetching'>;
  /** Ce qui n'a pas pu se charger, dit du point de vue de la personne. */
  line?: string;
  /**
   * Ce qu'on dit quand le serveur a répondu que la chose n'existe pas. À
   * fournir sur un écran de détail, dont l'adresse peut vieillir ; une liste
   * n'en a pas besoin, elle ne peut pas être introuvable.
   */
  missing?: { title: string; line: string; action: ReactNode };
}

/**
 * Ce qu'un écran affiche quand sa requête n'a rien rendu.
 *
 * Trois écrans de l'espace coach répondaient par `return null` : une page
 * blanche, sans un mot, que rien ne distinguait d'un écran en train de
 * charger. Deux autres affichaient leur liste vide, comme si le coach
 * n'avait ni client ni exercice.
 *
 * Deux situations, et il faut les séparer. Une panne se retente, donc on
 * propose de réessayer. Une adresse qui ne mène nulle part ne se retente
 * pas : on dit que la chose n'existe plus, et on montre par où repartir.
 */
export const LoadFailure = ({ query, line, missing }: LoadFailureProps) =>
  missing && isNotFound(query.error) ? (
    <EmptyState mood="oops" headingLevel="h1" {...missing} />
  ) : (
    <ErrorState
      headingLevel="h1"
      line={line}
      onRetry={() => void query.refetch()}
      isRetrying={query.isRefetching}
    />
  );
