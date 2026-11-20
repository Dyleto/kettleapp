import { chakra } from '@chakra-ui/react';

const SIZE = {
  sm: { w: 96, h: 34, stroke: 3, dot: 4.5, pad: 5 },
  lg: { w: 350, h: 130, stroke: 4, dot: 7, pad: 14 },
} as const;

/**
 * Une courbe de charges : un point par passage, le dernier marqué.
 *
 * Elle remplace « 20 → 24 → 26 kg » : une suite de nombres qu'il fallait
 * lire, puis comparer de tête. La pente se voit, et la maquette la colore
 * — sarcelle quand la charge monte ou tient, bleu quand elle baisse, sans
 * jugement. La petite tient sur une ligne de « Tes mouvements », la grande
 * ouvre la feuille d'un mouvement, avec l'aire dessous.
 *
 * Muette pour un lecteur d'écran : la ligne qui la porte dit la dernière
 * charge et l'écart en mots.
 *
 * Toutes les valeurs égales tracent une ligne au milieu, pas au sol : une
 * charge tenue n'est pas une charge nulle.
 */
export const Curve = ({
  values,
  size = 'sm',
  falling = false,
}: {
  values: readonly number[];
  size?: 'sm' | 'lg';
  falling?: boolean;
}) => {
  const { w, h, stroke, dot, pad } = SIZE[size];
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const dx = (w - pad * 2) / (values.length - 1);
  const y = (v: number) =>
    max === min ? h / 2 : h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const points = values.map((v, i) => [pad + i * dx, y(v)] as const);
  const line = points.map(([px, py]) => `${px},${py}`).join(' ');
  const [lastX, lastY] = points[points.length - 1];
  return (
    <chakra.svg
      viewBox={`0 0 ${w} ${h}`}
      width={size === 'sm' ? `${w}px` : '100%'}
      height={size === 'sm' ? `${h}px` : 'auto'}
      flexShrink={0}
      color={falling ? 'effort.easy' : 'session.rest'}
      aria-hidden
      data-curve={falling ? 'down' : 'up'}
    >
      {size === 'lg' && (
        <polygon
          points={`${line} ${lastX},${h} ${pad},${h}`}
          fill="currentColor"
          fillOpacity={0.12}
        />
      )}
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {size === 'lg' &&
        points
          .slice(0, -1)
          .map(([px, py], i) => (
            <circle key={i} cx={px} cy={py} r={dot - 2} fill="currentColor" />
          ))}
      <circle cx={lastX} cy={lastY} r={dot} fill="currentColor" />
    </chakra.svg>
  );
};
