import { useCallback, useEffect, useRef } from 'react';
import { Box, chakra, HStack, Portal, Text } from '@chakra-ui/react';
import { LuMessageSquare } from 'react-icons/lu';
import type { BlockExercise, SessionBlock } from '@/shared/types';
import { blockIndexPrefix } from '@/domain/session/blocks';
import { coachDose } from '@/domain/session/dose';
import { Sheet } from '@/kit';
import { useOutsideDismiss } from '@/shared/hooks/useOutsideDismiss';
import { useBackDismiss } from '@/shared/hooks/useBackDismiss';
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
  onUpdate: (updates: ExerciseUpdate) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onOpenSheet?: () => void;
}

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
  onUpdate,
  onRemove,
  onDuplicate,
  onOpenSheet,
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

  useOutsideDismiss(rootRef, open && !inSheet, close);
  // La feuille se ferme au bouton retour du téléphone, comme les autres
  // couches de l'atelier ; et à Échap, qu'elle ne connaît pas d'elle-même.
  useBackDismiss(open && inSheet, close);
  useEffect(() => {
    if (!open || !inSheet) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, inSheet, close]);

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
      my={lit ? '6px' : 0}
      px={lit ? '14px' : 0}
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
