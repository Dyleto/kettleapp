import { useThemeColors } from "@/hooks/useThemeColors";
import { ReactNode } from "react";

interface RadarChartProps {
  values: number[];
  labels: ReactNode[];
  labelTexts?: string[];
  size?: number;
}

const toRad = (deg: number) => (deg * Math.PI) / 180;

const getPoint = (angle: number, radius: number, cx: number, cy: number) => ({
  x: cx + radius * Math.sin(toRad(angle)),
  y: cy - radius * Math.cos(toRad(angle)),
});

const pointsToPath = (pts: { x: number; y: number }[]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

export const RadarChart = ({
  values,
  labels,
  labelTexts,
  size = 160,
}: RadarChartProps) => {
  const colors = useThemeColors();
  const maxRadius = size * 0.35;
  const labelRadius = size * 0.52;
  const levels = 5;
  const sides = 5;
  const angleStep = 360 / sides;
  const padding = 8;
  const margin = 24;
  const svgSize = size + margin * 2;
  const cx = svgSize / 2;
  const cy = svgSize / 2 + 5;

  const gridLevels = Array.from({ length: levels }, (_, i) => {
    const r = (maxRadius * (i + 1)) / levels;
    const pts = Array.from({ length: sides }, (_, j) =>
      getPoint(j * angleStep, r, cx, cy),
    );
    return pointsToPath(pts);
  });

  const axes = Array.from({ length: sides }, (_, i) =>
    getPoint(i * angleStep, maxRadius, cx, cy),
  );

  const dataPoints = values.map((v, i) => {
    const r = (Math.max(0, Math.min(5, v)) / 5) * maxRadius;
    return getPoint(i * angleStep, r, cx, cy);
  });

  const labelPoints = labels.map((_, i) => {
    const isBottom = i === 2 || i === 3;
    const isTop = i === 0;
    const r = isBottom
      ? labelRadius * 0.88
      : isTop
        ? labelRadius * 1.1
        : labelRadius;
    return getPoint(i * angleStep, r, cx, cy);
  });

  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
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
          r={4}
          fill={colors.primaryHex}
          opacity={0.9}
        />
      ))}

      {/* Icônes labels */}
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
              color: "rgba(255,255,255,0.5)",
              overflow: "visible",
              whiteSpace: "nowrap",
            }}
          >
            {labels[i]}
          </div>
        </foreignObject>
      ))}

      {/* Textes labels */}
      {labelTexts &&
        labelPoints.map((pt, i) => {
          const angle = i * angleStep;
          const isBottom = angle > 90 && angle < 270;
          return (
            <text
              key={i}
              x={pt.x}
              y={isBottom ? pt.y - 4 : pt.y + 16}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(255,255,255,0.6)"
              fontWeight="600"
            >
              {labelTexts[i]}
            </text>
          );
        })}
    </svg>
  );
};
