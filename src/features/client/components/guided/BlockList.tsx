import { BlockExercise, PerformedValues, SessionBlock } from '@/shared/types';
import { type GuidedSet } from '../../guidedSteps';
import { blockDefinesOwnMetrics } from '@/features/program/constants';
import { performedKey } from '../../lastPerformance';
import { Box, HStack, Input, VStack, Text } from '@chakra-ui/react';
import { hitArea } from '@/kit';
import { formatDuration } from '@/shared/utils/duration';
import { Fragment, useState } from 'react';
import { useNumberDraft } from '@/shared/hooks/useNumberDraft';
import { LuCheck } from 'react-icons/lu';

/**
 * Un bloc qu'on coche, série par série.
 *
 * C'était la moitié cassée du mode guidé : la carte de prescription, avec des
 * champs de saisie collés dessus. Rien ne pouvait être coché, rien n'avançait.
 * Mesuré sur une pyramide de sept paliers : une ligne de 14 px et 511 px de
 * noir. Une feuille de papier faisait mieux — on pouvait y rayer.
 *
 * Une seule série est « en cours ». Elle s'écrit en grand au-dessus de la
 * liste (`SetHero`), avec sa charge ; ici elle n'est qu'une ligne marquée.
 * La liste reste lisible parce qu'aucun formulaire ne la coupe : seule une
 * série déjà faite, rouverte pour corriger sa charge, porte un champ.
 */
/**
 * Le champ de charge d'une série.
 *
 * Un composant et non un `<Input>` posé dans la boucle : il porte un
 * brouillon de texte, et un hook ne peut pas vivre dans un `map`.
 *
 * Le brouillon est ce qui rend « 22,5 » atteignable. Le champ se réaffichait
 * depuis le nombre enregistré, donc « 22, » redonnait 22 — `Number('22.')`
 * vaut 22 — et la virgule s'effaçait sous les doigts. Retour du terrain :
 * « les ,5 ne marchent pas, il peut pas écrire 22,5 par exemple ». La
 * virgule était bien convertie ici ; c'est l'affichage qui la reprenait.
 */
const WeightField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (next?: number) => void;
}) => {
  // Une charge se compte en demi-kilos : le pas des plus petits disques, et
  // celui des haltères de salle. L'API déclare `weight` en nombre.
  const { text, onText, onLeave } = useNumberDraft({
    value,
    onChange,
    decimals: true,
  });

  return (
    <Input
      aria-label={label}
      inputMode="decimal"
      value={text}
      onChange={(ev) => onText(ev.target.value)}
      onBlur={onLeave}
      w="76px"
      minH="44px"
      textAlign="center"
      fontVariantNumeric="tabular-nums"
      fontWeight="bold"
      placeholder="—"
    />
  );
};

export const BlockList = ({
  block,
  sets,
  done,
  current,
  performed,
  onPerformedChange,
  onOpenDetail,
  onUndo,
}: {
  block: SessionBlock;
  sets: GuidedSet[];
  done: Set<string>;
  current: GuidedSet | undefined;
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
  onOpenDetail: (ex: BlockExercise) => void;
  /** Décocher une série : elle redevient quelque chose à faire. */
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
  const hasDetailOf = (e: GuidedSet) =>
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

  // Reçoit un nombre et non du texte : l'analyse appartient au champ, qui
  // est le seul à savoir ce qu'il accepte. Elle vivait ici en troisième
  // copie, et les trois avaient divergé.
  //
  // La liste n'écrit que la charge. Le paramètre `field` qui vivait ici
  // acceptait aussi `'reps'`, qu'aucun appel ne lui a jamais passé.
  const writeWeight = (e: GuidedSet, next: number | undefined) => {
    if (!onPerformedChange) return;
    const key = performedKey(e.blockOrder, e.exerciseOrder);
    const sets = [...(performed?.[key]?.sets ?? [])];
    while (sets.length < e.rank) sets.push({});
    sets[e.rank - 1] = { ...sets[e.rank - 1], weight: next };
    onPerformedChange(key, { sets });
  };

  return (
    <VStack align="stretch" gap={1}>
      {sets.map((e) => {
        const isDone = done.has(e.key);
        const isCurrent = current?.key === e.key;
        const value = valueOfSet(e);
        const rank = rankOf(e);
        // Le repos appartient à la série qu'il suit, il se dessine donc juste
        // après elle — l'intervalle est là où est l'intervalle.

        // La série en cours est écrite en grand au-dessus de la liste. Ici
        // elle n'est qu'un repère : on voit où l'on est dans le bloc, et
        // ce qui suit.
        if (isCurrent) {
          return (
            <Fragment key={e.key}>
              <HStack
                gap={3}
                minH="44px"
                px={4}
                py={2}
                borderRadius="lg"
                bg="app.primary.bg"
                aria-current="step"
              >
                <Box
                  w="16px"
                  h="16px"
                  borderRadius="full"
                  bg="app.primary"
                  boxShadow="0 0 0 3px rgba(207, 159, 63, 0.25)"
                  flexShrink={0}
                />
                <Text fontSize="sm" fontWeight="bold" minW={0}>
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
                  fontWeight="bold"
                  fontVariantNumeric="tabular-nums"
                  flexShrink={0}
                >
                  {e.dose}
                </Text>
              </HStack>
            </Fragment>
          );
        }

        if (isDone && opened === e.key) {
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
                    fontVariantNumeric="tabular-nums"
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
                      <WeightField
                        label={`Corriger le poids, en kilos — ${e.name} ${rank}`}
                        value={value?.weight}
                        onChange={(next) => writeWeight(e, next)}
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
                  {hasDetailOf(e) ? (
                    <Box
                      as="button"
                      onClick={() => onOpenDetail(e.exercise)}
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
              opacity={isDone ? 1 : 0.75}
              {...(isDone
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
                color={isDone ? 'session.rest' : 'whiteAlpha.400'}
                flexShrink={0}
              >
                {isDone ? (
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
              {/* Le nom n'est plus coupé : « Goblet… », « Fentes… » se
                devinaient. Il passe à la ligne, et le rang garde sa place. */}
              <Text fontSize="sm" color="fg.muted" minW={0}>
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
              {isDone ? (
                <Text
                  fontSize="sm"
                  color="fg.muted"
                  fontVariantNumeric="tabular-nums"
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
                    fontVariantNumeric="tabular-nums"
                    flexShrink={0}
                    minW="62px"
                    textAlign="right"
                  >
                    {e.dose}
                  </Text>
                </>
              )}
            </HStack>
          </Fragment>
        );
      })}
    </VStack>
  );
};
