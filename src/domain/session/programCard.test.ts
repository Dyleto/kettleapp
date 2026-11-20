/**
 * Une carte du programme : sa ligne de repères et sa pastille d'état.
 */
import { describe, expect, it } from 'vitest';
import {
  freeze,
  makeBlock,
  makeBlockExercise,
  makeCompleted,
  makeExercise,
  makeSession,
} from '@/domain/fixtures';
import { programLine, sessionState } from './programCard';

const SWING = makeExercise({ _id: 'ex-swing', name: 'Kettlebell Swing' });
const GOBLET = makeExercise();

const session = makeSession({
  blocks: [
    makeBlock({
      _id: 'b1',
      exercises: [
        makeBlockExercise({ exercise: SWING, sets: 3, reps: 15 }),
        makeBlockExercise({ exercise: GOBLET, order: 2, sets: 3, reps: 12 }),
      ],
    }),
    makeBlock({
      _id: 'b2',
      order: 2,
      exercises: [makeBlockExercise({ exercise: SWING, sets: 2, reps: 20 })],
    }),
  ],
});
const doneOn = (iso: string, blocks = session.blocks.map(freeze)) =>
  makeCompleted({
    _id: `bilan-${iso}`,
    originalSessionId: session._id,
    completedAt: iso,
    blocks,
  });
// Un samedi en fin de matinée, à Paris.
const SATURDAY = new Date('2026-08-29T10:00:00+02:00');

describe('la ligne de repères', () => {
  it('la durée, les blocs, et les mouvements distincts', () => {
    expect(programLine(session)).toMatch(/^≈ \d+ min · 2 blocs · 2 exercices$/);
  });

  // Le swing est repris dans le second bloc : un exercice, pas deux.
  it('un mouvement repris ne compte qu’une fois', () => {
    expect(programLine(session)).toContain('2 exercices');
  });

  it('au singulier à un', () => {
    const one = makeSession({
      blocks: [makeBlock({ exercises: [makeBlockExercise({ reps: 10 })] })],
    });
    expect(programLine(one)).toMatch(/· 1 bloc · 1 exercice$/);
  });

  it('une séance vide n’a pas de ligne', () => {
    expect(programLine(makeSession({ blocks: [] }))).toBeNull();
  });
});

describe('l’état', () => {
  it('jamais faite', () => {
    expect(sessionState(session, [], { now: SATURDAY })).toEqual({
      tone: 'never',
      label: 'Jamais faite',
    });
  });

  it('faite cette semaine : le jour', () => {
    const history = [doneOn('2026-08-23T18:00:00+02:00')];
    expect(sessionState(session, history, { now: SATURDAY })).toEqual({
      tone: 'done',
      label: 'Faite dimanche',
    });
  });

  it('faite hier, faite aujourd’hui', () => {
    expect(
      sessionState(session, [doneOn('2026-08-28T18:00:00+02:00')], {
        now: SATURDAY,
      }).label
    ).toBe('Faite hier');
    expect(
      sessionState(session, [doneOn('2026-08-29T08:00:00+02:00')], {
        now: SATURDAY,
      }).label
    ).toBe('Faite aujourd’hui');
  });

  // Au-delà d'une semaine, « faite mardi » ne dirait plus lequel.
  it('faite il y a plus d’une semaine : la date', () => {
    const history = [doneOn('2026-08-11T18:00:00+02:00')];
    expect(sessionState(session, history, { now: SATURDAY }).label).toBe(
      'Faite le 11 août'
    );
  });

  // L'identifiant survit à une réécriture : « faite » mentirait.
  it('faite, puis réécrite par le coach : modifiée depuis', () => {
    const before = [
      freeze(
        makeBlock({
          exercises: [makeBlockExercise({ exercise: SWING, reps: 10 })],
        })
      ),
    ];
    const history = [doneOn('2026-08-23T18:00:00+02:00', before)];
    expect(sessionState(session, history, { now: SATURDAY })).toEqual({
      tone: 'changed',
      label: 'Modifiée depuis ta dernière fois',
    });
  });

  it('conseillée ce jour-ci : à faire aujourd’hui', () => {
    const saturday = { ...session, suggestedDays: [5] };
    const history = [doneOn('2026-08-23T18:00:00+02:00')];
    expect(sessionState(saturday, history, { now: SATURDAY })).toEqual({
      tone: 'today',
      label: 'À faire aujourd’hui',
    });
  });

  // Le conseil du jour est tenu : on le dit.
  it('conseillée et faite aujourd’hui : faite', () => {
    const saturday = { ...session, suggestedDays: [5] };
    const history = [doneOn('2026-08-29T08:00:00+02:00')];
    expect(sessionState(saturday, history, { now: SATURDAY }).label).toBe(
      'Faite aujourd’hui'
    );
  });

  it('commencée sur ce téléphone : en cours, devant tout le reste', () => {
    const saturday = { ...session, suggestedDays: [5] };
    expect(
      sessionState(saturday, [doneOn('2026-08-29T08:00:00+02:00')], {
        now: SATURDAY,
        local: 'running',
      })
    ).toEqual({ tone: 'local', label: 'En cours' });
  });

  // Les mots de l'accueil, pour la même séance au même moment.
  it('finie sans ressenti, ou ressenti en attente : comme sur l’accueil', () => {
    expect(
      sessionState(session, [], { now: SATURDAY, local: 'finished' }).label
    ).toBe('À valider');
    expect(
      sessionState(session, [], { now: SATURDAY, local: 'pending' }).label
    ).toBe('En attente de réseau');
  });
});
