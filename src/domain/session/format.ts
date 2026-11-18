import type { BlockType, SessionBlock } from '@/shared/types';

/**
 * Les réglages d'un bloc, et ce qu'ils deviennent quand le bloc change de
 * format.
 *
 * Les valeurs par défaut vivaient dans l'éditeur, qui ne s'en servait qu'à
 * la création d'un bloc. « Changer de format » en a besoin aussi, et c'est
 * une décision qui se teste sans écran : quels réglages un bloc garde, et
 * lesquels il perd.
 */

/** Les champs de bloc qui sont des réglages de format. Le nom et la
 * consigne n'en sont pas : ils suivent le bloc quel que soit son format. */
export type BlockSetting =
  | 'rounds'
  | 'intervalMinutes'
  | 'durationMinutes'
  | 'workDuration'
  | 'restDuration'
  | 'repsScheme'
  | 'restBetweenRounds';

const ALL_SETTINGS: BlockSetting[] = [
  'rounds',
  'intervalMinutes',
  'durationMinutes',
  'workDuration',
  'restDuration',
  'repsScheme',
  'restBetweenRounds',
];

/**
 * Ce que chaque format lit.
 *
 * Un échauffement et un bloc classique n'en lisent aucun : leurs réglages
 * sont sur chaque exercice. `durationMinutes` traîne sur l'échauffement du
 * jeu de test sans que rien ne le lise — c'est le format qui décide, pas la
 * présence du champ.
 */
export const FORMAT_SETTINGS: Record<BlockType, BlockSetting[]> = {
  warmup: [],
  classic: [],
  emom: ['rounds', 'intervalMinutes'],
  every: ['rounds', 'intervalMinutes'],
  amrap: ['durationMinutes'],
  chipper: ['durationMinutes'],
  timecap: ['durationMinutes'],
  tabata: ['rounds', 'workDuration', 'restDuration'],
  onoff: ['rounds', 'workDuration', 'restDuration'],
  ladder: ['repsScheme', 'restBetweenRounds', 'durationMinutes'],
};

/**
 * Ce qu'un bloc neuf porte, par format.
 *
 * Un EMOM se règle en tours et en intervalle — jamais en durée totale, que
 * ni ses réglages ni son résumé ne lisent. Un bloc neuf affichait donc
 * « sans limite » alors qu'un défaut venait d'être posé dessus.
 */
export const blockDefaults = (type: BlockType): Partial<SessionBlock> =>
  ({
    warmup: {},
    classic: {},
    chipper: {},
    emom: { rounds: 10, intervalMinutes: 1 },
    amrap: { durationMinutes: 8 },
    timecap: { durationMinutes: 15 },
    every: { intervalMinutes: 3, rounds: 5 },
    tabata: { rounds: 8, workDuration: 20, restDuration: 10 },
    onoff: { rounds: 10, workDuration: 30, restDuration: 30 },
    ladder: { repsScheme: [5, 10, 15, 20], restBetweenRounds: 60 },
  })[type];

/**
 * Le même bloc dans un autre format.
 *
 * Un réglage que le nouveau format lit aussi est gardé : passer d'un Tabata
 * à un On/Off garde les tours et les durées, d'un AMRAP à une échelle la
 * limite de temps. Les autres partent — un EMOM devenu AMRAP n'a rien à
 * faire de ses tours, et les garder les renverrait à l'API sous un format
 * qui ne les lit pas. Ce qui manque reprend la valeur d'un bloc neuf.
 *
 * Les exercices, le nom et la consigne ne bougent pas : c'est le même bloc,
 * qu'on fait autrement.
 */
export const withFormat = (
  block: SessionBlock,
  type: BlockType
): SessionBlock => {
  const reads = FORMAT_SETTINGS[type];
  const defaults = blockDefaults(type);
  const settings = Object.fromEntries(
    ALL_SETTINGS.map((key) => [
      key,
      reads.includes(key) ? (block[key] ?? defaults[key]) : undefined,
    ])
  ) as Pick<SessionBlock, BlockSetting>;
  return { ...block, ...settings, type };
};
