import { useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import {
  chakra,
  Container,
  Grid,
  GridItem,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import type { Session } from '@/shared/types';
import { CLIENT_GRID_MAX_W } from '@/features/client/shell/layout';
import { SuggestedDays } from '@/features/client/program/SuggestedDays';
import { useClientSessions } from '@/features/client/common/useClientSessions';
import { unfinishedSession } from '@/features/client/home/unfinished';
import { CLIENT_ROUTES } from '@/shared/config/routes';
import {
  Chip,
  type ChipTone,
  Composition,
  EmptyState,
  SlowNotice,
} from '@/kit';
import { sessionName } from '@/domain/session/name';
import {
  programLine,
  sessionState,
  type CardState,
  type CardTone,
} from '@/domain/session/programCard';
import { PullToRefresh } from '@/shared/components/PullToRefresh';
import { CLIENT_SCREEN } from '@/features/client/common/useClientSessions';

type ClientSessionsData = ReturnType<typeof useClientSessions>;

/** La couleur d'une pastille d'état : l'ambre pour ce qui attend
 * aujourd'hui ou sur ce téléphone, le sarcelle pour ce qui est fait. */
const TONE: Record<CardTone, ChipTone> = {
  local: 'amber',
  today: 'amber',
  done: 'teal',
  changed: 'neutral',
  never: 'outline',
};

/**
 * Une séance du programme, en carte : son nom, son état, ce qu'elle demande,
 * sa composition et ses jours.
 *
 * La carte entière est le bouton : elle ouvre la fiche de la séance. Le nom
 * tient en deux lignes, puis « … » — un nom long ne doit pas pousser
 * l'état hors de la carte.
 */
const ProgramCard = ({
  session,
  state,
  onOpen,
}: {
  session: Session;
  state: CardState;
  onOpen: () => void;
}) => {
  const line = programLine(session);
  return (
    <chakra.button
      type="button"
      onClick={onOpen}
      display="flex"
      flexDirection="column"
      alignItems="stretch"
      gap="9px"
      textAlign="left"
      bg="surface.card"
      borderRadius="card"
      px="18px"
      py="16px"
      _hover={{ bg: 'bg.raised' }}
      data-program-card={session._id}
      data-state={state.tone}
    >
      {/* La pastille passe sous le nom quand les deux ne tiennent pas
          côte à côte. Ils restaient sur une ligne quoi qu'il arrive :
          « Modifiée depuis ta dernière fois » ne se coupe pas, et à 320 px
          la carte dépassait l'écran de dix pixels (H1b). */}
      <HStack align="start" gap="8px" flexWrap="wrap">
        <Text
          fontWeight="800"
          fontSize="18px"
          lineClamp={2}
          flex="1 1 auto"
          minW={0}
        >
          {sessionName(session)}
        </Text>
        <Chip tone={TONE[state.tone]}>{state.label}</Chip>
      </HStack>
      <Text fontSize="sm" color="fg.muted">
        {line ?? 'Rien dedans pour l’instant'}
      </Text>
      <Composition blocks={session.blocks} />
      <SuggestedDays days={session.suggestedDays} />
    </chakra.button>
  );
};

/**
 * Le programme du client : toutes ses séances, dans l'ordre du coach.
 *
 * On y vient pour choisir une autre séance que celle du jour, ou pour voir
 * ce qui attend. L'ancien écran le disait mal : pas de durée, pas de
 * composition, une tranche colorée pour « la prochaine » et un « Faite le
 * 12 sept. » en petit. Chaque carte porte maintenant son état en pastille
 * (`sessionState`), dont « À faire aujourd'hui » et « En cours ».
 *
 * Pendant le chargement, six cartes fantômes : l'écran affichait « Ton
 * programme arrive » le temps que la requête revienne, et annonçait à un
 * client qui en avait un qu'il n'avait pas de programme. La panne est tenue
 * plus haut, par `ClientProgramBoundary`.
 */
const Program = () => {
  useDocumentTitle('Programme');
  const navigate = useNavigate();
  const { sessions, history, isLoading, coach } =
    useOutletContext<ClientSessionsData>();

  // L'enregistrement du téléphone : la séance laissée en cours, comme sur
  // l'accueil, relu quand le programme ou l'historique change.
  const unfinished = useMemo(
    () => unfinishedSession(sessions),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- relu quand l'historique change
    [sessions, history]
  );
  // Un passage sur l'historique par séance : la comparaison parcourt les
  // blocs, elle n'est donc pas gratuite, et la liste se redessine à chaque
  // navigation.
  const states = useMemo(
    () =>
      new Map(
        sessions.map((s) => [
          s._id,
          sessionState(s, history, {
            local:
              unfinished?.session._id === s._id ? unfinished.state : undefined,
          }),
        ])
      ),
    [sessions, history, unfinished]
  );

  const count = sessions.length;
  return (
    <Container maxW={CLIENT_GRID_MAX_W} py={6} px={4}>
      {/* Le programme que le coach vient de modifier. */}
      <PullToRefresh queries={CLIENT_SCREEN} />
      <VStack align="stretch" gap="16px">
        <HStack gap="12px">
          <Text
            as="h1"
            fontWeight="800"
            fontSize={{ base: '26px', md: '32px' }}
          >
            Programme
          </Text>
          {!isLoading && count > 0 && (
            <Chip>
              {count} séance{count > 1 ? 's' : ''}
            </Chip>
          )}
        </HStack>

        {isLoading ? (
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            gap="12px"
            aria-busy="true"
            aria-label="Chargement du programme"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} h="128px" borderRadius="card" />
            ))}
            <GridItem colSpan={999}>
              <SlowNotice />
            </GridItem>
          </Grid>
        ) : count === 0 ? (
          <EmptyState
            mood="sleep"
            title="Ton programme arrive"
            line={`${coach.opening} prépare tes séances. Elles apparaîtront ici, dans l'ordre où les faire.`}
          />
        ) : (
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
            gap={{ base: '12px', md: '16px' }}
          >
            {sessions.map((session) => (
              <ProgramCard
                key={session._id}
                session={session}
                state={
                  states.get(session._id) ?? {
                    tone: 'never',
                    label: 'Jamais faite',
                  }
                }
                onOpen={() => navigate(CLIENT_ROUTES.sessionById(session._id))}
              />
            ))}
          </Grid>
        )}
      </VStack>
    </Container>
  );
};

export default Program;
