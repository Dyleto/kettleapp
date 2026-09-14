import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { HealthConsent } from '@/types';
import { useSetHealthConsent } from '../hooks/useAccount';

interface Props {
  consent: HealthConsent | null;
}

const LE_JOUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * L'interrupteur du partage de ressenti, et la trace de la dernière décision.
 *
 * Retirer son accord doit être aussi simple que de le donner : c'est le même
 * geste, au même endroit, sans confirmation. Un accord qu'on ne peut pas
 * reprendre d'un doigt n'en est pas un.
 */
export const HealthConsentCard = ({ consent }: Props) => {
  const { mutate, isPending } = useSetHealthConsent();
  const [retraitOuvert, setRetraitOuvert] = useState(false);
  const granted = consent?.granted === true;

  // Donner son accord tient en un geste. Le retirer aussi — la fenêtre ne
  // demande pas de confirmer une intention, elle annonce une conséquence :
  // ce qui a déjà été enregistré est effacé, et ça ne se rattrape pas.
  const basculer = () => {
    if (isPending) return;
    if (granted) {
      setRetraitOuvert(true);
      return;
    }
    mutate(true);
  };

  return (
    <VStack
      align="stretch"
      gap={3.5}
      bg="bg.card"
      borderWidth="1px"
      borderColor="whiteAlpha.100"
      borderRadius="xl"
      p={4}
    >
      <HStack align="flex-start" gap={3.5}>
        <VStack align="start" gap={1.5} flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="semibold" id="partage-ressenti">
            Partager mes ressentis
          </Text>
          <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
            Ton coach voit ce que tu déclares après une séance, y compris une
            douleur ou une maladie.
          </Text>
        </VStack>

        <Box
          as="button"
          role="switch"
          aria-checked={granted}
          aria-labelledby="partage-ressenti"
          // `Box as="button"` ne prend pas `disabled` en Chakra v3 : on
          // l'annonce et on garde la porte fermée dans le gestionnaire.
          aria-disabled={isPending}
          onClick={basculer}
          flexShrink={0}
          w="48px"
          h="28px"
          p="3px"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent={granted ? 'flex-end' : 'flex-start'}
          bg={granted ? 'app.primary' : 'whiteAlpha.300'}
          transition="background-color 0.15s"
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'app.primary',
            outlineOffset: '2px',
          }}
        >
          {isPending ? (
            <Spinner size="xs" color="bg.canvas" m="auto" />
          ) : (
            <Box w="22px" h="22px" borderRadius="full" bg="bg.canvas" />
          )}
        </Box>
      </HStack>

      <Box h="1px" bg="whiteAlpha.100" />

      <VStack align="start" gap={1.5}>
        {consent && (
          <Text fontSize="xs" color="fg.muted">
            {granted ? 'Accepté' : 'Refusé'} le{' '}
            <Text as="span" fontFamily="mono">
              {LE_JOUR.format(new Date(consent.decidedAt))}
            </Text>
          </Text>
        )}
        <Text fontSize="xs" color="fg.muted" lineHeight="1.6">
          Si tu refuses, les étiquettes de ressenti et le commentaire libre
          disparaissent de ton bilan, y compris ceux déjà enregistrés. Tes
          charges et tes séances restent.
        </Text>
      </VStack>

      <Dialog.Root
        open={retraitOuvert}
        onOpenChange={(e) => !e.open && setRetraitOuvert(false)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.canvas"
            borderColor="whiteAlpha.100"
            borderWidth="1px"
            maxW="sm"
          >
            <Dialog.Header>
              <Dialog.Title>Retirer ton accord ?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
                Les étiquettes de ressenti et les commentaires que tu as déjà
                écrits seront effacés de toutes tes séances. Tes charges, tes
                séries et ton niveau d'effort restent, et ton coach continue de
                les voir.
              </Text>
            </Dialog.Body>
            <Dialog.Footer flexDirection="column" alignItems="stretch" gap={2}>
              <Button
                bg="app.error"
                color="bg.canvas"
                fontWeight="bold"
                minH="48px"
                loading={isPending}
                onClick={() => {
                  mutate(false);
                  setRetraitOuvert(false);
                }}
              >
                Retirer mon accord
              </Button>
              <Button
                variant="ghost"
                color="fg.muted"
                minH="48px"
                onClick={() => setRetraitOuvert(false)}
              >
                Annuler
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
  );
};
