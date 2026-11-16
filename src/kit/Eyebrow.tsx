import { Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

/**
 * La petite ligne en capitales au-dessus d'un titre : « À faire
 * aujourd'hui », « Aujourd'hui, repos ».
 *
 * L'ambre pour ce qui appelle une action, le sarcelle pour le repos, la
 * sourdine sinon : la même règle que le reste du kit.
 */
export const Eyebrow = ({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'amber' | 'teal';
}) => (
  <Text
    fontSize="11px"
    fontWeight="800"
    lineHeight="1"
    letterSpacing="0.14em"
    textTransform="uppercase"
    color={
      tone === 'amber'
        ? 'app.primary.fg'
        : tone === 'teal'
          ? 'session.rest.fg'
          : 'fg.muted'
    }
  >
    {children}
  </Text>
);
