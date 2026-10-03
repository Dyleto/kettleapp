import { useState } from 'react';
import { Box, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { HealthConsent } from '@/shared/types';
import { useSetHealthConsent } from '../hooks/useAccount';
import { ConfirmHealthOptOut } from './ConfirmHealthOptOut';

interface Props {
  consent: HealthConsent | null;
  /** Combien de bilans un retrait effacerait. */
  healthDataCount: number;
}

const DAY_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * L'interrupteur du partage du ressenti, et la trace de la dernière décision.
 *
 * Retirer son accord doit être aussi simple que le donner : le même geste, au
 * même endroit, sans confirmation. Un consentement qu'on ne peut pas retirer
 * d'un doigt n'en est pas un.
 *
 * Tout y est écrit à la première personne, et non par goût : cette carte
 * apparaît dans les deux espaces, où Kettle n'emploie pas la même adresse —
 * elle tutoie le client et vouvoie le coach. Un compte portant les deux rôles
 * lisait donc « Ton coach voit ce que tu déclares » au milieu d'une page qui
 * vouvoyait partout ailleurs. La première personne échappe au problème sans
 * traîner un booléen dans chaque phrase, et c'est de toute façon la voix d'un
 * consentement : on déclare ce qu'on accepte, on ne se l'entend pas dire.
 */
export const HealthConsentCard = ({ consent, healthDataCount }: Props) => {
  const { mutate, isPending } = useSetHealthConsent();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const granted = consent?.granted === true;

  // Donner son accord tient en un geste. Le retirer aussi — la boîte ne
  // demande pas de confirmer une intention, elle annonce une conséquence : ce
  // qui est déjà enregistré s'efface, et c'est sans retour.
  const toggleConsent = () => {
    if (isPending) return;
    // Retirer son accord quand rien n'est enregistré n'efface rien : la
    // boîte n'aurait rien à annoncer, et retirer doit rester aussi simple que
    // donner.
    if (granted && healthDataCount > 0) {
      setIsWithdrawOpen(true);
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
          // `Box as="button"` ne prend pas `disabled` dans Chakra v3 : on
          // l'annonce et on garde la porte fermée dans le gestionnaire.
          aria-disabled={isPending}
          onClick={toggleConsent}
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
              {DAY_FORMAT.format(new Date(consent.decidedAt))}
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
        open={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={() => {
          mutate(false);
          setIsWithdrawOpen(false);
        }}
        isPending={isPending}
        title="Retirer mon accord ?"
        action="Retirer mon accord"
        count={healthDataCount}
      />
    </VStack>
  );
};
