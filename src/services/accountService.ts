import api from '@/config/api';
import { AccountSummary, HealthConsent } from '@/types';

export const accountService = {
  get: async () => {
    const { data } = await api.get<AccountSummary>('/api/account');
    return data;
  },

  /** The right to erasure. No way back: the server also closes the session. */
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
