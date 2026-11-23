import { Box, Grid, HStack, Skeleton, VStack } from '@chakra-ui/react';
import { SlowNotice } from './SlowNotice';

/** Une carte fantôme, à l'arrondi des vraies. */
const Ghost = ({ h, w }: { h: string; w?: string }) => (
  <Skeleton h={h} w={w} borderRadius="card" />
);

/**
 * Des formes fantômes à la place d'un écran qui charge.
 *
 * Quatre écrans — « Mon compte », l'atelier d'un client, son journal, un
 * modèle — et la coque de l'application chargeaient derrière une roue
 * seule, au milieu d'une page vide : rien ne disait ce qui allait venir,
 * ni où. La maquette des états veut des formes, jamais un écran blanc ni
 * une roue seule. Deux dispositions suffisent : une colonne de cartes, et
 * l'atelier — ses séances à gauche, ses blocs au milieu.
 *
 * `SlowNotice` est dedans : chaque chargement dit, au bout de dix
 * secondes, qu'il est plus long que d'habitude, sans que chaque écran ait
 * à s'en souvenir.
 */
export const LoadingShapes = ({
  layout = 'column',
}: {
  layout?: 'column' | 'workshop';
}) => (
  <VStack align="stretch" gap="14px" aria-busy="true" data-loading={layout}>
    {layout === 'workshop' ? (
      <>
        <HStack gap="12px">
          <Skeleton w="38px" h="38px" borderRadius="full" />
          <Skeleton w="180px" h="26px" borderRadius="md" />
        </HStack>
        <Grid
          templateColumns={{ base: '1fr', md: '240px minmax(0, 1fr)' }}
          gap="16px"
          alignItems="start"
        >
          <VStack
            align="stretch"
            gap="10px"
            display={{ base: 'none', md: 'flex' }}
            data-loading-part="sessions"
          >
            {[0, 1, 2, 3].map((i) => (
              <Ghost key={i} h="74px" />
            ))}
          </VStack>
          <VStack align="stretch" gap="14px" data-loading-part="blocks">
            <Skeleton w="220px" h="28px" borderRadius="md" />
            <Ghost h="170px" />
            <Ghost h="210px" />
          </VStack>
        </Grid>
      </>
    ) : (
      <>
        <Skeleton w="180px" h="30px" borderRadius="md" />
        <Ghost h="84px" />
        <Ghost h="180px" />
        <Ghost h="132px" />
      </>
    )}
    <Box>
      <SlowNotice />
    </Box>
  </VStack>
);
