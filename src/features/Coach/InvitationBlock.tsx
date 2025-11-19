import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import { Box, Button, Heading, useClipboard } from "@chakra-ui/react";
import { useState } from "react";

const InvitationBlock = () => {
  const [invitationLink, setInvitationLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateInvitation = async () => {
    setLoading(true);
    try {
      const response = await api.post("/api/coach/generate-invitation");
      const invitationLink = `${window.location.origin}/join?token=${response.data.token}`;

      navigator.clipboard.writeText(invitationLink);

      setCopied(true);

      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.log("Error generating invitation link:", error);
      toaster.create({
        title: "Erreur",
        description:
          "Une erreur est survenue lors de la génération du lien d'invitation.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box w="100%">
      <Button
        colorPalette={copied ? "green" : "yellow"}
        onClick={handleGenerateInvitation}
        loading={loading}
        pointerEvents={copied ? "none" : "auto"}
      >
        {copied ? "✓ Copié !" : "Copier un lien d'invitation"}
      </Button>
    </Box>
  );
};

export default InvitationBlock;
