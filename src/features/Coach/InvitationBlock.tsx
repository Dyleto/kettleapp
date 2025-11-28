import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import { Button, useClipboard } from "@chakra-ui/react";
import { useState } from "react";

const MINIMUM_LOADING_TIME_MS = 500;
const DISPLAY_COPIED_TIME_MS = 1500;

const InvitationBlock = () => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateInvitation = async () => {
    const startTime = Date.now();
    setLoading(true);
    try {
      const response = await api.post("/api/coach/generate-invitation");
      const invitationLink = `${window.location.origin}/join?token=${response.data.token}`;

      const copy = useClipboard({ value: invitationLink });
      copy.copy();

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME_MS - elapsedTime);

      setTimeout(() => {
        setLoading(false);
        setCopied(true);

        setTimeout(() => setCopied(false), DISPLAY_COPIED_TIME_MS);
      }, remainingTime);
    } catch (error) {
      console.log("Error generating invitation link:", error);
      toaster.create({
        title: "Erreur",
        description:
          "Une erreur est survenue lors de la génération du lien d'invitation.",
        type: "error",
      });
    }
  };

  return (
    <Button
      bg={copied ? "green.400" : "yellow.400"}
      color="fg.inverted"
      _hover={{
        bg: copied ? "green.500" : "yellow.500",
        transform: "translateY(-2px)",
        boxShadow: "md",
      }}
      _active={{
        bg: copied ? "green.600" : "yellow.600",
        boxShadow: "sm",
      }}
      onClick={handleGenerateInvitation}
      loading={loading}
      pointerEvents={copied ? "none" : "auto"}
      width="15em"
    >
      {copied ? "✓ Lien copié !" : "Copier le lien d'invitation"}
    </Button>
  );
};

export default InvitationBlock;
