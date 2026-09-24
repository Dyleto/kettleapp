import { useOutletContext, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMemo } from 'react';
import { Container, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { Card } from '@/components/Card';
import { Session } from '@/types';
import {
  CLIENT_GRID_MAX_W,
  getSessionBlockTypes,
  getSessionSummary,
  SuggestedDays,
  useClientSessions,
} from '@/features/client';
import { CLIENT_ROUTES } from '@/config/routes';
import { EmptyState } from '@/components/EmptyState';
import { sessionTitle } from '@/features/program/sessionTitle';
import {
  matchSession,
  matchLabel,
  type SessionMatch,
} from '@/features/client/sessionMatch';

type ClientSessionsData = ReturnType<typeof useClientSessions>;

/**
 * The next session is the one carrying an action, and it is the card that
 * says so — a lighter surface and a coloured edge. Everything else reads
 * the same, because everything else is just as available.
 *
 * The status chips that used to sit here — "TERMINÉE", "À FAIRE", "À VENIR"
 * — said nothing you could act on. Worse, "TERMINÉE" was a claim about the
 * past drawn from an id that outlives an edit, so it was wrong as soon as
 * the coach rewrote a session. The card now carries the one fact that is
 * worth reading: when you last did this session, as it stands today.
 */
const NEXT_ACCENT = 'app.primary';
const PLAIN_ACCENT = 'fg.muted';

interface SessionRowProps {
  session: Session;
  isNext: boolean;
  match: SessionMatch;
  onSelect: () => void;
}

const SessionRow = ({ session, isNext, match, onSelect }: SessionRowProps) => (
  <Card
    accentColor={isNext ? NEXT_ACCENT : PLAIN_ACCENT}
    hoverEffect="border"
    withGlow={false}
    onClick={onSelect}
    p={4}
    bg={isNext ? 'bg.surface' : undefined}
  >
    <VStack align="stretch" gap={1.5}>
      <HStack justify="space-between" align="baseline" gap={2}>
        <Text fontWeight="bold" fontSize="sm">
          {sessionTitle(session.order, session.name)}
        </Text>
        {/* A date, not a badge. "Faite le 12 sept." is read once and tells
            you what a chip never could: whether it is time to come back to
            this one. */}
        <Text
          fontSize="xs"
          color={match.state === 'done' ? 'fg.muted' : 'fg.subtle'}
          flexShrink={0}
          textAlign="right"
        >
          {matchLabel(match)}
        </Text>
      </HStack>
      {/* The suggested day reads here because here is where you choose
            what to do — and in the exact form the coach set it. A session
            with no day renders nothing: the absence of a suggestion is not
            information worth showing. */}
      <SuggestedDays days={session.suggestedDays} withLabel />
      {session.blocks.length === 0 ? (
        <Text fontSize="xs" color="fg.muted">
          Aucun bloc pour cette séance.
        </Text>
      ) : (
        <>
          <Text fontSize="xs" color="fg.muted">
            {getSessionSummary(session)}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {getSessionBlockTypes(session)}
          </Text>
        </>
      )}
    </VStack>
  </Card>
);

const Program = () => {
  useDocumentTitle('Mon programme');
  const navigate = useNavigate();
  const { sessions, nextSession, history } =
    useOutletContext<ClientSessionsData>();

  // One pass over the history per session: the comparison walks the blocks,
  // so it is not free, and the list re-renders on every navigation.
  const matches = useMemo(
    () => new Map(sessions.map((s) => [s._id, matchSession(s, history)])),
    [sessions, history]
  );

  const handleSelect = (sessionId: string) => {
    navigate(CLIENT_ROUTES.sessionById(sessionId));
  };

  return (
    <Container maxW={CLIENT_GRID_MAX_W} py={6} px={4}>
      <VStack align="stretch" gap={4}>
        <Text as="h1" fontWeight="bold" fontSize="lg">
          Mon programme
        </Text>

        {sessions.length === 0 ? (
          <EmptyState
            title="Pas encore de programme"
            line="Ton coach n'a pas encore ajouté de séances. Reviens bientôt."
          />
        ) : (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
            {sessions.map((session) => (
              <SessionRow
                key={session._id}
                session={session}
                isNext={session._id === nextSession?._id}
                match={matches.get(session._id) ?? { state: 'never' }}
                onSelect={() => handleSelect(session._id)}
              />
            ))}
          </Grid>
        )}
      </VStack>
    </Container>
  );
};

export default Program;
