import { Outlet } from 'react-router-dom';
import {
  useClientSessions,
  ClientTabBar,
  ClientNavRail,
} from '@/features/client';
import { MobileTopBar } from '@/components/MobileTopBar';
import { HealthConsentGate } from '@/features/account/components/HealthConsentGate';
import { useAuth } from '@/contexts/useAuth';
import { Box, Flex } from '@chakra-ui/react';

const ClientLayout = () => {
  const clientSessions = useClientSessions();
  const { user } = useAuth();

  // End-of-session effort is health data: we ask before collecting, not
  // after. The question comes in front of the whole client area — tab bar
  // included — otherwise it can be worked around, and a consent you can work
  // around is not one.
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
