"use client";

import {
  Toaster as ChakraToaster,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "bottom", // On simplifie pour éviter les coins compliqués
  pauseOnPageIdle: true,
});

export const Toaster = () => {
  return (
    // SUPPRESSION DU <PORTAL> ICI
    // On garde le ChakraToaster mais on force son style
    <ChakraToaster
      toaster={toaster}
      insetInline={{ mdDown: "4" }}
      // On force le conteneur à être transparent et non-bloquant
      style={{
        position: "fixed",
        zIndex: 9999,
        bottom: "20px",
        left: "20px",
        right: "20px",
        pointerEvents: "none", // Laisser passer les clics à travers le vide
        background: "transparent", // C'est crucial
      }}
    >
      {(toast) => (
        <Toast.Root
          width={{ md: "sm" }}
          shadow="md"
          // On réactive les clics sur le toast lui-même
          style={{ pointerEvents: "auto" }}
        >
          {toast.type === "loading" ? (
            <Spinner size="sm" color="blue.solid" />
          ) : (
            <Toast.Indicator />
          )}
          <Stack gap="1" flex="1" maxWidth="100%">
            {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
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
  );
};
