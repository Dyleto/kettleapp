import api from '@/shared/config/api';

export interface AdminStats {
  coachCount: number;
  clientCount: number;
  sessionCount: number;
  sessionTodayCount: number;
  exerciseCount: number;
}

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
