import { toaster } from "@/components/ui/toaster";
import api from "@/config/api";
import { Button, Clipboard, Skeleton, useClipboard } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const InvitationBlock = () => {
  const [loading, setLoading] = useState(true);
  const [invitationLink, setInvitationLink] = useState("");
  const clipboard = useClipboard({ value: invitationLink, timeout: 1500 });

  const fetchInvitationLink = async () => {
    setLoading(true);
    try {
      const response = await api.post("/api/coach/generate-invitation");
      const link = `${window.location.origin}/join?token=${response.data.token}`;
      setInvitationLink(link);
    } catch (error) {
      console.log("Error fetching invitation link:", error);
      toaster.create({
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération du lien.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitationLink();
  }, []);

  useEffect(() => {
    clipboard.setValue(invitationLink);
  }, [invitationLink]);

  if (loading || !invitationLink) {
    return <Skeleton height="40px" width="15em" />;
  }

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
      onClick={clipboard.copy}
    >
      {clipboard.copied ? "✓ Lien copié !" : "Copier le lien d'invitation"}
    </Button>
  );
};

export default InvitationBlock;
