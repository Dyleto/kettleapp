import type { AccountSummary } from '@/shared/types';

/**
 * Ce que « Mon compte » dit du compte, hors du composant : les dates, le
 * nom de celui qui lit les données de santé, la ligne d'un coach, et ce
 * qu'une suppression efface.
 *
 * Ces phrases se comptent et s'accordent — une séance, six séances, un
 * coach ou deux — et c'est là que l'écran se trompait : elles se testent
 * mieux ici qu'à l'écran.
 */

type Coach = NonNullable<AccountSummary['asClient']>['coaches'][number];

const MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'long' });

/**
 * « 1er juin 2026 » : le premier du mois s'écrit en ordinal, comme on
 * l'écrit à la main. `Intl` écrivait « 1 juin 2026 ».
 */
export const fullDay = (iso: string): string => {
  const date = new Date(iso);
  const day = date.getDate() === 1 ? '1er' : String(date.getDate());
  return `${day} ${MONTH.format(date)} ${date.getFullYear()}`;
};

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

/**
 * Avec qui les données de santé sont partagées : le prénom quand il n'y a
 * qu'un coach, comme partout dans l'espace du client ; « tes coachs » à
 * plusieurs ; « ton coach » sans prénom ni coach.
 */
export const sharedWith = (coaches: readonly Coach[]): string => {
  if (coaches.length > 1) return 'tes coachs';
  return coaches[0]?.firstName.trim() || 'ton coach';
};

/**
 * La ligne d'un coach : « depuis le 1er juin 2026 · 6 séances faites ».
 *
 * Le compte des séances est celui du compte entier : avec deux coachs, il
 * ne dirait pas chez lequel, et il n'est donné qu'à un seul.
 */
export const coachLine = (
  coach: Coach,
  completedCount: number,
  coachCount: number
): string => {
  const since = `depuis le ${fullDay(coach.linkedAt)}`;
  if (coachCount !== 1) return since;
  const done =
    completedCount === 0
      ? 'aucune séance faite'
      : `${plural(completedCount, 'séance')} faite${completedCount > 1 ? 's' : ''}`;
  return `${since} · ${done}`;
};

/**
 * « 5 séances en contiennent » : le nombre réel de séances qui portent des
 * données de santé, au singulier à un, et rien à zéro.
 */
export const containedLine = (count: number): string =>
  count === 0
    ? ''
    : count === 1
      ? '1 séance en contient.'
      : `${count} séances en contiennent.`;

/**
 * Ce qu'une suppression efface, ligne à ligne, avec les vrais nombres.
 *
 * Les deux rôles d'un compte y sont : supprimer le compte les supprime
 * tous les deux, quel que soit l'espace d'où on le demande.
 */
export const deleteConsequences = (
  summary: Pick<AccountSummary, 'asClient' | 'asCoach'>
): string[] => {
  const lines: string[] = [];
  const { asClient, asCoach } = summary;
  if (asClient) {
    const n = asClient.completedCount;
    lines.push(
      n > 0
        ? `tes ${plural(n, 'séance')} faite${n > 1 ? 's' : ''} et tes charges`
        : 'ton programme'
    );
    const names = asClient.coaches
      .map((coach) => coach.firstName.trim())
      .filter(Boolean);
    if (names.length > 0)
      lines.push(`ton rattachement à ${names.join(' et ')}`);
    lines.push('tes données de santé');
  }
  if (asCoach) {
    lines.push('tes exercices et tes modèles');
    const n = asCoach.clientCount;
    if (n === 1)
      lines.push('le lien avec ton client, à qui ses séances restent');
    else if (n > 1)
      lines.push(`le lien avec tes ${n} clients, à qui leurs séances restent`);
  }
  return lines;
};
