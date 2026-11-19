import { Box, HStack, Portal, Text, VStack } from '@chakra-ui/react';
import { CompletedSession } from '@/shared/types';
import { ActionButton, Sheet } from '@/kit';
import { useSheetDismiss } from '@/features/workshop';
import { getRelativeDate } from '@/domain/week/dates';
import { EFFORT_ZONE_COLOR, getEffortLevel } from '@/domain/history/effort';
import { formatPerformed } from '@/domain/history/performedFormat';
import {
  pulseHeadline,
  type SessionPulse as Pulse,
} from '@/domain/history/pulse';
import { EffortDots } from './EffortDots';

interface PerformedLine {
  name: string;
  value: string;
}

// Au-delà, ce n'est plus un ressenti qu'on lit : c'est un tableau qu'on
// ouvre dans le journal complet.
const MAX_LINES = 4;

/**
 * Ce que le client a réellement noté ce jour-là, exercice par exercice.
 *
 * Le coach écrivait « 4 × 10 » et n'apprenait jamais ce qui avait été fait :
 * seul le client, dans son propre historique, voyait ses 26 kg. La donnée
 * existait déjà dans l'instantané de la séance, elle n'était simplement
 * affichée nulle part de ce côté-ci.
 */
const performedLines = (completed: CompletedSession): PerformedLine[] =>
  [...completed.blocks]
    .sort((a, b) => a.order - b.order)
    .flatMap((block) =>
      [...block.exercises]
        .sort((a, b) => a.order - b.order)
        .flatMap((ex) => {
          const value = formatPerformed(ex.performed);
          const name = ex.exercise?.name;
          return value
            ? [{ name: typeof name === 'string' ? name : 'Exercice', value }]
            : [];
        })
    );

const PerformedList = ({ completed }: { completed: CompletedSession }) => {
  const lines = performedLines(completed);
  if (lines.length === 0) return null;

  const shown = lines.slice(0, MAX_LINES);
  const rest = lines.length - shown.length;

  return (
    <VStack align="stretch" gap={1.5} mt={1.5}>
      {/* Le nom au-dessus, la valeur en dessous : une entrée détaillée
          se lit « 26 kg × 12 · 26 kg × 10 · 24 kg × 8 », ce qui ne tient sur
          aucune ligne partagée. Sur la même ligne, c'était le nom qui cédait
          — et un exercice réduit à « G. » ne se lit plus. */}
      {shown.map((line, i) => (
        <Box key={`${line.name}-${i}`}>
          <Text fontSize="xs" color="fg.muted" lineClamp={1}>
            {line.name}
          </Text>
          <Text
            fontSize="xs"
            fontVariantNumeric="tabular-nums"
            color="fg"
            lineClamp={2}
          >
            {line.value}
          </Text>
        </Box>
      ))}
      {rest > 0 && (
        <Text fontSize="xs" color="fg.muted">
          + {rest} autre{rest > 1 ? 's' : ''}
        </Text>
      )}
    </VStack>
  );
};

/**
 * Les derniers passages d'une séance, du plus récent au plus ancien : le
 * jour, le ressenti, le mot du client, ce qu'il a noté.
 *
 * Un passage pas encore lu le dit — « à lire » — : c'est ce que le chip du
 * pouls compte, et il faut pouvoir le retrouver dans la liste.
 */
export const SessionPassages = ({
  history,
  limit = 3,
}: {
  /** Déjà filtré sur la séance. */
  history: CompletedSession[];
  limit?: number;
}) => {
  const recent = [...history]
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, limit);
  return (
    <VStack align="stretch" gap={3} data-passages>
      {recent.map((completed) => {
        const level = getEffortLevel(completed.feedback?.effort);
        return (
          <Box
            key={completed._id}
            borderLeftWidth="2px"
            borderLeftColor="whiteAlpha.300"
            pl={3}
            data-passage
          >
            <HStack justify="space-between" gap={2}>
              <Text fontSize="xs" color="fg.muted">
                {getRelativeDate(completed.completedAt)}
                {!completed.viewedByCoach && ' · à lire'}
              </Text>
              {level && (
                <Text
                  fontSize="xs"
                  fontWeight="700"
                  color={EFFORT_ZONE_COLOR[level.zone]}
                >
                  {level.label}
                </Text>
              )}
            </HStack>
            <Text
              fontSize="xs"
              fontStyle="italic"
              mt={0.5}
              whiteSpace="pre-wrap"
              color={completed.clientNotes ? 'fg' : 'fg.muted'}
            >
              {completed.clientNotes
                ? `« ${completed.clientNotes} »`
                : 'Aucun commentaire'}
            </Text>
            <PerformedList completed={completed} />
          </Box>
        );
      })}
    </VStack>
  );
};

/**
 * La colonne de droite, à partir de 1 280 px : les passages, à côté du
 * programme qu'ils commentent.
 *
 * Elle portait aussi l'axe du ressenti et sa flèche de dérive ; le pouls,
 * sous l'en-tête de la séance, les dit maintenant pour tous les écrans, et
 * les répéter ici les faisait lire deux fois sur le même écran.
 */
export const SessionFeedbackPanel = ({
  history,
}: {
  history: CompletedSession[];
}) => (
  <Box borderWidth="1px" borderColor="whiteAlpha.100" borderRadius="lg" p={4}>
    <Text
      fontSize="xs"
      fontWeight="bold"
      color="fg.muted"
      textTransform="uppercase"
      letterSpacing="wider"
      mb={3}
    >
      Retour du client
    </Text>
    {history.length === 0 ? (
      <Text fontSize="xs" color="fg.muted">
        Cette séance n'a pas encore été faite.
      </Text>
    ) : (
      <SessionPassages history={history} />
    )}
  </Box>
);

/**
 * Les passages d'une séance, sous 1 280 px : une feuille ouverte depuis le
 * pouls, faute de colonne pour les tenir à côté du programme.
 */
export const PassagesSheet = ({
  title,
  pulse,
  history,
  clientFirstName,
  onJournal,
  onClose,
}: {
  /** « Ressentis · Full body A ». */
  title: string;
  pulse: Pulse;
  history: CompletedSession[];
  /** Absent d'un compte sans prénom : « de ton client ». */
  clientFirstName?: string;
  onJournal: () => void;
  onClose: () => void;
}) => {
  useSheetDismiss(true, onClose);
  const headline = pulseHeadline(pulse);
  return (
    <Portal>
      <Sheet label={title} onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="20px">
          {title}
        </Text>
        <HStack gap="10px">
          <EffortDots zones={pulse.zones} size="lg" />
          <Text
            fontWeight="700"
            color={
              headline.tone ? EFFORT_ZONE_COLOR[headline.tone] : 'fg.muted'
            }
          >
            {headline.text}
          </Text>
        </HStack>
        <SessionPassages history={history} limit={5} />
        <ActionButton tone="ghost" size="md" w="full" onClick={onJournal}>
          Tous les ressentis de {clientFirstName ?? 'ton client'}
        </ActionButton>
      </Sheet>
    </Portal>
  );
};
