import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/features/client/common/client.service';
import { queryKeys } from '@/shared/config/queryKeys';
import { coachVoice } from '@/features/client/common/coach';

/**
 * Le coach du client, lu avant la porte du programme.
 *
 * La question du partage et les cartes de bienvenue se posent devant tout
 * l'espace client, donc avant `ClientProgramBoundary` qui fournit le nom à
 * tous les écrans ; elles nomment pourtant déjà le coach — « acceptes-tu
 * que Julie les lise ? ». La même requête que la porte, sous la même clé :
 * le programme n'est lu qu'une fois.
 *
 * Tant qu'il charge, ou s'il ne répond pas, le coach s'appelle « ton
 * coach » : une question de consentement ne doit pas attendre un réseau.
 *
 * `enabled` : la disposition de l'espace client ne le lit que lorsqu'elle
 * pose la question. Sans cela, « Mon compte » demandait le programme, et
 * restait suspendu à ses reprises pendant une panne — la propriété que
 * `verify_states` garde : on doit pouvoir s'y rendre, et s'y déconnecter,
 * quand le reste ne répond pas.
 */
export const useProgramCoach = (enabled = true) => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.client.program.get(),
    queryFn: clientService.getProgram,
    enabled,
  });
  return {
    voice: coachVoice(data?.coaches),
    /** Combien de coachs suivent ce client ; `undefined` tant qu'on ne sait pas. */
    coachCount: data?.coaches.length,
    isLoading,
  };
};
