import { useMutation } from "@tanstack/react-query";
import api from "@/config/api";
import { toaster } from "@/components/ui/toaster";
import eventEmitter from "@/utils/eventEmitter";

interface CreateCoachData {
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Hook pour créer un coach (admin uniquement)
 */
export const useCreateCoach = () => {
  return useMutation({
    mutationFn: (data: CreateCoachData) =>
      api.post("/api/admin/create-coach", data),

    onSuccess: (response, variables) => {
      toaster.create({
        title: "Coach créé avec succès",
        description: `${variables.firstName} ${variables.lastName} (${variables.email}) a été ajouté en tant que coach.`,
        type: "success",
        duration: 5000,
      });
    },

    onError: (error: any) => {
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        eventEmitter.emit("error", {
          title: "Erreur lors de la création du coach",
          message:
            error.response?.data?.message ||
            "Une erreur est survenue. Veuillez réessayer.",
        });
      }
    },
  });
};
