import { User } from '@/types';

// Les documents légaux se lisent sans compte : quelqu'un doit pouvoir savoir
// ce qu'on collecte avant de décider de s'inscrire.
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
 * Où mène « Mon compte » depuis le menu.
 *
 * L'écran vit dans l'espace où l'on se trouve : un compte qui tient les deux
 * rôles n'a pas à changer de monde pour lire son adresse e-mail. On suit donc
 * le chemin courant, et on retombe sur le rôle quand il ne dit rien.
 */
export const getAccountRoute = (
  user: User | null,
  pathname: string
): string | null => {
  if (pathname.startsWith('/coach') && user?.isCoach) return COACH_ROUTES.account;
  if (pathname.startsWith('/client') && user?.isClient)
    return CLIENT_ROUTES.account;
  if (user?.isClient) return CLIENT_ROUTES.account;
  if (user?.isCoach) return COACH_ROUTES.account;
  return null;
};

export const NO_ROLE_ROUTES = {
  main: '/no-role',
};
