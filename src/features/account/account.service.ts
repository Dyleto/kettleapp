import api from '@/shared/config/api';
import { AccountSummary, HealthConsent } from '@/shared/types';

/**
 * Ce que l'écran « Mon compte » demande à l'API.
 *
 * Un objet plutôt que des fonctions libres : les appels partagent un préfixe
 * (`/api/account`) et se lisent au point d'appel comme ce qu'ils sont —
 * `accountService.remove()` dit de quel compte il s'agit.
 */
export const accountService = {
  get: async () => {
    const { data } = await api.get<AccountSummary>('/api/account');
    return data;
  },

  /** Le droit à l'effacement. Sans retour possible : le serveur ferme aussi
   * la session. */
  remove: async () => {
    await api.delete('/api/account');
  },

  setHealthConsent: async (granted: boolean) => {
    const { data } = await api.put<{ healthConsent: HealthConsent }>(
      '/api/client/health-consent',
      { granted }
    );
    return data.healthConsent;
  },
};
