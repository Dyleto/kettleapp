import { Box, chakra, HStack, Text, VStack } from '@chakra-ui/react';
import { Chip } from '@/kit';
import { getRelativeDate } from '@/domain/week/dates';
import { EFFORT_ZONE_COLOR } from '@/domain/history/effort';
import {
  pulseHeadline,
  tagLabel,
  type SessionPulse as Pulse,
} from '@/domain/history/pulse';
import { EffortDots } from './EffortDots';

interface SessionPulseProps {
  pulse: Pulse;
  /** Sur téléphone : la phrase et les points, sans le reste. */
  compact?: boolean;
  /** Ouvre les passages, là où aucune colonne ne les montre déjà. */
  onOpen?: () => void;
  /** Le nom du bouton, quand la carte en est un : « Ressentis de la
   * séance 1 ». */
  openLabel?: string;
}

/**
 * Le pouls de la séance, sous son en-tête : les cinq derniers ressentis, ce
 * qu'ils disent, et ce que le client a écrit.
 *
 * Un bandeau gris le portait au-dessus du titre, avec un axe gradué de
 * « Trop facile » à « Trop dure » qu'il fallait lire, puis compter. La
 * maquette en fait une phrase — « Devient trop dure depuis deux passages » —
 * à côté des mêmes points que le rail : le coach lit la même chose aux deux
 * endroits.
 *
 * Rien pour une séance jamais faite : le rail le dit déjà, et une carte vide
 * au-dessus des blocs pousserait le programme vers le bas pour rien.
 */
export const SessionPulse = ({
  pulse,
  compact = false,
  onOpen,
  openLabel,
}: SessionPulseProps) => {
  if (pulse.passages === 0) return null;
  const headline = pulseHeadline(pulse);
  const tone = headline.tone ? EFFORT_ZONE_COLOR[headline.tone] : 'fg.muted';
  const word = pulse.lastWord;

  const body = compact ? (
    <VStack align="stretch" gap="6px">
      <Text fontSize="sm">
        <chakra.b color={tone}>{headline.text}.</chakra.b>
        {word && <chakra.span color="fg.muted"> « {word.note} »</chakra.span>}
      </Text>
      <EffortDots zones={pulse.zones} />
    </VStack>
  ) : (
    <HStack align="center" gap="18px">
      <VStack align="start" gap="6px" flexShrink={0}>
        <Text
          fontSize="xs"
          fontWeight="700"
          letterSpacing="0.08em"
          textTransform="uppercase"
          color="fg.muted"
        >
          {pulse.passages} passage{pulse.passages > 1 ? 's' : ''}
        </Text>
        <EffortDots zones={pulse.zones} size="lg" />
      </VStack>
      <VStack align="stretch" gap="6px" flex={1} minW={0}>
        <Text fontSize="sm">
          <chakra.b color={tone}>{headline.text}</chakra.b>
          {headline.since && ` ${headline.since}`}.
          {word && (
            <chakra.span color="fg.muted">
              {' '}
              {getRelativeDate(word.at)} : « {word.note} »
            </chakra.span>
          )}
        </Text>
        {(pulse.tags.length > 0 || pulse.unread > 0) && (
          <HStack gap="6px" wrap="wrap">
            {pulse.tags.map((tag) => (
              <Chip
                key={tag.tag}
                tone={tag.tag === 'pain' ? 'coral' : 'outline'}
              >
                {tagLabel(tag)}
              </Chip>
            ))}
            {pulse.unread > 0 && (
              <Chip tone="teal">
                {pulse.unread} séance{pulse.unread > 1 ? 's' : ''} à lire
              </Chip>
            )}
          </HStack>
        )}
      </VStack>
    </HStack>
  );

  const frame = {
    bg: 'bg.surface',
    borderRadius: '18px',
    px: compact ? '16px' : '18px',
    py: compact ? '12px' : '14px',
  } as const;

  if (!onOpen)
    return (
      <Box {...frame} data-session-pulse>
        {body}
      </Box>
    );
  return (
    <chakra.button
      type="button"
      onClick={onOpen}
      // Le nom du geste, puis ce que la carte dit : seul, « Ressentis de la
      // séance 1 » taisait la dérive à qui ne voit pas la carte.
      aria-label={`${openLabel} — ${headline.text}${headline.since ? ` ${headline.since}` : ''}`}
      textAlign="left"
      w="full"
      {...frame}
      _hover={{ bg: 'bg.raised' }}
      data-session-pulse
    >
      {body}
    </chakra.button>
  );
};
