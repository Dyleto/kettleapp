import { User } from '@/types';

// Legal documents are readable without an account: someone has to be able to
// know what we collect before deciding to sign up.
const PUBLIC_ROUTES = new Set([
  '/login',
  '/auth/callback',
  '/join',
  '/confidentialite',
  '/mentions-legales',
]);

export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.has(pathname);
};

export const getDefaultRoleRoute = (user: User | null): string => {
  if (!user) return '/login';
  if (user.isAdmin) return '/admin';
  if (user.isCoach) return '/coach';
  if (user.isClient) return '/client';
  return '/no-role';
};

export const CLIENT_ROUTES = {
  today: '/client',
  program: '/client/program',
  session: '/client/session',
  sessionById: (sessionId: string) => `/client/session/${sessionId}`,
  history: '/client/history',
  account: '/client/account',
};

export const COACH_ROUTES = {
  clients: '/coach',
  clientDetails: (clientId: string) => `/coach/clients/${clientId}`,
  clientSession: (clientId: string, sessionIndex: number) =>
    `/coach/clients/${clientId}/s/${sessionIndex}`,
  clientJournal: (clientId: string) => `/coach/clients/${clientId}/journal`,
  exercises: '/coach/exercises',
  exerciseDetails: (exerciseId: string) => `/coach/exercises/${exerciseId}`,
  account: '/coach/account',
};

/**
 * Where "Mon compte" leads from the menu.
 *
 * The screen lives in the area you are already in: an account holding both
 * roles should not have to change worlds to read its own email address. So we
 * follow the current path, and fall back on the role when it says nothing.
 */
export const getAccountRoute = (
  user: User | null,
  pathname: string
): string | null => {
  if (pathname.startsWith('/coach') && user?.isCoach)
    return COACH_ROUTES.account;
  if (pathname.startsWith('/client') && user?.isClient)
    return CLIENT_ROUTES.account;
  if (user?.isClient) return CLIENT_ROUTES.account;
  if (user?.isCoach) return COACH_ROUTES.account;
  return null;
};

export const NO_ROLE_ROUTES = {
  main: '/no-role',
};
