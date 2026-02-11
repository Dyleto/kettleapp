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
  placement: "bottom", // Retour en bas, c'est moins risqué pour la status bar
  pauseOnPageIdle: true,
});

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster
        toaster={toaster}
        insetInline={{ mdDown: "4" }}
        style={{
          position: "fixed",
          zIndex: 9999,
          bottom: "20px",
          left: "20px",
          right: "20px",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          // Marge de sécurité pour la barre du bas iPhone
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {(toast) => (
          <Toast.Root
            width={{ base: "100%", md: "sm" }}
            style={{ pointerEvents: "auto", marginBottom: "8px" }}
            // FOND NEUTRE (Gris) + BORDURE COLOREE
            // C'est la clé pour éviter que Safari ne voie du "VERT" partout
            bg="#27272a"
            borderLeftWidth="4px"
            borderLeftColor={
              toast.type === "error"
                ? "#ef4444"
                : toast.type === "success"
                  ? "#22c55e"
                  : "#3b82f6"
            }
            shadow="lg"
            rounded="md"
            p={4}
          >
            {/* Contenu standard... */}
            {toast.type === "loading" ? (
              <Spinner size="sm" color="blue.500" />
            ) : // On peut cacher l'indicateur coloré si on veut être ultra-safe
            // <Toast.Indicator />
            null}
            <Stack gap="1">
              {toast.title && (
                <Toast.Title fontWeight="bold" color="white">
                  {toast.title}
                </Toast.Title>
              )}
              {toast.description && (
                <Toast.Description color="gray.300">
                  {toast.description}
                </Toast.Description>
              )}
            </Stack>
            {toast.closable && <Toast.CloseTrigger color="gray.400" />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};
