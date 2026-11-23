import { HStack, Text } from '@chakra-ui/react';
import { LuRefreshCw, LuTriangleAlert } from 'react-icons/lu';
import { PillButton } from './PillButton';

/**
 * La panne d'une partie de l'écran, dans cette partie.
 *
 * `ErrorState` prend tout l'écran — le personnage, le titre, le bouton —, et
 * c'est juste quand rien d'autre ne peut s'afficher. Mais quand une seule
 * lecture échoue, le reste de l'écran est là et doit le rester : la liste
 * des clients quand leurs dernières séances ne répondent pas, les réglages
 * de « Mon compte » quand son résumé manque. Faute de cette pièce, ces
 * zones retombaient sur leur état vide, et affirmaient le faux — « Ses
 * séances terminées apparaîtront ici » pour un client qui en a cinquante.
 *
 * `role="alert"` comme sa grande sœur : la zone change de contenu, un
 * lecteur d'écran doit l'apprendre.
 */
export const ZoneFailure = ({
  line,
  onRetry,
  isRetrying = false,
}: {
  /** Ce qui n'a pas pu se charger, et ce qui est sauf. */
  line: string;
  onRetry: () => void;
  isRetrying?: boolean;
}) => (
  <HStack
    role="alert"
    gap="12px"
    align="center"
    bg="surface.card"
    borderRadius="card"
    px="16px"
    py="12px"
    data-zone-failure
  >
    <LuTriangleAlert
      size={18}
      color="var(--chakra-colors-app-error)"
      aria-hidden
    />
    <Text flex={1} minW={0} fontSize="sm" color="fg.muted">
      {line}
    </Text>
    <PillButton tone="outline" onClick={onRetry} disabled={isRetrying}>
      <LuRefreshCw size={14} aria-hidden />
      Réessayer
    </PillButton>
  </HStack>
);
