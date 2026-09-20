import { Box, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { LuArrowUp, LuArrowDown, LuCheck } from 'react-icons/lu';
import { Recap } from '../recap';

/**
 * Le constat, avant la question.
 *
 * Quarante minutes d'effort menaient à un formulaire, puis à un second, puis
 * à un toast. On demandait deux fois avant de rien donner. Ici on récompense
 * d'abord : ce qui suit — le ressenti — est la seule chose que l'application
 * ne sait pas calculer toute seule.
 *
 * Quatre chiffres au plus, et seulement ceux que la séance a réellement
 * produits : le tonnage n'a aucun sens sur un AMRAP au poids du corps, les
 * tours n'en ont aucun sur du classique. Une grille fixe afficherait des
 * zéros, et un zéro affiché se lit comme un échec.
 */
export const RecapSeance = ({
  recap,
  titre,
}: {
  recap: Recap;
  titre: string;
}) => {
  const chiffres: { valeur: string; libelle: string; accent?: boolean }[] = [];
  if (recap.dureeMinutes)
    chiffres.push({
      valeur: `${recap.dureeMinutes} min`,
      libelle: 'de séance',
    });
  if (recap.effortsTotal > 0)
    chiffres.push({
      valeur: `${recap.effortsFaits}`,
      libelle:
        recap.effortsFaits === recap.effortsTotal
          ? 'efforts, tous faits'
          : `efforts sur ${recap.effortsTotal}`,
    });
  if (recap.tonnage > 0)
    chiffres.push({
      valeur: `${Math.round(recap.tonnage).toLocaleString('fr-FR')} kg`,
      libelle: 'soulevés en tout',
    });
  if (recap.tours > 0)
    chiffres.push({
      valeur: `${recap.tours} tour${recap.tours > 1 ? 's' : ''}`,
      libelle: 'bouclés',
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
          {titre}
        </Text>
      </VStack>

      {chiffres.length > 0 && (
        <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap={2.5}>
          {chiffres.map((c) => (
            <VStack
              key={c.libelle}
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
                color={c.accent ? 'app.primary' : 'fg'}
                lineHeight="1.1"
              >
                {c.valeur}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {c.libelle}
              </Text>
            </VStack>
          ))}
        </Grid>
      )}

      {/* Le moteur, et de loin. `lastPerformance` est déjà chargé côté client :
          « ↑ +2 kg » ne coûte rien à calculer, et aucune application générique
          ne peut le dire aussi bien — elle ne sait pas ce que le coach avait
          prescrit. */}
      {recap.comparaisons.length > 0 && (
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
          {recap.comparaisons.map((c) => (
            <HStack key={c.nom} gap={3}>
              <Text fontSize="sm" flex={1} minW={0} lineClamp={1}>
                {c.nom}
              </Text>
              <Text fontSize="sm" color="fg.muted" fontFamily="mono">
                {c.charge} kg
              </Text>
              <Box w="62px" flexShrink={0} textAlign="right">
                {c.ecart === undefined ? (
                  <Text fontSize="xs" color="fg.muted">
                    1re fois
                  </Text>
                ) : c.ecart === 0 ? (
                  <Text fontSize="sm" color="fg.muted" fontFamily="mono">
                    =
                  </Text>
                ) : (
                  <HStack
                    gap={1}
                    justify="flex-end"
                    color={c.ecart > 0 ? 'effort.target' : 'fg.muted'}
                  >
                    {c.ecart > 0 ? (
                      <LuArrowUp size={13} strokeWidth={3} />
                    ) : (
                      <LuArrowDown size={13} strokeWidth={3} />
                    )}
                    <Text fontSize="sm" fontWeight="bold" fontFamily="mono">
                      {c.ecart > 0 ? '+' : ''}
                      {c.ecart} kg
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
