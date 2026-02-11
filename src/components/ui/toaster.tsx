"use client";

import {
  Toaster as ChakraToaster,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top", // On simplifie pour éviter les coins compliqués
  pauseOnPageIdle: true,
});

export const Toaster = () => {
  return (
    // SUPPRESSION DU <PORTAL> ICI
    // On garde le ChakraToaster mais on force son style
    <ChakraToaster
      toaster={toaster}
      insetInline={{ mdDown: "4" }}
      style={{
        position: "fixed",
        zIndex: 9999,
        top: "20px", // Marge du haut
        left: "20px",
        right: "20px",
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // Centrer horizontalement
      }}
    >
      {(toast) => (
        <Toast.Root
          width="auto" // On veut que la largeur s'adapte au contenu
          minW="300px" // Largeur min raisonnable
          maxW="90vw" // Max largeur (pas 100% pour laisser des marges)
          bg="bg.panel" // FORCEZ UNE COULEUR NEUTRE (Gris/Noir)
          color="fg" // Texte blanc
          borderRadius="md" // Coins arrondis
          p={4} // Padding interne
          shadow="lg" // Ombre
          borderLeftWidth="4px" // Juste une bordure colorée à gauche pour le status
          borderLeftColor={
            toast.type === "error"
              ? "red.500"
              : toast.type === "success"
                ? "green.500"
                : "blue.500"
          }
          style={{
            pointerEvents: "auto",
            margin: "0 auto 8px auto", // Centrer
            position: "relative", // Évite les bugs de layout
          }}
        >
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
