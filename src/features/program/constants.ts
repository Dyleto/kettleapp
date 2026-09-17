import { BlockType, SessionBlock } from '@/types';
import { formatDuration } from '@/utils/duration';

export const BLOCK_TYPE_CONFIG: Record<BlockType, { label: string }> = {
  warmup: { label: 'Échauffement' },
  emom: { label: 'EMOM' },
  every: { label: 'Every' },
  amrap: { label: 'AMRAP' },
  timecap: { label: 'TimeCap' },
  chipper: { label: 'Chipper' },
  classic: { label: 'Classique' },
  tabata: { label: 'Tabata' },
  onoff: { label: 'On / Off' },
  pyramid: { label: 'Pyramide' },
  ladder: { label: 'Échelle' },
};

export const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  warmup: 'Échauffement libre',
  classic: 'Séries & reps classiques',
  emom: 'Exos toutes les minutes',
  every: 'Circuit toutes les X min',
  amrap: 'Max de tours en temps limité',
  timecap: 'Terminer avant la limite',
  chipper: 'Liste à faire en 1 passe',
  tabata: 'Travail / Repos en alternance',
  onoff: 'Xon / Xoff × N tours',
  pyramid: 'Reps qui montent et descendent',
  ladder: 'Reps qui augmentent ou diminuent',
};

export const getBlockDescription = (type: BlockType): string =>
  BLOCK_DESCRIPTIONS[type] ?? '';

export type BlockFamily = 'warmup' | 'series' | 'timed' | 'progressive';

export const BLOCK_FAMILIES: {
  key: BlockFamily;
  label: string;
  types: BlockType[];
}[] = [
  { key: 'warmup', label: 'Échauffement', types: ['warmup'] },
  { key: 'series', label: 'Séries', types: ['classic', 'chipper'] },
  {
    key: 'timed',
    label: 'Chronométré',
    types: ['emom', 'every', 'amrap', 'timecap', 'tabata', 'onoff'],
  },
  { key: 'progressive', label: 'Progressif', types: ['pyramid', 'ladder'] },
];

/**
 * Les formats proposés d'emblée, avant que le coach ait posé un exercice.
 *
 * Onze types d'un coup, c'est un catalogue à lire là où il faut un choix à
 * faire. Quatre suffisent à couvrir l'essentiel d'une programmation : un
 * échauffement, des séries, un format à la minute, un format à durée fixe.
 *
 * Cette sélection est une hypothèse, pas une mesure. Elle sera remplacée par
 * ce que les données diront des types réellement utilisés — c'est le seul
 * argument qui vaudra. En attendant, replier les sept autres coûte un clic à
 * qui les cherche, là où les afficher coûte une lecture à tout le monde.
 */
export const BLOCK_TYPES_COURANTS: BlockType[] = [
  'warmup',
  'classic',
  'emom',
  'amrap',
];

/**
 * Blocs où un exercice peut porter un nombre de séries — et donc un repos
 * entre elles.
 *
 * L'échauffement en fait partie : « 3 × 10 rotations d'épaules » est un
 * échauffement parfaitement ordinaire, et le coach ne pouvait écrire que
 * « 10 ». Il n'y a pas de série par défaut pour autant : sans nombre écrit,
 * un exercice d'échauffement se fait une fois, comme aujourd'hui.
 */
export const blockSupportsSets = (type: BlockType): boolean =>
  type === 'classic' || type === 'warmup';

// Blocs où le timing est entièrement défini par le schéma du bloc (aucune métrique par exercice)
export const blockDefinesOwnMetrics = (type: BlockType): boolean =>
  ['pyramid', 'ladder'].includes(type);

// Blocs où seul un nombre de reps cible par exercice a du sens (pas de durée ni mesure)
export const blockSupportsRepsOnly = (type: BlockType): boolean =>
  ['tabata', 'onoff'].includes(type);

export const getBlockLabel = (type: BlockType): string =>
  BLOCK_TYPE_CONFIG[type]?.label ?? type;

export type BlockAccent = 'work' | 'rest' | 'neutral';

// Le repos y est une donnée nommée du schéma (Tabata, On/Off) : accent repos.
// L'échauffement n'est ni l'effort principal ni du repos : neutre. Tout le
// reste est de l'effort continu ou enchaîné, où un repos éventuel n'est
// qu'un détail de réglage, pas ce que le bloc représente.
/**
 * La couleur d'une famille de bloc, à une seule adresse.
 *
 * Elle vivait en trois exemplaires — la fiche, le rail du coach, le choix du
 * type — et les trois avaient déjà divergé : le neutre valait `whiteAlpha.300`
 * chez deux, `fg.muted` chez le troisième. Ce n'était pas trois réglages à
 * réaccorder, c'était trois sources à réduire à une.
 */
export const BLOCK_ACCENT_COLOR: Record<BlockAccent, string> = {
  work: 'block.work',
  rest: 'block.rest',
  neutral: 'block.neutral',
};

export const getBlockAccent = (type: BlockType): BlockAccent => {
  if (blockSupportsRepsOnly(type)) return 'rest';
  if (type === 'warmup') return 'neutral';
  return 'work';
};

/**
 * Le nom libre d'un bloc, une fois retiré ce que l'étiquette dit déjà.
 *
 * Nommer son bloc d'après son type est le réflexe naturel du coach : il tape
 * « AMRAP 12 » dans un bloc AMRAP de douze minutes, et le client lit
 * « AMRAP AMRAP 12 12 min ». C'est à l'affichage d'absorber la redite, pas au
 * coach de deviner qu'il ne doit pas la produire.
 *
 * Quand le nom commence par le type, il ne reste rien à dire : la durée est
 * déjà dans les réglages, et le type dans l'étiquette. La comparaison ignore
 * la casse — « amrap 12 » est le même réflexe.
 */
export const getBlockFreeName = (block: SessionBlock): string | undefined => {
  const nom = block.label?.trim();
  if (!nom) return undefined;
  const type = getBlockLabel(block.type);
  return nom.toLowerCase().startsWith(type.toLowerCase()) ? undefined : nom;
};

/**
 * Blocs dont les exercices se numérotent — « 1) 2) 3) ».
 *
 * Dans un bloc à la minute, le numéro n'est pas décoratif : c'est la minute
 * où l'exercice tombe. « Every » suit exactement la même rotation avec un
 * autre intervalle, et ne numérotait pas — d'où le retour « il n'a pas le
 * petit 1) 2) » sur les E2MOM.
 */
export const blockIndexPrefix = (type: BlockType): boolean =>
  ['emom', 'every'].includes(type);

/**
 * Le réglage d'un bloc, en une ligne — dans l'écriture du produit.
 *
 * Cette seule fonction en comptait cinq : « 12 min », « 12min », « 20s »,
 * « / 10s », « 90s repos ». C'est le gros du constat B14, et c'est aussi ce
 * qui mettait deux conventions sur un même écran : la fiche du client tirait
 * son résumé d'ici, l'atelier du coach le composait autrement.
 */
export const getBlockConfigSummary = (block: SessionBlock): string => {
  const minutes = (m?: number) => (m ? formatDuration(m * 60) : '');
  const secondes = (sec?: number) =>
    sec === undefined ? '' : formatDuration(sec);

  switch (block.type) {
    case 'emom': {
      // Un EMOM est à la minute par définition : on ne le dit que quand ce
      // n'en est pas un — « 12 tours, toutes les 2 min », le E2MOM.
      const tours = block.rounds ? `${block.rounds}\u00A0tours` : '';
      const intervalle = (block.intervalMinutes ?? 1) > 1
        ? `toutes les ${minutes(block.intervalMinutes)}`
        : '';
      return [tours, intervalle].filter(Boolean).join(' · ');
    }
    case 'amrap':
      return minutes(block.durationMinutes);
    case 'timecap':
    case 'chipper':
      return block.durationMinutes
        ? `${minutes(block.durationMinutes)} max`
        : '';
    case 'every':
      return [minutes(block.intervalMinutes), block.rounds && `× ${block.rounds}`]
        .filter(Boolean)
        .join(' ');
    case 'tabata':
    case 'onoff':
      return [
        block.rounds && `${block.rounds} ×`,
        secondes(block.workDuration),
        block.restDuration !== undefined && `/ ${secondes(block.restDuration)}`,
      ]
        .filter(Boolean)
        .join(' ');
    case 'pyramid':
    case 'ladder': {
      const scheme = block.repsScheme?.join('-') ?? '';
      const repos = block.restBetweenRounds
        ? `${secondes(block.restBetweenRounds)} repos`
        : '';
      return [scheme, repos].filter(Boolean).join(' · ');
    }
    default:
      return '';
  }
};

