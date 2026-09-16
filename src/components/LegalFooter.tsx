import { HStack, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { LEGAL_ROUTES } from '@/config/legal';

/**
 * Les deux pages qu'on doit pouvoir lire avant de créer un compte.
 *
 * Elles se posent aux deux endroits où l'on en crée un — la connexion et
 * l'invitation. Se connecter avec Google, c'est créer un compte : on doit
 * pouvoir lire ce qu'on accepte avant, pas après.
 *
 * Un composant plutôt qu'un copier-coller : ces liens finiront par changer —
 * une page de plus, un libellé qui se précise — et deux pieds de page écrits
 * séparément divergent toujours.
 */
export const LegalFooter = () => (
  <HStack gap={3} justify="center" flexWrap="wrap">
    <Link
      as={RouterLink}
      {...{ to: LEGAL_ROUTES.confidentialite }}
      fontSize="xs"
      color="fg.muted"
      _hover={{ color: 'app.primary' }}
    >
      Politique de confidentialité
    </Link>
    <Text fontSize="xs" color="fg.muted" aria-hidden="true">
      ·
    </Text>
    <Link
      as={RouterLink}
      {...{ to: LEGAL_ROUTES.mentions }}
      fontSize="xs"
      color="fg.muted"
      _hover={{ color: 'app.primary' }}
    >
      Mentions légales
    </Link>
  </HStack>
);
