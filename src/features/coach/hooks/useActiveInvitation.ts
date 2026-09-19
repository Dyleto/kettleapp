import { useQuery } from '@tanstack/react-query';
import api from '@/config/api';
import { queryKeys } from '@/config/queryKeys';

interface ActiveInvitation {
  token: string;
  expiresAt: string;
}

/**
 * Le lien d'invitation en cours, s'il en existe un.
 *
 * Ce n'est pas un confort d'affichage : c'est ce qui permet de partager ou de
 * copier **sans aller-retour réseau**. Le partage et l'écriture dans le
 * presse-papier exigent une « activation transitoire », que le navigateur
 * retire quelques instants après le clic — une requête suffit à la perdre sur
 * Safari, et le coach voyait alors « lien copié » sur un presse-papier vide.
 *
 * Chargé à l'ouverture de la liste, le lien est déjà là quand on clique.
 * L'API recyclant le jeton tant qu'il est valide, c'est exactement celui que
 * « Inviter » aurait fabriqué.
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
