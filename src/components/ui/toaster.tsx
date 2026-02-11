"use client";

import {
  Toaster as ChakraToaster,
  Spinner,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top", // <-- ON PASSE EN HAUT
  pauseOnPageIdle: true,
});

export const Toaster = () => {
  return (
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
          width={{ md: "sm" }}
          style={{
            pointerEvents: "auto",
            marginBottom: "8px",
            // On s'assure que le contenu ne dépasse jamais
            overflow: "hidden",
            // On retire l'ombre par sécurité le temps de tester
            boxShadow: "none",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* ... contenu du toast ... */}
          {/* ... */}
        </Toast.Root>
      )}
    </ChakraToaster>
  );
};
