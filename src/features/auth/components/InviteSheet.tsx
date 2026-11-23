import { useState } from 'react';
import { chakra, Portal, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import { useSheetDismiss } from '@/features/workshop';
import { ActionButton, Sheet } from '@/kit';
import { invitationTokenFrom } from '@/domain/invitation/link';

/**
 * « J'ai reçu une invitation » : quoi faire, et de quoi coller le lien.
 *
 * Se connecter ici sans lien crée un compte rattaché à personne : le client
 * n'y voit aucune séance, et c'était la boucle de l'entrée A1. La feuille
 * renvoie donc au lien du coach — l'ouvrir suffit — et accepte qu'on le
 * colle, pour qui ne le retrouve que sous forme de texte. « Continuer »
 * s'active quand le texte en a l'air, et mène à l'écran d'invitation, qui
 * vérifie le jeton.
 *
 * Elle sert aussi « Mon compte », pour un client qui n'a pas de coach.
 */
export const InviteSheet = ({ onClose }: { onClose: () => void }) => {
  useSheetDismiss(true, onClose);
  const navigate = useNavigate();
  const [pasted, setPasted] = useState('');
  const token = invitationTokenFrom(pasted);
  const title = 'Tu as reçu un lien ?';
  return (
    <Portal>
      <Sheet label={title} onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px">
          {title}
        </Text>
        <Text color="fg.muted">
          Ouvre-le : il te rattache à ton coach et crée ton compte en même
          temps. Si tu l'as perdu, demande-lui de te le renvoyer.
        </Text>
        <chakra.input
          type="url"
          inputMode="url"
          aria-label="Ton lien d'invitation"
          placeholder="Ou colle ton lien ici"
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && token) navigate(`/join?token=${token}`);
          }}
          minH="50px"
          px="16px"
          borderRadius="17px"
          bg="surface.card"
          border="none"
          outline="none"
          boxShadow="inset 0 0 0 1.5px {colors.line}"
          _focus={{ boxShadow: 'inset 0 0 0 2px {colors.app.primary}' }}
          color="fg"
          _placeholder={{ color: 'fg.muted' }}
        />
        {pasted.trim() && !token && (
          <Text fontSize="sm" color="fg.muted" data-paste-hint>
            Ce n'est pas encore un lien d'invitation : il contient
            «&nbsp;join?token=&nbsp;».
          </Text>
        )}
        <ActionButton
          w="full"
          disabled={!token}
          onClick={() => token && navigate(`/join?token=${token}`)}
        >
          Continuer
        </ActionButton>
      </Sheet>
    </Portal>
  );
};
