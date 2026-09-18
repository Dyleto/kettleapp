import { useOutletContext, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useMemo } from 'react';
import { Box, Container, Grid, HStack, Text, VStack } from '@chakra-ui/react';
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
import { EtatVide } from '@/components/EtatVide';
import { sessionTitle } from '@/features/program/sessionTitle';

type ClientSessionsData = ReturnType<typeof useClientSessions>;
type SessionStatus = 'done' | 'next' | 'upcoming';

function getStatus(
  session: Session,
  nextSession: Session | undefined,
  completedSessionIds: Set<string>
): SessionStatus {
  if (session._id === nextSession?._id) return 'next';
  if (completedSessionIds.has(session._id)) return 'done';
  return 'upcoming';
}

/**
 * `bg` habille la pastille d'état ; `surface`, la carte entière.
 *
 * Cinq cartes de poids identique, dont seules la couleur d'une pastille et
 * celle d'un liseré de deux pixels changeaient : la seule qui porte une action
 * ne se voyait qu'après lecture. Elle se pose maintenant sur un fond plus
 * clair — la carte se distingue avant qu'on la lise.
 */
const STATUS_CONFIG: Record<
  SessionStatus,
  {
    label: string;
    color: string;
    textColor: string;
    bg: string;
    surface?: string;
  }
> = {
  done: {
    label: 'Terminée',
    color: 'session.rest',
    textColor: 'session.rest.fg',
    bg: 'session.rest/16',
  },
  next: {
    label: 'À faire',
    color: 'app.primary',
    textColor: 'app.primary',
    bg: 'app.primary/16',
    surface: 'bg.surface',
  },
  upcoming: {
    label: 'À venir',
    color: 'fg.muted',
    textColor: 'fg.muted',
    bg: 'whiteAlpha.50',
  },
};

interface SessionRowProps {
  session: Session;
  status: SessionStatus;
  onSelect: () => void;
}

const SessionRow = ({ session, status, onSelect }: SessionRowProps) => {
  const config = STATUS_CONFIG[status];

  return (
    <Card
      accentColor={config.color}
      hoverEffect="border"
      withGlow={false}
      onClick={onSelect}
      p={4}
      bg={config.surface}
    >
      <VStack align="stretch" gap={1.5}>
        <HStack justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="sm">
            {sessionTitle(session.order, session.name)}
          </Text>
          <Box
            px={2}
            py={0.5}
            borderRadius="full"
            bg={config.bg}
            fontSize="xs"
            fontWeight="bold"
            color={config.textColor}
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {config.label}
          </Box>
        </HStack>
        {/* Le jour conseillé se lit ici parce que c'est ici qu'on choisit
            quoi faire — et sous la forme exacte où le coach l'a posé. Une
            séance sans jour ne rend rien : l'absence de conseil n'est pas
            une information à afficher. */}
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
};

const Program = () => {
  useDocumentTitle('Mon programme');
  const navigate = useNavigate();
  const { sessions, nextSession, history } =
    useOutletContext<ClientSessionsData>();

  const completedSessionIds = useMemo(
    () => new Set(history.map((h) => h.originalSessionId)),
    [history]
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
          <EtatVide
            titre="Pas encore de programme"
            phrase="Ton coach n'a pas encore ajouté de séances. Reviens bientôt."
          />
        ) : (
          <>
            <Text fontSize="xs" color="fg.muted">
              {sessions.length} séance{sessions.length > 1 ? 's' : ''} ·{' '}
              {completedSessionIds.size} complétée
              {completedSessionIds.size > 1 ? 's' : ''}
            </Text>
            <Grid
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
              gap={3}
            >
              {sessions.map((session) => (
                <SessionRow
                  key={session._id}
                  session={session}
                  status={getStatus(session, nextSession, completedSessionIds)}
                  onSelect={() => handleSelect(session._id)}
                />
              ))}
            </Grid>
          </>
        )}
      </VStack>
    </Container>
  );
};

export default Program;
