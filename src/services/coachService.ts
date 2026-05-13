import api from "@/config/api";
import {
  BlockExercise,
  Client,
  ClientWithDetails,
  CompletedSession,
  Exercise,
  ExerciseStats,
  Session,
  SessionBlock,
} from "@/types";

type RawBlockExercise = Omit<BlockExercise, "exercise"> & { exerciseId: Exercise };
type RawBlock = Omit<SessionBlock, "exercises"> & { exercises: RawBlockExercise[] };
type RawSession = Omit<Session, "blocks"> & { blocks: RawBlock[] };

const transformSession = (session: RawSession): Session => ({
  ...session,
  blocks: session.blocks.map((block) => ({
    ...block,
    exercises: block.exercises.map(({ exerciseId, ...rest }) => ({
      ...rest,
      exercise: exerciseId,
    })),
  })),
});

export const coachService = {
  getClients: async () => {
    const { data } = await api.get<Client[]>("/api/coach/clients");
    return data;
  },

  getClientDetails: async (clientId: string) => {
    const { data } = await api.get<ClientWithDetails>(
      `/api/coach/clients/${clientId}`,
    );

    if (data.program?.sessions) {
      data.program.sessions = (data.program.sessions as unknown as RawSession[]).map(
        transformSession,
      ) as unknown as Session[];
    }

    return data;
  },

  getClientHistory: async (clientId: string) => {
    const { data } = await api.get<CompletedSession[]>(
      `/api/coach/clients/${clientId}/history`,
    );
    return data;
  },

  markClientHistoryAsViewed: async (clientId: string) => {
    await api.patch(`/api/coach/clients/${clientId}/history/mark-viewed`);
  },

  getExercises: async () => {
    const { data } = await api.get<Exercise[]>("/api/coach/exercises");
    return data;
  },

  getExerciseStats: async () => {
    const { data } = await api.get<ExerciseStats>("/api/coach/exercises/stats");
    return data;
  },

  createExercise: async (exerciseData: Partial<Exercise>) => {
    const { data } = await api.post<Exercise>("/api/coach/exercises", exerciseData);
    return data;
  },

  generateInvitation: async (expiresIn = 7) => {
    const { data } = await api.post("/api/coach/generate-invitation", { expiresIn });
    return data;
  },
};
