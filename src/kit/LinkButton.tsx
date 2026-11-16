import { Box } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { hitArea } from './hitArea';

/**
 * Un lien discret : l'action secondaire d'un écran — « Voir le détail de la
 * séance », « Je l'ai déjà faite », « Recommencer depuis le début ».
 *
 * Un vrai bouton, atteignable au clavier, avec une cible de 44 px qui
 * déborde du texte : la règle « une scène, une action » veut un seul bouton
 * ambre par écran, et les autres choix vivent ici, sans se faire oublier.
 */
export const LinkButton = ({
  children,
  onClick,
  ...rest
}: {
  children: ReactNode;
  onClick: () => void;
} & Omit<React.ComponentProps<typeof Box>, 'onClick'>) => (
  <Box
    as="button"
    alignSelf="center"
    css={hitArea()}
    color="fg.muted"
    fontSize="sm"
    fontWeight="700"
    onClick={onClick}
    _hover={{ color: 'fg' }}
    {...rest}
  >
    {children}
  </Box>
);
