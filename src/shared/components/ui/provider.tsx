import { ChakraProvider } from '@chakra-ui/react';
import { system } from '../../../theme';
import { ReactNode } from 'react';

/**
 * Le thème de l'application, posé au-dessus de tout.
 *
 * Passe `system` — le thème étendu de `theme.ts` — plutôt que le système par
 * défaut de Chakra : sans lui, les jetons propres à Kettle (l'ambre, les
 * couleurs d'effort, l'anneau de focus) retombent silencieusement sur ceux
 * de la bibliothèque.
 */
export function Provider({ children }: { children: ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
