import api from '@/config/api';
import {
  ClientProgram,
  CompletedSession,
  PerformedEntry,
  RoundsDoneEntry,
  SessionFeedback,
} from '@/types';

export interface CompleteSessionPayload {
  feedback: SessionFeedback;
  performed?: PerformedEntry[];
  /** Le score des blocs qui se comptent en tours — un AMRAP. */
  roundsDone?: RoundsDoneEntry[];
  clientNotes?: string;
  completedAt?: string;
}

export interface UpdateCompletedSessionPayload {
  feedback?: SessionFeedback;
  performed?: PerformedEntry[];
  roundsDone?: RoundsDoneEntry[];
  clientNotes?: string;
  completedAt?: string;
}

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

  // Corriger un bilan déjà envoyé. Toujours ouvert : un chiffre saisi de
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
