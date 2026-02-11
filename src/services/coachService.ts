import api from "@/config/api";
import { Client, Exercise, ExerciseStats } from "@/types"; // Assurez-vous d'avoir les types définis

export const coachService = {
  // Clients
  getClients: async () => {
    const { data } = await api.get<Client[]>("/api/coach/clients");
    return data;
  },

  getClientDetails: async (clientId: string) => {
    const { data } = await api.get<Client>(`/api/coach/clients/${clientId}`);
    return data;
  },

  // Exercices
  getExercises: async () => {
    const { data } = await api.get<Exercise[]>("/api/coach/exercises");
    return data;
  },

  getExerciseStats: async () => {
    const { data } = await api.get<ExerciseStats>("/api/coach/exercises/stats");
    return data;
  },

  createExercise: async (exerciseData: Partial<Exercise>) => {
    const { data } = await api.post<Exercise>(
      "/api/coach/exercises",
      exerciseData,
    );
    return data;
  },

  // Invitations
  generateInvitation: async (expiresIn: number = 7) => {
    const { data } = await api.post("/api/coach/generate-invitation", {
      expiresIn,
    });
    return data;
  },
};
