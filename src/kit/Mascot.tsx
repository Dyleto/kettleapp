import type { ReactElement } from 'react';
import { Box } from '@chakra-ui/react';

/** Ce que le personnage exprime : il accueille, annonce, fête, attend,
 * s'excuse. */
export type MascotMood = 'hello' | 'effort' | 'bravo' | 'sleep' | 'oops';

interface MascotProps {
  mood?: MascotMood;
  /** La hauteur et la largeur de la boîte, en pixels. */
  size?: number;
}

/** Les deux yeux ouverts. Ils sont groupés pour cligner ensemble : animés un
 * par un, ils se désynchronisaient d'une image sur les appareils lents. */
const OpenEyes = ({ y }: { y: number }) => (
  <g className="mascot-eyes" fill="var(--mascot-ink)">
    <circle cx="40" cy={y} r="4.2" />
    <circle cx="60" cy={y} r="4.2" />
  </g>
);

/** Un trait du visage : bouche, sourcils, yeux fermés. */
const Line = ({ d }: { d: string }) => (
  <path
    d={d}
    fill="none"
    stroke="var(--mascot-ink)"
    strokeWidth="3.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

/**
 * Le visage de chaque humeur.
 *
 * Seuls les traits changent : le corps reste le même, pour que ce soit le
 * même personnage qui passe d'une humeur à l'autre et non cinq mascottes.
 */
const FACES: Record<MascotMood, ReactElement> = {
  hello: (
    <>
      <OpenEyes y={63} />
      <Line d="M41 75q9 8 18 0" />
    </>
  ),
  effort: (
    <>
      <OpenEyes y={64} />
      <Line d="M32 55l11 3M68 55l-11 3M43 78h14" />
    </>
  ),
  bravo: (
    <>
      <Line d="M35 64q5 -6 10 0M55 64q5 -6 10 0" />
      <path d="M39 72q11 14 22 0z" fill="var(--mascot-ink)" />
      <path
        d="M12 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM88 22l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"
        fill="var(--mascot-spark)"
      />
    </>
  ),
  sleep: (
    <>
      <Line d="M35 64q5 4 10 0M55 64q5 4 10 0" />
      <circle
        cx="50"
        cy="77"
        r="3"
        fill="none"
        stroke="var(--mascot-ink)"
        strokeWidth="3"
      />
      <path
        d="M74 26h9l-9 10h9M88 10h6l-6 7h6"
        fill="none"
        stroke="var(--mascot-quiet)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  oops: (
    <>
      <OpenEyes y={63} />
      <Line d="M36 54l8 -3M64 54l-8 -3M41 79q4.5 -5 9 0t9 0" />
    </>
  ),
};

/**
 * Le personnage de Kettle : une kettlebell qui a un visage.
 *
 * Un écran vide ou une panne se lisaient comme une erreur de l'application —
 * un cadre gris, une phrase. Le personnage dit autre chose : quelqu'un
 * attend avec toi, ou s'excuse. Il n'apparaît jamais pendant l'effort ni dans
 * l'atelier du coach, où il n'y a rien à dire de cet ordre.
 *
 * Il est décoratif et s'efface des lecteurs d'écran : le titre placé à côté
 * de lui dit déjà tout ce qu'il mime. Lui donner un nom ferait annoncer
 * « personnage endormi » avant « Ton programme arrive », soit la même
 * information deux fois, la moins utile en premier.
 *
 * Les animations se coupent quand l'appareil demande moins de mouvement.
 */
export const Mascot = ({ mood = 'hello', size = 128 }: MascotProps) => (
  <Box
    as="span"
    display="inline-flex"
    flexShrink={0}
    color="app.primary"
    data-mascot={mood}
    aria-hidden
    css={{
      '--mascot-ink': 'colors.bg.canvas',
      '--mascot-spark': 'colors.app.primary.fg',
      '--mascot-quiet': 'colors.fg.muted',
      '& svg': {
        // Le balancement pivote autour du bas du corps : autour du centre,
        // la kettlebell roulerait sur elle-même au lieu de se dandiner.
        transformOrigin: '50% 88%',
        animation: 'mascotSway 5.5s ease-in-out infinite',
      },
      '& .mascot-eyes': {
        transformBox: 'fill-box',
        transformOrigin: 'center',
        animation: 'mascotBlink 4s linear infinite',
      },
      '@media (prefers-reduced-motion: reduce)': {
        '& svg, & .mascot-eyes': { animation: 'none' },
      },
    }}
  >
    <svg width={size} height={size} viewBox="0 0 100 104" focusable="false">
      <path
        d="M31 46C25 12 75 12 69 46"
        fill="none"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <circle cx="50" cy="67" r="34" fill="currentColor" />
      <path
        d="M24 60a27 27 0 0 1 13 -19"
        fill="none"
        stroke="rgba(255,255,255,.38)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {FACES[mood]}
    </svg>
  </Box>
);
