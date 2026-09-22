import { HStack, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { LEGAL_ROUTES } from '@/config/legal';

/**
 * The two pages you must be able to read before creating an account.
 *
 * They sit in the two places where one is created — sign-in and invitation.
 * Signing in with Google is creating an account: you have to be able to read
 * what you accept before, not after.
 *
 * A component rather than a copy-paste: these links will change eventually —
 * one more page, a label made more precise — and two footers written
 * separately always drift apart.
 */
export const LegalFooter = () => (
  <HStack gap={3} justify="center" flexWrap="wrap">
    <Link
      as={RouterLink}
      {...{ to: LEGAL_ROUTES.confidentialite }}
      fontSize="xs"
      color="fg.muted"
      _hover={{ color: 'app.primary' }}
    >
      Politique de confidentialité
    </Link>
    <Text fontSize="xs" color="fg.muted" aria-hidden="true">
      ·
    </Text>
    <Link
      as={RouterLink}
      {...{ to: LEGAL_ROUTES.mentions }}
      fontSize="xs"
      color="fg.muted"
      _hover={{ color: 'app.primary' }}
    >
      Mentions légales
    </Link>
  </HStack>
);
