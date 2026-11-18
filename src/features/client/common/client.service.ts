import api from '@/shared/config/api';
import {
  ClientCoach,
  ClientProgram,
  CompletedSession,
  ChipperDoneEntry,
  LadderDoneEntry,
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
  /** Le score des blocs qui se comptent en tours — un AMRAP. */
  roundsDone?: RoundsDoneEntry[];
  /** Ce qu'une échelle bornée a donné : paliers faits et temps. */
  ladderDone?: LadderDoneEntry[];
  /** Ce qu'un chipper ou un TimeCap borné a donné : mouvements faits et
   * temps. */
  chipperDone?: ChipperDoneEntry[];
  clientNotes?: string;
  completedAt?: string;
  /** La même à chaque essai d'un même bilan : le serveur ne le compte
   * qu'une fois. */
  sendKey?: string;
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
  getProgram: async (): Promise<ClientProgram & { coaches: ClientCoach[] }> => {
    const { data } = await api.get<{
      program: ClientProgram;
      coaches?: ClientCoach[];
    }>('/api/client/program');
    // `coaches` est facultatif ici, alors que le contrat le promet : un
    // front déployé avant son API recevrait une réponse sans lui, et un
    // prénom qui manque ne doit pas faire tomber tout l'espace du client —
    // on y lit « ton coach » en attendant.
    return { ...data.program, coaches: data.coaches ?? [] };
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
  /** Le client a lu les réponses de son coach à cette séance. */
  readReplies: async (completedId: string): Promise<CompletedSession> => {
    const { data } = await api.patch<{ completed: CompletedSession }>(
      `/api/client/sessions/completed/${completedId}/replies/read`
    );
    return data.completed;
  },

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
