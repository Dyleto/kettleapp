import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import { useGenerateInvitation } from "@/hooks/mutations/useGenerateInvitation";
import { useMinimumLoading } from "@/hooks/useMinimumLoading";
import { Button, Skeleton, useClipboard } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const InvitationBlock = () => {
  const { mutate, data, isPending } = useGenerateInvitation();
  const invitationLink = data?.link ?? "";

  const clipboard = useClipboard({
    value: invitationLink,
    timeout: 1500,
  });

  // Copier automatiquement quand le lien est généré
  useEffect(() => {
    if (invitationLink) {
      clipboard.copy();
    }
  }, [invitationLink]);

  const handleClick = () => {
    mutate(); // ✅ Génère un nouveau lien à chaque clic
  };

  return (
    <Button
      bg={clipboard.copied ? "green.400" : "yellow.400"}
      color="fg.inverted"
      _hover={{
        bg: clipboard.copied ? "green.500" : "yellow.500",
        transform: "translateY(-2px)",
        boxShadow: "md",
      }}
      _active={{
        bg: clipboard.copied ? "green.600" : "yellow.600",
        boxShadow: "sm",
      }}
      pointerEvents={clipboard.copied ? "none" : "auto"}
      width="15em"
      onClick={handleClick}
      loading={isPending}
    >
      {clipboard.copied ? "✓ Lien copié !" : "Copier le lien d'invitation"}
    </Button>
  );
};

export default InvitationBlock;
