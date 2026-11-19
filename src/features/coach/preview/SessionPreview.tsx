import { useEffect, useRef, useState } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import type { Session } from '@/shared/types';
import { COACH_ROUTES } from '@/shared/config/routes';
import { isPreviewReady, type PreviewMessage } from './messages';

/** Le téléphone du client : celui sur lequel le banc lit tous les défauts
 * qu'il a trouvés, un iPhone 14. */
const PHONE = { width: 390, height: 844 };
/** L'échelle qui le fait tenir dans la colonne de droite, bord compris :
 * 283 px de large sur les 300 qu'elle a. */
const SCALE = 0.7;

/**
 * L'aperçu « vu par le client » : la séance guidée sur le bloc qu'on
 * modifie, telle qu'elle s'affichera sur le téléphone du client.
 *
 * Une iframe à la taille d'un téléphone, réduite à l'échelle : les scènes
 * se mettent en page d'après la taille de leur fenêtre, et celle-ci est
 * un téléphone. La séance lui est envoyée à chaque changement, frappe
 * comprise ; elle ne charge rien elle-même.
 *
 * Inerte : rien ne s'y clique ni ne s'y atteint au clavier, et un lecteur
 * d'écran n'y entre pas — c'est une image de ce que verra le client, pas un
 * second atelier. La phrase dessous dit ce qu'elle suit.
 */
export const SessionPreview = ({
  session,
  blockId,
  viewer,
}: {
  session: Session;
  /** Le bloc que le coach a touché en dernier ; le premier tant qu'aucun,
   * ou quand celui-là n'est plus dans la séance. */
  blockId: string | null;
  /** « Sarah » ; « le client » dans un modèle. */
  viewer: string;
}) => {
  const blockOrder =
    (session.blocks.find((b) => b._id === blockId) ?? session.blocks[0])
      ?.order ?? 1;
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // `inert` n'existe pas encore pour React 18 : il se pose sur le nœud.
  useEffect(() => {
    boxRef.current?.setAttribute('inert', '');
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (isPreviewReady(event.data)) setReady(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const message: PreviewMessage = {
      type: 'kettle:preview',
      session,
      blockOrder,
    };
    frameRef.current?.contentWindow?.postMessage(
      message,
      window.location.origin
    );
  }, [ready, session, blockOrder]);

  return (
    <VStack align="stretch" gap="12px" data-session-preview>
      <Text
        fontSize="xs"
        fontWeight="700"
        letterSpacing="0.08em"
        textTransform="uppercase"
        color="fg.muted"
        textAlign="center"
      >
        {/* Le nom de la bascule qui l'ouvre, puis pour qui : un onglet et
            ce qu'il montre portent le même nom. */}
        Aperçu — vu par {viewer}
      </Text>
      {/* Un bord autour, comme un téléphone : le liseré posé à l'intérieur
          passait sous l'iframe, et l'aperçu se fondait dans la colonne. */}
      <Box
        ref={boxRef}
        aria-hidden
        alignSelf="center"
        p="5px"
        bg="bg.surface"
        borderRadius="33px"
      >
        <Box
          w={`${PHONE.width * SCALE}px`}
          h={`${PHONE.height * SCALE}px`}
          overflow="hidden"
          borderRadius="28px"
          bg="bg.canvas"
        >
          <iframe
            ref={frameRef}
            src={COACH_ROUTES.preview}
            title={`La séance vue par ${viewer}`}
            tabIndex={-1}
            style={{
              width: PHONE.width,
              height: PHONE.height,
              border: 0,
              transform: `scale(${SCALE})`,
              transformOrigin: '0 0',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>
      <Text fontSize="sm" color="fg.muted" textAlign="center">
        L’aperçu suit le bloc que tu modifies.
      </Text>
    </VStack>
  );
};
