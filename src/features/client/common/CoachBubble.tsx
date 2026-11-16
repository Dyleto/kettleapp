import type { ReactNode } from 'react';
import { Bubble } from '@/kit';
import { useCoachVoice } from '@/features/client/common/coach';

/**
 * Le mot du coach, en bulle, sous son prénom : « Julie te dit : ».
 *
 * La bulle est au kit, qui ne sait pas qui est le coach ; le prénom vient du
 * programme du client. Cette pièce les réunit, pour que les cinq écrans où
 * le coach parle — l'accueil, la fiche, l'ouverture, la consigne d'un
 * exercice, l'objectif d'un AMRAP — le disent de la même façon.
 */
export const CoachBubble = ({
  children,
  ...rest
}: { children: ReactNode } & Omit<
  React.ComponentProps<typeof Bubble>,
  'from' | 'children'
>) => {
  const coach = useCoachVoice();
  return (
    <Bubble from={<>{coach.opening} te dit&nbsp;:</>} {...rest}>
      {children}
    </Bubble>
  );
};
