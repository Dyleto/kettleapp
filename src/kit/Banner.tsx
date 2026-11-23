import type { ReactNode } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';

/**
 * Un bandeau d'état du système, en tête de page : une icône, ce qui se
 * passe, ce qui est sauf, et un geste s'il y en a un.
 *
 * Deux tons, comme la maquette des états : le corail quand quelque chose
 * manque — le réseau —, l'ambre quand quelque chose attend — une nouvelle
 * version. Un seul gabarit pour les deux, parce que ce sont les deux seuls
 * bandeaux de l'application et qu'ils doivent se ressembler.
 *
 * `role="status"` : il s'annonce sans couper ce qu'un lecteur d'écran est
 * en train de lire. Ce n'est pas une alerte — rien n'est perdu, c'est ce
 * qu'il dit.
 */
export const Banner = ({
  tone,
  icon,
  title,
  line,
  action,
}: {
  tone: 'coral' | 'amber';
  icon: ReactNode;
  title: string;
  line: string;
  action?: ReactNode;
}) => (
  <HStack
    role="status"
    gap="12px"
    align="center"
    bg={tone === 'coral' ? 'app.error/14' : 'app.primary/12'}
    borderRadius="card"
    px="16px"
    py="12px"
    data-banner={tone}
  >
    <Box
      color={tone === 'coral' ? 'app.error' : 'app.primary.fg'}
      flexShrink={0}
      aria-hidden
    >
      {icon}
    </Box>
    <VStack align="start" gap="2px" flex={1} minW={0}>
      <Text fontWeight="800">{title}</Text>
      <Text fontSize="sm" color="fg.muted">
        {line}
      </Text>
    </VStack>
    {action}
  </HStack>
);
