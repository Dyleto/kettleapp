import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { LuInfo, LuPlus } from 'react-icons/lu';
import { SessionBlock } from '@/shared/types';
import { formatDuration } from '@/shared/utils/duration';
import { type GuidedSet } from '../../guidedSteps';
import { rankLabel } from '../../guided/outline';
import { OnDemandTimer } from '../guided/Timer';
import { LoadStepper } from './LoadStepper';

interface SetHeroProps {
  block: SessionBlock;
  set: GuidedSet;
  blockSets: GuidedSet[];
  doneKeys: ReadonlySet<string>;
  /** La charge affichée : notée pour cette série, sinon proposée. */
  load?: number;
  legend?: string;
  /**
   * Le sélecteur de charge est-il à l'écran ?
   *
   * Oui quand une charge a déjà été notée pour ce mouvement, ici ou lors d'un
   * bilan, ou quand on l'a demandé. Le champ « kg » s'affichait sous chaque
   * exercice, corde à sauter comprise.
   */
  showLoad: boolean;
  /** Proposer « Noter une charge ». Jamais sous un exercice à durée qui n'en a
   * jamais porté. */
  offerLoad: boolean;
  onAskLoad: () => void;
  onLoadChange: (next?: number) => void;
  /** Le nom du champ de charge, tel que les autres écrans le donnent. */
  loadLabel: string;
  onOpenDetail?: () => void;
}

/** « 10 reps » en deux morceaux : le nombre, en très grand, et son unité. */
const splitDose = (dose: string): { amount: string; unit: string } => {
  const plain = dose.replace(/[\u00A0\u202F]/g, ' ').trim();
  const match = plain.match(/^([\d.,:]+)\s*(.*)$/);
  return match
    ? { amount: match[1], unit: match[2] }
    : { amount: plain, unit: '' };
};

/**
 * Les points de l'en-tête : où l'on en est dans ce mouvement, ou dans le
 * bloc quand chaque mouvement n'a qu'une série.
 */
const Dots = ({
  set,
  blockSets,
  doneKeys,
}: Pick<SetHeroProps, 'set' | 'blockSets' | 'doneKeys'>) => {
  const siblings =
    set.total > 1
      ? blockSets.filter((other) => other.exerciseOrder === set.exerciseOrder)
      : blockSets;
  if (siblings.length < 2 || siblings.length > 12) return null;
  return (
    <HStack gap={2} aria-hidden>
      {siblings.map((other) => {
        const isDone = doneKeys.has(other.key);
        const isNow = other.key === set.key;
        return (
          <Box
            key={other.key}
            w="14px"
            h="14px"
            borderRadius="full"
            bg={isDone ? 'session.rest' : isNow ? 'app.primary' : 'bg.surface'}
            boxShadow={
              isNow
                ? '0 0 0 4px rgba(207, 159, 63, 0.25)'
                : isDone
                  ? 'none'
                  : 'inset 0 0 0 1.5px {colors.line}'
            }
          />
        );
      })}
    </HStack>
  );
};

/**
 * La série en cours, en grand.
 *
 * Retour du terrain, à l'origine de la liste : « pendant l'exercice on
 * devrait voir toutes les infos d'un coup — pas 7 reps back squat, puis
 * 120 s de repos, puis 6 reps ». La liste du bloc reste donc à l'écran, sous
 * cette série. Mais dans la liste, la série en cours n'était qu'une ligne
 * plus grasse, au nom tronqué pour laisser la place au rang : ce qu'on fait
 * maintenant se lisait moins bien que ce qu'on avait déjà fait.
 *
 * Ici, elle se lit à deux mètres, téléphone posé au sol : le rang, le nom
 * entier, la dose en très grand, et la charge réglable au pouce.
 */
export const SetHero = ({
  block,
  set,
  blockSets,
  doneKeys,
  load,
  legend,
  showLoad,
  offerLoad,
  onAskLoad,
  onLoadChange,
  loadLabel,
  onOpenDetail,
}: SetHeroProps) => {
  const { amount, unit } = splitDose(set.dose);
  const note = set.exercise.note?.trim();
  const duration = set.exercise.duration;
  // Un nom long descend d'une taille plutôt que d'être coupé : « Soulevé de
  // terre roumain » doit se lire en entier.
  const nameSize = set.name.length > 14 ? '32px' : '40px';

  return (
    <VStack align="stretch" gap={3} data-set-hero={set.key}>
      <HStack justify="space-between" gap={3}>
        <Text
          fontSize="11px"
          fontWeight="800"
          letterSpacing="0.14em"
          textTransform="uppercase"
          lineHeight="1"
          color="app.primary.fg"
        >
          {rankLabel(block, set, blockSets)}
        </Text>
        <Dots set={set} blockSets={blockSets} doneKeys={doneKeys} />
      </HStack>

      <HStack align="start" gap={2.5}>
        <Text
          as="h3"
          fontFamily="heading"
          fontSize={nameSize}
          fontWeight="800"
          // 1,15 et pas moins : plus serrée, la ligne était plus basse que
          // les lettres de cette police, et le nom débordait de sa boîte.
          lineHeight="1.15"
          fontStretch="88%"
          letterSpacing="-0.01em"
          flex={1}
          minW={0}
        >
          {set.name}
        </Text>
        {onOpenDetail && (
          <Box
            as="button"
            aria-label={`Voir la consigne — ${set.name}`}
            onClick={onOpenDetail}
            display="grid"
            placeItems="center"
            w="44px"
            h="44px"
            flexShrink={0}
            color="fg.muted"
          >
            <LuInfo size={24} />
          </Box>
        )}
      </HStack>

      {note && (
        <Box
          as={onOpenDetail ? 'button' : 'div'}
          onClick={onOpenDetail}
          textAlign="left"
          bg="bg.surface"
          borderRadius="20px 20px 20px 6px"
          px="14px"
          py={3}
        >
          <Text fontSize="15px" lineHeight="1.45" lineClamp={3}>
            {note}
          </Text>
        </Box>
      )}

      {amount && (
        <HStack align="baseline" gap={3}>
          <Text
            fontFamily="heading"
            fontSize="96px"
            fontWeight="800"
            fontStretch="76%"
            lineHeight="0.9"
            letterSpacing="-0.02em"
            fontVariantNumeric="tabular-nums"
          >
            {amount}
          </Text>
          {unit && (
            <Text fontSize="28px" fontWeight="bold" color="fg.muted">
              {unit}
            </Text>
          )}
        </HStack>
      )}

      {duration ? (
        <Box ml={-4}>
          <OnDemandTimer
            duration={duration}
            label={formatDuration(duration)}
            color="app.primary"
          />
        </Box>
      ) : null}

      {showLoad ? (
        <LoadStepper
          value={load}
          onChange={onLoadChange}
          legend={legend}
          label={loadLabel}
        />
      ) : offerLoad ? (
        <Box
          as="button"
          alignSelf="flex-start"
          display="inline-flex"
          alignItems="center"
          gap={1.5}
          minH="44px"
          px="14px"
          borderRadius="full"
          boxShadow="inset 0 0 0 1.5px {colors.line}"
          color="fg.muted"
          fontSize="14.5px"
          fontWeight="600"
          onClick={onAskLoad}
        >
          <LuPlus size={16} />
          Noter une charge
        </Box>
      ) : null}
    </VStack>
  );
};
