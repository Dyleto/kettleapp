"use client";

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top", // Plus safe que bottom sur iOS
  pauseOnPageIdle: true,
  offsets: { top: "16px", right: "16px", left: "16px" }, // Marges explicites
});

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster
        toaster={toaster}
        insetInline={{ mdDown: "4" }}
        // Force le conteneur à être "au dessus de tout" sans bloquer les clics inutiles
        style={{
          zIndex: 2147483647, // Max Z-Index
          pointerEvents: "none", // Laisse passer les clics à travers le vide
          // Hack pour forcer Safari à traiter ce calque séparément (GPU)
          transform: "translate3d(0,0,0)",
          WebkitTransform: "translate3d(0,0,0)",
        }}
      >
        {(toast) => (
          <Toast.Root
            width={{ base: "90vw", md: "sm" }} // Largeur explicite sur mobile
            style={{
              pointerEvents: "auto", // Rétablit les clics sur le toast
              margin: "0 auto 8px auto", // Centre horizontalement
            }}
            // Styles visuels défensifs (Opaque pour masquer ce qu'il y a derrière)
            bg="bg.panel"
            shadow="lg"
            rounded="md"
            borderLeftWidth="4px"
            borderLeftColor={
              toast.type === "error"
                ? "red.500"
                : toast.type === "success"
                  ? "green.500"
                  : toast.type === "info"
                    ? "blue.500"
                    : "gray.500"
            }
          >
            {toast.type === "loading" ? (
              <Spinner size="sm" color="blue.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="1" flex="1" maxWidth="100%">
              {toast.title && (
                <Toast.Title fontWeight="bold">{toast.title}</Toast.Title>
              )}
              {toast.description && (
                <Toast.Description>{toast.description}</Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};
