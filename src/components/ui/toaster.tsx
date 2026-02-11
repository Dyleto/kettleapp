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
  placement: "bottom-end",
  pauseOnPageIdle: true,
});

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster
        toaster={toaster}
        insetInline={{ mdDown: "0" }} // On reset les insets auto qui peuvent gêner
        // CONTENEUR PLEIN ECRAN
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={9999}
        pointerEvents="none"
        // FLEXBOX MAGIQUE
        display="flex"
        flexDirection="column" // Les toasts s'empilent verticalement
        justifyContent="flex-end" // On pousse tout vers le BAS
        // ALIGNEMENT HORIZONTAL RESPONSIVE
        // Mobile (base) = Au centre
        // Desktop (md) = À droite (flex-end)
        alignItems={{ base: "center", md: "flex-end" }}
        // MARGES RESPONSIVES (Pour ne pas coller aux bords)
        padding={{ base: "0 0 20px 0", md: "0 20px 20px 0" }}
      >
        {(toast) => (
          <Toast.Root
            // Largeur responsive
            width={{ base: "90vw", md: "sm" }}
            style={{ pointerEvents: "auto", marginBottom: "8px" }}
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
