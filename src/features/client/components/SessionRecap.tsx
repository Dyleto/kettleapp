import { Box, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { LuArrowUp, LuArrowDown, LuCheck } from 'react-icons/lu';
import { Recap } from '../recap';

/**
 * Le constat, avant la question.
 *
 * Quarante minutes d'effort menaient à un formulaire, puis à un second, puis
 * à un toast. On demandait deux fois avant de donner quoi que ce soit. Ici on
 * récompense d'abord : ce qui suit — le ressenti — est la seule chose que
 * l'application ne peut pas trouver seule.
 *
 * Quatre chiffres au plus, et seulement ceux que la séance a réellement
 * produits : le tonnage ne veut rien dire sur un AMRAP au poids du corps, les
 * tours ne veulent rien dire sur du travail classique. Une grille fixe
 * afficherait des zéros, et un zéro affiché se lit comme un échec.
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

      {/* Le moteur, et de loin. `lastPerformance` est déjà chargé côté
          client : « ↑ +2 kg » ne coûte rien à calculer, et aucune application
          générique ne saurait le dire aussi bien — elle ne sait pas ce que le
          coach avait prescrit. */}
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
