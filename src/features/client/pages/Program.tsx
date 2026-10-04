import { useOutletContext, useNavigate } from 'react-router';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { useMemo } from 'react';
import { Container, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { Card } from '@/shared/components/Card';
import { Session } from '@/shared/types';
import {
  CLIENT_GRID_MAX_W,
  getSessionBlockTypes,
  getSessionSummary,
  SuggestedDays,
  useClientSessions,
} from '@/features/client';
import { CLIENT_ROUTES } from '@/shared/config/routes';
import { EmptyState } from '@/shared/components/EmptyState';
import { sessionTitle } from '@/features/program/sessionTitle';
import {
  matchSession,
  matchLabel,
  type SessionMatch,
} from '@/features/client/sessionMatch';

type ClientSessionsData = ReturnType<typeof useClientSessions>;

/**
 * La prochaine séance est celle qui porte une action, et c'est la carte qui le
 * dit — une surface plus claire et une tranche colorée. Tout le reste se lit
 * pareil, parce que tout le reste est tout aussi disponible.
 *
 * Les pastilles d'état qui vivaient ici — « TERMINÉE », « À FAIRE », « À
 * VENIR » — ne disaient rien sur quoi agir. Pire, « TERMINÉE » était une
 * affirmation sur le passé tirée d'un identifiant qui survit à une
 * modification : elle devenait fausse dès que le coach réécrivait une séance.
 * La carte porte maintenant le seul fait qui vaille d'être lu : quand on a
 * fait cette séance pour la dernière fois, telle qu'elle est aujourd'hui.
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
        {/* Une date, pas une pastille. « Faite le 12 sept. » se lit une
            fois et dit ce qu'une pastille ne pouvait pas : s'il est temps de
            revenir à celle-là. */}
        <Text
          fontSize="xs"
          color={match.state === 'done' ? 'fg.muted' : 'fg.subtle'}
          flexShrink={0}
          textAlign="right"
        >
          {matchLabel(match)}
        </Text>
      </HStack>
      {/* Le jour conseillé se lit ici parce que c'est ici qu'on choisit
            quoi faire — et sous la forme exacte que le coach lui a donnée.
            Une séance sans jour ne rend rien : l'absence de conseil n'est pas
            une information qui mérite d'être affichée. */}
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

  // Un passage sur l'historique par séance : la comparaison parcourt les
  // blocs, elle n'est donc pas gratuite, et la liste se redessine à chaque
  // navigation.
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
