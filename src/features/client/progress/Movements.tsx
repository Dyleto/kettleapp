import { useState } from 'react';
import { Box, chakra, HStack, Portal, Text, VStack } from '@chakra-ui/react';
import { Chip, Curve, Eyebrow, Sheet } from '@/kit';
import { useSheetDismiss } from '@/features/workshop';
import { formatPerformedSets } from '@/domain/history/performedFormat';
import {
  deltaLabel,
  loadLabel,
  passageDate,
  type Movement,
  type RecordCard,
} from '@/domain/history/movements';

/** Le nombre de mouvements montrés d'emblée : au-delà, la liste
 * deviendrait un tableau, et elle se déplie à la demande. */
const SHOWN = 6;

/** L'écart en pastille : sarcelle quand ça monte, bleu quand ça baisse —
 * sans jugement —, neutre quand ça tient. */
const DeltaChip = ({ delta }: { delta: number }) => (
  <Chip tone={delta > 0 ? 'teal' : delta < 0 ? 'blue' : 'neutral'}>
    {deltaLabel(delta)}
  </Chip>
);

/**
 * Les records, en deux cartes au plus : la valeur en grand, ce qu'elle
 * récompense dessous.
 *
 * Une carte de charge ouvre la feuille de son mouvement ; celle d'un AMRAP
 * n'a pas de mouvement à montrer, elle se lit seulement.
 */
export const Records = ({
  records,
  onOpen,
}: {
  records: RecordCard[];
  onOpen: (exerciseId: string) => void;
}) => {
  if (records.length === 0) return null;
  return (
    <HStack gap="10px" align="stretch" data-records>
      {records.map((record) => {
        const body = (
          <>
            <Eyebrow tone="amber">Record</Eyebrow>
            <Text
              fontSize="38px"
              fontWeight="800"
              lineHeight="1.05"
              fontVariantNumeric="tabular-nums"
            >
              {record.value}
            </Text>
            <Text fontSize="sm" color="fg.muted" lineClamp={2}>
              {record.name}
            </Text>
          </>
        );
        const frame = {
          flex: 1,
          minW: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '6px',
          textAlign: 'left',
          bg: 'surface.card',
          borderRadius: 'card',
          p: '16px',
        } as const;
        return record.exerciseId ? (
          <chakra.button
            key={`${record.name}-${record.at}`}
            type="button"
            onClick={() => onOpen(record.exerciseId!)}
            _hover={{ bg: 'bg.raised' }}
            {...frame}
            data-record
          >
            {body}
          </chakra.button>
        ) : (
          <Box key={`${record.name}-${record.at}`} {...frame} data-record>
            {body}
          </Box>
        );
      })}
    </HStack>
  );
};

/**
 * « Tes mouvements » : une ligne par mouvement, sa dernière charge, une
 * courbe et l'écart depuis le premier passage.
 *
 * Un seul passage n'a ni courbe ni écart : la valeur seule. Au-delà de six,
 * « Voir tes 12 mouvements » : la liste reste un repère, pas un tableau.
 */
export const MovementList = ({
  movements,
  onOpen,
}: {
  movements: Movement[];
  onOpen: (exerciseId: string) => void;
}) => {
  const [all, setAll] = useState(false);
  if (movements.length === 0) return null;
  const shown = all ? movements : movements.slice(0, SHOWN);
  return (
    <VStack align="stretch" gap="8px">
      <Eyebrow>Tes mouvements</Eyebrow>
      <VStack
        align="stretch"
        gap={0}
        bg="surface.card"
        borderRadius="card"
        overflow="hidden"
        data-movements
      >
        {shown.map((movement) => {
          const last = movement.passages[movement.passages.length - 1];
          const many = movement.passages.length > 1;
          const count = movement.passages.length;
          return (
            <chakra.button
              key={movement.exerciseId}
              type="button"
              onClick={() => onOpen(movement.exerciseId)}
              display="flex"
              alignItems="center"
              gap="12px"
              w="full"
              textAlign="left"
              px="16px"
              py="12px"
              borderTopWidth="1px"
              borderColor="line"
              _first={{ borderTopWidth: 0 }}
              _hover={{ bg: 'bg.raised' }}
              data-movement={movement.exerciseId}
            >
              <VStack align="start" gap="2px" flex={1} minW={0}>
                <Text fontWeight="700" truncate maxW="full">
                  {movement.name}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {loadLabel(last.load)} · {count} séance{count > 1 ? 's' : ''}
                </Text>
              </VStack>
              {many && (
                <>
                  <Curve
                    values={movement.passages.map((p) => p.load)}
                    falling={movement.delta < 0}
                  />
                  <DeltaChip delta={movement.delta} />
                </>
              )}
            </chakra.button>
          );
        })}
      </VStack>
      {movements.length > SHOWN && (
        <chakra.button
          type="button"
          alignSelf="center"
          fontSize="sm"
          fontWeight="600"
          color="app.primary"
          minH="44px"
          onClick={() => setAll((was) => !was)}
        >
          {all ? 'Voir moins' : `Voir tes ${movements.length} mouvements`}
        </chakra.button>
      )}
    </VStack>
  );
};

/**
 * La feuille d'un mouvement : sa courbe en grand, puis chaque passage, du
 * plus récent au plus ancien — la date, le format du bloc, ce qui a été
 * fait, et « Record » sur le passage qui l'a établi.
 *
 * Le format dit pourquoi une charge a pu baisser : douze répétitions en
 * EMOM ne se comparent pas à quatre séries en classique.
 */
export const MovementSheet = ({
  movement,
  onClose,
}: {
  movement: Movement;
  onClose: () => void;
}) => {
  useSheetDismiss(true, onClose);
  const passages = [...movement.passages].reverse();
  return (
    <Portal>
      <Sheet label={movement.name} onDismiss={onClose}>
        <HStack gap="10px" data-movement-sheet={movement.exerciseId}>
          <Text as="h2" fontWeight="800" fontSize="22px" flex={1} minW={0}>
            {movement.name}
          </Text>
          {movement.passages.length > 1 && <DeltaChip delta={movement.delta} />}
        </HStack>
        <Curve
          size="lg"
          values={movement.passages.map((p) => p.load)}
          falling={movement.delta < 0}
        />
        <VStack align="stretch" gap={0} bg="bg.raised" borderRadius="14px">
          {passages.map((passage, i) => (
            <HStack
              key={`${passage.completedId}-${i}`}
              gap="10px"
              px="16px"
              py="12px"
              borderTopWidth="1px"
              borderColor="line"
              _first={{ borderTopWidth: 0 }}
              data-passage
            >
              {/* La date tient sa largeur ; une suite de séries
                  différentes passe à la ligne à sa place. Sans cela, la
                  colonne de la date s'écrasait jusqu'à s'écrire lettre par
                  lettre. */}
              <Text
                flexShrink={0}
                whiteSpace="nowrap"
                color="fg.muted"
                fontSize="sm"
              >
                {passageDate(passage.at)} · {passage.format}
              </Text>
              <Text
                flex={1}
                minW={0}
                textAlign="right"
                fontWeight="700"
                fontVariantNumeric="tabular-nums"
              >
                {formatPerformedSets(passage.sets) ?? loadLabel(passage.load)}
              </Text>
              {passage.completedId === movement.recordId &&
                passage.load === movement.best && (
                  <Chip tone="amber">Record</Chip>
                )}
            </HStack>
          ))}
        </VStack>
      </Sheet>
    </Portal>
  );
};
