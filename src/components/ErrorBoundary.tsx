import { Component, ErrorInfo, ReactNode } from "react";
import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { toaster } from "./ui/toaster";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);

    toaster.create({
      title: "Une erreur est survenue",
      description:
        "Impossible de charger la ressource. Vérifiez votre connexion.",
      type: "error",
      duration: 5000,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          height="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          p={4}
        >
          <VStack gap={6}>
            <Heading size="xl">Oups ! Quelque chose s'est cassé.</Heading>
            <Text color="fg.muted" maxW="md">
              Une erreur inattendue s'est produite (peut-être un problème de
              connexion internet qui a empêché le chargement de la page).
            </Text>
            <Button onClick={this.handleReload} colorPalette="teal" size="lg">
              Recharger la page
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
