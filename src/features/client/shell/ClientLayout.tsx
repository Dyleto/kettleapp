import { Outlet } from 'react-router';
import { NavRail, TabBar } from '@/kit';
import { CLIENT_NAV_ITEMS } from '@/features/client/shell/navItems';
import { Header } from '@/shared/components/Header';
import { MobileTopBar } from '@/shared/components/MobileTopBar';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { HealthConsentGate } from '@/features/account';
import { useAuth } from '@/shared/contexts/useAuth';
import { useProgramCoach } from '@/features/client/common/useProgramCoach';
import { useWelcome } from '@/features/client/shell/useWelcome';
import { Welcome } from '@/features/client/shell/Welcome';
import { Box, Flex } from '@chakra-ui/react';

/**
 * L'espace du client : le rail ou la barre d'onglets, et la page.
 *
 * Devant lui, ce qu'un nouveau client voit avant son accueil : les trois
 * cartes de bienvenue, une fois, puis la question du partage des données
 * de santé, tant qu'elle n'a pas reçu de réponse.
 */
const ClientLayout = () => {
  const { user } = useAuth();
  const welcome = useWelcome();
  const { voice } = useProgramCoach(
    !!user?.needsHealthConsent || welcome.state !== 'skip'
  );

  // Les cartes de bienvenue d'abord, puis la question : on explique le
  // principe avant de demander ce qu'on fera des réponses. Pendant qu'on
  // sait s'il faut les montrer, un fond nu plutôt que la question, qu'elles
  // viendraient recouvrir.
  if (welcome.state === 'waiting')
    return <Box minH="100dvh" bg="bg.canvas" aria-busy="true" />;
  if (welcome.state === 'show')
    return <Welcome coach={voice} onDone={welcome.done} />;

  // Ce que le client dit après une séance est une donnée de santé : on
  // demande avant de collecter, pas après. La question se pose devant tout
  // l'espace client — barre d'onglets comprise — sinon elle se contourne, et
  // un consentement qu'on peut contourner n'en est pas un.
  if (user?.needsHealthConsent)
    return <HealthConsentGate coach={voice.inline} />;

  return (
    <Flex minH="100vh">
      {/* Le même rail que le coach : un compte qui porte les deux rôles
          change d'espace sans changer de repères. */}
      <NavRail items={CLIENT_NAV_ITEMS} footer={<Header variant="rail" />} />
      <Box flex={1} minW={0} pb={{ base: '76px', md: 0 }}>
        <MobileTopBar />
        <Box as="main" id="contenu" minW={0}>
          <OfflineBanner line="Tu peux faire ta séance : elle s’enverra au retour du réseau." />
          <Outlet />
        </Box>
        <TabBar items={CLIENT_NAV_ITEMS} />
      </Box>
    </Flex>
  );
};

export default ClientLayout;
