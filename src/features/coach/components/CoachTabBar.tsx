import { HStack, VStack, Text } from '@chakra-ui/react';
import { NavLink } from 'react-router-dom';
import { COACH_NAV_ITEMS } from '../navItems';

export const CoachTabBar = () => {
  return (
    <HStack
      as="nav"
      aria-label="Navigation principale"
      display={{ base: 'flex', md: 'none' }}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="bg.surface"
      borderTop="1px solid"
      borderColor="whiteAlpha.100"
      justify="space-around"
      pt={2}
      pb="calc(env(safe-area-inset-bottom, 0px) + 8px)"
      zIndex={30}
    >
      {COACH_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} style={{ flex: 1 }}>
          {({ isActive }) => (
            <VStack
              gap={0.5}
              color={isActive ? 'app.primary' : 'fg.muted'}
              py={1}
            >
              <Icon size={20} />
              <Text fontSize="xs" fontWeight={isActive ? '700' : '500'}>
                {label}
              </Text>
            </VStack>
          )}
        </NavLink>
      ))}
    </HStack>
  );
};
