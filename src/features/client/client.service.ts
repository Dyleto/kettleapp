import api from '@/shared/config/api';
import {
  ClientProgram,
  CompletedSession,
  PerformedEntry,
  RoundsDoneEntry,
  SessionFeedback,
} from '@/shared/types';

/**
 * Ce qu'une séance terminée envoie au serveur.
 *
 * Tout est facultatif sauf l'identifiant de la séance : on peut terminer sans
 * avoir rien noté, et c'est le cas d'un client qui a fait sa séance sans
 * ouvrir le mode guidé. Ce qui est absent n'est pas nul — c'est non
 * renseigné, et le serveur le traite ainsi.
 */
export interface CompleteSessionPayload {
  feedback: SessionFeedback;
  performed?: PerformedEntry[];
  /** The score of blocks counted in rounds — an AMRAP. */
  roundsDone?: RoundsDoneEntry[];
  clientNotes?: string;
  completedAt?: string;
}

/** La correction d'un bilan déjà envoyé : les mêmes champs, tous
 * remplaçables. */
export interface UpdateCompletedSessionPayload {
  feedback?: SessionFeedback;
  performed?: PerformedEntry[];
  roundsDone?: RoundsDoneEntry[];
  clientNotes?: string;
  completedAt?: string;
}

/**
 * Ce que l'espace client demande à l'API.
 *
 * Trois lectures et deux écritures : le programme, l'historique, la
 * progression d'un exercice ; terminer une séance, corriger un bilan. Le
 * client ne modifie jamais son programme — c'est ce qui rend cette surface
 * aussi petite.
 */
export const clientService = {
  getProgram: async (): Promise<ClientProgram> => {
    const { data } = await api.get<{ program: ClientProgram }>(
      '/api/client/program'
    );
    return data.program;
  },

  getHistory: async (): Promise<CompletedSession[]> => {
    const { data } = await api.get<{ history: CompletedSession[] }>(
      '/api/client/history',
      { params: { limit: 200 } }
    );
    return data.history;
  },

  completeSession: async (
    sessionId: string,
    payload: CompleteSessionPayload
  ): Promise<CompletedSession> => {
    const { data } = await api.post<{ completed: CompletedSession }>(
      `/api/client/sessions/${sessionId}/complete`,
      payload
    );
    return data.completed;
  },

  // Corriger un bilan déjà envoyé. Toujours ouvert : un chiffre tapé de
  // travers en plein effort doit pouvoir se réparer depuis l'historique.
  updateCompletedSession: async (
    completedId: string,
    payload: UpdateCompletedSessionPayload
  ): Promise<CompletedSession> => {
    const { data } = await api.patch<{ completed: CompletedSession }>(
      `/api/client/sessions/completed/${completedId}`,
      payload
    );
    return data.completed;
  },
};
