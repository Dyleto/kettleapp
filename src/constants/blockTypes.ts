import { BlockType, SessionBlock } from "@/types";

export const BLOCK_TYPE_CONFIG: Record<
  BlockType,
  { label: string; color: string }
> = {
  warmup:  { label: "Échauffement", color: "#f97316" },
  emom:    { label: "EMOM",         color: "#3b82f6" },
  every:   { label: "Every",        color: "#6366f1" },
  amrap:   { label: "AMRAP",        color: "#ef4444" },
  timecap: { label: "TimeCap",      color: "#eab308" },
  chipper: { label: "Chipper",      color: "#22c55e" },
  classic: { label: "Classique",    color: "#94a3b8" },
  tabata:  { label: "Tabata",       color: "#ec4899" },
  onoff:   { label: "On / Off",     color: "#14b8a6" },
  pyramid: { label: "Pyramide",     color: "#a855f7" },
  ladder:  { label: "Échelle",      color: "#8b5cf6" },
};

export const BLOCK_TYPES_ORDERED: BlockType[] = [
  "warmup", "classic", "emom", "every",
  "amrap", "timecap", "chipper",
  "tabata", "onoff", "pyramid", "ladder",
];

export const blockSupportsSets = (type: BlockType): boolean =>
  type === "classic" || type === "warmup";

export const getBlockColor = (type: BlockType): string =>
  BLOCK_TYPE_CONFIG[type]?.color ?? "#94a3b8";

export const getBlockLabel = (type: BlockType): string =>
  BLOCK_TYPE_CONFIG[type]?.label ?? type;

export const getBlockConfigSummary = (block: SessionBlock): string => {
  switch (block.type) {
    case "emom":
      return block.durationMinutes ? `${block.durationMinutes} min` : "";
    case "amrap":
      return block.durationMinutes ? `${block.durationMinutes} min` : "";
    case "timecap":
      return block.durationMinutes ? `${block.durationMinutes} min max` : "";
    case "every":
      return [
        block.intervalMinutes && `${block.intervalMinutes}min`,
        block.rounds && `× ${block.rounds}`,
      ]
        .filter(Boolean)
        .join(" ");
    case "tabata":
    case "onoff":
      return [
        block.rounds && `${block.rounds}×`,
        block.workDuration !== undefined && `${block.workDuration}s`,
        block.restDuration !== undefined && `/ ${block.restDuration}s`,
      ]
        .filter((v) => v !== false && v !== undefined)
        .join(" ");
    case "pyramid":
    case "ladder":
      return block.repsScheme?.join("-") ?? "";
    default:
      return "";
  }
};

export const getExerciseTypeForBlock = (
  blockType: BlockType,
): "warmup" | "workout" =>
  blockType === "warmup" ? "warmup" : "workout";
