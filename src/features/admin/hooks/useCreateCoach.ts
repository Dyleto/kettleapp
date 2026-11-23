import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, type NewCoach } from '@/features/admin/admin.service';
import { queryKeys } from '@/shared/config/queryKeys';

/**
 * Ouvrir un compte de coach, ou donner ce rôle à un compte existant.
 *
 * Ne réessaie pas, à l'inverse des autres écritures : l'ouverture n'est pas
 * idempotente. Une réponse perdue après un 201 ferait renvoyer la même
 * demande, et le serveur répondrait « Ce compte est déjà coach » à
 * l'administrateur qui vient de l'ouvrir.
 *
 * Ni message d'erreur global ni toast ici : la boîte dit elle-même ce qui
 * n'est pas parti, et l'écran ce qui a réussi — une réponse « exists »
 * n'est ni l'un ni l'autre, c'est une question.
 */
export const useCreateCoach = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewCoach) => adminService.createCoach(data),
    retry: 0,
    onSuccess: (result) => {
      if (result.status !== 'success') return;
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coaches() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
    },
  });
};
