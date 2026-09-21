import { Box, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { LuArrowUp, LuArrowDown, LuCheck } from 'react-icons/lu';
import { Recap } from '../recap';

/**
 * The statement of fact, before the question.
 *
 * Forty minutes of effort led to a form, then a second one, then a toast. We
 * asked twice before giving anything. Here we reward first: what follows —
 * how it felt — is the only thing the app cannot work out on its own.
 *
 * Four figures at most, and only the ones the session actually produced:
 * tonnage means nothing on a bodyweight AMRAP, rounds mean nothing on
 * classic work. A fixed grid would show zeros, and a displayed zero reads as
 * a failure.
 */
export const SessionRecap = ({
  recap,
  title,
}: {
  recap: Recap;
  title: string;
}) => {
  const figures: { value: string; label: string; accent?: boolean }[] = [];
  if (recap.durationMinutes)
    figures.push({
      value: `${recap.durationMinutes} min`,
      label: 'de séance',
    });
  if (recap.setsTotal > 0)
    figures.push({
      value: `${recap.setsDone}`,
      label:
        recap.setsDone === recap.setsTotal
          ? 'exercices, tous faits'
          : `exercices sur ${recap.setsTotal}`,
    });
  if (recap.tonnage > 0)
    figures.push({
      value: `${Math.round(recap.tonnage).toLocaleString('fr-FR')} kg`,
      label: 'soulevés en tout',
    });
  if (recap.rounds > 0)
    figures.push({
      value: `${recap.rounds} tour${recap.rounds > 1 ? 's' : ''}`,
      label: 'bouclés',
      accent: true,
    });

  return (
    <VStack align="stretch" gap={5}>
      <VStack align="start" gap={1.5}>
        <HStack gap={2.5}>
          <Box
            w="28px"
            h="28px"
            borderRadius="full"
            bg="session.rest"
            color="bg.canvas"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <LuCheck size={16} strokeWidth={3.5} />
          </Box>
          <Text fontSize="2xl" fontWeight="800">
            C'est fait.
          </Text>
        </HStack>
        <Text fontSize="sm" color="fg.muted">
          {title}
        </Text>
      </VStack>

      {figures.length > 0 && (
        <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={2.5}>
          {figures.map((f) => (
            <VStack
              key={f.label}
              align="start"
              gap={0.5}
              bg="surface.card"
              borderRadius="xl"
              px={4}
              py={3.5}
            >
              <Text
                fontSize="2xl"
                fontWeight="800"
                fontFamily="mono"
                color={f.accent ? 'app.primary' : 'fg'}
                lineHeight="1.1"
              >
                {f.value}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {f.label}
              </Text>
            </VStack>
          ))}
        </Grid>
      )}

      {/* The engine, by far. `lastPerformance` is already loaded on the
          client: "↑ +2 kg" costs nothing to compute, and no generic app can
          say it as well — it does not know what the coach had prescribed. */}
      {recap.comparisons.length > 0 && (
        <VStack align="stretch" gap={2.5}>
          <Text
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="wide"
            textTransform="uppercase"
            color="fg.muted"
          >
            Par rapport à la dernière fois
          </Text>
          {recap.comparisons.map((c) => (
            <HStack key={c.name} gap={3}>
              <Text fontSize="sm" flex={1} minW={0} lineClamp={1}>
                {c.name}
              </Text>
              <Text fontSize="sm" color="fg.muted" fontFamily="mono">
                {c.load} kg
              </Text>
              <Box w="62px" flexShrink={0} textAlign="right">
                {c.delta === undefined ? (
                  <Text fontSize="xs" color="fg.muted">
                    1re fois
                  </Text>
                ) : c.delta === 0 ? (
                  <Text fontSize="sm" color="fg.muted" fontFamily="mono">
                    =
                  </Text>
                ) : (
                  <HStack
                    gap={1}
                    justify="flex-end"
                    color={c.delta > 0 ? 'effort.target' : 'fg.muted'}
                  >
                    {c.delta > 0 ? (
                      <LuArrowUp size={13} strokeWidth={3} />
                    ) : (
                      <LuArrowDown size={13} strokeWidth={3} />
                    )}
                    <Text fontSize="sm" fontWeight="bold" fontFamily="mono">
                      {c.delta > 0 ? '+' : ''}
                      {c.delta} kg
                    </Text>
                  </HStack>
                )}
              </Box>
            </HStack>
          ))}
        </VStack>
      )}
    </VStack>
  );
};
