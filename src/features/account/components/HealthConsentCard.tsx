import { useState } from 'react';
import { Box, HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { HealthConsent } from '@/types';
import { useSetHealthConsent } from '../hooks/useAccount';
import { ConfirmRefusSante } from './ConfirmRefusSante';

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
 * L'interrupteur du partage de ressenti, et la trace de la dernière décision.
 *
 * Retirer son accord doit être aussi simple que de le donner : c'est le même
 * geste, au même endroit, sans confirmation. Un accord qu'on ne peut pas
 * reprendre d'un doigt n'en est pas un.
 *
 * Tout y est écrit à la première personne, et pas par goût : cette carte
 * paraît dans les deux espaces, où Kettle n'emploie pas la même adresse — il
 * tutoie le client et vouvoie le coach. Un compte qui tient les deux rôles
 * lisait donc « Ton coach voit ce que tu déclares » au milieu d'une page qui
 * le vouvoyait partout ailleurs. La première personne échappe au problème
 * sans traîner un booléen dans chaque phrase, et c'est de toute façon la voix
 * d'un consentement : on déclare ce qu'on accepte, on ne se le fait pas dire.
 */
export const HealthConsentCard = ({ consent, healthDataCount }: Props) => {
  const { mutate, isPending } = useSetHealthConsent();
  const [retraitOuvert, setRetraitOuvert] = useState(false);
  const granted = consent?.granted === true;

  // Donner son accord tient en un geste. Le retirer aussi — la fenêtre ne
  // demande pas de confirmer une intention, elle annonce une conséquence :
  // ce qui a déjà été enregistré est effacé, et ça ne se rattrape pas.
  const basculer = () => {
    if (isPending) return;
    // Retirer son accord alors qu'il n'y a rien d'enregistré n'efface rien :
    // la fenêtre n'aurait rien à annoncer, et retirer doit rester aussi
    // simple que donner.
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
            Mon coach voit ce que je déclare après une séance, y compris une
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

      <ConfirmRefusSante
        open={retraitOuvert}
        onClose={() => setRetraitOuvert(false)}
        onConfirm={() => {
          mutate(false);
          setRetraitOuvert(false);
        }}
        isPending={isPending}
        titre="Retirer mon accord ?"
        action="Retirer mon accord"
        nombre={healthDataCount}
      />
    </VStack>
  );
};
