import { useAuth } from '@/shared/contexts/useAuth';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { ActionButton } from '@/shared/components/ActionButton';
import { FullScreenState } from '@/shared/components/FullScreenState';
import { LEGAL } from '@/shared/config/legal';

/**
 * Un compte qui existe, mais que personne n'a encore rattaché.
 *
 * L'écran disait « vous n'avez pas encore l'accès à l'application », ce qui
 * se lit comme un refus. Ce n'en est pas un : la personne s'est connectée
 * avant d'ouvrir son lien d'invitation, ou attend qu'on ouvre son espace de
 * coach. On dit donc d'abord ce qui a marché — le compte existe — puis ce
 * qu'il reste à faire, selon qui elle est.
 *
 * Le bouton s'appelle « Changer de compte » et non « Revenir à la
 * connexion » : la cause la plus fréquente est de s'être connecté avec la
 * mauvaise adresse Google, et c'est le geste qui la répare.
 */
const NoRole = () => {
  useDocumentTitle('Compte en attente');
  const { logout } = useAuth();

  return (
    <FullScreenState
      mood="sleep"
      title="Ton compte existe"
      line={`Mais personne ne t'a encore invité. Client : demande son lien à ton coach. Coach : écris à ${LEGAL.publisher.contactEmail} pour ouvrir ton espace.`}
      action={
        <ActionButton tone="ghost" size="md" onClick={() => logout()}>
          Changer de compte
        </ActionButton>
      }
    />
  );
};

export default NoRole;
