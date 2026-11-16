import type { WeekSummary } from './sending';

/**
 * L'enchaînement de fin d'une séance, de « Séance terminée » à la semaine.
 *
 * Il vivait dans l'écran de la fiche : six états d'un même `useState`, et
 * chaque bouton choisissait le suivant à la main — « Compléter mes charges »
 * menait à la saisie, qui revenait à la fête, sauf quand on y était arrivé
 * par « Je l'ai déjà faite », où elle menait au ressenti, et où revenir
 * refermait tout. Deux chemins dans les mêmes écrans, et rien pour les
 * relire ensemble.
 *
 *   idle      — la fiche, rien ne se demande ;
 *   celebrate — « Séance terminée », après une séance guidée ;
 *   loads     — compléter ses charges depuis la fête, qui y revient ;
 *   record    — noter ses charges d'une séance déclarée faite ;
 *   review    — le ressenti, qui part au serveur ;
 *   week      — la semaine qui avance, une fois l'envoi parti.
 */
export type EndStage =
  'idle' | 'celebrate' | 'loads' | 'record' | 'review' | 'week';

export interface EndFlowState {
  stage: EndStage;
  /** La date choisie par « Je l'ai déjà faite », pour le ressenti. */
  declaredDate?: string;
  /** Le dernier envoi du ressenti n'est pas parti. */
  sendFailed: boolean;
  /** La semaine telle que l'envoi l'a laissée. */
  week: WeekSummary | null;
}

export type EndFlowAction =
  /** La séance guidée rend la main. */
  | { type: 'guidedFinished'; hasProgress: boolean; recordedCount: number }
  /** « Je l'ai déjà faite », à cette date (absente : aujourd'hui). */
  | { type: 'declared'; date?: string }
  | { type: 'continue' }
  | { type: 'completeLoads' }
  | { type: 'loadsDone' }
  | { type: 'loadsBack' }
  | { type: 'sending' }
  | { type: 'sendFailed' }
  | { type: 'sent'; week: WeekSummary }
  | { type: 'closeFeeling' }
  | { type: 'reset' };

export const initialEndFlow: EndFlowState = {
  stage: 'idle',
  sendFailed: false,
  week: null,
};

/** La transition d'une action de la fin. Pure, testée sans écran. */
export const endFlowReducer = (
  state: EndFlowState,
  action: EndFlowAction
): EndFlowState => {
  switch (action.type) {
    case 'guidedFinished':
      // L'écran de fin d'abord : la séance vient d'être menée, elle a de
      // quoi être fêtée. La question des charges ne se pose plus — elles se
      // notent en route, et le reste est un lien. Sans rien de gardé sur
      // l'appareil, il n'y a rien à fêter : le ressenti si des charges sont
      // notées, sinon leur saisie.
      //
      // La date d'une déclaration abandonnée ne survit pas : une séance
      // qu'on vient de mener se fait aujourd'hui. Elle survivait, et le
      // ressenti proposait « hier » pour une séance finie à l'instant.
      return {
        ...state,
        declaredDate: undefined,
        stage: action.hasProgress
          ? 'celebrate'
          : action.recordedCount > 0
            ? 'review'
            : 'record',
      };

    case 'declared':
      // Déclarée faite sans le mode guidé : pas d'écran de fête, les charges
      // d'abord, puis le ressenti.
      return { ...state, declaredDate: action.date, stage: 'record' };

    case 'continue':
      return state.stage === 'celebrate'
        ? { ...state, stage: 'review' }
        : state;

    case 'completeLoads':
      return state.stage === 'celebrate' ? { ...state, stage: 'loads' } : state;

    case 'loadsDone':
      if (state.stage === 'loads') return { ...state, stage: 'celebrate' };
      if (state.stage === 'record') return { ...state, stage: 'review' };
      return state;

    case 'loadsBack':
      if (state.stage === 'loads') return { ...state, stage: 'celebrate' };
      if (state.stage === 'record') return { ...state, stage: 'idle' };
      return state;

    case 'sending':
      return { ...state, sendFailed: false };

    case 'sendFailed':
      // L'écran du ressenti reste : c'est lui qui dit que l'envoi n'est pas
      // parti, et qui le refait d'une touche.
      return { ...state, sendFailed: true };

    case 'sent':
      return { ...state, sendFailed: false, week: action.week, stage: 'week' };

    case 'closeFeeling':
      return { ...state, sendFailed: false, stage: 'idle' };

    case 'reset':
      // Une autre séance ouverte depuis le programme : rien de la fin de la
      // précédente ne la suit.
      return initialEndFlow;
  }
};
