import { Box, HStack, Text } from '@chakra-ui/react';
import { LuArrowLeft } from 'react-icons/lu';
import { touchHitArea } from './hitArea';

interface BackLinkProps {
  /** Où l'on va, pas ce qu'on quitte : « Clients », « Programme ». */
  label: string;
  onClick: () => void;
}

/**
 * Le lien de retour, en haut de l'écran.
 *
 * Deux des trois occurrences étaient des `HStack` avec un `onClick` : aucun
 * rôle, hors de l'ordre de tabulation, rien à annoncer. Sur le journal, où
 * c'était le seul chemin de retour vers le programme du client, la page
 * n'avait donc aucune sortie au clavier.
 */
export const BackLink = ({ label, onClick }: BackLinkProps) => (
  <Box
    as="button"
    onClick={onClick}
    w="fit-content"
    color="fg.muted"
    _hover={{ color: 'app.primary' }}
    transition="color 0.15s"
    css={touchHitArea()}
  >
    <HStack gap={1.5}>
      <LuArrowLeft size={13} />
      <Text fontSize="xs" fontWeight="medium">
        {label}
      </Text>
    </HStack>
  </Box>
);
