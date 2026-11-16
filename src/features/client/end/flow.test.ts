/**
 * Les deux chemins de la fin, relus ensemble.
 *
 * Après une séance guidée : la fête, éventuellement la saisie qui y revient,
 * puis le ressenti. Après « Je l'ai déjà faite » : la saisie, qui mène au
 * ressenti, et dont revenir referme tout. Les mêmes écrans, deux suites ;
 * c'est ici qu'elles se lisent côte à côte.
 */
import { describe, expect, it } from 'vitest';
import {
  endFlowReducer,
  initialEndFlow,
  type EndFlowAction,
  type EndFlowState,
} from './flow';
import type { WeekSummary } from './sending';

const run = (state: EndFlowState, ...actions: EndFlowAction[]) =>
  actions.reduce(endFlowReducer, state);

const week: WeekSummary = {
  target: 3,
  before: 1,
  after: 2,
  streak: 0,
  doneDays: new Set([0, 2]),
  plannedDays: new Set([0, 2, 4]),
};

describe('après une séance guidée', () => {
  it('la fête d’abord, quand l’appareil a gardé la séance', () => {
    expect(
      run(initialEndFlow, {
        type: 'guidedFinished',
        hasProgress: true,
        recordedCount: 0,
      }).stage
    ).toBe('celebrate');
  });

  it('« Compléter mes charges » mène à la saisie, qui revient à la fête', () => {
    const celebrating = { ...initialEndFlow, stage: 'celebrate' as const };
    expect(run(celebrating, { type: 'completeLoads' }).stage).toBe('loads');
    expect(
      run(celebrating, { type: 'completeLoads' }, { type: 'loadsDone' }).stage
    ).toBe('celebrate');
    expect(
      run(celebrating, { type: 'completeLoads' }, { type: 'loadsBack' }).stage
    ).toBe('celebrate');
  });

  it('« Continuer » mène au ressenti', () => {
    expect(
      run({ ...initialEndFlow, stage: 'celebrate' }, { type: 'continue' }).stage
    ).toBe('review');
  });

  it('sans rien de gardé, le ressenti si des charges sont notées', () => {
    expect(
      run(initialEndFlow, {
        type: 'guidedFinished',
        hasProgress: false,
        recordedCount: 2,
      }).stage
    ).toBe('review');
  });

  it('et leur saisie sinon', () => {
    expect(
      run(initialEndFlow, {
        type: 'guidedFinished',
        hasProgress: false,
        recordedCount: 0,
      }).stage
    ).toBe('record');
  });

  it('une déclaration abandonnée ne date pas la séance qu’on vient de finir', () => {
    const state = run(
      initialEndFlow,
      { type: 'declared', date: '2026-11-15' },
      { type: 'loadsBack' },
      { type: 'guidedFinished', hasProgress: true, recordedCount: 0 }
    );
    expect(state.declaredDate).toBeUndefined();
  });
});

describe('après « Je l’ai déjà faite »', () => {
  it('la saisie d’abord, à la date choisie', () => {
    const state = run(initialEndFlow, {
      type: 'declared',
      date: '2026-11-15',
    });
    expect(state).toMatchObject({
      stage: 'record',
      declaredDate: '2026-11-15',
    });
  });

  it('puis le ressenti', () => {
    expect(
      run(initialEndFlow, { type: 'declared' }, { type: 'loadsDone' }).stage
    ).toBe('review');
  });

  it('revenir de la saisie referme tout, sans rien envoyer', () => {
    expect(
      run(initialEndFlow, { type: 'declared' }, { type: 'loadsBack' }).stage
    ).toBe('idle');
  });
});

describe('le ressenti', () => {
  const reviewing = { ...initialEndFlow, stage: 'review' as const };

  it('un envoi manqué le dit, et l’écran reste', () => {
    const state = run(reviewing, { type: 'sending' }, { type: 'sendFailed' });
    expect(state).toMatchObject({ stage: 'review', sendFailed: true });
  });

  it('réessayer efface l’échec', () => {
    expect(
      run(reviewing, { type: 'sendFailed' }, { type: 'sending' }).sendFailed
    ).toBe(false);
  });

  it('parti, la semaine qui avance', () => {
    const state = run(reviewing, { type: 'sent', week });
    expect(state).toMatchObject({ stage: 'week', week, sendFailed: false });
  });

  it('le fermer revient à la fiche, échec oublié', () => {
    const state = run(
      reviewing,
      { type: 'sendFailed' },
      { type: 'closeFeeling' }
    );
    expect(state).toMatchObject({ stage: 'idle', sendFailed: false });
  });
});

describe('ce qui ne mène nulle part', () => {
  it('un geste d’un autre écran ne change rien', () => {
    expect(run(initialEndFlow, { type: 'continue' })).toBe(initialEndFlow);
    expect(run(initialEndFlow, { type: 'loadsDone' })).toBe(initialEndFlow);
  });

  it('une autre séance ouverte repart de zéro', () => {
    expect(
      run(
        { ...initialEndFlow, stage: 'review', sendFailed: true },
        {
          type: 'reset',
        }
      )
    ).toEqual(initialEndFlow);
  });
});
