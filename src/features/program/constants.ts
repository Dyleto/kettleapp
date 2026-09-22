import { BlockExercise, BlockType, SessionBlock } from '@/types';
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
    // "Every" no longer appears here: it is an EMOM under another name,
    // now that the EMOM carries its interval. Two names for one format is
    // what caught out a coach looking for an E2MOM. The type stays known —
    // blocks already created still display — but no new ones are made.
    types: ['emom', 'amrap', 'timecap', 'tabata', 'onoff'],
  },
  { key: 'progressive', label: 'Progressif', types: ['pyramid', 'ladder'] },
];

/**
 * The formats offered up front, before the coach has placed an exercise.
 *
 * Eleven types at once is a catalogue to read where a choice has to be made.
 * Four cover the essentials of programming: a warm-up, sets, a format on the
 * minute, a format of fixed duration.
 *
 * This selection is a hypothesis, not a measurement. It will be replaced by
 * what the data says about the types actually used — that is the only
 * argument that will count. Until then, folding the other seven away costs
 * one click to whoever looks for them, where showing them costs everyone a
 * read.
 */
export const BLOCK_TYPES_COURANTS: BlockType[] = [
  'warmup',
  'classic',
  'emom',
  'amrap',
];

/**
 * Blocks where an exercise can carry a number of sets — and therefore a rest
 * between them.
 *
 * The warm-up is one of them: "3 × 10 shoulder rotations" is a perfectly
 * ordinary warm-up, and the coach could only write "10". There is no default
 * set count for all that: with no number written, a warm-up exercise happens
 * once, as it does today.
 */
export const blockSupportsSets = (type: BlockType): boolean =>
  type === 'classic' || type === 'warmup';

/**
 * The rest an exercise prescribes between its sets, in seconds.
 *
 * Three conditions, and all three were needed: a block that counts sets, more
 * than one set, and a rest written down. The rule lived in the reading row;
 * guided mode needs it too, to offer the countdown at the moment you catch
 * your breath.
 */
export const restBetweenSetsOf = (
  block: Pick<SessionBlock, 'type'>,
  exercise: Pick<BlockExercise, 'sets' | 'restBetweenSets'>
): number | undefined =>
  blockSupportsSets(block.type) &&
  (exercise.sets ?? 1) > 1 &&
  exercise.restBetweenSets
    ? exercise.restBetweenSets
    : undefined;

/**
 * What each pass of an exercise asks for — one entry per pass.
 *
 * From the field: "for recording loads, a shame you cannot do it on every set
 * — on the pyramid, I cannot record each load I did." That was accurate, and
 * the cause came down to one line: the number of input rows was read from
 * `exercise.sets`, a field only classic and warm-up blocks carry. A pyramid
 * holds its rungs on the block, not on the exercise — so it had a single row,
 * when it asks for as many as it has rungs.
 *
 * Round-based blocks (EMOM, Tabata, On/Off) stay on one row: their rounds are
 * identical, and ten empty rows for a ten-round EMOM would be a form, not
 * help. What sets the pyramid apart is that the prescription changes from
 * pass to pass — hence the label, which says which rung is being filled in.
 *
 * An empty entry means "this pass has no name": we number it.
 */
export const prescribedSetLabels = (
  block: Pick<SessionBlock, 'type' | 'repsScheme'>,
  exercise: Pick<BlockExercise, 'sets'>
): string[] => {
  if (blockDefinesOwnMetrics(block.type) && block.repsScheme?.length)
    return block.repsScheme.map((reps) => `${reps}\u00A0reps`);
  if (blockSupportsSets(block.type))
    return Array.from({ length: Math.max(1, exercise.sets ?? 1) }, () => '');
  return [''];
};

// Blocks whose timing is entirely defined by the block's scheme (no per-exercise metric).
export const blockDefinesOwnMetrics = (type: BlockType): boolean =>
  ['pyramid', 'ladder'].includes(type);

/**
 * Blocks whose duration is part of the format — and which therefore deserve a
 * clock in guided mode.
 *
 * `durationMinutes` lingers on blocks that do nothing with it: the test
 * data's warm-up carries eight, which neither its settings nor its summary
 * read. Trusting the field alone made a countdown appear on a warm-up, which
 * has no end to count down to. The type decides, not the field's presence.
 */
export const blockHasClock = (type: BlockType): boolean =>
  ['amrap', 'timecap', 'chipper'].includes(type);

// Blocks where only a target rep count per exercise makes sense (no duration, no measure).
export const blockSupportsRepsOnly = (type: BlockType): boolean =>
  ['tabata', 'onoff'].includes(type);

export const getBlockLabel = (type: BlockType): string =>
  BLOCK_TYPE_CONFIG[type]?.label ?? type;

export type BlockAccent = 'work' | 'rest' | 'neutral';

// Rest is a named part of the scheme there (Tabata, On/Off): rest accent.
// A warm-up is neither the main work nor rest: neutral. Everything else is
// continuous or chained work, where any rest is a setting detail, not what
// the block represents.
/**
 * A block family's colour, at a single address.
 *
 * It lived in three copies — the card, the coach's rail, the type picker —
 * and all three had already drifted: neutral was `whiteAlpha.300` in two,
 * `fg.muted` in the third. That was not three settings to retune, it was
 * three sources to reduce to one.
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
 * A block's free name, once what the label already says is removed.
 *
 * Naming a block after its type is the coach's natural reflex: they type
 * "AMRAP 12" into a twelve-minute AMRAP block, and the client reads "AMRAP
 * AMRAP 12 12 min". It is for the display to absorb the repetition, not for
 * the coach to guess they must not produce it.
 *
 * When the name starts with the type, there is nothing left to say: the
 * duration is already in the settings, and the type in the label. The
 * comparison ignores case — "amrap 12" is the same reflex.
 */
export const getBlockFreeName = (block: SessionBlock): string | undefined => {
  const nom = block.label?.trim();
  if (!nom) return undefined;
  const type = getBlockLabel(block.type);
  return nom.toLowerCase().startsWith(type.toLowerCase()) ? undefined : nom;
};

/**
 * Blocks whose exercises are numbered — "1) 2) 3)".
 *
 * In a block on the minute, the number is not decorative: it is the minute
 * the exercise falls on. "Every" follows exactly the same rotation with a
 * different interval, and was not numbered — hence the feedback "it does not
 * have the little 1) 2)" on E2MOMs.
 */
export const blockIndexPrefix = (type: BlockType): boolean =>
  ['emom', 'every'].includes(type);

/**
 * A block's settings, in one line — in the product's own spelling.
 *
 * This one function held five of them: "12 min", "12min", "20s", "/ 10s",
 * "90s repos". That is the bulk of finding B14, and it is also what put two
 * conventions on the same screen: the client's card drew its summary from
 * here, the coach's editor composed it another way.
 */
export const getBlockConfigSummary = (block: SessionBlock): string => {
  const minutes = (m?: number) => (m ? formatDuration(m * 60) : '');
  const secondes = (sec?: number) =>
    sec === undefined ? '' : formatDuration(sec);

  switch (block.type) {
    // An "Every" block from before the merge reads exactly like an EMOM:
    // same fields, same rotation, same guided mode.
    case 'every':
    case 'emom': {
      // An EMOM is on the minute by definition: we only say so when it is
      // not — "12 tours, toutes les 2 min", the E2MOM.
      const tours = block.rounds ? `${block.rounds}\u00A0tours` : '';
      const intervalle =
        (block.intervalMinutes ?? 1) > 1
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
