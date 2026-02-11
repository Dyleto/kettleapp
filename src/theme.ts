import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        // Couleurs principales
        "app.primary": { value: "{colors.yellow.400}" },
        "app.primary.hover": { value: "{colors.yellow.300}" },
        "app.primary.active": { value: "{colors.yellow.500}" },
        "app.primary.bg": { value: "{colors.yellow.400/10}" },
        "app.primary.border": { value: "{colors.yellow.400/30}" },

        // Couleurs secondaires (échauffements)
        "app.secondary": { value: "{colors.orange.400}" },
        "app.secondary.hover": { value: "{colors.orange.300}" },
        "app.secondary.active": { value: "{colors.orange.500}" },
        "app.secondary.bg": { value: "{colors.orange.400/10}" },
        "app.secondary.border": { value: "{colors.orange.400/30}" },

        // États
        "app.success": { value: "{colors.green.400}" },
        "app.success.hover": { value: "{colors.green.500}" },
        "app.success.active": { value: "{colors.green.600}" },

        "app.error": { value: "{colors.red.400}" },

        // Backgrounds spécifiques
        "app.warmup.bg": { value: "{colors.orange.900/20}" },
        "app.workout.bg": { value: "{colors.yellow.900/20}" },
      },
    },
    tokens: {
      colors: {
        brand: {
          50: { value: "#fffbeb" },
          100: { value: "#fef3c7" },
          200: { value: "#fde68a" },
          300: { value: "#fcd34d" },
          400: { value: "#fbbf24" },
          500: { value: "#f59e0b" },
          600: { value: "#d97706" },
          700: { value: "#b45309" },
          800: { value: "#92400e" },
          900: { value: "#78350f" },
          950: { value: "#451a03" },
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      height: "100%",
      width: "100%",
      margin: 0,
      padding: 0,
      backgroundColor: "bg.muted", // Utilise le token du thème
      color: "fg",

      // FIX MOBILE SAFARI :
      overflowX: "hidden",
      overscrollBehaviorY: "none", // Le plus important contre le bug vert
      WebkitTapHighlightColor: "transparent",
      WebkitTouchCallout: "none", // Optionnel : empêche le menu contextuel au long press
    },
    "#root": {
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      isolation: "isolate", // Crée un nouveau contexte d'empilement (utile pour les z-index)
    },
    "input, textarea, select": {
      fontSize: "16px !important", // Empêche le zoom auto sur iOS
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
