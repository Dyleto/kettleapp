import { useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { ToggleRow } from '@/kit';
import type { HealthConsent } from '@/shared/types';
import { useSetHealthConsent } from '../hooks/useAccount';
import { containedLine, fullDay } from '@/domain/account/summary';
import { ConfirmHealthOptOut } from './ConfirmHealthOptOut';

/**
 * Le partage des données de santé, et la trace de la dernière décision.
 *
 * L'intitulé dit avec qui elles sont partagées — « Partagées avec Julie » —
 * et la ligne ce qu'elles sont et combien de séances en portent : le nombre
 * réel, au singulier à un, absent à zéro. Il disait « Partager mes
 * ressentis » à la première personne, pour échapper au vouvoiement du
 * coach ; Kettle tutoie tout le monde désormais.
 *
 * Donner son accord tient en un geste. Le retirer aussi quand rien n'est
 * enregistré ; sinon une boîte annonce ce qui s'efface, avec le nombre, et
 * c'est sans retour. La maquette proposait d'arrêter le partage en gardant
 * ce qui a été envoyé : Kettle efface — sans quoi la donnée resterait en
 * base sans plus rien pour la justifier —, et l'écart est noté au plan.
 */
export const HealthConsentCard = ({
  consent,
  healthDataCount,
  sharedWith,
}: {
  consent: HealthConsent | null;
  /** Combien de bilans un retrait effacerait. */
  healthDataCount: number;
  /** « Julie », « tes coachs », « ton coach ». */
  sharedWith: string;
}) => {
  const { mutate, isPending } = useSetHealthConsent();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const granted = consent?.granted === true;

  const toggleConsent = () => {
    // Retirer son accord quand rien n'est enregistré n'efface rien : la
    // boîte n'aurait rien à annoncer, et retirer doit rester aussi simple
    // que donner.
    if (granted && healthDataCount > 0) {
      setIsWithdrawOpen(true);
      return;
    }
    mutate(!granted);
  };

  return (
    <Box bg="surface.card" borderRadius="card" overflow="hidden">
      <ToggleRow
        label={granted ? `Partagées avec ${sharedWith}` : 'Pas partagées'}
        line={
          granted
            ? `Tes étiquettes de ressenti et tes commentaires. ${containedLine(healthDataCount)}`.trim()
            : consent
              ? 'Les étiquettes de ressenti et le commentaire ne te sont pas proposés après une séance.'
              : 'Tu n’as pas encore répondu : choisis ici.'
        }
        checked={granted}
        pending={isPending}
        onChange={toggleConsent}
      />
      {consent && (
        <Text
          px="16px"
          pb="12px"
          fontSize="sm"
          color="fg.muted"
          data-consent-trace
        >
          {granted ? 'Accepté' : 'Refusé'} le {fullDay(consent.decidedAt)}.
        </Text>
      )}
      <ConfirmHealthOptOut
        open={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onConfirm={() => {
          mutate(false);
          setIsWithdrawOpen(false);
        }}
        isPending={isPending}
        title="Ne plus partager tes données de santé ?"
        action="Arrêter et effacer"
        count={healthDataCount}
      />
    </Box>
  );
};
