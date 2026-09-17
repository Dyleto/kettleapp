import { Box, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { LuChevronRight } from 'react-icons/lu';
import { PerformedSet, PerformedValues } from '@/types';
import { hitArea } from '@/components/hitArea';
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
   * « 15 reps »… Une entrée vide se numérote. La longueur fait le nombre de
   * lignes de saisie.
   */
  setLabels?: string[];
  /** « la dernière fois : 26 kg · 3 × 12 reps », ou `null`. */
  lastLabel?: string | null;
  /** L'exercice se mesure en temps : demander des répétitions n'a pas de
   *  sens, on ne montre alors que la charge. */
  isTimed?: boolean;
}

// Une chaîne vide efface la clé plutôt que d'écrire 0 : « non renseigné » ne
// doit jamais ressembler à « zéro », ni ici ni dans ce qu'on envoie à l'API.
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
  <HStack gap={3} align="center" flexWrap="wrap">
    <Field
      label="Poids utilisé, en kilos"
      suffix="kg"
      value={set.weight}
      onChange={(v) => onChange({ ...set, weight: v })}
    />
    {!isTimed && (
      <Field
        label="Répétitions réellement faites"
        suffix="reps"
        value={set.reps}
        onChange={(v) => onChange({ ...set, reps: v })}
      />
    )}
  </HStack>
);

/**
 * Noter ce qu'on a fait — un couple poids/reps, ou le détail série par série.
 *
 * Le cas courant est une charge tenue du début à la fin : on la saisit une
 * fois. Mais une série ratée, une charge qu'on baisse au troisième passage,
 * c'est précisément ce qu'un coach a besoin de lire, et un couple unique ne
 * pouvait pas le dire. Le détail est donc là, replié, à un geste.
 *
 * Une série laissée vide veut dire que l'exercice s'est arrêté là. Les lignes
 * restent affichées pour qu'on puisse revenir dessus ; ce qui part à l'API
 * s'arrête au premier vide.
 */
export const PerformedFields = ({
  value,
  onChange,
  setLabels = [''],
  lastLabel,
  isTimed = false,
}: PerformedFieldsProps) => {
  const rowCount = Math.max(1, setLabels.length);

  // Les lignes vivent ici, à leur longueur pleine : sinon une série qu'on
  // vide au milieu de la saisie ferait disparaître les suivantes sous les
  // doigts. La troncature n'a lieu qu'à la sortie.
  const [rows, setRows] = useState<PerformedSet[]>(() =>
    Array.from({ length: rowCount }, (_, i) => value.sets?.[i] ?? {})
  );
  // Ouvert d'emblée seulement s'il y a déjà des séries qui diffèrent : c'est
  // une correction qu'on vient faire, la replier cacherait ce qu'on corrige.
  // Une saisie neuve, elle, commence simple.
  const [isDetailed, setIsDetailed] = useState(() => {
    const kept = truncateAtFirstEmpty(value.sets ?? []);
    return rowCount > 1 && kept.length > 0 && uniformSet(kept) === null;
  });

  const emit = (next: PerformedSet[]) => {
    setRows(next);
    onChange({ sets: truncateAtFirstEmpty(next) });
  };

  // Replié, on décrit toutes les séries d'un coup : « j'ai tenu 26 kg × 12 du
  // début à la fin ». Vider le champ efface l'exercice entier, ce qui est
  // bien ce qu'on veut dire en effaçant la seule valeur affichée.
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
              {/* Le palier plutôt que le rang quand il existe : sur une
                  pyramide, « 1 2 3 » ne dit pas laquelle des trois on
                  renseigne, « 21 15 9 » si. */}
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
