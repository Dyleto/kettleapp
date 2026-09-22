import { useCallback, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Box,
  Button,
  Container,
  Grid,
  HStack,
  Text,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import { LuCheck, LuUserPlus } from 'react-icons/lu';
import {
  ClientPreview,
  ClientsList,
  COACH_CONTENT_MAX_W,
} from '@/features/coach';
import { Client } from '@/types';
import { useClients } from '@/features/coach/hooks/useClients';
import { useGenerateInvitation } from '@/features/coach/hooks/useGenerateInvitation';
import { useActiveInvitation } from '@/features/coach/hooks/useActiveInvitation';
import { InvitationLinkDialog } from '@/features/coach/components/InvitationLinkDialog';
import {
  linkExpiry,
  invitationLink,
  deliverLink,
} from '@/features/coach/invitation';
import { toaster } from '@/components/ui/toasterInstance';

const Clients = () => {
  const { data: clients = [] } = useClients();
  const { mutate: generateInvitation, isPending } = useGenerateInvitation();
  // Loaded when the list opens: the link has to be in hand *before* the
  // click, otherwise the network round-trip costs the user activation that
  // sharing and the clipboard both need.
  const { data: pending } = useActiveInvitation();
  const [isCopied, setIsCopied] = useState(false);
  const [toShow, setToShow] = useState<{
    link: string;
    expiresAt?: string;
  } | null>(null);

  /**
   * The preview only exists where there is room for it.
   *
   * Below 1280 px the list already takes the whole width: adding a column
   * would reduce it to a sliver. A click then opens the workshop directly,
   * as before.
   */
  const withPreview = useBreakpointValue({ base: false, xl: true }) ?? false;
  const [preview, setPreview] = useState<Client | null>(null);
  useDocumentTitle('Mes clients');

  /**
   * What happens once the link is in hand.
   *
   * The order follows what the coach actually wants to do: send the link to
   * someone. Where the phone knows how to open its share sheet, that is what
   * opens; otherwise we copy; and if the browser refuses both, we write the
   * link into a window that waits to be closed.
   *
   * That last case was the one missing. Kettle used to show the link in a
   * twenty-second banner, after which it was nowhere at all.
   */
  const sendOut = useCallback(async (link: string, expiresAt?: string) => {
    const outcome = await deliverLink(link);
    if (outcome === 'cancelled') return;
    if (outcome === 'failed') {
      setToShow({ link, expiresAt });
      return;
    }
    if (outcome === 'copied') {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
    const expiry = linkExpiry(expiresAt);
    toaster.create({
      type: 'success',
      title:
        outcome === 'shared'
          ? "Lien d'invitation partagé"
          : "Lien d'invitation copié",
      description: [
        outcome === 'shared'
          ? 'Votre client rejoindra votre suivi.'
          : 'Envoyez-le à votre client : il rejoindra votre suivi.',
        expiry,
      ]
        .filter(Boolean)
        .join(' '),
    });
  }, []);

  /**
   * Inviting is a single action: get a link and send it out.
   *
   * It used to go through a side drawer whose entire body was one button —
   * two clicks and a panel for an operation that has no settings at all. The
   * button now does what it says.
   *
   * The short path — a link already cached — waits for nothing: the share
   * fires straight off the click, its activation intact. The long path only
   * serves the very first client, and that is where the fallback window
   * earns its place.
   */
  const invite = () => {
    if (pending) {
      void sendOut(invitationLink(pending.token), pending.expiresAt);
      return;
    }
    generateInvitation(undefined, {
      onSuccess: ({ link, expiresAt }) => {
        void sendOut(link, expiresAt);
      },
    });
  };

  return (
    <Container
      maxW={withPreview ? '1400px' : COACH_CONTENT_MAX_W}
      py={8}
      px={4}
    >
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between" align="center" gap={3}>
          <VStack align="start" gap={0} minW={0}>
            <Text as="h1" fontWeight="bold" fontSize="lg">
              Mes clients
            </Text>
            {clients.length > 0 && (
              <Text fontSize="xs" color="fg.muted">
                {clients.length} client{clients.length > 1 ? 's' : ''}
              </Text>
            )}
          </VStack>
          <Button
            size="sm"
            flexShrink={0}
            bg={isCopied ? 'app.success' : 'app.primary'}
            color="bg.canvas"
            fontWeight="bold"
            _hover={{
              bg: isCopied ? 'app.success.hover' : 'app.primary.hover',
            }}
            onClick={invite}
            loading={isPending}
          >
            {isCopied ? (
              <>
                <LuCheck /> Lien copié
              </>
            ) : (
              <>
                <LuUserPlus /> Inviter
              </>
            )}
          </Button>
        </HStack>

        {/* No status row. It permanently took two lines before the first
            client, for one piece of information — the expiry date — and one
            action — "Recopier" — that the "Inviter" button already covers:
            the API recycles a link that is still valid, so clicking again
            copies the same one. */}

        {/* Between 30 and 55% of the window stayed empty: the list stopped at
            720 px and the rest served no purpose. The coach had to open the
            workshop — and so lose the list — to find out what was waiting at
            one client, then come back to move on to the next. */}
        {withPreview ? (
          <Grid
            templateColumns="minmax(0, 1fr) 420px"
            gap={8}
            alignItems="start"
          >
            <ClientsList onPreview={setPreview} selectedId={preview?._id} />
            <Box position="sticky" top="24px" minW={0}>
              <ClientPreview client={preview} />
            </Box>
          </Grid>
        ) : (
          <ClientsList />
        )}
      </VStack>

      <InvitationLinkDialog
        link={toShow?.link ?? null}
        expiresAt={toShow?.expiresAt}
        onClose={() => setToShow(null)}
      />
    </Container>
  );
};

export default Clients;
