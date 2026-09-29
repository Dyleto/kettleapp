/**
 * The single source of truth for React Query cache keys.
 * Avoids typos and makes cache invalidation straightforward.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    verifyInviteToken: (token: string) =>
      [...queryKeys.auth.all, 'verify-invite-token', token] as const,
  },

  account: {
    all: ['account'] as const,
    get: () => [...queryKeys.account.all] as const,
  },

  coach: {
    all: ['coach'] as const,

    invitation: () => [...queryKeys.coach.all, 'invitation'] as const,

    clients: {
      all: () => [...queryKeys.coach.all, 'clients'] as const,
      lists: () => [...queryKeys.coach.clients.all(), 'list'] as const,
      detail: (clientId: string) =>
        [...queryKeys.coach.clients.all(), clientId] as const,
      history: (clientId: string) =>
        [...queryKeys.coach.clients.all(), clientId, 'history'] as const,
    },

    exercises: {
      all: () => [...queryKeys.coach.all, 'exercises'] as const,
      lists: () => [...queryKeys.coach.exercises.all(), 'list'] as const,
      detail: (exerciseId: string) =>
        [...queryKeys.coach.exercises.all(), exerciseId] as const,
    },

    invitations: {
      all: () => [...queryKeys.coach.all, 'invitations'] as const,
    },
  },

  admin: {
    all: ['admin'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    coaches: () => [...queryKeys.admin.all, 'coaches'] as const,
  },

  client: {
    all: ['client'] as const,
    program: {
      get: () => [...queryKeys.client.all, 'program', 'active'] as const,
    },
    history: {
      all: () => [...queryKeys.client.all, 'history'] as const,
    },
    exercises: {
      history: (exerciseId: string) =>
        [...queryKeys.client.all, 'exercises', exerciseId, 'history'] as const,
    },
  },
};
