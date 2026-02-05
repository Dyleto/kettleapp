import { useTheme } from "@/contexts/ThemeContext";

export interface ThemeColors {
  // Couleur principale (exercices)
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryBg: string;
  primaryBorder: string;
  primaryHex: string;

  // Couleur secondaire (échauffements)
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  secondaryBg: string;
  secondaryBorder: string;
  secondaryHex: string;

  // Backgrounds spécifiques
  warmupBg: string;
  workoutBg: string;

  // États
  success: string;
  successHover: string;
  successActive: string;
  error: string;
}

const themeColors: Record<"yellow" | "blue", ThemeColors> = {
  yellow: {
    primary: "yellow.400",
    primaryHover: "yellow.300",
    primaryActive: "yellow.500",
    primaryBg: "yellow.400/10",
    primaryBorder: "yellow.400/30",
    primaryHex: "#fbbf24",

    secondary: "orange.400",
    secondaryHover: "orange.300",
    secondaryActive: "orange.500",
    secondaryBg: "orange.400/10",
    secondaryBorder: "orange.400/30",
    secondaryHex: "#fb923c",

    warmupBg: "orange.900/20",
    workoutBg: "yellow.900/20",

    success: "green.400",
    successHover: "green.500",
    successActive: "green.600",
    error: "red.400",
  },
  blue: {
    primary: "blue.500",
    primaryHover: "blue.400",
    primaryActive: "blue.600",
    primaryBg: "blue.500/10",
    primaryBorder: "blue.500/30",
    primaryHex: "#3b82f6",

    secondary: "green.400",
    secondaryHover: "green.300",
    secondaryActive: "green.500",
    secondaryBg: "green.400/10",
    secondaryBorder: "green.400/30",
    secondaryHex: "#4ade80",

    warmupBg: "green.900/20",
    workoutBg: "blue.900/20",

    success: "green.400",
    successHover: "green.500",
    successActive: "green.600",
    error: "red.400",
  },
};

export const useThemeColors = (): ThemeColors => {
  const { theme } = useTheme();
  return themeColors[theme];
};
