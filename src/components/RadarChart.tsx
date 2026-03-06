import { useThemeColors } from "@/hooks/useThemeColors";
import { ReactNode } from "react";

interface RadarChartProps {
  values: number[]; // 5 valeurs entre 1 et 5
  labels: ReactNode[];
  size?: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

// Pentagone : 5 sommets à partir du haut, sens horaire
const getPoint = (angle: number, radius: number, cx: number, cy: number) => ({
  x: cx + radius * Math.sin(toRad(angle)),
  y: cy - radius * Math.cos(toRad(angle)),
});

const pointsToPath = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

export const RadarChart = ({ values, labels, size = 160 }: RadarChartProps) => {
  const colors = useThemeColors();
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.35;
  const labelRadius = size * 0.48;
  const levels = 5;
  const sides = 5;
  const angleStep = 360 / sides;
  const padding = 8;

  // Grille : 5 pentagones concentriques
  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const r = (maxRadius * (i + 1)) / levels;
    const pts = Array.from({ length: sides }, (_, j) =>
      getPoint(j * angleStep, r, cx, cy),
    );
    return pointsToPath(pts);
  });

  // Axes (lignes du centre vers chaque sommet)
  const axes = Array.from({ length: sides }, (_, i) =>
    getPoint(i * angleStep, maxRadius, cx, cy),
  );

  // Zone de données
  const dataPoints = values.map((v, i) => {
    const r = (Math.max(0, Math.min(5, v)) / 5) * maxRadius;
    return getPoint(i * angleStep, r, cx, cy);
  });

  // Labels
  const labelPoints = labels.map((_, i) =>
    getPoint(i * angleStep, labelRadius, cx, cy),
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-padding} ${-padding} ${size + padding * 2} ${size + padding * 2}`}
    >
      {/* Grille */}
      {gridLevels.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="white"
          strokeOpacity={i === levels - 1 ? 0.15 : 0.06}
          strokeWidth={i === levels - 1 ? 1 : 0.5}
        />
      ))}

      {/* Axes */}
      {axes.map((pt, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={pt.x}
          y2={pt.y}
          stroke="white"
          strokeOpacity={0.08}
          strokeWidth={0.5}
        />
      ))}

      {/* Zone données — remplissage */}
      <path
        d={pointsToPath(dataPoints)}
        fill={colors.primaryHex}
        fillOpacity={0.25}
      />

      {/* Zone données — contour */}
      <path
        d={pointsToPath(dataPoints)}
        fill="none"
        stroke={colors.primaryHex}
        strokeWidth={1.5}
        strokeOpacity={0.9}
      />

      {/* Points aux sommets */}
      {dataPoints.map((pt, i) => (
        <circle
          key={i}
          cx={pt.x}
          cy={pt.y}
          r={2.5}
          fill={colors.primaryHex}
          opacity={0.9}
        />
      ))}

      {/* Labels */}
      {labelPoints.map((pt, i) => (
        <foreignObject
          key={i}
          x={pt.x - 8}
          y={pt.y - 8}
          width={16}
          height={16}
          style={{ overflow: "visible" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {labels[i]}
          </div>
        </foreignObject>
      ))}
    </svg>
  );
};
