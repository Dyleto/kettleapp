import { HStack, Text, VStack } from '@chakra-ui/react';
import { Card, Ring } from '@/kit';
import {
  WeekBubbles,
  type WeekBubble,
} from '@/features/client/home/WeekBubbles';
import { useRingStart } from '@/features/client/home/ringMemory';

interface WeekCardProps {
  done: number;
  target: number;
  title: string;
  line: string;
  days: WeekBubble[];
}

/**
 * La semaine en un anneau et sept bulles.
 *
 * Remplace la bande « 0 faite · 3 prévues » : un compte qu'il fallait lire,
 * là où un anneau aux deux tiers se voit. Sans jour conseillé, pas
 * d'anneau — la semaine n'a pas d'objectif, et un anneau vide en inventerait
 * un. Plus de séances que prévu : l'anneau reste plein, le titre dit le vrai
 * nombre.
 *
 * Quand la semaine a changé depuis la dernière visite, l'anneau part de ce
 * qu'on avait vu et se remplit sous les yeux (`useRingStart`).
 */
export const WeekCard = ({
  done,
  target,
  title,
  line,
  days,
}: WeekCardProps) => {
  const part = target > 0 ? Math.min(1, done / target) : null;
  const from = useRingStart(part);
  return (
    <Card label="Ta semaine">
      <HStack gap={4}>
        {target > 0 && (
          <VStack
            role="img"
            aria-label={`${done} séance${done > 1 ? 's' : ''} sur ${target}`}
            flexShrink={0}
            data-week-ring
          >
            <Ring
              part={part ?? 0}
              from={from}
              size={76}
              stroke={13}
              color="var(--chakra-colors-session-rest)"
            >
              <Text
                fontFamily="heading"
                fontSize="25px"
                fontWeight="800"
                fontVariantNumeric="tabular-nums"
                aria-hidden
              >
                {done}/{target}
              </Text>
            </Ring>
          </VStack>
        )}
        <VStack align="start" gap={1}>
          <Text as="h2" fontSize="19px" fontWeight="800" lineHeight="1.2">
            {title}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {line}
          </Text>
        </VStack>
      </HStack>
      <WeekBubbles days={days} />
    </Card>
  );
};
