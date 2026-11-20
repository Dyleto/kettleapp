import type {
  BlockSnapshot,
  BlockType,
  CompletedSession,
  Session,
} from '@/shared/types';
import { getBlockLabel } from '@/domain/session/blocks';
import { formatCountdown } from '@/shared/utils/duration';

/**
 * Ce qu'un bloc qui se compte a donné : les tours d'un AMRAP, le palier
 * d'une échelle, les mouvements d'un chipper — et en combien de temps.
 *
 * « À lire » l'écrivait déjà en pastille, dans une fonction à lui. L'atelier
 * l'écrit sous le bloc, et deux écritures du même score finiraient par ne
 * plus dire la même chose : les deux lisent ici.
 */

/**
 * Le score d'un bloc dans un passage, en pastille : « AMRAP 5 tours »,
 * « palier 5 sur 7 », « Chipper 4 sur 5 ». Le nom du format y est, parce
 * que la pastille se lit seule, à côté des charges.
 */
export const scoreChip = (block: BlockSnapshot): string | null => {
  const name = getBlockLabel(block.type as BlockType);
  if (block.performedRungs !== undefined && block.repsScheme?.length)
    return `palier ${block.performedRungs} sur ${block.repsScheme.length}`;
  if (block.performedMovements !== undefined)
    return `${name} ${block.performedMovements} sur ${block.exercises.length}`;
  if (block.performedRounds !== undefined)
    return `${name} ${block.performedRounds} tour${block.performedRounds > 1 ? 's' : ''}`;
  return null;
};

/** Le score d'un bloc dans l'atelier, et son ton : ce qui monte, ce qui
 * baisse, ou le constat. */
export interface BlockScore {
  line: string;
  tone: 'up' | 'warn' | 'plain';
}

/** Les trois derniers passages, comme sous un exercice. */
const WINDOW = 3;

const toneOf = (before: number | undefined, now: number): BlockScore['tone'] =>
  before === undefined || before === now
    ? 'plain'
    : now > before
      ? 'up'
      : 'warn';

const inTime = (seconds: number | undefined) =>
  seconds ? ` en ${formatCountdown(seconds)}` : '';

/**
 * Ce qu'un bloc a donné ce jour-là, seul : « 5 tours », « Palier 2 sur 3 »,
 * « Échelle bouclée en 9:00 », « Fini en 9:40 ». `null` pour un bloc qui
 * ne se compte pas.
 *
 * Pour le détail d'une séance faite : la ligne y porte déjà le nom du bloc,
 * et un seul passage n'a pas de suite à lire. Les mêmes mots que sous un
 * bloc dans l'atelier, pour qu'un score se dise de la même façon partout.
 */
export const blockResult = (block: BlockSnapshot): string | null => {
  const total = block.repsScheme?.length ?? 0;
  if (block.performedRungs !== undefined && total > 0)
    return block.performedRungs >= total
      ? `Échelle bouclée${inTime(block.performedSeconds)}`
      : `Palier ${block.performedRungs} sur ${total}`;
  if (block.performedMovements !== undefined) {
    const done = block.performedMovements;
    const count = block.exercises.length;
    return done >= count
      ? `Fini${inTime(block.performedSeconds)}`
      : `${done} mouvement${done > 1 ? 's' : ''} sur ${count}`;
  }
  if (block.performedRounds !== undefined)
    return `${block.performedRounds} tour${block.performedRounds > 1 ? 's' : ''}`;
  return null;
};

/**
 * La ligne sous un bloc, à partir de ses instantanés, du plus ancien au
 * plus récent.
 *
 * Les tours se lisent en suite — « Tours bouclés : 4, 5, 5 » — parce que
 * c'est leur suite qui dit si l'AMRAP tient. Un palier ou une liste se
 * lisent au dernier passage, avec son temps : « Palier 5 sur 7 en 12:00 »,
 * et le précédent pour comparer. Sans le nom du format : l'en-tête du bloc
 * le donne juste au-dessus.
 */
export const scoreLine = (
  snapshots: readonly BlockSnapshot[]
): BlockScore | undefined => {
  const recent = snapshots.slice(-WINDOW);

  const rounds = recent
    .map((b) => b.performedRounds)
    .filter((r): r is number => r !== undefined);
  if (rounds.length > 0) {
    const asked = recent[recent.length - 1].rounds;
    const amrap = recent[recent.length - 1].type === 'amrap';
    const last = rounds[rounds.length - 1];
    return {
      line: `${amrap ? 'Tours bouclés' : 'Tours faits'} : ${rounds.join(', ')}${
        !amrap && asked ? ` sur ${asked}` : ''
      }.`,
      tone: toneOf(rounds[rounds.length - 2], last),
    };
  }

  const ladders = recent.filter(
    (b) => b.performedRungs !== undefined && b.repsScheme?.length
  );
  if (ladders.length > 0) {
    const now = ladders[ladders.length - 1];
    const before = ladders[ladders.length - 2];
    const total = now.repsScheme!.length;
    const rungs = now.performedRungs!;
    return {
      line: `${
        rungs >= total ? 'Échelle bouclée' : `Palier ${rungs} sur ${total}`
      }${inTime(now.performedSeconds)}.${
        before ? ` Avant : ${before.performedRungs} sur ${total}.` : ''
      }`,
      tone: toneOf(before?.performedRungs, rungs),
    };
  }

  const lists = recent.filter((b) => b.performedMovements !== undefined);
  if (lists.length > 0) {
    const now = lists[lists.length - 1];
    const before = lists[lists.length - 2];
    const total = now.exercises.length;
    const done = now.performedMovements!;
    const finished = done >= total;
    // Deux listes finies se comparent au temps : plus vite, c'est mieux.
    // Sinon, au nombre de mouvements faits.
    const tone =
      finished &&
      before?.performedMovements !== undefined &&
      before.performedMovements >= total &&
      before.performedSeconds &&
      now.performedSeconds
        ? toneOf(-before.performedSeconds, -now.performedSeconds)
        : toneOf(before?.performedMovements, done);
    return {
      line: `${
        finished
          ? 'Fini'
          : `${done} mouvement${done > 1 ? 's' : ''} sur ${total}`
      }${inTime(now.performedSeconds)}.`,
      tone,
    };
  }
  return undefined;
};

/**
 * Le score de chaque bloc de la séance ouverte, indexé par son
 * identifiant.
 *
 * Un instantané n'a pas l'identifiant du bloc : on le retrouve par son
 * format et son rang parmi les blocs de ce format — le premier AMRAP
 * d'aujourd'hui répond au premier AMRAP de chaque passage. Par sa place, un
 * bloc ajouté au-dessus aurait décalé tous les autres.
 */
export const blockScores = (
  session: Session,
  history: readonly CompletedSession[]
): Map<string, BlockScore> => {
  const passages = history
    .filter((c) => c.originalSessionId === session._id)
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));
  const scores = new Map<string, BlockScore>();
  if (passages.length === 0) return scores;

  const seen = new Map<string, number>();
  for (const block of session.blocks) {
    const occurrence = seen.get(block.type) ?? 0;
    seen.set(block.type, occurrence + 1);
    const snapshots = passages.flatMap((passage) => {
      const same = [...passage.blocks]
        .sort((a, b) => a.order - b.order)
        .filter((b) => b.type === block.type);
      return same[occurrence] ? [same[occurrence]] : [];
    });
    const score = scoreLine(snapshots);
    if (score) scores.set(block._id, score);
  }
  return scores;
};
