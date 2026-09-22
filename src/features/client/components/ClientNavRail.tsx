import { VStack, HStack, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { Header } from '@/components/Header';
import { CLIENT_NAV_ITEMS } from '../navItems';

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
                  /* 41 px tall: navigation was the only thing on screen
                     that fell below the touch-target floor. */
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
