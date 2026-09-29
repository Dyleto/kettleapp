import { Outlet } from 'react-router-dom';
import {
  useClientSessions,
  ClientTabBar,
  ClientNavRail,
} from '@/features/client';
import { MobileTopBar } from '@/shared/components/MobileTopBar';
import { HealthConsentGate } from '@/features/account/components/HealthConsentGate';
import { useAuth } from '@/shared/contexts/useAuth';
import { Box, Flex } from '@chakra-ui/react';

const ClientLayout = () => {
  const clientSessions = useClientSessions();
  const { user } = useAuth();

  // L'effort de fin de séance est une donnée de santé : on demande avant de
  // collecter, pas après. La question se pose devant tout l'espace client —
  // barre d'onglets comprise — sinon elle se contourne, et un consentement
  // qu'on peut contourner n'en est pas un.
  if (user?.needsHealthConsent) return <HealthConsentGate />;

  return (
    <Flex minH="100vh">
      <ClientNavRail />
      <Box flex={1} minW={0} pb={{ base: '70px', md: 0 }}>
        <MobileTopBar />
        <Box as="main" id="contenu" minW={0}>
          <Outlet context={clientSessions} />
        </Box>
        <ClientTabBar />
      </Box>
    </Flex>
  );
};

export default ClientLayout;
