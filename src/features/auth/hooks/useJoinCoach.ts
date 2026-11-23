import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/features/auth/auth.service';
import { useAuth } from '@/shared/contexts/useAuth';

/**
 * Rejoindre le coach d'un lien avec le compte déjà ouvert (F9b).
 *
 * Le compte change de nature — il devient client, ou client d'un coach de
 * plus —, donc l'utilisateur rendu par l'API remplace celui du contexte, et
 * tout ce qui a été lu sous l'ancien est relu : l'espace client ne doit pas
 * s'ouvrir sur un programme lu avant le rattachement.
 */
export const useJoinCoach = () => {
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationToken: string) => authService.join(invitationToken),
    onSuccess: (user) => {
      setUser(user);
      void queryClient.invalidateQueries();
    },
  });
};
