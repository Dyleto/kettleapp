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

export const blockIndexPrefix = (type: BlockType): boolean =>
  ['emom'].includes(type);

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
    case 'emom':
      return block.rounds ? `${block.rounds}\u00A0tours` : '';
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

