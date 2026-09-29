import api from '@/shared/config/api';
import {
  Client,
  ClientWithDetails,
  CompletedSession,
  Session,
} from '@/shared/types';

/**
 * Ce que l'espace coach demande à l'API : ses clients, leur historique, ses
 * invitations.
 *
 * Les exercices n'y sont plus : ils ont leur propre service, dans leur propre
 * domaine. Ils vivaient ici parce que leurs routes sont sous `/api/coach`,
 * et c'était confondre l'adresse de l'API avec l'organisation du code.
 */
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
   * Copier une séance chez un autre client.
   *
   * Rien du contenu ne voyage : on nomme la séance, le serveur la relit
   * lui-même. Il rend la copie telle qu'il l'a écrite — le nouveau client
   * reçoit ses propres identifiants.
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

  generateInvitation: async (expiresIn = 7) => {
    const { data } = await api.post('/api/coach/generate-invitation', {
      expiresIn,
    });
    return data;
  },
};
