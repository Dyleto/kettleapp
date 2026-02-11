import { useGenerateInvitation } from "@/hooks/mutations/useGenerateInvitation";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Button, useClipboard } from "@chakra-ui/react";
import { useEffect } from "react";

export const InvitationBlock = () => {
  const { mutate, data, isPending } = useGenerateInvitation();
  const invitationLink = data?.link ?? "";
  const colors = useThemeColors();

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
      bg={clipboard.copied ? colors.success : colors.primary}
      color="fg.inverted"
      _hover={{
        bg: clipboard.copied ? colors.successHover : colors.primaryHover,
        transform: "translateY(-2px)",
        boxShadow: "md",
      }}
      _active={{
        bg: clipboard.copied ? colors.successActive : colors.primaryActive,
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
