import { useQuery } from '@tanstack/react-query';
import api from '@/shared/config/api';
import { queryKeys } from '@/shared/config/queryKeys';

interface ActiveInvitation {
  token: string;
  expiresAt: string;
}

/**
 * Le lien d'invitation en vigueur, s'il y en a un.
 *
 * Ce n'est pas un confort d'affichage : c'est ce qui permet de partager ou de
 * copier **sans aller-retour réseau**. Le partage comme l'écriture dans le
 * presse-papiers exigent une « activation transitoire », que le navigateur
 * retire quelques instants après le clic — une requête suffit à la perdre sur
 * Safari, et le coach lisait alors « lien copié » au-dessus d'un
 * presse-papiers vide.
 *
 * Chargé à l'ouverture de la liste, le lien est déjà là au moment du clic.
 * Comme l'API recycle le jeton tant qu'il est valide, c'est exactement celui
 * qu'« Inviter » aurait produit.
 */
export const useActiveInvitation = () =>
  useQuery({
    queryKey: queryKeys.coach.invitation(),
    queryFn: async () => {
      const { data } = await api.get<ActiveInvitation | null>(
        '/api/coach/invitation'
      );
      return data;
    },
  });
