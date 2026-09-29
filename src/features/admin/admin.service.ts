import api from '@/shared/config/api';

/** Les quelques nombres qui disent où en est le produit : des comptes, rien
 * de nominatif. */
export interface AdminStats {
  coachCount: number;
  clientCount: number;
  sessionCount: number;
  sessionTodayCount: number;
  exerciseCount: number;
}

/** Un coach vu depuis l'administration : de quoi le joindre et savoir
 * combien de clients il suit. */
export interface AdminCoach {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  picture?: string;
  clientCount: number;
  exerciseCount: number;
  createdAt: string;
}

/**
 * L'administration : lire l'état du produit, et créer un coach.
 *
 * Créer un coach est la seule écriture, et elle existe parce qu'il n'y a pas
 * d'inscription coach : quelqu'un ouvre le compte à la main. C'est aussi ce
 * qui fait que ces routes sont les plus sensibles de l'API.
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

  createCoach: async (payload: {
    firstName: string;
    lastName: string;
    email: string;
  }) => {
    const { data } = await api.post('/api/admin/create-coach', payload);
    return data;
  },
};
