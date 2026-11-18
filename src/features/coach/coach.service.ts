import api from '@/shared/config/api';
import type { Reaction } from '@/domain/inbox/reply';
import {
  Client,
  ClientWithDetails,
  CompletedSession,
  Inbox,
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
  /** Le fil « À lire », ou « Déjà lues » sur trente jours. */
  getInbox: async (state: 'unread' | 'read') => {
    const { data } = await api.get<Inbox>('/api/coach/inbox', {
      params: { state },
    });
    return data;
  },

  /**
   * Répondre à une séance : une réaction, un texte, ou les deux. Une clé
   * absente laisse en place, `null` efface — la touche d'une réaction ne
   * connaît pas le texte déjà écrit.
   */
  replyTo: async (
    completedId: string,
    body: { reaction?: Reaction | null; text?: string | null }
  ) => {
    const { data } = await api.patch<{ completed: CompletedSession }>(
      `/api/coach/sessions/completed/${completedId}/reply`,
      body
    );
    return data.completed;
  },

  /** Lues — ou non lues, pour « Annuler » —, une ou plusieurs à la fois. */
  markViewed: async (ids: string[], viewed: boolean) => {
    const { data } = await api.patch<{ count: number }>(
      '/api/coach/sessions/completed/viewed',
      { ids, viewed }
    );
    return data;
  },

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
