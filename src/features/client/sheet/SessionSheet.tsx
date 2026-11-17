import { useMemo, useState } from 'react';
import { Box, Container, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { LuArrowLeft, LuPlay } from 'react-icons/lu';
import type { BlockExercise, CompletedSession, Session } from '@/shared/types';
import type { LastPerformance } from '@/domain/history/lastPerformance';
import { bestLoads } from '@/domain/history/records';
import {
  distinctExerciseCount,
  estimatedMinutes,
} from '@/domain/session/measure';
import { sessionName } from '@/domain/session/name';
import { formatSuggestedDays } from '@/domain/week/dates';
import { ActionButton, Chip, hitArea, LinkButton } from '@/kit';
import { CoachBubble } from '@/features/client/common/CoachBubble';
import {
  CLIENT_CONTENT_MAX_W,
  CLIENT_GRID_MAX_W,
} from '@/features/client/shell/layout';
import { BlockDetailCard } from './BlockDetailCard';
import { DeclareSheet } from './DeclareSheet';
import { InstructionSheet } from './InstructionSheet';

interface SessionSheetProps {
  session: Session;
  /** Où ramène la flèche : « Aujourd'hui » ou « Programme ». */
  backLabel: string;
  onBack: () => void;
  lastPerformance?: Map<string, LastPerformance>;
  history: readonly CompletedSession[];
  /** Commencée sur ce téléphone : le bouton dit « Reprendre ». */
  started: boolean;
  onStart: () => void;
  /**
   * Finie sur ce téléphone, pas encore envoyée : le bouton principal dit ce
   * qui reste à faire — « Dire comment c'était », « Envoyer maintenant » —
   * et remplace « Démarrer ».
   */
  ending?: { label: string; onClick: () => void };
  /** « Je l'ai déjà faite », à cette date. */
  onDeclared: (date?: string) => void;
}

/**
 * La fiche d'une séance : ce qui attend, avant de commencer.
 *
 * Elle partageait son fichier avec tout l'enchaînement de fin — six écrans
 * qui ne s'affichent qu'une fois la séance faite — et ses états avec eux. Elle
 * ne connaît plus que ce qu'elle montre : le nom, la durée, les blocs, la
 * consigne d'un mouvement en feuille, et les deux portes — « Démarrer » et
 * « Je l'ai déjà faite ».
 */
export const SessionSheet = ({
  session,
  backLabel,
  onBack,
  lastPerformance,
  history,
  started,
  onStart,
  ending,
  onDeclared,
}: SessionSheetProps) => {
  /** La consigne ouverte en feuille, s'il y en a une. */
  const [instruction, setInstruction] = useState<BlockExercise | null>(null);
  /** La feuille « Je l'ai déjà faite ». */
  const [declaring, setDeclaring] = useState(false);
  // Le record de chaque mouvement, pour la feuille de consigne : la série
  // la plus lourde de tout l'historique, comme à la fin d'une séance.
  const records = useMemo(() => bestLoads(history), [history]);

  const hasExercises = session.blocks.some((b) => b.exercises.length > 0);
  const blocks = [...session.blocks].sort((a, b) => a.order - b.order);
  const exerciseCount = distinctExerciseCount(session);
  const days = formatSuggestedDays(session.suggestedDays);
  const note = session.notes?.trim();

  const head = (
    <VStack align="stretch" gap="14px">
      <Text
        as="h1"
        fontSize="32px"
        fontWeight="800"
        lineHeight="1.1"
        letterSpacing="-0.01em"
        fontStretch="88%"
      >
        {sessionName(session)}
      </Text>
      <HStack gap="6px" wrap="wrap">
        {hasExercises && (
          <Chip tone="amber">≈&nbsp;{estimatedMinutes(session)}&nbsp;min</Chip>
        )}
        {days && <Chip>Conseillée {days}</Chip>}
        <Chip tone="outline">
          {blocks.length}&nbsp;bloc{blocks.length > 1 ? 's' : ''} ·{' '}
          {exerciseCount}&nbsp;exercice{exerciseCount > 1 ? 's' : ''}
        </Chip>
      </HStack>
      {note && <CoachBubble>{note}</CoachBubble>}
    </VStack>
  );

  // Le pied : « Démarrer » d'abord, « Je l'ai déjà faite » en lien discret —
  // ce n'est pas le chemin normal, et il ne se présente plus comme tel.
  const actions = (
    <VStack align="stretch" gap={1}>
      {ending ? (
        // Faite : ni « Démarrer », ni « Je l'ai déjà faite ».
        <ActionButton size="lg" w="full" onClick={ending.onClick}>
          {ending.label}
        </ActionButton>
      ) : (
        <>
          {hasExercises && (
            <ActionButton size="lg" w="full" onClick={onStart}>
              <LuPlay size={18} fill="currentColor" aria-hidden />
              {started ? 'Reprendre' : 'Démarrer'}
            </ActionButton>
          )}
          <LinkButton py={2} onClick={() => setDeclaring(true)}>
            Je l&rsquo;ai déjà faite
          </LinkButton>
        </>
      )}
    </VStack>
  );

  return (
    <Container
      maxW={{ base: CLIENT_CONTENT_MAX_W, lg: CLIENT_GRID_MAX_W }}
      py={6}
      px={4}
      pb={{ base: '190px', lg: 8 }}
    >
      {/* On revient d'où l'on vient : l'accueil ou le programme. Un vrai
          bouton, atteignable au clavier. */}
      <Box
        as="button"
        aria-label={`Revenir à ${backLabel}`}
        w="fit-content"
        mb={4}
        css={hitArea()}
        onClick={() => onBack()}
        color="fg.muted"
        _hover={{ color: 'app.primary' }}
        transition="color 0.15s"
      >
        <HStack gap={1.5}>
          <LuArrowLeft size={14} />
          <Text fontSize="sm" fontWeight="medium">
            {backLabel}
          </Text>
        </HStack>
      </Box>

      <Grid
        gap={4}
        templateColumns={{ base: '1fr', lg: '1.5fr 1fr' }}
        templateAreas={{ base: '"head" "blocks"', lg: '"blocks head"' }}
        alignItems="start"
      >
        <VStack
          gridArea="head"
          align="stretch"
          gap={4}
          position={{ lg: 'sticky' }}
          top={{ lg: 6 }}
          bg={{ lg: 'surface.card' }}
          borderRadius={{ lg: 'card' }}
          p={{ lg: '18px' }}
        >
          {head}
          <Box display={{ base: 'none', lg: 'block' }}>{actions}</Box>
        </VStack>
        <VStack gridArea="blocks" align="stretch" gap={3}>
          {blocks.map((block) => (
            <BlockDetailCard
              key={block._id ?? block.order}
              block={block}
              lastPerformance={lastPerformance}
              onOpenExercise={setInstruction}
            />
          ))}
          {blocks.length === 0 && (
            <Text color="fg.muted" textAlign="center" py={6}>
              Aucun bloc dans cette séance.
            </Text>
          )}
        </VStack>
      </Grid>

      {/* Au téléphone, le pied reste collé en bas ; les blocs défilent
          dessous. Ancré au bas de l'écran et non à la barre d'onglets, dont
          la hauteur dépend de la zone sûre du téléphone. */}
      <Box
        display={{ base: 'block', lg: 'none' }}
        position="fixed"
        left={0}
        right={0}
        bottom={0}
        bg="bg.canvas"
        borderTop="1px solid"
        borderColor="line"
        px={4}
        pt={3}
        pb="calc(env(safe-area-inset-bottom, 0px) + 74px)"
        zIndex={20}
      >
        <Box maxW={CLIENT_CONTENT_MAX_W} mx="auto">
          {actions}
        </Box>
      </Box>

      {instruction && (
        <InstructionSheet
          entry={instruction}
          last={lastPerformance?.get(instruction.exercise._id)}
          record={records.get(instruction.exercise._id)}
          onClose={() => setInstruction(null)}
        />
      )}

      {declaring && (
        <DeclareSheet
          onClose={() => setDeclaring(false)}
          onContinue={(date) => {
            setDeclaring(false);
            onDeclared(date);
          }}
        />
      )}
    </Container>
  );
};
