import { Box, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { PerformedSet, PerformedValues } from '@/shared/types';
import { hitArea } from '@/shared/components/hitArea';
import {
  isEmptySet,
  truncateAtFirstEmpty,
  uniformSet,
} from '../performedFormat';

interface PerformedFieldsProps {
  value: PerformedValues;
  onChange: (next: PerformedValues) => void;
  /**
   * Ce que chaque passage demande, une entrée par passage — « 21 reps »,
   * « 15 reps »… Une entrée vide est numérotée. La longueur fixe le nombre de
   * lignes de saisie.
   */
  setLabels?: string[];
  /** "la dernière fois : 3 × 12 reps · 26 kg", or `null`. */
  lastLabel?: string | null;
  /** L'exercice se mesure en temps : demander des répétitions n'a pas de
   *  sens, on ne montre donc que la charge. */
  isTimed?: boolean;
}

// Une chaîne vide efface la clé au lieu d'écrire 0 : « non renseigné » ne
// doit jamais ressembler à « zéro », ni ici ni dans ce qu'on envoie à
// l'API.
const parse = (raw: string): number | undefined => {
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const Field = ({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  value?: number;
  onChange: (v?: number) => void;
}) => (
  <HStack gap={1} align="center">
    <Input
      size="xs"
      w="52px"
      textAlign="center"
      inputMode="decimal"
      aria-label={label}
      placeholder="—"
      value={value === undefined ? '' : String(value)}
      onChange={(e) => onChange(parse(e.target.value))}
      bg="whiteAlpha.50"
      borderColor="whiteAlpha.100"
      _placeholder={{ color: 'fg.muted', opacity: 0.6 }}
      _focus={{ borderColor: 'app.primary.border', bg: 'whiteAlpha.100' }}
      borderRadius="md"
      fontFamily="mono"
    />
    <Text fontSize="xs" color="fg.muted">
      {suffix}
    </Text>
  </HStack>
);

const SetInputs = ({
  set,
  isTimed,
  onChange,
}: {
  set: PerformedSet;
  isTimed: boolean;
  onChange: (next: PerformedSet) => void;
}) => (
  // The work first, the load second — « 9 reps · 12 kg », the order it is
  // said in. A timed exercise has no repetitions to ask for, so the load
  // stands alone.
  <HStack gap={3} align="center" flexWrap="wrap">
    {!isTimed && (
      <Field
        label="Répétitions réellement faites"
        suffix="reps"
        value={set.reps}
        onChange={(v) => onChange({ ...set, reps: v })}
      />
    )}
    <Field
      label="Poids utilisé, en kilos"
      suffix="kg"
      value={set.weight}
      onChange={(v) => onChange({ ...set, weight: v })}
    />
  </HStack>
);

/**
 * Noter ce qu'on a fait — un couple charge/répétitions, ou le détail série
 * par série.
 *
 * Le cas courant est une charge tenue du début à la fin : on la saisit une
 * fois. Mais une série ratée, une charge lâchée au troisième passage, est
 * précisément ce qu'un coach a besoin de lire, et un couple unique ne savait
 * pas le dire. Le détail est donc là, replié, à un geste.
 *
 * Une série laissée vide veut dire que l'exercice s'est arrêté là. Les lignes
 * restent à l'écran pour qu'on puisse y revenir ; ce qui part à l'API
 * s'arrête à la première vide.
 */
export const PerformedFields = ({
  value,
  onChange,
  setLabels = [''],
  lastLabel,
  isTimed = false,
}: PerformedFieldsProps) => {
  const rowCount = Math.max(1, setLabels.length);

  // Les lignes vivent ici à leur longueur pleine : sinon, une série vidée
  // en cours de saisie ferait disparaître les suivantes sous les doigts. La
  // troncature n'a lieu qu'à la sortie.
  const [rows, setRows] = useState<PerformedSet[]>(() =>
    Array.from({ length: rowCount }, (_, i) => value.sets?.[i] ?? {})
  );
  // Ouvert d'emblée seulement quand les séries diffèrent déjà : c'est une
  // correction en cours, et la replier masquerait ce qu'on est en train de
  // corriger. Une saisie neuve commence simple.
  const [isDetailed, setIsDetailed] = useState(() => {
    const kept = truncateAtFirstEmpty(value.sets ?? []);
    return rowCount > 1 && kept.length > 0 && uniformSet(kept) === null;
  });

  const emit = (next: PerformedSet[]) => {
    setRows(next);
    onChange({ sets: truncateAtFirstEmpty(next) });
  };

  // Replié, on décrit toutes les séries d'un coup : « j'ai tenu 12 reps à
  // 26 kg du début à la fin ». Vider le champ efface tout l'exercice, ce qui
  // est bien ce que veut dire vider la seule valeur affichée.
  const collapsedSet = uniformSet(rows) ?? rows[0] ?? {};
  const setAll = (next: PerformedSet) =>
    emit(
      isEmptySet(next)
        ? Array.from({ length: rowCount }, () => ({}))
        : Array.from({ length: rowCount }, () => ({ ...next }))
    );

  const setRow = (index: number, next: PerformedSet) =>
    emit(rows.map((row, i) => (i === index ? next : row)));

  return (
    <Box pl={4}>
      <HStack gap={3} align="center" flexWrap="wrap">
        <Text fontSize="xs" color="fg.muted" flexShrink={0}>
          Fait&nbsp;:
        </Text>
        {!isDetailed && (
          <SetInputs set={collapsedSet} isTimed={isTimed} onChange={setAll} />
        )}
        {rowCount > 1 && (
          <Box
            as="button"
            aria-expanded={isDetailed}
            onClick={() => setIsDetailed((open) => !open)}
            color="fg.muted"
            _hover={{ color: 'app.primary' }}
            css={hitArea(32)}
          >
            <HStack gap={1}>
              <Box
                display="flex"
                transform={isDetailed ? 'rotate(90deg)' : 'none'}
                transition="transform 0.15s"
              >
                <LuChevronRight size={12} />
              </Box>
              <Text fontSize="xs">
                {isDetailed ? 'saisie simple' : 'détailler par série'}
              </Text>
            </HStack>
          </Box>
        )}
      </HStack>

      {isDetailed && (
        <VStack align="stretch" gap={1.5} mt={2}>
          {rows.map((row, index) => (
            <HStack key={index} gap={2} align="center">
              {/* Le palier plutôt que le rang quand il y en a un : sur une
                  pyramide, « 1 2 3 » ne dit pas lequel des trois on remplit,
                  « 21 15 9 » si. */}
              <Text
                fontSize="xs"
                fontFamily="mono"
                color="fg.muted"
                w={setLabels[index] ? '56px' : '16px'}
                textAlign={setLabels[index] ? 'right' : 'left'}
                flexShrink={0}
              >
                {setLabels[index] || index + 1}
              </Text>
              <SetInputs
                set={row}
                isTimed={isTimed}
                onChange={(next) => setRow(index, next)}
              />
            </HStack>
          ))}
          <Text fontSize="xs" color="fg.muted" opacity={0.8}>
            Une série laissée vide arrête l'exercice là.
          </Text>
        </VStack>
      )}

      {lastLabel && (
        <Text fontSize="xs" color="fg.muted" mt={1} opacity={0.8}>
          la dernière fois&nbsp;: {lastLabel}
        </Text>
      )}
    </Box>
  );
};
