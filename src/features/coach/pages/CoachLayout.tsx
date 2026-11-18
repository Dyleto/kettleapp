import { Outlet, useMatches } from 'react-router';
import { Box, Flex } from '@chakra-ui/react';
import { NavRail, TabBar } from '@/kit';
import { Header } from '@/shared/components/Header';
import { MobileTopBar } from '@/shared/components/MobileTopBar';
import { useBottomBarClaimed } from '@/shared/hooks/useBottomBar';
import { coachNavItems } from '@/features/coach/navItems';
import { useInbox } from '@/features/coach/hooks/useInbox';

/** Ce qu'une route demande à la mise en page, par son `handle`. */
const asks = (handle: unknown, key: 'ownsMobileTopBar' | 'collapsesRail') =>
  typeof handle === 'object' &&
  handle !== null &&
  (handle as Record<string, unknown>)[key] === true;

/**
 * La coque de l'espace coach : la navigation, et la page.
 *
 * Deux demandes possibles d'une page, par le `handle` de sa route :
 *
 *   — porter elle-même la barre du haut sur mobile : elle connaît son sujet,
 *     la barre générique ne connaît que le nom du produit. Deux barres
 *     empilées sur un écran de 844 px, c'est un cinquième de la hauteur
 *     perdu avant le premier exercice ;
 *
 *   — replier le rail en icônes à toutes les largeurs : l'atelier a besoin de
 *     la place pour ses séances, son éditeur et son aperçu (maquette,
 *     « Navigation, largeurs, voix »).
 *
 * Le compteur de « À lire » lit la même requête que l'écran qu'il ouvre :
 * il dit le même nombre, et ne coûte rien de plus.
 */
const CoachLayout = () => {
  const matches = useMatches();
  const pageOwnsTopBar = matches.some((m) =>
    asks(m.handle, 'ownsMobileTopBar')
  );
  const collapsed = matches.some((m) => asks(m.handle, 'collapsesRail'));
  // Le bas de l'écran n'a qu'un emplacement : la ligne d'échec de l'éditeur
  // le prend plutôt que de s'empiler par-dessus.
  const bottomTaken = useBottomBarClaimed();
  const items = coachNavItems(useInbox().data?.total ?? 0);

  return (
    <Flex minH="100vh">
      <NavRail
        items={items}
        collapsed={collapsed}
        footer={<Header variant="rail" collapsed={collapsed} />}
      />
      <Box flex={1} minW={0} pb={{ base: bottomTaken ? 0 : '76px', md: 0 }}>
        {!pageOwnsTopBar && <MobileTopBar />}
        <Box as="main" id="contenu" minW={0}>
          <Outlet />
        </Box>
        {!bottomTaken && <TabBar items={items} />}
      </Box>
    </Flex>
  );
};

export default CoachLayout;
