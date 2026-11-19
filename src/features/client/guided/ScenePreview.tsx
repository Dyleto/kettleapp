import { useMemo } from 'react';
import type { Session } from '@/shared/types';
import { buildGuidedSteps } from './steps';
import { blockSegments } from './outline';
import { previewState, stepOf } from './session';
import { GuidedScene } from './GuidedScene';
import { NoSteps } from './scene/NoSteps';

const ignore = () => undefined;

/**
 * La séance guidée telle que le client l'aura devant lui en arrivant sur un
 * bloc : la vraie scène, figée au départ, l'horloge à l'arrêt.
 *
 * C'est la scène même, et non un dessin qui l'imite : l'aperçu du coach
 * suit ainsi tout ce que la séance guidée change, sans qu'on ait à s'en
 * souvenir. Rien n'y répond — aucune action ne part, aucune horloge ne
 * tourne —, et la page qui la porte la rend inerte.
 *
 * Remontée à chaque bloc : une scène garde ce qu'elle a commencé — un
 * lancement, un décompte —, et le bloc suivant ne doit pas en hériter.
 */
export const ScenePreview = ({
  session,
  blockOrder,
}: {
  session: Session;
  blockOrder: number;
}) => {
  const steps = useMemo(() => buildGuidedSteps(session), [session]);
  const segments = useMemo(() => blockSegments(steps), [steps]);
  const state = previewState(steps, blockOrder);
  const step = stepOf(state);
  if (state.phase === 'empty' || !step) return <NoSteps onExit={ignore} />;
  return (
    <GuidedScene
      key={blockOrder}
      session={session}
      state={state}
      act={ignore}
      step={step}
      segments={segments}
      resumedBlock={1}
      onExit={ignore}
    />
  );
};
