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
import { useAuth } from '@/contexts/useAuth';
import { LEGAL_ROUTES } from '@/config/legal';
import { useSetHealthConsent } from '../hooks/useAccount';

/**
 * La question posée au client avant qu'il n'entre.
 *
 * Ce qu'il déclare après une séance — une douleur, une maladie, une nuit
 * blanche — est une donnée de santé. On ne la collecte pas sans un accord
 * explicite, et cet accord n'en est un que s'il est libre : refuser tient en
 * un clic, au même endroit et à la même taille qu'accepter, et l'application
 * s'ouvre dans les deux cas.
 *
 * L'écran ne s'affiche qu'une fois. Le refus est enregistré comme décision —
 * sans quoi on reposerait la question à chaque visite, ce qui reviendrait à
 * la poser jusqu'à ce que la réponse arrange.
 */
export const HealthConsentGate = () => {
  const { user, logout } = useAuth();
  const { mutate, isPending } = useSetHealthConsent();

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
            Après chaque séance, Kettle te propose de dire comment tu l'as
            vécue : l'effort, et s'il y a lieu une douleur, une maladie, une
            mauvaise nuit. Ce sont des données de santé. Ton coach les voit,
            et c'est avec elles qu'il adapte la suite.
          </Text>
          <Box
            bg="bg.card"
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
            Tu peux revenir sur ta réponse quand tu veux, depuis « Mon
            compte ». Le détail de ce qu'on conserve est dans la{' '}
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

        {/* Les deux réponses ont la même taille et la même place. Une seule
            mise en avant ferait du refus un second choix, et le consentement
            ne serait plus libre. */}
        <Stack direction={{ base: 'column', sm: 'row' }} gap={3}>
          <Button
            flex={1}
            minH="48px"
            variant="outline"
            borderColor="whiteAlpha.300"
            color="fg"
            fontWeight="semibold"
            loading={isPending}
            onClick={() => mutate(false)}
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
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'app.primary',
              outlineOffset: '2px',
            }}
          >
            <HStack gap={1.5}>
              <LuLogOut size={12} />
              <Text as="span">Se déconnecter</Text>
            </HStack>
          </Box>
        </HStack>
      </VStack>
    </Box>
  );
};
