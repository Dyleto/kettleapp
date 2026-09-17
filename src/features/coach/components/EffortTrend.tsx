import { Box, HStack, Text, VStack, Wrap } from '@chakra-ui/react';
import { getRelativeDate } from '@/features/client';
import { CompletedSession, FeedbackTag } from '@/types';
import {
  EFFORT_LEVELS,
  EFFORT_ZONE_COLOR,
  FEEDBACK_TAG_LABELS,
  getEffortLevel,
} from '@/features/client/constants';

interface EffortTrendProps {
  /** Déjà filtré sur une seule séance : comparer l'effort d'un Tabata à celui
   *  d'un échauffement ne veut rien dire. */
  history: CompletedSession[];
  /** Nombre de passages retenus pour la lecture. */
  limit?: number;
}

type Drift = 'harder' | 'easier' | null;

/**
 * Une dérive n'est signalée que si elle est nette : au moins trois passages
 * notés, aucune inversion de sens, et une amplitude d'au moins deux niveaux.
 * Le reste, c'est du bruit — et un coach qui voit une alerte pour du bruit
 * cesse de les lire.
 */
const detectDrift = (efforts: number[]): Drift => {
  if (efforts.length < 3) return null;
  const first = efforts[0];
  const last = efforts[efforts.length - 1];
  if (
    last - first >= 2 &&
    efforts.every((v, i) => i === 0 || v >= efforts[i - 1])
  )
    return 'harder';
  if (
    first - last >= 2 &&
    efforts.every((v, i) => i === 0 || v <= efforts[i - 1])
  )
    return 'easier';
  return null;
};

const countTags = (sessions: CompletedSession[]) => {
  const counts = new Map<FeedbackTag, number>();
  sessions.forEach((s) =>
    (s.feedback?.tags ?? []).forEach((tag) =>
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    )
  );
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

export const EffortTrend = ({ history, limit = 5 }: EffortTrendProps) => {
  // Du plus ancien au plus récent : une tendance se lit dans le sens du temps.
  const chronological = [...history]
    .sort(
      (a, b) =>
        new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )
    .slice(-limit);

  const rated = chronological.filter((c) => c.feedback?.effort !== undefined);
  const efforts = rated.map((c) => c.feedback!.effort);
  const drift = detectDrift(efforts);
  const lastLabel =
    getEffortLevel(rated[rated.length - 1]?.feedback?.effort)?.label ?? '—';
  const tags = countTags(rated);

  // Aucun passage noté : les bilans d'avant la refonte n'ont jamais porté la
  // question. On le dit, on ne dessine pas une courbe vide.
  if (rated.length === 0) {
    return (
      <Text fontSize="xs" color="fg.muted">
        {chronological.length > 0
          ? 'Aucun ressenti comparable sur cette séance.'
          : "Cette séance n'a pas encore été faite."}
      </Text>
    );
  }

  return (
    <VStack align="stretch" gap={2}>
      {/* L'axe, avec ses propres étiquettes et la cible nommée au milieu.
          Les barres qu'il remplace encodaient le ressenti deux fois — par la
          hauteur et par la couleur — sans jamais dire que la hauteur voulait
          dire quelque chose. Ici la position EST l'échelle, et elle est
          écrite en dessous : rien à retenir. */}
      <Box position="relative" h="26px" mx="6px">
        <Box
          position="absolute"
          top="12px"
          left={0}
          right={0}
          h="1px"
          bg="whiteAlpha.200"
        />
        {/* Le repère du milieu porte la couleur du milieu de l'échelle, et
            non l'ambre de l'action : c'est une graduation, on ne clique pas
            dessus. Cette colonne n'apparaissait qu'au-delà de 1536 px, ce qui
            l'avait soustraite au désengorgement de l'ambre. */}
        <Box
          position="absolute"
          top="6px"
          left="50%"
          w="1px"
          h="13px"
          bg={EFFORT_ZONE_COLOR.target}
          opacity={0.55}
        />
        {rated.map((completed, i) => {
          const level = getEffortLevel(completed.feedback!.effort)!;
          const isLast = i === rated.length - 1;
          // 1 → 0 %, 5 → 100 %. Le point le plus récent est plein, les
          // précédents en retrait : on lit le sens de la marche.
          const left = ((level.value - 1) / 4) * 100;
          return (
            <Box
              key={completed._id}
              position="absolute"
              top={isLast ? '8px' : '10px'}
              left={`${left}%`}
              transform="translateX(-50%)"
              w={isLast ? '9px' : '6px'}
              h={isLast ? '9px' : '6px'}
              borderRadius="full"
              bg={EFFORT_ZONE_COLOR[level.zone]}
              opacity={isLast ? 1 : 0.42}
              title={`${level.label} — ${getRelativeDate(completed.completedAt)}`}
            />
          );
        })}
      </Box>

      {/* Les étiquettes viennent de EFFORT_LEVELS — l'ordre des valeurs
          stockées — et non de EFFORT_SCALE, qui est l'échelle *d'affichage*
          du client, renversée pour que « 1 » soit « Trop dure ». Les prendre
          là plaçait le point rouge sous « Trop facile ». Ici, la position et
          le mot viennent de la même source, et le plus dur est à droite :
          c'est le sens qu'annonce déjà la flèche de dérive. */}
      <HStack justify="space-between" fontSize="10px" color="fg.muted">
        <Text>{EFFORT_LEVELS[0].label}</Text>
        <Text color={EFFORT_ZONE_COLOR.target}>
          {EFFORT_LEVELS[Math.floor(EFFORT_LEVELS.length / 2)].label}
        </Text>
        <Text>{EFFORT_LEVELS[EFFORT_LEVELS.length - 1].label}</Text>
      </HStack>

      <HStack gap={2} justify="space-between" align="baseline">
        {/* Le mot, pas le chiffre. La suite « 3 → 4 » se lisait comme un code :
            rien à l'écran ne disait sur quelle échelle, ni dans quel sens. */}
        {/* L'axe ne porte que les passages notés ; le tableau en dessous
            montre les autres avec un tiret. On ne les compte donc plus ici. */}
        <Text fontSize="xs" color="fg.muted">
          {rated.length === 1
            ? `Dernier ressenti : ${lastLabel}`
            : drift
              ? `${rated.length} passages notés`
              : `${rated.length} passages notés — ${lastLabel} en dernier`}
        </Text>
        {drift && (
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={
              drift === 'harder'
                ? EFFORT_ZONE_COLOR.hard
                : EFFORT_ZONE_COLOR.easy
            }
            flexShrink={0}
          >
            {drift === 'harder'
              ? '↗ Devient trop dure'
              : '↘ Devient trop facile'}
          </Text>
        )}
      </HStack>

      {tags.length > 0 && (
        <Wrap gap={1.5}>
          {tags.map(([tag, count]) => (
            <Box
              key={tag}
              px={2}
              py={0.5}
              borderRadius="full"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              fontSize="xs"
              color="fg.muted"
            >
              {FEEDBACK_TAG_LABELS[tag]}
              {count > 1 && ` ×${count}`}
            </Box>
          ))}
        </Wrap>
      )}
    </VStack>
  );
};
