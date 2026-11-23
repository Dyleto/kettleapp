import { useCallback, useEffect, useRef } from 'react';
import { Box, chakra, HStack, Portal, Text } from '@chakra-ui/react';
import { LuMessageSquare } from 'react-icons/lu';
import type { BlockExercise, SessionBlock } from '@/shared/types';
import { blockIndexPrefix } from '@/domain/session/blocks';
import { coachDose } from '@/domain/session/dose';
import type { ExerciseTrace } from '@/domain/history/exerciseTrace';
import { Sheet } from '@/kit';
import { useOutsideDismiss } from '@/shared/hooks/useOutsideDismiss';
import { useSheetDismiss } from '@/shared/hooks/useSheetDismiss';
import { ExerciseSettings, type ExerciseUpdate } from './ExerciseSettings';

interface ExerciseRowProps {
  exercise: BlockExercise;
  block: SessionBlock;
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** En dessous de 768 px : les réglages montent dans une feuille basse
   * au lieu de se déplier sous la ligne. */
  inSheet: boolean;
  /** Défiler jusqu'à elle en paraissant : c'est la ligne qu'« Ajuster »
   * vient désigner. */
  reveal?: boolean;
  onUpdate: (updates: ExerciseUpdate) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onOpenSheet?: () => void;
  /** Ce que le client en a fait, quand il y a un client. */
  trace?: ExerciseTrace;
}

/**
 * Les charges des derniers passages en barres, de la plus légère à la plus
 * lourde : la montée se voit avant de lire les nombres. De 8 à 20 px, en
 * proportion de la plus lourde.
 */
const LoadBars = ({ loads }: { loads: number[] }) => {
  const top = Math.max(...loads);
  return (
    <HStack gap="3px" align="flex-end" h="20px" aria-hidden flexShrink={0}>
      {loads.map((load, i) => (
        <Box
          key={i}
          w="6px"
          h={`${Math.max(8, Math.round((load / top) * 20))}px`}
          borderRadius="2px"
          bg="session.rest"
        />
      ))}
    </HStack>
  );
};

/**
 * Ce que le client a fait de la ligne, sous elle : « 20 → 24 → 26 kg », son
 * mot quand il en parle. Ouverte, la ligne dit en plus ce que les charges
 * racontent — « Elle monte seule : + 6 kg en trois passages ».
 *
 * Le sarcelle pour ce qui monte, le corail pour ce qui inquiète : une
 * charge qui baisse, un mot dit dans la douleur. Le reste se lit en gris.
 */
const TraceLine = ({ trace, lit }: { trace: ExerciseTrace; lit: boolean }) => (
  <HStack
    gridColumn="1 / -1"
    gap="8px"
    fontSize="13px"
    color="fg.muted"
    minW={0}
    align="center"
    data-trace={trace.tone}
  >
    {trace.tone === 'up' && trace.loads.length > 1 ? (
      <LoadBars loads={trace.loads} />
    ) : trace.tone === 'warn' ? (
      <Box
        w="8px"
        h="8px"
        borderRadius="full"
        bg="session.work"
        flexShrink={0}
        aria-hidden
      />
    ) : null}
    <Text>
      {trace.line}
      {lit && trace.insight && (
        <chakra.b
          fontWeight="600"
          color={trace.tone === 'warn' ? 'session.work.fg' : 'session.rest.fg'}
        >
          {' '}
          {trace.insight}
        </chakra.b>
      )}
      {trace.quote && (
        <chakra.b
          fontWeight="600"
          color={trace.tone === 'warn' ? 'session.work.fg' : 'fg'}
        >
          {trace.line ? ' ' : ''}« {trace.quote} »
        </chakra.b>
      )}
    </Text>
  </HStack>
);

/**
 * Une ligne d'exercice dans l'atelier : elle se lit, puis s'ouvre.
 *
 * Au repos, le nom et la dose — « Goblet Squat · 4 × 10 · repos 1 min » —,
 * ce que le client lira, et « à régler » en gris quand rien n'est prescrit :
 * un nombre manquant se voit avant de partir chez lui. La toucher l'ouvre ;
 * une seule est ouverte à la fois, et Échap ou un clic ailleurs la referme.
 *
 * Une ligne entière est la cible, et non son nom seul : le coach vise
 * l'exercice qu'il veut régler, pas un mot dans la ligne.
 */
export const ExerciseRow = ({
  exercise,
  block,
  index,
  open,
  onOpenChange,
  inSheet,
  reveal = false,
  onUpdate,
  onRemove,
  onDuplicate,
  onOpenSheet,
  trace,
}: ExerciseRowProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const name = exercise.exercise.name;
  const dose = coachDose(block, exercise);
  const note = exercise.note?.trim();

  /**
   * Refermer rend le focus à la ligne quand il était dedans : au clavier,
   * Échap ne doit pas renvoyer en haut de la page.
   */
  const close = useCallback(() => {
    const inside = rootRef.current?.contains(document.activeElement);
    onOpenChange(false);
    if (inside) toggleRef.current?.focus();
  }, [onOpenChange]);

  // Au centre de l'écran : en haut, la ligne passerait sous l'en-tête de la
  // page ; en bas, sous sa propre feuille sur téléphone.
  useEffect(() => {
    if (reveal) rootRef.current?.scrollIntoView({ block: 'center' });
  }, [reveal]);

  useOutsideDismiss(rootRef, open && !inSheet, close);
  useSheetDismiss(open && inSheet, close);

  const lit = open && !inSheet;

  return (
    <Box
      ref={rootRef}
      // Un point d'ancrage stable pour les mesures de mise en page : sans
      // lui, une sonde doit remonter le DOM en comptant les niveaux.
      data-exercise-row
      data-open={open || undefined}
      borderTopWidth={lit ? 0 : '1px'}
      borderColor="line"
      bg={lit ? 'bg.raised' : undefined}
      borderRadius={lit ? '16px' : undefined}
      boxShadow={lit ? 'inset 0 0 0 2px {colors.app.primary}' : undefined}
      // Dans la carte du bloc : la ligne fermée court d'un bord à l'autre,
      // son filet aussi ; ouverte, elle se détache en carte dans la carte,
      // comme sur la maquette.
      my={lit ? '6px' : 0}
      mx={lit ? '10px' : 0}
      pl={lit ? '14px' : '20px'}
      pr={lit ? '14px' : '18px'}
      py={lit ? '12px' : 0}
    >
      <chakra.button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        onClick={() => (open ? close() : onOpenChange(true))}
        display="grid"
        gridTemplateColumns="minmax(0, 1fr) auto"
        columnGap="14px"
        rowGap="4px"
        alignItems="center"
        w="full"
        minH="48px"
        py={lit ? 0 : '10px'}
        textAlign="left"
        borderRadius="md"
        css={{ '&:hover [data-name]': { color: 'app.primary.fg' } }}
      >
        <Text data-name fontSize="16px" fontWeight="600" lineClamp={2}>
          {blockIndexPrefix(block.type) && (
            <Text as="span" color="fg.muted" fontWeight="500">
              {index + 1} ·{' '}
            </Text>
          )}
          {name}
        </Text>
        <Text
          fontSize="15.5px"
          fontWeight={dose === null ? '500' : '700'}
          color={dose === null ? 'fg.muted' : 'fg'}
          fontVariantNumeric="tabular-nums"
          whiteSpace="nowrap"
        >
          {dose ?? 'à régler'}
        </Text>
        {/* La consigne se relit sous la ligne fermée ; ouverte, son champ
            la remplace. */}
        {note && !lit && (
          <HStack
            gridColumn="1 / -1"
            gap="6px"
            fontSize="13px"
            color="fg.muted"
            minW={0}
          >
            <LuMessageSquare size={12} aria-hidden />
            <Text lineClamp={1}>{note}</Text>
          </HStack>
        )}
        {trace && <TraceLine trace={trace} lit={lit} />}
      </chakra.button>

      {lit && (
        <ExerciseSettings
          exercise={exercise}
          block={block}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
          onOpenSheet={onOpenSheet}
          layout="row"
        />
      )}

      {open && inSheet && (
        // Hors du flux de l'éditeur : un bloc qu'on glisse se déplace par
        // une transformation, et une transformation enferme ce qui est
        // fixe à l'intérieur — la feuille monterait du bas du bloc.
        <Portal>
          <Sheet label={`Régler ${name}`} onDismiss={close}>
            <ExerciseSettings
              exercise={exercise}
              block={block}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onDuplicate={onDuplicate}
              onOpenSheet={onOpenSheet}
              layout="sheet"
              onDone={close}
            />
          </Sheet>
        </Portal>
      )}
    </Box>
  );
};
