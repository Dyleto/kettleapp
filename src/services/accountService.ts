import api from '@/config/api';
import { AccountSummary, HealthConsent } from '@/types';

export const accountService = {
  get: async () => {
    const { data } = await api.get<AccountSummary>('/api/account');
    return data;
  },

  /** Le droit à l'effacement. Sans retour possible : le serveur ferme aussi la session. */
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
