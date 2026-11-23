/**
 * Déplacer sans glisser, et le dire.
 *
 * Les séances du rail et de la bande, les blocs d'une séance, se
 * réordonnent au doigt ou à la souris. Ce module dit l'ordre d'après un
 * cran — « Monter », « Descendre » dans leur menu, pour qui ne glisse pas —
 * et ce qu'un lecteur d'écran entend pendant un glisser.
 *
 * Les phrases n'accordent rien : « la séance 2 saisie », « le bloc saisi »
 * auraient demandé de savoir ce qu'on déplace jusque dans la grammaire. La
 * position se dit, elle, sans genre.
 */

/**
 * L'ordre après avoir déplacé `id` d'un cran, vers le haut (−1) ou le bas.
 * `null` quand il ne peut pas aller plus loin, ou qu'il n'est pas là : le
 * menu n'a rien à proposer, et l'appelant n'enregistre rien.
 */
export const moveBy = (
  ids: readonly string[],
  id: string,
  delta: -1 | 1
): string[] | null => {
  const from = ids.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= ids.length) return null;
  const next = [...ids];
  next.splice(from, 1);
  next.splice(to, 0, id);
  return next;
};

/**
 * La consigne qu'un lecteur d'écran lit sur ce qui se déplace.
 *
 * Celle de la bibliothèque, en anglais, promettait Espace et les flèches à
 * un clavier qu'aucun capteur n'écoutait. Un capteur clavier aurait tenu la
 * promesse, mais pris la place d'Entrée et d'Espace sur une ligne du rail,
 * qui est d'abord un bouton : elle ouvre sa séance. La voie du clavier est
 * donc le menu, et la consigne la dit.
 */
export const MOVE_INSTRUCTIONS = {
  session:
    'Pour déplacer cette séance sans la glisser : « Monter » ou « Descendre », dans son menu.',
  block:
    'Pour déplacer ce bloc sans le glisser : « Monter » ou « Descendre », dans son menu.',
} as const;

/** Le moment d'un glisser qu'on annonce. */
export type DragMoment = 'start' | 'over' | 'end' | 'cancel';

/**
 * Ce qu'un lecteur d'écran entend, au moment `moment` d'un glisser de
 * `name`, parti de la position `from` et arrivé à `at`, sur `total`.
 *
 * Posé là où il était, ou rendu : « rien n'a bougé » — c'est le doute
 * qu'on a quand on ne voit pas la liste.
 */
export const dragAnnouncement = (
  moment: DragMoment,
  name: string,
  from: number,
  at: number,
  total: number
): string => {
  const position = `position ${at} sur ${total}`;
  switch (moment) {
    case 'start':
      return `${name} : en mouvement, ${position}.`;
    case 'over':
      return `${name} : ${position}.`;
    case 'end':
      return from === at
        ? `${name} : rien n’a bougé, toujours en ${position}.`
        : `${name} : désormais en ${position}.`;
    case 'cancel':
      return `${name} : rien n’a bougé, toujours en position ${from} sur ${total}.`;
  }
};
