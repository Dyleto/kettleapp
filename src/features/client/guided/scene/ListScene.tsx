import { useMemo, type ReactNode } from 'react';
import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuCheck } from 'react-icons/lu';
import type { PerformedValues } from '@/shared/types';
import type { GuidedSet } from '@/domain/session/sets';
import type { LastPerformance } from '@/domain/history/lastPerformance';
import { formatWeight, heaviest } from '@/domain/history/load';
import { ActionButton, LANDSCAPE } from '@/kit';
import type { GuidedStep } from '@/features/client/guided/steps';
import { rankLabel } from '@/features/client/guided/outline';
import { loadLegend, proposedLoad } from '@/features/client/guided/load';
import {
  currentSet,
  doneInBlock,
  exerciseKeyOf,
  isLastStep,
  lastDoneInBlock,
  type GuidedAction,
  type GuidedState,
} from '@/features/client/guided/session';
import { BlockSets } from './BlockSets';
import { LoadStepper } from './LoadStepper';
import { RestHero } from './RestHero';
import { SetHero } from './SetHero';

interface ListSceneProps {
  step: Extract<GuidedStep, { type: 'block' }>;
  state: GuidedState;
  act: (action: GuidedAction) => void;
  lastPerformance?: Map<string, LastPerformance>;
  /**
   * Ce qui a déjà été noté, et de quoi y ajouter — le même état que le
   * formulaire de bilan. Retour du terrain : « dommage de ne pas pouvoir
   * noter les charges au fur et à mesure. » On note donc là où l'on est, et
   * le bilan retrouve ce qui a été saisi au lieu de le redemander.
   */
  performed?: Record<string, PerformedValues>;
  onPerformedChange?: (key: string, next: PerformedValues) => void;
}

/**
 * Un bloc qui se coche : la série en grand, et le bloc entier dessous.
 *
 * Un seul défilement pour les deux : la série se lit de loin, et la liste
 * reste juste en dessous. Le terrain l'avait demandé — « voir toutes les
 * infos d'un coup » — et c'est ce qu'il a validé.
 *
 * Le pied change avec ce qu'il y a à faire : « Série faite » tant qu'il reste
 * une série, « + 15 s » et « Passer » pendant un repos, « Bloc suivant » ou
 * « Terminer » quand tout est coché.
 */
export const ListScene = ({
  step,
  state,
  act,
  lastPerformance,
  performed,
  onPerformedChange,
}: ListSceneProps) => {
  const current = currentSet(state);
  const { rest } = state;
  const doneKeys = useMemo(() => new Set(state.done), [state.done]);
  const isLast = isLastStep(state);

  const notedOfCurrent = current
    ? performed?.[exerciseKeyOf(current)]?.sets
    : undefined;
  const lastTimeOfCurrent = current
    ? lastPerformance?.get(current.exercise.exercise._id)?.sets
    : undefined;
  const ownNoted = current
    ? notedOfCurrent?.[current.rank - 1]?.weight
    : undefined;
  const currentLoad =
    !current || state.declined.includes(current.key)
      ? undefined
      : (ownNoted ??
        proposedLoad(notedOfCurrent, current.rank, lastTimeOfCurrent));

  /** Écrit la charge d'une série dans ce qui a été noté. */
  const writeLoad = (set: GuidedSet, weight: number | undefined) => {
    if (!onPerformedChange) return;
    const key = exerciseKeyOf(set);
    const noted = [...(performed?.[key]?.sets ?? [])];
    while (noted.length < set.rank) noted.push({});
    noted[set.rank - 1] = { ...noted[set.rank - 1], weight };
    onPerformedChange(key, { sets: noted });
  };

  const changeLoad = (next: number | undefined) => {
    if (!current) return;
    act({
      type: 'loadDeclined',
      key: current.key,
      declined: next === undefined,
    });
    writeLoad(current, next);
  };

  const markDone = () => {
    // La charge affichée est enregistrée avec la série : c'est celle qu'on a
    // sous les yeux, proposée ou corrigée. Rien n'était noté tant qu'on ne
    // tapait pas dans le champ, et « tes charges sont déjà enregistrées »
    // n'était vrai que pour qui avait tout ressaisi.
    if (current && ownNoted === undefined && currentLoad !== undefined) {
      writeLoad(current, currentLoad);
    }
    act({ type: 'markDone' });
  };

  const showLoad =
    !!current &&
    !!onPerformedChange &&
    (state.askedLoad.includes(exerciseKeyOf(current)) ||
      heaviest(lastTimeOfCurrent) !== undefined ||
      heaviest(notedOfCurrent) !== undefined);
  const offerLoad =
    !!current &&
    !!onPerformedChange &&
    (!current.exercise.duration || heaviest(lastTimeOfCurrent) !== undefined);
  // Le même nom que dans les autres écrans du mouvement : « série 2 / 4 ».
  const loadLabel = current
    ? `Poids utilisé, en kilos — ${current.name} ${
        current.total > 1 ? `série ${current.rank} / ${current.total}` : ''
      }`
    : '';
  const loadStepper = current && showLoad && (
    <LoadStepper
      key={current.key}
      value={currentLoad}
      onChange={changeLoad}
      legend={loadLegend(currentLoad, lastTimeOfCurrent)}
      label={loadLabel}
    />
  );
  const lastDone = lastDoneInBlock(state);

  return (
    <>
      <VStack
        flex={1}
        minH={0}
        overflowY="auto"
        align="stretch"
        gap={4}
        px={5}
        pt={4}
        pb={2}
      >
        {/* Le nom du bloc est dans le haut de la scène ; il ne se répète ici
            que téléphone couché, où ce haut disparaît. */}
        <Text
          display="none"
          css={{ [LANDSCAPE]: { display: 'block' } }}
          fontSize="xs"
          letterSpacing="2px"
          textTransform="uppercase"
          fontWeight="800"
          color="session.work"
        >
          {step.blockLabel}
          {step.block.label ? ` · ${step.block.label}` : ''}
        </Text>
        {rest ? (
          <RestHero
            key={rest.afterKey}
            duration={rest.duration}
            bonus={rest.bonus}
            nextTitle={
              current
                ? `${current.name} · ${lowerFirst(
                    rankLabel(step.block, current, step.sets)
                  )}`
                : ''
            }
            nextDetail={
              current
                ? [
                    current.dose,
                    currentLoad !== undefined
                      ? `à ${formatWeight(currentLoad)} kg`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                : ''
            }
            onDone={() => act({ type: 'endRest' })}
          >
            {loadStepper}
          </RestHero>
        ) : (
          current && (
            <SetHero
              key={current.key}
              block={step.block}
              set={current}
              blockSets={step.sets}
              doneKeys={doneKeys}
              load={currentLoad}
              legend={loadLegend(currentLoad, lastTimeOfCurrent)}
              showLoad={showLoad}
              offerLoad={offerLoad}
              onAskLoad={() =>
                act({ type: 'askLoad', exerciseKey: exerciseKeyOf(current) })
              }
              onLoadChange={changeLoad}
              loadLabel={loadLabel}
              onTimedDone={markDone}
              onOpenDetail={
                current.exercise.note?.trim() ||
                current.exercise.exercise.description?.trim() ||
                current.exercise.exercise.videoUrl?.trim()
                  ? () =>
                      act({ type: 'openDetail', exercise: current.exercise })
                  : undefined
              }
            />
          )
        )}
        <VStack align="stretch" gap={1}>
          <Text fontSize="sm" color="fg.muted">
            {doneInBlock(state)} sur {step.sets.length} faits dans ce bloc
          </Text>
          <BlockSets
            block={step.block}
            sets={step.sets}
            done={doneKeys}
            current={current}
            performed={performed}
            onPerformedChange={onPerformedChange}
            onOpenDetail={(exercise) => act({ type: 'openDetail', exercise })}
            onUndo={(key) => act({ type: 'undo', key })}
          />
        </VStack>
      </VStack>

      {rest ? (
        // Le repos : rallonger, ou repartir. Aucun bouton ne coche la série
        // suivante pendant qu'on souffle — « Fait » restait là, au même
        // endroit, et se touchait par habitude.
        <Footer>
          <HStack gap={2.5}>
            <ActionButton
              tone="ghost"
              size="xl"
              aria-label="Quinze secondes de repos de plus"
              onClick={() => act({ type: 'extendRest' })}
              css={{ [LANDSCAPE]: { minHeight: '52px' } }}
            >
              + 15 s
            </ActionButton>
            <ActionButton
              tone="soft"
              size="xl"
              flex={1}
              onClick={() => act({ type: 'endRest' })}
              css={{ [LANDSCAPE]: { minHeight: '52px' } }}
            >
              Passer
            </ActionButton>
          </HStack>
        </Footer>
      ) : current ? (
        // Une série : un seul geste principal, en très grand, et deux liens
        // discrets dessous. « Précédent » prenait un tiers de la largeur pour
        // un geste rare, à côté du seul qu'on fait vingt fois par séance.
        <Footer gap={1}>
          <ActionButton
            size="xl"
            w="full"
            onClick={markDone}
            css={{ [LANDSCAPE]: { minHeight: '52px' } }}
          >
            <LuCheck size={22} />
            {/* Le geste dit ce qu'il coche : une série, ou un exercice qui
                n'en a qu'une. « Fait » valait pour les deux, et ne disait
                pas qu'il en restait. */}
            {current.total > 1 ? 'Série faite' : 'Fait'}
          </ActionButton>
          <HStack justify="space-between" gap={4}>
            {lastDone ? (
              <FooterLink onClick={() => act({ type: 'undo', key: lastDone })}>
                {current.total > 1 ? 'Série précédente' : 'Exercice précédent'}
              </FooterLink>
            ) : state.index > 0 ? (
              <FooterLink onClick={() => act({ type: 'previous' })}>
                Bloc précédent
              </FooterLink>
            ) : (
              <Box />
            )}
            <FooterLink onClick={() => act({ type: 'skipExercise' })}>
              Passer cet exercice
            </FooterLink>
          </HStack>
        </Footer>
      ) : (
        // Tout est coché, ou passé : on y revient par « Bloc précédent », ou
        // c'est le dernier bloc et finir reste une décision.
        <Footer>
          <HStack gap={3}>
            <ActionButton
              tone="ghost"
              size="lg"
              flexShrink={0}
              onClick={() => act({ type: 'previous' })}
              disabled={state.index === 0}
            >
              Précédent
            </ActionButton>
            <ActionButton
              size="lg"
              flex={1}
              onClick={() => act({ type: 'next' })}
            >
              {isLast
                ? 'Terminer'
                : step.sets.length > 0
                  ? 'Bloc suivant'
                  : 'Suivant'}
            </ActionButton>
          </HStack>
        </Footer>
      )}
    </>
  );
};

/** Le pied d'une scène : les cibles gardent leur taille téléphone couché, et
 * c'est la marge qui cède — on ne rétrécit pas ce qu'on touche les mains
 * moites. */
export const Footer = ({
  children,
  gap = 0,
}: {
  children: ReactNode;
  gap?: number;
}) => (
  <VStack
    align="stretch"
    gap={gap}
    px={4}
    pt={3}
    pb={3}
    css={{ [LANDSCAPE]: { padding: '6px 12px', gap: '0' } }}
  >
    {children}
  </VStack>
);

/**
 * Un lien du pied de scène : un geste secondaire, à l'écart du principal.
 *
 * 44 px de haut, réels et non débordants : la zone tactile d'un lien de
 * 13 px serait sinon le lien lui-même.
 */
const FooterLink = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => (
  <Box
    as="button"
    minH="44px"
    display="inline-flex"
    alignItems="center"
    fontSize="13px"
    fontWeight="bold"
    color="fg.muted"
    onClick={onClick}
    _hover={{ color: 'fg' }}
  >
    {children}
  </Box>
);

/** « Série 3 sur 4 » au milieu d'une phrase : « série 3 sur 4 ». */
const lowerFirst = (text: string): string =>
  text.charAt(0).toLowerCase() + text.slice(1);
