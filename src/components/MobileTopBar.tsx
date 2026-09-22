import { Box, HStack, Text } from '@chakra-ui/react';
import { Header } from './Header';

/**
 * The top bar, below 768 px.
 *
 * It carried nothing but an avatar, alone and stuck to one edge: seventy
 * pixels of height for a badge anchored to nothing. The bar now takes the
 * structure of the desktop sidebar — the name on the left, the account on
 * the right — and the avatar stops floating.
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
