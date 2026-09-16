import { Outlet, useMatches } from 'react-router-dom';
import { CoachNavRail, CoachTabBar } from '@/features/coach';
import { MobileTopBar } from '@/components/MobileTopBar';
import { Box, Flex } from '@chakra-ui/react';
import { useBottomBarClaimed } from '@/hooks/useBottomBar';

// Une page peut porter elle-même la barre du haut mobile (`handle`) : elle
// connaît son sujet, la barre générique ne connaît que le nom du produit.
// Deux bandeaux empilés sur un écran de 844 px, c'est un cinquième de la
// hauteur perdu avant le premier exercice.
const ownsMobileTopBar = (handle: unknown): boolean =>
  typeof handle === 'object' &&
  handle !== null &&
  (handle as { ownsMobileTopBar?: boolean }).ownsMobileTopBar === true;

const CoachLayout = () => {
  const pageOwnsTopBar = useMatches().some((m) => ownsMobileTopBar(m.handle));
  // Le bas de l'écran n'a qu'une place : la ligne d'échec de l'atelier la
  // prend plutôt que de s'empiler par-dessus.
  const basOccupe = useBottomBarClaimed();

  return (
    <Flex minH="100vh">
      <CoachNavRail />
      <Box flex={1} minW={0} pb={{ base: basOccupe ? 0 : '70px', md: 0 }}>
        {!pageOwnsTopBar && <MobileTopBar />}
        <Box as="main" id="contenu" minW={0}>
          <Outlet />
        </Box>
        {!basOccupe && <CoachTabBar />}
      </Box>
    </Flex>
  );
};

export default CoachLayout;
