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

/**
 * Les formats que la palette propose, dans l'ordre de la maquette : ce
 * qu'on fait d'abord dans une séance, puis le reste.
 *
 * « Every » n'y est pas : c'est un EMOM sous un autre nom, maintenant que
 * l'EMOM porte son intervalle. Deux noms pour un format, c'est ce qui a égaré
 * un coach qui cherchait un E2MOM. Le type reste connu — les blocs déjà créés
 * s'affichent — mais on n'en crée plus.
 */
export const PALETTE: BlockType[] = [
  'warmup',
  'classic',
  'emom',
  'amrap',
  'tabata',
  'onoff',
  'ladder',
  'chipper',
  'timecap',
];

/**
 * Ce que chaque format fait, en une phrase : lue au moment de choisir,
 * jamais après.
 *
 * L'échelle dit les deux sens : « Pyramide » a disparu, et un coach qui
 * cherche une pyramide doit la reconnaître sous ce nom.
 */
export const FORMAT_LINE: Record<BlockType, string> = {
  warmup: 'Une liste à dérouler, sans chrono.',
  classic: 'Des séries, un repos entre chacune.',
  emom: 'Chaque minute, on repart.',
  every: 'Chaque minute, on repart.',
  amrap: 'Le plus de tours avant la fin du temps.',
  tabata: 'À fond, souffler, recommencer.',
  onoff: 'Travail et repos de durées choisies.',
  ladder: 'Les répétitions montent, descendent, ou les deux.',
  chipper: 'Une longue liste, une fois, dans l’ordre.',
  timecap: 'Tout finir avant la limite.',
};

/** Un trait du dessin d'un format : un effort, un repos, ou un temps qui
 * ne compte pas — l'échauffement, la marge d'une limite. */
export interface Stroke {
  kind: 'work' | 'rest' | 'idle';
  /** La hauteur, en part du plus haut (0 à 1). */
  height: number;
  /** La largeur, en part des autres traits. */
  weight: number;
}

const stroke = (kind: Stroke['kind'], height: number, weight = 1): Stroke => ({
  kind,
  height,
  weight,
});
const times = (n: number, ...strokes: Stroke[]): Stroke[] =>
  Array.from({ length: n }, () => strokes).flat();

/**
 * Le dessin d'un format, dans la palette : son allure, pas un bloc.
 *
 * `blockDrawing` dessine un bloc écrit — ses tours, ses paliers. Un format
 * qu'on choisit n'en a pas encore : un bloc neuf n'a ni exercice ni série, et
 * son dessin aurait été un trait seul. La palette montre donc l'idée de
 * chaque format, telle que la maquette la dessine : l'EMOM qui repart à
 * chaque minute, l'AMRAP qui s'essouffle avant la fin, l'échelle qui monte
 * et redescend, la limite d'un TimeCap.
 */
export const formatSketch = (type: BlockType): Stroke[] => {
  switch (type) {
    case 'warmup':
      return times(4, stroke('idle', 0.6));
    case 'classic':
      return [
        ...times(3, stroke('work', 1), stroke('idle', 0.26)),
        stroke('work', 1),
      ];
    case 'emom':
    case 'every':
      return times(4, stroke('work', 1, 0.7), stroke('idle', 0.26, 0.3));
    case 'amrap':
      return [
        ...times(5, stroke('work', 1)),
        stroke('work', 0.7),
        stroke('work', 0.45),
        stroke('idle', 1),
      ];
    case 'tabata':
      return times(4, stroke('work', 1, 2), stroke('rest', 0.55));
    case 'onoff':
      return times(3, stroke('work', 1, 3), stroke('rest', 0.55, 2));
    case 'ladder':
      return [0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25].map((h) =>
        stroke('work', h)
      );
    case 'chipper':
      return [1, 0.72, 0.58, 0.42].map((h) => stroke('work', h));
    case 'timecap':
      return [...times(4, stroke('work', 1)), stroke('idle', 1, 0.2)];
  }
};
