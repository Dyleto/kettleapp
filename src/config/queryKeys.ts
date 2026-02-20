/**
 * Source de vérité unique pour les clés de cache React Query.
 * Permet d'éviter les fautes de frappe et facilite l'invalidation du cache.
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    verifyInviteToken: (token: string) =>
      [...queryKeys.auth.all, "verify-invite-token", token] as const,
  },

  coach: {
    all: ["coach"] as const,

    clients: {
      all: () => [...queryKeys.coach.all, "clients"] as const,
      lists: () => [...queryKeys.coach.clients.all(), "list"] as const,
      detail: (clientId: string) =>
        [...queryKeys.coach.clients.all(), clientId] as const,
    },

    exercises: {
      all: () => [...queryKeys.coach.all, "exercises"] as const,
      lists: () => [...queryKeys.coach.exercises.all(), "list"] as const,
      detail: (exerciseId: string) =>
        [...queryKeys.coach.exercises.all(), exerciseId] as const,
      stats: () => [...queryKeys.coach.exercises.all(), "stats"] as const,
    },

    // Si vous avez d'autres sous-domaines comme invitations
    invitations: {
      all: () => [...queryKeys.coach.all, "invitations"] as const,
    },
  },

  client: {
    all: ["client"] as const,
    program: {
      active: () => [...queryKeys.client.all, "program", "active"] as const,
    },
    exercises: {
      history: (exerciseId: string) =>
        [...queryKeys.client.all, "exercises", exerciseId, "history"] as const,
    },
  },
};
