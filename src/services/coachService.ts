import api from '@/config/api';
import {
  Client,
  ClientWithDetails,
  CompletedSession,
  Exercise,
  Session,
} from '@/types';

export const coachService = {
  getClients: async () => {
    const { data } = await api.get<Client[]>('/api/coach/clients');
    return data;
  },

  getClientDetails: async (clientId: string) => {
    const { data } = await api.get<ClientWithDetails>(
      `/api/coach/clients/${clientId}`
    );
    return data;
  },

  /**
   * Copy a session to another client.
   *
   * None of the content travels: we name the session, the server reads it
   * back itself. It returns the copy as it wrote it — the new client gets its
   * own identifiers.
   */
  copySessionToClient: async (params: {
    targetClientId: string;
    sourceClientId: string;
    sourceSessionId: string;
  }) => {
    const { data } = await api.post<Session>(
      `/api/coach/clients/${params.targetClientId}/program/sessions/copy`,
      {
        sourceClientId: params.sourceClientId,
        sourceSessionId: params.sourceSessionId,
      }
    );
    return data;
  },

  getClientHistory: async (clientId: string) => {
    const { data } = await api.get<CompletedSession[]>(
      `/api/coach/clients/${clientId}/history`
    );
    return data;
  },

  markClientHistoryAsViewed: async (clientId: string) => {
    await api.patch(`/api/coach/clients/${clientId}/history/mark-viewed`);
  },

  getExercises: async () => {
    const { data } = await api.get<Exercise[]>('/api/coach/exercises');
    return data;
  },

  createExercise: async (exerciseData: Partial<Exercise>) => {
    const { data } = await api.post<Exercise>(
      '/api/coach/exercises',
      exerciseData
    );
    return data;
  },

  generateInvitation: async (expiresIn = 7) => {
    const { data } = await api.post('/api/coach/generate-invitation', {
      expiresIn,
    });
    return data;
  },
};
