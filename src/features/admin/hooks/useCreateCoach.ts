import { useMutation } from '@tanstack/react-query';
import api from '@/shared/config/api';
import { toaster } from '@/shared/components/ui/toasterInstance';
import eventEmitter from '@/shared/utils/eventEmitter';
import axios from 'axios';

interface CreateCoachData {
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Créer un coach.
 *
 * La seule écriture de l'administration, et la seule porte d'entrée d'un
 * coach dans Kettle : il n'y a pas d'inscription coach.
 */
export const useCreateCoach = () => {
  return useMutation({
    mutationFn: (data: CreateCoachData) =>
      api.post('/api/admin/create-coach', data),

    onSuccess: (response, variables) => {
      toaster.create({
        title: 'Coach créé avec succès',
        description: `${variables.firstName} ${variables.lastName} (${variables.email}) a été ajouté en tant que coach.`,
        type: 'success',
        duration: 5000,
      });
    },

    onError: (error: unknown) => {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      if (status !== 403 && status !== 401) {
        eventEmitter.emit('error', {
          title: 'Erreur lors de la création du coach',
          message:
            axios.isAxiosError(error) && error.response?.data?.message
              ? error.response.data.message
              : 'Une erreur est survenue. Veuillez réessayer.',
        });
      }
    },
  });
};
