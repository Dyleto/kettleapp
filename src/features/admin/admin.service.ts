import api from '@/shared/config/api';
import type { AdminCoach, AdminStats, CreatedCoach } from '@/shared/types';

/** Ce que la boîte « Nouveau coach » envoie. */
export interface NewCoach {
  email: string;
  firstName?: string;
  lastName?: string;
  /** Donner le rôle de coach à un compte qui existe déjà. */
  promote?: boolean;
}

/**
 * L'administration : lire l'état du produit, et ouvrir un compte de coach.
 *
 * Ouvrir un compte est la seule écriture, et elle existe parce qu'il n'y a
 * pas d'inscription coach : quelqu'un l'ouvre à la main. C'est aussi ce qui
 * fait que ces routes sont les plus sensibles de l'API.
 *
 * Les types viennent du contrat : `AdminCoach` était écrit ici à la main,
 * avec un prénom obligatoire que l'API n'a jamais promis.
 */
export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>('/api/admin/stats');
    return data;
  },

  getCoaches: async (): Promise<AdminCoach[]> => {
    const { data } = await api.get<AdminCoach[]>('/api/admin/coaches');
    return data;
  },

  createCoach: async (payload: NewCoach): Promise<CreatedCoach> => {
    const { data } = await api.post<CreatedCoach>(
      '/api/admin/create-coach',
      payload
    );
    return data;
  },
};
