import type { CompletedSession, Session } from '@/shared/types';
import { citesExercise } from '@/domain/inbox/concerned';
import { formatWeight, heaviest } from './load';
import { formatPerformed } from './performedFormat';
import { countWord } from './pulse';

/**
 * Ce que le client a fait d'un exercice, écrit sous sa ligne dans
 * l'atelier : « 20 → 24 → 26 kg », « Fait à 20 kg, trois fois de suite »,
 * et son mot quand il en parle.
 *
 * Le coach lisait la prescription — « 12 reps » — et devait ouvrir la
 * colonne des ressentis, passage par passage, pour savoir ce qu'il en était
 * advenu. La maquette met la réponse sous la question, exercice par
 * exercice.
 */

/** Le ton d'une trace : ce qui monte, ce qui inquiète, ou le simple
 * constat. */
export type TraceTone = 'up' | 'warn' | 'plain';

export interface ExerciseTrace {
  /** Les charges des derniers passages, du plus ancien au plus récent. */
  loads: number[];
  line: string;
  /** Ce que la ligne ouverte ajoute : « Elle monte seule : + 6 kg en trois
   * passages. » */
  insight?: string;
  /** Le mot du client qui cite l'exercice, tel qu'il l'a écrit. */
  quote?: string;
  tone: TraceTone;
}

/** Les trois derniers passages : « trois fois de suite », trois barres. Au
 * delà, la ligne ne tiendrait plus sous le nom de l'exercice. */
const WINDOW = 3;

/** L'adresse d'une ligne dans la séance ouverte : son bloc, son rang. */
export const traceKey = (blockId: string, index: number) =>
  `${blockId}:${index}`;

type Passage = CompletedSession;
type Entry = Passage['blocks'][number]['exercises'][number];

const byOrder = (a: { order: number }, b: { order: number }) =>
  a.order - b.order;

/** Les exercices d'un passage, dans l'ordre où il les a faits. */
const entriesOf = (passage: Passage): Entry[] =>
  [...passage.blocks]
    .sort(byOrder)
    .flatMap((block) => [...block.exercises].sort(byOrder));

const idOf = (entry: Entry): string | undefined =>
  typeof entry.exercise?._id === 'string' ? entry.exercise._id : undefined;

/**
 * La trace d'une ligne, à partir de ce que chaque passage en a gardé.
 *
 * Exportée pour les tests : la page lit `exerciseTraces`.
 */
export const traceOf = (
  name: string,
  entries: { passage: Passage; entry?: Entry }[]
): ExerciseTrace | undefined => {
  const recent = entries.slice(-WINDOW);
  const loads = recent
    .map(({ entry }) => heaviest(entry?.performed?.sets))
    .filter((w): w is number => w !== undefined);

  // Le dernier mot qui cite l'exercice, sur les passages qu'on montre : un
  // mot plus ancien parlerait d'une charge qu'on ne voit plus.
  const citing = [...recent]
    .reverse()
    .find(({ passage }) =>
      citesExercise(passage.clientNotes ?? '', name)
    )?.passage;
  const quote = citing?.clientNotes?.trim();
  // Un mot dit dans la douleur ou dans l'effort de trop inquiète ; les
  // autres se lisent sans couleur.
  const worrying =
    !!citing &&
    ((citing.feedback?.tags ?? []).includes('pain') ||
      (citing.feedback?.effort ?? 0) >= 4);

  let line: string | undefined;
  let insight: string | undefined;
  let tone: TraceTone = 'plain';
  const kg = (w: number) => `${formatWeight(w)} kg`;

  if (loads.length >= 2) {
    const first = loads[0];
    const last = loads[loads.length - 1];
    const before = loads[loads.length - 2];
    if (loads.every((w) => w === first)) {
      line = `Fait à ${kg(first)}, ${countWord(loads.length)} fois de suite.`;
    } else {
      line = `${loads.map(formatWeight).join(' → ')} kg`;
      if (last < before) {
        tone = 'warn';
        insight = `En baisse : − ${kg(before - last)} depuis le passage d’avant.`;
      } else if (loads.every((w, i) => i === 0 || w >= loads[i - 1])) {
        tone = 'up';
        insight = `Elle monte seule : + ${kg(last - first)} en ${countWord(loads.length)} passages.`;
      }
    }
  } else if (loads.length === 1) {
    line = `Fait à ${kg(loads[0])} la dernière fois.`;
  } else {
    // Sans charge — un mouvement au poids du corps, une durée : ce qui a
    // été noté la dernière fois, tel quel.
    const done = [...recent]
      .reverse()
      .map(({ entry }) => formatPerformed(entry?.performed))
      .find(Boolean);
    if (done) line = `${done} la dernière fois.`;
  }

  if (!line && !quote) return undefined;
  return {
    loads,
    line: line ?? '',
    insight,
    quote,
    tone: worrying ? 'warn' : tone,
  };
};

/**
 * La trace de chaque ligne de la séance ouverte, indexée par `traceKey`.
 *
 * Une ligne retrouve son exercice dans chaque passage par l'identifiant du
 * mouvement, et non par sa place : le coach réordonne, et la place d'hier
 * n'est plus celle d'aujourd'hui. Un mouvement qui revient deux fois dans
 * la séance — un swing à l'échauffement et un autre dans l'EMOM — se lit
 * par son rang d'apparition : le premier swing d'aujourd'hui répond au
 * premier swing de chaque passage.
 */
export const exerciseTraces = (
  session: Session,
  history: readonly CompletedSession[]
): Map<string, ExerciseTrace> => {
  const passages = history
    .filter((c) => c.originalSessionId === session._id)
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));
  const traces = new Map<string, ExerciseTrace>();
  if (passages.length === 0) return traces;

  const seen = new Map<string, number>();
  for (const block of session.blocks)
    block.exercises.forEach((line, index) => {
      const id = line.exercise._id;
      const occurrence = seen.get(id) ?? 0;
      seen.set(id, occurrence + 1);
      const trace = traceOf(
        line.exercise.name,
        passages.map((passage) => ({
          passage,
          entry: entriesOf(passage).filter((e) => idOf(e) === id)[occurrence],
        }))
      );
      if (trace) traces.set(traceKey(block._id, index), trace);
    });
  return traces;
};
