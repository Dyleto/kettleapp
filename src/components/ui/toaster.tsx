"use client";

import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";
import { useEffect } from "react";

export const toaster = createToaster({
  placement: "top",
  pauseOnPageIdle: true,
});

export const Toaster = () => {
  // HACK SAFARI : On force la couleur de la barre d'adresse à rester noire
  // même si un élément coloré apparaît en dessous.
  useEffect(() => {
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((m) => m.setAttribute("content", "#18181b"));
  });

  return (
    <Portal>
      <ChakraToaster
        toaster={toaster}
        insetInline={{ mdDown: "4" }}
        style={{
          position: "fixed",
          zIndex: 9999,
          // Placement sécurisé sous l'encoche
          top: "0",
          left: "0",
          right: "0",
          paddingTop: "calc(env(safe-area-inset-top) + 12px)",

          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",

          // ISOLEMENT DU RENDU (Empêche Safari de "boire" la couleur)
          contain: "paint layout",
          transform: "translateZ(0)", // Force GPU
        }}
      >
        {(toast) => (
          <Toast.Root
            width={{ base: "90vw", md: "sm" }}
            style={{
              pointerEvents: "auto",
              marginBottom: "8px",
            }}
            // On reste sur un fond neutre + bordure colorée (plus prudent)
            bg="bg.panel"
            shadow="xl" // Ombre forte pour bien séparer du fond
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
