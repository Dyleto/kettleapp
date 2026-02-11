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
  placement: "bottom", // On laisse Chakra gérer, on va surcharger le CSS
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
          // CENTRAGE TOTAL
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center", // Vertical Center
          justifyContent: "center", // Horizontal Center
        }}
      >
        {(toast) => (
          <Toast.Root
            width={{ base: "90vw", md: "sm" }}
            style={{ pointerEvents: "auto" }}
            // ON LAISSE LES COULEURS PAR DEFAUT DE CHAKRA (background coloré)
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
    </Portal>
  );
};
