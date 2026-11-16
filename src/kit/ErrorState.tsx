import { Box } from '@chakra-ui/react';
import { LuRefreshCw } from 'react-icons/lu';
import { ActionButton } from './ActionButton';
import { EmptyState } from './EmptyState';

interface ErrorStateProps {
  /** Ce qui n'a pas pu se charger, dit du point de vue de la personne. */
  line?: string;
  onRetry: () => void;
  /** Une nouvelle tentative est en cours : le bouton le montre, et ne se
   * laisse pas presser deux fois. */
  isRetrying?: boolean;
  headingLevel?: 'h1' | 'h2';
}

/**
 * Ce qu'on affiche quand le serveur n'a pas répondu.
 *
 * Il n'existait pas, et son absence mentait : une panne de réseau laissait
 * la liste des séances vide, donc l'écran concluait « Pas encore de
 * programme ». Un client en salle, sans réseau, lisait que son coach ne lui
 * avait rien préparé.
 *
 * Deux choses le distinguent d'un écran vide. Il dit que rien n'est perdu —
 * la première crainte devant une panne — et il propose le seul geste utile.
 * `role="alert"` le fait annoncer : un écran qui change de contenu sans
 * prévenir laisse un lecteur d'écran sur l'ancien.
 */
export const ErrorState = ({
  line = 'Vérifie ta connexion, puis réessaie.',
  onRetry,
  isRetrying = false,
  headingLevel,
}: ErrorStateProps) => (
  <Box role="alert">
    <EmptyState
      mood="oops"
      title="Kettle ne répond pas"
      line={line}
      headingLevel={headingLevel}
      action={
        <ActionButton size="md" onClick={onRetry} loading={isRetrying}>
          <LuRefreshCw size={18} />
          Réessayer
        </ActionButton>
      }
    />
  </Box>
);
