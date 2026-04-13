import { CompletedSession } from "@/types";
import { SessionHistoryCard } from "./SessionHistoryCard";
import { Grid, Heading, Separator, VStack } from "@chakra-ui/react";

interface SessionHistoryProps {
  history: CompletedSession[];
}

export const SessionHistory = ({ history }: SessionHistoryProps) => {
  return (
    <VStack align="stretch" gap={4}>
      <Separator borderColor="whiteAlpha.100" />
      <Heading size="sm" color="gray.400">
        Séances complétées
      </Heading>
      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(3, 1fr)",
        }}
        gap={4}
        alignItems="start"
      >
        {history.map((c) => (
          <SessionHistoryCard key={c._id} completed={c} />
        ))}
      </Grid>
    </VStack>
  );
};
