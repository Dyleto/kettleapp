import {
  Box,
  Button,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { LuHeartPulse, LuLogOut } from 'react-icons/lu';
import { Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { LEGAL_ROUTES } from '@/config/legal';
import { useAccount, useSetHealthConsent } from '../hooks/useAccount';
import { ConfirmRefusSante } from './ConfirmRefusSante';

/**
 * The question put to the client before they come in.
 *
 * What they declare after a session — a pain, an illness, a sleepless night —
 * is health data. We do not collect it without explicit agreement, and that
 * agreement only counts if it is free: refusing takes one click, in the same
 * place and at the same size as accepting, and the app opens either way.
 *
 * The screen only shows once. A refusal is recorded as a decision — otherwise
 * we would put the question again at every visit, which would amount to
 * asking until the answer suits.
 */
export const HealthConsentGate = () => {
  const { user, logout } = useAuth();
  const { mutate, isPending } = useSetHealthConsent();
  const { data } = useAccount();
  const [refusOuvert, setRefusOuvert] = useState(false);

  // An account already in use may carry effort ratings collected before the
  // question was ever put. Refusing erases them — we say so first, with the
  // number. On a fresh account there is nothing to lose, and refusing stays a
  // single gesture: an obstacle in front of a refusal with no object would
  // discourage the refusal.
  const aPerdre = data?.asClient?.healthDataCount ?? 0;

  const refuser = () => {
    if (aPerdre > 0) {
      setRefusOuvert(true);
      return;
    }
    mutate(false);
  };

  return (
    <Box minH="100dvh" bg="bg.canvas" px={4} py={8}>
      <VStack
        align="stretch"
        gap={7}
        maxW="440px"
        mx="auto"
        justify="center"
        minH="calc(100dvh - 64px)"
      >
        <VStack align="start" gap={3}>
          <Box color="app.primary">
            <LuHeartPulse size={28} />
          </Box>
          <Heading as="h1" size="lg" lineHeight="1.25">
            Bonjour {user?.firstName}, une question avant de commencer
          </Heading>
        </VStack>

        <VStack align="stretch" gap={4}>
          <Text fontSize="sm" color="fg" lineHeight="1.65">
            Après chaque séance, Kettle te propose de dire comment tu l'as vécue
            : l'effort, et s'il y a lieu une douleur, une maladie, une mauvaise
            nuit. Ce sont des données de santé. Ton coach les voit, et c'est
            avec elles qu'il adapte la suite.
          </Text>
          <Box
            bg="surface.card"
            borderWidth="1px"
            borderColor="whiteAlpha.100"
            borderRadius="xl"
            p={4}
          >
            <Text fontSize="sm" color="fg.muted" lineHeight="1.65">
              Si tu refuses, l'application fonctionne pareil. Tu notes tes
              charges, tes séries, ton niveau d'effort, et ton coach les voit.
              Seules les étiquettes de ressenti et le commentaire libre ne te
              seront pas proposés — et rien de tout cela ne sera enregistré.
            </Text>
          </Box>
          <Text fontSize="xs" color="fg.muted" lineHeight="1.65">
            Tu peux revenir sur ta réponse quand tu veux, depuis « Mon compte ».
            Le détail de ce qu'on conserve est dans la{' '}
            <Link
              as={RouterLink}
              {...{ to: LEGAL_ROUTES.confidentialite }}
              color="app.primary"
              textDecoration="underline"
            >
              politique de confidentialité
            </Link>
            .
          </Text>
        </VStack>

        {/* Both answers have the same size and the same place. Giving
            one of them prominence would make refusal a second choice, and the
            consent would no longer be free. */}
        <Stack direction={{ base: 'column', sm: 'row' }} gap={3}>
          <Button
            flex={1}
            minH="48px"
            variant="outline"
            borderColor="whiteAlpha.300"
            color="fg"
            fontWeight="semibold"
            loading={isPending}
            onClick={refuser}
          >
            Je refuse
          </Button>
          <Button
            flex={1}
            minH="48px"
            bg="app.primary"
            color="bg.canvas"
            fontWeight="bold"
            loading={isPending}
            onClick={() => mutate(true)}
          >
            J'accepte
          </Button>
        </Stack>

        <HStack justify="center">
          <Box
            as="button"
            onClick={logout}
            color="fg.muted"
            fontSize="xs"
            px={2}
            py={2}
            _hover={{ color: 'fg' }}
          >
            <HStack gap={1.5}>
              <LuLogOut size={12} />
              <Text as="span">Se déconnecter</Text>
            </HStack>
          </Box>
        </HStack>
      </VStack>

      <ConfirmRefusSante
        open={refusOuvert}
        onClose={() => setRefusOuvert(false)}
        onConfirm={() => {
          mutate(false);
          setRefusOuvert(false);
        }}
        isPending={isPending}
        titre="Refuser le partage ?"
        action="Refuser et effacer"
        nombre={aPerdre}
      />
    </Box>
  );
};
