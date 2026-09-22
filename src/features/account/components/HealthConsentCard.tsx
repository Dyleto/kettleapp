import { useState } from 'react';
import { Box, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { HealthConsent } from '@/types';
import { useSetHealthConsent } from '../hooks/useAccount';
import { ConfirmHealthOptOut } from './ConfirmHealthOptOut';

interface Props {
  consent: HealthConsent | null;
  /** Combien de bilans un retrait effacerait. */
  healthDataCount: number;
}

const LE_JOUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * The switch for sharing how you felt, and the trace of the last decision.
 *
 * Withdrawing consent must be as simple as giving it: the same gesture, in
 * the same place, with no confirmation. A consent you cannot take back with
 * one finger is not one.
 *
 * Everything here is written in the first person, and not out of taste: this
 * card appears in both areas, where Kettle does not use the same form of
 * address — it says "tu" to the client and "vous" to the coach. An account
 * holding both roles therefore read "Ton coach voit ce que tu déclares" in
 * the middle of a page that said "vous" everywhere else. The first person
 * escapes the problem without dragging a boolean through every sentence, and
 * it is the voice of a consent anyway: you declare what you accept, you are
 * not told it.
 */
export const HealthConsentCard = ({ consent, healthDataCount }: Props) => {
  const { mutate, isPending } = useSetHealthConsent();
  const [retraitOuvert, setRetraitOuvert] = useState(false);
  const granted = consent?.granted === true;

  // Giving consent takes one gesture. Withdrawing it too — the dialog does
  // not ask you to confirm an intention, it announces a consequence: what has
  // already been recorded is erased, and that cannot be undone.
  const basculer = () => {
    if (isPending) return;
    // Withdrawing consent when nothing is recorded erases nothing: the
    // dialog would have nothing to announce, and withdrawing must stay as
    // simple as giving.
    if (granted && healthDataCount > 0) {
      setRetraitOuvert(true);
      return;
    }
    mutate(!granted);
  };

  return (
    <VStack
      align="stretch"
      gap={3.5}
      bg="surface.card"
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
            Mon coach voit ce que je déclare après une séance, y compris une
            douleur ou une maladie.
          </Text>
        </VStack>

        <Box
          as="button"
          role="switch"
          aria-checked={granted}
          aria-labelledby="partage-ressenti"
          // `Box as="button"` does not take `disabled` in Chakra v3: we
          // announce it and keep the door shut in the handler.
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
          En cas de refus, les étiquettes de ressenti et le commentaire libre
          disparaissent de mon bilan, y compris ceux déjà enregistrés. Mes
          charges et mes séances restent.
        </Text>
      </VStack>

      <ConfirmHealthOptOut
        open={retraitOuvert}
        onClose={() => setRetraitOuvert(false)}
        onConfirm={() => {
          mutate(false);
          setRetraitOuvert(false);
        }}
        isPending={isPending}
        title="Retirer mon accord ?"
        action="Retirer mon accord"
        count={healthDataCount}
      />
    </VStack>
  );
};
