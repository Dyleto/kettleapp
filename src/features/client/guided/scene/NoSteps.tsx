import { Box, Button, Text } from '@chakra-ui/react';

/** Une séance sans exercice : rien à suivre, et une seule porte, celle par
 * où l'on est venu. Le coach peut avoir vidé une séance entre-temps. */
export const NoSteps = ({ onExit }: { onExit: () => void }) => (
  <Box
    role="dialog"
    aria-modal="true"
    aria-label="Aucun exercice à suivre"
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
    gap={4}
    textAlign="center"
  >
    <Text fontSize="lg" fontWeight="bold">
      Aucun exercice à suivre
    </Text>
    <Text fontSize="sm" color="fg.muted">
      Cette séance n'a pas d'exercices définis.
    </Text>
    <Button
      bg="app.primary"
      color="bg.canvas"
      fontWeight="bold"
      onClick={onExit}
    >
      Retour
    </Button>
  </Box>
);
