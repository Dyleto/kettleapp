import type { AdminCoach, AdminStats } from '@/shared/types';

/**
 * Ce que l'administration dit des nombres et des coachs, hors du composant.
 *
 * Des phrases qui se comptent — un client, douze clients — et une adresse
 * qu'on juge avant de l'envoyer : elles se testent mieux ici qu'à l'écran.
 */

const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;

const MONTH_YEAR = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
});

/** Une tuile : le nombre, ce qu'il compte, et ce qui s'y ajoute aujourd'hui. */
export interface StatTile {
  key: keyof AdminStats;
  count: number;
  label: string;
  sub?: string;
}

/**
 * Les quatre nombres, dans l'ordre de la maquette. Le libellé s'accorde au
 * nombre : la page écrivait « Coachs » au-dessus d'un 1. Les séances du
 * jour ne s'affichent que quand il y en a — « + 0 aujourd'hui » ne dit rien.
 */
export const statTiles = (stats: AdminStats): StatTile[] => [
  {
    key: 'coachCount',
    count: stats.coachCount,
    label: stats.coachCount > 1 ? 'coachs' : 'coach',
  },
  {
    key: 'clientCount',
    count: stats.clientCount,
    label: stats.clientCount > 1 ? 'clients' : 'client',
  },
  {
    key: 'sessionCount',
    count: stats.sessionCount,
    label: stats.sessionCount > 1 ? 'séances faites' : 'séance faite',
    sub:
      stats.sessionTodayCount > 0
        ? `+ ${stats.sessionTodayCount} aujourd'hui`
        : undefined,
  },
  {
    key: 'exerciseCount',
    count: stats.exerciseCount,
    label: stats.exerciseCount > 1 ? 'exercices créés' : 'exercice créé',
  },
];

/**
 * Le nom d'un coach, ou son adresse quand il n'en a pas encore : un compte
 * ouvert sans nom attend celui que Google donnera à la première connexion.
 * La ligne affichait une espace seule.
 */
export const coachName = (coach: {
  firstName?: string;
  lastName?: string;
  email: string;
}): string =>
  `${coach.firstName ?? ''} ${coach.lastName ?? ''}`.trim() || coach.email;

/** « 12 clients », « 64 exercices », « depuis février 2026 ». */
export const coachFacts = (
  coach: AdminCoach
): { clients: string; exercises: string; since: string } => ({
  clients: plural(coach.clientCount, 'client', 'clients'),
  exercises: plural(coach.exerciseCount, 'exercice', 'exercices'),
  since: `depuis ${MONTH_YEAR.format(new Date(coach.createdAt))}`,
});

/**
 * Une adresse qui vaut d'être envoyée : quelque chose, une arobase, un
 * domaine avec un point. Le serveur juge en dernier ; ceci ne sert qu'à
 * n'activer « Créer le compte » que quand l'envoi a une chance d'aboutir.
 */
export const isEmailLike = (text: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
