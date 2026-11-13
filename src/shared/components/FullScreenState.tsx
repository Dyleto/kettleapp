import { Box } from '@chakra-ui/react';
import { EmptyState, type EmptyStateProps } from './EmptyState';

/**
 * Un état qui occupe tout l'écran : une adresse inconnue, un plantage, un
 * compte sans accès.
 *
 * Ces trois écrans s'écrivaient chacun de leur côté, avec trois mises en
 * page et trois tons — dont un « Oups ! » et un bouton sarcelle que rien
 * d'autre ne portait. Ils sont maintenant le même écran, à trois phrases
 * près.
 *
 * Il porte lui-même la balise `main` et l'ancre `contenu` : il s'affiche à
 * la place des mises en page qui les fournissent d'habitude, et le lien
 * d'évitement n'aurait sinon aucune cible.
 */
export const FullScreenState = (
  props: Omit<EmptyStateProps, 'headingLevel'>
) => (
  <Box
    as="main"
    id="contenu"
    minH="100dvh"
    display="flex"
    alignItems="center"
    justifyContent="center"
    px={5}
    bg="bg.canvas"
  >
    <EmptyState headingLevel="h1" {...props} />
  </Box>
);
