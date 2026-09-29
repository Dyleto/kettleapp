import { VStack, HStack, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { Header } from '@/shared/components/Header';
import { CLIENT_NAV_ITEMS } from '../navItems';

/**
 * La navigation du client sur écran large : une colonne à gauche.
 *
 * Le même gabarit que celui du coach, et pour la même raison : un compte qui
 * porte les deux rôles change d'espace sans changer de repères.
 */
export const ClientNavRail = () => {
  return (
    <VStack
      as="nav"
      aria-label="Navigation principale"
      display={{ base: 'none', md: 'flex' }}
      w="200px"
      flexShrink={0}
      h="100vh"
      position="sticky"
      top={0}
      align="stretch"
      justify="space-between"
      py={6}
      px={4}
      borderRight="1px solid"
      borderColor="whiteAlpha.100"
    >
      <VStack align="stretch" gap={8}>
        <Text fontSize="lg" fontWeight="900" letterSpacing="wider" px={2}>
          KETTLE
        </Text>
        <VStack align="stretch" gap={1}>
          {CLIENT_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              {({ isActive }) => (
                <HStack
                  gap={3}
                  px={3}
                  py={2.5}
                  /* 41 px de haut : la navigation était la seule chose à
                                       l'écran qui tombait sous le plancher de cible
                                       tactile. */
                  minH="44px"
                  borderRadius="md"
                  color={isActive ? 'app.primary' : 'fg.muted'}
                  bg={isActive ? 'app.primary/12' : 'transparent'}
                  fontWeight={isActive ? '700' : '500'}
                  _hover={{ color: 'app.primary' }}
                  transition="all 0.15s"
                >
                  <Icon size={18} />
                  <Text fontSize="sm">{label}</Text>
                </HStack>
              )}
            </NavLink>
          ))}
        </VStack>
      </VStack>
      <Header variant="rail" />
    </VStack>
  );
};
