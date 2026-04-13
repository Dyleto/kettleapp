import api from "@/config/api";
import { ClientProgram, CompletedSession, SessionMetrics } from "@/types";

export const clientService = {
  getProgram: async (): Promise<ClientProgram> => {
    const { data } = await api.get<{ program: ClientProgram }>(
      "/api/client/program",
    );
    return data.program;
  },

  getHistory: async (): Promise<CompletedSession[]> => {
    const { data } = await api.get<{ history: CompletedSession[] }>(
      "/api/client/history",
    );
    return data.history;
  },

  completeSession: async (
    sessionId: string,
    payload: { metrics: SessionMetrics; clientNotes?: string },
  ): Promise<CompletedSession> => {
    const { data } = await api.post<{ completed: CompletedSession }>(
      `/api/client/sessions/${sessionId}/complete`,
      payload,
    );
    return data.completed;
  },
};
