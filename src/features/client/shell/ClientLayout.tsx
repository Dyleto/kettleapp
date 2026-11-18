import { Outlet } from 'react-router';
import { NavRail, TabBar } from '@/kit';
import { CLIENT_NAV_ITEMS } from '@/features/client/shell/navItems';
import { Header } from '@/shared/components/Header';
import { MobileTopBar } from '@/shared/components/MobileTopBar';
import { HealthConsentGate } from '@/features/account';
import { useAuth } from '@/shared/contexts/useAuth';
import { Box, Flex } from '@chakra-ui/react';

const ClientLayout = () => {
  const { user } = useAuth();

  // L'effort de fin de séance est une donnée de santé : on demande avant de
  // collecter, pas après. La question se pose devant tout l'espace client —
  // barre d'onglets comprise — sinon elle se contourne, et un consentement
  // qu'on peut contourner n'en est pas un.
  if (user?.needsHealthConsent) return <HealthConsentGate />;

  return (
    <Flex minH="100vh">
      {/* Le même rail que le coach : un compte qui porte les deux rôles
          change d'espace sans changer de repères. */}
      <NavRail items={CLIENT_NAV_ITEMS} footer={<Header variant="rail" />} />
      <Box flex={1} minW={0} pb={{ base: '76px', md: 0 }}>
        <MobileTopBar />
        <Box as="main" id="contenu" minW={0}>
          <Outlet />
        </Box>
        <TabBar items={CLIENT_NAV_ITEMS} />
      </Box>
    </Flex>
  );
};

export default ClientLayout;
