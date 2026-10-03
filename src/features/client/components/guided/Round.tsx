import { BlockExercise } from '@/shared/types';
import { roundDose, type GuidedStep } from '../../guidedSteps';
import { formatLastPerformance, LastPerformance } from '../../lastPerformance';
import { Box, HStack, VStack, Text } from '@chakra-ui/react';
import { hitArea } from '@/shared/components/hitArea';
import { useState } from 'react';
import { LuInfo } from 'react-icons/lu';
import { PAYSAGE } from './media';
import { Timer } from './Timer';

/**
 * Un tour, avec son horloge.
 *
 * Trois choses que le déroulé page à page ne savait pas dire, et qui sont
 * tout ce dont on a besoin au milieu d'un EMOM :
 *
 *   — à quel tour on en est (dix écrans identiques ne le disaient pas),
 *   — ce qu'il reste de la minute (l'horloge manquait au seul format qu'elle
 *     définit),
 *   — ce qu'il reste à faire dans ce tour (on ne voyait qu'un mouvement).
 *
 * Tabata et On-Off imposent en plus leur repos : l'horloge enchaîne alors
 * travail et repos d'elle-même. Sur un EMOM, le repos est ce qu'il reste de
 * l'intervalle — il n'a pas de page, parce qu'il n'a pas de durée propre.
 */
export const Round = ({
  step,
  onDone,
  lastPerformance,
  onOuvrirDetail,
  armed,
  onArm,
}: {
  step: Extract<GuidedStep, { type: 'round' }>;
  /** Le tour est fini : on passe au suivant. */
  onDone: () => void;
  lastPerformance?: Map<string, LastPerformance>;
  onOuvrirDetail: (ex: BlockExercise) => void;
  /**
   * Si l'horloge de ce bloc a déjà été lancée.
   *
   * Le premier départ est une décision, l'enchaînement est le format.
   * Demander une touche à chaque tour détruirait un EMOM — « every minute on
   * the minute » veut dire que les minutes se suivent, pas qu'on les relance.
   * La touche est donc demandée une fois par bloc, et les tours se déroulent
   * ensuite comme écrit.
   */
  armed: boolean;
  onArm: () => void;
}) => {
  const [phase, setPhase] = useState<'travail' | 'rest'>('travail');
  const resting = phase === 'rest';
  const duration = resting ? step.restSeconds : step.workSeconds;

  // Travail fait, on passe au repos s'il en est imposé un — sinon le tour
  // est fini et le suivant démarre, ce qui est la définition du format.
  const finDePhase = () => {
    if (!resting && step.restSeconds) {
      setPhase('rest');
      return;
    }
    navigator.vibrate?.([120, 80, 120]);
    onDone();
  };

  return (
    <VStack
      flex={1}
      align="stretch"
      gap={4}
      px={5}
      py={2}
      overflowY="auto"
      // Posé à plat, ces gouttières valent 16 px chacune sur 360 px de
      // hauteur. Les cibles gardent leurs 44 px — on ne rétrécit pas ce qu'on
      // touche les mains moites — c'est le vide qui cède.
      css={{ [PAYSAGE]: { gap: '10px', paddingTop: 0, paddingBottom: 0 } }}
    >
      {duration ? (
        <Timer
          // La clé porte la phase autant que le tour : sans cela, le
          // décompte du repos reprendrait là où celui du travail s'est
          // arrêté.
          key={`${step.round}-${phase}`}
          duration={duration}
          autoStart={armed}
          onStart={onArm}
          couleur={resting ? 'session.rest' : 'fg'}
          onComplete={finDePhase}
          title={
            <VStack align="start" gap={0.5}>
              <Text
                fontSize="xs"
                letterSpacing="2px"
                textTransform="uppercase"
                fontWeight="800"
                color={resting ? 'session.rest' : 'session.work'}
              >
                {resting ? 'Repos' : step.blockLabel}
              </Text>
              {/* Le repère qui manquait. Sans lui, les dix tours d'un EMOM
              s'affichaient à l'identique et rien ne disait lequel on était en
              train de vivre. */}
              <Text fontSize="lg" fontWeight="800" lineHeight="1.1">
                Tour {step.round}&nbsp;/&nbsp;{step.rounds}
              </Text>
            </VStack>
          }
        />
      ) : (
        <VStack align="start" gap={0.5}>
          <Text
            fontSize="xs"
            letterSpacing="2px"
            textTransform="uppercase"
            fontWeight="800"
            color={resting ? 'session.rest' : 'session.work'}
          >
            {resting ? 'Repos' : step.blockLabel}
          </Text>
          {/* Le repère qui manquait. Sans lui, les dix tours d'un EMOM
              s'affichaient à l'identique et rien ne disait lequel on était en
              train de vivre. */}
          <Text fontSize="lg" fontWeight="800" lineHeight="1.1">
            Tour {step.round}&nbsp;/&nbsp;{step.rounds}
          </Text>
        </VStack>
      )}

      {/* Ce qu'il y a à faire dans ce tour — tout, pas un mouvement à la
          fois. Pendant un repos imposé la liste reste : c'est elle qu'on
          relit pour se préparer au tour suivant. */}
      <VStack align="stretch" gap={0} opacity={resting ? 0.6 : 1}>
        {step.exercises.map((ex, i) => {
          const aDuDetail =
            !!ex.note?.trim() ||
            !!ex.exercise.description?.trim() ||
            !!ex.exercise.videoUrl?.trim();
          const last = formatLastPerformance(
            lastPerformance?.get(ex.exercise._id)
          );
          return (
            <Box
              key={`${ex.order}-${ex.exercise._id}`}
              borderTopWidth={i === 0 ? 0 : '1px'}
              borderColor="whiteAlpha.100"
              py={3}
            >
              <HStack justify="space-between" align="baseline" gap={3}>
                {aDuDetail ? (
                  <Box
                    as="button"
                    textAlign="left"
                    minW={0}
                    aria-label={`Voir la consigne — ${ex.exercise.name}`}
                    onClick={() => onOuvrirDetail(ex)}
                    css={hitArea(44)}
                  >
                    <HStack gap={1.5} align="center">
                      <Text fontSize="lg" fontWeight="bold">
                        {ex.exercise.name}
                      </Text>
                      <Box color="app.primary" flexShrink={0}>
                        <LuInfo size={15} />
                      </Box>
                    </HStack>
                  </Box>
                ) : (
                  <Text fontSize="lg" fontWeight="bold" minW={0}>
                    {ex.exercise.name}
                  </Text>
                )}
                <Text
                  fontSize="xl"
                  fontWeight="800"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {roundDose(step.block, ex) || '—'}
                </Text>
              </HStack>
              {last && (
                <Text fontSize="xs" color="fg.muted">
                  la dernière fois&nbsp;: {last}
                </Text>
              )}
            </Box>
          );
        })}
      </VStack>

      {/* Au dernier tour seulement : ailleurs le compteur dit déjà qu'il
          reste des tours, et annoncer « ensuite : tour 4 » n'apprend rien. */}
      {step.nextLabel && (
        <Text fontSize="xs" color="fg.muted" textAlign="center">
          dernier tour — ensuite : {step.nextLabel}
        </Text>
      )}
    </VStack>
  );
};
