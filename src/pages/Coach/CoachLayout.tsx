import { Outlet, useMatches } from 'react-router-dom';
import { CoachNavRail, CoachTabBar } from '@/features/coach';
import { MobileTopBar } from '@/components/MobileTopBar';
import { Box, Flex } from '@chakra-ui/react';
import { useBottomBarClaimed } from '@/hooks/useBottomBar';

// A page can carry the mobile top bar itself (`handle`): it knows its
// subject, the generic bar only knows the product name. Two bars stacked on
// an 844 px screen is a fifth of the height lost before the first exercise.
const ownsMobileTopBar = (handle: unknown): boolean =>
  typeof handle === 'object' &&
  handle !== null &&
  (handle as { ownsMobileTopBar?: boolean }).ownsMobileTopBar === true;

const CoachLayout = () => {
  const pageOwnsTopBar = useMatches().some((m) => ownsMobileTopBar(m.handle));
  // The bottom of the screen has only one slot: the editor's failure line
  // takes it rather than stacking on top.
  const bottomTaken = useBottomBarClaimed();

  return (
    <Flex minH="100vh">
      <CoachNavRail />
      <Box flex={1} minW={0} pb={{ base: bottomTaken ? 0 : '70px', md: 0 }}>
        {!pageOwnsTopBar && <MobileTopBar />}
        <Box as="main" id="contenu" minW={0}>
          <Outlet />
        </Box>
        {!bottomTaken && <CoachTabBar />}
      </Box>
    </Flex>
  );
};

export default CoachLayout;
