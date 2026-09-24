import { FeedbackTag, SessionFeedback } from '@/types';
import {
  Box,
  Button,
  Dialog,
  HStack,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useState } from 'react';
import { AutoResizeTextarea } from '@/components/AutoResizeTextarea';
import { DateInput } from '@/components/DateInput';
import { hitArea } from '@/components/hitArea';
import { LuX } from 'react-icons/lu';
import { EffortScale } from './EffortScale';
import { FeedbackTags } from './FeedbackTags';
import { useAuth } from '@/contexts/useAuth';

interface CompleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * The statement of fact that precedes the question.
   *
   * Absent when the session was not run in guided mode — there is then
   * nothing to state, and an empty recap would be worth less than no recap.
   */
  recap?: React.ReactNode;
  /**
   * True when the client recorded their loads during the session.
   *
   * We then did not put the question again at the end — and a screen that is
   * skipped without a word suggests the entry has been lost.
   */
  chargesDejaNotees?: boolean;
  onSubmit: (
    feedback: SessionFeedback,
    notes: string,
    completedAt?: string
  ) => void;
  isLoading?: boolean;
}

const toDateInputValue = (d: Date) => d.toISOString().slice(0, 10);

export const CompleteSessionModal = ({
  isOpen,
  onClose,
  recap,
  chargesDejaNotees,
  onSubmit,
  isLoading,
}: CompleteSessionModalProps) => {
  // Anyone who refused to share their health data is not offered the tags or
  // the comment: we do not ask for what we have no right to record. The
  // effort rating stays — it is a training measure.
  const { user } = useAuth();
  const partageSante = user?.healthConsent?.granted === true;

  const [effort, setEffort] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState<FeedbackTag[]>([]);
  const [notes, setNotes] = useState('');
  const [completedAt, setCompletedAt] = useState(toDateInputValue(new Date()));
  const [isDateOpen, setIsDateOpen] = useState(false);

  const handleClose = () => {
    setEffort(undefined);
    setTags([]);
    setNotes('');
    setCompletedAt(toDateInputValue(new Date()));
    setIsDateOpen(false);
    onClose();
  };

  const handleSubmit = () => {
    if (effort === undefined) return;
    const today = toDateInputValue(new Date());
    onSubmit(
      { effort, ...(tags.length > 0 ? { tags } : {}) },
      notes,
      completedAt !== today ? completedAt : undefined
    );
    handleClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        {/* The statement, the scale, the tags and the comment in one box:
            on a small screen it overflows, and it is "Valider" you lose at
            the bottom. The body scrolls, the header and footer hold.

            The dialog carries a 64 px margin top and bottom by default, and
            `maxH="90dvh"` knew nothing about it: the box was allowed 760 px
            inside 716 px of room, so it hung 44 px past its own margin — and
            in landscape, where those 128 px are a third of the screen,
            "Valider" left the viewport altogether.

            So the margin shrinks to 16 px where the screen is small, and the
            height is what is actually left rather than a fraction of the
            whole. A phone held upright gains 52 px of body from it. */}
        <Dialog.Content
          bg="bg.canvas"
          borderColor="whiteAlpha.100"
          borderWidth="1px"
          m={{ base: 4, md: 16 }}
          maxH={{
            base: 'calc(100dvh - 2rem)',
            md: 'calc(100dvh - 8rem)',
          }}
          display="flex"
          flexDirection="column"
        >
          {/* The statement comes before the question — but in the body, not
              in the header. A header is chrome: it does not shrink. The recap
              took all its room, and on a phone lying flat the body fell to
              32 px while "Valider" ended 162 px below the screen. What is
              long belongs to what scrolls. */}
          {!recap && (
            <Dialog.Header>
              <VStack align="start" gap={1}>
                <Dialog.Title>Cette séance, c'était&nbsp;?</Dialog.Title>
                <Text fontSize="sm" color="fg.muted" fontWeight="normal">
                  Ton ressenti aide ton coach à adapter la suite. C'est la seule
                  chose qu'on te demande.
                </Text>
              </VStack>
            </Dialog.Header>
          )}
          <Dialog.CloseTrigger
            aria-label="Fermer"
            display="flex"
            alignItems="center"
            justifyContent="center"
            minW="44px"
            minH="44px"
          >
            <LuX size={16} />
          </Dialog.CloseTrigger>

          <Dialog.Body overflowY="auto" minH={0} pt={recap ? 6 : undefined}>
            <VStack gap={4} align="stretch">
              {recap && (
                <>
                  {recap}
                  {/* This sentence belongs beside the statement it comments
                      on, and it belongs to what scrolls. In the footer it
                      claimed a line of its own — `flexBasis="100%"` — on a
                      surface that never shrinks, and so took that line from
                      the body on every single session. */}
                  {chargesDejaNotees && (
                    <Text fontSize="xs" color="fg.muted" textAlign="center">
                      Tes charges sont déjà enregistrées&nbsp;— rien à
                      ressaisir.
                    </Text>
                  )}
                  <Separator borderColor="whiteAlpha.100" />
                  <Dialog.Title fontSize="lg" fontWeight="800">
                    Cette séance, c'était&nbsp;?
                  </Dialog.Title>
                </>
              )}
              <EffortScale value={effort} onChange={setEffort} />

              {partageSante && (
                <>
                  <Separator borderColor="whiteAlpha.100" />

                  <Box>
                    <Text fontSize="sm" color="fg.muted" mb={2}>
                      Quelque chose à signaler&nbsp;? (facultatif)
                    </Text>
                    <FeedbackTags value={tags} onChange={setTags} />
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="fg.muted" mb={2}>
                      Commentaire (facultatif)
                    </Text>
                    <AutoResizeTextarea
                      aria-label="Commentaire sur la séance"
                      placeholder="Ex : bonne séance, un peu difficile sur les derniers rounds..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      size="sm"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      _focus={{ borderColor: 'app.primary.border' }}
                    />
                  </Box>
                </>
              )}

              <Separator borderColor="whiteAlpha.100" />

              {/* Folded away: nine times out of ten the session happened
                  today, and the field sat between the comment and the confirm
                  button for a rare case. */}
              {/* The row keeps its height open or closed, so unfolding costs
                  nothing. Two things make that true: the label sits beside
                  the field rather than above it, and the row reserves the
                  field's height while still folded. Stacked and unreserved,
                  one tap added 48 px to a body that already scrolled — the
                  whole wrap-up jumped under your thumb, which is what you
                  notice, far more than the scrollbar itself. */}
              <HStack justify="center" gap={2} flexWrap="wrap" minH="44px">
                {isDateOpen ? (
                  <>
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      letterSpacing="wide"
                      flexShrink={0}
                    >
                      Fait le
                    </Text>
                    <Box maxW="180px">
                      <DateInput
                        ariaLabel="Date de réalisation de la séance"
                        value={completedAt}
                        max={toDateInputValue(new Date())}
                        onChange={setCompletedAt}
                      />
                    </Box>
                  </>
                ) : (
                  <Box
                    as="button"
                    aria-expanded={false}
                    onClick={() => setIsDateOpen(true)}
                    fontSize="xs"
                    color="fg.muted"
                    _hover={{ color: 'app.primary' }}
                    css={hitArea(32)}
                  >
                    Ce n'était pas aujourd'hui&nbsp;?
                  </Box>
                )}
              </HStack>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer gap={3} flexWrap="wrap" flexShrink={0}>
            {/* A greyed-out button with no explanation looks broken. We say
                what is missing, next to what will not go — and short enough
                to share the line with it. "Choisis un cran pour valider."
                wrapped the footer onto a second row at 390 px, and a footer
                does not scroll: that row came straight out of the body. The
                greyed "Valider" beside it carries the rest of the sentence. */}
            {effort === undefined && (
              <Text fontSize="xs" color="fg.muted" mr="auto" flexShrink={0}>
                Choisis un cran.
              </Text>
            )}
            <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
              Annuler
            </Button>
            {/* The form's only required field, and genuinely so:
                preselecting "3" would record a value the client never chose,
                and it would feed the trend the coach reads. */}
            <Button
              bg="app.primary"
              color="bg.canvas"
              fontWeight="bold"
              onClick={handleSubmit}
              disabled={effort === undefined}
              loading={isLoading}
            >
              Valider
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
