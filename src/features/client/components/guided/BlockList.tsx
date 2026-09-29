import { BlockExercise, PerformedValues, SessionBlock } from '@/shared/types';
import { type GuidedSet } from '../../guidedSteps';
import { blockDefinesOwnMetrics } from '@/features/program/constants';
import {
  formatLastPerformance,
  LastPerformance,
  performedKey,
} from '../../lastPerformance';
import { Box, HStack, Input, VStack, Text } from '@chakra-ui/react';
import { hitArea } from '@/shared/components/hitArea';
import { formatDuration } from '@/shared/utils/duration';
import { Fragment, useState } from 'react';
import { LuCheck, LuInfo, LuTimer } from 'react-icons/lu';
import { OnDemandTimer } from './Timer';
import { RestStrip } from './RestStrip';

/**
 * Un bloc qu'on coche, série par série.
 *
 * C'était la moitié cassée du mode guidé : la carte de prescription, avec des
 * champs de saisie collés dessus. Rien ne pouvait être coché, rien n'avançait.
 * Mesuré sur une pyramide de sept paliers : une ligne de 14 px et 511 px de
 * noir. Une feuille de papier faisait mieux — on pouvait y rayer.
 *
 * Une seule série est « en cours ». C'est la seule écrite en grand, et la
 * seule à porter un champ : la hiérarchie vient de l'état, pas d'un choix
 * typographique arbitraire, et la liste redevient lisible parce qu'un
 * formulaire ne la coupe plus à chaque ligne.
 */
export const BlockList = ({
  block,
  sets,
  done,
  current,
  performed,
  onPerformedChange,
  lastPerformance,
  onOuvrirDetail,
  rest,
  onRestDone,
  onUndo,
}: {
  block: SessionBlock;
  sets: GuidedSet[];
  done: Set<string>;
  current: GuidedSet | undefined;
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
  lastPerformance?: Map<string, LastPerformance>;
  onOuvrirDetail: (ex: BlockExercise) => void;
  /** Le repos en cours, et la série qu'il suit. */
  rest: { afterKey: string; duration: number; nextUp: string } | null;
  onRestDone: () => void;
  /** Untick a set: it goes back to being something to do. */
  onUndo: (key: string) => void;
}) => {
  /**
   * La série cochée actuellement rouverte, s'il y en a une.
   *
   * Une à la fois : en rouvrir deux mettrait deux charges éditables à l'écran
   * et ramènerait précisément ce que la réécriture de la liste avait retiré —
   * un formulaire à chaque ligne.
   */
  const [opened, setOpened] = useState<string | null>(null);

  /** Si ce mouvement a quelque chose à montrer au-delà de sa dose. */
  const aDuDetailDe = (e: GuidedSet) =>
    !!e.exercise.note?.trim() ||
    !!e.exercise.exercise.description?.trim() ||
    !!e.exercise.exercise.videoUrl?.trim();
  /**
   * Le rang de la série dans son exercice, quand il y en a plus d'une.
   *
   * Une pyramide ne fait pas des séries : elle monte et redescend des
   * paliers, et c'est le mot que le coach emploie dans l'éditeur.
   */
  const rankOf = (e: GuidedSet) =>
    e.total > 1
      ? `${blockDefinesOwnMetrics(block.type) ? 'palier' : 'série'} ${e.rank} / ${e.total}`
      : '';

  /** Ce qui a été noté sur cette série précise. */
  const valueOfSet = (e: GuidedSet) =>
    performed?.[performedKey(e.blockOrder, e.exerciseOrder)]?.sets?.[
      e.rank - 1
    ];

  const write = (e: GuidedSet, champ: 'weight' | 'reps', brut: string) => {
    if (!onPerformedChange) return;
    const key = performedKey(e.blockOrder, e.exerciseOrder);
    const sets = [...(performed?.[key]?.sets ?? [])];
    while (sets.length < e.rank) sets.push({});
    const count =
      brut.trim() === '' ? undefined : Number(brut.replace(',', '.'));
    sets[e.rank - 1] = {
      ...sets[e.rank - 1],
      [champ]: Number.isFinite(count) ? count : undefined,
    };
    onPerformedChange(key, { sets });
  };

  return (
    <VStack align="stretch" gap={1} flex={1} px={5} py={2} overflowY="auto">
      {sets.map((e) => {
        const fait = done.has(e.key);
        const isCurrent = current?.key === e.key;
        const value = valueOfSet(e);
        const rank = rankOf(e);
        // Le repos appartient à la série qu'il suit, il se dessine donc juste
        // après elle — l'intervalle est là où est l'intervalle.
        const restHere =
          rest && rest.afterKey === e.key ? (
            <RestStrip
              key={`rest-${e.key}`}
              duration={rest.duration}
              nextUp={rest.nextUp}
              onDone={onRestDone}
            />
          ) : null;

        if (isCurrent) {
          const last = formatLastPerformance(
            lastPerformance?.get(e.exercise.exercise._id)
          );
          const aDuDetail =
            !!e.exercise.note?.trim() ||
            !!e.exercise.exercise.description?.trim() ||
            !!e.exercise.exercise.videoUrl?.trim();
          return (
            <Fragment key={e.key}>
              <Box
                bg="surface.card"
                borderWidth="1px"
                borderColor="app.primary"
                borderRadius="xl"
                p={4}
                my={1}
              >
                <VStack align="stretch" gap={3}>
                  <HStack justify="space-between" align="baseline" gap={3}>
                    {aDuDetail ? (
                      <Box
                        as="button"
                        textAlign="left"
                        minW={0}
                        aria-label={`Voir la consigne — ${e.name}`}
                        onClick={() => onOuvrirDetail(e.exercise)}
                        css={hitArea(44)}
                      >
                        <HStack gap={1.5} align="center">
                          <Text fontSize="xl" fontWeight="800">
                            {e.name}
                          </Text>
                          <Box color="app.primary" flexShrink={0}>
                            <LuInfo size={15} />
                          </Box>
                        </HStack>
                      </Box>
                    ) : (
                      <Text fontSize="xl" fontWeight="800" minW={0}>
                        {e.name}
                      </Text>
                    )}
                    <Text
                      fontSize="2xl"
                      fontWeight="800"
                      fontFamily="mono"
                      flexShrink={0}
                    >
                      {e.dose || '\u2014'}
                    </Text>
                  </HStack>

                  {(rank || onPerformedChange) && (
                    <HStack justify="space-between" align="center" gap={3}>
                      <Text fontSize="sm" color="fg.muted">
                        {rank}
                      </Text>
                      {onPerformedChange && (
                        <HStack gap={2}>
                          <Text fontSize="sm" color="fg.muted">
                            Fait à
                          </Text>
                          <Input
                            aria-label={`Poids utilisé, en kilos — ${e.name} ${rank}`}
                            inputMode="decimal"
                            value={value?.weight ?? ''}
                            onChange={(ev) =>
                              write(e, 'weight', ev.target.value)
                            }
                            w="76px"
                            minH="44px"
                            textAlign="center"
                            fontFamily="mono"
                            fontWeight="bold"
                            placeholder="—"
                          />
                          <Text fontSize="sm" color="fg.muted">
                            kg
                          </Text>
                        </HStack>
                      )}
                    </HStack>
                  )}

                  {/* Une série dont la dose est une durée demande à être
                    chronométrée. Le repos automatique couvre le repos, pas le
                    travail : remplacer la carte de prescription par les
                    séries avait retiré en silence le minuteur de « 2 min de
                    corde à sauter ». Proposé, jamais imposé — on le lance en
                    y arrivant. */}
                  {e.exercise.duration ? (
                    <Box ml={-4}>
                      <OnDemandTimer
                        duration={e.exercise.duration}
                        label={formatDuration(e.exercise.duration)}
                        couleur="app.primary"
                      />
                    </Box>
                  ) : null}

                  <HStack justify="space-between" align="center" gap={3}>
                    {last ? (
                      <Text fontSize="xs" color="fg.muted">
                        la dernière fois&nbsp;: {last}
                      </Text>
                    ) : (
                      <Box />
                    )}
                    {/* Ce que « Fait » déclenche : sans cette ligne, le repos
                      plein écran arrive par surprise. */}
                    {e.restAfter && (
                      <HStack gap={1.5} color="session.rest" flexShrink={0}>
                        <LuTimer size={13} />
                        <Text fontSize="xs" fontWeight="bold">
                          puis {formatDuration(e.restAfter)} de repos
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                </VStack>
              </Box>
              {restHere}
            </Fragment>
          );
        }

        // Une série cochée se rouvre : on la relit, on corrige sa charge, on
        // la refait. C'était une ligne morte — et les trois choses qu'on veut
        // réellement en faire n'ont rien à voir avec le curseur, elles se
        // font donc sur place plutôt qu'en le déplaçant.
        if (fait && opened === e.key) {
          return (
            <Fragment key={e.key}>
              <VStack
                align="stretch"
                gap={2.5}
                bg="surface.card"
                borderWidth="1px"
                borderColor="session.rest"
                borderRadius="xl"
                px={4}
                py={3}
                my={1}
              >
                <HStack gap={3}>
                  <Box color="session.rest" flexShrink={0}>
                    <LuCheck size={16} strokeWidth={3} />
                  </Box>
                  <Text fontSize="md" fontWeight="bold" minW={0} lineClamp={1}>
                    {e.name}
                  </Text>
                  {rank && (
                    <Text fontSize="sm" color="fg.muted" flexShrink={0}>
                      · {rank}
                    </Text>
                  )}
                  <Box flex={1} />
                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    fontFamily="mono"
                    flexShrink={0}
                  >
                    {e.dose}
                  </Text>
                </HStack>

                <HStack justify="space-between" align="center" gap={3}>
                  {onPerformedChange ? (
                    <HStack gap={2}>
                      <Text fontSize="sm" color="fg.muted">
                        Fait à
                      </Text>
                      <Input
                        aria-label={`Corriger le poids, en kilos — ${e.name} ${rank}`}
                        inputMode="decimal"
                        value={value?.weight ?? ''}
                        onChange={(ev) => write(e, 'weight', ev.target.value)}
                        w="76px"
                        minH="44px"
                        textAlign="center"
                        fontFamily="mono"
                        fontWeight="bold"
                        placeholder="—"
                      />
                      <Text fontSize="sm" color="fg.muted">
                        kg
                      </Text>
                    </HStack>
                  ) : (
                    <Box />
                  )}
                  {/* Défaire n'est pas corriger : celui qui répare une faute de
                      frappe ne veut pas retrouver la série devant lui, celui
                      qui la refait si. Deux gestes, deux boutons. */}
                  <Box
                    as="button"
                    onClick={() => onUndo(e.key)}
                    color="app.primary"
                    fontSize="sm"
                    fontWeight="bold"
                    flexShrink={0}
                    css={hitArea(44)}
                  >
                    Refaire
                  </Box>
                </HStack>

                <HStack justify="space-between" align="center" gap={3}>
                  {aDuDetailDe(e) ? (
                    <Box
                      as="button"
                      onClick={() => onOuvrirDetail(e.exercise)}
                      color="app.primary"
                      fontSize="sm"
                      css={hitArea(32)}
                    >
                      Revoir le mouvement
                    </Box>
                  ) : (
                    <Box />
                  )}
                  <Box
                    as="button"
                    onClick={() => setOpened(null)}
                    color="fg.muted"
                    fontSize="sm"
                    css={hitArea(32)}
                  >
                    Fermer
                  </Box>
                </HStack>
              </VStack>
              {restHere}
            </Fragment>
          );
        }

        return (
          <Fragment key={e.key}>
            <HStack
              gap={3}
              minH="44px"
              px={4}
              py={2}
              opacity={fait ? 1 : 0.75}
              {...(fait
                ? {
                    as: 'button' as const,
                    w: 'full',
                    textAlign: 'left' as const,
                    'aria-expanded': false,
                    'aria-label': `Rouvrir ${e.name} ${rank}`,
                    onClick: () => setOpened(e.key),
                    _hover: { bg: 'whiteAlpha.50' },
                    borderRadius: 'lg',
                  }
                : {})}
            >
              <Box
                color={fait ? 'session.rest' : 'whiteAlpha.400'}
                flexShrink={0}
              >
                {fait ? (
                  <LuCheck size={16} strokeWidth={3} />
                ) : (
                  <Box
                    w="16px"
                    h="16px"
                    borderRadius="full"
                    borderWidth="1.5px"
                    borderColor="whiteAlpha.400"
                  />
                )}
              </Box>
              {/* The name may be truncated, the rank may not: the rank is what
                says where you are, and "Fentes marchées · série…" teaches nothing. */}
              <Text fontSize="sm" color="fg.muted" minW={0} lineClamp={1}>
                {e.name}
              </Text>
              {rank && (
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  opacity={0.7}
                  flexShrink={0}
                >
                  · {rank}
                </Text>
              )}
              <Box flex={1} />
              {/* Sur ce qui reste, le repos donne le rythme du bloc : on voit
                que les squats sont à 1 min et les fentes à 45 s sans avoir à
                y arriver. Sur ce qui est fait, il n'apprend plus rien — la
                charge prend sa place. */}
              {fait ? (
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  fontFamily="mono"
                  flexShrink={0}
                >
                  {value?.weight != null ? `${value.weight} kg` : e.dose}
                </Text>
              ) : (
                <>
                  {e.restAfter && (
                    <Text
                      fontSize="2xs"
                      color="fg.muted"
                      opacity={0.7}
                      flexShrink={0}
                    >
                      {formatDuration(e.restAfter)}
                    </Text>
                  )}
                  <Text
                    fontSize="sm"
                    color="fg.muted"
                    fontFamily="mono"
                    flexShrink={0}
                    minW="62px"
                    textAlign="right"
                  >
                    {e.dose}
                  </Text>
                </>
              )}
            </HStack>
            {restHere}
          </Fragment>
        );
      })}
    </VStack>
  );
};
