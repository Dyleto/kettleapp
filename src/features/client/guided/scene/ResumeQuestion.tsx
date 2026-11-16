import { Box, Button, Text, VStack } from '@chakra-ui/react';

/**
 * « Reprendre où tu en étais ? »
 *
 * Proposé, jamais imposé : un client qui veut vraiment recommencer ne doit
 * pas se retrouver prisonnier du milieu de la tentative précédente. Cette
 * question part avec C1 — la fiche et l'accueil disent déjà « Reprendre », et
 * la reposer ici est la redemander.
 */
export const ResumeQuestion = ({
  savedIndex,
  stepCount,
  keptCount,
  onResume,
  onRestart,
}: {
  savedIndex: number;
  stepCount: number;
  /** Les exercices dont une charge est gardée sur l'appareil. */
  keptCount: number;
  onResume: () => void;
  onRestart: () => void;
}) => (
  <Box
    role="dialog"
    aria-modal="true"
    aria-label="Reprendre où tu en étais ?"
    position="fixed"
    inset={0}
    zIndex={50}
    bg="bg.canvas"
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="safe center"
    overflowY="auto"
    py={6}
    px={8}
    gap={6}
    textAlign="center"
  >
    <Text fontSize="lg" fontWeight="bold">
      Reprendre où tu en étais&nbsp;?
    </Text>
    <Text fontSize="sm" color="fg.muted">
      Tu t'étais arrêté à l'étape {savedIndex + 1} sur {stepCount}.
      {/* Le dire explicitement : quelqu'un qui a noté ses charges puis fermé
          l'application n'a aucun moyen de savoir ce qui l'attend, et
          « Recommencer » devient un pari. */}
      {keptCount > 0 &&
        ` Tes charges sur ${keptCount} exercice${
          keptCount > 1 ? 's' : ''
        } sont gardées.`}
    </Text>
    <VStack gap={2} w="full" maxW="280px">
      <Button
        w="full"
        bg="app.primary"
        color="bg.canvas"
        fontWeight="bold"
        onClick={onResume}
      >
        Reprendre
      </Button>
      <Button w="full" variant="ghost" color="fg.muted" onClick={onRestart}>
        Recommencer depuis le début
      </Button>
    </VStack>
  </Box>
);
