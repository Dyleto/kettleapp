import { useEffect, useRef, useState } from 'react';
import { Box, Portal, Text } from '@chakra-ui/react';
import { LuCheck, LuCopy, LuShare2 } from 'react-icons/lu';
import { ActionButton, Sheet } from '@/kit';
import { useSheetDismiss } from '@/features/workshop';
import {
  useActiveInvitation,
  validInvitation,
} from '@/features/coach/hooks/useActiveInvitation';
import { useGenerateInvitation } from '@/features/coach/hooks/useGenerateInvitation';
import { invitationLink, linkExpiry } from '@/features/coach/invitation';

/**
 * Inviter un client : le lien déjà prêt, sa validité, « Copier le lien » et
 * « Partager… ».
 *
 * « Inviter » faisait sortir le lien d'un coup — feuille de partage du
 * téléphone, sinon presse-papiers, sinon une boîte de repli —, sans jamais
 * le montrer : le coach ne savait ni ce qu'il envoyait, ni jusqu'à quand il
 * valait. La feuille le pose sous ses yeux, et les deux gestes sont à lui.
 *
 * Le lien est chargé avec la liste (`useActiveInvitation`) : copier ou
 * partager part du toucher même, sans aller-retour réseau qui ferait perdre
 * au navigateur l'« activation » qu'il exige pour l'un comme pour l'autre.
 * Expiré ou absent, un nouveau est créé à l'ouverture de la feuille.
 *
 * Si la copie échoue — contexte non sécurisé, permission retirée —, le lien
 * est sélectionné, et la feuille le dit : il ne disparaît pas.
 */
export const InviteSheet = ({ onClose }: { onClose: () => void }) => {
  useSheetDismiss(true, onClose);
  const active = useActiveInvitation();
  const generate = useGenerateInvitation();
  const valid = validInvitation(active.data);
  const link = valid ? invitationLink(valid.token) : null;
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const field = useRef<HTMLParagraphElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Expiré ou absent : un nouveau lien, une seule fois par ouverture.
  const { isIdle, mutate } = generate;
  const needed = active.isFetched && !valid;
  useEffect(() => {
    if (needed && isIdle) mutate();
  }, [needed, isIdle, mutate]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const selectLink = () => {
    const node = field.current;
    if (!node) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopyFailed(false);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyFailed(true);
      selectLink();
    }
  };

  return (
    <Portal>
      <Sheet label="Inviter un client" onDismiss={onClose}>
        <Text as="h2" fontWeight="800" fontSize="22px">
          Inviter un client
        </Text>
        <Text color="fg.muted">
          Envoie ce lien. La personne crée son compte et rejoint ton suivi, sans
          rien d’autre à faire.
        </Text>

        <Box
          minH="50px"
          px="16px"
          py="14px"
          borderRadius="17px"
          bg="bg.raised"
          display="flex"
          alignItems="center"
        >
          {link ? (
            <Text
              ref={field}
              fontSize="14px"
              wordBreak="break-all"
              userSelect="all"
              onClick={selectLink}
              data-invite-link
            >
              {link}
            </Text>
          ) : (
            <Text fontSize="14px" color="fg.muted" role="status">
              {generate.isError
                ? 'Le lien n’a pas pu être préparé.'
                : 'Préparation du lien…'}
            </Text>
          )}
        </Box>
        {valid && (
          <Text fontSize="sm" color="fg.muted">
            {linkExpiry(valid.expiresAt)} Le même lien sert à plusieurs clients.
          </Text>
        )}
        {copyFailed && (
          <Text fontSize="sm" color="fg.muted" role="alert">
            La copie n’a pas marché : le lien est sélectionné, copie-le à la
            main.
          </Text>
        )}

        {generate.isError && !link ? (
          <ActionButton w="full" onClick={() => generate.mutate()}>
            Réessayer
          </ActionButton>
        ) : (
          <ActionButton
            w="full"
            onClick={copy}
            disabled={!link}
            aria-live="polite"
          >
            {copied ? <LuCheck size={18} /> : <LuCopy size={18} />}
            {copied ? 'Lien copié' : 'Copier le lien'}
          </ActionButton>
        )}
        {canShare && link && (
          <ActionButton
            tone="ghost"
            size="md"
            w="full"
            onClick={() =>
              navigator
                .share({ title: 'Rejoindre mon suivi sur Kettle', url: link })
                .catch(() => undefined)
            }
          >
            <LuShare2 size={18} />
            Partager…
          </ActionButton>
        )}
      </Sheet>
    </Portal>
  );
};
