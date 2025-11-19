import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { Button, Icon } from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";

interface GoogleLoginButtonProps {
  text?: string;
  invitationToken?: string;
}

const GoogleLoginButton = ({
  text = "Se connecter avec Google",
  invitationToken,
}: GoogleLoginButtonProps) => {
  const { loginWithGoogle } = useGoogleOAuth();

  return (
    <Button
      w="100%"
      h="14"
      fontSize="md"
      fontWeight="600"
      bg="white"
      color="gray.800"
      border="2px solid"
      borderColor="gray.200"
      onClick={() => loginWithGoogle(invitationToken)}
      _hover={{
        bg: "gray.50",
        borderColor: "gray.300",
        shadow: "md",
        transform: "translateY(-2px)",
        transition: "all 0.3s ease",
      }}
      _active={{
        transform: "translateY(0px)",
      }}
      borderRadius="xl"
      transition="all 0.3s ease"
      boxShadow="sm"
    >
      <Icon as={FcGoogle} boxSize="6" /> {text}
    </Button>
  );
};

export default GoogleLoginButton;
