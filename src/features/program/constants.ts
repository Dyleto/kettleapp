import { BlockExercise, BlockType, SessionBlock } from '@/shared/types';
import { formatDuration } from '@/shared/utils/duration';

/**
 * Le nom affiché de chaque format.
 *
 * En français quand le français existe — « Échauffement », « Pyramide » — et
 * dans la langue du métier quand c'est ainsi qu'on le dit : personne n'écrit
 * « autant de tours que possible » à la place d'AMRAP.
 */
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

/**
 * Ce que chaque format fait, en une ligne.
 *
 * Lu au moment de choisir, jamais après : un coach qui connaît ses formats ne
 * relit pas « Max de tours en temps limité » à chaque bloc. D'où la longueur
 * — une ligne qui tient dans une tuile, pas une définition.
 */
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

/** Rend la chaîne vide plutôt qu'`undefined` : les appelants la placent
 * directement dans du JSX, où `undefined` ne se distingue pas d'un oubli. */
export const getBlockDescription = (type: BlockType): string =>
  BLOCK_DESCRIPTIONS[type] ?? '';

/** Les quatre familles sous lesquelles les onze formats se rangent : ce
 * qu'on cherche d'abord, c'est un genre d'effort, pas un sigle. */
export type BlockFamily = 'warmup' | 'series' | 'timed' | 'progressive';

/**
 * Les formats groupés par famille, pour le dépliement du sélecteur.
 *
 * L'ordre suit celui d'une séance : on s'échauffe, on fait des séries, on
 * chronomètre, on progresse. Un ordre alphabétique aurait mis l'AMRAP avant
 * l'échauffement.
 */
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
    // « Every » n'apparaît plus ici : c'est un EMOM sous un autre nom,
    // maintenant que l'EMOM porte son intervalle. Deux noms pour un format,
    // c'est ce qui a égaré un coach qui cherchait un E2MOM. Le type reste
    // connu — les blocs déjà créés s'affichent — mais on n'en crée plus.
    types: ['emom', 'amrap', 'timecap', 'tabata', 'onoff'],
  },
  { key: 'progressive', label: 'Progressif', types: ['pyramid', 'ladder'] },
];

/**
 * Les formats proposés d'emblée, avant que le coach n'ait placé un exercice.
 *
 * Onze types d'un coup, c'est un catalogue à lire là où il faut un choix.
 * Quatre couvrent l'essentiel de la programmation : un échauffement, des
 * séries, un format à la minute, un format de durée fixe.
 *
 * Cette sélection est une hypothèse, pas une mesure. Elle sera remplacée par
 * ce que la donnée dira des types réellement utilisés — c'est le seul
 * argument qui comptera. D'ici là, replier les sept autres coûte un clic à
 * qui les cherche, là où les montrer coûte une lecture à tout le monde.
 */
export const BLOCK_TYPES_COURANTS: BlockType[] = [
  'warmup',
  'classic',
  'emom',
  'amrap',
];

/**
 * Les blocs où un exercice peut porter un nombre de séries — et donc un repos
 * entre elles.
 *
 * L'échauffement en fait partie : « 3 × 10 rotations d'épaules » est un
 * échauffement parfaitement ordinaire, et le coach ne pouvait écrire que
 * « 10 ». Il n'y a pas pour autant de nombre de séries par défaut : sans
 * nombre écrit, un exercice d'échauffement se fait une fois, comme
 * aujourd'hui.
 */
export const blockSupportsSets = (type: BlockType): boolean =>
  type === 'classic' || type === 'warmup';

/**
 * Le repos qu'un exercice prescrit entre ses séries, en secondes.
 *
 * Trois conditions, et les trois étaient nécessaires : un bloc qui compte des
 * séries, plus d'une série, et un repos écrit. La règle vivait dans la ligne
 * de lecture ; le mode guidé en a besoin aussi, pour proposer le décompte au
 * moment où l'on souffle.
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
 * Ce que chaque passage d'un exercice demande — une entrée par passage.
 *
 * Retour du terrain : « pour noter les charges, dommage de ne pas pouvoir le
 * faire sur chaque série — sur la pyramide, je ne peux pas noter chaque
 * charge que j'ai faite. » C'était juste, et la cause tenait en une ligne :
 * le nombre de lignes de saisie se lisait dans `exercise.sets`, un champ que
 * seuls les blocs classiques et d'échauffement portent. Une pyramide tient
 * ses paliers sur le bloc, pas sur l'exercice — elle n'avait donc qu'une
 * ligne, quand elle en demande autant qu'elle a de paliers.
 *
 * Les blocs à tours (EMOM, Tabata, On/Off) restent sur une ligne : leurs
 * tours sont identiques, et dix lignes vides pour un EMOM de dix tours
 * seraient un formulaire, pas une aide. Ce qui distingue la pyramide, c'est
 * que la prescription change d'un passage à l'autre — d'où l'étiquette, qui
 * dit quel palier on remplit.
 *
 * Une entrée vide veut dire « ce passage n'a pas de nom » : on le numérote.
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

// Les blocs dont le minutage est entièrement défini par le schéma du bloc :
// l'exercice n'y porte aucune mesure propre.
export const blockDefinesOwnMetrics = (type: BlockType): boolean =>
  ['pyramid', 'ladder'].includes(type);

/**
 * Les blocs dont la durée fait partie du format — et qui méritent donc une
 * horloge en mode guidé.
 *
 * `durationMinutes` traîne sur des blocs qui n'en font rien : l'échauffement
 * du jeu de test en porte huit, que ni ses réglages ni son résumé ne lisent.
 * Se fier au seul champ faisait apparaître un décompte sur un échauffement,
 * qui n'a pas de fin à décompter. C'est le type qui décide, pas la présence
 * du champ.
 */
export const blockHasClock = (type: BlockType): boolean =>
  ['amrap', 'timecap', 'chipper'].includes(type);

// Les blocs où seul un nombre de répétitions visé a du sens : leur travail
// se mesure en temps, réglé sur le bloc, et l'exercice ne dit que combien de
// fois le refaire dans l'intervalle.
export const blockSupportsRepsOnly = (type: BlockType): boolean =>
  ['tabata', 'onoff'].includes(type);

/** Se rabat sur le type brut plutôt que sur une chaîne vide : un bloc d'un
 * type inconnu — un bilan ancien — reste identifiable. */
export const getBlockLabel = (type: BlockType): string =>
  BLOCK_TYPE_CONFIG[type]?.label ?? type;

/** Trois accents, pas onze : une famille, pas une gravité. Voir le
 * commentaire de `BLOCK_ACCENT_COLOR`. */
export type BlockAccent = 'work' | 'rest' | 'neutral';

// Le repos y est une part nommée du schéma (Tabata, On/Off) : accent de
// repos. Un échauffement n'est ni le travail principal ni du repos : neutre.
// Tout le reste est un travail continu ou enchaîné, où un repos éventuel est
// un détail de réglage, pas ce que le bloc représente.
/**
 * La couleur d'une famille de blocs, à une seule adresse.
 *
 * Elle vivait en trois copies — la carte, le rail du coach, le sélecteur de
 * type — et les trois avaient déjà divergé : le neutre valait
 * `whiteAlpha.300` dans deux, `fg.muted` dans la troisième. Ce n'étaient pas
 * trois réglages à réaccorder, c'étaient trois sources à réduire à une.
 */
export const BLOCK_ACCENT_COLOR: Record<BlockAccent, string> = {
  work: 'block.work',
  rest: 'block.rest',
  neutral: 'block.neutral',
};

/** L'accent se déduit du type, il ne s'enregistre pas : le coach choisit un
 * format, jamais une couleur. */
export const getBlockAccent = (type: BlockType): BlockAccent => {
  if (blockSupportsRepsOnly(type)) return 'rest';
  if (type === 'warmup') return 'neutral';
  return 'work';
};

/**
 * Le nom libre d'un bloc, une fois retiré ce que l'étiquette dit déjà.
 *
 * Nommer un bloc d'après son type est le réflexe naturel du coach : il tape
 * « AMRAP 12 » dans un bloc AMRAP de douze minutes, et le client lit « AMRAP
 * AMRAP 12 12 min ». C'est à l'affichage d'absorber la répétition, pas au
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
 * Les blocs dont les exercices sont numérotés — « 1) 2) 3) ».
 *
 * Dans un bloc à la minute, le numéro n'est pas décoratif : c'est la minute
 * où l'exercice tombe. « Every » suit exactement la même rotation avec un
 * intervalle différent, et n'était pas numéroté — d'où le retour « il n'a pas
 * les petits 1) 2) » sur les E2MOM.
 */
export const blockIndexPrefix = (type: BlockType): boolean =>
  ['emom', 'every'].includes(type);

/**
 * Les réglages d'un bloc, en une ligne — dans l'orthographe du produit.
 *
 * Cette seule fonction en portait cinq : « 12 min », « 12min », « 20s »,
 * « / 10s », « 90s repos ». C'est l'essentiel du constat B14, et c'est aussi
 * ce qui mettait deux conventions sur le même écran : la carte du client
 * tirait son résumé d'ici, l'éditeur du coach le composait autrement.
 */
export const getBlockConfigSummary = (block: SessionBlock): string => {
  const minutes = (m?: number) => (m ? formatDuration(m * 60) : '');
  const secondes = (sec?: number) =>
    sec === undefined ? '' : formatDuration(sec);

  switch (block.type) {
    // Un bloc « Every » d'avant la fusion se lit exactement comme un EMOM :
    // mêmes champs, même rotation, même mode guidé.
    case 'every':
    case 'emom': {
      // Un EMOM est à la minute par définition : on ne le dit que lorsqu'il
      // ne l'est pas — « 12 tours, toutes les 2 min », l'E2MOM.
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
