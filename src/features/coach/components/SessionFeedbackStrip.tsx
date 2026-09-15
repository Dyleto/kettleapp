import { Box, HStack, Text, VStack } from '@chakra-ui/react';
import { CompletedSession } from '@/types';
import { getRelativeDate } from '@/features/client';
import { EFFORT_ZONE_COLOR, getEffortLevel } from '@/features/client/constants';
import { formatPerformed } from '@/features/client/performedFormat';
import { EffortTrend } from './EffortTrend';

interface SessionFeedbackStripProps {
  // Déjà filtré par la page appelante sur originalSessionId === session._id
  history: CompletedSession[];
  // 'strip' : bandeau au-dessus de la séance (écrans étroits)
  // 'panel' : colonne de contexte à droite (à partir de 2xl)
  variant?: 'strip' | 'panel';
}

interface PerformedLine {
  name: string;
  value: string;
}

// Au-delà, ce n'est plus un retour qu'on lit : c'est un tableau qu'on ouvre
// dans le journal complet.
const MAX_LINES = 4;

/**
 * Ce que le client a réellement noté ce jour-là, exercice par exercice.
 *
 * Le coach écrivait « 4 × 10 » et n'apprenait jamais ce qui avait été fait :
 * seul le client, dans son propre historique, voyait ses 26 kg. La donnée
 * existait déjà dans l'instantané de la séance, elle n'était affichée nulle
 * part de ce côté-ci.
 */
const performedLines = (completed: CompletedSession): PerformedLine[] => {
  const lines: PerformedLine[] = [];

  [...completed.blocks]
    .sort((a, b) => a.order - b.order)
    .forEach((block) => {
      [...block.exercises]
        .sort((a, b) => a.order - b.order)
        .forEach((ex) => {
          const value = formatPerformed(ex.performed);
          if (!value) return;
          const name = ex.exercise?.name;
          lines.push({
            name: typeof name === 'string' ? name : 'Exercice',
            value,
          });
        });
    });

  return lines;
};

const PerformedList = ({ completed }: { completed: CompletedSession }) => {
  const lines = performedLines(completed);
  if (lines.length === 0) return null;

  const shown = lines.slice(0, MAX_LINES);
  const rest = lines.length - shown.length;

  return (
    <VStack align="stretch" gap={1.5} mt={1.5}>
      {/* Le nom au-dessus, la valeur en dessous : une saisie détaillée fait
          « 26 kg × 12 · 26 kg × 10 · 24 kg × 8 », qui ne tient sur aucune
          ligne partagée. Sur la même ligne, c'est le nom qui cédait — et un
          exercice réduit à « G. » ne se lit plus. */}
      {shown.map((line, i) => (
        <Box key={`${line.name}-${i}`}>
          <Text fontSize="xs" color="fg.muted" lineClamp={1}>
            {line.name}
          </Text>
          <Text fontSize="xs" fontFamily="mono" color="fg" lineClamp={2}>
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

export const SessionFeedbackStrip = ({
  history,
  variant = 'strip',
}: SessionFeedbackStripProps) => {
  const recent = [...history].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  if (variant === 'panel') {
    return (
      <Box
        borderWidth="1px"
        borderColor="whiteAlpha.100"
        borderRadius="lg"
        p={4}
      >
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

        {recent.length === 0 ? (
          <Text fontSize="xs" color="fg.muted">
            Cette séance n'a pas encore été faite.
          </Text>
        ) : (
          <VStack align="stretch" gap={4}>
            {/* L'axe reste : il répond d'un coup d'œil à « est-ce que ça
                dérive ? ». Le tableau qui l'accompagnait un temps est parti —
                trop dense pour ce que le coach y cherchait. */}
            <EffortTrend history={recent} />

            <VStack align="stretch" gap={3}>
              {recent.slice(0, 3).map((completed) => (
                <Box
                  key={completed._id}
                  borderLeftWidth="2px"
                  borderLeftColor="session.rest"
                  pl={3}
                >
                  <Text fontSize="xs" color="fg.muted">
                    {getRelativeDate(completed.completedAt)}
                  </Text>
                  {completed.clientNotes ? (
                    <Text
                      fontSize="xs"
                      color="fg"
                      fontStyle="italic"
                      mt={0.5}
                      whiteSpace="pre-wrap"
                    >
                      "{completed.clientNotes}"
                    </Text>
                  ) : (
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      fontStyle="italic"
                      mt={0.5}
                    >
                      Aucun commentaire
                    </Text>
                  )}
                  <PerformedList completed={completed} />
                </Box>
              ))}
            </VStack>
          </VStack>
        )}
      </Box>
    );
  }

  if (recent.length === 0) return null;
  const last = recent[0];
  const level = getEffortLevel(last.feedback?.effort);

  return (
    <Box
      bg="session.rest/10"
      borderLeftWidth="2px"
      borderLeftColor="session.rest"
      borderRadius="0 6px 6px 0"
      px={3}
      py={2}
      mb={3}
      fontSize="xs"
      color="fg.muted"
    >
      <HStack gap={2} flexWrap="wrap">
        <Text flexShrink={0}>{getRelativeDate(last.completedAt)} —</Text>
        {level && (
          <Text
            as="span"
            fontWeight="bold"
            color={EFFORT_ZONE_COLOR[level.zone]}
            flexShrink={0}
          >
            {level.label}
          </Text>
        )}
        {last.clientNotes ? (
          <Text as="span" fontStyle="italic" color="fg">
            "{last.clientNotes}"
          </Text>
        ) : (
          <Text as="span" fontStyle="italic">
            Aucun commentaire
          </Text>
        )}
      </HStack>
      <PerformedList completed={last} />
    </Box>
  );
};
