import { SessionMetrics } from "@/types";
import { useThemeColors } from "@/hooks/useThemeColors";
import { MetricStars } from "./MetricStars";
import {
  Box,
  Button,
  Dialog,
  Separator,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { ReactNode, useState } from "react";
import {
  LuBicepsFlexed,
  LuBrain,
  LuFlame,
  LuMoon,
  LuSmile,
  LuTrendingUp,
  LuZap,
} from "react-icons/lu";

interface CompleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (metrics: SessionMetrics, notes: string) => void;
  isLoading?: boolean;
}

const DEFAULT_METRICS: SessionMetrics = {
  stress: 3,
  mood: 3,
  energy: 3,
  sleep: 3,
  soreness: 3,
};

export const CompleteSessionModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CompleteSessionModalProps) => {
  const colors = useThemeColors();
  const [metrics, setMetrics] = useState<SessionMetrics>(DEFAULT_METRICS);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [avgScore, setAvgScore] = useState(0);

  const METRICS_CONFIG: {
    key: keyof SessionMetrics;
    icon: ReactNode;
    label: string;
  }[] = [
    {
      key: "stress",
      icon: <LuBrain size={16} color={colors.primaryHex} />,
      label: "Stress",
    },
    {
      key: "mood",
      icon: <LuSmile size={16} color={colors.primaryHex} />,
      label: "Humeur",
    },
    {
      key: "energy",
      icon: <LuZap size={16} color={colors.primaryHex} />,
      label: "Énergie",
    },
    {
      key: "sleep",
      icon: <LuMoon size={16} color={colors.primaryHex} />,
      label: "Sommeil",
    },
    {
      key: "soreness",
      icon: <LuBicepsFlexed size={16} color={colors.primaryHex} />,
      label: "Courbatures",
    },
  ];

  const handleSubmit = () => {
    const avg = Object.values(metrics).reduce((a, b) => a + b, 0) / 5;
    setAvgScore(avg);
    onSubmit(metrics, notes);
    setSubmitted(true);
  };

  const handleClose = () => {
    setMetrics(DEFAULT_METRICS);
    setNotes("");
    setSubmitted(false);
    setAvgScore(0);
    onClose();
  };

  const feedbackMessage =
    avgScore >= 4
      ? {
          icon: <LuFlame size={48} color={colors.primaryHex} />,
          text: "Excellente séance !",
        }
      : avgScore >= 3
        ? {
            icon: <LuTrendingUp size={48} color={colors.primaryHex} />,
            text: "Bonne séance, tu avances bien.",
          }
        : {
            icon: <LuMoon size={48} color={colors.primaryHex} />,
            text: "Séance complétée, repose-toi bien.",
          };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          bg="gray.900"
          borderColor="whiteAlpha.100"
          borderWidth="1px"
        >
          <Dialog.Header>
            <VStack align="start" gap={1}>
              <Dialog.Title>Comment s'est passée la séance ?</Dialog.Title>
              <Text fontSize="sm" color="gray.400" fontWeight="normal">
                Note ton ressenti pour que ton coach puisse adapter le
                programme.
              </Text>
            </VStack>
          </Dialog.Header>
          <Dialog.CloseTrigger />

          <Dialog.Body>
            <VStack gap={4} align="stretch">
              <VStack gap={3} align="stretch">
                {METRICS_CONFIG.map(({ key, icon, label }) => (
                  <MetricStars
                    key={key}
                    icon={icon}
                    label={label}
                    value={metrics[key]}
                    onChange={(val) =>
                      setMetrics((prev) => ({ ...prev, [key]: val }))
                    }
                  />
                ))}
              </VStack>

              <Separator borderColor="whiteAlpha.100" />

              <Box>
                <Text fontSize="sm" color="gray.400" mb={2}>
                  Commentaire (facultatif)
                </Text>
                <Textarea
                  placeholder="Ex : bonne séance, un peu difficile sur les derniers rounds..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  size="sm"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  _focus={{ borderColor: colors.primaryBorder }}
                  resize="none"
                  rows={3}
                />
              </Box>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer gap={3}>
            <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button
              bg={colors.primary}
              color="gray.900"
              fontWeight="bold"
              onClick={handleSubmit}
              loading={isLoading}
            >
              Valider
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
