import { User } from '@/shared/types';

// Les documents légaux se lisent sans compte : il faut pouvoir savoir ce
// qu'on collecte avant de décider de s'inscrire.
const PUBLIC_ROUTES = new Set([
  '/login',
  '/auth/callback',
  '/join',
  '/confidentialite',
  '/mentions-legales',
]);

/** Une route qu'on atteint sans compte : le garde de navigation s'en sert
 * pour savoir s'il doit rediriger vers la connexion. */
export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.has(pathname);
};

/**
 * Où atterrit un compte qui vient de se connecter.
 *
 * L'ordre n'est pas alphabétique : un compte qui porte plusieurs rôles
 * arrive dans le plus large, et le menu lui sert à descendre. L'inverse —
 * ouvrir sur l'espace client un coach qui est aussi son propre client —
 * l'obligeait à changer d'espace à chaque connexion.
 */
export const getDefaultRoleRoute = (user: User | null): string => {
  if (!user) return '/login';
  if (user.isAdmin) return '/admin';
  if (user.isCoach) return '/coach';
  if (user.isClient) return '/client';
  return '/no-role';
};

/**
 * Les adresses de l'espace client, écrites une fois.
 *
 * Les chemins étaient composés à la main sur chaque lien ; une refonte des
 * routes obligeait à les retrouver un par un, et un oubli ne se voyait qu'au
 * clic. Les fonctions portent les paramètres, donc TypeScript refuse un lien
 * auquel il manque l'identifiant.
 */
export const CLIENT_ROUTES = {
  today: '/client',
  program: '/client/program',
  session: '/client/session',
  sessionById: (sessionId: string) => `/client/session/${sessionId}`,
  history: '/client/history',
  account: '/client/account',
};

/** Les adresses de l'espace coach, pour la même raison. */
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
 * L'écran vit dans l'espace où l'on se trouve déjà : un compte qui porte les
 * deux rôles n'a pas à changer de monde pour lire sa propre adresse e-mail.
 * On suit donc le chemin courant, et on se rabat sur le rôle quand il ne dit
 * rien.
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

/** L'écran d'un compte qui n'a encore aucun rôle : il n'a qu'une adresse,
 * mais elle se nomme comme les autres. */
export const NO_ROLE_ROUTES = {
  main: '/no-role',
};
