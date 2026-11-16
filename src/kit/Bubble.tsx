import { Box, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

const BG = {
  surface: 'bg.surface',
  raised: 'bg.raised',
  hero: 'blackAlpha.300',
} as const;

/**
 * Une bulle : quelqu'un qui parle — le coach ou le client, jamais
 * l'application.
 *
 * Huit copies, une par écran où le coach a un mot à dire, qui se
 * ressemblaient sans être les mêmes : trois interlignes, deux tailles de
 * marge. `from` est la ligne qui la précède (« Julie te dit : ») ; `clamp`
 * coupe le texte à ce nombre de lignes, quand le mot entier se lit ailleurs.
 *
 * `tone` suit le fond sur lequel la bulle se pose : `raised` dans une
 * feuille, `hero` sur la carte mise en avant, dont le dégradé mangerait une
 * bulle de surface. Avec `onClick`, la bulle devient un bouton — toucher le
 * mot du coach ouvre la consigne entière.
 */
export const Bubble = ({
  children,
  from,
  tone = 'surface',
  size = 'md',
  clamp,
  onClick,
  ...rest
}: {
  children: ReactNode;
  from?: ReactNode;
  tone?: keyof typeof BG;
  size?: 'md' | 'sm';
  clamp?: number;
  onClick?: () => void;
} & Omit<React.ComponentProps<typeof Box>, 'onClick'>) => (
  <Box
    as={onClick ? 'button' : 'div'}
    onClick={onClick}
    textAlign="left"
    bg={BG[tone]}
    borderRadius="20px 20px 20px 6px"
    px="14px"
    py={size === 'sm' ? '10px' : 3}
    {...rest}
  >
    {from && (
      <Text fontSize="xs" color="fg.muted" mb={1}>
        {from}
      </Text>
    )}
    <Text
      fontSize={size === 'sm' ? 'sm' : '15px'}
      lineHeight="1.5"
      whiteSpace="pre-wrap"
      lineClamp={clamp}
    >
      {children}
    </Text>
  </Box>
);
