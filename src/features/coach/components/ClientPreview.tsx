import { useState } from 'react';
import {
  Avatar,
  Box,
  chakra,
  HStack,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router';
import type { Client, CompletedSession } from '@/shared/types';
import { COACH_ROUTES } from '@/shared/config/routes';
import { useClientHistory } from '@/features/coach/hooks/useClientHistory';
import { HISTORY_PAGE_SIZE } from '@/features/coach/coach.service';
import { CompletedSheet } from '@/features/client';
import { ActionButton, Chip, type ChipTone, Eyebrow, LinkButton } from '@/kit';
import { EFFORT_ZONE_COLOR, getEffortLevel } from '@/domain/history/effort';
import type { EffortZone } from '@/domain/history/effort';
import { rowDate } from '@/domain/history/journal';
import { sessionName } from '@/domain/session/name';
import {
  clientName,
  followedSince,
  previewHeadline,
  weekSummary,
} from '@/domain/clients/roster';
import { EffortDots } from './EffortDots';

const ZONE_CHIP: Record<EffortZone, ChipTone> = {
  easy: 'blue',
  target: 'green',
  hard: 'coral',
};
const SHOWN = 3;

/** Une séance récente : son nom, sa date et le début de son mot ; le
 * ressenti en pastille. Elle s'ouvre en feuille, au « Son mot ». */
const RecentRow = ({
  completed,
  onOpen,
}: {
  completed: CompletedSession;
  onOpen: () => void;
}) => {
  const level = getEffortLevel(completed.feedback?.effort);
  const said = completed.clientNotes?.trim();
  return (
    <chakra.button
      type="button"
      onClick={onOpen}
      display="flex"
      alignItems="center"
      gap="12px"
      w="full"
      textAlign="left"
      px="16px"
      py="12px"
      borderTopWidth="1px"
      borderColor="line"
      _first={{ borderTopWidth: 0 }}
      _hover={{ bg: 'bg.surface' }}
      data-recent={completed._id}
    >
      <VStack align="start" gap="2px" flex={1} minW={0}>
        <Text fontWeight="700" truncate maxW="full">
          {completed.sessionName ||
            sessionName({
              order: completed.sessionOrder,
              name: completed.sessionName,
            })}
        </Text>
        <Text fontSize="sm" color="fg.muted" truncate maxW="full">
          {rowDate(completed.completedAt)}
          {said ? ` · « ${said} »` : ''}
        </Text>
      </VStack>
      {level ? (
        <Chip tone={ZONE_CHIP[level.zone]}>{level.label}</Chip>
      ) : (
        completed.metrics && <Chip tone="outline">ancien bilan</Chip>
      )}
    </chakra.button>
  );
};

/**
 * Le panneau d'un client, à droite de la liste sur grand écran : qui, depuis
 * quand, comment vont ses séances, et les trois dernières.
 *
 * L'aperçu d'avant tenait en un nom et des cartes de séance qui écrivaient
 * leurs formats et cachaient le mot du client derrière « Voir le détail ».
 * La maquette pose en tête ce qu'un coach vient chercher avant d'ouvrir
 * l'atelier — la tendance, en points et en une phrase, et la semaine — puis
 * les dernières séances, une ligne chacune, le mot du client compris.
 *
 * La tendance et la semaine viennent de la ligne de la liste : le panneau
 * ne contredit pas ce qu'elle vient de dire. Les séances viennent de
 * l'historique, qui arrive par sa propre requête.
 */
export const ClientPreview = ({ client }: { client: Client | null }) => {
  const navigate = useNavigate();
  const historyQuery = useClientHistory(client?._id ?? '');
  const history = historyQuery.data ?? [];
  const [openedId, setOpenedId] = useState<string | null>(null);

  if (!client) {
    return (
      <Text fontSize="sm" color="fg.muted">
        Choisis un client : son aperçu s’affiche ici, sans quitter la liste.
      </Text>
    );
  }

  const name = clientName(client);
  const loaded = historyQuery.isSuccess;
  const headline = previewHeadline(client);
  const opened = history.find((c) => c._id === openedId) ?? null;

  return (
    <VStack align="stretch" gap="16px" data-client-preview={client._id}>
      <HStack gap="12px">
        <Avatar.Root w="48px" h="48px" flexShrink={0}>
          <Avatar.Fallback name={name} />
          {client.picture && <Avatar.Image alt="" src={client.picture} />}
        </Avatar.Root>
        <VStack align="start" gap="2px" minW={0}>
          <Text as="h2" fontWeight="800" fontSize="20px" truncate maxW="full">
            {name}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {followedSince(client.linkedAt, new Date())}
          </Text>
        </VStack>
      </HStack>

      <ActionButton
        size="md"
        w="full"
        onClick={() => navigate(COACH_ROUTES.clientSession(client._id, 1))}
      >
        Ouvrir son programme
      </ActionButton>

      <VStack
        align="stretch"
        gap="8px"
        bg="bg.raised"
        borderRadius="18px"
        p="16px"
        data-preview-pulse
      >
        <HStack gap="10px" wrap="wrap">
          {client.recentEfforts.length > 0 && (
            <EffortDots
              zones={client.recentEfforts.map(
                (e) => getEffortLevel(e)?.zone ?? null
              )}
              size="lg"
            />
          )}
          <Text
            fontWeight="800"
            color={headline.tone ? EFFORT_ZONE_COLOR[headline.tone] : 'fg'}
          >
            {headline.text}
          </Text>
        </HStack>
        <Text fontSize="sm" color="fg.muted">
          {weekSummary(
            client,
            loaded
              ? {
                  total: history.length,
                  complete: history.length < HISTORY_PAGE_SIZE,
                }
              : undefined
          )}
        </Text>
      </VStack>

      <VStack align="stretch" gap="8px">
        <Eyebrow>Dernières séances</Eyebrow>
        {historyQuery.isLoading ? (
          <VStack align="stretch" gap="6px">
            <Skeleton h="58px" borderRadius="14px" />
            <Skeleton h="58px" borderRadius="14px" />
          </VStack>
        ) : history.length === 0 ? (
          <Text fontSize="sm" color="fg.muted">
            Ses séances terminées apparaîtront ici, avec ce qui en a été dit.
          </Text>
        ) : (
          <Box
            bg="bg.raised"
            borderRadius="18px"
            overflow="hidden"
            data-recent-list
          >
            {history.slice(0, SHOWN).map((completed) => (
              <RecentRow
                key={completed._id}
                completed={completed}
                onOpen={() => setOpenedId(completed._id)}
              />
            ))}
          </Box>
        )}
      </VStack>

      {history.length > 0 && (
        <LinkButton
          alignSelf="start"
          color="app.primary"
          onClick={() => navigate(COACH_ROUTES.clientJournal(client._id))}
        >
          Tous ses ressentis
        </LinkButton>
      )}

      {opened && (
        <CompletedSheet
          completed={opened}
          history={history}
          viewer="coach"
          onClose={() => setOpenedId(null)}
        />
      )}
    </VStack>
  );
};
