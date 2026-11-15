import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { HStack, Text, VStack } from '@chakra-ui/react';
import { useCountdown } from '../../useCountdown';
import { playCue } from '../../sound';
import { useScenePaused } from '../../guided/PauseContext';
import { Ring } from './Ring';

interface RestHeroProps {
  /** Les secondes de repos prescrites. */
  duration: number;
  /** Les secondes ajoutées par « + 15 s », au total. */
  bonus: number;
  /** Ce qui vient après : « Goblet Squat · série 4 sur 4 ». */
  nextTitle: string;
  /** Sa dose, et sa charge quand il y en a une : « 10 reps à 26 kg ». */
  nextDetail: string;
  /** Le sélecteur de charge de la série qui vient, quand elle en porte un. */
  children?: ReactNode;
  onDone: () => void;
}

/**
 * Le repos entre deux séries, à la place de la série en cours.
 *
 * Il ne prend pas tout l'écran. Retour du terrain, quand il le faisait :
 * « pas agréable de se retrouver d'un coup avec un REPOS en pleine page ».
 * La liste du bloc reste dessous, et l'on y relit ce qui vient. Mais il
 * n'est plus une bande de 56 px glissée dans la liste : on doit pouvoir lire
 * de loin combien de secondes il reste.
 *
 * Il porte la charge de la série qui vient. Un repos est le moment où l'on
 * charge sa barre : c'est là qu'on règle le poids, pas en reprenant.
 *
 * Le bouton principal ne coche plus rien pendant ce temps : on cochait la
 * série suivante par erreur, en reprenant son souffle.
 */
export const RestHero = ({
  duration,
  bonus,
  nextTitle,
  nextDetail,
  children,
  onDone,
}: RestHeroProps) => {
  const frozen = useScenePaused();
  const { remaining, extend } = useCountdown(duration, {
    frozen,
    // Le bip long part avec la fin, pas dans un effet : la fin du repos
    // démonte cette carte dans le même rendu.
    onComplete: () => {
      playCue('go');
      onDone();
    },
  });

  // « + 15 s » : on rallonge de ce qui a été ajouté depuis le dernier rendu.
  const granted = useRef(0);
  useEffect(() => {
    const more = bonus - granted.current;
    if (more > 0) extend(more);
    granted.current = bonus;
  }, [bonus, extend]);

  useEffect(() => {
    if (!frozen && remaining > 0 && remaining <= 3) {
      navigator.vibrate?.(150);
      playCue('tick');
    }
  }, [remaining, frozen]);

  const total = duration + bonus;

  return (
    <VStack
      role="timer"
      aria-label={`Repos — ${remaining} secondes restantes`}
      align="stretch"
      gap={3}
      bg="session.restBg"
      borderRadius="card"
      p={4}
      data-rest
    >
      <Text
        fontSize="17px"
        fontWeight="800"
        letterSpacing="0.24em"
        lineHeight="1"
        color="session.rest.fg"
      >
        REPOS
      </Text>
      {/* L'anneau à gauche, ce qui vient à droite : empilés, ils poussaient
          la liste du bloc hors de l'écran, et c'est elle qu'on relit en
          soufflant. */}
      <HStack gap={4} align="center">
        <Ring
          part={total > 0 ? remaining / total : 0}
          size={140}
          color="var(--chakra-colors-session-rest-fg)"
        >
          <Text
            fontFamily="heading"
            fontSize="56px"
            fontWeight="800"
            fontStretch="76%"
            lineHeight="0.9"
            fontVariantNumeric="tabular-nums"
          >
            {remaining}
          </Text>
          <Text fontSize="13px" color="fg.muted" fontWeight="600">
            secondes
          </Text>
        </Ring>
        {nextTitle && (
          <VStack align="stretch" gap={1} flex={1} minW={0}>
            <Text
              fontSize="11px"
              fontWeight="800"
              letterSpacing="0.14em"
              color="session.rest.fg"
            >
              ENSUITE
            </Text>
            <Text fontSize="18px" fontWeight="bold" lineHeight="1.2">
              {nextTitle}
            </Text>
            {nextDetail && (
              <Text fontSize="15px" color="session.rest.fg">
                {nextDetail}
              </Text>
            )}
          </VStack>
        )}
      </HStack>
      {children}
    </VStack>
  );
};
