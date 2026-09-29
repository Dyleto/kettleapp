import { Box, HStack, Text } from '@chakra-ui/react';
import { Header } from './Header';

/**
 * La barre du haut, en dessous de 768 px.
 *
 * Elle ne portait qu'un avatar, seul et collé à un bord : soixante-dix pixels
 * de hauteur pour une pastille accrochée à rien. La barre reprend maintenant
 * la structure du rail de bureau — le nom à gauche, le compte à droite — et
 * l'avatar cesse de flotter.
 */
export const MobileTopBar = () => (
  <Box
    as="header"
    display={{ base: 'block', md: 'none' }}
    borderBottomWidth="1px"
    borderColor="whiteAlpha.100"
  >
    <HStack justify="space-between" align="center" px={4} py={2}>
      <Text fontSize="sm" fontWeight="900" letterSpacing="wider">
        KETTLE
      </Text>
      <Header />
    </HStack>
  </Box>
);
