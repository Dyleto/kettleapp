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
  placement: "top",
  pauseOnPageIdle: true,
  // On laisse Chakra gérer les offsets de base, mais on va forcer le style conteneur
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
          // C'EST ICI QUE TOUT SE JOUE :
          top: "0",
          left: "0",
          right: "0",
          // On ajoute un padding physique pour que le contenu ne touche pas la barre d'état
          paddingTop: "calc(env(safe-area-inset-top) + 16px)",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {(toast) => (
          <Toast.Root
            width={{ base: "90vw", md: "sm" }}
            style={{
              pointerEvents: "auto",
              marginBottom: "8px",
            }}
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
