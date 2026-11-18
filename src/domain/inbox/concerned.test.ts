/**
 * L'exercice qu'« Ajuster » met en vue : celui que le client cite, sinon
 * celui dont la charge a baissé, sinon aucun.
 */
import { describe, expect, it } from 'vitest';
import type { CompletedSession, InboxItem } from '@/shared/types';
import {
  makeBlockSnapshot,
  makeCompleted,
  makeExerciseSnapshot,
} from '@/domain/fixtures';
import { citesExercise, concernedExercise } from './concerned';

const lifted = (id: string, name: string, weight?: number) =>
  makeExerciseSnapshot({
    exercise: { _id: id, name },
    performed:
      weight === undefined ? undefined : { sets: [{ weight, reps: 10 }] },
  });
const session = (
  exercises: ReturnType<typeof lifted>[],
  fields: Partial<CompletedSession> = {}
): Partial<CompletedSession> => ({
  blocks: [makeBlockSnapshot({ exercises })],
  ...fields,
});
const item = (
  completed: Partial<CompletedSession>,
  previous?: Partial<CompletedSession>
): InboxItem => ({
  client: { _id: 'client-sarah', firstName: 'Sarah', lastName: 'Martin' },
  completed: makeCompleted(completed),
  previous: previous ? makeCompleted(previous) : undefined,
});

describe('le mot du client cite-t-il un exercice ?', () => {
  // Un client écrit « les swings », pas « Kettlebell Swing ».
  it('par mot, au pluriel comme au singulier', () => {
    expect(
      citesExercise(
        'Épaule un peu sensible sur les swings.',
        'Kettlebell Swing'
      )
    ).toBe(true);
  });

  it('sans accents ni capitales', () => {
    expect(citesExercise('les fentes marchees, dur', 'Fentes marchées')).toBe(
      true
    );
  });

  // « row » se lirait dans n'importe quelle phrase.
  it('les mots de moins de quatre lettres ne comptent pas', () => {
    expect(citesExercise('Je n’ai pas ramé, row raté', 'Row (rameur)')).toBe(
      false
    );
  });

  it('un mot qui n’est pas dans le nom ne cite rien', () => {
    expect(citesExercise('Dur sur la fin.', 'Goblet Squat')).toBe(false);
  });
});

describe('l’exercice concerné', () => {
  const swing = lifted('swing', 'Kettlebell Swing', 20);
  const goblet = lifted('goblet', 'Goblet Squat', 24);

  it('celui que le client cite', () => {
    expect(
      concernedExercise(
        item(
          session([goblet, swing], {
            clientNotes: 'Épaule un peu sensible sur les swings.',
          })
        )
      )
    ).toBe('swing');
  });

  // Ce que la carte montre déjà en flèche descendante.
  it('sinon, le premier dont la charge a baissé', () => {
    expect(
      concernedExercise(
        item(
          session([swing, goblet]),
          session([
            lifted('swing', 'Kettlebell Swing', 20),
            lifted('goblet', 'Goblet Squat', 26),
          ])
        )
      )
    ).toBe('goblet');
  });

  // Le mot passe devant la charge : c'est de lui que le client parle.
  it('le mot passe devant une charge en baisse', () => {
    expect(
      concernedExercise(
        item(
          session([goblet, swing], { clientNotes: 'Les swings piquent.' }),
          session([lifted('goblet', 'Goblet Squat', 26), swing])
        )
      )
    ).toBe('swing');
  });

  // Plutôt que de désigner un exercice au hasard.
  it('ni mot qui cite, ni charge en baisse : aucun', () => {
    expect(
      concernedExercise(
        item(
          session([swing, goblet], { clientNotes: 'Dur sur la fin.' }),
          session([swing, goblet])
        )
      )
    ).toBeUndefined();
  });

  it('une charge qui monte ne désigne rien', () => {
    expect(
      concernedExercise(
        item(session([lifted('goblet', 'Goblet Squat', 28)]), session([goblet]))
      )
    ).toBeUndefined();
  });
});
